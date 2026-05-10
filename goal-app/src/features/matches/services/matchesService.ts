/**
 * matchesService.ts
 * Servicios reales para partidos, eventos y jugadores de partido.
 *
 * Toda normalización de estados, horas y minutaje queda aquí para que
 * dashboard, calendario y pantallas de partidos muestren lo mismo.
 */

import { ApiError } from '@/src/shared/api/client';
import { getLeagueConfig } from '@/src/features/leagues/api/leagues.api';
import { getJugadoresByEquipo } from '@/src/features/convocatorias/api/convocatoria.api';
import type { JugadorEquipoApi } from '@/src/features/convocatorias/types/convocatoria.types';
import type {
  CanonicalMatchStatus,
  PartidoApi,
  CreateManualMatchRequest,
  UpdateScheduledMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
  MatchPlayerOption,
  MatchPlayersBySide,
  MatchScore,
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
const START_WINDOW_MINUTES = 60;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function normalizeMatchStatus(status: string | undefined | null): CanonicalMatchStatus {
  const s = String(status ?? '').toLowerCase().trim();
  if (s === 'en_juego' || s === 'en_vivo' || s === 'live' || s === 'en_curso') return 'en_juego';
  if (s === 'finalizado' || s === 'finished' || s === 'completado' || s === 'terminado') return 'finalizado';
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

export function getMatchDurationFromPartido(partido: PartidoApi): number {
  const raw = Number(partido.duracion_partido ?? DEFAULT_MATCH_DURATION);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MATCH_DURATION;
}

/**
 * Extrae fecha y hora de forma literal, sin convertir UTC a hora local.
 * Soluciona el desfase visual de +2h cuando backend devuelve `Z`.
 */
export function parseBackendDateTimeLiteral(raw?: string | null) {
  if (!raw) return { date: '', time: '', day: '–', month: '–', dateFormatted: '–' };

  const clean = String(raw).trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (!match) return { date: '', time: '', day: '–', month: '–', dateFormatted: '–' };

  const [, year, month, day, hour = '00', minute = '00'] = match;
  const monthIndex = Math.max(0, Math.min(11, Number(month) - 1));
  const monthLabel = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][monthIndex] ?? '–';

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    day: String(Number(day)),
    month: monthLabel,
    dateFormatted: `${String(Number(day))} ${monthLabel}`,
  };
}

/**
 * Construye el datetime que espera el backend y resta 2 horas antes de enviar.
 * Se usa al crear/editar partidos para compensar el desfase detectado en backend.
 */
export function buildBackendMatchDateTime(date: string, time: string): string {
  const dateParts = date.includes('/') ? date.split('/').reverse().join('-') : date.split('T')[0];
  const [year, month, day] = dateParts.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const base = new Date(year, month - 1, day, hour, minute, 0, 0);
  base.setHours(base.getHours() - 2);
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, '0')}-${String(base.getDate()).padStart(2, '0')}T${String(base.getHours()).padStart(2, '0')}:${String(base.getMinutes()).padStart(2, '0')}:00`;
}

function parseLiteralTimestamp(raw?: string | null): number | null {
  if (!raw) return null;
  const parts = parseBackendDateTimeLiteral(raw);
  if (!parts.date || !parts.time) return null;
  const [y, m, d] = parts.date.split('-').map(Number);
  const [hh, mm] = parts.time.split(':').map(Number);
  const ts = new Date(y, m - 1, d, hh, mm, 0, 0).getTime();
  return Number.isFinite(ts) ? ts : null;
}

export function getMatchStartTimestamp(partido: PartidoApi): number | null {
  return parseLiteralTimestamp(partido.inicio_en ?? partido.started_at ?? partido.fecha_inicio ?? partido.fecha_hora ?? partido.fecha);
}

export function getLiveMinute(partido: PartidoApi, fallbackMinute?: number): number {
  const duration = getMatchDurationFromPartido(partido);
  const started = getMatchStartTimestamp(partido);

  if (started != null) {
    const elapsed = Math.floor((Date.now() - started) / 60000) + 1;
    return Math.max(1, Math.min(duration, elapsed));
  }

  const explicit = partido.minuto_actual ?? partido.minuto ?? fallbackMinute ?? 1;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return Math.max(1, Math.min(duration, Math.floor(explicit)));
  }
  return 1;
}

export function isMatchTimeExpired(partido: PartidoApi): boolean {
  return getLiveMinute(partido) >= getMatchDurationFromPartido(partido);
}

export function canStartMatchByDate(partido: PartidoApi): boolean {
  const start = parseLiteralTimestamp(getMatchDate(partido));
  if (start == null) return false;
  return Date.now() >= start - START_WINDOW_MINUTES * 60000;
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

async function getLeagueMatchDuration(ligaId?: number | null): Promise<number> {
  if (!ligaId) return DEFAULT_MATCH_DURATION;
  try {
    const config = await getLeagueConfig(ligaId);
    const raw = Number(config.minutos_partido ?? DEFAULT_MATCH_DURATION);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_MATCH_DURATION;
  } catch {
    return DEFAULT_MATCH_DURATION;
  }
}

function attachDuration(partidos: PartidoApi[], duration: number): PartidoApi[] {
  return partidos.map((p) => ({ ...p, duracion_partido: p.duracion_partido ?? duration }));
}

function sortByAttention(a: PartidoApi, b: PartidoApi): number {
  const sa = normalizeMatchStatus(a.estado);
  const sb = normalizeMatchStatus(b.estado);
  const priority: Record<CanonicalMatchStatus, number> = {
    en_juego: 0,
    programado: 1,
    finalizado: 2,
    suspendido: 3,
    cancelado: 4,
  };
  if (priority[sa] !== priority[sb]) return priority[sa] - priority[sb];

  const da = parseLiteralTimestamp(getMatchDate(a)) ?? 0;
  const db = parseLiteralTimestamp(getMatchDate(b)) ?? 0;

  if (sa === 'finalizado') return db - da;
  return da - db;
}

export async function getMatchesByLeagueService(ligaId: number): Promise<PartidoApi[]> {
  try {
    const [matches, duration] = await Promise.all([getMatchesByLeague(ligaId), getLeagueMatchDuration(ligaId)]);
    return attachDuration(matches, duration).sort(sortByAttention);
  } catch {
    const [matches, duration] = await Promise.all([getPlainMatchesByLeague(ligaId), getLeagueMatchDuration(ligaId)]);
    return attachDuration(matches, duration).sort(sortByAttention);
  }
}

export async function getUpcomingMatchesService(ligaId: number, limit = 20): Promise<PartidoApi[]> {
  const [matches, duration] = await Promise.all([getUpcomingMatches(ligaId, limit), getLeagueMatchDuration(ligaId)]);
  return attachDuration(matches, duration).filter((m) => normalizeMatchStatus(m.estado) === 'programado').sort(sortByAttention);
}

export async function getLiveMatchesService(ligaId: number): Promise<PartidoApi[]> {
  const [matches, duration] = await Promise.all([getLiveMatches(ligaId), getLeagueMatchDuration(ligaId)]);
  return attachDuration(matches, duration).filter((m) => normalizeMatchStatus(m.estado) === 'en_juego').sort(sortByAttention);
}

export async function getFinishedMatchesService(ligaId: number): Promise<PartidoApi[]> {
  const matches = await getMatchesByLeagueService(ligaId);
  return matches.filter((m) => normalizeMatchStatus(m.estado) === 'finalizado').sort(sortByAttention);
}

export async function getJornadasByLeagueService(ligaId: number): Promise<unknown> {
  return getJornadasByLeague(ligaId);
}

export async function getMatchByIdService(matchId: number): Promise<ServiceResult<PartidoApi>> {
  try {
    const data = await getMatchById(matchId);
    const duration = await getLeagueMatchDuration(data.id_liga);
    return { success: true, data: { ...data, duracion_partido: data.duracion_partido ?? duration } };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function createManualMatchService(data: CreateManualMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    const parts = parseBackendDateTimeLiteral(data.fecha);
    const payload = parts.date && parts.time
      ? { ...data, fecha: buildBackendMatchDateTime(parts.date, parts.time) }
      : data;
    const result = await createManualMatch(payload);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

export async function updateScheduledMatchService(matchId: number, data: UpdateScheduledMatchRequest): Promise<ServiceResult<PartidoApi>> {
  try {
    const safeStatus = data.estado && ['programado', 'cancelado', 'suspendido'].includes(data.estado)
      ? data.estado
      : undefined;
    const parts = parseBackendDateTimeLiteral(data.fecha);
    const safeFecha = parts.date && parts.time ? buildBackendMatchDateTime(parts.date, parts.time) : data.fecha;
    const result = await updateMatch(matchId, { ...data, fecha: safeFecha, estado: safeStatus });
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

export async function createMatchEventService(data: CreateMatchEventRequest): Promise<ServiceResult<unknown>> {
  try {
    const result = await createMatchEvent(data);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

function getNumberField(source: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = source[key];
    const parsed = Number(raw);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

export async function getComputedScoreFromEventsService(
  matchId: number,
  homeTeamId?: number | null,
  awayTeamId?: number | null,
  fallback: MatchScore = { home: 0, away: 0 },
): Promise<MatchScore> {
  try {
    const events = await getMatchEvents(matchId);
    if (!homeTeamId || !awayTeamId) return fallback;

    let home = 0;
    let away = 0;

    for (const event of events) {
      if (!event || typeof event !== 'object') continue;
      const e = event as Record<string, unknown>;
      const tipo = String(e.tipo_evento ?? e.tipo ?? e.event_type ?? '').toLowerCase();
      if (tipo !== 'gol' && tipo !== 'goal') continue;

      const teamId = getNumberField(e, ['id_equipo', 'equipo_id', 'idEquipo', 'teamId']);
      if (teamId === homeTeamId) home += 1;
      if (teamId === awayTeamId) away += 1;
    }

    return { home, away };
  } catch {
    return fallback;
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
  return getLeagueMatchDuration(match.id_liga);
}
