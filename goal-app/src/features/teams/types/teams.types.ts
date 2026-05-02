/**
 * teams.types.ts
 *
 * Tipos que reflejan la respuesta real del backend para el módulo de equipos.
 * No modificar sin verificar contra la API.
 */

// ---------------------------------------------------------------------------
// Respuestas del backend (DTOs)
// ---------------------------------------------------------------------------

/** Respuesta de GET /equipos/?liga_id={liga_id} */
export interface EquipoResponse {
  id_equipo: number;
  nombre: string;
  activo?: boolean;
  logo_url?: string | null;
  color_primario?: string | null;
  liga_id?: number;
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
  activo?: boolean;
  /** Estadísticas de temporada */
  partidos_jugados?: number;
  victorias?: number;
  empates?: number;
  derrotas?: number;
  goles_favor?: number;
  goles_contra?: number;
  diferencia_goles?: number;
  puntos?: number;
  posicion?: number | null;
  /** Plantilla */
  jugadores?: JugadorResumen[];
  /** Info del club */
  estadio?: string | null;
  entrenador?: string | null;
  temporada?: string | null;
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

/** Body para POST /equipos/ — alineado con el schema EquipoCreate del backend */
export interface CreateTeamRequest {
  nombre: string;
  id_liga: number;
  escudo?: string | null;
  colores?: string | null;
  id_entrenador?: number | null;
  id_delegado?: number | null;
}
