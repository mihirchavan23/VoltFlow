import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'VoltFlow | ESP32 Smart Home Dashboard',
  description:
    'Complete IoT smart home remote control, fan speed regulator, PIR eco mode, hardware timers, and electricity usage monitoring powered by ESP32 and Supabase.',
};

import { AuthProvider } from '@/lib/auth/authContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen selection:bg-blue-500 selection:text-white font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
