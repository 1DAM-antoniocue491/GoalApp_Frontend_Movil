/**
 * dashboard.mocks.ts
 *
 * Datos mock del feature dashboard.
 *
 * REGLA DE ARQUITECTURA:
 * Los mocks NUNCA viven dentro de componentes o hooks.
 * Deben importarse desde aquí durante el desarrollo y sustituirse
 * por llamadas reales a la API cuando el backend esté listo.
 *
 * Los datos de equipos (colores, nombres cortos) se alinean con
 * `mocks/data.ts` → mockTeams para que no haya inconsistencias.
 *
 * Cuando exista la feature Teams con logos reales, los campos
 * `homeShieldLetter` / `awayShieldLetter` desaparecerán de estos mocks.
 */

import type {
  LeagueMetricsData,
  LiveMatchData,
  UpcomingMatchData,
  DashboardData,
} from "@/src/shared/types/dashboard.types";

// ---------------------------------------------------------------------------
// Métricas de la liga activa
// ---------------------------------------------------------------------------

export const mockDashboardMetrics: LeagueMetricsData = {
  teams: 16,
  users: 248,
  scheduledMatches: 42,
  playedMatches: 18,
  activeTeams: 14,
  totalTeams: 16,
  completedRounds: 10,
  totalRounds: 34,
};

// ---------------------------------------------------------------------------
// Partido en vivo
// Los colores se mapean desde mockTeams en data.ts:
//   Real Betis → verde oscuro corporativo
//   Sevilla FC → blanco/rojo
// ---------------------------------------------------------------------------

export const mockLiveMatch: LiveMatchData = {
  id: "live-1",
  homeTeam: "Real Betis",
  awayTeam: "Sevilla FC",
  homeScore: 2,
  awayScore: 1,
  minute: 68,
  leagueName: "Liga Sevilla Premier",
  venue: "Estadio Benito Villamarín",
  homeShieldLetter: "B",
  awayShieldLetter: "S",
  // Colores corporativos de los equipos (fuente: mockTeams en data.ts)
  homeColor: "#00A650", // Real Betis verde
  awayColor: "#D40E14", // Sevilla FC rojo
};

// ---------------------------------------------------------------------------
// Próximos partidos
// Alineados con los equipos de mockTeams de data.ts donde corresponde.
// Los colores proceden de Team.primaryColor.
// ---------------------------------------------------------------------------

export const mockUpcomingMatches: UpcomingMatchData[] = [
  {
    id: "upcoming-1",
    homeTeam: "Athletic Club",
    awayTeam: "Real Sociedad",
    day: "24",
    month: "MAY",
    time: "18:00",
    round: "Jornada 21",
    venue: "Estadio San Mamés",
    homeColor: "#C8102E", // Athletic rojo
    awayColor: "#0057A8", // Real Sociedad azul
  },
  {
    id: "upcoming-2",
    homeTeam: "Villarreal CF",
    awayTeam: "Valencia CF",
    day: "25",
    month: "MAY",
    time: "20:30",
    round: "Jornada 21",
    venue: "Estadio de la Cerámica",
    homeColor: "#FFD700", // Villarreal amarillo
    awayColor: "#FF8C00", // Valencia naranja/negro
  },
  {
    id: "upcoming-3",
    homeTeam: "Atlético Madrid",
    awayTeam: "Getafe CF",
    day: "26",
    month: "MAY",
    time: "19:00",
    round: "Jornada 21",
    venue: "Civitas Metropolitano",
    homeColor: "#C8102E", // Atlético rojo
    awayColor: "#005999", // Getafe azul — alineado con mockTeams team-6
  },
];

// ---------------------------------------------------------------------------
// Objeto unificado para useDashboardData (simula respuesta de API)
// ---------------------------------------------------------------------------

export const mockDashboardData: DashboardData = {
  metrics: mockDashboardMetrics,
  liveMatch: mockLiveMatch,
  upcomingMatches: mockUpcomingMatches,
};
