'use client';

import { useState, useEffect, useCallback } from 'react';

export type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  const applyTheme = useCallback((t: Theme) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
      root.style.colorScheme = 'light';
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('smart_home_theme') as Theme | null;
    const initial: Theme = stored === 'light' || stored === 'dark' ? stored : 'dark';
    setTheme(initial);
    applyTheme(initial);
  }, [applyTheme]);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('smart_home_theme', next);
    }
    applyTheme(next);
  };

  return { theme, toggleTheme, isDark: theme === 'dark', mounted };
}
