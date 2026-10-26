'use client';

import React from 'react';
import { ToastMessage } from '@/types/smartHome.types';
import { CheckCircle2, AlertTriangle, Info, Loader2, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-3 sm:bottom-5 inset-x-3 sm:inset-x-auto sm:right-5 z-50 flex flex-col gap-2 w-auto sm:w-full sm:max-w-sm pointer-events-none items-center sm:items-end">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isPending = toast.type === 'pending';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl border backdrop-blur-xl transition-all duration-300 w-full max-w-[calc(100vw-1.5rem)] sm:max-w-sm overflow-hidden box-border animate-in slide-in-from-bottom-2 ${
              isSuccess
                ? 'bg-slate-900/95 dark:bg-[#06101e]/95 border-emerald-500/50 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                : isError
                ? 'bg-slate-900/95 dark:bg-[#1a080d]/95 border-rose-500/50 text-rose-100 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                : isPending
                ? 'bg-slate-900/95 dark:bg-[#191105]/95 border-amber-500/50 text-amber-100 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                : 'bg-slate-900/95 dark:bg-[#070e1c]/95 border-cyan-500/40 text-cyan-100 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]" />}
              {isError && <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]" />}
              {isPending && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-spin" />}
              {isInfo && <Info className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="text-xs sm:text-sm font-bold tracking-tight truncate">{toast.title}</div>
              <div className="text-[11px] sm:text-xs opacity-90 break-words mt-0.5 leading-relaxed">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
