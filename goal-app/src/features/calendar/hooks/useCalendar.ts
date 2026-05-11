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
import { useFocusEffect } from '@react-navigation/native';
import { calendarService } from '../services/calendarService';
import type { CalendarJourney, CalendarViewState } from '../types/calendar.types';
import { subscribeMatchDataChanged } from '@/src/features/matches/services/matchSync';

export interface CalendarDataState {
  journeys: CalendarJourney[];
  viewState: CalendarViewState;
  /** true solo en la carga inicial (pantalla vacía → skeleton/spinner) */
  isLoading: boolean;
  /** true durante un refetch cuando ya hay datos visibles (pull-to-refresh) */
  isRefetching: boolean;
  isError: boolean;
  refetch: () => void;
}

/**
 * @param ligaId     ID numérico de la liga activa (0 = sin liga, no carga)
 * @param leagueName Nombre de la liga para inyectar en cada CalendarMatch
 */
export function useCalendarData(ligaId: number, leagueName: string): CalendarDataState {
  const [journeys, setJourneys] = useState<CalendarJourney[]>([]);
  const [viewState, setViewState] = useState<CalendarViewState>('no_calendar');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [isError, setIsError] = useState(false);

  // true cuando ya se recibió al menos una respuesta; determina si es carga inicial o refetch
  const hasLoadedOnce = useRef(false);

  const load = useCallback(async () => {
    if (ligaId <= 0) {
      setIsLoading(false);
      return;
    }
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
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [ligaId, leagueName]);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
      const unsubscribe = subscribeMatchDataChanged(load);
      return unsubscribe;
    }, [load]),
  );

  useEffect(() => {
    const intervalId = setInterval(load, 30000);
    return () => clearInterval(intervalId);
  }, [load]);

  return { journeys, viewState, isLoading, isRefetching, isError, refetch: load };
}
