export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface DeviceState {
  device_id: string;
  light_on: boolean;
  eco_mode: boolean;
  fan_speed: number; // 0, 80, 150, 255
  motor_on: boolean;
  updated_at: string;
  // Extended fields for high-fidelity timer tracking and heartbeat
  light_timer_active?: boolean | null;
  light_timer_remaining?: number | null;
  light_timer_action?: 'ON' | 'OFF' | string | null;
  fan_timer_active?: boolean | null;
  fan_timer_remaining?: number | null;
  fan_timer_action?: 'ON' | 'OFF' | string | null;
}

export interface DeviceCommand {
  id?: number | string;
  device_id: string;
  device: 'light' | 'fan' | 'motor' | string;
  action: 'on' | 'off' | 'speed' | 'eco' | 'normal' | 'set_timer' | string;
  value: number | string;
  duration_seconds: number;
  timer_action: 'on' | 'off' | string;
  status: 'pending' | 'executing' | 'completed' | 'failed' | string;
  created_at?: string;
  completed_at?: string | null;
}

export interface DeviceEvent {
  id: number | string;
  device_id: string;
  device: 'light' | 'fan' | 'motor' | string;
  event_type: 'state_change' | 'motion_detected' | 'timer_expired' | 'speed_change' | 'mode_change' | string;
  value: number | string;
  source: 'mobile' | 'PIR' | 'timer' | 'web' | 'esp32' | 'physical' | string;
  occurred_at: string;
  created_at?: string;
}

export interface Database {
  public: {
    Tables: {
      device_state: {
        Row: DeviceState;
        Insert: DeviceState;
        Update: Partial<DeviceState>;
        Relationships: [];
      };
      device_commands: {
        Row: DeviceCommand;
        Insert: {
          id?: number | string;
          device_id: string;
          device: string;
          action: string;
          value?: number | string;
          duration_seconds?: number;
          timer_action?: string;
          status?: string;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: Partial<DeviceCommand>;
        Relationships: [];
      };
      device_events: {
        Row: DeviceEvent;
        Insert: {
          id?: number | string;
          device_id: string;
          device: string;
          event_type: string;
          value?: number | string;
          source?: string;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<DeviceEvent>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
