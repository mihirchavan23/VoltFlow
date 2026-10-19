'use client';

import { useState, useCallback, useEffect } from 'react';
import { getSupabaseClient, DEFAULT_DEVICE_ID } from '@/lib/supabase/client';
import { DeviceCommand, DeviceState } from '@/types/database.types';

export interface EnqueueCommandOptions {
  device: 'light' | 'fan' | 'motor';
  action: 'on' | 'off' | 'speed' | 'eco' | 'normal' | 'set_timer';
  value?: number | string;
  duration_seconds?: number;
  timer_action?: 'on' | 'off';
}

export function useDeviceCommands(
  deviceId = DEFAULT_DEVICE_ID,
  isUsingMock = false,
  onMockStateUpdate?: (updater: Partial<DeviceState>) => void
) {
  const [pendingCommands, setPendingCommands] = useState<DeviceCommand[]>([]);
  const [recentCommands, setRecentCommands] = useState<DeviceCommand[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [commandError, setCommandError] = useState<string | null>(null);

  // Subscribe to device_commands changes to remove completed commands
  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase || isUsingMock) return;

    const channel = supabase
      .channel(`device_commands_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_commands',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          const updatedCmd = payload.new as DeviceCommand;
          if (updatedCmd) {
            if (updatedCmd.status === 'completed' || updatedCmd.status === 'failed') {
              // Remove from pending
              setPendingCommands((prev) =>
                prev.filter((c) => String(c.id) !== String(updatedCmd.id))
              );
            }
            // Add to recent
            setRecentCommands((prev) => [
              updatedCmd,
              ...prev.filter((c) => String(c.id) !== String(updatedCmd.id)).slice(0, 9),
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, isUsingMock]);

  // Clean up pending commands that have been waiting > 20s (timeout warning)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setPendingCommands((prev) =>
        prev.map((c) => {
          if (c.created_at) {
            const ageMs = now - new Date(c.created_at).getTime();
            if (ageMs > 20000 && c.status === 'pending') {
              return { ...c, status: 'failed' };
            }
          }
          return c;
        })
      );
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const sendCommand = useCallback(
    async (options: EnqueueCommandOptions): Promise<{ success: boolean; command?: DeviceCommand; error?: string }> => {
      setIsSending(true);
      setCommandError(null);

      const commandPayload: Omit<DeviceCommand, 'id'> = {
        device_id: deviceId,
        device: options.device,
        action: options.action,
        value: options.value !== undefined ? options.value : options.action === 'on' ? 1 : 0,
        duration_seconds: options.duration_seconds ?? 0,
        timer_action: options.timer_action ?? 'off',
        status: 'pending',
        created_at: new Date().toISOString(),
        completed_at: null,
      };

      const tempId = `cmd_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const optimisticCommand: DeviceCommand = {
        ...commandPayload,
        id: tempId,
      };

      // Add to pending tracking immediately
      setPendingCommands((prev) => [optimisticCommand, ...prev]);

      const supabase = getSupabaseClient();

      // If mock mode or supabase not connected -> simulate ESP32 acknowledgement
      if (!supabase || isUsingMock) {
        setTimeout(() => {
          // Simulate ESP32 completing command
          setPendingCommands((prev) => prev.filter((c) => c.id !== tempId));
          const completedCmd: DeviceCommand = {
            ...optimisticCommand,
            status: 'completed',
            completed_at: new Date().toISOString(),
          };
          setRecentCommands((prev) => [completedCmd, ...prev.slice(0, 9)]);

          // Update local mock state if callback provided
          if (onMockStateUpdate) {
            if (options.device === 'light') {
              if (options.action === 'on') {
                onMockStateUpdate({ light_on: true, eco_mode: false });
              } else if (options.action === 'off') {
                onMockStateUpdate({ light_on: false, eco_mode: false });
              } else if (options.action === 'eco') {
                onMockStateUpdate({ eco_mode: true });
              } else if (options.action === 'normal') {
                onMockStateUpdate({ eco_mode: false });
              } else if (options.action === 'set_timer') {
                onMockStateUpdate({
                  light_timer_active: true,
                  light_timer_remaining: options.duration_seconds ?? 0,
                  light_timer_action: options.timer_action?.toUpperCase() ?? 'OFF',
                });
              }
            } else if (options.device === 'fan') {
              if (options.action === 'off') {
                onMockStateUpdate({ fan_speed: 0 });
              } else if (options.action === 'speed') {
                onMockStateUpdate({ fan_speed: Number(options.value) || 0 });
              } else if (options.action === 'set_timer') {
                onMockStateUpdate({
                  fan_timer_active: true,
                  fan_timer_remaining: options.duration_seconds ?? 0,
                  fan_timer_action: options.timer_action?.toUpperCase() ?? 'OFF',
                });
              }
            } else if (options.device === 'motor') {
              onMockStateUpdate({ motor_on: options.action === 'on' });
            }
          }
        }, 800);

        setIsSending(false);
        return { success: true, command: optimisticCommand };
      }

      try {
        const { data, error } = await supabase
          .from('device_commands')
          .insert(commandPayload)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        const inserted = data as DeviceCommand;
        // Replace temp optimistic command with actual inserted row
        setPendingCommands((prev) =>
          prev.map((c) => (c.id === tempId ? inserted : c))
        );

        setIsSending(false);
        return { success: true, command: inserted };
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to send command to Supabase';
        console.error('Failed to enqueue command:', err);
        setCommandError(msg);
        setPendingCommands((prev) => prev.filter((c) => c.id !== tempId));
        setIsSending(false);
        return { success: false, error: msg };
      }
    },
    [deviceId, isUsingMock, onMockStateUpdate]
  );

  return {
    sendCommand,
    pendingCommands,
    recentCommands,
    isSending,
    commandError,
    hasPendingLight: pendingCommands.some((c) => c.device === 'light' && c.status === 'pending'),
    hasPendingFan: pendingCommands.some((c) => c.device === 'fan' && c.status === 'pending'),
  };
}
