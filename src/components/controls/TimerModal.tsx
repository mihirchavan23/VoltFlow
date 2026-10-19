'use client';

import React, { useState } from 'react';
import { X, Clock, Play, Sparkles } from 'lucide-react';
import { SpeedStep } from '@/types/smartHome.types';

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  device: 'light' | 'fan';
  onSetTimer: (params: {
    device: 'light' | 'fan';
    durationSeconds: number;
    timerAction: 'on' | 'off';
    targetPwm?: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const PRESET_DURATIONS: { label: string; seconds: number }[] = [
  { label: '5s', seconds: 5 },
  { label: '10s', seconds: 10 },
  { label: '30s', seconds: 30 },
  { label: '1m', seconds: 60 },
  { label: '5m', seconds: 300 },
  { label: '10m', seconds: 600 },
];

export function TimerModal({
  isOpen,
  onClose,
  device,
  onSetTimer,
  isSubmitting = false,
}: TimerModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<number>(60); // 1m default
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [customSeconds, setCustomSeconds] = useState<string>('45');
  const [timerAction, setTimerAction] = useState<'on' | 'off'>('off');
  const [targetFanSpeed, setTargetFanSpeed] = useState<SpeedStep>(150); // Speed 2 default

  if (!isOpen) return null;

  const effectiveSeconds = isCustom ? Math.max(1, parseInt(customSeconds) || 1) : selectedDuration;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveSeconds <= 0) return;

    await onSetTimer({
      device,
      durationSeconds: effectiveSeconds,
      timerAction,
      targetPwm: device === 'fan' && timerAction === 'on' ? targetFanSpeed : 0,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Subtle decorative glow */}
        <div
          className={`absolute -top-16 -right-16 w-36 h-36 rounded-full blur-3xl opacity-30 ${
            device === 'light' ? 'bg-amber-500' : 'bg-cyan-500'
          }`}
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                device === 'light'
                  ? 'bg-amber-500/10 text-amber-500'
                  : 'bg-cyan-500/10 text-cyan-500'
              }`}
            >
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                Set {device === 'light' ? 'Lighting' : 'Fan'} Timer
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hardware countdown executed on ESP32
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* Target Action */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Target Action
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTimerAction('off')}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border text-center transition-all ${
                  timerAction === 'off'
                    ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                🔴 Turn OFF
              </button>
              <button
                type="button"
                onClick={() => setTimerAction('on')}
                className={`py-2.5 px-4 rounded-xl text-sm font-medium border text-center transition-all ${
                  timerAction === 'on'
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                🟢 Turn ON
              </button>
            </div>
          </div>

          {/* Target Fan Speed if device is fan and action is ON */}
          {device === 'fan' && timerAction === 'on' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Target Fan Speed
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { step: 80 as SpeedStep, label: 'Speed 1 (Low)' },
                  { step: 150 as SpeedStep, label: 'Speed 2 (Med)' },
                  { step: 255 as SpeedStep, label: 'Speed 3 (High)' },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setTargetFanSpeed(item.step)}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      targetFanSpeed === item.step
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Duration Presets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Timer Duration
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_DURATIONS.map((preset) => {
                const isSelected = !isCustom && selectedDuration === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedDuration(preset.seconds);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            {/* Custom duration toggle */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-medium border text-center transition-all ${
                  isCustom
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                Custom Duration...
              </button>

              {isCustom && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="number"
                    min="1"
                    max="86400"
                    value={customSeconds}
                    onChange={(e) => setCustomSeconds(e.target.value)}
                    placeholder="Enter seconds (e.g. 45)"
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">seconds</span>
                </div>
              )}
            </div>
          </div>

          {/* Summary Preview */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              {device === 'light' ? '💡 Light' : '🌀 Fan'} will turn{' '}
              <strong className={timerAction === 'on' ? 'text-emerald-500' : 'text-rose-500'}>
                {timerAction.toUpperCase()}
              </strong>{' '}
              {device === 'fan' && timerAction === 'on' && (
                <span>
                  at <strong>PWM {targetFanSpeed}</strong>{' '}
                </span>
              )}
              after <strong>{effectiveSeconds} seconds</strong>.
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || effectiveSeconds <= 0}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              {isSubmitting ? 'Queueing...' : 'Arm Timer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
