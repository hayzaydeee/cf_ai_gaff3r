// Dual-ID team alias map
// Maps common team names → { fplId, fdId }
// fplId = -1 for non-PL teams (relegated sides kept for fixture matching)

export const TEAM_ALIASES: Record<string, { fplId: number; fdId: number }> = {
  // Premier League 2025/26 — fplId values verified against bootstrap-static on 2026-03-29
  "arsenal": { fplId: 1, fdId: 57 }, "gunners": { fplId: 1, fdId: 57 }, "ars": { fplId: 1, fdId: 57 },
  "aston villa": { fplId: 2, fdId: 58 }, "villa": { fplId: 2, fdId: 58 },
  "burnley": { fplId: 3, fdId: 328 }, "burnley fc": { fplId: 3, fdId: 328 }, "clarets": { fplId: 3, fdId: 328 },
  "bournemouth": { fplId: 4, fdId: 1044 }, "afc bournemouth": { fplId: 4, fdId: 1044 },
  "brentford": { fplId: 5, fdId: 402 }, "brentford fc": { fplId: 5, fdId: 402 }, "bees": { fplId: 5, fdId: 402 },
  "brighton": { fplId: 6, fdId: 397 }, "brighton and hove albion": { fplId: 6, fdId: 397 }, "brighton & hove albion": { fplId: 6, fdId: 397 },
  "chelsea": { fplId: 7, fdId: 61 }, "chelsea fc": { fplId: 7, fdId: 61 }, "blues": { fplId: 7, fdId: 61 },
  "crystal palace": { fplId: 8, fdId: 354 }, "crystal palace fc": { fplId: 8, fdId: 354 }, "palace": { fplId: 8, fdId: 354 },
  "everton": { fplId: 9, fdId: 62 }, "everton fc": { fplId: 9, fdId: 62 }, "toffees": { fplId: 9, fdId: 62 },
  "fulham": { fplId: 10, fdId: 63 },
  "leeds": { fplId: 11, fdId: 341 }, "leeds united": { fplId: 11, fdId: 341 }, "lufc": { fplId: 11, fdId: 341 },
  "ipswich": { fplId: -1, fdId: 349 }, "ipswich town": { fplId: -1, fdId: 349 },
  "leicester": { fplId: -1, fdId: 338 }, "leicester city": { fplId: -1, fdId: 338 },
  "liverpool": { fplId: 12, fdId: 64 }, "reds": { fplId: 12, fdId: 64 },
  "manchester city": { fplId: 13, fdId: 65 }, "man city": { fplId: 13, fdId: 65 }, "city": { fplId: 13, fdId: 65 },
  "manchester united": { fplId: 14, fdId: 66 }, "man utd": { fplId: 14, fdId: 66 }, "man united": { fplId: 14, fdId: 66 },
  "newcastle": { fplId: 15, fdId: 67 }, "newcastle united": { fplId: 15, fdId: 67 }, "magpies": { fplId: 15, fdId: 67 },
  "nottingham forest": { fplId: 16, fdId: 351 }, "forest": { fplId: 16, fdId: 351 },
  "sunderland": { fplId: 17, fdId: 343 }, "sunderland afc": { fplId: 17, fdId: 343 }, "black cats": { fplId: 17, fdId: 343 },
  "southampton": { fplId: -1, fdId: 340 }, "southampton fc": { fplId: -1, fdId: 340 }, "saints": { fplId: -1, fdId: 340 },
  "tottenham": { fplId: 18, fdId: 73 }, "spurs": { fplId: 18, fdId: 73 },
  "west ham": { fplId: 19, fdId: 563 }, "west ham united": { fplId: 19, fdId: 563 }, "hammers": { fplId: 19, fdId: 563 },
  "wolves": { fplId: 20, fdId: 76 }, "wolverhampton": { fplId: 20, fdId: 76 },
};

export function getFdIdByFplId(fplId: number): number | undefined {
  if (fplId <= 0) return undefined;

  for (const alias of Object.values(TEAM_ALIASES)) {
    if (alias.fplId === fplId) {
      return alias.fdId;
    }
  }

  return undefined;
}

function normalizeTeamName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getFdIdByTeamName(teamName: string): number | undefined {
  const normalized = normalizeTeamName(teamName);
  const direct = TEAM_ALIASES[normalized];
  if (direct) return direct.fdId;

  const compact = normalized.replace(/\s/g, '');
  for (const [alias, ids] of Object.entries(TEAM_ALIASES)) {
    const aliasCompact = normalizeTeamName(alias).replace(/\s/g, '');
    if (aliasCompact === compact) {
      return ids.fdId;
    }
  }

  return undefined;
}
