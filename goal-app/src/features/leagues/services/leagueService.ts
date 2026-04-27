import type { LeagueItem, LeagueRole } from "@/src/shared/types/league";
import type { User } from "@/src/shared/types/user";
import type { Team } from "@/src/shared/types/team";
import { mockLeagues, mockTeams } from "@/src/mocks/data";

/**
 * Obtiene una liga por ID
 */
export function getLeagueById(id: string): LeagueItem | undefined {
  return mockLeagues.find((league) => league.id === id);
}

/**
 * Obtiene un equipo por ID
 */
export function getTeamById(id: string): Team | undefined {
  return mockTeams.find((team) => team.id === id);
}

/**
 * Alterna el estado de favorito para una liga
 */
export function toggleFavoriteLeague(user: User, leagueId: string): User {
  const isFavorite = user.favoriteLeagues.includes(leagueId);

  return {
    ...user,
    favoriteLeagues: isFavorite
      ? user.favoriteLeagues.filter((id) => id !== leagueId)
      : [...user.favoriteLeagues, leagueId],
  };
}

/**
 * Verifica si una liga es favorita del usuario
 */
export function isLeagueFavorite(user: User, leagueId: string): boolean {
  return user.favoriteLeagues.includes(leagueId);
}

/**
 * Obtiene todas las ligas
 */
export function getAllLeagues(): LeagueItem[] {
  return mockLeagues;
}

/**
 * Obtiene ligas con información de rol para onboarding
 */
export function getLeaguesWithRoles(): LeagueItem[] {
  return mockLeagues;
}

/**
 * Reactiva una liga finalizada.
 * Preserva todos los datos existentes — solo cambia status a 'active'
 * y desactiva el flag canReactivate.
 *
 * Recibe la lista actual de ligas y devuelve la lista actualizada.
 * Cuando el backend esté disponible, añadir aquí la llamada HTTP
 * (POST /leagues/:id/reactivate) antes de actualizar el estado local.
 */
export function reactivateLeague(
  leagueId: string,
  leagues: LeagueItem[]
): LeagueItem[] {
  return leagues.map((league) =>
    league.id === leagueId
      ? { ...league, status: 'active', canReactivate: false }
      : league
  );
}