// Tipos base para las ligas de GoalApp
// Estos tipos definen la estructura de datos para la pantalla de inicio

/** Roles posibles que puede tener un usuario en una liga */
export type LeagueRole = 'admin' | 'coach' | 'player' | 'field_delegate' | 'observer';

/** Categorías de edad de una liga. */
export type LeagueCategory =
  | 'pre_benjamin'
  | 'benjamin'
  | 'alevin'
  | 'infantil'
  | 'cadete'
  | 'juvenil'
  | 'senior';

export const CATEGORY_LABELS: Record<LeagueCategory, string> = {
  pre_benjamin: 'Pre-benjamín (sub-7/8)',
  benjamin: 'Benjamín (sub-9/10)',
  alevin: 'Alevín (sub-11/12)',
  infantil: 'Infantil (sub-13/14)',
  cadete: 'Cadete (sub-15/16)',
  juvenil: 'Juvenil (sub-17/18/19)',
  senior: 'Senior',
};

export type LeagueStatus = 'active' | 'finished';
export type LeagueFilter = 'all' | 'active' | 'finished' | 'favorites';

/** Interfaz principal que representa una liga en la app */
export interface LeagueItem {
  id: string;
  name: string;
  season: string;
  status: LeagueStatus;
  role: LeagueRole;
  isFavorite: boolean;
  /** ID del equipo asignado al usuario dentro de esta liga, si aplica. */
  teamId?: string;
  /** Nombre del equipo asignado al usuario dentro de esta liga, si aplica. */
  teamName?: string;
  teamsCount: number;
  crestUrl?: string | null;
  canReactivate?: boolean;
  categoria?: string;
}

export const ROLE_LABELS: Record<LeagueRole, string> = {
  admin: 'Administrador',
  coach: 'Entrenador',
  field_delegate: 'Delegado',
  player: 'Jugador',
  observer: 'Observador',
};

export const ROLE_COLORS: Record<LeagueRole, string> = {
  admin: '#C8F558',
  coach: '#00B4D8',
  field_delegate: '#FFD60A',
  player: '#18A2FB',
  observer: '#94A3B8',
};

export const ROLE_BG_COLORS: Record<LeagueRole, string> = {
  admin: 'rgba(200,245,88,0.15)',
  coach: 'rgba(0,180,216,0.15)',
  field_delegate: 'rgba(255,214,10,0.15)',
  player: 'rgba(24,162,251,0.15)',
  observer: 'rgba(161,161,170,0.12)',
};
