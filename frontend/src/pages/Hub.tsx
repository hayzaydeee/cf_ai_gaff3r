// Gameweek Hub page
// Landing page — gameweek-organized view of all fixtures

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameweek } from '../hooks/useGameweek';
import { getFixtures, type FixtureData } from '../services/api';
import FixtureCard from '../components/hub/FixtureCard';
import GwSelector from '../components/hub/GwSelector';
import FixturePreview from '../components/hub/FixturePreview';

export default function Hub() {
    const navigate = useNavigate();
    const { currentGw, loading: gwLoading } = useGameweek();
    const [selectedGw, setSelectedGw] = useState<number | null>(null);
    const [fixtures, setFixtures] = useState<FixtureData[]>([]);
    const [fixturesLoading, setFixturesLoading] = useState(false);
    const [selectedFixture, setSelectedFixture] = useState<FixtureData | null>(null);

    // Set initial GW when loaded
    useEffect(() => {
        if (currentGw && !selectedGw) {
            setSelectedGw(currentGw);
        }
    }, [currentGw, selectedGw]);

    // Fetch fixtures when GW changes
    useEffect(() => {
        if (!selectedGw) return;
        let cancelled = false;

        async function load() {
            setFixturesLoading(true);
            try {
                const data = await getFixtures(selectedGw!);
                if (!cancelled) {
                    setFixtures(data.fixtures);
                    setSelectedFixture(null);
                }
            } catch (err) {
                console.error('Failed to load fixtures:', err);
                if (!cancelled) setFixtures([]);
            } finally {
                if (!cancelled) setFixturesLoading(false);
            }
        }

        load();
        return () => { cancelled = true; };
    }, [selectedGw]);

    const handleFixtureClick = (fixture: FixtureData) => {
        // On mobile/tablet: navigate directly to chat
        if (window.innerWidth < 1200) {
            navigate(`/chat/${fixture.id}`);
        } else {
            // On desktop: show in preview panel
            setSelectedFixture(fixture);
        }
    };

    if (gwLoading || !selectedGw) {
        return (
            <div className="hub-loading">
                <div className="spinner" />
                <style>{hubStyles}</style>
            </div>
        );
    }

    return (
        <div className="hub" id="hub-page">
            <div className="hub-header">
                <h1 className="hub-title">Match Hub</h1>
                <GwSelector
                    currentGw={currentGw!}
                    selectedGw={selectedGw}
                    onSelect={setSelectedGw}
                />
            </div>

            <div className="hub-content">
                <div className="hub-fixtures">
                    {fixturesLoading ? (
                        <div className="hub-fixture-skeletons">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skeleton fixture-skeleton" />
                            ))}
                        </div>
                    ) : fixtures.length === 0 ? (
                        <div className="hub-empty">
                            <p>No fixtures found for Gameweek {selectedGw}</p>
                        </div>
                    ) : (
                        <div className="hub-fixture-grid">
                            {fixtures.map(f => (
                                <FixtureCard
                                    key={f.id}
                                    fixture={f}
                                    isSelected={selectedFixture?.id === f.id}
                                    onClick={() => handleFixtureClick(f)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Desktop only: preview panel */}
                <div className="hub-preview">
                    <FixturePreview fixture={selectedFixture} />
                </div>
            </div>

            <style>{hubStyles}</style>
        </div>
    );
}

const hubStyles = `
  .hub-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  .hub-header {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }
  @media (min-width: 768px) {
    .hub-header {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }
  .hub-title {
    font-size: 28px;
    font-weight: 800;
    color: var(--color-char);
  }
  @media (min-width: 768px) {
    .hub-title { font-size: 32px; }
  }
  .hub-content {
    display: flex;
    gap: 24px;
  }
  .hub-fixtures {
    flex: 1;
  }
  .hub-preview {
    display: none;
  }
  @media (min-width: 1200px) {
    .hub-preview {
      display: block;
      width: 320px;
      flex-shrink: 0;
    }
  }
  .hub-fixture-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  @media (min-width: 768px) {
    .hub-fixture-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  @media (min-width: 1200px) {
    .hub-fixture-grid {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  .hub-fixture-skeletons {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }
  @media (min-width: 768px) {
    .hub-fixture-skeletons {
      grid-template-columns: repeat(2, 1fr);
    }
  }
  .fixture-skeleton {
    height: 120px;
  }
  .hub-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-char-muted);
    font-size: 16px;
  }
`;
