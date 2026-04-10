/**
 * Datos mock centralizados para la aplicación GoalApp
 *
 * Este archivo contiene toda la data simulada necesaria para probar
 * la aplicación sin backend real. Incluye usuarios, credenciales,
 * ligas, equipos y favoritos.
 *
 * REGLA: NO dejar arrays mock dentro de pantallas ni componentes.
 * Todo dato simulado debe vivir aquí.
 */

import { LeagueItem, LeagueRole } from "../types/league";

// ============================================================================
// USUARIOS Y CREDENCIALES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoriteLeagues: string[]; // IDs de ligas favoritas
}

export interface Credential {
  email: string;
  password: string;
  userId: string;
}

// Usuarios simulados para testing
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

// Credenciales de prueba para login
// Email: cualquier otro, Password: "password123"
export const mockCredentials: Credential[] = [
  { email: "juan@goalapp.com", password: "password123", userId: "user-1" },
  { email: "maria@goalapp.com", password: "password123", userId: "user-2" },
];

// Credencial genérica para cualquier registro de prueba
export const GENERIC_PASSWORD = "password123";

// ============================================================================
// EQUIPOS
// ============================================================================

export interface Team {
  id: string;
  name: string;
  shortName: string;
  logo?: string; // URL del escudo, si es undefined usar MaterialIcons shield
  primaryColor: string;
  secondaryColor: string;
}

export const mockTeams: Team[] = [
  // Equipos con escudo
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
  // Equipos sin escudo (usarán fallback con MaterialIcons)
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

export interface League {
  id: string;
  name: string;
  season: string;
  status: "active" | "finished";
  role: "admin" | "coach" | "player" | "field_delegate";
  isFavorite: boolean;
  teamName?: string;
  teamsCount: number;
  crestUrl?: string | null;
  canReactivate?: boolean;
}

export const mockLeagues: League[] = [
  {
    id: "1",
    name: "Liga Provincial de Fútbol",
    season: "2025/26",
    status: "active",
    role: "admin",
    isFavorite: true,
    teamName: "Real Betis",
    teamsCount: 12,
    crestUrl: null, // Para probar fallback
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
// PARTIDOS (para futura implementación)
// ============================================================================

export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string; // ISO 8601
  status: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
}

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

// ============================================================================
// FUNCIONES DE UTILIDAD PARA DATOS MOCK
// ============================================================================

/**
 * Verifica si las credenciales son válidas
 */
export function validateCredentials(
  email: string,
  password: string,
): User | null {
  const credential = mockCredentials.find(
    (c) =>
      c.email.toLowerCase() === email.toLowerCase() && c.password === password,
  );

  if (!credential) return null;

  const user = mockUsers.find((u) => u.id === credential.userId);
  return user || null;
}

/**
 * Crea un nuevo usuario mock (para registro simulado)
 */
export function createUser(
  name: string,
  email: string,
  password: string,
): User {
  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    avatar: undefined,
    favoriteLeagues: [],
  };

  // En una app real, esto se enviaría al backend
  mockUsers.push(newUser);
  mockCredentials.push({
    email,
    password,
    userId: newUser.id,
  });

  return newUser;
}

/**
 * Obtiene una liga por ID
 */
export function getLeagueById(id: string): League | undefined {
  return mockLeagues.find((league) => league.id === id);
}

/**
 * Obtiene un equipo por ID
 */
export function getTeamById(id: string): Team | undefined {
  return mockTeams.find((team) => team.id === id);
}

/**
 * Alterna el estado de favorito para una liga
 */
export function toggleFavoriteLeague(user: User, leagueId: string): User {
  const isFavorite = user.favoriteLeagues.includes(leagueId);

  return {
    ...user,
    favoriteLeagues: isFavorite
      ? user.favoriteLeagues.filter((id) => id !== leagueId)
      : [...user.favoriteLeagues, leagueId],
  };
}

/**
 * Verifica si una liga es favorita del usuario
 */
export function isLeagueFavorite(user: User, leagueId: string): boolean {
  return user.favoriteLeagues.includes(leagueId);
}

/**
 * Obtiene todas las ligas ordenadas
 */
export function getAllLeagues(): League[] {
  return mockLeagues;
}

/**
 * Obtiene permisos del dashboard según el rol
 * Esto determina qué módulos/ve cada rol en el dashboard
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

/**
 * Obtiene ligas con información de rol para onboarding
 * Incluye el rol del usuario en cada liga
 */
export function getLeaguesWithRoles(): LeagueItem[] {
  return mockLeagues;
}

// /**
//  * Obtiene equipos de una liga
//  */
// export function getLeagueTeams(leagueId: string): Team[] {
//   const league = getLeagueById(leagueId);
//   if (!league) return [];

//   return league.teams
//     .map((teamId: string) => getTeamById(teamId))
//     .filter((team): team is Team => !!team);
// }
