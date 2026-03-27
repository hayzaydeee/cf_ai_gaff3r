// Fixture card — redesigned per spec
// Layout: white card, 1px border, vertical team rows (badge + name), italic "vs",
// bottom row: KO time · competition · confidence dots · status badge

import type { FixtureData } from '../../services/api';

interface FixtureCardProps {
    fixture: FixtureData;
    isSelected?: boolean;
    hasChatted?: boolean;
    onClick?: () => void;
}

// Simple team colour map for the initialled badge circles
const TEAM_COLORS: Record<string, string> = {
    'Man City': '#1B4FC4', 'Manchester City': '#1B4FC4',
    'Arsenal': '#EF0107',
    'Liverpool': '#C8102E',
    'Chelsea': '#034694',
    'Man Utd': '#DA291C', 'Manchester United': '#DA291C',
    'Spurs': '#132257', 'Tottenham': '#132257', 'Tottenham Hotspur': '#132257',
    'Newcastle': '#241F20', 'Newcastle United': '#241F20',
    'Aston Villa': '#670E36',
    'West Ham': '#7A263A',
    'Everton': '#274488',
    'Wolves': '#FDB913', 'Wolverhampton': '#FDB913',
    'Brighton': '#0057B8',
    'Fulham': '#FFFFFF',
    'Brentford': '#E30613',
    'Crystal Palace': '#1B458F',
    'Nottm Forest': '#DD0000', 'Nottingham Forest': '#DD0000',
    'Bournemouth': '#DA291C',
    'Ipswich': '#0044A9',
    'Leicester': '#003090',
    'Southampton': '#D71920',
};

function getTeamColor(name: string): string {
    return TEAM_COLORS[name] || '#FA8112';
}

function getInitials(name: string): string {
    const parts = name.split(' ');
    if (parts.length === 1) return name.slice(0, 3).toUpperCase();
    if (parts.length === 2) return (parts[0][0] + parts[1].slice(0, 2)).toUpperCase();
    return parts.map(p => p[0]).join('').slice(0, 3).toUpperCase();
}

function confidenceDots(difficulty: number): string {
    // Use difficulty (1-5) as a proxy for match interest / prediction confidence shown in hub
    const filled = Math.max(1, Math.min(5, Math.round(difficulty)));
    return '● '.repeat(filled).trim() + (filled < 5 ? ' ' + '○ '.repeat(5 - filled).trim() : '');
}

export default function FixtureCard({ fixture, isSelected, hasChatted, onClick }: FixtureCardProps) {
    const kickoff = new Date(fixture.kickoffTime);
    const timeStr = fixture.finished ? 'FT' : kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const homeColor = getTeamColor(fixture.homeTeam);
    const awayColor = getTeamColor(fixture.awayTeam);
    const homeInit = getInitials(fixture.homeTeam);
    const awayInit = getInitials(fixture.awayTeam);

    // Determine badge state
    let badgeText = hasChatted ? 'Analysed' : 'Pending';
    let badgeClass = hasChatted ? 'fc-badge--chatted' : 'fc-badge--pending';
    if (fixture.finished) {
        badgeText = 'FT';
        badgeClass = 'fc-badge--finished';
    }

    // Visual confidence dots (use average difficulty as proxy)
    const avgDiff = ((fixture.homeDifficulty || 3) + (fixture.awayDifficulty || 3)) / 2;
    const dots = confidenceDots(avgDiff);

    return (
        <button
            className={`fc ${isSelected ? 'fc--selected' : ''}`}
            onClick={onClick}
            id={`fixture-${fixture.id}`}
        >
            {/* Team rows */}
            <div className="fc-teams">
                <div className="fc-team-row">
                    <div
                        className="fc-badge-circle"
                        style={{ background: homeColor, color: homeColor === '#FFFFFF' ? '#333' : '#FFF' }}
                    >
                        {homeInit}
                    </div>
                    <span className="fc-team-name">{fixture.homeTeam}</span>
                    {fixture.finished && fixture.homeScore !== null && (
                        <span className="fc-score">{fixture.homeScore}</span>
                    )}
                </div>
                <span className="fc-vs">vs</span>
                <div className="fc-team-row">
                    <div
                        className="fc-badge-circle"
                        style={{ background: awayColor, color: awayColor === '#FFFFFF' ? '#333' : '#FFF' }}
                    >
                        {awayInit}
                    </div>
                    <span className="fc-team-name">{fixture.awayTeam}</span>
                    {fixture.finished && fixture.awayScore !== null && (
                        <span className="fc-score">{fixture.awayScore}</span>
                    )}
                </div>
            </div>

            {/* Bottom meta row */}
            <div className="fc-meta">
                <span className="fc-time">{timeStr}</span>
                <span className="fc-comp">· {fixture.competitionCode} ·</span>
                <span className="fc-dots">{dots}</span>
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
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          flex-shrink: 0;
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
          gap: 5px;
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
        .fc-dots {
          font-size: 7px;
          color: var(--color-orange);
          letter-spacing: 1px;
          flex: 1;
        }
        .fc-badge {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 500;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          white-space: nowrap;
        }
        .fc-badge--pending {
          background: var(--color-pending-soft);
          color: var(--color-pending);
        }
        .fc-badge--chatted {
          background: var(--color-success-soft);
          color: var(--color-success);
        }
        .fc-badge--finished {
          background: var(--color-beige);
          color: var(--color-char-muted);
        }
      `}</style>
        </button>
    );
}
