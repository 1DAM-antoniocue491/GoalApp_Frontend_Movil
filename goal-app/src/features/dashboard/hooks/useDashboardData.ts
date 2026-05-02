/**
 * useDashboardData.ts
 *
 * Hook principal de datos del dashboard.
 *
 * RESPONSABILIDAD:
 * Centraliza todo el acceso a datos que necesita el dashboard.
 * Los componentes NO acceden a la API directamente; siempre pasan por este hook.
 *
 * PATRÓN:
 * hooks/ → gestión de estado y ciclo de vida del fetch
 * api/   → llamadas HTTP y mapeo DTO → modelo
 * components/ → solo renderizado, sin lógica de fetch
 *
 * CONVERSIÓN DE leagueId:
 * leagueId llega como string desde activeLeagueStore.
 * Se convierte a number antes de llamar a la API.
 * Si el ID no es un número válido, se establece isError = true.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { DashboardData } from '@/src/shared/types/dashboard.types';
import { fetchDashboardData } from '@/src/features/dashboard/api/dashboard.api';
import { logger } from '@/src/shared/utils/logger';

// ---------------------------------------------------------------------------
// Contrato del hook
// ---------------------------------------------------------------------------

export interface DashboardHookResult {
  data: DashboardData | null;
  isLoading: boolean;
  /**
   * true cuando se está recargando y ya existe data previa.
   * El layout muestra un banner discreto en lugar de borrar los datos visibles.
   */
  isRefetching: boolean;
  isError: boolean;
  /** Permite refrescar los datos manualmente (pull-to-refresh, etc.) */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useDashboardData
 *
 * @param leagueId - ID de la liga activa como string (viene de activeLeagueStore).
 *                   Se convierte internamente a número antes de llamar a la API.
 */
export function useDashboardData(leagueId: string): DashboardHookResult {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isError, setIsError] = useState(false);

  // Rastrea si ya se ha recibido datos al menos una vez.
  // Si es true, el siguiente fetch es un refetch (no borra la pantalla).
  const hasLoadedOnce = useRef(false);

  const loadData = useCallback(async () => {
    if (hasLoadedOnce.current) {
      // Ya hay datos: mostrar indicador discreto sin reemplazar la UI
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    setIsError(false);

    // Convertir leagueId a número antes de llamar a la API.
    // El store guarda el ID como string; la API espera un entero.
    const ligaId = Number(leagueId);

    if (!Number.isFinite(ligaId) || ligaId <= 0) {
      logger.warn('useDashboardData', 'leagueId inválido', { leagueId });
      setIsError(true);
      setIsLoading(false);
      return;
    }

    try {
      const result = await fetchDashboardData(ligaId);
      hasLoadedOnce.current = true;
      setData(result);
    } catch (err) {
      logger.error('useDashboardData', 'Error cargando dashboard', {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      setIsError(true);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    isLoading,
    isRefetching,
    isError,
    refetch: loadData,
  };
}
