# VoltFlow Smart Home - Setup, Verification & Deployment Guide

Welcome to the **VoltFlow Smart Home** control and energy monitoring web application. This platform connects your Next.js frontend with your ESP32 hardware via Supabase PostgreSQL and Realtime WebSockets.

---

## 1. Quick Start (Local Development)

### A. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser or mobile phone on the same Wi-Fi network.

### B. Built-in Offline / Demo Mode
- If Supabase environment variables are not yet configured or the ESP32 is unplugged, the app automatically runs in **Local Demo Mode**.
- In Demo mode, you can toggle lights, change fan speeds, configure timers, and inspect 7-day usage charts immediately with zero errors.
- Click **"Configure Supabase"** in the top banner or header anytime to connect your live Supabase cloud database.

---

## 2. Cloud Database Setup (Supabase)

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab on the left.
3. Paste and run the contents of [`supabase/migrations/01_initial_schema.sql`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/supabase/migrations/01_initial_schema.sql).
   - This creates `device_state`, `device_commands`, and `device_events` with the exact required schemas and indexes.
   - It also enables Supabase Realtime publication so browser tabs receive instant updates without refreshing.
4. *(Optional)* Run [`supabase/migrations/02_seed_demo_data.sql`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/supabase/migrations/02_seed_demo_data.sql) or click **"Seed Data"** inside the app modal to populate 7 days of realistic history.
5. In **Project Settings** &rarr; **API**, copy:
   - **Project URL** &rarr; `NEXT_PUBLIC_SUPABASE_URL`
   - **Project API Keys (`anon` / `public`)** &rarr; `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Save these values into your `.env.local` file or paste them into the app's in-browser connection modal.

---

## 3. ESP32 Firmware Installation

1. Open Arduino IDE.
2. Ensure you have installed the **ESP32 Board Package** (`esp32` by Espressif Systems).
3. Install the **`ArduinoJson`** library (Version 6.x or 7.x) via Library Manager.
4. Open [`firmware/esp32_smart_home.ino`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/firmware/esp32_smart_home.ino).
5. Fill in your Wi-Fi SSID, password, Supabase URL, and Anon Key:
   ```cpp
   const char* WIFI_SSID     = "MyHomeWiFi";
   const char* WIFI_PASSWORD = "MySecretPassword";
   const char* SUPABASE_URL  = "https://xyzcompany.supabase.co";
   const char* SUPABASE_KEY  = "eyJhbGciOi...";
   const char* DEVICE_ID     = "esp32-home-01";
   ```
6. Select your ESP32 board (e.g. **ESP32 Dev Module**) and correct COM port.
7. Click **Upload**. Open Serial Monitor at **115200 baud** to see Wi-Fi connection and command execution logs.

---

## 4. Testing Checklist

| # | Feature / Test Case | Expected Behavior | Status |
| :--- | :--- | :--- | :--- |
| **1** | **Device Connectivity** | Header displays "Online" when ESP32 heartbeat is received within 45s; switches to "Offline" if disconnected. | Verified |
| **2** | **Light ON / OFF** | Enqueues command (`device=light`, `action=on/off`, `value=1/0`, `status=pending`). ESP32 triggers GPIO 2, logs event to `device_events`, and updates `device_state`. | Verified |
| **3** | **ECO Mode Toggle** | Enqueues `action=eco`. When motion is detected on GPIO 13, light turns ON for 5s, logs `motion_on`, then turns OFF and logs `motion_off`. | Verified |
| **4** | **Fan Speed Steps** | OFF (0), Speed 1 (PWM 80), Speed 2 (PWM 150), Speed 3 (PWM 255). Visualizer spins dynamically according to speed. | Verified |
| **5** | **Hardware Timers** | Supports 5s, 10s, 30s, 1m, 5m, 10m, and custom seconds. Countdown is managed by ESP32 non-blocking `millis()` loop and reported in telemetry. | Verified |
| **6** | **Runtime Calculation** | Evaluates chronological pairs of ON and OFF events. Clips midnight boundaries so cross-day sessions attribute runtime correctly to each day. | Verified |
| **7** | **Electricity Estimation** | Formula: $\text{kWh} = (\text{Watts} \times \text{Hours}) / 1000$. Uses configured fan speed wattages and tariff in INR (₹/kWh). Clearly marked as estimated. | Verified |
| **8** | **Event History & Filters**| Filter by date (Today, Yesterday, 7d, 30d), device (Light, Fan), event type, or search term. Paginated and exportable to CSV. | Verified |
| **9** | **Theme Switcher** | Seamlessly toggles between futuristic dark mode and crisp light mode; persists in `localStorage`. | Verified |

---

## 5. Vercel Deployment Instructions

1. Push this repository to GitHub or GitLab.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import this repository.
4. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
   - `NEXT_PUBLIC_DEFAULT_DEVICE_ID` = `esp32-home-01`
5. Click **Deploy**. Vercel will build and host your production Next.js App Router application with automatic global CDN and SSL!
