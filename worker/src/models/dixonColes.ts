// Dixon-Coles statistical model
// Estimates expected goals (λ, μ) and applies the τ low-score correlation correction.
// Parameter fitting (MLE) runs in the Phase 5 cron job and stores results in D1.
// When no fitted params are available, lambdas are estimated from FPL strength ratings
// or goals-per-game ratios.

import type { PLTeamContext, StandardTeamContext } from '../types/app';

// ── Constants ──

// Premier League average goals per game (home / away) — historical baseline
export const PL_AVG_HOME_GOALS = 1.35;
export const PL_AVG_AWAY_GOALS = 1.10;

// FPL strength midpoint — ratings run roughly 900–1450, midpoint ≈ 1100
const FPL_STRENGTH_MID = 1100;

// Default Dixon-Coles ρ (rho) — fitted value from academic literature
// Negative: low-scoring scorelines (0-0, 1-0, 0-1, 1-1) occur slightly less/more often
// than independent Poisson predicts.
export const DEFAULT_RHO = -0.13;

// Home advantage multiplier applied to λ when using proxy estimation
const HOME_ADVANTAGE = 1.0; // already baked into FPL strength split (attackHome vs attackAway)

// ── Types ──

export interface Lambdas {
  lambda: number; // expected home goals
  mu: number;     // expected away goals
  rho: number;    // correlation parameter
}

// ── Core math ──

/**
 * Dixon-Coles τ (tau) low-score correction.
 * Adjusts the joint probability for scorelines where both teams score ≤ 1.
 * For all other scorelines the correction is 1 (no adjustment).
 *
 * τ(0,0) = 1 − λμρ
 * τ(1,0) = 1 + μρ
 * τ(0,1) = 1 + λρ
 * τ(1,1) = 1 − ρ
 */
export function tauCorrection(h: number, a: number, lambda: number, mu: number, rho: number): number {
  if (h === 0 && a === 0) return 1 - lambda * mu * rho;
  if (h === 1 && a === 0) return 1 + mu * rho;
  if (h === 0 && a === 1) return 1 + lambda * rho;
  if (h === 1 && a === 1) return 1 - rho;
  return 1;
}

/**
 * Poisson probability mass function.
 * Uses log-space arithmetic to avoid underflow for large k.
 */
export function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0;
  // log P(X=k) = -λ + k·log(λ) − log(k!)
  let logProb = -lambda + k * Math.log(lambda);
  for (let i = 2; i <= k; i++) logProb -= Math.log(i);
  return Math.exp(logProb);
}

/**
 * Joint scoreline probability with Dixon-Coles τ correction.
 * P(H=h, A=a) = Poisson(h|λ) · Poisson(a|μ) · τ(h,a,λ,μ,ρ)
 */
export function scorelineProbability(
  h: number,
  a: number,
  lambda: number,
  mu: number,
  rho: number,
): number {
  return poissonPMF(h, lambda) * poissonPMF(a, mu) * tauCorrection(h, a, lambda, mu, rho);
}

// ── Lambda estimation ──

/**
 * Estimate λ/μ from FPL team strength ratings (proxy, no historical data needed).
 *
 * FPL provides four relevant strength values per team:
 *   - attackHome / attackAway
 *   - defenceHome / defenceAway
 *
 * We normalise against the league midpoint and multiply by PL average goals.
 * This gives a reasonable proxy when no fitted Dixon-Coles parameters exist.
 */
export function estimateLambdasFromFPL(
  homeTeam: PLTeamContext,
  awayTeam: PLTeamContext,
): Lambdas {
  // Upstream FPL payloads occasionally omit a strength field; falling back to the
  // league midpoint keeps the ratio at 1.0 instead of poisoning λ/μ with NaN.
  const homeAttack = finiteOr(homeTeam.strength?.attackHome, FPL_STRENGTH_MID) / FPL_STRENGTH_MID;
  const awayDefence = finiteOr(awayTeam.strength?.defenceAway, FPL_STRENGTH_MID) / FPL_STRENGTH_MID;
  const awayAttack = finiteOr(awayTeam.strength?.attackAway, FPL_STRENGTH_MID) / FPL_STRENGTH_MID;
  const homeDefence = finiteOr(homeTeam.strength?.defenceHome, FPL_STRENGTH_MID) / FPL_STRENGTH_MID;

  // Expected goals = (attack strength / avg) × (1 / opponent defence ratio) × avg goals
  // Stronger attack × weaker opponent defence → more goals
  const lambda = clampLambda((homeAttack / awayDefence) * PL_AVG_HOME_GOALS * HOME_ADVANTAGE, PL_AVG_HOME_GOALS);
  const mu = clampLambda((awayAttack / homeDefence) * PL_AVG_AWAY_GOALS, PL_AVG_AWAY_GOALS);

  return { lambda, mu, rho: DEFAULT_RHO };
}

/**
 * Estimate λ/μ from goals/played ratio for non-PL matches (standard context).
 * Adjusts for opponent defensive quality relative to the league average.
 */
export function estimateLambdasFromLeagueStats(
  homeTeam: StandardTeamContext,
  awayTeam: StandardTeamContext,
): Lambdas {
  const homePlayed = Math.max(finiteOr(homeTeam.played, 1), 1);
  const awayPlayed = Math.max(finiteOr(awayTeam.played, 1), 1);

  const homeGoalsPerGame = finiteOr(homeTeam.goalsFor, 0) / homePlayed;
  const awayGoalsPerGame = finiteOr(awayTeam.goalsFor, 0) / awayPlayed;
  const homeConcedePerGame = finiteOr(homeTeam.goalsAgainst, 0) / homePlayed;
  const awayConcedePerGame = finiteOr(awayTeam.goalsAgainst, 0) / awayPlayed;

  // League average goals conceded per game (proxy — use both teams as sample)
  const avgConcede = (homeConcedePerGame + awayConcedePerGame) / 2 || 1.2;

  // λ = home attack rate × (away defensive weakness / avg)
  const lambda = clampLambda(homeGoalsPerGame * (awayConcedePerGame / avgConcede) * 1.05, PL_AVG_HOME_GOALS); // small home boost
  const mu = clampLambda(awayGoalsPerGame * (homeConcedePerGame / avgConcede), PL_AVG_AWAY_GOALS);

  return { lambda, mu, rho: DEFAULT_RHO };
}

// Clamp expected goals to a realistic range.
// Non-finite input (missing upstream stats, division by zero) falls back rather than
// propagating NaN/Infinity — those serialise to `null` over JSON and break the client.
function clampLambda(v: number, fallback: number): number {
  if (!Number.isFinite(v)) return fallback;
  return Math.max(0.3, Math.min(v, 4.0));
}

/** Coerce a possibly missing/NaN numeric field to a usable number. */
export function finiteOr(v: number | null | undefined, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
