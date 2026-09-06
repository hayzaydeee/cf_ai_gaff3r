// Monte Carlo match simulation
// Runs N iterations of a Dixon-Coles corrected Poisson model to produce:
//   - Win / draw / loss probabilities
//   - Top scorelines with individual probabilities
//   - Confidence level derived from separation between outcome probabilities

import { tauCorrection, scorelineProbability, finiteOr, DEFAULT_RHO, PL_AVG_HOME_GOALS, PL_AVG_AWAY_GOALS } from './dixonColes';
import type { Lambdas } from './dixonColes';

// ── Types ──

export interface ScorelineResult {
  home: number;
  away: number;
  probability: number; // 0–1
}

export interface SimResult {
  lambda: number;
  mu: number;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  topScorelinesWithPct: ScorelineResult[];
  mostLikelyScore: ScorelineResult;
  confidence: 'low' | 'medium' | 'high';
}

// ── Poisson variate ──

/**
 * Generate a Poisson random variate with mean `lambda`.
 * Uses the Knuth algorithm (inverse CDF via geometric trial).
 * Accurate for λ ≤ ~30; more than sufficient for football (λ ≤ 4).
 */
function poissonVariate(lambda: number): number {
  const L = Math.exp(-lambda);
  let p = 1;
  let k = 0;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// ── Accept/reject for DC-corrected low-score outcomes ──

/**
 * For scorelines where h+a ≤ 2 (the low-score region Dixon-Coles corrects),
 * use accept/reject sampling so the simulated frequency matches the corrected probability.
 *
 * Returns true if the sample should be accepted (kept).
 */
function acceptDCCorrection(h: number, a: number, lambda: number, mu: number, rho: number): boolean {
  if (h > 1 || a > 1) return true; // no correction needed outside 0-0, 1-0, 0-1, 1-1
  const tau = tauCorrection(h, a, lambda, mu, rho);
  // τ is close to 1; sample uniform [0, maxTau] and accept if u < τ
  // maxTau ≈ 1.3 covers all realistic rho values
  return Math.random() < (tau / 1.3);
}

// ── Main simulation ──

/**
 * Run a Monte Carlo simulation for a match with given expected goals.
 * Returns win/draw/loss percentages, top scorelines, and confidence.
 *
 * @param lambdas  λ (home), μ (away), ρ (correlation)
 * @param iterations  Number of simulated matches (default 15,000)
 */
export function simulate(lambdas: Lambdas, iterations = 15_000): SimResult {
  // Last gate before the result is serialised to the client: NaN/Infinity would
  // become `null` in JSON and blow up any consumer doing arithmetic on λ/μ.
  const lambda = finiteOr(lambdas?.lambda, PL_AVG_HOME_GOALS);
  const mu = finiteOr(lambdas?.mu, PL_AVG_AWAY_GOALS);
  const rho = finiteOr(lambdas?.rho, DEFAULT_RHO);

  let homeWins = 0;
  let draws = 0;
  let awayWins = 0;
  const scorelineCounts = new Map<string, number>();
  let accepted = 0;
  let attempts = 0;
  const maxAttempts = iterations * 5; // safety limit

  // We need exactly `iterations` accepted samples
  while (accepted < iterations && attempts < maxAttempts) {
    attempts++;
    const h = poissonVariate(lambda);
    const a = poissonVariate(mu);

    if (!acceptDCCorrection(h, a, lambda, mu, rho)) continue;
    accepted++;

    if (h > a) homeWins++;
    else if (h < a) awayWins++;
    else draws++;

    const key = `${h}-${a}`;
    scorelineCounts.set(key, (scorelineCounts.get(key) ?? 0) + 1);
  }

  const total = accepted || 1;

  const homeWinPct = Math.round((homeWins / total) * 100);
  const drawPct = Math.round((draws / total) * 100);
  const awayWinPct = 100 - homeWinPct - drawPct;

  // Top 6 scorelines by frequency
  const topScorelinesWithPct: ScorelineResult[] = [...scorelineCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([key, count]) => {
      const [h, a] = key.split('-').map(Number);
      return {
        home: h,
        away: a,
        probability: parseFloat((count / total).toFixed(3)),
      };
    });

  const mostLikelyScore = topScorelinesWithPct[0] ?? { home: 1, away: 1, probability: 0 };

  // Confidence: high if winning team has >55% or draw>40%; low if split is tight
  const maxOutcome = Math.max(homeWinPct, drawPct, awayWinPct);
  const confidence: 'low' | 'medium' | 'high' =
    maxOutcome >= 55 ? 'high' :
    maxOutcome >= 42 ? 'medium' : 'low';

  return {
    lambda: parseFloat(lambda.toFixed(2)),
    mu: parseFloat(mu.toFixed(2)),
    homeWinPct,
    drawPct,
    awayWinPct,
    topScorelinesWithPct,
    mostLikelyScore,
    confidence,
  };
}

// ── Analytical scoreline probabilities (alternative to MC for formatting) ──

/**
 * Compute scoreline probabilities analytically (no simulation needed).
 * Used for the "top scorelines" block when MC hasn't run yet.
 * Covers 0-0 through 5-5 scorelines.
 */
export function analyticalTopScorelinesWithPct(
  lambda: number,
  mu: number,
  rho: number,
  topN = 6,
): ScorelineResult[] {
  const MAX_GOALS = 6;
  const results: ScorelineResult[] = [];

  for (let h = 0; h < MAX_GOALS; h++) {
    for (let a = 0; a < MAX_GOALS; a++) {
      results.push({
        home: h,
        away: a,
        probability: parseFloat(scorelineProbability(h, a, lambda, mu, rho).toFixed(3)),
      });
    }
  }

  return results.sort((a, b) => b.probability - a.probability).slice(0, topN);
}
