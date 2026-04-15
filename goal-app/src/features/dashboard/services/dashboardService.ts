import type { LeagueRole } from "@/src/shared/types/league";

/**
 * Obtiene permisos del dashboard según el rol
 */
export function getDashboardPermissionsByRole(role: LeagueRole): string[] {
  const permissions: Record<LeagueRole, string[]> = {
    admin: [
      'overview',
      'teams',
      'matches',
      'players',
      'settings',
      'reports',
      'referees',
      'discipline',
    ],
    coach: ['overview', 'matches', 'players', 'reports'],
    player: ['overview', 'matches', 'reports'],
    field_delegate: ['overview', 'matches', 'reports', 'discipline'],
  };

  return permissions[role] || [];
}

/**
 * Obtiene el saludo según el rol del usuario
 */
export function getRoleGreeting(role: LeagueRole): string {
  const greetings: Record<LeagueRole, string> = {
    admin: 'Panel de Administración',
    coach: 'Panel del Entrenador',
    player: 'Panel del Jugador',
    field_delegate: 'Panel del Delegado',
  };

  return greetings[role];
}