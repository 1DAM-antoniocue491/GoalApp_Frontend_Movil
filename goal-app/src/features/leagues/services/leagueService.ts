/**
 * League Service - Capa de acceso a datos de ligas.
 *
 * Responsabilidades:
 * - Llamar a la API de ligas.
 * - Mapear respuestas del backend al modelo de UI (LeagueItem).
 * - Enriquecer tarjetas con el equipo asignado del usuario cuando aplica.
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

/** Mapea rol de backend a LeagueRole de UI. */
function mapRol(rol: string): LeagueRole {
  return toLeagueRole(rol);
}

function getLeagueTeamFromInlineFields(league: LigaConRolResponse): Pick<LeagueItem, 'teamId' | 'teamName'> {
  const rawTeamId =
    league.id_equipo ??
    league.equipo_id ??
    league.equipo?.id_equipo ??
    league.equipo?.id ??
    null;

  const rawTeamName =
    league.nombre_equipo ??
    league.equipo_nombre ??
    league.mi_equipo ??
    league.miEquipo ??
    league.equipo?.nombre ??
    null;

  return {
    teamId: rawTeamId != null ? String(rawTeamId) : undefined,
    teamName: safeString(rawTeamName) || undefined,
  };
}

function mapMyTeamResponseToLeaguePatch(team: MyTeamInLeagueResponse): Pick<LeagueItem, 'teamId' | 'teamName'> {
  const teamId = team.id_equipo ?? team.id ?? null;
  const teamName = safeString(team.nombre);

  return {
    teamId: teamId != null ? String(teamId) : undefined,
    teamName: teamName || undefined,
  };
}

function shouldLoadMyTeamForRole(role: LeagueRole): boolean {
  return role === 'coach' || role === 'player' || role === 'field_delegate';
}

// ============================================================
// MAPEO BACKEND → FRONTEND
// ============================================================

function mapLeagueWithRoleToLeagueItem(league: LigaConRolResponse): LeagueItem {
  if (!league || typeof league.id_liga !== 'number') {
    throw new ApiError(500, 'Liga inválida recibida desde la API');
  }

  const role = mapRol(league.rol);
  const inlineTeam = getLeagueTeamFromInlineFields(league);

  return {
    id: String(league.id_liga),
    name: safeString(league.nombre, 'Liga sin nombre'),
    season: safeString(league.temporada, '-'),
    status: league.activa ? 'active' : 'finished',
    role,
    isFavorite: false,
    teamId: inlineTeam.teamId,
    teamName: inlineTeam.teamName,
    teamsCount: league.equipos_total ?? 0,
    crestUrl: league.logo_url ?? null,
    categoria: league.categoria ?? undefined,
    canReactivate: !league.activa && role === 'admin',
  };
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
    crestUrl: liga.logo_url ?? null,
    categoria: liga.categoria ?? undefined,
    canReactivate: !liga.activa && role === 'admin',
  };
}

// ============================================================
// LIGAS DEL USUARIO + EQUIPO ASIGNADO
// ============================================================

/**
 * Enriquecimiento no crítico para mostrar "Mi equipo" en LeagueCard.
 *
 * El endpoint /usuarios/me/ligas no incluye equipo asignado en el OpenAPI actual.
 * Para roles vinculados a equipo se consulta /equipos/usuario/mi-equipo por liga.
 * Si falla con 404, la card mostrará "Sin asignar" sin romper la pantalla.
 */
export async function enrichLeagueTeamAssignments(leagues: LeagueItem[]): Promise<LeagueItem[]> {
  const enriched = await Promise.all(
    leagues.map(async (league) => {
      if (!shouldLoadMyTeamForRole(league.role) || league.teamName) {
        return league;
      }

      try {
        const team = await getMyTeamInLeague(Number(league.id));
        return {
          ...league,
          ...mapMyTeamResponseToLeaguePatch(team),
        };
      } catch (error) {
        const status = error instanceof ApiError ? error.status : 0;

        // 404 es normal para usuarios sin equipo todavía; no debe romper ni llenar LogBox.
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

  return enriched;
}

export async function fetchMyLeagues(options?: { enrichTeams?: boolean }): Promise<LeagueItem[]> {
  try {
    const ligasConRol = await getMyLeagues();

    if (!Array.isArray(ligasConRol)) {
      throw new ApiError(500, 'Respuesta inesperada al cargar ligas');
    }

    const mapped = ligasConRol.map(mapLeagueWithRoleToLeagueItem);

    if (options?.enrichTeams === false) {
      return mapped;
    }

    return enrichLeagueTeamAssignments(mapped);
  } catch (error) {
    logger.warn('leagueService/fetchMyLeagues', 'Error al obtener ligas del usuario', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}

/**
 * Une al usuario autenticado a una liga con el mismo flujo que web:
 * 1. GET /invitaciones/validar-codigo/{codigo}
 * 2. POST /invitaciones/aceptar-codigo/{codigo} con body {}
 * 3. Refrescar /usuarios/me/ligas desde API.
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
          ? 'Ya perteneces a esta liga.'
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
    const msg = err instanceof Error ? err.message : '';
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

export function reactivateLeague(leagueId: string, leagues: LeagueItem[]): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId ? { ...league, status: 'active', canReactivate: false } : league,
  );
}

// ============================================================
// CONFIGURACIÓN DE LIGA — GET / UPDATE / DELETE
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

