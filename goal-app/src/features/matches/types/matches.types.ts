/**
 * matches.types.ts
 *
 * Tipos canónicos del dominio de partidos en móvil.
 * Están alineados con la integración web actual y con la API real:
 * - creación manual: POST /partidos/
 * - iniciar/finalizar: PUT /partidos/{id}/iniciar|finalizar
 * - eventos: POST /eventos/
 *
 * IMPORTANTE:
 * Se mantienen algunos campos opcionales legacy (fecha_hora, numero_jornada,
 * id_delegado, estadio) para no romper pantallas móviles que ya los construyen,
 * pero el service normaliza el payload antes de enviarlo a la API.
 */

// ---------------------------------------------------------------------------
// Estado del partido
// ---------------------------------------------------------------------------

export type MatchStatus =
  | "programado"
  | "en_juego"
  | "en_vivo"
  | "finalizado"
  | "cancelado"
  | string;

// ---------------------------------------------------------------------------
// DTOs de backend
// ---------------------------------------------------------------------------

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
  goles_local?: number | null;
  goles_visitante?: number | null;
  fecha?: string | null;
  fecha_hora?: string | null;
  hora?: string | null;
  estadio?: string | null;
  estado?: MatchStatus;
  minuto_actual?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface JornadaPartidosApi {
  jornada?: number;
  numero_jornada?: number;
  num_jornada?: number;
  id_jornada?: number;
  partidos?: PartidoApi[];
}

// ---------------------------------------------------------------------------
// Requests de partidos
// ---------------------------------------------------------------------------

/**
 * Payload real para crear partido manual.
 * Web envía: { id_liga, id_equipo_local, id_equipo_visitante, fecha }.
 */
export interface CreateMatchPayload {
  id_liga: number;
  id_jornada?: number | null;
  id_equipo_local: number;
  id_equipo_visitante: number;
  /** ISO date-time combinada: YYYY-MM-DDTHH:MM:SS */
  fecha: string;
}

/**
 * Request flexible que puede venir desde pantallas móviles antiguas.
 * El service lo convierte a CreateMatchPayload antes del POST /partidos/.
 */
export interface CreateManualMatchRequest {
  id_liga?: number;
  id_jornada?: number | null;
  id_equipo_local: number;
  id_equipo_visitante: number;
  fecha?: string;
  fecha_hora?: string;
  numero_jornada?: number | null;
  estadio?: string;
  id_delegado?: number;
}

export interface UpdateMatchPayload {
  id_jornada?: number | null;
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  goles_local?: number | null;
  goles_visitante?: number | null;
  fecha?: string;
  estado?: MatchStatus;
}

export interface CalendarCreatePayload {
  tipo: "ida" | "ida_vuelta";
  fecha_inicio: string;
  dias_partido: number[];
  hora: string;
}

export interface CalendarUpdatePayload extends Partial<CalendarCreatePayload> {}

/** Payload real que usa web para finalizar partido. */
export interface FinishMatchRequest {
  goles_local?: number;
  goles_visitante?: number;
  id_mvp?: number | null;
  puntuacion_mvp?: number | null;
  incidencias?: string | null;
  /** Alias legacy móvil; el service lo convierte a incidencias. */
  observaciones?: string | null;
}

export type MatchEventType =
  | "gol"
  | "tarjeta_amarilla"
  | "tarjeta_roja"
  | "cambio"
  | "sustitucion"
  | string;

/**
 * Payload flexible de evento. La API real de web usa POST /eventos/ con
 * tipo_evento; si llega tipo desde móvil, el service lo normaliza.
 */
export interface CreateMatchEventRequest {
  id_partido?: number;
  id_jugador?: number;
  tipo_evento?: MatchEventType;
  tipo?: MatchEventType;
  minuto?: number;
  id_jugador_sale?: number | null;
  id_jugador_entra?: number | null;
  incidencias?: string | null;
  equipo?: "local" | "visitante";
  es_propia_puerta?: boolean;
}

export interface MatchEventResponse {
  id_evento?: number;
  id_partido: number;
  id_jugador?: number | null;
  tipo_evento: string;
  minuto?: number | null;
  id_jugador_sale?: number | null;
  incidencias?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Patrón de resultado de servicio
// ---------------------------------------------------------------------------

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
