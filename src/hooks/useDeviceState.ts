'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getSupabaseClient, DEFAULT_DEVICE_ID } from '@/lib/supabase/client';
import { DeviceState } from '@/types/database.types';
import { INITIAL_MOCK_STATE } from '@/lib/supabase/mockData';

// Maximum duration (in seconds) since last heartbeat before marking device offline
const HEARTBEAT_TIMEOUT_SECONDS = 45;

export function useDeviceState(deviceId = DEFAULT_DEVICE_ID) {
  const [state, setState] = useState<DeviceState>(INITIAL_MOCK_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isUsingMock, setIsUsingMock] = useState(false);

  // Active timers countdown tracking
  const [lightCountdown, setLightCountdown] = useState<number>(0);
  const [fanCountdown, setFanCountdown] = useState<number>(0);

  // Keep ref of state to avoid stale closures in timers
  const stateRef = useRef(state);
  stateRef.current = state;

  // Calculate online status based on timestamp freshness
  const getIsOnline = useCallback((): { isOnline: boolean; secondsAgo: number } => {
    if (!state.updated_at) return { isOnline: false, secondsAgo: 9999 };
    const updated = new Date(state.updated_at).getTime();
    const now = Date.now();
    const secondsAgo = Math.max(0, Math.floor((now - updated) / 1000));
    return {
      isOnline: secondsAgo <= HEARTBEAT_TIMEOUT_SECONDS,
      secondsAgo,
    };
  }, [state.updated_at]);

  const [connectionStatus, setConnectionStatus] = useState<{ isOnline: boolean; secondsAgo: number }>({
    isOnline: false,
    secondsAgo: 9999,
  });

  // Update connection status every second & on mount
  useEffect(() => {
    setConnectionStatus(getIsOnline());
    setLastSyncTime(new Date());
    const interval = setInterval(() => {
      setConnectionStatus(getIsOnline());
    }, 1000);
    return () => clearInterval(interval);
  }, [getIsOnline]);

  // Handle countdown decrements
  useEffect(() => {
    if (state.light_timer_remaining) {
      setLightCountdown(state.light_timer_remaining);
    } else {
      setLightCountdown(0);
    }

    if (state.fan_timer_remaining) {
      setFanCountdown(state.fan_timer_remaining);
    } else {
      setFanCountdown(0);
    }
  }, [state.light_timer_remaining, state.fan_timer_remaining]);

  // Decrement countdown locally every second if active
  useEffect(() => {
    const timer = setInterval(() => {
      setLightCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      setFanCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch device state from Supabase
  const fetchState = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setIsUsingMock(true);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error: fetchErr } = await supabase
        .from('device_state')
        .select('*')
        .eq('device_id', deviceId)
        .maybeSingle();

      if (fetchErr) {
        console.warn('Supabase fetch error, fallback to local state:', fetchErr.message);
        setError(fetchErr.message);
        setIsUsingMock(true);
      } else if (data) {
        setState(data as DeviceState);
        setError(null);
        setIsUsingMock(false);
        setLastSyncTime(new Date());
      } else {
        // No row found yet for this device_id -> Attempt to create one or use mock
        console.info(`No device_state record found for ${deviceId}.`);
      }
    } catch (err: unknown) {
      console.warn('Network or Supabase connection issue:', err);
      setIsUsingMock(true);
      setError('Unable to reach Supabase server. Operating in offline/mock mode.');
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Initial fetch and subscription
  useEffect(() => {
    fetchState();

    const supabase = getSupabaseClient();
    if (!supabase) return;

    // Realtime channel subscription
    const channel = supabase
      .channel(`device_state_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'device_state',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          if (payload.new) {
            setState(payload.new as DeviceState);
            setLastSyncTime(new Date());
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to Realtime device_state for ${deviceId}`);
        }
      });

    // Fallback polling interval every 5 seconds
    const pollInterval = setInterval(() => {
      fetchState();
    }, 5000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [deviceId, fetchState]);

  // Helper for mock mode state mutations (for previewing actions immediately)
  const setLocalMockState = useCallback((updater: Partial<DeviceState>) => {
    setState((prev) => ({
      ...prev,
      ...updater,
      updated_at: new Date().toISOString(),
    }));
    setLastSyncTime(new Date());
  }, []);

  return {
    state,
    isLoading,
    error,
    isOnline: connectionStatus.isOnline,
    lastSeenSeconds: connectionStatus.secondsAgo,
    lastSyncTime,
    isUsingMock,
    lightCountdown,
    fanCountdown,
    refresh: fetchState,
    setLocalMockState,
  };
}
