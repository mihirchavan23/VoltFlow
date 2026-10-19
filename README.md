# VoltFlow — ESP32 Smart Home Control & Energy Usage Web Application

[![Next.js](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_%26_Realtime-3ecf8e?logo=supabase)](https://supabase.com/)
[![ESP32](https://img.shields.io/badge/ESP32-Arduino_C%2B%2B-red?logo=espressif)](https://www.espressif.com/)

A responsive, production-ready IoT smart home web application integrated with ESP32 hardware and Supabase PostgreSQL. Designed for remote device control over standard home Wi-Fi networks without requiring direct AP hotspot connections.

---

## 🌟 Key Features

### 1. Controls Tab
- **Smart Lighting**:
  - Tactile ON/OFF toggle with warm ambient illumination glow.
  - Normal manual control vs **ECO Mode** (PIR motion detection on GPIO 13 auto-illuminates light for 5 seconds).
  - Hardware non-blocking countdown timers (5s, 10s, 30s, 1m, 5m, 10m, and custom seconds).
  - Real-time command status indicators (distinguishes between command *queued* in Supabase and *acknowledged/executed* by ESP32).
- **Ceiling Fan**:
  - Interactive rotary speed regulator & step selector.
  - Precise PWM speed mapping: **OFF (0)**, **Speed 1 (80 PWM)**, **Speed 2 (150 PWM)**, **Speed 3 (255 PWM)**.
  - Dynamically spinning SVG fan visualizer matching real-time operating speed.
  - Hardware speed timers with target action (Turn ON with target speed / Turn OFF).
- **Extensible Toy Motor**:
  - Software model and database schema ready (`motor_on`), with hardware safety interlock.

### 2. Usage & Power Monitoring Tab
- **Summary Metrics**:
  - Today's Light runtime (hours & minutes calculated from ON/OFF pairs).
  - Today's Fan runtime (PWM > 0 duration).
  - Total estimated energy consumption in **kWh**.
  - Total estimated electricity cost in **Indian Rupees (₹ INR)**.
  - State transition counter & most-used device share.
- **Duration Pairing Engine**:
  - Reconstructs chronological device state intervals from `device_events`.
  - Splits intervals crossing midnight (00:00:00) cleanly into respective days.
  - Safely includes ongoing active sessions up to the current time.
  - Handles missing OFF events and sensor anomalies safely without infinite runtime bugs.
- **Configurable Electricity Estimation**:
  - Configurable wattages for light (default 10W) and fan speeds (Speed 1: 25W, Speed 2: 45W, Speed 3: 70W).
  - Configurable electricity tariff in INR / kWh (default ₹7.50 / unit).
  - Clearly labeled as mathematical estimates.
- **Charts & History Log**:
  - Stacked daily runtime chart (Light vs Fan hours).
  - Area chart for daily energy (kWh) and cost trends.
  - Fan speed power distribution breakdown.
  - Paginated, searchable event history table with local timestamps and one-click **Export to CSV**.

### 3. Architecture & Live Synchronization
- **Supabase Realtime WebSockets**:
  - Subscribes to changes on `device_state`, `device_commands`, and `device_events`.
  - Fallback 5-second polling interval guarantees reliable synchronization even through restrictive firewalls.
- **Heartbeat & Disconnection Detection**:
  - Detects stale ESP32 timestamps (>45s) and marks the gateway **Offline**.
- **Dark & Light Mode**:
  - Futuristic dark aesthetic with smooth glassmorphism and radiant device glow.
  - Clean, high-contrast light theme.

---

## 📁 Repository Structure

```
.
├── firmware/
│   ├── esp32_smart_home.ino       # Complete Arduino C++ sketch for ESP32
│   └── README.md                  # Wiring diagram, pin mappings, and libraries
├── src/
│   ├── app/
│   │   ├── globals.css            # Tailwind CSS v4 styling & animations
│   │   ├── layout.tsx             # Root layout with Plus Jakarta Sans typography
│   │   └── page.tsx               # Main Dashboard with Controls & Usage tabs
│   ├── components/
│   │   ├── controls/              # LightControlCard, FanControlCard, MotorControlCard, TimerModal
│   │   ├── layout/                # Header, Sidebar, MobileNav, CredentialsModal
│   │   ├── ui/                    # Toast, Badge
│   │   └── usage/                 # UsageSummaryCards, UsageDurationChart, EnergyCostChart, DeviceEventHistory, EnergySettingsModal
│   ├── hooks/                     # useDeviceState, useDeviceCommands, useDeviceEvents, useTheme
│   ├── lib/
│   │   ├── supabase/              # Typed client and rich mock data generator
│   │   └── utils/                 # Chronological duration pairing, kWh formulas, formatters
│   └── types/                     # Database types (device_state, device_commands, device_events)
├── supabase/
│   └── migrations/
│       ├── 01_initial_schema.sql  # Database schema, indexes, RLS, and Realtime publication
│       └── 02_seed_demo_data.sql  # 7-day realistic demo event history
├── .env.example                   # Environment variable template
├── SETUP_AND_TESTING_GUIDE.md     # Step-by-step setup, verification, and deployment guide
└── package.json
```

---

## 🚀 Getting Started

### 1. Install & Run Locally
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Connect Supabase
Create a project on [Supabase](https://supabase.com). In the **SQL Editor**, run [`supabase/migrations/01_initial_schema.sql`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/supabase/migrations/01_initial_schema.sql).

Add your credentials to `.env.local` or directly through the web application's **"Configure Supabase"** button:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_DEFAULT_DEVICE_ID=esp32-home-01
```

### 3. Flash ESP32
Flash [`firmware/esp32_smart_home.ino`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/firmware/esp32_smart_home.ino) with your Wi-Fi credentials and Supabase URL. Refer to [`firmware/README.md`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/firmware/README.md) for details.
