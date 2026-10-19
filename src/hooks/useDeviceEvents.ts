'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabaseClient, DEFAULT_DEVICE_ID } from '@/lib/supabase/client';
import { DeviceEvent } from '@/types/database.types';
import { EventFilterOptions } from '@/types/smartHome.types';
import { generateMockEvents } from '@/lib/supabase/mockData';
import { getISTDateParts } from '@/lib/utils/calculations';

export function useDeviceEvents(
  deviceId = DEFAULT_DEVICE_ID,
  isUsingMock = false
) {
  const [events, setEvents] = useState<DeviceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<EventFilterOptions>({
    device: 'all',
    eventType: 'all',
    timeRange: '7days',
    searchQuery: '',
  });

  // Fetch events from Supabase
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    const supabase = getSupabaseClient();

    if (!supabase || isUsingMock) {
      setEvents(generateMockEvents(deviceId));
      setIsLoading(false);
      return;
    }

    try {
      const query = supabase
        .from('device_events')
        .select('*')
        .eq('device_id', deviceId)
        .order('occurred_at', { ascending: false })
        .limit(200);

      const { data, error: err } = await query;

      if (err) {
        console.warn('Failed to load device_events from Supabase:', err.message);
        setError(err.message);
      } else if (data) {
        // ALWAYS use actual events from Supabase, even if empty or few records!
        setEvents(data as DeviceEvent[]);
        setError(null);
      }
    } catch (err: unknown) {
      console.warn('Network error fetching events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId, isUsingMock]);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    fetchEvents();

    const supabase = getSupabaseClient();
    if (!supabase || isUsingMock) return;

    const channel = supabase
      .channel(`device_events_${deviceId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'device_events',
          filter: `device_id=eq.${deviceId}`,
        },
        (payload) => {
          if (payload.new) {
            setEvents((prev) => [payload.new as DeviceEvent, ...prev]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deviceId, fetchEvents, isUsingMock]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // Device filter
      if (filters.device !== 'all' && ev.device !== filters.device) {
        return false;
      }

      // Event type filter
      if (filters.eventType !== 'all' && ev.event_type !== filters.eventType) {
        return false;
      }

      // Time range filter
      const evDate = new Date(ev.occurred_at);
      const now = new Date();

      if (filters.timeRange === 'today') {
        const evDateKey = getISTDateParts(evDate).dateKey;
        const nowDateKey = getISTDateParts(now).dateKey;
        if (evDateKey !== nowDateKey) return false;
      } else if (filters.timeRange === 'yesterday') {
        const evDateKey = getISTDateParts(evDate).dateKey;
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const yesterdayDateKey = getISTDateParts(yesterday).dateKey;
        if (evDateKey !== yesterdayDateKey) return false;
      } else if (filters.timeRange === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (evDate < sevenDaysAgo) return false;
      } else if (filters.timeRange === '30days') {
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (evDate < thirtyDaysAgo) return false;
      } else if (filters.timeRange === 'custom') {
        if (filters.startDate) {
          const s = new Date(filters.startDate);
          if (evDate < s) return false;
        }
        if (filters.endDate) {
          const e = new Date(filters.endDate);
          e.setHours(23, 59, 59, 999);
          if (evDate > e) return false;
        }
      }

      // Text search filter
      if (filters.searchQuery?.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchSource = ev.source?.toLowerCase().includes(q);
        const matchType = ev.event_type?.toLowerCase().includes(q);
        const matchDevice = ev.device?.toLowerCase().includes(q);
        const matchValue = String(ev.value).toLowerCase().includes(q);
        if (!matchSource && !matchType && !matchDevice && !matchValue) return false;
      }

      return true;
    });
  }, [events, filters]);

  // Unique event types available in current dataset
  const availableEventTypes = useMemo(() => {
    const set = new Set<string>();
    events.forEach((e) => {
      if (e.event_type) set.add(e.event_type);
    });
    return Array.from(set);
  }, [events]);

  return {
    events,
    filteredEvents,
    isLoading,
    error,
    filters,
    setFilters,
    availableEventTypes,
    refreshEvents: fetchEvents,
  };
}
