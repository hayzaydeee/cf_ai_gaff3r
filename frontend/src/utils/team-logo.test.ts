import { describe, expect, it } from 'vitest';
import { resolveClubLogo } from './team-logo';

describe('resolveClubLogo', () => {
  it('prefers team names over potentially stale numeric ids', () => {
    const logo = resolveClubLogo({ fplTeamId: 13, fplName: 'Arsenal' });
    expect(logo).toBe('/assets/clubs/arsenal.svg');
  });

  it('falls back to FPL short name and full name when id is not mapped', () => {
    const byShort = resolveClubLogo({ fplTeamId: 999, fplShortName: 'MUN' });
    const byName = resolveClubLogo({ fplTeamId: 999, fplName: 'West Ham United' });

    expect(byShort).toBe('/assets/clubs/manutd.svg');
    expect(byName).toBe('/assets/clubs/westham.svg');
  });

  it('falls back to football-data id after trying football-data names', () => {
    const byFdId = resolveClubLogo({ fdTeamId: 63 });
    const byFdName = resolveClubLogo({ fdShortName: 'NEW', fdName: 'Newcastle United' });

    expect(byFdId).toBe('/assets/clubs/fulham.svg');
    expect(byFdName).toBe('/assets/clubs/newcastle.svg');
  });

  it('returns undefined when no mapping can be resolved', () => {
    const logo = resolveClubLogo({ fplName: 'Some Unknown Club', fdName: 'Another Unknown' });
    expect(logo).toBeUndefined();
  });

  it('handles extended club names for corrected mappings', () => {
    expect(resolveClubLogo({ fplName: 'Chelsea FC' })).toBe('/assets/clubs/chelsea.svg');
    expect(resolveClubLogo({ fplName: 'Crystal Palace FC' })).toBe('/assets/clubs/crystalpalace.svg');
    expect(resolveClubLogo({ fplName: 'AFC Bournemouth' })).toBe('/assets/clubs/bournemouth.svg');
    expect(resolveClubLogo({ fplName: 'Brighton & Hove Albion' })).toBe('/assets/clubs/brighton.svg');
    expect(resolveClubLogo({ fplName: 'Brentford FC' })).toBe('/assets/clubs/brentford.svg');
    expect(resolveClubLogo({ fplName: 'Everton FC' })).toBe('/assets/clubs/everton.svg');
    expect(resolveClubLogo({ fplName: 'Southampton FC' })).toBe('/assets/clubs/southampton.svg');
  });

  it('resolves sunderland logo when name is provided', () => {
    expect(resolveClubLogo({ fplName: 'Sunderland' })).toBe('/assets/clubs/sunderland.svg');
    expect(resolveClubLogo({ fplName: 'Sunderland AFC' })).toBe('/assets/clubs/sunderland.svg');
  });
});
