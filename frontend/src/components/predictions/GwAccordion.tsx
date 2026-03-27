import type { Prediction } from '../../types';
import PredictionRow from './PredictionRow';

interface GwAccordionProps {
  gameweek: string;
  predictions: Prediction[];
  filterFn: (pred: Prediction) => boolean;
  resultLabel: (pred: Prediction) => { text: string; cls: string };
  confLabel: (confidence: string) => string;
}

export default function GwAccordion({ gameweek, predictions, filterFn, resultLabel, confLabel }: GwAccordionProps) {
  const filtered = predictions.filter(filterFn);
  if (filtered.length === 0) return null;

  const gwNum = parseInt(gameweek.replace('gw', ''));
  const resolved = predictions.filter(p => p.status === 'resolved');
  const correct = resolved.filter(p => p.outcomeCorrect).length;
  const pct = resolved.length > 0 ? Math.round((correct / resolved.length) * 100) : null;

  return (
    <>
      <tr className="preds-gw-row" id={`gw-${gameweek}`}>
        <td colSpan={6}>
          <span className="preds-gw-label">Gameweek {gwNum}</span>
          {pct !== null && <span className="preds-gw-stat">{correct}/{resolved.length} correct · {pct}%</span>}
        </td>
      </tr>
      {filtered.map(pred => (
        <PredictionRow
          key={pred.id}
          prediction={pred}
          gameweek={gwNum}
          resultLabel={resultLabel}
          confLabel={confLabel}
        />
      ))}
    </>
  );
}
