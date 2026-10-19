import { DeviceEvent, DeviceState, DeviceCommand } from '@/types/database.types';

export const INITIAL_MOCK_STATE: DeviceState = {
  device_id: 'esp32-home-01',
  light_on: false,
  eco_mode: true,
  fan_speed: 150, // Speed 2
  motor_on: false,
  updated_at: '2026-10-19T00:00:00.000Z',
  light_timer_active: false,
  light_timer_remaining: 0,
  light_timer_action: '',
  fan_timer_active: false,
  fan_timer_remaining: 0,
  fan_timer_action: '',
};

export function getFreshMockState(deviceId = 'esp32-home-01'): DeviceState {
  return {
    ...INITIAL_MOCK_STATE,
    device_id: deviceId,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Generates 7 days of realistic device events for demonstration and testing.
 */
export function generateMockEvents(deviceId = 'esp32-home-01'): DeviceEvent[] {
  const events: DeviceEvent[] = [];
  const now = new Date();
  let idCounter = 1000;

  // Generate for past 7 days
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const baseDate = new Date(now);
    baseDate.setDate(baseDate.getDate() - dayOffset);

    // Morning routine (around 07:00 AM)
    const morningLightOn = new Date(baseDate);
    morningLightOn.setHours(7, 10, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'light',
      event_type: 'turned_on',
      value: 1,
      source: 'mobile',
      occurred_at: morningLightOn.toISOString(),
      created_at: morningLightOn.toISOString(),
    });

    const morningLightOff = new Date(baseDate);
    morningLightOff.setHours(8, 25, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'light',
      event_type: 'turned_off',
      value: 0,
      source: 'timer',
      occurred_at: morningLightOff.toISOString(),
      created_at: morningLightOff.toISOString(),
    });

    // Afternoon Fan Session (13:00 to 16:30)
    const fanStart = new Date(baseDate);
    fanStart.setHours(13, 0, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'fan',
      event_type: 'speed_change',
      value: 80, // Speed 1
      source: 'web',
      occurred_at: fanStart.toISOString(),
      created_at: fanStart.toISOString(),
    });

    const fanSpeedUp = new Date(baseDate);
    fanSpeedUp.setHours(14, 15, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'fan',
      event_type: 'speed_change',
      value: 150, // Speed 2
      source: 'mobile',
      occurred_at: fanSpeedUp.toISOString(),
      created_at: fanSpeedUp.toISOString(),
    });

    const fanStop = new Date(baseDate);
    fanStop.setHours(16, 45, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'fan',
      event_type: 'turned_off',
      value: 0,
      source: 'web',
      occurred_at: fanStop.toISOString(),
      created_at: fanStop.toISOString(),
    });

    // Evening PIR Motion events (ECO mode triggers)
    const pirMotion1 = new Date(baseDate);
    pirMotion1.setHours(19, 15, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'light',
      event_type: 'motion_on',
      value: 1,
      source: 'PIR',
      occurred_at: pirMotion1.toISOString(),
      created_at: pirMotion1.toISOString(),
    });

    const pirMotion1Off = new Date(baseDate);
    pirMotion1Off.setHours(19, 20, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'light',
      event_type: 'motion_off',
      value: 0,
      source: 'PIR',
      occurred_at: pirMotion1Off.toISOString(),
      created_at: pirMotion1Off.toISOString(),
    });

    // Night lighting & Fan
    const nightLightOn = new Date(baseDate);
    nightLightOn.setHours(20, 30, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'light',
      event_type: 'turned_on',
      value: 1,
      source: 'mobile',
      occurred_at: nightLightOn.toISOString(),
      created_at: nightLightOn.toISOString(),
    });

    const nightFanOn = new Date(baseDate);
    nightFanOn.setHours(22, 0, 0, 0);
    events.push({
      id: ++idCounter,
      device_id: deviceId,
      device: 'fan',
      event_type: 'speed_change',
      value: 255, // Speed 3
      source: 'mobile',
      occurred_at: nightFanOn.toISOString(),
      created_at: nightFanOn.toISOString(),
    });

    if (dayOffset > 0) {
      const nightLightOff = new Date(baseDate);
      nightLightOff.setHours(23, 15, 0, 0);
      events.push({
        id: ++idCounter,
        device_id: deviceId,
        device: 'light',
        event_type: 'turned_off',
        value: 0,
        source: 'timer',
        occurred_at: nightLightOff.toISOString(),
        created_at: nightLightOff.toISOString(),
      });

      const nightFanOff = new Date(baseDate);
      nightFanOff.setHours(23, 45, 0, 0);
      events.push({
        id: ++idCounter,
        device_id: deviceId,
        device: 'fan',
        event_type: 'turned_off',
        value: 0,
        source: 'timer',
        occurred_at: nightFanOff.toISOString(),
        created_at: nightFanOff.toISOString(),
      });
    }
  }

  // Sort descending by time
  return events.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
}
