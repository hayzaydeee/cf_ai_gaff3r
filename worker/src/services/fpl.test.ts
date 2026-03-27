import { describe, expect, it } from 'vitest';
import type { FPLFixture } from '../types/fpl';
import type { FDPerson, FDScorer } from '../types/football-data';
import type { InjuryReport, KeyPlayer } from '../types/app';
import {
  computeLeaguePositions,
  filterInjuriesByCurrentSquad,
  selectPreferredKeyPlayers,
} from './fpl';

describe('computeLeaguePositions', () => {
  it('computes PL-style table order from finished fixtures', () => {
    const fixtures: FPLFixture[] = [
      {
        id: 1,
        event: 1,
        team_h: 1,
        team_a: 2,
        team_h_score: 2,
        team_a_score: 0,
        finished: true,
        kickoff_time: '2026-08-01T12:00:00Z',
        team_h_difficulty: 3,
        team_a_difficulty: 3,
      },
      {
        id: 2,
        event: 1,
        team_h: 2,
        team_a: 3,
        team_h_score: 1,
        team_a_score: 1,
        finished: true,
        kickoff_time: '2026-08-01T15:00:00Z',
        team_h_difficulty: 3,
        team_a_difficulty: 3,
      },
      {
        id: 3,
        event: 2,
        team_h: 3,
        team_a: 1,
        team_h_score: 0,
        team_a_score: 3,
        finished: true,
        kickoff_time: '2026-08-08T12:00:00Z',
        team_h_difficulty: 3,
        team_a_difficulty: 3,
      },
    ];

    const positions = computeLeaguePositions(fixtures);

    expect(positions.get(1)).toBe(1);
    expect(positions.get(2)).toBe(2);
    expect(positions.get(3)).toBe(3);
  });
});

describe('selectPreferredKeyPlayers', () => {
  it('prefers captain and prolific scorers within current squad', () => {
    const fallbackPlayers: KeyPlayer[] = [
      {
        name: 'Bruno Fernandes',
        position: 'MID',
        form: 6.5,
        goals: 3,
        assists: 6,
        xG: 2.4,
        xA: 3.1,
        minutes: 2200,
        status: 'available',
      },
      {
        name: 'Alejandro Garnacho',
        position: 'MID',
        form: 5.1,
        goals: 5,
        assists: 2,
        xG: 4.2,
        xA: 1.4,
        minutes: 1800,
        status: 'available',
      },
    ];

    const squad: FDPerson[] = [
      { id: 1, name: 'Bruno Fernandes', position: 'Midfielder', role: 'CAPTAIN' },
      { id: 2, name: 'Rasmus Hojlund', position: 'Attacker', role: 'PLAYER' },
      { id: 3, name: 'Marcus Rashford', position: 'Attacker', role: 'PLAYER' },
    ];

    const scorers: FDScorer[] = [
      {
        player: { id: 200, name: 'Rasmus Hojlund' },
        team: { id: 66, name: 'Manchester United' },
        goals: 12,
        assists: 2,
      },
      {
        player: { id: 201, name: 'Marcus Rashford' },
        team: { id: 66, name: 'Manchester United' },
        goals: 9,
        assists: 4,
      },
      {
        player: { id: 202, name: 'Loaned Player' },
        team: { id: 66, name: 'Manchester United' },
        goals: 7,
        assists: 1,
      },
    ];

    const selected = selectPreferredKeyPlayers(fallbackPlayers, squad, scorers, 66);

    expect(selected[0]?.name).toBe('Bruno Fernandes');
    expect(selected.some((p) => p.name === 'Rasmus Hojlund')).toBe(true);
    expect(selected.some((p) => p.name === 'Loaned Player')).toBe(false);
  });
});

describe('filterInjuriesByCurrentSquad', () => {
  it('keeps only squad members and deduplicates duplicate names', () => {
    const injuries: InjuryReport[] = [
      { player: 'André Onana', status: 'injured', news: 'Knock', chanceOfPlaying: 50 },
      { player: 'Loaned Defender', status: 'injured', news: 'Out', chanceOfPlaying: 0 },
      { player: 'Andre Onana', status: 'injured', news: 'Duplicate variant', chanceOfPlaying: 50 },
    ];

    const squad: FDPerson[] = [
      { id: 10, name: 'Andre Onana', position: 'Goalkeeper', role: 'PLAYER' },
      { id: 11, name: 'Lisandro Martinez', position: 'Defender', role: 'PLAYER' },
    ];

    const filtered = filterInjuriesByCurrentSquad(injuries, squad);

    expect(filtered).toHaveLength(1);
    expect(filtered[0].player).toBe('André Onana');
  });
});
