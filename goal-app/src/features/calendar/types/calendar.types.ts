/**
 * calendar.types.ts
 *
 * Tipos de dominio del feature Calendar.
 *
 * PREPARADO PARA API:
 * Cuando el backend entregue datos reales, los DTOs irán a calendar/api/
 * y aquí permanecen los modelos de dominio del frontend.
 * El mapper DTO → modelo irá a calendar/api/calendar.mapper.ts.
 */

// ---------------------------------------------------------------------------
// Navegación y filtros de UI
// ---------------------------------------------------------------------------

/** Tab principal de la pantalla de calendario */
export type CalendarMainTab = 'journey' | 'teams' | 'classification';

/** Filtro de estado dentro de una jornada */
export type JourneyStatusFilter = 'live' | 'programmed' | 'finished';

/** Estado del calendario de la liga (determina qué empty state mostrar) */
export type CalendarViewState = 'no_teams' | 'no_calendar' | 'has_calendar';

/** Rol del usuario en el contexto del calendario */
export type CalendarRole = 'admin' | 'coach' | 'field_delegate' | 'player' | 'observer';

// ---------------------------------------------------------------------------
// Partido de calendario
// ---------------------------------------------------------------------------

/**
 * Origen del partido dentro del calendario.
 *
 * REGLA DE NEGOCIO:
 * - Los partidos manuales NO se sobrescriben al generar el calendario automático.
 * - Si un partido manual coincide con uno automático (mismo equipo, misma jornada/fecha),
 *   debe detectarse como conflicto — ver utils/calendarConflicts.ts.
 * - El backend debe respetar esta distinción en la persistencia.
 */
export type MatchSource = 'automatic' | 'manual';

/** Estado del partido dentro del calendario */
export type CalendarMatchStatus = 'live' | 'programmed' | 'finished';

/**
 * Partido unificado del calendario.
 *
 * Agrega los campos necesarios para renderizar cualquiera de las tres cards:
 * LiveMatchCard, ProgrammedMatchCard o FinishedMatchCard.
 *
 * Campos opcionales por status:
 * - live:       homeScore, awayScore, minute
 * - programmed: day, month, time
 * - finished:   homeScore, awayScore, date
 */
export interface CalendarMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  status: CalendarMatchStatus;
  /** Origen del partido — clave para evitar sobreescrituras al generar el calendario */
  source: MatchSource;
  round: string;
  venue: string;
  leagueName: string;
  // Fechas
  /** "20 Abr" — FinishedMatchCard */
  date?: string;
  /** "24" — ProgrammedMatchCard */
  day?: string;
  /** "MAY" — ProgrammedMatchCard */
  month?: string;
  /** "18:00" — ProgrammedMatchCard */
  time?: string;
  // Marcador
  homeScore?: number;
  awayScore?: number;
  /** Minuto actual — solo si status === 'live' */
  minute?: number;
  // Visual
  homeColor?: string;
  awayColor?: string;
  homeShieldLetter?: string;
  awayShieldLetter?: string;
}

// ---------------------------------------------------------------------------
// Jornada
// ---------------------------------------------------------------------------

export interface CalendarJourney {
  id: string;
  /** Número de jornada (1, 2, ... N) */
  number: number;
  matches: CalendarMatch[];
}

// ---------------------------------------------------------------------------
// Permisos de calendario por rol
// ---------------------------------------------------------------------------

/**
 * Permisos de acciones dentro del contexto del calendario.
 *
 * TODO: cuando el servicio de permisos sea compartido entre features,
 * reemplazar este tipo por una extensión de DashboardPermissions.
 */
export interface CalendarPermissions {
  /** Admin: crear el calendario completo de la liga */
  canCreateCalendar: boolean;
  /** Admin: editar el calendario generado */
  canEditCalendar: boolean;
  /** Admin: añadir partido manualmente */
  canAddMatch: boolean;
  /** Admin: editar datos de un partido (campo, hora, delegado) */
  canEditMatch: boolean;
  /** Admin / Coach: gestionar convocatoria */
  canManageCallup: boolean;
  /** Admin / Coach: acceder a previa del partido */
  canViewPreviousMatch: boolean;
  /** Admin / Field delegate: iniciar partido */
  canStartMatch: boolean;
  /** Admin / Field delegate: registrar evento en vivo */
  canRegisterEvent: boolean;
  /** Admin / Field delegate: finalizar partido */
  canEndMatch: boolean;
  /** Todos los roles: ver plantillas */
  canViewLineups: boolean;
}
