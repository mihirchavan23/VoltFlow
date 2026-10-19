'use client';

import React from 'react';
import { Lightbulb, Fan, Zap, Activity, IndianRupee, Award } from 'lucide-react';
import { DeviceUsageSummary } from '@/types/smartHome.types';
import { formatDuration, formatINR, formatKWh } from '@/lib/utils/formatters';

interface UsageSummaryCardsProps {
  summary: DeviceUsageSummary;
  onOpenSettings: () => void;
}

export function UsageSummaryCards({ summary, onOpenSettings }: UsageSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Today's Light Runtime */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#070b14]/90 border border-amber-500/30 dark:border-amber-500/20 p-3.5 sm:p-5 shadow-sm dark:shadow-[0_4px_20px_rgba(245,158,11,0.08)] backdrop-blur-xl relative overflow-hidden group hover:border-amber-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Light Runtime
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
          {formatDuration(summary.todayLightRuntimeSeconds)}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
          Today's ON duration
        </p>
      </div>

      {/* Today's Fan Runtime */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#070b14]/90 border border-cyan-500/30 dark:border-cyan-500/20 p-3.5 sm:p-5 shadow-sm dark:shadow-[0_4px_20px_rgba(6,182,212,0.08)] backdrop-blur-xl relative overflow-hidden group hover:border-cyan-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-cyan-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            Fan Runtime
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            <Fan className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
          {formatDuration(summary.todayFanRuntimeSeconds)}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
          Active PWM intervals
        </p>
      </div>

      {/* Estimated Energy Consumption */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#070b14]/90 border border-emerald-500/30 dark:border-emerald-500/20 p-3.5 sm:p-5 shadow-sm dark:shadow-[0_4px_20px_rgba(16,185,129,0.08)] backdrop-blur-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Total Energy
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
          {formatKWh(summary.totalEstimatedEnergyKWh)}
        </div>
        <div className="flex items-center justify-between mt-1 text-[10px] sm:text-xs">
          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
            ~ {formatINR(summary.totalEstimatedCostINR)}
          </span>
          <button
            onClick={onOpenSettings}
            className="underline text-slate-500 hover:text-cyan-600 dark:text-slate-400 dark:hover:text-cyan-300 cursor-pointer hidden sm:inline"
          >
            Rates
          </button>
        </div>
      </div>

      {/* State Transitions & Most Used */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#070b14]/90 border border-purple-500/30 dark:border-purple-500/20 p-3.5 sm:p-5 shadow-sm dark:shadow-[0_4px_20px_rgba(168,85,247,0.08)] backdrop-blur-xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div className="absolute top-0 right-0 w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Active Device
          </span>
          <div className="p-1.5 sm:p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
        </div>
        <div className="text-base sm:text-xl font-bold text-slate-900 dark:text-white truncate">
          {summary.mostUsedDevice.name}
        </div>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
          <span>{summary.mostUsedDevice.percentage}% share</span>
          <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold">
            {summary.totalStateTransitions} events
          </span>
        </p>
      </div>
    </div>
  );
}
