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