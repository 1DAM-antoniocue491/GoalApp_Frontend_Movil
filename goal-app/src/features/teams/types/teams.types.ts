/**
 * teams.types.ts
 *
 * Tipos que reflejan la respuesta real del backend para el módulo de equipos.
 */

// ---------------------------------------------------------------------------
// Helpers defensivos
// ---------------------------------------------------------------------------

export function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function getTeamName(team: unknown): string {
  return safeString((team as any)?.nombre, 'Equipo sin nombre');
}

export function getTeamColor(team: unknown): string {
  const t = team as any;
  return safeString(t?.colores ?? t?.color_primario, '#C4F135');
}

// ---------------------------------------------------------------------------
// Respuestas del backend (DTOs)
// ---------------------------------------------------------------------------

/**
 * Respuesta de GET /equipos/?liga_id={liga_id} y GET /equipos/{id}
 * Incluye campos de la API real más campos legacy para compatibilidad.
 */
export interface EquipoResponse {
  id_equipo: number;
  nombre: string;
  // API real
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number;
  id_entrenador?: number | null;
  id_delegado?: number | null;
  // Legacy (pueden venir del backend aún)
  activo?: boolean;
  logo_url?: string | null;
  color_primario?: string | null;
  liga_id?: number;
  created_at?: string;
  updated_at?: string;
}

/** Body para PUT /equipos/{id} */
export interface EquipoUpdate {
  nombre?: string | null;
  escudo?: string | null;
  colores?: string | null;
  id_liga?: number | null;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}

/** Item de GET /equipos/ligas/{liga_id}/rendimiento */
export interface EquipoRendimientoItem {
  id_equipo: number;
  nombre: string;
  logo_url?: string | null;
  color_primario?: string | null;
  partidos_jugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  /** Últimos 5 resultados: 'V' | 'E' | 'D' */
  forma?: string[];
}

/** Jugador dentro del detalle de equipo */
export interface JugadorResumen {
  id_usuario: number;
  nombre: string;
  apellido?: string;
  dorsal?: number | null;
  posicion?: string | null;
  es_capitan?: boolean;
}

/** Respuesta de GET /equipos/{equipo_id}/detalle */
export interface EquipoDetalleResponse {
  id_equipo: number;
  nombre: string;
  logo_url?: string | null;
  color_primario?: string | null;
  escudo?: string | null;
  colores?: string | null;
  activo?: boolean;
  partidos_jugados?: number;
  victorias?: number;
  empates?: number;
  derrotas?: number;
  goles_favor?: number;
  goles_contra?: number;
  diferencia_goles?: number;
  puntos?: number;
  posicion?: number | null;
  jugadores?: JugadorResumen[];
  estadio?: string | null;
  entrenador?: string | null;
  temporada?: string | null;
}

/** Resumen de partido para próximos/últimos partidos del equipo */
export interface MatchSummary {
  id_partido: number;
  equipo_local: string;
  equipo_visitante: string;
  goles_local?: number | null;
  goles_visitante?: number | null;
  fecha?: string | null;
  estado?: string | null;
}

/** Goleador en el contexto de un equipo */
export interface TeamTopScorer {
  id_jugador?: number;
  id_usuario: number;
  nombre: string;
  goles: number;
  partidos_jugados?: number;
  posicion?: string | null;
}

/** Item de GET /ligas/{liga_id}/clasificacion */
export interface ClasificacionItem {
  posicion: number;
  id_equipo: number;
  nombre_equipo: string;
  logo_url?: string | null;
  partidos_jugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  goles_favor: number;
  goles_contra: number;
  diferencia_goles: number;
  puntos: number;
  forma?: string[];
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

/** Body para POST /equipos/ */
export interface CreateTeamRequest {
  nombre: string;
  id_liga: number;
  escudo?: string | null;
  colores?: string | null;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}
