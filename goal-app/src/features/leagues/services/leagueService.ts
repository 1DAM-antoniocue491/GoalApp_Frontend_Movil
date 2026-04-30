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
import { getMyLeagues, getLeagueById as getLeagueByIdApi, createLeague as createLeagueApi, setLeagueConfig, updateLeagueConfig } from '../api/leagues.api';
import type { LigaConRolResponse, LigaConfiguracionRequest, LigaCreateRequest, LigaResponse } from '../types/league.api.types';
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
 * Guarda la configuración de una liga.
 * Intenta POST (primera vez); si el backend ya creó una config por defecto, cae a PUT.
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
