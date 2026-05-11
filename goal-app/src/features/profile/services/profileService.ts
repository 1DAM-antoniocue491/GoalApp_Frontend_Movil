/**
 * Servicio de perfil — orquesta API y mapeo.
 *
 * La actualización necesita el id real del usuario, por eso primero se lee
 * /usuarios/me y después se actualiza con PUT /usuarios/{id_usuario}.
 */

import { logger } from '@/src/shared/utils/logger';
import { getMyProfile, updateMyProfile } from '../api/profile.api';
import { mapUserProfile, type UserProfile, type UpdateUserProfileRequest } from '../types/profile.types';

/** Leer perfil del usuario autenticado. */
export async function fetchMyProfileService(): Promise<UserProfile> {
  const response = await getMyProfile();
  return mapUserProfile(response);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  try {
    const parsed = JSON.stringify(error);
    return parsed || 'Error al guardar perfil';
  } catch {
    return 'Error al guardar perfil';
  }
}

/**
 * Actualizar perfil — devuelve result tipado, nunca lanza.
 * Después de guardar, vuelve a leer el perfil para que la fuente de verdad sea la API.
 */
export async function updateMyProfileService(data: UpdateUserProfileRequest): Promise<{
  success: boolean;
  data?: UserProfile;
  error?: string;
}> {
  try {
    const currentProfile = await getMyProfile();
    const userId = currentProfile.id_usuario ?? currentProfile.id;

    if (!userId) {
      return {
        success: false,
        error: 'No se pudo identificar el usuario para actualizar el perfil.',
      };
    }

    const updateResponse = await updateMyProfile(Number(userId), data);

    try {
      const freshProfile = await getMyProfile();
      return { success: true, data: mapUserProfile(freshProfile) };
    } catch {
      // Si el refresh falla, usamos la respuesta del PUT como fallback.
      return { success: true, data: mapUserProfile(updateResponse) };
    }
  } catch (err) {
    const message = getErrorMessage(err);

    logger.warn('profile/service', 'Error actualizando perfil', {
      error: message,
    });

    return {
      success: false,
      error: message.includes('Method Not Allowed')
        ? 'El endpoint de actualización no permite ese método. Se debe usar PUT /usuarios/{id_usuario}.'
        : message,
    };
  }
}
