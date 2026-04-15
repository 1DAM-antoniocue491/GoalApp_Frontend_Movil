/**
 * Cliente HTTP base para la API de GoalApp
 *
 * Este módulo prepara la infraestructura para cuando se conecte al backend real.
 * Actualmente los servicios usan mocks, pero la estructura está lista
 * para sustituir por llamadas HTTP reales.
 */

import { ENV } from '@/src/shared/constants/env';

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
 * const user = await apiClient.get<User>('/users/me');
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
};

async function request<T>(
  endpoint: string,
  options: RequestOptions,
): Promise<ApiResponse<T>> {
  const url = `${ENV.API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // TODO: Añadir token de autenticación cuando esté disponible
  // const token = await getToken();
  // if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method: options.method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
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