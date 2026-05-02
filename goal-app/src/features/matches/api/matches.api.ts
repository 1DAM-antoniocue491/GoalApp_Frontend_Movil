/**
 * matches.api.ts
 *
 * Capa HTTP del módulo de partidos.
 *
 * ENDPOINTS CONFIRMADOS (verificados en código existente del proyecto):
 *   GET  /partidos/ligas/{liga_id}/con-equipos   — partidos con equipos embebidos
 *   GET  /partidos/ligas/{liga_id}/jornadas       — partidos agrupados por jornada
 *
 * ENDPOINTS NO CONFIRMADOS — comentados con TODO API:
 *   GET  /partidos/{partido_id}                          — detalle individual
 *   POST /partidos/ligas/{liga_id}/crear-partido         — partido manual
 *   POST /partidos/{partido_id}/iniciar                  — iniciar partido
 *   POST /partidos/{partido_id}/finalizar                — finalizar partido
 *   POST /partidos/{partido_id}/eventos                  — registrar evento
 *   GET  /partidos/{partido_id}/plantilla                — plantilla/squads
 *
 * Reglas:
 * - Usar apiClient, nunca fetch directo
 * - No hardcodear BASE_URL ni /api/v1 (apiClient lo gestiona)
 * - Los endpoints no confirmados devuelven null — no lanzan
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  PartidoApi,
  CreateManualMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
} from '../types/matches.types';

// ---------------------------------------------------------------------------
// Endpoints confirmados
// ---------------------------------------------------------------------------

/**
 * GET /partidos/ligas/{liga_id}/con-equipos
 * Todos los partidos de la liga con equipos embebidos.
 * Mismo endpoint que usan dashboard.api.ts y calendar.api.ts (fallback).
 * Se expone aquí para que matchesService lo consuma directamente sin
 * depender de esos módulos.
 */
export async function getMatchesByLeague(ligaId: number): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[] | null>(
    `/partidos/ligas/${ligaId}/con-equipos`,
  );
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * GET /partidos/ligas/{liga_id}/jornadas
 * Partidos agrupados por jornada.
 * Devuelve unknown para que el service normalice la forma variable del backend.
 * El servicio de calendario ya tiene normalizeJornadasResponse para este propósito.
 */
export async function getJornadasByLeague(ligaId: number): Promise<unknown> {
  const res = await apiClient.get<unknown>(`/partidos/ligas/${ligaId}/jornadas`);
  return res.data;
}

// ---------------------------------------------------------------------------
// Endpoints no confirmados — TODO API
// ---------------------------------------------------------------------------

/**
 * GET /partidos/{partido_id}
 *
 * TODO API: endpoint no encontrado en OpenAPI local ni en código existente.
 * No implementar llamada real hasta que el backend lo exponga.
 */
export async function getMatchById(_matchId: number): Promise<PartidoApi | null> {
  // TODO API: descomentar cuando el backend exponga GET /partidos/{partido_id}
  // const res = await apiClient.get<PartidoApi>(`/partidos/${_matchId}`);
  // return res.data;
  return null;
}

/**
 * POST /partidos/ligas/{liga_id}/crear-partido
 *
 * TODO API: endpoint no confirmado. La ruta sigue el patrón de crear-calendario
 * del mismo módulo, pero body y respuesta deben verificarse contra el backend.
 */
export async function createManualMatch(
  ligaId: number,
  data: CreateManualMatchRequest,
): Promise<PartidoApi | null> {
  // TODO API: descomentar cuando el backend exponga POST /partidos/ligas/{liga_id}/crear-partido
  // const res = await apiClient.post<PartidoApi>(
  //   `/partidos/ligas/${ligaId}/crear-partido`,
  //   data,
  // );
  // return res.data;
  void ligaId;
  void data;
  return null;
}

/**
 * POST /partidos/{partido_id}/iniciar
 *
 * TODO API: endpoint no confirmado. El hook useMatchActionModals referencia
 * PATCH /matches/:id/start (inglés), que no coincide con la convención del
 * backend (español, /partidos/). No implementar hasta confirmar ruta y método.
 */
export async function startMatch(_matchId: number): Promise<PartidoApi | null> {
  // TODO API: descomentar cuando el backend confirme ruta y método
  // Probable: POST /partidos/{_matchId}/iniciar
  // const res = await apiClient.post<PartidoApi>(`/partidos/${_matchId}/iniciar`, {});
  // return res.data;
  return null;
}

/**
 * POST /partidos/{partido_id}/finalizar
 *
 * TODO API: endpoint no confirmado. No implementar llamada real hasta verificar
 * ruta exacta, método HTTP y campos del body con el backend.
 */
export async function finishMatch(
  _matchId: number,
  _data: FinishMatchRequest,
): Promise<PartidoApi | null> {
  // TODO API: descomentar cuando el backend confirme ruta y método
  // Probable: POST /partidos/{_matchId}/finalizar
  // const res = await apiClient.post<PartidoApi>(`/partidos/${_matchId}/finalizar`, _data);
  // return res.data;
  return null;
}

/**
 * POST /partidos/{partido_id}/eventos
 *
 * TODO API: endpoint no confirmado. Cubre gol, tarjeta amarilla, tarjeta roja
 * y sustitución. No implementar hasta verificar ruta, método y body con backend.
 */
export async function createMatchEvent(
  _matchId: number,
  _data: CreateMatchEventRequest,
): Promise<unknown> {
  // TODO API: descomentar cuando el backend exponga POST /partidos/{_matchId}/eventos
  // const res = await apiClient.post<unknown>(`/partidos/${_matchId}/eventos`, _data);
  // return res.data;
  return null;
}

/**
 * GET /partidos/{partido_id}/plantilla
 *
 * TODO API: endpoint no confirmado. Los modales (GoalEventModal, YellowCardModal,
 * etc.) referencian GET /matches/:id/squads (inglés, sin verificar).
 * No implementar hasta confirmar ruta real en el backend.
 */
export async function getMatchSquads(_matchId: number): Promise<unknown> {
  // TODO API: descomentar cuando el backend exponga el endpoint de plantilla
  // Probable: GET /partidos/{_matchId}/plantilla  (o /convocatoria)
  // const res = await apiClient.get<unknown>(`/partidos/${_matchId}/plantilla`);
  // return res.data;
  return null;
}
