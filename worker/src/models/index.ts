// Model orchestrator
// Derives λ/μ from available context, applies contextual adjustments,
// runs Monte Carlo simulation, and returns a formatted prompt block.

import type { PLMatchContext, StandardMatchContext } from '../types/app';
import { estimateLambdasFromFPL, estimateLambdasFromLeagueStats } from './dixonColes';
import { simulate } from './monteCarlo';
import { computePLAdjustments, applyAdjustments } from './contextualAdjustments';
import type { SimResult } from './monteCarlo';

export type { SimResult };

/**
 * Run the full statistical model for a PL match.
 * Returns a SimResult or null if estimation is not possible.
 */
export function runPLModel(context: PLMatchContext): SimResult {
  const baseLambdas = estimateLambdasFromFPL(context.homeTeam, context.awayTeam);

  const factors = computePLAdjustments(
    context.homeTeam,
    context.awayTeam,
    context.fplDifficulty.home,
    context.fplDifficulty.away,
  );

  const adjustedLambdas = applyAdjustments(baseLambdas, factors);
  return simulate(adjustedLambdas);
}

/**
 * Run the statistical model for a non-PL match using goals/played ratios.
 */
export function runStandardModel(context: StandardMatchContext): SimResult | null {
  const { homeTeam, awayTeam } = context;
  if (homeTeam.played < 3 || awayTeam.played < 3) {
    return null; // not enough data for a meaningful estimate
  }
  const lambdas = estimateLambdasFromLeagueStats(homeTeam, awayTeam);
  return simulate(lambdas);
}

/**
 * Format a SimResult into a prompt block injected into the LLM system prompt.
 * The LLM is instructed to reference and explain this model output.
 */
export function formatModelBlock(
  result: SimResult,
  homeTeamName: string,
  awayTeamName: string,
): string {
  const { homeWinPct, drawPct, awayWinPct, topScorelinesWithPct, mostLikelyScore, lambda, mu } = result;

  const scorelineLines = topScorelinesWithPct
    .map(s => `  ${homeTeamName} ${s.home}–${s.away} ${awayTeamName}: ${(s.probability * 100).toFixed(1)}%`)
    .join('\n');

  return `
═══ STATISTICAL MODEL OUTPUT (Dixon-Coles + Monte Carlo, 15,000 simulations) ═══
Expected goals: ${homeTeamName} ${lambda} xG | ${awayTeamName} ${mu} xG

Outcome probabilities:
  ${homeTeamName} win: ${homeWinPct}%
  Draw: ${drawPct}%
  ${awayTeamName} win: ${awayWinPct}%

Most likely score: ${homeTeamName} ${mostLikelyScore.home}–${mostLikelyScore.away} ${awayTeamName} (${(mostLikelyScore.probability * 100).toFixed(1)}%)

Top scorelines:
${scorelineLines}

IMPORTANT: Reference and explain these probabilities in your analysis. The model is a starting point — overlay it with your qualitative read of injuries, form, and context. If the model strongly favours one side, that should anchor your prediction unless you have a specific reason to override it.
`.trim();
}
