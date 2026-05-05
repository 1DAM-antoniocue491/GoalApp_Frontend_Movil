/**
 * Servicio de perfil — orquesta API y mapeo
 */

import { logger } from "@/src/shared/utils/logger";
import { getMyProfile, updateMyProfile } from "../api/profile.api";
import {
  mapUserProfile,
  type UserProfile,
  type UpdateUserProfileRequest,
} from "../types/profile.types";

/** Leer perfil del usuario autenticado */
export async function fetchMyProfileService(): Promise<UserProfile> {
  const response = await getMyProfile();
  return mapUserProfile(response);
}

/** Actualizar perfil — devuelve result tipado, nunca lanza */
export async function updateMyProfileService(
  data: UpdateUserProfileRequest,
): Promise<{
  success: boolean;
  data?: UserProfile;
  error?: string;
}> {
  try {
    const response = await updateMyProfile(data);
    return { success: true, data: mapUserProfile(response) };
  } catch (err) {
    logger.warn("profile/service", "Error actualizando perfil", {
      error: err instanceof Error ? err.message : String(err),
    });
    return {
      success: false,
      error: err instanceof Error ? err.message : "Error al guardar perfil",
    };
  }
}
