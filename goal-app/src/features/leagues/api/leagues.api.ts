/**
 * Leagues API - Endpoints del módulo de ligas.
 * Usa apiClient para token, base URL y retry.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  JoinLeagueByCodeResponse,
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  MyTeamInLeagueResponse,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';

export async function getMyLeagues(): Promise<LigaConRolResponse[]> {
  const response = await apiClient.get<LigaConRolResponse[]>('/usuarios/me/ligas');
  return response.data;
}

export async function getLeagueById(ligaId: number): Promise<LigaResponse> {
  const response = await apiClient.get<LigaResponse>(`/ligas/${ligaId}`);
  return response.data;
}

export async function createLeague(body: LigaCreateRequest): Promise<LigaResponse> {
  const response = await apiClient.post<LigaResponse>('/ligas/', body);
  return response.data;
}

export async function updateLeague(ligaId: number, body: LigaUpdateRequest): Promise<LigaResponse> {
  const response = await apiClient.put<LigaResponse>(`/ligas/${ligaId}`, body);
  return response.data;
}

export async function deleteLeague(ligaId: number): Promise<{ mensaje?: string; message?: string }> {
  const response = await apiClient.delete<{ mensaje?: string; message?: string }>(`/ligas/${ligaId}`);
  return response.data;
}

export async function setLeagueConfig(ligaId: number, body: LigaConfiguracionRequest): Promise<void> {
  await apiClient.post(`/ligas/${ligaId}/configuracion`, body);
}

export async function getLeagueConfig(ligaId: number): Promise<LeagueConfigResponse> {
  const response = await apiClient.get<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`);
  return response.data;
}

export async function updateLeagueConfig(
  ligaId: number,
  body: UpdateLeagueConfigRequest,
): Promise<LeagueConfigResponse> {
  const response = await apiClient.put<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`, body);
  return response.data;
}

/**
 * GET /equipos/usuario/mi-equipo?liga_id={ligaId}
 * Endpoint específico para obtener el equipo asignado del usuario autenticado.
 * Se usa para que las cards de liga muestren "Mi equipo" correctamente.
 */
export async function getMyTeamInLeague(ligaId: number): Promise<MyTeamInLeagueResponse> {
  const response = await apiClient.get<MyTeamInLeagueResponse>(`/equipos/usuario/mi-equipo?liga_id=${ligaId}`);
  return response.data;
}

/** Valida un código de unión igual que web. */
export async function validateJoinCode(codigo: string): Promise<unknown> {
  const response = await apiClient.get(`/invitaciones/validar-codigo/${encodeURIComponent(codigo)}`);
  return response.data;
}

/** Acepta un código de unión. FastAPI requiere body en este POST, por eso se envía {}. */
export async function acceptJoinCode(codigo: string): Promise<JoinLeagueByCodeResponse> {
  const response = await apiClient.post<JoinLeagueByCodeResponse>(
    `/invitaciones/aceptar-codigo/${encodeURIComponent(codigo)}`,
    {},
  );
  return response.data;
}
