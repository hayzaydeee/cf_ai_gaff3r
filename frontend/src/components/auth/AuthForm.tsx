// Auth form — magic link + Google OAuth
// Shared between AuthModal and AuthPage

import { useState, type FormEvent } from 'react';
import { useAuth } from '../../context/AuthContext';

interface AuthFormProps {
  onSuccess?: () => void;
}

function EnvelopeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 7l10 7 10-7" />
    </svg>
  );
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

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const { signInWithMagicLink, signInWithGoogle, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  async function handleMagicLink(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || isSending) return;
    setError(null);
    setIsSending(true);
    const result = await signInWithMagicLink(email.trim());
    setIsSending(false);
    if (result.success) {
      setMagicLinkSent(true);
      onSuccess?.();
    } else {
      setError(result.error ?? 'Something went wrong. Try again.');
    }
  }

  if (magicLinkSent) {
    return (
      <div className="af-sent">
        <span className="af-sent-icon"><EnvelopeIcon /></span>
        <p className="af-sent-title">Check your email</p>
        <p className="af-sent-body">
          We sent a sign-in link to <strong>{email}</strong>.<br />
          It expires in 15 minutes.
        </p>
        <button className="af-link-btn" onClick={() => setMagicLinkSent(false)}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="af-root">
      <div className="af-header">
        <span className="af-wordmark">gaff3r</span>
        <p className="af-headline">Sign in</p>
        <p className="af-sub">Save your predictions across devices</p>
      </div>

      <form onSubmit={handleMagicLink} className="af-form" noValidate>
        <input
          type="email"
          className="af-input"
          placeholder="your@email.com"
          aria-label="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          disabled={isSending}
        />
        {error && <p className="af-error">{error}</p>}
        <button type="submit" className="af-btn-primary" disabled={isSending || !email.trim()}>
          {isSending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <div className="af-divider"><span>or</span></div>

      <button
        type="button"
        className="af-btn-google"
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        <GoogleIcon />
        Continue with Google
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

        .af-form { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .af-input {
          width: 100%;
          padding: 11px 13px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-char);
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          transition: border-color 0.15s;
        }
        .af-input::placeholder { color: var(--color-char-muted); }
        .af-input:focus { border-color: var(--color-orange); }
        .af-input:disabled { opacity: 0.6; }

        .af-error { font-size: 12px; color: #dc2626; margin: 0; }

        .af-btn-primary {
          width: 100%;
          padding: 12px 16px;
          background: var(--color-orange);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          letter-spacing: 0.01em;
        }
        .af-btn-primary:hover:not(:disabled) { background: var(--color-orange-hover); }
        .af-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .af-divider {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 12px 0;
          color: var(--color-char-muted);
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
        }
        .af-divider::before,
        .af-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }

        .af-btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          width: 100%;
          padding: 11px 16px;
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

        /* "Check your email" state */
        .af-sent {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 8px 0 4px;
          gap: 10px;
        }
        .af-sent-icon { color: var(--color-orange); }
        .af-sent-title {
          font-family: var(--font-display);
          font-size: 17px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0;
        }
        .af-sent-body {
          font-size: 13px;
          color: var(--color-char-muted);
          margin: 0;
          line-height: 1.55;
        }
        .af-link-btn {
          background: none;
          border: none;
          color: var(--color-orange);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
