/**
 * Session Store - Gestión de sesión de usuario autenticado
 *
 * Usa expo-secure-store para persistencia segura de tokens JWT:
 * - iOS: Keychain
 * - Android: EncryptedSharedPreferences
 */

import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from '@/src/app/auth/types/auth.types';

// Claves para SecureStore
const KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER: 'user',
};

// Estado en memoria
interface SessionState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
}

let state: SessionState = {
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
};

// Listeners para notificar cambios (React)
const listeners = new Set<(newState: SessionState) => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener(state));
}

// ============================================================
// FUNCIONES PRINCIPALES
// ============================================================

/**
 * Guardar sesión completa (tokens + usuario)
 */
export async function setSession(
  accessToken: string,
  refreshToken: string,
  user: AuthUser
): Promise<void> {
  try {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.ACCESS_TOKEN, accessToken),
      SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, refreshToken),
      SecureStore.setItemAsync(KEYS.USER, JSON.stringify(user)),
    ]);

    state = {
      accessToken,
      refreshToken,
      user,
      isAuthenticated: true,
    };

    notifyListeners();
  } catch (error) {
    console.error('[SessionStore] Error saving session:', error);
    throw error;
  }
}

/**
 * Recuperar sesión completa desde SecureStore
 */
export async function getSession(): Promise<SessionState> {
  try {
    const [accessToken, refreshToken, userJson] = await Promise.all([
      SecureStore.getItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.getItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.getItemAsync(KEYS.USER),
    ]);

    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;

    state = {
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user,
      isAuthenticated: !!accessToken,
    };

    return state;
  } catch (error) {
    console.error('[SessionStore] Error getting session:', error);
    return state;
  }
}

/**
 * Obtener solo el access token
 */
export async function getToken(): Promise<string | null> {
  if (state.accessToken) return state.accessToken;

  const token = await SecureStore.getItemAsync(KEYS.ACCESS_TOKEN);
  state.accessToken = token || null;
  return state.accessToken;
}

/**
 * Obtener solo el refresh token
 */
export async function getRefreshToken(): Promise<string | null> {
  if (state.refreshToken) return state.refreshToken;

  const token = await SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  state.refreshToken = token || null;
  return state.refreshToken;
}

/**
 * Obtener solo el usuario
 */
export async function getUser(): Promise<AuthUser | null> {
  if (state.user) return state.user;

  const userJson = await SecureStore.getItemAsync(KEYS.USER);
  state.user = userJson ? (JSON.parse(userJson) as AuthUser) : null;
  return state.user;
}

/**
 * Limpiar sesión completa (logout)
 */
export async function clearSession(): Promise<void> {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.ACCESS_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.USER),
    ]);

    state = {
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    };

    notifyListeners();
  } catch (error) {
    console.error('[SessionStore] Error clearing session:', error);
    throw error;
  }
}

/**
 * Verificar si está autenticado (síncrono, usa estado en memoria)
 */
export function isAuthenticated(): boolean {
  return state.isAuthenticated;
}

// ============================================================
// HOOK PARA REACT
// ============================================================

import { useState, useEffect } from 'react';

/**
 * Hook para consumir la sesión desde componentes React
 *
 * @example
 * const { session, clearSession, isAuthenticated } = useSession();
 */
export function useSession() {
  const [session, setSessionState] = useState<SessionState>(state);

  useEffect(() => {
    const listener = (newState: SessionState) => {
      setSessionState({ ...newState });
    };

    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    session,
    setSession,
    clearSession,
    getToken,
    getRefreshToken,
    getUser,
    isAuthenticated: session.isAuthenticated,
  };
}

// ============================================================
// EXPORT PARA USO FUERA DE COMPONENTES
// ============================================================

export const sessionStore = {
  setSession,
  getSession,
  clearSession,
  getToken,
  getRefreshToken,
  getUser,
  isAuthenticated,
  useSession,
};
