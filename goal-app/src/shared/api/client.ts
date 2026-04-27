/**
 * Cliente HTTP base para la API de GoalApp
 *
 * Características:
 * - Inyección automática de token de autenticación
 * - Timeout configurable
 * - Retry con backoff exponencial para errores 5xx y network
 * - Manejo de errores con ApiError
 */

import { ENV } from '@/src/shared/constants/env';
import { setupAuthInterceptor } from './interceptors';
import { logger } from '@/src/shared/utils/logger';

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
 * const league = await apiClient.post<League>('/leagues', { name: '...' });
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

async function request<T>(
  endpoint: string,
  options: RequestOptions,
  retryCount = 0,
): Promise<ApiResponse<T>> {
  const url = `${ENV.API_URL}${endpoint}`;

  // Obtener headers con token desde interceptor
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

    // Reintentar para errores de red o 5xx
    if (error instanceof TypeError || (error instanceof ApiError && error.status >= 500)) {
      if (retryCount < ENV.MAX_RETRIES) {
        logger.info('api/retry', `Reintentando ${endpoint}`, {
          retry: retryCount + 1,
          max: ENV.MAX_RETRIES,
        });

        // Backoff exponencial: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retryCount) * 1000));

        return request<T>(endpoint, options, retryCount + 1);
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

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
