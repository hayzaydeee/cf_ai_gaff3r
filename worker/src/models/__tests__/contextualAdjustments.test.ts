import { describe, it, expect } from 'vitest';
import { computePLAdjustments, applyAdjustments } from '../contextualAdjustments';
import type { PLTeamContext } from '../../types/app';
import type { Lambdas } from '../dixonColes';

const team = (overrides: Partial<PLTeamContext> = {}): PLTeamContext => ({
  strength: { attackHome: 1200, attackAway: 1100, defenceHome: 1150, defenceAway: 1100 },
  form: ['W', 'D', 'W', 'L', 'W'],
  formSummary: 'WDWLW',
  keyPlayers: [],
  ...overrides,
} as PLTeamContext);

const base: Lambdas = { lambda: 1.5, mu: 1.1, rho: -0.13 };

describe('computePLAdjustments', () => {
  it('produces finite multipliers for a normal fixture', () => {
    const { homeMultiplier, awayMultiplier } = computePLAdjustments(team(), team(), 3, 3);
    expect(Number.isFinite(homeMultiplier)).toBe(true);
    expect(Number.isFinite(awayMultiplier)).toBe(true);
  });

  it('treats a missing FPL difficulty rating as neutral instead of producing NaN', () => {
    const factors = computePLAdjustments(
      team(), team(),
      undefined as unknown as number,
      undefined as unknown as number,
    );
    expect(Number.isFinite(factors.homeMultiplier)).toBe(true);
    expect(Number.isFinite(factors.awayMultiplier)).toBe(true);

    const adjusted = applyAdjustments(base, factors);
    expect(Number.isFinite(adjusted.lambda)).toBe(true);
    expect(Number.isFinite(adjusted.mu)).toBe(true);
  });

  it('applyAdjustments keeps the base lambdas when multipliers are non-finite', () => {
    const adjusted = applyAdjustments(base, { homeMultiplier: NaN, awayMultiplier: NaN, notes: [] });
    expect(adjusted.lambda).toBe(base.lambda);
    expect(adjusted.mu).toBe(base.mu);
  });
});
