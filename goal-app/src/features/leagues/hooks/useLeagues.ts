/**
 * useLeagues - Hook para cargar y gestionar las ligas del usuario autenticado.
 *
 * Optimización:
 * - Primero pinta las ligas base de /usuarios/me/ligas.
 * - Después enriquece en segundo plano con /equipos/usuario/mi-equipo.
 * Así la pantalla no se queda bloqueada por consultas secundarias lentas.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  createLeagueWithConfig,
  enrichLeagueTeamAssignments,
  fetchMyLeagues,
  joinLeagueByCodeService,
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

      // 1) Carga rápida: solo ligas.
      const baseLeagues = await fetchMyLeagues({ enrichTeams: false });
      setLeagues(baseLeagues);
      setLoading(false);

      // 2) Carga secundaria: equipo asignado para coach/player/delegate.
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

  const joinLeagueByCode = useCallback(
    async (code: string): Promise<boolean> => {
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
    },
    [],
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
