/**
 * League Service - Capa de acceso a datos de ligas
 *
 * Responsabilidades:
 * - Llamar a la API de ligas
 * - Mapear respuestas del backend al modelo de UI (LeagueItem)
 * - Proveer utilidades de manipulación local (favoritos, reactivación)
 */

import type { LeagueItem, LeagueRole } from "@/src/shared/types/league";
import type { Team } from "@/src/shared/types/team";
import type { User } from "@/src/shared/types/user";
import { logger } from "@/src/shared/utils/logger";
import { ApiError } from "@/src/shared/api/errors";
import {
  getMyLeagues,
  joinLeagueByCode as joinLeagueByCodeApi,
  getLeagueById as getLeagueByIdApi,
  createLeague as createLeagueApi,
  setLeagueConfig,
  updateLeagueConfig,
  getLeagueConfig as getLeagueConfigApi,
  updateLeague as updateLeagueApi,
  deleteLeague as deleteLeagueApi,
} from "../api/leagues.api";
import type {
  JoinLeagueByCodeResponse,
  LigaConRolResponse,
  LigaConfiguracionRequest,
  LigaCreateRequest,
  LigaResponse,
  LigaUpdateRequest,
  LeagueConfigResponse,
  UpdateLeagueConfigRequest,
} from "../types/league.api.types";
import { mockTeams } from "@/src/mocks/data";
import { toLeagueRole } from "@/src/shared/utils/roles";

// ============================================================
// MAPEO BACKEND → FRONTEND
// ============================================================

/**
 * Mapea rol de backend a LeagueRole de UI usando el normalizador compartido.
 * Esto mantiene el RoleBadge de tarjetas de liga y usuarios con la misma lógica.
 */
function mapRol(rol: string): LeagueRole {
  return toLeagueRole(rol);
}

/**
 * Mapea un item de GET /usuarios/me/ligas a LeagueItem de UI.
 * Valida que el objeto sea correcto antes de acceder a sus campos.
 */
function mapLeagueWithRoleToLeagueItem(league: LigaConRolResponse): LeagueItem {
  if (!league || typeof league.id_liga !== "number") {
    throw new ApiError(500, "Liga inválida recibida desde la API");
  }

  return {
    id: String(league.id_liga),
    name: league.nombre,
    season: league.temporada,
    status: league.activa ? "active" : "finished",
    role: mapRol(league.rol),
    isFavorite: false,
    teamsCount: league.equipos_total ?? 0,
    crestUrl: league.logo_url ?? null,
    canReactivate: !league.activa && mapRol(league.rol) === "admin",
  };
}

/** Mapea una LigaResponse (sin rol) a LeagueItem usando un rol explícito */
function mapLigaToItem(liga: LigaResponse, rol: string): LeagueItem {
  return {
    id: String(liga.id_liga),
    name: liga.nombre,
    season: liga.temporada,
    status: liga.activa ? "active" : "finished",
    role: mapRol(rol),
    isFavorite: false,
    teamsCount: liga.equipos_total ?? 0,
    crestUrl: liga.logo_url ?? null,
    canReactivate: !liga.activa && mapRol(rol) === "admin",
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
      throw new ApiError(500, "Respuesta inesperada al cargar ligas");
    }

    return ligasConRol.map(mapLeagueWithRoleToLeagueItem);
  } catch (error) {
    // warn, no error: el fallo de red/timeout está manejado por la UI y no debe abrir el red overlay
    logger.warn(
      "leagueService/fetchMyLeagues",
      "Error al obtener ligas del usuario",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }
}

/**
 * Une al usuario autenticado a una liga mediante código de unión.
 *
 * Flujo:
 * 1. POST endpoint de unión por código.
 * 2. Volver a leer GET /usuarios/me/ligas.
 * 3. Devolver las ligas ya mapeadas para que la UI use la API como fuente de verdad.
 */
export async function joinLeagueByCodeService(
  code: string,
): Promise<
  ServiceResult<{ response: JoinLeagueByCodeResponse; leagues: LeagueItem[] }>
> {
  const normalizedCode = code
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase();

  // Los códigos de unión generados por web/móvil son alfanuméricos.
  // Usamos la misma normalización que web para evitar que el flujo funcione
  // en una plataforma y falle en la otra.
  if (!/^[A-Z0-9]{6,12}$/.test(normalizedCode)) {
    return {
      success: false,
      error: "Introduce un código de unión válido.",
    };
  }

  try {
    const response = await joinLeagueByCodeApi(normalizedCode);
    const leagues = await fetchMyLeagues();

    return {
      success: true,
      data: {
        response,
        leagues,
      },
    };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 0;
    const message = error instanceof Error ? error.message : String(error);

    logger.warn(
      "leagueService/joinLeagueByCodeService",
      "Error al unirse a liga por código",
      {
        status,
        error: message,
      },
    );

    return {
      success: false,
      error:
        status === 409
          ? "Ya perteneces a esta liga."
          : status === 404 || status === 400
            ? "El código no existe o ha expirado."
            : message || "No se pudo unir a la liga con ese código.",
    };
  }
}

/**
 * Guarda la configuración de una liga.
 * Intenta POST (primera vez); si el backend ya creó una config por defecto, cae a PUT.
 */
async function saveLeagueConfig(
  ligaId: number,
  config: LigaConfiguracionRequest,
): Promise<void> {
  try {
    await setLeagueConfig(ligaId, config);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("ya tiene configuración")) {
      await updateLeagueConfig(ligaId, config);
    } else {
      throw err;
    }
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

    return mapLigaToItem(liga, "admin");
  } catch (error) {
    logger.error(
      "leagueService/createLeagueWithConfig",
      "Error al crear liga",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
    throw error;
  }
}

/**
 * Obtiene el detalle de una liga por ID desde el backend.
 */
export async function fetchLeagueById(
  ligaId: string,
): Promise<LeagueItem | null> {
  try {
    const liga = await getLeagueByIdApi(Number(ligaId));
    // El rol no está disponible aquí — se usa 'observer' como fallback seguro
    return mapLigaToItem(liga, "observer");
  } catch (error) {
    logger.error(
      "leagueService/fetchLeagueById",
      `Error al obtener liga ${ligaId}`,
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );
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
export function reactivateLeague(
  leagueId: string,
  leagues: LeagueItem[],
): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId
      ? { ...league, status: "active", canReactivate: false }
      : league,
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
export const DEFAULT_LEAGUE_CONFIG: Omit<
  LeagueConfigResponse,
  "id_configuracion" | "id_liga" | "created_at" | "updated_at"
> = {
  hora_partidos: "17:00",
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
      logger.warn(
        "leagueService/getLeagueConfigService",
        "Config no encontrada, usando defaults",
        { ligaId },
      );
      const defaultConfig: LeagueConfigResponse = {
        id_configuracion: 0,
        id_liga: ligaId,
        ...DEFAULT_LEAGUE_CONFIG,
      };
      return { success: true, data: defaultConfig };
    }

    logger.error(
      "leagueService/getLeagueConfigService",
      "Error obteniendo configuración",
      {
        ligaId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      success: false,
      error: "No se pudo cargar la configuración de la liga.",
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
    logger.error(
      "leagueService/updateLeagueConfigService",
      "Error actualizando configuración",
      {
        ligaId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      success: false,
      error: "No se pudo guardar la configuración.",
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
    logger.error(
      "leagueService/updateLeagueService",
      "Error actualizando liga",
      {
        ligaId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      success: false,
      error: "No se pudieron guardar los datos de la liga.",
    };
  }
}

/**
 * Elimina una liga desde el backend.
 * DELETE /ligas/{liga_id}
 */
export async function deleteLeagueService(
  ligaId: number,
): Promise<ServiceResult> {
  try {
    await deleteLeagueApi(ligaId);
    return { success: true };
  } catch (error) {
    logger.error(
      "leagueService/deleteLeagueService",
      "Error eliminando liga",
      {
        ligaId,
        error: error instanceof Error ? error.message : String(error),
      },
    );
    return {
      success: false,
      error: "No se pudo eliminar la liga.",
    };
  }
}

/**
 * Actualiza liga y configuración en un único flujo.
 *
 * Flujo:
 * 1. PUT /ligas/{liga_id}        → si falla, abortar sin tocar la config
 * 2. PUT /ligas/{liga_id}/configuracion → si falla, reportar error claro
 * 3. Si ambas van bien → { success: true }
 */
export async function updateLeagueWithConfigService(input: {
  ligaId: number;
  league: LigaUpdateRequest;
  config: UpdateLeagueConfigRequest;
  /**
   * true si la configuración ya existe en backend.
   * Si es false, intentamos crearla con POST y caemos a PUT si el backend indica que ya existía.
   */
  configExists?: boolean;
}): Promise<ServiceResult> {
  const { ligaId, league, config, configExists = true } = input;

  // Paso 1: actualizar datos básicos de la liga
  const leagueResult = await updateLeagueService(ligaId, league);
  if (!leagueResult.success) {
    return { success: false, error: leagueResult.error };
  }

  // Paso 2: guardar configuración solo si la liga se guardó bien.
  // Si no existía configuración, usamos el flujo POST con fallback a PUT.
  // Si ya existía, usamos PUT directamente.
  let configResult: ServiceResult<LeagueConfigResponse> | ServiceResult;

  if (configExists) {
    configResult = await updateLeagueConfigService(ligaId, config);
  } else {
    try {
      const fullConfig: LigaConfiguracionRequest = {
        hora_partidos: config.hora_partidos ?? DEFAULT_LEAGUE_CONFIG.hora_partidos,
        min_equipos: config.min_equipos ?? DEFAULT_LEAGUE_CONFIG.min_equipos,
        max_equipos: config.max_equipos ?? DEFAULT_LEAGUE_CONFIG.max_equipos,
        min_convocados: config.min_convocados ?? DEFAULT_LEAGUE_CONFIG.min_convocados,
        max_convocados: config.max_convocados ?? DEFAULT_LEAGUE_CONFIG.max_convocados,
        min_plantilla: config.min_plantilla ?? DEFAULT_LEAGUE_CONFIG.min_plantilla,
        max_plantilla: config.max_plantilla ?? DEFAULT_LEAGUE_CONFIG.max_plantilla,
        min_jugadores_equipo:
          config.min_jugadores_equipo ?? DEFAULT_LEAGUE_CONFIG.min_jugadores_equipo,
        min_partidos_entre_equipos:
          config.min_partidos_entre_equipos ?? DEFAULT_LEAGUE_CONFIG.min_partidos_entre_equipos,
        minutos_partido: config.minutos_partido ?? DEFAULT_LEAGUE_CONFIG.minutos_partido,
        max_partidos: config.max_partidos ?? DEFAULT_LEAGUE_CONFIG.max_partidos,
      };

      await saveLeagueConfig(ligaId, fullConfig);
      configResult = { success: true };
    } catch (error) {
      logger.error(
        "leagueService/updateLeagueWithConfigService",
        "Error creando configuración",
        {
          ligaId,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      configResult = {
        success: false,
        error: "No se pudo guardar la configuración.",
      };
    }
  }

  if (!configResult.success) {
    return {
      success: false,
      error:
        configResult.error ??
        "Los datos de liga se guardaron pero falló la configuración.",
    };
  }

  logger.info(
    "leagueService/updateLeagueWithConfigService",
    "Liga y config actualizadas",
    { ligaId },
  );
  return { success: true };
}
