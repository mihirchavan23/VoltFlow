-- ==============================================================================
-- VoltFlow Smart Home - Seed Realistic Demo Data
-- Target Device: esp32-home-01
-- ==============================================================================

-- 1. Upsert Initial Device State
INSERT INTO public.device_state (
  device_id,
  light_on,
  eco_mode,
  fan_speed,
  motor_on,
  updated_at
) VALUES (
  'esp32-home-01',
  false,
  true,
  150,
  false,
  now()
) ON CONFLICT (device_id) DO UPDATE SET
  light_on = EXCLUDED.light_on,
  eco_mode = EXCLUDED.eco_mode,
  fan_speed = EXCLUDED.fan_speed,
  motor_on = EXCLUDED.motor_on,
  updated_at = EXCLUDED.updated_at;

-- 2. Seed 7 Days of Realistic Device Events (Past 7 Days to Today)
INSERT INTO public.device_events (device_id, device, event_type, value, source, occurred_at) VALUES
-- Day -6 (6 days ago)
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '6 days 14 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'timer', now() - interval '6 days 12 hours 45 mins'),
('esp32-home-01', 'fan', 'speed_change', 80, 'web', now() - interval '6 days 10 hours'),
('esp32-home-01', 'fan', 'speed_change', 150, 'mobile', now() - interval '6 days 8 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'web', now() - interval '6 days 6 hours'),

-- Day -5 (5 days ago)
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '5 days 15 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'mobile', now() - interval '5 days 13 hours 30 mins'),
('esp32-home-01', 'light', 'motion_on', 1, 'PIR', now() - interval '5 days 8 hours'),
('esp32-home-01', 'light', 'motion_off', 0, 'PIR', now() - interval '5 days 7 hours 59 mins 55 seconds'),
('esp32-home-01', 'fan', 'speed_change', 150, 'web', now() - interval '5 days 9 hours'),
('esp32-home-01', 'fan', 'speed_change', 255, 'mobile', now() - interval '5 days 7 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'timer', now() - interval '5 days 4 hours'),

-- Day -4 (4 days ago)
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '4 days 16 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'timer', now() - interval '4 days 14 hours'),
('esp32-home-01', 'fan', 'speed_change', 80, 'web', now() - interval '4 days 11 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'web', now() - interval '4 days 7 hours'),

-- Day -3 (3 days ago)
('esp32-home-01', 'light', 'motion_on', 1, 'PIR', now() - interval '3 days 18 hours'),
('esp32-home-01', 'light', 'motion_off', 0, 'PIR', now() - interval '3 days 17 hours 59 mins 55 seconds'),
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '3 days 14 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'mobile', now() - interval '3 days 12 hours'),
('esp32-home-01', 'fan', 'speed_change', 150, 'web', now() - interval '3 days 10 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'timer', now() - interval '3 days 5 hours'),

-- Day -2 (2 days ago)
('esp32-home-01', 'light', 'turned_on', 1, 'web', now() - interval '2 days 15 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'timer', now() - interval '2 days 13 hours'),
('esp32-home-01', 'fan', 'speed_change', 150, 'mobile', now() - interval '2 days 12 hours'),
('esp32-home-01', 'fan', 'speed_change', 255, 'web', now() - interval '2 days 9 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'mobile', now() - interval '2 days 6 hours'),

-- Day -1 (Yesterday)
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '1 day 14 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'mobile', now() - interval '1 day 12 hours 30 mins'),
('esp32-home-01', 'fan', 'speed_change', 80, 'web', now() - interval '1 day 11 hours'),
('esp32-home-01', 'fan', 'speed_change', 150, 'mobile', now() - interval '1 day 8 hours'),
('esp32-home-01', 'fan', 'turned_off', 0, 'timer', now() - interval '1 day 4 hours'),

-- Today
('esp32-home-01', 'light', 'turned_on', 1, 'mobile', now() - interval '4 hours'),
('esp32-home-01', 'light', 'turned_off', 0, 'timer', now() - interval '2 hours 15 mins'),
('esp32-home-01', 'fan', 'speed_change', 150, 'web', now() - interval '3 hours 30 mins'),
('esp32-home-01', 'fan', 'speed_change', 80, 'mobile', now() - interval '1 hour 15 mins');
