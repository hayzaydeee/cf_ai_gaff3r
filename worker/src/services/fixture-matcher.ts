// Fixture identification from free-text user messages
// Strategy:
//   1. Normalise message → extract candidate team tokens
//   2. Fuzzy-match tokens against TEAM_ALIASES (exact → prefix → substring)
//   3. Cross-reference matched teams against the upcoming fixture list
//   4. Return the best matching fixture (or null if not found)

import { TEAM_ALIASES } from '../utils/team-aliases';
import type { FixtureItem } from '../types/api';

export interface MatchedFixture {
  fixture: FixtureItem;
  confidence: 'exact' | 'fuzzy';
}

/**
 * Identify a fixture from a natural-language message.
 * Returns the best matching upcoming fixture, or null if none found.
 */
export function identifyFixture(
  message: string,
  upcomingFixtures: FixtureItem[]
): MatchedFixture | null {
  const normalised = message.toLowerCase().trim();

  // Step 1: Extract all team name candidates from the alias map
  const matched = findTeamsInMessage(normalised);
  if (matched.length < 2) {
    // If only one team found, try matching it to a fixture it's in
    if (matched.length === 1) {
      return matchSingleTeam(matched[0], upcomingFixtures);
    }
    return null;
  }

  // Step 2: Try to find a fixture containing any pair of the matched teams
  const result = matchTeamPairToFixture(matched, upcomingFixtures);
  if (result) return result;

  // Step 3: Single-team fallback for the strongest match
  return matchSingleTeam(matched[0], upcomingFixtures);
}

/**
 * Find all team aliases present in the message text.
 * Returns fplId/fdId refs for each matched team, ordered by match precision.
 */
function findTeamsInMessage(
  message: string
): Array<{ fplId: number; fdId: number; name: string }> {
  const results: Array<{ fplId: number; fdId: number; name: string; priority: number }> = [];
  const seen = new Set<string>(); // key: "fplId:fdId"

  // Sort alias keys longest-first so "manchester city" beats "city"
  const sortedKeys = Object.keys(TEAM_ALIASES).sort((a, b) => b.length - a.length);

  for (const alias of sortedKeys) {
    const entry = TEAM_ALIASES[alias];
    const dedupeKey = `${entry.fplId}:${entry.fdId}`;
    if (seen.has(dedupeKey)) continue;

    // Exact word-boundary match (highest priority)
    const exactRegex = new RegExp(`\\b${escapeRegex(alias)}\\b`);
    if (exactRegex.test(message)) {
      results.push({ ...entry, name: alias, priority: 0 });
      seen.add(dedupeKey);
      continue;
    }

    // Substring match (lower priority)
    if (message.includes(alias)) {
      results.push({ ...entry, name: alias, priority: 1 });
      seen.add(dedupeKey);
    }
  }

  // Exact matches first, then longer aliases first
  return results
    .sort((a, b) => a.priority - b.priority)
    .map(({ fplId, fdId, name }) => ({ fplId, fdId, name }));
}

/**
 * Check if a fixture's home or away team matches a team entry.
 */
function fixtureMatchesTeam(
  fixture: FixtureItem,
  team: { fplId: number; fdId: number }
): boolean {
  if (team.fplId !== -1) {
    // PL team — match by FPL ID
    return fixture.homeTeamId === team.fplId || fixture.awayTeamId === team.fplId;
  } else {
    // Non-PL — match by football-data ID
    return fixture.homeTeamId === team.fdId || fixture.awayTeamId === team.fdId;
  }
}

/**
 * Given two or more matched teams, find a fixture where both are playing.
 */
function matchTeamPairToFixture(
  teams: Array<{ fplId: number; fdId: number; name: string }>,
  fixtures: FixtureItem[]
): MatchedFixture | null {
  // Try every pair of matched teams
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const teamA = teams[i];
      const teamB = teams[j];

      const fixture = fixtures.find(
        f => fixtureMatchesTeam(f, teamA) && fixtureMatchesTeam(f, teamB)
      );

      if (fixture) {
        return { fixture, confidence: 'exact' };
      }
    }
  }
  return null;
}

/**
 * Fallback: if only one team was found, return the soonest upcoming fixture for that team.
 */
function matchSingleTeam(
  team: { fplId: number; fdId: number; name: string },
  fixtures: FixtureItem[]
): MatchedFixture | null {
  const fixture = fixtures.find(f => fixtureMatchesTeam(f, team));
  if (!fixture) return null;
  return { fixture, confidence: 'fuzzy' };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
