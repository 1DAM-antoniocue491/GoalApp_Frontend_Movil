export interface Match {
  id: string;
  leagueId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  status: "scheduled" | "live" | "finished";
  homeScore?: number;
  awayScore?: number;
}