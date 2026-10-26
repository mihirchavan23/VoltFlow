'use client';

import React, { useState } from 'react';
import { Lightbulb, Leaf, Zap, Clock, Loader2, Sparkles, AlertCircle, Edit3, Trash2 } from 'lucide-react';
import { DeviceState } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';
import { TimerModal } from './TimerModal';
import { TimeAgo } from '@/components/ui/TimeAgo';

interface LightControlCardProps {
  state: DeviceState;
  hasPendingCommand: boolean;
  onCommand: (params: {
    device: 'light';
    action: 'on' | 'off' | 'eco' | 'normal' | 'set_timer';
    value?: number;
    duration_seconds?: number;
    timer_action?: 'on' | 'off';
  }) => Promise<{ success: boolean; error?: string }>;
  isOnline: boolean;
  lightCountdown: number;
}

export function LightControlCard({
  state,
  hasPendingCommand,
  onCommand,
  isOnline,
  lightCountdown,
}: LightControlCardProps) {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const isLightOn = state.light_on;
  const isEcoMode = state.eco_mode;

  const handleTogglePower = async () => {
    setActionLoading('power');
    const targetAction = isLightOn ? 'off' : 'on';
    await onCommand({
      device: 'light',
      action: targetAction,
      value: targetAction === 'on' ? 1 : 0,
      duration_seconds: 0,
      timer_action: 'off',
    });
    setActionLoading(null);
  };

  const handleSetMode = async (mode: 'eco' | 'normal') => {
    setActionLoading(mode);
    await onCommand({
      device: 'light',
      action: mode,
      value: mode === 'eco' ? 1 : 0,
      duration_seconds: 0,
      timer_action: 'off',
    });
    setActionLoading(null);
  };

  const handleSetTimer = async (params: {
    device: 'light' | 'fan';
    durationSeconds: number;
    timerAction: 'on' | 'off';
  }) => {
    setActionLoading('timer');
    await onCommand({
      device: 'light',
      action: 'set_timer',
      duration_seconds: params.durationSeconds,
      timer_action: params.timerAction,
    });
    setActionLoading(null);
  };

  const handleDeleteTimer = async () => {
    setActionLoading('delete_timer');
    await onCommand({
      device: 'light',
      action: 'set_timer',
      duration_seconds: 0,
      timer_action: 'off',
    });
    setActionLoading(null);
  };

  const formatMinSec = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#080d19]/90 border border-slate-200/80 dark:border-amber-500/20 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3.5 sm:p-6 w-full min-w-0">
      {/* Dynamic ambient background glow when illuminated */}
      <div
        className={`absolute -top-24 -left-24 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isLightOn
            ? 'bg-amber-400/25 dark:bg-amber-500/20 opacity-100'
            : 'bg-slate-400/5 opacity-0'
        }`}
      />

      {/* Card Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 shrink-0 ${
              isLightOn
                ? 'bg-gradient-to-tr from-amber-500 to-amber-400 text-white shadow-lg shadow-amber-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Lightbulb className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isLightOn ? 'scale-110' : ''}`} />
            {isLightOn && (
              <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-amber-400 animate-ping opacity-20" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">Smart Light</h3>
              {hasPendingCommand && (
                <Badge variant="warning" size="sm" pulse>
                  <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span className="text-[10px] sm:text-xs">Syncing</span>
                </Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
              <TimeAgo date={state.updated_at} prefix="Changed " />
              <span>•</span>
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                GPIO 2 (LED)
              </span>
            </p>
          </div>
        </div>

        {/* State Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {isEcoMode ? (
            <Badge variant="success" size="sm" className="hidden xs:inline-flex sm:inline-flex">
              <Leaf className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>ECO</span>
            </Badge>
          ) : (
            <Badge variant="info" size="sm" className="hidden xs:inline-flex sm:inline-flex">
              <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Normal</span>
            </Badge>
          )}

          <Badge variant={isLightOn ? 'warning' : 'neutral'} size="sm">
            {isLightOn ? 'ON' : 'OFF'}
          </Badge>
        </div>
      </div>

      {/* Main Interactive Toggle Button */}
      <div className="my-2.5 sm:my-5">
        <button
          onClick={handleTogglePower}
          disabled={hasPendingCommand || actionLoading === 'power'}
          className={`w-full py-2.5 sm:py-5 px-3 sm:px-6 rounded-xl sm:rounded-2xl font-bold flex items-center justify-between transition-all duration-300 cursor-pointer shadow-md sm:shadow-lg disabled:opacity-75 ${
            isLightOn
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white shadow-amber-500/25 ring-2 ring-amber-400/30'
              : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 shadow-slate-900/5'
          }`}
        >
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center transition-colors shrink-0 ${
                isLightOn ? 'bg-white/20' : 'bg-slate-200 dark:bg-slate-700'
              }`}
            >
              {actionLoading === 'power' ? (
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs sm:text-base leading-tight font-extrabold truncate">
                {isLightOn ? 'Turn Light OFF' : 'Turn Light ON'}
              </div>
              <div className="text-[10px] sm:text-xs opacity-80 font-normal truncate">
                {hasPendingCommand ? 'Command queued for ESP32...' : isLightOn ? 'Currently Illuminating' : 'Standby Mode'}
              </div>
            </div>
          </div>

          <div
            className={`w-10 h-6 sm:w-12 sm:h-7 rounded-full p-0.5 sm:p-1 transition-colors duration-300 shrink-0 ${
              isLightOn ? 'bg-amber-300/40' : 'bg-slate-300 dark:bg-slate-600'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
                isLightOn ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mode Switches: ECO vs Normal */}
      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-5">
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          <span>Operating Mode</span>
          <span className="text-[10px] sm:text-[11px] font-normal lowercase">
            {isEcoMode ? 'motion-activated' : 'manual control'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl sm:rounded-2xl">
          <button
            type="button"
            onClick={() => handleSetMode('eco')}
            disabled={hasPendingCommand || actionLoading === 'eco'}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              isEcoMode
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">ECO (PIR Auto)</span>
          </button>

          <button
            type="button"
            onClick={() => handleSetMode('normal')}
            disabled={hasPendingCommand || actionLoading === 'normal'}
            className={`flex items-center justify-center gap-1.5 sm:gap-2 py-1.5 sm:py-2.5 px-2 sm:px-3 rounded-lg sm:rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !isEcoMode
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Normal Mode</span>
          </button>
        </div>

        {isEcoMode && (
          <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] sm:text-xs text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-500" />
            <span>
              PIR sensor (GPIO 13) active. Light turns ON for 5s when motion is detected.
            </span>
          </div>
        )}
      </div>

      {/* Active Timer Feedback & Countdown Banner (with Edit & Delete) */}
      {lightCountdown > 0 ? (
        <div className="mb-2.5 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0 animate-pulse">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-amber-800 dark:text-amber-200 font-medium">
                Scheduled: Turn <strong className="font-extrabold text-amber-900 dark:text-amber-100 uppercase">{state.light_timer_action || (isLightOn ? 'OFF' : 'ON')}</strong>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base sm:text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tracking-tight">
                  {formatMinSec(lightCountdown)}
                </span>
                <span className="text-[10px] sm:text-xs text-amber-700/80 dark:text-amber-300/80 font-mono">
                  ({lightCountdown}s left)
                </span>
              </div>
            </div>
          </div>

          {/* Edit & Delete Actions */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsTimerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold transition-colors cursor-pointer"
              title="Edit timer duration or action"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              disabled={actionLoading === 'delete_timer'}
              onClick={handleDeleteTimer}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer border border-rose-500/30"
              title="Cancel and delete active timer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{actionLoading === 'delete_timer' ? 'Canceling...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Timer Presets & Configuration Footer */}
      <div className="pt-2.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Quick Timers:</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          {[
            { label: '30s', secs: 30 },
            { label: '1m', secs: 60 },
            { label: '5m', secs: 300 },
          ].map((quick) => (
            <button
              key={quick.secs}
              type="button"
              disabled={hasPendingCommand}
              onClick={() =>
                handleSetTimer({
                  device: 'light',
                  durationSeconds: quick.secs,
                  timerAction: isLightOn ? 'off' : 'on',
                })
              }
              className="px-2 py-1 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              {quick.label}
            </button>
          ))}

          <button
            type="button"
            onClick={() => setIsTimerOpen(true)}
            className="px-2.5 py-1 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 transition-colors cursor-pointer"
          >
            {lightCountdown > 0 ? 'Edit...' : 'Custom...'}
          </button>
        </div>
      </div>

      {/* Timer Configuration Modal */}
      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        device="light"
        onSetTimer={handleSetTimer}
        onDeleteTimer={lightCountdown > 0 ? handleDeleteTimer : undefined}
        initialDuration={lightCountdown > 0 ? lightCountdown : 60}
        initialAction={state.light_timer_action?.toLowerCase() === 'on' ? 'on' : 'off'}
        isEditing={lightCountdown > 0}
        isSubmitting={actionLoading === 'timer' || actionLoading === 'delete_timer'}
      />
    </div>
  );
}
