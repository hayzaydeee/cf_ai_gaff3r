// Contextual multipliers applied on top of Dixon-Coles base λ/μ
// These are post-hoc adjustments derived from FPL player data:
//   1. Key player absences (chance_of_playing < 75%)
//   2. Recent form divergence vs season average
//   3. FPL fixture difficulty rating nudge
// Returns adjusted { lambda, mu }.

import type { PLTeamContext } from '../types/app';
import type { Lambdas } from './dixonColes';

// ── Constants ──

// Minimum chance_of_playing threshold for "available"
const AVAILABLE_THRESHOLD = 75;

// Max xG share a single player can represent in a team's attack
// Used to cap the penalty when a top scorer is absent
const MAX_XG_SHARE = 0.45;

// Form weights — most recent game weighted highest
// Indexes: [4=oldest, 3, 2, 1, 0=most recent]
const FORM_WEIGHTS = [0.10, 0.15, 0.20, 0.25, 0.30];

// ── Main entry ──

export interface ContextualFactors {
  homeMultiplier: number; // multiply λ by this
  awayMultiplier: number; // multiply μ by this
  notes: string[];        // human-readable description of adjustments for logging
}

/**
 * Compute contextual adjustment multipliers for a PL match.
 * Returns multipliers close to 1.0 when no significant factors exist.
 */
export function computePLAdjustments(
  homeTeam: PLTeamContext,
  awayTeam: PLTeamContext,
  fplDifficultyHome: number, // home team's difficulty rating for this fixture (1-5)
  fplDifficultyAway: number,
): ContextualFactors {
  const notes: string[] = [];

  let homeAttackMultiplier = 1.0;
  let homeDefenceMultiplier = 1.0;
  let awayAttackMultiplier = 1.0;
  let awayDefenceMultiplier = 1.0;

  // 1. Key player absence adjustments
  const homeAbsence = playerAbsenceMultiplier(homeTeam, 'attack');
  const awayAbsence = playerAbsenceMultiplier(awayTeam, 'attack');

  if (homeAbsence < 0.97) {
    homeAttackMultiplier *= homeAbsence;
    notes.push(`Home attack reduced (key players unavailable)`);
  }
  if (awayAbsence < 0.97) {
    awayAttackMultiplier *= awayAbsence;
    notes.push(`Away attack reduced (key players unavailable)`);
  }

  // 2. Recent form vs season average
  const homeFormFactor = formFactor(homeTeam);
  const awayFormFactor = formFactor(awayTeam);

  if (Math.abs(homeFormFactor - 1.0) > 0.03) {
    homeAttackMultiplier *= homeFormFactor;
    notes.push(`Home form ${homeFormFactor > 1 ? 'boost' : 'drag'}: ${homeTeam.formSummary}`);
  }
  if (Math.abs(awayFormFactor - 1.0) > 0.03) {
    awayAttackMultiplier *= awayFormFactor;
    notes.push(`Away form ${awayFormFactor > 1 ? 'boost' : 'drag'}: ${awayTeam.formSummary}`);
  }

  // 3. FPL difficulty nudge (5 = toughest fixture for attacker)
  // Scale: difficulty 1→+5%, 2→+2%, 3→0%, 4→-3%, 5→-6%
  const homeDifficultyMultiplier = difficultyMultiplier(fplDifficultyHome);
  const awayDifficultyMultiplier = difficultyMultiplier(fplDifficultyAway);

  homeAttackMultiplier *= homeDifficultyMultiplier;
  awayAttackMultiplier *= awayDifficultyMultiplier;

  // Combine: λ = base × homeAttack × (1 / awayDefenceMultiplier)
  // μ = base × awayAttack × (1 / homeDefenceMultiplier)
  // For now defence multipliers are symmetrical to the attack multipliers of the other team
  const homeMultiplier = clamp(homeAttackMultiplier / awayDefenceMultiplier, 0.6, 1.5);
  const awayMultiplier = clamp(awayAttackMultiplier / homeDefenceMultiplier, 0.6, 1.5);

  return { homeMultiplier, awayMultiplier, notes };
}

/**
 * Apply contextual multipliers to base lambdas.
 */
export function applyAdjustments(base: Lambdas, factors: ContextualFactors): Lambdas {
  return {
    lambda: parseFloat((base.lambda * factors.homeMultiplier).toFixed(3)),
    mu: parseFloat((base.mu * factors.awayMultiplier).toFixed(3)),
    rho: base.rho,
  };
}

// ── Helpers ──

/**
 * Compute attack penalty from injured / unavailable key players.
 * Returns a multiplier < 1 when important attackers/midfielders are out.
 */
function playerAbsenceMultiplier(
  team: PLTeamContext,
  _focus: 'attack' | 'defence',
): number {
  if (!team.keyPlayers || team.keyPlayers.length === 0) return 1.0;

  // Total xG of the team's tracked key players
  const totalXG = team.keyPlayers.reduce((sum, p) => sum + (p.xG ?? 0), 0);
  if (totalXG <= 0) return 1.0;

  // Sum xG of unavailable attacking/midfield players
  const absentXG = team.keyPlayers
    .filter(p =>
      ['FWD', 'MID'].includes(p.position) &&
      (p.status === 'injured' || p.status === 'suspended')
    )
    .reduce((sum, p) => sum + (p.xG ?? 0), 0);

  const xgShare = Math.min(absentXG / totalXG, MAX_XG_SHARE);
  // Penalty: up to -20% attack when highest-xG player is out
  return 1 - xgShare * 0.45;
}

/**
 * Form factor derived from last-5 results with recency weighting.
 * W=3pts, D=1pt, L=0pt — normalised against average form.
 */
function formFactor(team: PLTeamContext): number {
  if (!team.form || team.form.length === 0) return 1.0;

  const pts: number[] = team.form.slice(-5).map(r => r === 'W' ? 3 : r === 'D' ? 1 : 0);
  const weights = FORM_WEIGHTS.slice(5 - pts.length);

  const weightedPts = pts.reduce((sum, p, i) => sum + p * weights[i], 0);
  const maxWeightedPts = weights.reduce((sum, w) => sum + w * 3, 0);
  const avgPts = weightedPts / maxWeightedPts; // 0–1

  // Map 0–1 → multiplier 0.88–1.12
  return 0.88 + avgPts * 0.24;
}

/**
 * FPL fixture difficulty → attack multiplier.
 * Rating 1 (easy) → small boost; rating 5 (hard) → penalty.
 */
function difficultyMultiplier(difficulty: number): number {
  // difficulty 1→1.05, 2→1.02, 3→1.00, 4→0.97, 5→0.94
  return 1.0 - (difficulty - 3) * 0.03;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, max));
}
