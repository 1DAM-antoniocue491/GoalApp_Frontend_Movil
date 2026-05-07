/**
 * Leagues API - Endpoints del módulo de ligas
 *
 * Usa apiClient para inyección automática de token y retry.
 * Convención: const response = await apiClient.method<T>(...); return response.data;
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';

/**
 * GET /usuarios/me/ligas
 * Devuelve las ligas del usuario autenticado con su rol en cada una.
 */
export async function getMyLeagues(): Promise<LigaConRolResponse[]> {
  const response = await apiClient.get<LigaConRolResponse[]>('/usuarios/me/ligas');
  return response.data;
}

/**
 * GET /ligas/{liga_id}
 * Devuelve el detalle de una liga por ID.
 */
export async function getLeagueById(ligaId: number): Promise<LigaResponse> {
  const response = await apiClient.get<LigaResponse>(`/ligas/${ligaId}`);
  return response.data;
}

/**
 * POST /ligas/
 * Crea una nueva liga. El usuario autenticado queda como administrador.
 */
export async function createLeague(body: LigaCreateRequest): Promise<LigaResponse> {
  const response = await apiClient.post<LigaResponse>('/ligas/', body);
  return response.data;
}

/**
 * POST /ligas/{liga_id}/configuracion
 * Crea la configuración de una liga nueva (primera vez).
 */
export async function setLeagueConfig(
  ligaId: number,
  body: LigaConfiguracionRequest,
): Promise<void> {
  await apiClient.post(`/ligas/${ligaId}/configuracion`, body);
}

/**
 * GET /ligas/{liga_id}/configuracion
 * Obtiene la configuración actual de la liga.
 */
export async function getLeagueConfig(ligaId: number): Promise<LeagueConfigResponse> {
  const response = await apiClient.get<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`);
  return response.data;
}

/**
 * PUT /ligas/{liga_id}/configuracion
 * Actualiza la configuración de una liga que ya tiene configuración.
 * Acepta campos parciales (UpdateLeagueConfigRequest).
 * LigaConfiguracionRequest (campos requeridos) es asignable a este tipo.
 */
export async function updateLeagueConfig(
  ligaId: number,
  body: UpdateLeagueConfigRequest,
): Promise<LeagueConfigResponse> {
  const response = await apiClient.put<LeagueConfigResponse>(`/ligas/${ligaId}/configuracion`, body);
  return response.data;
}

/**
 * PUT /ligas/{liga_id}
 * Actualiza datos básicos de la liga (nombre, temporada, estado, etc.).
 */
export async function updateLeague(
  ligaId: number,
  body: LigaUpdateRequest,
): Promise<LigaResponse> {
  const response = await apiClient.put<LigaResponse>(`/ligas/${ligaId}`, body);
  return response.data;
}


/**
 * DELETE /ligas/{liga_id}
 * Elimina una liga. Solo debe invocarse desde flujos de administrador.
 */
export async function deleteLeague(ligaId: number): Promise<void> {
  await apiClient.delete(`/ligas/${ligaId}`);
}
