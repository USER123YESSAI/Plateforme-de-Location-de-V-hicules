import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { 
  getAuthToken, 
  saveAuthToken, 
  getUserData, 
  saveUserData, 
  clearAllAuth 
} from '../services/authStorage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (name: string, email: string, password: string, password_confirmation: string, phone?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function handleAuthResponse(res: any): Promise<{ token: string | null; user: User | null }> {
  const authToken = res.data.access_token || res.data.token;
  const userData = res.data.user;

  if (authToken) {
    await saveAuthToken(authToken);
  }
  if (userData) {
    await saveUserData(userData);
  }

  return { token: authToken || null, user: userData || null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  async function loadStoredAuth() {
    try {
      const storedToken = await getAuthToken();
      const storedUser = await getUserData<User>();

      if (storedToken) {
        setToken(storedToken);
        if (storedUser) {
          setUser(storedUser);
        }
        // Rafraîchir l'utilisateur via l'API
        try {
          const res = await api.get('/auth/me');
          if (res.data?.data) {
            setUser(res.data.data);
            await saveUserData(res.data.data);
          }
        } catch (e) {
          // Si le token est expiré
          if ((e as any)?.response?.status === 401) {
            await clearAllAuth();
            setToken(null);
            setUser(null);
          }
        }
      }
    } catch (e) {
      console.warn('Erreur lors du chargement de la session:', e);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const res = await api.post('/auth/login', { email, password });
      const auth = await handleAuthResponse(res);
      if (auth.token) setToken(auth.token);
      if (auth.user) setUser(auth.user);
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Identifiants invalides ou erreur de connexion.';
      return { success: false, message: msg };
    }
  }

  async function register(
    name: string,
    email: string,
    password: string,
    password_confirmation: string,
    phone?: string
  ) {
    try {
      const res = await api.post('/auth/register', {
        name, email, password, password_confirmation, phone, accept_terms: true,
      });
      const auth = await handleAuthResponse(res);
      if (auth.token) setToken(auth.token);
      if (auth.user) setUser(auth.user);
      return { success: true };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erreur lors de l'inscription.";
      return { success: false, message: msg };
    }
  }

  async function logout() {
    try {
      if (token) {
        await api.post('/auth/logout').catch(() => {});
      }
    } finally {
      await clearAllAuth();
      setToken(null);
      setUser(null);
    }
  }

  async function refreshUser() {
    try {
      const res = await api.get('/auth/me');
      if (res.data?.data) {
        setUser(res.data.data);
        await saveUserData(res.data.data);
      }
    } catch (e) {
      // Ignorer
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l\u0027intérieur d\u0027un AuthProvider");
  }
  return context;
}
