/**
 * Tipos de autenticación para la API de GoalApp.
 *
 * Estos contratos deben coincidir con los schemas del backend. Son importantes
 * porque documentan qué nombres de campos espera la API y qué datos recibe
 * la app después de cada operación de autenticación.
 */

// ============================================================
// LOGIN
// ============================================================

export interface LoginRequest {
  /**
   * OAuth2PasswordRequestForm espera `username` aunque en la UI el usuario
   * introduzca su email. No cambiar a `email` salvo cambio del backend.
   */
  username: string;

  /** Contraseña introducida por el usuario en el formulario de login. */
  password: string;
}

export interface LoginResponse {
  /** Token usado en Authorization: Bearer <token> para endpoints protegidos. */
  access_token: string;

  /** Token reservado para renovar sesión cuando el access token expire. */
  refresh_token: string;

  /** El backend devuelve bearer; se tipa literal para detectar valores inesperados. */
  token_type: 'bearer';

  /** Duración del access token en segundos. Ejemplo: 2592000 = 30 días. */
  expires_in: number;
}

// ============================================================
// REGISTRO
// ============================================================

export interface RegisterRequest {
  nombre: string;
  email: string;

  /**
   * Nombre exacto del campo esperado por el backend.
   * Se mantiene con ñ porque forma parte del contrato actual de la API.
   */
  contraseña: string;
}

export interface RegisterResponse {
  /** Identificador principal del usuario en backend. */
  id_usuario: number;
  nombre: string;
  email: string;

  /** Campos opcionales: pueden no existir si el usuario aún no completó perfil. */
  genero?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  imagen_url?: string;

  /** Fechas enviadas por API normalmente en formato ISO. */
  created_at: string;
  updated_at: string;
}

// ============================================================
// RECUPERACIÓN DE CONTRASEÑA
// ============================================================

export interface PasswordRecoveryRequest {
  /** Email al que se enviará el enlace o código de recuperación. */
  email: string;
}

export interface PasswordRecoveryResponse {
  /** Mensaje genérico del backend para no revelar si el email existe. */
  mensaje: string;
}

export interface PasswordResetConfirm {
  /** Token recibido por email o deep link para autorizar el cambio. */
  token: string;

  /** Nuevo password con el nombre exacto esperado por el backend. */
  nueva_contrasena: string;
}

export interface PasswordResetResponse {
  /** Confirmación del backend tras cambiar la contraseña. */
  mensaje: string;
}

// ============================================================
// USUARIO AUTENTICADO
// ============================================================

export interface AuthUser {
  /** Identificador usado para relacionar sesión, permisos y datos del usuario. */
  id_usuario: number;
  nombre: string;
  email: string;

  /** Datos de perfil opcionales. No deben asumirse como obligatorios en la UI. */
  genero?: string;
  telefono?: string;
  fecha_nacimiento?: string;
  imagen_url?: string;

  /** Marcas temporales enviadas por backend normalmente como string ISO. */
  created_at: string;
  updated_at: string;
}
