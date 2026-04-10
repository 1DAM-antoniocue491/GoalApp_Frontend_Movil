/**
 * Store - Exportaciones centralizadas
 *
 * Importa stores desde un solo lugar:
 * @example
 * import { useActiveLeague, activeLeagueStore } from '@/src/store';
 */

export { useActiveLeague, useActiveLeagueRole, activeLeagueStore } from './activeLeagueStore';
export type { ActiveLeagueSession } from './activeLeagueStore';
