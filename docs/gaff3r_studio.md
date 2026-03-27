# Gaff3r Studio: Specification Document

> **General-purpose football analysis research platform.**
> The conversational research assistant for anyone building football content. Ask any analytical question, get real computed data back, not LLM guesswork. Studio is Gaff3r's V2: the prediction engine becomes one feature among many.

---

## Table of Contents

1. [What Studio Is](#1-what-studio-is)
2. [The Content Creator Problem](#2-the-content-creator-problem)
3. [Core Capabilities](#3-core-capabilities)
4. [Text-to-SQL: The Killer Feature](#4-text-to-sql-the-killer-feature)
5. [The Analysis Template System](#5-the-analysis-template-system)
6. [Arbitrary Time-Window Analysis](#6-arbitrary-time-window-analysis)
7. [Comparison Engine](#7-comparison-engine)
8. [Player Evolution Tracking](#8-player-evolution-tracking)
9. [Youth & Recruitment Analysis](#9-youth--recruitment-analysis)
10. [Content Output: Scripts, Talking Points, Data Cards](#10-content-output-scripts-talking-points-data-cards)
11. [Data Pipeline Architecture](#11-data-pipeline-architecture)
12. [RAG: The Football Knowledge Layer](#12-rag-the-football-knowledge-layer)
13. [Visualization & Export](#13-visualization--export)
14. [Competitive Landscape](#14-competitive-landscape)
15. [Technical Implementation](#15-technical-implementation)
16. [Build Roadmap](#16-build-roadmap)

---

## 1. What Studio Is

Gaff3r Studio is the V2 evolution of Gaff3r. Where V1 focuses on match predictions backed by statistical models, Studio turns Gaff3r into a general-purpose football analysis research platform.

The distinction is important: Studio isn't a dashboard or a stats browser. It's a conversational interface backed by a structured data pipeline. You talk to it the way you'd talk to a research assistant: "Compare Arsenal's form under Arteta since the switch to a back three in GW12 with their earlier form this season." Studio computes the answer from real data, narrates it, and optionally formats it for content creation.

Every football content piece, whether it's a YouTube season review, a Twitter thread about a managerial change, a TikTok on transfer window winners, or a blog post about a title race, follows the same underlying pattern:

1. Define a time window or comparison frame
2. Compute metrics across that frame
3. Identify standout data points
4. Structure findings into a narrative

Studio provides the conversational research layer for that pattern. The specific content format is irrelevant to the engine. An end-of-season grades video and a mid-January form check exercise the same capabilities: arbitrary time windows, computed metrics, comparative analysis, narrative generation.

---

## 2. The Content Creator Problem

### The current workflow (3-5 hours per video)

A football content creator preparing a "Premier League Mid-Season Review" video currently:

1. Opens FBref for advanced stats (xG, progressive passes, defensive actions)
2. Opens Understat for xG model comparisons
3. Opens the FPL site for injury news and player form
4. Opens Transfermarkt for transfer data and player valuations
5. Opens WhoScored or Sofascore for match ratings
6. Manually cross-references data across these tabs
7. Copies numbers into a spreadsheet or notes app
8. Computes trends (form windows, per-90 stats) by hand or with formulas
9. Structures findings into a script
10. Fact-checks every number before recording

Steps 1-8 are pure research. They take 3-5 hours and produce raw material. Steps 9-10 are the creative work. Studio eliminates steps 1-8 and accelerates 9.

### Why existing tools don't solve this

**Raw stats platforms (FBref, Understat):** Provide data but no computation across arbitrary windows, no comparative framing, no narrative structure. You can see Arsenal's xG for the season; you can't ask "how did Arsenal's xG change in the 6 games after Saka's injury?" without manually filtering and calculating.

**Professional analytics (xvalue.ai, Comparisonator):** Target clubs and scouts at enterprise pricing ($500-10,000+/year). Comparisonator's "CompaGPT" generates publishable analysis, but it's built for scouting and board presentations, not YouTube video scripts.

**Generic LLMs:** Can generate plausible analysis text but hallucinate specific statistics. Asking ChatGPT for "Arsenal's xG per game in the last 10 matches" gets you a number that sounds right but may be fabricated. For published content where accuracy matters, this is unusable.

**The gap Studio fills:** Computed data (real numbers from a real database) + conversational interface (natural language queries) + content formatting (talking points, script sections, exportable cards). No existing product combines these three.

---

## 3. Core Capabilities

Studio has six core capabilities, each building on the data pipeline established in V1:

| Capability | What It Does | Powered By |
|---|---|---|
| **Text-to-SQL** | Natural language queries against the football database | D1 + LLM SQL generation |
| **Analysis Templates** | Pre-built and custom frameworks for common content formats | Template schema + computed metrics + LLM narrative |
| **Time-Window Analysis** | Computed metrics for any gameweek range | D1 gameweek snapshots |
| **Comparison Engine** | Side-by-side analysis of teams, managers, players, periods | D1 queries + delta computation |
| **Player Tracking** | Per-90 stats, form curves, injury timelines over any window | D1 player snapshots |
| **Content Output** | Talking points, script drafts, exportable data cards | LLM generation + workers-og |

These are not independent features. They compose. A template invocation might trigger a time-window query, run a comparison, pull player tracking data, generate a narrative, and export data cards, all in one conversational flow.

---

## 4. Text-to-SQL: The Killer Feature

Text-to-SQL is the single capability that most directly transforms Gaff3r from "a chatbot that knows about football" into "a research assistant that can answer any question about football with real computed data." It enables queries like:

- "Which team has the best away xG since Christmas?"
- "Top 5 players by goal contributions per 90 minutes in the last 6 gameweeks"
- "Compare Arsenal's clean sheet percentage at home vs away this season"
- "Which teams overperform their xG the most?"

Every one of these maps to a SQL query against the D1 database.

### How it works

```
User: "Which team has the best away record since GW15?"
                    |
                    v
   ┌─────────────────────────────┐
   │  1. Schema injection        │
   │  D1 table definitions +     │
   │  sample rows added to the   │
   │  system prompt              │
   └──────────────┬──────────────┘
                  |
                  v
   ┌─────────────────────────────┐
   │  2. Few-shot retrieval      │
   │  Vectorize finds 5 similar  │
   │  NL-to-SQL examples from    │
   │  a curated set              │
   └──────────────┬──────────────┘
                  |
                  v
   ┌─────────────────────────────┐
   │  3. SQL generation          │
   │  Code model generates SQL   │
   │  (qwen2.5-coder-32b or     │
   │  Llama 3.3 with JSON Mode) │
   └──────────────┬──────────────┘
                  |
                  v
   ┌─────────────────────────────┐
   │  4. Execution               │
   │  SQL runs against D1        │
   │  Results returned as rows   │
   └──────────────┬──────────────┘
                  |
                  v
   ┌─────────────────────────────┐
   │  5. Narrative synthesis     │
   │  Llama 3.3 narrates the    │
   │  results in Gaff3r's voice │
   └─────────────────────────────┘
```

### Implementation detail

**Step 1: Schema injection.** The D1 table schema (from Section 10 of the main PRD) is included in the system prompt. Not the full CREATE TABLE statements, but a condensed version:

```
AVAILABLE TABLES:
- match_results(fixture_id, home_team_id, away_team_id, home_goals, away_goals, home_xg, away_xg, competition_code, match_date, gameweek, season)
- team_params(team_id, team_name, competition_code, alpha, beta, elo_rating)
- snapshot_standings(snapshot_id, team_id, position, points, played, won, drawn, lost, goals_for, goals_against)
- snapshot_players(snapshot_id, player_id, team_id, name, position, form, minutes, goals, assists, xg, xa, status, news)
- gameweek_snapshots(id, gameweek, season, captured_at)

TEAM IDS: Arsenal=1, Aston Villa=2, Chelsea=6, Liverpool=12, Man City=13, Man United=14, Tottenham=18, ...
```

**Step 2: Few-shot retrieval.** Research shows that in-context learning with 5 similar query examples dramatically outperforms zero-shot text-to-SQL. Gaff3r maintains a curated set of 50-100 NL-to-SQL pairs, embedded in Vectorize. When a new query arrives, the 5 most semantically similar examples are retrieved and included in the prompt:

```
EXAMPLES:
Q: "Which team scored the most goals away from home?"
SQL: SELECT t.team_name, SUM(mr.away_goals) as total FROM match_results mr JOIN team_params t ON mr.away_team_id = t.team_id WHERE mr.season = '2025-26' GROUP BY t.team_name ORDER BY total DESC LIMIT 5;

Q: "Arsenal's form in the last 8 games"
SQL: SELECT home_goals, away_goals, home_team_id, away_team_id, match_date FROM match_results WHERE (home_team_id = 1 OR away_team_id = 1) AND season = '2025-26' ORDER BY match_date DESC LIMIT 8;
```

**Step 3: SQL generation.** The code-oriented model generates a SQL query. Workers AI's `@cf/qwen/qwen2.5-coder-32b-instruct` is optimal for this (rated at GPT-4o level for code tasks). JSON Mode ensures the output is parseable:

```typescript
const sqlResponse = await env.AI.run("@cf/qwen/qwen2.5-coder-32b-instruct", {
  messages: [
    { role: "system", content: schemaPrompt + fewShotExamples },
    { role: "user", content: `Generate a SQL query for: "${userQuery}". Return JSON: {"sql": "...", "explanation": "..."}` }
  ],
  response_format: { type: "json_object" }
});
```

**Step 4: Execution.** The generated SQL runs against D1 with parameter binding (preventing injection):

```typescript
const results = await env.DB.prepare(generatedSQL).all();
```

**Step 5: Narrative synthesis.** The raw query results are passed to Llama 3.3, which narrates them in Gaff3r's voice:

```
The data shows [results]. In the Gaff3r's view, [interpretation].
```

### Safety considerations

Generated SQL must be read-only. Gaff3r validates the query before execution:

```typescript
function isReadOnly(sql: string): boolean {
  const normalized = sql.trim().toUpperCase();
  return normalized.startsWith("SELECT") &&
    !normalized.includes("INSERT") &&
    !normalized.includes("UPDATE") &&
    !normalized.includes("DELETE") &&
    !normalized.includes("DROP") &&
    !normalized.includes("ALTER");
}
```

If the generated SQL fails validation or execution, Gaff3r tells the user it couldn't answer that specific query and suggests a rephrasing.

---

## 5. The Analysis Template System

Templates are the structural backbone of Studio. They define what gets computed, how it's organized, and what format the output takes. Every analysis workflow runs through a template, whether pre-built or custom.

### 5.1 Pre-Built Templates

Eight templates covering the most common football content formats:

| Template | Use Case | Key Metrics |
|---|---|---|
| **Team season grade** | End-of-season or mid-season evaluation | Overall record, attack/defence split, xG performance, best player, biggest disappointment |
| **Managerial comparison** | Before/after a sacking, or two-era comparison | Points/game, xG/game, goals conceded, results vs top 6, results vs bottom 6 |
| **Transfer window impact** | January or summer window assessment | New signings' minutes + contributions, departures' replacement quality, team form pre/post window |
| **Title/relegation race** | Multi-team comparison at any season point | Form over last N games, remaining fixture difficulty, injury concerns, xG trend, H2H |
| **Player spotlight** | Deep dive on one player | Per-90 stats, form curve, xG vs actual, minutes trend, positional peer comparison |
| **Gameweek window review** | "The story of GW15-GW25" | Biggest movers, standout performances, upsets, form reversals, emerging trends |
| **Derby/rivalry preview** | Pre-match deep dive for a specific fixture | H2H history, current form, key matchups, injury impact, model prediction |
| **Monthly roundup** | Regular content cadence | Team of the month, player of the month, biggest upset, period form table |

Each template defines: a scope (single team, multi-team, player, league-wide), a set of categories with weighted metrics, optional comparison frames, optional grading scales, and output preferences.

### 5.2 Custom Template Schema

Users build their own templates by selecting category types, metrics, and output preferences. Stored in the user's Durable Object, reusable across sessions.

```typescript
interface AnalysisTemplate {
  id: string;
  name: string;                         // "My end of season grades"
  description?: string;
  createdAt: string;
  lastUsedAt?: string;
  scope: TemplateScope;
  categories: TemplateCategory[];
  output: OutputPreferences;
}

type TemplateScope =
  | { type: "single_team" }
  | { type: "multi_team"; count?: number }
  | { type: "single_player" }
  | { type: "player_comparison"; count?: number }
  | { type: "league_wide" }
  | { type: "custom_group"; teams?: string[] };

interface TemplateCategory {
  id: string;
  name: string;                         // "Attack", "Defensive record"
  weight?: number;                      // For grading (0-100)
  metrics: MetricDefinition[];
  comparisonFrame?: ComparisonFrame;
  gradingScale?: GradingScale;
}

interface MetricDefinition {
  key: MetricKey;
  label: string;
  source: "computed" | "fpl" | "historical";
  timeWindow?: TimeWindow;
}
```

### 5.3 Supported Metrics

The data pipeline supports the following computable metrics. Each maps to a SQL query or computation against D1:

**Team performance:**
`wins`, `draws`, `losses`, `points`, `points_per_game`, `goals_scored`, `goals_conceded`, `goal_difference`, `xg_for`, `xg_against`, `xg_difference`, `xg_overperformance` (goals minus xG), `clean_sheets`, `clean_sheet_pct`, `form_string`

**Positional/context splits:**
`home_record`, `away_record`, `vs_top_6`, `vs_bottom_6`, `first_half_goals`, `second_half_goals`

**Player-level (aggregated across squad):**
`top_scorer`, `top_assister`, `top_xg`, `minutes_for_u21`, `u21_goal_contributions`

**Set pieces:**
`set_piece_goals`, `set_piece_goals_conceded` (where data available)

**FPL-specific:**
`fpl_strength_attack`, `fpl_strength_defence`, `avg_fdr`, `remaining_fdr`

**Model-derived:**
`dixon_coles_alpha`, `dixon_coles_beta`, `elo_rating`, `predicted_points` (from Monte Carlo season simulation)

### 5.4 Time Window Types

```typescript
interface TimeWindow {
  type: "gameweek_range" | "last_n_games" | "date_range" | "full_season"
       | "pre_event" | "post_event" | "manager_tenure";
  from?: number;                        // GW number
  to?: number;
  count?: number;                       // For last_n_games
  startDate?: string;                   // ISO 8601
  endDate?: string;
  eventDescription?: string;            // "Saka injury", "Amorim appointed"
  eventGameweek?: number;
}
```

Time windows are the foundation of Studio's flexibility. Unlike season-level stats (which every platform provides), arbitrary windows enable questions like "form since the January window," "the 8 games after the manager change," or "GW5-GW15 vs GW20-GW30." These queries are only answerable because V1's cron pipeline logged the data weekly.

### 5.5 Comparison Frames

```typescript
interface ComparisonFrame {
  type: "previous_period" | "same_period_last_season" | "league_average"
       | "specific_team" | "specific_window" | "manager_vs_manager";
  target?: string;
  targetWindow?: TimeWindow;
}
```

### 5.6 Grading Scales

```typescript
type GradingScale =
  | { type: "letter"; scale: "A-F" | "A+-F" }
  | { type: "numeric"; min: number; max: number }
  | { type: "custom"; levels: { label: string; threshold: number }[] };
```

### 5.7 Output Preferences

```typescript
interface OutputPreferences {
  format: "talking_points" | "draft_paragraphs" | "structured_outline"
        | "data_table" | "data_cards";
  tone?: "analytical" | "conversational" | "pundit" | "formal";
  lengthPerCategory?: "brief" | "standard" | "detailed";
  includeDataCards?: boolean;
  includeRawData?: boolean;
}
```

### 5.8 Template Execution Pipeline

When a user invokes a template:

1. **Resolve scope.** Determine which teams/players. For "single_team", user specifies which. For "league_wide", iterate all 20.
2. **Compute metrics.** For each category, execute D1 queries (often via text-to-SQL) to pull required metrics within the specified time window. All computation is real, not LLM-generated.
3. **Apply comparisons.** If a category has a comparison frame, compute the same metrics for the target and calculate deltas.
4. **Apply grading.** If a grading scale is defined, assign grades. This can be rule-based (>2.0 ppg = A) or LLM-assisted (the AI interprets numbers in context).
5. **Generate output.** Feed computed data to the LLM with output preferences. The LLM produces the narrative, talking points, or outline.
6. **Export.** Optionally generate data cards for key findings via `workers-og`.

### 5.9 Conversational Invocation

Users don't need a form UI. They invoke templates conversationally:

- "Run my Team Season Grade template for Arsenal"
- "Do a managerial comparison for Man United: Ten Hag's last 12 vs Amorim's first 12"
- "Give me a title race breakdown for the top 4 since Christmas"
- "Run a monthly roundup for February"

The LLM parses intent, maps to a template (or suggests one), resolves parameters, and kicks off the execution pipeline. If parameters are ambiguous, Gaff3r asks.

### 5.10 Template Management

A library panel where users can: browse pre-built templates, duplicate and modify them, build custom templates (category picker, metric selector, comparison frame, grading scale), save/name/reuse, and see execution history.

---

## 6. Arbitrary Time-Window Analysis

This is the capability that makes Studio fundamentally different from static stats platforms. Every stats site can tell you a team's season totals. Studio can tell you a team's metrics across any arbitrary window of games.

### What it computes

For a given team and time window, Studio produces:

```
Arsenal GW15-GW25:
  Record: 6W 2D 3L (20 points from 33 available, 1.82 ppg)
  Goals: 19 scored, 11 conceded (GD: +8)
  xG: 21.3 for, 12.8 against (xGD: +8.5)
  xG overperformance: -2.3 (scoring fewer than chances suggest)
  Clean sheets: 4 (36.4%)
  Form: W W D L W W L D W W L
  Top scorer in window: Saka (5G 3A)
  Home: 4W 1D 1L | Away: 2W 1D 2L
```

### How it works

Every datapoint comes from D1 queries against the `match_results` and `snapshot_players` tables, filtered by gameweek range. No LLM generation.

```sql
-- Team record in a gameweek window
SELECT
  SUM(CASE WHEN (home_team_id = ? AND home_goals > away_goals)
           OR (away_team_id = ? AND away_goals > home_goals) THEN 1 ELSE 0 END) as wins,
  SUM(CASE WHEN home_goals = away_goals THEN 1 ELSE 0 END) as draws,
  -- ... losses, goals, xG
FROM match_results
WHERE (home_team_id = ? OR away_team_id = ?)
  AND gameweek BETWEEN ? AND ?
  AND season = ?;
```

### Why this matters

"Arsenal's form since GW15" isn't just a nice-to-have. It's the fundamental building block of almost every football analysis question:

- "How has the team performed since the new manager took over?" = time window starting at the appointment gameweek
- "Were they better in the first half or second half of the season?" = two time windows compared
- "What happened after they lost Saka to injury?" = pre-event vs post-event windows
- "Which team has the best form in the last 10 games?" = rolling window across all teams

Every comparison, every grading framework, every trend analysis is built on top of time-window queries.

---

## 7. Comparison Engine

Comparison is the second fundamental operation (after time-window querying). It takes two sets of computed metrics and produces deltas.

### Comparison types

**Team vs team (same period):**
"Compare Arsenal and Chelsea since GW15." Both teams' metrics computed over GW15-current, then deltas shown.

**Team vs self (different periods):**
"Arsenal first half vs second half." Same team, two windows, with deltas showing improvement or decline.

**Manager vs manager:**
"Compare Ten Hag's last 12 games vs Amorim's first 12." The system resolves managerial tenures to gameweek ranges, then computes metrics for each window.

**Player vs player:**
"Compare Saka and Palmer this season." Per-90 stats for both players across the same time window, with positional context.

**Team vs league average:**
"How does Arsenal's defence compare to the league average?" Team metrics vs the mean of all 20 teams.

**Season vs season:**
"Compare this Arsenal to last season's." Requires historical data (DataHub.io for older seasons, V1's own snapshots for current).

### Output format

Comparisons produce a structured delta object:

```typescript
interface ComparisonResult {
  subjectA: { name: string; window: string; metrics: Record<string, number> };
  subjectB: { name: string; window: string; metrics: Record<string, number> };
  deltas: Record<string, {
    value: number;
    direction: "better" | "worse" | "neutral";
    significance: "major" | "minor" | "negligible";
  }>;
  narrative: string;  // LLM-generated summary of the comparison
}
```

---

## 8. Player Evolution Tracking

Tracks individual players across any time window using accumulated FPL snapshot data.

### Available per-player metrics

From `snapshot_players` table: form (FPL form rating), total points, minutes, goals, assists, xG, xA, clean sheets, status, injury news, chance of playing. All logged per gameweek, so any window is queryable.

### Computed per-90 stats

```
Saka (Arsenal, GW1-GW25):
  Minutes: 2,043 (22.7 per 90-min matches)
  Goals: 8 (0.35 per 90)
  Assists: 6 (0.26 per 90)
  xG: 7.2 (0.32 per 90) -- slightly overperforming
  xA: 5.8 (0.26 per 90) -- on par with actual
  Goal involvements: 14 (0.62 per 90)
  Form curve: 4.2 -> 6.8 -> 7.3 -> 5.1 -> 8.2 (trending up after dip)
```

### Use cases

- **Breakout player analysis.** "Show me players under 21 who've increased their minutes by 50%+ compared to last season."
- **New signing assessment.** "How has [signing] performed since arriving? Compare their xG/90 here vs at their previous club." (Previous club data requires Transfermarkt/FBref supplementary data.)
- **Injury impact tracking.** "Show me Saka's form trajectory. When was he injured? How did his numbers change after returning?" The injury timeline is captured in the `status` and `news` fields of player snapshots.
- **Decline detection.** "Which established players have seen the biggest drop in per-90 output this season?"

---

## 9. Youth & Recruitment Analysis

### Youth tracking

Query `snapshot_players` for players under 21 (age derivable from Transfermarkt data or FPL's `element_type` combined with external age data):

- Minutes trend across gameweeks (increasing involvement = breakthrough)
- Performance metrics relative to experience (xG/90 for a 19-year-old vs squad average)
- Which youth players are getting opportunities in which competitions

### Recruitment analysis

For new signings, compare:
- Team form in the N games before the signing's debut vs the N games after
- The signing's own metrics post-arrival vs the player they replaced
- Whether the team's tactical profile changed (xG distribution, defensive record)

Data limitations: pre-arrival stats for new signings require FBref or Transfermarkt data, which is outside the FPL API pipeline. For Studio, this is supplementary data fetched on demand via Browser Rendering or manual enrichment.

---

## 10. Content Output: Scripts, Talking Points, Data Cards

### Output formats

After computing data via templates, comparisons, or ad-hoc queries, Studio generates content in four formats:

**Talking points:** Bullet-style key findings, ordered by importance. Designed for video scripts where the creator narrates over the points.

**Draft paragraphs:** Prose sections in Gaff3r's voice (or adapted to the creator's preferences). Each paragraph covers one category or finding, grounded in the computed data.

**Structured outline:** Section headers with sub-points, designed as a video or article skeleton that the creator fills in.

**Data cards:** Visual stat graphics exported as PNG via `workers-og`. Shareable on social media or insertable into video editing timelines.

### Voice and style preferences

Stored in the user's Durable Object. Configurable:

```typescript
interface ContentPreferences {
  tone: "analytical" | "conversational" | "pundit" | "formal";
  lengthPreference: "brief" | "standard" | "detailed";
  formatPreference: "talking_points" | "paragraphs" | "outline";
  includeRawNumbers: boolean;           // Show computed stats alongside narrative
  includeModelOutputs: boolean;         // Show Dixon-Coles probabilities where relevant
  channelContext?: string;              // "YouTube video", "Twitter thread", "blog post"
}
```

The LLM adapts its output based on these preferences. A YouTube-oriented creator gets different output than a Twitter thread creator: longer narrative sections vs punchier stat-driven points.

---

## 11. Data Pipeline Architecture

Studio's data pipeline has three layers:

### Layer 1: Data ingestion (V1 cron Worker)

Runs weekly. Captures FPL API snapshot + resolves match results.

```
Monday 6am Cron Trigger
    |
    +-- Fetch FPL bootstrap-static/
    |     +-- Extract team standings, strength ratings
    |     +-- Extract all player stats (form, xG, xA, minutes, injuries)
    |
    +-- Fetch FPL fixtures/
    |     +-- Extract completed match results with scores
    |     +-- Extract upcoming fixtures
    |
    +-- Store in D1:
    |     +-- gameweek_snapshots row
    |     +-- snapshot_standings rows (20 teams)
    |     +-- snapshot_players rows (500+ players)
    |     +-- match_results rows (10 matches per GW)
    |
    +-- Re-estimate Dixon-Coles parameters
    |     +-- MLE on all match_results with time decay
    |     +-- Update team_params table
    |
    +-- Resolve pending predictions
    |     +-- Match completed results against predictions
    |     +-- Update accuracy stats in user DOs
    |
    +-- Embed new match analyses in Vectorize
          +-- For RAG retrieval in future queries
```

### Layer 2: Query computation (on-demand)

When a Studio query arrives, the Worker:

1. Parses user intent (which capability? which teams? which window?)
2. Generates SQL via text-to-SQL pipeline (if needed)
3. Executes against D1
4. Computes derived metrics (per-90 stats, deltas, trends)
5. Passes computed data to LLM for narrative synthesis

All computation happens in the Worker. D1 queries are fast (SQLite). The expensive operation is the LLM call, not the data retrieval.

### Layer 3: Knowledge accumulation (ongoing)

Every analysis Studio produces becomes part of its knowledge base:

- Match analyses embedded in Vectorize for RAG retrieval
- Template execution history stored in user's DO
- Model predictions tracked and resolved for calibration
- User's content preferences learned over time

The system gets more useful the longer it runs. By season's end, Gaff3r has a complete record of every gameweek, every player's evolution, every team's trajectory, and every analysis it's produced. That corpus is the moat.

---

## 12. RAG: The Football Knowledge Layer

### Architecture

```
User query: "How did Liverpool typically respond after losing?"
    |
    v
Embed query using @cf/baai/bge-base-en-v1.5
    |
    v
Search Vectorize for semantically similar documents
    |
    v
Retrieve top 5 matches:
  - "Liverpool 3-1 Wolves (GW18): Bounced back from derby loss..."
  - "Liverpool 2-0 Brighton (GW24): Strong response after Cup exit..."
  - ...
    |
    v
Feed retrieved documents + query to Llama 3.3
    |
    v
Synthesized response grounded in actual match history
```

### What gets embedded

- Match analysis outputs (every prediction + reasoning from V1)
- Gameweek summaries (auto-generated from snapshot data)
- Template execution outputs (when Studio analyses are produced)
- Football news/context (if news API integrated in future)

### Chunking strategy

Each document represents one atomic football event or analysis:
- One match = one document (teams, score, key stats, analysis narrative)
- One player gameweek = one document (stats, form, injury status)
- One template output = one document per team analyzed

Documents are tagged with metadata (team_ids, competition, gameweek, season) for filtered search.

---

## 13. Visualization & Export

### Data cards via workers-og

`workers-og` (Satori + resvg-wasm) generates PNG images from HTML/CSS templates at the edge. Sub-100ms rendering.

Card types:
- **Prediction card:** Team names, predicted score, model probabilities, confidence
- **Comparison card:** Two-column stat comparison with delta indicators
- **Player spotlight card:** Photo placeholder, key per-90 stats, form sparkline
- **Season grade card:** Team badge placeholder, letter grade, key metrics summary
- **Form card:** Last N results with W/D/L indicators and points tally

Each card is a React component rendered to HTML, then run through Satori on the Worker. The same component renders in the browser (interactive) and on the server (static PNG).

### Chart components (browser-side)

For interactive analysis in the frontend, using Nivo (rich dashboards) and Recharts (simple stats):

- **Form timeline:** Line chart of points per game over gameweeks
- **xG trend:** Dual-axis chart showing xG created vs conceded over time
- **Player radar:** Radar chart comparing player metrics to positional average
- **League position race:** Bump chart showing position changes over the season
- **Shot map / heat map:** D3-based pitch visualization (using `d3-soccer` plugin for SPADL coordinate systems) when event-level data is available

### Football pitch rendering

`d3-soccer` provides D3 bindings for pitch drawing with support for StatsBomb and Opta coordinate systems. `react-soccer-lineup` renders formation/lineup displays. For Studio, lineup visualization accompanies prediction cards and tactical analysis.

---

## 14. Competitive Landscape

### Who Studio competes with (and how it's different)

| Competitor | What They Do | Studio's Advantage |
|---|---|---|
| **FBref** | Static stat database, comprehensive but no AI, no computation across windows | Studio computes. "Arsenal's form since GW15" is a query, not manual filtering. |
| **Understat** | xG models, shot maps | Studio has xG data AND can query it conversationally across arbitrary windows |
| **xvalue.ai** | AI-generated seasonal reports, scouting | Enterprise pricing ($$$). Studio is a personal tool. |
| **Comparisonator** | Player comparison with publishable graphics | Targets professional scouts/media. Studio targets individual creators. |
| **ChatGPT / Claude** | Can discuss football fluently | Hallucinates specific statistics. No real database underneath. |
| **FPL Review / Solio** | FPL optimization and analytics | Targets FPL managers, not content creators. Different use case entirely. |

### The gap

No existing product combines: (1) a real computed data pipeline, (2) a conversational query interface, (3) arbitrary time-window analysis, (4) content creation output formatting. Studio occupies this intersection.

---

## 15. Technical Implementation

### Cloudflare components used by Studio

| Component | Studio Role |
|---|---|
| **D1** | Primary data store. Gameweek snapshots, match results, team params, player data. All time-window queries run against D1. |
| **Vectorize** | RAG corpus. Match analyses, gameweek summaries, template outputs. Semantic search for knowledge retrieval. |
| **Workers AI** | Text-to-SQL generation (qwen2.5-coder-32b), narrative synthesis (Llama 3.3), embedding generation (bge-base-en-v1.5). |
| **Durable Objects** | Per-user state: custom templates, content preferences, execution history. |
| **KV** | Cache layer for expensive D1 queries (time-window aggregations with 30-min TTL). |
| **Workflows** | Durable multi-step execution for template pipelines. Fetch data from multiple sources, compute metrics, run model, generate output, create cards. Retries automatically on failure. |
| **R2** | Object storage for generated data cards and exported content. |
| **Cron Triggers** | Weekly data ingestion, parameter estimation, prediction resolution. |
| **AI Gateway** | Semantic caching for repeated queries, rate limiting, model fallback. |

### Workers AI models used

| Model | Purpose |
|---|---|
| `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | Primary analysis, narrative synthesis, template output generation |
| `@cf/qwen/qwen2.5-coder-32b-instruct` | Text-to-SQL generation |
| `@cf/baai/bge-base-en-v1.5` | Document embedding for RAG |
| `@cf/meta/llama-3.1-8b-instruct` | Fallback for lighter tasks (intent classification, fixture matching) |

### Estimated D1 storage

Per Premier League season:
- 38 gameweek snapshots: ~38 rows
- 38 x 20 standings entries: ~760 rows
- 38 x 550 player snapshots: ~20,900 rows
- 380 match results: ~380 rows
- 20 team parameters: ~20 rows (overwritten weekly)

Total: ~22,000 rows per season. At ~200 bytes per row average: ~4.4 MB per season. D1's 10GB limit supports 2,000+ seasons of data. Storage is not a concern.

---

## 16. Build Roadmap

Studio builds on top of V1's data pipeline. The order is deliberate: each step depends on the previous.

### Phase 1: Foundation (Week 1-2 post V1)

**Goal:** D1 schema in place, text-to-SQL working for basic queries.

- Define and deploy D1 tables (match_results, team_params, snapshot_standings, snapshot_players, gameweek_snapshots)
- Backfill historical data from Football-Data.co.uk (2-3 seasons of match results)
- Implement text-to-SQL pipeline: schema injection, few-shot examples, SQL generation, execution, narrative synthesis
- Test with 20-30 natural language queries, iterate on few-shot examples

### Phase 2: Time-Window + Comparison (Week 3-4)

**Goal:** Arbitrary time-window queries and comparison engine working.

- Implement time-window resolver (gameweek range, last-N, date range, pre/post event)
- Build comparison engine: same-period, different-period, team-vs-team, player-vs-player
- Wire comparison output into LLM narrative synthesis
- Test against real Studio workflow: "Compare Arsenal's form under different tactical setups"

### Phase 3: Templates (Week 5-6)

**Goal:** Pre-built templates executing end-to-end. Custom template creation.

- Implement template execution pipeline (resolve scope, compute metrics, apply comparisons, grade, generate output)
- Build 8 pre-built templates with hardcoded category/metric definitions
- Implement conversational template invocation (LLM parses intent, maps to template)
- Build custom template CRUD in the DO
- Template library UI in frontend

### Phase 4: Player Tracking + Content Output (Week 7-8)

**Goal:** Per-player evolution queries. Script generation and data card export.

- Implement player tracking queries against snapshot_players
- Build per-90 computation utilities
- Implement output format system (talking points, paragraphs, outline)
- Integrate `workers-og` for data card generation
- Build content preferences in DO
- R2 storage for exported cards

### Phase 5: RAG + Polish (Week 9-10)

**Goal:** Knowledge layer working. Full Studio workflow polished.

- Embed existing match analyses and gameweek summaries in Vectorize
- Wire RAG retrieval into the query pipeline
- Implement Workflows for multi-step template execution
- Frontend polish: template library, comparison views, export UI
- End-to-end testing with real content creation workflow

---

*Document Version: 1.0*
*Author: Divine*
*Created: March 2026*
*Project: Gaff3r Studio*
*Parent: gaff3r_prd.md*
