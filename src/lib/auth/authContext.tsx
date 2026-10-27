'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  role: 'admin' | 'operator';
  avatar?: string;
  lastLogin: string;
}

export interface CredentialConfig {
  label: string;
  role: 'admin' | 'operator';
  email: string;
  username: string;
  password: string;
}

// Authorized credentials: ONLY homeautos@test.com / admin@12345
export const AUTHORIZED_CREDENTIALS: CredentialConfig[] = [
  {
    label: 'Home Automation Admin',
    role: 'admin',
    email: 'homeautos@test.com',
    username: 'homeautos',
    password: 'admin@12345',
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identity: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'voltflow_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore authenticated session on mount (validating against current authorized credentials)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const isValid = AUTHORIZED_CREDENTIALS.some(
          (c) => c.email.toLowerCase() === (parsed?.email || '').toLowerCase()
        );
        if (isValid) {
          setUser(parsed);
        } else {
          // Invalidate outdated sessions from older demo credentials
          localStorage.removeItem(AUTH_STORAGE_KEY);
          setUser(null);
        }
      }
    } catch (err) {
      console.warn('[VoltFlow Auth] Failed to restore session:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(
    async (identity: string, pass: string): Promise<{ success: boolean; error?: string }> => {
      // Simulate micro network delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      const cleanIdentity = identity.trim().toLowerCase();
      const cleanPass = pass.trim();

      const matched = AUTHORIZED_CREDENTIALS.find(
        (cred) =>
          (cred.email.toLowerCase() === cleanIdentity ||
            cred.username.toLowerCase() === cleanIdentity) &&
          cred.password === cleanPass
      );

      if (!matched) {
        return {
          success: false,
          error: 'Invalid email/username or password. Access denied.',
        };
      }

      const authenticatedUser: User = {
        id: matched.username,
        email: matched.email,
        username: matched.username,
        name: matched.label,
        role: matched.role,
        lastLogin: new Date().toISOString(),
      };

      setUser(authenticatedUser);
      try {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authenticatedUser));
      } catch (err) {
        console.warn('[VoltFlow Auth] Failed to save session:', err);
      }

      return { success: true };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.warn('[VoltFlow Auth] Failed to remove session:', err);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
