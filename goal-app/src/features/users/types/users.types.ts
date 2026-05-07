/**
 * Tipos del dominio Usuarios y Roles en móvil.
 *
 * Este archivo NO contiene mocks. Define el contrato interno que usa React Native
 * y los contratos mínimos que llegan desde la API real.
 */

export type UserRole = 'admin' | 'coach' | 'player' | 'delegate' | 'observer';
export type UserStatus = 'active' | 'pending';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface LeagueUser {
  id: string;
  userId: number;
  userRoleId?: number;
  name: string;
  email: string;
  roleId: number;
  role: UserRole;
  roleRaw?: string | null;
  roleLabel: string;
  status: UserStatus;
  active: boolean;
  teamId?: string;
  teamName?: string;
  jersey?: string;
  position?: string;
}

export interface ApiRole {
  id_rol: number;
  nombre: string;
  descripcion?: string | null;
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
  dorsal?: number | string | null;
  posicion?: string | null;
  activo?: boolean;
  usuario?: {
    id_usuario: number;
    nombre?: string | null;
    email?: string | null;
  } | null;
  equipo?: {
    id_equipo: number;
    nombre?: string | null;
  } | null;
}

/** Respuesta principal: GET /usuarios/ligas/{ligaId}/usuarios */
export interface LeagueUserApiA {
  id_usuario: number;
  nombre?: string | null;
  email?: string | null;
  id_rol: number;
  rol?: string | null;
  activo?: boolean;
  created_at?: string;
  id_equipo?: number | null;
  nombre_equipo?: string | null;
  dorsal?: number | string | null;
  posicion?: string | null;
}

/** Respuesta alternativa: GET /ligas/{ligaId}/usuarios */
export interface LeagueUserApiB {
  id_usuario_rol?: number;
  id_usuario: number;
  nombre_usuario?: string | null;
  nombre?: string | null;
  email?: string | null;
  id_rol: number;
  nombre_rol?: string | null;
  rol?: string | null;
  activo?: boolean;
  id_equipo?: number | null;
  nombre_equipo?: string | null;
  dorsal?: number | string | null;
  posicion?: string | null;
}

export type LeagueUserApi = LeagueUserApiA | LeagueUserApiB;

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
  playerType: string;
  jersey: string;
  position: string;
}

export interface GenerateUnionCodePayload {
  id_rol: number;
  nombre?: string;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  tipo_jugador?: string | null;
}

export interface UnionCodeResponse {
  codigo: string;
  id_liga?: number;
  id_rol?: number;
  rol?: string;
  id_equipo?: number | null;
  dorsal?: string | null;
  posicion?: string | null;
  expira_en?: string | null;
  expiracion?: string | null;
  mensaje?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  player: 'Jugador',
  delegate: 'Delegado',
  observer: 'Observador',
};

export const PLAYER_POSITIONS: SelectOption[] = [
  { value: 'portero', label: 'Portero' },
  { value: 'defensa', label: 'Defensa' },
  { value: 'centrocampista', label: 'Centrocampista' },
  { value: 'delantero', label: 'Delantero' },
];

export const PLAYER_TYPES: SelectOption[] = [
  { value: 'titular', label: 'Titular' },
  { value: 'suplente', label: 'Suplente' },
];
