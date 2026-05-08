/**
 * League Service - Capa de acceso a datos de ligas.
 *
 * Responsabilidades:
 * - Llamar a la API de ligas.
 * - Mapear respuestas del backend al modelo de UI (LeagueItem).
 * - Mantener fallbacks defensivos sin romper onboarding.
 */

import type { LeagueItem, LeagueRole } from '@/src/shared/types/league';
import type { Team } from '@/src/shared/types/team';
import type { User } from '@/src/shared/types/user';
import { logger } from '@/src/shared/utils/logger';
import { ApiError } from '@/src/shared/api/errors';
import {
  acceptJoinCode,
  createLeague as createLeagueApi,
  deleteLeague as deleteLeagueApi,
  getLeagueById as getLeagueByIdApi,
  getLeagueConfig as getLeagueConfigApi,
  getMyLeagues,
  getMyTeamInLeague,
  setLeagueConfig,
  updateLeague as updateLeagueApi,
  updateLeagueConfig,
  validateJoinCode,
} from '../api/leagues.api';
import type {
  JoinLeagueByCodeResponse,
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  MyTeamInLeagueResponse,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';

// ============================================================
// TIPOS Y HELPERS
// ============================================================

export interface ServiceResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

function safeString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : fallback;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return 'Error inesperado';
  }
}

/** Mapea cualquier rol del backend al tipo usado por las tarjetas de liga. */
function mapRol(rol?: string | null): LeagueRole {
  const value = String(rol ?? '').trim().toLowerCase();
  switch (value) {
    case 'admin':
    case 'administrador':
      return 'admin';
    case 'coach':
    case 'entrenador':
      return 'coach';
    case 'delegado':
    case 'delegado_campo':
    case 'field_delegate':
    case 'delegate':
      return 'field_delegate';
    case 'jugador':
    case 'player':
      return 'player';
    case 'observador':
    case 'observer':
    default:
      return 'observer';
  }
}

function shouldLoadMyTeamForRole(role: LeagueRole): boolean {
  return role === 'coach' || role === 'player' || role === 'field_delegate';
}

function mapMyTeamResponseToPatch(team: MyTeamInLeagueResponse): Partial<LeagueItem> {
  const teamId = team.id_equipo ?? team.id ?? null;
  const teamName = safeString(team.nombre);

  // teamId/teamName no existen en todos los tipos antiguos de LeagueItem.
  // Se devuelven como Partial para no romper si el tipo compartido aún no los declara.
  return {
    ...(teamId != null ? { teamId: String(teamId) } : {}),
    ...(teamName ? { teamName } : {}),
  } as Partial<LeagueItem>;
}

// ============================================================
// MAPEO BACKEND → FRONTEND
// ============================================================

function mapLeagueWithRoleToLeagueItem(league: LigaConRolResponse): LeagueItem {
  if (!league || typeof league.id_liga !== 'number') {
    throw new ApiError(500, 'Liga inválida recibida desde la API');
  }

  const role = mapRol(league.rol);
  const inlineTeamId = league.id_equipo ?? league.equipo_id ?? league.equipo?.id_equipo ?? league.equipo?.id ?? null;
  const inlineTeamName = safeString(
    league.nombre_equipo ?? league.equipo_nombre ?? league.mi_equipo ?? league.miEquipo ?? league.equipo?.nombre,
  );

  return {
    id: String(league.id_liga),
    name: safeString(league.nombre, 'Liga sin nombre'),
    season: safeString(league.temporada, '-'),
    status: league.activa ? 'active' : 'finished',
    role,
    isFavorite: false,
    teamsCount: league.equipos_total ?? 0,
    // La UI móvil ya no usa logo remoto. Mantener null fuerza el escudo visual generado.
    crestUrl: null,
    categoria: league.categoria ?? undefined,
    canReactivate: !league.activa && role === 'admin',
    ...(inlineTeamId != null ? { teamId: String(inlineTeamId) } : {}),
    ...(inlineTeamName ? { teamName: inlineTeamName } : {}),
  } as LeagueItem;
}

function mapLigaToItem(liga: LigaResponse, rol: string): LeagueItem {
  const role = mapRol(rol);
  return {
    id: String(liga.id_liga),
    name: safeString(liga.nombre, 'Liga sin nombre'),
    season: safeString(liga.temporada, '-'),
    status: liga.activa ? 'active' : 'finished',
    role,
    isFavorite: false,
    teamsCount: liga.equipos_total ?? 0,
    // Sin logo en móvil: se muestra escudo generado con colores premium.
    crestUrl: null,
    categoria: liga.categoria ?? undefined,
    canReactivate: !liga.activa && role === 'admin',
  };
}

// ============================================================
// LIGAS DEL USUARIO + EQUIPO ASIGNADO
// ============================================================

/**
 * Enriquecimiento no crítico para mostrar equipo asignado.
 * Si falla, se devuelve la liga original para no bloquear el onboarding.
 */
export async function enrichLeagueTeamAssignments(leagues: LeagueItem[]): Promise<LeagueItem[]> {
  return Promise.all(
    leagues.map(async (league) => {
      if (!shouldLoadMyTeamForRole(league.role) || (league as any).teamName) {
        return league;
      }

      try {
        const team = await getMyTeamInLeague(Number(league.id));
        return { ...league, ...mapMyTeamResponseToPatch(team) };
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;
        if (status !== 404) {
          logger.warn('leagueService/enrichLeagueTeamAssignments', 'No se pudo obtener mi equipo', {
            ligaId: league.id,
            role: league.role,
            error: getErrorMessage(error),
          });
        }
        return league;
      }
    }),
  );
}

export async function fetchMyLeagues(options?: { enrichTeams?: boolean }): Promise<LeagueItem[]> {
  try {
    const ligasConRol = await getMyLeagues();
    if (!Array.isArray(ligasConRol)) {
      throw new ApiError(500, 'Respuesta inesperada al cargar ligas');
    }

    const mapped = ligasConRol.map(mapLeagueWithRoleToLeagueItem);
    return options?.enrichTeams === false ? mapped : enrichLeagueTeamAssignments(mapped);
  } catch (error) {
    logger.warn('leagueService/fetchMyLeagues', 'Error al obtener ligas del usuario', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/**
 * Une al usuario autenticado a una liga usando el mismo flujo que web:
 * validar código → aceptar código con body {} → refrescar ligas.
 */
export async function joinLeagueByCodeService(
  code: string,
): Promise<ServiceResult<{ response: JoinLeagueByCodeResponse; leagues: LeagueItem[] }>> {
  const normalizedCode = code.trim().replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  if (!/^[A-Z0-9]{6,12}$/.test(normalizedCode)) {
    return { success: false, error: 'Introduce un código de unión válido.' };
  }

  try {
    await validateJoinCode(normalizedCode);
    const response = await acceptJoinCode(normalizedCode);
    const leagues = await fetchMyLeagues({ enrichTeams: true });
    return { success: true, data: { response, leagues } };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    logger.warn('leagueService/joinLeagueByCodeService', 'Error al unirse por código', {
      status,
      error: getErrorMessage(error),
    });

    return {
      success: false,
      error:
        status === 409
          ? 'Ya formas parte de esta liga.'
          : status === 404 || status === 400
            ? 'El código no existe o ha expirado.'
            : 'No se pudo unir a la liga con ese código.',
    };
  }
}

// ============================================================
// CREACIÓN / DETALLE
// ============================================================

async function saveLeagueConfig(ligaId: number, config: LigaConfiguracionRequest): Promise<void> {
  try {
    await setLeagueConfig(ligaId, config);
  } catch (err) {
    const msg = getErrorMessage(err);
    if (msg.includes('ya tiene configuración')) {
      await updateLeagueConfig(ligaId, config);
    } else {
      throw err;
    }
  }
}

export async function createLeagueWithConfig(input: {
  league: LigaCreateRequest;
  config?: LigaConfiguracionRequest;
}): Promise<LeagueItem> {
  try {
    // El modal móvil no permite logo ni máximo de partidos; si algún caller antiguo
    // los manda, se eliminan aquí para respetar la decisión de producto.
    const sanitizedLeague: LigaCreateRequest = {
      nombre: input.league.nombre,
      temporada: input.league.temporada,
      categoria: input.league.categoria ?? undefined,
      activa: input.league.activa ?? true,
      duracion_partido: input.league.duracion_partido ?? undefined,
    };

    const liga = await createLeagueApi(sanitizedLeague);
    if (input.config) {
      await saveLeagueConfig(liga.id_liga, input.config);
    }
    return mapLigaToItem(liga, 'admin');
  } catch (error) {
    logger.error('leagueService/createLeagueWithConfig', 'Error al crear liga', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}

export async function fetchLeagueById(ligaId: string): Promise<LeagueItem | null> {
  try {
    const liga = await getLeagueByIdApi(Number(ligaId));
    return mapLigaToItem(liga, 'observer');
  } catch (error) {
    logger.error('leagueService/fetchLeagueById', `Error al obtener liga ${ligaId}`, {
      error: getErrorMessage(error),
    });
    return null;
  }
}

// ============================================================
// UTILIDADES LOCALES
// ============================================================

/**
 * Compatibilidad temporal: se mantiene la función para llamadas existentes.
 * Ya no debe depender de mocks para el flujo principal.
 */
export function getTeamById(_id: string): Team | undefined {
  return undefined;
}

export function toggleFavoriteLeague(user: User, leagueId: string): User {
  const isFavorite = user.favoriteLeagues.includes(leagueId);
  return {
    ...user,
    favoriteLeagues: isFavorite
      ? user.favoriteLeagues.filter((id) => id !== leagueId)
      : [...user.favoriteLeagues, leagueId],
  };
}

export function isLeagueFavorite(user: User, leagueId: string): boolean {
  return user.favoriteLeagues.includes(leagueId);
}

export function reactivateLeague(leagueId: string, leagues: LeagueItem[]): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId ? { ...league, status: 'active', canReactivate: false } : league,
  );
}

// ============================================================
// CONFIGURACIÓN DE LIGA
// ============================================================

export const DEFAULT_LEAGUE_CONFIG: Omit<LeagueConfigResponse, 'id_configuracion' | 'id_liga' | 'created_at' | 'updated_at'> = {
  hora_partidos: '17:00',
  min_equipos: 2,
  max_equipos: 20,
  min_convocados: 7,
  max_convocados: 18,
  min_plantilla: 7,
  max_plantilla: 25,
  min_jugadores_equipo: 7,
  min_partidos_entre_equipos: 1,
  minutos_partido: 90,
  // No se muestra en UI móvil, pero backend puede necesitarlo en el contrato.
  max_partidos: 30,
};

export async function getLeagueConfigService(ligaId: number): Promise<ServiceResult<LeagueConfigResponse>> {
  try {
    const data = await getLeagueConfigApi(ligaId);
    return { success: true, data };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    if (status === 404) {
      const defaultConfig: LeagueConfigResponse = {
        id_configuracion: 0,
        id_liga: ligaId,
        ...DEFAULT_LEAGUE_CONFIG,
      };
      return { success: true, data: defaultConfig };
    }

    logger.error('leagueService/getLeagueConfigService', 'Error obteniendo configuración', {
      ligaId,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudo cargar la configuración de la liga.' };
  }
}

export async function updateLeagueConfigService(
  ligaId: number,
  data: UpdateLeagueConfigRequest,
): Promise<ServiceResult<LeagueConfigResponse>> {
  try {
    const result = await updateLeagueConfig(ligaId, data);
    return { success: true, data: result };
  } catch (error) {
    logger.error('leagueService/updateLeagueConfigService', 'Error actualizando configuración', {
      ligaId,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudo guardar la configuración.' };
  }
}

export async function updateLeagueService(ligaId: number, data: LigaUpdateRequest): Promise<ServiceResult<LigaResponse>> {
  try {
    const result = await updateLeagueApi(ligaId, data);
    return { success: true, data: result };
  } catch (error) {
    logger.error('leagueService/updateLeagueService', 'Error actualizando liga', {
      ligaId,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudieron guardar los datos de la liga.' };
  }
}

async function saveOrUpdateLeagueConfigService(
  ligaId: number,
  config: UpdateLeagueConfigRequest,
  configExists?: boolean,
): Promise<ServiceResult<LeagueConfigResponse | undefined>> {
  try {
    if (configExists === false) {
      await setLeagueConfig(ligaId, config as LigaConfiguracionRequest);
      const created = await getLeagueConfigApi(ligaId);
      return { success: true, data: created };
    }

    const updated = await updateLeagueConfig(ligaId, config);
    return { success: true, data: updated };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    const msg = getErrorMessage(error);

    try {
      if (status === 404) {
        await setLeagueConfig(ligaId, config as LigaConfiguracionRequest);
        const created = await getLeagueConfigApi(ligaId);
        return { success: true, data: created };
      }
      if (msg.includes('ya tiene configuración')) {
        const updated = await updateLeagueConfig(ligaId, config);
        return { success: true, data: updated };
      }
    } catch (fallbackError) {
      logger.error('leagueService/saveOrUpdateLeagueConfigService', 'Fallback de config falló', {
        ligaId,
        error: getErrorMessage(fallbackError),
      });
      return { success: false, error: 'No se pudo guardar la configuración.' };
    }

    logger.error('leagueService/saveOrUpdateLeagueConfigService', 'Error guardando configuración', {
      ligaId,
      error: msg,
    });
    return { success: false, error: 'No se pudo guardar la configuración.' };
  }
}

export async function updateLeagueWithConfigService(input: {
  ligaId: number;
  league: LigaUpdateRequest;
  config: UpdateLeagueConfigRequest;
  configExists?: boolean;
}): Promise<ServiceResult> {
  const { ligaId, league, config, configExists } = input;

  // No se envía logo ni máximo de partidos desde UI móvil; la liga conserva
  // esos campos fuera del formulario para evitar falsas expectativas al usuario.
  const sanitizedLeague: LigaUpdateRequest = {
    nombre: league.nombre,
    temporada: league.temporada,
    categoria: league.categoria,
    activa: league.activa,
  };

  const leagueResult = await updateLeagueService(ligaId, sanitizedLeague);
  if (!leagueResult.success) {
    return { success: false, error: leagueResult.error };
  }

  const configResult = await saveOrUpdateLeagueConfigService(ligaId, config, configExists);
  if (!configResult.success) {
    return {
      success: false,
      error: configResult.error ?? 'Los datos de liga se guardaron pero falló la configuración.',
    };
  }

  return { success: true };
}

export async function deleteLeagueService(ligaId: number): Promise<ServiceResult> {
  try {
    await deleteLeagueApi(ligaId);
    return { success: true };
  } catch (error) {
    logger.error('leagueService/deleteLeagueService', 'Error eliminando liga', {
      ligaId,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudo eliminar la liga.' };
  }
}
