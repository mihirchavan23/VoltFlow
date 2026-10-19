/**
 * Format duration in seconds to a human-readable string (e.g., "2h 45m", "15m 30s", "45s")
 */
export function formatDuration(seconds: number): string {
  if (seconds <= 0 || isNaN(seconds)) return '0s';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Format duration to high-level hours and minutes (e.g. "2 hrs 14 mins" or "< 1 min")
 */
export function formatDurationHours(hours: number): string {
  if (hours <= 0) return '0h';
  if (hours < 0.016) return '< 1 min'; // less than 1 min
  
  const totalMins = Math.round(hours * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Format timestamp into local date and time string
 */
export function formatDateTime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format timestamp into time only (HH:MM:SS AM/PM)
 */
export function formatTimeOnly(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '--';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '--';

  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Format relative time (e.g. "Just now", "15s ago", "2m ago")
 */
export function formatRelativeTime(
  dateInput: string | Date | null | undefined,
  referenceNowMs?: number
): string {
  if (!dateInput) return 'Never';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Unknown';

  // During SSR prerender in Next.js 16, avoid calling Date.now() to prevent unstable prerender warnings
  const currentMs =
    typeof referenceNowMs === 'number'
      ? referenceNowMs
      : typeof window !== 'undefined'
      ? Date.now()
      : d.getTime();

  const diffSeconds = Math.max(0, Math.floor((currentMs - d.getTime()) / 1000));

  if (diffSeconds < 5) return 'Just now';
  if (diffSeconds < 60) return `${diffSeconds}s ago`;
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Format Indian Rupee currency (₹)
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format kWh energy reading
 */
export function formatKWh(kWh: number): string {
  if (isNaN(kWh) || kWh === 0) return '0.000 kWh';
  if (kWh < 0.001) return '< 0.001 kWh';
  return `${kWh.toFixed(3)} kWh`;
}

/**
 * Get readable speed label from fan PWM value
 */
export function getFanSpeedLabel(pwm: number): { label: string; step: number; percent: number } {
  if (pwm <= 0) return { label: 'OFF', step: 0, percent: 0 };
  if (pwm <= 100) return { label: 'Speed 1 (Low)', step: 1, percent: Math.round((pwm / 255) * 100) };
  if (pwm <= 180) return { label: 'Speed 2 (Medium)', step: 2, percent: Math.round((pwm / 255) * 100) };
  return { label: 'Speed 3 (High)', step: 3, percent: Math.round((pwm / 255) * 100) };
}
