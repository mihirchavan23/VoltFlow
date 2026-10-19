# ESP32 Smart Home Firmware Guide

This firmware connects your ESP32 to your standard home Wi-Fi network and communicates with your Supabase cloud database over HTTPS REST endpoints. It replaces the local SoftAP web server with remote cloud synchronization.

---

## 1. Hardware Pin Connections

| Component | ESP32 Pin | Function | Notes |
| :--- | :--- | :--- | :--- |
| **Smart Light (LED / Relay)** | `GPIO 2` | Digital Output (`HIGH`/`LOW`) | Onboard LED or external relay module |
| **PIR Motion Sensor** | `GPIO 13` | Digital Input (`HIGH` when motion detected) | Powers ECO mode auto-toggle |
| **Ceiling Fan (Motor / PWM)** | `GPIO 5` | LEDC PWM (5 kHz, 8-bit, 0 to 255) | Connect to MOSFET gate or PWM speed controller |
| **Toy Motor (Extensible)** | `GPIO 18` | Digital Output (`HIGH`/`LOW`) | Connect to L298N driver or external transistor |
| **VCC / GND** | `VIN` / `GND` | Power Supply | 5V DC micro-USB or external power supply |

---

## 2. Required Arduino Libraries

Open the Arduino IDE Library Manager (**Tools** &rarr; **Manage Libraries...**) and install:

1. **`ArduinoJson`** by Benoit Blanchon (Version 6.x or 7.x)
2. **`WiFi`**, **`WiFiClientSecure`**, **`HTTPClient`** (included by default in the ESP32 Board Package)

---

## 3. Firmware Configuration

Open [`firmware/esp32_smart_home.ino`](file:///d:/02_ACE%20DEGREE/ACE/Sem%207/02_IOE/project/firmware/esp32_smart_home.ino) and edit lines 23-32:

```cpp
const char* WIFI_SSID     = "YOUR_HOME_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_HOME_WIFI_PASSWORD";

const char* SUPABASE_URL  = "https://your-project-id.supabase.co";
const char* SUPABASE_KEY  = "YOUR_SUPABASE_ANON_PUBLIC_KEY";

const char* DEVICE_ID     = "esp32-home-01";
```

---

## 4. How It Works

1. **Remote Cloud Operations**: The ESP32 connects to your regular Wi-Fi router. You can control devices from your phone or laptop anywhere in the world without being near the ESP32.
2. **Non-blocking Command Polling**: Every 1.5s, the ESP32 polls `device_commands` for commands with `status = 'pending'`.
3. **Execution & Acknowledgment**: When an action is received (`on`, `off`, `speed`, `eco`, `normal`, `set_timer`), the ESP32 executes it physically, writes a real event to `device_events`, and patches `device_commands` status to `'completed'`.
4. **Heartbeat & Telemetry**: Every 10 seconds, the ESP32 upserts its live state into `device_state` with `updated_at = now()` and active timer remaining seconds. If the ESP32 disconnects from Wi-Fi, the web app automatically detects the stale timestamp and marks it **Offline**.
5. **ECO Mode**: In ECO mode, the PIR sensor triggers the light for 5 seconds when movement is detected and logs the motion event to `device_events`.
