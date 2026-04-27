/**
 * Interceptores HTTP para autenticación y manejo de errores
 *
 * - setupAuthInterceptor: Añade token JWT a cada request
 * - setupErrorInterceptors: Maneja errores 401, 403, 500 con refresh automático
 */

import { sessionStore } from '@/src/state/session/sessionStore';
import { router } from 'expo-router';
import { routes } from '@/src/shared/config/routes';
import { ApiError } from './client';

// Estado para refresh token
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

/**
 * Interceptor de autenticación
 *
 * Obtiene el token del sessionStore y lo añade al header Authorization.
 * Se llama automáticamente antes de cada petición a la API.
 */
export async function setupAuthInterceptor(): Promise<HeadersInit> {
  const token = await sessionStore.getToken();

  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    };
  }

  return {
    'Content-Type': 'application/json',
  };
}

/**
 * Refresh token automático
 *
 * Llama al endpoint /auth/refresh para obtener nuevo access token
 */
async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = await sessionStore.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL_PROD || 'https://goalapp-backend-j2cx.onrender.com/api/v1'}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: refreshToken }),
    });

    if (!response.ok) {
      throw new Error('Refresh fallido');
    }

    const { access_token } = await response.json();

    // Actualizar token en sessionStore
    const user = await sessionStore.getUser();
    if (user) {
      await sessionStore.setSession(access_token, refreshToken, user);
    }

    return access_token;
  } catch (error) {
    console.error('[Interceptors] Refresh token fallido:', error);
    return null;
  }
}

/**
 * Interceptor de errores
 *
 * Maneja errores comunes de la API:
 * - 401: Token expirado → intenta refresh → si falla, logout
 * - 403: Acceso denegado
 * - 500: Error del servidor
 *
 * @param onUnauthorized - Callback cuando el token no es válido
 * @param onForbidden - Callback cuando no hay permisos
 */
export function setupErrorInterceptors(
  onUnauthorized?: () => void,
  onForbidden?: () => void,
): (error: ApiError) => never {
  return function handleApiError(error: ApiError): never {
    switch (error.status) {
      case 401:
        console.error('[Interceptors] 401 - Token expirado');

        if (!isRefreshing) {
          isRefreshing = true;

          refreshAuthToken().then((newToken) => {
            if (newToken) {
              // Notificar a requests pendientes
              onTokenRefreshed(newToken);
            } else {
              // Refresh fallido → logout
              sessionStore.clearSession().catch(console.error);
              router.replace(routes.public.auth.login);
              onUnauthorized?.();
            }
            isRefreshing = false;
          });
        }

        onUnauthorized?.();
        break;

      case 403:
        console.error('[Interceptors] 403 - Prohibido');
        onForbidden?.();
        break;

      case 500:
        console.error('[Interceptors] 500 - Error del servidor');
        break;

      default:
        console.error(`[Interceptors] ${error.status} - ${error.message}`);
    }

    throw error;
  };
}

/**
 * Verifica si un error es 401 (token expirado)
 */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/**
 * Verifica si un error es 403 (acceso denegado)
 */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
