'use client';

import React, { useState, useEffect } from 'react';
import { formatRelativeTime } from '@/lib/utils/formatters';

interface TimeAgoProps {
  date: string | Date | null | undefined;
  prefix?: string;
  suffix?: string;
  className?: string;
  fallback?: string;
}

/**
 * Hydration-safe live relative time component
 * Renders identically on SSR and initial client hydration, then smoothly activates
 * live relative time counter (auto-updating every 10 seconds).
 */
export function TimeAgo({
  date,
  prefix = '',
  suffix = '',
  className = '',
  fallback = '--',
}: TimeAgoProps) {
  const [mounted, setMounted] = useState(false);
  const [relativeText, setRelativeText] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    if (!date) return;

    const update = () => {
      setRelativeText(formatRelativeTime(date, Date.now()));
    };

    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, [date]);

  // On SSR & initial client hydration pass, render consistent fallback to guarantee 0 hydration mismatch
  if (!mounted || !date) {
    return (
      <span className={className} suppressHydrationWarning>
        {prefix}
        {fallback}
        {suffix}
      </span>
    );
  }

  return (
    <span className={className} suppressHydrationWarning>
      {prefix}
      {relativeText || fallback}
      {suffix}
    </span>
  );
}
