/**
 * Datos mock centralizados para GoalApp
 *
 * REGLA: No dejar arrays mock dentro de pantallas ni componentes.
 * Todo dato simulado debe vivir en mocks/.
 *
 * Los tipos están en shared/types/.
 * Las funciones de servicio estan en features/services.
 */

import type { User, Credential } from "@/src/shared/types/user";
import type { Team } from "@/src/shared/types/team";
import type { Match } from "@/src/shared/types/match";
import type { LeagueItem } from "@/src/shared/types/league";

// ============================================================================
// USUARIOS Y CREDENCIALES
// ============================================================================

export const mockUsers: User[] = [
  {
    id: "user-1",
    name: "Juan Pérez",
    email: "juan@goalapp.com",
    avatar: undefined,
    favoriteLeagues: ["league-1", "league-3"],
  },
  {
    id: "user-2",
    name: "María García",
    email: "maria@goalapp.com",
    avatar: undefined,
    favoriteLeagues: ["league-2"],
  },
];

export const mockCredentials: Credential[] = [
  { email: "juan@goalapp.com", password: "password123", userId: "user-1" },
  { email: "maria@goalapp.com", password: "password123", userId: "user-2" },
];

export const GENERIC_PASSWORD = "password123";

// ============================================================================
// EQUIPOS
// ============================================================================

export const mockTeams: Team[] = [
  {
    id: "team-1",
    name: "Real Madrid",
    shortName: "RMA",
    logo: "https://logos.com/real-madrid.png",
    primaryColor: "#FFFFFF",
    secondaryColor: "#001F5B",
  },
  {
    id: "team-2",
    name: "FC Barcelona",
    shortName: "BAR",
    logo: "https://logos.com/barcelona.png",
    primaryColor: "#A50044",
    secondaryColor: "#004D98",
  },
  {
    id: "team-3",
    name: "Manchester City",
    shortName: "MCI",
    logo: "https://logos.com/mancity.png",
    primaryColor: "#6CABDD",
    secondaryColor: "#1C2C5B",
  },
  {
    id: "team-4",
    name: "Liverpool FC",
    shortName: "LIV",
    logo: "https://logos.com/liverpool.png",
    primaryColor: "#C8102E",
    secondaryColor: "#00B2A9",
  },
  {
    id: "team-5",
    name: "Deportivo Alavés",
    shortName: "ALA",
    primaryColor: "#0066B3",
    secondaryColor: "#FFFFFF",
  },
  {
    id: "team-6",
    name: "Getafe CF",
    shortName: "GET",
    primaryColor: "#005999",
    secondaryColor: "#FFFFFF",
  },
];

// ============================================================================
// LIGAS
// ============================================================================

export const mockLeagues: LeagueItem[] = [
  {
    id: "1",
    name: "Liga Provincial de Fútbol",
    season: "2025/26",
    status: "active",
    role: "admin",
    isFavorite: true,
    teamName: "Real Betis",
    teamsCount: 12,
    crestUrl: null,
    canReactivate: false,
  },
  {
    id: "2",
    name: "Copa Regional",
    season: "2025",
    status: "finished",
    role: "coach",
    isFavorite: false,
    teamName: "Sevilla FC",
    teamsCount: 8,
    crestUrl: "https://example.com/crest.png",
    canReactivate: true,
  },
  {
    id: "3",
    name: "Torneo de Verano",
    season: "2025",
    status: "finished",
    role: "player",
    isFavorite: false,
    teamName: "Local United",
    teamsCount: 6,
    crestUrl: null,
    canReactivate: false,
  },
  {
    id: "4",
    name: "Liga Elite",
    season: "2025/26",
    status: "active",
    role: "field_delegate",
    isFavorite: true,
    teamName: "Athletic Club",
    teamsCount: 10,
    crestUrl: "https://example.com/elite.png",
    canReactivate: false,
  },
];

// ============================================================================
// PARTIDOS
// ============================================================================

export const mockMatches: Match[] = [
  {
    id: "match-1",
    leagueId: "league-1",
    homeTeamId: "team-1",
    awayTeamId: "team-2",
    date: "2025-04-15T21:00:00Z",
    status: "scheduled",
  },
  {
    id: "match-2",
    leagueId: "league-2",
    homeTeamId: "team-3",
    awayTeamId: "team-4",
    date: "2025-04-12T16:30:00Z",
    status: "live",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "match-3",
    leagueId: "league-1",
    homeTeamId: "team-5",
    awayTeamId: "team-6",
    date: "2025-04-10T18:00:00Z",
    status: "finished",
    homeScore: 1,
    awayScore: 0,
  },
];