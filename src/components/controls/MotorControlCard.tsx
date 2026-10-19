'use client';

import React, { useState } from 'react';
import { Cog, Info, ShieldAlert, Loader2, Power } from 'lucide-react';
import { DeviceState } from '@/types/database.types';
import { Badge } from '@/components/ui/Badge';

interface MotorControlCardProps {
  state: DeviceState;
  hasPendingCommand: boolean;
  onCommand: (params: {
    device: 'motor';
    action: 'on' | 'off';
    value?: number;
    duration_seconds?: number;
    timer_action?: 'off';
  }) => Promise<{ success: boolean; error?: string }>;
}

export function MotorControlCard({
  state,
  hasPendingCommand,
  onCommand,
}: MotorControlCardProps) {
  const [isDriverConfigured, setIsDriverConfigured] = useState(false);
  const [loading, setLoading] = useState(false);

  const isMotorOn = state.motor_on;

  const handleToggleMotor = async () => {
    if (!isDriverConfigured) return;
    setLoading(true);
    const target = isMotorOn ? 'off' : 'on';
    await onCommand({
      device: 'motor',
      action: target,
      value: target === 'on' ? 1 : 0,
      duration_seconds: 0,
      timer_action: 'off',
    });
    setLoading(false);
  };

  return (
    <div className="relative group overflow-hidden rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 backdrop-blur-xl shadow-xl p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl ${
              isMotorOn
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
            }`}
          >
            <Cog className={`w-6 h-6 ${isMotorOn ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Toy Motor</h3>
              <Badge variant="purple" size="sm">
                Extensible GPIO
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Database schema ready (motor_on) • Driver standby
            </p>
          </div>
        </div>

        <Badge variant={isMotorOn ? 'purple' : 'neutral'} size="md">
          {isMotorOn ? 'ACTIVE' : 'OFF'}
        </Badge>
      </div>

      <div className="my-5 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-2">
        <div className="flex items-start gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong>Hardware Safety Lock:</strong> The physical ESP32 pin for this toy motor is not yet
            assigned in the base circuit (requires an external transistor or motor driver such as L298N).
          </p>
        </div>

        <label className="flex items-center gap-2 cursor-pointer pt-1 text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={isDriverConfigured}
            onChange={(e) => setIsDriverConfigured(e.target.checked)}
            className="rounded border-slate-400 text-purple-600 focus:ring-purple-500"
          />
          <span className="font-medium text-[11px]">
            I have attached a motor driver to ESP32 (Enable software commands)
          </span>
        </label>
      </div>

      <button
        onClick={handleToggleMotor}
        disabled={!isDriverConfigured || hasPendingCommand || loading}
        className={`w-full py-3.5 px-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-sm shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
          isMotorOn
            ? 'bg-rose-600 hover:bg-rose-500 text-white'
            : 'bg-purple-600 hover:bg-purple-500 text-white'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Power className="w-4 h-4" />
        )}
        <span>{isMotorOn ? 'Turn Motor OFF' : 'Turn Motor ON'}</span>
      </button>
    </div>
  );
}
