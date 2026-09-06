import { describe, it, expect } from 'vitest';
import { normalizeSimResult } from './simResult';
import type { SimResult } from '../types';

const valid: SimResult = {
  lambda: 1.62,
  mu: 1.04,
  homeWinPct: 52,
  drawPct: 24,
  awayWinPct: 24,
  topScorelinesWithPct: [
    { home: 2, away: 1, probability: 0.11 },
    { home: 1, away: 1, probability: 0.1 },
  ],
  mostLikelyScore: { home: 2, away: 1, probability: 0.11 },
  confidence: 'medium',
};

describe('normalizeSimResult', () => {
  it('passes a well-formed payload through', () => {
    const sim = normalizeSimResult(valid);
    expect(sim?.xg).toEqual({ lambda: 1.62, mu: 1.04 });
    expect(sim?.outcome).toEqual({ homeWinPct: 52, drawPct: 24, awayWinPct: 24 });
    expect(sim?.scorelines).toHaveLength(2);
    expect(sim?.mostLikelyScore).toEqual({ home: 2, away: 1, probability: 0.11 });
  });

  it('drops the xG section when λ/μ arrive as null (NaN over JSON)', () => {
    const raw = { ...valid, lambda: null, mu: null } as unknown as SimResult;
    const sim = normalizeSimResult(raw);
    expect(sim).not.toBeNull();
    expect(sim?.xg).toBeNull();
    expect(sim?.outcome).not.toBeNull();
  });

  it('drops the outcome section when a percentage is missing', () => {
    const raw = { ...valid, drawPct: undefined } as unknown as SimResult;
    expect(normalizeSimResult(raw)?.outcome).toBeNull();
  });

  it('filters malformed scorelines and falls back for mostLikelyScore', () => {
    const raw = {
      ...valid,
      topScorelinesWithPct: [
        { home: 2, away: 1, probability: 0.11 },
        { home: null, away: 1, probability: 0.1 },
        'nonsense',
      ],
      mostLikelyScore: null,
    } as unknown as SimResult;
    const sim = normalizeSimResult(raw);
    expect(sim?.scorelines).toEqual([{ home: 2, away: 1, probability: 0.11 }]);
    expect(sim?.mostLikelyScore).toEqual({ home: 2, away: 1, probability: 0.11 });
  });

  it('returns null when nothing is renderable', () => {
    expect(normalizeSimResult(undefined)).toBeNull();
    expect(normalizeSimResult(null)).toBeNull();
    expect(normalizeSimResult({} as SimResult)).toBeNull();
    expect(
      normalizeSimResult({
        lambda: null, mu: null, homeWinPct: null, drawPct: null, awayWinPct: null,
        topScorelinesWithPct: [], mostLikelyScore: null, confidence: null,
      } as unknown as SimResult),
    ).toBeNull();
  });

  it('rejects NaN/Infinity as well as null', () => {
    const raw = { ...valid, lambda: NaN, mu: Infinity } as unknown as SimResult;
    expect(normalizeSimResult(raw)?.xg).toBeNull();
  });
});
