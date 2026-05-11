/**
 * useLeagues - Hook para cargar y gestionar las ligas del usuario autenticado.
 *
 * Reglas importantes:
 * - Favoritos se guardan en API con /seguir. No son estado local temporal.
 * - Reactivar liga se hace con PUT /ligas/{id}/reactivar. No se simula en UI.
 * - La carga de equipo asignado es secundaria para que el onboarding pinte rápido.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createLeagueWithConfig,
  enrichLeagueTeamAssignments,
  fetchMyLeagues,
  joinLeagueByCodeService,
  reactivateLeagueService,
  toggleFavoriteLeagueService,
} from '../services/leagueService';
import { logger } from '@/src/shared/utils/logger';
import type { LeagueItem } from '@/src/shared/types/league';
import type { LigaConfiguracionRequest, LigaCreateRequest } from '../types/league.api.types';

interface UseLeaguesResult {
  leagues: LeagueItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;

  submitting: boolean;
  createError: string | null;
  createNewLeague: (input: { league: LigaCreateRequest; config?: LigaConfiguracionRequest }) => Promise<LeagueItem | null>;

  favoriteUpdatingId: string | null;
  toggleFavoriteLeague: (leagueId: string) => Promise<boolean>;

  reactivatingLeagueId: string | null;
  reactivateLeagueById: (leagueId: string) => Promise<boolean>;

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
  const [favoriteUpdatingId, setFavoriteUpdatingId] = useState<string | null>(null);
  const [reactivatingLeagueId, setReactivatingLeagueId] = useState<string | null>(null);
  const [joiningByCode, setJoiningByCode] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Carga rápida: ligas + favoritos persistentes.
      const baseLeagues = await fetchMyLeagues({ enrichTeams: false });
      setLeagues(baseLeagues);
      setLoading(false);

      // 2) Enriquecimiento secundario: “Mi equipo” en tarjetas.
      const enriched = await enrichLeagueTeamAssignments(baseLeagues);
      setLeagues(enriched);
    } catch (err) {
      setError('No se pudieron cargar las ligas');
      logger.warn('useLeagues', 'Error cargando ligas', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewLeague = useCallback(
    async (input: { league: LigaCreateRequest; config?: LigaConfiguracionRequest }): Promise<LeagueItem | null> => {
      try {
        setSubmitting(true);
        setCreateError(null);
        const league = await createLeagueWithConfig(input);
        await load();
        return league;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al crear la liga';
        setCreateError(message);
        logger.error('useLeagues/createNewLeague', 'Error creando liga', { error: message });
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const toggleFavoriteLeague = useCallback(
    async (leagueId: string): Promise<boolean> => {
      const target = leagues.find((league) => league.id === leagueId);
      if (!target) return false;

      try {
        setFavoriteUpdatingId(leagueId);
        const result = await toggleFavoriteLeagueService(leagueId, target.isFavorite);

        if (!result.success || !result.data) {
          setError(result.error ?? 'No se pudo actualizar el favorito');
          return false;
        }

        setLeagues(result.data);
        return true;
      } finally {
        setFavoriteUpdatingId(null);
      }
    },
    [leagues],
  );

  const reactivateLeagueById = useCallback(async (leagueId: string): Promise<boolean> => {
    try {
      setReactivatingLeagueId(leagueId);
      const result = await reactivateLeagueService(leagueId);

      if (!result.success || !result.data) {
        setError(result.error ?? 'No se pudo reactivar la liga');
        return false;
      }

      // La lista refrescada desde API decide si el botón vuelve a ser “Entrar”.
      setLeagues(result.data);
      return true;
    } finally {
      setReactivatingLeagueId(null);
    }
  }, []);

  const joinLeagueByCode = useCallback(async (code: string): Promise<boolean> => {
    try {
      setJoiningByCode(true);
      setJoinError(null);

      const result = await joinLeagueByCodeService(code);
      if (!result.success || !result.data) {
        setJoinError(result.error ?? 'No se pudo unir a la liga.');
        return false;
      }

      setLeagues(result.data.leagues);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'No se pudo unir a la liga.';
      setJoinError(message);
      return false;
    } finally {
      setJoiningByCode(false);
    }
  }, []);

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
    favoriteUpdatingId,
    toggleFavoriteLeague,
    reactivatingLeagueId,
    reactivateLeagueById,
    joiningByCode,
    joinError,
    joinLeagueByCode,
  };
}
