/**
 * AuthService - Capa de servicio para autenticación.
 *
 * Esta capa coordina la API con la sesión local:
 * - llama a los endpoints de autenticación;
 * - obtiene el usuario autenticado;
 * - guarda o limpia tokens en sessionStore;
 * - devuelve respuestas simples para que la UI no tenga que manejar excepciones.
 */

import { sessionStore } from '@/src/state/session/sessionStore';
import * as authApi from '@/src/features/auth/api/auth.api';
import type { AuthUser } from '../types/auth.types';

/**
 * Login con API real.
 *
 * @param email - Email del usuario.
 * @param password - Contraseña en texto plano introducida en el formulario.
 * @returns Objeto normalizado con success, user si todo va bien, o error si falla.
 */
export async function login(
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    /**
     * 1. Autentica credenciales y obtiene tokens.
     * Todavía no se guarda sesión hasta confirmar que el token permite leer /me.
     */
    const response = await authApi.login(email, password);

    /**
     * 2. Valida el token obteniendo el usuario actual.
     * Esto evita guardar una sesión incompleta si el backend devuelve tokens
     * pero falla la lectura del perfil autenticado.
     */
    const user = await authApi.getCurrentUser(response.access_token);

    /**
     * 3. Guarda tokens y usuario en el almacén de sesión.
     * A partir de este punto la app ya puede considerar al usuario autenticado.
     */
    await sessionStore.setSession(
      response.access_token,
      response.refresh_token,
      user
    );

    return { success: true, user };
  } catch (error) {
    /**
     * El servicio no lanza el error a la pantalla: lo convierte en una respuesta
     * controlada para simplificar el manejo desde formularios y componentes.
     */
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en login',
    };
  }
}

/**
 * Registro con API real.
 *
 * @param nombre - Nombre completo del usuario.
 * @param email - Email del usuario.
 * @param password - Contraseña en texto plano introducida en el formulario.
 * @returns Objeto normalizado con success, user si todo va bien, o error si falla.
 */
export async function register(
  nombre: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: AuthUser; error?: string }> {
  try {
    /**
     * Primero se crea el usuario en backend.
     * No se usa la respuesta directamente porque el flujo necesita dejar
     * la sesión iniciada con tokens válidos.
     */
    await authApi.register({ nombre, email, contraseña: password });

    /**
     * Login automático después del registro para reutilizar exactamente
     * el mismo flujo de guardado de sesión que en el login normal.
     */
    return await login(email, password);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error en registro',
    };
  }
}

/**
 * Logout - limpiar sesión.
 *
 * Elimina la sesión local y los tokens persistidos. No depende del backend,
 * por lo que puede ejecutarse incluso si el usuario no tiene conexión.
 */
export async function logout(): Promise<void> {
  await sessionStore.clearSession();
}
