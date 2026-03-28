// Lineup prediction card — shows formation + key selection picks
// Renders from TypedPrediction where type === 'lineup'

import type { LineupData } from '../../types';

interface LineupGridProps {
  homeTeam: string;
  awayTeam: string;
  homeLineup?: LineupData;
  awayLineup?: LineupData;
}

function TeamPicks({ team, lineup }: { team: string; lineup?: LineupData }) {
  if (!lineup) return null;
  return (
    <div className="lg-team">
      <div className="lg-team-header">
        <span className="lg-team-name">{team}</span>
        <span className="lg-formation">{lineup.formation}</span>
      </div>
      <ul className="lg-picks">
        {lineup.keyPicks.map((pick, i) => (
          <li key={i} className="lg-pick">{pick}</li>
        ))}
      </ul>
    </div>
  );
}

export default function LineupGrid({ homeTeam, awayTeam, homeLineup, awayLineup }: LineupGridProps) {
  return (
    <div className="lg-wrap">
      <div className="lg-header">
        <span className="lg-icon">📋</span>
        <span className="lg-title">Expected Lineup</span>
      </div>

      <div className="lg-grid">
        <TeamPicks team={homeTeam} lineup={homeLineup} />
        {homeLineup && awayLineup && <div className="lg-divider" />}
        <TeamPicks team={awayTeam} lineup={awayLineup} />
      </div>

      <style>{`
        .lg-wrap {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        [data-theme="dark"] .lg-wrap {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
        }

        .lg-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-border);
        }
        [data-theme="dark"] .lg-header { border-color: rgba(255,255,255,0.08); }

        .lg-icon { font-size: 13px; }
        .lg-title {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-orange);
        }

        .lg-grid {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
        }

        .lg-divider {
          width: 1px;
          background: var(--color-border);
          margin: 12px 0;
        }
        [data-theme="dark"] .lg-divider { background: rgba(255,255,255,0.08); }

        .lg-team { padding: 12px 14px; }

        .lg-team-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 10px;
        }
        .lg-team-name {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-char);
        }
        .lg-formation {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-orange);
          opacity: 0.85;
        }

        .lg-picks {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .lg-pick {
          font-family: 'EB Garamond', serif;
          font-size: 13px;
          color: var(--color-char);
          line-height: 1.4;
          padding-left: 10px;
          border-left: 2px solid var(--color-border);
        }
        [data-theme="dark"] .lg-pick { border-color: rgba(255,255,255,0.1); }

        @media (max-width: 480px) {
          .lg-grid {
            grid-template-columns: 1fr;
          }
          .lg-divider {
            width: auto;
            height: 1px;
            margin: 0 14px;
          }
        }
      `}</style>
    </div>
  );
}
