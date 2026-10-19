'use client';

import React, { useState } from 'react';
import {
  ListFilter,
  Search,
  Download,
  Lightbulb,
  Fan,
  Cog,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { DeviceEvent } from '@/types/database.types';
import { EventFilterOptions } from '@/types/smartHome.types';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils/formatters';
import { TimeAgo } from '@/components/ui/TimeAgo';

interface DeviceEventHistoryProps {
  events: DeviceEvent[];
  filters: EventFilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<EventFilterOptions>>;
  availableEventTypes: string[];
  isLoading: boolean;
  onRefresh: () => void;
}

const ITEMS_PER_PAGE = 10;

export function DeviceEventHistory({
  events,
  filters,
  setFilters,
  availableEventTypes,
  isLoading,
  onRefresh,
}: DeviceEventHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(events.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = events.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Reset to page 1 when filter changes
  const handleFilterChange = (partial: Partial<EventFilterOptions>) => {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, ...partial }));
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (events.length === 0) return;

    const headers = ['ID', 'Device', 'Event Type', 'Value', 'Source', 'Occurred At'];
    const rows = events.map((e) => [
      e.id,
      e.device,
      e.event_type,
      e.value,
      e.source || 'unknown',
      `"${new Date(e.occurred_at).toLocaleString('en-IN')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smart_home_events_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Source badges
  const getSourceBadge = (source: string) => {
    const s = (source || '').toLowerCase();
    if (s === 'pir') return <Badge variant="success" size="sm">PIR Sensor</Badge>;
    if (s === 'timer') return <Badge variant="warning" size="sm">Timer</Badge>;
    if (s === 'mobile') return <Badge variant="info" size="sm">Mobile</Badge>;
    if (s === 'web') return <Badge variant="purple" size="sm">Web App</Badge>;
    return <Badge variant="neutral" size="sm">{source || 'ESP32'}</Badge>;
  };

  // Device icon helper
  const getDeviceIcon = (device: string) => {
    if (device === 'light') return <Lightbulb className="w-4 h-4 text-amber-500" />;
    if (device === 'fan') return <Fan className="w-4 h-4 text-cyan-500" />;
    return <Cog className="w-4 h-4 text-purple-500" />;
  };

  // Formatted state value
  const formatEventValue = (event: DeviceEvent) => {
    if (event.device === 'light') {
      const isTurnedOn = String(event.value) === '1' || String(event.value) === 'true';
      return (
        <span
          className={`font-semibold ${
            isTurnedOn ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
          }`}
        >
          {isTurnedOn ? 'State: ON' : 'State: OFF'}
        </span>
      );
    }
    if (event.device === 'fan') {
      const pwm = Number(event.value);
      if (pwm <= 0) return <span className="text-slate-500 font-semibold">Speed: OFF (0 PWM)</span>;
      if (pwm <= 100) return <span className="text-emerald-500 font-semibold">Speed 1 (PWM {pwm})</span>;
      if (pwm <= 180) return <span className="text-blue-500 font-semibold">Speed 2 (PWM {pwm})</span>;
      return <span className="text-cyan-500 font-semibold">Speed 3 (PWM {pwm})</span>;
    }
    return <span className="font-mono text-slate-600 dark:text-slate-300">Val: {event.value}</span>;
  };

  return (
    <div className="w-full min-w-0 max-w-full rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#070b14]/90 border border-slate-200/80 dark:border-cyan-500/20 p-3 sm:p-6 shadow-sm dark:shadow-[0_4px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl transition-colors overflow-hidden">
      {/* Table Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-200/80 dark:border-slate-800 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_10px_#06b6d4] shrink-0" />
              <span>Telemetry Event Stream</span>
            </h3>
            <span className="text-[11px] text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono font-semibold shrink-0">
              {events.length} logs
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 break-words">
            Real hardware state transitions and sensor signals logged to Supabase in IST
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-600 dark:text-cyan-400' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={events.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:opacity-95 text-xs font-bold shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Futuristic One-Tap Quick Filter Chips (Responsive 4-col Grid on Mobile, Flex on Desktop) */}
      <div className="grid grid-cols-4 sm:flex items-center gap-1 sm:gap-2 py-3 border-b border-slate-100 dark:border-slate-800/50 w-full min-w-0">
        {[
          { id: 'all', label: 'All Telemetry', shortLabel: 'All', icon: null },
          { id: 'light', label: 'Smart Light', shortLabel: 'Light', icon: Lightbulb },
          { id: 'fan', label: 'Ceiling Fan', shortLabel: 'Fan', icon: Fan },
          { id: 'motor', label: 'Toy Motor', shortLabel: 'Motor', icon: Cog },
        ].map((chip) => {
          const Icon = chip.icon;
          const isSelected = filters.device === chip.id;
          return (
            <button
              key={chip.id}
              onClick={() => handleFilterChange({ device: chip.id as any })}
              className={`flex items-center justify-center gap-1 sm:gap-1.5 px-1 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer min-w-0 truncate ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 font-bold scale-[1.01]'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900/80 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              {Icon && <Icon className={`w-3 h-3 shrink-0 ${isSelected ? 'text-white' : 'text-slate-500'}`} />}
              <span className="sm:hidden truncate">{chip.shortLabel}</span>
              <span className="hidden sm:inline whitespace-nowrap">{chip.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 my-3.5 w-full min-w-0">
        {/* Search */}
        <div className="relative w-full min-w-0">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Search source or value..."
            value={filters.searchQuery || ''}
            onChange={(e) => handleFilterChange({ searchQuery: e.target.value })}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        {/* Date Range Filter */}
        <select
          value={filters.timeRange}
          onChange={(e) => handleFilterChange({ timeRange: e.target.value as any })}
          className="w-full min-w-0 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white"
        >
          <option value="today">Today (IST)</option>
          <option value="yesterday">Yesterday (IST)</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
        </select>

        {/* Event Type Filter */}
        <select
          value={filters.eventType}
          onChange={(e) => handleFilterChange({ eventType: e.target.value })}
          className="w-full min-w-0 px-3 py-2 text-xs bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white sm:col-span-2 lg:col-span-1"
        >
          <option value="all">All Event Types</option>
          {availableEventTypes.map((type) => (
            <option key={type} value={type}>
              {type.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      {/* MOBILE PERSPECTIVE VIEW: Futuristic Cyber Event Feed (Visible on < md) */}
      <div className="block md:hidden space-y-2.5 w-full min-w-0">
        {paginatedEvents.length === 0 ? (
          <div className="py-10 text-center text-slate-500 dark:text-slate-400 text-xs bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-slate-800">
            No matching events found for the selected filters.
          </div>
        ) : (
          paginatedEvents.map((ev) => (
            <div
              key={ev.id}
              className={`p-3 rounded-2xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800 hover:border-cyan-500/40 transition-all space-y-2 shadow-sm dark:shadow-md relative overflow-hidden w-full min-w-0 ${
                ev.device === 'light'
                  ? 'border-l-4 border-l-amber-500'
                  : ev.device === 'fan'
                  ? 'border-l-4 border-l-cyan-500'
                  : 'border-l-4 border-l-purple-500'
              }`}
            >
              {/* Top Row: Device icon + Device name + Event type tag + Source badge */}
              <div className="flex items-center justify-between gap-1.5 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                  <div className="p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
                    {getDeviceIcon(ev.device)}
                  </div>
                  <span className="font-extrabold text-xs capitalize text-slate-900 dark:text-white tracking-wide shrink-0">
                    {ev.device}
                  </span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-800 truncate">
                    {ev.event_type}
                  </span>
                </div>
                <div className="shrink-0">
                  {getSourceBadge(ev.source)}
                </div>
              </div>

              {/* Bottom Row: State Value + Occurred At Timestamp (IST) */}
              <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-slate-200/70 dark:border-slate-800/80 min-w-0">
                <div className="font-medium text-slate-800 dark:text-slate-200 min-w-0 flex-1 truncate">
                  {formatEventValue(ev)}
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono text-[10px] sm:text-[11px] text-cyan-600 dark:text-cyan-300 font-semibold whitespace-nowrap" suppressHydrationWarning>
                    {formatDateTime(ev.occurred_at)}
                  </div>
                  <TimeAgo date={ev.occurred_at} className="block text-[9px] text-slate-500 dark:text-slate-400" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DESKTOP VIEW: Full 5-Column Table (Hidden on Mobile) */}
      <div className="hidden md:block overflow-x-auto w-full min-w-0">
        <table className="w-full text-left text-xs min-w-[600px]">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-3">Device</th>
              <th className="py-3 px-3">Event Type</th>
              <th className="py-3 px-3">State / Value</th>
              <th className="py-3 px-3">Source</th>
              <th className="py-3 px-3">Timestamp (IST)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
            {paginatedEvents.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                  No matching events found for the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white capitalize">
                      {getDeviceIcon(ev.device)}
                      <span>{ev.device}</span>
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-cyan-600 dark:text-cyan-300 font-semibold">
                      {ev.event_type}
                    </span>
                  </td>
                  <td className="py-3 px-3">{formatEventValue(ev)}</td>
                  <td className="py-3 px-3">{getSourceBadge(ev.source)}</td>
                  <td className="py-3 px-3">
                    <div className="text-slate-800 dark:text-slate-200 font-mono" suppressHydrationWarning>
                      {formatDateTime(ev.occurred_at)}
                    </div>
                    <TimeAgo date={ev.occurred_at} className="block text-[10px] text-slate-500 dark:text-slate-400" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 mt-2 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 w-full min-w-0">
        <div className="truncate">
          Showing {events.length === 0 ? 0 : startIndex + 1} to{' '}
          {Math.min(startIndex + ITEMS_PER_PAGE, events.length)} of {events.length} events
        </div>

        <div className="flex items-center gap-2 self-center sm:self-auto shrink-0">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-white cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
            Prev
          </button>
          <span className="px-2 font-mono text-cyan-600 dark:text-cyan-400 font-bold">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none text-slate-700 dark:text-white cursor-pointer shadow-sm"
          >
            Next
            <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
}
