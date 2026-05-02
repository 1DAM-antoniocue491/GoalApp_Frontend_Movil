/**
 * calendar.api.ts
 *
 * Llamadas HTTP del módulo de calendario.
 *
 * Endpoint principal:   GET /partidos/ligas/{liga_id}/jornadas
 * Endpoint fallback:    GET /partidos/ligas/{liga_id}/con-equipos
 */

import { apiClient } from '@/src/shared/api/client';

// ---------------------------------------------------------------------------
// DTOs — forma exacta que devuelve el backend
// ---------------------------------------------------------------------------

export interface EquipoResumenCalendario {
  id_equipo: number;
  nombre: string;
  color_primario?: string | null;
}

export interface JornadaResumenCalendario {
  id_jornada?: number;
  numero?: number;
  nombre?: string;
}

/** Respuesta de GET /partidos/ligas/{liga_id}/con-equipos */
export interface PartidoConEquiposCalendario {
  id_partido: number;
  estado: string;
  fecha_hora?: string | null;
  estadio?: string | null;
  goles_local: number;
  goles_visitante: number;
  minuto_actual?: number | null;
  equipo_local: EquipoResumenCalendario;
  equipo_visitante: EquipoResumenCalendario;
  jornada?: JornadaResumenCalendario | null;
}

// ---------------------------------------------------------------------------
// Funciones de fetch
// ---------------------------------------------------------------------------

/**
 * GET /partidos/ligas/{liga_id}/con-equipos
 * Todos los partidos de la liga con equipos embebidos, agrupables por jornada.
 */
export async function getPartidosByLeague(
  ligaId: number,
): Promise<PartidoConEquiposCalendario[]> {
  const res = await apiClient.get<PartidoConEquiposCalendario[]>(
    `/partidos/ligas/${ligaId}/con-equipos`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * GET /equipos/?liga_id={liga_id}
 * Solo necesitamos el conteo para determinar el viewState del calendario.
 */
export async function getEquiposCountByLeague(ligaId: number): Promise<number> {
  const res = await apiClient.get<{ id_equipo: number }[]>(`/equipos/?liga_id=${ligaId}`);
  return Array.isArray(res.data) ? res.data.length : 0;
}

// ---------------------------------------------------------------------------
// DTOs para /jornadas — campos flexibles según backend
// ---------------------------------------------------------------------------

export interface EquipoResumenJornada {
  /** El backend puede usar id_equipo o id */
  id_equipo?: number;
  id?: number;
  nombre?: string;
  escudo?: string | null;
  logo_url?: string | null;
  /** El color puede venir como colores o color_primario */
  colores?: string | null;
  color_primario?: string | null;
}

export interface PartidoCalendarioApi {
  id_partido: number;
  id_liga?: number;
  estado: string;
  /** Fecha flexible: puede venir como fecha_hora, fecha u hora separada */
  fecha_hora?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estadio?: string | null;
  goles_local?: number | null;
  goles_visitante?: number | null;
  minuto_actual?: number | null;
  /** Objeto embebido de equipo (puede no venir) */
  equipo_local?: EquipoResumenJornada | null;
  equipo_visitante?: EquipoResumenJornada | null;
  /** IDs como fallback cuando el objeto embebido no viene */
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  /** Número de jornada — puede venir embebido con distintos nombres */
  jornada?: number | null;
  numero_jornada?: number | null;
  num_jornada?: number | null;
}

/**
 * Respuesta de GET /partidos/ligas/{liga_id}/jornadas
 * Los campos del número de jornada pueden variar según versión de backend.
 */
export interface JornadaConPartidosApi {
  /** Número de jornada — prueba múltiples nombres por compatibilidad */
  jornada?: number;
  numero_jornada?: number;
  num_jornada?: number;
  numero?: number;
  partidos?: PartidoCalendarioApi[];
}

/**
 * GET /partidos/ligas/{liga_id}/jornadas
 * Fuente principal para la vista de Jornada.
 * Devuelve unknown para que calendarService pueda normalizar
 * las distintas formas que puede tener la respuesta del backend.
 */
export async function getJornadasByLeague(ligaId: number): Promise<unknown> {
  const res = await apiClient.get<unknown>(`/partidos/ligas/${ligaId}/jornadas`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Crear calendario automático
// ---------------------------------------------------------------------------

export interface CreateCalendarRequest {
  tipo: 'ida' | 'ida_vuelta';
  fecha_inicio: string; // YYYY-MM-DD
  dias_partido: number[]; // 1=Lunes, 2=Martes, ..., 6=Sábado, 0=Domingo
  hora: string; // HH:MM
}

/**
 * POST /partidos/ligas/{liga_id}/crear-calendario
 * Genera el calendario automático de la liga con los cruces entre equipos.
 * Después de llamar a esto hay que refrescar con getPartidosByLeague.
 */
export async function createCalendarForLeague(
  ligaId: number,
  data: CreateCalendarRequest,
): Promise<unknown> {
  const res = await apiClient.post(
    `/partidos/ligas/${ligaId}/crear-calendario`,
    data,
  );
  return res.data;
}
