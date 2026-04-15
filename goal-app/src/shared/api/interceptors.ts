/**
 * Interceptores para el cliente HTTP
 *
 * Prepara la infraestructura para:
 * - Añadir token de autenticación a cada request
 * - Manejar errores 401 (token expirado)
 * - Log de requests en desarrollo
 */

import { apiClient, ApiError } from './client';

/**
 * Interceptor de autenticación
 *
 * Añade el token JWT a cada request cuando esté disponible.
 * TODO: Integrar con el store de sesión cuando se implemente.
 */
export function setupAuthInterceptor(getToken: () => string | null) {
  // La lógica de inyección del token ya está preparada en client.ts
  // Este interceptor se activará cuando el store de sesión esté disponible
  console.log('[Interceptors] Auth interceptor configured');
}

/**
 * Interceptor de errores
 *
 * Maneja errores comunes de la API:
 * - 401: Redirigir a login
 * - 403: Acceso denegado
 * - 500: Error del servidor
 */
export function setupErrorInterceptors(
  onUnauthorized?: () => void,
  onForbidden?: () => void,
) {
  // TODO: Implementar manejo global de errores cuando se conecte al backend
  console.log('[Interceptors] Error interceptors configured');
}