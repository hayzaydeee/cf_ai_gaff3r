// Fixture card component for the Hub page
// Shows team names, kickoff, difficulty badge, and prediction status

import type { FixtureData } from '../../services/api';

interface FixtureCardProps {
    fixture: FixtureData;
    isSelected?: boolean;
    hasChatted?: boolean;
    onClick?: () => void;
}

export default function FixtureCard({ fixture, isSelected, hasChatted, onClick }: FixtureCardProps) {
    const kickoff = new Date(fixture.kickoffTime);
    const timeStr = kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = kickoff.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

    return (
        <button
            className={`fixture-card ${isSelected ? 'fixture-card-selected' : ''} ${fixture.finished ? 'fixture-card-finished' : ''}`}
            onClick={onClick}
            id={`fixture-${fixture.id}`}
        >
            <div className="fixture-card-header">
                <span className="fixture-comp-badge">{fixture.competitionCode}</span>
                <span className="fixture-time">{fixture.finished ? 'FT' : timeStr}</span>
            </div>

            <div className="fixture-teams">
                <div className="fixture-team">
                    <span className="fixture-team-name">{fixture.homeTeam}</span>
                    {fixture.finished && fixture.homeScore !== null && (
                        <span className="fixture-score">{fixture.homeScore}</span>
                    )}
                    {!fixture.finished && fixture.homeDifficulty > 0 && (
                        <DifficultyBadge difficulty={fixture.homeDifficulty} />
                    )}
                </div>
                <div className="fixture-team">
                    <span className="fixture-team-name">{fixture.awayTeam}</span>
                    {fixture.finished && fixture.awayScore !== null && (
                        <span className="fixture-score">{fixture.awayScore}</span>
                    )}
                    {!fixture.finished && fixture.awayDifficulty > 0 && (
                        <DifficultyBadge difficulty={fixture.awayDifficulty} />
                    )}
                </div>
            </div>

            <div className="fixture-card-footer">
                <span className="fixture-date">{dateStr}</span>
                {hasChatted && (
                    <span className="fixture-chatted-badge" title="You've chatted about this fixture">
                        💬 Chat
                    </span>
                )}
            </div>

            <style>{`
        .fixture-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px 16px;
          background: var(--color-beige);
          border: 2px solid transparent;
          border-radius: var(--radius-lg);
          cursor: pointer;
          text-align: left;
          width: 100%;
          font-family: var(--font-body);
          transition: all var(--transition-fast);
        }
        .fixture-card:hover {
          background: var(--color-beige-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .fixture-card-selected {
          border-color: var(--color-orange);
          background: var(--color-orange-soft);
        }
        .fixture-card-finished {
          opacity: 0.75;
        }
        .fixture-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fixture-comp-badge {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          background: var(--color-orange-soft);
          color: var(--color-orange);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .fixture-time {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-char-light);
        }
        .fixture-teams {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fixture-team {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fixture-team-name {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 700;
          color: var(--color-char);
        }
        .fixture-score {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          color: var(--color-char);
        }
        .fixture-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .fixture-date {
          font-size: 12px;
          color: var(--color-char-muted);
        }
        .fixture-chatted-badge {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-orange);
          background: var(--color-orange-soft);
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }
      `}</style>
        </button>
    );
}

// FDR difficulty badge (1-5 scale)
function DifficultyBadge({ difficulty }: { difficulty: number }) {
    const colors: Record<number, string> = {
        1: '#2E7D32', // Easy — green
        2: '#66BB6A',
        3: '#8A7D76', // Medium — neutral
        4: '#E65100',
        5: '#C62828', // Hard — red
    };

    return (
        <span
            className="difficulty-badge"
            style={{ background: colors[difficulty] ?? colors[3] }}
        >
            {difficulty}
            <style>{`
        .difficulty-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          color: white;
        }
      `}</style>
        </span>
    );
}
