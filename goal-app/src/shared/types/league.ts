// Tipos base para las ligas de GoalApp
// Estos tipos definen la estructura de datos para la pantalla de inicio

/**
 * Roles posibles que puede tener un usuario en una liga
 */
export type LeagueRole = 'admin' | 'coach' | 'player' | 'field_delegate';

/**
 * Estados posibles de una liga
 */
export type LeagueStatus = 'active' | 'finished';

/**
 * Filtros disponibles para la sección "Mis ligas"
 */
export type LeagueFilter = 'all' | 'active' | 'finished' | 'favorites';

/**
 * Interfaz principal que representa una liga en la app
 */
export interface LeagueItem {
  /** Identificador único de la liga */
  id: string;
  /** Nombre de la liga */
  name: string;
  /** Temporada actual (ej: "2025/26") */
  season: string;
  /** Estado de la liga (activa o finalizada) */
  status: LeagueStatus;
  /** Rol del usuario en esta liga */
  role: LeagueRole;
  /** Si la liga está marcada como favorita */
  isFavorite: boolean;
  /** Nombre del equipo del usuario en esta liga (opcional) */
  teamName?: string;
  /** Número total de equipos en la liga */
  teamsCount: number;
  /** URL del escudo de la liga (puede ser null o undefined) */
  crestUrl?: string | null;
  /** Si el usuario tiene permisos para reactivar la liga (solo para finalizadas) */
  canReactivate?: boolean;
}

/**
 * Mapeo de roles a etiquetas legibles para UI
 */
export const ROLE_LABELS: Record<LeagueRole, string> = {
  admin: 'Admin',
  coach: 'Entrenador',
  field_delegate: 'Delegado de campo',
  player: 'Jugador',
};

/**
 * Mapeo de roles a colores semánticos para UI
 */
export const ROLE_COLORS: Record<LeagueRole, string> = {
  admin: '#FFD60A',      // amarillo/dorado
  coach: '#18A2FB',      // azul/cian
  field_delegate: '#D454F5', // morado/fucsia
  player: '#32D74B',     // verde
};