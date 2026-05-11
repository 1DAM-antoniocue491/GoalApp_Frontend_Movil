/**
 * League Service - Capa de dominio para ligas.
 *
 * Responsabilidades:
 * - Convertir respuestas backend a LeagueItem.
 * - Unificar favoritos persistentes con /usuarios/me/ligas-seguidas.
 * - Reactivar ligas contra API, no con estado local temporal.
 * - Mantener el onboarding rápido: equipo asignado se enriquece en segundo plano.
 */

import type { LeagueItem, LeagueRole } from '@/src/shared/types/league';
import type { Team } from '@/src/shared/types/team';
import type { User } from '@/src/shared/types/user';
import { logger } from '@/src/shared/utils/logger';
import { ApiError } from '@/src/shared/api/errors';
import { toLeagueRole } from '@/src/shared/utils/roles';
import {
  acceptJoinCode,
  createLeague as createLeagueApi,
  deleteLeague as deleteLeagueApi,
  followLeague,
  getFollowedLeagues,
  getLeagueById as getLeagueByIdApi,
  getLeagueConfig as getLeagueConfigApi,
  getMyLeagues,
  getMyTeamInLeague,
  reactivateLeague as reactivateLeagueApi,
  setLeagueConfig,
  unfollowLeague,
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

function mapRol(rol?: string | null): LeagueRole {
  return toLeagueRole(rol);
}

function shouldLoadMyTeamForRole(role: LeagueRole): boolean {
  return role === 'coach' || role === 'player' || role === 'field_delegate';
}

function mapMyTeamResponseToPatch(team: MyTeamInLeagueResponse): Partial<LeagueItem> {
  const teamId = team.id_equipo ?? team.id ?? null;
  const teamName = safeString(team.nombre);

  return {
    ...(teamId != null ? { teamId: String(teamId) } : {}),
    ...(teamName ? { teamName } : {}),
  } as Partial<LeagueItem>;
}

function buildFollowedIdSet(ids: number[]): Set<number> {
  return new Set(ids.filter((id) => Number.isFinite(id)));
}

function mapLeagueWithRoleToLeagueItem(
  league: LigaConRolResponse,
  followedLeagueIds: Set<number>,
): LeagueItem {
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
    /**
     * Favorito persistente: se cruza con GET /usuarios/me/ligas-seguidas.
     * No se calcula localmente porque debe sobrevivir a recargas de app.
     */
    isFavorite: followedLeagueIds.has(league.id_liga),
    teamsCount: league.equipos_total ?? 0,
    // La UI móvil no usa logo remoto; LeagueCard genera un escudo visual premium.
    crestUrl: null,
    categoria: league.categoria ?? undefined,
    canReactivate: !league.activa && role === 'admin',
    ...(inlineTeamId != null ? { teamId: String(inlineTeamId) } : {}),
    ...(inlineTeamName ? { teamName: inlineTeamName } : {}),
  } as LeagueItem;
}

function mapLigaToItem(liga: LigaResponse, rol: string, isFavorite = false): LeagueItem {
  const role = mapRol(rol);
  return {
    id: String(liga.id_liga),
    name: safeString(liga.nombre, 'Liga sin nombre'),
    season: safeString(liga.temporada, '-'),
    status: liga.activa ? 'active' : 'finished',
    role,
    isFavorite,
    teamsCount: liga.equipos_total ?? 0,
    crestUrl: null,
    categoria: liga.categoria ?? undefined,
    canReactivate: !liga.activa && role === 'admin',
  };
}

/**
 * Consulta favoritos sin bloquear el onboarding si falla.
 * Si el endpoint cae, la app sigue funcionando; simplemente no marca estrellas.
 */
async function fetchFollowedLeagueIds(): Promise<number[]> {
  try {
    const followed = (await getFollowedLeagues()) as unknown[];
    // Algunos despliegues devuelven objetos { id_liga }, otros solo IDs.
    // Este mapper tolerante evita perder favoritos si cambia la forma de respuesta.
    return followed
      .map((item) => (typeof item === 'number' ? item : Number((item as { id_liga?: number })?.id_liga)))
      .filter((id) => Number.isFinite(id));
  } catch (error) {
    logger.warn('leagueService/fetchFollowedLeagueIds', 'No se pudieron cargar ligas seguidas', {
      error: getErrorMessage(error),
    });
    return [];
  }
}

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
    const [ligasConRol, followedIds] = await Promise.all([getMyLeagues(), fetchFollowedLeagueIds()]);

    if (!Array.isArray(ligasConRol)) {
      throw new ApiError(500, 'Respuesta inesperada al cargar ligas');
    }

    const followedSet = buildFollowedIdSet(followedIds);
    const mapped = ligasConRol.map((league) => mapLeagueWithRoleToLeagueItem(league, followedSet));
    return options?.enrichTeams === false ? mapped : enrichLeagueTeamAssignments(mapped);
  } catch (error) {
    logger.warn('leagueService/fetchMyLeagues', 'Error al obtener ligas del usuario', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/** Alterna favorito en API y devuelve la lista refrescada desde backend. */
export async function toggleFavoriteLeagueService(
  leagueId: string,
  currentIsFavorite: boolean,
): Promise<ServiceResult<LeagueItem[]>> {
  const ligaId = Number(leagueId);
  if (!Number.isFinite(ligaId)) {
    return { success: false, error: 'Liga no válida.' };
  }

  try {
    if (currentIsFavorite) {
      await unfollowLeague(ligaId);
    } else {
      await followLeague(ligaId);
    }

    // La fuente de verdad vuelve a ser la API para que el favorito sobreviva a recargas.
    const leagues = await fetchMyLeagues({ enrichTeams: true });
    return { success: true, data: leagues };
  } catch (error) {
    logger.warn('leagueService/toggleFavoriteLeagueService', 'Error alternando favorito', {
      ligaId,
      currentIsFavorite,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudo actualizar el favorito.' };
  }
}

/** Reactiva una liga finalizada y devuelve ligas refrescadas desde API. */
export async function reactivateLeagueService(leagueId: string): Promise<ServiceResult<LeagueItem[]>> {
  const ligaId = Number(leagueId);
  if (!Number.isFinite(ligaId)) {
    return { success: false, error: 'Liga no válida.' };
  }

  try {
    await reactivateLeagueApi(ligaId);
    const leagues = await fetchMyLeagues({ enrichTeams: true });
    return { success: true, data: leagues };
  } catch (error) {
    logger.warn('leagueService/reactivateLeagueService', 'Error reactivando liga', {
      ligaId,
      error: getErrorMessage(error),
    });
    return { success: false, error: 'No se pudo reactivar la liga.' };
  }
}

/**
 * Une al usuario autenticado a una liga usando el flujo real de web:
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
    const liga = await createLeagueApi(input.league);

    if (input.config) {
      await saveLeagueConfig(liga.id_liga, input.config);
    }

    return mapLigaToItem(liga, 'admin', false);
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
    return mapLigaToItem(liga, 'observer', false);
  } catch (error) {
    logger.error('leagueService/fetchLeagueById', `Error al obtener liga ${ligaId}`, {
      error: getErrorMessage(error),
    });
    return null;
  }
}

// ============================================================
// Compatibilidad con código antiguo
// ============================================================

export function getTeamById(_id: string): Team | undefined {
  // Ya no usamos mocks para asociar equipos en cards. La asociación real se obtiene por API.
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

/**
 * Fallback local antiguo. Mantenerlo exportado evita roturas en imports viejos,
 * pero el onboarding debe usar reactivateLeagueService para persistir en backend.
 */
export function reactivateLeague(leagueId: string, leagues: LeagueItem[]): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId ? { ...league, status: 'active', canReactivate: false } : league,
  );
}

// ============================================================
// Configuración de liga
// ============================================================

export const DEFAULT_LEAGUE_CONFIG: Omit<
  LeagueConfigResponse,
  'id_configuracion' | 'id_liga' | 'created_at' | 'updated_at'
> = {
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
  // Campo backend conservado para compatibilidad, aunque ya no se edita en el modal móvil.
  max_partidos: 30,
};

export async function getLeagueConfigService(ligaId: number): Promise<ServiceResult<LeagueConfigResponse>> {
  try {
    const data = await getLeagueConfigApi(ligaId);
    return { success: true, data };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;

    if (status === 404) {
      logger.warn('leagueService/getLeagueConfigService', 'Config no encontrada, usando defaults', { ligaId });
      return {
        success: true,
        data: {
          id_configuracion: 0,
          id_liga: ligaId,
          ...DEFAULT_LEAGUE_CONFIG,
        },
      };
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

export async function updateLeagueService(
  ligaId: number,
  data: LigaUpdateRequest,
): Promise<ServiceResult<LigaResponse>> {
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

export async function updateLeagueWithConfigService(input: {
  ligaId: number;
  league: LigaUpdateRequest;
  config: UpdateLeagueConfigRequest;
  configExists?: boolean;
}): Promise<ServiceResult> {
  const { ligaId, league, config } = input;

  const leagueResult = await updateLeagueService(ligaId, league);
  if (!leagueResult.success) return { success: false, error: leagueResult.error };

  const configResult = await updateLeagueConfigService(ligaId, config);
  if (!configResult.success) {
    return {
      success: false,
      error: configResult.error ?? 'Los datos de liga se guardaron pero falló la configuración.',
    };
  }

  logger.info('leagueService/updateLeagueWithConfigService', 'Liga y config actualizadas', { ligaId });
  return { success: true };
}
