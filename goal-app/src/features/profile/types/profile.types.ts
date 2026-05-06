/**
 * Tipos para el módulo de perfil de usuario.
 */

/** Respuesta cruda del backend al leer perfil. */
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

/**
 * Payload enviado al actualizar perfil.
 * Solo se envían los campos editables en móvil.
 */
export interface UpdateUserProfileRequest {
  nombre?: string | null;
  telefono?: string | null;
  fecha_nacimiento?: string | null;
}

/** Modelo de perfil normalizado para la UI. */
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

/** Normaliza cualquier fecha del backend a YYYY-MM-DD cuando sea posible. */
function normalizeApiDate(value?: string | null): string {
  if (!value) return '';

  const raw = value.trim();
  const isoDate = raw.split('T')[0];

  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }

  return '';
}

/** Mapper defensivo: nunca devuelve undefined. */
export function mapUserProfile(response: UserProfileResponse): UserProfile {
  return {
    id: String(response.id_usuario ?? response.id ?? ''),
    nombre: response.nombre ?? '',
    email: response.email ?? '',
    telefono: response.telefono ?? '',
    fechaNacimiento: normalizeApiDate(response.fecha_nacimiento),
    genero: response.genero ?? '',
    avatarUrl: response.avatar_url ?? response.imagen_url ?? null,
    createdAt: response.created_at ?? null,
  };
}
