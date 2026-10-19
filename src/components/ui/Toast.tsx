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
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isPending = toast.type === 'pending';
        const isInfo = toast.type === 'info';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 ${
              isSuccess
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-100'
                : isError
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-100'
                : isPending
                ? 'bg-amber-950/80 border-amber-500/30 text-amber-100'
                : 'bg-slate-900/80 border-slate-700/50 text-slate-100'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isError && <AlertTriangle className="w-5 h-5 text-rose-400" />}
              {isPending && <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />}
              {isInfo && <Info className="w-5 h-5 text-cyan-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold">{toast.title}</div>
              <div className="text-xs opacity-90 break-words mt-0.5">{toast.message}</div>
            </div>

            <button
              onClick={() => onDismiss(toast.id)}
              className="shrink-0 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
