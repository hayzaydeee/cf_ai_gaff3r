# Gaff3r — AI Football Analyst

> Chat with a sharp, opinionated gaffer about any upcoming Premier League match. Get data-backed predictions, track your accuracy, and build a history of footballing insight.

**Live:** [gaff3r.com](https://gaff3r.com)

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
                ├─ GET /api/gameweek/current
                ├─ GET /api/fixtures/:gw
                ├─ POST /api/chat
                ├─ GET /api/predictions
                └─ GET /api/stats
                │
                ▼
         Cloudflare Worker (Orchestrator)
                │
                ├─► Workers AI (Llama 3.3 70B) ─── Match analysis + prediction
                ├─► Durable Object (per user) ──── Chat history, predictions, accuracy
                ├─► Workers KV (cache) ─────────── FPL data (bootstrap, fixtures)
                └─► FPL API ────────────────────── Teams, players, injuries, GW data
```

### Cloudflare Component Mapping

| Requirement | Component | How It's Used |
|-------------|-----------|---------------|
| **LLM** | Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` generates match analysis with inline structured predictions |
| **Workflow / Coordination** | Worker | 7-step orchestration pipeline: parse → parallel fetch (DO + KV + FPL) → prompt build → LLM → parse prediction → store → respond |
| **User Input (Chat)** | Pages | 4-page React SPA — Hub, Chat, Predictions, Stats — with responsive navigation |
| **Memory / State** | Durable Objects | Per-user state split by gameweek: `profile`, `accuracy`, `gw:N:chat`, `gw:N:predictions` |

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
| Frontend | React 19, Vite 6, Tailwind CSS v4, React Router 7 |
| Backend | Cloudflare Worker (TypeScript) |
| AI | Cloudflare Workers AI — Llama 3.3 70B Instruct |
| State | Cloudflare Durable Objects (per-user, GW-keyed) |
| Cache | Cloudflare Workers KV |
| Hosting | Cloudflare Pages |
| Data | FPL API (fantasy.premierleague.com) |
| Fonts | EB Garamond (serif body) + League Spartan (sans-serif headings) |

---

## Running Locally

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- A Cloudflare account (free tier is sufficient)

### Setup

```bash
# Clone the repo
git clone https://github.com/hayzaydeee/cf_ai_gaff3r.git
cd cf_ai_gaff3r

# Install dependencies
cd worker && npm install && cd ..
cd frontend && npm install && cd ..

# Authenticate with Cloudflare (required for Workers AI + Durable Objects)
wrangler login

# Create the KV namespace
cd worker
wrangler kv namespace create FPL_CACHE
# Copy the output ID into wrangler.toml → [[kv_namespaces]] → id
```

### Run the Backend

```bash
cd worker
npm run dev
# Worker starts at http://localhost:8787
```

### Run the Frontend

```bash
# In a separate terminal
cd frontend
npm run dev
# App starts at http://localhost:5173
# API calls proxy to localhost:8787 automatically
```

### Deploy

```bash
# Deploy the Worker
cd worker
npm run deploy

# Deploy the frontend (connect repo to Cloudflare Pages via dashboard)
# Build command: cd frontend && npm run build
# Output directory: frontend/dist
```

---

## Project Structure

```
cf_ai_gaff3r/
├── worker/                     # Cloudflare Worker backend
│   ├── src/
│   │   ├── index.ts            # Entry point + router
│   │   ├── routes/             # API endpoint handlers
│   │   ├── services/           # FPL client, AI wrapper, KV cache
│   │   ├── durable-objects/    # UserState DO class
│   │   ├── prompts/            # Gaffer system prompt + templates
│   │   └── types/              # TypeScript type definitions
│   └── wrangler.toml           # Cloudflare config (DO, KV, AI bindings)
├── frontend/                   # React SPA (Cloudflare Pages)
│   ├── src/
│   │   ├── pages/              # Hub, Chat, Predictions, Stats
│   │   ├── components/         # UI components by feature area
│   │   ├── hooks/              # useTheme, useGameweek, useChat
│   │   ├── services/           # Backend API client
│   │   └── index.css           # Tailwind v4 theme + dark mode
│   └── vite.config.ts          # Vite + Tailwind + API proxy
├── docs/
│   └── gaffer_prd.md           # Product Requirements Document
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
- **Auto-resolution via Cron Triggers** — resolve predictions without user action
- **Champions League support** — extend beyond PL using additional data sources
- **Comparison mode** — user vs AI prediction tracking
- **Shareable prediction cards** — social media-ready OG images
- **Voice input** — via Web Speech API

---

## License

[MIT](./LICENSE)

---


