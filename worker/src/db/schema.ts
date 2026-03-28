// TypeScript row types for all Gaff3r D1 tables

export interface TeamRow {
  id: string;
  name: string;
  short_name: string;
  league: string;
  elo_rating: number | null;
  updated_at: number;
}

export interface HistoricalResultRow {
  id: number;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
  home_xg: number | null;
  away_xg: number | null;
  match_date: number;
  season: string;
  league: string;
  gameweek: number | null;
}

export interface DixonColesParamsRow {
  team_id: string;
  season: string;
  alpha: number;
  beta: number;
  gamma: number;
  rho: number;
  fitted_at: number;
}

export interface GameweekSnapshotRow {
  id: number;
  gameweek: number;
  season: string;
  team_id: string;
  strength_overall_home: number | null;
  strength_overall_away: number | null;
  strength_attack_home: number | null;
  strength_attack_away: number | null;
  strength_defence_home: number | null;
  strength_defence_away: number | null;
  form: number | null;
  captured_at: number;
}

export interface PlayerSnapshotRow {
  id: number;
  gameweek: number;
  season: string;
  player_id: number;
  team_id: string;
  web_name: string;
  minutes: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  chance_of_playing: number | null;
  status: string | null;
  news: string | null;
  captured_at: number;
}

export type PredictionStatus = "pending" | "resolved" | "unresolvable";
export type PredictionConfidence = "high" | "medium" | "low";

export interface PredictionRow {
  id: string;
  user_id: string | null;
  anon_user_id: string | null;
  home_team: string;
  away_team: string;
  fixture_id: number | null;
  competition_code: string | null;
  fixture_date: number | null;
  league: string | null;
  predicted_home: number;
  predicted_away: number;
  outcome_probs_json: string | null;
  model_scorelines_json: string | null;
  reasoning_summary: string | null;
  confidence: PredictionConfidence | null;
  status: PredictionStatus;
  actual_home: number | null;
  actual_away: number | null;
  outcome_correct: 0 | 1 | null;
  exact_score_correct: 0 | 1 | null;
  created_at: number;
  resolved_at: number | null;
}

// Parsed versions of JSON fields
export interface OutcomeProbs {
  home: number;
  draw: number;
  away: number;
}

export interface ScoреlineProb {
  score: string;  // "2-1"
  pct: number;    // 14.2
}
