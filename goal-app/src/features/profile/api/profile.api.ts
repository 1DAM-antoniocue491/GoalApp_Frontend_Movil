/**
 * API de perfil — usa apiClient, no fetch directo
 *
 * GET  /auth/me       → leer perfil del usuario autenticado
 * PATCH /usuarios/me  → actualizar datos del perfil
 */

import { apiClient } from '@/src/shared/api/client';
import type { UserProfileResponse, UpdateUserProfileRequest } from '../types/profile.types';

/** Obtener perfil del usuario autenticado */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const { data } = await apiClient.get<UserProfileResponse>('/auth/me');
  return data;
}

/** Actualizar datos editables del perfil */
export async function updateMyProfile(
  payload: UpdateUserProfileRequest,
): Promise<UserProfileResponse> {
  const { data } = await apiClient.patch<UserProfileResponse>('/usuarios/me', payload);
  return data;
}
