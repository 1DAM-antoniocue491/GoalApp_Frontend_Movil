/**
 * dashboardService.ts
 *
 * Lógica de aplicación del dashboard: permisos, saludos, utilidades de rol.
 *
 * RESPONSABILIDAD:
 * Contiene funciones puras que encapsulan las reglas de negocio del dashboard.
 * No importa React. No hace fetch. No tiene efectos secundarios.
 *
 * REGLA: La lógica de permisos NO se hardcodea en los componentes.
 * Los componentes llaman a estas funciones para determinar qué renderizar.
 *
 * Si el backend evoluciona para devolver permisos en el token/sesión,
 * las funciones aquí se adaptan sin tocar los componentes.
 */

import type { LeagueRole } from "@/src/shared/types/league";

// ---------------------------------------------------------------------------
// Permisos por rol
// Fuente de verdad de qué puede hacer cada rol en el dashboard.
// ---------------------------------------------------------------------------

/**
 * Conjunto tipado de permisos del dashboard.
 * Usar como guard en los componentes:
 *   const perms = getDashboardPermissions(role);
 *   if (perms.canRegisterEvent) { ... }
 */
export interface DashboardPermissions {
  /** Puede registrar eventos (gol, tarjeta, sustitución) en un partido en vivo */
  canRegisterEvent: boolean;
  /** Puede ver las plantillas de ambos equipos */
  canViewLineups: boolean;
  /** Puede iniciar un partido (estado programado → en vivo) */
  canStartMatch: boolean;
  /** Puede finalizar un partido en vivo */
  canEndMatch: boolean;
  /** Puede convocar jugadores para un partido próximo */
  canManageSquad: boolean;
  /** Puede editar datos del partido (horario, campo, etc.) */
  canEditMatch: boolean;
  /** Ve la sección de métricas generales de la liga */
  canViewLeagueMetrics: boolean;
  /** Ve las tarjetas de progreso (equipos activos, jornadas) */
  canViewProgressMetrics: boolean;
}

/**
 * Devuelve el conjunto de permisos del dashboard según el rol.
 *
 * NOTA: El backend debe validar estas mismas reglas en servidor.
 * El frontend solo las usa para mostrar/ocultar UI, no para autorizar.
 */
export function getDashboardPermissions(
  role: LeagueRole,
): DashboardPermissions {
  switch (role) {
    case "admin":
      return {
        canRegisterEvent: true,
        canViewLineups: true,
        canStartMatch: true,
        canEndMatch: true,
        canManageSquad: true,
        canEditMatch: true,
        canViewLeagueMetrics: true,
        canViewProgressMetrics: true,
      };

    case "field_delegate":
      return {
        canRegisterEvent: true,
        canViewLineups: true,
        canStartMatch: true,
        canEndMatch: true,
        canManageSquad: false,
        canEditMatch: false,
        canViewLeagueMetrics: false,
        canViewProgressMetrics: false,
      };

    case "coach":
      return {
        canRegisterEvent: false,
        canViewLineups: true,
        canStartMatch: false,
        canEndMatch: false,
        canManageSquad: true,
        canEditMatch: false,
        canViewLeagueMetrics: false,
        canViewProgressMetrics: false,
      };

    case "player":
      return {
        canRegisterEvent: false,
        canViewLineups: true,
        canStartMatch: false,
        canEndMatch: false,
        canManageSquad: false,
        canEditMatch: false,
        canViewLeagueMetrics: false,
        canViewProgressMetrics: false,
      };

    /**
     * Observer tiene caso explícito aunque sus permisos sean idénticos a player hoy.
     * Motivo: cuando la feature Statistics llegue, player mostrará <PlayerStatsBlock>
     * y observer NO. Tenerlos separados desde aquí evita mezclarlos en ese momento.
     */
    case "observer":
      return {
        canRegisterEvent: false,
        canViewLineups: true,
        canStartMatch: false,
        canEndMatch: false,
        canManageSquad: false,
        canEditMatch: false,
        canViewLeagueMetrics: false,
        canViewProgressMetrics: false,
      };

    /**
     * default no hereda permisos de ningún rol conocido.
     * Un rol desconocido o malformado debe recibir el mínimo seguro,
     * no los permisos de player de forma silenciosa.
     * canViewLineups: true porque es la acción de consulta más básica.
     */
    default:
      return {
        canRegisterEvent: false,
        canViewLineups: true,
        canStartMatch: false,
        canEndMatch: false,
        canManageSquad: false,
        canEditMatch: false,
        canViewLeagueMetrics: false,
        canViewProgressMetrics: false,
      };
  }
}

// ---------------------------------------------------------------------------
// Saludo contextual por rol (usado en WelcomeBlock)
// ---------------------------------------------------------------------------

/** Etiqueta de rol legible para el usuario */
export function getRoleLabel(role: LeagueRole): string {
  const labels: Record<LeagueRole, string> = {
    admin: "Admin",
    coach: "Entrenador",
    player: "Jugador",
    field_delegate: "Delegado",
    observer: "Observador",
  };
  return labels[role] ?? role;
}

/** Título del panel según el rol (usado en header interno si aplica) */
export function getRoleGreeting(role: LeagueRole): string {
  const greetings: Record<LeagueRole, string> = {
    admin: "Panel de Administración",
    coach: "Panel del Entrenador",
    player: "Panel del Jugador",
    field_delegate: "Panel del Delegado",
    observer: "Panel del Observador",
  };
  return greetings[role] ?? "Panel";
}

// ---------------------------------------------------------------------------
// Utilidades de formato para datos del dashboard
// ---------------------------------------------------------------------------

/**
 * Formatea un porcentaje para las tarjetas de progreso.
 *
 * Regla de seguridad visual:
 * - Nunca debe superar el 100%, aunque el backend devuelva más equipos/partidos
 *   de los configurados.
 * - Nunca debe ser negativo. Esto evita barras rotas si llega algún valor extraño.
 */
export function formatProgress(current: number, total: number): string {
  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) return "0%";

  const ratio = Math.max(0, Math.min(current / total, 1));
  return `${Math.round(ratio * 100)}%`;
}
