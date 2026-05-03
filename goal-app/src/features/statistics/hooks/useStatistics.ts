/**
 * Hook de estadísticas
 *
 * Obtiene ligaId y role desde useActiveLeague,
 * y usuarioId desde useSession.
 * Si no hay liga activa, no dispara ninguna carga.
 */

import { useState, useEffect, useCallback } from 'react';
import { useActiveLeague } from '@/src/state/activeLeague/activeLeagueStore';
import { useSession } from '@/src/state/session/sessionStore';
import { fetchStatisticsDataService, type StatisticsData } from '../services/statisticsService';
import type {
  SeasonStatsResponse,
  TopScorerResponse,
  MatchdayMVP,
  TeamGoalsStats,
  PlayerPersonalStats,
} from '../types/statistics.types';

export interface UseStatisticsReturn {
  seasonStats: SeasonStatsResponse | null;
  topScorers: TopScorerResponse[];
  matchdayMVP: MatchdayMVP | null;
  teamGoalsStats: TeamGoalsStats[];
  myStats: PlayerPersonalStats | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refresh: () => void;
}

const EMPTY_DATA: StatisticsData = {
  seasonStats: null,
  topScorers: [],
  matchdayMVP: null,
  teamGoalsStats: [],
  myStats: null,
};

export function useStatistics(): UseStatisticsReturn {
  const { session: leagueSession } = useActiveLeague();
  const { session: userSession } = useSession();

  const [data, setData] = useState<StatisticsData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derivar parámetros necesarios
  const ligaId = leagueSession?.leagueId ? Number(leagueSession.leagueId) : null;
  const usuarioId = userSession?.user?.id_usuario ?? null;
  const role = leagueSession?.role ?? null;

  const load = useCallback(
    async (refreshing = false) => {
      if (!ligaId || !usuarioId || !role) return;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
        setData(EMPTY_DATA);
      }
      setError(null);

      try {
        const result = await fetchStatisticsDataService({ ligaId, usuarioId, role });
        setData(result);
      } catch {
        setError('No se pudieron cargar las estadísticas');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [ligaId, usuarioId, role],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  return {
    ...data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
