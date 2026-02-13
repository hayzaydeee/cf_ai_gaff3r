// API request/response types

export interface ChatRequest {
  message: string;
  gameweek: number;
  fixtureId?: number;
  userId: string;
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
  kickoffTime: string;
  homeDifficulty: number;
  awayDifficulty: number;
  finished: boolean;
  homeScore: number | null;
  awayScore: number | null;
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

export interface ErrorResponse {
  error: string;
  code: string;
  message: string;
}
