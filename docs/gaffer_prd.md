# Gaffer — Product Requirements Document

> **An AI-powered football match analyst built on Cloudflare's edge infrastructure.**
> Chat with a sharp, opinionated gaffer about any upcoming match, get data-backed predictions, track your accuracy, and build a longitudinal football intelligence dataset that powers increasingly deep analysis over time.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Evolution & North Star](#2-product-evolution--north-star)
3. [Problem Statement](#3-problem-statement)
4. [Product Vision & Principles](#4-product-vision--principles)
5. [Target Users](#5-target-users)
6. [Feature Requirements](#6-feature-requirements)
7. [System Architecture](#7-system-architecture)
8. [Cloudflare Component Mapping](#8-cloudflare-component-mapping)
9. [Data Architecture](#9-data-architecture)
10. [Data Sources & Integration](#10-data-sources--integration)
11. [AI & Prompt Engineering](#11-ai--prompt-engineering)
12. [API Specification](#12-api-specification)
13. [Frontend Specification](#13-frontend-specification)
14. [Performance Requirements](#14-performance-requirements)
15. [Security & Privacy](#15-security--privacy)
16. [Development Roadmap](#16-development-roadmap)
17. [Success Metrics](#17-success-metrics)
18. [Risks & Mitigations](#18-risks--mitigations)
19. [Repository Structure](#19-repository-structure)
20. [Submission Checklist](#20-submission-checklist)

---

## 1. Executive Summary

**Product Name:** Gaffer
**Repository:** `cf_ai_gaffer`
**Platform:** Web (Cloudflare Pages + Workers)
**LLM:** Llama 3.3 70B via Cloudflare Workers AI
**Primary Data Source:** FPL API (Premier League), football-data.org (other competitions)
**Target Submission:** Cloudflare Internship Assignment

### What It Does

Gaffer is a conversational football analyst. Ask about any fixture ("Arsenal vs Chelsea this weekend") and it assembles real match data, reasons through it like a knowledgeable manager reviewing the opposition, and delivers a specific scoreline prediction with transparent reasoning. For Premier League matches, Gaffer pulls enriched data from the FPL API: team strength ratings, player-level form with xG/xA, injury reports, fixture difficulty, and set piece taker information. The system tracks every prediction, resolves them against real results, and maintains a running accuracy profile.

The name says it all. In football, the "gaffer" is the boss, the manager, the one who's studied the tape and knows the game inside out. That's the persona: authoritative, data-driven, opinionated, but honest when the call is a tough one.

### Where It's Going

Gaffer V1 is a match prediction chat built for a Cloudflare internship submission. But the longer-term vision is a football intelligence platform that accumulates structured data over time and powers increasingly deep analysis: multi-gameweek performance breakdowns, season-over-season comparisons, player evolution tracking, and content creation research workflows. The prediction engine is the entry point; the accumulated data pipeline is the real product.

### Core Technical Achievement

The project demonstrates mastery of Cloudflare's AI infrastructure by orchestrating four components in a single request pipeline: Pages serves the frontend, a Worker orchestrates data fetching and prompt assembly, Workers AI runs inference on Llama 3.3, and Durable Objects maintain per-user state. For Premier League matches specifically, the Worker enriches prompts with FPL API data (player injuries, xG, team strength ratings) that generic chatbots simply don't have access to.

---

## 2. Product Evolution & North Star

Gaffer is designed as a staged product. V1 ships this weekend for the internship submission. V2 and V3 extend the platform as personal tools built around recurring needs: match analysis now, content creation research later. Each version layers on top of the previous one without requiring architectural rewrites.

### V1: Match Prediction Chat (Internship Submission)

**Scope:** Conversational match analyst with predictions and accuracy tracking.

**Core loop:** User asks about a match > Worker fetches data > LLM generates analysis with prediction > prediction stored in Durable Object > accuracy tracked over time.

**Data sources:** FPL API (Premier League), football-data.org (La Liga, Bundesliga, Serie A, Ligue 1, Champions League).

**Timeline:** One weekend.

### V2: Data Accumulation & Integrations (Post-Submission, 2-3 Weeks)

**Scope:** Begin logging FPL data week-over-week to build a longitudinal dataset. Add Predictions League integration. Enhance PL match analysis with deeper player-level insights.

**Key additions:**
- Weekly FPL data snapshots stored in Durable Objects or D1 (Cloudflare's SQL database): player form, injuries, team strength ratings, fixture results. This data is ephemeral in the FPL API and lost after each gameweek update. Capturing it over time is what creates the historical dataset that powers V3.
- Predictions League account linking via read-only link codes. Gaffer can reference the user's PL prediction history and accuracy in conversation.
- Automated prediction resolution via Cloudflare Cron Triggers (daily scheduled Worker).
- Streaming responses for better perceived performance.

**Why V2 matters architecturally:** The FPL API only reflects current-state data. Player form, injury status, and team strength ratings change every gameweek. By logging snapshots weekly, Gaffer builds a dataset that no external API provides: a time-series record of how teams and players evolved across a season. This accumulated data is what lets V3 answer questions like "how did Arsenal perform in the 6 weeks after Saka's injury?" or "compare the top 4 teams' form since the January window." Without V2's logging, those queries are unanswerable with real data.

### V3: Gaffer Studio (The North Star)

**Scope:** General-purpose football analysis research platform. Gaffer becomes the tool you talk to whenever you're building any kind of football analysis content: a mid-season review, an end-of-season awards video, a post-sacking managerial comparison, a transfer window impact assessment, a title race deep dive, a relegation battle breakdown, or a "how has X team changed since Y event" thread.

The key insight is that almost all football analysis content follows the same underlying pattern: define a time window or comparison frame, compute metrics across that frame, identify standout data points, and structure them into a narrative. Gaffer Studio provides the conversational research layer for that pattern regardless of what the specific content piece is.

**Example workflows:**

*End-of-season grades video:*
1. "Give me Arsenal's full season breakdown." Gaffer pulls computed data from its accumulated dataset: W/D/L splits, xG trends, key player form trajectories, injury timelines.
2. "Compare that to last season." Gaffer surfaces the delta: points, goals, new signings' impact.
3. "Draft the Arsenal section." Structured talking points from computed data.

*Mid-season managerial change analysis:*
1. "Compare Man United's form under Ten Hag's last 10 games vs Amorim's first 10." Gaffer computes both windows: points/game, xG/game, goals conceded, defensive record, set piece effectiveness.
2. "Which players improved the most under the new manager?" Per-90 comparison for overlapping players across both windows.
3. "What's changed tactically?" Formation shifts, possession stats, pressing intensity (where data permits).

*Transfer window impact piece:*
1. "Show me every January signing in the PL this season and their stats since joining." Minutes, goal contributions, xG, form trajectory post-arrival.
2. "Which signing has had the biggest impact on their team's results?" Compare team form pre and post the player's integration.

*Title race deep dive (mid-season):*
1. "Compare the top 4 teams' form since GW15." Side-by-side computed metrics for a specific window.
2. "Who has the hardest run-in?" Aggregate FDR for remaining fixtures.
3. "Which squad has the biggest injury concerns right now?" Current injury report across all title contenders.

*Relegation battle breakdown:*
1. "Give me the bottom 5 teams' form over the last 10 gameweeks." Computed form windows showing who's trending up vs down.
2. "Which of these teams overperforms their xG the most?" Flags teams living on borrowed time.

The common thread: every content piece requires querying a specific time window, computing real metrics, comparing across teams/players/periods, and structuring findings. Gaffer Studio handles the research and computation; the creator handles the narrative and presentation.

**Feature set:**
- Arbitrary time-window analysis: query any gameweek range for any team ("Arsenal GW12-GW22"), get computed metrics. Not limited to season-level granularity.
- Comparison engine: compare any two time windows ("Team A under Manager X vs Manager Y"), any two teams over the same period, or any two players across overlapping minutes.
- Analysis template system: 8 pre-built templates for common content formats (Team Season Grade, Managerial Comparison, Transfer Window Impact, Title Race, Player Spotlight, Gameweek Window Review, Derby Preview, Monthly Roundup) plus a custom template builder where users define their own categories, metrics, comparison frames, grading scales, and output format. Templates are invokable conversationally or via a library UI. Full schema in Section 6.3.8.
- Player evolution tracking: per-90 stats over any time window, form curves, injury timeline, minutes trajectory.
- Youth and recruitment analysis: U21 breakthrough tracking, new signings' pre vs post-arrival performance.
- Script/talking points generation: structured output adapted to the creator's voice and format preferences
- Exportable data cards: shareable stat graphics for video editing or social media

**Data moat:** The value in V3 is not the LLM (any chatbot can generate plausible analysis text). It's the accumulated, structured, computed data pipeline underneath. Arbitrary time-window aggregation requires actual calculation, not generation. Managerial comparison across specific gameweek ranges requires structured historical data. Injury timelines across a season require logging ephemeral FPL data weekly. None of this is replicable by prompting ChatGPT.

---

## 3. Problem Statement

### For V1 (Match Predictions)

- Pre-match analysis is scattered across multiple sources (stats sites, podcasts, social media)
- Generic AI assistants give vague, hedged responses about football because they lack real-time data
- Prediction tracking is manual; nobody systematically measures how good their instincts are
- Most "prediction" apps are betting platforms in disguise, not analysis tools

### For V3 (Content Creation Research)

- Football content creators spend 3-5 hours per video on data research across 5-6 different platforms, whether the piece is a season review, a mid-season check-in, a managerial comparison, a transfer window assessment, or a title race breakdown
- Raw stats platforms (FBref, Understat) provide data but no narrative structure, no arbitrary time-window computation, and no comparative framing
- Professional analytics tools (xvalue.ai, Comparisonator) target clubs and scouts at enterprise pricing, not individual creators
- LLMs can generate plausible analysis text but hallucinate specific statistics and can't compute metrics across custom gameweek ranges from real data
- No tool combines computed football data with a conversational research interface that lets you ask "compare X under these conditions vs Y under those conditions" and get real numbers back

---

## 4. Product Vision & Principles

### Vision Statement

> Make every football fan feel like they've got a gaffer in their pocket: someone who's watched every match, studied every stat, and isn't afraid to make a call. And for content creation, make Gaffer the research assistant that can answer any analytical question about football with real computed data, not guesswork.

### Product Principles

**1. Opinionated, Not Hedged**
The AI takes a position. It doesn't say "it could go either way." It says "Arsenal 2-1, here's why" and acknowledges what could prove it wrong.

**2. Data-First, Not Hallucination-Friendly**
Every claim is grounded in real data injected into the prompt. The AI never invents statistics. For Premier League matches, this means FPL API data: actual xG numbers, actual injury reports, actual team strength ratings.

**3. Conversational, Not Dashboard-y**
The interaction feels like chatting with a knowledgeable manager, not querying a database. The AI has personality: it expresses surprise at form swings, shows enthusiasm about compelling fixtures, and owns it when a prediction was wrong.

**4. Transparent Accuracy**
Users always see how predictions measure up against reality. Honest feedback loop.

**5. Accumulate, Don't Discard**
Every interaction produces data. Predictions are stored. Match data is logged. Player form is tracked over time. The product gets more capable the longer it runs, not because the LLM improves, but because the underlying dataset deepens.

**6. Simple Now, Deep Later**
V1 is a chat box. No signup walls, no complex navigation. Depth layers on progressively across versions without breaking the core experience.

---

## 5. Target Users

### V1: The Prediction Enthusiast

- Watches matches regularly, participates in prediction leagues or pub debates
- Wants data-backed pre-match briefings
- Values accuracy tracking
- Age 18-40, comfortable with chat interfaces, likely on mobile

### V3: The Football Content Creator (Future)

- Makes YouTube videos, TikToks, or Twitter threads about football analysis
- Content ranges from season reviews to mid-season check-ins, managerial comparisons, transfer assessments, title race breakdowns, relegation previews, and player spotlights
- Spends hours doing manual research across multiple stats platforms before scripting
- Wants computed data and structured talking points, not raw stat tables
- Values accuracy in numbers (can't afford wrong stats in a published video)
- Needs comparative analysis across arbitrary time windows (not just "this season" but "these specific 10 gameweeks")

### Anti-User

- Someone looking for betting tips or guaranteed outcomes. Gaffer is an analysis tool, not a tipster service.
- Users expecting real-time match commentary. Gaffer is pre-match and post-season analysis.

---

## 6. Feature Requirements

### 6.1 Core Features (V1 / MVP, P0)

#### 6.1.1 Match Analysis Chat

A conversational interface where users ask about upcoming football matches and receive data-backed analysis with specific predictions.

**User Flow:**
1. User types a natural-language query
2. System identifies the fixture from the query
3. System fetches real-time match data. For PL: FPL API (team strength, player form/xG/injuries, fixture difficulty). For other leagues: football-data.org (standings, recent results).
4. System builds an enriched prompt and sends it to the LLM
5. AI delivers a structured analysis with a specific scoreline prediction
6. Prediction is automatically stored in the user's history

**Acceptance Criteria:**
- Responds within 8 seconds (including data fetch + LLM inference)
- Correctly identifies teams from common names, abbreviations, and partial matches
- Delivers a specific scoreline, not just outcome direction
- PL matches include player-level detail (key player form, injury news, set piece takers)
- Non-PL matches provide standings-based analysis from football-data.org
- Handles missing data gracefully

**Edge Cases:**
- Match already played: provide result and post-match analysis
- Uncovered league: explain coverage limitations
- Ambiguous team name ("United"): ask for clarification
- Non-football question: redirect with personality

#### 6.1.2 Prediction Storage

Every scoreline prediction automatically stored with full context for future resolution.

**Stored per prediction:** fixture details (teams, competition, date, fixture ID), predicted score and outcome, confidence level, AI reasoning summary, timestamps, status (pending/resolved), actual result (when resolved), accuracy flags (outcome correct, exact score correct).

#### 6.1.3 Accuracy Tracking

Running accuracy statistics: total/resolved/pending, outcome accuracy %, exact score accuracy %, average goal difference, streaks, per-competition breakdown, confidence calibration, monthly trend.

**Resolution flow:** User triggers via "Check results" button (V1) or automated daily cron (V2). System fetches results for pending predictions, resolves them, recalculates stats.

#### 6.1.4 Chat History & Context

Last 20 messages stored per user (rolling window). Recent predictions included in prompt context. Favourite team inferred from query patterns.

#### 6.1.5 Quick-Pick Fixtures

Upcoming fixtures displayed as tappable chips. FPL fixtures for PL, football-data.org for other leagues. Next 7 days, cached every 6 hours.

---

### 6.2 V2 Features (Post-Submission, P1)

#### 6.2.1 FPL Data Logging (Critical Path to V3)

Weekly snapshots of FPL API data stored persistently. Per gameweek: full standings, per-team strength ratings, per-player form/xG/xA/minutes/goals/assists/status/injury news, fixture results with stats.

**Implementation:** Cloudflare Cron Trigger runs a scheduled Worker every Monday. Worker fetches `bootstrap-static/` and `fixtures/`, extracts relevant fields, stores snapshot in D1 or structured KV keyed by gameweek number.

**Why this is the critical path:** The FPL API only reflects current state. Once a gameweek updates, previous data is overwritten. Logging weekly creates a time-series dataset that no external API provides. By season's end, Gaffer has 38 snapshots showing exactly how every team and player evolved. This is the foundation for V3's multi-gameweek analysis and season comparisons.

#### 6.2.2 Predictions League Integration

Optional account linking so Gaffer can reference a user's Predictions League (predictionsleague.xyz) data.

**Integration approach:** PL generates a read-only link code per user. User enters the code in Gaffer's settings panel. Gaffer's Worker stores the code in the DO and includes it in requests to PL's backend.

**Data that flows:** Prediction history (fixture, predicted score, actual score, points), aggregate stats (total predictions, accuracy, rank), league context (name, rank, total players).

**PL backend addition required:** One new endpoint: `GET /api/external/user-stats?token={linkCode}`. Server-to-server call from Gaffer's Worker, bypasses CORS.

**What it enables:** "You predicted Arsenal 2-1 Chelsea in your Predictions League too. Your PL accuracy is 58%, 4th in your league. Let's see if the Gaffer agrees..." Also enables tracking whose predictions are more accurate over time: the user's or the AI's.

**Build estimate:** ~5 hours. 2 hours on PL backend endpoint, 2 hours on Gaffer DO + Worker, 1 hour on settings UI.

#### 6.2.3 Auto-Resolution via Cron Triggers

Daily scheduled Worker fetches completed match results, resolves all pending predictions across users.

#### 6.2.4 Streaming Responses

Stream LLM output to frontend. Workers AI supports streaming; frontend renders tokens as they arrive.

---

### 6.3 V3 Features (Gaffer Studio, P2)

#### 6.3.1 Arbitrary Time-Window Analysis Engine
Query any gameweek range for any team. "Arsenal GW12-GW22" or "Liverpool's last 8 games" returns computed W/D/L splits, points/game, xG/game, goals scored/conceded, clean sheets, form trajectory. Not limited to full-season or half-season boundaries. Powered by accumulated FPL snapshots, not LLM generation.

#### 6.3.2 Comparison Engine
Compare any two time windows, teams, managers, or players across overlapping periods. "Ten Hag's last 10 vs Amorim's first 10", "Arsenal vs Man City since GW15", "Saka this season vs last season." The LLM narrates; the data pipeline computes.

#### 6.3.3 Grading / Awards Framework
User defines or picks from templates. Gaffer generates data-backed assessments per team per category. Works for end-of-season awards, mid-season reviews, monthly roundups, or any evaluative content format.

#### 6.3.4 Player Evolution Tracking
Per-90 stats over any time window, form curves, injury timeline, minutes trajectory. Applicable to breakout players, new signings settling in, returning-from-injury narratives, or decline arcs.

#### 6.3.5 Youth & Recruitment Analysis
U21 players with significant minutes: breakthrough tracking, minutes trajectory, performance curves. New signings: pre vs post-arrival stats. Queryable at any point in the season.

#### 6.3.6 Script/Talking Points Generation
Structured output adapted to creator's voice and format preferences (stored in DO). Output types: talking points, draft paragraphs, structured outlines for any content format.

#### 6.3.7 Exportable Data Cards
Shareable stat graphics generated server-side. Downloadable for video editing or social media.

#### 6.3.8 Analysis Template System

The templating system is the structural backbone of Gaffer Studio. It defines what gets computed, how it's organized, and what format the output takes. Every analysis workflow (whether pre-built or custom) runs through a template.

**Three layers:**

**Layer 1: Pre-Built Templates**

Common football content formats, ready to use out of the box. Each defines a set of categories, the metrics computed per category, the comparison frame (if any), and the output structure.

| Template | Use Case | Categories |
|---|---|---|
| **Team Season Grade** | End-of-season or mid-season team evaluation | Overall performance, attack, defence, set pieces, manager impact, best player, biggest disappointment, key stat |
| **Managerial Comparison** | Before/after a sacking, or comparing two eras | Points/game, xG/game, goals conceded, defensive record, formation usage, results vs top 6, results vs bottom 6 |
| **Transfer Window Impact** | January or summer window assessment | New signings (minutes, goal contributions, xG, form curve), departures (team form before/after), net spend vs performance delta |
| **Title/Relegation Race** | Multi-team comparison at any point in season | Form over last N games, remaining fixture difficulty, injury status, xG trend, head-to-head record |
| **Player Spotlight** | Deep dive on one player across a time window | Per-90 stats, form curve, xG vs actual, minutes trend, comparison to positional peers, pre/post event split (injury, tactical change) |
| **Gameweek Window Review** | "The story of GW15-GW25" | Biggest movers (up and down), standout individual performances, upsets, form reversals, emerging trends |
| **Derby/Rivalry Preview** | Pre-match deep dive for a specific fixture | H2H history, form, key player matchups, tactical notes, injury impact, predicted lineups context |
| **Monthly Roundup** | Regular content cadence | Team of the month, player of the month, biggest upset, form table for the period, stat of the month |

**Layer 2: Custom Template Definitions**

Users build their own templates by selecting from a menu of category types, metrics, and output preferences. Stored in the user's Durable Object, reusable across sessions.

```typescript
interface AnalysisTemplate {
  id: string;
  name: string;                         // "My End of Season Grades"
  description?: string;
  createdAt: string;
  lastUsedAt?: string;

  // What's being analyzed
  scope: TemplateScope;

  // The categories that make up this template
  categories: TemplateCategory[];

  // Output preferences
  output: OutputPreferences;
}

type TemplateScope =
  | { type: "single_team" }                           // Analyze one team
  | { type: "multi_team"; count?: number }             // Compare N teams
  | { type: "single_player" }                          // Player spotlight
  | { type: "player_comparison"; count?: number }      // Compare N players
  | { type: "league_wide" }                            // Full league analysis
  | { type: "custom_group"; teams?: string[] };         // Specific set of teams

interface TemplateCategory {
  id: string;
  name: string;                         // "Attack", "Defensive Record", "Youth Integration"
  weight?: number;                      // For grading: how much this category matters (0-100)
  metrics: MetricDefinition[];          // What gets computed
  comparisonFrame?: ComparisonFrame;    // Optional: what to compare against
  gradingScale?: GradingScale;          // Optional: how to assign a grade
}

interface MetricDefinition {
  key: string;                          // "points_per_game", "xg_per_90", "clean_sheet_pct"
  label: string;                        // "Points Per Game"
  source: "computed" | "fpl" | "historical";
  timeWindow?: TimeWindow;              // Override the template-level window
}

// Pre-defined metric keys the data pipeline supports
type MetricKey =
  // Team performance
  | "wins" | "draws" | "losses" | "points" | "points_per_game"
  | "goals_scored" | "goals_conceded" | "goal_difference"
  | "xg_for" | "xg_against" | "xg_difference"
  | "xg_overperformance"                // Goals scored minus xG
  | "clean_sheets" | "clean_sheet_pct"
  | "form_string"                       // "WWDLW"
  // Positional / context splits
  | "home_record" | "away_record"
  | "vs_top_6" | "vs_bottom_6"
  | "first_half_goals" | "second_half_goals"
  // Player-level (aggregated across squad)
  | "top_scorer" | "top_assister" | "top_xg"
  | "minutes_for_u21" | "u21_goal_contributions"
  // Set pieces
  | "set_piece_goals" | "set_piece_goals_conceded"
  // FPL-specific
  | "fpl_strength_attack" | "fpl_strength_defence"
  | "avg_fdr" | "remaining_fdr";

interface TimeWindow {
  type: "gameweek_range" | "last_n_games" | "date_range" | "full_season"
       | "pre_event" | "post_event" | "manager_tenure";
  // For gameweek_range
  from?: number;
  to?: number;
  // For last_n_games
  count?: number;
  // For date_range
  startDate?: string;
  endDate?: string;
  // For pre/post event and manager tenure
  eventDescription?: string;            // "Saka injury", "Amorim appointment"
  eventGameweek?: number;               // The GW the event occurred
}

interface ComparisonFrame {
  type: "previous_period" | "same_period_last_season" | "league_average"
       | "specific_team" | "specific_window" | "manager_vs_manager";
  target?: string;                      // Team name, manager name, etc.
  targetWindow?: TimeWindow;
}

type GradingScale =
  | { type: "letter"; scale: "A-F" | "A+-F" }
  | { type: "numeric"; min: number; max: number }
  | { type: "custom"; levels: { label: string; threshold: number }[] };

interface OutputPreferences {
  format: "talking_points" | "draft_paragraphs" | "structured_outline" | "data_table" | "data_cards";
  tone?: "analytical" | "conversational" | "pundit" | "formal";
  lengthPerCategory?: "brief" | "standard" | "detailed";
  includeDataCards?: boolean;
  includeRawData?: boolean;             // Show the computed numbers alongside narrative
}
```

**Layer 3: Template Execution**

When a user invokes a template (pre-built or custom), the execution pipeline:

1. **Resolve scope:** Determine which teams/players are being analyzed. For "single_team" scope, the user specifies which team. For "league_wide", iterate all 20.
2. **Compute metrics:** For each category, pull the required metrics from the accumulated data pipeline. Time-window queries hit the GameweekSnapshot store. Player-level queries hit the player snapshot data. All computation is real (not LLM-generated).
3. **Apply comparisons:** If a category has a comparison frame, compute the same metrics for the comparison target and calculate deltas.
4. **Apply grading (if applicable):** Use the grading scale to assign grades based on computed metrics. Grading logic can be rule-based (e.g., >2.0 points/game = A) or LLM-assisted (the AI interprets the numbers in context).
5. **Generate output:** Feed the computed data into the LLM with the output preferences (format, tone, length) to produce the final narrative, talking points, or structured outline.
6. **Export:** Optionally generate data cards for key findings.

**Conversational template invocation:**

Users don't need to manually configure templates through a form UI. They can invoke them conversationally:

- "Run my Team Season Grade template for Arsenal" (uses a saved custom template)
- "Do a managerial comparison for Man United: Ten Hag's last 12 games vs Amorim's first 12" (uses the pre-built Managerial Comparison template with inferred parameters)
- "Give me a title race breakdown for the top 4 since Christmas" (pre-built Title Race template, Gaffer infers the top 4 and time window)
- "Run a monthly roundup for February" (pre-built Monthly Roundup template)

The LLM parses the user's intent, maps it to a template (or suggests one), resolves parameters, and kicks off the execution pipeline. If parameters are ambiguous, Gaffer asks for clarification.

**Template management UI (V3):**

A settings/library panel where users can: browse pre-built templates, duplicate and modify them, build custom templates from scratch (category picker, metric selector, comparison frame, grading scale), save/name/reuse templates, and see execution history (which templates they've run, when, with what parameters).

---

## 7. System Architecture

### High-Level Architecture (V1)

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER (Browser/Mobile)                      │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              Cloudflare Pages (React SPA)                 │  │
│  │                                                           │  │
│  │  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐   │  │
│  │  │ Chat Window │  │ Predictions  │  │  Accuracy      │   │  │
│  │  │  "Ask the   │  │   History    │  │   Dashboard    │   │  │
│  │  │   Gaffer"   │  │              │  │                │   │  │
│  │  └──────┬──────┘  └──────┬───────┘  └───────┬────────┘   │  │
│  └─────────┼────────────────┼───────────────────┼────────────┘  │
│            │                │                   │               │
└────────────┼────────────────┼───────────────────┼───────────────┘
             ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker                             │
│                 (API Gateway / Orchestrator)                     │
│                                                                 │
│  Request Pipeline:                                              │
│  1. Parse user message                                          │
│  2. Route to user's Durable Object                              │
│  3. Load chat history + user state                              │
│  4. Identify fixture from message                               │
│  5. Determine data source (FPL API if PL, else football-data)   │
│  6. Fetch + cache match data from appropriate source            │
│  7. Assemble enriched prompt (PL or standard template)          │
│  8. Call Workers AI (Llama 3.3 70B)                             │
│  9. Parse prediction from response                              │
│  10. Store prediction + update chat history in DO               │
│  11. Return response to frontend                                │
│                                                                 │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐         │
│  │  Workers AI  │ │   Durable   │ │  External APIs   │         │
│  │              │ │   Object    │ │                   │         │
│  │ Llama 3.3   │ │  (per user) │ │ FPL API           │         │
│  │ 70B Instruct│ │             │ │ (PL: xG, injuries │         │
│  │              │ │ - Chat log  │ │  strength, FDR)   │         │
│  │              │ │ - Predict-  │ │                   │         │
│  │              │ │   ions      │ │ football-data.org │         │
│  │              │ │ - Accuracy  │ │ (other leagues)   │         │
│  │              │ │ - Prefs     │ │                   │         │
│  └──────────────┘ └─────────────┘ └──────────────────┘         │
│                                                                 │
│  ┌──────────────────────────────────────┐                       │
│  │  KV Namespace (Cache Layer)          │                       │
│  │  - FPL bootstrap (6hr TTL)           │                       │
│  │  - FPL fixtures (1hr TTL)            │                       │
│  │  - football-data standings (1hr TTL) │                       │
│  │  - Team alias mappings (30d TTL)     │                       │
│  └──────────────────────────────────────┘                       │
└─────────────────────────────────────────────────────────────────┘
```

### Data Source Routing

```typescript
async function fetchMatchContext(fixture: Fixture): Promise<MatchContext> {
  if (fixture.competitionCode === "PL") {
    return buildContextFromFPL(fixture);   // Richer: player stats, injuries, xG, strength
  } else {
    return buildContextFromFootballData(fixture); // Standings, form, recent results
  }
}
```

---

## 8. Cloudflare Component Mapping

| Requirement | Component | Implementation |
|---|---|---|
| **LLM** | Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, fallback to `llama-3.1-8b-instruct` |
| **Workflow** | Worker orchestration | Multi-step pipeline: parse > route to DO > determine source > fetch data > build prompt > LLM > parse > store > respond |
| **User input** | Cloudflare Pages | React SPA, text chat |
| **Memory/state** | Durable Objects | One DO per user: chat history, predictions, accuracy, preferences |

```toml
# wrangler.toml
[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "GAFFER"
class_name = "GafferDO"

[[migrations]]
tag = "v1"
new_classes = ["GafferDO"]
```

---

## 9. Data Architecture

### 9.1 Durable Object State Schema

```typescript
interface UserState {
  userId: string;
  createdAt: string;
  lastActiveAt: string;

  chatHistory: ChatMessage[];           // Rolling window, last 20
  predictions: Prediction[];
  accuracy: AccuracyStats;
  preferences: UserPreferences;

  // V2: Predictions League integration
  predictionsLeague?: {
    linkCode: string;
    lastSynced: string;
    plUserId: string;
    plUsername: string;
  };

  // V3: Analysis templates
  customTemplates?: AnalysisTemplate[];   // User-defined templates (schema in 6.3.8)
  templateHistory?: {                     // Recent template executions
    templateId: string;
    templateName: string;
    params: Record<string, unknown>;
    executedAt: string;
  }[];
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    fixtureId?: string;
    predictionId?: string;
    matchContext?: string;               // "Arsenal vs Chelsea, PL"
  };
}

interface Prediction {
  id: string;
  fixtureId: number;
  status: "pending" | "resolved";

  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  competition: string;
  competitionCode: string;
  matchDate: string;
  matchday?: number;

  predictedScore: Score;
  predictedOutcome: Outcome;
  confidence: Confidence;
  reasoning: string;

  actualScore?: Score;
  actualOutcome?: Outcome;

  outcomeCorrect?: boolean;
  exactScoreCorrect?: boolean;
  goalDifference?: number;

  createdAt: string;
  resolvedAt?: string;
}

interface Score { home: number; away: number; }
type Outcome = "home" | "draw" | "away";
type Confidence = "low" | "medium" | "high";

interface AccuracyStats {
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

  byCompetition: Record<string, {
    competitionName: string;
    total: number;
    correctOutcomes: number;
    exactScores: number;
    outcomeAccuracy: number;
  }>;

  byConfidence: {
    low: { total: number; correct: number; accuracy: number };
    medium: { total: number; correct: number; accuracy: number };
    high: { total: number; correct: number; accuracy: number };
  };

  monthlyTrend: { month: string; total: number; correctOutcomes: number; outcomeAccuracy: number }[];
}

interface UserPreferences {
  favouriteTeam?: string;
  favouriteTeamId?: number;
  preferredLeagues: string[];
  analysisStyle: "brief" | "detailed";
  teamQueryCounts: Record<string, number>;
}
```

### 9.2 FPL Match Context (Premier League)

```typescript
interface PLMatchContext {
  fixture: {
    id: number;
    homeTeam: string;
    awayTeam: string;
    competition: "Premier League";
    matchDate: string;
    matchday: number;
  };
  fplDifficulty: { home: number; away: number };
  homeTeam: PLTeamContext;
  awayTeam: PLTeamContext;
}

interface PLTeamContext {
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
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  setPieceTakers?: string;
}

interface KeyPlayer {
  name: string;
  position: string;
  form: number;
  goals: number;
  assists: number;
  xG: number;
  xA: number;
  minutes: number;
  status: "available" | "injured" | "doubtful" | "suspended";
}

interface InjuryReport {
  player: string;
  status: string;
  news: string;
  chanceOfPlaying: number | null;
}
```

### 9.3 Standard Match Context (Non-PL)

```typescript
interface StandardMatchContext {
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
  headToHead?: HeadToHeadContext;
}

interface StandardTeamContext {
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
```

### 9.4 Historical Data Schema (V2, for D1 or structured KV)

Logged once per gameweek by the cron Worker:

```typescript
interface GameweekSnapshot {
  gameweek: number;
  season: string;                       // "2025-26"
  capturedAt: string;

  standings: {
    teamId: number;
    teamName: string;
    position: number;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
  }[];

  teamStrength: {
    teamId: number;
    overall: number;
    attackHome: number;
    attackAway: number;
    defenceHome: number;
    defenceAway: number;
  }[];

  playerSnapshots: {
    playerId: number;
    name: string;
    teamId: number;
    position: string;
    form: number;
    totalPoints: number;
    minutes: number;
    goals: number;
    assists: number;
    xG: number;
    xA: number;
    cleanSheets: number;
    status: string;
    news: string;
    chanceOfPlaying: number | null;
  }[];

  fixtureResults: {
    fixtureId: number;
    homeTeamId: number;
    awayTeamId: number;
    homeGoals: number;
    awayGoals: number;
    gameweek: number;
  }[];
}
```

By season's end, Gaffer has 38 snapshots showing exactly how every team and player evolved week by week. No external API provides this longitudinal view. This is the dataset that powers V3's multi-gameweek analysis, season comparisons, and player evolution tracking.

---

## 10. Data Sources & Integration

### 10.1 Primary: FPL API (Premier League)

**Base URL:** `https://fantasy.premierleague.com/api/`
**Auth:** None required. **Rate limits:** Unofficial, no documented limits. Cache aggressively.
**CORS:** Blocked from browser. Worker calls server-side (no issue).

| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `bootstrap-static/` | All teams, players, gameweeks, strength ratings, FDR | 6 hours |
| `fixtures/` | All PL fixtures with past stats + upcoming | 1 hour |
| `fixtures/?event={gw}` | Specific gameweek fixtures | 30 minutes |
| `element-summary/{player_id}/` | Individual player detail | 1 hour |
| `event/{gw}/live/` | Live gameweek data (for resolution) | 5 minutes |
| `team/set-piece-notes/` | Set piece taker info | 24 hours |

**What FPL gives that football-data.org doesn't:**
- Team strength ratings (attack/defence, home/away)
- Fixture difficulty ratings (1-5)
- Player-level form with xG and xA
- Injury status with `chance_of_playing_next_round` (0-100)
- Injury news strings ("Hamstring, expected back 15 Feb")
- Set piece taker information

**Note:** `bootstrap-static/` is large (several MB). Cache aggressively in KV, extract only what's needed per request.

### 10.2 Secondary: football-data.org (Other Competitions)

**Auth:** Free API key via email. **Rate limits:** 10 req/min.

**Coverage:** PL, La Liga (PD), Bundesliga (BL1), Serie A (SA), Ligue 1 (FL1), Champions League (CL), Eredivisie (DED), Primeira Liga (PPL), Championship (ELC).

| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `GET /v4/matches?dateFrom=X&dateTo=Y` | Upcoming fixtures | 6 hours |
| `GET /v4/competitions/{code}/standings` | League tables | 1 hour |
| `GET /v4/teams/{id}/matches?status=FINISHED&limit=5` | Recent form | 30 minutes |
| `GET /v4/matches/{id}` | Match result (for resolution) | 30 minutes |

### 10.3 Supplementary: API-Football (H2H)

Free tier via RapidAPI, 100 req/day. Used sparingly for head-to-head data on non-PL matches.

### 10.4 Routing Summary

| Competition | Source | Data Richness |
|---|---|---|
| **Premier League** | FPL API | High: player xG, injuries, strength, FDR, set pieces |
| **All other leagues** | football-data.org | Medium: standings, form, recent results |
| **H2H data** | API-Football | Supplementary: 100 req/day |

### 10.5 Historical Data Sources (V3)

| Source | Coverage | Access |
|---|---|---|
| Gaffer's logged FPL snapshots | Current season, weekly granularity | Internal (V2 cron) |
| DataHub.io EPL dataset | 32 seasons of match results | Free, open-source |
| FBref | Deep player/team stats (Opta-sourced) | Free to browse, restrictive scraping ToS |

### 10.6 Team Alias Map

Maps user input to both FPL IDs and football-data.org IDs:

```typescript
const TEAM_ALIASES: Record<string, { fplId: number; fdId: number }> = {
  // PL teams have both IDs
  "arsenal": { fplId: 1, fdId: 57 }, "gunners": { fplId: 1, fdId: 57 },
  "chelsea": { fplId: 6, fdId: 61 }, "blues": { fplId: 6, fdId: 61 },
  "liverpool": { fplId: 12, fdId: 64 }, "reds": { fplId: 12, fdId: 64 },
  "manchester city": { fplId: 13, fdId: 65 }, "man city": { fplId: 13, fdId: 65 },
  "manchester united": { fplId: 14, fdId: 66 }, "man utd": { fplId: 14, fdId: 66 },
  "tottenham": { fplId: 18, fdId: 73 }, "spurs": { fplId: 18, fdId: 73 },
  // ... full PL + major non-PL teams

  // Non-PL teams: fplId = -1
  "barcelona": { fplId: -1, fdId: 81 }, "barca": { fplId: -1, fdId: 81 },
  "real madrid": { fplId: -1, fdId: 86 },
  "bayern munich": { fplId: -1, fdId: 5 }, "bayern": { fplId: -1, fdId: 5 },
  // ... extend as needed
};
```

---

## 11. AI & Prompt Engineering

### 11.1 System Prompt

```
You are Gaffer, a sharp, knowledgeable football analyst with the authority of a
seasoned manager. You speak with conviction, back up your calls with data, and aren't
afraid to take a position. Your personality is warm but direct, like a gaffer giving
a pre-match briefing to someone who genuinely wants to understand the game.

CORE RULES:
1. ONLY cite statistics and facts from the MATCH DATA provided in context.
   Never invent statistics, historical facts, or player information.
2. Always deliver a specific scoreline prediction. Not "home win." Give a score.
3. Always include a confidence level: Low, Medium, or High.
4. If data is missing or limited, say so explicitly and adjust confidence.
5. Be opinionated. Take a position. Hedging everything helps no one.
6. Reference specific recent results when discussing form.
7. When player data is available (PL matches), reference key players,
   injuries, and form. "With Saka doubtful at 25%, Arsenal lose their
   main creative outlet on the right."
8. Keep responses conversational. This is a chat, not a report.

ANALYSIS STRUCTURE (match predictions):
1. The Gaffer's Call: Your verdict in 1-2 sentences
2. Form Check: What the last 5 results tell you (cite specific scores)
3. The Key Factor: The one thing that most swings this match
4. Prediction: [Home] [X]-[Y] [Away], Confidence: [Level]
5. Where I Could Be Wrong: One honest sentence

WHEN PLAYER DATA IS AVAILABLE (PL matches):
- Mention top in-form players and what they bring
- Flag significant injuries/doubts and tactical impact
- Reference xG if it tells a different story from actual goals
- Note set piece threats if relevant

TONE:
- Enthusiastic about compelling fixtures
- Concise. 150-250 words. Users can ask follow-ups.
- Conversational. Contractions. No corporate speak.
```

### 11.2 User Message Template (PL)

```
USER MESSAGE: "${userMessage}"

═══ MATCH DATA (Premier League, Enhanced) ═══

FIXTURE: ${homeTeam} vs ${awayTeam}
Competition: Premier League (Matchday ${matchday})
Date: ${matchDate}
FPL Difficulty: ${homeTeam} rates this ${homeFDR}/5 | ${awayTeam} rates this ${awayFDR}/5

── ${homeTeam.toUpperCase()} ──
Position: ${homePos}/20 (${homePts} pts, ${homeW}W ${homeD}D ${homeL}L)
Goals: ${homeGF} scored, ${homeGA} conceded (GD: ${homeGD})
FPL Strength: Attack ${homeAtkHome} | Defence ${homeDefHome} (at home)
Last 5: ${homeForm.join(" ")} (${homeFormSummary})
Recent Results:
${homeRecent.map(r => `  ${r.result} ${r.score} vs ${r.opponent} (${r.venue})`).join("\n")}
Key Players:
${homeKeyPlayers.map(p => `  ${p.name} (${p.position}) | Form: ${p.form} | ${p.goals}G ${p.assists}A | xG: ${p.xG} xA: ${p.xA}`).join("\n")}
${homeInjuries.length > 0 ? `Injuries:\n${homeInjuries.map(i => `  ${i.player}: ${i.news} (${i.chanceOfPlaying}%)`).join("\n")}` : "No injury concerns."}
${homeSetPieces ? `Set Pieces: ${homeSetPieces}` : ""}

── ${awayTeam.toUpperCase()} ──
[same structure]

═══ YOUR TRACK RECORD ═══
Predictions: ${accuracy.totalPredictions} | Resolved: ${accuracy.resolved}
Outcome: ${accuracy.outcomeAccuracy}% | Exact Score: ${accuracy.scoreAccuracy}%
Streak: ${accuracy.currentStreak} correct | Best: ${accuracy.bestStreak}
```

### 11.3 User Message Template (Non-PL)

Same structure without player-level detail, FPL strength, or FDR.

### 11.4 Prediction Extraction Prompt

```
Extract the prediction from this football analysis as JSON only:
{"homeScore": <int>, "awayScore": <int>, "outcome": "home"|"draw"|"away",
 "confidence": "low"|"medium"|"high", "reasoning": "<one sentence>"}

Analysis: "${analysisResponse}"
```

### 11.5 Fixture Identification (Fallback)

```
From the user's message, identify two football teams. JSON only:
{"homeTeam": "<from list or null>", "awayTeam": "<from list or null>", "found": bool}

Message: "${userMessage}"
Available: ${teamList.join(", ")}
```

---

## 12. API Specification

**Base:** `https://cf-ai-gaffer.<username>.workers.dev` / `http://localhost:8787`

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Full analysis pipeline. Body: `{ message, userId }` |
| `/api/predictions` | GET | Prediction history. Params: `userId`, `status`, `limit`, `competition` |
| `/api/accuracy` | GET | Detailed accuracy stats. Params: `userId` |
| `/api/resolve` | POST | Trigger resolution of pending predictions. Body: `{ userId }` |
| `/api/fixtures` | GET | Upcoming fixtures for quick-pick. Params: `competition`, `days` |
| `/api/link-pl` | POST | (V2) Link Predictions League account. Body: `{ userId, linkCode }` |

Chat response shape:
```json
{
  "response": "Arsenal at home against Chelsea? ...",
  "prediction": {
    "id": "pred_x1y2z3",
    "homeTeam": "Arsenal FC",
    "awayTeam": "Chelsea FC",
    "predictedScore": { "home": 2, "away": 1 },
    "confidence": "medium",
    "reasoning": "..."
  },
  "accuracy": { "totalPredictions": 15, "outcomeAccuracy": 60, "currentStreak": 3 },
  "fixtureFound": true,
  "dataSource": "fpl"
}
```

---

## 13. Frontend Specification

**Theme:** Dark mode. "Tactical briefing room meets clean chat." Dark backgrounds (#0A0A0F), pitch-green accents (#22C55E), sharp prediction cards. Not a betting site.

**Typography:** Inter (primary), JetBrains Mono (scores/stats).

**Key components:** ChatWindow, MessageBubble, PredictionCard (score prominent, confidence badge), FixtureChips (scrollable upcoming matches), AccuracyBadge (header), PredictionsDrawer (slide-out history), PLLinkPanel (V2 settings).

**Mobile:** Full viewport chat, bottom-sheet drawer, sticky input with safe area, 44px min touch targets.

---

## 14. Performance Requirements

| Operation | Target | Max |
|---|---|---|
| Chat response (full pipeline) | <6s | <10s |
| Fixture list | <500ms | <1s |
| Prediction/accuracy loads | <300ms | <500ms |
| Frontend initial load | <2s | <3s |

---

## 15. Security & Privacy

- V1 auth: client-side UUID v4 in localStorage. No PII collected.
- API keys as Worker secrets. CORS restricted to Pages domain.
- Rate limiting: 1 req/sec per userId on chat endpoint.
- V2: PL link code stored in DO (encrypted at rest by Cloudflare).

---

## 16. Development Roadmap

### Phase 1: Foundation (Friday Evening, 3-4 hours)
Cloudflare setup, Worker + DO + Workers AI hello-world, FPL API client, end-to-end pipeline via curl.

### Phase 2: Intelligence (Saturday Morning, 4-5 hours)
Team aliases, FPL data extraction (PLMatchContext), football-data.org client, prompt templates (PL + standard), prediction extraction, KV caching.

### Phase 3: Frontend (Saturday Afternoon, 4-5 hours)
React + Tailwind scaffold, chat UI, API integration, PredictionCard, FixtureChips, AccuracyBadge, loading/error states, Pages deploy.

### Phase 4: Accuracy & Polish (Sunday Morning, 3-4 hours)
Resolution endpoint, accuracy calculation, PredictionsDrawer, edge case handling.

### Phase 5: Submission (Sunday Afternoon, 3-4 hours)
README.md, PROMPTS.md, end-to-end testing, UI polish, demo recording, GitHub push.

---

## 17. Success Metrics

### Submission
| Criterion | Demonstrated By |
|---|---|
| LLM | Llama 3.3 generates match analysis via Workers AI |
| Workflow | Worker orchestrates pipeline across 4 sources |
| Chat input | React SPA on Pages |
| Persistent state | DO stores chat, predictions, accuracy across sessions |

### Quality
- PL analyses reference specific players, injuries, xG
- 100% of predictions include specific scorelines
- >90% fixture identification accuracy
- Mobile responsive at 375px

---

## 18. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Workers AI slow/unavailable | Fallback to `llama-3.1-8b-instruct`; timeout + retry |
| FPL API changes without notice | Defensive parsing; fallback to football-data.org for PL |
| football-data.org rate limiting | Aggressive KV caching |
| Team name matching failures | Alias map + LLM fallback |
| LLM hallucinates statistics | System prompt forbids it; data injected into context |
| FPL bootstrap too large | Store parsed/filtered version in KV |
| Weekend timeline tight | Cut P1 ruthlessly; V1 is predictions only |

---

## 19. Repository Structure

```
cf_ai_gaffer/
├── README.md
├── PROMPTS.md
├── LICENSE
├── worker/
│   ├── src/
│   │   ├── index.ts                   # Worker entry, routing
│   │   ├── durable-objects/
│   │   │   └── gaffer.ts              # GafferDO class
│   │   ├── services/
│   │   │   ├── fpl-api.ts             # FPL API client
│   │   │   ├── football-data.ts       # football-data.org client
│   │   │   ├── match-context.ts       # Routes to correct source
│   │   │   ├── llm.ts                 # Workers AI
│   │   │   ├── fixture-matcher.ts     # Team name resolution
│   │   │   └── prediction-resolver.ts
│   │   ├── prompts/
│   │   │   ├── system.ts
│   │   │   ├── templates.ts           # PL + non-PL templates
│   │   │   └── extraction.ts
│   │   ├── types/
│   │   │   ├── state.ts
│   │   │   ├── fpl.ts
│   │   │   ├── football-data.ts
│   │   │   └── match-context.ts
│   │   ├── utils/
│   │   │   ├── team-aliases.ts        # Dual-ID mappings
│   │   │   ├── accuracy.ts
│   │   │   └── cache.ts
│   │   └── config.ts
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── ChatWindow.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── PredictionCard.tsx
│   │   │   ├── FixtureChips.tsx
│   │   │   ├── AccuracyBadge.tsx
│   │   │   ├── PredictionsDrawer.tsx
│   │   │   ├── AccuracyPanel.tsx
│   │   │   ├── LoadingDots.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── hooks/
│   │   │   ├── useChat.ts
│   │   │   ├── usePredictions.ts
│   │   │   └── useUserId.ts
│   │   ├── lib/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.ts
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── .github/
    └── workflows/
        └── deploy.yml
```

---

## 20. Submission Checklist

### Repository
- [ ] Repo: `cf_ai_gaffer`
- [ ] README.md with architecture, setup, deployed link, V2/V3 roadmap
- [ ] PROMPTS.md documenting all prompts
- [ ] All work original

### Technical
- [ ] LLM: Llama 3.3 via Workers AI
- [ ] Workflow: Multi-step pipeline across 4 sources
- [ ] Chat: React SPA on Pages
- [ ] State: DO persists across sessions

### Quality
- [ ] PL matches show player detail (injuries, xG, form)
- [ ] Non-PL matches provide standings analysis
- [ ] Specific scoreline in every prediction
- [ ] Chat persists across refreshes
- [ ] Accuracy updates on resolution
- [ ] Mobile responsive
- [ ] No API keys in client code

---

*Document Version: 2.0*
*Author: Divine*
*Created: March 2026*
*Project: Cloudflare AI Internship Submission / Gaffer*
