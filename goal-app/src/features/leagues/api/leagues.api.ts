/**
 * Leagues API - Endpoints del módulo de ligas
 *
 * Usa apiClient para inyección automática de token y retry.
 * Convención: const response = await apiClient.method<T>(...); return response.data;
 */

import { apiClient } from '@/src/shared/api/client';
import type { LigaConRolResponse, LigaConfiguracionRequest, LigaCreateRequest, LigaResponse } from '../types/league.api.types';

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
 * PUT /ligas/{liga_id}/configuracion
 * Actualiza la configuración de una liga que ya tiene configuración.
 */
export async function updateLeagueConfig(
  ligaId: number,
  body: LigaConfiguracionRequest,
): Promise<void> {
  await apiClient.put(`/ligas/${ligaId}/configuracion`, body);
}
