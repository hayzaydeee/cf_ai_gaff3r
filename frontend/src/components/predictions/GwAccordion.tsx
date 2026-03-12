// GW accordion — collapsible gameweek section

import { useState } from 'react';
import type { Prediction } from '../../types';
import PredictionRow from './PredictionRow';

interface GwAccordionProps {
    gameweek: string; // e.g. "gw30"
    predictions: Prediction[];
    defaultOpen?: boolean;
}

export default function GwAccordion({ gameweek, predictions, defaultOpen }: GwAccordionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
    const gwNum = gameweek.replace('gw', '');
    const correct = predictions.filter(p => p.outcomeCorrect).length;
    const resolved = predictions.filter(p => p.status === 'resolved').length;

    return (
        <div className="gw-accordion" id={`accordion-${gameweek}`}>
            <button className="gw-accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div className="gw-accordion-left">
                    <span className="gw-accordion-chevron" style={{ transform: isOpen ? 'rotate(90deg)' : 'none' }}>›</span>
                    <span className="gw-accordion-title">Gameweek {gwNum}</span>
                    <span className="gw-accordion-count">{predictions.length} predictions</span>
                </div>
                {resolved > 0 && (
                    <span className="gw-accordion-accuracy">
                        {correct}/{resolved} correct
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="gw-accordion-body">
                    {predictions.map(pred => (
                        <PredictionRow key={pred.id} prediction={pred} />
                    ))}
                </div>
            )}

            <style>{`
        .gw-accordion {
          border-radius: var(--radius-lg);
          overflow: hidden;
          margin-bottom: 8px;
        }
        .gw-accordion-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: var(--color-beige);
          color: var(--color-char);
          cursor: pointer;
          text-align: left;
          font-family: var(--font-display);
          transition: background var(--transition-fast);
        }
        .gw-accordion-header:hover {
          background: var(--color-beige-hover);
        }
        .gw-accordion-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gw-accordion-chevron {
          font-size: 18px;
          font-weight: 700;
          transition: transform var(--transition-fast);
          color: var(--color-char-muted);
        }
        .gw-accordion-title {
          font-size: 15px;
          font-weight: 700;
        }
        .gw-accordion-count {
          font-size: 12px;
          font-weight: 500;
          color: var(--color-char-muted);
        }
        .gw-accordion-accuracy {
          font-size: 13px;
          font-weight: 600;
          color: var(--color-success);
        }
        .gw-accordion-body {
          padding: 8px;
          background: var(--color-cream);
          border: 1px solid var(--color-beige);
          border-top: none;
          border-radius: 0 0 var(--radius-lg) var(--radius-lg);
        }
      `}</style>
        </div>
    );
}
