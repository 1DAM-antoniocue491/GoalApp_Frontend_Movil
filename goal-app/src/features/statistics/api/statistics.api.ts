/**
 * Llamadas HTTP para el módulo de estadísticas
 * Usa apiClient — no fetch directo, no mocks, no react-icons
 */

import { apiClient } from '@/src/shared/api/client';
import type {
  SeasonStatsResponse,
  TopScorerResponse,
  MatchdayMVP,
  TeamGoalsStats,
  PlayerPersonalStats,
} from '../types/statistics.types';

/** Métricas generales de la temporada para una liga */
export async function getSeasonStats(ligaId: number): Promise<SeasonStatsResponse> {
  const { data } = await apiClient.get<SeasonStatsResponse>(
    `/estadisticas/liga/${ligaId}/temporada`,
  );
  return data;
}

/** Top N goleadores de la liga */
export async function getTopScorers(
  ligaId: number,
  limit = 5,
): Promise<TopScorerResponse[]> {
  const { data } = await apiClient.get<TopScorerResponse[]>(
    `/estadisticas/liga/${ligaId}/goleadores?limit=${limit}`,
  );
  return data;
}

/** MVP de la jornada más reciente */
export async function getMatchdayMvp(ligaId: number): Promise<MatchdayMVP> {
  const { data } = await apiClient.get<MatchdayMVP>(
    `/estadisticas/liga/${ligaId}/mvp`,
  );
  return data;
}

/** Estadísticas de goles por equipo */
export async function getTeamGoalsStats(ligaId: number): Promise<TeamGoalsStats[]> {
  const { data } = await apiClient.get<TeamGoalsStats[]>(
    `/estadisticas/liga/${ligaId}/equipos/goles`,
  );
  return data;
}

/** Estadísticas personales del jugador en la liga */
export async function getPlayerPersonalStats(
  ligaId: number,
  usuarioId: number,
): Promise<PlayerPersonalStats> {
  const { data } = await apiClient.get<PlayerPersonalStats>(
    `/estadisticas/liga/${ligaId}/jugador/${usuarioId}/estadisticas`,
  );
  return data;
}
