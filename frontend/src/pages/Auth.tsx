// Auth page — magic link + Google OAuth
// Accessible at /auth — also rendered inside AuthModal

import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthFormProps {
  onSuccess?: () => void;
}

export function AuthForm({ onSuccess }: AuthFormProps) {
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
      <div className="auth-sent">
        <div className="auth-sent-icon">✉️</div>
        <h3 className="auth-sent-title">Check your email</h3>
        <p className="auth-sent-body">
          We sent a sign-in link to <strong>{email}</strong>.<br />
          Click the link to sign in — it expires in 15 minutes.
        </p>
        <button className="auth-link-btn" onClick={() => setMagicLinkSent(false)}>
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <form onSubmit={handleMagicLink} className="auth-magic-form">
        <label className="auth-label" htmlFor="auth-email">Email address</label>
        <input
          id="auth-email"
          type="email"
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoFocus
          disabled={isSending}
        />
        {error && <p className="auth-error">{error}</p>}
        <button type="submit" className="auth-btn-primary" disabled={isSending || !email.trim()}>
          {isSending ? 'Sending…' : 'Send magic link'}
        </button>
      </form>

      <div className="auth-divider">
        <span>or</span>
      </div>

      <button
        type="button"
        className="auth-btn-google"
        onClick={signInWithGoogle}
        disabled={isLoading}
      >
        <GoogleIcon />
        Continue with Google
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function AuthPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">gaff3r</span>
          <h2 className="auth-title">Sign in</h2>
          <p className="auth-subtitle">Save your predictions across devices</p>
        </div>
        <AuthForm />
      </div>

      <style>{`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
        }
        .auth-header { margin-bottom: 28px; text-align: center; }
        .auth-logo {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 24px;
          color: var(--color-orange);
          display: block;
          margin-bottom: 12px;
        }
        .auth-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 6px;
        }
        .auth-subtitle { font-size: 14px; color: var(--color-char-muted); margin: 0; }
        .auth-form { display: flex; flex-direction: column; gap: 12px; }
        .auth-magic-form { display: flex; flex-direction: column; gap: 10px; }
        .auth-label { font-size: 13px; font-weight: 600; color: var(--color-char); }
        .auth-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          background: var(--color-bg);
          color: var(--color-char);
          font-size: 15px;
          outline: none;
          box-sizing: border-box;
          transition: border-color var(--transition-fast);
        }
        .auth-input:focus { border-color: var(--color-orange); }
        .auth-error { font-size: 13px; color: #dc2626; margin: 0; }
        .auth-btn-primary {
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
        .auth-btn-primary:hover:not(:disabled) { background: var(--color-orange-hover); }
        .auth-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--color-char-muted);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-border);
        }
        .auth-btn-google {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 11px 16px;
          background: var(--color-cream);
          color: var(--color-char);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background var(--transition-fast);
          width: 100%;
        }
        .auth-btn-google:hover:not(:disabled) { background: var(--color-beige); }
        .auth-btn-google:disabled { opacity: 0.6; cursor: not-allowed; }
        .auth-sent { text-align: center; padding: 8px 0; }
        .auth-sent-icon { font-size: 40px; margin-bottom: 12px; }
        .auth-sent-title {
          font-family: var(--font-display);
          font-size: 18px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--color-char);
        }
        .auth-sent-body { font-size: 14px; color: var(--color-char-muted); margin: 0 0 16px; line-height: 1.5; }
        .auth-link-btn {
          background: none;
          border: none;
          color: var(--color-orange);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
