/**
 * matchesService.ts
 * Servicios reales para partidos, eventos y jugadores de partido.
 *
 * Esta capa remedia inconsistencias del backend antes de llegar a UI:
 * - estados con alias distintos;
 * - hora civil sin desfase visual en tarjetas y formularios;
 * - minuto de partido iniciado desde 1;
 * - marcador final calculado desde eventos si el backend no sincroniza goles.
 */

import { ApiError } from '@/src/shared/api/client';
import { getLeagueConfig } from '@/src/features/leagues/api/leagues.api';
import { getJugadoresByEquipo } from '@/src/features/convocatorias/api/convocatoria.api';
import type { JugadorEquipoApi } from '@/src/features/convocatorias/types/convocatoria.types';
import type {
  PartidoApi,
  CreateManualMatchRequest,
  CreateMatchEventRequest,
  FinishMatchRequest,
  MatchEventApi,
  MatchPlayerOption,
  MatchPlayersBySide,
  MatchScore,
  NormalizedMatchStatus,
  ServiceResult,
  UpdateScheduledMatchRequest,
} from '../types/matches.types';
import {
  getMatchesByLeague,
  getPlainMatchesByLeague,
  getUpcomingMatches,
  getLiveMatches,
  getMatchById,
  createManualMatch,
  getJornadasByLeague,
  startMatch,
  finishMatch,
  createMatchEvent,
  updateMatch,
  getMatchEvents,
} from '../api/matches.api';

const DEFAULT_MATCH_DURATION = 90;

function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message || `Error ${error.status}`;
  if (error instanceof Error) return error.message;
  return 'Error desconocido';
}

export function normalizeMatchStatus(status: string | undefined | null): NormalizedMatchStatus {
  const s = String(status ?? '').toLowerCase().trim();
  if (['en_juego', 'en vivo', 'en_vivo', 'live', 'playing', 'in_progress'].includes(s)) return 'en_juego';
  if (['finalizado', 'finished', 'finish', 'ended'].includes(s)) return 'finalizado';
  if (['cancelado', 'cancelled', 'canceled'].includes(s)) return 'cancelado';
  if (['suspendido', 'suspended', 'aplazado', 'postponed'].includes(s)) return 'suspendido';
  return 'programado';
}

export function getMatchId(partido: PartidoApi): number {
  return Number(partido.id_partido);
}

export function getMatchDate(partido: PartidoApi): string | null {
  return partido.fecha_hora ?? partido.fecha ?? null;
}

/**
 * Extrae fecha/hora como hora civil, sin aplicar conversión local del dispositivo.
 *
 * Motivo: el backend puede devolver `2026-05-10T18:00:00Z`. Si RN lo parsea con
 * `new Date()`, en España puede mostrarlo como 20:00. Para tarjetas y formularios
 * de partido queremos ver exactamente la hora que se eligió en UI/web: 18:00.
 */
export function extractBackendCivilDateTime(raw?: string | null): { date: string; time: string } | null {
  if (!raw) return null;
  const value = String(raw).trim();
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2}))?/);
  if (match) {
    const [, year, month, day, hour = '00', minute = '00'] = match;
    return { date: `${year}-${month}-${day}`, time: `${hour}:${minute}` };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  // Fallback UTC para mantener paridad con la versión web, que usa getUTC*.
  return {
    date: `${parsed.getUTCFullYear()}-${String(parsed.getUTCMonth() + 1).padStart(2, '0')}-${String(parsed.getUTCDate()).padStart(2, '0')}`,
    time: `${String(parsed.getUTCHours()).padStart(2, '0')}:${String(parsed.getUTCMinutes()).padStart(2, '0')}`,
  };
}

export function formatBackendCivilDateTime(raw?: string | null): string {
  const civil = extractBackendCivilDateTime(raw);
  if (!civil) return raw ? String(raw).replace('T', ' ').replace(/Z$/, '').slice(0, 16) : 'Fecha sin definir';
  const [year, month, day] = civil.date.split('-');
  return `${day}/${month}/${year} ${civil.time}`;
}

function normalizeUiDateToIso(value: string): string | null {
  const clean = String(value ?? '').trim();
  if (!clean) return null;

  const iso = clean.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) {
    const [, year, month, day] = iso;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const spanish = clean.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
  if (spanish) {
    const [, day, month, year] = spanish;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(clean);
  if (Number.isNaN(parsed.getTime())) return null;
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`;
}

function normalizeUiTimeToHm(value: string): string | null {
  const clean = String(value ?? '').trim();
  if (!clean) return null;
  const timePart = clean.includes('T') ? clean.split('T')[1] : clean;
  const match = timePart.match(/^(\d{1,2}):(\d{1,2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return null;
  if (!Number.isInteger(minute) || minute < 0 || minute > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

/**
 * Construye la fecha que se envía al backend.
 *
 * Regla de este proyecto: el usuario selecciona hora local/civil, pero el backend
 * valida contra la hora UTC del servidor. Por eso enviamos 2 horas menos.
 * Ejemplo: usuario elige 19:04 → backend recibe 17:04Z → la app muestra 19:04.
 */
export function buildBackendCivilDateTime(
  date: string,
  time: string,
  options?: { subtractHours?: number; appendZ?: boolean },
): string {
  const isoDate = normalizeUiDateToIso(date) ?? date;
  const hm = normalizeUiTimeToHm(time) ?? time;
  const subtractHours = options?.subtractHours ?? 2;
  const appendZ = options?.appendZ ?? true;
  const [year, month, day] = isoDate.split('-').map(Number);
  const [hours, minutes] = hm.split(':').map(Number);

  if (![year, month, day, hours, minutes].every(Number.isFinite)) {
    return `${isoDate}T${hm}:00${appendZ ? 'Z' : ''}`;
  }

  const normalized = new Date(Date.UTC(year, month - 1, day, hours - subtractHours, minutes, 0));
  const yyyy = normalized.getUTCFullYear();
  const mm = String(normalized.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(normalized.getUTCDate()).padStart(2, '0');
  const hh = String(normalized.getUTCHours()).padStart(2, '0');
  const min = String(normalized.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:00${appendZ ? 'Z' : ''}`;
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

export function clampMatchMinute(minute: number, duration = DEFAULT_MATCH_DURATION): number {
  const safeDuration = Number.isFinite(duration) && duration > 0 ? Math.floor(duration) : DEFAULT_MATCH_DURATION;
  if (!Number.isFinite(minute)) return 1;
  return Math.min(safeDuration, Math.max(1, Math.floor(minute)));
}

export function getConfiguredMatchDurationFromMatch(partido: PartidoApi, fallback = DEFAULT_MATCH_DURATION): number {
  const fromMatch = partido.minutos_partido ?? partido.duracion_partido;
  const parsed = Number(fromMatch ?? fallback);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : DEFAULT_MATCH_DURATION;
}

export function getLiveMinute(partido: PartidoApi, _rerenderTick?: number, duration?: number): number {
  const limit = duration ?? getConfiguredMatchDurationFromMatch(partido);
  const startedAt = partido.inicio_en ?? partido.started_at ?? partido.fecha_inicio ?? getMatchDate(partido);
  if (startedAt) {
    const started = new Date(startedAt).getTime();
    if (!Number.isNaN(started)) {
      // Minuto 1 comienza justo al iniciar; si backend devuelve UTC con Z,
      // Date lo convierte a hora local correctamente.
      return clampMatchMinute(Math.floor((Date.now() - started) / 60000) + 1, limit);
    }
  }

  const explicit = partido.minuto_actual ?? partido.minuto;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) return clampMatchMinute(explicit, limit);

  return 1;
}

export function buildBackendDateTime(
  date: string,
  time: string,
  options?: { subtractHours?: number; appendZ?: boolean },
): string {
  return buildBackendCivilDateTime(date, time, options);
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

function normalizeEventType(event: MatchEventApi): string {
  return String(event.tipo_evento ?? event.tipo ?? '').toLowerCase().trim();
}

function getEventTeamId(event: MatchEventApi): number | null {
  const id = Number(event.id_equipo ?? event.equipo_id ?? 0);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export async function getMatchesByLeagueService(ligaId: number): Promise<PartidoApi[]> {
  try {
    return await getMatchesByLeague(ligaId);
  } catch {
    return getPlainMatchesByLeague(ligaId);
  }
}

export async function getUpcomingMatchesService(ligaId: number, limit = 20): Promise<PartidoApi[]> {
  try {
    return await getUpcomingMatches(ligaId, limit);
  } catch {
    const all = await getMatchesByLeagueService(ligaId);
    return all.filter(match => normalizeMatchStatus(match.estado) === 'programado').slice(0, limit);
  }
}

export async function getLiveMatchesService(ligaId: number): Promise<PartidoApi[]> {
  try {
    return await getLiveMatches(ligaId);
  } catch {
    const all = await getMatchesByLeagueService(ligaId);
    return all.filter(match => normalizeMatchStatus(match.estado) === 'en_juego');
  }
}

export async function getFinishedMatchesService(ligaId: number): Promise<PartidoApi[]> {
  const all = await getMatchesByLeagueService(ligaId);
  return all.filter(match => normalizeMatchStatus(match.estado) === 'finalizado');
}

export async function getJornadasByLeagueService(ligaId: number): Promise<unknown> {
  return getJornadasByLeague(ligaId);
}

export async function getLeagueMatchDurationService(ligaId?: number | null): Promise<number> {
  if (!ligaId) return DEFAULT_MATCH_DURATION;
  try {
    const config = await getLeagueConfig(ligaId);
    const rawConfig = config as { minutos_partido?: number | string; duracion_partido?: number | string };
    const value = Number(rawConfig.minutos_partido ?? rawConfig.duracion_partido ?? DEFAULT_MATCH_DURATION);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : DEFAULT_MATCH_DURATION;
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

export async function updateScheduledMatchService(
  matchId: number,
  data: UpdateScheduledMatchRequest,
): Promise<ServiceResult<PartidoApi>> {
  try {
    if (!['programado', 'cancelado', 'suspendido'].includes(data.estado)) {
      return { success: false, error: 'Desde próximos partidos solo se permite programar, cancelar o suspender.' };
    }

    const result = await updateMatch(matchId, {
      fecha: data.fecha,
      estado: data.estado,
    });
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: getApiErrorMessage(error) };
  }
}

function isDateNotReachedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return normalized.includes('fecha') && normalized.includes('hora') && (
    normalized.includes('no ha llegado') ||
    normalized.includes('aún no') ||
    normalized.includes('aun no') ||
    normalized.includes('not arrived')
  );
}

export async function startMatchService(
  matchId: number,
  correction?: { rawDateTime?: string | null; date?: string; time?: string },
): Promise<ServiceResult<PartidoApi>> {
  try {
    const result = await startMatch(matchId);
    return { success: true, data: result };
  } catch (error) {
    const firstError = getApiErrorMessage(error);

    // Remedio front para partidos guardados sin restar las 2 horas.
    // Si el backend dice que aún no llegó la hora, corregimos la fecha y reintentamos.
    if (correction && isDateNotReachedError(firstError)) {
      const civil = correction.rawDateTime
        ? extractBackendCivilDateTime(correction.rawDateTime)
        : correction.date && correction.time
          ? { date: correction.date, time: correction.time }
          : null;

      if (civil?.date && civil?.time && normalizeUiDateToIso(civil.date) && normalizeUiTimeToHm(civil.time)) {
        try {
          await updateMatch(matchId, {
            fecha: buildBackendCivilDateTime(civil.date, civil.time, { subtractHours: 2, appendZ: true }),
            estado: 'programado',
          });
          const result = await startMatch(matchId);
          return { success: true, data: result };
        } catch (retryError) {
          return { success: false, error: getApiErrorMessage(retryError) };
        }
      }
    }

    return { success: false, error: firstError };
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
  const fromMatch = getConfiguredMatchDurationFromMatch(match);
  if (match.minutos_partido || match.duracion_partido) return fromMatch;
  return getLeagueMatchDurationService(match.id_liga);
}

export async function getMatchScoreFromEventsService(
  matchId: number,
  fallback: MatchScore,
): Promise<MatchScore> {
  try {
    const [match, events, playersResult] = await Promise.all([
      getMatchById(matchId),
      getMatchEvents(matchId),
      getMatchPlayersBySideService(matchId),
    ]);

    const homeId = getHomeTeamId(match);
    const awayId = getAwayTeamId(match);
    const playerSide = new Map<number, 'home' | 'away'>();
    playersResult.data?.home.forEach(player => playerSide.set(player.id_jugador, 'home'));
    playersResult.data?.away.forEach(player => playerSide.set(player.id_jugador, 'away'));

    let homeGoals = 0;
    let awayGoals = 0;

    events.forEach(event => {
      if (normalizeEventType(event) !== 'gol') return;

      const eventTeamId = getEventTeamId(event);
      if (homeId && eventTeamId === homeId) {
        homeGoals += 1;
        return;
      }
      if (awayId && eventTeamId === awayId) {
        awayGoals += 1;
        return;
      }

      const side = playerSide.get(Number(event.id_jugador));
      if (side === 'home') homeGoals += 1;
      if (side === 'away') awayGoals += 1;
    });

    return { goles_local: homeGoals, goles_visitante: awayGoals };
  } catch {
    return fallback;
  }
}
