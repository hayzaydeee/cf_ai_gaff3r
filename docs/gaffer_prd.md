# Gaff3r — Product Requirements Document

> **An AI-powered football match analyst built on Cloudflare's edge infrastructure.**
> Chat with a sharp, opinionated gaffer about any upcoming match — get data-backed predictions, track your accuracy, and build a longitudinal football intelligence dataset that powers increasingly deep analysis over time.

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

**Product Name:** Gaff3r
**Repository:** `cf_ai_gaff3r`
**Platform:** Web (Cloudflare Pages + Workers)
**LLM:** Llama 3.3 70B via Cloudflare Workers AI
**Primary Data Source:** FPL API (Premier League), football-data.org (other competitions)
**Deployment:** [gaff3r.com](https://gaff3r.com)
**Target Submission:** Cloudflare Internship Assignment

### What It Does

Gaff3r is a conversational football analyst organized around **gameweeks**. For Premier League matches, it pulls enriched data from the FPL API — team strength ratings, player-level form with xG/xA, injury reports, fixture difficulty, and set piece taker information. For other major leagues (La Liga, Bundesliga, Serie A, Ligue 1, Champions League), it uses football-data.org for standings, form, and recent results. The system tracks every prediction, resolves them against real results, and maintains a running accuracy profile.

The UI is a **4-page application** — Gameweek Hub, Chat, Predictions, Stats — with responsive navigation across mobile, tablet, and desktop, built with a warm editorial design system (EB Garamond + League Spartan, cream/orange/brown palette) in both light and dark modes.

### Where It's Going

Gaff3r V1 is a match prediction chat built for a Cloudflare internship submission. The longer-term vision is a football intelligence platform that accumulates structured data over time and powers increasingly deep analysis: multi-gameweek performance breakdowns, season-over-season comparisons, player evolution tracking, and content creation research workflows. The prediction engine is the entry point; the accumulated data pipeline is the real product.

### Core Technical Achievement

The project demonstrates mastery of Cloudflare's AI infrastructure by orchestrating four components in a single request pipeline: Pages serves a 4-page React frontend, a Worker orchestrates data fetching from dual sources (FPL API + football-data.org) and prompt assembly, Workers AI runs inference on Llama 3.3 70B with inline structured output, and Durable Objects maintain per-user state split by gameweek — all at the edge.

---

## 2. Product Evolution & North Star

Gaff3r is designed as a staged product. V1 ships for the internship submission. V2 and V3 extend the platform as personal tools built around recurring needs. Each version layers on without requiring architectural rewrites.

### V1: Match Prediction Chat (Internship Submission)

**Scope:** Conversational match analyst with predictions and accuracy tracking across multiple leagues.

**Core loop:** User browses gameweek fixtures → taps a fixture → Worker routes to correct data source (FPL if PL, football-data.org otherwise) → LLM generates analysis with inline structured prediction → prediction stored in DO under gameweek key → accuracy tracked over time.

**Data sources:** FPL API (Premier League — rich), football-data.org (La Liga, Bundesliga, Serie A, Ligue 1, Champions League — standard).

### V2: Data Accumulation & Integrations (Post-Submission)

**Scope:** Begin logging FPL data week-over-week to build a longitudinal dataset. Add Predictions League integration. Enhance PL analysis with deeper player-level insights.

**Key additions:**
- **Weekly FPL data snapshots** stored in D1: player form, injuries, team strength ratings, fixture results. This data is ephemeral in the FPL API and lost after each gameweek update. Capturing it creates a historical dataset that powers V3.
- **Predictions League account linking** via read-only link codes. Gaff3r references the user's PL prediction history and accuracy in conversation.
- **Auto-resolution** via Cloudflare Cron Triggers (daily scheduled Worker).
- **Streaming responses** for better perceived performance.

**Why V2 matters architecturally:** The FPL API only reflects current-state data. By logging snapshots weekly, Gaff3r builds a dataset that no external API provides — a time-series record of how teams and players evolved across a season. This is what lets V3 answer questions like "how did Arsenal perform in the 6 weeks after Saka's injury?"

### V3: Gaffer Studio (The North Star)

**Scope:** General-purpose football analysis research platform. Gaff3r becomes the tool you talk to whenever you're building any kind of football analysis content: mid-season reviews, end-of-season awards, managerial comparisons, transfer window assessments, title race deep dives, relegation breakdowns, or player spotlights.

The key insight: almost all football analysis content follows the same pattern — define a time window or comparison frame, compute metrics across that frame, identify standout data points, structure them into a narrative. Gaffer Studio provides the conversational research layer for that pattern.

**Example workflows:**
- *End-of-season grades:* "Give me Arsenal's full season breakdown" → computed W/D/L, xG trends, player form trajectories, injury timelines → "Compare to last season" → delta analysis → "Draft the Arsenal section" → structured talking points
- *Managerial change:* "Compare United's form under Ten Hag's last 10 vs Amorim's first 10" → computed per-90 comparison → "Which players improved most?" → player-level window analysis
- *Title race:* "Compare the top 4 since GW15" → side-by-side computed metrics → "Who has the hardest run-in?" → aggregate FDR

**Feature set:** Arbitrary time-window analysis, comparison engine, grading/awards framework, player evolution tracking, youth & recruitment analysis, script/talking points generation, exportable data cards.

**Data moat:** The value is the accumulated, structured, computed data pipeline — not the LLM. Arbitrary time-window aggregation requires actual calculation, not generation.

---

## 3. Problem Statement

### For V1 (Match Predictions)

- Pre-match analysis is scattered across multiple sources
- Generic AI assistants give vague responses because they lack real-time data
- Prediction tracking is manual — nobody systematically measures their accuracy
- Most "prediction" apps are betting platforms in disguise

### For V3 (Content Creation Research)

- Football content creators spend 3-5 hours per video on data research across 5-6 platforms
- Raw stats platforms provide data but no narrative structure or arbitrary time-window computation
- Professional analytics tools target clubs at enterprise pricing
- LLMs hallucinate specific statistics and can't compute metrics from real data
- No tool combines computed data with a conversational research interface

---

## 4. Product Vision & Principles

### Vision Statement

> Make every football fan feel like they've got a gaffer in their pocket — someone who's watched every match, studied every stat, and isn't afraid to make a call. And for content creation, the research assistant that answers any analytical question with real computed data.

### Product Principles

**1. Opinionated, Not Hedged** — "Arsenal 2-1, here's why" not "it could go either way."

**2. Data-First, Not Hallucination-Friendly** — Every claim grounded in real data injected into the prompt. PL matches use FPL data; other leagues use football-data.org standings.

**3. Conversational, Not Dashboard-y** — Feels like chatting with a knowledgeable manager, not querying a database.

**4. Transparent Accuracy** — Users always see how predictions measure up.

**5. Accumulate, Don't Discard** — Every interaction produces data. The product gets more capable the longer it runs.

**6. Gameweek-First** — Organized around the natural unit of football scheduling. Clear context, unambiguous, prediction tracking is trivial.

---

## 5. Target Users

### V1: The Prediction Enthusiast

- Watches matches regularly, participates in prediction leagues or pub debates
- Wants data-backed pre-match briefings and accuracy tracking
- Age 18-40, comfortable with chat interfaces, likely on mobile

### V3: The Football Content Creator (Future)

- Makes YouTube/TikTok/Twitter football analysis content
- Needs computed data and structured talking points across arbitrary time windows
- Values accuracy in numbers (can't afford wrong stats in published content)

### Anti-User

- Betting tips seekers — this is analysis, not tipster service
- Real-time commentary — this is pre-match and post-season analysis

---

## 6. Feature Requirements

### 6.1 Core Features (V1 / MVP, P0)

#### 6.1.1 Gameweek Hub

The landing page — a gameweek-organized view of all fixtures with status indicators and quick access to AI analysis.

**User Flow:**
1. User opens app → current gameweek displayed with all fixtures
2. Each fixture shows teams, kickoff, difficulty rating (PL) or competition badge, prediction status
3. Tapping a fixture card → navigates to Chat pre-loaded with that fixture's context
4. GW selector allows browsing past/future gameweeks

**Responsive behavior:**
- Mobile: single-column stacked fixture cards
- Tablet: 2-column grid
- Desktop: 3-column grid + right preview panel for selected fixture details

#### 6.1.2 Match Analysis Chat

Full-page conversational interface with contextual data sidebar.

**User Flow:**
1. From Hub (fixture tapped) → chat pre-loaded with fixture context in sidebar
2. Direct to `/chat` → sidebar shows all current GW fixtures as quick-picks
3. System determines data source: FPL API if PL, football-data.org otherwise
4. System builds enriched prompt and calls Workers AI
5. AI delivers analysis with specific scoreline prediction via inline `<<<PREDICTION_JSON>>>` block
6. Prediction parsed via regex (single LLM call, no extraction step), stored in DO under GW key

**Data richness by league:**
- **PL:** Player-level detail — key player form, xG/xA, injuries with chance of playing, set piece takers, team strength ratings, FPL difficulty
- **Other leagues:** Standings-based analysis — league position, form, recent results, head-to-head

**Responsive behavior:**
- Mobile: full-screen chat, context bar at top
- Desktop: split view — chat (left 65%) + MatchContext sidebar (right 35%)

#### 6.1.3 Prediction Storage & Resolution

Every AI prediction stored per-gameweek and resolved against actual results.

**Stored per prediction:** fixture details (teams, competition, competitionCode, GW, fixture ID), predicted score/outcome, confidence, reasoning, status, actual result, accuracy flags.

**Resolution:** FPL `fixtures` endpoint for PL (checking `finished: true`), football-data.org `matches/{id}` for other leagues. Triggered on-demand when user visits Predictions page (V1) or via Cron Trigger (V2).

#### 6.1.4 Predictions History Page

Prediction history organized by gameweek with filtering.

- Accordion collapse/expand per GW
- Filter tabs: All / Correct / Wrong / Pending
- Desktop: table layout with columns (Fixture, Competition, Call, Actual, Result, Confidence)
- Mobile: card-style rows

#### 6.1.5 Accuracy Dashboard (Stats Page)

- Hero stat: overall accuracy percentage
- Stat cards: exact score rate, current streak, best streak, total predictions
- Per-competition breakdown (PL, La Liga, CL, etc.)
- Conditional accuracy chart: renders only when ≥ 3 resolved gameweeks of data
- Desktop: dashboard grid layout
- Mobile: vertical stack

#### 6.1.6 Chat History & Context

Conversations organized by gameweek, persisting across sessions.

- Chat history stored per-GW in DO (`gw:{N}:chat`)
- Last 20 messages per GW (rolling window)
- User's accuracy stats included in prompt context when relevant

---

### 6.2 V2 Features (Post-Submission, P1)

#### 6.2.1 FPL Data Logging (Critical Path to V3)

Weekly snapshots of FPL API data stored persistently in D1. Per gameweek: full standings, per-team strength ratings, per-player form/xG/xA/minutes/goals/assists/status/injury news, fixture results.

**Implementation:** Cloudflare Cron Trigger runs a scheduled Worker every Monday. Worker fetches `bootstrap-static/` and `fixtures/`, stores snapshot keyed by gameweek number.

**Why critical:** FPL API only reflects current state. Once a gameweek updates, previous data is overwritten. By season's end, Gaff3r has 38 snapshots showing exactly how every team and player evolved — foundation for V3.

#### 6.2.2 Predictions League Integration

Optional account linking so Gaff3r can reference a user's [Predictions League](https://predictionsleague.xyz) data.

**Integration:** PL generates a read-only link code. User enters code in settings. Gaff3r's Worker stores code in DO and includes it in requests to PL's backend via server-to-server call (`GET /api/external/user-stats?token={linkCode}`).

**What it enables:** "You predicted Arsenal 2-1 Chelsea in your Predictions League too. Your PL accuracy is 58%, 4th in your league. Let's see if the Gaffer agrees..." Also enables tracking user vs AI predictions over time.

#### 6.2.3 Auto-Resolution via Cron Triggers

Daily scheduled Worker fetches completed match results, resolves all pending predictions across users.

#### 6.2.4 Streaming Responses

Stream LLM output to frontend via Workers AI streaming support.

---

### 6.3 V3 Features (Gaffer Studio, P2)

- Arbitrary time-window analysis engine (any GW range for any team)
- Comparison engine (any two windows, teams, managers, or players)
- Grading/awards framework (data-backed assessments per team)
- Player evolution tracking (per-90 stats, form curves, injury timelines)
- Youth & recruitment analysis (U21 breakouts, new signings impact)
- Script/talking points generation (adapted to creator voice)
- Exportable data cards (shareable stat graphics)

---

## 7. System Architecture

### High-Level Architecture (V1)

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER (Browser/Mobile)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │    Cloudflare Pages (React + Vite + Tailwind v4)            │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │   Hub    │ │   Chat   │ │  Picks   │ │  Stats   │       │  │
│  │  │   (/)    │ │ (/chat)  │ │ (/preds) │ │ (/stats) │       │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │  │
│  └───────┼─────────────┼────────────┼────────────┼─────────────┘  │
└──────────┼─────────────┼────────────┼────────────┼────────────────┘
           ▼             ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker (Orchestrator)                │
│                                                                   │
│  Request Pipeline:                                                │
│  1. Parse user message                                            │
│  2. Route to user's Durable Object (via x-user-id header)        │
│  3. Promise.all([                                                 │
│       DO.getState("gw:N:chat", "accuracy", "profile"),            │
│       KV.get("fpl:bootstrap") || FPL.fetchBootstrap(),            │
│       Determine data source (FPL if PL, else football-data.org)   │
│     ])                                                            │
│  4. Fetch + cache match data from appropriate source              │
│  5. Assemble enriched prompt (PL or standard template)            │
│  6. Workers AI → Llama 3.3 70B → Analysis + PREDICTION_JSON      │
│  7. Parse prediction via regex (no second LLM call)               │
│  8. DO.store("gw:N:predictions", "gw:N:chat")                    │
│  9. Return { response, prediction, accuracy, dataSource }         │
│                                                                   │
│  ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐           │
│  │  Workers AI  │ │   Durable   │ │  External APIs   │           │
│  │  Llama 3.3   │ │   Object    │ │                  │           │
│  │  70B Instruct│ │  (per user) │ │ FPL API          │           │
│  │              │ │             │ │ (PL: xG, injuries│           │
│  │  Single call │ │ - profile   │ │  strength, FDR)  │           │
│  │  + structured│ │ - accuracy  │ │                  │           │
│  │  output      │ │ - gw:N:chat │ │ football-data.org│           │
│  │              │ │ - gw:N:preds│ │ (other leagues)  │           │
│  └──────────────┘ └─────────────┘ └──────────────────┘           │
│                                                                   │
│  ┌──────────────────────────────────────┐                         │
│  │  KV Namespace (Cache Layer)          │                         │
│  │  - fpl:bootstrap (6hr TTL)           │                         │
│  │  - fpl:fixtures:{gw} (30min TTL)     │                         │
│  │  - fd:standings:{code} (1hr TTL)     │                         │
│  │  - fd:fixtures (6hr TTL)             │                         │
│  └──────────────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────┘
```

### Data Source Routing

```typescript
async function fetchMatchContext(fixture: Fixture): Promise<MatchContext> {
  if (fixture.competitionCode === "PL") {
    return buildContextFromFPL(fixture);        // Rich: player stats, injuries, xG, strength, FDR
  } else {
    return buildContextFromFootballData(fixture); // Standard: standings, form, recent results
  }
}
```

---

## 8. Cloudflare Component Mapping

| Requirement | Component | Implementation |
|---|---|---|
| **LLM** | Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Single call with inline `<<<PREDICTION_JSON>>>` structured output. Fallback: `llama-3.1-8b-instruct`. |
| **Workflow** | Worker orchestration | 9-step pipeline with parallel fetching via `Promise.all`. Routes to correct data source based on competition. |
| **User input** | Cloudflare Pages | React + Vite + Tailwind v4. 4-page architecture: Hub, Chat, Predictions, Stats. Responsive navigation (3 variants). |
| **Memory/state** | Durable Objects | One DO per user (`UserState`). GW-keyed storage: `profile`, `accuracy`, `gw:{N}:chat`, `gw:{N}:predictions`. |

---

## 9. Data Architecture

### 9.1 Durable Object Storage Schema

State split across multiple keys for performance and gameweek-first organization:

```typescript
// Storage key schema (per user DO instance):
"profile"              → UserProfile
"accuracy"             → AccuracyStats
"gw:{N}:chat"          → ChatMessage[]      // Chat history for GW N
"gw:{N}:predictions"   → Prediction[]       // Predictions for GW N
// V2:
"pl:link"              → { linkCode, plUserId, plUsername, lastSynced }
```

```typescript
interface UserProfile {
  userId: string;
  createdAt: string;
  lastActiveAt: string;
  theme: 'light' | 'dark';
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    fixtureId?: number;
    predictionId?: string;
  };
}

interface Prediction {
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

interface Score { home: number; away: number; }
type Outcome = 'home' | 'draw' | 'away';
type Confidence = 'low' | 'medium' | 'high';

interface AccuracyStats {
  totalPredictions: number;
  resolved: number;
  pending: number;
  correctOutcomes: number;
  outcomeAccuracy: number;
  exactScores: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  byGameweek: { gw: number; total: number; correct: number }[];
  byCompetition: Record<string, {
    competitionName: string;
    total: number;
    correctOutcomes: number;
    outcomeAccuracy: number;
  }>;
}
```

### 9.2 PL Match Context (FPL API — Rich)

```typescript
interface PLMatchContext {
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

interface PLTeamContext {
  name: string;
  leaguePosition: number;
  points: number;
  played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
  strength: {
    overall: number;
    attackHome: number; attackAway: number;
    defenceHome: number; defenceAway: number;
  };
  form: string[];
  formSummary: string;
  recentResults: RecentResult[];
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  setPieceTakers?: string;
}

interface KeyPlayer {
  name: string; position: string; form: number;
  goals: number; assists: number; xG: number; xA: number;
  minutes: number; status: 'available' | 'injured' | 'doubtful' | 'suspended';
}

interface InjuryReport {
  player: string; status: string; news: string;
  chanceOfPlaying: number | null;
}
```

### 9.3 Standard Match Context (football-data.org)

```typescript
interface StandardMatchContext {
  type: 'standard';
  fixture: {
    id: number;
    homeTeam: string; awayTeam: string;
    competition: string; competitionCode: string;
    matchDate: string; matchday?: number;
  };
  homeTeam: StandardTeamContext;
  awayTeam: StandardTeamContext;
  headToHead?: HeadToHeadContext;
}

interface StandardTeamContext {
  name: string;
  leaguePosition: number; totalTeams: number;
  points: number; played: number;
  won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainest: number; goalDifference: number;
  form: string[];
  formSummary: string;
  recentResults: RecentResult[];
}
```

### 9.4 Historical Data Schema (V2 — D1)

Logged weekly by cron Worker:

```typescript
interface GameweekSnapshot {
  gameweek: number;
  season: string;                       // "2025-26"
  capturedAt: string;

  standings: { teamId: number; teamName: string; position: number;
    points: number; played: number; won: number; drawn: number; lost: number;
    goalsFor: number; goalsAgainst: number; }[];

  teamStrength: { teamId: number; overall: number;
    attackHome: number; attackAway: number;
    defenceHome: number; defenceAway: number; }[];

  playerSnapshots: { playerId: number; name: string; teamId: number;
    position: string; form: number; minutes: number;
    goals: number; assists: number; xG: number; xA: number;
    status: string; news: string; chanceOfPlaying: number | null; }[];

  fixtureResults: { fixtureId: number; homeTeamId: number; awayTeamId: number;
    homeGoals: number; awayGoals: number; }[];
}
```

---

## 10. Data Sources & Integration

### 10.1 Primary: FPL API (Premier League)

**Base URL:** `https://fantasy.premierleague.com/api/`
**Auth:** None. **Rate limits:** Unofficial, cache aggressively. **CORS:** Blocked — Worker calls server-side.

| Endpoint | Purpose | Cache TTL |
|----------|---------|-----------|
| `bootstrap-static/` | Teams, players, GWs, strength ratings, FDR | 6 hours |
| `fixtures/?event={gw}` | GW fixtures with scores + difficulty | 30 min (5 min live) |
| `event/{gw}/live/` | Live player stats for resolution | 5 min |
| `team/set-piece-notes/` | Set piece taker info | 24 hours |

**What FPL provides that football-data.org doesn't:** Team strength ratings, FDR, player xG/xA, injury status with `chance_of_playing_next_round`, injury news strings, set piece takers.

### 10.2 Secondary: football-data.org (Other Competitions)

**Auth:** Free API key via email. **Rate limits:** 10 req/min.

**Coverage:** La Liga (PD), Bundesliga (BL1), Serie A (SA), Ligue 1 (FL1), Champions League (CL), Eredivisie (DED), Championship (ELC).

| Endpoint | Purpose | Cache TTL |
|----------|---------|-----------|
| `GET /v4/matches?dateFrom=X&dateTo=Y` | Upcoming fixtures | 6 hours |
| `GET /v4/competitions/{code}/standings` | League tables | 1 hour |
| `GET /v4/teams/{id}/matches?status=FINISHED&limit=5` | Recent form | 30 min |
| `GET /v4/matches/{id}` | Match result (resolution) | 30 min |

### 10.3 Routing Summary

| Competition | Source | Data Richness |
|-------------|--------|---------------|
| **Premier League** | FPL API | High: player xG, injuries, strength, FDR, set pieces |
| **All other leagues** | football-data.org | Standard: standings, form, recent results |

### 10.4 Team Alias Map

Maps user input to both FPL IDs and football-data.org IDs:

```typescript
const TEAM_ALIASES: Record<string, { fplId: number; fdId: number }> = {
  // PL teams (both IDs)
  "arsenal": { fplId: 1, fdId: 57 }, "gunners": { fplId: 1, fdId: 57 },
  "chelsea": { fplId: 6, fdId: 61 }, "blues": { fplId: 6, fdId: 61 },
  "liverpool": { fplId: 12, fdId: 64 }, "reds": { fplId: 12, fdId: 64 },
  "man city": { fplId: 13, fdId: 65 }, "manchester city": { fplId: 13, fdId: 65 },
  "man utd": { fplId: 14, fdId: 66 }, "manchester united": { fplId: 14, fdId: 66 },
  "spurs": { fplId: 18, fdId: 73 }, "tottenham": { fplId: 18, fdId: 73 },
  // ... full PL roster

  // Non-PL teams (fplId = -1)
  "barcelona": { fplId: -1, fdId: 81 }, "barca": { fplId: -1, fdId: 81 },
  "real madrid": { fplId: -1, fdId: 86 },
  "bayern munich": { fplId: -1, fdId: 5 }, "bayern": { fplId: -1, fdId: 5 },
  // ... extend for all covered leagues
};
```

---

## 11. AI & Prompt Engineering

### 11.1 System Prompt

```
You are Gaff3r — a sharp, knowledgeable football analyst with the authority of a
seasoned manager. You speak with conviction, back up your calls with data, and aren't
afraid to take a position.

CORE RULES:
1. ONLY cite statistics and facts from the MATCH DATA provided in context.
   Never invent statistics, historical facts, or player information.
2. Always deliver a specific scoreline prediction. Not "home win" — give a score.
3. Always include a confidence level: Low, Medium, or High.
4. If data is missing or limited, say so explicitly and adjust confidence.
5. Be opinionated. Take a position. Hedging everything helps no one.
6. Reference specific data when discussing form.
7. When player data is available (PL matches), reference key players,
   injuries, and form. "With Saka doubtful at 25%, Arsenal lose their
   main creative outlet on the right."
8. Keep responses conversational. This is a chat, not a report.

ANALYSIS STRUCTURE (match predictions):
1. The Gaffer's Call — Your verdict in 1-2 sentences
2. Form Check — What the data tells you (cite specific numbers)
3. The Key Factor — The one thing that most swings this match
4. Prediction: [Home] [X]-[Y] [Away] — Confidence: [Level]
5. Where I Could Be Wrong — One honest sentence

WHEN PLAYER DATA IS AVAILABLE (PL matches):
- Mention top in-form players and what they bring
- Flag significant injuries/doubts and tactical impact
- Reference xG if it tells a different story from actual goals
- Note set piece threats if relevant

PREDICTION OUTPUT:
If you make a scoreline prediction, you MUST include this JSON block at the end:
<<<PREDICTION_JSON>>>
{
  "homeTeam": "<team name>",
  "awayTeam": "<team name>",
  "homeScore": <integer>,
  "awayScore": <integer>,
  "confidence": "low" | "medium" | "high",
  "reasoning": "<one sentence summary>"
}
<<<END_PREDICTION_JSON>>>

TONE: Enthusiastic about compelling fixtures. Concise (150-250 words).
Conversational. Contractions. No corporate speak.
```

### 11.2 User Message Template (PL — Rich)

```
USER MESSAGE: "${userMessage}"

═══ MATCH DATA (Premier League, Enhanced) ═══

FIXTURE: ${homeTeam} vs ${awayTeam}
Gameweek: ${gameweek} | Kickoff: ${kickoffTime}
FPL Difficulty: ${homeTeam} rates this ${homeFDR}/5 | ${awayTeam} rates this ${awayFDR}/5

── ${homeTeam.toUpperCase()} ──
Position: ${homePos}/20 (${homePts} pts, ${homeW}W ${homeD}D ${homeL}L)
Goals: ${homeGF} scored, ${homeGA} conceded (GD: ${homeGD})
FPL Strength: Attack ${homeAtkHome} | Defence ${homeDefHome} (at home)
Last 5: ${homeForm.join(" ")} (${homeFormSummary})
Key Players:
${homeKeyPlayers.map(p => `  ${p.name} (${p.position}) | Form: ${p.form} | ${p.goals}G ${p.assists}A | xG: ${p.xG} xA: ${p.xA}`).join("\n")}
${homeInjuries.length > 0 ? `Injuries:\n${homeInjuries.map(i => `  ${i.player}: ${i.news} (${i.chanceOfPlaying}%)`).join("\n")}` : "No injury concerns."}
${homeSetPieces ? `Set Pieces: ${homeSetPieces}` : ""}

── ${awayTeam.toUpperCase()} ──
[same structure]

═══ YOUR TRACK RECORD ═══
${accuracy.totalPredictions > 0 ?
  `Total: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}` :
  "No predictions yet."}
```

### 11.3 User Message Template (Non-PL — Standard)

Same structure without player-level detail, FPL strength, FDR, or set piece info. Uses standings, form, and recent results from football-data.org.

### 11.4 Prediction Extraction

**No second LLM call.** The `<<<PREDICTION_JSON>>>` block instruction in the system prompt tells the model to include structured output inline. Parsed via regex:

```typescript
function extractPrediction(response: string): PredictionData | null {
  const match = response.match(/<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/);
  if (!match) return null;
  try { return JSON.parse(match[1].trim()); }
  catch { return null; }
}
```

### 11.5 Fixture Identification (Fallback)

When alias map matching fails (particularly for non-PL teams), a quick LLM call identifies teams:

```
From the user's message, identify two football teams. JSON only:
{"homeTeam": "<from list or null>", "awayTeam": "<from list or null>", "found": bool}

Message: "${userMessage}"
Available: ${teamList.join(", ")}
```

---

## 12. API Specification

**Base URL:** `https://gaff3r.com` / `http://localhost:8787`

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/gameweek/current` | GET | Current + next GW IDs |
| `/api/fixtures/:gw` | GET | Fixtures for a gameweek (PL from FPL, others from football-data.org) |
| `/api/fixtures/upcoming` | GET | Upcoming fixtures across all competitions (next 7 days) |
| `/api/chat` | POST | Full analysis pipeline |
| `/api/predictions` | GET | User's prediction history (grouped by GW) |
| `/api/stats` | GET | Accuracy statistics |
| `/api/resolve` | POST | Trigger resolution of pending predictions |
| `/api/link-pl` | POST | (V2) Link Predictions League account |

**Headers:** `x-user-id: usr_{uuid}` on all authenticated endpoints.

**Chat response shape:**
```json
{
  "response": "Arsenal at home against Chelsea? ...",
  "prediction": {
    "id": "pred_x1y2z3",
    "homeTeam": "Arsenal",
    "awayTeam": "Chelsea",
    "predictedScore": { "home": 2, "away": 1 },
    "confidence": "medium",
    "reasoning": "..."
  },
  "accuracy": { "totalPredictions": 15, "outcomeAccuracy": 60, "currentStreak": 3 },
  "dataSource": "fpl"
}
```

---

## 13. Frontend Specification

### Design System

**Aesthetic:** Editorial football magazine meets modern web app — warm cream backgrounds, bold orange accents, serif/sans-serif font pairing.

**Fonts:** League Spartan (headings, 700-800) + EB Garamond (body, 400-600).

**Palette:**

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--bg-primary` | `#FAF3E1` cream | `#2D2421` warm brown |
| `--bg-surface` | `#F5E7C6` beige | `#3D3330` |
| `--accent` | `#FA8112` orange | `#FA8112` |
| `--text-primary` | `#2D2421` | `#FAF3E1` |
| `--text-secondary` | `#5C4F49` | `#D4C8B8` |
| `--success` | `#2E7D32` | `#66BB6A` |
| `--error` | `#C62828` | `#EF5350` |

**Styling:** Tailwind CSS v4 with `@theme` block. Dark mode via `[data-theme="dark"]`.

### Page Architecture

| Page | Route | Purpose |
|------|-------|---------|
| Hub | `/` | GW overview, fixture cards, quick-pick access |
| Chat | `/chat` or `/chat/:fixtureId` | AI conversation + match context sidebar |
| Predictions | `/predictions` | History by GW, filter by status |
| Stats | `/stats` | Accuracy dashboard, conditional chart |

### Responsive Navigation

| Breakpoint | Nav Pattern |
|------------|-------------|
| Mobile (< 768px) | Bottom tab bar (4 icons) |
| Tablet (768–1199px) | Top nav bar (icons + labels) |
| Desktop (≥ 1200px) | Left sidebar (logo + nav items) |

---

## 14. Performance Requirements

| Operation | Target | Max |
|---|---|---|
| Chat response (full pipeline) | < 6s | < 10s |
| Fixture list | < 500ms | < 1s |
| Prediction/accuracy loads | < 300ms | < 500ms |
| Frontend initial load | < 2s | < 3s |

---

## 15. Security & Privacy

- V1 auth: client-side UUID v4 in localStorage via `x-user-id` header. No PII.
- football-data.org API key as Worker secret. CORS restricted to Pages domain.
- Rate limiting: 1 req/sec per userId on chat endpoint.
- V2: PL link code stored in DO (encrypted at rest by Cloudflare).

---

## 16. Development Roadmap

### Phase 0: Scaffolding (2 hours)
Worker + Wrangler setup, React + Vite + Tailwind v4, `wrangler.toml` bindings, monorepo structure, design system tokens.

### Phase 1: Data Layer (3 hours)
FPL API client, football-data.org client, data source routing, KV caching, type definitions.

### Phase 2: Backend (4 hours)
Worker router, UserState DO (GW-keyed storage), Workers AI integration, Gaffer prompt + structured output, chat pipeline.

### Phase 3: Frontend Core (3 hours)
React Router (4 pages), responsive navigation (3 variants), API client, dark mode toggle.

### Phase 4: Frontend Pages (5 hours)
Hub (fixture cards, GW selector, preview panel), Chat (split view, context sidebar), Predictions (accordion, filters), Stats (stat cards, conditional chart).

### Phase 5: Polish (2 hours)
Loading states, error boundaries, responsive testing, animations, end-to-end flow.

### Phase 6: Deploy & Docs (2 hours)
Deploy to gaff3r.com (Pages + Worker), README, PROMPTS.md, final verification.

---

## 17. Success Metrics

### Submission

| Criterion | Demonstrated By |
|---|---|
| LLM | Llama 3.3 generates match analysis via Workers AI with inline structured predictions |
| Workflow | Worker orchestrates 9-step pipeline across dual data sources with parallel fetching |
| Chat input | 4-page React SPA on Cloudflare Pages with responsive navigation |
| Persistent state | Durable Objects persist GW-keyed state across sessions |

### Quality

- PL analyses reference specific players, injuries, xG, and FPL strength ratings
- Non-PL analyses provide standings-based form analysis
- 100% of predictions include specific scorelines + confidence
- \>90% fixture identification accuracy
- Responsive across mobile (375px), tablet (768px), desktop (1200px)
- Light + dark mode functional across all pages

---

## 18. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Workers AI slow/unavailable | Fallback to `llama-3.1-8b-instruct`; timeout + retry |
| FPL API changes without notice | Defensive parsing; fallback to football-data.org for PL standings |
| football-data.org rate limiting | Aggressive KV caching (10 req/min on free tier) |
| Team name matching failures | Comprehensive alias map + LLM fallback for fuzzy matching |
| LLM hallucinates statistics | System prompt forbids it; all data injected into context |
| `<<<PREDICTION_JSON>>>` parsing fails | Fallback: response treated as analysis-only, no prediction stored |
| FPL bootstrap too large | Store parsed/filtered version in KV, not raw response |

---

## 19. Repository Structure

```
cf_ai_gaff3r/
├── README.md
├── PROMPTS.md
├── LICENSE
├── worker/                            # Cloudflare Worker (backend)
│   ├── src/
│   │   ├── index.ts                   # Entry point + router
│   │   ├── routes/
│   │   │   ├── chat.ts                # POST /api/chat
│   │   │   ├── fixtures.ts            # GET /api/fixtures/:gw + /api/fixtures/upcoming
│   │   │   ├── predictions.ts         # GET /api/predictions
│   │   │   └── stats.ts               # GET /api/stats
│   │   ├── services/
│   │   │   ├── fpl.ts                 # FPL API client (PL data)
│   │   │   ├── football-data.ts       # football-data.org client (other leagues)
│   │   │   ├── match-context.ts       # Data source routing + context assembly
│   │   │   ├── ai.ts                  # Workers AI + prompt builder
│   │   │   └── cache.ts               # KV cache helpers
│   │   ├── durable-objects/
│   │   │   └── user-state.ts          # UserState DO class (GW-keyed)
│   │   ├── prompts/
│   │   │   └── gaffer.ts              # System prompt + PL/standard templates
│   │   ├── utils/
│   │   │   └── team-aliases.ts        # Dual-ID alias map
│   │   └── types/
│   │       ├── fpl.ts                 # FPL API types
│   │       ├── football-data.ts       # football-data.org types
│   │       ├── app.ts                 # App domain types
│   │       └── api.ts                 # API request/response types
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── frontend/                          # Cloudflare Pages (React SPA)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Router + layout
│   │   ├── index.css                  # Tailwind v4 @theme + dark mode
│   │   ├── pages/
│   │   │   ├── Hub.tsx
│   │   │   ├── Chat.tsx
│   │   │   ├── Predictions.tsx
│   │   │   └── Stats.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── PageLayout.tsx
│   │   │   ├── hub/
│   │   │   │   ├── FixtureCard.tsx
│   │   │   │   ├── GwSelector.tsx
│   │   │   │   └── FixturePreview.tsx
│   │   │   ├── chat/
│   │   │   │   ├── MessageBubble.tsx
│   │   │   │   ├── PredictionCard.tsx
│   │   │   │   ├── ChatInput.tsx
│   │   │   │   └── MatchContext.tsx
│   │   │   ├── predictions/
│   │   │   │   ├── GwAccordion.tsx
│   │   │   │   └── PredictionRow.tsx
│   │   │   └── stats/
│   │   │       ├── StatCard.tsx
│   │   │       └── AccuracyChart.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── hooks/
│   │   │   ├── useTheme.ts
│   │   │   ├── useGameweek.ts
│   │   │   └── useChat.ts
│   │   └── types/
│   │       └── index.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── gaffer_prd.md
```

---

## 20. Submission Checklist

### Repository

- [ ] Repo: `cf_ai_gaff3r`
- [ ] README.md with architecture, setup, deployed link (gaff3r.com), V2/V3 roadmap
- [ ] PROMPTS.md documenting all prompts
- [ ] All work original

### Technical

- [ ] LLM: Llama 3.3 via Workers AI with inline structured output
- [ ] Workflow: 9-step pipeline across dual data sources
- [ ] Chat: 4-page React SPA on Pages with responsive nav
- [ ] State: DO persists GW-keyed state across sessions

### Quality

- [ ] PL matches show player detail (injuries, xG, form, strength ratings, FDR)
- [ ] Non-PL matches provide standings-based analysis
- [ ] Specific scoreline + confidence in every prediction
- [ ] Chat persists across refreshes (per gameweek)
- [ ] Accuracy updates on resolution (overall + per-competition)
- [ ] Responsive at mobile, tablet, and desktop breakpoints
- [ ] Light + dark mode across all pages
- [ ] No API keys in client code

---

*Document Version: 3.0 (Final — merged)*
*Author: Divine*
*Created: February 2026*
*Updated: March 2026*
*Project: Cloudflare AI Internship Submission — Gaff3r*
