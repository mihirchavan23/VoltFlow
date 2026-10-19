'use client';

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { DayUsageMetrics, DeviceUsageSummary } from '@/types/smartHome.types';
import { Zap, IndianRupee, Info } from 'lucide-react';
import { formatDuration } from '@/lib/utils/formatters';

interface EnergyCostChartProps {
  data: DayUsageMetrics[];
  summary: DeviceUsageSummary;
}

export function EnergyCostChart({ data, summary }: EnergyCostChartProps) {
  const totalSpeedSecs =
    summary.fanSpeedTimeSeconds.speed1 +
    summary.fanSpeedTimeSeconds.speed2 +
    summary.fanSpeedTimeSeconds.speed3;

  const sp1Percent =
    totalSpeedSecs > 0 ? Math.round((summary.fanSpeedTimeSeconds.speed1 / totalSpeedSecs) * 100) : 0;
  const sp2Percent =
    totalSpeedSecs > 0 ? Math.round((summary.fanSpeedTimeSeconds.speed2 / totalSpeedSecs) * 100) : 0;
  const sp3Percent =
    totalSpeedSecs > 0 ? Math.round((summary.fanSpeedTimeSeconds.speed3 / totalSpeedSecs) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Daily Energy & Cost Trend Chart (2 columns on lg) */}
      <div className="lg:col-span-2 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-xl transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Estimated Electricity & Cost Trend
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculated via Power (W) × Operating hours / 1000
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs self-start sm:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 dark:text-slate-300">Energy (kWh)</span>
          </div>
        </div>

        <div className="h-56 sm:h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis
                dataKey="dayLabel"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                unit=" kWh"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as DayUsageMetrics;
                    return (
                      <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs text-white backdrop-blur-md">
                        <div className="font-bold text-slate-200 mb-1.5">{label}</div>
                        <div className="space-y-1">
                          <div className="flex justify-between gap-4">
                            <span className="text-emerald-400">Estimated Energy:</span>
                            <span className="font-mono font-bold">{row.totalEnergyKWh} kWh</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-cyan-400">Estimated Cost:</span>
                            <span className="font-mono font-bold">₹{row.estimatedCostINR}</span>
                          </div>
                          <div className="flex justify-between gap-4 text-slate-400 border-t border-slate-800 pt-1 mt-1">
                            <span>Light: {row.lightEnergyKWh} kWh</span>
                            <span>Fan: {row.fanEnergyKWh} kWh</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="totalEnergyKWh"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#energyGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
          <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span>
            <strong>Note:</strong> Values represent mathematical estimates based on operating duration and assumed device wattages.
          </span>
        </div>
      </div>

      {/* Fan Speed Distribution (1 column on lg) */}
      <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-xl flex flex-col justify-between transition-colors">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">Fan Speed Breakdown</h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Proportion of operating runtime across individual speed levels
          </p>

          <div className="space-y-4">
            {/* Speed 1 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Speed 1 (Low ~25W)
                </span>
                <span className="text-slate-500 font-mono">
                  {formatDuration(summary.fanSpeedTimeSeconds.speed1)} ({sp1Percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${sp1Percent}%` }}
                />
              </div>
            </div>

            {/* Speed 2 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Speed 2 (Med ~45W)
                </span>
                <span className="text-slate-500 font-mono">
                  {formatDuration(summary.fanSpeedTimeSeconds.speed2)} ({sp2Percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${sp2Percent}%` }}
                />
              </div>
            </div>

            {/* Speed 3 */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Speed 3 (High ~70W)
                </span>
                <span className="text-slate-500 font-mono">
                  {formatDuration(summary.fanSpeedTimeSeconds.speed3)} ({sp3Percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                  style={{ width: `${sp3Percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-6">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Total Active Fan Time:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">
              {formatDuration(totalSpeedSecs)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
