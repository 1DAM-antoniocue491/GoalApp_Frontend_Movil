/**
 * teams.api.ts
 *
 * Llamadas HTTP del módulo de equipos.
 * Usa apiClient para inyección automática de token.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  EquipoResponse,
  EquipoRendimientoItem,
  EquipoDetalleResponse,
  ClasificacionItem,
  CreateTeamRequest,
  EquipoUpdate,
  JugadorResumen,
  MatchSummary,
  TeamTopScorer,
} from '../types/teams.types';

/** GET /equipos/?liga_id={liga_id} */
export async function getTeamsByLeague(ligaId: number): Promise<EquipoResponse[]> {
  const response = await apiClient.get<EquipoResponse[]>(`/equipos/?liga_id=${ligaId}`);
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /equipos/{equipo_id} */
export async function getTeamById(teamId: number): Promise<EquipoResponse> {
  const response = await apiClient.get<EquipoResponse>(`/equipos/${teamId}`);
  return response.data;
}

/** GET /equipos/ligas/{liga_id}/rendimiento */
export async function getTeamsPerformanceByLeague(ligaId: number): Promise<EquipoRendimientoItem[]> {
  const response = await apiClient.get<EquipoRendimientoItem[]>(
    `/equipos/ligas/${ligaId}/rendimiento`,
  );
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /equipos/{equipo_id}/detalle */
export async function getTeamDetail(teamId: number): Promise<EquipoDetalleResponse> {
  const response = await apiClient.get<EquipoDetalleResponse>(`/equipos/${teamId}/detalle`);
  return response.data;
}

/** GET /equipos/{equipo_id}/plantilla */
export async function getTeamSquad(teamId: number): Promise<JugadorResumen[]> {
  const response = await apiClient.get<JugadorResumen[]>(`/equipos/${teamId}/plantilla`);
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /equipos/{equipo_id}/partidos/proximos */
export async function getTeamUpcomingMatches(teamId: number): Promise<MatchSummary[]> {
  const response = await apiClient.get<MatchSummary[]>(`/equipos/${teamId}/partidos/proximos`);
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /equipos/{equipo_id}/partidos/ultimos */
export async function getTeamLastMatches(teamId: number): Promise<MatchSummary[]> {
  const response = await apiClient.get<MatchSummary[]>(`/equipos/${teamId}/partidos/ultimos`);
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /equipos/{equipo_id}/goleadores */
export async function getTeamTopScorers(teamId: number): Promise<TeamTopScorer[]> {
  const response = await apiClient.get<TeamTopScorer[]>(`/equipos/${teamId}/goleadores`);
  return Array.isArray(response.data) ? response.data : [];
}

/** PUT /equipos/{equipo_id} */
export async function updateTeam(teamId: number, data: EquipoUpdate): Promise<EquipoResponse> {
  const response = await apiClient.put<EquipoResponse>(`/equipos/${teamId}`, data);
  return response.data;
}

/** DELETE /equipos/{equipo_id} */
export async function deleteTeam(teamId: number): Promise<void> {
  await apiClient.delete(`/equipos/${teamId}`);
}

/** POST /equipos/ */
export async function createTeam(data: CreateTeamRequest): Promise<EquipoResponse> {
  const response = await apiClient.post<EquipoResponse>('/equipos/', data);
  return response.data;
}

/** GET /ligas/{liga_id}/clasificacion */
export async function getClassification(ligaId: number): Promise<ClasificacionItem[]> {
  const response = await apiClient.get<ClasificacionItem[]>(`/ligas/${ligaId}/clasificacion`);
  return Array.isArray(response.data) ? response.data : [];
}
