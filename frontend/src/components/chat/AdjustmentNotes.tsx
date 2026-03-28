// Contextual adjustment factor pills — horizontally scrollable row.
// Sentiment is inferred from the note text (positive/negative/neutral).

interface AdjustmentNotesProps {
  notes: string[];
}

function getSentiment(note: string): 'positive' | 'negative' | 'neutral' {
  const lower = note.toLowerCase();
  if (/boost|advantage|strong|favour|form advantage|\+/.test(lower)) return 'positive';
  if (/reduc|absent|injur|unavail|weak|drag|miss|\-/.test(lower)) return 'negative';
  return 'neutral';
}

function getIcon(sentiment: 'positive' | 'negative' | 'neutral'): string {
  if (sentiment === 'positive') return '↑';
  if (sentiment === 'negative') return '↓';
  return '•';
}

export default function AdjustmentNotes({ notes }: AdjustmentNotesProps) {
  if (notes.length === 0) return null;

  return (
    <div className="an-wrap">
      <span className="an-header">Adjustments</span>
      <div className="an-scroll">
        {notes.map((note, i) => {
          const sentiment = getSentiment(note);
          return (
            <span key={i} className={`an-pill an-pill--${sentiment}`}>
              <span className="an-icon">{getIcon(sentiment)}</span>
              {note}
            </span>
          );
        })}
      </div>

      <style>{`
        .an-wrap { display: flex; flex-direction: column; gap: 6px; }

        .an-header {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          color: var(--color-char-muted);
        }

        .an-scroll {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding-bottom: 2px;
          scrollbar-width: none;
        }
        .an-scroll::-webkit-scrollbar { display: none; }

        .an-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
          flex-shrink: 0;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 500;
          padding: 4px 10px;
          border-radius: var(--radius-pill);
        }
        .an-icon { font-size: 10px; font-weight: 700; }

        .an-pill--positive {
          background: rgba(46, 125, 50, 0.08);
          color: #2E7D32;
          border: 1px solid rgba(46, 125, 50, 0.2);
        }
        .an-pill--negative {
          background: rgba(198, 40, 40, 0.07);
          color: #C62828;
          border: 1px solid rgba(198, 40, 40, 0.2);
        }
        .an-pill--neutral {
          background: var(--color-beige);
          color: var(--color-char-light);
          border: 1px solid var(--color-border);
        }

        [data-theme="dark"] .an-pill--positive {
          background: rgba(46, 125, 50, 0.15);
          border-color: rgba(46, 125, 50, 0.3);
        }
        [data-theme="dark"] .an-pill--negative {
          background: rgba(198, 40, 40, 0.15);
          border-color: rgba(198, 40, 40, 0.3);
        }
      `}</style>
    </div>
  );
}
