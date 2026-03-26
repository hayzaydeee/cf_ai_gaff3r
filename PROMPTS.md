PROMPT 1

"I need to build an AI-powered football match analyst app for a Cloudflare internship assignment. Here are the hard requirements:
**Must include:**
1. LLM — Llama 3.3 on Cloudflare Workers AI (or external LLM)
2. Workflow/coordination — using Cloudflare Workers, Workflows, or Durable Objects
3. User input via chat or voice — using Cloudflare Pages or Realtime
4. Memory or state — persistent across sessions
**Submission requirements:**
- GitHub repo prefixed with `cf_ai_` (e.g. cf_ai_match_analyst)
- README.md with project docs and clear instructions to run locally or via deployed link
- PROMPTS.md documenting all AI prompts used during development
- All work must be original
**The concept:**
An AI match analyst you chat with about upcoming football (soccer) matches. You ask about a fixture (e.g. "Arsenal vs Chelsea this weekend"), and the AI reasons about form, head-to-head record, league position, injuries, and gives a scoreline prediction with reasoning. Durable Objects store your prediction history and track your accuracy over time as real results come in. The app should feel like talking to a knowledgeable football pundit.
**My tech background:**
I build with TypeScript, React, Node.js, Express, MongoDB. I've built predictionsLeague (predictionsleague.xyz), a fantasy football prediction game with real-time leaderboards and a custom scoring engine, so I'm familiar with football data and scoring logic. I've also integrated the OpenAI API in a previous project (umber). I have NOT used Cloudflare Workers, Durable Objects, or Workers AI before — I need to learn these.
**What I need from you:**
1. Architecture plan — how each Cloudflare component maps to each requirement
2. Data strategy — where match/form data comes from (free APIs like football-data.org, API-Football, etc.)
3. Step-by-step build plan I can follow over a weekend
4. The Durable Objects state schema for prediction history and accuracy tracking
5. A clean chat UI approach using Cloudflare Pages
6. How to structure the LLM prompts so the AI gives reasoned, specific predictions rather than generic responses.
"

PROMPT 2

"Give me a comprehensive PRD for the app now."

PROMPT 3

"I want us to work on the actual UI layout. lets think laptop, ipad and mobile. we should comprehensively reason out the specifics, tweaks and responsive behaviour. Basically we dont have to settle with what the PRD suggests. lets run through several UI options and possible pages (it musnt be a single page app), that would be effective solely based on the premise of the app."

PROMPT 4

"I've made some changes to the PRD. review it in depth and breakdown changes from our original approach and plot a plan for getting there."

PROMPT 5

"current gw should actually be a step forward, so we query one week forward rather than the plain current gw, because after those matches play, the interface doesnt move forward. make sense?"

---

## Application AI Prompts

The following prompts are used by the Gaff3r Worker at runtime to drive the LLM.

---

### SYSTEM PROMPT

Used as the system message on every chat request. Sets the Gaffer persona, output rules, and response structure.

```
You are Gaff3r — a sharp, knowledgeable football analyst with the authority of a seasoned manager. You speak with conviction, back up your calls with data, and aren't afraid to take a position.

CORE RULES:
1. ONLY cite statistics and facts from the MATCH DATA provided in context. Never invent statistics, historical facts, or player information.
2. Always deliver a specific scoreline prediction. Not "home win" — give a score.
3. Always include a confidence level: Low, Medium, or High.
4. If data is missing or limited, say so explicitly and adjust confidence.
5. Be opinionated. Take a position. Hedging everything helps no one.
6. Reference specific data when discussing form.
7. When player data is available (PL matches), reference key players, injuries, and form. "With Saka doubtful at 25%, Arsenal lose their main creative outlet on the right."
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

TONE: Enthusiastic about compelling fixtures. Concise (150-250 words). Conversational. Contractions. No corporate speak.
```

---

### USER MESSAGE TEMPLATE — Premier League (Rich Data)

Used when the fixture is a PL match. Injects FPL data: strength ratings, form, key players, injuries, set piece takers, and the user's prediction track record.

```
USER MESSAGE: "${userMessage}"

═══ MATCH DATA (Premier League, Enhanced) ═══

FIXTURE: ${homeTeam} vs ${awayTeam}
Gameweek: ${matchday} | Kickoff: ${matchDate}
FPL Difficulty: ${homeTeam} rates this ${homeFDR}/5 | ${awayTeam} rates this ${awayFDR}/5

── ${HOME_TEAM} ──
Position: ${homePos}/20 (${homePts} pts, ${homeW}W ${homeD}D ${homeL}L)
Goals: ${homeGF} scored, ${homeGA} conceded (GD: ${homeGD})
FPL Strength: Attack ${homeAtkHome} | Defence ${homeDefHome} (at home)
Last 5: ${homeForm} (${homeFormSummary})
Key Players:
  ${playerName} (${position}) | Form: ${form} | ${goals}G ${assists}A | xG: ${xg} xA: ${xa}
  ...
Injuries:
  ${playerName}: ${injuryNews} (${chanceOfPlaying}%)
Set Pieces: ${setPieceTakers}

── ${AWAY_TEAM} ──
[same structure, using away-context strength ratings]

═══ YOUR TRACK RECORD ═══
Total: ${totalPredictions} | Outcome: ${outcomeAccuracy}% | Streak: ${currentStreak}
```

---

### USER MESSAGE TEMPLATE — Non-PL (Standard Data)

Used for all non-Premier League fixtures (La Liga, Bundesliga, Serie A, Ligue 1, Champions League). Uses football-data.org standings and recent form — no player-level detail.

```
USER MESSAGE: "${userMessage}"

═══ MATCH DATA (${competition}) ═══

FIXTURE: ${homeTeam} vs ${awayTeam}
Competition: ${competition} | Matchday: ${matchday} | Kickoff: ${matchDate}

── ${HOME_TEAM} ──
Position: ${homePos}/${totalTeams} (${homePts} pts, ${homeW}W ${homeD}D ${homeL}L)
Goals: ${homeGF} scored, ${homeGA} conceded (GD: ${homeGD})
Last 5: ${homeForm} (${homeFormSummary})
Recent Results:
  H vs ${opponent}: ${goalsFor}-${goalsAgainst} (W/D/L)
  ...

── ${AWAY_TEAM} ──
[same structure]

═══ YOUR TRACK RECORD ═══
Total: ${totalPredictions} | Outcome: ${outcomeAccuracy}% | Streak: ${currentStreak}
```

---

### PREDICTION EXTRACTION

The Gaffer model is instructed to embed a `<<<PREDICTION_JSON>>>` block inline within its analysis response. This eliminates the need for a second LLM call. The Worker extracts the JSON via regex:

```
/<<<PREDICTION_JSON>>>([\s\S]*?)<<<END_PREDICTION_JSON>>>/
```

Extracted fields: `homeTeam`, `awayTeam`, `homeScore`, `awayScore`, `confidence` (`low`/`medium`/`high`), `reasoning` (one-sentence summary). The prediction is then stored in the user's Durable Object and tracked for accuracy resolution.

---

### NO-FIXTURE FALLBACK

Used when the user's message doesn't match any upcoming fixture in the system:

```
USER MESSAGE: "${userMessage}"

(No specific fixture data available. Provide general football analysis. If they're asking about a match you cannot identify, say so and offer general insights based on what you know.)

═══ YOUR TRACK RECORD ═══
Total: ${totalPredictions} | Outcome: ${outcomeAccuracy}% | Streak: ${currentStreak}
```
