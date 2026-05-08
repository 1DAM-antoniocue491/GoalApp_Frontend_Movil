/**
 * Leagues API - Endpoints del módulo de ligas.
 *
 * Todas las llamadas pasan por apiClient para reutilizar base URL, token,
 * manejo de 401/retry y logging común. No usar fetch directo en esta capa.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  DejarSeguirResponse,
  JoinLeagueByCodeResponse,
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaSeguidaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  MyTeamInLeagueResponse,
  ReactivateLeagueResponse,
  SeguimientoResponse,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';

/** GET /usuarios/me/ligas — ligas donde el usuario tiene un rol. */
export async function getMyLeagues(): Promise<LigaConRolResponse[]> {
  const response = await apiClient.get<LigaConRolResponse[]>('/usuarios/me/ligas');
  return response.data;
}

/** GET /usuarios/me/ligas-seguidas — ligas marcadas como favoritas/seguidas. */
export async function getFollowedLeagues(): Promise<LigaSeguidaResponse[]> {
  const response = await apiClient.get<LigaSeguidaResponse[]>('/usuarios/me/ligas-seguidas');
  return response.data;
}

/** POST /usuarios/me/ligas/{liga_id}/seguir — marca una liga como favorita. */
export async function followLeague(ligaId: number): Promise<SeguimientoResponse> {
  const response = await apiClient.post<SeguimientoResponse>(`/usuarios/me/ligas/${ligaId}/seguir`);
  return response.data;
}

/** DELETE /usuarios/me/ligas/{liga_id}/seguir — quita una liga de favoritas. */
export async function unfollowLeague(ligaId: number): Promise<DejarSeguirResponse> {
  const response = await apiClient.delete<DejarSeguirResponse>(`/usuarios/me/ligas/${ligaId}/seguir`);
  return response.data;
}

/** PUT /ligas/{liga_id}/reactivar — reactiva una liga finalizada. */
export async function reactivateLeague(ligaId: number): Promise<ReactivateLeagueResponse> {
  const response = await apiClient.put<ReactivateLeagueResponse>(`/ligas/${ligaId}/reactivar`, {});
  return response.data;
}

/** GET /ligas/{liga_id}. */
export async function getLeagueById(ligaId: number): Promise<LigaResponse> {
  const response = await apiClient.get<LigaResponse>(`/ligas/${ligaId}`);
  return response.data;
}

/** POST /ligas/. */
export async function createLeague(body: LigaCreateRequest): Promise<LigaResponse> {
  const response = await apiClient.post<LigaResponse>('/ligas/', body);
  return response.data;
}

/** PUT /ligas/{liga_id}. */
export async function updateLeague(ligaId: number, body: LigaUpdateRequest): Promise<LigaResponse> {
  const response = await apiClient.put<LigaResponse>(`/ligas/${ligaId}`, body);
  return response.data;
}

/** DELETE /ligas/{liga_id}. */
export async function deleteLeague(ligaId: number): Promise<{ mensaje?: string; message?: string }> {
  const response = await apiClient.delete<{ mensaje?: string; message?: string }>(`/ligas/${ligaId}`);
  return response.data;
}

/** POST /ligas/{liga_id}/configuracion. */
export async function setLeagueConfig(ligaId: number, body: LigaConfiguracionRequest): Promise<void> {
  await apiClient.post(`/ligas/${ligaId}/configuracion`, body);
}

/** GET /ligas/{liga_id}/configuracion. */
export async function getLeagueConfig(ligaId: number): Promise<LeagueConfigResponse> {
  const response = await apiClient.get<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`);
  return response.data;
}

/** PUT /ligas/{liga_id}/configuracion. */
export async function updateLeagueConfig(
  ligaId: number,
  body: UpdateLeagueConfigRequest,
): Promise<LeagueConfigResponse> {
  const response = await apiClient.put<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`, body);
  return response.data;
}

/**
 * GET /equipos/usuario/mi-equipo?liga_id={id}
 * Consulta secundaria para mostrar “Mi equipo” en tarjetas. No debe bloquear onboarding.
 */
export async function getMyTeamInLeague(ligaId: number): Promise<MyTeamInLeagueResponse> {
  const response = await apiClient.get<MyTeamInLeagueResponse>(`/equipos/usuario/mi-equipo?liga_id=${ligaId}`);
  return response.data;
}

/** GET /invitaciones/validar-codigo/{codigo}. */
export async function validateJoinCode(codigo: string): Promise<unknown> {
  const response = await apiClient.get(`/invitaciones/validar-codigo/${encodeURIComponent(codigo)}`);
  return response.data;
}

/**
 * POST /invitaciones/aceptar-codigo/{codigo}.
 * FastAPI necesita body en este POST; por eso se envía {} igual que en web.
 */
export async function acceptJoinCode(codigo: string): Promise<JoinLeagueByCodeResponse> {
  const response = await apiClient.post<JoinLeagueByCodeResponse>(
    `/invitaciones/aceptar-codigo/${encodeURIComponent(codigo)}`,
    {},
  );
  return response.data;
}
