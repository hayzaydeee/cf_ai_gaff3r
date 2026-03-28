// Auth form — Google OAuth only
// Shared between AuthModal and AuthPage

import { useAuth } from '../../context/AuthContext';

interface AuthFormProps {
  onSuccess?: () => void;
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function AuthForm({ onSuccess: _onSuccess }: AuthFormProps) {
  const { signInWithGoogle, isLoading } = useAuth();

  return (
    <div className="af-root">
      <div className="af-header">
        <span className="af-wordmark">gaff3r</span>
        <p className="af-headline">Sign in</p>
        <p className="af-sub">Save your predictions across devices</p>
      </div>

      <button
        type="button"
        className="af-btn-google"
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        <GoogleIcon />
        {isLoading ? 'Redirecting…' : 'Continue with Google'}
      </button>

      <style>{`
        .af-root { display: flex; flex-direction: column; gap: 0; }

        .af-header { margin-bottom: 20px; }
        .af-wordmark {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-orange);
          letter-spacing: -0.3px;
          display: block;
          margin-bottom: 10px;
        }
        .af-headline {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 4px;
          line-height: 1.2;
        }
        .af-sub {
          font-size: 13px;
          color: var(--color-char-muted);
          margin: 0;
          line-height: 1.4;
        }

        .af-btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          color: var(--color-char);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s;
          box-sizing: border-box;
        }
        .af-btn-google:hover:not(:disabled) {
          background: var(--color-beige);
          border-color: var(--color-char-muted);
        }
        .af-btn-google:disabled { opacity: 0.55; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
