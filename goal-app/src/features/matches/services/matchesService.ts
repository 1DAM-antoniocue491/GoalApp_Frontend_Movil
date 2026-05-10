/**
 * matchesService.ts
 * Servicios reales para partidos, eventos, finalización y edición segura.
 */

import { ApiError } from '@/src/shared/api/client';
import { getLeagueConfig } from '@/src/features/leagues/api/leagues.api';
import { getJugadoresByEquipo } from '@/src/features/convocatorias/api/convocatoria.api';
import type { JugadorEquipoApi } from '@/src/features/convocatorias/types/convocatoria.types';
import type {
  PartidoApi,
  CreateManualMatchRequest,
  UpdateScheduledMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
  MatchEventApi,
  MatchPlayerOption,
  MatchPlayersBySide,
  ServiceResult,
} from '../types/matches.types';
import {
  getMatchesByLeague,
  getPlainMatchesByLeague,
  getUpcomingMatches,
  getLiveMatches,
  getMatchById,
  createManualMatch,
  updateScheduledMatch,
  getJornadasByLeague,
  startMatch,
  finishMatch,
  getMatchEvents,
  createMatchEvent,
} from '../api/matches.api';

const SCHEDULED_EDIT_STATUSES = new Set(['programado', 'cancelado', 'suspendido']);

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function normalizeMatchStatus(status: string | undefined | null): 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'suspendido' {
  const s = String(status ?? '').toLowerCase().trim();
  if (s === 'en_juego' || s === 'en_vivo' || s === 'live') return 'en_juego';
  if (s === 'finalizado' || s === 'finished') return 'finalizado';
  if (s === 'cancelado' || s === 'cancelled' || s === 'canceled') return 'cancelado';
  if (s === 'suspendido' || s === 'suspended') return 'suspendido';
  return 'programado';
}

export function getMatchId(partido: PartidoApi): number {
  return partido.id_partido;
}

export function getMatchDate(partido: PartidoApi): string | null {
  return partido.fecha_hora ?? partido.fecha ?? null;
}

export function getHomeTeamId(partido: PartidoApi): number | null {
  return partido.equipo_local?.id_equipo ?? partido.equipo_local?.id ?? partido.id_equipo_local ?? null;
}

export function getAwayTeamId(partido: PartidoApi): number | null {
  return partido.equipo_visitante?.id_equipo ?? partido.equipo_visitante?.id ?? partido.id_equipo_visitante ?? null;
}

export function getHomeTeamName(partido: PartidoApi): string {
  return partido.equipo_local?.nombre ?? 'Equipo local';
}

export function getAwayTeamName(partido: PartidoApi): string {
  return partido.equipo_visitante?.nombre ?? 'Equipo visitante';
}

export function getJornadaNumber(partido: PartidoApi): number | null {
  return partido.jornada ?? partido.numero_jornada ?? partido.num_jornada ?? partido.id_jornada ?? null;
}

export function getLiveMinute(partido: PartidoApi, fallbackMinute?: number): number {
  const explicit = partido.minuto_actual ?? partido.minuto ?? fallbackMinute;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return Math.max(0, Math.floor(explicit));

  const startedAt = partido.inicio_en ?? partido.started_at;
  if (startedAt) {
    const started = new Date(startedAt).getTime();
    if (!Number.isNaN(started)) return Math.max(0, Math.floor((Date.now() - started) / 60000));
  }
  return 0;
}

function mapJugadorToOption(jugador: JugadorEquipoApi, equipo: 'home' | 'away'): MatchPlayerOption {
  return {
    id_jugador: Number(jugador.id_jugador),
    nombre: jugador.usuario?.nombre || jugador.nombre || jugador.usuario?.email || jugador.email || `Jugador ${jugador.id_jugador}`,
    dorsal: jugador.dorsal === undefined || jugador.dorsal === null ? undefined : String(jugador.dorsal),
    posicion: jugador.posicion ?? undefined,
    equipo,
  };
}

export async function getMatchesByLeagueService(ligaId: number): Promise<PartidoApi[]> {
  try {
    return await getMatchesByLeague(ligaId);
  } catch {
    return getPlainMatchesByLeague(ligaId);
  }
}

export async function getUpcomingMatchesService(ligaId: number, limit = 20): Promise<PartidoApi[]> {
  return getUpcomingMatches(ligaId, limit);
}

export async function getLiveMatchesService(ligaId: number): Promise<PartidoApi[]> {
  return getLiveMatches(ligaId);
}

export async function getFinishedMatchesService(ligaId: number): Promise<PartidoApi[]> {
  const matches = await getMatchesByLeagueService(ligaId);
  return matches.filter(match => normalizeMatchStatus(match.estado) === 'finalizado');
}

export async function getJornadasByLeagueService(ligaId: number): Promise<unknown> {
  return getJornadasByLeague(ligaId);
}

export async function getMatchByIdService(matchId: number): Promise<ServiceResult<PartidoApi>> {
  try {
    const data = await getMatchById(matchId);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createManualMatchService(data: CreateManualMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await createManualMatch(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function updateScheduledMatchService(matchId: number, data: UpdateScheduledMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    if (data.estado && !SCHEDULED_EDIT_STATUSES.has(data.estado)) {
      return {
        success: false,
        error: 'Desde la edición de un partido programado solo se permite mantenerlo programado, cancelarlo o suspenderlo.',
      };
    }

    const result = await updateScheduledMatch(matchId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function startMatchService(matchId: number): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await startMatch(matchId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function finishMatchService(matchId: number, data: FinishMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await finishMatch(matchId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchEventsService(matchId: number): Promise<ServiceResult<MatchEventApi[]>> {
  try {
    const result = await getMatchEvents(matchId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createMatchEventService(data: CreateMatchEventRequest): Promise<ServiceResult<MatchEventApi>> {
  try {
    const result = await createMatchEvent(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchPlayersBySideService(matchId: number): Promise<ServiceResult<MatchPlayersBySide>> {
  try {
    const match = await getMatchById(matchId);
    const homeId = getHomeTeamId(match);
    const awayId = getAwayTeamId(match);

    const [home, away] = await Promise.all([
      homeId ? getJugadoresByEquipo(homeId) : Promise.resolve([]),
      awayId ? getJugadoresByEquipo(awayId) : Promise.resolve([]),
    ]);

    return {
      success: true,
      data: {
        home: home.filter(j => j.activo !== false).map(j => mapJugadorToOption(j, 'home')),
        away: away.filter(j => j.activo !== false).map(j => mapJugadorToOption(j, 'away')),
      },
    };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchScoreFromEventsService(
  matchId: number,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
): Promise<ServiceResult<{ homeScore: number; awayScore: number }>> {
  try {
    const events = await getMatchEvents(matchId);
    const goals = events.filter(event => event.tipo_evento === 'gol');

    return {
      success: true,
      data: {
        homeScore: homeTeamId ? goals.filter(event => Number(event.id_equipo) === Number(homeTeamId)).length : 0,
        awayScore: awayTeamId ? goals.filter(event => Number(event.id_equipo) === Number(awayTeamId)).length : 0,
      },
    };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchDurationService(match: PartidoApi): Promise<number> {
  if (!match.id_liga) return 90;
  try {
    const config = await getLeagueConfig(match.id_liga);
    return Number(config.minutos_partido ?? 90);
  } catch {
    return 90;
  }
}
