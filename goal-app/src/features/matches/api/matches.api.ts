/**
 * matches.api.ts
 *
 * Capa HTTP real del módulo de partidos.
 * Está alineada con la integración web entregada:
 * - Crear partido manual: POST /partidos/
 * - Iniciar/finalizar: PUT /partidos/{id}/iniciar|finalizar
 * - Eventos: GET /eventos/partido/{id} y POST /eventos/
 *
 * Reglas:
 * - Usar apiClient, nunca fetch directo.
 * - No duplicar /api/v1.
 * - No devolver mocks ni stubs silenciosos para endpoints confirmados.
 */

import { apiClient } from "@/src/shared/api/client";
import type {
  CalendarCreatePayload,
  CalendarUpdatePayload,
  CreateMatchPayload,
  CreateMatchEventRequest,
  FinishMatchRequest,
  JornadaPartidosApi,
  MatchEventResponse,
  PartidoApi,
  UpdateMatchPayload,
} from "../types/matches.types";

// ---------------------------------------------------------------------------
// Lecturas de partidos
// ---------------------------------------------------------------------------

export async function getMatchesByLeague(
  ligaId: number,
): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(`/partidos/ligas/${ligaId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMatchesWithTeams(
  ligaId: number,
): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[] | null>(
    `/partidos/ligas/${ligaId}/con-equipos`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getUpcomingMatches(
  ligaId: number,
  limit = 3,
): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(
    `/partidos/proximos?limit=${limit}&liga_id=${ligaId}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getLiveMatches(ligaId: number): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(
    `/partidos/en-vivo?liga_id=${ligaId}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMatchById(partidoId: number): Promise<PartidoApi> {
  const res = await apiClient.get<PartidoApi>(`/partidos/${partidoId}`);
  return res.data;
}

export async function getJornadasByLeague(ligaId: number): Promise<unknown> {
  const res = await apiClient.get<
    JornadaPartidosApi[] | { jornadas?: JornadaPartidosApi[] } | PartidoApi[]
  >(`/partidos/ligas/${ligaId}/jornadas`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Mutaciones de partido
// ---------------------------------------------------------------------------

export async function createManualMatch(
  data: CreateMatchPayload,
): Promise<PartidoApi> {
  const res = await apiClient.post<PartidoApi>("/partidos/", data);
  return res.data;
}

export async function updateMatch(
  partidoId: number,
  data: UpdateMatchPayload,
): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(`/partidos/${partidoId}`, data);
  return res.data;
}

export async function startMatch(partidoId: number): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(
    `/partidos/${partidoId}/iniciar`,
    {},
  );
  return res.data;
}

export async function finishMatch(
  partidoId: number,
  data: FinishMatchRequest,
): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(
    `/partidos/${partidoId}/finalizar`,
    data,
  );
  return res.data;
}

// ---------------------------------------------------------------------------
// Calendario de partidos
// ---------------------------------------------------------------------------

export async function createCalendar(
  ligaId: number,
  data: CalendarCreatePayload,
): Promise<unknown> {
  const res = await apiClient.post(
    `/partidos/ligas/${ligaId}/crear-calendario`,
    data,
  );
  return res.data;
}

export async function getCalendarConfig(ligaId: number): Promise<unknown> {
  const res = await apiClient.get(
    `/partidos/ligas/${ligaId}/config-calendario`,
  );
  return res.data;
}

export async function deleteCalendar(ligaId: number): Promise<void> {
  await apiClient.delete(`/partidos/ligas/${ligaId}/calendario`);
}

export async function updateCalendar(
  ligaId: number,
  data: CalendarUpdatePayload,
): Promise<unknown> {
  const res = await apiClient.put(`/partidos/ligas/${ligaId}/calendario`, data);
  return res.data;
}

// ---------------------------------------------------------------------------
// Eventos de partido
// ---------------------------------------------------------------------------

export async function getMatchEvents(
  partidoId: number,
): Promise<MatchEventResponse[]> {
  const res = await apiClient.get<MatchEventResponse[]>(
    `/eventos/partido/${partidoId}`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMatchEvent(
  data: CreateMatchEventRequest,
): Promise<MatchEventResponse> {
  const res = await apiClient.post<MatchEventResponse>("/eventos/", data);
  return res.data;
}

// ---------------------------------------------------------------------------
// Plantillas / convocatoria del partido
// ---------------------------------------------------------------------------

export async function getMatchSquads(_partidoId: number): Promise<unknown> {
  // El archivo web entregado no confirma endpoint de plantilla de partido.
  // Mantener como fallo controlado en service hasta que backend lo documente.
  return null;
}
