/*
 ==============================================================================
  VoltFlow ESP32 Smart Home Gateway Firmware (Zero External Dependencies)
  Connects to Home Wi-Fi Router & Communicates with Supabase over HTTPS (REST
 API)

  Hardware:
    - Smart Lighting: GPIO 2
    - PIR Motion Sensor: GPIO 13
    - Ceiling Fan PWM: GPIO 5 (LEDC Channel, 5kHz, 8-bit, 0 to 255)
    - Toy Motor: GPIO 18 (Extensible)
 ==============================================================================
*/

#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <time.h>

// ==============================================================================
// 1. CONFIGURATION: WI-FI & SUPABASE CREDENTIALS
// ==============================================================================
const char *WIFI_SSID = "MDC";
const char *WIFI_PASSWORD = "12334556789";

// Supabase project URL and anon public key
const char *SUPABASE_URL = "https://zmjbruulpvvupmxphguk.supabase.co";
const char *SUPABASE_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9."
    "eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptamJydXVscHZ2dXBteHBoZ3VrIiwicm9sZSI6Im"
    "Fub24iLCJpYXQiOjE3OTIzNzIzMTMsImV4cCI6MjEwNzk0ODMxM30."
    "Od5cFU9AmY8aRbhzDBdj9qsuc_lLUPSP6Azt1s-0bdI";

// Device identifier matching web dashboard (default: esp32-home-01)
const char *DEVICE_ID = "esp32-home-01";

// ==============================================================================
// 2. HARDWARE PIN DEFINITIONS
// ==============================================================================
#define LED_PIN 2    // Onboard / Relay LED
#define PIR_PIN 13   // PIR Motion Sensor (INPUT)
#define FAN_PIN 5    // Fan Speed PWM Pin (LEDC Channel)
#define MOTOR_PIN 18 // Optional Motor Pin (Driver required)

// PWM Properties for Fan
const int PWM_FREQ = 5000;    // 5 kHz PWM frequency
const int PWM_RESOLUTION = 8; // 8-bit resolution (0 to 255)

// ==============================================================================
// 3. RUNTIME DEVICE STATE
// ==============================================================================
bool ledOn = false;
bool ecoMode = true;
int fanSpeed = 0; // 0 (OFF), 80 (Speed 1), 150 (Speed 2), 255 (Speed 3)
bool motorOn = false;

// Motion (PIR) State
unsigned long motionStartTime = 0;
const unsigned long PIR_HOLD_TIME_MS = 5000; // 5 seconds light hold

// Light Timer State
bool lightTimerActive = false;
unsigned long lightTimerStart = 0;
unsigned long lightTimerDuration = 0;
bool lightTargetState = false;
unsigned long lightTimerRemainingSec = 0;
String lightTimerAction = "";

// Fan Timer State
bool fanTimerActive = false;
unsigned long fanTimerStart = 0;
unsigned long fanTimerDuration = 0;
int fanTargetSpeed = 0;
unsigned long fanTimerRemainingSec = 0;
String fanTimerAction = "";

// Network Polling Intervals
unsigned long lastCommandPoll = 0;
const unsigned long COMMAND_POLL_INTERVAL = 1500; // Poll commands every 1.5s

unsigned long lastHeartbeat = 0;
const unsigned long HEARTBEAT_INTERVAL = 10000; // Upsert state every 10s

// ==============================================================================
// HELPER: SANITIZE SUPABASE REST URL (Prevents duplicate /rest/v1 paths)
// ==============================================================================
String getRestUrl(const String &endpoint) {
  String base = String(SUPABASE_URL);
  while (base.endsWith("/")) {
    base.remove(base.length() - 1);
  }
  if (!base.endsWith("/rest/v1")) {
    base += "/rest/v1";
  }
  return base + "/" + endpoint;
}

// ==============================================================================
// BUILT-IN LIGHTWEIGHT JSON PARSER (Zero External Dependencies)
// ==============================================================================
String extractJsonField(const String &json, const String &key) {
  String pattern = "\"" + key + "\":";
  int start = json.indexOf(pattern);
  if (start == -1)
    return "";
  start += pattern.length();

  while (start < json.length() &&
         (json.charAt(start) == ' ' || json.charAt(start) == '\t')) {
    start++;
  }

  // Quoted string (e.g. UUID, device name, action)
  if (json.charAt(start) == '\"') {
    start++;
    int end = json.indexOf("\"", start);
    if (end == -1)
      return "";
    return json.substring(start, end);
  }

  // Raw number / boolean / null
  int end = start;
  while (end < json.length() && json.charAt(end) != ',' &&
         json.charAt(end) != '}' && json.charAt(end) != ']' &&
         json.charAt(end) != '\r' && json.charAt(end) != '\n') {
    end++;
  }
  String val = json.substring(start, end);
  val.trim();
  return val;
}

// ==============================================================================
// FUNCTION DECLARATIONS
// ==============================================================================
void connectToWiFi();
void checkWiFi();
void syncNtpTime();
String getISTTimestamp();
void pollPendingCommands();
void executeCommand(String cmdId, String device, String action, int value,
                    int durationSec, String timerAction);
void completeCommand(String cmdId);
void logDeviceEvent(String device, String eventType, int value, String source);
void sendHeartbeatAndState();

// ==============================================================================
// SETUP
// ==============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=============================================");
  Serial.println("  VoltFlow ESP32 Smart Home Gateway Starting");
  Serial.println("=============================================");

  // Pin modes
  pinMode(LED_PIN, OUTPUT);
  pinMode(PIR_PIN, INPUT);
  pinMode(MOTOR_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(MOTOR_PIN, LOW);

// Setup Fan PWM using LEDC API
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
  ledcAttach(FAN_PIN, PWM_FREQ, PWM_RESOLUTION);
  ledcWrite(FAN_PIN, 0);
#else
  ledcSetup(0, PWM_FREQ, PWM_RESOLUTION);
  ledcAttachPin(FAN_PIN, 0);
  ledcWrite(0, 0);
#endif

  connectToWiFi();
  syncNtpTime();

  // Send initial state upsert to Supabase
  sendHeartbeatAndState();
  Serial.println("ESP32 Gateway ready and connected to Supabase!");
}

// ==============================================================================
// MAIN LOOP
// ==============================================================================
void loop() {
  checkWiFi();

  unsigned long currentMillis = millis();

  // --------------------------------------------------------------------------
  // A. ECO MODE PIR MOTION LOGIC
  // --------------------------------------------------------------------------
  if (ecoMode) {
    int motion = digitalRead(PIR_PIN);

    // Motion detected when light was OFF
    if (motion == HIGH && !ledOn) {
      digitalWrite(LED_PIN, HIGH);
      ledOn = true;
      motionStartTime = currentMillis;
      Serial.println("[PIR] Motion detected -> Light turned ON");
      logDeviceEvent("light", "motion_on", 1, "PIR");
      sendHeartbeatAndState();
    }

    // Auto-turn OFF light after 5 seconds of inactivity
    if (ledOn && (currentMillis - motionStartTime >= PIR_HOLD_TIME_MS)) {
      digitalWrite(LED_PIN, LOW);
      ledOn = false;
      Serial.println("[PIR] Hold timeout -> Light turned OFF");
      logDeviceEvent("light", "motion_off", 0, "PIR");
      sendHeartbeatAndState();
    }
  }

  // --------------------------------------------------------------------------
  // B. LIGHT HARDWARE TIMER EXECUTION
  // --------------------------------------------------------------------------
  if (lightTimerActive) {
    unsigned long elapsed = currentMillis - lightTimerStart;
    if (elapsed >= lightTimerDuration) {
      digitalWrite(LED_PIN, lightTargetState ? HIGH : LOW);
      ledOn = lightTargetState;
      lightTimerActive = false;
      lightTimerRemainingSec = 0;
      lightTimerAction = "";

      Serial.println("[TIMER] Light timer expired -> State applied");
      logDeviceEvent("light", "timer_expired", ledOn ? 1 : 0, "timer");
      sendHeartbeatAndState();
    } else {
      lightTimerRemainingSec = (lightTimerDuration - elapsed) / 1000;
    }
  }

  // --------------------------------------------------------------------------
  // C. FAN HARDWARE TIMER EXECUTION
  // --------------------------------------------------------------------------
  if (fanTimerActive) {
    unsigned long elapsed = currentMillis - fanTimerStart;
    if (elapsed >= fanTimerDuration) {
      fanSpeed = fanTargetSpeed;
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcWrite(FAN_PIN, fanSpeed);
#else
      ledcWrite(0, fanSpeed);
#endif

      fanTimerActive = false;
      fanTimerRemainingSec = 0;
      fanTimerAction = "";

      Serial.println("[TIMER] Fan timer expired -> Speed applied");
      logDeviceEvent("fan", "timer_expired", fanSpeed, "timer");
      sendHeartbeatAndState();
    } else {
      fanTimerRemainingSec = (fanTimerDuration - elapsed) / 1000;
    }
  }

  // --------------------------------------------------------------------------
  // D. POLL PENDING COMMANDS FROM SUPABASE
  // --------------------------------------------------------------------------
  if (currentMillis - lastCommandPoll >= COMMAND_POLL_INTERVAL) {
    lastCommandPoll = currentMillis;
    pollPendingCommands();
  }

  // --------------------------------------------------------------------------
  // E. PERIODIC HEARTBEAT & STATE UPSERT (Every 10 seconds)
  // --------------------------------------------------------------------------
  if (currentMillis - lastHeartbeat >= HEARTBEAT_INTERVAL) {
    lastHeartbeat = currentMillis;
    sendHeartbeatAndState();
  }
}

// ==============================================================================
// WI-FI MANAGEMENT
// ==============================================================================
void connectToWiFi() {
  Serial.print("Connecting to Wi-Fi SSID: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWi-Fi Connected successfully!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nWi-Fi Connection failed. Will retry in loop.");
  }
}

void checkWiFi() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Wi-Fi dropped! Reconnecting...");
    WiFi.disconnect();
    WiFi.reconnect();
    delay(1000);
  }
}

// ==============================================================================
// NTP TIME SYNCHRONIZATION (IST: UTC + 5:30)
// ==============================================================================
void syncNtpTime() {
  Serial.print("Synchronizing with NTP (IST)...");
  // 19800 seconds = 5.5 hours * 3600 seconds = UTC+05:30
  configTime(19800, 0, "pool.ntp.org", "time.google.com");
  struct tm timeinfo;
  int retry = 0;
  while (!getLocalTime(&timeinfo) && retry < 15) {
    delay(300);
    Serial.print(".");
    retry++;
  }
  if (retry < 15) {
    char buf[64];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
    Serial.print(" Synced! Current IST: ");
    Serial.println(buf);
  } else {
    Serial.println(" NTP initial sync timeout; will keep syncing in background.");
  }
}

String getISTTimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo, 200)) {
    return "";
  }
  char buf[35];
  // ISO 8601 formatted with +05:30 offset
  strftime(buf, sizeof(buf), "%Y-%m-%dT%H:%M:%S+05:30", &timeinfo);
  return String(buf);
}

// ==============================================================================
// SUPABASE: POLL PENDING COMMANDS
// ==============================================================================
void pollPendingCommands() {
  if (WiFi.status() != WL_CONNECTED)
    return;

  WiFiClientSecure client;
  client.setInsecure(); // Skip certificate validation for lightweight IoT HTTPS

  HTTPClient https;
  String url = getRestUrl("device_commands?device_id=eq." + String(DEVICE_ID) +
                          "&status=eq.pending&order=created_at.asc&limit=1");

  if (https.begin(client, url)) {
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    https.addHeader("Accept", "application/json");

    int httpCode = https.GET();

    if (httpCode == HTTP_CODE_OK) {
      String payload = https.getString();

      int objStart = payload.indexOf("{");
      int objEnd = payload.lastIndexOf("}");

      if (objStart != -1 && objEnd > objStart) {
        String cmdJson = payload.substring(objStart, objEnd + 1);

        String cmdId = extractJsonField(cmdJson, "id");
        String device = extractJsonField(cmdJson, "device");
        String action = extractJsonField(cmdJson, "action");
        int value = extractJsonField(cmdJson, "value").toInt();
        int durationSec = extractJsonField(cmdJson, "duration_seconds").toInt();
        String timerAction = extractJsonField(cmdJson, "timer_action");

        if (cmdId.length() > 0 && device.length() > 0 && action.length() > 0) {
          Serial.printf(
              "[COMMAND RECEIVED] ID: %s | Dev: %s | Action: %s | Val: %d\n",
              cmdId.c_str(), device.c_str(), action.c_str(), value);

          executeCommand(cmdId, device, action, value, durationSec,
                         timerAction);
        }
      }
    }
    https.end();
  }
}

// ==============================================================================
// COMMAND EXECUTION LOGIC
// ==============================================================================
void executeCommand(String cmdId, String device, String action, int value,
                    int durationSec, String timerAction) {
  // 1. LIGHT CONTROLS
  if (device == "light") {
    if (action == "on") {
      ecoMode = false;
      ledOn = true;
      digitalWrite(LED_PIN, HIGH);
      logDeviceEvent("light", "turned_on", 1, "web");
      Serial.println("Light turned ON via web command");
    } else if (action == "off") {
      ecoMode = false;
      ledOn = false;
      digitalWrite(LED_PIN, LOW);
      logDeviceEvent("light", "turned_off", 0, "web");
      Serial.println("Light turned OFF via web command");
    } else if (action == "eco") {
      ecoMode = true;
      logDeviceEvent("light", "mode_change", 1, "web");
      Serial.println("ECO Mode enabled");
    } else if (action == "normal") {
      ecoMode = false;
      logDeviceEvent("light", "mode_change", 0, "web");
      Serial.println("Normal Mode enabled");
    } else if (action == "set_timer") {
      lightTargetState = (timerAction == "on");
      lightTimerDuration = (unsigned long)durationSec * 1000;
      lightTimerStart = millis();
      lightTimerActive = true;
      lightTimerAction = lightTargetState ? "ON" : "OFF";
      Serial.printf("Light timer armed for %d seconds (Target: %s)\n",
                    durationSec, lightTimerAction.c_str());
    }
  }
  // 2. FAN CONTROLS
  else if (device == "fan") {
    if (action == "off") {
      fanSpeed = 0;
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcWrite(FAN_PIN, 0);
#else
      ledcWrite(0, 0);
#endif
      logDeviceEvent("fan", "turned_off", 0, "web");
      Serial.println("Fan turned OFF");
    } else if (action == "speed") {
      fanSpeed = value;
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
      ledcWrite(FAN_PIN, fanSpeed);
#else
      ledcWrite(0, fanSpeed);
#endif
      logDeviceEvent("fan", "speed_change", fanSpeed, "web");
      Serial.printf("Fan speed changed to PWM %d\n", fanSpeed);
    } else if (action == "set_timer") {
      fanTargetSpeed = (timerAction == "on") ? (value > 0 ? value : 150) : 0;
      fanTimerDuration = (unsigned long)durationSec * 1000;
      fanTimerStart = millis();
      fanTimerActive = true;
      fanTimerAction = (timerAction == "on") ? "ON" : "OFF";
      Serial.printf("Fan timer armed for %d seconds (Target: %s at PWM %d)\n",
                    durationSec, fanTimerAction.c_str(), fanTargetSpeed);
    }
  }
  // 3. TOY MOTOR CONTROLS
  else if (device == "motor") {
    if (action == "on") {
      motorOn = true;
      digitalWrite(MOTOR_PIN, HIGH);
      logDeviceEvent("motor", "turned_on", 1, "web");
    } else if (action == "off") {
      motorOn = false;
      digitalWrite(MOTOR_PIN, LOW);
      logDeviceEvent("motor", "turned_off", 0, "web");
    }
  }

  // Mark command as completed in database
  completeCommand(cmdId);

  // Immediately send state upsert to reflect new state in database
  sendHeartbeatAndState();
}

// ==============================================================================
// ACKNOWLEDGE COMMAND COMPLETION IN SUPABASE (Handles UUID string IDs)
// ==============================================================================
void completeCommand(String cmdId) {
  if (WiFi.status() != WL_CONNECTED)
    return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = getRestUrl("device_commands?id=eq." + cmdId);

  if (https.begin(client, url)) {
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Prefer", "return=minimal");

    String ts = getISTTimestamp();
    String jsonBody = "{\"status\":\"completed\"";
    if (ts.length() > 0) {
      jsonBody += ",\"completed_at\":\"" + ts + "\"";
    }
    jsonBody += "}";

    int httpCode = https.sendRequest("PATCH", jsonBody);

    if (httpCode >= 200 && httpCode < 300) {
      Serial.printf("[COMMAND COMPLETED] ID %s acknowledged\n", cmdId.c_str());
    } else {
      String err = https.getString();
      Serial.printf("[COMMAND ACK ERROR] Code %d: %s\n", httpCode, err.c_str());
    }
    https.end();
  }
}

// ==============================================================================
// LOG EVENT TO DEVICE_EVENTS TABLE
// ==============================================================================
void logDeviceEvent(String device, String eventType, int value, String source) {
  if (WiFi.status() != WL_CONNECTED)
    return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = getRestUrl("device_events");

  if (https.begin(client, url)) {
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Prefer", "return=minimal");

    String ts = getISTTimestamp();
    String jsonBody = "{\"device_id\":\"" + String(DEVICE_ID) +
                      "\",\"device\":\"" + device +
                      "\",\"event_type\":\"" + eventType +
                      "\",\"value\":" + String(value) +
                      ",\"source\":\"" + source + "\"";
    if (ts.length() > 0) {
      jsonBody += ",\"occurred_at\":\"" + ts + "\"";
    }
    jsonBody += "}";

    int httpCode = https.POST(jsonBody);
    if (httpCode >= 200 && httpCode < 300) {
      Serial.printf("[EVENT LOGGED] %s: %s (Val: %d) | %s\n", device.c_str(),
                    eventType.c_str(), value, ts.c_str());
    } else {
      String err = https.getString();
      Serial.printf("[EVENT LOG FAILED] HTTP %d: %s\n", httpCode, err.c_str());
    }
    https.end();
  }
}

// ==============================================================================
// SEND HEARTBEAT & STATE UPSERT TO DEVICE_STATE TABLE (Exact 6 columns)
// ==============================================================================
void sendHeartbeatAndState() {
  if (WiFi.status() != WL_CONNECTED)
    return;

  WiFiClientSecure client;
  client.setInsecure();

  HTTPClient https;
  String url = getRestUrl("device_state");

  if (https.begin(client, url)) {
    https.addHeader("apikey", SUPABASE_KEY);
    https.addHeader("Authorization", String("Bearer ") + SUPABASE_KEY);
    https.addHeader("Content-Type", "application/json");
    https.addHeader("Prefer", "resolution=merge-duplicates");

    String ts = getISTTimestamp();
    String jsonBody = "{\"device_id\":\"" + String(DEVICE_ID) +
                      "\",\"light_on\":" + String(ledOn ? "true" : "false") +
                      ",\"eco_mode\":" + String(ecoMode ? "true" : "false") +
                      ",\"fan_speed\":" + String(fanSpeed) +
                      ",\"motor_on\":" + String(motorOn ? "true" : "false");
    if (ts.length() > 0) {
      jsonBody += ",\"updated_at\":\"" + ts + "\"";
    }
    jsonBody += "}";

    int httpCode = https.POST(jsonBody);
    if (httpCode >= 200 && httpCode < 300) {
      Serial.printf("[HEARTBEAT] State synced to Supabase (IST: %s)\n", ts.c_str());
    } else {
      String err = https.getString();
      Serial.printf("[HEARTBEAT ERROR] HTTP code %d: %s\n", httpCode, err.c_str());
    }
    https.end();
  }
}
