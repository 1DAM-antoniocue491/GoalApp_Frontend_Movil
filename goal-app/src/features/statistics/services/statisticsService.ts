/**
 * Servicio de estadísticas — orquesta carga paralela de datos
 *
 * Regla: si fallan endpoints secundarios (mvp, goleadores, equipos, myStats),
 * devuelve null / [] en lugar de romper la pantalla completa.
 * Solo un fallo en /temporada se considera crítico.
 */

import { logger } from '@/src/shared/utils/logger';
import {
  getSeasonStats,
  getTopScorers,
  getMatchdayMvp,
  getTeamGoalsStats,
  getPlayerPersonalStats,
} from '../api/statistics.api';
import type {
  SeasonStatsResponse,
  TopScorerResponse,
  MatchdayMVP,
  TeamGoalsStats,
  PlayerPersonalStats,
} from '../types/statistics.types';

export interface StatisticsData {
  seasonStats: SeasonStatsResponse | null;
  topScorers: TopScorerResponse[];
  matchdayMVP: MatchdayMVP | null;
  teamGoalsStats: TeamGoalsStats[];
  myStats: PlayerPersonalStats | null;
}

interface FetchParams {
  ligaId: number;
  usuarioId: number;
  role: string;
}

/** Roles que corresponden a jugador */
const PLAYER_ROLES = ['player', 'jugador'];

export async function fetchStatisticsDataService({
  ligaId,
  usuarioId,
  role,
}: FetchParams): Promise<StatisticsData> {
  const isPlayer = PLAYER_ROLES.includes(role);

  const [seasonResult, scorersResult, mvpResult, teamsResult, myStatsResult] =
    await Promise.allSettled([
      getSeasonStats(ligaId),
      getTopScorers(ligaId, 5),
      getMatchdayMvp(ligaId),
      getTeamGoalsStats(ligaId),
      isPlayer ? getPlayerPersonalStats(ligaId, usuarioId) : Promise.resolve(null),
    ]);

  // Métricas de temporada — endpoint principal
  const seasonStats =
    seasonResult.status === 'fulfilled' ? seasonResult.value : null;
  if (seasonResult.status === 'rejected') {
    logger.warn('statistics/service', 'Fallo endpoint temporada', {
      error: String(seasonResult.reason),
    });
  }

  // Goleadores — fallo tolerado
  const topScorers =
    scorersResult.status === 'fulfilled' ? (scorersResult.value ?? []) : [];
  if (scorersResult.status === 'rejected') {
    logger.warn('statistics/service', 'Fallo endpoint goleadores', {
      error: String(scorersResult.reason),
    });
  }

  // MVP — fallo tolerado
  const matchdayMVP =
    mvpResult.status === 'fulfilled' ? mvpResult.value : null;
  if (mvpResult.status === 'rejected') {
    logger.warn('statistics/service', 'Fallo endpoint MVP', {
      error: String(mvpResult.reason),
    });
  }

  // Goles por equipo — fallo tolerado
  const teamGoalsStats =
    teamsResult.status === 'fulfilled' ? (teamsResult.value ?? []) : [];
  if (teamsResult.status === 'rejected') {
    logger.warn('statistics/service', 'Fallo endpoint equipos/goles', {
      error: String(teamsResult.reason),
    });
  }

  // Estadísticas personales — solo para jugadores, fallo tolerado
  const myStats =
    myStatsResult.status === 'fulfilled' ? myStatsResult.value : null;
  if (myStatsResult.status === 'rejected') {
    logger.warn('statistics/service', 'Fallo endpoint estadísticas jugador', {
      error: String(myStatsResult.reason),
    });
  }

  return { seasonStats, topScorers, matchdayMVP, teamGoalsStats, myStats };
}
