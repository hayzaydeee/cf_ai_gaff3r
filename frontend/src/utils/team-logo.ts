export interface TeamLogoRef {
  fplTeamId?: number;
  fplName?: string;
  fplShortName?: string;
  fdTeamId?: number;
  fdName?: string;
  fdShortName?: string;
}

const AVAILABLE_SLUGS = new Set([
  'arsenal',
  'astonvilla',
  'bournemouth',
  'brentford',
  'brighton',
  'burnley',
  'chelsea',
  'crystalpalace',
  'everton',
  'fulham',
  'leeds',
  'liverpool',
  'mancity',
  'manutd',
  'newcastle',
  'nottinghamforest',
  'southampton',
  'spurs',
  'westham',
  'wolves',
]);

const FPL_ID_TO_SLUG: Record<number, string> = {
  1: 'arsenal',
  2: 'astonvilla',
  3: 'bournemouth',
  4: 'brentford',
  5: 'brighton',
  6: 'chelsea',
  7: 'crystalpalace',
  8: 'everton',
  9: 'fulham',
  12: 'liverpool',
  13: 'mancity',
  14: 'manutd',
  15: 'newcastle',
  16: 'nottinghamforest',
  17: 'southampton',
  18: 'spurs',
  19: 'westham',
  20: 'wolves',
};

const FD_ID_TO_SLUG: Record<number, string> = {
  57: 'arsenal',
  58: 'astonvilla',
  1044: 'bournemouth',
  402: 'brentford',
  397: 'brighton',
  328: 'burnley',
  61: 'chelsea',
  354: 'crystalpalace',
  62: 'everton',
  63: 'fulham',
  341: 'leeds',
  64: 'liverpool',
  65: 'mancity',
  66: 'manutd',
  67: 'newcastle',
  351: 'nottinghamforest',
  340: 'southampton',
  73: 'spurs',
  563: 'westham',
  76: 'wolves',
};

const NAME_TO_SLUG: Record<string, string> = {
  arsenal: 'arsenal',
  avfc: 'astonvilla',
  'aston villa': 'astonvilla',
  bournemouth: 'bournemouth',
  brentford: 'brentford',
  brighton: 'brighton',
  burnley: 'burnley',
  che: 'chelsea',
  chelsea: 'chelsea',
  cp: 'crystalpalace',
  'crystal palace': 'crystalpalace',
  everton: 'everton',
  fulham: 'fulham',
  leeds: 'leeds',
  'leeds united': 'leeds',
  liv: 'liverpool',
  liverpool: 'liverpool',
  'man city': 'mancity',
  manchestercity: 'mancity',
  'manchester city': 'mancity',
  mci: 'mancity',
  mcfc: 'mancity',
  'man utd': 'manutd',
  'man united': 'manutd',
  manchesterunited: 'manutd',
  'manchester united': 'manutd',
  mun: 'manutd',
  mufc: 'manutd',
  newcastle: 'newcastle',
  'newcastle united': 'newcastle',
  nufc: 'newcastle',
  'nottingham forest': 'nottinghamforest',
  'nottm forest': 'nottinghamforest',
  forest: 'nottinghamforest',
  southampton: 'southampton',
  saints: 'southampton',
  spurs: 'spurs',
  tottenham: 'spurs',
  'tottenham hotspur': 'spurs',
  westham: 'westham',
  'west ham': 'westham',
  'west ham united': 'westham',
  wolves: 'wolves',
  wolverhampton: 'wolves',
  'wolverhampton wanderers': 'wolves',
};

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugToLogoPath(slug: string): string | undefined {
  if (!AVAILABLE_SLUGS.has(slug)) return undefined;
  return `/assets/clubs/${slug}.svg`;
}

function fromName(value?: string): string | undefined {
  if (!value) return undefined;
  const normalized = normalizeName(value);
  const fromMap = NAME_TO_SLUG[normalized] || NAME_TO_SLUG[normalized.replace(/\s/g, '')];
  if (fromMap) return slugToLogoPath(fromMap);

  const direct = normalized.replace(/\s/g, '');
  return slugToLogoPath(direct);
}

/**
 * Resolve logo URL with layered fallbacks:
 * 1) FPL id -> 2) FPL short name -> 3) FPL full name
 * 4) football-data id -> 5) football-data short name -> 6) football-data full name
 */
export function resolveClubLogo(ref: TeamLogoRef): string | undefined {
  const fplById = ref.fplTeamId ? slugToLogoPath(FPL_ID_TO_SLUG[ref.fplTeamId]) : undefined;
  if (fplById) return fplById;

  const fplByShort = fromName(ref.fplShortName);
  if (fplByShort) return fplByShort;

  const fplByName = fromName(ref.fplName);
  if (fplByName) return fplByName;

  const fdById = ref.fdTeamId ? slugToLogoPath(FD_ID_TO_SLUG[ref.fdTeamId]) : undefined;
  if (fdById) return fdById;

  const fdByShort = fromName(ref.fdShortName);
  if (fdByShort) return fdByShort;

  return fromName(ref.fdName);
}

export function getTeamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 3).toUpperCase();
  if (parts.length === 2) return (parts[0][0] + parts[1].slice(0, 2)).toUpperCase();
  return parts.map((p) => p[0]).join('').slice(0, 3).toUpperCase();
}
