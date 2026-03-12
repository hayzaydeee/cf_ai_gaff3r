// Inline prediction card — shown within assistant messages

import type { PredictionSummary } from '../../types';

interface PredictionCardProps {
    prediction: PredictionSummary;
}

export default function PredictionCard({ prediction }: PredictionCardProps) {
    const confidenceColor: Record<string, string> = {
        low: 'var(--color-warning)',
        medium: 'var(--color-orange)',
        high: 'var(--color-success)',
    };

    return (
        <div className="pred-card" id="prediction-card">
            <div className="pred-card-header">
                <span className="pred-card-label">🎯 The Gaffer's Call</span>
                <span
                    className="pred-confidence"
                    style={{ color: confidenceColor[prediction.confidence] }}
                >
                    {prediction.confidence.toUpperCase()}
                </span>
            </div>

            <div className="pred-scoreline">
                <span className="pred-team">{prediction.homeTeam}</span>
                <span className="pred-score">
                    {prediction.predictedScore.home} - {prediction.predictedScore.away}
                </span>
                <span className="pred-team">{prediction.awayTeam}</span>
            </div>

            {prediction.reasoning && (
                <p className="pred-reasoning">{prediction.reasoning}</p>
            )}

            <style>{`
        .pred-card {
          margin-top: 10px;
          padding: 12px;
          background: var(--color-cream);
          border: 1px solid var(--color-orange-soft);
          border-left: 3px solid var(--color-orange);
          border-radius: var(--radius-md);
        }
        .pred-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .pred-card-label {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 700;
          color: var(--color-char-light);
        }
        .pred-confidence {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1px;
        }
        .pred-scoreline {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px 0;
        }
        .pred-team {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          flex: 1;
        }
        .pred-score {
          font-family: var(--font-display);
          font-size: 24px;
          font-weight: 800;
          color: var(--color-orange);
          letter-spacing: 2px;
        }
        .pred-reasoning {
          font-size: 13px;
          color: var(--color-char-light);
          margin: 4px 0 0;
          font-style: italic;
        }
      `}</style>
        </div>
    );
}
