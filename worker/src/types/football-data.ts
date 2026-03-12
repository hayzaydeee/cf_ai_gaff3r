// football-data.org API response types

export interface FDMatchesResponse {
  matches: FDMatch[];
}

export interface FDMatch {
  id: number;
  competition: { id: number; name: string; code: string };
  homeTeam: { id: number; name: string; shortName: string };
  awayTeam: { id: number; name: string; shortName: string };
  utcDate: string;
  matchday: number;
  status: string; // "SCHEDULED" | "LIVE" | "FINISHED" | etc.
  score: {
    fullTime: { home: number | null; away: number | null };
  };
}

export interface FDStandingsResponse {
  competition: { id: number; name: string; code: string };
  standings: FDStanding[];
}

export interface FDStanding {
  type: string; // "TOTAL" | "HOME" | "AWAY"
  table: FDTableEntry[];
}

export interface FDTableEntry {
  position: number;
  team: { id: number; name: string; shortName: string };
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string | null; // "W,W,D,L,W"
}

export interface FDTeamMatchesResponse {
  matches: FDMatch[];
}
