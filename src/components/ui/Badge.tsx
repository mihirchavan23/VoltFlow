'use client';

import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  pulse = false,
  className = '',
}: BadgeProps) {
  const variantStyles = {
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    info: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
    purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    neutral: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/30',
  };

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              variant === 'success'
                ? 'bg-emerald-400'
                : variant === 'danger'
                ? 'bg-rose-400'
                : variant === 'warning'
                ? 'bg-amber-400'
                : 'bg-cyan-400'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2 w-2 ${
              variant === 'success'
                ? 'bg-emerald-500'
                : variant === 'danger'
                ? 'bg-rose-500'
                : variant === 'warning'
                ? 'bg-amber-500'
                : 'bg-cyan-500'
            }`}
          />
        </span>
      )}
      {children}
    </span>
  );
}
