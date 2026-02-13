// Shared frontend types
// Re-exports from worker types where applicable

export interface Fixture {
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  prediction?: PredictionSummary | null;
}

export interface PredictionSummary {
  id: string;
  homeTeam: string;
  awayTeam: string;
  predictedScore: { home: number; away: number };
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
}

export interface Prediction {
  id: string;
  fixtureId: number;
  gameweek: number;
  status: 'pending' | 'resolved';
  homeTeam: string;
  awayTeam: string;
  predictedScore: { home: number; away: number };
  predictedOutcome: 'home' | 'draw' | 'away';
  confidence: 'low' | 'medium' | 'high';
  reasoning: string;
  actualScore?: { home: number; away: number };
  actualOutcome?: 'home' | 'draw' | 'away';
  outcomeCorrect?: boolean;
  exactScoreCorrect?: boolean;
  createdAt: string;
  resolvedAt?: string;
}

export interface AccuracyStats {
  totalPredictions: number;
  resolved: number;
  outcomeAccuracy: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: { gw: number; total: number; correct: number }[];
}
