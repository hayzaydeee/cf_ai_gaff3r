// Runtime normalisation for the model payload that rides along with an analysis message.
//
// The worker serialises λ/μ and probabilities as JSON, and JSON turns NaN/Infinity into
// `null`. Older persisted chat history can also carry partially-shaped payloads. Neither
// should reach a component that calls .toFixed() on the value, so everything the UI
// renders passes through here first and unusable sections are dropped rather than faked.

import type { SimResult } from '../types';

export interface Scoreline {
  home: number;
  away: number;
  probability: number;
}

export interface NormalizedSimResult {
  /** null when the model produced no usable expected-goals pair. */
  xg: { lambda: number; mu: number } | null;
  /** null when the outcome split is missing or doesn't add up. */
  outcome: { homeWinPct: number; drawPct: number; awayWinPct: number } | null;
  scorelines: Scoreline[];
  mostLikelyScore: Scoreline | null;
  confidence: SimResult['confidence'] | null;
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function toScoreline(v: unknown): Scoreline | null {
  if (!v || typeof v !== 'object') return null;
  const raw = v as Record<string, unknown>;
  const home = num(raw.home);
  const away = num(raw.away);
  const probability = num(raw.probability);
  if (home === null || away === null || probability === null) return null;
  return { home, away, probability };
}

/**
 * Returns a render-safe view of a sim result, or null when nothing in it is usable.
 */
export function normalizeSimResult(raw: SimResult | null | undefined): NormalizedSimResult | null {
  if (!raw || typeof raw !== 'object') return null;

  const lambda = num(raw.lambda);
  const mu = num(raw.mu);
  const xg = lambda !== null && mu !== null ? { lambda, mu } : null;

  const homeWinPct = num(raw.homeWinPct);
  const drawPct = num(raw.drawPct);
  const awayWinPct = num(raw.awayWinPct);
  const outcome =
    homeWinPct !== null && drawPct !== null && awayWinPct !== null
      ? { homeWinPct, drawPct, awayWinPct }
      : null;

  const scorelines = (Array.isArray(raw.topScorelinesWithPct) ? raw.topScorelinesWithPct : [])
    .map(toScoreline)
    .filter((s): s is Scoreline => s !== null);

  const mostLikelyScore = toScoreline(raw.mostLikelyScore) ?? scorelines[0] ?? null;

  if (!xg && !outcome && scorelines.length === 0) return null;

  const confidence = raw.confidence === 'low' || raw.confidence === 'medium' || raw.confidence === 'high'
    ? raw.confidence
    : null;

  return { xg, outcome, scorelines, mostLikelyScore, confidence };
}
