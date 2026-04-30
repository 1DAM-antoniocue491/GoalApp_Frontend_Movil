/**
 * Cliente HTTP base para la API de GoalApp
 *
 * Características:
 * - Inyección automática de token de autenticación
 * - Timeout configurable
 * - Retry con backoff exponencial para errores 5xx y network
 * - Refresh automático de token en 401 (un intento)
 * - Manejo de errores con ApiError
 */

import { ENV } from '@/src/shared/constants/env';
import { setupAuthInterceptor } from './interceptors';
import { ApiError } from './errors';
import { sessionStore } from '@/src/state/session/sessionStore';
import { logger } from '@/src/shared/utils/logger';

// Re-exportar ApiError para que los consumidores no necesiten cambiar sus imports
export { ApiError } from './errors';

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  status: number;
}

/**
 * Cliente HTTP para la API de GoalApp
 *
 * @example
 * const user = await apiClient.get<User>('/auth/me');
 * const league = await apiClient.post<League>('/ligas/', { nombre: '...' });
 */
export const apiClient = {
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'GET' });
  },

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'POST', body });
  },

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'PUT', body });
  },

  async patch<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'PATCH', body });
  },

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { method: 'DELETE' });
  },

  /**
   * POST con form-urlencoded (para login OAuth2)
   */
  async postForm<T>(endpoint: string, body: URLSearchParams): Promise<ApiResponse<T>> {
    return requestForm<T>(endpoint, { method: 'POST', body });
  },
};

/**
 * Intenta renovar el access token usando el refresh token.
 *
 * Endpoint: POST /auth/refresh?token=<refresh_token>
 * Devuelve el nuevo access token o null si el refresh falla.
 */
async function tryRefreshToken(): Promise<string | null> {
  const refreshToken = await sessionStore.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const response = await fetch(
      `${ENV.API_URL}/auth/refresh?token=${encodeURIComponent(refreshToken)}`,
      { method: 'POST' },
    );

    if (!response.ok) return null;

    const body = await response.json();
    const newAccessToken: string | undefined = body.access_token;
    const newRefreshToken: string = body.refresh_token ?? refreshToken;

    if (!newAccessToken) return null;

    const user = await sessionStore.getUser();
    if (user) {
      await sessionStore.setSession(newAccessToken, newRefreshToken, user);
    }

    logger.info('api/refresh', 'Token renovado correctamente');
    return newAccessToken;
  } catch (error) {
    logger.warn('api/refresh', 'Refresh fallido', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions,
  retryCount = 0,
  // Previene un segundo intento de refresh en la misma cadena de requests
  retried401 = false,
): Promise<ApiResponse<T>> {
  const url = `${ENV.API_URL}${endpoint}`;

  // Headers con token inyectado
  const headers = await setupAuthInterceptor();

  // Timeout configurable
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ENV.REQUEST_TIMEOUT * 1000);

  try {
    logger.debug('api/request', `${options.method} ${endpoint}`);

    const response = await fetch(url, {
      method: options.method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 401 → intentar refresh una sola vez
      if (response.status === 401 && !retried401) {
        logger.info('api/401', `Token expirado en ${endpoint}, intentando refresh`);

        const newToken = await tryRefreshToken();

        if (newToken) {
          // Reintentar la request original con el token nuevo
          return request<T>(endpoint, options, retryCount, true);
        }

        // Refresh fallido → limpiar sesión y propagar 401
        logger.warn('api/401', 'Refresh fallido, limpiando sesión');
        await sessionStore.clearSession();
      }

      const errorText = await response.text();
      logger.warn('api/response', `${response.status} en ${endpoint}`, {
        status: response.status,
        error: errorText,
      });
      throw new ApiError(response.status, errorText);
    }

    const data = await response.json();
    logger.debug('api/response', `${response.status} en ${endpoint}`, {
      status: response.status,
    });
    return { data, status: response.status };
  } catch (error) {
    clearTimeout(timeoutId);

    // AbortError (timeout de AbortController) → error controlado 408
    // En Hermes (React Native), el DOMException de abort puede NO heredar de Error,
    // por lo que no se puede usar instanceof Error. Se comprueba name y message directamente.
    const isAbort =
      (error != null && (error as { name?: string }).name === 'AbortError') ||
      (error instanceof Error && error.message === 'Aborted') ||
      String(error) === 'Aborted';

    if (isAbort) {
      throw new ApiError(408, 'La petición tardó demasiado. Inténtalo de nuevo.');
    }

    // Reintentar para errores de red o 5xx
    if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
      if (retryCount < ENV.MAX_RETRIES) {
        logger.info('api/retry', `Reintentando ${endpoint}`, {
          retry: retryCount + 1,
          max: ENV.MAX_RETRIES,
        });

        // Backoff exponencial: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

        return request<T>(endpoint, options, retryCount + 1, retried401);
      }
    }

    throw error;
  }
}

async function requestForm<T>(
  endpoint: string,
  options: { method: 'POST'; body: URLSearchParams },
): Promise<ApiResponse<T>> {
  const url = `${ENV.API_URL}${endpoint}`;

  const response = await fetch(url, {
    method: options.method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: options.body.toString(),
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  const data = await response.json();
  return { data, status: response.status };
}
