// Probability gauge — BTTS yes/no + over/under market display
// Renders from TypedPrediction where type === 'btts'

interface ProbabilityGaugeProps {
  homeTeam: string;
  awayTeam: string;
  btts?: boolean;
  confidence?: 'low' | 'medium' | 'high';
  overUnder?: { line: number; pick: 'over' | 'under' };
}

const CONFIDENCE_LABEL = { low: 'Low confidence', medium: 'Confident', high: 'Strong call' };
const CONFIDENCE_COLOR = { low: 'var(--color-char-muted)', medium: 'var(--color-orange)', high: '#27ae60' };

export default function ProbabilityGauge({ homeTeam, awayTeam, btts, confidence = 'medium', overUnder }: ProbabilityGaugeProps) {
  const bttsYes = btts !== false;
  const confColor = CONFIDENCE_COLOR[confidence];

  return (
    <div className="pg-wrap">
      <div className="pg-header">
        <span className="pg-icon">📊</span>
        <span className="pg-title">Goals Market</span>
        <span className="pg-fixture">{homeTeam} vs {awayTeam}</span>
      </div>

      <div className="pg-body">
        {/* BTTS section */}
        <div className="pg-market">
          <span className="pg-market-label">Both Teams to Score</span>
          <div className="pg-btts-row">
            <div className={`pg-pill ${bttsYes ? 'pg-pill--yes' : 'pg-pill--no'}`}>
              {bttsYes ? 'YES' : 'NO'}
            </div>
            <span className="pg-conf" style={{ color: confColor }}>
              {CONFIDENCE_LABEL[confidence]}
            </span>
          </div>
        </div>

        {/* Over/under section */}
        {overUnder && (
          <div className="pg-market">
            <span className="pg-market-label">Goals Total</span>
            <div className="pg-ou-row">
              <span className="pg-ou-pick">
                <span className={`pg-ou-badge pg-ou-badge--${overUnder.pick}`}>
                  {overUnder.pick.toUpperCase()}
                </span>
                {overUnder.line} goals
              </span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .pg-wrap {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          overflow: hidden;
        }
        [data-theme="dark"] .pg-wrap {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.08);
        }

        .pg-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-bottom: 1px solid var(--color-border);
        }
        [data-theme="dark"] .pg-header { border-color: rgba(255,255,255,0.08); }

        .pg-icon { font-size: 13px; }
        .pg-title {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-orange);
        }
        .pg-fixture {
          font-family: var(--font-display);
          font-size: 10px;
          color: var(--color-char-muted);
          opacity: 0.7;
          margin-left: auto;
        }

        .pg-body {
          display: flex;
          gap: 0;
        }

        .pg-market {
          flex: 1;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .pg-market + .pg-market {
          border-left: 1px solid var(--color-border);
        }
        [data-theme="dark"] .pg-market + .pg-market { border-color: rgba(255,255,255,0.08); }

        .pg-market-label {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-char-muted);
          opacity: 0.65;
        }

        .pg-btts-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .pg-pill {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 1px;
          padding: 4px 16px;
          border-radius: var(--radius-pill);
        }
        .pg-pill--yes {
          background: rgba(39, 174, 96, 0.12);
          color: #27ae60;
        }
        .pg-pill--no {
          background: rgba(231, 76, 60, 0.1);
          color: #e74c3c;
        }

        .pg-conf {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pg-ou-row {
          display: flex;
          align-items: center;
        }

        .pg-ou-pick {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'EB Garamond', serif;
          font-size: 16px;
          color: var(--color-char);
        }

        .pg-ou-badge {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 0.5px;
          padding: 3px 10px;
          border-radius: var(--radius-pill);
        }
        .pg-ou-badge--over {
          background: rgba(212, 107, 8, 0.12);
          color: var(--color-orange);
        }
        .pg-ou-badge--under {
          background: var(--color-beige);
          color: var(--color-char);
        }
        [data-theme="dark"] .pg-ou-badge--under {
          background: rgba(255,255,255,0.06);
        }
      `}</style>
    </div>
  );
}
