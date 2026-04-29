/**
 * calendarFilters.ts
 *
 * Utilidades puras de filtrado y permisos para el calendario.
 * No importa React. No hace fetch. No tiene efectos secundarios.
 */

import type {
  CalendarMatch,
  CalendarPermissions,
  CalendarRole,
  JourneyStatusFilter,
} from '../types/calendar.types';

// ---------------------------------------------------------------------------
// Filtros de partidos
// ---------------------------------------------------------------------------

/**
 * Filtra los partidos de una jornada según el filtro de estado activo.
 */
export function filterMatchesByStatus(
  matches: CalendarMatch[],
  filter: JourneyStatusFilter
): CalendarMatch[] {
  return matches.filter((m) => m.status === filter);
}

/**
 * Devuelve el número de partidos por estado en una jornada.
 * Útil para mostrar badges de conteo en los filtros.
 */
export function countMatchesByStatus(matches: CalendarMatch[]): Record<JourneyStatusFilter, number> {
  return {
    live: matches.filter((m) => m.status === 'live').length,
    programmed: matches.filter((m) => m.status === 'programmed').length,
    finished: matches.filter((m) => m.status === 'finished').length,
  };
}

// ---------------------------------------------------------------------------
// Permisos por rol
// ---------------------------------------------------------------------------

/**
 * Devuelve los permisos de acciones de calendario según el rol.
 *
 * TODO: cuando el backend devuelva permisos en el token/sesión,
 * adaptar esta función para mapear desde la respuesta real en lugar de
 * derivarlos localmente del rol.
 */
export function getCalendarPermissions(role: CalendarRole): CalendarPermissions {
  switch (role) {
    case 'admin':
      return {
        canCreateCalendar: true,
        canEditCalendar: true,
        canAddMatch: true,
        canEditMatch: true,
        canManageCallup: true,
        canViewPreviousMatch: true,
        canStartMatch: true,
        canRegisterEvent: true,
        canEndMatch: true,
        canViewLineups: true,
      };

    case 'coach':
      return {
        canCreateCalendar: false,
        canEditCalendar: false,
        canAddMatch: false,
        canEditMatch: false,
        canManageCallup: true,
        canViewPreviousMatch: true,
        canStartMatch: false,
        canRegisterEvent: false,
        canEndMatch: false,
        canViewLineups: true,
      };

    case 'field_delegate':
      return {
        canCreateCalendar: false,
        canEditCalendar: false,
        canAddMatch: false,
        canEditMatch: false,
        canManageCallup: false,
        canViewPreviousMatch: false,
        canStartMatch: true,
        canRegisterEvent: true,
        canEndMatch: true,
        canViewLineups: true,
      };

    case 'player':
    case 'observer':
    default:
      return {
        canCreateCalendar: false,
        canEditCalendar: false,
        canAddMatch: false,
        canEditMatch: false,
        canManageCallup: false,
        canViewPreviousMatch: false,
        canStartMatch: false,
        canRegisterEvent: false,
        canEndMatch: false,
        canViewLineups: true,
      };
  }
}
