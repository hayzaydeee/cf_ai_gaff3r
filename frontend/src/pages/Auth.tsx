// Auth page — standalone sign-in page at /auth
// The auth form logic lives in components/auth/AuthForm.tsx

import AuthForm from '../components/auth/AuthForm';

export default function AuthPage() {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <AuthForm />
      </div>

      <style>{`
        .auth-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
          background: var(--color-bg);
        }
        .auth-card {
          width: 100%;
          max-width: 400px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 32px;
          box-shadow: 0 4px 16px rgba(36, 27, 22, 0.08);
        }
      `}</style>
    </div>
  );
}
