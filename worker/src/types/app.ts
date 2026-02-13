// App domain types

export interface UserProfile {
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  theme: 'light' | 'dark';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    fixtureId?: number;
    predictionId?: string;
  };
}

export interface Prediction {
  id: string;
  fixtureId: number;
  gameweek: number;
  status: 'pending' | 'resolved';

  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  kickoffTime: string;

  predictedScore: Score;
  predictedOutcome: Outcome;
  confidence: Confidence;
  reasoning: string;

  actualScore?: Score;
  actualOutcome?: Outcome;
  outcomeCorrect?: boolean;
  exactScoreCorrect?: boolean;

  createdAt: string;
  resolvedAt?: string;
}

export interface Score {
  home: number;
  away: number;
}

export type Outcome = 'home' | 'draw' | 'away';
export type Confidence = 'low' | 'medium' | 'high';

export interface AccuracyStats {
  totalPredictions: number;
  resolved: number;
  pending: number;
  correctOutcomes: number;
  outcomeAccuracy: number;
  exactScores: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: GameweekAccuracy[];
}

export interface GameweekAccuracy {
  gw: number;
  total: number;
  correct: number;
}
