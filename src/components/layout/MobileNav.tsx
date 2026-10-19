'use client';

import React from 'react';
import { Sliders, BarChart3, Settings } from 'lucide-react';
import { TabType } from '@/types/smartHome.types';

interface MobileNavProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenEnergySettings: () => void;
}

export function MobileNav({
  currentTab,
  onTabChange,
  onOpenEnergySettings,
}: MobileNavProps) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => onTabChange('controls')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          currentTab === 'controls'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Sliders className="w-5 h-5" />
        <span className="text-[10px]">Controls</span>
      </button>

      <button
        onClick={() => onTabChange('usage')}
        className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
          currentTab === 'usage'
            ? 'text-blue-600 dark:text-blue-400 font-bold'
            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <BarChart3 className="w-5 h-5" />
        <span className="text-[10px]">Usage</span>
      </button>

      <button
        onClick={onOpenEnergySettings}
        className="flex flex-col items-center gap-1 py-1 px-4 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all"
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Tariffs</span>
      </button>
    </div>
  );
}
