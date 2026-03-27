import { describe, expect, it } from 'vitest';
import { resolveClubLogo } from './team-logo';

describe('resolveClubLogo', () => {
  it('prefers FPL id mapping first', () => {
    const logo = resolveClubLogo({ fplTeamId: 13, fplName: 'Arsenal' });
    expect(logo).toBe('/assets/clubs/mancity.svg');
  });

  it('falls back to FPL short name and full name when id is not mapped', () => {
    const byShort = resolveClubLogo({ fplTeamId: 999, fplShortName: 'MUN' });
    const byName = resolveClubLogo({ fplTeamId: 999, fplName: 'West Ham United' });

    expect(byShort).toBe('/assets/clubs/manutd.svg');
    expect(byName).toBe('/assets/clubs/westham.svg');
  });

  it('falls back to football-data id and names when FPL fields are unavailable', () => {
    const byFdId = resolveClubLogo({ fdTeamId: 63 });
    const byFdName = resolveClubLogo({ fdShortName: 'NEW', fdName: 'Newcastle United' });

    expect(byFdId).toBe('/assets/clubs/fulham.svg');
    expect(byFdName).toBe('/assets/clubs/newcastle.svg');
  });

  it('returns undefined when no mapping can be resolved', () => {
    const logo = resolveClubLogo({ fplName: 'Some Unknown Club', fdName: 'Another Unknown' });
    expect(logo).toBeUndefined();
  });
});
