/**
 * Hook de perfil
 *
 * Carga el perfil al montar.
 * Expone updateProfile que llama a la API y, si tiene éxito,
 * sincroniza el sessionStore y actualiza el estado local.
 */

import { useState, useEffect, useCallback } from "react";
import { sessionStore } from "@/src/state/session/sessionStore";
import {
  fetchMyProfileService,
  updateMyProfileService,
} from "../services/profileService";
import type {
  UserProfile,
  UpdateUserProfileRequest,
} from "../types/profile.types";

export interface UseProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  refresh: () => void;
  updateProfile: (data: UpdateUserProfileRequest) => Promise<boolean>;
}

export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchMyProfileService();
      setProfile(data);
    } catch {
      setError("No se pudo cargar el perfil");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(() => load(), [load]);

  const updateProfile = useCallback(
    async (data: UpdateUserProfileRequest): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      try {
        const result = await updateMyProfileService(data);
        if (result.success && result.data) {
          setProfile(result.data);

          // Sincronizar sessionStore para que la próxima sesión tenga datos frescos
          const session = await sessionStore.getSession();
          if (session.user && session.accessToken && session.refreshToken) {
            await sessionStore.setSession(
              session.accessToken,
              session.refreshToken,
              {
                ...session.user,
                nombre: result.data.nombre || session.user.nombre,
                telefono: result.data.telefono || session.user.telefono,
                fecha_nacimiento:
                  result.data.fechaNacimiento || session.user.fecha_nacimiento,
              },
            );
          }
          return true;
        }
        setError(result.error ?? "Error al guardar");
        return false;
      } catch {
        setError("Error inesperado al guardar");
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [],
  );

  return { profile, isLoading, isSaving, error, refresh, updateProfile };
}
