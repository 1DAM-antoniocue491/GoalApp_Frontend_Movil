/**
 * useLeagues - Hook para cargar y gestionar las ligas del usuario autenticado
 *
 * Expone:
 * - leagues, loading, error, refresh  → lectura de ligas
 * - createNewLeague, submitting, createError → creación de liga
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchMyLeagues, createLeagueWithConfig, updateLeagueWithConfigService } from '../services/leagueService';
import { logger } from '@/src/shared/utils/logger';
import type { LeagueItem } from '@/src/shared/types/league';
import type {
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaUpdateRequest,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';

interface UseLeaguesResult {
  leagues: LeagueItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitting: boolean;
  createError: string | null;
  createNewLeague: (input: { league: LigaCreateRequest; config?: LigaConfiguracionRequest }) => Promise<LeagueItem | null>;
  editSubmitting: boolean;
  editError: string | null;
  editLeague: (input: {
    ligaId: string;
    league: LigaUpdateRequest;
    config?: UpdateLeagueConfigRequest;
    configExists?: boolean;
  }) => Promise<boolean>;
}

export function useLeagues(): UseLeaguesResult {
  const [leagues, setLeagues] = useState<LeagueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

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

  const editLeague = useCallback(async (input: {
    ligaId: string;
    league: LigaUpdateRequest;
    config?: UpdateLeagueConfigRequest;
    configExists?: boolean;
  }): Promise<boolean> => {
    try {
      setEditSubmitting(true);
      setEditError(null);
      const result = await updateLeagueWithConfigService({
        ligaId: Number(input.ligaId),
        league: input.league,
        config: input.config ?? {},
        configExists: input.configExists,
      });
      if (result.success) {
        await load();
        return true;
      }
      setEditError(result.error ?? 'Error al guardar los cambios');
      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar los cambios';
      setEditError(message);
      logger.error('useLeagues/editLeague', 'Error editando liga', { error: message });
      return false;
    } finally {
      setEditSubmitting(false);
    }
  }, [load]);

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
    editSubmitting,
    editError,
    editLeague,
  };
}
