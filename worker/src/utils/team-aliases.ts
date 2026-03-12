// Dual-ID team alias map
// Maps common team names → { fplId, fdId }
// fplId = -1 for non-PL teams
// TODO: Phase 1 implementation

export const TEAM_ALIASES: Record<string, { fplId: number; fdId: number }> = {
  // Premier League (both IDs)
  "arsenal": { fplId: 1, fdId: 57 }, "gunners": { fplId: 1, fdId: 57 }, "ars": { fplId: 1, fdId: 57 },
  "aston villa": { fplId: 2, fdId: 58 }, "villa": { fplId: 2, fdId: 58 },
  "bournemouth": { fplId: 3, fdId: 1044 },
  "brentford": { fplId: 4, fdId: 402 }, "bees": { fplId: 4, fdId: 402 },
  "brighton": { fplId: 5, fdId: 397 },
  "chelsea": { fplId: 6, fdId: 61 }, "blues": { fplId: 6, fdId: 61 },
  "crystal palace": { fplId: 7, fdId: 354 }, "palace": { fplId: 7, fdId: 354 },
  "everton": { fplId: 8, fdId: 62 }, "toffees": { fplId: 8, fdId: 62 },
  "fulham": { fplId: 9, fdId: 63 },
  "ipswich": { fplId: 10, fdId: 349 }, "ipswich town": { fplId: 10, fdId: 349 },
  "leicester": { fplId: 11, fdId: 338 }, "leicester city": { fplId: 11, fdId: 338 },
  "liverpool": { fplId: 12, fdId: 64 }, "reds": { fplId: 12, fdId: 64 },
  "manchester city": { fplId: 13, fdId: 65 }, "man city": { fplId: 13, fdId: 65 }, "city": { fplId: 13, fdId: 65 },
  "manchester united": { fplId: 14, fdId: 66 }, "man utd": { fplId: 14, fdId: 66 }, "man united": { fplId: 14, fdId: 66 },
  "newcastle": { fplId: 15, fdId: 67 }, "newcastle united": { fplId: 15, fdId: 67 }, "magpies": { fplId: 15, fdId: 67 },
  "nottingham forest": { fplId: 16, fdId: 351 }, "forest": { fplId: 16, fdId: 351 },
  "southampton": { fplId: 17, fdId: 340 }, "saints": { fplId: 17, fdId: 340 },
  "tottenham": { fplId: 18, fdId: 73 }, "spurs": { fplId: 18, fdId: 73 },
  "west ham": { fplId: 19, fdId: 563 }, "west ham united": { fplId: 19, fdId: 563 }, "hammers": { fplId: 19, fdId: 563 },
  "wolves": { fplId: 20, fdId: 76 }, "wolverhampton": { fplId: 20, fdId: 76 },

  // La Liga (fplId = -1)
  "barcelona": { fplId: -1, fdId: 81 }, "barca": { fplId: -1, fdId: 81 },
  "real madrid": { fplId: -1, fdId: 86 },
  "atletico madrid": { fplId: -1, fdId: 78 }, "atletico": { fplId: -1, fdId: 78 },
  "real sociedad": { fplId: -1, fdId: 90 }, "sociedad": { fplId: -1, fdId: 90 },
  "athletic bilbao": { fplId: -1, fdId: 77 }, "bilbao": { fplId: -1, fdId: 77 },
  "villarreal": { fplId: -1, fdId: 94 },
  "betis": { fplId: -1, fdId: 90 }, "real betis": { fplId: -1, fdId: 90 },
  "sevilla": { fplId: -1, fdId: 559 },

  // Bundesliga (fplId = -1)
  "bayern munich": { fplId: -1, fdId: 5 }, "bayern": { fplId: -1, fdId: 5 },
  "borussia dortmund": { fplId: -1, fdId: 4 }, "dortmund": { fplId: -1, fdId: 4 }, "bvb": { fplId: -1, fdId: 4 },
  "rb leipzig": { fplId: -1, fdId: 721 }, "leipzig": { fplId: -1, fdId: 721 },
  "bayer leverkusen": { fplId: -1, fdId: 3 }, "leverkusen": { fplId: -1, fdId: 3 },

  // Serie A (fplId = -1)
  "inter milan": { fplId: -1, fdId: 108 }, "inter": { fplId: -1, fdId: 108 },
  "ac milan": { fplId: -1, fdId: 98 }, "milan": { fplId: -1, fdId: 98 },
  "juventus": { fplId: -1, fdId: 109 }, "juve": { fplId: -1, fdId: 109 },
  "napoli": { fplId: -1, fdId: 113 },
  "roma": { fplId: -1, fdId: 100 }, "as roma": { fplId: -1, fdId: 100 },
  "atalanta": { fplId: -1, fdId: 102 },
  "lazio": { fplId: -1, fdId: 110 },

  // Ligue 1 (fplId = -1)
  "psg": { fplId: -1, fdId: 524 }, "paris saint-germain": { fplId: -1, fdId: 524 },
  "marseille": { fplId: -1, fdId: 516 }, "om": { fplId: -1, fdId: 516 },
  "lyon": { fplId: -1, fdId: 523 },
  "monaco": { fplId: -1, fdId: 548 },
  "lille": { fplId: -1, fdId: 521 },
};
