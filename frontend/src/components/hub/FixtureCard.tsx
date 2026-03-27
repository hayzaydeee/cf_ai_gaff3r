// Fixture card — redesigned per spec
// Layout: white card, 1px border, vertical team rows (badge + name), italic "vs",
// bottom row: KO time · competition · confidence dots · status badge

import type { FixtureData } from '../../services/api';
import ClubLogo from '../common/ClubLogo';

interface FixtureCardProps {
    fixture: FixtureData;
    isSelected?: boolean;
    hasChatted?: boolean;
    onClick?: () => void;
    onDoubleClick?: () => void;
}

export default function FixtureCard({ fixture, isSelected, hasChatted, onClick, onDoubleClick }: FixtureCardProps) {
    const kickoff = new Date(fixture.kickoffTime);
    const kickoffLabel = fixture.finished
      ? 'FT'
      : kickoff.toLocaleString([], {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });

    // Determine badge state
    let badgeText = hasChatted ? 'Analysed' : 'Pending';
    let badgeClass = hasChatted ? 'fc-badge--chatted' : 'fc-badge--pending';
    if (fixture.finished) {
        badgeText = 'FT';
        badgeClass = 'fc-badge--finished';
    }

    return (
        <button
            className={`fc ${isSelected ? 'fc--selected' : ''}`}
            onClick={onClick}
            onDoubleClick={onDoubleClick}
            id={`fixture-${fixture.id}`}
        >
            {/* Team rows */}
            <div className="fc-teams">
                <div className="fc-team-row">
                  <ClubLogo
                    teamName={fixture.homeTeam}
                    size={28}
                    className="fc-logo"
                    fallbackClassName="fc-badge-circle"
                    refData={{
                      fplTeamId: fixture.homeTeamId,
                      fdTeamId: fixture.homeTeamId,
                      fplShortName: fixture.homeTeamShortName,
                      fdShortName: fixture.homeTeamShortName,
                    }}
                  />
                    <span className="fc-team-name">{fixture.homeTeam}</span>
                    {fixture.finished && fixture.homeScore !== null && (
                        <span className="fc-score">{fixture.homeScore}</span>
                    )}
                </div>
                <span className="fc-vs">vs</span>
                <div className="fc-team-row">
                  <ClubLogo
                    teamName={fixture.awayTeam}
                    size={28}
                    className="fc-logo"
                    fallbackClassName="fc-badge-circle"
                    refData={{
                      fplTeamId: fixture.awayTeamId,
                      fdTeamId: fixture.awayTeamId,
                      fplShortName: fixture.awayTeamShortName,
                      fdShortName: fixture.awayTeamShortName,
                    }}
                  />
                    <span className="fc-team-name">{fixture.awayTeam}</span>
                    {fixture.finished && fixture.awayScore !== null && (
                        <span className="fc-score">{fixture.awayScore}</span>
                    )}
                </div>
            </div>

            {/* Bottom meta row */}
            <div className="fc-meta">
              <span className="fc-time">{kickoffLabel}</span>
              <span className="fc-comp">· {fixture.competitionCode}</span>
                <span className={`fc-badge ${badgeClass}`}>{badgeText}</span>
            </div>

            <style>{`
        .fc {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 16px;
          background: #FFFFFF;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          text-align: left;
          width: 100%;
          transition: all var(--transition-fast);
        }
        [data-theme="dark"] .fc { background: var(--color-beige); }
        .fc:hover {
          border-color: var(--color-orange);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.07);
        }
        .fc--selected {
          border-color: var(--color-orange);
          box-shadow: 0 0 0 2px var(--color-orange-soft);
        }
        .fc-teams {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .fc-team-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fc-badge-circle {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-orange);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .fc-logo {
          border-radius: 50%;
          flex-shrink: 0;
          background: transparent;
          border: none;
          padding: 0;
        }
        .fc-team-name {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-char);
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .fc-score {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 800;
          color: var(--color-char);
        }
        .fc-vs {
          font-family: 'EB Garamond', serif;
          font-size: 12px;
          font-style: italic;
          color: var(--color-muted);
          margin-left: 36px;
        }
        .fc-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .fc-time {
          font-family: var(--font-display);
          font-size: 11px;
          color: var(--color-muted);
        }
        .fc-comp {
          font-family: var(--font-display);
          font-size: 11px;
          color: var(--color-muted);
        }
        .fc-badge {
          margin-left: auto;
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          white-space: nowrap;
          border: 1px solid currentColor;
          background: transparent;
        }
        .fc-badge--pending {
          color: var(--color-pending);
        }
        .fc-badge--chatted {
          color: var(--color-success);
        }
        .fc-badge--finished {
          color: var(--color-char-muted);
        }
      `}</style>
        </button>
    );
}
