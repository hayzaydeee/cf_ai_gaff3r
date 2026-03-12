// Predictions page — history organized by gameweek with filtering

import { useState, useEffect } from 'react';
import { getPredictions, resolvePredictions, type PredictionsData } from '../services/api';
import type { Prediction } from '../types';
import GwAccordion from '../components/predictions/GwAccordion';

type Filter = 'all' | 'correct' | 'wrong' | 'pending';

export default function Predictions() {
    const [data, setData] = useState<PredictionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const result = await getPredictions();
                if (!cancelled) setData(result);
            } catch (err) {
                console.error('Failed to load predictions:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    const handleResolve = async () => {
        setResolving(true);
        try {
            await resolvePredictions();
            // Reload predictions
            const result = await getPredictions();
            setData(result);
        } catch (err) {
            console.error('Resolution failed:', err);
        } finally {
            setResolving(false);
        }
    };

    const filterPrediction = (pred: Prediction): boolean => {
        switch (filter) {
            case 'correct': return pred.status === 'resolved' && pred.outcomeCorrect === true;
            case 'wrong': return pred.status === 'resolved' && pred.outcomeCorrect === false;
            case 'pending': return pred.status === 'pending';
            default: return true;
        }
    };

    if (loading) {
        return (
            <div className="preds-loading">
                <div className="spinner" />
                <style>{predsStyles}</style>
            </div>
        );
    }

    // Sort GWs in reverse order (most recent first)
    const gameweeks = data
        ? Object.entries(data.predictions)
            .sort(([a], [b]) => {
                const gwA = parseInt(a.replace('gw', ''));
                const gwB = parseInt(b.replace('gw', ''));
                return gwB - gwA;
            })
        : [];

    return (
        <div className="preds-page" id="predictions-page">
            <div className="preds-header">
                <div>
                    <h1 className="preds-title">Predictions</h1>
                    <p className="preds-subtitle">{data?.total ?? 0} total predictions</p>
                </div>
                <button
                    className="preds-resolve-btn"
                    onClick={handleResolve}
                    disabled={resolving}
                    id="resolve-btn"
                >
                    {resolving ? 'Checking...' : '🔄 Check Results'}
                </button>
            </div>

            <div className="preds-filters" id="prediction-filters">
                {(['all', 'correct', 'wrong', 'pending'] as Filter[]).map(f => (
                    <button
                        key={f}
                        className={`preds-filter ${filter === f ? 'preds-filter-active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? 'All' : f === 'correct' ? '✅ Correct' : f === 'wrong' ? '❌ Wrong' : '⏳ Pending'}
                    </button>
                ))}
            </div>

            <div className="preds-list">
                {gameweeks.length === 0 ? (
                    <div className="preds-empty">
                        <p>No predictions yet. Chat with the Gaffer to make your first call!</p>
                    </div>
                ) : (
                    gameweeks.map(([gw, preds], i) => {
                        const filtered = preds.filter(filterPrediction);
                        if (filtered.length === 0) return null;
                        return (
                            <GwAccordion
                                key={gw}
                                gameweek={gw}
                                predictions={filtered}
                                defaultOpen={i === 0}
                            />
                        );
                    })
                )}
            </div>

            <style>{predsStyles}</style>
        </div>
    );
}

const predsStyles = `
  .preds-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  .preds-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .preds-title {
    font-size: 28px;
    font-weight: 800;
  }
  @media (min-width: 768px) {
    .preds-title { font-size: 32px; }
  }
  .preds-subtitle {
    font-size: 14px;
    color: var(--color-char-muted);
    margin: 2px 0 0;
  }
  .preds-resolve-btn {
    padding: 8px 16px;
    border: none;
    border-radius: var(--radius-md);
    background: var(--color-beige);
    color: var(--color-char);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
  }
  .preds-resolve-btn:hover:not(:disabled) {
    background: var(--color-beige-hover);
  }
  .preds-resolve-btn:disabled {
    opacity: 0.5;
  }
  .preds-filters {
    display: flex;
    gap: 6px;
    margin-bottom: 16px;
    overflow-x: auto;
  }
  .preds-filter {
    padding: 6px 14px;
    border: 1px solid var(--color-beige);
    border-radius: var(--radius-pill);
    background: none;
    color: var(--color-char-light);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
  }
  .preds-filter:hover {
    background: var(--color-beige);
  }
  .preds-filter-active {
    background: var(--color-orange-soft);
    border-color: var(--color-orange);
    color: var(--color-orange);
  }
  .preds-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-char-muted);
    font-size: 16px;
  }
`;
