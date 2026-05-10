/**
 * matches.types.ts
 * Tipos reales del dominio de partidos/eventos.
 */

export type CanonicalMatchStatus = 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'suspendido';
export type MatchStatus = CanonicalMatchStatus | 'en_vivo' | 'live' | 'finished' | 'cancelled' | 'canceled' | 'suspended' | string;
export type EditableScheduledMatchStatus = 'programado' | 'cancelado' | 'suspendido';
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
  hora?: string | null;
  estadio?: string | null;
  estado?: MatchStatus;
  goles_local?: number | null;
  goles_visitante?: number | null;
  minuto_actual?: number | null;
  minuto?: number | null;
  inicio_en?: string | null;
  started_at?: string | null;
  fecha_inicio?: string | null;
  duracion_partido?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateManualMatchRequest {
  id_liga: number;
  id_jornada?: number | null;
  id_equipo_local: number;
  id_equipo_visitante: number;
  /** ISO literal enviado al backend: YYYY-MM-DDTHH:MM:SS */
  fecha: string;
}

export interface UpdateMatchRequest {
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  fecha?: string;
  estado?: MatchStatus;
}

export interface UpdateScheduledMatchRequest {
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  fecha?: string;
  estado?: EditableScheduledMatchStatus;
}

export interface CreateMatchEventRequest {
  id_partido: number;
  id_jugador: number;
  tipo_evento: BackendEventType;
  minuto: number;
  id_jugador_sale?: number;
  /** Equipo al que se asigna el evento. En gol es imprescindible para marcador fiable. */
  id_equipo?: number;
  incidencias?: string;
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
  home: number;
  away: number;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
