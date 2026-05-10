/**
 * useCalendarData
 *
 * Hook de datos para la tab Jornada del calendario.
 * Carga partidos y equipos de la liga activa, los agrupa por jornada
 * y determina el viewState (no_teams / no_calendar / has_calendar).
 *
 * Patrón: hooks/ → consume calendarService, no llama a la API directamente.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { calendarService } from '../services/calendarService';
import type { CalendarJourney, CalendarViewState } from '../types/calendar.types';

export interface CalendarDataState {
  journeys: CalendarJourney[];
  viewState: CalendarViewState;
  /** true solo en la carga inicial (pantalla vacía → skeleton/spinner) */
  isLoading: boolean;
  /** true durante un refetch cuando ya hay datos visibles (pull-to-refresh o autoRefresh) */
  isRefetching: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
}

export interface CalendarDataOptions {
  /** Refresco automático para partidos en vivo/minuto. 0 o undefined lo desactiva. */
  autoRefreshMs?: number;
}

/**
 * @param ligaId     ID numérico de la liga activa (0 = sin liga, no carga)
 * @param leagueName Nombre de la liga para inyectar en cada CalendarMatch
 * @param options    autoRefreshMs permite mantener vivo el contador y cambios de estado
 */
export function useCalendarData(
  ligaId: number,
  leagueName: string,
  options: CalendarDataOptions = {},
): CalendarDataState {
  const [journeys, setJourneys] = useState<CalendarJourney[]>([]);
  const [viewState, setViewState] = useState<CalendarViewState>('no_calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isError, setIsError] = useState(false);

  // true cuando ya se recibió al menos una respuesta; determina si es carga inicial o refetch
  const hasLoadedOnce = useRef(false);
  // evita llamadas solapadas cuando coinciden pull-to-refresh, autoRefresh y acciones de partido
  const isRequestInFlight = useRef(false);

  const load = useCallback(async () => {
    if (ligaId <= 0 || isRequestInFlight.current) {
      setIsLoading(false);
      return;
    }

    isRequestInFlight.current = true;

    if (hasLoadedOnce.current) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }

    setIsError(false);
    try {
      // El hook recibe datos ya normalizados; no debe conocer detalles de endpoints.
      const data = await calendarService.getCalendarData(ligaId, leagueName);
      hasLoadedOnce.current = true;
      setJourneys(data.journeys);
      setViewState(data.viewState);
    } catch {
      // El service intenta devolver fallbacks seguros, pero si algo escapa
      // dejamos marcado el error para que la pantalla pueda mostrar estado visual.
      setIsError(true);
    } finally {
      isRequestInFlight.current = false;
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [ligaId, leagueName]);

  useEffect(() => {
    hasLoadedOnce.current = false;
    void load();
  }, [load]);

  useEffect(() => {
    const ms = options.autoRefreshMs ?? 0;
    if (ms <= 0 || ligaId <= 0) return undefined;

    const id = setInterval(() => {
      void load();
    }, ms);

    return () => clearInterval(id);
  }, [ligaId, load, options.autoRefreshMs]);

  return { journeys, viewState, isLoading, isRefetching, isError, refetch: load };
}
