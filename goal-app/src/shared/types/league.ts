// Tipos base para las ligas de GoalApp
// Estos tipos definen la estructura de datos para la pantalla de inicio

/**
 * Roles posibles que puede tener un usuario en una liga
 */
export type LeagueRole = 'admin' | 'coach' | 'player' | 'field_delegate' | 'observer';

/**
 * Categorías de edad de una liga.
 * Los valores son estables para el backend — no los cambies sin migración.
 */
export type LeagueCategory =
  | 'pre_benjamin'
  | 'benjamin'
  | 'alevin'
  | 'infantil'
  | 'cadete'
  | 'juvenil'
  | 'senior';

/**
 * Etiquetas legibles por categoría para UI
 */
export const CATEGORY_LABELS: Record<LeagueCategory, string> = {
  pre_benjamin: 'Pre-benjamín (sub-7/8)',
  benjamin: 'Benjamín (sub-9/10)',
  alevin: 'Alevín (sub-11/12)',
  infantil: 'Infantil (sub-13/14)',
  cadete: 'Cadete (sub-15/16)',
  juvenil: 'Juvenil (sub-17/18/19)',
  senior: 'Senior',
};

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
  /** Categoría de la liga tal como la devuelve el backend (string libre) */
  categoria?: string;
}

/**
 * Mapeo de roles a etiquetas legibles para UI
 */
export const ROLE_LABELS: Record<LeagueRole, string> = {
  admin: 'Admin',
  coach: 'Entrenador',
  field_delegate: 'Delegado de campo',
  player: 'Jugador',
  observer: 'Observador',
};

/**
 * Mapeo de roles a colores de texto para UI
 */
export const ROLE_COLORS: Record<LeagueRole, string> = {
  admin: '#FFD60A',      // amarillo/dorado
  coach: '#18A2FB',      // azul/cian
  field_delegate: '#D946EF', // morado/fucsia
  player: '#20E3B2',     // verde agua
  observer: '#94A3B8',   // gris azulado
};

/**
 * Fondos semitransparentes del badge de rol.
 * Son versiones oscuras de ROLE_COLORS adaptadas al fondo dark de la app.
 * Centralizados aquí para que cualquier pantalla que muestre badges de rol
 * use los mismos valores sin hardcodearlos.
 */
export const ROLE_BG_COLORS: Record<LeagueRole, string> = {
  admin: '#4B3B05',
  coach: '#0A3E66',
  field_delegate: '#4B0F4D',
  player: '#0E4A3D',
  observer: '#1E2A3A',
};