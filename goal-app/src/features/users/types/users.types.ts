/**
 * Tipos del dominio de usuarios y roles dentro de una liga.
 *
 * La UI móvil trabaja con un modelo normalizado (`LeagueUser`) para no depender
 * de las dos formas que puede devolver el backend:
 * - GET /usuarios/ligas/{ligaId}/usuarios
 * - GET /ligas/{ligaId}/usuarios
 */

export type UserRole = 'admin' | 'coach' | 'player' | 'delegate' | 'observer';
export type UserStatus = 'active' | 'pending';

export interface ApiRole {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
}

export interface LeagueUserApiA {
  id_usuario: number;
  nombre: string;
  email: string;
  id_rol: number;
  rol: string;
  activo: boolean;
  created_at?: string;
}

export interface LeagueUserApiB {
  id_usuario_rol: number;
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  id_rol: number;
  nombre_rol: string;
  activo: boolean;
}

export type LeagueUserApi = LeagueUserApiA | LeagueUserApiB;

export interface TeamOptionApi {
  id_equipo: number;
  nombre: string;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}

export interface LeagueUser {
  id: string;
  userId: number;
  userRoleId?: number;
  name: string;
  email: string;
  roleId: number;
  role: UserRole;
  roleRaw: string;
  roleLabel: string;
  status: UserStatus;
  active: boolean;
  teamId?: string;
  teamName?: string;
  // Solo para jugadores cuando el backend lo exponga.
  jersey?: string;
  position?: string;
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

export interface InviteUserPayload {
  nombre: string;
  email: string;
  id_rol: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export interface ManageUserFormData {
  role: UserRole | '';
  active: boolean;
}

export interface GenerateUnionCodeFormData {
  role: UserRole | '';
  teamId: string;
  jersey: string;
  position: string;
}

export interface GenerateUnionCodePayload {
  id_rol: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
}

export interface UnionCodeResponse {
  codigo: string;
  rol?: string;
  liga?: string;
  expiracion?: string;
  expira_en?: string;
  id_liga?: number;
  id_rol?: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Etiquetas legibles por rol normalizado. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
  delegate: 'Delegado',
  observer: 'Observador',
};

export const PLAYER_POSITIONS = [
  { value: 'portero', label: 'Portero' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'centrocampista', label: 'Centrocampista' },
  { value: 'delantero', label: 'Delantero' },
] as const;
