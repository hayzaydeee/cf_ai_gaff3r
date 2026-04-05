# Gaff3r — AI Football Analyst

> Chat with a sharp, opinionated gaffer about any upcoming Premier League match. Get data-backed predictions, track your accuracy, and build a history of footballing insight.

**Live:** [gaff3r.xyz](https://gaff3r.xyz)

---

## What It Does

Gaff3r is a conversational AI match analyst built entirely on Cloudflare's edge infrastructure. Pick any Premier League fixture from the current gameweek, and the Gaffer — a seasoned, opinionated football manager persona — will break down form, key players, injuries, and tactical matchups before delivering a specific scoreline prediction with transparent reasoning.

Every prediction is tracked. As real results come in, your accuracy is measured — outcome calls, exact scores, streaks, and trends. It's like having a knowledgeable football pundit in your pocket who's accountable for their calls.

### Key Features

- **Gameweek Hub** — Browse all 10 PL fixtures with FPL difficulty ratings and prediction status
- **AI Chat** — Conversational analysis powered by Llama 3.3 70B, grounded in real FPL data
- **Prediction Tracking** — Every AI prediction stored and auto-resolved against real results
- **Accuracy Dashboard** — Outcome %, exact score rate, streaks, and per-gameweek trend chart
- **Light & Dark Mode** — Warm editorial aesthetic with cream/orange palette

---

## Architecture

```
Browser ──► Cloudflare Pages (React + Vite + Tailwind v4)
                │
                ├─ POST /api/chat
                ├─ GET  /api/fixtures/:gw
                ├─ GET  /api/match-context/:id
                ├─ GET  /api/predictions
                ├─ GET  /api/stats
                └─ POST /api/auth/*
                │
                ▼
         Cloudflare Worker (Orchestrator)
                │
                ├─► Workers AI (Llama 3.3 70B) ─── Match analysis + prediction
                ├─► D1 (SQLite) ────────────────── Teams, fixtures, auth tables
                ├─► Durable Object (per user) ──── Chat history, user state
                ├─► Vectorize ──────────────────── Analysis RAG (768-dim cosine)
                ├─► Upstash Redis ──────────────── FPL data cache
                ├─► FPL API ────────────────────── Teams, players, injuries, GW data
                └─► Cron Triggers ──────────────── FPL snapshots, prediction resolution
```

### Cloudflare Component Mapping

| Requirement | Component | How It's Used |
|-------------|-----------|---------------|
| **LLM** | Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` generates match analysis with inline structured predictions |
| **Workflow / Coordination** | Worker | Orchestration pipeline: parse → fetch context (D1 + Redis + FPL) → statistical models → prompt build → LLM → parse prediction → store → respond |
| **User Input (Chat)** | Pages | React SPA — Landing, Hub, Chat, Predictions, Stats, Studio — with responsive navigation |
| **Memory / State** | Durable Objects | Per-user chat history and session state |
| **Database** | D1 + Kysely | Teams, fixtures, auth tables (Better Auth) |
| **Vector Search** | Vectorize | RAG over past analyses for contextual grounding |
| **Cache** | Upstash Redis | FPL API response caching |
| **Statistical Models** | Worker | Dixon-Coles, Monte Carlo simulation, contextual adjustments |

### Data Source

All match data comes from the **Fantasy Premier League (FPL) API** — no API key required, no rate limits. Provides:
- 20 PL teams with strength ratings (attack/defence, home/away)
- ~600 players with form, xG, xA, injury status, and news
- 38 gameweeks with fixtures, kickoff times, and difficulty ratings
- Live scores for result resolution

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 6, Tailwind CSS v4, React Router 7, Recharts, Framer Motion |
| Backend | Cloudflare Worker (TypeScript), Kysely (query builder) |
| AI | Cloudflare Workers AI — Llama 3.3 70B Instruct |
| Auth | Better Auth |
| Database | Cloudflare D1 (SQLite) |
| State | Cloudflare Durable Objects (per-user, GW-keyed) |
| Vector Search | Cloudflare Vectorize (768-dim, cosine) |
| Cache | Upstash Redis |
| Email | SendGrid |
| Hosting | Cloudflare Pages |
| Data | FPL API (fantasy.premierleague.com) |
| Fonts | EB Garamond (serif body) + League Spartan (sans-serif headings) |

---

## Try It

Gaff3r is live at **[gaff3r.xyz](https://gaff3r.xyz)** — no setup required.

---

## Project Structure

```
cf_ai_gaff3r/
├── worker/                     # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.ts            # Entry point + router
│   │   ├── auth.ts             # Better Auth config
│   │   ├── routes/             # API endpoint handlers (chat, fixtures, predictions, stats, match-context)
│   │   ├── services/           # FPL client, AI wrapper, Redis cache, vector store, intent classifier
│   │   ├── models/             # Dixon-Coles, Monte Carlo, contextual adjustments
│   │   ├── cron/               # Scheduled jobs (FPL snapshot, prediction resolution, match context warming)
│   │   ├── db/                 # D1 schema (Kysely)
│   │   ├── durable-objects/    # UserState DO class
│   │   ├── security/           # Rate limiting, input validation
│   │   ├── prompts/            # Gaffer system prompt + templates
│   │   ├── utils/              # Logger, team aliases, season helpers
│   │   └── types/              # TypeScript type definitions
│   ├── migrations/             # D1 SQL migrations
│   └── wrangler.toml           # Cloudflare config (DO, D1, AI, Vectorize bindings)
├── frontend/                   # React SPA (Cloudflare Pages)
│   ├── src/
│   │   ├── pages/              # Landing, Hub, Chat, Predictions, Stats, Studio, Auth
│   │   ├── components/         # UI components by feature area
│   │   ├── hooks/              # useTheme, useGameweek, useChat, useClubLogo
│   │   ├── context/            # AuthContext
│   │   ├── services/           # Backend API client
│   │   ├── lib/                # Auth client
│   │   └── index.css           # Tailwind v4 theme + dark mode
│   └── vite.config.ts          # Vite + Tailwind + API proxy
├── docs/                       # PRD, ideation backlog, implementation plans
├── PROMPTS.md                  # All AI prompts documented
└── README.md
```

---

## AI Prompts

All prompts are documented in [`PROMPTS.md`](./PROMPTS.md), including:
- **Gaffer System Prompt** — persona, analysis structure, tone guidelines
- **User Message Template** — FPL data injection format
- **Structured Output** — `<<<PREDICTION_JSON>>>` block for inline prediction extraction
- **Development Prompts** — prompts used with AI assistants during development

---

## Design

Warm, editorial aesthetic inspired by football magazine design:

| Element | Choice |
|---------|--------|
| **Light mode** | Cream `#FAF3E1` background, beige `#F5E7C6` cards, orange `#FA8112` accent |
| **Dark mode** | Warm brown `#2D2421` background, inverted palette |
| **Headings** | League Spartan (bold geometric sans-serif) |
| **Body text** | EB Garamond (elegant serif — editorial feel) |
| **Navigation** | Bottom tabs (mobile) · Top bar (tablet) · Left sidebar (desktop) |

---

## Future Improvements

- **Streaming responses** — progressive AI output for better perceived performance
- **Champions League support** — extend beyond PL using additional data sources
- **Comparison mode** — user vs AI prediction tracking
- **Shareable prediction cards** — social media-ready OG images
- **Voice input** — via Web Speech API

---

## License

[MIT](./LICENSE)

---


