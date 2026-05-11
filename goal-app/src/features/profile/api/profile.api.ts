/**
 * API de perfil — usa apiClient, no fetch directo.
 *
 * Contrato real del backend:
 * - GET /usuarios/me              → leer perfil del usuario autenticado.
 * - PUT /usuarios/{id_usuario}    → actualizar perfil.
 *
 * Importante:
 * /usuarios/me solo tiene GET. No usar PATCH /usuarios/me porque devuelve
 * "Method Not Allowed".
 */

import { apiClient } from '@/src/shared/api/client';
import type { UserProfileResponse, UpdateUserProfileRequest } from '../types/profile.types';

/** Obtener perfil del usuario autenticado. */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>('/usuarios/me');
  return data;
}

/** Actualizar únicamente los datos editables desde móvil. */
export async function updateMyProfile(
  userId: number,
  payload: UpdateUserProfileRequest,
): Promise<UserProfileResponse> {
  const { data } = await apiClient.put<UserProfileResponse>(`/usuarios/${userId}`, payload);
  return data;
}
