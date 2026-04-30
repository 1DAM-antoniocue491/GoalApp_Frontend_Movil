/**
 * useLeagues - Hook para cargar y gestionar las ligas del usuario autenticado
 *
 * Expone:
 * - leagues, loading, error, refresh  → lectura de ligas
 * - createNewLeague, submitting, createError → creación de liga
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMyLeagues, createLeagueWithConfig } from '../services/leagueService';
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
}

export function useLeagues(): UseLeaguesResult {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMyLeagues();
      setLeagues(data);
    } catch (err) {
      // Mensaje fijo para la UI — el detalle técnico solo va al logger
      setError('No se pudieron cargar las ligas');
      logger.warn('useLeagues', 'Error cargando ligas', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const createNewLeague = useCallback(async (input: { league: LigaCreateRequest; config?: LigaConfiguracionRequest }): Promise<LeagueItem | null> => {
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
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { leagues, loading, error, refresh: load, submitting, createError, createNewLeague };
}
