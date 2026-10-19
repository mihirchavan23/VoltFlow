import { DeviceState, DeviceCommand, DeviceEvent } from './database.types';

export type TabType = 'controls' | 'usage' | 'history' | 'settings';

export type SpeedStep = 0 | 80 | 150 | 255;

export interface EnergySettings {
  lightWattage: number; // default 10W
  fanSpeed1Wattage: number; // default 25W
  fanSpeed2Wattage: number; // default 45W
  fanSpeed3Wattage: number; // default 70W
  electricityTariffINR: number; // default 7.5 INR per kWh
}

export interface UsageInterval {
  device: 'light' | 'fan' | 'motor';
  start: Date;
  end: Date;
  durationSeconds: number;
  speed?: number; // for fan (80, 150, 255)
  source?: string;
  isOngoing?: boolean;
}

export interface DayUsageMetrics {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  lightRuntimeHours: number;
  fanRuntimeHours: number;
  lightEnergyKWh: number;
  fanEnergyKWh: number;
  totalEnergyKWh: number;
  estimatedCostINR: number;
  transitionsCount: number;
}

export interface DeviceUsageSummary {
  todayLightRuntimeSeconds: number;
  todayFanRuntimeSeconds: number;
  totalEstimatedEnergyKWh: number;
  totalEstimatedCostINR: number;
  totalStateTransitions: number;
  mostUsedDevice: {
    name: string;
    percentage: number;
    hours: number;
  };
  fanSpeedTimeSeconds: {
    speed1: number;
    speed2: number;
    speed3: number;
  };
  dailyMetrics: DayUsageMetrics[];
}

export interface EventFilterOptions {
  device: 'all' | 'light' | 'fan' | 'motor';
  eventType: string;
  timeRange: 'today' | 'yesterday' | '7days' | '30days' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'pending' | 'info';
  title: string;
  message: string;
  timestamp: number;
}
