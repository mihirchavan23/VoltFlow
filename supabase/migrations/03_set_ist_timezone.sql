-- ==============================================================================
-- 03_SET_IST_TIMEZONE.SQL
-- 1. Ensure occurred_at in device_events defaults to now()
-- 2. Configure PostgreSQL database & connection roles to IST (Asia/Kolkata / UTC+05:30)
-- 3. (Optional) Clear old demo/seed data if you want a clean slate of actual live hardware events only
-- ==============================================================================

-- 1. Resilient default: If occurred_at is omitted, PostgreSQL automatically uses now()
ALTER TABLE public.device_events ALTER COLUMN occurred_at SET DEFAULT now();

-- 2. Set default timezone to Asia/Kolkata (IST: UTC+05:30) for database and all client roles
ALTER DATABASE postgres SET timezone TO 'Asia/Kolkata';
ALTER ROLE postgres SET timezone TO 'Asia/Kolkata';
ALTER ROLE anon SET timezone TO 'Asia/Kolkata';
ALTER ROLE authenticated SET timezone TO 'Asia/Kolkata';
ALTER ROLE service_role SET timezone TO 'Asia/Kolkata';

-- 3. Verify timezone is now Asia/Kolkata
SHOW timezone;

-- ==============================================================================
-- OPTIONAL: If you want to wipe the previous 36 demo/seed events and start fresh
-- with ONLY real live events recorded by your ESP32, run this line:
-- TRUNCATE TABLE public.device_events RESTART IDENTITY;
-- ==============================================================================
