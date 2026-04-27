/**
 * AuthService - Capa de servicio para autenticación
 *
 * Conecta con la API real y gestiona la sesión:
 * - login: autenticar usuario y guardar sesión
 * - register: crear usuario y hacer login automático
 * - logout: limpiar sesión
 */

import { sessionStore } from '@/src/state/session/sessionStore';
import * as authApi from '@/src/app/auth/api/auth.api';
import type { AuthUser } from '../types/auth.types';

/**
 * Login con API real
 *
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Objeto con success, user (si éxito) o error (si fallo)
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // 1. Llamar a la API
    const response = await authApi.login(email, password);

    // 2. Obtener usuario actual con el token
    const user = await authApi.getCurrentUser(response.access_token);

    // 3. Guardar sesión
    await sessionStore.setSession(
      response.access_token,
      response.refresh_token,
      user
    );

    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en login',
    };
  }
}

/**
 * Registro con API real
 *
 * @param nombre - Nombre completo del usuario
 * @param email - Email del usuario
 * @param password - Contraseña en texto plano
 * @returns Objeto con success, user (si éxito) o error (si fallo)
 */
export async function register(
  nombre: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    // 1. Llamar a la API de registro
    const response = await authApi.register({ nombre, email, contraseña: password });

    // 2. Login automático tras registro
    return await login(email, password);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en registro',
    };
  }
}

/**
 * Logout - limpiar sesión
 *
 * Limpia el sessionStore y elimina tokens de SecureStore
 */
export async function logout(): Promise<void> {
  await sessionStore.clearSession();
}
