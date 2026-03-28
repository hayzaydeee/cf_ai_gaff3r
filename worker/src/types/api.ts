// API request/response types

export interface ChatRequest {
  message: string;
  gameweek: number;
  fixtureId?: number;
  userId: string;
  stream?: boolean;
}

export interface ChatResponse {
  response: string;
  prediction: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    predictedScore: { home: number; away: number };
    confidence: 'low' | 'medium' | 'high';
    reasoning: string;
  } | null;
  accuracy: {
    totalPredictions: number;
    outcomeAccuracy: number;
    currentStreak: number;
  };
  fixtureFound: boolean;
  dataSource: 'fpl' | 'football-data' | null;
  identifiedFixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: string;
    competition: string;
    competitionCode: string;
  } | null;
}

export interface FixturesResponse {
  gameweek: number;
  fixtures: FixtureItem[];
}

export interface FixtureItem {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  homeTeamShortName?: string;
  awayTeamShortName?: string;
  kickoffTime: string;
  homeDifficulty: number;
  awayDifficulty: number;
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
  competition: string;
  competitionCode: string;
}

export interface GameweekResponse {
  current: number;
  next: number;
  nextDeadline: string;
}

export interface PredictionsResponse {
  predictions: Record<string, import('./app').Prediction[]>;
  total: number;
}

export interface StatsResponse {
  totalPredictions: number;
  resolved: number;
  outcomeAccuracy: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: { gw: number; total: number; correct: number }[];
}

export interface MatchContextTeamItem {
  name: string;
  leaguePosition: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string[];
  formSummary: string;
  recentResults: import('./app').RecentResult[];
  keyPlayers?: import('./app').KeyPlayer[];
  injuries?: import('./app').InjuryReport[];
}

export interface MatchContextResponse {
  fixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    competitionCode: string;
    matchDate: string;
    matchday?: number;
  };
  dataSource: 'fpl' | 'football-data';
  fplDifficulty?: { home: number; away: number };
  homeTeam: MatchContextTeamItem;
  awayTeam: MatchContextTeamItem;
}

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
}
