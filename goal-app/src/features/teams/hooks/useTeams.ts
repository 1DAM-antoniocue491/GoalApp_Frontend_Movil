/**
 * useTeams.ts
 *
 * Hooks de datos para el módulo de equipos.
 * Los componentes NO acceden a teamsService directamente; usan estos hooks.
 *
 * Hooks disponibles:
 * - useTeamsByLeague      → lista básica (cards)
 * - useTeamsPerformance   → rendimiento para tabla/clasificación visual
 * - useTeamDetail         → detalle de un equipo
 * - useClassification     → tabla de clasificación de la liga
 * - useCreateTeam         → mutación para crear equipo
 */

import { useState, useEffect, useCallback } from 'react';
import { teamsService } from '../services/teamsService';
import type {
  EquipoResponse,
  EquipoRendimientoItem,
  EquipoDetalleResponse,
  ClasificacionItem,
  CreateTeamRequest,
} from '../types/teams.types';

// ---------------------------------------------------------------------------
// Tipos base reutilizables
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
// Hooks públicos
// ---------------------------------------------------------------------------

/**
 * Lista básica de equipos de la liga.
 * Usado por la vista de cards de TeamsTabs.
 */
export function useTeamsByLeague(ligaId: number): AsyncState<EquipoResponse[]> {
  return useAsyncData(
    () => teamsService.getTeamsByLeague(ligaId),
    [],
    [ligaId],
  );
}

/**
 * Equipos con estadísticas de rendimiento.
 * Usado por la vista de tabla en TeamsTabs.
 */
export function useTeamsPerformance(ligaId: number): AsyncState<EquipoRendimientoItem[]> {
  return useAsyncData(
    () => teamsService.getTeamsPerformance(ligaId),
    [],
    [ligaId],
  );
}

/**
 * Detalle completo de un equipo.
 * Usado por TeamDetailScreen.
 */
export function useTeamDetail(teamId: number): AsyncState<EquipoDetalleResponse | null> {
  return useAsyncData(
    () => teamsService.getTeamDetail(teamId),
    null,
    [teamId],
  );
}

/**
 * Tabla de clasificación de la liga.
 * Usado por ClassificationScreen.
 */
export function useClassification(ligaId: number): AsyncState<ClasificacionItem[]> {
  return useAsyncData(
    () => teamsService.getClassification(ligaId),
    [],
    [ligaId],
  );
}

/**
 * Mutación para crear un equipo.
 * Devuelve `null` si falla; el componente decide el feedback.
 */
export function useCreateTeam(): MutationState<CreateTeamRequest, EquipoResponse> {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsError(false);
    setError(null);
  }, []);

  const mutate = useCallback(async (input: CreateTeamRequest): Promise<EquipoResponse | null> => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
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
