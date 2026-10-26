'use client';

import React from 'react';
import { Sliders, BarChart3, History, Settings, Shield, Flame, Activity, Sun, Moon } from 'lucide-react';
import { TabType } from '@/types/smartHome.types';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenEnergySettings: () => void;
  onOpenCredentials: () => void;
  isOnline: boolean;
  pendingCount: number;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
}

export function Sidebar({
  currentTab,
  onTabChange,
  onOpenEnergySettings,
  onOpenCredentials,
  isOnline,
  pendingCount,
  theme,
  onToggleTheme,
}: SidebarProps) {
  const navItems = [
    {
      id: 'controls' as TabType,
      label: 'Controls',
      description: 'Device state & timers',
      icon: Sliders,
    },
    {
      id: 'usage' as TabType,
      label: 'Usage Analytics',
      description: 'Power metrics & kWh',
      icon: BarChart3,
    },
    {
      id: 'history' as TabType,
      label: 'Event History',
      description: 'Realtime log stream',
      icon: History,
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 bg-white/80 dark:bg-[#070b14]/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-cyan-500/20 p-5 min-h-[calc(100vh-4rem)] justify-between transition-colors shadow-sm dark:shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="space-y-6">
        {/* Brand Banner */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_18px_rgba(6,182,212,0.45)]">
            <Flame className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-base bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 dark:from-cyan-400 dark:via-blue-300 dark:to-indigo-200 leading-tight tracking-tight">
              VoltFlow
            </h1>
            <p className="text-[10px] font-mono font-bold text-cyan-600 dark:text-cyan-400/80 tracking-widest uppercase">
              CYBER IOE v2.4
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] border border-cyan-300/40 font-bold scale-[1.02]'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div className="flex-1">
                  <div className="text-sm leading-none">{item.label}</div>
                  <div className={`text-[10px] mt-1 ${isActive ? 'text-cyan-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Quick Settings links */}
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
          <button
            onClick={onOpenEnergySettings}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Energy Tariffs & Wattages</span>
          </button>

          <button
            onClick={onOpenCredentials}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <Shield className="w-4 h-4 text-slate-400" />
            <span>Database & Hardware Setup</span>
          </button>

          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-500" />
                ) : (
                  <Moon className="w-4 h-4 text-cyan-600" />
                )}
                <span>Theme: {theme === 'dark' ? 'Dark Futuristic' : 'Clean Light'}</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                {theme}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300">ESP32 Gateway</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-rose-500'
            }`}
          />
        </div>
        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Model: ESP32-WROOM-32
        </div>
        {pendingCount > 0 && (
          <div className="mt-2 text-[10px] text-amber-500 font-medium">
            ⏳ {pendingCount} command(s) pending execution
          </div>
        )}
      </div>
    </aside>
  );
}
