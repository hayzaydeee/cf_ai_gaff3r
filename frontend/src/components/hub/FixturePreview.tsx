// Desktop-only fixture preview panel (right side of Hub)

import type { FixtureData } from '../../services/api';
import { useNavigate } from 'react-router-dom';

interface FixturePreviewProps {
  fixture: FixtureData | null;
  gameweek?: number;
}

export default function FixturePreview({ fixture, gameweek }: FixturePreviewProps) {
  const navigate = useNavigate();

  if (!fixture) {
    return (
      <div className="fixture-preview fixture-preview-empty" id="fixture-preview">
        <p className="preview-hint">Select a fixture to see details</p>
        <style>{previewStyles}</style>
      </div>
    );
  }

  const kickoff = new Date(fixture.kickoffTime);

  return (
    <div className="fixture-preview" id="fixture-preview">
      <div className="preview-comp">{fixture.competition}</div>

      <div className="preview-matchup">
        <div className="preview-team">
          <span className="preview-team-name">{fixture.homeTeam}</span>
          {fixture.homeDifficulty > 0 && (
            <span className="preview-fdr">FDR: {fixture.homeDifficulty}/5</span>
          )}
        </div>
        <span className="preview-vs">vs</span>
        <div className="preview-team">
          <span className="preview-team-name">{fixture.awayTeam}</span>
          {fixture.awayDifficulty > 0 && (
            <span className="preview-fdr">FDR: {fixture.awayDifficulty}/5</span>
          )}
        </div>
      </div>

      <div className="preview-details">
        <div className="preview-detail">
          <span className="preview-detail-label">Kickoff</span>
          <span className="preview-detail-value">
            {kickoff.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
            {' • '}
            {kickoff.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      <button
        className="preview-cta"
        onClick={() => navigate(`/chat/${fixture.id}${gameweek ? `?gw=${gameweek}` : ''}`)}
        id="preview-analyze-btn"
      >
        ⚽ Ask the Gaffer
      </button>

      <style>{previewStyles}</style>
    </div>
  );
}

const previewStyles = `
  .fixture-preview {
    background: var(--color-beige);
    border-radius: var(--radius-lg);
    padding: 24px;
    position: sticky;
    top: 24px;
  }
  .fixture-preview-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 200px;
  }
  .preview-hint {
    color: var(--color-char-muted);
    font-style: italic;
    font-size: 16px;
  }
  .preview-comp {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--color-orange);
    margin-bottom: 16px;
  }
  .preview-matchup {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-bottom: 20px;
  }
  .preview-team {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    flex: 1;
  }
  .preview-team-name {
    font-family: var(--font-display);
    font-size: 18px;
    font-weight: 800;
    text-align: center;
  }
  .preview-vs {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 600;
    color: var(--color-char-muted);
  }
  .preview-fdr {
    font-family: var(--font-display);
    font-size: 12px;
    font-weight: 600;
    color: var(--color-char-light);
  }
  .preview-details {
    border-top: 1px solid var(--color-cream);
    padding-top: 16px;
    margin-bottom: 20px;
  }
  .preview-detail {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .preview-detail-label {
    font-family: var(--font-display);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-char-muted);
  }
  .preview-detail-value {
    font-size: 15px;
    color: var(--color-char);
  }
  .preview-cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-orange);
    color: white;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    cursor: pointer;
    transition: all var(--transition-fast);
  }
  .preview-cta:hover {
    background: var(--color-orange-hover);
    transform: translateY(-1px);
  }
`;
