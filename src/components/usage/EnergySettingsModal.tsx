'use client';

import React, { useState } from 'react';
import { X, Settings2, Sliders, IndianRupee, Save, RotateCcw, AlertTriangle } from 'lucide-react';
import { EnergySettings } from '@/types/smartHome.types';
import { DEFAULT_ENERGY_SETTINGS } from '@/lib/utils/calculations';

interface EnergySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: EnergySettings;
  onSave: (newSettings: EnergySettings) => void;
}

export function EnergySettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: EnergySettingsModalProps) {
  const [formData, setFormData] = useState<EnergySettings>(settings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    setFormData(DEFAULT_ENERGY_SETTINGS);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Settings2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white">
                Energy Estimation Settings
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure device power consumption & local power tariffs
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

        {/* Disclaimer Notice */}
        <div className="my-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>
            <strong>Estimated Values Notice:</strong> These figures are calculated mathematically
            using operating durations and configured ratings. They are not direct hardware current sensor readings.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Light Wattage */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Smart Light Power Rating (Watts)
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="500"
              value={formData.lightWattage}
              onChange={(e) =>
                setFormData({ ...formData, lightWattage: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
            />
            <p className="text-[11px] text-slate-400 mt-1">Default 10W for standard LED lamp.</p>
          </div>

          {/* Fan Speed Wattages */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Fan Power by Speed Level (Watts)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase">Speed 1 (Low)</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="300"
                  value={formData.fanSpeed1Wattage}
                  onChange={(e) =>
                    setFormData({ ...formData, fanSpeed1Wattage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Speed 2 (Med)</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="300"
                  value={formData.fanSpeed2Wattage}
                  onChange={(e) =>
                    setFormData({ ...formData, fanSpeed2Wattage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase">Speed 3 (High)</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  max="300"
                  value={formData.fanSpeed3Wattage}
                  onChange={(e) =>
                    setFormData({ ...formData, fanSpeed3Wattage: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Electricity Tariff (INR / kWh) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Electricity Tariff (INR ₹ per kWh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs text-slate-400">₹</span>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="50"
                value={formData.electricityTariffINR}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    electricityTariffINR: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-7 pr-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Standard Indian domestic electricity tariff (default ₹7.50 / unit).
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Settings</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
