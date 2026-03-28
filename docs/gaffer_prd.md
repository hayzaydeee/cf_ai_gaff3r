# Gaff3r: Product Requirements Document

> **An AI-powered football match analyst built on Cloudflare's edge infrastructure.**
> Chat with a sharp, opinionated gaffer about any upcoming match. Get predictions backed by real statistical models, not LLM guesswork. Track your accuracy. Accumulate a football intelligence dataset that powers increasingly deep analysis over time.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Evolution](#2-product-evolution)
3. [Problem Statement](#3-problem-statement)
4. [Vision & Principles](#4-vision--principles)
5. [Target Users](#5-target-users)
6. [Feature Requirements](#6-feature-requirements)
7. [Prediction Model: Dixon-Coles + Monte Carlo](#7-prediction-model-dixon-coles--monte-carlo)
8. [System Architecture](#8-system-architecture)
9. [Cloudflare Component Mapping](#9-cloudflare-component-mapping)
10. [Data Architecture](#10-data-architecture)
11. [Data Sources & Integration](#11-data-sources--integration)
12. [AI & Prompt Engineering](#12-ai--prompt-engineering)
    - [12.X Prediction Intelligence: Typed Sub-types & Visual Output](#12x-prediction-intelligence-typed-sub-types--visual-output)
    - [12.Y Intent Classification & Streaming Pipeline](#12y-intent-classification--streaming-pipeline-v1--implemented)
13. [API Specification](#13-api-specification)
14. [Frontend Specification](#14-frontend-specification)
15. [Performance Requirements](#15-performance-requirements)
16. [Security & Privacy](#16-security--privacy)
17. [Development Roadmap](#17-development-roadmap)
18. [Success Metrics](#18-success-metrics)
19. [Risks & Mitigations](#19-risks--mitigations)
20. [Repository Structure](#20-repository-structure)

---

## 1. Executive Summary

**Product Name:** Gaff3r
**Repository:** `cf_ai_gaffer`
**Platform:** Web (Cloudflare Pages + Workers)
**LLM:** Llama 3.3 70B via Cloudflare Workers AI
**Prediction Engine:** Dixon-Coles model + Monte Carlo simulation
**Primary Data Source:** FPL API (Premier League), football-data.org (other competitions)

### What It Does

Gaff3r is a conversational football analyst. Ask about any fixture ("Arsenal vs Chelsea this weekend") and it assembles real match data, reasons through it like a knowledgeable manager reviewing the opposition, and delivers a specific scoreline prediction with transparent reasoning.

For Premier League matches, Gaff3r pulls enriched data from the FPL API: team strength ratings, player-level form with xG/xA, injury reports with availability percentages, fixture difficulty ratings, and set piece taker information. For other European leagues, football-data.org provides standings, form, and recent results.

Predictions are backed by a statistical model (Dixon-Coles) that estimates team attack and defence strengths from historical results, and Monte Carlo simulation that runs 15,000 virtual matches to produce real probability distributions over scorelines. The LLM's role is explaining and contextualizing model outputs, not generating predictions from thin air. The statistical model computes; the LLM narrates.

The name: in football, the "gaffer" is the boss, the manager, the one who's studied the tape and knows the game inside out. That's the persona. The "3" in Gaff3r is intentional.

### Where It's Going

Gaff3r V1 ships the full prediction engine: conversational analysis, Dixon-Coles + Monte Carlo, accuracy tracking, and a longitudinal data pipeline that logs FPL data weekly. V2 ("Gaff3r Studio") evolves the platform into a general-purpose football content research tool where the prediction engine is one feature among many. Full Studio specification in the companion document: `gaff3r_studio.md`.

### Core Technical Achievement

The project orchestrates Cloudflare's AI infrastructure across multiple components: Pages serves the frontend, a Worker orchestrates data fetching, statistical modelling, and prompt assembly, Workers AI runs inference on Llama 3.3, Durable Objects maintain per-user state, D1 stores structured football data and model parameters, and Cron Triggers automate weekly data ingestion and parameter estimation. The prediction pipeline enriches prompts with both FPL API data (player injuries, xG, team strength ratings) and real statistical model outputs (probability distributions, scoreline predictions) that generic chatbots don't have access to.

---

## 2. Product Evolution

Gaff3r is designed as a staged product. Each version layers on top of the previous without architectural rewrites.

### V1: Match Prediction Engine

**Scope:** Conversational match analyst backed by a real statistical model, with accuracy tracking and a longitudinal data pipeline.

**Core loop:** User asks about a match > Worker fetches data > Dixon-Coles computes probability distributions > Monte Carlo simulates 15,000 matches > LLM contextualizes model outputs with match data > prediction stored > accuracy tracked over time.

**Data sources:** FPL API (Premier League), football-data.org (other leagues), Club Elo (historical ratings), Football-Data.co.uk (historical results for model fitting).

**Prediction method:** Dixon-Coles model estimates team attack/defence parameters from historical results. Monte Carlo simulation produces real probability distributions. Contextual adjustments (key player absence, form divergence, fixture congestion) applied as post-hoc multipliers. LLM narrates and contextualizes the model outputs using FPL match data. Full technical explanation in Section 7.

**Infrastructure:**
- **D1 database** as the primary structured data store. SQLite semantics for team parameters, historical results, gameweek snapshots.
- **Weekly FPL data snapshots** via Cron Trigger. Player form, injuries, team strength, fixture results captured every gameweek. This ephemeral data is overwritten in the FPL API after each update; logging it creates a time-series dataset no external API provides.
- **Vectorize + RAG.** Match analyses and accumulated knowledge embedded for semantic retrieval.
- **Predictions League integration.** Optional account linking via read-only link codes.
- **AI Gateway.** Caching, rate limiting, model fallback routing, observability.
- **Auto-resolution** via daily Cron Trigger.
- **Streaming responses** for token-by-token rendering.

**Why the data pipeline matters:** The FPL API only reflects current-state data. By logging snapshots weekly, Gaff3r builds a dataset that no external API provides. By season's end: 38 snapshots showing how every team and player evolved week by week. This accumulated data is the foundation for Studio. Without V1's logging, Studio's arbitrary time-window queries are unanswerable with real data.

### V2: Gaff3r Studio (The North Star)

**Scope:** General-purpose football analysis research platform. Gaff3r becomes the tool you talk to whenever you're building any kind of football analysis content: a mid-season review, an end-of-season awards video, a post-sacking managerial comparison, a transfer window impact assessment, a title race deep dive, or a relegation battle breakdown.

The key insight: almost all football analysis content follows the same underlying pattern. Define a time window or comparison frame, compute metrics across that frame, identify standout data points, and structure them into a narrative. Gaff3r Studio provides the conversational research layer for that pattern regardless of the content piece.

Full specification: see `gaff3r_studio.md`.

**Feature set summary:**
- Arbitrary time-window analysis engine
- Comparison engine (teams, managers, players, time windows)
- Typed Analysis Template System (8 pre-built templates + custom definitions)
- Text-to-SQL natural language querying of the D1 football database
- Player evolution tracking
- Youth and recruitment analysis
- Script/talking points generation
- Exportable data cards via `workers-og`
- Cloudflare Workflows for multi-step analysis pipelines

**Data moat:** The value in Studio is not the LLM. It's the accumulated, structured, computed data pipeline underneath. Arbitrary time-window aggregation requires actual calculation, not generation. Managerial comparison across specific gameweek ranges requires structured historical data. None of this is replicable by prompting ChatGPT.

---

## 3. Problem Statement

### For V1 (Match Predictions)

Pre-match analysis is scattered across multiple sources (stats sites, podcasts, social media). Generic AI assistants give vague, hedged responses about football because they lack real-time data. Prediction tracking is manual; nobody systematically measures their prediction accuracy. Most "prediction" apps are betting platforms in disguise, not analysis tools.

Beyond the data access problem, every football AI chatbot suffers a fundamental modelling problem: the LLM generates plausible-sounding predictions with no mathematical basis. It doesn't model team strengths, compute probability distributions, or account for the interaction between specific attacks and defences. The result is educated guessing dressed up in confident natural language. Real prediction accuracy requires real statistical models.

### For V2 (Content Creation Research)

Football content creators spend 3-5 hours per video on data research across 5-6 different platforms, whether the piece is a season review, a mid-season check-in, a managerial comparison, a transfer window assessment, or a title race breakdown. Raw stats platforms (FBref, Understat) provide data but no narrative structure, no arbitrary time-window computation, and no comparative framing. Professional analytics tools (xvalue.ai, Comparisonator) target clubs and scouts at enterprise pricing. No tool combines computed football data with a conversational research interface that lets you ask "compare X under these conditions vs Y under those conditions" and get real numbers back.

---

## 4. Vision & Principles

### Vision

> Make every football fan feel like they've got a gaffer in their pocket: someone who's watched every match, studied every stat, and isn't afraid to make a call. And for content creation, make Gaff3r the research assistant that can answer any analytical question about football with real computed data, not guesswork.

### Principles

**1. The model computes, the LLM explains.** Statistical predictions come from Dixon-Coles + Monte Carlo. The LLM contextualizes and narrates those numbers using match data (injuries, form, tactical factors). Neither is asked to do the other's job.

**2. Data-first, not hallucination-friendly.** Every claim is grounded in real data. For PL matches: actual xG numbers, actual injury reports, actual team strength ratings from the FPL API. The AI never invents statistics.

**3. Opinionated, not hedged.** The AI takes a position. "Arsenal 2-1, here's why" with an honest acknowledgment of what could prove it wrong. Conviction backed by reasoning.

**4. Accumulate, don't discard.** Every interaction produces data. Predictions are stored. Match data is logged. Player form is tracked over time. The product gets more capable the longer it runs, not because the LLM improves, but because the underlying dataset deepens.

**5. Simple now, deep later.** V1 is a prediction engine with a chat interface. No signup walls, no complex navigation. The Studio depth (templates, time-window queries, content export) layers on in V2 without breaking the core experience.

---

## 5. Target Users

### V1: The Prediction Enthusiast

Watches matches regularly, participates in prediction leagues or pub debates. Wants data-backed pre-match briefings. Values accuracy tracking. Age 18-40, comfortable with chat interfaces, likely on mobile.

### V2: The Football Content Creator

Makes YouTube videos, TikToks, or Twitter threads about football analysis. Content ranges from season reviews to managerial comparisons, transfer assessments, title race breakdowns, and player spotlights. Spends hours doing manual research across multiple stats platforms. Wants computed data and structured talking points. Values accuracy in numbers. Needs comparative analysis across arbitrary time windows.

### Anti-User

Someone looking for betting tips or guaranteed outcomes. Gaff3r is an analysis tool, not a tipster service. Users expecting real-time match commentary (Gaff3r is pre-match and post-match analysis).

---

## 6. Feature Requirements

### 6.1 V1 Features (Match Prediction Engine)

#### 6.1.1 Match Analysis Chat

A conversational interface where users ask about upcoming matches and receive data-backed analysis with specific predictions.

**User flow:**
1. User types a natural-language query
2. System identifies the fixture (team alias mapping + LLM fallback)
3. System determines data source (FPL API if PL, else football-data.org)
4. System fetches match data and builds enriched prompt
5. Dixon-Coles model computes probability distributions; Monte Carlo runs 15,000 simulations
6. Contextual adjustments applied (injuries, form, congestion)
7. LLM generates analysis contextualizing model outputs
8. Prediction automatically stored in user's history

**PL matches include:** Player-level detail (key player form with xG/xA, injury news with availability %, set piece takers, FPL fixture difficulty, team strength ratings).

**Non-PL matches include:** Standings, recent form, goal record.

**Edge cases:** Match already played (provide result + analysis), uncovered league (explain limitations), ambiguous team name (ask for clarification), non-football question (redirect with personality).

#### 6.1.2 Dixon-Coles Prediction Model

Full statistical prediction engine. Team attack/defence parameters estimated weekly via MLE from historical results. Monte Carlo simulation produces real probability distributions. Full technical explanation in Section 7.

#### 6.1.3 Contextual Adjustments

Post-hoc multipliers applied to Dixon-Coles outputs before simulation:

| Factor | Mechanism | Data Source |
|---|---|---|
| Key player absent | Reduce lambda proportional to player's share of team xG | FPL API (`expected_goals`, `chance_of_playing`) |
| Home/away split | Team-specific home advantage beyond global gamma | Historical results in D1 |
| Recent form divergence | Nudge lambda toward last-5 xG/game if it diverges from season avg | FPL gameweek snapshots |
| Derby/rivalry factor | Some fixtures produce more/fewer goals than expected | H2H history in D1 |
| Fixture congestion | 3 games in 7 days shows measurable performance drops | FPL fixture dates |

Each multiplier is independently testable against historical accuracy and tunable over time.

#### 6.1.4 Prediction Storage

Every prediction stored with: fixture details, predicted score/outcome, confidence level, AI reasoning summary, model probability distributions, timestamps, status (pending/resolved), actual result (when resolved), accuracy flags (outcome correct, exact score correct).

#### 6.1.5 Accuracy Tracking

Running statistics: total/resolved/pending, outcome accuracy %, exact score accuracy %, average goal difference, streaks, per-competition breakdown, confidence calibration (are "high confidence" predictions actually more accurate?), monthly trend.

#### 6.1.6 Chat History & Context

Last 20 messages stored per user (rolling window). Recent predictions included in prompt context. Favourite team inferred from query patterns.

#### 6.1.7 Quick-Pick Fixtures

Upcoming fixtures as tappable chips. FPL fixtures for PL, football-data.org for other leagues. Next 7 days, cached every 6 hours.

#### 6.1.8 JSON Mode for Prediction Extraction

Workers AI JSON Mode with schema enforcement on Llama 3.3 extracts structured predictions in the same call as the analysis. Single LLM call, not two.

#### 6.1.9 Club Elo as Additional Signal

Club Elo ratings (free CSV/API from clubelo.com, historical Elo for European clubs since 1960). Elo difference is a strong predictor. Included as prompt context and as a feature in the Dixon-Coles fitting process.

#### 6.1.10 D1 Database

Primary structured data store. D1 provides SQLite semantics, 10GB per database, scale-to-zero pricing. Stores: historical results, team parameters, gameweek snapshots. KV remains as a hot cache layer for API responses. Required for Dixon-Coles parameter fitting and (critically) text-to-SQL queries in Studio.

#### 6.1.11 FPL Data Logging

Weekly cron Worker captures per-gameweek: full standings, per-team strength ratings, per-player form/xG/xA/minutes/goals/assists/status/injury news, fixture results. Stored in D1 keyed by gameweek number and season. This is the critical path to Studio.

#### 6.1.12 Vectorize + RAG

Match analyses and accumulated knowledge embedded into Cloudflare Vectorize using `@cf/baai/bge-base-en-v1.5`. Semantic retrieval enriches future analyses with relevant past context.

#### 6.1.13 Predictions League Integration

Optional account linking. PL generates a read-only link code per user. Gaff3r's Worker stores it in the DO and uses it for server-to-server calls to PL's backend. Data flow: prediction history, aggregate stats, league context. Enables: "You predicted Arsenal 2-1 in your Predictions League too. Your PL accuracy is 58%, 4th in your league."

PL backend addition required: `GET /api/external/user-stats?token={linkCode}`. Build estimate: ~5 hours total.

#### 6.1.14 AI Gateway

Caching (repeated queries), rate limiting per user, model fallback routing (Llama 3.3 > Llama 3.1 8B), observability and cost tracking.

#### 6.1.15 Auto-Resolution + Streaming

Cron Trigger resolves predictions daily. Workers AI streaming (`stream: true`) for token-by-token frontend rendering.

---

### 6.2 V2 Features (Gaff3r Studio)

Fully specified in `gaff3r_studio.md`. Summary of capabilities:

- **Arbitrary time-window analysis engine:** Query any gameweek range for any team.
- **Comparison engine:** Any two time windows, teams, managers, or players.
- **Analysis Template System:** 8 pre-built templates + custom template builder with typed schema.
- **Text-to-SQL:** Natural language querying of the D1 football database.
- **Player evolution tracking:** Per-90 stats over any window, form curves, injury timelines.
- **Youth and recruitment analysis:** U21 breakthrough tracking, new signings pre/post.
- **Script/talking points generation:** Output adapted to creator's voice and format.
- **Exportable data cards:** `workers-og` for shareable stat graphics.
- **Cloudflare Workflows:** Durable multi-step analysis pipelines.

---

## 7. Prediction Model: Dixon-Coles + Monte Carlo

This section explains the statistical prediction system. The key principle: The key principle: **the model computes, the LLM explains**.

### 7.1 Why Goals Follow a Pattern: The Poisson Distribution

Football goals are rare, independent events happening at a roughly constant rate during a match. The Poisson distribution models exactly this scenario. For a team with an expected goals rate of λ (lambda), the probability of scoring exactly k goals is:

```
P(k goals) = λ^k * e^(-λ) / k!
```

Where `λ^k` is the expected rate raised to the power of goals scored, `e^(-λ)` is exponential decay (makes probabilities sum to 1), and `k!` is the factorial (accounts for ordering).

At λ = 1.5 (a decent Premier League attack), the most likely outcome is 1 goal, but there's a ~22% chance of scoring 0 and a ~13% chance of scoring 3+. Even at λ = 2.5 (peak Man City), blanking is ~8% likely. This inherent randomness is why football produces upsets, and the Poisson distribution captures it mathematically.

### 7.2 The Naive Model: Independent Poisson

The simplest approach: give each team their own λ, treat them as independent, and multiply probabilities for any scoreline:

```
P(2-1) = P(home scores 2) * P(away scores 1)
```

This works for most scorelines but systematically underestimates draws at low scores (0-0, 1-1) and overestimates narrow wins (1-0, 0-1). In reality, the two teams' goal counts aren't fully independent: a dominant team pressing high reduces the opponent's scoring chances too. That negative correlation matters most at low scores.

### 7.3 The Dixon-Coles Fix

Published in 1997 by Mark Dixon and Stuart Coles, the fix introduces a single correction factor τ (tau) that adjusts probabilities for the four scorelines where independence breaks down:

| Scoreline | τ formula | Effect when ρ < 0 |
|---|---|---|
| 0-0 | 1 - λ * μ * ρ | Probability increases (more goalless draws) |
| 0-1 | 1 + λ * ρ | Probability decreases |
| 1-0 | 1 + μ * ρ | Probability decreases |
| 1-1 | 1 - ρ | Probability increases (more 1-1 draws) |

For any scoreline where both teams score 2+, τ = 1 (no adjustment). The correction only touches the 2x2 corner of the scoreline matrix. The parameter ρ (rho) is typically around -0.10 to -0.15 in real Premier League data. Negative ρ means: when both teams score few goals, draws are slightly more likely than the independent model predicts.

The full probability for any scoreline:

```
P(h, a) = Poisson(h; λ) * Poisson(a; μ) * τ(h, a, λ, μ, ρ)
```

### 7.4 Team Strength Parameters

Dixon-Coles estimates four parameters per team from historical match data:

- **α (alpha):** Attack strength. Higher = more dangerous.
- **β (beta):** Defence strength. Lower = tighter at the back.
- **γ (gamma):** Home advantage. Global, same for all teams. Typically adds ~0.25 expected goals.
- **ρ (rho):** Dependency correction. Global. Typically around -0.13.

The expected goals for a specific match are computed as interactions:

```
λ (home xG) = α_home * β_away * γ
μ (away xG) = α_away * β_home
```

Your expected goals depend on the interaction between *your* attack strength and *their* defence strength. Arsenal scoring 3 against a team with β = 0.7 (weak defence) tells the model less about Arsenal's α than scoring 2 against a team with β = 1.3 (strong defence). The model untangles these interactions across hundreds of matches.

**How parameters are learned:** Maximum likelihood estimation (MLE) on historical results (1-3 seasons). The optimizer finds the α, β, γ, ρ that make the observed scorelines most probable under the model. Recent matches are weighted more heavily via exponential time-decay (ξ parameter, typically ~0.001).

**What it doesn't capture:** The model has no concept of individual players, set pieces vs open play, game state dependency, goal timing, or possession. Arsenal's attack strength is the same whether Saka plays or not. These factors are handled by contextual adjustments (Section 6.2.2) and LLM context, not the statistical model.

**Why this still works:** Over a large sample (100+ matches per team), the noise averages out. A team good at set pieces will have scored enough goals that their α reflects it implicitly. Football's outcome space is small (0-5 goals covers 99%+ of matches), so even a simple model with well-calibrated parameters captures the bulk of the variance. Dixon-Coles consistently hits ~50-55% accuracy on three-way outcome prediction, which is close to the theoretical ceiling of 55-62%.

### 7.5 The xG-Adjusted Extension

Instead of fitting the model on actual goals, fit it on expected goals (xG). Actual goals include noise (deflections, goalkeeper errors, worldies). xG strips that noise and measures chance quality. A team creating 2.3 xG/game but scoring 1.5 is underperforming and likely to regress upward. Fitting on xG produces attack/defence parameters that measure chance creation quality rather than goal output, which is more predictive.

The implementation change is minimal: swap `(homeGoals, awayGoals)` for `(homeXG, awayXG)` in the fitting function. Requires accumulated xG data from FPL snapshots (approximately half a season of logged data). Planned after approximately half a season of accumulated data.

### 7.6 Monte Carlo Simulation

With λ, μ, and ρ computed, Gaff3r simulates the match 15,000 times. Each simulation draws random goal counts from the Dixon-Coles distribution:

1. Generate home goals from Poisson(λ)
2. Generate away goals from Poisson(μ)
3. Apply Dixon-Coles acceptance/rejection for low-scoring outcomes
4. Record the result

After 15,000 iterations, count outcomes. The result is a probability distribution: "Arsenal win in 8,700/15,000 simulations (58%), draw in 3,300 (22%), Chelsea win in 3,000 (20%). Most common scoreline: 2-1 (2,130 occurrences, 14.2%)."

**Why simulate when you have exact probabilities?** Three reasons:

1. **League simulation.** To predict "who wins the title?", simulate every remaining match thousands of times. Outcomes compound across matches; the analytical matrix can't handle that.
2. **Confidence intervals.** "Arsenal win the league in 58% of simulations" is richer than a single probability.
3. **Scenario modelling.** "What if Saka is out for 5 games?" Adjust λ for those matches and re-simulate the season.

**Performance:** 15,000 simulations run in under 50ms on a Cloudflare Worker. Each simulation is microseconds of Poisson random variate generation and comparison. Well within the 30-second CPU limit.

### 7.7 The Ensemble: Model + LLM

The prediction pipeline feeds model outputs to the LLM as structured context:

```
STATISTICAL MODEL OUTPUT:
Outcome probabilities: Home 58.0% | Draw 22.0% | Away 20.0%
Most likely scoreline: 2-1 (14.2%)
Other likely scores: 1-1 (11.8%), 1-0 (10.3%), 2-0 (9.1%)
Model confidence: Medium (no single outcome dominates above 65%)
```

The LLM's job is to narrate and contextualize: "The model gives Arsenal a 58% chance, which I'd shade closer to 50/50 with Saka doubtful at 25%. Chelsea's counter-attack has been lethal away from home this month, and the model doesn't fully account for that tactical dimension."

Why this ensemble works:
- **Model alone:** Says "Arsenal 58% to win" but can't explain that Saka's injury changes the dynamic, or that Chelsea always raise their game for big fixtures. Pure numbers, no narrative.
- **LLM alone:** Narrates beautifully but invents statistics, has no real probability model, and produces overconfident predictions based on vibes. Great storytelling, no rigour.
- **Model + LLM:** The model provides the mathematical foundation. The LLM provides contextual intelligence and communication. Each does what it's best at.

### 7.8 Staging the Prediction Model

| Stage | Prediction Method | Accuracy Target |
|---|---|---|
| Initial | Vanilla Dixon-Coles on historical scorelines + Monte Carlo | ~50-52% three-way |
| After half-season of data | xG-adjusted Dixon-Coles | ~52-55% three-way |
| With contextual multipliers | xG-adjusted + key player absence, form, congestion | ~54-57% three-way |

---

## 8. System Architecture

### High-Level Architecture

```
User (Browser/Mobile)
    |
    v
Cloudflare Pages (React SPA)
    |  POST /api/chat
    v
Cloudflare Worker (Orchestrator)
    |
    |-- 1. Parse user message
    |-- 2. Route to user's Durable Object
    |       -> Returns: chatHistory, predictions, accuracy, preferences
    |-- 3. Identify fixture (alias map + LLM fallback)
    |-- 4. Determine data source (FPL if PL, else football-data.org)
    |-- 5. Fetch match data (cached in KV)
    |-- 6. Fetch team Dixon-Coles parameters from D1
    |-- 7. Run Dixon-Coles probability matrix (microseconds)
    |-- 8. Run Monte Carlo simulation, 15,000 matches (under 50ms)
    |-- 9. Apply contextual adjustments
    |-- 10. Build prompt: system + model outputs + match data + chat history
    |-- 11. Call Workers AI (Llama 3.3, JSON Mode for structured prediction)
    |-- 12. Store prediction + update chat history in DO
    |-- 13. Return response
    |
    +-- Workers AI (Llama 3.3 70B)
    +-- Durable Object (per-user state)
    +-- D1 Database (team params, results, snapshots)
    +-- KV Namespace (API response cache)
    +-- Vectorize (RAG corpus)
    +-- AI Gateway (caching, rate limiting, fallback)
    |
    +-- External APIs:
        +-- FPL API (PL: players, injuries, xG, strength, FDR)
        +-- football-data.org (other leagues: standings, form)
        +-- Club Elo (Elo ratings for all European clubs)
        +-- API-Football (supplementary: H2H, 100 req/day free)

Weekly Cron Worker:
    +-- Fetch FPL bootstrap-static + fixtures
    +-- Store gameweek snapshot in D1
    +-- Re-estimate Dixon-Coles parameters via MLE
    +-- Store updated team params in D1
    +-- Resolve pending predictions against real results

Predictions League (Optional):
    +-- Server-to-server via link code
    +-- GET /api/external/user-stats?token={linkCode}
```

### Data Source Routing

```typescript
async function fetchMatchContext(fixture: Fixture): Promise<MatchContext> {
  if (fixture.competitionCode === "PL") {
    return buildContextFromFPL(fixture);   // Rich: player xG, injuries, strength, FDR
  } else {
    return buildContextFromFootballData(fixture); // Standard: standings, form, results
  }
}
```

---

## 9. Cloudflare Component Mapping

| Requirement | Component | Implementation |
|---|---|---|
| **LLM** | Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast`, fallback `llama-3.1-8b-instruct`. JSON Mode for structured output. |
| **Workflow** | Worker orchestration | Multi-step pipeline: parse > DO > data source > Dixon-Coles > Monte Carlo > adjustments > prompt > LLM > store > respond |
| **User input** | Cloudflare Pages | React SPA, text chat |
| **Memory/state** | Durable Objects | One DO per user: chat, predictions, accuracy, preferences |
| **Structured data** | D1 | Team parameters, historical results, gameweek snapshots. SQLite semantics. |
| **Cache** | KV Namespace | FPL bootstrap (6hr), fixtures (1hr), standings (1hr), team aliases (30d) |
| **Embeddings** | Vectorize | Match analyses, football knowledge. `bge-base-en-v1.5` embeddings. |
| **Observability** | AI Gateway | Caching, rate limiting, fallback routing, cost tracking |
| **Scheduling** | Cron Triggers | Weekly parameter estimation, daily prediction resolution, weekly FPL snapshots |
| **Analysis pipelines** | Workflows (Studio) | Durable multi-step execution for template-based analysis |
| **Image generation** | `workers-og` (Studio) | Satori + resvg-wasm for shareable prediction/stat cards |

```toml
# wrangler.toml
[ai]
binding = "AI"

[[durable_objects.bindings]]
name = "GAFFER"
class_name = "GafferDO"

[[d1_databases]]
binding = "DB"
database_name = "gaffer-football"
database_id = "..."

[[kv_namespaces]]
binding = "CACHE"
id = "..."

[triggers]
crons = ["0 6 * * 1"]  # Every Monday 6am: parameter estimation + FPL snapshot
```

---

## 10. Data Architecture

### 10.1 Durable Object State Schema (Per-User)

```typescript
interface UserState {
  userId: string;
  createdAt: string;
  lastActiveAt: string;

  chatHistory: ChatMessage[];           // Rolling window, last 20
  predictions: Prediction[];
  accuracy: AccuracyStats;
  preferences: UserPreferences;

  // Predictions League integration
  predictionsLeague?: {
    linkCode: string;
    lastSynced: string;
    plUserId: string;
    plUsername: string;
  };

  // Studio: Analysis templates
  customTemplates?: AnalysisTemplate[];
  templateHistory?: {
    templateId: string;
    templateName: string;
    params: Record<string, unknown>;
    executedAt: string;
  }[];
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
  // Model outputs
  modelProbabilities?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    mostLikelyScore: string;
    mostLikelyScoreProb: number;
  };
  actualScore?: Score;
  actualOutcome?: Outcome;
  outcomeCorrect?: boolean;
  exactScoreCorrect?: boolean;
  goalDifference?: number;
  createdAt: string;
  resolvedAt?: string;
}

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
```

### 10.2 D1 Schema

```sql
-- Team Dixon-Coles parameters (updated weekly)
CREATE TABLE team_params (
  team_id INTEGER PRIMARY KEY,
  team_name TEXT NOT NULL,
  competition_code TEXT NOT NULL,
  alpha REAL NOT NULL,           -- attack strength
  beta REAL NOT NULL,            -- defence strength
  elo_rating REAL,               -- from Club Elo
  updated_at TEXT NOT NULL
);

-- Historical match results (for parameter fitting)
CREATE TABLE match_results (
  fixture_id INTEGER PRIMARY KEY,
  home_team_id INTEGER NOT NULL,
  away_team_id INTEGER NOT NULL,
  home_goals INTEGER NOT NULL,
  away_goals INTEGER NOT NULL,
  home_xg REAL,                  -- when available
  away_xg REAL,
  competition_code TEXT NOT NULL,
  match_date TEXT NOT NULL,
  gameweek INTEGER,
  season TEXT NOT NULL
);

-- Gameweek snapshots (logged weekly by cron)
CREATE TABLE gameweek_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gameweek INTEGER NOT NULL,
  season TEXT NOT NULL,
  captured_at TEXT NOT NULL
);

CREATE TABLE snapshot_standings (
  snapshot_id INTEGER REFERENCES gameweek_snapshots(id),
  team_id INTEGER NOT NULL,
  position INTEGER,
  points INTEGER,
  played INTEGER,
  won INTEGER, drawn INTEGER, lost INTEGER,
  goals_for INTEGER, goals_against INTEGER,
  PRIMARY KEY (snapshot_id, team_id)
);

CREATE TABLE snapshot_players (
  snapshot_id INTEGER REFERENCES gameweek_snapshots(id),
  player_id INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  name TEXT,
  position TEXT,
  form REAL,
  total_points INTEGER,
  minutes INTEGER,
  goals INTEGER, assists INTEGER,
  xg REAL, xa REAL,
  clean_sheets INTEGER,
  status TEXT,
  news TEXT,
  chance_of_playing REAL,
  PRIMARY KEY (snapshot_id, player_id)
);

-- Global model parameters
CREATE TABLE model_params (
  id INTEGER PRIMARY KEY,
  gamma REAL NOT NULL,            -- home advantage
  rho REAL NOT NULL,              -- dependency correction
  xi REAL NOT NULL,               -- time decay
  fitted_at TEXT NOT NULL,
  match_count INTEGER NOT NULL,
  log_likelihood REAL
);
```

### 10.3 Match Context Schemas

```typescript
// PL matches (FPL API enriched)
interface PLMatchContext {
  fixture: { id: number; homeTeam: string; awayTeam: string; matchDate: string; matchday: number };
  fplDifficulty: { home: number; away: number };
  homeTeam: PLTeamContext;
  awayTeam: PLTeamContext;
  // Model outputs
  modelOutput?: {
    homeLambda: number;
    awayMu: number;
    homeWinProb: number;
    drawProb: number;
    awayWinProb: number;
    topScorelines: { score: string; probability: number }[];
  };
}

interface PLTeamContext {
  name: string;
  leaguePosition: number;
  points: number; played: number; won: number; drawn: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number;
  strength: { overall: number; attackHome: number; attackAway: number; defenceHome: number; defenceAway: number };
  form: string[]; formSummary: string;
  recentResults: RecentResult[];
  keyPlayers: KeyPlayer[];
  injuries: InjuryReport[];
  setPieceTakers?: string;
  
  dixonColesParams?: { alpha: number; beta: number };
  eloRating?: number;
}

// Non-PL matches (football-data.org)
interface StandardMatchContext {
  fixture: { id: number; homeTeam: string; awayTeam: string; competition: string; competitionCode: string; matchDate: string };
  homeTeam: StandardTeamContext;
  awayTeam: StandardTeamContext;
  headToHead?: HeadToHeadContext;
  modelOutput?: { /* same as above */ };
}
```

---

## 11. Data Sources & Integration

### 11.1 Primary: FPL API (Premier League)

**Base URL:** `https://fantasy.premierleague.com/api/`
**Auth:** None. **Rate limits:** Unofficial, cache aggressively. **CORS:** Blocked from browser; Worker calls server-side.

| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `bootstrap-static/` | All teams, players, gameweeks, strength, FDR | 6 hours |
| `fixtures/` | All PL fixtures with past stats + upcoming | 1 hour |
| `fixtures/?event={gw}` | Specific gameweek fixtures | 30 minutes |
| `element-summary/{id}/` | Individual player detail | 1 hour |
| `event/{gw}/live/` | Live gameweek data (resolution) | 5 minutes |
| `team/set-piece-notes/` | Set piece takers | 24 hours |

**Unique data FPL provides:** Team strength ratings (attack/defence, home/away), fixture difficulty (1-5), player xG and xA, injury status with `chance_of_playing_next_round` (0-100), injury news strings, set piece takers.

**Note:** `bootstrap-static/` is large (several MB). Cache in KV, extract per-request.

### 11.2 Secondary: football-data.org (Other Competitions)

**Auth:** Free API key. **Rate limits:** 10 req/min.

**Coverage:** PL, La Liga (PD), Bundesliga (BL1), Serie A (SA), Ligue 1 (FL1), Champions League (CL), Championship (ELC), + others.

| Endpoint | Purpose | Cache TTL |
|---|---|---|
| `GET /v4/matches` | Upcoming fixtures | 6 hours |
| `GET /v4/competitions/{code}/standings` | League tables | 1 hour |
| `GET /v4/teams/{id}/matches?status=FINISHED&limit=5` | Recent form | 30 minutes |
| `GET /v4/matches/{id}` | Match result (resolution) | 30 minutes |

### 11.3 Club Elo (All European Clubs)

**URL:** `clubelo.com` **Format:** Free CSV/API. **Coverage:** Historical Elo ratings since 1960 for European clubs.

Elo difference is a strong, simple predictor. Integrate as additional prompt context and as a feature in the Dixon-Coles fitting process.

### 11.4 Supplementary: API-Football (H2H)

Free tier via RapidAPI, 100 req/day. Head-to-head data for non-PL matches only.

### 11.5 Historical Sources

| Source | Coverage | Use |
|---|---|---|
| **Football-Data.co.uk** | 20+ years of match results with betting odds, 25+ leagues (CSV) | Dixon-Coles parameter fitting |
| **Gaff3r's FPL snapshots** | Current season, weekly granularity | Studio time-window queries |
| **DataHub.io EPL dataset** | 32 seasons of PL match results | Season-over-season comparison |
| **Transfermarkt datasets** | Player valuations, transfers, injuries (GitHub) | Studio recruitment analysis |
| **StatsBomb Open Data** | Event-level data for select competitions | Studio tactical analysis enrichment |

### 11.6 Team Alias Map

Maps user input to both FPL IDs and football-data.org IDs:

```typescript
const TEAM_ALIASES: Record<string, { fplId: number; fdId: number }> = {
  "arsenal": { fplId: 1, fdId: 57 }, "gunners": { fplId: 1, fdId: 57 },
  "chelsea": { fplId: 6, fdId: 61 }, "blues": { fplId: 6, fdId: 61 },
  "liverpool": { fplId: 12, fdId: 64 }, "reds": { fplId: 12, fdId: 64 },
  "manchester city": { fplId: 13, fdId: 65 }, "man city": { fplId: 13, fdId: 65 },
  "manchester united": { fplId: 14, fdId: 66 }, "man utd": { fplId: 14, fdId: 66 },
  "tottenham": { fplId: 18, fdId: 73 }, "spurs": { fplId: 18, fdId: 73 },
  // ... full PL + major European teams
  "barcelona": { fplId: -1, fdId: 81 },
  "real madrid": { fplId: -1, fdId: 86 },
  "bayern munich": { fplId: -1, fdId: 5 },
  // fplId = -1 for non-PL teams
};
```

---

## 12. AI & Prompt Engineering

### 12.1 System Prompt

```
You are Gaff3r, a sharp, knowledgeable football analyst with the authority of a
seasoned manager. You speak with conviction, back up your calls with data, and
aren't afraid to take a position. Your personality is warm but direct, like a
gaffer giving a pre-match briefing.

CORE RULES:
1. ONLY cite statistics from the MATCH DATA provided in context. Never invent stats.
2. When STATISTICAL MODEL OUTPUT is provided, use those probabilities as your
   foundation. You may adjust your verbal confidence based on contextual factors
   (injuries, form, tactical matchups) but always reference the model numbers.
3. Always deliver a specific scoreline prediction with a confidence level.
4. Be opinionated. Take a position. Hedging everything helps no one.
5. Reference specific recent results when discussing form.
6. When player data is available (PL matches), reference key players, injuries,
   and xG. Flag how absences change the prediction.
7. Keep responses conversational. 150-250 words. Users can ask follow-ups.

ANALYSIS STRUCTURE:
1. The Gaff3r's Call: Your verdict in 1-2 sentences
2. Form Check: What the last 5 results tell you (cite specific scores)
3. The Key Factor: The one thing that most swings this match
4. Prediction: [Home] [X]-[Y] [Away], Confidence: [Level]
   Include model probability if available: "(Model: Home 58%, Draw 22%, Away 20%)"
5. Where I Could Be Wrong: One honest sentence
```

### 12.2 Prompt Templates

**PL matches** include: FPL difficulty ratings, team strength ratings, key players with xG/xA and form, injury reports with chance-of-playing %, set piece takers, model output.

**Non-PL matches** include: standings, goal record, recent form, H2H if available, model output.

Both include: user's prediction track record, recent predictions, accuracy stats.

### 12.3 JSON Mode

Workers AI JSON Mode with schema enforcement extracts the structured prediction in the same call as the analysis:

```typescript
const response = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
  messages: [...],
  response_format: {
    type: "json_schema",
    json_schema: {
      type: "object",
      properties: {
        analysis: { type: "string" },
        prediction: {
          type: "object",
          properties: {
            homeScore: { type: "integer" },
            awayScore: { type: "integer" },
            outcome: { type: "string", enum: ["home", "draw", "away"] },
            confidence: { type: "string", enum: ["low", "medium", "high"] },
            reasoning: { type: "string" }
          }
        }
      }
    }
  }
});
```

---

## 12.X Prediction Intelligence: Typed Sub-types & Visual Output

This section documents the three approaches evaluated for extending Gaff3r's prediction capability beyond the single `result` type. Approach 1 is **implemented in V1**. Approaches 2 and 3 are planned for V2/V3.

---

### Approach 1 — Typed Prediction Sub-types ✅ (V1 — Implemented)

**Problem:** The LLM previously responded to all prediction queries with the same scoreline format. Questions like "who will score?" or "both teams to score?" received generic match summaries instead of targeted market picks.

**Solution:** Extend the `<<<PREDICTION_JSON>>>` block with a `type` field. The Gaffer now detects intent from the user message and selects the appropriate sub-type, each with its own structured JSON schema and text response format.

#### Sub-types

| Type | Trigger phrases | JSON schema | Frontend component |
|---|---|---|---|
| `result` | "who wins", "predict", "your pick", "who you got" | `homeScore`, `awayScore`, `confidence`, `reasoning` | `PredictionCard` (existing) |
| `scorer` | "who will score", "scorer pick", "first goal", "goalscorer" | `scorers[]` with `name`, `team`, `likelihood`, `goals` | `ScorerCard` |
| `lineup` | "lineup", "predicted XI", "who starts", "team selection" | `homeLineup`/`awayLineup` with `formation`, `keyPicks[]` | `LineupGrid` |
| `btts` | "both teams to score", "BTTS", "over/under", "over 2.5" | `btts`, `confidence`, `overUnder` | `ProbabilityGauge` |

#### Architecture

- **Worker** (`prompts/gaffer.ts`): PREDICT mode now has four sub-mode definitions, each with a distinct text structure and JSON schema.
- **Worker** (`services/ai.ts`): `extractTypedPrediction()` parses the `type` field and validates sub-type specific fields. `AIResult` now includes both `prediction` (backward compat, result-only) and `typedPrediction` (all sub-types).
- **Worker** (`routes/chat.ts`): `typedPrediction` passed in SSE done event and persisted to Durable Object alongside `simResult`.
- **Frontend** (`types/index.ts`): `TypedPrediction` union type covering all sub-types; `ChatMessage` extended with `typedPrediction?`.
- **Frontend** (`AnalysisBubble.tsx`): Routes to `ScorerCard`, `LineupGrid`, `ProbabilityGauge`, or `PredictionCard` based on `typedPrediction.type`.

#### Key design decisions

- A single `<<<PREDICTION_JSON>>>` block is reused — only the schema changes per type. This keeps the LLM instruction compact.
- `result` type still produces a `PredictionData` for backward compatibility with the predictions history and D1 storage pipeline.
- `scorer` and `lineup` predictions are **not** stored in the D1 `predictions` table (only scoreline predictions are tracked for accuracy). Scorer/lineup data persists in the Durable Object chat history only.
- The Dixon-Coles model block and outcome visualisations (`OutcomeBar`, `ScorelineGrid`, `XGComparison`) only render for `result` type — they don't apply to scorer or BTTS queries.

---

### Approach 2 — Free-form VISUAL_JSON (V2)

**Problem:** Approach 1 hardcodes a fixed set of prediction types. As the product grows, adding new market types requires updating the prompt, adding JSON schemas, writing new components, and adding routing logic — every time.

**Solution:** Give the LLM a declarative `VISUAL_JSON` block where it can compose any combination of registered visual components. The frontend has a component registry; the LLM declares intent and component list; the frontend renders whatever is registered.

#### How it works

```
<<<VISUAL_JSON>>>
{
  "intent": "scorer_threat_analysis",
  "components": [
    { "type": "radar", "data": { "team": "Arsenal", "metrics": { ... } } },
    { "type": "comparison_bar", "data": { "home": { ... }, "away": { ... } } }
  ]
}
<<<END_VISUAL_JSON>>>
```

The frontend's `VisualRenderer.tsx` looks up each `type` in `registry.ts`. Unknown types render a "component not yet registered" placeholder rather than crashing. New visual types are added by registering them in the registry — no routing changes needed.

#### Scaffold status

The architecture is scaffolded at `frontend/src/components/chat/visuals/`:
- `registry.ts` — `registerVisual()`, `getVisual()`, `parseVisualSpec()`, `stripVisualBlock()`
- `VisualRenderer.tsx` — component lookup and render loop with unknown-type fallback

No visual components are registered yet. The system prompt additions and worker-side `VISUAL_JSON` parsing are deferred to V2.

#### Planned visual component types

| Type | Description |
|---|---|
| `heatmap` | Pass/shot/pressure heatmap for a team or player |
| `timeline` | Match event timeline (goals, cards, subs) |
| `radar` | Team attribute radar (attack, defence, form, xG, etc.) |
| `comparison_bar` | Side-by-side stat bars for two teams |
| `scatter` | xG vs goals scatter for a player over N games |
| `form_chart` | Last 10 results visualised as a streak bar |

#### Tradeoffs vs Approach 1

| | Approach 1 | Approach 2 |
|---|---|---|
| Adding new types | Change prompt + schema + component + routing | Register one component, prompt already open-ended |
| Type safety | Fully typed per sub-type | Dynamic registry; TypeScript at boundaries |
| LLM reliability | High (fixed schemas) | Medium (LLM must know registered type names) |
| Implementation cost | Medium | Higher (registry + new prompt mode) |

---

### Approach 3 — Two-Pass Intent Classifier (V3)

**Problem:** Both Approaches 1 and 2 rely on the same LLM to both detect intent and produce the response. If the intent detection is wrong (e.g., a scorer question triggers a result prediction), the response is still wrong — just more structured. Edge cases (multi-intent queries, ambiguous phrasing) are handled only by prompt engineering.

**Solution:** A dedicated fast classifier pass before the main Gaffer call. A small model (Llama 3.1 8B or a custom classifier) reads the user message and returns a structured intent object. The main Gaffer call then receives the pre-classified intent in its context, removing the ambiguity.

#### Pipeline

```
User message
    │
    ▼
[Pass 1] Intent classifier (Llama 3.1 8B, ~100ms)
    └─ { intent: "scorer", targets: ["Arsenal"], context: "anytime_scorer" }
    │
    ▼
[Pass 2] Gaffer specialist call (Llama 3.3 70B)
    └─ Receives: USER_INTENT: scorer/anytime_scorer
    └─ Receives: full match context
    └─ Returns: specialist scorer response + PREDICTION_JSON
```

#### Why it's V3

- **Latency cost:** Two sequential LLM calls adds ~200-400ms before streaming begins. Acceptable at V3 scale; premature optimisation at V1/V2.
- **Infrastructure:** Requires Workers AI Gateway analytics to measure classifier accuracy. Need baseline data from V1/V2 intent handling first.
- **Value ceiling:** Most intent ambiguity is solved by Approach 1's sub-type signals. Two-pass is worth it when Approach 1 misfire rate exceeds ~10% of sessions — that's a V3 problem.
- **Specialist prompts:** The real unlock of Approach 3 is per-intent specialist system prompts (a scorer specialist prompt optimised for that task, a lineup specialist, etc.). These require separate prompt engineering and evaluation cycles.

---

### 12.Y Intent Classification & Streaming Pipeline (V1 — Implemented)

#### Intent Classifier

**File:** `worker/src/services/intentClassifier.ts`

A lightweight keyword classifier (`classifyIntent`) runs before the LLM call on every `/api/chat` request. It returns `'scorer' | 'lineup' | 'btts' | 'analyse' | null`, where `null` means "run the full result prediction pipeline".

| Intent | Monte Carlo | Intent hint injected | Model block skeleton | Model block on done |
|---|---|---|---|---|
| `null` (result / general) | ✅ runs | none | ✅ shown | ✅ if simResult present |
| `'scorer'` | ❌ skipped | `DETECTED INTENT: scorer` | ❌ suppressed | ❌ never |
| `'lineup'` | ❌ skipped | `DETECTED INTENT: lineup` | ❌ suppressed | ❌ never |
| `'btts'` | ❌ skipped | `DETECTED INTENT: btts` | ❌ suppressed | ❌ never |
| `'analyse'` | ❌ skipped | `DETECTED INTENT: analyse` | ❌ suppressed | ❌ never |

The intent hint is injected into the user message template directly above the match data block. This removes the ambiguity the model faces when rich statistical context is present — it no longer has to infer the response type from phrasing alone.

#### SSE Meta Event

**File:** `worker/src/services/ai.ts` — `runAnalysisStreaming`

The very first SSE event in every stream is a `meta` event, emitted before any AI content arrives at the frontend:

```json
{ "type": "meta", "hasModel": true, "intent": "result" }
```

The frontend (`useChat.ts`) receives this and immediately sets `hasModel` and `intent` on the streaming message state. `AnalysisBubble` gates the loading skeleton on `message.hasModel !== false` — so for all non-result queries, no skeleton ever appears. For result queries, the skeleton appears as expected and transitions to the full Dixon-Coles block on done.

The skeleton itself no longer carries the "Dixon-Coles · Monte Carlo · 15,000 simulations" label — only the fully-materialised block does. This prevents the label from appearing briefly and then disappearing if the response turns out not to be a result prediction.

#### Safety Net (Approach B)

After the stream completes, `simResult` and `adjustmentNotes` are stripped from the `done` event if `typedPrediction.type !== 'result'`. This handles the edge case where the classifier returned `null` (ran the model) but the LLM produced a non-result sub-type. Without this, the Dixon-Coles block would render alongside a scorer or lineup card.

#### Premium Lineup Visual (V2 Roadmap)

The current `LineupGrid` component renders formation + key picks as a list. A V2 upgrade should render a top-down pitch graphic with player avatars/names in formation positions (FotMob/Sofascore style). Blocked in V1: FPL only exposes key player data, not a full 11-player squad list.

---

## 13. API Specification

**Base:** `https://cf-ai-gaffer.<username>.workers.dev` / `http://localhost:8787`

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Full analysis pipeline. Body: `{ message, userId }` |
| `/api/predictions` | GET | Prediction history. Params: `userId`, `status`, `limit`, `competition` |
| `/api/accuracy` | GET | Detailed accuracy stats. Params: `userId` |
| `/api/resolve` | POST | Trigger resolution. Body: `{ userId }` |
| `/api/fixtures` | GET | Upcoming fixtures for quick-pick. Params: `competition`, `days` |
| `/api/link-pl` | POST | Link Predictions League. Body: `{ userId, linkCode }` |

Chat response includes `dataSource` ("fpl" or "football-data") and `modelOutput` (probabilities and top scorelines).

---

## 14. Frontend Specification

**Theme:** Dark mode. "Tactical briefing room meets clean chat." Dark backgrounds (#0A0A0F), pitch-green accents (#22C55E). Not a betting site.

**Typography:** Inter (primary), JetBrains Mono (scores/stats).

**Key components:** ChatWindow, MessageBubble, PredictionCard (score prominent, confidence badge, model probabilities), FixtureChips, AccuracyBadge, PredictionsDrawer, PLLinkPanel.

**Mobile:** Full viewport chat, bottom-sheet drawer, sticky input, 44px touch targets.

---

## 15. Performance Requirements

| Operation | Target | Max |
|---|---|---|
| Chat response (data + model + LLM) | under 7s | under 12s |
| Dixon-Coles matrix computation | under 1ms | under 5ms |
| Monte Carlo 15k simulation | under 50ms | under 100ms |
| Frontend initial load | under 2s | under 3s |

---

## 16. Security & Privacy

V1 auth: client-side UUID v4 in localStorage. No PII collected. API keys as Worker secrets. CORS restricted to Pages domain. Rate limiting: 1 req/sec per userId on chat endpoint. V2: PL link code stored in DO (Cloudflare encrypts at rest).

---

## 17. Development Roadmap

### V1 Build Plan

#### Phase 1: Infrastructure (Week 1)
Cloudflare account + Wrangler CLI setup. Worker + DO + Workers AI wired up. D1 database created with schema deployed. FPL API client with KV caching. football-data.org client. Club Elo client. End-to-end pipeline testable via curl.

#### Phase 2: Prediction Model (Week 2)
Backfill historical match data from Football-Data.co.uk into D1. Implement Dixon-Coles parameter estimation (MLE). Implement Monte Carlo simulation engine. Implement contextual adjustment multipliers. Wire model outputs into prompt context. Cron Trigger for weekly parameter re-estimation.

#### Phase 3: Chat Intelligence (Week 3)
Team alias mapping + fixture identification. FPL data extraction (PLMatchContext with players, injuries, xG). Prompt template system (PL + non-PL variants). JSON Mode prediction extraction. Vectorize setup + RAG pipeline. Cron Trigger for daily prediction resolution.

#### Phase 4: Frontend (Week 4)
React + Tailwind scaffold. Chat UI with streaming responses. PredictionCard with model probabilities. FixtureChips, AccuracyBadge, PredictionsDrawer. FPL data logging cron. Pages deploy.

#### Phase 5: Integrations + Polish (Week 5)
Predictions League integration (PL backend endpoint + Gaff3r link flow). AI Gateway setup. Edge case handling. Mobile responsiveness. README.md and PROMPTS.md. End-to-end testing. Demo recording.

### V2: Gaff3r Studio
See `gaff3r_studio.md` for the 10-week phased build plan.

---

## 18. Success Metrics

### V1 Quality

| Metric | Target |
|---|---|
| PL analyses reference specific players, injuries, xG | 100% |
| All predictions include specific scorelines | 100% |
| Model probability distributions shown | 100% |
| Fixture identification accuracy | >90% |
| Dixon-Coles three-way outcome accuracy | >50% (above naive baseline) |
| FPL snapshots captured | 38/38 gameweeks by season end |
| Mobile responsive at 375px | Yes |

### V2 (Studio)

| Metric | Target |
|---|---|
| Text-to-SQL query success rate | >80% |
| Time-window queries answerable | Any GW range returns computed data |
| Template execution end-to-end | All 8 pre-built templates functional |

---

## 19. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Workers AI slow/unavailable | Fallback to `llama-3.1-8b-instruct`; timeout + retry |
| FPL API changes without notice | Defensive parsing; fallback to football-data.org for PL |
| football-data.org rate limiting | Aggressive KV caching |
| Team name matching failures | Alias map + LLM fallback |
| LLM hallucinates statistics | System prompt forbids it; all data provided in context |
| Dixon-Coles overfits to historical data | Time-decay weighting; regular re-fitting; xG adjustment |
| FPL bootstrap too large for KV | Store parsed/filtered version |

---

## 20. Repository Structure

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
│   │   │   ├── club-elo.ts            # Club Elo client
│   │   │   ├── match-context.ts       # Routes to correct source
│   │   │   ├── llm.ts                 # Workers AI + JSON Mode
│   │   │   ├── fixture-matcher.ts     # Team name resolution
│   │   │   └── prediction-resolver.ts
│   │   ├── model/
│   │   │   ├── dixon-coles.ts         # Parameter estimation + probability matrix
│   │   │   ├── monte-carlo.ts         # Simulation engine
│   │   │   ├── adjustments.ts         # Contextual multipliers
│   │   │   └── poisson.ts             # Poisson utilities
│   │   ├── prompts/
│   │   │   ├── system.ts
│   │   │   ├── templates.ts           # PL + non-PL templates
│   │   │   └── extraction.ts          # JSON Mode schema
│   │   ├── types/
│   │   │   ├── state.ts
│   │   │   ├── fpl.ts
│   │   │   ├── football-data.ts
│   │   │   ├── match-context.ts
│   │   │   └── model.ts              # Dixon-Coles types
│   │   ├── utils/
│   │   │   ├── team-aliases.ts
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
│   │   │   ├── PredictionCard.tsx     # Score, model probabilities, confidence
│   │   │   ├── FixtureChips.tsx
│   │   │   ├── AccuracyBadge.tsx
│   │   │   ├── PredictionsDrawer.tsx
│   │   │   ├── AccuracyPanel.tsx
│   │   │   └── LoadingDots.tsx
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

*Document Version: 3.0*
*Author: Divine*
*Created: March 2026*
*Project: Gaff3r*
*Companion: gaff3r_studio.md*