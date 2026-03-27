// Prediction card — redesigned per spec
// Label · Confidence badge · Score line · Outcome sub-text

import type { PredictionSummary } from '../../types';

interface PredictionCardProps {
    prediction: PredictionSummary;
}

const CONFIDENCE_LABELS: Record<string, string> = {
    low: 'Low Confidence',
    medium: 'Medium Confidence',
    high: 'High Confidence',
};

export default function PredictionCard({ prediction }: PredictionCardProps) {
    const confLabel = CONFIDENCE_LABELS[prediction.confidence] ?? prediction.confidence;

    return (
        <div className="pc" id="prediction-card">
            <div className="pc-header">
                <span className="pc-label">Gaff3r's Prediction</span>
                <span className={`pc-conf pc-conf--${prediction.confidence}`}>{confLabel}</span>
            </div>

            <div className="pc-score">
                {prediction.homeTeam} {prediction.predictedScore.home} – {prediction.predictedScore.away} {prediction.awayTeam}
            </div>

            {prediction.reasoning && (
                <p className="pc-desc">{prediction.reasoning}</p>
            )}

            <style>{`
        .pc {
          margin-top: 12px;
          padding: 14px 16px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-left: 3px solid var(--color-orange);
          border-radius: var(--radius-md);
        }
        [data-theme="dark"] .pc { background: var(--color-beige); }
        .pc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .pc-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-muted);
        }
        .pc-conf {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 600;
          padding: 2px 10px;
          border-radius: var(--radius-pill);
        }
        .pc-conf--low {
          background: var(--color-beige);
          color: var(--color-char-light);
        }
        .pc-conf--medium {
          background: var(--color-pending-soft);
          color: var(--color-pending);
        }
        .pc-conf--high {
          background: var(--color-success-soft);
          color: var(--color-success);
        }
        .pc-score {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--color-char);
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .pc-desc {
          font-family: 'EB Garamond', serif;
          font-size: 13px;
          font-style: italic;
          color: var(--color-muted);
          margin: 0;
          line-height: 1.5;
        }
      `}</style>
        </div>
    );
}
