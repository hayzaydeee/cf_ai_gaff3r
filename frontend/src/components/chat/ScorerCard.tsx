// Scorer prediction card — shows goalscorer picks with likelihood tiers
// Renders from TypedPrediction where type === 'scorer'

import type { ScorerPick } from '../../types';

interface ScorerCardProps {
  homeTeam: string;
  awayTeam: string;
  scorers: ScorerPick[];
}

const LIKELIHOOD_LABEL: Record<ScorerPick['likelihood'], string> = {
  likely: 'Likely',
  possible: 'Possible',
  outside: 'Outside bet',
};

const LIKELIHOOD_ORDER: ScorerPick['likelihood'][] = ['likely', 'possible', 'outside'];

export default function ScorerCard({ homeTeam, awayTeam, scorers }: ScorerCardProps) {
  const sorted = [...scorers].sort(
    (a, b) => LIKELIHOOD_ORDER.indexOf(a.likelihood) - LIKELIHOOD_ORDER.indexOf(b.likelihood)
  );

  return (
    <div className="sc-wrap">
      <div className="sc-header">
        <span className="sc-icon">⚽</span>
        <span className="sc-title">Scorer Picks</span>
        <span className="sc-fixture">{homeTeam} vs {awayTeam}</span>
      </div>

      <div className="sc-list">
        {sorted.map((pick, i) => (
          <div key={i} className={`sc-row sc-row--${pick.likelihood}`}>
            <div className="sc-player">
              <span className="sc-name">{pick.name}</span>
              <span className="sc-team">{pick.team}</span>
            </div>
            <div className="sc-right">
              {pick.goals > 1 && <span className="sc-goals">{pick.goals} goals</span>}
              <span className={`sc-badge sc-badge--${pick.likelihood}`}>
                {LIKELIHOOD_LABEL[pick.likelihood]}
              </span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .sc-wrap {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        [data-theme="dark"] .sc-wrap {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
        }

        .sc-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-border);
        }
        [data-theme="dark"] .sc-header { border-color: rgba(255,255,255,0.08); }

        .sc-icon { font-size: 14px; }
        .sc-title {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-orange);
        }
        .sc-fixture {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-char-muted);
          opacity: 0.7;
          margin-left: auto;
        }

        .sc-list { display: flex; flex-direction: column; }

        .sc-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-border);
          transition: background 0.15s;
        }
        .sc-row:last-child { border-bottom: none; }
        [data-theme="dark"] .sc-row { border-color: rgba(255,255,255,0.06); }

        .sc-player { display: flex; flex-direction: column; gap: 2px; }
        .sc-name {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--color-char);
        }
        .sc-team {
          font-family: var(--font-display);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-char-muted);
          opacity: 0.65;
        }

        .sc-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .sc-goals {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-char-muted);
          opacity: 0.7;
        }

        .sc-badge {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
        }
        .sc-badge--likely {
          background: rgba(212, 107, 8, 0.12);
          color: var(--color-orange);
        }
        .sc-badge--possible {
          background: var(--color-beige);
          color: var(--color-char);
        }
        .sc-badge--outside {
          background: transparent;
          color: var(--color-char-muted);
          border: 1px solid var(--color-border);
          opacity: 0.7;
        }
        [data-theme="dark"] .sc-badge--possible {
          background: rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}
