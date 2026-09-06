// Top 6 predicted scorelines as a 3-column grid of mini-cards.
// Most likely scoreline highlighted with orange border.

import type { Scoreline } from '../../utils/simResult';

interface ScorelineGridProps {
  scorelines: Scoreline[];
  mostLikelyScore: Scoreline | null;
  homeTeam: string;
  awayTeam: string;
}

export default function ScorelineGrid({ scorelines, mostLikelyScore, homeTeam, awayTeam }: ScorelineGridProps) {
  const top6 = scorelines.slice(0, 6);
  const maxProb = top6[0]?.probability || 0.01;

  if (top6.length === 0) return null;

  return (
    <div className="sg-wrap">
      <div className="sg-header">
        <span className="sg-label">Top Scorelines</span>
        <span className="sg-teams">{homeTeam} · {awayTeam}</span>
      </div>
      <div className="sg-grid">
        {top6.map((s, i) => {
          const isTop = s.home === mostLikelyScore?.home && s.away === mostLikelyScore?.away;
          const pct = (s.probability * 100).toFixed(1);
          const barWidth = Math.round((s.probability / maxProb) * 100);
          return (
            <div key={i} className={`sg-card ${isTop ? 'sg-card--top' : ''}`}>
              {isTop && <span className="sg-top-badge">Most likely</span>}
              <span className="sg-score">{s.home}–{s.away}</span>
              <span className="sg-pct">{pct}%</span>
              <div className="sg-bar-track">
                <div className="sg-bar-fill" style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        .sg-wrap { display: flex; flex-direction: column; gap: 8px; }

        .sg-header {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .sg-label {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-char-muted);
        }
        .sg-teams {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-char-muted);
          opacity: 0.7;
        }

        .sg-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 6px;
        }
        .sg-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding: 8px 10px 7px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          transition: border-color var(--transition-fast);
        }
        .sg-card--top {
          border-color: var(--color-orange);
          box-shadow: 0 0 0 1px var(--color-orange), 0 2px 8px rgba(215, 103, 6, 0.12);
        }
        .sg-top-badge {
          font-family: var(--font-display);
          font-size: 8px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-orange);
          margin-bottom: 1px;
        }
        .sg-score {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-char);
          line-height: 1;
        }
        .sg-pct {
          font-family: var(--font-display);
          font-size: 11px;
          color: var(--color-char-muted);
        }
        .sg-bar-track {
          height: 3px;
          background: var(--color-border);
          border-radius: 2px;
          margin-top: 2px;
          overflow: hidden;
        }
        .sg-bar-fill {
          height: 100%;
          background: var(--color-orange);
          border-radius: 2px;
          transition: width var(--transition-normal);
        }
        .sg-card--top .sg-score { color: var(--color-orange); }

        @media (max-width: 480px) {
          .sg-grid { grid-template-columns: repeat(2, 1fr); }
          .sg-score { font-size: 17px; }
        }
      `}</style>
    </div>
  );
}
