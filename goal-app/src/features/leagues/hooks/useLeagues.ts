/**
 * useLeagues - Hook para cargar y gestionar las ligas del usuario autenticado
 *
 * Expone:
 * - leagues, loading, error, refresh  → lectura de ligas
 * - createNewLeague, submitting, createError → creación de liga
 */

import { useState, useEffect, useCallback } from "react";
import {
  fetchMyLeagues,
  createLeagueWithConfig,
  joinLeagueByCodeService,
} from "../services/leagueService";
import { logger } from "@/src/shared/utils/logger";
import type { LeagueItem } from "@/src/shared/types/league";
import type {
  LigaConfiguracionRequest,
  LigaCreateRequest,
} from "../types/league.api.types";

interface UseLeaguesResult {
  leagues: LeagueItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitting: boolean;
  createError: string | null;
  createNewLeague: (input: {
    league: LigaCreateRequest;
    config?: LigaConfiguracionRequest;
  }) => Promise<LeagueItem | null>;
  joiningByCode: boolean;
  joinError: string | null;
  joinLeagueByCode: (code: string) => Promise<boolean>;
}

export function useLeagues(): UseLeaguesResult {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyLeagues();
      setLeagues(data);
    } catch (err) {
      // Mensaje fijo para la UI — el detalle técnico solo va al logger
      setError("No se pudieron cargar las ligas");
      logger.warn("useLeagues", "Error cargando ligas", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewLeague = useCallback(
    async (input: {
      league: LigaCreateRequest;
      config?: LigaConfiguracionRequest;
    }): Promise<LeagueItem | null> => {
      try {
        setSubmitting(true);
        setCreateError(null);
        const league = await createLeagueWithConfig(input);
        await load();
        return league;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error al crear la liga";
        setCreateError(message);
        logger.error("useLeagues/createNewLeague", "Error creando liga", {
          error: message,
        });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const joinLeagueByCode = useCallback(
    async (code: string): Promise<boolean> => {
      try {
        setJoiningByCode(true);
        setJoinError(null);

        const result = await joinLeagueByCodeService(code);

        if (!result.success) {
          setJoinError(
            result.error ?? "No se pudo unir a la liga con ese código.",
          );
          return false;
        }

        if (result.data?.leagues) {
          setLeagues(result.data.leagues);
        } else {
          await load();
        }

        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "No se pudo unir a la liga con ese código.";
        setJoinError(message);
        logger.warn(
          "useLeagues/joinLeagueByCode",
          "Error uniéndose a liga por código",
          { error: message },
        );
        return false;
      } finally {
        setJoiningByCode(false);
      }
    },
    [load],
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    leagues,
    loading,
    error,
    refresh: load,
    submitting,
    createError,
    createNewLeague,
    joiningByCode,
    joinError,
    joinLeagueByCode,
  };
}
