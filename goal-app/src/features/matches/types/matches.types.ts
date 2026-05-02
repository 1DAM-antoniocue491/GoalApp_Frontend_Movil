/**
 * matches.types.ts
 *
 * Tipos canónicos del dominio de partidos.
 *
 * Diseñados para ser flexibles ante nombres de campo variables según el endpoint
 * y compatibles con los DTOs ya usados en calendar.api.ts y dashboard.api.ts.
 *
 * NO duplicar EquipoResumenCalendario / PartidoConEquiposCalendario —
 * esos tipos son específicos del módulo de calendario.
 * Estos son los tipos base compartidos para la feature de matches.
 */

// ---------------------------------------------------------------------------
// Estado del partido
// ---------------------------------------------------------------------------

/**
 * Estados conocidos del backend.
 * `| string` permite valores desconocidos sin romper TypeScript.
 */
export type MatchStatus =
  | 'programado'
  | 'en_juego'
  | 'en_vivo'
  | 'finalizado'
  | 'cancelado'
  | string;

// ---------------------------------------------------------------------------
// DTOs — forma exacta que devuelve el backend
// ---------------------------------------------------------------------------

/** Equipo embebido en la respuesta de un partido */
export interface EquipoPartidoApi {
  /** El backend puede devolver id_equipo o id según el endpoint */
  id_equipo?: number;
  id?: number;
  nombre?: string;
  escudo?: string | null;
  logo_url?: string | null;
  /** El color puede venir como colores o color_primario */
  colores?: string | null;
  color_primario?: string | null;
}

/**
 * DTO de partido — forma flexible para cubrir múltiples endpoints.
 * Los campos opcionales reflejan que distintos endpoints devuelven
 * subconjuntos distintos de esta estructura.
 */
export interface PartidoApi {
  id_partido: number;
  id_liga?: number;
  /** Número de jornada — el backend usa distintos nombres según el endpoint */
  jornada?: number | null;
  numero_jornada?: number | null;
  num_jornada?: number | null;
  /** IDs de equipo como fallback cuando el objeto embebido no viene */
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  /** Equipos embebidos — presentes solo en endpoints con-equipos / jornadas */
  equipo_local?: EquipoPartidoApi | null;
  equipo_visitante?: EquipoPartidoApi | null;
  /** Fecha flexible — puede venir como fecha_hora, fecha + hora separadas */
  fecha?: string | null;
  fecha_hora?: string | null;
  hora?: string | null;
  estadio?: string | null;
  estado?: MatchStatus;
  goles_local?: number | null;
  goles_visitante?: number | null;
  minuto_actual?: number | null;
  created_at?: string;
  updated_at?: string;
}

// ---------------------------------------------------------------------------
// Requests de mutación
// ---------------------------------------------------------------------------

/**
 * Body para crear un partido manualmente.
 * Basado en la convención de nombres del backend (snake_case español)
 * y los campos que recoge CreateManualMatchModal.
 *
 * TODO API: confirmar campos exactos cuando el backend documente
 * POST /partidos/ligas/{liga_id}/crear-partido.
 */
export interface CreateManualMatchRequest {
  id_equipo_local: number;
  id_equipo_visitante: number;
  /** ISO date-time combinada: YYYY-MM-DDTHH:MM:SS */
  fecha_hora: string;
  estadio?: string;
  /** Número de jornada — puede llamarse distinto en el backend */
  numero_jornada?: number;
  /** ID del delegado asignado al partido */
  id_delegado?: number;
}

/**
 * Body para registrar un evento de partido (gol, tarjeta, sustitución).
 *
 * TODO API: endpoint no encontrado en código existente ni OpenAPI local.
 * No implementar llamada real hasta que el backend lo exponga.
 * Ruta probable: POST /partidos/{partido_id}/eventos
 */
export interface CreateMatchEventRequest {
  /** 'gol' | 'tarjeta_amarilla' | 'tarjeta_roja' | 'sustitucion' */
  tipo: string;
  id_jugador?: number;
  /** Solo para sustitución: jugador que sale */
  id_jugador_sale?: number;
  /** Solo para sustitución: jugador que entra */
  id_jugador_entra?: number;
  minuto: number;
  /** 'local' | 'visitante' */
  equipo: 'local' | 'visitante';
  es_propia_puerta?: boolean;
}

/**
 * Body para finalizar un partido.
 *
 * TODO API: endpoint no encontrado en código existente ni OpenAPI local.
 * No implementar llamada real hasta que el backend lo exponga.
 * Ruta probable: POST /partidos/{partido_id}/finalizar
 */
export interface FinishMatchRequest {
  id_mvp?: number;
  observaciones?: string;
}

// ---------------------------------------------------------------------------
// Patrón de resultado de servicio
// ---------------------------------------------------------------------------

/**
 * Resultado de una operación de servicio.
 * Las mutaciones nunca lanzan — siempre devuelven este tipo.
 */
export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}
