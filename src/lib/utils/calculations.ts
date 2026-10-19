import { DeviceEvent, DeviceState } from '@/types/database.types';
import {
  DayUsageMetrics,
  DeviceUsageSummary,
  EnergySettings,
  UsageInterval,
} from '@/types/smartHome.types';

// Default energy settings
export const DEFAULT_ENERGY_SETTINGS: EnergySettings = {
  lightWattage: 10, // 10W LED bulb
  fanSpeed1Wattage: 25, // Speed 1: ~25W
  fanSpeed2Wattage: 45, // Speed 2: ~45W
  fanSpeed3Wattage: 70, // Speed 3: ~70W
  electricityTariffINR: 7.5, // ₹7.50 / kWh
};

/**
 * Checks if a light event is an "ON" event.
 */
function isLightOn(event: DeviceEvent): boolean {
  if (event.device !== 'light') return false;
  const val = String(event.value).toLowerCase();
  const type = String(event.event_type).toLowerCase();
  return (
    val === '1' ||
    val === 'true' ||
    val === 'on' ||
    type === 'turned_on' ||
    type === 'motion_on'
  );
}

/**
 * Checks if a light event is an "OFF" event.
 */
function isLightOff(event: DeviceEvent): boolean {
  if (event.device !== 'light') return false;
  const val = String(event.value).toLowerCase();
  const type = String(event.event_type).toLowerCase();
  return (
    val === '0' ||
    val === 'false' ||
    val === 'off' ||
    type === 'turned_off' ||
    type === 'motion_off' ||
    type === 'timer_off'
  );
}

/**
 * Parses fan speed/PWM from an event. 0 is OFF, >0 is ON.
 */
function getFanPwm(event: DeviceEvent): number {
  if (event.device !== 'fan') return 0;
  const val = Number(event.value);
  if (!isNaN(val)) return Math.max(0, Math.min(255, val));
  const str = String(event.value).toLowerCase();
  if (str === 'off' || str === '0') return 0;
  if (str === '1' || str === 'low') return 80;
  if (str === '2' || str === 'med') return 150;
  if (str === '3' || str === 'high') return 255;
  return 0;
}

/**
 * Safe cap for an open interval without an explicit OFF event (e.g. max 12 hours)
 */
const MAX_UNCLOSED_INTERVAL_MS = 12 * 60 * 60 * 1000;

/**
 * Helper to extract year, month, date, and dateKey in Indian Standard Time (IST / Asia/Kolkata).
 */
export function getISTDateParts(d: Date): { year: number; month: number; date: number; dateKey: string } {
  const formatter = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(d);
  const year = parseInt(parts.find((p) => p.type === 'year')?.value || '2026', 10);
  const month = parseInt(parts.find((p) => p.type === 'month')?.value || '1', 10) - 1; // 0-indexed
  const date = parseInt(parts.find((p) => p.type === 'day')?.value || '1', 10);
  const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
  return { year, month, date, dateKey };
}

/**
 * Reconstructs chronological usage intervals for a specific device from events and current state.
 */
export function calculateDeviceIntervals(
  events: DeviceEvent[],
  device: 'light' | 'fan',
  currentState?: DeviceState,
  referenceNow?: Date
): UsageInterval[] {
  const refTime =
    referenceNow ||
    (typeof window !== 'undefined' ? new Date() : new Date('2026-10-19T00:00:00.000Z'));
  const deviceEvents = events
    .filter((e) => e.device === device)
    .sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());

  const intervals: UsageInterval[] = [];

  if (device === 'light') {
    let currentOnStart: Date | null = null;
    let currentSource = 'unknown';

    for (const ev of deviceEvents) {
      const evTime = new Date(ev.occurred_at);

      if (isLightOn(ev)) {
        if (!currentOnStart) {
          currentOnStart = evTime;
          currentSource = ev.source || 'web';
        }
      } else if (isLightOff(ev)) {
        if (currentOnStart) {
          const diffMs = evTime.getTime() - currentOnStart.getTime();
          if (diffMs > 0 && diffMs <= MAX_UNCLOSED_INTERVAL_MS) {
            intervals.push({
              device: 'light',
              start: currentOnStart,
              end: evTime,
              durationSeconds: Math.floor(diffMs / 1000),
              source: currentSource,
              isOngoing: false,
            });
          }
          currentOnStart = null;
        }
      }
    }

    // Check ongoing interval if device_state reports light_on = true OR last event was ON
    const isCurrentlyOn = currentState?.light_on === true || currentOnStart !== null;
    if (isCurrentlyOn) {
      const startTime =
        currentOnStart ||
        (currentState?.updated_at ? new Date(currentState.updated_at) : refTime);
      const diffMs = Math.min(
        Math.max(0, refTime.getTime() - startTime.getTime()),
        MAX_UNCLOSED_INTERVAL_MS
      );
      if (diffMs > 0) {
        intervals.push({
          device: 'light',
          start: startTime,
          end: refTime,
          durationSeconds: Math.floor(diffMs / 1000),
          source: currentSource !== 'unknown' ? currentSource : 'state',
          isOngoing: true,
        });
      }
    }
  } else if (device === 'fan') {
    let currentOnStart: Date | null = null;
    let currentPwm = 0;
    let currentSource = 'unknown';

    for (const ev of deviceEvents) {
      const evTime = new Date(ev.occurred_at);
      const pwm = getFanPwm(ev);

      if (pwm > 0) {
        if (currentOnStart) {
          // Speed changed while running -> close previous sub-interval and start new with new speed
          const diffMs = evTime.getTime() - currentOnStart.getTime();
          if (diffMs > 0 && diffMs <= MAX_UNCLOSED_INTERVAL_MS) {
            intervals.push({
              device: 'fan',
              start: currentOnStart,
              end: evTime,
              durationSeconds: Math.floor(diffMs / 1000),
              speed: currentPwm,
              source: currentSource,
              isOngoing: false,
            });
          }
        }
        currentOnStart = evTime;
        currentPwm = pwm;
        currentSource = ev.source || 'web';
      } else {
        // Fan turned OFF (pwm = 0)
        if (currentOnStart) {
          const diffMs = evTime.getTime() - currentOnStart.getTime();
          if (diffMs > 0 && diffMs <= MAX_UNCLOSED_INTERVAL_MS) {
            intervals.push({
              device: 'fan',
              start: currentOnStart,
              end: evTime,
              durationSeconds: Math.floor(diffMs / 1000),
              speed: currentPwm,
              source: currentSource,
              isOngoing: false,
            });
          }
          currentOnStart = null;
          currentPwm = 0;
        }
      }
    }

    // Ongoing fan interval
    const isFanCurrentlyOn =
      (currentState?.fan_speed ?? 0) > 0 || (currentOnStart !== null && currentPwm > 0);
    if (isFanCurrentlyOn) {
      const startTime =
        currentOnStart ||
        (currentState?.updated_at ? new Date(currentState.updated_at) : refTime);
      const pwm = currentPwm > 0 ? currentPwm : (currentState?.fan_speed ?? 150);
      const diffMs = Math.min(
        Math.max(0, refTime.getTime() - startTime.getTime()),
        MAX_UNCLOSED_INTERVAL_MS
      );
      if (diffMs > 0) {
        intervals.push({
          device: 'fan',
          start: startTime,
          end: refTime,
          durationSeconds: Math.floor(diffMs / 1000),
          speed: pwm,
          source: currentSource !== 'unknown' ? currentSource : 'state',
          isOngoing: true,
        });
      }
    }
  }

  return intervals;
}

/**
 * Splits intervals crossing midnight into daily segments according to IST (Asia/Kolkata).
 */
export function splitIntervalsByDay(
  intervals: UsageInterval[]
): Map<string, UsageInterval[]> {
  const dayMap = new Map<string, UsageInterval[]>();

  for (const interval of intervals) {
    let currentStart = new Date(interval.start);
    const overallEnd = new Date(interval.end);

    while (currentStart < overallEnd) {
      const istParts = getISTDateParts(currentStart);
      const dateKey = istParts.dateKey;

      // Start of next day in IST (00:00:00 IST = 18:30:00 UTC previous day)
      const nextDayStart = new Date(
        Date.UTC(istParts.year, istParts.month, istParts.date, 18, 30, 0, 0)
      );

      const segmentEnd = overallEnd < nextDayStart ? overallEnd : nextDayStart;

      const durationSecs = Math.max(
        0,
        Math.floor((segmentEnd.getTime() - currentStart.getTime()) / 1000)
      );

      if (durationSecs > 0) {
        const list = dayMap.get(dateKey) || [];
        list.push({
          ...interval,
          start: new Date(currentStart),
          end: new Date(segmentEnd),
          durationSeconds: durationSecs,
        });
        dayMap.set(dateKey, list);
      }

      currentStart = nextDayStart;
    }
  }

  return dayMap;
}

/**
 * Calculates energy in kWh based on wattage and seconds:
 * Energy (kWh) = (Watts * hours) / 1000
 */
export function calculateEnergyKWh(wattage: number, seconds: number): number {
  if (seconds <= 0 || wattage <= 0) return 0;
  const hours = seconds / 3600;
  return (wattage * hours) / 1000;
}

/**
 * Calculates comprehensive device usage summary in IST:
 * - Today's light & fan runtimes
 * - Speed breakdown
 * - Estimated kWh and cost in INR
 * - Daily metric breakdown for charts
 * - State transition counts
 */
export function calculateUsageSummary(
  events: DeviceEvent[],
  currentState?: DeviceState,
  settings: EnergySettings = DEFAULT_ENERGY_SETTINGS,
  referenceNow?: Date
): DeviceUsageSummary {
  const refTime =
    referenceNow ||
    (typeof window !== 'undefined' ? new Date() : new Date('2026-10-19T00:00:00.000Z'));
  const lightIntervals = calculateDeviceIntervals(events, 'light', currentState, refTime);
  const fanIntervals = calculateDeviceIntervals(events, 'fan', currentState, refTime);

  const lightDayMap = splitIntervalsByDay(lightIntervals);
  const fanDayMap = splitIntervalsByDay(fanIntervals);

  // Today key in IST format
  const todayKey = getISTDateParts(refTime).dateKey;

  // Today's runtimes
  let todayLightRuntime = 0;
  for (const seg of lightDayMap.get(todayKey) || []) {
    todayLightRuntime += seg.durationSeconds;
  }

  let todayFanRuntime = 0;
  for (const seg of fanDayMap.get(todayKey) || []) {
    todayFanRuntime += seg.durationSeconds;
  }

  // Fan speed breakdown across all intervals
  const fanSpeedTime = {
    speed1: 0,
    speed2: 0,
    speed3: 0,
  };

  for (const seg of fanIntervals) {
    const sp = seg.speed || 0;
    if (sp <= 100) {
      fanSpeedTime.speed1 += seg.durationSeconds;
    } else if (sp <= 180) {
      fanSpeedTime.speed2 += seg.durationSeconds;
    } else {
      fanSpeedTime.speed3 += seg.durationSeconds;
    }
  }

  // Generate 7-day metric list strictly in IST
  const dailyMetrics: DayUsageMetrics[] = [];
  let totalKWh = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(refTime.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = getISTDateParts(d).dateKey;

    const dayName = d.toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
    });
    const dayLabel = i === 0 ? 'Today' : i === 1 ? 'Yesterday' : dayName;

    // Light for day
    let lightDaySec = 0;
    for (const s of lightDayMap.get(dateKey) || []) {
      lightDaySec += s.durationSeconds;
    }
    const lightKWh = calculateEnergyKWh(settings.lightWattage, lightDaySec);

    // Fan for day
    let fanDaySec = 0;
    let fanKWh = 0;
    for (const s of fanDayMap.get(dateKey) || []) {
      fanDaySec += s.durationSeconds;
      const sp = s.speed || 0;
      const fanWatts =
        sp <= 100
          ? settings.fanSpeed1Wattage
          : sp <= 180
          ? settings.fanSpeed2Wattage
          : settings.fanSpeed3Wattage;
      fanKWh += calculateEnergyKWh(fanWatts, s.durationSeconds);
    }

    const dayTotalKWh = lightKWh + fanKWh;
    totalKWh += dayTotalKWh;

    // Count transitions on this day in IST
    const dayTransitions = events.filter((e) => {
      const ed = new Date(e.occurred_at);
      return getISTDateParts(ed).dateKey === dateKey;
    }).length;

    dailyMetrics.push({
      date: dateKey,
      dayLabel,
      lightRuntimeHours: Number((lightDaySec / 3600).toFixed(2)),
      fanRuntimeHours: Number((fanDaySec / 3600).toFixed(2)),
      lightEnergyKWh: Number(lightKWh.toFixed(3)),
      fanEnergyKWh: Number(fanKWh.toFixed(3)),
      totalEnergyKWh: Number(dayTotalKWh.toFixed(3)),
      estimatedCostINR: Number((dayTotalKWh * settings.electricityTariffINR).toFixed(2)),
      transitionsCount: dayTransitions,
    });
  }

  // Most used device determination
  const totalLightSec = lightIntervals.reduce((sum, i) => sum + i.durationSeconds, 0);
  const totalFanSec = fanIntervals.reduce((sum, i) => sum + i.durationSeconds, 0);
  const combinedSec = totalLightSec + totalFanSec;

  const mostUsed =
    combinedSec === 0
      ? { name: 'None yet', percentage: 0, hours: 0 }
      : totalFanSec >= totalLightSec
      ? {
          name: 'Ceiling Fan',
          percentage: Math.round((totalFanSec / combinedSec) * 100),
          hours: Number((totalFanSec / 3600).toFixed(1)),
        }
      : {
          name: 'Smart Light',
          percentage: Math.round((totalLightSec / combinedSec) * 100),
          hours: Number((totalLightSec / 3600).toFixed(1)),
        };

  return {
    todayLightRuntimeSeconds: todayLightRuntime,
    todayFanRuntimeSeconds: todayFanRuntime,
    totalEstimatedEnergyKWh: Number(totalKWh.toFixed(3)),
    totalEstimatedCostINR: Number((totalKWh * settings.electricityTariffINR).toFixed(2)),
    totalStateTransitions: events.length,
    mostUsedDevice: mostUsed,
    fanSpeedTimeSeconds: fanSpeedTime,
    dailyMetrics,
  };
}
