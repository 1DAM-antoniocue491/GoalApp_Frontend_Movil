/**
 * useTeams.ts
 *
 * Hooks de datos para el módulo de equipos.
 */

import { useState, useEffect, useCallback } from 'react';
import { teamsService } from '../services/teamsService';
import type {
  EquipoResponse,
  EquipoRendimientoItem,
  EquipoDetalleResponse,
  ClasificacionItem,
  CreateTeamRequest,
  EquipoUpdate,
  JugadorResumen,
  MatchSummary,
  TeamTopScorer,
} from '../types/teams.types';

// ---------------------------------------------------------------------------
// Tipos base
// ---------------------------------------------------------------------------

interface AsyncState<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

interface MutationState<TInput, TResult> {
  mutate: (input: TInput) => Promise<TResult | null>;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Helper interno
// ---------------------------------------------------------------------------

function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialValue: T,
  deps: unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const result = await fetcher();
      setData(result);
    } catch {
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, isLoading, isError, refetch: load };
}

// ---------------------------------------------------------------------------
// Hooks de lectura
// ---------------------------------------------------------------------------

export function useTeamsByLeague(ligaId: number): AsyncState<EquipoResponse[]> {
  return useAsyncData(
    () => teamsService.getTeamsByLeague(ligaId),
    [],
    [ligaId],
  );
}

export function useTeamsPerformance(ligaId: number): AsyncState<EquipoRendimientoItem[]> {
  return useAsyncData(
    () => teamsService.getTeamsPerformance(ligaId),
    [],
    [ligaId],
  );
}

/** Detalle básico — para compatibilidad con código existente */
export function useTeamDetail(teamId: number): AsyncState<EquipoDetalleResponse | null> {
  return useAsyncData(
    () => teamsService.getTeamDetail(teamId),
    null,
    [teamId],
  );
}

/**
 * Detalle completo del equipo — carga en paralelo con Promise.allSettled.
 * Solo el detalle base es crítico. Squad, partidos y goleadores son secundarios.
 */
export function useTeamDetailFull(teamId: number) {
  const [detail, setDetail] = useState<EquipoDetalleResponse | null>(null);
  const [squad, setSquad] = useState<JugadorResumen[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<MatchSummary[]>([]);
  const [lastMatches, setLastMatches] = useState<MatchSummary[]>([]);
  const [topScorers, setTopScorers] = useState<TeamTopScorer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (refreshing = false) => {
      if (teamId <= 0) return;

      if (refreshing) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      setError(null);

      const [detailResult, squadResult, upcomingResult, lastResult, scorersResult] =
        await Promise.allSettled([
          teamsService.getTeamDetail(teamId),
          teamsService.getTeamSquad(teamId),
          teamsService.getTeamUpcomingMatches(teamId),
          teamsService.getTeamLastMatches(teamId),
          teamsService.getTeamTopScorers(teamId),
        ]);

      // Detalle — crítico
      if (detailResult.status === 'fulfilled') {
        setDetail(detailResult.value);
      } else {
        setIsError(true);
        setError('No se pudo cargar el equipo');
      }

      // Secundarios — tolerados
      setSquad(squadResult.status === 'fulfilled' ? squadResult.value : []);
      setUpcomingMatches(upcomingResult.status === 'fulfilled' ? upcomingResult.value : []);
      setLastMatches(lastResult.status === 'fulfilled' ? lastResult.value : []);
      setTopScorers(scorersResult.status === 'fulfilled' ? scorersResult.value : []);

      setIsLoading(false);
      setIsRefreshing(false);
    },
    [teamId],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    detail,
    squad,
    upcomingMatches,
    lastMatches,
    topScorers,
    isLoading,
    isRefreshing,
    isError,
    error,
    refetch: () => load(false),
    refresh: () => load(true),
  };
}

export function useClassification(ligaId: number): AsyncState<ClasificacionItem[]> {
  return useAsyncData(
    () => teamsService.getClassification(ligaId),
    [],
    [ligaId],
  );
}

// ---------------------------------------------------------------------------
// Hooks de mutación
// ---------------------------------------------------------------------------

export function useCreateTeam(): MutationState<CreateTeamRequest, EquipoResponse> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => { setIsError(false); setError(null); }, []);

  const mutate = useCallback(async (input: CreateTeamRequest): Promise<EquipoResponse | null> => {
    setIsLoading(true); setIsError(false); setError(null);
    try {
      const result = await teamsService.createTeam(input);
      return result;
    } catch (err) {
      setIsError(true);
      setError(err instanceof Error ? err.message : 'Error al crear el equipo');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, isError, error, reset };
}

/** Mutación PUT /equipos/{id} */
export function useUpdateTeam() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const mutate = useCallback(
    async (
      teamId: number,
      data: EquipoUpdate,
    ): Promise<{ success: boolean; data?: EquipoResponse }> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await teamsService.updateTeam(teamId, data);
        if (!result.success) setError(result.error ?? 'Error al actualizar');
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { mutate, isLoading, error, reset };
}

/** Mutación DELETE /equipos/{id} */
export function useDeleteTeam() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (teamId: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await teamsService.deleteTeam(teamId);
      if (!result.success) setError(result.error ?? 'Error al eliminar');
      return result.success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error };
}
