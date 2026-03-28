-- Gaff3r game tables migration
-- Better Auth tables are applied separately via: npx better-auth migrate

-- Teams reference table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,          -- e.g. "arsenal", "man-city"
  name TEXT NOT NULL,           -- "Arsenal"
  short_name TEXT NOT NULL,     -- "ARS"
  league TEXT NOT NULL,         -- "PL", "LIGA", "BL1", "SA", "FL1", "CL"
  elo_rating REAL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_teams_league ON teams(league);

-- Historical match results (used to fit Dixon-Coles parameters)
CREATE TABLE IF NOT EXISTS historical_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  home_team_id TEXT NOT NULL REFERENCES teams(id),
  away_team_id TEXT NOT NULL REFERENCES teams(id),
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  home_xg REAL,                 -- NULL until xG data is available (post half-season)
  away_xg REAL,
  match_date INTEGER NOT NULL,  -- Unix timestamp
  season TEXT NOT NULL,         -- "2024-25"
  league TEXT NOT NULL,
  gameweek INTEGER              -- NULL for non-PL leagues
);

CREATE INDEX IF NOT EXISTS idx_results_teams ON historical_results(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_results_date ON historical_results(match_date DESC);
CREATE INDEX IF NOT EXISTS idx_results_season ON historical_results(season, league);

-- Dixon-Coles parameters per team per season (re-fitted weekly after FPL snapshot)
CREATE TABLE IF NOT EXISTS dixon_coles_params (
  team_id TEXT NOT NULL REFERENCES teams(id),
  season TEXT NOT NULL,
  alpha REAL NOT NULL,          -- attack strength
  beta REAL NOT NULL,           -- defence strength (lower = tighter)
  gamma REAL NOT NULL,          -- home advantage (global, stored per team for convenience)
  rho REAL NOT NULL,            -- low-score dependency correction (typically -0.13)
  fitted_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (team_id, season)
);

-- Weekly FPL gameweek snapshots per team
CREATE TABLE IF NOT EXISTS gameweek_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL,
  team_id TEXT NOT NULL REFERENCES teams(id),
  strength_overall_home INTEGER,
  strength_overall_away INTEGER,
  strength_attack_home INTEGER,
  strength_attack_away INTEGER,
  strength_defence_home INTEGER,
  strength_defence_away INTEGER,
  form REAL,                    -- rolling average points
  captured_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(gameweek, season, team_id)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_gw ON gameweek_snapshots(gameweek, season);

-- Weekly FPL player snapshots
CREATE TABLE IF NOT EXISTS player_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL,
  player_id INTEGER NOT NULL,   -- FPL player ID
  team_id TEXT NOT NULL REFERENCES teams(id),
  web_name TEXT NOT NULL,
  minutes INTEGER DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  xg REAL DEFAULT 0,
  xa REAL DEFAULT 0,
  chance_of_playing INTEGER,    -- 0, 25, 50, 75, 100, or NULL if available
  status TEXT,                  -- "a" available, "d" doubtful, "i" injured, "s" suspended, "u" unavailable
  news TEXT,
  captured_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(gameweek, season, player_id)
);

CREATE INDEX IF NOT EXISTS idx_player_snapshots_team ON player_snapshots(team_id, gameweek, season);
CREATE INDEX IF NOT EXISTS idx_player_snapshots_player ON player_snapshots(player_id);

-- User predictions
-- user_id is nullable: NULL = anonymous user tracked only by anon_user_id
CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,          -- UUID
  user_id TEXT,                 -- Better Auth user.id (NULL for anonymous)
  anon_user_id TEXT,            -- x-user-id header value (kept for migration traceability)
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  fixture_date INTEGER,         -- Unix timestamp, NULL if unknown
  league TEXT,
  predicted_home INTEGER NOT NULL,
  predicted_away INTEGER NOT NULL,
  outcome_probs_json TEXT,      -- JSON: { home: 0.58, draw: 0.22, away: 0.20 }
  model_scorelines_json TEXT,   -- JSON: [{ score: "2-1", pct: 14.2 }, ...]
  reasoning_summary TEXT,
  confidence TEXT,              -- "high" | "medium" | "low"
  status TEXT NOT NULL DEFAULT 'pending', -- "pending" | "resolved" | "unresolvable"
  actual_home INTEGER,
  actual_away INTEGER,
  outcome_correct INTEGER,      -- 0 | 1 | NULL
  exact_score_correct INTEGER,  -- 0 | 1 | NULL
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_anon ON predictions(anon_user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(status, fixture_date);
