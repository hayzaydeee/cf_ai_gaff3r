// MigrationPrompt — shown after sign-up when anonymous data exists
// Offers to import predictions/chat history from the browser's localStorage UUID

import { useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787';
const ANON_ID_KEY = 'gaff3r-user-id';

interface MigrationPromptProps {
  onDone: () => void;
}

export default function MigrationPrompt({ onDone }: MigrationPromptProps) {
  const [isMigrating, setIsMigrating] = useState(false);
  const [result, setResult] = useState<{ predictionsMigrated: number; gameweeksCopied: number } | null>(null);

  const anonymousUserId = localStorage.getItem(ANON_ID_KEY);
  if (!anonymousUserId) return null;

  async function handleImport() {
    setIsMigrating(true);
    try {
      const res = await fetch(`${API_BASE}/api/migrate-anonymous`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ anonymousUserId }),
      });
      if (res.ok) {
        const data = await res.json() as { predictionsMigrated: number; gameweeksCopied: number };
        setResult(data);
        localStorage.removeItem(ANON_ID_KEY);
      }
    } finally {
      setIsMigrating(false);
    }
  }

  function handleDecline() {
    // Keep localStorage ID — user declined, don't delete it
    onDone();
  }

  return (
    <div className="migration-overlay" role="dialog" aria-modal="true">
      <div className="migration-panel">
        {result ? (
          <>
            <div className="migration-icon">✅</div>
            <h3 className="migration-title">Data imported</h3>
            <p className="migration-body">
              {result.predictionsMigrated} prediction{result.predictionsMigrated !== 1 ? 's' : ''} and{' '}
              {result.gameweeksCopied} gameweek{result.gameweeksCopied !== 1 ? 's' : ''} of chat history
              have been moved to your account.
            </p>
            <button className="migration-btn-primary" onClick={onDone}>
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="migration-icon">📦</div>
            <h3 className="migration-title">Import your data?</h3>
            <p className="migration-body">
              We found predictions and chat history saved in this browser.
              Want to import them into your new account?
            </p>
            <div className="migration-actions">
              <button
                className="migration-btn-primary"
                onClick={handleImport}
                disabled={isMigrating}
              >
                {isMigrating ? 'Importing…' : 'Import my data'}
              </button>
              <button
                className="migration-btn-secondary"
                onClick={handleDecline}
                disabled={isMigrating}
              >
                Start fresh
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .migration-overlay {
          position: fixed;
          inset: 0;
          z-index: 110;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .migration-panel {
          width: 100%;
          max-width: 380px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
          text-align: center;
        }
        .migration-icon { font-size: 36px; margin-bottom: 12px; }
        .migration-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 10px;
        }
        .migration-body {
          font-size: 14px;
          color: var(--color-char-muted);
          line-height: 1.5;
          margin: 0 0 24px;
        }
        .migration-actions { display: flex; flex-direction: column; gap: 8px; }
        .migration-btn-primary {
          padding: 11px 16px;
          background: var(--color-orange);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .migration-btn-primary:hover:not(:disabled) { background: var(--color-orange-hover); }
        .migration-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .migration-btn-secondary {
          padding: 11px 16px;
          background: none;
          color: var(--color-char-muted);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .migration-btn-secondary:hover:not(:disabled) {
          background: var(--color-beige);
          color: var(--color-char);
        }
      `}</style>
    </div>
  );
}
