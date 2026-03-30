// App domain types

export interface UserProfile {
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  theme: 'light' | 'dark';
  preferences?: UserPreferences;
}

export interface UserPreferences {
  favouriteTeam?: string;
  favouriteTeamId?: number;
  preferredLeagues: string[];           // e.g. ["PL", "CL"]
  analysisStyle: 'brief' | 'detailed';
  teamQueryCounts: Record<string, number>; // tracks which teams user asks about most
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  simResult?: import('./api').SimResultPayload;
  adjustmentNotes?: string[];
  typedPrediction?: import('./api').TypedPredictionPayload;
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
  competition: string;
  competitionCode: string;           // "PL", "PD", "BL1", "SA", "FL1", "CL"
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
  avgGoalDifference: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: GameweekAccuracy[];
  byCompetition: Record<string, {
    competitionName: string;
    total: number;
    correctOutcomes: number;
    outcomeAccuracy: number;
  }>;
}

export interface GameweekAccuracy {
  gw: number;
  total: number;
  correct: number;
}

// ── Match Context Types ──

export interface PLMatchContext {
  type: 'pl';
  fixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    competition: 'Premier League';
    matchDate: string;
    matchday: number;
  };
  fplDifficulty: { home: number; away: number };
  homeTeam: PLTeamContext;
  awayTeam: PLTeamContext;
}

export interface PLTeamContext {
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
  strength: {
    overall: number;
    attackHome: number;
    attackAway: number;
    defenceHome: number;
    defenceAway: number;
  };
  form: string[];
  formSummary: string;
  recentResults: RecentResult[];
  keyPlayers: KeyPlayer[];   // top 5 by goal involvement — headline stats
  squadPlayers: KeyPlayer[]; // full active squad — player-specific queries
  injuries: InjuryReport[];
  setPieceTakers?: string;
}

export interface StandardMatchContext {
  type: 'standard';
  fixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    competition: string;
    competitionCode: string;
    matchDate: string;
    matchday?: number;
  };
  homeTeam: StandardTeamContext;
  awayTeam: StandardTeamContext;
}

export interface StandardTeamContext {
  name: string;
  leaguePosition: number;
  totalTeams: number;
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
  recentResults: RecentResult[];
}

export interface KeyPlayer {
  name: string;
  position: string;
  form: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  minutes: number;
  status: 'available' | 'injured' | 'doubtful' | 'suspended';
}

export interface InjuryReport {
  player: string;
  status: string;
  news: string;
  chanceOfPlaying: number | null;
}

export interface RecentResult {
  opponent: string;
  goalsFor: number;
  goalsAgainst: number;
  result: string; // W, D, L
  home: boolean;
}

export type MatchContext = PLMatchContext | StandardMatchContext;
