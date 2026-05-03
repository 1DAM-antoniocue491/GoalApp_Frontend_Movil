/**
 * AuthProvider - Contexto global de autenticación
 *
 * Provee el estado de autenticación a toda la app:
 * - user: usuario autenticado
 * - isAuthenticated: boolean
 * - isLoading: cargando sesión inicial
 * - login, logout, register: funciones
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { sessionStore } from '@/src/state/session/sessionStore';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/src/features/auth/services/authService';
import type { AuthUser } from '@/src/features/auth/types/auth.types';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (nombre: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  /** Actualiza los datos del usuario en el contexto tras edición de perfil */
  updateUser: (partial: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inicializar sesión al montar
  useEffect(() => {
    async function initSession() {
      try {
        const session = await sessionStore.getSession();
        if (session.isAuthenticated && session.user) {
          setUser(session.user);
        }
      } catch (err) {
        console.error('[AuthProvider] Error loading session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    initSession();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await apiLogin(email, password);
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.error || 'Error en login');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en login');
      throw err;
    }
  };

  const register = async (nombre: string, email: string, password: string) => {
    try {
      setError(null);
      const result = await apiRegister(nombre, email, password);
      if (result.success && result.user) {
        setUser(result.user);
      } else {
        throw new Error(result.error || 'Error en registro');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en registro');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await apiLogout();
      setUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en logout');
    }
  };

  const clearError = () => setError(null);

  /** Merge parcial de datos de usuario sin sobreescribir todo el estado de auth */
  const updateUser = (partial: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      register,
      logout,
      clearError,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
