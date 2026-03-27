import type { Prediction } from '../../types';
import ClubLogo from '../common/ClubLogo';

interface PredictionRowProps {
  prediction: Prediction;
  gameweek: number;
  resultLabel: (pred: Prediction) => { text: string; cls: string };
  confLabel: (confidence: string) => string;
}

export default function PredictionRow({ prediction: pred, gameweek, resultLabel, confLabel }: PredictionRowProps) {
  const rb = resultLabel(pred);
  const kickoff = new Date(pred.createdAt);
  const dateStr = kickoff.toLocaleDateString([], { day: 'numeric', month: 'short' });

  return (
    <tr className="preds-row" id={`pred-${pred.id}`}>
      <td>
        <div className="preds-fixture-main">
          <ClubLogo
            teamName={pred.homeTeam}
            size={18}
            className="preds-logo"
            fallbackClassName="preds-logo-fallback"
            refData={{
              fplTeamId: pred.homeTeamId,
              fdTeamId: pred.homeTeamId,
            }}
          />
          {pred.homeTeam}
          <span className="preds-fixture-vs">vs</span>
          <ClubLogo
            teamName={pred.awayTeam}
            size={18}
            className="preds-logo"
            fallbackClassName="preds-logo-fallback"
            refData={{
              fplTeamId: pred.awayTeamId,
              fdTeamId: pred.awayTeamId,
            }}
          />
          {pred.awayTeam}
        </div>
        <div className="preds-fixture-sub">GW{gameweek} · {dateStr}</div>
      </td>
      <td className="preds-th-hide-sm">
        <span className="preds-comp-badge">PL</span>
      </td>
      <td>
        <div className="preds-score-call">
          {pred.homeTeam.split(' ')[0]} {pred.predictedScore.home}–{pred.predictedScore.away} {pred.awayTeam.split(' ')[0]}
        </div>
        <div className="preds-conf-sub">{confLabel(pred.confidence)} confidence</div>
      </td>
      <td className="preds-th-hide-sm">
        {pred.actualScore
          ? <span className="preds-score-actual">
              {pred.homeTeam.split(' ')[0]} {pred.actualScore.home}–{pred.actualScore.away} {pred.awayTeam.split(' ')[0]}
            </span>
          : <span className="preds-score-na">—</span>
        }
      </td>
      <td>
        <span className={`preds-result-badge ${rb.cls}`}>{rb.text}</span>
      </td>
      <td className="preds-th-hide-sm">
        <span className="preds-conf-badge">{confLabel(pred.confidence)}</span>
      </td>
    </tr>
  );
}
