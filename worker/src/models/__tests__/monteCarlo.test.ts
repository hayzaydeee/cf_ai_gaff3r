import { describe, it, expect } from 'vitest';
import { simulate, analyticalTopScorelinesWithPct } from '../monteCarlo';
import type { Lambdas } from '../dixonColes';

const ITERATIONS = 15_000;

// ── simulate ──

describe('simulate', () => {
  const balanced: Lambdas = { lambda: 1.35, mu: 1.10, rho: -0.13 };
  const dominantHome: Lambdas = { lambda: 2.8, mu: 0.6, rho: -0.13 };
  const dominantAway: Lambdas = { lambda: 0.5, mu: 2.5, rho: -0.13 };

  it('returns expected shape', () => {
    const result = simulate(balanced, ITERATIONS);
    expect(result).toHaveProperty('lambda');
    expect(result).toHaveProperty('mu');
    expect(result).toHaveProperty('homeWinPct');
    expect(result).toHaveProperty('drawPct');
    expect(result).toHaveProperty('awayWinPct');
    expect(result).toHaveProperty('topScorelinesWithPct');
    expect(result).toHaveProperty('mostLikelyScore');
    expect(result).toHaveProperty('confidence');
  });

  it('outcome percentages sum to 100', () => {
    const { homeWinPct, drawPct, awayWinPct } = simulate(balanced, ITERATIONS);
    expect(homeWinPct + drawPct + awayWinPct).toBe(100);
  });

  it('dominant home side has homeWinPct > 60%', () => {
    const { homeWinPct } = simulate(dominantHome, ITERATIONS);
    expect(homeWinPct).toBeGreaterThan(60);
  });

  it('dominant away side has awayWinPct > 60%', () => {
    const { awayWinPct } = simulate(dominantAway, ITERATIONS);
    expect(awayWinPct).toBeGreaterThan(60);
  });

  it('returns top 6 scorelines', () => {
    const { topScorelinesWithPct } = simulate(balanced, ITERATIONS);
    expect(topScorelinesWithPct.length).toBeGreaterThan(0);
    expect(topScorelinesWithPct.length).toBeLessThanOrEqual(6);
  });

  it('all scoreline probabilities are between 0 and 1', () => {
    const { topScorelinesWithPct } = simulate(balanced, ITERATIONS);
    for (const s of topScorelinesWithPct) {
      expect(s.probability).toBeGreaterThan(0);
      expect(s.probability).toBeLessThanOrEqual(1);
    }
  });

  it('confidence is one of low | medium | high', () => {
    const { confidence } = simulate(balanced, ITERATIONS);
    expect(['low', 'medium', 'high']).toContain(confidence);
  });

  it('highly dominant side produces high confidence', () => {
    const { confidence } = simulate(dominantHome, ITERATIONS);
    expect(confidence).toBe('high');
  });

  it('completes 15,000 iterations in under 500ms', () => {
    const start = Date.now();
    simulate(balanced, ITERATIONS);
    expect(Date.now() - start).toBeLessThan(500);
  });

  it('mostLikelyScore is the first topScorelinesWithPct entry', () => {
    const result = simulate(balanced, ITERATIONS);
    expect(result.mostLikelyScore).toEqual(result.topScorelinesWithPct[0]);
  });
});

// ── analyticalTopScorelinesWithPct ──

describe('analyticalTopScorelinesWithPct', () => {
  const λ = 1.35;
  const μ = 1.10;
  const ρ = -0.13;

  it('returns topN results sorted by probability descending', () => {
    const results = analyticalTopScorelinesWithPct(λ, μ, ρ, 6);
    expect(results.length).toBe(6);
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].probability).toBeGreaterThanOrEqual(results[i].probability);
    }
  });

  it('all probabilities are in (0, 1]', () => {
    const results = analyticalTopScorelinesWithPct(λ, μ, ρ, 6);
    for (const r of results) {
      expect(r.probability).toBeGreaterThan(0);
      expect(r.probability).toBeLessThanOrEqual(1);
    }
  });

  it('1-0 or 1-1 appears in top 3 for typical PL parameters', () => {
    const results = analyticalTopScorelinesWithPct(λ, μ, ρ, 3);
    const keys = results.map(r => `${r.home}-${r.away}`);
    const hasCommonScore = keys.some(k => ['1-0', '0-0', '1-1', '0-1'].includes(k));
    expect(hasCommonScore).toBe(true);
  });
});

// ── Serialisation safety ──
// NaN/Infinity survive in-process but become `null` in JSON, which crashes any client
// doing arithmetic on λ/μ. simulate() is the last gate before the payload is sent.
describe('simulate — non-finite input', () => {
  const cases: Record<string, unknown> = {
    NaN: { lambda: NaN, mu: NaN, rho: -0.13 },
    Infinity: { lambda: Infinity, mu: -Infinity, rho: -0.13 },
    missing: {},
  };

  for (const [name, lambdas] of Object.entries(cases)) {
    it(`falls back to league averages for ${name} lambdas`, () => {
      const result = simulate(lambdas as Lambdas, 2_000);
      expect(Number.isFinite(result.lambda)).toBe(true);
      expect(Number.isFinite(result.mu)).toBe(true);
      expect(JSON.parse(JSON.stringify(result)).lambda).not.toBeNull();
      expect(result.homeWinPct + result.drawPct + result.awayWinPct).toBe(100);
    });
  }
});
