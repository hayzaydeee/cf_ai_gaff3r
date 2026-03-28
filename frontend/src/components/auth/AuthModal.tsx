// AuthModal — triggered from nav "Sign in" and landing page CTAs

import { useEffect } from 'react';
import AuthForm from './AuthForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="am-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="am-panel" onClick={e => e.stopPropagation()}>
        <button className="am-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        <AuthForm onSuccess={() => { onClose(); onSuccess?.(); }} />
      </div>

      <style>{`
        .am-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          backdrop-filter: blur(2px);
        }
        .am-panel {
          position: relative;
          width: 100%;
          max-width: 400px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 24px;
          box-shadow: 0 8px 32px rgba(36, 27, 22, 0.12);
        }
        .am-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: none;
          border: none;
          color: var(--color-char-muted);
          cursor: pointer;
          padding: 6px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background 0.15s;
          line-height: 0;
        }
        .am-close:hover { color: var(--color-char); background: var(--color-beige); }
      `}</style>
    </div>
  );
}
