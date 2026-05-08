/**
 * useLeagues
 *
 * Hook centralizado para el onboarding de ligas.
 *
 * Responsabilidades:
 * - Cargar las ligas reales del usuario autenticado.
 * - Crear nuevas ligas.
 * - Unirse a una liga mediante código de invitación.
 * - Mantener el estado local sincronizado con la API después de cada mutación.
 *
 * Nota importante:
 * La carga de ligas se hace en dos fases para mejorar la velocidad percibida:
 * 1. Se pintan rápido las ligas base.
 * 2. Se enriquecen en segundo plano con equipo asignado cuando aplica.
 */

import { useState, useEffect, useCallback } from 'react';

import {
  createLeagueWithConfig,
  enrichLeagueTeamAssignments,
  fetchMyLeagues,
  joinLeagueByCodeService,
} from '../services/leagueService';
import type { LeagueItem } from '@/src/shared/types/league';
import type { LigaConfiguracionRequest, LigaCreateRequest } from '../types/league.api.types';
import { logger } from '@/src/shared/utils/logger';

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

  /** Estado específico del flujo “Unirme a una liga”. */
  joiningByCode: boolean;
  joinError: string | null;
  joinLeagueByCode: (code: string) => Promise<boolean>;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
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

      /**
       * Primera fase: cargar ligas sin bloquear por equipo asignado.
       * Esto evita que el onboarding parezca congelado si el endpoint de equipo tarda.
       */
      const baseLeagues = await fetchMyLeagues({ enrichTeams: false });
      setLeagues(baseLeagues);

      /**
       * Segunda fase: completar equipos asociados sin tumbar el flujo principal.
       * Si esta parte falla, se mantiene la lista base visible.
       */
      enrichLeagueTeamAssignments(baseLeagues)
        .then(setLeagues)
        .catch((err) => {
          logger.warn('useLeagues/enrichTeams', 'No se pudieron enriquecer las ligas con equipo asignado', {
            error: getErrorMessage(err, 'Error desconocido'),
          });
        });
    } catch (err) {
      setError('No se pudieron cargar las ligas');
      logger.warn('useLeagues/load', 'Error cargando ligas', {
        error: getErrorMessage(err, 'Error desconocido'),
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

        /**
         * Tras crear, la fuente de verdad vuelve a ser la API.
         * No hacemos una actualización optimista para evitar estados desalineados.
         */
        await load();
        return league;
      } catch (err) {
        const message = getErrorMessage(err, 'Error al crear la liga');
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

        if (!result.success) {
          setJoinError(result.error ?? 'No se pudo unir a la liga con ese código.');
          return false;
        }

        /**
         * El service devuelve las ligas ya recargadas tras aceptar el código.
         * Aun así, usamos el resultado de API como fuente de verdad inmediata.
         */
        if (result.data?.leagues) {
          setLeagues(result.data.leagues);
        } else {
          await load();
        }

        return true;
      } catch (err) {
        const message = getErrorMessage(err, 'No se pudo unir a la liga con ese código.');
        setJoinError(message);
        logger.warn('useLeagues/joinLeagueByCode', 'Error al unirse por código', { error: message });
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
