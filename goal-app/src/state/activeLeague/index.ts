/**
 * Store - Exportaciones centralizadas
 *
 * Importa stores desde un solo lugar:
 * @example
 * import { useActiveLeague, activeLeagueStore } from '@/src/state/activeLeague';
 */

export {
  useActiveLeague,
  useActiveLeagueRole,
  activeLeagueStore,
} from "@/src/state/activeLeague/activeLeagueStore";
export type { ActiveLeagueSession } from "@/src/state/activeLeague/activeLeagueStore";
