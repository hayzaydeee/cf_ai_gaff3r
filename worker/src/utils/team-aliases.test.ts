import { describe, expect, it } from 'vitest';
import { getFdIdByFplId, getFdIdByTeamName } from './team-aliases';

describe('team alias lookups', () => {
  it('resolves football-data id by known team name variants', () => {
    expect(getFdIdByTeamName('Chelsea FC')).toBe(61);
    expect(getFdIdByTeamName('Crystal Palace')).toBe(354);
    expect(getFdIdByTeamName('AFC Bournemouth')).toBe(1044);
    expect(getFdIdByTeamName('Brighton and Hove Albion')).toBe(397);
    expect(getFdIdByTeamName('Southampton')).toBe(340);
    expect(getFdIdByTeamName('Everton FC')).toBe(62);
  });

  it('still supports direct fpl id mapping when ids are known', () => {
    expect(getFdIdByFplId(6)).toBe(61);
  });
});
