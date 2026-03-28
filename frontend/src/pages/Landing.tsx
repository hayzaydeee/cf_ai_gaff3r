// Landing page — public marketing page at /
// Authenticated users are redirected to /hub

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import AuthModal from "../components/auth/AuthModal";

// ── Animation variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const chatStagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.45, delayChildren: 0.1 } },
};

// ── Count-up stat ──────────────────────────────────────────────────────────

function StatCounter({
  target,
  duration = 1400,
}: {
  target: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        function step(now: number) {
          const t = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          setValue(Math.round(eased * target));
          if (t < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, duration]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}

// ── Snapshot components ────────────────────────────────────────────────────

function MockOutcomeBar({
  home,
  draw,
  away,
}: {
  home: number;
  draw: number;
  away: number;
}) {
  return (
    <div className="mob-root">
      <div className="mob-labels">
        <span className="mob-label">
          Home <strong>{home}%</strong>
        </span>
        <span className="mob-label mob-center">
          Draw <strong>{draw}%</strong>
        </span>
        <span className="mob-label mob-right">
          Away <strong>{away}%</strong>
        </span>
      </div>
      <div className="mob-bar">
        <div className="mob-seg mob-home" style={{ width: `${home}%` }} />
        <div className="mob-seg mob-draw" style={{ width: `${draw}%` }} />
        <div className="mob-seg mob-away" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

function MockPredictionCard({
  home,
  away,
  homeScore,
  awayScore,
  confidence,
  reasoning,
}: {
  home: string;
  away: string;
  homeScore: number;
  awayScore: number;
  confidence: "low" | "medium" | "high";
  reasoning: string;
}) {
  return (
    <div className="mpc-root">
      <div className="mpc-header">
        <span className="mpc-label">Gaff3r's Pick</span>
        <span className={`mpc-conf mpc-conf-${confidence}`}>{confidence}</span>
      </div>
      <div className="mpc-score">
        <span className="mpc-team">{home}</span>
        <span className="mpc-line">
          {homeScore} – {awayScore}
        </span>
        <span className="mpc-team">{away}</span>
      </div>
      <p className="mpc-reasoning">{reasoning}</p>
    </div>
  );
}

function MockSectionCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="msc-root">
      <div className="msc-label">{label}</div>
      <div className="msc-body">{children}</div>
    </div>
  );
}

function MockUserBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="mub-root" variants={fadeUp}>
      <div className="mub-bubble">{children}</div>
    </motion.div>
  );
}

function MockAssistantBubble({ children }: { children: React.ReactNode }) {
  return (
    <motion.div className="mab-root" variants={fadeUp}>
      <div className="mab-sigil">⚽</div>
      <div className="mab-content">{children}</div>
    </motion.div>
  );
}


// ── Main component ─────────────────────────────────────────────────────────

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) navigate("/hub", { replace: true });
  }, [isAuthenticated, isLoading, navigate]);

  const openAuth = () => setAuthOpen(true);

  return (
    <div className="ld-root">
      {/* ── Nav ── */}
      <header className="ld-nav">
        <div className="ld-nav-inner">
          <a href="/" className="ld-brand-text" aria-label="gaff3r home">
            gaff<span className="ld-o">3</span>r
          </a>
          <button className="ld-nav-btn" onClick={openAuth}>
            Sign in
          </button>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="ld-hero-section">
          <div className="ld-hero-inner">
            <motion.div
              className="ld-hero-copy"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              <motion.h1 className="ld-hero-title" variants={fadeUp}>
                Football predictions,
                <br />
                backed by real maths.
              </motion.h1>
              <motion.p className="ld-hero-sub" variants={fadeUp}>
                Ask the gaffer about any Premier League fixture. Get win
                probabilities, predicted scorelines, and tactical breakdowns —
                powered by Dixon-Coles and 15,000 Monte Carlo simulations per
                match.
              </motion.p>
              <motion.div className="ld-hero-ctas" variants={fadeUp}>
                <button className="ld-btn-primary" onClick={openAuth}>
                  Ask the gaffer →
                </button>
                <a
                  href="https://github.com/adamb/cf_ai_gaff3r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ld-btn-secondary"
                >
                  View on GitHub
                </a>
              </motion.div>
            </motion.div>

            <div className="ld-hero-mock-wrap">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
              >
                <motion.div
                  className="ld-hero-mock"
                  animate={{ y: [0, -8, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 5,
                    ease: "easeInOut",
                  }}
                >
                  <div className="ld-mock-chrome">
                    <span className="ld-chrome-dot" />
                    <span className="ld-chrome-dot" />
                    <span className="ld-chrome-dot" />
                    <span className="ld-chrome-title">
                      gaff<span className="ld-o">3</span>r
                    </span>
                  </div>
                  <div className="ld-mock-body">
                    <div className="mub-root">
                      <div className="mub-bubble">
                        Who do you fancy for Arsenal vs Chelsea?
                      </div>
                    </div>
                    <div className="ld-mock-ai-row">
                      <div className="ld-mock-sigil">⚽</div>
                      <div className="ld-mock-ai-content">
                        <MockSectionCard label="The Model's View">
                          Dixon-Coles gives Arsenal the edge —{" "}
                          <strong>42% home / 28% draw / 30% away</strong> across
                          15,000 simulations.
                        </MockSectionCard>
                        <MockOutcomeBar home={42} draw={28} away={30} />
                        <MockPredictionCard
                          home="Arsenal"
                          away="Chelsea"
                          homeScore={2}
                          awayScore={1}
                          confidence="medium"
                          reasoning="Arsenal's press should create enough second-ball situations to pull clear."
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Stats strip ── */}
        <motion.section
          className="ld-stats-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="ld-stats-inner">
            <div className="ld-stat">
              <span className="ld-stat-val">
                <StatCounter target={15000} />
              </span>
              <span className="ld-stat-label">simulations per fixture</span>
            </div>
            <div className="ld-stat-divider" />
            <div className="ld-stat">
              <span className="ld-stat-val">
                <StatCounter target={38} duration={900} />
              </span>
              <span className="ld-stat-label">gameweeks tracked</span>
            </div>
            <div className="ld-stat-divider" />
            <div className="ld-stat">
              <span className="ld-stat-val">&lt;50ms</span>
              <span className="ld-stat-label">median streamed response</span>
            </div>
          </div>
        </motion.section>

        {/* ── Chat demo ── */}
        <section className="ld-demo-section">
          <motion.div
            className="ld-demo-header"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="ld-section-h2">See it in action</h2>
            <p className="ld-section-sub">
              A real conversation with the gaffer
            </p>
          </motion.div>

          <motion.div
            className="ld-demo-panel"
            variants={chatStagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <MockUserBubble>
              Who do you fancy for Arsenal vs Chelsea this weekend?
            </MockUserBubble>

            <MockAssistantBubble>
              <MockSectionCard label="The Model's View">
                Dixon-Coles gives Arsenal a narrow edge —{" "}
                <strong>42% home / 28% draw / 30% away</strong> across 15,000
                simulations. Their attack rating is the joint-highest in the
                division this season.
              </MockSectionCard>
              <MockOutcomeBar home={42} draw={28} away={30} />
              <MockSectionCard label="Key Factors">
                Arsenal's xG over the last 6 GWs: <strong>2.1</strong>. Chelsea
                have conceded in 9 of their last 11 away fixtures, and their
                defensive line sits unusually high — exploitable on the counter.
              </MockSectionCard>
              <MockPredictionCard
                home="Arsenal"
                away="Chelsea"
                homeScore={2}
                awayScore={1}
                confidence="medium"
                reasoning="Arsenal's press will create enough second-ball situations to pull away after half-time."
              />
            </MockAssistantBubble>

            <MockUserBubble>
              What about Martinelli — is he starting?
            </MockUserBubble>

            <MockAssistantBubble>
              <MockSectionCard label="Team News">
                FPL ownership and last-GW selection data point to Martinelli in
                the XI. Havertz is likely rotated — cup fixture midweek means
                Arteta will manage minutes carefully.
              </MockSectionCard>
            </MockAssistantBubble>
          </motion.div>
        </section>

        {/* ── Pipeline ── */}
        <section className="ld-pipeline-section">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="ld-pipeline-header"
          >
            <h2 className="ld-section-h2">How predictions are made</h2>
            <p className="ld-section-sub">
              Statistical rigour, not LLM guesswork
            </p>
          </motion.div>

          <motion.div
            className="ld-steps"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                n: "1",
                title: "Dixon-Coles MLE",
                body: "Attack and defence strengths fitted to the full season using maximum-likelihood estimation. Includes the Dixon-Coles low-scoring correction for 0–0 and 1–0 results.",
              },
              {
                n: "2",
                title: "xG adjustment",
                body: "Recent expected-goals data overlaid as a Bayesian prior, weighted toward the last 6 matches to capture current form without overreacting to noise.",
              },
              {
                n: "3",
                title: "Monte Carlo simulation",
                body: "15,000 match outcomes drawn from the fitted Poisson model. Produces a full scoreline probability grid and outcome percentages — not a single point estimate.",
              },
              {
                n: "4",
                title: "Claude AI interpretation",
                body: "Simulation output, FPL squad data, and fixture context passed to Claude. You get a readable, tactically-aware breakdown — not just numbers on a screen.",
              },
            ].map((step) => (
              <motion.div key={step.n} className="ld-step" variants={fadeUp}>
                <div className="ld-step-track">
                  <div className="ld-step-num">{step.n}</div>
                  <div className="ld-step-line" />
                </div>
                <div className="ld-step-content">
                  <p className="ld-step-title">{step.title}</p>
                  <p className="ld-step-body">{step.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Feature grid ── */}
        <section className="ld-features-section">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="ld-section-h2">Built for the long game</h2>
            <p className="ld-section-sub">
              Everything you need to follow a season properly
            </p>
          </motion.div>

          <motion.div
            className="ld-features"
            variants={stagger}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {[
              {
                title: "Prediction tracking",
                body: "Every prediction stored and resolved automatically after the match. See your outcome accuracy, exact score rate, streaks, and calibration across the season.",
              },
              {
                title: "FPL context built in",
                body: "Squad selections, captain choices, and ownership data from the FPL API inform every answer. Team news and rotation risk are always current.",
              },
              {
                title: "Per-fixture conversations",
                body: "Each match gets its own chat thread. Come back mid-week for injury updates, or review what the gaffer said before kick-off.",
              },
            ].map((f) => (
              <motion.div
                key={f.title}
                className="ld-feat-card"
                variants={fadeUp}
              >
                <p className="ld-feat-title">{f.title}</p>
                <p className="ld-feat-body">{f.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Studio teaser ── */}
        <motion.section
          className="ld-studio-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="ld-studio-inner">
            <div className="ld-studio-copy">
              <span className="ld-studio-badge">coming soon</span>
              <h2 className="ld-studio-title">
                gaff<span className="ld-o">3</span>r studio
              </h2>
              <p className="ld-studio-sub">
                A research assistant for football content creators. Ask any
                analytical question — get real computed data back, not LLM
                guesswork.
              </p>
              <p className="ld-studio-detail">
                Every football video, thread, or post follows the same pattern:
                define a time window, compute the metrics, find the standout
                numbers, build a narrative. Studio eliminates the 3–5 hours of
                manual research that currently precede that work — replacing
                five open browser tabs with one conversational interface.
              </p>
              <div className="ld-studio-caps">
                {(
                  [
                    {
                      label: "Text-to-SQL",
                      desc: "Natural language queries against the full football database",
                    },
                    {
                      label: "Time windows",
                      desc: "Computed metrics across any gameweek range, not just this season",
                    },
                    {
                      label: "Comparison engine",
                      desc: "Side-by-side analysis across teams, managers, players, or eras",
                    },
                    {
                      label: "Content output",
                      desc: "Talking points, script sections, exportable data cards",
                    },
                  ] as const
                ).map((c) => (
                  <div key={c.label} className="ld-studio-cap">
                    <span className="ld-studio-cap-label">{c.label}</span>
                    <span className="ld-studio-cap-desc">{c.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ld-studio-queries-col">
              <p className="ld-studio-queries-label">Example queries</p>
              {[
                '"Which team has the best away xG since Christmas?"',
                '"How did Arsenal\'s press metrics change after the back-three switch in GW12?"',
                '"Top 5 players by goal contributions per 90 in the last 6 gameweeks."',
                '"Compare Slot and Klopp\'s Liverpool — same period, different era."',
              ].map((q) => (
                <p key={q} className="ld-studio-query">
                  {q}
                </p>
              ))}
            </div>
          </div>
        </motion.section>

        {/* ── Bottom CTA ── */}
        <motion.section
          className="ld-cta-section"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <h2 className="ld-cta-title">Ready to ask the gaffer?</h2>
          <p className="ld-cta-sub">
            Free to use. Sign in to save predictions and track your accuracy.
          </p>
          <button className="ld-btn-primary" onClick={openAuth}>
            Ask the gaffer →
          </button>
        </motion.section>

        {/* ── Footer ── */}
        <footer className="ld-footer">
          <div className="ld-footer-inner">
            <div className="ld-footer-top">
              <a href="/" className="ld-brand-text" aria-label="gaff3r home">
                gaff<span className="ld-o">3</span>r
              </a>
              <nav className="ld-footer-links" aria-label="Footer links">
                <a href="mailto:hayzayd33@gmail.com" className="ld-footer-link">
                  Contact
                </a>
                <a
                  href="https://hayzaydee.me"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ld-footer-link"
                >
                  Portfolio
                </a>
                <a
                  href="https://github.com/hayzaydeee/cf_ai_gaff3r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ld-footer-link"
                >
                  GitHub
                </a>
              </nav>
            </div>
            <div className="ld-footer-bottom">
              <span>
                © {new Date().getFullYear()} hayzaydee
              </span>
            </div>
          </div>
        </footer>
      </main>

      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => navigate("/hub")}
      />

      <style>{`
        /* ── Root ── */
        .ld-root {
          min-height: 100vh;
          background: var(--color-bg);
          color: var(--color-char);
        }
        .ld-o { color: var(--color-orange); }

        /* ── Nav ── */
        .ld-nav {
          position: sticky;
          top: 0;
          z-index: 40;
          background: var(--color-cream);
          border-bottom: 1px solid var(--color-border);
        }
        .ld-nav-inner {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 32px;
          height: 52px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .ld-brand {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
        }
        .ld-brand-text {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 500;
          color: var(--color-char);
          letter-spacing: -0.3px;
        }
        .ld-nav-btn {
          padding: 7px 18px;
          background: transparent;
          color: var(--color-char);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
        }
        .ld-nav-btn:hover { background: var(--color-beige); }

        /* ── Shared buttons ── */
        .ld-btn-primary {
          padding: 12px 28px;
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
          text-decoration: none;
          display: inline-block;
        }
        .ld-btn-primary:hover { background: var(--color-orange-hover); }
        .ld-btn-secondary {
          padding: 12px 24px;
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
        .ld-btn-secondary:hover { background: var(--color-beige); color: var(--color-char); }

        /* ── Section typography ── */
        .ld-section-h2 {
          font-family: var(--font-display);
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 8px;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }
        .ld-section-sub {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--color-char-muted);
          margin: 0 0 36px;
        }

        /* ── Hero ── */
        .ld-hero-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 72px 32px 56px;
        }
        .ld-hero-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: center;
        }
        .ld-hero-copy { max-width: 480px; }
        .ld-hero-title {
          font-family: var(--font-display);
          font-size: clamp(32px, 4.5vw, 54px);
          font-weight: 700;
          line-height: 1.1;
          color: var(--color-char);
          margin: 0 0 20px;
          letter-spacing: -1px;
        }
        .ld-hero-sub {
          font-family: var(--font-body);
          font-size: 17px;
          line-height: 1.72;
          color: var(--color-char-muted);
          margin: 0 0 32px;
        }
        .ld-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }

        /* ── Hero mock panel ── */
        .ld-hero-mock-wrap { display: flex; justify-content: flex-end; }
        .ld-hero-mock {
          width: 100%;
          max-width: 440px;
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.07);
        }
        .ld-mock-chrome {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          background: var(--color-beige);
          border-bottom: 1px solid var(--color-border);
        }
        .ld-chrome-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--color-border);
          display: inline-block;
        }
        .ld-chrome-title {
          font-family: var(--font-mono);
          font-size: 11px;
          color: var(--color-char-muted);
          margin-left: auto;
        }
        .ld-mock-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .ld-mock-ai-row { display: flex; gap: 8px; align-items: flex-start; }
        .ld-mock-sigil { font-size: 14px; flex-shrink: 0; margin-top: 2px; }
        .ld-mock-ai-content { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }

        /* ── User bubble ── */
        .mub-root { display: flex; justify-content: flex-end; }
        .mub-bubble {
          background: var(--color-beige);
          border-radius: 12px 12px 3px 12px;
          padding: 9px 13px;
          max-width: 85%;
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--color-char);
          line-height: 1.5;
        }

        /* ── Assistant bubble ── */
        .mab-root { display: flex; gap: 8px; align-items: flex-start; }
        .mab-sigil { font-size: 15px; flex-shrink: 0; margin-top: 2px; }
        .mab-content { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }

        /* ── Section card ── */
        .msc-root { margin-bottom: 4px; }
        .msc-label {
          display: block;
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--color-char-muted);
          padding-bottom: 5px;
          margin-bottom: 5px;
          border-bottom: 1px solid var(--color-border);
        }
        .msc-body {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--color-char);
          line-height: 1.58;
        }

        /* ── Outcome bar ── */
        .mob-root { margin: 6px 0 8px; }
        .mob-labels {
          display: flex;
          justify-content: space-between;
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--color-char-muted);
          margin-bottom: 5px;
        }
        .mob-center { text-align: center; }
        .mob-right { text-align: right; }
        .mob-label strong { color: var(--color-char); }
        .mob-bar {
          display: flex;
          height: 5px;
          border-radius: 3px;
          overflow: hidden;
          gap: 2px;
        }
        .mob-seg { border-radius: 3px; }
        .mob-home { background: var(--color-orange); }
        .mob-draw { background: var(--color-border); }
        .mob-away { background: var(--color-char-muted); opacity: 0.45; }

        /* ── Prediction card ── */
        .mpc-root {
          border: 1px solid var(--color-border);
          border-left: 3px solid var(--color-orange);
          border-radius: var(--radius-md);
          padding: 10px 12px;
          background: var(--color-cream);
          margin-top: 4px;
        }
        .mpc-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
        .mpc-label {
          font-family: var(--font-display);
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--color-char-muted);
        }
        .mpc-conf {
          font-family: var(--font-mono);
          font-size: 9px;
          padding: 2px 7px;
          border-radius: 99px;
          border: 1px solid var(--color-border);
          color: var(--color-char-muted);
        }
        .mpc-conf-medium { color: var(--color-orange); border-color: var(--color-orange); }
        .mpc-conf-high { color: #16a34a; border-color: #16a34a; }
        .mpc-score {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 8px;
        }
        .mpc-team {
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 600;
          color: var(--color-char);
        }
        .mpc-line {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 600;
          color: var(--color-orange);
          letter-spacing: 2px;
        }
        .mpc-reasoning {
          font-family: var(--font-body);
          font-style: italic;
          font-size: 12px;
          color: var(--color-char-muted);
          margin: 0;
          line-height: 1.5;
        }

        /* ── Stats strip ── */
        .ld-stats-section {
          background: var(--color-beige);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 52px 32px;
        }
        .ld-stats-inner {
          max-width: 680px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ld-stat { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; }
        .ld-stat-val {
          font-family: var(--font-display);
          font-size: clamp(34px, 4vw, 46px);
          font-weight: 700;
          color: var(--color-orange);
          letter-spacing: -1.5px;
          line-height: 1;
        }
        .ld-stat-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.07em;
          color: var(--color-char-muted);
        }
        .ld-stat-divider {
          width: 1px;
          height: 52px;
          background: var(--color-border);
          flex-shrink: 0;
          margin: 0 40px;
        }

        /* ── Chat demo ── */
        .ld-demo-section {
          max-width: 760px;
          margin: 0 auto;
          padding: 80px 32px;
        }
        .ld-demo-header { margin-bottom: 0; }
        .ld-demo-panel {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* ── Pipeline ── */
        .ld-pipeline-section {
          background: var(--color-beige);
          border-top: 1px solid var(--color-border);
          border-bottom: 1px solid var(--color-border);
          padding: 80px 32px;
        }
        .ld-pipeline-header {
          max-width: 720px;
          margin: 0 auto;
        }
        .ld-steps {
          display: flex;
          flex-direction: column;
          max-width: 720px;
          margin: 0 auto;
        }
        .ld-step {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 20px;
          padding: 28px 0;
          border-bottom: 1px solid var(--color-border);
        }
        .ld-step:last-child { border-bottom: none; }
        .ld-step-track { display: flex; flex-direction: column; align-items: center; }
        .ld-step-num {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--color-orange);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 600;
          flex-shrink: 0;
        }
        .ld-step-line {
          width: 1px;
          flex: 1;
          background: var(--color-border);
          margin-top: 8px;
        }
        .ld-step:last-child .ld-step-line { display: none; }
        .ld-step-content { padding: 2px 0; }
        .ld-step-title {
          font-family: var(--font-display);
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 7px;
          color: var(--color-char);
        }
        .ld-step-body {
          font-family: var(--font-body);
          font-size: 15px;
          margin: 0;
          color: var(--color-char-muted);
          line-height: 1.68;
        }

        /* ── Features ── */
        .ld-features-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 80px 32px;
        }
        .ld-features {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .ld-feat-card {
          background: var(--color-cream);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          padding: 26px;
          transition: transform 0.2s ease;
        }
        .ld-feat-card:hover { transform: translateY(-3px); }
        .ld-feat-title {
          font-family: var(--font-display);
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 9px;
          color: var(--color-char);
        }
        .ld-feat-body {
          font-family: var(--font-body);
          font-size: 14px;
          margin: 0;
          color: var(--color-char-muted);
          line-height: 1.68;
        }

        /* ── Studio teaser ── */
        .ld-studio-section {
          max-width: 1080px;
          margin: 0 auto;
          padding: 80px 32px;
        }
        .ld-studio-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
          align-items: start;
        }
        .ld-studio-badge {
          display: inline-block;
          background: var(--color-beige);
          color: var(--color-char-muted);
          font-family: var(--font-mono);
          font-size: 10px;
          font-weight: 500;
          padding: 3px 12px;
          border-radius: 99px;
          margin-bottom: 14px;
          border: 1px solid var(--color-border);
          text-transform: uppercase;
          letter-spacing: 0.07em;
        }
        .ld-studio-title {
          font-family: var(--font-display);
          font-size: clamp(22px, 3vw, 30px);
          font-weight: 700;
          margin: 0 0 12px;
          color: var(--color-char);
          letter-spacing: -0.3px;
        }
        .ld-studio-sub {
          font-family: var(--font-body);
          font-size: 16px;
          color: var(--color-char);
          margin: 0 0 14px;
          line-height: 1.65;
        }
        .ld-studio-detail {
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--color-char-muted);
          margin: 0 0 28px;
          line-height: 1.7;
        }
        .ld-studio-caps {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ld-studio-cap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 12px;
          border-left: 2px solid var(--color-orange);
        }
        .ld-studio-cap-label {
          font-family: var(--font-display);
          font-size: 13px;
          font-weight: 600;
          color: var(--color-char);
        }
        .ld-studio-cap-desc {
          font-family: var(--font-body);
          font-size: 13px;
          color: var(--color-char-muted);
          line-height: 1.5;
        }
        .ld-studio-queries-col { display: flex; flex-direction: column; gap: 8px; }
        .ld-studio-queries-label {
          font-family: var(--font-display);
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.09em;
          color: var(--color-char-muted);
          margin: 0 0 4px;
        }
        .ld-studio-query {
          font-family: var(--font-mono);
          font-size: 13px;
          color: var(--color-char-muted);
          font-style: italic;
          margin: 0;
          padding: 12px 16px;
          background: var(--color-beige);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          line-height: 1.55;
        }

        /* ── Bottom CTA ── */
        .ld-cta-section {
          background: var(--color-beige);
          border-top: 1px solid var(--color-border);
          padding: 80px 32px;
          text-align: center;
        }
        .ld-cta-title {
          font-family: var(--font-display);
          font-size: clamp(24px, 3.5vw, 38px);
          font-weight: 700;
          margin: 0 0 12px;
          color: var(--color-char);
          letter-spacing: -0.5px;
        }
        .ld-cta-sub {
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--color-char-muted);
          margin: 0 0 28px;
        }

        /* ── Footer ── */
        .ld-footer {
          border-top: 1px solid var(--color-border);
          padding: 32px 32px 28px;
        }
        .ld-footer-inner {
          max-width: 1080px;
          margin: 0 auto;
        }
        .ld-footer-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .ld-footer-brand {
          display: flex;
          align-items: center;
          gap: 7px;
          text-decoration: none;
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 500;
          color: var(--color-char-muted);
          transition: color 0.15s;
        }
        .ld-footer-brand:hover { color: var(--color-char); }
        .ld-footer-links { display: flex; align-items: center; gap: 24px; }
        .ld-footer-link {
          font-family: var(--font-display);
          font-size: 13px;
          color: var(--color-char-muted);
          text-decoration: none;
          transition: color 0.15s;
        }
        .ld-footer-link:hover { color: var(--color-char); }
        .ld-footer-bottom {
          font-family: var(--font-display);
          font-size: 12px;
          color: var(--color-char-muted);
          opacity: 0.65;
        }

        /* ── Responsive ── */
        @media (max-width: 860px) {
          .ld-studio-inner { grid-template-columns: 1fr; gap: 36px; }
          .ld-hero-inner { grid-template-columns: 1fr; }
          .ld-hero-mock-wrap { display: none; }
          .ld-hero-section { padding: 52px 24px 40px; }
          .ld-features { grid-template-columns: 1fr; }
          .ld-stats-inner { flex-direction: column; gap: 28px; }
          .ld-stat-divider { width: 48px; height: 1px; margin: 0; }
        }
        @media (max-width: 600px) {
          .ld-nav-inner,
          .ld-demo-section,
          .ld-features-section,
          .ld-studio-section,
          .ld-cta-section { padding-left: 20px; padding-right: 20px; }
          .ld-pipeline-section { padding-left: 20px; padding-right: 20px; }
          .ld-stats-section { padding-left: 20px; padding-right: 20px; }
          .ld-demo-panel { padding: 18px; }
          .ld-footer { padding: 24px 20px; }
          .ld-footer-top { flex-direction: column; align-items: flex-start; gap: 16px; }
          .ld-footer-links { gap: 16px; }
        }
      `}</style>
    </div>
  );
}
