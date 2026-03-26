// Prediction row — fixture, prediction, actual, result, confidence + chat link

import { useNavigate } from 'react-router-dom';
import type { Prediction } from '../../types';

interface PredictionRowProps {
  prediction: Prediction;
}

export default function PredictionRow({ prediction: pred }: PredictionRowProps) {
  const navigate = useNavigate();
  const isCorrect = pred.outcomeCorrect;
  const isExact = pred.exactScoreCorrect;
  const isResolved = pred.status === 'resolved';

  const handleViewChat = () => {
    navigate(`/chat/${pred.fixtureId}?gw=${pred.gameweek}`);
  };

  return (
    <div className={`pred-row ${isResolved ? (isCorrect ? 'pred-row-correct' : 'pred-row-wrong') : 'pred-row-pending'}`}
      id={`pred-${pred.id}`}>
      <div className="pred-row-teams">
        <span className="pred-row-team">{pred.homeTeam}</span>
        <span className="pred-row-vs">vs</span>
        <span className="pred-row-team">{pred.awayTeam}</span>
      </div>

      <div className="pred-row-scores">
        <div className="pred-row-score-block">
          <span className="pred-row-score-label">Called</span>
          <span className="pred-row-score-value">
            {pred.predictedScore.home}-{pred.predictedScore.away}
          </span>
        </div>
        {isResolved && pred.actualScore && (
          <div className="pred-row-score-block">
            <span className="pred-row-score-label">Actual</span>
            <span className="pred-row-score-value">
              {pred.actualScore.home}-{pred.actualScore.away}
            </span>
          </div>
        )}
      </div>

      <div className="pred-row-meta">
        <span className={`pred-row-confidence pred-conf-${pred.confidence}`}>
          {pred.confidence.toUpperCase()}
        </span>
        <span className={`pred-row-status ${isResolved ? (isCorrect ? 'status-correct' : 'status-wrong') : 'status-pending'}`}>
          {isResolved ? (isExact ? '🎯 Exact' : isCorrect ? '✅ Correct' : '❌ Wrong') : '⏳ Pending'}
        </span>
      </div>

      <button
        className="pred-row-chat-btn"
        onClick={handleViewChat}
        title="View conversation"
      >
        💬
      </button>

      <style>{`
        .pred-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          margin-bottom: 4px;
          transition: background var(--transition-fast);
        }
        .pred-row:hover {
          background: var(--color-beige);
        }
        .pred-row-correct {
          border-left: 3px solid var(--color-success);
        }
        .pred-row-wrong {
          border-left: 3px solid var(--color-error);
        }
        .pred-row-pending {
          border-left: 3px solid var(--color-char-muted);
        }
        .pred-row-teams {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
        }
        .pred-row-team {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pred-row-vs {
          font-size: 11px;
          color: var(--color-char-muted);
          flex-shrink: 0;
        }
        .pred-row-scores {
          display: flex;
          gap: 12px;
        }
        .pred-row-score-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1px;
        }
        .pred-row-score-label {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 600;
          text-transform: uppercase;
          color: var(--color-char-muted);
        }
        .pred-row-score-value {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 800;
        }
        .pred-row-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .pred-row-confidence {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .pred-conf-low { color: var(--color-warning); }
        .pred-conf-medium { color: var(--color-orange); }
        .pred-conf-high { color: var(--color-success); }
        .pred-row-status {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
        }
        .status-correct { color: var(--color-success); }
        .status-wrong { color: var(--color-error); }
        .status-pending { color: var(--color-char-muted); }
        .pred-row-chat-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border: none;
          border-radius: var(--radius-sm);
          background: var(--color-beige);
          cursor: pointer;
          font-size: 14px;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .pred-row-chat-btn:hover {
          background: var(--color-orange-soft);
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
