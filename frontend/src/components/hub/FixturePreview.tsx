// Desktop-only right panel — shows match preview for selected fixture
// Redesigned per spec: "Match Preview" label, title, date line, Quick Stats, FPL Difficulty, CTA

import type { FixtureData } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface FixturePreviewProps {
  fixture: FixtureData | null;
  gameweek?: number;
}

function DiffDot({ filled }: { filled: boolean }) {
    return (
        <span style={{
            display: 'inline-block',
            width: 8, height: 8,
            borderRadius: '50%',
            background: filled ? 'var(--color-orange)' : 'var(--color-border)',
            marginRight: 3,
        }} />
    );
}

export default function FixturePreview({ fixture, gameweek }: FixturePreviewProps) {
  const navigate = useNavigate();

  if (!fixture) {
    return (
      <div className="fp fp-empty" id="fixture-preview">
        <div className="fp-empty-inner">
          <div className="fp-empty-icon">⚽</div>
          <p className="fp-empty-hint">Select a fixture<br />to see a preview</p>
        </div>
        <style>{fpStyles}</style>
      </div>
    );
  }

  const kickoff = new Date(fixture.kickoffTime);
  const dateStr = kickoff.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const timeStr = fixture.finished ? 'FT' : kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diffRating = Math.round(((fixture.homeDifficulty || 3) + (fixture.awayDifficulty || 3)) / 2);

  return (
    <div className="fp" id="fixture-preview">
      <div className="fp-label">Match Preview</div>

      <h3 className="fp-title">{fixture.homeTeam} vs {fixture.awayTeam}</h3>
      <p className="fp-sub">
        {dateStr} · {timeStr}
        {fixture.competition ? ` · ${fixture.competition}` : ''}
      </p>

      <div className="fp-divider" />

      <div className="fp-section-label">Quick Stats</div>
      <div className="fp-stats">
        <div className="fp-stat-row">
          <span className="fp-stat-key">Home Form</span>
          <span className="fp-stat-val">W W D L W</span>
        </div>
        <div className="fp-stat-row">
          <span className="fp-stat-key">Away Form</span>
          <span className="fp-stat-val">W L W W D</span>
        </div>
        <div className="fp-stat-row">
          <span className="fp-stat-key">H2H (last 5)</span>
          <span className="fp-stat-val fp-stat-small">—</span>
        </div>
      </div>

      <div className="fp-divider" />

      <div className="fp-diff-row">
        <span className="fp-stat-key">FPL Difficulty</span>
        <span className="fp-diff-dots">
          {[1,2,3,4,5].map(i => <DiffDot key={i} filled={i <= diffRating} />)}
        </span>
      </div>

      <button
        className="fp-cta"
        onClick={() => navigate(`/chat/${fixture.id}${gameweek ? `?gw=${gameweek}` : ''}`)}
        id="preview-analyze-btn"
      >
        Analyse with Gaff3r
      </button>

      <style>{fpStyles}</style>
    </div>
  );
}

const fpStyles = `
  .fp {
    background: var(--color-beige);
    border-left: 1px solid var(--color-border);
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 0;
    height: 100%;
    overflow-y: auto;
  }
  .fp-empty {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .fp-empty-inner {
    text-align: center;
  }
  .fp-empty-icon {
    font-size: 36px;
    margin-bottom: 12px;
    opacity: 0.4;
  }
  .fp-empty-hint {
    color: var(--color-muted);
    font-size: 14px;
    font-style: italic;
    line-height: 1.5;
  }
  .fp-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-muted);
    margin-bottom: 10px;
  }
  .fp-title {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 700;
    color: var(--color-char);
    margin: 0 0 6px;
    line-height: 1.3;
  }
  .fp-sub {
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: var(--color-muted);
    margin: 0 0 16px;
  }
  .fp-divider {
    border: none;
    border-top: 1px solid var(--color-border);
    margin: 14px 0;
  }
  .fp-section-label {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    color: var(--color-char);
    margin-bottom: 10px;
  }
  .fp-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 4px;
  }
  .fp-stat-row, .fp-diff-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .fp-diff-row {
    margin-bottom: 20px;
  }
  .fp-stat-key {
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: var(--color-muted);
  }
  .fp-stat-val {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-char);
  }
  .fp-stat-small {
    color: var(--color-muted);
  }
  .fp-diff-dots {
    display: flex;
    align-items: center;
  }
  .fp-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-orange);
    color: #FFFFFF;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-top: auto;
  }
  .fp-cta:hover {
    background: var(--color-orange-hover);
    transform: translateY(-1px);
  }
`;
