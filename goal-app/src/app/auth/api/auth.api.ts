/**
 * Auth API - Endpoints de autenticación
 *
 * Conecta con el backend de GoalApp para:
 * - Login (OAuth2PasswordRequestForm)
 * - Registro
 * - Recuperación de contraseña
 * - Reset de contraseña
 * - Obtener usuario actual
 */

import type {
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordRecoveryResponse,
  PasswordRecoveryRequest,
  PasswordResetConfirm,
  PasswordResetResponse,
  AuthUser,
} from '../types/auth.types';

const BASE_URL = 'https://goalapp-backend-j2cx.onrender.com/api/v1';

/**
 * LOGIN - POST /api/v1/auth/login
 *
 * El backend usa OAuth2PasswordRequestForm que espera form-data
 * con 'username' (no 'email') y 'password'
 */
export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {
  // Crear FormData para application/x-www-form-urlencoded
  const formData = new URLSearchParams();
  formData.append('username', email);  // Backend espera 'username'
  formData.append('password', password);

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Error en login');
  }

  return response.json();
}

/**
 * REGISTER - POST /api/v1/usuarios/
 *
 * Nota: El registro está en /usuarios/, no en /auth/
 * El backend espera 'contraseña' con ñ
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
      contraseña: data.contraseña,  // Con ñ
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Error en registro' }));
    throw new Error(error.detail || 'Error en registro');
  }

  return response.json();
}

/**
 * FORGOT PASSWORD - POST /api/v1/auth/forgot-password
 *
 * El backend siempre devuelve 200 por seguridad (no enumera emails)
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
    // El backend siempre devuelve 200 por seguridad
    throw new Error('Error en recuperación');
  }

  return response.json();
}

/**
 * RESET PASSWORD - POST /api/v1/auth/reset-password
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
 * Requiere token en header Authorization
 */
export async function getCurrentUser(
  accessToken: string
): Promise<AuthUser> {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Error al obtener usuario');
  }

  return response.json();
}
