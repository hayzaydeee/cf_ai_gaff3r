// Hub page — 3-column layout (sidebar via Layout | fixture grid | right preview panel)
// Spec: gwHeader with ← Gameweek N → title, fixture card grid, right preview panel

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { useChat } from '../hooks/useChat';
import { getFixtures, type FixtureData } from '../services/api';
import FixtureCard from '../components/hub/FixtureCard';
import FixturePreview from '../components/hub/FixturePreview';

export default function Hub() {
  const navigate = useNavigate();
  const { currentGw, loading: gwLoading } = useGameweek();
  const [selectedGw, setSelectedGw] = useState<number | null>(null);
  const [fixtures, setFixtures] = useState<FixtureData[]>([]);
  const [fixturesLoading, setFixturesLoading] = useState(false);
  const [selectedFixture, setSelectedFixture] = useState<FixtureData | null>(null);

  const { chattedFixtureIds } = useChat(selectedGw);

  useEffect(() => {
    if (currentGw && !selectedGw) setSelectedGw(currentGw);
  }, [currentGw, selectedGw]);

  useEffect(() => {
    if (!selectedGw) return;
    let cancelled = false;
    setFixturesLoading(true);
    setSelectedFixture(null);
    getFixtures(selectedGw)
      .then(d => { if (!cancelled) setFixtures(d.fixtures); })
      .catch(() => { if (!cancelled) setFixtures([]); })
      .finally(() => { if (!cancelled) setFixturesLoading(false); });
    return () => { cancelled = true; };
  }, [selectedGw]);

  const handleFixtureClick = (fixture: FixtureData) => {
    setSelectedFixture(prev => prev?.id === fixture.id ? null : fixture);
  };

  const handleAnalyse = (fixture: FixtureData) => {
    navigate(`/chat/${fixture.id}?gw=${selectedGw}`);
  };

  // ── Loading ──
  if (gwLoading || !selectedGw) {
    return (
      <div className="hub-loading" id="hub-page">
        <div className="spinner" />
        <style>{hubStyles}</style>
      </div>
    );
  }

  const hasFixtures = fixtures.length > 0;

  return (
    <div className="hub-root" id="hub-page">
      {/* ── Centre column: GW header + fixture grid ── */}
      <div className="hub-main">
        {/* GW selector bar */}
        <div className="hub-gw-bar">
          <button
            className="hub-gw-arrow"
            onClick={() => setSelectedGw(g => Math.max(1, (g ?? 1) - 1))}
            aria-label="Previous gameweek"
          >←</button>
          <div className="hub-gw-center">
            <span className="hub-gw-title">Gameweek {selectedGw}</span>
            <span className="hub-gw-sub">Premier League · 2024/25</span>
          </div>
          <button
            className="hub-gw-arrow"
            onClick={() => setSelectedGw(g => (g ?? 1) + 1)}
            aria-label="Next gameweek"
          >→</button>
        </div>

        {/* Fixture area */}
        <div className="hub-fixture-area">
          {fixturesLoading ? (
            <div className="hub-fixture-grid">
              {[1,2,3,4,5,6].map(i => <div key={i} className="skeleton fc-skeleton" />)}
            </div>
          ) : !hasFixtures ? (
            <HubEmptyState onOpenChat={() => navigate('/chat')} />
          ) : (
            <div className="hub-fixture-grid">
              {fixtures.map(f => (
                <FixtureCard
                  key={f.id}
                  fixture={f}
                  isSelected={selectedFixture?.id === f.id}
                  hasChatted={chattedFixtureIds.has(f.id)}
                  onClick={() => handleFixtureClick(f)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel: fixture preview ── */}
      <div className="hub-right">
        <FixturePreview
          fixture={selectedFixture}
          gameweek={selectedGw}
        />
      </div>

      <style>{hubStyles}</style>
    </div>
  );
}

// ── Empty state ──
function HubEmptyState({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <div className="hub-empty">
      <h2 className="hub-empty-title">Welcome to Gaff3r</h2>
      <p className="hub-empty-desc">
        Fixtures for this gameweek are loading. Pick a match and ask the Gaffer for his take.
      </p>
      <div className="hub-empty-actions">
        <button className="hub-empty-btn-primary" onClick={onOpenChat}>Open Chat</button>
      </div>

      {/* How it works */}
      <div className="hub-how">
        <div className="hub-how-label">How it works</div>
        <div className="hub-how-steps">
          {[
            { n: '1', t: 'Pick a fixture', d: 'Browse upcoming matches by gameweek across all major leagues.' },
            { n: '2', t: 'Ask the Gaffer', d: 'Get data-backed analysis with real stats — injuries, form, xG, strength ratings and more.' },
            { n: '3', t: 'Track your record', d: 'Every prediction is stored. See your accuracy improve week over week.' },
          ].map(s => (
            <div key={s.n} className="hub-how-step">
              <div className="hub-how-num">{s.n}</div>
              <div>
                <div className="hub-how-step-title">{s.t}</div>
                <div className="hub-how-step-desc">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const hubStyles = `
  /* ── Full-bleed layout root (desktop) ── */
  .hub-root {
    display: flex;
    min-height: 100vh;
  }
  .hub-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    border-right: 1px solid var(--color-border);
  }

  /* Loading */
  .hub-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }

  /* ── GW bar ── */
  .hub-gw-bar {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 28px;
    height: 72px;
    border-bottom: 1px solid var(--color-border);
    background: var(--color-cream);
    flex-shrink: 0;
  }
  .hub-gw-arrow {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-beige);
    color: var(--color-char);
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all var(--transition-fast);
  }
  .hub-gw-arrow:hover { background: var(--color-beige-hover); }
  .hub-gw-center {
    display: flex;
    align-items: baseline;
    gap: 12px;
    flex: 1;
  }
  .hub-gw-title {
    font-family: var(--font-display);
    font-size: 22px;
    font-weight: 700;
    color: var(--color-char);
  }
  .hub-gw-sub {
    font-family: var(--font-display);
    font-size: 13px;
    color: var(--color-muted);
  }

  /* ── Fixture area ── */
  .hub-fixture-area {
    flex: 1;
    padding: 20px 24px;
    overflow-y: auto;
  }
  .hub-fixture-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
  }
  @media (min-width: 600px) {
    .hub-fixture-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 900px) {
    .hub-fixture-grid { grid-template-columns: repeat(3, 1fr); }
  }
  .fc-skeleton { height: 120px; border-radius: var(--radius-md); }

  /* ── Right panel ── */
  .hub-right {
    display: none;
    width: 300px;
    flex-shrink: 0;
  }
  @media (min-width: 1200px) {
    .hub-right { display: flex; }
  }

  /* ── Mobile/tablet inner padding ── */
  @media (max-width: 1199px) {
    .hub-root {
      flex-direction: column;
      min-height: unset;
    }
    .hub-main { border-right: none; }
    .hub-gw-bar {
      padding: 0 16px;
      height: 60px;
    }
    .hub-gw-title { font-size: 18px; }
    .hub-fixture-area { padding: 14px 16px; }
  }

  /* ── Empty state ── */
  .hub-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 60px 24px 40px;
    max-width: 480px;
    margin: 0 auto;
    gap: 16px;
  }
  .hub-empty-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 700;
    color: var(--color-char);
    margin: 0;
  }
  .hub-empty-desc {
    font-family: 'EB Garamond', serif;
    font-size: 16px;
    color: var(--color-muted);
    margin: 0;
    line-height: 1.6;
  }
  .hub-empty-actions { display: flex; gap: 12px; }
  .hub-empty-btn-primary {
    padding: 10px 24px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-orange);
    color: #FFF;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .hub-empty-btn-primary:hover { background: var(--color-orange-hover); }

  /* How it works */
  .hub-how {
    width: 100%;
    text-align: left;
    margin-top: 24px;
  }
  .hub-how-label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: var(--color-muted);
    margin-bottom: 14px;
    text-align: center;
  }
  .hub-how-steps {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .hub-how-step {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }
  .hub-how-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-orange);
    color: #FFF;
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .hub-how-step-title {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 600;
    color: var(--color-char);
    margin-bottom: 2px;
  }
  .hub-how-step-desc {
    font-family: 'EB Garamond', serif;
    font-size: 14px;
    color: var(--color-muted);
    line-height: 1.4;
  }
`;
