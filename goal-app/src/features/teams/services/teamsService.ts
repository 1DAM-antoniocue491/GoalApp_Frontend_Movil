/**
 * teamsService.ts
 *
 * Orquesta el acceso a datos del módulo de equipos.
 * Mutaciones devuelven { success, data?, error? } en lugar de lanzar.
 */

import { logger } from '@/src/shared/utils/logger';
import {
  getTeamsByLeague,
  getTeamsPerformanceByLeague,
  getTeamDetail,
  getTeamSquad,
  getTeamUpcomingMatches,
  getTeamLastMatches,
  getTeamTopScorers,
  updateTeam,
  deleteTeam,
  createTeam,
  getClassification,
} from '../api/teams.api';
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

export const teamsService = {
  async getTeamsByLeague(ligaId: number): Promise<EquipoResponse[]> {
    try {
      return await getTeamsByLeague(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamsByLeague falló', { ligaId, error: String(err) });
      return [];
    }
  },

  async getTeamsPerformance(ligaId: number): Promise<EquipoRendimientoItem[]> {
    try {
      return await getTeamsPerformanceByLeague(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamsPerformance falló', { ligaId, error: String(err) });
      return [];
    }
  },

  /** Crítico — lanza para que el hook lo maneje */
  async getTeamDetail(teamId: number): Promise<EquipoDetalleResponse> {
    return getTeamDetail(teamId);
  },

  async getTeamSquad(teamId: number): Promise<JugadorResumen[]> {
    try {
      return await getTeamSquad(teamId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamSquad falló', { teamId, error: String(err) });
      return [];
    }
  },

  async getTeamUpcomingMatches(teamId: number): Promise<MatchSummary[]> {
    try {
      return await getTeamUpcomingMatches(teamId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamUpcomingMatches falló', { teamId, error: String(err) });
      return [];
    }
  },

  async getTeamLastMatches(teamId: number): Promise<MatchSummary[]> {
    try {
      return await getTeamLastMatches(teamId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamLastMatches falló', { teamId, error: String(err) });
      return [];
    }
  },

  async getTeamTopScorers(teamId: number): Promise<TeamTopScorer[]> {
    try {
      return await getTeamTopScorers(teamId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamTopScorers falló', { teamId, error: String(err) });
      return [];
    }
  },

  /** PUT /equipos/{id} — devuelve resultado tipado */
  async updateTeam(
    teamId: number,
    data: EquipoUpdate,
  ): Promise<{ success: boolean; data?: EquipoResponse; error?: string }> {
    try {
      const result = await updateTeam(teamId, data);
      return { success: true, data: result };
    } catch (err) {
      logger.warn('teamsService', 'updateTeam falló', { teamId, error: String(err) });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al actualizar el equipo',
      };
    }
  },

  /** DELETE /equipos/{id} — devuelve resultado tipado */
  async deleteTeam(teamId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await deleteTeam(teamId);
      return { success: true };
    } catch (err) {
      logger.warn('teamsService', 'deleteTeam falló', { teamId, error: String(err) });
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Error al eliminar el equipo',
      };
    }
  },

  async createTeam(data: CreateTeamRequest): Promise<EquipoResponse> {
    return createTeam(data);
  },

  async getClassification(ligaId: number): Promise<ClasificacionItem[]> {
    try {
      return await getClassification(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getClassification falló', { ligaId, error: String(err) });
      return [];
    }
  },
};
