// Match context right panel — redesigned per spec
// Shows: Match Context header · GW badge · Teams vs · Team Form · Key Players · Injuries · FPL Difficulty

import { useState, useEffect, useMemo } from 'react';
import { getFixtures, getMatchContext, type FixtureData, type MatchContextData } from '../../services/api';
import ClubLogo from '../common/ClubLogo';

interface MatchContextProps {
  fixtureId?: number;
  gameweek: number;
  onSelectFixture?: (fixture: FixtureData) => void;
}

function DiffDot({ filled }: { filled: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: '50%',
        background: filled ? 'var(--color-orange)' : 'var(--color-border)',
        marginRight: 3,
      }}
    />
  );
}

function formDisplay(form: string[]): string {
  if (!form.length) return '— — — — —';
  return form.slice(0, 5).map((r) => r.toUpperCase()).join(' ');
}

export default function MatchContext({ fixtureId, gameweek, onSelectFixture }: MatchContextProps) {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loadingFixtures, setLoadingFixtures] = useState(true);
  const [context, setContext] = useState<MatchContextData | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadingFixtures(true);
    getFixtures(gameweek)
      .then((d) => {
        if (!cancelled) {
          setFixtures(d.fixtures);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFixtures([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingFixtures(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [gameweek]);

  const selected = useMemo(() => fixtures.find((f) => f.id === fixtureId), [fixtures, fixtureId]);

  useEffect(() => {
    let cancelled = false;

    if (!selected) {
      setContext(null);
      return () => {
        cancelled = true;
      };
    }

    setLoadingContext(true);
    getMatchContext(selected.id, gameweek, selected.competitionCode || 'PL')
      .then((data) => {
        if (!cancelled) {
          setContext(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setContext(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingContext(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selected, gameweek]);

  const homeForm = context?.homeTeam.form ?? [];
  const awayForm = context?.awayTeam.form ?? [];
  const players = [
    ...(context?.homeTeam.keyPlayers ?? []).slice(0, 2).map((p) => ({ ...p, team: context?.homeTeam.name ?? selected?.homeTeam ?? 'Home' })),
    ...(context?.awayTeam.keyPlayers ?? []).slice(0, 2).map((p) => ({ ...p, team: context?.awayTeam.name ?? selected?.awayTeam ?? 'Away' })),
  ];
  const injuries = [
    ...(context?.homeTeam.injuries ?? []).slice(0, 2).map((i) => ({ ...i, team: context?.homeTeam.name ?? selected?.homeTeam ?? 'Home' })),
    ...(context?.awayTeam.injuries ?? []).slice(0, 2).map((i) => ({ ...i, team: context?.awayTeam.name ?? selected?.awayTeam ?? 'Away' })),
  ];

  const diffRating = context?.fplDifficulty
    ? Math.round((context.fplDifficulty.home + context.fplDifficulty.away) / 2)
    : selected
      ? Math.round(((selected.homeDifficulty || 3) + (selected.awayDifficulty || 3)) / 2)
      : 3;

  return (
    <div className="mctx" id="match-context">
      <div className="mctx-hdr">
        <span className="mctx-hdr-label">Match Context</span>
        <span className="mctx-hdr-sub">
          Gameweek {gameweek}
          {selected?.competition ? ` · ${selected.competition}` : ' · Premier League'}
        </span>
      </div>

      {selected ? (
        <div className="mctx-teams">
          <ClubLogo
            teamName={selected.homeTeam}
            size={30}
            className="mctx-team-logo"
            fallbackClassName="mctx-team-badge"
            refData={{
              fplTeamId: selected.homeTeamId,
              fdTeamId: selected.homeTeamId,
              fplShortName: selected.homeTeamShortName,
              fdShortName: selected.homeTeamShortName,
            }}
          />
          <span className="mctx-team">{selected.homeTeam}</span>
          <span className="mctx-vs">vs</span>
          <span className="mctx-team">{selected.awayTeam}</span>
          <ClubLogo
            teamName={selected.awayTeam}
            size={30}
            className="mctx-team-logo"
            fallbackClassName="mctx-team-badge"
            refData={{
              fplTeamId: selected.awayTeamId,
              fdTeamId: selected.awayTeamId,
              fplShortName: selected.awayTeamShortName,
              fdShortName: selected.awayTeamShortName,
            }}
          />
        </div>
      ) : (
        <div className="mctx-no-fixture">Select a fixture from the Hub</div>
      )}

      <div className="mctx-divider" />

      <div className="mctx-section-label">Team Form</div>
      {loadingContext ? (
        <div className="mctx-loading">Loading live context...</div>
      ) : (
        <div className="mctx-form-rows">
          <div className="mctx-form-row">
            <span className="mctx-form-team">{context?.homeTeam.name ?? selected?.homeTeam ?? 'Home'}</span>
            <span className="mctx-form-string">{formDisplay(homeForm)}</span>
          </div>
          <div className="mctx-form-row">
            <span className="mctx-form-team">{context?.awayTeam.name ?? selected?.awayTeam ?? 'Away'}</span>
            <span className="mctx-form-string">{formDisplay(awayForm)}</span>
          </div>
        </div>
      )}

      <div className="mctx-divider" />

      <div className="mctx-section-label">Key Players</div>
      {players.length > 0 ? (
        <div className="mctx-players">
          {players.map((player) => (
            <div className="mctx-player-row" key={`${player.team}-${player.name}`}>
              <span className="mctx-player-name">{player.name}</span>
              <span className="mctx-player-stat">{player.team} · {player.goals}G / {player.assists}A</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mctx-injuries">No standout player data available for this fixture.</div>
      )}

      <div className="mctx-divider" />

      <div className="mctx-section-label">Injury Alerts</div>
      {injuries.length > 0 ? (
        <div className="mctx-players">
          {injuries.map((injury) => (
            <div className="mctx-player-row" key={`${injury.team}-${injury.player}`}>
              <span className="mctx-player-name">{injury.player}</span>
              <span className="mctx-player-stat">{injury.team} · {injury.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mctx-injuries">No major injury concerns reported.</div>
      )}

      <div className="mctx-divider" />

      <div className="mctx-diff-row">
        <span className="mctx-form-team">FPL Difficulty</span>
        <span className="mctx-diff-dots">
          {[1, 2, 3, 4, 5].map((i) => (
            <DiffDot key={i} filled={i <= diffRating} />
          ))}
        </span>
      </div>

      <div className="mctx-divider" />

      {!loadingFixtures && fixtures.filter((f) => f.id !== fixtureId).length > 0 && onSelectFixture && (
        <>
          <div className="mctx-section-label">Other Fixtures</div>
          <div className="mctx-picks">
            {fixtures
              .filter((f) => f.id !== fixtureId)
              .slice(0, 5)
              .map((f) => (
                <button key={f.id} className="mctx-pick" onClick={() => onSelectFixture(f)}>
                  <span className="mctx-pick-match">
                    {f.homeTeam} vs {f.awayTeam}
                  </span>
                  <span className="mctx-pick-comp">{f.competitionCode}</span>
                </button>
              ))}
          </div>
        </>
      )}

      <style>{`
        .mctx {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0;
          padding: 20px;
          background: var(--color-beige);
          border-left: 1px solid var(--color-border);
          height: 100%;
          overflow-y: auto;
        }
        .mctx-hdr {
          margin-bottom: 14px;
        }
        .mctx-hdr-label {
          display: block;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-muted);
          margin-bottom: 3px;
        }
        .mctx-hdr-sub {
          font-family: 'EB Garamond', serif;
          font-size: 12px;
          color: var(--color-muted);
        }
        .mctx-teams {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
        }
        .mctx-team {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          color: var(--color-char);
          flex: 1;
          text-align: center;
        }
        .mctx-team-badge {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--color-orange);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .mctx-team-logo {
          border-radius: 50%;
          background: transparent;
          border: none;
          padding: 0;
          flex-shrink: 0;
        }
        .mctx-vs {
          font-family: 'EB Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: var(--color-muted);
        }
        .mctx-no-fixture, .mctx-loading {
          font-family: 'EB Garamond', serif;
          font-size: 13px;
          color: var(--color-muted);
          margin-bottom: 14px;
          font-style: italic;
        }
        .mctx-divider {
          border: none;
          border-top: 1px solid var(--color-border);
          margin: 12px 0;
        }
        .mctx-section-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--color-muted);
          margin-bottom: 8px;
        }
        .mctx-form-rows {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 4px;
        }
        .mctx-form-row,
        .mctx-diff-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }
        .mctx-form-team {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-char);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 140px;
        }
        .mctx-form-string {
          font-family: var(--font-display);
          font-size: 11px;
          color: var(--color-char-light);
          letter-spacing: 1px;
        }
        .mctx-players {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 4px;
        }
        .mctx-player-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }
        .mctx-player-name {
          font-family: 'EB Garamond', serif;
          font-size: 13px;
          color: var(--color-char);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .mctx-player-stat {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-muted);
          white-space: nowrap;
        }
        .mctx-injuries {
          font-family: 'EB Garamond', serif;
          font-size: 13px;
          color: var(--color-muted);
          font-style: italic;
          margin-bottom: 2px;
        }
        .mctx-diff-dots {
          display: flex;
          align-items: center;
        }
        .mctx-picks {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .mctx-pick {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border: none;
          border-radius: var(--radius-sm);
          background: none;
          color: var(--color-char);
          cursor: pointer;
          text-align: left;
          transition: background var(--transition-fast);
        }
        .mctx-pick:hover {
          background: var(--color-beige-hover);
        }
        .mctx-pick-match {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mctx-pick-comp {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-muted);
          flex-shrink: 0;
        }
      `}</style>
    </div>
  );
}
