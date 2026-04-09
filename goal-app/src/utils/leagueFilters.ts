/**
 * Utilidades para filtrar y buscar ligas
 *
 * Funciones puras para filtrar el array de ligas
 * según el filtro seleccionado y término de búsqueda.
 */

import { LeagueItem, LeagueFilter } from '@/src/types/league';

/**
 * Filtra un array de ligas según el filtro y término de búsqueda
 */
export function filterLeagues(
  leagues: LeagueItem[],
  filter: LeagueFilter,
  searchTerm: string
): LeagueItem[] {
  let result = [...leagues];

  // Aplicar filtro por estado/favoritos
  switch (filter) {
    case 'active':
      result = result.filter((league) => league.status === 'active');
      break;
    case 'finished':
      result = result.filter((league) => league.status === 'finished');
      break;
    case 'favorites':
      result = result.filter((league) => league.isFavorite);
      break;
    case 'all':
    default:
      // No filtrar por estado
      break;
  }

  // Aplicar búsqueda por nombre (case insensitive)
  if (searchTerm.trim()) {
    const term = searchTerm.toLowerCase().trim();
    result = result.filter((league) =>
      league.name.toLowerCase().includes(term)
    );
  }

  return result;
}

/**
 * Verifica si una liga coincide con el término de búsqueda
 */
export function matchesSearch(league: LeagueItem, searchTerm: string): boolean {
  if (!searchTerm.trim()) {
    return true;
  }
  const term = searchTerm.toLowerCase().trim();
  return league.name.toLowerCase().includes(term);
}

/**
 * Verifica si una liga coincide con el filtro seleccionado
 */
export function matchesFilter(league: LeagueItem, filter: LeagueFilter): boolean {
  switch (filter) {
    case 'active':
      return league.status === 'active';
    case 'finished':
      return league.status === 'finished';
    case 'favorites':
      return league.isFavorite;
    case 'all':
    default:
      return true;
  }
}
