/**
 * teamsService.ts
 *
 * Orquesta el acceso a datos del módulo de equipos.
 * Los hooks consumen este servicio; no llaman a teams.api.ts directamente.
 *
 * Responsabilidades:
 * - Centralizar lógica de acceso (qué endpoint usar según contexto)
 * - Absorber errores esperados (404 → array vacío / null)
 * - Punto de extensión para caché o transformaciones futuras
 */

import { logger } from '@/src/shared/utils/logger';
import {
  getTeamsByLeague,
  getTeamsPerformanceByLeague,
  getTeamDetail,
  createTeam,
  getClassification,
} from '../api/teams.api';
import type {
  EquipoResponse,
  EquipoRendimientoItem,
  EquipoDetalleResponse,
  ClasificacionItem,
  CreateTeamRequest,
} from '../types/teams.types';

export const teamsService = {
  /**
   * Lista básica de equipos de una liga.
   * Devuelve [] si la liga no tiene equipos o el endpoint falla.
   */
  async getTeamsByLeague(ligaId: number): Promise<EquipoResponse[]> {
    try {
      return await getTeamsByLeague(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamsByLeague falló', {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },

  /**
   * Equipos con estadísticas de rendimiento (para tabla/clasificación visual).
   * Devuelve [] si falla.
   */
  async getTeamsPerformance(ligaId: number): Promise<EquipoRendimientoItem[]> {
    try {
      return await getTeamsPerformanceByLeague(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getTeamsPerformance falló', {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },

  /**
   * Detalle completo de un equipo.
   * Lanza el error — el hook decide cómo mostrarlo al usuario.
   */
  async getTeamDetail(teamId: number): Promise<EquipoDetalleResponse> {
    return getTeamDetail(teamId);
  },

  /**
   * Crea un equipo en la liga.
   * Lanza el error — el formulario lo captura para mostrar feedback.
   */
  async createTeam(data: CreateTeamRequest): Promise<EquipoResponse> {
    return createTeam(data);
  },

  /**
   * Tabla de clasificación de la liga.
   * Devuelve [] si falla (dato secundario).
   */
  async getClassification(ligaId: number): Promise<ClasificacionItem[]> {
    try {
      return await getClassification(ligaId);
    } catch (err) {
      logger.warn('teamsService', 'getClassification falló', {
        ligaId,
        error: err instanceof Error ? err.message : String(err),
      });
      return [];
    }
  },
};
