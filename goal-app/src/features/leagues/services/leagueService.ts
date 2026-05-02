/**
 * League Service - Capa de acceso a datos de ligas
 *
 * Responsabilidades:
 * - Llamar a la API de ligas
 * - Mapear respuestas del backend al modelo de UI (LeagueItem)
 * - Proveer utilidades de manipulación local (favoritos, reactivación)
 */

import type { LeagueItem, LeagueRole } from '@/src/shared/types/league';
import type { Team } from '@/src/shared/types/team';
import type { User } from '@/src/shared/types/user';
import { logger } from '@/src/shared/utils/logger';
import { ApiError } from '@/src/shared/api/errors';
import {
  getMyLeagues,
  getLeagueById as getLeagueByIdApi,
  createLeague as createLeagueApi,
  setLeagueConfig,
  updateLeagueConfig,
  getLeagueConfig as getLeagueConfigApi,
  updateLeague as updateLeagueApi,
  deleteLeague as deleteLeagueApi,
} from '../api/leagues.api';
import type {
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  UpdateLeagueConfigRequest,
} from '../types/league.api.types';
import { mockTeams } from '@/src/mocks/data';

// ============================================================
// MAPEO BACKEND → FRONTEND
// ============================================================

/** Mapea rol de backend a LeagueRole de UI */
function mapRol(rol: string): LeagueRole {
  switch (rol.toLowerCase()) {
    case 'admin':
    case 'administrador':
      return 'admin';
    case 'entrenador':
      return 'coach';
    case 'delegado':
    case 'delegado_campo':
      return 'field_delegate';
    case 'jugador':
      return 'player';
    case 'observador':
    default:
      return 'observer';
  }
}

/**
 * Mapea un item de GET /usuarios/me/ligas a LeagueItem de UI.
 * Valida que el objeto sea correcto antes de acceder a sus campos.
 */
function mapLeagueWithRoleToLeagueItem(league: LigaConRolResponse): LeagueItem {
  if (!league || typeof league.id_liga !== 'number') {
    throw new ApiError(500, 'Liga inválida recibida desde la API');
  }

  return {
    id: String(league.id_liga),
    name: league.nombre,
    season: league.temporada,
    status: league.activa ? 'active' : 'finished',
    role: mapRol(league.rol),
    isFavorite: false,
    teamsCount: league.equipos_total ?? 0,
    crestUrl: league.logo_url ?? null,
    canReactivate: !league.activa && mapRol(league.rol) === 'admin',
    categoria: league.categoria,
  };
}

/** Mapea una LigaResponse (sin rol) a LeagueItem usando un rol explícito */
function mapLigaToItem(liga: LigaResponse, rol: string): LeagueItem {
  return {
    id: String(liga.id_liga),
    name: liga.nombre,
    season: liga.temporada,
    status: liga.activa ? 'active' : 'finished',
    role: mapRol(rol),
    isFavorite: false,
    teamsCount: liga.equipos_total ?? 0,
    crestUrl: liga.logo_url ?? null,
    canReactivate: !liga.activa && mapRol(rol) === 'admin',
    categoria: liga.categoria,
  };
}

// ============================================================
// FUNCIONES DE API
// ============================================================

/**
 * Obtiene las ligas del usuario autenticado desde el backend
 * y las mapea al modelo de UI.
 */
export async function fetchMyLeagues(): Promise<LeagueItem[]> {
  try {
    const ligasConRol = await getMyLeagues();

    if (!Array.isArray(ligasConRol)) {
      throw new ApiError(500, 'Respuesta inesperada al cargar ligas');
    }

    return ligasConRol.map(mapLeagueWithRoleToLeagueItem);
  } catch (error) {
    // warn, no error: el fallo de red/timeout está manejado por la UI y no debe abrir el red overlay
    logger.warn('leagueService/fetchMyLeagues', 'Error al obtener ligas del usuario', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Guarda la configuración de una liga por primera vez (uso interno de createLeagueWithConfig).
 * Intenta POST; si el backend ya creó una config por defecto, cae a PUT.
 */
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

/**
 * Guarda o actualiza la configuración de una liga de forma robusta.
 *
 * Lógica:
 * - configExists === true  → intenta PUT primero; si 404, cae a POST
 * - configExists === false → intenta POST primero; si "ya existe" o 409, cae a PUT
 *
 * Esto cubre el caso en que getLeagueConfigService devolvió defaults (id_configuracion === 0),
 * es decir, la config realmente no existe en backend y hay que crearla con POST.
 */
export async function saveOrUpdateLeagueConfigService(
  ligaId: number,
  config: UpdateLeagueConfigRequest,
  configExists: boolean,
): Promise<ServiceResult> {
  logger.debug('league/config', 'saveOrUpdateLeagueConfig', {
    ligaId,
    configExists,
    configKeys: Object.keys(config),
  });

  if (configExists) {
    // La config existe: PUT primero
    try {
      await updateLeagueConfig(ligaId, config);
      logger.debug('league/config', 'PUT configuración OK', { ligaId });
      return { success: true };
    } catch (putErr) {
      const status = putErr instanceof ApiError ? putErr.status : 0;
      if (status !== 404) {
        logger.error('leagueService/saveOrUpdateLeagueConfig', 'PUT config falló', {
          ligaId,
          status,
          error: putErr instanceof Error ? putErr.message : String(putErr),
        });
        return { success: false, error: 'No se pudo guardar la configuración.' };
      }
      // PUT devolvió 404: la config fue eliminada → continuar a POST
      logger.warn('league/config', 'PUT 404 → intentando POST', { ligaId });
    }
  }

  // La config no existe (o PUT falló con 404): POST
  try {
    // Para POST necesitamos todos los campos; rellenamos los opcionales que falten con defaults
    const fullConfig: LigaConfiguracionRequest = {
      hora_partidos: config.hora_partidos ?? DEFAULT_LEAGUE_CONFIG.hora_partidos,
      min_equipos: config.min_equipos ?? DEFAULT_LEAGUE_CONFIG.min_equipos,
      max_equipos: config.max_equipos ?? DEFAULT_LEAGUE_CONFIG.max_equipos,
      min_convocados: config.min_convocados ?? DEFAULT_LEAGUE_CONFIG.min_convocados,
      max_convocados: config.max_convocados ?? DEFAULT_LEAGUE_CONFIG.max_convocados,
      min_plantilla: config.min_plantilla ?? DEFAULT_LEAGUE_CONFIG.min_plantilla,
      max_plantilla: config.max_plantilla ?? DEFAULT_LEAGUE_CONFIG.max_plantilla,
      min_jugadores_equipo: config.min_jugadores_equipo ?? DEFAULT_LEAGUE_CONFIG.min_jugadores_equipo,
      min_partidos_entre_equipos: config.min_partidos_entre_equipos ?? DEFAULT_LEAGUE_CONFIG.min_partidos_entre_equipos,
      minutos_partido: config.minutos_partido ?? DEFAULT_LEAGUE_CONFIG.minutos_partido,
      max_partidos: config.max_partidos ?? DEFAULT_LEAGUE_CONFIG.max_partidos,
    };
    await setLeagueConfig(ligaId, fullConfig);
    logger.debug('league/config', 'POST configuración OK', { ligaId });
    return { success: true };
  } catch (postErr) {
    const msg = postErr instanceof Error ? postErr.message : '';
    const status = postErr instanceof ApiError ? postErr.status : 0;
    const alreadyExists = msg.includes('ya tiene configuración') || status === 409;

    if (alreadyExists) {
      // El backend dice que ya existe: intentar PUT
      logger.warn('league/config', 'POST ya existe → intentando PUT', { ligaId });
      try {
        await updateLeagueConfig(ligaId, config);
        logger.debug('league/config', 'PUT fallback OK', { ligaId });
        return { success: true };
      } catch (putFallbackErr) {
        logger.error('leagueService/saveOrUpdateLeagueConfig', 'PUT fallback falló', {
          ligaId,
          error: putFallbackErr instanceof Error ? putFallbackErr.message : String(putFallbackErr),
        });
        return { success: false, error: 'No se pudo guardar la configuración.' };
      }
    }

    logger.error('leagueService/saveOrUpdateLeagueConfig', 'POST config falló', {
      ligaId,
      status,
      error: msg,
    });
    return { success: false, error: 'No se pudo guardar la configuración.' };
  }
}

/**
 * Crea una liga y opcionalmente su configuración.
 *
 * Flujo:
 * 1. POST /ligas/ con input.league
 * 2. Obtener id_liga de la respuesta
 * 3. Si hay input.config → saveLeagueConfig(id_liga, input.config)
 * 4. Devolver el LeagueItem mapeado
 */
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
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Obtiene el detalle de una liga por ID desde el backend.
 */
export async function fetchLeagueById(ligaId: string): Promise<LeagueItem | null> {
  try {
    const liga = await getLeagueByIdApi(Number(ligaId));
    // El rol no está disponible aquí — se usa 'observer' como fallback seguro
    return mapLigaToItem(liga, 'observer');
  } catch (error) {
    logger.error('leagueService/fetchLeagueById', `Error al obtener liga ${ligaId}`, {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

// ============================================================
// UTILIDADES LOCALES (sin llamada a API)
// ============================================================

/** Obtiene un equipo por ID desde mocks (mientras no haya endpoint de equipos) */
export function getTeamById(id: string): Team | undefined {
  return mockTeams.find((team) => team.id === id);
}

/** Alterna el estado de favorito para una liga en la lista local */
export function toggleFavoriteLeague(user: User, leagueId: string): User {
  const isFavorite = user.favoriteLeagues.includes(leagueId);
  return {
    ...user,
    favoriteLeagues: isFavorite
      ? user.favoriteLeagues.filter((id) => id !== leagueId)
      : [...user.favoriteLeagues, leagueId],
  };
}

/** Verifica si una liga es favorita del usuario */
export function isLeagueFavorite(user: User, leagueId: string): boolean {
  return user.favoriteLeagues.includes(leagueId);
}

/**
 * Reactiva una liga finalizada en la lista local.
 * Cuando el backend exponga el endpoint (POST /ligas/:id/reactivate),
 * añadir la llamada HTTP aquí antes de actualizar el estado local.
 */
export function reactivateLeague(leagueId: string, leagues: LeagueItem[]): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId
      ? { ...league, status: 'active', canReactivate: false }
      : league
  );
}

// ============================================================
// CONFIGURACIÓN DE LIGA — GET / UPDATE
// ============================================================

/**
 * Configuración por defecto para ligas sin configuración guardada.
 * Se usa como fallback cuando el backend devuelve 404 en /configuracion.
 * TODO: el backend debería crear una configuración por defecto al crear la liga.
 */
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
  max_partidos: 30,
};

/**
 * Resultado genérico de operaciones de mutación.
 * Las mutaciones no lanzan errores: siempre devuelven { success, data?, error }.
 */
export interface ServiceResult<T = undefined> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Obtiene la configuración de una liga.
 * Si el backend devuelve 404 (sin configuración guardada), devuelve los defaults
 * en lugar de romper la UI.
 */
export async function getLeagueConfigService(
  ligaId: number,
): Promise<ServiceResult<LeagueConfigResponse>> {
  try {
    const data = await getLeagueConfigApi(ligaId);
    return { success: true, data };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;

    if (status === 404) {
      // Sin configuración guardada: devolver defaults para que el formulario pueda mostrar algo.
      // TODO: el backend debería crear la config por defecto al crear la liga.
      logger.warn('leagueService/getLeagueConfigService', 'Config no encontrada, usando defaults', { ligaId });
      const defaultConfig: LeagueConfigResponse = {
        id_configuracion: 0,
        id_liga: ligaId,
        ...DEFAULT_LEAGUE_CONFIG,
      };
      return { success: true, data: defaultConfig };
    }

    logger.error('leagueService/getLeagueConfigService', 'Error obteniendo configuración', {
      ligaId,
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'No se pudo cargar la configuración de la liga.',
    };
  }
}

/**
 * Actualiza la configuración de una liga existente.
 * PUT /ligas/{liga_id}/configuracion
 */
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
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'No se pudo guardar la configuración.',
    };
  }
}

/**
 * Actualiza datos básicos de una liga.
 * PUT /ligas/{liga_id}
 */
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
      error: error instanceof Error ? error.message : String(error),
    });
    return {
      success: false,
      error: 'No se pudieron guardar los datos de la liga.',
    };
  }
}

/**
 * Actualiza liga y configuración en un único flujo.
 *
 * Flujo:
 * 1. PUT /ligas/{liga_id}        → si falla, abortar sin tocar la config
 * 2. saveOrUpdateLeagueConfigService → solo si hay campos de config que cambiar
 * 3. Si ambas van bien → { success: true }
 *
 * configExists: si es true intenta PUT primero; si false intenta POST primero.
 * Por defecto true (liga editada ya debería tener config).
 */
export async function updateLeagueWithConfigService(input: {
  ligaId: number;
  league: LigaUpdateRequest;
  config: UpdateLeagueConfigRequest;
  configExists?: boolean;
}): Promise<ServiceResult> {
  const { ligaId, league, config, configExists = true } = input;

  // Paso 1: actualizar datos básicos de la liga
  const leagueResult = await updateLeagueService(ligaId, league);
  if (!leagueResult.success) {
    return { success: false, error: leagueResult.error };
  }

  // Paso 2: actualizar configuración solo si hay campos de config que cambiar
  const hasConfigChanges = Object.keys(config).length > 0;
  if (!hasConfigChanges) {
    logger.info('leagueService/updateLeagueWithConfigService', 'Liga actualizada (sin cambios de config)', { ligaId });
    return { success: true };
  }

  const configResult = await saveOrUpdateLeagueConfigService(ligaId, config, configExists);
  if (!configResult.success) {
    return {
      success: false,
      error: configResult.error ?? 'Los datos de liga se guardaron pero falló la configuración.',
    };
  }

  logger.info('leagueService/updateLeagueWithConfigService', 'Liga y config actualizadas', { ligaId });
  return { success: true };
}

/**
 * Elimina una liga por ID.
 * DELETE /ligas/{liga_id}
 * Solo admins. Acción irreversible.
 */
export async function deleteLeagueService(ligaId: number): Promise<ServiceResult> {
  try {
    await deleteLeagueApi(ligaId);
    logger.info('leagueService/deleteLeagueService', 'Liga eliminada', { ligaId });
    return { success: true };
  } catch (error) {
    logger.error('leagueService/deleteLeagueService', 'Error eliminando liga', {
      ligaId,
      error: error instanceof Error ? error.message : String(error),
    });
    return { success: false, error: 'No se pudo eliminar la liga.' };
  }
}
