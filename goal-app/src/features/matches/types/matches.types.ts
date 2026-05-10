/**
 * matches.types.ts
 * Tipos reales y defensivos del dominio de partidos/eventos.
 *
 * La app normaliza aquí varios valores que el backend puede devolver con
 * nombres distintos para evitar romper filtros, tabs y navegación.
 */

export type NormalizedMatchStatus = 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'suspendido';

export type EditableScheduledMatchStatus = 'programado' | 'cancelado' | 'suspendido';

export type MatchStatus =
  | NormalizedMatchStatus
  | 'en_vivo'
  | 'live'
  | 'playing'
  | 'finished'
  | 'cancelled'
  | 'canceled'
  | 'suspended'
  | string;

export type BackendEventType = 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'cambio';

export interface EquipoPartidoApi {
  id_equipo?: number;
  id?: number;
  nombre?: string;
  escudo?: string | null;
  logo_url?: string | null;
  colores?: string | null;
  color_primario?: string | null;
}

export interface PartidoApi {
  id_partido: number;
  id_liga?: number;
  id_jornada?: number | null;
  jornada?: number | null;
  numero_jornada?: number | null;
  num_jornada?: number | null;
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  equipo_local?: EquipoPartidoApi | null;
  equipo_visitante?: EquipoPartidoApi | null;
  fecha?: string | null;
  fecha_hora?: string | null;
  fecha_completa?: string | null;
  hora?: string | null;
  estadio?: string | null;
  estado?: MatchStatus;
  goles_local?: number | null;
  goles_visitante?: number | null;
  minuto_actual?: number | null;
  minuto?: number | null;
  minutos_partido?: number | null;
  duracion_partido?: number | null;
  inicio_en?: string | null;
  started_at?: string | null;
  fecha_inicio?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateManualMatchRequest {
  id_liga: number;
  id_jornada?: number | null;
  id_equipo_local: number;
  id_equipo_visitante: number;
  /** ISO defensivo para backend: YYYY-MM-DDTHH:MM:SS */
  fecha: string;
}

export interface UpdateMatchRequest {
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  fecha?: string;
  estado?: MatchStatus;
}

export interface UpdateScheduledMatchRequest {
  fecha?: string;
  estado: EditableScheduledMatchStatus;
}

export interface CreateMatchEventRequest {
  id_partido: number;
  id_jugador: number;
  tipo_evento: BackendEventType;
  minuto: number;
  /** Equipo al que se le asigna el evento. En goles sirve para propia puerta. */
  id_equipo?: number;
  id_jugador_sale?: number;
  incidencias?: string;
}

export interface MatchEventApi {
  id_evento?: number;
  id_partido?: number;
  id_jugador?: number;
  id_equipo?: number;
  equipo_id?: number;
  tipo_evento?: BackendEventType | string;
  tipo?: BackendEventType | string;
  minuto?: number | string | null;
  id_jugador_sale?: number | null;
  incidencias?: string | null;
}

export interface FinishMatchRequest {
  goles_local: number;
  goles_visitante: number;
  id_mvp: number;
  puntuacion_mvp: number;
  incidencias?: string;
}

export interface MatchPlayerOption {
  id_jugador: number;
  nombre: string;
  dorsal?: string;
  posicion?: string;
  equipo: 'home' | 'away';
}

export interface MatchPlayersBySide {
  home: MatchPlayerOption[];
  away: MatchPlayerOption[];
}

export interface MatchScore {
  goles_local: number;
  goles_visitante: number;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
