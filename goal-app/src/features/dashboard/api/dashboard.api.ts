/**
 * dashboard.api.ts
 *
 * Capa de acceso a datos del dashboard.
 *
 * RESPONSABILIDAD:
 * - Definir los DTOs del backend (forma exacta de la respuesta)
 * - Llamar a los endpoints necesarios para construir el dashboard
 * - Mapear DTO → modelo de dominio (DashboardData)
 * - Aislar el resto del código del formato del backend
 *
 * ENDPOINTS:
 * GET /ligas/{liga_id}
 * GET /equipos/?liga_id={liga_id}
 * GET /partidos/ligas/{liga_id}/con-equipos
 * GET /estadisticas/liga/{liga_id}/temporada
 *
 * ENDPOINTS NO CRÍTICOS (fallan silenciosamente con fallback):
 * GET /estadisticas/liga/{liga_id}/goleadores?limit=5
 * GET /estadisticas/liga/{liga_id}/mvp
 * GET /ligas/{liga_id}/clasificacion
 * GET /ligas/{liga_id}/usuarios
 */

import { apiClient } from '@/src/shared/api/client';
import { getJornadasByLeague } from '@/src/features/matches/api/matches.api';
import { getLeagueConfig } from '@/src/features/leagues/api/leagues.api';
import { logger } from '@/src/shared/utils/logger';
import { getUser } from '@/src/state/session/sessionStore';
import type { LigaResponse } from '@/src/features/leagues/types/league.api.types';
import type {
  DashboardData,
  LiveMatchData,
  UpcomingMatchData,
  LeagueMetricsData,
} from '@/src/shared/types/dashboard.types';

// ---------------------------------------------------------------------------
// DTOs — forma exacta que devuelve el backend
// ---------------------------------------------------------------------------

interface EquipoResumen {
  id_equipo: number;
  nombre: string;
  color_primario?: string | null;
}

interface JornadaResumen {
  id_jornada?: number;
  numero?: number;
  nombre?: string;
}

/** Respuesta de GET /partidos/ligas/{liga_id}/con-equipos */
interface PartidoConEquiposResponse {
  id_partido: number;
  /** Estados posibles: 'en_juego', 'programado', 'finalizado' */
  estado: string;
  fecha_hora?: string | null;
  estadio?: string | null;
  goles_local: number;
  goles_visitante: number;
  /** Minuto actual — solo presente si estado === 'en_juego' */
  minuto_actual?: number | null;
  equipo_local: EquipoResumen;
  equipo_visitante: EquipoResumen;
  jornada?: JornadaResumen | null;
}

/** Respuesta de GET /estadisticas/liga/{liga_id}/temporada */
interface EstadisticasTemporadaResponse {
  total_goles?: number;
  total_amarillas?: number;
  total_rojas?: number;
  partidos_jugados?: number;
  total_jornadas?: number;
  jornadas_completadas?: number;
}

/** Respuesta de GET /equipos/?liga_id={liga_id} */
interface EquipoListResponse {
  id_equipo: number;
  nombre: string;
  activo?: boolean;
  color_primario?: string | null;
}

/** Item de GET /ligas/{liga_id}/clasificacion — campos usados para derivar métricas */
interface ClasificacionResumen {
  id_equipo: number;
  partidos_jugados: number;
  victorias: number;
  empates: number;
  derrotas: number;
  goles_favor: number;
  goles_contra: number;
  puntos: number;
}

/** Item de GET /ligas/{liga_id}/usuarios — miembro de la liga con su rol */
interface UsuarioLigaApi {
  id_usuario_rol: number;
  id_usuario: number;
  nombre_usuario?: string;
  email?: string;
  id_rol: number;
  nombre_rol?: string;
  activo?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers de parseo
// ---------------------------------------------------------------------------

const MESES = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

/**
 * Normaliza el estado del partido a un valor canónico.
 * El backend puede devolver 'en_juego' o 'en_vivo' según versión.
 */
function normalizarEstado(estado: string | null | undefined): 'en_juego' | 'programado' | 'finalizado' | 'otro' {
  const s = String(estado ?? '').toLowerCase().trim();
  if (s === 'en_juego' || s === 'en_vivo') return 'en_juego';
  if (s === 'programado') return 'programado';
  if (s === 'finalizado') return 'finalizado';
  return 'otro';
}

/**
 * Parsea una fecha ISO y extrae día, mes abreviado y hora para UpcomingMatchData.
 * Si la fecha es inválida devuelve valores vacíos en vez de romper.
 */
function parseFechaHora(fechaHora: string | null | undefined): { day: string; month: string; time: string } {
  if (!fechaHora) return { day: '–', month: '–', time: '–' };
  try {
    const d = new Date(fechaHora);
    if (isNaN(d.getTime())) return { day: '–', month: '–', time: '–' };
    const day = String(d.getDate());
    const month = MESES[d.getMonth()] ?? '–';
    const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return { day, month, time };
  } catch {
    return { day: '–', month: '–', time: '–' };
  }
}

// ---------------------------------------------------------------------------
// Helpers defensivos de equipo — nunca rompen si el objeto viene undefined
// ---------------------------------------------------------------------------

function safeString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback;
}

function getTeamName(team: unknown, fallback = 'Equipo sin nombre'): string {
  const t = team as Record<string, unknown> | null | undefined;
  return safeString(
    t?.nombre ?? t?.nombre_equipo ?? t?.team_name ?? t?.name,
    fallback,
  );
}

function getTeamColor(team: unknown, fallback = '#D4FF59'): string {
  const t = team as Record<string, unknown> | null | undefined;
  return safeString(
    t?.colores ?? t?.color_primario ?? t?.color ?? t?.primaryColor,
    fallback,
  );
}

// ---------------------------------------------------------------------------
// Helpers de jornadas — extracción y mapeo desde /jornadas
// ---------------------------------------------------------------------------

/**
 * Forma mínima de un partido extraído de /jornadas.
 * Los campos son flexibles porque el backend usa distintos nombres.
 */
interface PartidoJornadaRaw {
  id_partido: number;
  estado: string;
  fecha_hora?: string | null;
  fecha?: string | null;
  hora?: string | null;
  estadio?: string | null;
  equipo_local?: {
    id_equipo?: number;
    id?: number;
    nombre?: string;
    color_primario?: string | null;
    colores?: string | null;
  } | null;
  equipo_visitante?: {
    id_equipo?: number;
    id?: number;
    nombre?: string;
    color_primario?: string | null;
    colores?: string | null;
  } | null;
  id_equipo_local?: number;
  id_equipo_visitante?: number;
  jornada?: number | null;
  numero_jornada?: number | null;
  num_jornada?: number | null;
  numero?: number | null;
}

interface JornadaProgressResult {
  totalRounds: number;
  completedRounds: number;
}

function toSafeNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function getJornadaNumberFromGroup(group: Record<string, unknown>, fallbackIndex: number): number | null {
  return (
    toSafeNumber(group.jornada) ??
    toSafeNumber(group.numero_jornada) ??
    toSafeNumber(group.num_jornada) ??
    toSafeNumber(group.numero) ??
    toSafeNumber(group.id_jornada) ??
    fallbackIndex + 1
  );
}

function getPartidoJornadaKey(partido: PartidoConEquiposResponse | PartidoJornadaRaw): string | null {
  const p = partido as unknown as Record<string, unknown>;
  const jornada = p.jornada;

  if (jornada && typeof jornada === 'object') {
    const j = jornada as Record<string, unknown>;
    const fromObject =
      toSafeNumber(j.id_jornada) ??
      toSafeNumber(j.numero) ??
      toSafeNumber(j.jornada) ??
      toSafeNumber(j.numero_jornada) ??
      toSafeNumber(j.num_jornada);
    return fromObject != null ? String(fromObject) : null;
  }

  const fromFlat =
    toSafeNumber(p.id_jornada) ??
    toSafeNumber(p.jornada) ??
    toSafeNumber(p.numero_jornada) ??
    toSafeNumber(p.num_jornada) ??
    toSafeNumber(p.numero);

  return fromFlat != null ? String(fromFlat) : null;
}

function getJornadaGroups(raw: unknown): Array<{ key: string; partidos: PartidoJornadaRaw[] }> {
  if (!raw || typeof raw !== 'object') return [];

  const source = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as Record<string, unknown>).jornadas)
      ? ((raw as Record<string, unknown>).jornadas as unknown[])
      : [];

  if (source.length === 0) return [];

  const first = source[0] as Record<string, unknown>;

  // Forma agrupada: [{ jornada: N, partidos: [...] }].
  // Esta es la fuente más fiable para saber si una jornada está COMPLETA:
  // solo cuenta como completada si todos sus partidos están finalizados.
  if (Array.isArray(first?.partidos)) {
    return (source as Record<string, unknown>[]).map((group, index) => {
      const jornadaNumber = getJornadaNumberFromGroup(group, index);
      return {
        key: String(jornadaNumber ?? index + 1),
        partidos: Array.isArray(group.partidos) ? (group.partidos as PartidoJornadaRaw[]) : [],
      };
    });
  }

  // Forma plana: [{ id_partido, jornada, ... }]. Agrupamos manualmente.
  const grouped = new Map<string, PartidoJornadaRaw[]>();
  (source as PartidoJornadaRaw[]).forEach((partido, index) => {
    const key = getPartidoJornadaKey(partido) ?? `sin-jornada-${index}`;
    const current = grouped.get(key) ?? [];
    current.push(partido);
    grouped.set(key, current);
  });

  return Array.from(grouped, ([key, partidos]) => ({ key, partidos }));
}

function deriveRoundProgressFromJornadas(raw: unknown): JornadaProgressResult | null {
  const groups = getJornadaGroups(raw);
  if (groups.length === 0) return null;

  const completedRounds = groups.filter((group) => {
    // Una jornada vacía no se considera completada: necesita partidos y todos finalizados.
    return (
      group.partidos.length > 0 &&
      group.partidos.every((partido) => normalizarEstado(partido.estado) === 'finalizado')
    );
  }).length;

  return {
    totalRounds: groups.length,
    completedRounds,
  };
}

/**
 * Extrae un array plano de partidos desde la respuesta cruda de /jornadas.
 * Maneja las 3 formas posibles que devuelve el backend:
 *   A) Array de jornadas agrupadas: [{ jornada: N, partidos: [...] }]
 *   B) Objeto envuelto:             { jornadas: [...] }
 *   C) Array plano de partidos:     [{ id_partido, estado, ... }]
 */
function extractPartidosFromJornadas(raw: unknown): PartidoJornadaRaw[] {
  if (!raw || typeof raw !== 'object') return [];

  if (Array.isArray(raw)) {
    if (raw.length === 0) return [];
    const first = raw[0] as Record<string, unknown>;
    // Case A: array de jornadas agrupadas
    if (Array.isArray(first?.partidos)) {
      return (raw as Record<string, unknown>[]).flatMap((j, index) => {
        const jornadaNumber = getJornadaNumberFromGroup(j, index);
        const partidos = Array.isArray(j.partidos) ? (j.partidos as PartidoJornadaRaw[]) : [];

        // Conservamos el número de jornada en cada partido para que el dashboard
        // no tenga que mostrar siempre el fallback "Jornada 1".
        return partidos.map((partido) => ({
          ...partido,
          jornada: partido.jornada ?? jornadaNumber,
        }));
      });
    }
    // Case C: array plano de partidos
    if ('id_partido' in first) {
      return raw as PartidoJornadaRaw[];
    }
    return [];
  }

  // Case B: { jornadas: [...] }
  const obj = raw as Record<string, unknown>;
  if (Array.isArray(obj.jornadas)) {
    return (obj.jornadas as Record<string, unknown>[]).flatMap((j, index) => {
      const jornadaNumber = getJornadaNumberFromGroup(j, index);
      const partidos = Array.isArray(j.partidos) ? (j.partidos as PartidoJornadaRaw[]) : [];

      return partidos.map((partido) => ({
        ...partido,
        jornada: partido.jornada ?? jornadaNumber,
      }));
    });
  }

  return [];
}

/**
 * Mapea un partido de /jornadas a UpcomingMatchData.
 * Resuelve nombres de equipo usando el mapa teamsById cuando el partido
 * no tiene los objetos embebidos (el endpoint /jornadas puede no incluirlos).
 */
function mapJornadaPartidoToUpcoming(
  partido: PartidoJornadaRaw,
  teamsById: Map<number, EquipoListResponse>,
): UpcomingMatchData {
  // Resolver IDs de equipo desde objeto embebido o campos planos
  const homeId =
    partido.equipo_local?.id_equipo ??
    partido.equipo_local?.id ??
    partido.id_equipo_local;
  const awayId =
    partido.equipo_visitante?.id_equipo ??
    partido.equipo_visitante?.id ??
    partido.id_equipo_visitante;

  const homeTeamObj = homeId != null ? teamsById.get(homeId) : undefined;
  const awayTeamObj = awayId != null ? teamsById.get(awayId) : undefined;

  // Nombre: objeto embebido → mapa de equipos → fallback genérico
  const homeTeam = partido.equipo_local?.nombre ?? homeTeamObj?.nombre ?? `Equipo ${homeId ?? '?'}`;
  const awayTeam = partido.equipo_visitante?.nombre ?? awayTeamObj?.nombre ?? `Equipo ${awayId ?? '?'}`;

  // Fecha
  const fechaStr = partido.fecha_hora ?? partido.fecha ?? null;
  const { day, month, time } = parseFechaHora(fechaStr);

  // Jornada — prueba todos los nombres posibles
  const jornadaNum =
    partido.jornada ?? partido.numero_jornada ?? partido.num_jornada ?? partido.numero;
  const round = jornadaNum != null ? `Jornada ${jornadaNum}` : 'Jornada 1';

  // Color
  const homeColor =
    partido.equipo_local?.color_primario ??
    partido.equipo_local?.colores ??
    homeTeamObj?.color_primario ??
    undefined;
  const awayColor =
    partido.equipo_visitante?.color_primario ??
    partido.equipo_visitante?.colores ??
    awayTeamObj?.color_primario ??
    undefined;

  return {
    id: String(partido.id_partido),
    homeTeam,
    awayTeam,
    day,
    month,
    time,
    round,
    venue: partido.estadio ?? '',
    homeColor: homeColor ?? undefined,
    awayColor: awayColor ?? undefined,
  };
}

/**
 * Mapea un partido de /jornadas a LiveMatchData si está en curso.
 * Devuelve null si no tiene estado en_juego.
 */
function mapJornadaPartidoToLive(
  partido: PartidoJornadaRaw,
  leagueName: string,
  teamsById: Map<number, EquipoListResponse>,
): LiveMatchData | null {
  if (normalizarEstado(partido.estado) !== 'en_juego') return null;

  const homeId =
    partido.equipo_local?.id_equipo ?? partido.equipo_local?.id ?? partido.id_equipo_local;
  const awayId =
    partido.equipo_visitante?.id_equipo ?? partido.equipo_visitante?.id ?? partido.id_equipo_visitante;

  const homeTeamObj = homeId != null ? teamsById.get(homeId) : undefined;
  const awayTeamObj = awayId != null ? teamsById.get(awayId) : undefined;

  const homeTeam = partido.equipo_local?.nombre ?? homeTeamObj?.nombre ?? `Equipo ${homeId ?? '?'}`;
  const awayTeam = partido.equipo_visitante?.nombre ?? awayTeamObj?.nombre ?? `Equipo ${awayId ?? '?'}`;

  return {
    id: String(partido.id_partido),
    homeTeam,
    awayTeam,
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    leagueName,
    venue: partido.estadio ?? '',
    homeShieldLetter: homeTeam.charAt(0).toUpperCase(),
    awayShieldLetter: awayTeam.charAt(0).toUpperCase(),
    homeColor:
      partido.equipo_local?.color_primario ??
      partido.equipo_local?.colores ??
      homeTeamObj?.color_primario ??
      undefined,
    awayColor:
      partido.equipo_visitante?.color_primario ??
      partido.equipo_visitante?.colores ??
      awayTeamObj?.color_primario ??
      undefined,
  };
}

// ---------------------------------------------------------------------------
// Mappers DTO → modelo de dominio
// ---------------------------------------------------------------------------

function mapPartidoToLiveMatch(
  partido: PartidoConEquiposResponse,
  leagueName: string,
): LiveMatchData {
  const homeTeam = getTeamName(partido.equipo_local, `Equipo ${partido.equipo_local?.id_equipo ?? 'local'}`);
  const awayTeam = getTeamName(partido.equipo_visitante, `Equipo ${partido.equipo_visitante?.id_equipo ?? 'visitante'}`);

  if (!partido.equipo_local || !partido.equipo_visitante) {
    logger.warn('[dashboard/matches]', 'Partido con equipo incompleto (con-equipos)', {
      matchId: partido.id_partido,
      hasHomeTeam: Boolean(partido.equipo_local),
      hasAwayTeam: Boolean(partido.equipo_visitante),
    });
  }

  return {
    id: String(partido.id_partido),
    homeTeam,
    awayTeam,
    homeScore: partido.goles_local ?? 0,
    awayScore: partido.goles_visitante ?? 0,
    minute: partido.minuto_actual ?? 0,
    leagueName,
    venue: partido.estadio ?? '',
    homeShieldLetter: homeTeam.charAt(0).toUpperCase(),
    awayShieldLetter: awayTeam.charAt(0).toUpperCase(),
    homeColor: partido.equipo_local?.color_primario ?? undefined,
    awayColor: partido.equipo_visitante?.color_primario ?? undefined,
  };
}

function mapPartidoToUpcoming(partido: PartidoConEquiposResponse): UpcomingMatchData {
  const { day, month, time } = parseFechaHora(partido.fecha_hora);
  const jornada = partido.jornada;
  const round = jornada?.nombre ?? (jornada?.numero != null ? `Jornada ${jornada.numero}` : '–');

  if (!partido.equipo_local || !partido.equipo_visitante) {
    logger.warn('[dashboard/matches]', 'Partido con equipo incompleto (con-equipos/upcoming)', {
      matchId: partido.id_partido,
      hasHomeTeam: Boolean(partido.equipo_local),
      hasAwayTeam: Boolean(partido.equipo_visitante),
    });
  }

  return {
    id: String(partido.id_partido),
    homeTeam: getTeamName(partido.equipo_local, `Equipo ${partido.equipo_local?.id_equipo ?? 'local'}`),
    awayTeam: getTeamName(partido.equipo_visitante, `Equipo ${partido.equipo_visitante?.id_equipo ?? 'visitante'}`),
    day,
    month,
    time,
    round,
    venue: partido.estadio ?? '',
    homeColor: partido.equipo_local?.color_primario ?? undefined,
    awayColor: partido.equipo_visitante?.color_primario ?? undefined,
  };
}

function buildMetrics(
  liga: LigaResponse,
  equipos: EquipoListResponse[],
  partidos: Array<PartidoConEquiposResponse | PartidoJornadaRaw>,
  clasificacion: ClasificacionResumen[],
  stats: EstadisticasTemporadaResponse | null,
  usuarios: UsuarioLigaApi[],
  /** ID del usuario autenticado — para incluirlo si no aparece en /usuarios */
  currentUserId: number | null,
  /** max_equipos de la configuración de la liga — el progreso llega al 100% al alcanzar el máximo permitido */
  maxEquipos: number | null,
  /** Progreso real de jornadas calculado desde /jornadas: una jornada solo cuenta si todos sus partidos finalizaron */
  roundProgress: JornadaProgressResult | null,
): LeagueMetricsData {
  // registeredTeams: equipos realmente inscritos (fuente: array del endpoint).
  // configuredMaxTeams: máximo de equipos permitido por la configuración de la liga.
  //   REGLA DE PRODUCTO: la barra de "Equipos activos" se completa contra el máximo,
  //   no contra el mínimo. El mínimo sirve para validar la liga, no para completar el progreso.
  //   Fallback: liga.equipos_total → conteo real.
  const registeredTeams = equipos.length;
  const configuredMaxTeams =
    maxEquipos != null && maxEquipos > 0
      ? maxEquipos
      : liga.equipos_total != null && liga.equipos_total > 0
        ? liga.equipos_total
        : registeredTeams;

  // activeTeams: equipos con activo !== false. Si el campo no existe en ninguno, todos se consideran activos.
  const activeTeams = equipos.some(e => e.activo !== undefined)
    ? equipos.filter(e => e.activo !== false).length
    : registeredTeams;

  const scheduledMatches = partidos.filter(p => normalizarEstado(p.estado) === 'programado').length;
  const liveMatches = partidos.filter(p => normalizarEstado(p.estado) === 'en_juego').length;
  const finishedMatches = partidos.filter(p => normalizarEstado(p.estado) === 'finalizado').length;
  const totalMatches = partidos.length;

  // playedMatches: desde partidos directamente; si está vacío, el líder de clasificación
  // tiene el valor más actualizado (refleja partidos ya computados por el backend).
  const playedFromPartidos = finishedMatches;
  const playedFromClasificacion = clasificacion.length > 0 ? clasificacion[0].partidos_jugados : 0;
  const playedMatches = playedFromPartidos > 0 ? playedFromPartidos : playedFromClasificacion;

  // totalUsers: miembros de la liga + el creador/admin si no aparece en la lista.
  // El endpoint /ligas/{id}/usuarios puede omitir al usuario que creó la liga.
  // Si el usuario autenticado no está en la lista, se suma 1.
  const currentUserInList = currentUserId != null
    && usuarios.some(u => u.id_usuario === currentUserId);
  const totalUsers = usuarios.length + (currentUserId != null && !currentUserInList ? 1 : 0);

  // Goles totales: suma directa de goles_favor de cada equipo.
  // goles_favor ya representa los goles anotados por ese equipo (no se duplican),
  // así que la suma es el total real de goles de la liga. Si clasificacion = [], queda 0.
  const totalGoals = clasificacion.reduce((sum, e) => sum + (e.goles_favor ?? 0), 0);

  // Líder actual (primer elemento de clasificación, ya viene ordenada por el backend)
  const leader = clasificacion[0] ?? null;

  // Progreso de jornadas:
  // - Fuente preferente: /jornadas, porque permite verificar TODOS los partidos de cada jornada.
  // - Una jornada solo se marca como completada si todos sus partidos están finalizados.
  // - stats se mantiene como fallback para no dejar la métrica vacía si /jornadas falla.
  const allJornadas = new Set(
    partidos
      .map(getPartidoJornadaKey)
      .filter((v): v is string => v != null),
  );
  const finishedJornadas = new Set(
    partidos
      .filter(p => normalizarEstado(p.estado) === 'finalizado')
      .map(getPartidoJornadaKey)
      .filter((v): v is string => v != null),
  );

  const totalRounds = roundProgress?.totalRounds ?? stats?.total_jornadas ?? allJornadas.size;
  const completedRounds = roundProgress?.completedRounds ?? stats?.jornadas_completadas ?? finishedJornadas.size;

  const metrics: LeagueMetricsData = {
    // LeagueMetrics (grid 2×2): conteos reales
    teams: registeredTeams,
    users: totalUsers,
    scheduledMatches,
    playedMatches,
    // ProgressMetrics: numerador = activos, denominador = capacidad configurada
    activeTeams,
    totalTeams: configuredMaxTeams,
    completedRounds,
    totalRounds,
  };

  logger.debug('[dashboard/stats]', 'Métricas calculadas', {
    ligaId: liga.id_liga,
    totalTeams: registeredTeams,
    configuredMaxTeams,
    totalUsers,
    currentUserAdded: currentUserId != null && !currentUserInList,
    totalMatches,
    programmedMatches: scheduledMatches,
    finishedMatches,
    totalGoals,
    activeTeams,
    liveMatches,
    completedRounds,
    totalRounds,
    leader: leader ? { id_equipo: leader.id_equipo, puntos: leader.puntos } : null,
    fromStats: stats !== null,
    fromClasificacion: clasificacion.length > 0,
    fromUsuarios: usuarios.length > 0,
  });

  return metrics;
}

// ---------------------------------------------------------------------------
// Fetches individuales
// ---------------------------------------------------------------------------

async function fetchLiga(ligaId: number): Promise<LigaResponse> {
  const res = await apiClient.get<LigaResponse>(`/ligas/${ligaId}`);
  return res.data;
}

async function fetchEquipos(ligaId: number): Promise<EquipoListResponse[]> {
  const res = await apiClient.get<EquipoListResponse[]>(`/equipos/?liga_id=${ligaId}`);
  return res.data;
}

async function fetchPartidos(ligaId: number): Promise<PartidoConEquiposResponse[]> {
  const res = await apiClient.get<PartidoConEquiposResponse[] | null>(
    `/partidos/ligas/${ligaId}/con-equipos`,
  );
  // El backend puede devolver null o un objeto vacío si la liga no tiene partidos.
  return Array.isArray(res.data) ? res.data : [];
}

async function fetchEstadisticasTemporada(ligaId: number): Promise<EstadisticasTemporadaResponse> {
  const res = await apiClient.get<EstadisticasTemporadaResponse>(
    `/estadisticas/liga/${ligaId}/temporada`,
  );
  return res.data;
}

async function fetchClasificacion(ligaId: number): Promise<ClasificacionResumen[]> {
  const res = await apiClient.get<ClasificacionResumen[]>(`/ligas/${ligaId}/clasificacion`);
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * GET /partidos/ligas/{liga_id}/jornadas
 * Fuente primaria para upcomingMatches y liveMatch.
 * El endpoint /con-equipos devuelve 500 en algunos entornos; /jornadas es el estable.
 */
async function fetchJornadasRaw(ligaId: number): Promise<unknown> {
  return getJornadasByLeague(ligaId);
}

async function fetchGoleadores(ligaId: number): Promise<unknown[]> {
  const res = await apiClient.get<unknown[]>(`/estadisticas/liga/${ligaId}/goleadores?limit=5`);
  return res.data;
}

async function fetchMvp(ligaId: number): Promise<unknown> {
  const res = await apiClient.get<unknown>(`/estadisticas/liga/${ligaId}/mvp`);
  return res.data;
}

/**
 * GET /ligas/{liga_id}/usuarios
 * No crítico — si falla, users queda en 0 y el dashboard no se interrumpe.
 */
async function fetchLeagueUsers(ligaId: number): Promise<UsuarioLigaApi[]> {
  const res = await apiClient.get<UsuarioLigaApi[]>(`/ligas/${ligaId}/usuarios`);
  return Array.isArray(res.data) ? res.data : [];
}

// ---------------------------------------------------------------------------
// Función principal exportada — usada por useDashboardData
// ---------------------------------------------------------------------------

/**
 * Carga y mapea todos los datos necesarios para el dashboard de una liga.
 *
 * Estrategia de errores:
 * - CRÍTICOS (liga, partidos): si fallan, lanza el error → el hook muestra estado de error.
 * - NO CRÍTICOS (equipos, clasificacion, temporada, goleadores, mvp): Promise.allSettled,
 *   cada uno con fallback seguro; un fallo no interrumpe el resto.
 */
export async function fetchDashboardData(ligaId: number): Promise<DashboardData> {
  // ── Crítico: solo liga — sin liga no hay dashboard posible ─────────────────
  logger.info('dashboard.api', '[liga] intentando', { ligaId });
  const liga = await fetchLiga(ligaId);
  logger.info('dashboard.api', '[liga] OK', { ligaId });

  // ── No críticos: Promise.allSettled garantiza que ninguno tumba el dashboard ─
  // jornadasResult → fuente primaria para upcomingMatches y liveMatch (/jornadas es estable)
  // partidosResult → /con-equipos, no crítico; solo se usa si jornadas falla o para métricas
  const [
    jornadasResult,
    partidosResult,
    equiposResult,
    clasificacionResult,
    statsResult,
    goleadoresResult,
    mvpResult,
    usuariosResult,
    ligaConfigResult,
  ] = await Promise.allSettled([
    fetchJornadasRaw(ligaId),
    fetchPartidos(ligaId),
    fetchEquipos(ligaId),
    fetchClasificacion(ligaId),
    fetchEstadisticasTemporada(ligaId),
    fetchGoleadores(ligaId),
    fetchMvp(ligaId),
    fetchLeagueUsers(ligaId),
    getLeagueConfig(ligaId),
  ]);

  // ── Jornadas — fuente primaria para próximos partidos y partido en vivo ──
  const jornadasRaw: unknown = jornadasResult.status === 'fulfilled'
    ? jornadasResult.value
    : (logger.warn('dashboard.api', '[jornadas] FALLÓ', {
        ligaId,
        status: (jornadasResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: jornadasResult.reason instanceof Error ? jornadasResult.reason.message : String(jornadasResult.reason),
      }), null);

  const partidosDeJornadas: PartidoJornadaRaw[] = jornadasRaw != null
    ? extractPartidosFromJornadas(jornadasRaw)
    : [];

  if (jornadasRaw != null) {
    logger.info('dashboard.api', '[jornadas] OK', { ligaId, count: partidosDeJornadas.length });
  }

  // Extraer valores con fallback y loguear los que fallaron
  const partidos: PartidoConEquiposResponse[] = partidosResult.status === 'fulfilled'
    ? partidosResult.value
    : (logger.warn('dashboard.api', '[partidos] FALLÓ — liga vacía o error', {
        ligaId,
        status: (partidosResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: partidosResult.reason instanceof Error ? partidosResult.reason.message : String(partidosResult.reason),
      }), []);

  logger.info('dashboard.api', '[partidos] OK', { ligaId, count: partidos.length });

  const equipos = equiposResult.status === 'fulfilled'
    ? equiposResult.value
    : (logger.warn('dashboard.api', '[equipos] FALLÓ', {
        ligaId,
        status: (equiposResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: equiposResult.reason instanceof Error ? equiposResult.reason.message : String(equiposResult.reason),
      }), [] as EquipoListResponse[]);

  const clasificacion: ClasificacionResumen[] = clasificacionResult.status === 'fulfilled'
    ? clasificacionResult.value
    : (logger.warn('dashboard.api', '[clasificacion] FALLÓ', {
        ligaId,
        status: (clasificacionResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: clasificacionResult.reason instanceof Error ? clasificacionResult.reason.message : String(clasificacionResult.reason),
      }), []);

  const stats: EstadisticasTemporadaResponse | null = statsResult.status === 'fulfilled'
    ? statsResult.value
    : (logger.warn('dashboard.api', '[estadisticas/temporada] FALLÓ', {
        ligaId,
        status: (statsResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: statsResult.reason instanceof Error ? statsResult.reason.message : String(statsResult.reason),
      }), null);

  if (goleadoresResult.status === 'rejected') {
    logger.warn('dashboard.api', '[goleadores] FALLÓ', {
      ligaId,
      status: (goleadoresResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
      error: goleadoresResult.reason instanceof Error ? goleadoresResult.reason.message : String(goleadoresResult.reason),
    });
  }

  if (mvpResult.status === 'rejected') {
    logger.warn('dashboard.api', '[mvp] FALLÓ', {
      ligaId,
      status: (mvpResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
      error: mvpResult.reason instanceof Error ? mvpResult.reason.message : String(mvpResult.reason),
    });
  }

  const usuarios: UsuarioLigaApi[] = usuariosResult.status === 'fulfilled'
    ? usuariosResult.value
    : (logger.warn('dashboard.api', '[usuarios] FALLÓ — users quedará en 0', {
        ligaId,
        status: (usuariosResult.reason as { response?: { status?: number } })?.response?.status ?? 'desconocido',
        error: usuariosResult.reason instanceof Error ? usuariosResult.reason.message : String(usuariosResult.reason),
      }), [] as UsuarioLigaApi[]);

  if (usuariosResult.status === 'fulfilled') {
    logger.info('dashboard.api', '[usuarios] OK', { ligaId, count: usuarios.length });
  }

  // ── Mapeos ─────────────────────────────────────────────────────────────────

  // Mapa de equipos para resolución de nombres cuando /jornadas no embebe los objetos
  const teamsById = new Map<number, EquipoListResponse>(
    equipos.map((e) => [e.id_equipo, e]),
  );

  // ── Partido en vivo ──
  // Fuente 1: /jornadas (primaria — más estable)
  // Fuente 2: /con-equipos (fallback)
  const liveFromJornadas = partidosDeJornadas.find(
    (p) => normalizarEstado(p.estado) === 'en_juego',
  );
  const liveMatch: LiveMatchData | null = liveFromJornadas
    ? (mapJornadaPartidoToLive(liveFromJornadas, liga.nombre, teamsById) ?? null)
    : (partidos.find((p) => normalizarEstado(p.estado) === 'en_juego')
        ? mapPartidoToLiveMatch(
            partidos.find((p) => normalizarEstado(p.estado) === 'en_juego')!,
            liga.nombre,
          )
        : null);

  // ── Próximos partidos ──
  // Fuente 1: /jornadas filtrados por 'programado', ordenados por fecha
  const upcomingFromJornadas = partidosDeJornadas
    .filter((p) => normalizarEstado(p.estado) === 'programado')
    .sort((a, b) => {
      const fa = new Date(a.fecha_hora ?? a.fecha ?? '').getTime();
      const fb = new Date(b.fecha_hora ?? b.fecha ?? '').getTime();
      return fa - fb;
    })
    .map((p) => mapJornadaPartidoToUpcoming(p, teamsById));

  // Fuente 2: /con-equipos (fallback si /jornadas no devolvió programados)
  const upcomingFromConEquipos = partidos
    .filter((p) => normalizarEstado(p.estado) === 'programado')
    .map(mapPartidoToUpcoming);

  // Máximo 3 partidos programados en el dashboard; el resto se ve en Calendario
  const upcomingMatches: UpcomingMatchData[] = (
    upcomingFromJornadas.length > 0 ? upcomingFromJornadas : upcomingFromConEquipos
  ).slice(0, 3);

  // Obtener el usuario autenticado para comprobar si está en la lista de /usuarios.
  // getUser() devuelve de memoria (no hit a SecureStore) si ya hay sesión activa.
  // No es crítico: si falla, currentUserId = null y el conteo no se ajusta.
  const currentUser = await getUser().catch(() => null);
  const currentUserId = currentUser?.id_usuario ?? null;

  // max_equipos desde configuración de liga — determina cuándo se completa la barra de progreso.
  // No usamos min_equipos aquí: la barra debe llegar al 100% solo cuando se alcanza el máximo configurado.
  const maxEquipos: number | null = ligaConfigResult.status === 'fulfilled'
    ? (ligaConfigResult.value?.max_equipos ?? null)
    : null;

  if (ligaConfigResult.status === 'rejected') {
    logger.warn('dashboard.api', '[ligaConfig] FALLÓ — se usará fallback para progress bar', {
      ligaId,
      error: ligaConfigResult.reason instanceof Error ? ligaConfigResult.reason.message : String(ligaConfigResult.reason),
    });
  }

  const roundProgress = jornadasRaw != null ? deriveRoundProgressFromJornadas(jornadasRaw) : null;

  // Para métricas usamos /jornadas como fuente principal cuando /con-equipos no trae datos.
  // Así las barras de progreso siguen funcionando aunque /con-equipos falle o tarde.
  const partidosParaMetricas: Array<PartidoConEquiposResponse | PartidoJornadaRaw> =
    partidos.length > 0 ? partidos : partidosDeJornadas;

  const metrics = buildMetrics(
    liga,
    equipos,
    partidosParaMetricas,
    clasificacion,
    stats,
    usuarios,
    currentUserId,
    maxEquipos,
    roundProgress,
  );

  logger.info('dashboard.api', 'Dashboard cargado', {
    ligaId,
    liveMatch: liveMatch ? liveMatch.id : null,
    upcomingCount: upcomingMatches.length,
  });

  return { metrics, liveMatch, upcomingMatches };
}
