'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useDeviceState } from '@/hooks/useDeviceState';
import { useDeviceCommands } from '@/hooks/useDeviceCommands';
import { useDeviceEvents } from '@/hooks/useDeviceEvents';
import { calculateUsageSummary, DEFAULT_ENERGY_SETTINGS } from '@/lib/utils/calculations';
import { EnergySettings, TabType, ToastMessage } from '@/types/smartHome.types';
import { getSupabaseClient, DEFAULT_DEVICE_ID } from '@/lib/supabase/client';
import { generateMockEvents, INITIAL_MOCK_STATE } from '@/lib/supabase/mockData';

// Components
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { CredentialsModal } from '@/components/layout/CredentialsModal';
import { ToastContainer } from '@/components/ui/Toast';

// Controls components
import { LightControlCard } from '@/components/controls/LightControlCard';
import { FanControlCard } from '@/components/controls/FanControlCard';

// Usage components
import { UsageSummaryCards } from '@/components/usage/UsageSummaryCards';
import { UsageDurationChart } from '@/components/usage/UsageDurationChart';
import { EnergyCostChart } from '@/components/usage/EnergyCostChart';
import { DeviceEventHistory } from '@/components/usage/DeviceEventHistory';
import { EnergySettingsModal } from '@/components/usage/EnergySettingsModal';
import { VoiceControlModal } from '@/components/voice/VoiceControlModal';

import { Sliders, BarChart3, ShieldCheck, Sparkles, AlertCircle, Mic } from 'lucide-react';

export default function SmartHomePage() {
  const { theme, toggleTheme, isDark, mounted } = useTheme();

  // Active Device ID state (defaults to esp32-home-01)
  const [deviceId, setDeviceId] = useState<string>(DEFAULT_DEVICE_ID);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('supabase_device_id');
      if (stored) setDeviceId(stored);
    }
  }, []);

  // UI state
  const [currentTab, setCurrentTab] = useState<TabType>('controls');
  const [isEnergySettingsOpen, setIsEnergySettingsOpen] = useState(false);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  const [isVoiceControlOpen, setIsVoiceControlOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message: string) => {
      const id = `${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, message, timestamp: Date.now() }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Energy settings state
  const [energySettings, setEnergySettings] = useState<EnergySettings>(DEFAULT_ENERGY_SETTINGS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('smart_home_energy_settings');
      if (saved) {
        try {
          setEnergySettings(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse saved energy settings', e);
        }
      }
    }
  }, []);

  const handleSaveEnergySettings = (newSettings: EnergySettings) => {
    setEnergySettings(newSettings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_home_energy_settings', JSON.stringify(newSettings));
    }
    addToast('success', 'Energy Settings Updated', 'Wattage ratings and electricity tariffs saved.');
  };

  // Device hooks
  const {
    state,
    isLoading: isStateLoading,
    isOnline,
    lastSeenSeconds,
    lastSyncTime,
    isUsingMock,
    lightCountdown,
    fanCountdown,
    refresh: refreshState,
    setLocalMockState,
  } = useDeviceState(deviceId);

  const {
    sendCommand,
    pendingCommands,
    hasPendingLight,
    hasPendingFan,
  } = useDeviceCommands(deviceId, isUsingMock, setLocalMockState);

  const {
    events,
    filteredEvents,
    isLoading: isEventsLoading,
    filters,
    setFilters,
    availableEventTypes,
    refreshEvents,
  } = useDeviceEvents(deviceId, isUsingMock);

  const [clientNow, setClientNow] = useState<Date | null>(null);

  useEffect(() => {
    setClientNow(new Date());
    const interval = setInterval(() => setClientNow(new Date()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Calculate comprehensive usage summary
  const usageSummary = useMemo(() => {
    return calculateUsageSummary(
      events,
      state,
      energySettings,
      clientNow || undefined
    );
  }, [events, state, energySettings, clientNow]);

  // Command dispatcher with toast notifications
  const handleSendCommand = async (params: {
    device: 'light' | 'fan' | 'motor';
    action: any;
    value?: number | string;
    duration_seconds?: number;
    timer_action?: 'on' | 'off';
  }) => {
    addToast(
      'pending',
      'Sending Command',
      `Queueing ${params.device.toUpperCase()} ${params.action} for ESP32...`
    );

    const result = await sendCommand(params);

    if (result.success) {
      if (params.action === 'set_timer') {
        addToast(
          'success',
          'Timer Armed',
          `${params.device === 'light' ? 'Light' : 'Fan'} will turn ${params.timer_action?.toUpperCase()} in ${params.duration_seconds}s.`
        );
      } else {
        addToast(
          'success',
          'Command Acknowledged',
          `${params.device.toUpperCase()} switched to ${params.action} (Val: ${params.value ?? 0}).`
        );
      }
      return { success: true };
    } else {
      addToast(
        'error',
        'Command Failed',
        result.error || 'Unable to deliver command to Supabase database.'
      );
      return { success: false, error: result.error };
    }
  };

  const handleCancelTimer = async (device: 'light' | 'fan') => {
    addToast('pending', 'Canceling Timer', `Clearing scheduled timer for ${device.toUpperCase()}...`);
    const result = await handleSendCommand({
      device,
      action: 'set_timer',
      duration_seconds: 0,
      timer_action: 'off',
    });
    if (result.success) {
      addToast('success', 'Timer Cleared', `${device === 'light' ? 'Light' : 'Fan'} timer was deleted.`);
    }
  };

  // Save Supabase credentials from modal
  const handleSaveCredentials = (newUrl: string, newKey: string, newDevId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('supabase_url', newUrl);
      localStorage.setItem('supabase_anon_key', newKey);
      localStorage.setItem('supabase_device_id', newDevId);
      setDeviceId(newDevId);
    }
    refreshState();
    refreshEvents();
    addToast('success', 'Configuration Updated', 'Connecting to Supabase PostgreSQL...');
  };

  // Seed demo data to Supabase
  const handleSeedData = async () => {
    setIsSeeding(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      addToast(
        'error',
        'Supabase Not Configured',
        'Please enter your Supabase URL & Anon Key in the modal above first.'
      );
      setIsSeeding(false);
      return;
    }

    try {
      // Upsert device_state
      await supabase.from('device_state').upsert({
        device_id: deviceId,
        light_on: false,
        eco_mode: true,
        fan_speed: 150,
        motor_on: false,
        updated_at: new Date().toISOString(),
      });

      // Insert mock events
      const mockEvents = generateMockEvents(deviceId).slice(0, 30);
      const rowsToInsert = mockEvents.map((e) => ({
        device_id: deviceId,
        device: e.device,
        event_type: e.event_type,
        value: typeof e.value === 'number' ? e.value : parseFloat(String(e.value)) || 0,
        source: e.source,
        occurred_at: e.occurred_at,
        created_at: e.created_at,
      }));

      const { error: seedErr } = await supabase.from('device_events').insert(rowsToInsert);

      if (seedErr) {
        throw seedErr;
      }

      addToast('success', 'Demo Data Seeded', 'Uploaded realistic event history and initial device state.');
      refreshEvents();
      refreshState();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to seed database';
      addToast('error', 'Seeding Error', msg);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleRefreshAll = () => {
    refreshState();
    refreshEvents();
    addToast('info', 'Synchronizing', 'Fetched latest state and history from Supabase.');
  };
  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 transition-colors duration-200 cyber-grid relative">
      {/* Futuristic Ambient Glow Background Orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-1/4 right-10 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-2/3 left-10 w-80 h-80 bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header with Integrated Top-Nav Tab Switcher */}
      <Header
        deviceId={deviceId}
        isOnline={isOnline}
        lastSeenSeconds={lastSeenSeconds}
        lastSyncTime={lastSyncTime}
        isUsingMock={isUsingMock}
        theme={theme}
        onToggleTheme={toggleTheme}
        onRefresh={handleRefreshAll}
        isLoading={isStateLoading || isEventsLoading}
        onOpenCredentialsModal={() => setIsCredentialsOpen(true)}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        onOpenEnergySettings={() => setIsEnergySettingsOpen(true)}
        onOpenVoiceControl={() => setIsVoiceControlOpen(true)}
      />

      {/* Main Container */}
      <div className="flex w-full min-w-0 max-w-full">
        {/* Desktop Left Sidebar (Synced with Top Nav) */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onOpenEnergySettings={() => setIsEnergySettingsOpen(true)}
          onOpenCredentials={() => setIsCredentialsOpen(true)}
          isOnline={isOnline}
          pendingCount={pendingCommands.length}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

        {/* Content Area */}
        <main className="flex-1 w-full min-w-0 max-w-7xl mx-auto p-3 sm:p-6 lg:p-8 pb-12 overflow-x-hidden">
          {/* Demo Mode Notice Banner if using mock */}
          {isUsingMock && (
            <div className="mb-3 sm:mb-6 p-2.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 shadow-sm min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/20 text-amber-500 shrink-0">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 truncate">
                    Running in Local Demo / Offline Mode
                  </h4>
                  <p className="text-[10px] sm:text-xs text-amber-700/80 dark:text-amber-300/70 mt-0.5 break-words">
                    Connect your Supabase database anytime for live ESP32 sync.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCredentialsOpen(true)}
                className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] sm:text-xs font-bold transition-all shadow-md cursor-pointer whitespace-nowrap shrink-0 self-end sm:self-auto"
              >
                Configure Supabase
              </button>
            </div>
          )}

          {/* Pending Command Tracker Strip */}
          {pendingCommands.length > 0 && (
            <div className="mb-3 sm:mb-6 p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 animate-pulse min-w-0">
              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate text-[11px] sm:text-xs">
                  <strong>{pendingCommands.length} command(s) pending:</strong>{' '}
                  {pendingCommands.map((c) => `${c.device} (${c.action})`).join(', ')}
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] opacity-80 shrink-0 ml-2 hidden xs:inline">Awaiting ESP32 ack</span>
            </div>
          )}

          {/* TAB 1: CONTROLS */}
          {currentTab === 'controls' && (
            <div className="w-full min-w-0 max-w-full space-y-3 sm:space-y-6">
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800 min-w-0">
                <div className="min-w-0">
                  <h2 className="text-base sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="text-blue-500 shrink-0">⚡</span>
                    <span className="truncate">Hardware Remote Controls</span>
                  </h2>
                  <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                    Real-time smart lighting, PWM speed regulator, PIR motion hold, and hardware timers
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs shrink-0">
                  <span className="text-slate-500 hidden sm:inline">Target Node:</span>
                  <span className="font-mono font-bold text-cyan-500 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg sm:rounded-xl border border-cyan-500/30">
                    {deviceId}
                  </span>
                </div>
              </div>

              {/* Grid of Control Cards (Smart Light & Ceiling Fan) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 w-full min-w-0">
                {/* 1. Light Control Card */}
                <LightControlCard
                  state={state}
                  hasPendingCommand={hasPendingLight}
                  onCommand={handleSendCommand}
                  isOnline={isOnline}
                  lightCountdown={lightCountdown}
                />

                {/* 2. Fan Control Card */}
                <FanControlCard
                  state={state}
                  hasPendingCommand={hasPendingFan}
                  onCommand={handleSendCommand}
                  isOnline={isOnline}
                  fanCountdown={fanCountdown}
                />
              </div>
            </div>
          )}

          {/* TAB 2: USAGE ANALYTICS */}
          {currentTab === 'usage' && (
            <div className="w-full min-w-0 max-w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800 min-w-0">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="text-cyan-400 shrink-0">📊</span>
                    <span className="truncate">Power Consumption & Usage</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                    Operating runtimes, daily kWh metrics, and electricity cost breakdown in IST
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setCurrentTab('history')}
                    className="px-3 py-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-xs font-semibold text-cyan-700 dark:text-cyan-300 transition-colors cursor-pointer"
                  >
                    View Event Logs →
                  </button>
                  <button
                    onClick={() => setIsEnergySettingsOpen(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  >
                    Tariffs & Rates
                  </button>
                </div>
              </div>

              {/* A. Summary Cards */}
              <UsageSummaryCards
                summary={usageSummary}
                onOpenSettings={() => setIsEnergySettingsOpen(true)}
              />

              {/* B. Daily Runtime Chart */}
              <UsageDurationChart data={usageSummary.dailyMetrics} />

              {/* C. Energy & Cost Chart + Speed Breakdown */}
              <EnergyCostChart
                data={usageSummary.dailyMetrics}
                summary={usageSummary}
              />
            </div>
          )}

          {/* TAB 3: EVENT HISTORY STREAM */}
          {currentTab === 'history' && (
            <div className="w-full min-w-0 max-w-full space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80 dark:border-slate-800 min-w-0">
                <div className="min-w-0">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                    <span className="text-purple-500 shrink-0">📜</span>
                    <span className="truncate">Hardware Telemetry History</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
                    Live stream of physical device events logged to Supabase PostgreSQL
                  </p>
                </div>

                <button
                  onClick={() => setCurrentTab('usage')}
                  className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                >
                  ← Back to Analytics
                </button>
              </div>

              {/* Event History Stream (Futuristic Cyber Feed on Mobile, Table on Desktop) */}
              <DeviceEventHistory
                events={filteredEvents}
                filters={filters}
                setFilters={setFilters}
                availableEventTypes={availableEventTypes}
                isLoading={isEventsLoading}
                onRefresh={refreshEvents}
              />
            </div>
          )}
        </main>
      </div>

      {/* Energy Settings Modal */}
      <EnergySettingsModal
        isOpen={isEnergySettingsOpen}
        onClose={() => setIsEnergySettingsOpen(false)}
        settings={energySettings}
        onSave={handleSaveEnergySettings}
      />

      {/* Supabase Credentials & Seed Modal */}
      <CredentialsModal
        isOpen={isCredentialsOpen}
        onClose={() => setIsCredentialsOpen(false)}
        onSaveCredentials={handleSaveCredentials}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Futuristic Voice Control Assistant Modal */}
      <VoiceControlModal
        isOpen={isVoiceControlOpen}
        onClose={() => setIsVoiceControlOpen(false)}
        onExecuteCommand={handleSendCommand}
        onCancelTimer={handleCancelTimer}
        lightOn={state.light_on}
        fanSpeed={state.fan_speed}
      />

      {/* Floating Futuristic Cyber Voice Assistant Trigger Button */}
      <button
        onClick={() => setIsVoiceControlOpen(true)}
        title="Open Voice Assistant (LED & Fan Control)"
        aria-label="Open Voice Assistant"
        className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-30 group p-3.5 sm:p-4 rounded-full bg-gradient-to-tr from-cyan-600 via-indigo-600 to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.6)] hover:shadow-[0_0_35px_rgba(6,182,212,0.9)] hover:scale-105 active:scale-95 transition-all duration-300 border border-cyan-300/50 flex items-center justify-center cursor-pointer"
      >
        <Mic className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-transform" />
        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#040711] animate-ping" />
        <span className="sr-only">Voice Assistant</span>
      </button>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
