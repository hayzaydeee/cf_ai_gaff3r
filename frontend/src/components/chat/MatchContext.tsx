// Match context right panel — redesigned per spec
// Shows: Match Context header · GW badge · Teams vs · Team Form · Key Players · Injuries · FPL Difficulty

import { useState, useEffect } from 'react';
import { getFixtures, type FixtureData } from '../../services/api';

interface MatchContextProps {
  fixtureId?: number;
  gameweek: number;
  onSelectFixture?: (fixture: FixtureData) => void;
}

function DiffDot({ filled }: { filled: boolean }) {
    return (
        <span style={{
            display: 'inline-block',
            width: 8, height: 8,
            borderRadius: '50%',
            background: filled ? 'var(--color-orange)' : 'var(--color-border)',
            marginRight: 3,
        }} />
    );
}

export default function MatchContext({ fixtureId, gameweek, onSelectFixture }: MatchContextProps) {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getFixtures(gameweek)
      .then(d => { if (!cancelled) setFixtures(d.fixtures); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [gameweek]);

  const selected = fixtures.find(f => f.id === fixtureId);
  const diffRating = selected
    ? Math.round(((selected.homeDifficulty || 3) + (selected.awayDifficulty || 3)) / 2)
    : 3;

  return (
    <div className="mctx" id="match-context">
      {/* Header */}
      <div className="mctx-hdr">
        <span className="mctx-hdr-label">Match Context</span>
        <span className="mctx-hdr-sub">Gameweek {gameweek} · Premier League</span>
      </div>

      {/* Teams */}
      {selected ? (
        <div className="mctx-teams">
          <span className="mctx-team">{selected.homeTeam}</span>
          <span className="mctx-vs">vs</span>
          <span className="mctx-team">{selected.awayTeam}</span>
        </div>
      ) : (
        <div className="mctx-no-fixture">Select a fixture from the Hub</div>
      )}

      <div className="mctx-divider" />

      {/* Team Form */}
      <div className="mctx-section-label">Team Form</div>
      <div className="mctx-form-rows">
        <div className="mctx-form-row">
          <span className="mctx-form-team">{selected?.homeTeam ?? 'Home'}</span>
          <span className="mctx-form-string">— — — — —</span>
        </div>
        <div className="mctx-form-row">
          <span className="mctx-form-team">{selected?.awayTeam ?? 'Away'}</span>
          <span className="mctx-form-string">— — — — —</span>
        </div>
      </div>

      <div className="mctx-divider" />

      {/* Key Players */}
      <div className="mctx-section-label">Key Players</div>
      <div className="mctx-players">
        <div className="mctx-player-row">
          <span className="mctx-player-name">—</span>
          <span className="mctx-player-stat">Form data loading</span>
        </div>
      </div>

      <div className="mctx-divider" />

      {/* FPL Difficulty */}
      <div className="mctx-diff-row">
        <span className="mctx-form-team">FPL Difficulty</span>
        <span className="mctx-diff-dots">
          {[1,2,3,4,5].map(i => <DiffDot key={i} filled={i <= diffRating} />)}
        </span>
      </div>

      <div className="mctx-divider" />

      {/* Other fixtures quick-pick */}
      {!loading && fixtures.filter(f => f.id !== fixtureId).length > 0 && onSelectFixture && (
        <>
          <div className="mctx-section-label">Other Fixtures</div>
          <div className="mctx-picks">
            {fixtures.filter(f => f.id !== fixtureId).slice(0, 5).map(f => (
              <button
                key={f.id}
                className="mctx-pick"
                onClick={() => onSelectFixture(f)}
              >
                <span className="mctx-pick-match">{f.homeTeam} vs {f.awayTeam}</span>
                <span className="mctx-pick-comp">{f.competitionCode}</span>
              </button>
            ))}
          </div>
        </>
      )}

      <style>{`
        .mctx {
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
        }
        .mctx-vs {
          font-family: 'EB Garamond', serif;
          font-size: 14px;
          font-style: italic;
          color: var(--color-muted);
        }
        .mctx-no-fixture {
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
        .mctx-form-row, .mctx-diff-row {
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
          max-width: 120px;
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
        }
        .mctx-player-stat {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-muted);
          white-space: nowrap;
        }
        .mctx-diff-dots {
          display: flex;
          align-items: center;
        }
        /* Fixture quick-picks */
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
        .mctx-pick:hover { background: var(--color-beige-hover); }
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
