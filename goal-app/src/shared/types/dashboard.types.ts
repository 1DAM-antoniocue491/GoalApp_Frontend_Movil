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
  homeShieldLetter?: string;
  awayShieldLetter?: string;
  homeColor?: string;
  awayColor?: string;
  /** ID del equipo local */
  homeTeamId?: string;
  /** ID del equipo visitante */
  awayTeamId?: string;
}

// ---------------------------------------------------------------------------
// Partido próximo (filas de la sección "Próximos partidos")
// ---------------------------------------------------------------------------

export interface UpcomingMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  day: string;
  month: string;
  time: string;
  round: string;
  venue: string;
  homeColor?: string;
  awayColor?: string;
  /** ID del equipo local */
  homeTeamId?: string;
  /** ID del equipo visitante */
  awayTeamId?: string;
}

// ---------------------------------------------------------------------------
// Partido finalizado (tarjeta de histórico de resultados)
// ---------------------------------------------------------------------------

export interface FinishedMatchData {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  /** Fecha formateada para mostrar, ej: "13 Mar" */
  date: string;
  round: string;
  leagueName: string;
  venue?: string;
  homeColor?: string;
  awayColor?: string;
  homeShieldLetter?: string;
  awayShieldLetter?: string;
}

// ---------------------------------------------------------------------------
// Datos completos del dashboard (forma que devuelve useDashboardData)
// ---------------------------------------------------------------------------

export interface DashboardData {
  metrics: LeagueMetricsData;
  liveMatch: LiveMatchData | null;
  upcomingMatches: UpcomingMatchData[];
}
