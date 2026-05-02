/**
 * teams.api.ts
 *
 * Llamadas HTTP del módulo de equipos.
 * Usa apiClient para inyección automática de token.
 * Convención: const response = await apiClient.method<T>(...); return response.data;
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  EquipoResponse,
  EquipoRendimientoItem,
  EquipoDetalleResponse,
  ClasificacionItem,
  CreateTeamRequest,
} from '../types/teams.types';

/**
 * GET /equipos/?liga_id={liga_id}
 * Lista básica de equipos de una liga.
 */
export async function getTeamsByLeague(ligaId: number): Promise<EquipoResponse[]> {
  const response = await apiClient.get<EquipoResponse[]>(`/equipos/?liga_id=${ligaId}`);
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * GET /equipos/ligas/{liga_id}/rendimiento
 * Lista de equipos con estadísticas de rendimiento para clasificación/tabla.
 */
export async function getTeamsPerformanceByLeague(ligaId: number): Promise<EquipoRendimientoItem[]> {
  const response = await apiClient.get<EquipoRendimientoItem[]>(
    `/equipos/ligas/${ligaId}/rendimiento`,
  );
  return Array.isArray(response.data) ? response.data : [];
}

/**
 * GET /equipos/{equipo_id}/detalle
 * Detalle completo de un equipo: estadísticas, plantilla, info del club.
 */
export async function getTeamDetail(teamId: number): Promise<EquipoDetalleResponse> {
  const response = await apiClient.get<EquipoDetalleResponse>(`/equipos/${teamId}/detalle`);
  return response.data;
}

/**
 * POST /equipos/
 * Crea un equipo en la liga activa.
 */
export async function createTeam(data: CreateTeamRequest): Promise<EquipoResponse> {
  const response = await apiClient.post<EquipoResponse>('/equipos/', data);
  return response.data;
}

/**
 * GET /ligas/{liga_id}/clasificacion
 * Tabla de clasificación de la liga.
 */
export async function getClassification(ligaId: number): Promise<ClasificacionItem[]> {
  const response = await apiClient.get<ClasificacionItem[]>(`/ligas/${ligaId}/clasificacion`);
  return Array.isArray(response.data) ? response.data : [];
}
