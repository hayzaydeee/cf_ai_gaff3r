// Shared frontend types
// Re-exports from worker types where applicable

// ── Typed Prediction Sub-types ──

export type PredictionType = 'result' | 'scorer' | 'lineup' | 'btts';

export interface ScorerPick {
  name: string;
  team: string;
  likelihood: 'likely' | 'possible' | 'outside';
  goals: number;
}

export interface LineupData {
  formation: string;
  keyPicks: string[];
}

export interface TypedPrediction {
  type: PredictionType;
  homeTeam: string;
  awayTeam: string;
  // result
  homeScore?: number;
  awayScore?: number;
  confidence?: 'low' | 'medium' | 'high';
  reasoning?: string;
  // scorer
  scorers?: ScorerPick[];
  // lineup
  homeLineup?: LineupData;
  awayLineup?: LineupData;
  // btts
  btts?: boolean;
  overUnder?: { line: number; pick: 'over' | 'under' };
}

export interface SimResult {
  lambda: number;
  mu: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  topScorelinesWithPct: { home: number; away: number; probability: number }[];
  mostLikelyScore: { home: number; away: number; probability: number };
  confidence: 'low' | 'medium' | 'high';
}

export interface Fixture {
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
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  streaming?: boolean;
  prediction?: PredictionSummary | null;
  simResult?: SimResult;
  adjustmentNotes?: string[];
  typedPrediction?: TypedPrediction;
  /** Set by SSE meta event before streaming begins. false = skip model block skeleton. */
  hasModel?: boolean;
  /** Intent classified server-side before LLM call. */
  intent?: string;
  metadata?: {
    fixtureId?: number;
    predictionId?: string;
  };
}

export interface PredictionSummary {
  id?: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
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
  homeTeamId?: number;
  awayTeamId?: number;
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
