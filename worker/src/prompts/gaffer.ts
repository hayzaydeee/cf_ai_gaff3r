// Gaffer system prompt + user message templates
// Includes PREDICTION_JSON structured output instructions

import type { PLMatchContext, StandardMatchContext, AccuracyStats } from '../types/app';

/**
 * The Gaffer's system prompt — sharp, opinionated football analyst.
 */
export const SYSTEM_PROMPT = `You are Gaff3r — a sharp, knowledgeable football analyst with the authority of a seasoned manager. You speak with conviction, back up your calls with data, and aren't afraid to take a position.

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

TONE: Enthusiastic about compelling fixtures. Concise (150-250 words). Conversational. Contractions. No corporate speak.`;

/**
 * Build the user message for a PL match (rich data).
 */
export function buildPLUserMessage(
  context: PLMatchContext,
  userMessage: string,
  accuracy: AccuracyStats | null
): string {
  const { fixture, fplDifficulty, homeTeam, awayTeam } = context;

  const homeKeyPlayers = homeTeam.keyPlayers
    .map(p => `  ${p.name} (${p.position}) | Form: ${p.form} | ${p.goals}G ${p.assists}A | xG: ${p.xG.toFixed(1)} xA: ${p.xA.toFixed(1)}`)
    .join('\n');

  const awayKeyPlayers = awayTeam.keyPlayers
    .map(p => `  ${p.name} (${p.position}) | Form: ${p.form} | ${p.goals}G ${p.assists}A | xG: ${p.xG.toFixed(1)} xA: ${p.xA.toFixed(1)}`)
    .join('\n');

  const homeInjuries = homeTeam.injuries.length > 0
    ? `Injuries:\n${homeTeam.injuries.map(i => `  ${i.player}: ${i.news} (${i.chanceOfPlaying ?? '?'}%)`).join('\n')}`
    : 'No injury concerns.';

  const awayInjuries = awayTeam.injuries.length > 0
    ? `Injuries:\n${awayTeam.injuries.map(i => `  ${i.player}: ${i.news} (${i.chanceOfPlaying ?? '?'}%)`).join('\n')}`
    : 'No injury concerns.';

  const accuracyBlock = accuracy && accuracy.totalPredictions > 0
    ? `Total: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}`
    : 'No predictions yet.';

  return `USER MESSAGE: "${userMessage}"

═══ MATCH DATA (Premier League, Enhanced) ═══

FIXTURE: ${fixture.homeTeam} vs ${fixture.awayTeam}
Gameweek: ${fixture.matchday} | Kickoff: ${fixture.matchDate}
FPL Difficulty: ${fixture.homeTeam} rates this ${fplDifficulty.home}/5 | ${fixture.awayTeam} rates this ${fplDifficulty.away}/5

── ${fixture.homeTeam.toUpperCase()} ──
Position: ${homeTeam.leaguePosition}/20 (${homeTeam.points} pts, ${homeTeam.won}W ${homeTeam.drawn}D ${homeTeam.lost}L)
Goals: ${homeTeam.goalsFor} scored, ${homeTeam.goalsAgainst} conceded (GD: ${homeTeam.goalDifference})
FPL Strength: Attack ${homeTeam.strength.attackHome} | Defence ${homeTeam.strength.defenceHome} (at home)
Last 5: ${homeTeam.form.join(' ')} (${homeTeam.formSummary})
Key Players:
${homeKeyPlayers}
${homeInjuries}
${homeTeam.setPieceTakers ? `Set Pieces: ${homeTeam.setPieceTakers}` : ''}

── ${fixture.awayTeam.toUpperCase()} ──
Position: ${awayTeam.leaguePosition}/20 (${awayTeam.points} pts, ${awayTeam.won}W ${awayTeam.drawn}D ${awayTeam.lost}L)
Goals: ${awayTeam.goalsFor} scored, ${awayTeam.goalsAgainst} conceded (GD: ${awayTeam.goalDifference})
FPL Strength: Attack ${awayTeam.strength.attackAway} | Defence ${awayTeam.strength.defenceAway} (away)
Last 5: ${awayTeam.form.join(' ')} (${awayTeam.formSummary})
Key Players:
${awayKeyPlayers}
${awayInjuries}
${awayTeam.setPieceTakers ? `Set Pieces: ${awayTeam.setPieceTakers}` : ''}

═══ YOUR TRACK RECORD ═══
${accuracyBlock}`;
}

/**
 * Build the user message for a non-PL match (standard data).
 */
export function buildStandardUserMessage(
  context: StandardMatchContext,
  userMessage: string,
  accuracy: AccuracyStats | null
): string {
  const { fixture, homeTeam, awayTeam } = context;

  const accuracyBlock = accuracy && accuracy.totalPredictions > 0
    ? `Total: ${accuracy.totalPredictions} | Outcome: ${accuracy.outcomeAccuracy}% | Streak: ${accuracy.currentStreak}`
    : 'No predictions yet.';

  return `USER MESSAGE: "${userMessage}"

═══ MATCH DATA (${fixture.competition}) ═══

FIXTURE: ${fixture.homeTeam} vs ${fixture.awayTeam}
Competition: ${fixture.competition} | Matchday: ${fixture.matchday ?? 'N/A'} | Kickoff: ${fixture.matchDate}

── ${fixture.homeTeam.toUpperCase()} ──
Position: ${homeTeam.leaguePosition}/${homeTeam.totalTeams} (${homeTeam.points} pts, ${homeTeam.won}W ${homeTeam.drawn}D ${homeTeam.lost}L)
Goals: ${homeTeam.goalsFor} scored, ${homeTeam.goalsAgainst} conceded (GD: ${homeTeam.goalDifference})
Last 5: ${homeTeam.form.join(' ')} (${homeTeam.formSummary})
Recent Results:
${homeTeam.recentResults.map(r => `  ${r.home ? 'H' : 'A'} vs ${r.opponent}: ${r.goalsFor}-${r.goalsAgainst} (${r.result})`).join('\n')}

── ${fixture.awayTeam.toUpperCase()} ──
Position: ${awayTeam.leaguePosition}/${awayTeam.totalTeams} (${awayTeam.points} pts, ${awayTeam.won}W ${awayTeam.drawn}D ${awayTeam.lost}L)
Goals: ${awayTeam.goalsFor} scored, ${awayTeam.goalsAgainst} conceded (GD: ${awayTeam.goalDifference})
Last 5: ${awayTeam.form.join(' ')} (${awayTeam.formSummary})
Recent Results:
${awayTeam.recentResults.map(r => `  ${r.home ? 'H' : 'A'} vs ${r.opponent}: ${r.goalsFor}-${r.goalsAgainst} (${r.result})`).join('\n')}

═══ YOUR TRACK RECORD ═══
${accuracyBlock}`;
}
