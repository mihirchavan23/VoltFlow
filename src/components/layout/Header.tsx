'use client';

import React from 'react';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Sun,
  Moon,
  Database,
  Sliders,
  BarChart3,
  History,
  Settings,
  Zap,
  Mic,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { TabType } from '@/types/smartHome.types';
import { useAuth } from '@/lib/auth/authContext';

interface HeaderProps {
  deviceId: string;
  isOnline: boolean;
  lastSeenSeconds: number;
  lastSyncTime: Date | null;
  isUsingMock: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  onOpenCredentialsModal: () => void;
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  onOpenEnergySettings?: () => void;
  onOpenVoiceControl?: () => void;
}

export function Header({
  deviceId,
  isOnline,
  lastSeenSeconds,
  lastSyncTime,
  isUsingMock,
  theme,
  onToggleTheme,
  onRefresh,
  isLoading,
  onOpenCredentialsModal,
  currentTab,
  onTabChange,
  onOpenEnergySettings,
  onOpenVoiceControl,
}: HeaderProps) {
  const { user, logout } = useAuth();

  const tabs = [
    {
      id: 'controls' as TabType,
      label: 'Controls',
      icon: Sliders,
      badge: null,
    },
    {
      id: 'usage' as TabType,
      label: 'Usage',
      icon: BarChart3,
      badge: 'kWh',
    },
    {
      id: 'history' as TabType,
      label: 'History',
      icon: History,
      badge: 'Live',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#070b14]/95 backdrop-blur-2xl border-b border-slate-200/80 dark:border-cyan-500/20 shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        {/* ROW 1: Branding, Gateway Status, and Control Buttons */}
        <div className="h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Brand & Hardware Gateway Status */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 flex items-center justify-center text-white shadow-[0_0_15px_rgba(6,182,212,0.45)] shrink-0">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white text-white" />
              {isOnline && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 animate-pulse" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 dark:from-cyan-400 dark:via-blue-300 dark:to-indigo-200">
                  VoltFlow
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/60 truncate max-w-[90px] sm:max-w-none">
                  {deviceId}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-mono font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping" />
                    LIVE IST
                  </span>
                ) : (
                  <span className="text-rose-500 dark:text-rose-400 font-mono">
                    OFFLINE ({lastSeenSeconds > 60 ? `${Math.floor(lastSeenSeconds / 60)}m` : `${lastSeenSeconds}s`})
                  </span>
                )}
                <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                <span className="hidden sm:inline">
                  {isOnline ? 'ESP32 Gateway active' : 'Awaiting heartbeat'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Tariffs, Sync, Theme, Supabase Link */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Supabase status badge */}
            <button
              onClick={onOpenCredentialsModal}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border text-[11px] font-medium transition-all cursor-pointer ${
                isUsingMock
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
                  : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
              }`}
              title="Click to check Supabase Database connection & keys"
            >
              <Database className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isUsingMock ? 'Demo Mode' : 'Supabase'}</span>
            </button>

            {/* Futuristic Voice Assistant Button */}
            {onOpenVoiceControl && (
              <button
                onClick={onOpenVoiceControl}
                title="Voice Assistant: speak to control smart LED & ceiling fan"
                className="relative flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-xl border border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-indigo-500/15 hover:from-cyan-500/25 hover:via-blue-500/25 hover:to-indigo-500/25 text-cyan-700 dark:text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:shadow-[0_0_18px_rgba(6,182,212,0.4)] text-[11px] font-bold tracking-wide transition-all cursor-pointer"
              >
                <Mic className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400 animate-pulse" />
                <span className="hidden xs:inline">Voice AI</span>
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              </button>
            )}

            {/* Tariffs settings button */}
            {onOpenEnergySettings && (
              <button
                onClick={onOpenEnergySettings}
                title="Energy tariffs & wattage ratings"
                className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700/70 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-sm"
              >
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400" />
              </button>
            )}

            {/* Force Sync button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title="Force sync database state and history"
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700/70 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
                  isLoading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''
                }`}
              />
            </button>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              className="p-1.5 sm:p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 dark:border-slate-700/70 dark:text-slate-300 dark:hover:text-white transition-all cursor-pointer shadow-sm"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]" />
              ) : (
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 drop-shadow-[0_0_6px_rgba(6,182,212,0.5)]" />
              )}
            </button>

            {/* Authenticated User & Logout */}
            {user && (
              <div className="flex items-center gap-1.5 pl-1 border-l border-slate-200 dark:border-slate-800">
                <div
                  className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs"
                  title={`Signed in as ${user.name} (${user.email})`}
                >
                  <UserCheck className="w-3.5 h-3.5 text-cyan-500" />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">
                    {user.username}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-1 rounded uppercase font-bold ${
                      user.role === 'admin'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                        : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                <button
                  onClick={logout}
                  title="Sign Out from VoltFlow"
                  className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden lg:inline text-[11px] font-semibold">Exit</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ROW 2: PROMINENT TOP-NAV SEGMENTED TAB SWITCHER (Futuristic HUD Navigation) */}
        <div className="pb-2.5 pt-1">
          <nav
            aria-label="Dashboard views"
            className="w-full flex items-center justify-between p-1 rounded-2xl bg-slate-100/90 dark:bg-[#040711]/90 border border-slate-200/90 dark:border-cyan-500/20 shadow-inner backdrop-blur-xl"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.45)] border border-cyan-300/40 font-bold scale-[1.01]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`hidden sm:inline-block text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-cyan-400/30 text-white border border-cyan-200/40'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
