/** Derive the current PL season string e.g. "2025-26". */
export function deriveSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  // PL season starts August — if before August, we're in the previous season
  const startYear = month >= 8 ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(2)}`;
}
