// AuthModal — triggered from the nav "Sign in" button
// Renders the auth form in an overlay modal

import { useEffect } from 'react';
import { AuthForm } from '../../pages/Auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="modal-panel" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <div className="modal-header">
          <span className="modal-logo">gaff3r</span>
          <h2 className="modal-title">Sign in</h2>
          <p className="modal-subtitle">Save your predictions across devices</p>
        </div>
        <AuthForm onSuccess={onClose} />
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }
        .modal-panel {
          position: relative;
          width: 100%;
          max-width: 420px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
        }
        .modal-close {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: var(--color-char-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color var(--transition-fast);
        }
        .modal-close:hover { color: var(--color-char); }
        .modal-header { margin-bottom: 24px; text-align: center; }
        .modal-logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 22px;
          color: var(--color-orange);
          display: block;
          margin-bottom: 10px;
        }
        .modal-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 4px;
        }
        .modal-subtitle { font-size: 13px; color: var(--color-char-muted); margin: 0; }
      `}</style>
    </div>
  );
}
