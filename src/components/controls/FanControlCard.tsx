'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Fan, Power, Clock, Loader2, Gauge, Edit3, Trash2, Zap, RotateCw } from 'lucide-react';
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

const SPEED_CONFIGS: { step: SpeedStep; label: string; name: string; pwm: number; anglePercent: number }[] = [
  { step: 0, label: '0', name: 'OFF', pwm: 0, anglePercent: 0 },
  { step: 80, label: '1', name: 'Low (80 PWM)', pwm: 80, anglePercent: 0.33 },
  { step: 150, label: '2', name: 'Med (150 PWM)', pwm: 150, anglePercent: 0.66 },
  { step: 255, label: '3', name: 'Max (255 PWM)', pwm: 255, anglePercent: 1.0 },
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
  const [isDragging, setIsDragging] = useState(false);

  const dialRef = useRef<SVGSVGElement | null>(null);

  const currentPwm = state.fan_speed || 0;
  const isFanOn = currentPwm > 0;
  const speedPercent = Math.round((currentPwm / 255) * 100);

  // Active step
  const currentStep: SpeedStep =
    currentPwm === 0 ? 0 : currentPwm <= 100 ? 80 : currentPwm <= 180 ? 150 : 255;

  // Spin animation
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
      await handleSetSpeed(150);
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

  const handleDeleteTimer = async () => {
    setActionLoading('delete_timer');
    await onCommand({
      device: 'fan',
      action: 'set_timer',
      value: 0,
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

  // SVG Radial Dial Calculations
  // Total dial radius = 68px, center = 90, 90. Arc spans 270° from 135° to 405°.
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270 degrees = 75% of circle
  const strokeDashoffset = arcLength * (1 - speedPercent / 100);

  // Calculate Knob (X, Y) on the 270-degree arc
  // Start angle: 135 deg (bottom-left), End angle: 405 deg (bottom-right)
  const angleDeg = 135 + (speedPercent / 100) * 270;
  const angleRad = (angleDeg * Math.PI) / 180;
  const knobX = 90 + radius * Math.cos(angleRad);
  const knobY = 90 + radius * Math.sin(angleRad);

  // Rotary Dial Interaction: Drag / Click Handler
  const handleDialInteraction = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current || hasPendingCommand || actionLoading !== null) return;
      const rect = dialRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const deltaX = clientX - centerX;
      const deltaY = clientY - centerY;

      // Calculate angle from center (-180° to +180°)
      let degrees = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
      // Convert to 0 to 360 where 0° is East (3 o'clock)
      if (degrees < 0) degrees += 360;

      // Arc starts at 135° (bottom-left) and ends at 405° (bottom-right, which is 45°)
      let arcProgress = 0;
      if (degrees >= 135 && degrees <= 360) {
        arcProgress = (degrees - 135) / 270;
      } else if (degrees >= 0 && degrees <= 45) {
        arcProgress = (degrees + 360 - 135) / 270;
      } else {
        // Outside active arc (bottom gap between 45° and 135°)
        arcProgress = degrees > 90 ? 0 : 1;
      }

      arcProgress = Math.max(0, Math.min(1, arcProgress));

      // Snap to closest of the 4 discrete speed steps: 0, 80, 150, 255
      let closestStep: SpeedStep = 0;
      if (arcProgress < 0.18) {
        closestStep = 0;
      } else if (arcProgress < 0.48) {
        closestStep = 80;
      } else if (arcProgress < 0.82) {
        closestStep = 150;
      } else {
        closestStep = 255;
      }

      if (closestStep !== currentStep) {
        handleSetSpeed(closestStep);
      }
    },
    [currentStep, hasPendingCommand, actionLoading]
  );

  // Mouse / Touch event listeners for smooth drag on dial
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    handleDialInteraction(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    setIsDragging(true);
    if (e.touches.length > 0) {
      handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleDialInteraction(e.clientX, e.clientY);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleDialInteraction(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleDialInteraction]);

  return (
    <div className="relative group overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#070e1c]/90 border border-slate-200/80 dark:border-cyan-500/25 backdrop-blur-xl shadow-xl hover:shadow-2xl transition-all duration-300 p-3.5 sm:p-6 w-full min-w-0">
      {/* Dynamic ambient background glow */}
      <div
        className={`absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isFanOn ? 'bg-cyan-500/25 opacity-100' : 'bg-slate-400/5 opacity-0'
        }`}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 sm:pb-4 border-b border-slate-100 dark:border-slate-800/80 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div
            className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all duration-300 shrink-0 ${
              isFanOn
                ? 'bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)]'
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
                GPIO 5 (PWM Dial)
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

      {/* Futuristic Rotary Dial Speed Controller */}
      <div className="my-3 sm:my-5 flex flex-col items-center justify-center relative select-none">
        <div className="relative flex items-center justify-center w-36 h-36 sm:w-48 sm:h-48 cursor-pointer touch-none">
          <svg
            ref={dialRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            className="w-full h-full transform transition-transform"
            viewBox="0 0 180 180"
          >
            <defs>
              {/* Futuristic neon gradient */}
              <linearGradient id="cyberFanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="50%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>

              {/* Glowing handle filter */}
              <filter id="handleGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
                <feMerge>
                  <feMergeNode />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Background 270-degree Arc Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth="9"
              fill="transparent"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={0}
              strokeLinecap="round"
              transform="rotate(135 90 90)"
              className="text-slate-200 dark:text-slate-800/90 transition-colors"
            />

            {/* Active Glowing Neon Speed Arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="url(#cyberFanGrad)"
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={`${arcLength} ${circumference}`}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(135 90 90)"
              className="transition-all duration-300 ease-out"
            />

            {/* Dial Tick Notches for Steps 0, 1, 2, 3 */}
            {SPEED_CONFIGS.map((cfg) => {
              const tickDeg = 135 + cfg.anglePercent * 270;
              const tickRad = (tickDeg * Math.PI) / 180;
              const x1 = 90 + (radius - 8) * Math.cos(tickRad);
              const y1 = 90 + (radius - 8) * Math.sin(tickRad);
              const x2 = 90 + (radius + 8) * Math.cos(tickRad);
              const y2 = 90 + (radius + 8) * Math.sin(tickRad);
              const isActive = currentStep >= cfg.step && isFanOn;

              return (
                <line
                  key={cfg.step}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isActive ? '#06b6d4' : '#64748b'}
                  strokeWidth={isActive ? '2.5' : '1.5'}
                  opacity={isActive ? '0.9' : '0.4'}
                />
              );
            })}

            {/* Interactive Glowing Handle / Knob Dot on Arc */}
            <circle
              cx={knobX}
              cy={knobY}
              r={isDragging ? '9' : '7.5'}
              fill="#ffffff"
              stroke="#06b6d4"
              strokeWidth="3.5"
              filter="url(#handleGlow)"
              className="transition-transform duration-100 ease-out cursor-grab active:cursor-grabbing"
            />
          </svg>

          {/* Center Display / Tactile Toggle Button */}
          <button
            onClick={handleTogglePower}
            disabled={hasPendingCommand || actionLoading !== null}
            title={isFanOn ? 'Click to switch OFF' : 'Click to turn ON (Speed 2)'}
            className="absolute flex flex-col items-center justify-center w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-slate-50 dark:bg-[#070f20] shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer border border-slate-200 dark:border-cyan-500/30 disabled:opacity-75 z-10"
          >
            <Fan
              style={getSpinStyle()}
              className={`w-5 h-5 sm:w-7 sm:h-7 mb-0.5 sm:mb-1 transition-colors ${
                isFanOn ? 'text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]' : 'text-slate-400'
              }`}
            />
            <span className="text-base sm:text-2xl font-black text-slate-900 dark:text-cyan-100 font-mono leading-none tracking-tight">
              {speedPercent}%
            </span>
            <span className="text-[8px] sm:text-[10px] text-cyan-600 dark:text-cyan-400 font-mono font-bold uppercase tracking-wider mt-0.5">
              {isFanOn ? `SPEED ${currentStep === 80 ? '1' : currentStep === 150 ? '2' : '3'}` : 'TAP ON'}
            </span>
          </button>
        </div>

        {/* Dial Helper Hint */}
        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-cyan-300/80 mt-1">
          <RotateCw className="w-3 h-3 text-cyan-500 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Drag dial or tap step below to adjust speed</span>
        </div>
      </div>

      {/* 4 Speed Selection Chips: OFF, 1, 2, 3 */}
      <div className="space-y-1.5 sm:space-y-2 mb-2.5 sm:mb-5">
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
                className={`flex flex-col items-center justify-center py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl sm:rounded-2xl border text-center transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? cfg.step === 0
                      ? 'bg-rose-500/15 border-rose-500 text-rose-600 dark:text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.3)] font-extrabold scale-[1.02]'
                      : 'bg-cyan-500/15 border-cyan-400 text-cyan-600 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.35)] font-extrabold scale-[1.02]'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isBtnLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin my-1" />
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

      {/* Active Timer Feedback & Countdown Banner (with Edit & Delete) */}
      {fanCountdown > 0 ? (
        <div className="mb-2.5 sm:mb-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/15 border border-cyan-500/40 shadow-[0_0_15px_rgba(6,182,212,0.15)] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0 animate-pulse">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-[11px] sm:text-xs text-cyan-800 dark:text-cyan-200 font-medium">
                Scheduled: Turn <strong className="font-extrabold text-cyan-900 dark:text-cyan-100 uppercase">{state.fan_timer_action || (isFanOn ? 'OFF' : 'ON')}</strong>
              </div>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-base sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 font-mono tracking-tight">
                  {formatMinSec(fanCountdown)}
                </span>
                <span className="text-[10px] sm:text-xs text-cyan-700/80 dark:text-cyan-300/80 font-mono">
                  ({fanCountdown}s left)
                </span>
              </div>
            </div>
          </div>

          {/* Edit & Delete Actions */}
          <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsTimerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-900 dark:text-cyan-200 text-xs font-semibold transition-colors cursor-pointer"
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
              title="Cancel and delete active fan timer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>{actionLoading === 'delete_timer' ? 'Canceling...' : 'Delete'}</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Quick Timer Presets Footer */}
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
            {fanCountdown > 0 ? 'Edit...' : 'Custom...'}
          </button>
        </div>
      </div>

      {/* Timer Configuration Modal */}
      <TimerModal
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
        device="fan"
        onSetTimer={handleSetTimer}
        onDeleteTimer={fanCountdown > 0 ? handleDeleteTimer : undefined}
        initialDuration={fanCountdown > 0 ? fanCountdown : 60}
        initialAction={state.fan_timer_action?.toLowerCase() === 'on' ? 'on' : 'off'}
        isEditing={fanCountdown > 0}
        isSubmitting={actionLoading === 'timer' || actionLoading === 'delete_timer'}
      />
    </div>
  );
}
