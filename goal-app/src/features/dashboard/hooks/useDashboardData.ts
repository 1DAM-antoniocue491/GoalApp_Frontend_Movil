/**
 * useDashboardData.ts
 *
 * Hook principal de datos del dashboard.
 *
 * RESPONSABILIDAD:
 * Centraliza todo el acceso a datos que necesita el dashboard.
 * Los componentes NO acceden a la API directamente; siempre pasan por este hook.
 * 
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

import { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import type { DashboardData } from "@/src/shared/types/dashboard.types";
import { fetchDashboardData } from "@/src/features/dashboard/api/dashboard.api";
import { logger } from "@/src/shared/utils/logger";
import { subscribeMatchDataChanged } from '@/src/features/matches/services/matchSync';

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
  /**
   * Mensaje controlado para mostrar/debuggear el error sin depender del LogBox.
   * Es opcional para no romper los componentes que ya consumen el hook.
   */
  errorMessage: string | null;
  /** Permite refrescar los datos manualmente (pull-to-refresh, etc.) */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Helpers internos
// ---------------------------------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido cargando dashboard";
  }
}

function isUnsafeNombreMapperError(message: string): boolean {
  return (
    message.includes("Cannot read property 'nombre' of undefined") ||
    message.includes(
      "Cannot read properties of undefined (reading 'nombre')",
    ) ||
    message.includes('Cannot read property "nombre" of undefined')
  );
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Rastrea si ya se han recibido datos al menos una vez para la liga actual.
  // Si es true, el siguiente fetch es un refetch y no debe borrar la pantalla.
  const hasLoadedOnce = useRef(false);

  // Evita que una respuesta antigua sobrescriba el estado si cambia la liga rápido.
  const requestIdRef = useRef(0);

  // Permite detectar cambio de liga y limpiar datos anteriores.
  const previousLeagueIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (previousLeagueIdRef.current === leagueId) return;

    previousLeagueIdRef.current = leagueId;
    hasLoadedOnce.current = false;

    setData(null);
    setIsError(false);
    setErrorMessage(null);
    setIsLoading(true);
    setIsRefetching(false);
  }, [leagueId]);

  const loadData = useCallback(async () => {
    const currentRequestId = requestIdRef.current + 1;
    requestIdRef.current = currentRequestId;

    const ligaId = Number(leagueId);

    if (!Number.isFinite(ligaId) || ligaId <= 0) {
      logger.warn("useDashboardData", "leagueId inválido", { leagueId });

      if (requestIdRef.current !== currentRequestId) return;

      setData(null);
      setIsError(true);
      setErrorMessage("Liga no válida");
      setIsLoading(false);
      setIsRefetching(false);
      return;
    }

    if (hasLoadedOnce.current) {
      // Ya hay datos: mostrar indicador discreto sin reemplazar la UI.
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }

    setIsError(false);
    setErrorMessage(null);

    try {
      const result = await fetchDashboardData(ligaId);

      if (requestIdRef.current !== currentRequestId) return;

      if (!result) {
        throw new Error("La API no devolvió datos de dashboard");
      }

      hasLoadedOnce.current = true;
      setData(result);
      setIsError(false);
      setErrorMessage(null);
    } catch (err) {
      if (requestIdRef.current !== currentRequestId) return;

      const message = getErrorMessage(err);

      /**
       * Este error no se origina en este hook.
       * Suele venir del mapper de fetchDashboardData cuando intenta leer:
       *
       *   algo.nombre
       *
       * pero `algo` viene undefined desde la API o desde una relación incompleta.
       *
       * Se registra como warning para evitar LogBox rojo innecesario, pero el hook
       * sigue marcando error porque no hay DashboardData fiable que renderizar.
       */
      if (isUnsafeNombreMapperError(message)) {
        logger.warn(
          "useDashboardData",
          "Mapper del dashboard recibió un objeto sin nombre",
          {
            ligaId,
            error: message,
          },
        );
      } else {
        logger.error("useDashboardData", "Error cargando dashboard", {
          ligaId,
          error: message,
        });
      }

      setIsError(true);
      setErrorMessage(message);

      // Si es la primera carga de esta liga, no dejamos datos antiguos.
      if (!hasLoadedOnce.current) {
        setData(null);
      }
    } finally {
      if (requestIdRef.current !== currentRequestId) return;

      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [leagueId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
      const unsubscribe = subscribeMatchDataChanged(loadData);
      return unsubscribe;
    }, [loadData]),
  );

  useEffect(() => {
    const intervalId = setInterval(loadData, 30000);
    return () => clearInterval(intervalId);
  }, [loadData]);

  return {
    data,
    isLoading,
    isRefetching,
    isError,
    errorMessage,
    refetch: loadData,
  };
}
