// Match context sidebar — fixture info + quick-pick list

import { useState, useEffect } from 'react';
import { getFixtures, type FixtureData } from '../../services/api';

interface MatchContextProps {
  fixtureId?: number;
  gameweek: number;
  onSelectFixture: (fixture: FixtureData) => void;
}

export default function MatchContext({ fixtureId, gameweek, onSelectFixture }: MatchContextProps) {
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await getFixtures(gameweek);
        if (!cancelled) setFixtures(data.fixtures);
      } catch (err) {
        console.error('Failed to load fixtures for context:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [gameweek]);

  const selectedFixture = fixtures.find(f => f.id === fixtureId);

  return (
    <div className="match-ctx" id="match-context">
      {selectedFixture && (
        <div className="match-ctx-active">
          <div className="match-ctx-badge">{selectedFixture.competitionCode}</div>
          <div className="match-ctx-teams">
            <span className="match-ctx-team">{selectedFixture.homeTeam}</span>
            <span className="match-ctx-vs">vs</span>
            <span className="match-ctx-team">{selectedFixture.awayTeam}</span>
          </div>
          <div className="match-ctx-kickoff">
            {new Date(selectedFixture.kickoffTime).toLocaleDateString([], {
              weekday: 'short', day: 'numeric', month: 'short'
            })}
            {' • '}
            {new Date(selectedFixture.kickoffTime).toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit'
            })}
          </div>
        </div>
      )}

      <div className="match-ctx-picks">
        <h3 className="match-ctx-picks-title">
          {selectedFixture ? 'Other Fixtures' : 'Quick Picks'}
        </h3>
        {loading ? (
          <div className="match-ctx-loading">
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 6 }} />)}
          </div>
        ) : (
          <div className="match-ctx-list">
            {fixtures
              .filter(f => f.id !== fixtureId)
              .map(f => (
                <button
                  key={f.id}
                  className="match-ctx-pick"
                  onClick={() => onSelectFixture(f)}
                >
                  <span className="pick-teams">
                    {f.homeTeam} vs {f.awayTeam}
                  </span>
                  <span className="pick-comp">{f.competitionCode}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <style>{`
        .match-ctx {
          display: flex;
          flex-direction: column;
          gap: 16px;
          height: 100%;
        }
        .match-ctx-active {
          padding: 16px;
          background: var(--color-beige);
          border-radius: var(--radius-lg);
          text-align: center;
        }
        .match-ctx-badge {
          display: inline-block;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: var(--radius-pill);
          background: var(--color-orange-soft);
          color: var(--color-orange);
          margin-bottom: 8px;
        }
        .match-ctx-teams {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .match-ctx-team {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 700;
        }
        .match-ctx-vs {
          font-size: 13px;
          color: var(--color-char-muted);
        }
        .match-ctx-kickoff {
          font-size: 13px;
          color: var(--color-char-light);
        }
        .match-ctx-picks-title {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-char-muted);
          margin-bottom: 8px;
        }
        .match-ctx-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          max-height: 400px;
        }
        .match-ctx-pick {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--color-beige);
          color: var(--color-char);
          cursor: pointer;
          text-align: left;
          font-family: var(--font-body);
          font-size: 14px;
          transition: background var(--transition-fast);
        }
        .match-ctx-pick:hover {
          background: var(--color-beige-hover);
        }
        .pick-teams {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
        }
        .pick-comp {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-char-muted);
        }
      `}</style>
    </div>
  );
}
