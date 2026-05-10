/**
 * matchesService.ts
 * Servicios reales para partidos, eventos y jugadores de partido.
 *
 * Correcciones incluidas:
 * - El minuto en vivo NO se toma como fuente principal desde `minuto_actual` del backend,
 *   porque puede llegar como 90 justo al iniciar.
 * - El minuto se calcula visualmente en front desde una hora de inicio fiable.
 * - Si no hay hora real fiable, se usa un inicio local persistente en memoria mientras la app esté abierta.
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
  updateMatch,
  getJornadasByLeague,
  startMatch,
  finishMatch,
  getMatchEvents,
  createMatchEvent,
} from '../api/matches.api';

const DEFAULT_MATCH_DURATION = 90;
const localLiveStartedAtByMatchId = new Map<number, number>();

const MESES_ABREV = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

export function parseBackendDateTimeLiteral(value?: string | null): {
  date: string; day: string; month: string; time: string; dateFormatted: string;
} {
  const empty = { date: '', day: '–', month: '–', time: '', dateFormatted: '–' };
  if (!value) return empty;
  const clean = String(value).trim();
  const m = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!m) return empty;
  const [, year, monthRaw, dayRaw, hour = '00', minute = '00'] = m;
  const day = String(Number(dayRaw));
  const monthIndex = Math.max(0, Math.min(11, Number(monthRaw) - 1));
  const month = MESES_ABREV[monthIndex] ?? '–';
  return { date: `${year}-${monthRaw}-${dayRaw}`, day, month, time: `${hour}:${minute}`, dateFormatted: `${day} ${month}` };
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function normalizeMatchStatus(
  status: string | undefined | null,
): 'programado' | 'en_juego' | 'finalizado' | 'cancelado' | 'suspendido' {
  const s = String(status ?? '').toLowerCase().trim();
  if (s === 'en_juego' || s === 'en_vivo' || s === 'live') return 'en_juego';
  if (s === 'finalizado' || s === 'finished') return 'finalizado';
  if (s === 'cancelado' || s === 'cancelled' || s === 'canceled') return 'cancelado';
  if (s === 'suspendido' || s === 'suspended') return 'suspendido';
  return 'programado';
}

export function getMatchId(partido: PartidoApi): number {
  return Number(partido.id_partido);
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

function clampMinute(minute: number, duration = DEFAULT_MATCH_DURATION): number {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : DEFAULT_MATCH_DURATION;
  if (!Number.isFinite(minute)) return 1;
  return Math.max(1, Math.min(safeDuration, Math.floor(minute)));
}

function parseDateMs(value?: string | null): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (Number.isNaN(ms)) return null;
  return ms;
}

function getReliableStartedAtMs(partido: PartidoApi, duration = DEFAULT_MATCH_DURATION): number | null {
  const maybeWithExtraFields = partido as PartidoApi & { fecha_inicio?: string | null; inicio_partido?: string | null };
  const directCandidates = [
    partido.inicio_en,
    partido.started_at,
    maybeWithExtraFields.fecha_inicio,
    maybeWithExtraFields.inicio_partido,
  ];

  const now = Date.now();
  const maxReasonableElapsedMs = Math.max(duration, DEFAULT_MATCH_DURATION) * 60 * 1000 * 3;

  for (const candidate of directCandidates) {
    const ms = parseDateMs(candidate);
    if (ms == null) continue;
    // Permitimos un pequeño margen de reloj adelantado, pero no fechas claramente futuras.
    if (ms > now + 2 * 60 * 1000) continue;
    return ms;
  }

  // Fallback persistente desde backend: si no existe una hora real de inicio,
  // `updated_at` suele cambiar al pasar a `en_juego`. Es más seguro que usar
  // la fecha programada, que puede mandar el partido directamente al minuto 90.
  if (normalizeMatchStatus(partido.estado) === 'en_juego') {
    const updatedMs = parseDateMs(partido.updated_at ?? null);
    if (updatedMs != null && updatedMs <= now + 2 * 60 * 1000 && now - updatedMs <= maxReasonableElapsedMs) {
      return updatedMs;
    }
  }

  return null;
}

/**
 * Calcula el minuto visual del partido en vivo.
 *
 * Regla definitiva:
 * - Si hay hora real fiable de inicio, el minuto se calcula desde esa hora.
 * - Si no la hay, el front mantiene una hora local de primera visualización del partido.
 * - Nunca usamos `minuto_actual = 90` del backend como fuente principal.
 * - El mínimo visible es 1 y el máximo visible es la duración de liga.
 */
export function getLiveMinute(partido: PartidoApi, _tick?: number, duration = DEFAULT_MATCH_DURATION): number {
  const matchId = getMatchId(partido);
  const reliableStartedAt = getReliableStartedAtMs(partido, duration);

  if (reliableStartedAt != null) {
    localLiveStartedAtByMatchId.set(matchId, reliableStartedAt);
    return clampMinute(Math.floor((Date.now() - reliableStartedAt) / 60000) + 1, duration);
  }

  const existingLocalStart = localLiveStartedAtByMatchId.get(matchId);
  const localStart = existingLocalStart ?? Date.now();
  if (!existingLocalStart) localLiveStartedAtByMatchId.set(matchId, localStart);

  return clampMinute(Math.floor((Date.now() - localStart) / 60000) + 1, duration);
}

export function hasReachedMatchDuration(partido: PartidoApi, duration = DEFAULT_MATCH_DURATION): boolean {
  const reliableStartedAt = getReliableStartedAtMs(partido, duration) ?? localLiveStartedAtByMatchId.get(getMatchId(partido));
  if (reliableStartedAt == null) return false;
  const elapsed = Math.floor((Date.now() - reliableStartedAt) / 60000) + 1;
  return elapsed >= duration;
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

export async function getLeagueMatchDurationService(ligaId: number): Promise<number> {
  if (!ligaId) return DEFAULT_MATCH_DURATION;
  try {
    const config = await getLeagueConfig(ligaId);
    return Number(config.minutos_partido ?? DEFAULT_MATCH_DURATION) || DEFAULT_MATCH_DURATION;
  } catch {
    return DEFAULT_MATCH_DURATION;
  }
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
    const result = await updateMatch(matchId, data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function startMatchService(matchId: number): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await startMatch(matchId);
    // Si el backend no devuelve hora real de inicio, fijamos una referencia local
    // para que el partido no aparezca como minuto 90 ni vuelva a 0 dentro de la sesión.
    const startedAt = getReliableStartedAtMs(result, DEFAULT_MATCH_DURATION);
    localLiveStartedAtByMatchId.set(matchId, startedAt ?? Date.now());
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function finishMatchService(matchId: number, data: FinishMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await finishMatch(matchId, data);
    localLiveStartedAtByMatchId.delete(matchId);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function getMatchEventsService(matchId: number): Promise<ServiceResult<MatchEventApi[]>> {
  try {
    const result = await getMatchEvents(matchId);
    return { success: true, data: result as MatchEventApi[] };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createMatchEventService(data: CreateMatchEventRequest): Promise<ServiceResult<unknown>> {
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

export async function getMatchDurationService(match: PartidoApi): Promise<number> {
  if (!match.id_liga) return DEFAULT_MATCH_DURATION;
  return getLeagueMatchDurationService(match.id_liga);
}
