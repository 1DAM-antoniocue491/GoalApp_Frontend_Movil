/**
 * matchesService.ts
 *
 * Capa de orquestación entre la UI y la API de partidos.
 *
 * PATRÓN DE DATOS:
 *   UI → matchesService → matches.api → apiClient → Backend
 *
 * REGLAS:
 * - Las mutaciones siempre devuelven ServiceResult<T>, nunca lanzan.
 * - Las lecturas sí pueden lanzar para que el hook decida el estado de error.
 * - Los endpoints no confirmados devuelven { success: false, error: '...' }
 *   en lugar de lanzar. No hay throws de "not implemented".
 * - Usar logger para trazabilidad, nunca console.log.
 * - No imprimir tokens ni datos sensibles.
 */

import { logger } from '@/src/shared/utils/logger';
import { ApiError } from '@/src/shared/api/client';
import type {
  PartidoApi,
  CreateManualMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
  ServiceResult,
} from '../types/matches.types';
import {
  getMatchesByLeague,
  getJornadasByLeague,
  getMatchById,
  createManualMatch,
  startMatch,
  finishMatch,
  createMatchEvent,
  getMatchSquads,
} from '../api/matches.api';

// ---------------------------------------------------------------------------
// Helper de errores
// ---------------------------------------------------------------------------

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message || `Error ${error.status}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Error desconocido';
}

// ---------------------------------------------------------------------------
// Helpers de normalización — reutilizables en calendario, dashboard y UI
// ---------------------------------------------------------------------------

/**
 * Normaliza el estado del partido a un valor canónico.
 * - 'en_vivo' se trata igual que 'en_juego' (alias de backend).
 * - 'cancelado' devuelve 'cancelado' para que la UI lo filtre si corresponde.
 * - Cualquier valor desconocido se trata como 'programado' por defecto,
 *   igual que en calendarService.ts, para no descartar partidos válidos.
 */
export function normalizeMatchStatus(
  status: string | undefined | null,
): 'programado' | 'en_juego' | 'finalizado' | 'cancelado' {
  if (!status) return 'programado';
  const s = status.toLowerCase().trim();
  if (s === 'en_juego' || s === 'en_vivo') return 'en_juego';
  if (s === 'finalizado') return 'finalizado';
  if (s === 'cancelado' || s === 'cancelled') return 'cancelado';
  return 'programado';
}

/** Extrae el ID canónico del partido */
export function getMatchId(partido: PartidoApi): number {
  return partido.id_partido;
}

/**
 * Extrae la fecha del partido intentando los campos en orden de preferencia.
 * Devuelve null si no hay ninguna fecha disponible.
 */
export function getMatchDate(partido: PartidoApi): string | null {
  return partido.fecha_hora ?? partido.fecha ?? null;
}

/**
 * Extrae el ID del equipo local desde la forma flexible del DTO.
 * Prioriza el objeto embebido sobre el campo plano.
 */
export function getHomeTeamId(partido: PartidoApi): number | null {
  return (
    partido.equipo_local?.id_equipo ??
    partido.equipo_local?.id ??
    partido.id_equipo_local ??
    null
  );
}

/**
 * Extrae el ID del equipo visitante desde la forma flexible del DTO.
 * Prioriza el objeto embebido sobre el campo plano.
 */
export function getAwayTeamId(partido: PartidoApi): number | null {
  return (
    partido.equipo_visitante?.id_equipo ??
    partido.equipo_visitante?.id ??
    partido.id_equipo_visitante ??
    null
  );
}

/**
 * Extrae el número de jornada probando los nombres de campo en orden.
 * El backend usa distintos nombres según el endpoint.
 */
export function getJornadaNumber(partido: PartidoApi): number | null {
  return partido.jornada ?? partido.numero_jornada ?? partido.num_jornada ?? null;
}

// ---------------------------------------------------------------------------
// Lecturas — pueden lanzar para que el hook gestione el estado de error
// ---------------------------------------------------------------------------

export async function getMatchesByLeagueService(ligaId: number): Promise<PartidoApi[]> {
  logger.info('matchesService', 'getMatchesByLeague', { ligaId });
  return getMatchesByLeague(ligaId);
}

export async function getJornadasByLeagueService(ligaId: number): Promise<unknown> {
  logger.info('matchesService', 'getJornadasByLeague', { ligaId });
  return getJornadasByLeague(ligaId);
}

/**
 * Detalle de partido individual.
 * Devuelve ServiceResult porque el endpoint no está confirmado.
 */
export async function getMatchByIdService(
  matchId: number,
): Promise<ServiceResult<PartidoApi>> {
  // TODO API: getMatchById devuelve null hasta que el endpoint esté confirmado.
  const data = await getMatchById(matchId);
  if (data === null) {
    return { success: false, error: 'Endpoint no disponible en backend' };
  }
  return { success: true, data };
}

// ---------------------------------------------------------------------------
// Mutaciones — siempre devuelven ServiceResult, nunca lanzan
// ---------------------------------------------------------------------------

export async function createManualMatchService(
  ligaId: number,
  data: CreateManualMatchRequest,
): Promise<ServiceResult<PartidoApi>> {
  try {
    // TODO API: createManualMatch devuelve null hasta que el endpoint esté confirmado.
    const result = await createManualMatch(ligaId, data);
    if (result === null) {
      return { success: false, error: 'Endpoint no disponible en backend' };
    }
    logger.info('matchesService', 'createManualMatch OK', { ligaId });
    return { success: true, data: result };
  } catch (error) {
    logger.warn('matchesService', 'createManualMatch FALLÓ', {
      ligaId,
      error: getApiErrorMessage(error),
    });
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function startMatchService(
  matchId: number,
): Promise<ServiceResult<PartidoApi>> {
  try {
    // TODO API: startMatch devuelve null hasta que el endpoint esté confirmado.
    const result = await startMatch(matchId);
    if (result === null) {
      return { success: false, error: 'Endpoint no disponible en backend' };
    }
    logger.info('matchesService', 'startMatch OK', { matchId });
    return { success: true, data: result };
  } catch (error) {
    logger.warn('matchesService', 'startMatch FALLÓ', {
      matchId,
      error: getApiErrorMessage(error),
    });
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function finishMatchService(
  matchId: number,
  data: FinishMatchRequest,
): Promise<ServiceResult<PartidoApi>> {
  try {
    // TODO API: finishMatch devuelve null hasta que el endpoint esté confirmado.
    const result = await finishMatch(matchId, data);
    if (result === null) {
      return { success: false, error: 'Endpoint no disponible en backend' };
    }
    logger.info('matchesService', 'finishMatch OK', { matchId });
    return { success: true, data: result };
  } catch (error) {
    logger.warn('matchesService', 'finishMatch FALLÓ', {
      matchId,
      error: getApiErrorMessage(error),
    });
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createMatchEventService(
  matchId: number,
  data: CreateMatchEventRequest,
): Promise<ServiceResult<unknown>> {
  try {
    // TODO API: createMatchEvent devuelve null hasta que el endpoint esté confirmado.
    const result = await createMatchEvent(matchId, data);
    if (result === null) {
      return { success: false, error: 'Endpoint no disponible en backend' };
    }
    logger.info('matchesService', 'createMatchEvent OK', { matchId, tipo: data.tipo });
    return { success: true, data: result };
  } catch (error) {
    logger.warn('matchesService', 'createMatchEvent FALLÓ', {
      matchId,
      error: getApiErrorMessage(error),
    });
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchSquadsService(
  matchId: number,
): Promise<ServiceResult<unknown>> {
  // TODO API: getMatchSquads devuelve null hasta que el endpoint esté confirmado.
  const result = await getMatchSquads(matchId);
  if (result === null) {
    return { success: false, error: 'Endpoint no disponible en backend' };
  }
  return { success: true, data: result };
}
