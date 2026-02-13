# Gaff3r — Product Requirements Document

> **An AI-powered football match analyst built on Cloudflare's edge infrastructure.**
> Chat with a sharp, opinionated gaffer about any upcoming Premier League match — get data-backed predictions, track your accuracy, and build a history of footballing insight.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Problem Statement & Opportunity](#2-problem-statement--opportunity)
3. [Product Vision & Principles](#3-product-vision--principles)
4. [Target Users](#4-target-users)
5. [Feature Requirements](#5-feature-requirements)
6. [System Architecture](#6-system-architecture)
7. [Cloudflare Component Mapping](#7-cloudflare-component-mapping)
8. [Data Architecture](#8-data-architecture)
9. [AI & Prompt Engineering](#9-ai--prompt-engineering)
10. [API Specification](#10-api-specification)
11. [Frontend Specification](#11-frontend-specification)
12. [Data Sources & Integration](#12-data-sources--integration)
13. [Performance Requirements](#13-performance-requirements)
14. [Security & Privacy](#14-security--privacy)
15. [Development Roadmap](#15-development-roadmap)
16. [Success Metrics](#16-success-metrics)
17. [Risks & Mitigations](#17-risks--mitigations)
18. [Repository Structure](#18-repository-structure)
19. [Submission Checklist](#19-submission-checklist)

---

## 1. Executive Summary

**Product Name:** Gaff3r
**Repository:** `cf_ai_gaff3r`
**Platform:** Web (Cloudflare Pages + Workers)
**LLM:** Llama 3.3 70B via Cloudflare Workers AI
**Data Source:** Fantasy Premier League (FPL) API
**Target Submission:** Cloudflare Internship Assignment

### What It Does

Gaff3r is a conversational football analyst that users chat with about upcoming Premier League matches. The app is organized around **gameweeks** — the weekly schedule of 10 Premier League fixtures. Users browse the current gameweek's fixtures, tap one to chat with the Gaffer AI, and receive data-backed analysis with specific scoreline predictions. The system tracks every prediction, auto-resolves them against real results, and maintains a running accuracy profile for each user.

The name says it all — in football, the "gaffer" is the boss, the manager, the one who's studied the tape and knows the game inside out. That's the persona: authoritative, data-driven, opinionated, but honest when the call is a tough one.

### Why It Matters

Football fans discuss predictions constantly, but the conversation is usually based on vibes, not data. Generic AI chatbots give hedged non-answers because they lack real-time match context. Gaff3r bridges this gap: it combines genuine football data from the FPL API with LLM reasoning to produce opinionated, data-grounded analysis that feels like getting a team talk from a manager who's done their homework.

### Core Technical Achievement

The project demonstrates mastery of Cloudflare's AI infrastructure by orchestrating four components in a single request pipeline: Pages serves a 4-page React frontend, a Worker orchestrates data fetching and prompt assembly, Workers AI runs inference on Llama 3.3 70B, and Durable Objects maintain per-user state (split by gameweek) including chat history, predictions, and accuracy tracking — all at the edge with zero external dependencies beyond the FPL API.

---

## 2. Problem Statement & Opportunity

### The Problem

**For casual football fans and prediction enthusiasts:**
- Pre-match analysis is scattered across multiple sources (stats sites, podcasts, social media)
- Generic AI assistants give vague, hedged responses about football because they lack real-time data
- Prediction tracking is manual — nobody systematically measures how good their instincts are
- Most "prediction" apps are betting platforms in disguise, not analysis tools

**For the Cloudflare internship context:**
- The assignment requires demonstrating LLM integration, workflow coordination, user interaction, and persistent state
- A football analyst app naturally exercises all four requirements while producing a genuinely useful, demonstrable product

### The Opportunity

Football is the world's most popular sport with an estimated 3.5 billion fans globally. Pre-match analysis and prediction is a core part of fan culture — from pub conversations to fantasy football to prediction leagues. An AI that can engage in this conversation intelligently, backed by real data, fills a gap that no current product addresses well.

The Cloudflare edge architecture is uniquely suited for this: low-latency responses worldwide, durable per-user state without managing databases, and built-in AI inference eliminate the need for external API dependencies beyond the FPL API.

---

## 3. Product Vision & Principles

### Vision Statement

> Make every football fan feel like they've got a gaffer in their pocket — someone who's watched every match, studied every stat, and isn't afraid to make a call.

### Product Principles

**1. Opinionated, Not Hedged**
The AI takes a position. It doesn't say "it could go either way" — it says "Arsenal 2-1, here's why" and acknowledges what could prove it wrong. Users want conviction backed by reasoning, not diplomatic non-answers.

**2. Data-First, Not Hallucination-Friendly**
Every claim is grounded in real match data injected into the prompt from the FPL API. The AI never invents statistics. If data is limited, it says so explicitly and adjusts its confidence accordingly.

**3. Conversational, Not Robotic**
The interaction should feel like chatting with a knowledgeable friend, not querying a database. The AI has personality — it can express surprise at a team's form, show enthusiasm about a compelling fixture, and acknowledge when it got a prediction wrong.

**4. Transparent Accuracy**
Users can always see how the AI's predictions measure up against reality. This creates an honest feedback loop and makes the experience more engaging over time.

**5. Gameweek-First, Not Open-Ended**
The app is organized around the Premier League's gameweek structure — the natural unit of football scheduling. This provides clear context, reduces ambiguity, and makes prediction tracking trivial.

---

## 4. Target Users

### Primary: The Informed Casual Fan

- Watches matches regularly but doesn't deep-dive into analytics
- Participates in prediction leagues, fantasy football, or pub debates
- Wants to sound knowledgeable when discussing upcoming matches
- Age 18-40, comfortable with chat interfaces, likely on mobile
- **Key need:** Quick, data-backed pre-match briefings they can reference

### Secondary: The Prediction Enthusiast

- Actively tracks their own predictions (formal or informal)
- Plays fantasy football, prediction leagues, or casual bets with friends
- Values accuracy tracking and wants to improve their prediction instincts
- **Key need:** Systematic prediction tracking with accuracy measurement

### Anti-User

- Someone looking for betting tips or guaranteed outcomes — this is an analysis tool, not a tipster service
- Users expecting real-time match commentary — this is pre-match analysis only

---

## 5. Feature Requirements

### 5.1 Core Features (MVP — P0)

#### 5.1.1 Gameweek Hub

**Description:** The app's landing page — a gameweek-organized view of all 10 Premier League fixtures with status indicators and quick access to AI analysis.

**User Flow:**
1. User opens the app → current gameweek is displayed with all fixtures
2. Each fixture shows teams, kickoff time, FPL difficulty rating, and prediction status (if predicted)
3. User taps a fixture card → navigates to the Chat page pre-loaded with that fixture's context
4. Gameweek selector allows browsing past/future gameweeks

**Acceptance Criteria:**
- Current gameweek auto-detected via FPL API `is_current` / `is_next` flags
- All 10 fixtures displayed with correct data
- Fixture cards show prediction status: unpredicted, pending, correct (✓), wrong (✗)
- GW navigation (prev/next arrows + dropdown)
- Desktop: 3-column grid + right preview panel for selected fixture details
- Mobile: single-column scrollable fixture cards

#### 5.1.2 Match Analysis Chat

**Description:** A full-page conversational interface where users discuss specific fixtures with the Gaffer AI. Context is pre-loaded based on entry point.

**User Flow:**
1. User arrives from Hub (fixture tapped) → chat pre-loaded with fixture context in sidebar
2. User arrives directly at `/chat` → sidebar shows all current GW fixtures as quick-picks
3. System builds enriched prompt with FPL data (team strengths, player form, injuries, difficulty)
4. AI delivers structured analysis with specific scoreline prediction using structured output
5. Prediction parsed from the LLM response via regex — no second API call needed
6. Prediction automatically stored in user's Durable Object under the gameweek key

**Acceptance Criteria:**
- Responds within 8 seconds for initial analysis (including data fetch + LLM inference)
- Delivers a specific scoreline, not just "home win" or "it's tight"
- Provides form analysis, key factors, and honest confidence assessment
- Prediction extracted inline from LLM response via `<<<PREDICTION_JSON>>>` block
- Desktop: split-view layout — chat (left 65%) + match context sidebar (right 35%)
- Mobile: full-screen chat with context bar at top

#### 5.1.3 Prediction Storage & Resolution

**Description:** Every AI prediction is automatically stored per-gameweek and resolved against actual results.

**Stored Data Per Prediction:**
- Fixture details (teams, gameweek, FPL fixture ID)
- Predicted score and outcome (home/draw/away)
- Confidence level (low/medium/high)
- AI reasoning summary
- Status: pending / resolved
- Actual result (when resolved)
- Accuracy flags: outcome correct, exact score correct

**Resolution:** Automated via checking the FPL `fixtures` endpoint for `finished: true` status. Can be triggered by Cron Trigger or on-demand when user visits the Predictions page.

#### 5.1.4 Accuracy Tracking & Stats Dashboard

**Description:** A dedicated stats page showing the user's prediction performance with key metrics and optional trend visualization.

**Metrics Tracked:**
- Total predictions made / resolved
- Outcome accuracy (home/draw/away correct — percentage)
- Exact score accuracy (exact scoreline correct — percentage)
- Current correct-outcome streak
- Best-ever streak

**Stats Page Features:**
- Hero stat: overall accuracy percentage (large, prominent)
- Stat cards: exact score rate, current streak, best streak, total predictions
- Conditional accuracy chart: renders only when ≥ 3 resolved gameweeks of data exist
- Recent resolved predictions with results

#### 5.1.5 Chat History & Context

**Description:** Conversations are organized by gameweek, persisting across sessions.

**Implementation:**
- Chat history stored per-gameweek in Durable Object (`gw:{N}:chat`)
- Last 20 messages per GW (rolling window)
- User's accuracy stats included in prompt context when relevant
- Previous predictions for the GW visible in chat

**Acceptance Criteria:**
- User can navigate between gameweeks and see past conversations
- AI references previous predictions naturally
- Context window management prevents token limit issues

---

### 5.2 Enhanced Features (Post-MVP — P1)

#### 5.2.1 Auto-Resolution via DO Alarms / Cron Triggers

Automatically resolve predictions without user action. A scheduled alarm or Cron Trigger checks for finished fixtures and resolves pending predictions.

#### 5.2.2 Champions League Support (v2)

Extend data sourcing beyond the FPL API to include Champions League fixtures, likely via API-Football or football-data.org.

#### 5.2.3 Comparison Mode

Allow users to input their own prediction before seeing the AI's, then compare reasoning and track whose predictions are more accurate over time.

#### 5.2.4 Shareable Prediction Cards

Generate OG-image-style prediction cards that users can share on social media.

#### 5.2.5 Voice Input

Leverage the Web Speech API (browser-native) for voice input, transcribed client-side and sent as text.

---

## 6. System Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                      USER (Browser/Mobile)                        │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │            Cloudflare Pages (React + Vite + Tailwind v4)    │  │
│  │                                                              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │  │
│  │  │   Hub    │ │   Chat   │ │  Picks   │ │  Stats   │       │  │
│  │  │   (/)    │ │ (/chat)  │ │ (/preds) │ │ (/stats) │       │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘       │  │
│  └───────┼─────────────┼────────────┼────────────┼─────────────┘  │
└──────────┼─────────────┼────────────┼────────────┼────────────────┘
           │             │            │            │
           ▼             ▼            ▼            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Cloudflare Worker (Orchestrator)                │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐    │
│  │                 Request Pipeline (7 steps)                │    │
│  │                                                           │    │
│  │  1. POST /api/chat { gameweek, fixtureId, message }      │    │
│  │  2. Promise.all([                                         │    │
│  │       DO.getState("gw:N:chat", "accuracy", "profile"),   │    │
│  │       KV.get("gw:N:fixtures") || FPL.fetchFixtures(N),   │    │
│  │       KV.get("bootstrap") || FPL.fetchBootstrap()        │    │
│  │     ])                                                    │    │
│  │  3. Build prompt (Gaffer persona + fixture data + injuries)│   │
│  │  4. Workers AI → Llama 3.3 70B → Analysis + prediction   │    │
│  │  5. Parse PREDICTION_JSON from response (regex)           │    │
│  │  6. DO.store("gw:N:predictions", "gw:N:chat")            │    │
│  │  7. Return { response, prediction, accuracy }             │    │
│  └────────┬──────────────────┬─────────────────┬─────────────┘    │
│           │                  │                 │                   │
│           ▼                  ▼                 ▼                   │
│  ┌──────────────┐   ┌─────────────┐   ┌─────────────────┐        │
│  │  Workers AI  │   │   Durable   │   │   FPL API       │        │
│  │  Llama 3.3   │   │   Object    │   │ (No key needed) │        │
│  │  70B Instruct│   │  (per user) │   │                 │        │
│  │              │   │             │   │ bootstrap-static│        │
│  │  @cf/meta/   │   │ - profile   │   │ fixtures/?event │        │
│  │  llama-3.3-  │   │ - accuracy  │   │ event/N/live    │        │
│  │  70b-instruct│   │ - gw:N:chat │   │                 │        │
│  │  -fp8-fast   │   │ - gw:N:preds│   │                 │        │
│  └──────────────┘   └─────────────┘   └─────────────────┘        │
│                                                                   │
│  ┌──────────────────────────────────┐                             │
│  │  KV Namespace (Cache Layer)      │                             │
│  │                                  │                             │
│  │  - fpl:bootstrap (6hr TTL)       │                             │
│  │  - fpl:fixtures:N (30min TTL)    │                             │
│  └──────────────────────────────────┘                             │
└──────────────────────────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Single LLM call with structured output | Eliminates second API call for prediction extraction. `<<<PREDICTION_JSON>>>` block parsed via regex. |
| FPL API (no key, no rate limits) | Provides team strengths, player xG/form, injury data, and GW scheduling for free. |
| Gameweek-keyed DO storage | `gw:N:chat` and `gw:N:predictions` — natural grouping, easy resolution, no giant monolithic state. |
| Parallel data fetching | `Promise.all` for DO state + KV cache + FPL API lookup reduces latency. |
| 4-page architecture (not SPA) | Hub, Chat, Predictions, Stats — each page has a focused purpose, demonstrates frontend range. |

---

## 7. Cloudflare Component Mapping

### Requirement 1: LLM

| Aspect | Implementation |
|---|---|
| **Model** | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| **Access** | Workers AI binding in `wrangler.toml` |
| **Usage** | Single call: match analysis + inline structured prediction extraction |
| **Fallback** | `@cf/meta/llama-3.1-8b-instruct` (faster, less capable) |
| **Configuration** | Temperature 0.7 (opinionated but coherent), max_tokens 1024 |

### Requirement 2: Workflow / Coordination

| Aspect | Implementation |
|---|---|
| **Coordination** | Single Worker orchestrates a 7-step pipeline |
| **Steps** | Receive → Parallel fetch (DO + KV + FPL) → Build prompt → LLM → Parse → Store → Respond |
| **Parallelization** | `Promise.all` for DO state, KV cache, and FPL API — reduces sequential latency |
| **Error Handling** | Each step has fallback behaviour (cached data, simplified prompt, error response) |

### Requirement 3: User Input via Chat

| Aspect | Implementation |
|---|---|
| **Frontend** | React + Vite + Tailwind v4 on Cloudflare Pages |
| **Pages** | 4 pages: Hub (/), Chat (/chat), Predictions (/predictions), Stats (/stats) |
| **Input Method** | Text chat (primary), fixture tap-to-chat from Hub |
| **Deployment** | Cloudflare Pages (connected to GitHub repo) |

### Requirement 4: Memory / Persistent State

| Aspect | Implementation |
|---|---|
| **Technology** | Cloudflare Durable Objects |
| **Scope** | One DO instance per user (keyed by userId) |
| **Storage Keys** | `profile`, `accuracy`, `gw:{N}:chat`, `gw:{N}:predictions` |
| **Persistence** | Survives across sessions, browser closures, and device switches |
| **Consistency** | Strong consistency within a single DO instance (single-threaded) |

---

## 8. Data Architecture

### 8.1 Durable Object Storage Schema

State is split across multiple keys for performance and scalability:

```typescript
// Storage key schema (per user DO instance):
"profile"              → UserProfile
"accuracy"             → AccuracyStats
"gw:{N}:chat"          → ChatMessage[]      // Chat history for GW N
"gw:{N}:predictions"   → Prediction[]       // Predictions for GW N
```

```typescript
interface UserProfile {
  userId: string;
  createdAt: string;              // ISO 8601
  lastActiveAt: string;
  theme: "light" | "dark";
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  metadata?: {
    fixtureId?: number;
    predictionId?: string;
  };
}

interface Prediction {
  id: string;
  fixtureId: number;              // FPL fixture ID
  gameweek: number;
  status: "pending" | "resolved";

  // Fixture details
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  kickoffTime: string;

  // The prediction
  predictedScore: { home: number; away: number };
  predictedOutcome: "home" | "draw" | "away";
  confidence: "low" | "medium" | "high";
  reasoning: string;

  // Actual result (populated on resolution)
  actualScore?: { home: number; away: number };
  actualOutcome?: "home" | "draw" | "away";
  outcomeCorrect?: boolean;
  exactScoreCorrect?: boolean;

  // Timestamps
  createdAt: string;
  resolvedAt?: string;
}

interface AccuracyStats {
  totalPredictions: number;
  resolved: number;
  pending: number;
  correctOutcomes: number;
  outcomeAccuracy: number;        // Percentage (0-100)
  exactScores: number;
  scoreAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  // Per-GW breakdown for chart (conditional, ≥ 3 GWs)
  byGameweek: { gw: number; total: number; correct: number }[];
}
```

### 8.2 KV Cache Schema

```typescript
// Workers KV keys and TTLs:

// FPL bootstrap data (teams, players, events)
// Key: "fpl:bootstrap"
// TTL: 6 hours
interface CachedBootstrap {
  teams: FPLTeam[];
  elements: FPLPlayer[];          // All ~600 players
  events: FPLEvent[];             // All 38 gameweeks
  fetchedAt: string;
}

// GW fixtures
// Key: "fpl:fixtures:{gw}"
// TTL: 30 minutes (5 minutes during live matches)
interface CachedFixtures {
  gameweek: number;
  fixtures: FPLFixture[];
  fetchedAt: string;
}
```

---

## 9. AI & Prompt Engineering

### 9.1 System Prompt

```
You are Gaff3r — a sharp, knowledgeable football analyst with the authority of a
seasoned manager. You speak with conviction, back up your calls with data, and aren't
afraid to take a position. Your personality is warm but direct — like a gaffer giving
a pre-match briefing to someone who genuinely wants to understand the game.

CORE RULES:
1. ONLY cite statistics and facts from the MATCH DATA provided in the context.
   Never invent statistics, historical facts, or player information.
2. Always deliver a specific scoreline prediction. Not "home win" — give a score.
3. Always include a confidence level: Low, Medium, or High.
4. If data is missing or limited, say so explicitly and adjust your confidence.
5. Be opinionated. Take a position. Hedging everything helps no one.
6. Reference specific data when discussing form.
   "Arsenal's strength_attack_home of 1340 tells you..." not "Arsenal have been playing well."
7. Keep responses conversational. This is a chat, not an essay or report.
8. When discussing the user's prediction accuracy, be encouraging but honest.

ANALYSIS STRUCTURE (for match predictions):
1. The Gaffer's Call — Your verdict in 1-2 sentences
2. Form Check — What the FPL strength ratings and recent form tell you
3. The Key Factor — The one thing that most swings this match
4. Prediction: [Home Team] [X]-[Y] [Away Team] — Confidence: [Level]
5. Where I Could Be Wrong — One honest sentence about the biggest risk

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

TONE GUIDELINES:
- Enthusiastic about compelling fixtures
- Measured but not boring about less exciting ones
- Self-aware when your track record is poor
- Concise. Aim for 150-250 words per analysis. Users can ask follow-ups.
- Conversational. Use contractions. No corporate speak.

WHEN THE USER ASKS A NON-FOOTBALL QUESTION:
- Briefly redirect to football topics with humour
- "I'm more of a football brain than a general knowledge one —
   but ask me about any match and I'll give you the full team talk."
```

### 9.2 User Message Template

```
USER MESSAGE: "${userMessage}"

═══ MATCH DATA (from FPL API) ═══

FIXTURE: ${homeTeam} vs ${awayTeam}
Gameweek: ${gameweek} | Kickoff: ${kickoffTime}
Difficulty: ${homeTeam} ${homeDifficulty}/5 | ${awayTeam} ${awayDifficulty}/5

── ${homeTeam.toUpperCase()} ──
FPL Strength: Overall ${strengthOverall} | Attack Home ${strengthAttackHome} | Defence Home ${strengthDefenceHome}
Key Players:
${homePlayers.map(p => `  ${p.web_name}: form ${p.form}, ${p.goals_scored}G ${p.assists}A, xG ${p.expected_goals}, xA ${p.expected_assists}`).join("\n")}
Injuries/Doubts:
${homeInjuries.map(p => `  ${p.web_name}: ${p.news} (${p.chance_of_playing_next_round}% chance)`).join("\n")}

── ${awayTeam.toUpperCase()} ──
FPL Strength: Overall ${strengthOverall} | Attack Away ${strengthAttackAway} | Defence Away ${strengthDefenceAway}
Key Players:
${awayPlayers.map(p => `  ${p.web_name}: form ${p.form}, ${p.goals_scored}G ${p.assists}A, xG ${p.expected_goals}, xA ${p.expected_assists}`).join("\n")}
Injuries/Doubts:
${awayInjuries.map(p => `  ${p.web_name}: ${p.news} (${p.chance_of_playing_next_round}% chance)`).join("\n")}

═══ YOUR TRACK RECORD ═══
${accuracy.totalPredictions > 0 ?
  `Total: ${accuracy.totalPredictions} | Outcome Accuracy: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}` :
  "No predictions yet."}
```

### 9.3 Prediction Extraction

**No second LLM call.** The structured output instruction in the system prompt tells the model to include a `<<<PREDICTION_JSON>>>` block. The Worker extracts this via regex:

```typescript
function extractPrediction(response: string): Prediction | null {
  const match = response.match(/<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}
```

### 9.4 Prompt Documentation Strategy (for PROMPTS.md)

Every prompt used in the system must be documented in `PROMPTS.md` with:
- The prompt's purpose
- The template with variable placeholders
- Why design choices were made (temperature, max_tokens, structure)
- Any prompts used during development with AI assistants

---

## 10. API Specification

### Base URL

```
Production: https://gaff3r.<username>.workers.dev
Local:      http://localhost:8787
```

### Endpoints

#### `GET /api/gameweek/current`

Returns the current and next gameweek IDs.

**Response:**
```json
{
  "current": 26,
  "next": 27,
  "nextDeadline": "2026-02-21T11:30:00Z"
}
```

#### `GET /api/fixtures/:gw`

Returns all 10 fixtures for a gameweek, enriched with team names.

**Response:**
```json
{
  "gameweek": 27,
  "fixtures": [
    {
      "id": 380,
      "homeTeam": "Arsenal",
      "awayTeam": "Wolves",
      "homeTeamId": 1,
      "awayTeamId": 20,
      "kickoffTime": "2026-02-22T15:00:00Z",
      "homeDifficulty": 2,
      "awayDifficulty": 4,
      "finished": false,
      "homeScore": null,
      "awayScore": null
    }
  ]
}
```

#### `POST /api/chat`

Primary endpoint. Handles the full analysis pipeline.

**Request:**
```json
{
  "message": "What do you think about Arsenal vs Wolves?",
  "gameweek": 27,
  "fixtureId": 380,
  "userId": "usr_a1b2c3d4e5f6"
}
```

**Response:**
```json
{
  "response": "Arsenal at home against Wolves? I fancy the Gunners here...",
  "prediction": {
    "id": "pred_x1y2z3",
    "homeTeam": "Arsenal",
    "awayTeam": "Wolves",
    "predictedScore": { "home": 2, "away": 1 },
    "confidence": "medium",
    "reasoning": "Arsenal's home attack strength and Wolves' poor away form."
  },
  "accuracy": {
    "totalPredictions": 15,
    "outcomeAccuracy": 60,
    "currentStreak": 3
  }
}
```

#### `GET /api/predictions`

Returns the user's prediction history, grouped by gameweek.

**Headers:** `x-user-id: usr_a1b2c3d4e5f6`

**Query Parameters:**
- `status` (optional): `"pending"` | `"resolved"` | `"all"` (default: `"all"`)

**Response:**
```json
{
  "predictions": {
    "27": [
      {
        "id": "pred_x1y2z3",
        "homeTeam": "Arsenal",
        "awayTeam": "Wolves",
        "predictedScore": { "home": 2, "away": 1 },
        "confidence": "medium",
        "status": "pending"
      }
    ],
    "26": [ ... ]
  },
  "total": 15
}
```

#### `GET /api/stats`

Returns detailed accuracy statistics.

**Headers:** `x-user-id: usr_a1b2c3d4e5f6`

**Response:**
```json
{
  "totalPredictions": 40,
  "resolved": 35,
  "outcomeAccuracy": 57.1,
  "scoreAccuracy": 8.5,
  "currentStreak": 3,
  "bestStreak": 7,
  "byGameweek": [
    { "gw": 24, "total": 5, "correct": 3 },
    { "gw": 25, "total": 4, "correct": 2 },
    { "gw": 26, "total": 6, "correct": 4 }
  ]
}
```

---

## 11. Frontend Specification

### 11.1 Design System

**Theme:** Light mode primary with dark mode support. The aesthetic is "editorial football magazine meets modern web app" — warm cream backgrounds, bold orange accents, and a serif/sans-serif font pairing that signals both expertise and modernity.

**Fonts:**
- Display / Headings: **League Spartan** (geometric sans-serif, 700-800 weight)
- Body / Analysis: **EB Garamond** (elegant serif, 400-600 weight)

**Color Palette:**

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--bg-primary` | `#FAF3E1` (cream) | `#2D2421` (warm brown) | Page background |
| `--bg-surface` | `#F5E7C6` (beige) | `#3D3330` | Cards, panels |
| `--accent` | `#FA8112` (orange) | `#FA8112` | Primary actions, highlights |
| `--text-primary` | `#2D2421` | `#FAF3E1` | Headings, key content |
| `--text-secondary` | `#5C4F49` | `#D4C8B8` | Body text |
| `--success` | `#2E7D32` | `#66BB6A` | Correct predictions |
| `--error` | `#C62828` | `#EF5350` | Wrong predictions |

**Styling:** Tailwind CSS v4 with custom theme tokens defined in `@theme` block. Dark mode via `[data-theme="dark"]` variant.

### 11.2 Page Architecture

| Page | Route | Purpose |
|------|-------|---------|
| **Gameweek Hub** | `/` | Landing page — browse fixtures, see prediction status |
| **Chat** | `/chat` or `/chat/:fixtureId` | AI conversation with match context |
| **Predictions** | `/predictions` | Prediction history organized by gameweek |
| **Stats** | `/stats` | Accuracy dashboard with metrics and conditional chart |

### 11.3 Responsive Navigation

| Breakpoint | Width | Nav Pattern |
|------------|-------|-------------|
| Mobile | < 768px | Bottom tab bar (4 icons) |
| Tablet | 768–1199px | Top nav bar (icons + labels) |
| Desktop | ≥ 1200px | Left sidebar (logo + nav items) |

### 11.4 Per-Page Responsive Behavior

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hub fixture cards | Full-width stack | 2-column grid | 3-column grid + preview panel |
| Chat messages | Full-width bubbles | Wider bubbles | Chat + match context sidebar |
| Predictions | Accordion by GW | Accordion (wider) | Table with full columns |
| Stats | Vertical stack | 2×2 stat grid | Dashboard grid with charts |

### 11.5 Key Components

| Component | Purpose |
|-----------|---------|
| `Navigation` | Responsive nav — bottom tabs / top nav / sidebar |
| `FixtureCard` | Fixture display with team names, kickoff, difficulty, prediction status |
| `GwSelector` | Gameweek navigation (prev/next/dropdown) |
| `FixturePreview` | Desktop-only right panel with fixture details |
| `MessageBubble` | Chat message (user or AI) |
| `PredictionCard` | Inline prediction card within AI message — score prominent, confidence badge |
| `ChatInput` | Fixed bottom input with send button |
| `MatchContext` | Desktop chat sidebar — team data, form, injuries, FPL ratings |
| `GwAccordion` | Collapsible gameweek section in predictions |
| `StatCard` | Individual metric display |
| `AccuracyChart` | Bar/line chart — conditional, renders only with ≥ 3 GWs data |

---

## 12. Data Sources & Integration

### 12.1 Primary: Fantasy Premier League (FPL) API

**Registration:** None required. No API key needed. No rate limits (practical use).

**Coverage:** Premier League only (20 teams, 38 gameweeks, ~600 players).

**Endpoints:**

| Endpoint | Data Provided | Cache TTL |
|----------|---------------|-----------|
| `GET /api/bootstrap-static/` | Teams (20 with strength ratings), players (stats, injuries, form), events/GWs (38) | 6 hours |
| `GET /api/fixtures/?event={gw}` | 10 fixtures per GW with scores, kickoff times, difficulty ratings | 30 min (5 min during live) |
| `GET /api/event/{id}/live/` | Live player stats for a GW (goals, assists, bonus) | 5 min |

**Key Data Points from FPL API:**

Per Team:
```
name, short_name, strength (1-5),
strength_overall_home, strength_overall_away,
strength_attack_home, strength_attack_away,
strength_defence_home, strength_defence_away
```

Per Player:
```
web_name, team, status (a/d/i/u/s),
chance_of_playing_next_round (0-100 or null),
form, goals_scored, assists, clean_sheets,
expected_goals, expected_assists, expected_goal_involvements,
news ("Ankle injury - Unknown return"), minutes,
influence, creativity, threat
```

Per Gameweek:
```
id, name, deadline_time, finished,
is_previous, is_current, is_next
```

**Advantages over football-data.org:**
- No API key required
- No rate limiting (practical use)
- Team strength ratings built-in (FPL Strength Difficulty Ratings)
- Player form, xG, xA data included
- Injury data free (`news` + `chance_of_playing_next_round`)
- Gameweek `is_current` / `is_next` flags for easy detection

**Risk:** The FPL API is unofficial and could change without notice. However, it has been stable for years and the entire FPL community depends on it. For an internship demo, this is acceptable. Documented in README.

### 12.2 Caching Strategy

```typescript
const CACHE_CONFIG = {
  bootstrap: { ttl: 6 * 60 * 60 },       // 6 hours — team/player data updates infrequently
  fixtures:  { ttl: 30 * 60 },            // 30 min — changes after matches
  fixtureLive: { ttl: 5 * 60 },           // 5 min — during live matches
};
```

Caching via Workers KV with `getCachedOrFetch(key, fetcher, ttl)` pattern.

---

## 13. Performance Requirements

### Response Time Targets

| Operation | Target | Maximum |
|---|---|---|
| Chat response (full pipeline) | < 6 seconds | < 10 seconds |
| Fixture list load | < 500ms | < 1 second |
| Prediction history load | < 300ms | < 500ms |
| Accuracy stats load | < 300ms | < 500ms |
| Frontend initial load | < 2 seconds | < 3 seconds |

### Scalability

| Dimension | Target |
|---|---|
| Concurrent users | 100 |
| Predictions per user | 1,000 |
| Chat history per GW | 20 messages (rolling) |
| Workers AI inference | Subject to Cloudflare free tier limits |

---

## 14. Security & Privacy

### Authentication

Lightweight approach for demo:
- Generate unique `userId` client-side (UUID v4) on first visit
- Store in `localStorage`
- Send with every API request via `x-user-id` header
- No email, password, or personal data collected

### Data Privacy

- No PII collected
- CORS headers restrict API access to the Pages domain
- Content Security Policy headers on the frontend

### API Security

```typescript
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "https://gaff3r.pages.dev",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-user-id",
};
```

---

## 15. Development Roadmap

### Phase 0: Scaffolding (2 hours)

| Task | Deliverable |
|---|---|
| Initialize Cloudflare Worker + Wrangler | Worker responding to requests |
| Set up React + Vite + Tailwind v4 | Frontend running locally |
| Configure `wrangler.toml` (DO, KV, AI bindings) | All bindings wired |
| Set up monorepo structure | `worker/` + `frontend/` |
| Configure fonts + Tailwind theme tokens | Design system in CSS |

### Phase 1: Data Layer (2 hours)

| Task | Deliverable |
|---|---|
| FPL API client (bootstrap-static, fixtures) | Data fetching works |
| KV caching layer with TTLs | Cache-through pattern implemented |
| Data transformation utils (FPL → app types) | Clean type-safe data |
| TypeScript type definitions | All types defined |

### Phase 2: Backend (4 hours)

| Task | Deliverable |
|---|---|
| Worker router (API endpoints) | All routes defined |
| Durable Object class (UserState) | Per-user state management |
| DO storage methods (split keys) | CRUD for profile, accuracy, GW data |
| Workers AI integration | LLM calls working |
| Gaffer system prompt + structured output | Analysis + prediction in one call |
| Chat endpoint orchestration pipeline | Full 7-step pipeline |

### Phase 3: Frontend Core (3 hours)

| Task | Deliverable |
|---|---|
| React Router (4 pages) | All routes work |
| Responsive navigation (3 variants) | Bottom tabs / top nav / sidebar |
| API client service | Frontend talks to backend |
| Dark mode toggle + persistence | Theme switching works |

### Phase 4: Frontend Pages (5 hours)

| Task | Deliverable |
|---|---|
| Gameweek Hub | Fixture cards, GW selector, desktop preview panel |
| Chat page | Split view, context sidebar, prediction cards inline |
| Predictions page | Accordion by GW, filter tabs |
| Stats page | Stat cards, conditional chart |

### Phase 5: Polish (2 hours)

| Task | Deliverable |
|---|---|
| Loading skeletons + error boundaries | Polished UX |
| Responsive testing (all breakpoints) | Works on mobile/tablet/desktop |
| Prediction card animations | Subtle fade-in effects |
| End-to-end flow testing | Full lifecycle works |

### Phase 6: Deployment & Docs (2 hours)

| Task | Deliverable |
|---|---|
| Deploy to Cloudflare (Pages + Worker) | Live app |
| Update README.md | Architecture, setup, deployed link |
| Update PROMPTS.md | All prompts documented |
| Final verification | Everything works in production |

---

## 16. Success Metrics

### Technical Success (Submission Evaluation)

| Criterion | Target | Demonstrated By |
|---|---|---|
| LLM integration | ✅ | Llama 3.3 via Workers AI generates match analysis |
| Workflow/coordination | ✅ | Worker orchestrates 7-step pipeline with parallel fetching |
| User input via chat | ✅ | 4-page React UI on Cloudflare Pages |
| Persistent memory/state | ✅ | Durable Objects persist state across sessions (GW-keyed) |
| Original work | ✅ | Custom-built on Cloudflare stack |
| README.md | ✅ | Architecture docs, setup instructions, deployed link |
| PROMPTS.md | ✅ | All AI prompts documented with rationale |

### Product Quality

| Metric | Target |
|---|---|
| Analysis quality | Predictions reference real FPL data — no hallucinated stats |
| Prediction specificity | 100% include a specific scoreline + confidence |
| UI polish | Professional appearance, responsive, smooth interactions |
| Error handling | All error states handled with user-friendly messages |

---

## 17. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Workers AI slow/unavailable | Medium | High | Fallback to `llama-3.1-8b-instruct`; timeout + retry |
| FPL API changes/breaks | Low | High | Stable for years; document risk; graceful degradation |
| Durable Object cold starts | Low | Low | Near-instant activation — minimal concern |
| Prompt too long for context | Low | Medium | Trim chat history to 20 msgs; cap player data to top 5 per team |
| LLM hallucinates statistics | Medium | High | System prompt forbids it; all data provided in context |
| `PREDICTION_JSON` parsing fails | Low | Medium | Fallback: response treated as analysis-only, no prediction stored |
| Cloudflare learning curve | Medium | Medium | Focus on docs + examples; keep architecture simple |

---

## 18. Repository Structure

```
cf_ai_gaff3r/
├── README.md
├── PROMPTS.md
├── LICENSE
├── worker/                            # Cloudflare Worker (backend)
│   ├── src/
│   │   ├── index.ts                   # Worker entry, router
│   │   ├── routes/
│   │   │   ├── chat.ts                # POST /api/chat
│   │   │   ├── fixtures.ts            # GET /api/fixtures/:gw
│   │   │   ├── predictions.ts         # GET /api/predictions
│   │   │   └── stats.ts               # GET /api/stats
│   │   ├── services/
│   │   │   ├── fpl.ts                 # FPL API client
│   │   │   ├── ai.ts                  # Workers AI + prompt builder
│   │   │   └── cache.ts               # KV cache helpers
│   │   ├── durable-objects/
│   │   │   └── user-state.ts          # UserState DO class
│   │   ├── prompts/
│   │   │   └── gaffer.ts              # System prompt + templates
│   │   └── types/
│   │       ├── fpl.ts                 # FPL API types
│   │       ├── app.ts                 # App domain types
│   │       └── api.ts                 # API request/response types
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
├── frontend/                          # Cloudflare Pages (React SPA)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                    # Router + layout
│   │   ├── index.css                  # Tailwind v4 + @theme
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
│   ├── tailwind.config.ts
│   ├── package.json
│   └── tsconfig.json
└── docs/
    └── gaffer_prd.md
```

---

## 19. Submission Checklist

### Repository Requirements

- [ ] Repository name: `cf_ai_gaff3r`
- [ ] `README.md` with project documentation and running instructions
- [ ] `PROMPTS.md` documenting all AI prompts used
- [ ] All work is original
- [ ] Clear instructions to run locally OR deployed link

### Technical Requirements

- [ ] LLM: Llama 3.3 via Cloudflare Workers AI
- [ ] Workflow: Worker orchestrates 7-step data pipeline
- [ ] User input: 4-page React UI via Cloudflare Pages
- [ ] Memory: Durable Objects persist state across sessions (GW-keyed)

### Quality Checks

- [ ] App works end-to-end on deployed URL
- [ ] Predictions contain specific scorelines with confidence
- [ ] Chat history persists across page refreshes (per gameweek)
- [ ] Accuracy tracking updates correctly after resolution
- [ ] Error states are handled gracefully
- [ ] Responsive across mobile, tablet, and desktop
- [ ] Dark mode works across all pages
- [ ] No API keys exposed in client code

---

*Document Version: 2.0*
*Author: Divine*
*Created: February 2026*
*Updated: February 2026*
*Project: Cloudflare AI Internship Submission — Gaff3r*
