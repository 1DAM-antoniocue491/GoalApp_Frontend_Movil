// Definimos las interface de los formularios de registro y login
// Separándolo del componente para más escalabilidad y matenimiento

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// AuthTabs necesita saber son los botones que permiten saber
// cuál tab está activa.
export type AuthTab = "login" | "register";

// LeagueTab necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type LeagueTab = "match" | "teams" |"classification" ;

// MatchesTabs necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type MatchesTab = "live" | "programmed" |"finished" ;

// StatisticTabs necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type StatisticTabs = "statistics" | "alignment";

// ProgrammedTabs necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type ProgrammedTabs = "previousMeeting" | "squad";


// StatisticTeamsandPlayersTabs necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type StatisticTeamsandPlayersTabs = "teams" | "players";

// ProgrammedTabs necesita saber son los botones que permiten saber
// cuál tab está activa de par.
export type TeamTabs = "information" | "squad";