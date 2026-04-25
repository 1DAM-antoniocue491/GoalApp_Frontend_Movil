/**
 * dashboard.types.ts
 *
 * Tipos de dominio exclusivos del feature dashboard.
 *
 * REGLA: Aquí viven solo los tipos que NO son compartidos con otras features.
 * Los tipos globales como `LeagueRole`, `Match`, `Team` viven en `shared/types/`.
 *
 * CUANDO EVOLUCIONE A API REAL:
 * Los DTOs del backend irán a `dashboard.api.ts` y aquí permanecen los modelos
 * de dominio del frontend. El mapper DTO → modelo irá a `dashboard.mapper.ts`.
 */

// ---------------------------------------------------------------------------
// Métricas generales de la liga (bloque 2x2 superior)
// ---------------------------------------------------------------------------

export interface LeagueMetricsData {
  teams: number;
  users: number;
  scheduledMatches: number;
  playedMatches: number;
  /** Para las tarjetas de progreso inferiores */
  activeTeams: number;
  totalTeams: number;
  completedRounds: number;
  totalRounds: number;
}

// ---------------------------------------------------------------------------
// Partido en vivo (tarjeta hero con efecto estadio)
// ---------------------------------------------------------------------------

export interface LiveMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  /** Minuto actual del partido */
  minute: number;
  leagueName: string;
  venue: string;
  /**
   * Inicial del equipo local para el escudo SVG.
   * Se usa hasta que la feature Teams entregue logos reales.
   * Cuando exista `Team.logo`, este campo se vuelve opcional/deprecado.
   */
  homeShieldLetter?: string;
  awayShieldLetter?: string;
  /** Color primario del equipo. Procede de Team.primaryColor en data.ts. */
  homeColor?: string;
  awayColor?: string;
}

// ---------------------------------------------------------------------------
// Partido próximo (filas de la sección "Próximos partidos")
// ---------------------------------------------------------------------------

export interface UpcomingMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  /** Día del mes como string, ej: "24" */
  day: string;
  /** Mes abreviado en mayúsculas, ej: "MAY" */
  month: string;
  /** Hora en formato HH:MM, ej: "18:00" */
  time: string;
  round: string;
  venue: string;
  /** Color primario del equipo local. Procede de Team.primaryColor. */
  homeColor?: string;
  awayColor?: string;
}

// ---------------------------------------------------------------------------
// Datos completos del dashboard (forma que devuelve useDashboardData)
// ---------------------------------------------------------------------------

export interface DashboardData {
  metrics: LeagueMetricsData;
  liveMatch: LiveMatchData | null;
  upcomingMatches: UpcomingMatchData[];
}
