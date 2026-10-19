'use client';

import React, { useState } from 'react';
import { Fan, Power, Clock, Loader2, Gauge } from 'lucide-react';
import { DeviceState } from '@/types/database.types';
import { SpeedStep } from '@/types/smartHome.types';
import { Badge } from '@/components/ui/Badge';
import { TimerModal } from './TimerModal';
import { TimeAgo } from '@/components/ui/TimeAgo';

interface FanControlCardProps {
  state: DeviceState;
  hasPendingCommand: boolean;
  onCommand: (params: {
    device: 'fan';
    action: 'speed' | 'off' | 'set_timer';
    value?: number;
    duration_seconds?: number;
    timer_action?: 'on' | 'off';
  }) => Promise<{ success: boolean; error?: string }>;
  isOnline: boolean;
  fanCountdown: number;
}

const SPEED_CONFIGS: { step: SpeedStep; label: string; name: string; color: string }[] = [
  { step: 0, label: '0', name: 'OFF', color: 'slate' },
  { step: 80, label: '1', name: 'Low (80 PWM)', color: 'emerald' },
  { step: 150, label: '2', name: 'Med (150 PWM)', color: 'blue' },
  { step: 255, label: '3', name: 'High (255 PWM)', color: 'cyan' },
];

export function FanControlCard({
  state,
  hasPendingCommand,
  onCommand,
  isOnline,
  fanCountdown,
}: FanControlCardProps) {
  const [isTimerOpen, setIsTimerOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const currentPwm = state.fan_speed || 0;
  const isFanOn = currentPwm > 0;
  const speedPercent = Math.round((currentPwm / 255) * 100);

  // Determine current active speed step
  const currentStep: SpeedStep =
    currentPwm === 0 ? 0 : currentPwm <= 100 ? 80 : currentPwm <= 180 ? 150 : 255;

  // Animation spin speed based on current PWM
  const getSpinStyle = () => {
    if (!isFanOn) return {};
    let duration = '1.8s';
    if (currentPwm >= 200) duration = '0.35s';
    else if (currentPwm >= 120) duration = '0.7s';
    else if (currentPwm > 0) duration = '1.3s';

    return {
      animation: `spin ${duration} linear infinite`,
    };
  };

  const handleSetSpeed = async (step: SpeedStep) => {
    setActionLoading(`speed_${step}`);
    if (step === 0) {
      await onCommand({
        device: 'fan',
        action: 'off',
        value: 0,
        duration_seconds: 0,
        timer_action: 'off',
      });
    } else {
      await onCommand({
        device: 'fan',
        action: 'speed',
        value: step,
        duration_seconds: 0,
        timer_action: 'off',
      });
    }
    setActionLoading(null);
  };

  const handleTogglePower = async () => {
    if (isFanOn) {
      await handleSetSpeed(0);
    } else {
      await handleSetSpeed(150); // Default to speed 2 (150)
    }
  };

  const handleSetTimer = async (params: {
    device: 'light' | 'fan';
    durationSeconds: number;
    timerAction: 'on' | 'off';
    targetPwm?: number;
  }) => {
    setActionLoading('timer');
    await onCommand({
      device: 'fan',
      action: 'set_timer',
      value: params.targetPwm || 150,
      duration_seconds: params.durationSeconds,
      timer_action: params.timerAction,
    });
    setActionLoading(null);
  };

  // SVG Gauge calculation for circular speed regulator
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (speedPercent / 100) * circumference * 0.75;

  return (
    <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3.5 sm:p-6 w-full min-w-0">
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isFanOn ? 'bg-cyan-500/20 opacity-100' : 'bg-slate-400/5 opacity-0'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 shrink-0 ${
              isFanOn
                ? 'bg-gradient-to-tr from-cyan-600 to-blue-500 text-white shadow-lg shadow-cyan-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Fan style={getSpinStyle()} className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white truncate">Ceiling Fan</h3>
              {hasPendingCommand && (
                <Badge variant="warning" size="sm" pulse>
                  <Loader2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin" />
                  <span className="text-[10px] sm:text-xs">Syncing</span>
                </Badge>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 sm:gap-1.5 mt-0.5 truncate">
              <TimeAgo date={state.updated_at} prefix="Updated " />
              <span>•</span>
              <span className="font-medium text-slate-600 dark:text-slate-300 truncate">
                GPIO 5 (PWM)
              </span>
            </p>
          </div>
        </div>

        {/* State Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Badge variant={isFanOn ? 'info' : 'neutral'} size="sm">
            {isFanOn ? `PWM ${currentPwm}` : 'OFF'}
          </Badge>
          <Badge variant={isFanOn ? 'success' : 'neutral'} size="sm">
            {speedPercent}%
          </Badge>
        </div>
      </div>

      {/* Circular Dial / Speed Regulator Visualizer */}
      <div className="my-2 sm:my-5 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center w-28 h-28 sm:w-44 sm:h-44">
          <svg className="w-full h-full transform -rotate-135" viewBox="0 0 160 160">
            {/* Background track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * 0.25}
              strokeLinecap="round"
              className="text-slate-100 dark:text-slate-800"
            />
            {/* Animated Speed Fill Track */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="url(#fanGradient)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="fanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center Display / Tactile Toggle */}
          <button
            onClick={handleTogglePower}
            disabled={hasPendingCommand || actionLoading !== null}
            title={isFanOn ? 'Click to turn OFF' : 'Click to turn ON'}
            className="absolute flex flex-col items-center justify-center w-18 h-18 sm:w-26 sm:h-26 rounded-full bg-slate-50 dark:bg-slate-800/90 shadow-inner hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-slate-200 dark:border-slate-700 disabled:opacity-75"
          >
            <Fan
              style={getSpinStyle()}
              className={`w-5 h-5 sm:w-7 sm:h-7 mb-0.5 sm:mb-1 transition-colors ${
                isFanOn ? 'text-cyan-500 dark:text-cyan-400' : 'text-slate-400'
              }`}
            />
            <span className="text-sm sm:text-xl font-extrabold text-slate-800 dark:text-white font-mono leading-none">
              {speedPercent}%
            </span>
            <span className="text-[8px] sm:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold mt-0.5 sm:mt-1">
              {isFanOn ? `PWM ${currentPwm}` : 'TAP ON'}
            </span>
          </button>
        </div>

        {/* Speed Label */}
        <div className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1 truncate">
          {currentStep === 0
            ? 'Fan is currently stopped'
            : currentStep === 80
            ? 'Speed 1 (Low airflow)'
            : currentStep === 150
            ? 'Speed 2 (Medium airflow)'
            : 'Speed 3 (Maximum cooling)'}
        </div>
      </div>

      {/* Speed Step Buttons: OFF, 1 (80), 2 (150), 3 (255) */}
      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-5">
        <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          <span>Speed Selector</span>
          <span className="text-[10px] sm:text-[11px] font-normal lowercase">hardware mapped steps</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
          {SPEED_CONFIGS.map((cfg) => {
            const isSelected = currentStep === cfg.step;
            const isBtnLoading = actionLoading === `speed_${cfg.step}`;

            return (
              <button
                key={cfg.step}
                type="button"
                disabled={hasPendingCommand || isBtnLoading}
                onClick={() => handleSetSpeed(cfg.step)}
                className={`flex flex-col items-center justify-center py-1.5 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? cfg.step === 0
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-md font-bold'
                      : 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 shadow-md font-bold'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isBtnLoading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin my-0.5 sm:my-1" />
                ) : (
                  <>
                    <span className="text-sm sm:text-base font-extrabold">{cfg.label}</span>
                    <span className="text-[9px] sm:text-[10px] opacity-80 whitespace-nowrap">
                      {cfg.step === 0 ? 'OFF' : `PWM ${cfg.step}`}
                    </span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Timer Feedback & Countdown Banner */}
      {fanCountdown > 0 ? (
        <div className="mb-2.5 sm:mb-4 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2 text-xs text-cyan-800 dark:text-cyan-200 min-w-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-500 shrink-0" />
            <div className="min-w-0">
              <span className="text-[11px] sm:text-xs">Fan turns <strong>{state.fan_timer_action || (isFanOn ? 'OFF' : 'ON')}</strong> in:</span>
              <div className="text-sm sm:text-base font-bold text-cyan-600 dark:text-cyan-400 font-mono mt-0.5">
                {fanCountdown}s remaining
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsTimerOpen(true)}
            className="text-[11px] sm:text-xs font-semibold px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-800 dark:text-cyan-200 transition-colors shrink-0"
          >
            Reset
          </button>
        </div>
      ) : null}

      {/* Quick Timer Presets Footer */}
      <div className="pt-2.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Timers:</span>
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
                  device: 'fan',
                  durationSeconds: quick.secs,
                  timerAction: isFanOn ? 'off' : 'on',
                  targetPwm: 150,
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
            className="px-2.5 py-1 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-700 dark:text-cyan-400 transition-colors cursor-pointer"
          >
            Custom...
          </button>
        </div>
      </div>

      {/* Timer Configuration Modal */}
      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        device="fan"
        onSetTimer={handleSetTimer}
        isSubmitting={actionLoading === 'timer'}
      />
    </div>
  );
}
