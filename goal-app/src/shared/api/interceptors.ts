/**
 * Interceptores HTTP para autenticación
 *
 * Utilidad pura: solo lee el token y construye headers.
 * No importa nada de client.ts → sin require-cycle.
 * La lógica de refresh y 401 vive en client.ts.
 */

import { sessionStore } from '@/src/state/session/sessionStore';
import { ApiError } from './errors';

/**
 * Construye los headers de autenticación para cada request.
 * Inyecta el token JWT si existe en la sesión.
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

/** Verifica si un error es 401 (token inválido o expirado) */
export function isUnauthorizedError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

/** Verifica si un error es 403 (acceso denegado) */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}
