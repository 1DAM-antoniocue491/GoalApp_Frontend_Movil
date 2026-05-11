/** Tipos del dominio de usuarios y roles dentro de una liga. */

export type UserRole = 'admin' | 'coach' | 'player' | 'delegate' | 'observer';
export type UserStatus = 'active' | 'pending';

export interface SelectOption {
  value: string;
  label: string;
}

/** Opciones compartidas para formularios de jugador. */
export const PLAYER_TYPES: SelectOption[] = [
  { value: 'normal', label: 'Jugador' },
  { value: 'capitan', label: 'Capitán' },
];

/** Posiciones compartidas para invitación y generación de código. */
export const PLAYER_POSITIONS: SelectOption[] = [
  { value: 'portero', label: 'Portero' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'centrocampista', label: 'Centrocampista' },
  { value: 'delantero', label: 'Delantero' },
];

export interface LeagueUser {
  id: string;
  userId: number;
  userRoleId?: number;
  name: string;
  email: string;
  roleId: number;
  role: UserRole;
  roleRaw?: string;
  roleLabel: string;
  status: UserStatus;
  active: boolean;
  teamId?: string;
  teamName?: string;
  jersey?: number;
  position?: string;
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
}

export interface GenerateUnionCodeFormData {
  role: UserRole | '';
  teamId: string;
  playerType: string;
  jersey: string;
  position: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
  delegate: 'Delegado',
  observer: 'Observador',
};

export interface ApiRole {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TeamOptionApi {
  id_equipo: number;
  nombre: string;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}

export interface PlayerApi {
  id_jugador: number;
  id_usuario: number;
  id_equipo: number;
  posicion?: string | null;
  dorsal?: number | string | null;
  activo?: boolean;
  tipo_jugador?: string | null;
}

export interface LeagueUserApiA {
  id_usuario: number;
  nombre: string;
  email: string;
  id_rol: number;
  rol: string;
  activo: boolean;
  created_at?: string;
  id_equipo?: number | null;
  nombre_equipo?: string | null;
  dorsal?: number | string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export interface LeagueUserApiB {
  id_usuario_rol: number;
  id_usuario: number;
  nombre_usuario: string;
  email: string;
  id_rol: number;
  nombre_rol: string;
  activo: boolean;
  id_equipo?: number | null;
  nombre_equipo?: string | null;
  dorsal?: number | string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export type LeagueUserApi = LeagueUserApiA | LeagueUserApiB;

export interface InviteUserPayload {
  nombre: string;
  email: string;
  id_rol: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export interface GenerateUnionCodePayload {
  id_rol: number;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
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

export interface ServiceResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}
