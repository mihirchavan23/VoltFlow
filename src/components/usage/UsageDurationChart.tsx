'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { DayUsageMetrics } from '@/types/smartHome.types';
import { Clock } from 'lucide-react';

interface UsageDurationChartProps {
  data: DayUsageMetrics[];
}

export function UsageDurationChart({ data }: UsageDurationChartProps) {
  return (
    <div className="rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-6 shadow-sm dark:shadow-xl backdrop-blur-xl transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Daily Device Operating Hours
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hours spent in active ON state (split across midnight boundaries)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs self-start sm:self-auto">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Light (hrs)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-cyan-500 inline-block" />
            <span className="text-slate-600 dark:text-slate-300">Fan (hrs)</span>
          </div>
        </div>
      </div>

      <div className="h-60 sm:h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
              unit="h"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-700 shadow-xl text-xs text-white backdrop-blur-md">
                      <div className="font-bold text-slate-200 mb-2">{label}</div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-amber-400">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Light:
                          </span>
                          <span className="font-mono font-bold">{payload[0].value} hrs</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-cyan-400">
                            <span className="w-2 h-2 rounded-full bg-cyan-400" />
                            Fan:
                          </span>
                          <span className="font-mono font-bold">{payload[1].value} hrs</span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="lightRuntimeHours"
              name="Light"
              stackId="a"
              fill="#f59e0b"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="fanRuntimeHours"
              name="Fan"
              stackId="a"
              fill="#06b6d4"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
