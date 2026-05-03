/**
 * Tipos para el módulo de perfil de usuario
 */

/** Respuesta cruda del backend al leer perfil */
export interface UserProfileResponse {
  id_usuario?: number;
  id?: number;
  nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  avatar_url?: string | null;
  imagen_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

/** Payload enviado al actualizar perfil */
export interface UpdateUserProfileRequest {
  nombre?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
  genero?: string | null;
  avatar_url?: string | null;
}

/** Modelo de perfil normalizado para la UI */
export interface UserProfile {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  avatarUrl: string | null;
  createdAt: string | null;
}

/** Mapper defensivo: nunca devuelve undefined */
export function mapUserProfile(response: UserProfileResponse): UserProfile {
  return {
    id: String(response.id_usuario ?? response.id ?? ''),
    nombre: response.nombre ?? '',
    email: response.email ?? '',
    telefono: response.telefono ?? '',
    fechaNacimiento: response.fecha_nacimiento ?? '',
    genero: response.genero ?? '',
    avatarUrl: response.avatar_url ?? response.imagen_url ?? null,
    createdAt: response.created_at ?? null,
  };
}
