/**
 * convocatoria.api.ts
 * Capa HTTP real de convocatorias.
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  ConvocatoriaCreatePayload,
  ConvocatoriaResponse,
  JugadorEquipoApi,
} from '../types/convocatoria.types';

export async function getConvocatoriaByPartidoEquipo(
  partidoId: number,
  equipoId: number,
): Promise<ConvocatoriaResponse | null> {
  try {
    const response = await apiClient.get<ConvocatoriaResponse>(
      `/convocatorias/partido/${partidoId}/equipo/${equipoId}`,
    );
    return response.data;
  } catch (error: any) {
    if (error?.status === 404 || error?.response?.status === 404) return null;
    throw error;
  }
}

export async function getJugadoresByEquipo(equipoId: number): Promise<JugadorEquipoApi[]> {
  const response = await apiClient.get<JugadorEquipoApi[]>(`/jugadores/?equipo_id=${equipoId}`);
  return Array.isArray(response.data) ? response.data : [];
}

export async function saveConvocatoria(
  payload: ConvocatoriaCreatePayload,
): Promise<ConvocatoriaResponse | null> {
  const response = await apiClient.post<ConvocatoriaResponse | null>('/convocatorias/', payload);
  return response.data ?? null;
}

export async function deleteConvocatoriaByPartido(partidoId: number): Promise<void> {
  await apiClient.delete(`/convocatorias/partido/${partidoId}`);
}
