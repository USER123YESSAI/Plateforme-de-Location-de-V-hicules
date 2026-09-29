"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

type User = {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'client';
  phone?: string;
  address?: string;
  license_number?: string;
  license_expiry?: string;
  terms_accepted?: boolean;
  terms_accepted_at?: string | null;
  terms_version?: string | null;
  terms_update_required?: boolean;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function clearStoredAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  if (typeof window !== 'undefined') {
    document.cookie = 'token=; path=/; max-age=0; SameSite=Strict';
  }
}

function persistAuth(token: string, user: User) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
}

function setCookieToken(token: string) {
  if (typeof window !== 'undefined') {
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Strict${secure}`;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    validateSession();
  }, []);

  async function validateSession() {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Verify with backend and refresh user state
        const profileRes = await api.get('/auth/profile');
        if (profileRes.data) {
          setUser(profileRes.data);
          localStorage.setItem('user', JSON.stringify(profileRes.data));
        }
      } catch (error) {
        console.warn("[Auth] Session validation failed, logging out:", error);
        clearStoredAuth();
        setToken(null);
        setUser(null);
      }
    }
    setLoading(false);
  }

  const login = (newToken: string, newUser: User) => {
    persistAuth(newToken, newUser);
    setCookieToken(newToken);
    setToken(newToken);
    setUser(newUser);

    if (newUser.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/client/my-rentals');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
    } finally {
      clearStoredAuth();
      setToken(null);
      setUser(null);
    }
  };

  const updateUser = (newUser: User) => {
    localStorage.setItem('user', JSON.stringify(newUser));
    setUser(newUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
