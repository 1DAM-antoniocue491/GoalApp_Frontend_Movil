/**
 * Tipos de autenticación para la API de GoalApp
 *
 * Estos tipos coinciden con los schemas del backend:
 * - UsuarioCreate, UsuarioResponse (registro/usuario)
 * - OAuth2PasswordRequestForm (login)
 * - PasswordResetRequest, PasswordResetConfirm (recuperación)
 */

// ============================================================
// LOGIN
// ============================================================

export interface LoginRequest {
  username: string;  // Backend espera 'username' (OAuth2PasswordRequestForm)
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  expires_in: number;  // segundos (ej: 2592000 = 30 días)
}

// ============================================================
// REGISTRO
// ============================================================

export interface RegisterRequest {
  nombre: string;
  email: string;
  contraseña: string;  // Backend usa 'contraseña' con ñ
}

export interface RegisterResponse {
  id_usuario: number;
  nombre: string;
  email: string;
  genero?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  imagen_url?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================================

export interface PasswordRecoveryRequest {
  email: string;
}

export interface PasswordRecoveryResponse {
  mensaje: string;
}

export interface PasswordResetConfirm {
  token: string;
  nueva_contrasena: string;
}

export interface PasswordResetResponse {
  mensaje: string;
}

// ============================================================
// USUARIO AUTENTICADO
// ============================================================

export interface AuthUser {
  id_usuario: number;
  nombre: string;
  email: string;
  genero?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  imagen_url?: string;
  created_at: string;
  updated_at: string;
}
