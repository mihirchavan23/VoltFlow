import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// Read configuration from environment variables with client fallback
const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const DEFAULT_DEVICE_ID =
  process.env.NEXT_PUBLIC_DEFAULT_DEVICE_ID || 'esp32-home-01';

/**
 * Returns true if valid-looking Supabase credentials are configured in environment or localStorage.
 */
export function getSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  // Check localStorage if running in browser
  let localUrl = '';
  let localKey = '';
  if (typeof window !== 'undefined') {
    localUrl = localStorage.getItem('supabase_url') || '';
    localKey = localStorage.getItem('supabase_anon_key') || '';
  }

  const url = (envUrl || localUrl || '').trim();
  const anonKey = (envAnonKey || localKey || '').trim();

  const isConfigured = Boolean(
    url &&
    anonKey &&
    !url.includes('YOUR_SUPABASE') &&
    url.startsWith('https://') &&
    anonKey.length > 20
  );

  return { url, anonKey, isConfigured };
}

let supabaseInstance: SupabaseClient | null = null;
let currentConfiguredKey = '';

/**
 * Returns the typed Supabase client singleton.
 * If credentials are not yet configured or invalid, returns a client instance configured
 * with fallback placeholders or null if completely blank.
 */
export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getSupabaseCredentials();

  if (!isConfigured) {
    return null;
  }

  if (supabaseInstance && currentConfiguredKey === `${url}_${anonKey}`) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    currentConfiguredKey = `${url}_${anonKey}`;
    return supabaseInstance;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    return null;
  }
}
