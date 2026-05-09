/**
 * Auth API - Endpoints de autenticación.
 *
 * Esta capa solo se encarga de hablar con el backend:
 * - construye las peticiones HTTP;
 * - adapta los nombres de campos que espera la API;
 * - transforma respuestas fallidas en errores controlados.
 *
 * No debe guardar sesión ni modificar estado global. Esa responsabilidad queda
 * para la capa de servicio/hooks.
 */

import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordRecoveryResponse,
  PasswordResetConfirm,
  PasswordResetResponse,
  AuthUser,
} from '../types/auth.types';
import { ENV } from '@/src/shared/constants/env';

/**
 * URL base compartida por toda la app.
 * Mantenerla centralizada evita que cada endpoint apunte a entornos distintos
 * por error: local, staging o producción.
 */
const BASE_URL = ENV.API_URL;

/**
 * LOGIN - POST /api/v1/auth/login
 *
 * El backend usa OAuth2PasswordRequestForm, por eso no se envía JSON.
 * FastAPI espera los campos como formulario codificado:
 * - username: aquí usamos el email del usuario;
 * - password: contraseña introducida en el formulario.
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  /**
   * URLSearchParams genera el formato application/x-www-form-urlencoded
   * que necesita OAuth2PasswordRequestForm.
   */
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    /**
     * En login el backend puede devolver texto plano.
     * Se lee como text() para no romper si no llega un JSON válido.
     */
    const error = await response.text();
    throw new Error(error || 'Error en login');
  }

  return response.json();
}

/**
 * REGISTER - POST /api/v1/usuarios/
 *
 * El registro pertenece al recurso usuarios, no a /auth/.
 * Importante: el backend espera el campo `contraseña` con ñ.
 */
export async function register(
  data: RegisterRequest
): Promise<RegisterResponse> {
  const response = await fetch(`${BASE_URL}/usuarios/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombre: data.nombre,
      email: data.email,
      /**
       * No cambiar a `password` ni `contrasena` si el backend mantiene
       * el schema actual. El nombre debe coincidir exactamente con la API.
       */
      contraseña: data.contraseña,
    }),
  });

  if (!response.ok) {
    /**
     * En registro normalmente llega un JSON con `detail`.
     * El catch evita que la app falle si el backend responde con otro formato.
     */
    const error = await response.json().catch(() => ({ detail: 'Error en registro' }));
    throw new Error(error.detail || 'Error en registro');
  }

  return response.json();
}

/**
 * FORGOT PASSWORD - POST /api/v1/auth/forgot-password
 *
 * Por seguridad, el backend debería responder igual aunque el email no exista.
 * Así se evita revelar qué correos están registrados en la aplicación.
 */
export async function forgotPassword(
  email: string
): Promise<PasswordRecoveryResponse> {
  const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    /**
     * Mensaje genérico intencionado: no se debe indicar si el email existe o no.
     */
    throw new Error('Error en recuperación');
  }

  return response.json();
}

/**
 * RESET PASSWORD - POST /api/v1/auth/reset-password
 *
 * Confirma el cambio de contraseña usando el token recibido por email.
 */
export async function resetPassword(
  data: PasswordResetConfirm
): Promise<PasswordResetResponse> {
  const response = await fetch(`${BASE_URL}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      token: data.token,
      /**
       * Nombre exacto esperado por el backend.
       * Si se cambia aquí sin cambiar el backend, el reset dejará de funcionar.
       */
      nueva_contrasena: data.nueva_contrasena,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error al resetear contraseña');
  }

  return response.json();
}

/**
 * GET CURRENT USER - GET /api/v1/auth/me
 *
 * Se usa después del login para obtener los datos reales del usuario autenticado.
 * El token debe enviarse como Bearer porque este endpoint está protegido.
 */
export async function getCurrentUser(
  accessToken: string
): Promise<AuthUser> {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    /**
     * Si este endpoint falla después del login, la sesión no debe guardarse
     * porque no tenemos un usuario válido asociado al token.
     */
    throw new Error('Error al obtener usuario');
  }

  return response.json();
}
