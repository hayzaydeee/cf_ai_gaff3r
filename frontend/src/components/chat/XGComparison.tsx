// Expected goals comparison — two mirrored bars growing from center.
// Shows λ (home xG) vs μ (away xG) with a lean indicator pill.

interface XGComparisonProps {
  homeTeam: string;
  awayTeam: string;
  lambda: number;
  mu: number;
}

export default function XGComparison({ homeTeam, awayTeam, lambda, mu }: XGComparisonProps) {
  // Callers pass values normalised by normalizeSimResult; this is a belt-and-braces
  // guard so a raw payload can never crash the bubble on .toFixed().
  if (!Number.isFinite(lambda) || !Number.isFinite(mu)) return null;

  const total = lambda + mu || 1;
  const homeWidth = Math.round((lambda / total) * 100);
  const awayWidth = 100 - homeWidth;

  const diff = lambda - mu;
  const leanLabel =
    diff > 0.2 ? `${homeTeam} favoured` :
    diff < -0.2 ? `${awayTeam} favoured` :
    'Even match';
  const leanMod = diff > 0.2 ? 'xg-lean--home' : diff < -0.2 ? 'xg-lean--away' : 'xg-lean--even';

  return (
    <div className="xg-wrap">
      <div className="xg-header">
        <span className="xg-label">Expected Goals</span>
      </div>

      <div className="xg-row">
        <div className="xg-side xg-side--home">
          <span className="xg-team">{homeTeam}</span>
          <span className="xg-val">{lambda.toFixed(2)}</span>
          <div className="xg-bar-track xg-bar-track--home">
            <div className="xg-bar-fill xg-bar-fill--home" style={{ width: `${homeWidth}%` }} />
          </div>
        </div>
        <div className="xg-divider">xG</div>
        <div className="xg-side xg-side--away">
          <div className="xg-bar-track xg-bar-track--away">
            <div className="xg-bar-fill xg-bar-fill--away" style={{ width: `${awayWidth}%` }} />
          </div>
          <span className="xg-val">{mu.toFixed(2)}</span>
          <span className="xg-team">{awayTeam}</span>
        </div>
      </div>

      <div className="xg-lean-wrap">
        <span className={`xg-lean ${leanMod}`}>{leanLabel}</span>
      </div>

      <style>{`
        .xg-wrap { display: flex; flex-direction: column; gap: 8px; }

        .xg-header {
          display: flex;
          align-items: center;
        }
        .xg-label {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-char-muted);
        }

        .xg-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .xg-side {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .xg-side--home { align-items: flex-start; }
        .xg-side--away { align-items: flex-end; }

        .xg-team {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          color: var(--color-char-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .xg-val {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          line-height: 1;
        }
        .xg-side--home .xg-val { color: var(--color-orange); }
        .xg-side--away .xg-val { color: var(--color-char); }

        .xg-bar-track {
          width: 100%;
          height: 6px;
          background: var(--color-border);
          border-radius: 3px;
          overflow: hidden;
        }
        .xg-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width var(--transition-normal);
        }
        .xg-bar-fill--home { background: var(--color-orange); }
        .xg-bar-fill--away { background: var(--color-char); float: right; }

        .xg-divider {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-char-muted);
          opacity: 0.5;
          flex-shrink: 0;
        }

        .xg-lean-wrap { display: flex; justify-content: center; }
        .xg-lean {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 10px;
          border-radius: var(--radius-pill);
          border: 1px solid currentColor;
        }
        .xg-lean--home { color: var(--color-orange); }
        .xg-lean--away { color: var(--color-char); }
        .xg-lean--even { color: var(--color-char-muted); }
      `}</style>
    </div>
  );
}
