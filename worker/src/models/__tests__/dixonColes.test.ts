import { describe, it, expect } from 'vitest';
import {
  tauCorrection,
  poissonPMF,
  scorelineProbability,
  estimateLambdasFromFPL,
  estimateLambdasFromLeagueStats,
  PL_AVG_HOME_GOALS,
  PL_AVG_AWAY_GOALS,
  DEFAULT_RHO,
} from '../dixonColes';
import type { PLTeamContext, StandardTeamContext } from '../../types/app';

// ── τ correction ──

describe('tauCorrection', () => {
  const λ = 1.35;
  const μ = 1.10;
  const ρ = DEFAULT_RHO; // -0.13

  it('τ(0,0) = 1 − λμρ', () => {
    expect(tauCorrection(0, 0, λ, μ, ρ)).toBeCloseTo(1 - λ * μ * ρ, 8);
  });

  it('τ(1,0) = 1 + μρ', () => {
    expect(tauCorrection(1, 0, λ, μ, ρ)).toBeCloseTo(1 + μ * ρ, 8);
  });

  it('τ(0,1) = 1 + λρ', () => {
    expect(tauCorrection(0, 1, λ, μ, ρ)).toBeCloseTo(1 + λ * ρ, 8);
  });

  it('τ(1,1) = 1 − ρ', () => {
    expect(tauCorrection(1, 1, λ, μ, ρ)).toBeCloseTo(1 - ρ, 8);
  });

  it('returns 1 for all other scorelines', () => {
    expect(tauCorrection(2, 0, λ, μ, ρ)).toBe(1);
    expect(tauCorrection(0, 2, λ, μ, ρ)).toBe(1);
    expect(tauCorrection(3, 2, λ, μ, ρ)).toBe(1);
    expect(tauCorrection(2, 2, λ, μ, ρ)).toBe(1);
  });
});

// ── Poisson PMF ──

describe('poissonPMF', () => {
  it('P(0 | λ=1) = e^−1 ≈ 0.3679', () => {
    expect(poissonPMF(0, 1)).toBeCloseTo(Math.exp(-1), 5);
  });

  it('P(1 | λ=1) = e^−1 ≈ 0.3679', () => {
    expect(poissonPMF(1, 1)).toBeCloseTo(Math.exp(-1), 5);
  });

  it('P(2 | λ=2) = 2e^−2 ≈ 0.2707', () => {
    expect(poissonPMF(2, 2)).toBeCloseTo(2 * Math.exp(-2), 5);
  });

  it('P(0 | λ=0) = 1', () => {
    expect(poissonPMF(0, 0)).toBe(1);
  });

  it('P(k>0 | λ=0) = 0', () => {
    expect(poissonPMF(1, 0)).toBe(0);
    expect(poissonPMF(5, 0)).toBe(0);
  });

  it('probabilities sum to ~1 over 0..15 for λ=1.5', () => {
    let sum = 0;
    for (let k = 0; k <= 15; k++) sum += poissonPMF(k, 1.5);
    expect(sum).toBeCloseTo(1, 3);
  });
});

// ── scorelineProbability ──

describe('scorelineProbability', () => {
  const λ = 1.35;
  const μ = 1.10;
  const ρ = DEFAULT_RHO;

  it('returns a value between 0 and 1', () => {
    for (let h = 0; h < 5; h++) {
      for (let a = 0; a < 5; a++) {
        const p = scorelineProbability(h, a, λ, μ, ρ);
        expect(p).toBeGreaterThanOrEqual(0);
        expect(p).toBeLessThanOrEqual(1);
      }
    }
  });

  it('probability matrix (0..5 × 0..5) sums to approximately 1', () => {
    let total = 0;
    for (let h = 0; h < 6; h++) {
      for (let a = 0; a < 6; a++) {
        total += scorelineProbability(h, a, λ, μ, ρ);
      }
    }
    // Truncation at 5 goals means sum slightly < 1; expect > 0.97
    expect(total).toBeGreaterThan(0.97);
    expect(total).toBeLessThanOrEqual(1.02);
  });

  it('1-0 is more likely than 0-1 when λ > μ', () => {
    const p10 = scorelineProbability(1, 0, λ, μ, ρ);
    const p01 = scorelineProbability(0, 1, λ, μ, ρ);
    expect(p10).toBeGreaterThan(p01);
  });
});

// ── estimateLambdasFromFPL ──

describe('estimateLambdasFromFPL', () => {
  const strongHome: PLTeamContext = {
    strength: { attackHome: 1320, attackAway: 1250, defenceHome: 1200, defenceAway: 1180 },
    form: [],
    keyPlayers: [],
    injuries: [],
  } as unknown as PLTeamContext;

  const weakAway: PLTeamContext = {
    strength: { attackHome: 900, attackAway: 880, defenceHome: 860, defenceAway: 840 },
    form: [],
    keyPlayers: [],
    injuries: [],
  } as unknown as PLTeamContext;

  it('returns λ, μ, ρ', () => {
    const { lambda, mu, rho } = estimateLambdasFromFPL(strongHome, weakAway);
    expect(typeof lambda).toBe('number');
    expect(typeof mu).toBe('number');
    expect(rho).toBe(DEFAULT_RHO);
  });

  it('clamps λ/μ to [0.3, 4.0]', () => {
    const { lambda, mu } = estimateLambdasFromFPL(strongHome, weakAway);
    expect(lambda).toBeGreaterThanOrEqual(0.3);
    expect(lambda).toBeLessThanOrEqual(4.0);
    expect(mu).toBeGreaterThanOrEqual(0.3);
    expect(mu).toBeLessThanOrEqual(4.0);
  });

  it('stronger home attack vs weaker away defence → λ > PL average', () => {
    const { lambda } = estimateLambdasFromFPL(strongHome, weakAway);
    expect(lambda).toBeGreaterThan(PL_AVG_HOME_GOALS);
  });
});

// ── estimateLambdasFromLeagueStats ──

describe('estimateLambdasFromLeagueStats', () => {
  const homeTeam: StandardTeamContext = {
    goalsFor: 30, goalsAgainst: 15, played: 15,
  } as unknown as StandardTeamContext;

  const awayTeam: StandardTeamContext = {
    goalsFor: 12, goalsAgainst: 24, played: 15,
  } as unknown as StandardTeamContext;

  it('returns λ, μ, ρ', () => {
    const { lambda, mu, rho } = estimateLambdasFromLeagueStats(homeTeam, awayTeam);
    expect(typeof lambda).toBe('number');
    expect(typeof mu).toBe('number');
    expect(rho).toBe(DEFAULT_RHO);
  });

  it('high-scoring home vs leaky away → λ > μ', () => {
    const { lambda, mu } = estimateLambdasFromLeagueStats(homeTeam, awayTeam);
    expect(lambda).toBeGreaterThan(mu);
  });

  it('handles played=0 without throwing', () => {
    const zeroPlayed: StandardTeamContext = { goalsFor: 0, goalsAgainst: 0, played: 0 } as unknown as StandardTeamContext;
    expect(() => estimateLambdasFromLeagueStats(zeroPlayed, zeroPlayed)).not.toThrow();
  });
});
