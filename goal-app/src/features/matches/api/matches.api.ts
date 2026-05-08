/**
 * matches.api.ts
 * Endpoints reales del módulo de partidos/eventos.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  PartidoApi,
  CreateManualMatchRequest,
  UpdateMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
} from '../types/matches.types';

export async function getMatchesByLeague(ligaId: number): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(`/partidos/ligas/${ligaId}/con-equipos`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getPlainMatchesByLeague(ligaId: number): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(`/partidos/ligas/${ligaId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getUpcomingMatches(ligaId: number, limit = 3): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(`/partidos/proximos?limit=${limit}&liga_id=${ligaId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getLiveMatches(ligaId: number): Promise<PartidoApi[]> {
  const res = await apiClient.get<PartidoApi[]>(`/partidos/en-vivo?liga_id=${ligaId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function getMatchById(matchId: number): Promise<PartidoApi> {
  const res = await apiClient.get<PartidoApi>(`/partidos/${matchId}`);
  return res.data;
}

export async function createManualMatch(data: CreateManualMatchRequest): Promise<PartidoApi> {
  const res = await apiClient.post<PartidoApi>('/partidos/', data);
  return res.data;
}

export async function updateMatch(matchId: number, data: UpdateMatchRequest): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(`/partidos/${matchId}`, data);
  return res.data;
}

export async function getJornadasByLeague(ligaId: number): Promise<unknown> {
  const res = await apiClient.get<unknown>(`/partidos/ligas/${ligaId}/jornadas`);
  return res.data;
}

export async function startMatch(matchId: number): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(`/partidos/${matchId}/iniciar`, {});
  return res.data;
}

export async function finishMatch(matchId: number, data: FinishMatchRequest): Promise<PartidoApi> {
  const res = await apiClient.put<PartidoApi>(`/partidos/${matchId}/finalizar`, data);
  return res.data;
}

export async function getMatchEvents(matchId: number): Promise<unknown[]> {
  const res = await apiClient.get<unknown[]>(`/eventos/partido/${matchId}`);
  return Array.isArray(res.data) ? res.data : [];
}

export async function createMatchEvent(data: CreateMatchEventRequest): Promise<unknown> {
  const res = await apiClient.post<unknown>('/eventos/', data);
  return res.data;
}
