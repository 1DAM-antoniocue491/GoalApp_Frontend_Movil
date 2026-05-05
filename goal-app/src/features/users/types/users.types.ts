/**
 * Tipos del dominio de usuarios y roles dentro de una liga.
 *
 * Objetivo de integración:
 * - La UI móvil trabaja con un modelo normalizado (`LeagueUser`).
 * - La API puede devolver usuarios desde más de un endpoint con nombres de campo distintos.
 * - No se usan mocks ni IDs de rol hardcodeados: los roles vienen de `GET /roles/`.
 */

export type UserRole = 'admin' | 'coach' | 'player' | 'delegate' | 'observer';
export type UserStatus = 'active' | 'pending';

export interface LeagueUser {
  /** ID estable para listas React. Preferimos id_usuario_rol si existe. */
  id: string;
  /** ID real del usuario en backend. Se usa para PUT/DELETE. */
  userId: number;
  /** ID de la relación usuario-liga si el endpoint lo devuelve. */
  userRoleId?: number;
  name: string;
  email: string;
  /** Rol normalizado para la UI móvil. */
  role: UserRole;
  /** ID real del rol en backend. */
  roleId: number;
  /** Etiqueta legible procedente de API o generada por fallback. */
  roleLabel: string;
  status: UserStatus;
  active: boolean;
  teamId?: string;
  teamName?: string;
  // Solo para jugadores, si el backend lo devuelve o se usa en invitación.
  jersey?: number;
  position?: string;
  playerType?: string;
  isCaptain?: boolean;
}

export interface InviteUserFormData {
  name: string;
  email: string;
  role: UserRole | '';
  teamId: string;
  playerType: string;
  jersey: string;
  position: string;
}

export interface ManageUserFormData {
  role: UserRole | '';
  active: boolean;
  teamId?: string;
  jersey?: string;
  position?: string;
  isCaptain?: boolean;
}

/** Etiquetas legibles por rol normalizado */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
  delegate: 'Delegado',
  observer: 'Observador',
};

// ---------------------------------------------------------------------------
// Contratos API
// ---------------------------------------------------------------------------

export interface RoleResponse {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
}

/** Endpoint: GET /usuarios/ligas/{ligaId}/usuarios */
export interface UserWithRoleResponse {
  id_usuario: number;
  nombre: string | null;
  email: string | null;
  id_rol: number;
  rol: string | null;
  activo: boolean;
  created_at?: string | null;
}

/** Endpoint: GET /ligas/{ligaId}/usuarios */
export interface UsuarioLigaResponse {
  id_usuario_rol: number;
  id_usuario: number;
  nombre_usuario: string | null;
  email: string | null;
  id_rol: number;
  nombre_rol: string | null;
  activo: boolean;
}

export type LeagueUserApiResponse = UserWithRoleResponse | UsuarioLigaResponse;

export interface TeamForUsersResponse {
  id_equipo: number;
  nombre: string;
  escudo: string | null;
  colores: string | null;
  id_liga: number;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}

export interface InviteUserPayload {
  nombre: string;
  email: string;
  id_rol: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export interface UpdateUserRolePayload {
  id_rol: number;
}

export interface UpdateUserStatusPayload {
  activo: boolean;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
