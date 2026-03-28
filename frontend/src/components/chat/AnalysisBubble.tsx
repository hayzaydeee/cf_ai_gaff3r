// Premium analysis response layout — shown when a message has simResult data.
// Renders: text section cards → model output block → typed prediction card

import type { ChatMessage } from '../../types';
import { parseAssistantSections } from './MessageBubble';
import PredictionCard from './PredictionCard';
import ScorerCard from './ScorerCard';
import LineupGrid from './LineupGrid';
import ProbabilityGauge from './ProbabilityGauge';
import OutcomeBar from './OutcomeBar';
import ScorelineGrid from './ScorelineGrid';
import XGComparison from './XGComparison';
import AdjustmentNotes from './AdjustmentNotes';

const SECTION_ICONS: Record<string, string> = {
  "The Gaffer's Call": '★',
  'Form Check': '◈',
  'Key Factor': '◆',
  'Prediction': '⚑',
  'Where I Could Be Wrong': '◎',
};

function getSectionIcon(header: string): string {
  return SECTION_ICONS[header] ?? '▸';
}

interface AnalysisBubbleProps {
  message: ChatMessage;
  showModelBlock?: boolean;
}

function stripPredictionBlock(content: string): string {
  return content
    .replace(/<<<PREDICTION_JSON>>>[\s\S]*?<<<END_PREDICTION_JSON>>>/g, '')
    .replace(/<<<PREDICTION_JSON>>>[\s\S]*/g, '')
    .trim();
}

export default function AnalysisBubble({ message, showModelBlock = true }: AnalysisBubbleProps) {
  const { simResult, adjustmentNotes, prediction, typedPrediction } = message;
  const isStreaming = message.streaming === true;
  const displayContent = stripPredictionBlock(message.content);
  const sections = parseAssistantSections(displayContent) ?? [];

  // Derive team names from prediction or simResult context
  const homeTeam = prediction?.homeTeam ?? 'Home';
  const awayTeam = prediction?.awayTeam ?? 'Away';

  return (
    <div className="ab-wrap">
      {/* ── Text section cards ── */}
      {sections.map((s, i) => (
        <div key={i} className="ab-section-card">
          <div className="ab-section-header">
            <span className="ab-section-icon">{getSectionIcon(s.header)}</span>
            <span className="ab-section-chip">{s.header}</span>
          </div>
          <p className="ab-section-body">{s.body}</p>
        </div>
      ))}

      {/* Fallback: plain text / streaming text before sections are detected */}
      {sections.length === 0 && (
        <div className="ab-plain">
          {displayContent.split('\n').map((line, i) => (
            <p key={i} className="ab-plain-line">{line || '\u00A0'}</p>
          ))}
          {isStreaming && <span className="ab-cursor" />}
        </div>
      )}

      {/* ── Model output block: only on first occurrence ── */}
      {showModelBlock && isStreaming && !simResult && message.hasModel !== false ? (
        <div className="ab-model-block">
          {/* Label intentionally absent from skeleton — avoids false promise for non-result queries */}
          <div className="ab-skel ab-skel--bar" />
          <div className="ab-two-col">
            <div className="ab-skel ab-skel--box" />
            <div className="ab-skel ab-skel--box" />
          </div>
        </div>
      ) : showModelBlock && simResult ? (
        <div className="ab-model-block">
          <span className="ab-block-label">
            Dixon-Coles · Monte Carlo · 15,000 simulations
          </span>

          <OutcomeBar
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            homeWinPct={simResult.homeWinPct}
            drawPct={simResult.drawPct}
            awayWinPct={simResult.awayWinPct}
          />

          <div className="ab-two-col">
            <XGComparison
              homeTeam={homeTeam}
              awayTeam={awayTeam}
              lambda={simResult.lambda}
              mu={simResult.mu}
            />
            <ScorelineGrid
              scorelines={simResult.topScorelinesWithPct}
              mostLikelyScore={simResult.mostLikelyScore}
              homeTeam={homeTeam}
              awayTeam={awayTeam}
            />
          </div>

          {adjustmentNotes && adjustmentNotes.length > 0 && (
            <AdjustmentNotes notes={adjustmentNotes} />
          )}
        </div>
      ) : null}

      {/* ── Typed prediction card: routed by sub-type after streaming completes ── */}
      {!isStreaming && typedPrediction?.type === 'scorer' && typedPrediction.scorers && (
        <ScorerCard
          homeTeam={typedPrediction.homeTeam}
          awayTeam={typedPrediction.awayTeam}
          scorers={typedPrediction.scorers}
        />
      )}
      {!isStreaming && typedPrediction?.type === 'lineup' && (
        <LineupGrid
          homeTeam={typedPrediction.homeTeam}
          awayTeam={typedPrediction.awayTeam}
          homeLineup={typedPrediction.homeLineup}
          awayLineup={typedPrediction.awayLineup}
        />
      )}
      {!isStreaming && typedPrediction?.type === 'btts' && (
        <ProbabilityGauge
          homeTeam={typedPrediction.homeTeam}
          awayTeam={typedPrediction.awayTeam}
          btts={typedPrediction.btts}
          confidence={typedPrediction.confidence}
          overUnder={typedPrediction.overUnder}
        />
      )}
      {/* Fallback: result type uses PredictionCard */}
      {!isStreaming && (!typedPrediction || typedPrediction.type === 'result') && prediction && (
        <PredictionCard prediction={prediction} />
      )}

      <style>{`
        .ab-wrap {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        /* Section cards */
        .ab-section-card {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          box-shadow: 0 1px 3px rgba(36, 27, 22, 0.05);
        }
        .ab-section-header {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
        }
        .ab-section-icon {
          font-size: 13px;
          color: var(--color-orange);
          flex-shrink: 0;
        }
        .ab-section-chip {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.7px;
          color: var(--color-orange);
        }
        .ab-section-body {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          color: var(--color-char);
          line-height: 1.55;
          margin: 0;
        }

        /* Plain fallback — styled as a card */
        .ab-plain {
          display: flex;
          flex-direction: column;
          gap: 4px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px 14px;
          box-shadow: 0 1px 3px rgba(36, 27, 22, 0.05);
        }
        [data-theme="dark"] .ab-plain {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }
        .ab-plain-line {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          color: var(--color-char);
          line-height: 1.55;
          margin: 0;
        }

        /* Model output block */
        .ab-model-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 14px 16px;
          background: var(--color-beige);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          box-shadow: 0 2px 8px rgba(36, 27, 22, 0.07);
        }
        .ab-block-label {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-char-muted);
          opacity: 0.7;
        }

        /* Two-column grid (xG | scorelines) */
        .ab-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          align-items: start;
        }

        /* Dark mode overrides */
        [data-theme="dark"] .ab-section-card {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.08);
        }
        [data-theme="dark"] .ab-model-block {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.08);
        }

        @media (max-width: 560px) {
          .ab-two-col { grid-template-columns: 1fr; }
        }

        /* Streaming cursor */
        .ab-cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: var(--color-orange);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: ab-blink 1s step-end infinite;
        }
        @keyframes ab-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        /* Skeleton shimmer */
        .ab-skel {
          border-radius: var(--radius-md);
          background: linear-gradient(
            90deg,
            var(--color-border) 25%,
            var(--color-beige-hover, #e8d5a8) 50%,
            var(--color-border) 75%
          );
          background-size: 200% 100%;
          animation: ab-shimmer 1.4s ease-in-out infinite;
        }
        .ab-skel--bar { height: 36px; }
        .ab-skel--box { height: 90px; }
        @keyframes ab-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
