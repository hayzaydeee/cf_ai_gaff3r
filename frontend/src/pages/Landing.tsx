// Landing page — public marketing page at /
// Authenticated users are redirected to /hub

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AuthModal from '../components/auth/AuthModal';

function GaffLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="16" cy="16" r="15" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="6" fill="none" stroke="var(--color-orange)" strokeWidth="1" />
      <line x1="16" y1="1" x2="16" y2="31" stroke="var(--color-orange)" strokeWidth="0.75" opacity="0.5" />
      <circle cx="16" cy="16" r="1.5" fill="var(--color-orange)" />
    </svg>
  );
}

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  // Redirect authenticated users straight to the app
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/hub', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  function openAuth() { setAuthOpen(true); }
  function closeAuth() { setAuthOpen(false); }
  function onAuthSuccess() { navigate('/hub'); }

  return (
    <div className="ld-root">
      {/* ── Top nav ── */}
      <header className="ld-nav">
        <div className="ld-nav-inner">
          <a href="/" className="ld-brand" aria-label="gaff3r home">
            <GaffLogo size={22} />
            <span className="ld-brand-text">gaff<span className="ld-brand-3">3</span>r</span>
          </a>
          <button className="ld-signin-btn" onClick={openAuth}>Sign in</button>
        </div>
      </header>

      <main className="ld-main">
        {/* ── Hero ── */}
        <section className="ld-hero">
          <h1 className="ld-hero-title">
            Football predictions backed<br className="ld-br" /> by real statistical models
          </h1>
          <p className="ld-hero-sub">
            Not LLM guesswork. Dixon-Coles estimates team strengths from historical data.
            Monte Carlo runs 15,000 simulations. The AI explains what the numbers mean.
          </p>
          <div className="ld-hero-ctas">
            <button className="ld-cta-primary" onClick={openAuth}>Ask the gaffer</button>
            <a
              href="https://github.com/adamb/cf_ai_gaff3r"
              target="_blank"
              rel="noopener noreferrer"
              className="ld-cta-secondary"
            >
              View on GitHub
            </a>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <div className="ld-stats">
          <div className="ld-stat">
            <span className="ld-stat-val">15,000</span>
            <span className="ld-stat-label">Simulations per prediction</span>
          </div>
          <div className="ld-stat">
            <span className="ld-stat-val">50ms</span>
            <span className="ld-stat-label">Model computation time</span>
          </div>
          <div className="ld-stat">
            <span className="ld-stat-val">38</span>
            <span className="ld-stat-label">Gameweeks of logged data</span>
          </div>
        </div>

        {/* ── Chat mockup ── */}
        <div className="ld-mock">
          <div className="ld-mock-header">
            <div className="ld-mock-brand">
              <GaffLogo size={14} />
              <span className="ld-mock-brand-text">gaff<span className="ld-brand-3">3</span>r</span>
            </div>
            <span className="ld-mock-accuracy">accuracy: 54%</span>
          </div>

          <div className="ld-mock-user">
            <p>What about Arsenal vs Chelsea this weekend?</p>
          </div>

          <div className="ld-mock-ai">
            <p className="ld-mock-ai-text">
              Arsenal at home against Chelsea? I fancy the Gunners here. Saka's in brilliant form
              (7.3 FPL form, 0.45 xG/90) and Chelsea's away defence has been leaking. The model agrees…
            </p>
            <div className="ld-pred-card">
              <div className="ld-pred-teams">
                <span className="ld-pred-team">Arsenal</span>
                <span className="ld-pred-score">2 – 1</span>
                <span className="ld-pred-team">Chelsea</span>
              </div>
              <div className="ld-pred-probs">
                <span>Home 58%</span>
                <span>Draw 22%</span>
                <span>Away 20%</span>
              </div>
              <div className="ld-pred-bar">
                <div style={{ width: '58%' }} className="ld-pred-bar-home" />
                <div style={{ width: '22%' }} className="ld-pred-bar-draw" />
                <div style={{ width: '20%' }} className="ld-pred-bar-away" />
              </div>
            </div>
            <p className="ld-mock-caveat">
              Where I could be wrong: Chelsea's counter has been lethal away this month, and the
              model doesn't fully weight that tactical dimension.
            </p>
          </div>

          <div className="ld-mock-chips">
            {['Man City vs Liverpool', 'Spurs vs Man Utd', 'Barca vs Real Madrid'].map(f => (
              <button key={f} className="ld-mock-chip" onClick={openAuth}>{f}</button>
            ))}
          </div>
        </div>

        {/* ── How predictions work ── */}
        <section className="ld-pipeline">
          <h2 className="ld-section-title">How predictions work</h2>
          <div className="ld-steps">
            {[
              {
                n: '1',
                title: 'Learn team strengths',
                body: 'Dixon-Coles MLE estimates attack and defence parameters for every team from historical results. Updated weekly.',
              },
              {
                n: '2',
                title: 'Compute expected goals',
                body: 'Your attack vs their defence, adjusted for home advantage, injuries, and form. Real interaction, not vibes.',
              },
              {
                n: '3',
                title: 'Simulate 15,000 matches',
                body: 'Monte Carlo draws random goals from probability distributions. Produces real win/draw/loss percentages and scoreline probabilities.',
              },
              {
                n: '4',
                title: 'The gaffer explains',
                body: 'Llama 3.3 narrates the model outputs using FPL data: player form, injuries, xG, set pieces. The model computes. The AI explains.',
              },
            ].map((step, i) => (
              <div key={step.n} className={`ld-step${i === 0 ? ' ld-step-first' : i === 3 ? ' ld-step-last' : ''}`}>
                <div className="ld-step-num">{step.n}</div>
                <div>
                  <p className="ld-step-title">{step.title}</p>
                  <p className="ld-step-body">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Feature cards ── */}
        <div className="ld-features">
          {[
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="1" y="3" width="5" height="14" rx="1" fill="var(--color-orange)" opacity="0.3" />
                  <rect x="7.5" y="6" width="5" height="11" rx="1" fill="var(--color-orange)" opacity="0.55" />
                  <rect x="14" y="1" width="5" height="16" rx="1" fill="var(--color-orange)" />
                </svg>
              ),
              title: 'Accuracy tracking',
              body: 'Every prediction stored and resolved. See your outcome accuracy, exact score rate, streaks, and confidence calibration.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <circle cx="10" cy="10" r="8" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" />
                  <path d="M10 4 L10 10 L14 12" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              ),
              title: 'Data logged weekly',
              body: 'FPL player form, injuries, team strength, and fixture results captured every gameweek. A dataset no external API provides.',
            },
            {
              icon: (
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <rect x="2" y="2" width="16" height="16" rx="3" fill="none" stroke="var(--color-orange)" strokeWidth="1.5" />
                  <line x1="2" y1="7" x2="18" y2="7" stroke="var(--color-orange)" strokeWidth="1" opacity="0.4" />
                  <line x1="7" y1="7" x2="7" y2="18" stroke="var(--color-orange)" strokeWidth="1" opacity="0.4" />
                </svg>
              ),
              title: 'Full league coverage',
              body: 'Premier League with FPL-enriched data. La Liga, Bundesliga, Serie A, Ligue 1, and Champions League via football-data.org.',
            },
          ].map(f => (
            <div key={f.title} className="ld-feat-card">
              <div className="ld-feat-icon">{f.icon}</div>
              <p className="ld-feat-title">{f.title}</p>
              <p className="ld-feat-body">{f.body}</p>
            </div>
          ))}
        </div>

        {/* ── Studio teaser ── */}
        <div className="ld-studio">
          <span className="ld-studio-badge">coming soon</span>
          <h2 className="ld-studio-title">gaff<span className="ld-brand-3">3</span>r studio</h2>
          <p className="ld-studio-sub">
            General-purpose football analysis research. Ask any question across any time window
            and get real computed data back. Built for content creators, powered by the longitudinal
            dataset Gaff3r accumulates every week.
          </p>
          <div className="ld-studio-grid">
            {[
              { title: 'Text-to-SQL queries', sub: '"Best away xG since Christmas?"' },
              { title: 'Analysis templates', sub: '8 pre-built + custom frameworks' },
              { title: 'Comparison engine', sub: 'Manager vs manager, era vs era' },
              { title: 'Exportable data cards', sub: 'Stat graphics for videos and socials' },
            ].map(s => (
              <div key={s.title} className="ld-studio-item">
                <p className="ld-studio-item-title">{s.title}</p>
                <p className="ld-studio-item-sub">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tech strip ── */}
        <div className="ld-tech">
          {[
            { label: 'Stack', value: 'Cloudflare Workers, Pages, D1, Durable Objects' },
            { label: 'Model', value: 'Dixon-Coles + Monte Carlo + Llama 3.3' },
            { label: 'Data', value: 'FPL API, football-data.org, Club Elo' },
            { label: 'Frontend', value: 'React, TypeScript, Vite' },
          ].map(t => (
            <div key={t.label} className="ld-tech-item">
              <span className="ld-tech-label">{t.label}</span>
              <span className="ld-tech-value">{t.value}</span>
            </div>
          ))}
        </div>

        {/* ── Bottom CTA ── */}
        <section className="ld-cta-section">
          <h2 className="ld-cta-title">Ask the gaffer</h2>
          <p className="ld-cta-sub">Real probabilities. Real data. Real opinions.</p>
          <button className="ld-cta-primary" onClick={openAuth}>Start chatting</button>
        </section>

        {/* ── Footer ── */}
        <footer className="ld-footer">
          <span className="ld-footer-brand">gaff<span className="ld-brand-3">3</span>r</span>
          <span className="ld-footer-sub">Built on Cloudflare's edge</span>
        </footer>
      </main>

      <AuthModal isOpen={authOpen} onClose={closeAuth} onSuccess={onAuthSuccess} />

      <style>{`
        .ld-root {
          min-height: 100vh;
          background: var(--color-bg);
          color: var(--color-char);
        }
        .ld-brand-3 { color: var(--color-orange); }

        /* ── Nav ── */
        .ld-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--color-cream);
          border-bottom: 1px solid var(--color-border);
        }
        .ld-nav-inner {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ld-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
        }
        .ld-brand-text {
          font-family: var(--font-mono);
          font-size: 16px;
          font-weight: 500;
          color: var(--color-char);
          letter-spacing: -0.3px;
        }
        .ld-signin-btn {
          padding: 7px 16px;
          background: var(--color-orange);
          color: #fff;
          border: none;
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ld-signin-btn:hover { background: var(--color-orange-hover); }

        /* ── Main content ── */
        .ld-main {
          max-width: 760px;
          margin: 0 auto;
          padding: 0 24px 48px;
        }

        /* ── Hero ── */
        .ld-hero {
          padding: 52px 0 40px;
          text-align: center;
        }
        .ld-hero-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 4vw, 36px);
          font-weight: 700;
          line-height: 1.2;
          color: var(--color-char);
          margin: 0 0 16px;
          letter-spacing: -0.5px;
        }
        .ld-br { display: inline; }
        .ld-hero-sub {
          font-size: 15px;
          line-height: 1.65;
          color: var(--color-char-muted);
          max-width: 520px;
          margin: 0 auto 28px;
        }
        .ld-hero-ctas {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .ld-cta-primary {
          padding: 11px 28px;
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
        .ld-cta-primary:hover { background: var(--color-orange-hover); }
        .ld-cta-secondary {
          padding: 11px 24px;
          background: transparent;
          color: var(--color-char-muted);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: background 0.15s, color 0.15s;
          display: inline-block;
        }
        .ld-cta-secondary:hover { background: var(--color-beige); color: var(--color-char); }

        /* ── Stats ── */
        .ld-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .ld-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 18px 12px;
          background: var(--color-beige);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-border);
          text-align: center;
        }
        .ld-stat-val {
          font-family: var(--font-mono);
          font-size: 22px;
          font-weight: 500;
          color: var(--color-orange);
          letter-spacing: -0.5px;
        }
        .ld-stat-label {
          font-size: 11px;
          color: var(--color-char-muted);
          line-height: 1.3;
        }

        /* ── Chat mockup ── */
        .ld-mock {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 18px;
          margin-bottom: 28px;
        }
        .ld-mock-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--color-border);
        }
        .ld-mock-brand {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .ld-mock-brand-text {
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 500;
          color: var(--color-char);
        }
        .ld-mock-accuracy {
          margin-left: auto;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-char-muted);
        }

        .ld-mock-user {
          background: var(--color-beige);
          border-radius: 12px 12px 4px 12px;
          padding: 10px 14px;
          margin-bottom: 10px;
          margin-left: 35%;
          max-width: 65%;
        }
        .ld-mock-user p { font-size: 13px; margin: 0; color: var(--color-char); }

        .ld-mock-ai {
          background: var(--color-bg);
          border: 1px solid var(--color-border);
          border-radius: 12px 12px 12px 4px;
          padding: 12px 14px;
          margin-bottom: 12px;
          max-width: 85%;
        }
        .ld-mock-ai-text { font-size: 13px; margin: 0 0 10px; color: var(--color-char); line-height: 1.6; }
        .ld-mock-caveat { font-size: 12px; margin: 8px 0 0; color: var(--color-char-muted); line-height: 1.5; }

        /* Prediction card inside mock */
        .ld-pred-card {
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          padding: 12px;
          margin-bottom: 4px;
          background: var(--color-cream);
        }
        .ld-pred-teams {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 14px;
          margin-bottom: 8px;
        }
        .ld-pred-team { font-size: 13px; font-weight: 600; color: var(--color-char); }
        .ld-pred-score {
          font-family: var(--font-mono);
          font-size: 24px;
          font-weight: 500;
          color: var(--color-orange);
          letter-spacing: 2px;
        }
        .ld-pred-probs {
          display: flex;
          justify-content: center;
          gap: 14px;
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-char-muted);
          margin-bottom: 8px;
        }
        .ld-pred-bar {
          display: flex;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
          gap: 2px;
        }
        .ld-pred-bar-home { background: var(--color-orange); border-radius: 2px; }
        .ld-pred-bar-draw { background: var(--color-beige-hover); border-radius: 2px; }
        .ld-pred-bar-away { background: var(--color-border); border-radius: 2px; }

        /* Fixture chips */
        .ld-mock-chips {
          display: flex;
          gap: 6px;
          overflow-x: auto;
          padding: 4px 0;
          scrollbar-width: none;
        }
        .ld-mock-chips::-webkit-scrollbar { display: none; }
        .ld-mock-chip {
          flex-shrink: 0;
          padding: 5px 12px;
          border-radius: 99px;
          border: 1px solid var(--color-border);
          background: transparent;
          font-size: 11px;
          color: var(--color-char-muted);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
          white-space: nowrap;
          font-family: inherit;
        }
        .ld-mock-chip:hover { background: var(--color-beige); color: var(--color-char); }

        /* ── Section title ── */
        .ld-section-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          color: var(--color-char);
          margin: 0 0 14px;
        }

        /* ── Pipeline steps ── */
        .ld-pipeline { margin-bottom: 28px; }
        .ld-steps { display: flex; flex-direction: column; }
        .ld-step {
          display: grid;
          grid-template-columns: 36px 1fr;
          gap: 12px;
          align-items: start;
          padding: 14px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-top: none;
        }
        .ld-step:first-child, .ld-step-first {
          border-top: 1px solid var(--color-border);
          border-radius: var(--radius-md) var(--radius-md) 0 0;
        }
        .ld-step-last { border-radius: 0 0 var(--radius-md) var(--radius-md); }
        .ld-step-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--color-orange);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .ld-step-title { font-size: 14px; font-weight: 600; margin: 0 0 3px; color: var(--color-char); }
        .ld-step-body { font-size: 12px; margin: 0; color: var(--color-char-muted); line-height: 1.55; }

        /* ── Feature cards ── */
        .ld-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 28px;
        }
        .ld-feat-card {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 16px;
        }
        .ld-feat-icon { margin-bottom: 10px; }
        .ld-feat-title { font-size: 13px; font-weight: 600; margin: 0 0 5px; color: var(--color-char); }
        .ld-feat-body { font-size: 12px; margin: 0; color: var(--color-char-muted); line-height: 1.55; }

        /* ── Studio teaser ── */
        .ld-studio {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 28px 24px;
          margin-bottom: 28px;
          text-align: center;
        }
        .ld-studio-badge {
          display: inline-block;
          background: var(--color-beige);
          color: var(--color-char-muted);
          font-family: var(--font-mono);
          font-size: 11px;
          font-weight: 500;
          padding: 3px 12px;
          border-radius: 99px;
          margin-bottom: 12px;
          border: 1px solid var(--color-border);
        }
        .ld-studio-title {
          font-family: var(--font-display);
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--color-char);
        }
        .ld-studio-sub {
          font-size: 13px;
          color: var(--color-char-muted);
          max-width: 460px;
          margin: 0 auto 20px;
          line-height: 1.6;
        }
        .ld-studio-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          max-width: 480px;
          margin: 0 auto;
          text-align: left;
        }
        .ld-studio-item {
          padding: 10px 12px;
          background: var(--color-beige);
          border-radius: var(--radius-md);
        }
        .ld-studio-item-title { font-size: 13px; font-weight: 600; margin: 0 0 2px; color: var(--color-char); }
        .ld-studio-item-sub { font-size: 11px; margin: 0; color: var(--color-char-muted); }

        /* ── Tech strip ── */
        .ld-tech {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 40px;
        }
        .ld-tech-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 12px;
          background: var(--color-beige);
          border-radius: var(--radius-md);
          text-align: center;
        }
        .ld-tech-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-char-muted);
          letter-spacing: 0.05em;
        }
        .ld-tech-value { font-size: 11px; color: var(--color-char-muted); line-height: 1.4; }

        /* ── Bottom CTA ── */
        .ld-cta-section {
          background: var(--color-beige);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          padding: 36px 24px;
          text-align: center;
          margin-bottom: 32px;
        }
        .ld-cta-title {
          font-family: var(--font-display);
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--color-char);
        }
        .ld-cta-sub {
          font-size: 14px;
          color: var(--color-char-muted);
          margin: 0 0 20px;
        }

        /* ── Footer ── */
        .ld-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 8px 0 24px;
          flex-wrap: wrap;
        }
        .ld-footer-brand {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-char-muted);
        }
        .ld-footer-sub { font-size: 12px; color: var(--color-char-muted); }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .ld-hero { padding: 36px 0 28px; }
          .ld-stats { grid-template-columns: repeat(3, 1fr); gap: 8px; }
          .ld-stat-val { font-size: 18px; }
          .ld-features { grid-template-columns: 1fr; }
          .ld-tech { grid-template-columns: repeat(2, 1fr); }
          .ld-studio-grid { grid-template-columns: 1fr; }
          .ld-mock-user { margin-left: 20%; max-width: 80%; }
          .ld-br { display: none; }
        }
      `}</style>
    </div>
  );
}
