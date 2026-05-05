/**
 * matchesService.ts
 *
 * Capa de dominio para partidos.
 * Normaliza payloads móviles y los alinea con la API real usada por web.
 */

import { logger } from "@/src/shared/utils/logger";
import { ApiError } from "@/src/shared/api/client";
import type {
  CalendarCreatePayload,
  CalendarUpdatePayload,
  CreateManualMatchRequest,
  CreateMatchPayload,
  CreateMatchEventRequest,
  FinishMatchRequest,
  MatchEventResponse,
  PartidoApi,
  ServiceResult,
  UpdateMatchPayload,
} from "../types/matches.types";
import {
  createCalendar,
  createManualMatch,
  createMatchEvent,
  deleteCalendar,
  finishMatch,
  getCalendarConfig,
  getJornadasByLeague,
  getLiveMatches,
  getMatchById,
  getMatchEvents,
  getMatchesByLeague,
  getMatchesWithTeams,
  getMatchSquads,
  getUpcomingMatches,
  startMatch,
  updateCalendar,
  updateMatch,
} from "../api/matches.api";

// ---------------------------------------------------------------------------
// Helpers de error
// ---------------------------------------------------------------------------

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError)
    return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return "Error desconocido";
}

function toNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeIsoDate(value: string | undefined | null): string | null {
  if (!value || !value.trim()) return null;

  const clean = value.trim();

  // Si ya viene con segundos, mantenerlo.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(clean)) return clean;

  // Si viene YYYY-MM-DDTHH:MM, añadir segundos.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(clean)) return `${clean}:00`;

  // Caso mobile anterior: DD/MM/YYYYTHH:m(:s). La API no acepta año al final.
  const spanishDateTime = clean.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})T(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/,
  );
  if (spanishDateTime) {
    const [, day, month, year, hour, minute, second = "0"] = spanishDateTime;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}:${second.padStart(2, "0")}`;
  }

  return clean;
}

// ---------------------------------------------------------------------------
// Helpers de normalización reutilizables
// ---------------------------------------------------------------------------

export function normalizeMatchStatus(
  status: string | undefined | null,
): "programado" | "en_juego" | "finalizado" | "cancelado" {
  if (!status) return "programado";
  const s = status.toLowerCase().trim();
  if (s === "en_juego" || s === "en_vivo" || s === "live") return "en_juego";
  if (s === "finalizado" || s === "finished") return "finalizado";
  if (s === "cancelado" || s === "cancelled") return "cancelado";
  return "programado";
}

export function getMatchId(partido: PartidoApi): number {
  return partido.id_partido;
}

export function getMatchDate(partido: PartidoApi): string | null {
  return partido.fecha_hora ?? partido.fecha ?? null;
}

export function getHomeTeamId(partido: PartidoApi): number | null {
  return (
    partido.equipo_local?.id_equipo ??
    partido.equipo_local?.id ??
    partido.id_equipo_local ??
    null
  );
}

export function getAwayTeamId(partido: PartidoApi): number | null {
  return (
    partido.equipo_visitante?.id_equipo ??
    partido.equipo_visitante?.id ??
    partido.id_equipo_visitante ??
    null
  );
}

export function getJornadaNumber(partido: PartidoApi): number | null {
  return (
    partido.jornada ??
    partido.numero_jornada ??
    partido.num_jornada ??
    partido.id_jornada ??
    null
  );
}

/**
 * Convierte el request flexible del móvil al payload exacto de POST /partidos/.
 * No envía campos no confirmados por web como estadio o delegado.
 */
export function buildCreateMatchPayload(
  ligaIdOrRequest: number | CreateManualMatchRequest,
  dataMaybe?: CreateManualMatchRequest,
): ServiceResult<CreateMatchPayload> {
  const source =
    typeof ligaIdOrRequest === "number"
      ? { ...dataMaybe, id_liga: ligaIdOrRequest }
      : ligaIdOrRequest;

  const idLiga = toNumber(source.id_liga);
  const idLocal = toNumber(source.id_equipo_local);
  const idVisitante = toNumber(source.id_equipo_visitante);
  const fecha = normalizeIsoDate(source.fecha ?? source.fecha_hora);
  const idJornada = toNumber(source.id_jornada ?? source.numero_jornada);

  if (!idLiga) return { success: false, error: "Liga no válida" };
  if (!idLocal) return { success: false, error: "Selecciona el equipo local" };
  if (!idVisitante)
    return { success: false, error: "Selecciona el equipo visitante" };
  if (idLocal === idVisitante)
    return {
      success: false,
      error: "El equipo local y visitante deben ser distintos",
    };
  if (!fecha)
    return { success: false, error: "La fecha y hora son obligatorias" };

  return {
    success: true,
    data: {
      id_liga: idLiga,
      id_equipo_local: idLocal,
      id_equipo_visitante: idVisitante,
      fecha,
      ...(idJornada ? { id_jornada: idJornada } : {}),
    },
  };
}

function normalizeEventPayload(
  matchId: number,
  data: CreateMatchEventRequest,
): CreateMatchEventRequest {
  const rawType = data.tipo_evento ?? data.tipo ?? "";
  const tipo_evento = rawType === "sustitucion" ? "cambio" : rawType;

  return {
    ...data,
    id_partido: matchId,
    tipo_evento,
    minuto: data.minuto ?? 0,
  };
}

function normalizeFinishPayload(data: FinishMatchRequest): FinishMatchRequest {
  return {
    goles_local: data.goles_local,
    goles_visitante: data.goles_visitante,
    id_mvp: data.id_mvp ?? null,
    puntuacion_mvp: data.puntuacion_mvp ?? null,
    incidencias: data.incidencias ?? data.observaciones ?? null,
  };
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export async function getMatchesByLeagueService(
  ligaId: number,
): Promise<PartidoApi[]> {
  return getMatchesByLeague(ligaId);
}

export async function getMatchesWithTeamsService(
  ligaId: number,
): Promise<PartidoApi[]> {
  return getMatchesWithTeams(ligaId);
}

export async function getUpcomingMatchesService(
  ligaId: number,
  limit = 3,
): Promise<PartidoApi[]> {
  return getUpcomingMatches(ligaId, limit);
}

export async function getLiveMatchesService(
  ligaId: number,
): Promise<PartidoApi[]> {
  return getLiveMatches(ligaId);
}

export async function getJornadasByLeagueService(
  ligaId: number,
): Promise<unknown> {
  return getJornadasByLeague(ligaId);
}

export async function getMatchByIdService(
  matchId: number,
): Promise<ServiceResult<PartidoApi>> {
  try {
    const data = await getMatchById(matchId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchEventsService(
  matchId: number,
): Promise<ServiceResult<MatchEventResponse[]>> {
  try {
    const data = await getMatchEvents(matchId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Mutaciones
// ---------------------------------------------------------------------------

export async function createManualMatchService(
  ligaIdOrRequest: number | CreateManualMatchRequest,
  dataMaybe?: CreateManualMatchRequest,
): Promise<ServiceResult<PartidoApi>> {
  const payloadResult = buildCreateMatchPayload(ligaIdOrRequest, dataMaybe);
  if (!payloadResult.success || !payloadResult.data)
    return { success: false, error: payloadResult.error };

  try {
    const result = await createManualMatch(payloadResult.data);
    logger.info("matchesService", "createManualMatch OK", {
      ligaId: payloadResult.data.id_liga,
    });
    return { success: true, data: result };
  } catch (error) {
    logger.warn("matchesService", "createManualMatch FALLÓ", {
      error: getApiErrorMessage(error),
    });
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function updateMatchService(
  matchId: number,
  data: UpdateMatchPayload,
): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await updateMatch(matchId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function startMatchService(
  matchId: number,
): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await startMatch(matchId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function finishMatchService(
  matchId: number,
  data: FinishMatchRequest,
): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await finishMatch(matchId, normalizeFinishPayload(data));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createMatchEventService(
  matchId: number,
  data: CreateMatchEventRequest,
): Promise<ServiceResult<MatchEventResponse>> {
  try {
    const result = await createMatchEvent(normalizeEventPayload(matchId, data));
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------------

export async function createCalendarService(
  ligaId: number,
  data: CalendarCreatePayload,
): Promise<ServiceResult<unknown>> {
  try {
    const result = await createCalendar(ligaId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getCalendarConfigService(
  ligaId: number,
): Promise<ServiceResult<unknown>> {
  try {
    const result = await getCalendarConfig(ligaId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function deleteCalendarService(
  ligaId: number,
): Promise<ServiceResult<void>> {
  try {
    await deleteCalendar(ligaId);
    return { success: true };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function updateCalendarService(
  ligaId: number,
  data: CalendarUpdatePayload,
): Promise<ServiceResult<unknown>> {
  try {
    const result = await updateCalendar(ligaId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

// ---------------------------------------------------------------------------
// Plantillas / convocatoria
// ---------------------------------------------------------------------------

export async function getMatchSquadsService(
  matchId: number,
): Promise<ServiceResult<unknown>> {
  const result = await getMatchSquads(matchId);
  if (result === null)
    return {
      success: false,
      error: "Endpoint de plantilla de partido no disponible en backend",
    };
  return { success: true, data: result };
}
