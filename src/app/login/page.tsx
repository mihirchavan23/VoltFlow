'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/authContext';
import {
  Zap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Shield,
  ArrowRight,
  AlertCircle,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim() || !password.trim()) {
      setErrorMessage('Please enter both email/username and password.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(identity, password);
    if (result.success) {
      router.push('/');
    } else {
      setErrorMessage(result.error || 'Failed to authenticate.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 overflow-hidden bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-white">
      {/* Ambient Cybernetic Gradient Orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-cyan-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Cyber Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-[2px] shadow-[0_0_35px_rgba(6,182,212,0.5)] mb-4">
            <div className="w-full h-full rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
              <Zap className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
            VoltFlow IoT
          </h1>
          <p className="mt-1 text-sm text-slate-400 font-medium">
            Smart Home Automation & Gateway Portal
          </p>
        </div>

        {/* Main Login Card */}
        <div className="relative rounded-3xl border border-slate-800/80 bg-slate-900/75 backdrop-blur-2xl p-6 sm:p-8 shadow-[0_8px_32px_rgba(0,0,0,0.45)]">
          {/* Subtle Top Accent Glow Line */}
          <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-80" />

          {/* Subtitle */}
          <div className="mb-6">
            <h2 className="text-lg font-bold text-white tracking-tight">Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your authorized credentials to access system controls.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-500/40 bg-rose-950/30 p-3 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Email Address or Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Enter email or username"
                  autoComplete="username"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-cyan-500/20 focus:ring-offset-0"
                />
                <span>Remember session</span>
              </label>
              <span className="text-cyan-400/80 text-[11px] font-mono">
                Encrypted Gate
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full relative mt-3 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_25px_rgba(6,182,212,0.55)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 text-cyan-200" />
                  <span>Sign In to VoltFlow Dashboard</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              ESP32-WROOM-32 Gateway
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Secure Link Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
