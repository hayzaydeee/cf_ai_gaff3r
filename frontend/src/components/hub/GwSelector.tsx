// Gameweek selector — prev/next arrows + GW display

interface GwSelectorProps {
    currentGw: number;
    selectedGw: number;
    onSelect: (gw: number) => void;
}

export default function GwSelector({ currentGw, selectedGw, onSelect }: GwSelectorProps) {
    const isFirst = selectedGw <= 1;
    const isLast = selectedGw >= 38;

    return (
        <div className="gw-selector" id="gw-selector">
            <button
                className="gw-btn"
                onClick={() => onSelect(selectedGw - 1)}
                disabled={isFirst}
                aria-label="Previous gameweek"
            >
                ‹
            </button>
            <div className="gw-display">
                <span className="gw-label">Gameweek</span>
                <span className="gw-number">{selectedGw}</span>
                {selectedGw === currentGw && (
                    <span className="gw-current-badge">Current</span>
                )}
            </div>
            <button
                className="gw-btn"
                onClick={() => onSelect(selectedGw + 1)}
                disabled={isLast}
                aria-label="Next gameweek"
            >
                ›
            </button>

            <style>{`
        .gw-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .gw-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          border-radius: var(--radius-md);
          background: var(--color-beige);
          color: var(--color-char);
          font-size: 24px;
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .gw-btn:hover:not(:disabled) {
          background: var(--color-beige-hover);
        }
        .gw-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .gw-display {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .gw-label {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          color: var(--color-char-light);
        }
        .gw-number {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 800;
          color: var(--color-char);
        }
        .gw-current-badge {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: var(--radius-pill);
          background: var(--color-orange-soft);
          color: var(--color-orange);
        }
      `}</style>
        </div>
    );
}
