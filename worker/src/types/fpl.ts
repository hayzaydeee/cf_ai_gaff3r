// FPL API response types

export interface FPLBootstrapResponse {
  events: FPLEvent[];
  teams: FPLTeam[];
  elements: FPLPlayer[];
}

export interface FPLTeam {
  id: number;
  name: string;
  short_name: string;
  strength: number;
  strength_overall_home: number;
  strength_overall_away: number;
  strength_attack_home: number;
  strength_attack_away: number;
  strength_defence_home: number;
  strength_defence_away: number;
}

export interface FPLPlayer {
  id: number;
  web_name: string;
  team: number;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  status: string; // a=available, d=doubtful, i=injured, u=unavailable, s=suspended
  chance_of_playing_next_round: number | null;
  form: string;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  news: string;
  minutes: number;
  influence: string;
  creativity: string;
  threat: string;
}

export interface FPLEvent {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_previous: boolean;
  is_current: boolean;
  is_next: boolean;
}

export interface FPLFixture {
  id: number;
  event: number;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
  finished: boolean;
  kickoff_time: string;
  team_h_difficulty: number;
  team_a_difficulty: number;
}
