// Predictions page — redesigned as tabular history per spec
// Tabs (All · Correct · Wrong · Pending) + GW group rows + table with FIXTURE | COMP | CALL | ACTUAL | RESULT | CONFIDENCE

import { useState, useEffect } from 'react';
import { getPredictions, resolvePredictions, type PredictionsData } from '../services/api';
import type { Prediction } from '../types';
import GwAccordion from '../components/predictions/GwAccordion';

type Filter = 'all' | 'correct' | 'wrong' | 'pending';

function resultLabel(pred: Prediction) {
    if (pred.status === 'pending') return { text: 'Pending', cls: 'rb--pending' };
    if (pred.exactScoreCorrect) return { text: 'Exact ✓', cls: 'rb--exact' };
    if (pred.outcomeCorrect) return { text: 'Correct ✓', cls: 'rb--correct' };
    return { text: 'Wrong ✗', cls: 'rb--wrong' };
}

function confLabel(c: string) {
    return { low: 'Low', medium: 'Medium', high: 'High' }[c] ?? c;
}

export default function Predictions() {
    const [data, setData] = useState<PredictionsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState(false);
    const [filter, setFilter] = useState<Filter>('all');

    useEffect(() => {
        let cancelled = false;
        getPredictions()
            .then(r => { if (!cancelled) setData(r); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    const handleResolve = async () => {
        setResolving(true);
        try {
            await resolvePredictions();
            const r = await getPredictions();
            setData(r);
        } catch {}
        finally { setResolving(false); }
    };

    const filterFn = (p: Prediction) => {
        if (filter === 'correct') return p.status === 'resolved' && p.outcomeCorrect === true;
        if (filter === 'wrong') return p.status === 'resolved' && p.outcomeCorrect === false;
        if (filter === 'pending') return p.status === 'pending';
        return true;
    };

    // All predictions flat for counts
    const allPreds = data ? Object.values(data.predictions).flat() : [];
    const counts = {
        all: allPreds.length,
        correct: allPreds.filter(p => p.status === 'resolved' && p.outcomeCorrect === true).length,
        wrong: allPreds.filter(p => p.status === 'resolved' && p.outcomeCorrect === false).length,
        pending: allPreds.filter(p => p.status === 'pending').length,
    };

    const TABS: { key: Filter; label: string }[] = [
        { key: 'all', label: `All  ${counts.all}` },
        { key: 'correct', label: `Correct  ${counts.correct}` },
        { key: 'wrong', label: `Wrong  ${counts.wrong}` },
        { key: 'pending', label: `Pending  ${counts.pending}` },
    ];

    // Sorted GWs, most recent first
    const gameweeks = data
        ? Object.entries(data.predictions).sort(([a], [b]) => parseInt(b.replace('gw', '')) - parseInt(a.replace('gw', '')))
        : [];

    if (loading) {
        return (
            <div className="preds-loading" id="predictions-page">
                <div className="spinner" />
                <style>{predsStyles}</style>
            </div>
        );
    }

    return (
        <div className="preds-page" id="predictions-page">
            {/* Header */}
            <div className="preds-header">
                <div>
                    <h1 className="preds-title">Predictions</h1>
                    <p className="preds-subtitle">
                        Track your AI-powered match predictions across all competitions
                    </p>
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

            {/* Tabs */}
            <div className="preds-tabs" id="prediction-filters">
                {TABS.map(t => (
                    <button
                        key={t.key}
                        className={`preds-tab ${filter === t.key ? 'preds-tab--active' : ''}`}
                        onClick={() => setFilter(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="preds-table-wrap">
                {gameweeks.length === 0 ? (
                    <div className="preds-empty">
                        <p>No predictions yet. Chat with the Gaffer to make your first call!</p>
                    </div>
                ) : (
                    <table className="preds-table">
                        <thead>
                            <tr>
                                <th>FIXTURE</th>
                                <th className="preds-th-hide-sm">COMPETITION</th>
                                <th>GAFFER'S CALL</th>
                                <th className="preds-th-hide-sm">ACTUAL</th>
                                <th>RESULT</th>
                                <th className="preds-th-hide-sm">CONFIDENCE</th>
                            </tr>
                        </thead>
                        <tbody>
                          {gameweeks.map(([gw, preds]) => (
                            <GwAccordion
                              key={gw}
                              gameweek={gw}
                              predictions={preds}
                              filterFn={filterFn}
                              resultLabel={resultLabel}
                              confLabel={confLabel}
                            />
                          ))}
                        </tbody>
                    </table>
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
  .preds-page {
    padding: 16px 32px 24px;
    max-width: 1100px;
  }
  @media (max-width: 1199px) {
    .preds-page { padding: 16px 20px 20px; }
  }
  @media (max-width: 767px) {
    .preds-page { padding: 16px 16px 20px; }
  }

  /* Header */
  .preds-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }
  .preds-title {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 800;
    color: var(--color-char);
    margin: 0 0 4px;
  }
  .preds-subtitle {
    font-family: 'EB Garamond', serif;
    font-size: 15px;
    color: var(--color-muted);
    margin: 0;
  }
  .preds-resolve-btn {
    padding: 8px 16px;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    background: none;
    color: var(--color-char);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
    flex-shrink: 0;
  }
  .preds-resolve-btn:hover:not(:disabled) { background: var(--color-beige); }
  .preds-resolve-btn:disabled { opacity: 0.5; }

  /* Tabs */
  .preds-tabs {
    display: flex;
    gap: 2px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--color-border);
    overflow-x: auto;
  }
  .preds-tab {
    padding: 9px 16px;
    border: none;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--color-char-light);
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
    transition: all var(--transition-fast);
    margin-bottom: -1px;
  }
  .preds-tab:hover { color: var(--color-char); }
  .preds-tab--active {
    color: var(--color-orange);
    border-bottom-color: var(--color-orange);
  }

  /* Table */
  .preds-table-wrap { overflow-x: auto; }
  .preds-table {
    width: 100%;
    border-collapse: collapse;
    font-family: var(--font-display);
  }
  .preds-table thead tr {
    border-bottom: 1px solid var(--color-border);
  }
  .preds-table th {
    padding: 10px 14px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.6px;
    color: var(--color-muted);
    text-transform: uppercase;
    white-space: nowrap;
  }
  .preds-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--color-border);
    vertical-align: middle;
  }
  .preds-th-hide-sm { }
  @media (max-width: 767px) {
    .preds-th-hide-sm { display: none; }
  }

  /* GW group row */
  .preds-gw-row td {
    padding: 10px 14px 6px;
    background: var(--color-beige);
    border-bottom: none;
  }
  .preds-gw-label {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 700;
    color: var(--color-char);
    margin-right: 10px;
  }
  .preds-gw-stat {
    font-family: 'EB Garamond', serif;
    font-size: 13px;
    color: var(--color-muted);
  }

  /* Prediction row */
  .preds-row:hover td { background: var(--color-beige); }
  .preds-fixture-main {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: var(--color-char);
  }
  .preds-fixture-vs {
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    font-style: italic;
    color: var(--color-muted);
    margin: 0 2px;
  }
  .preds-logo,
  .preds-logo-fallback {
    border-radius: 50%;
    flex-shrink: 0;
  }
  .preds-logo {
    background: transparent;
    border: none;
    padding: 0;
  }
  .preds-logo-fallback {
    background: var(--color-orange);
    color: #FFFFFF;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-family: var(--font-display);
    font-size: 7px;
    font-weight: 700;
  }
  .preds-fixture-sub {
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .preds-comp-badge {
    display: inline-block;
    width: 24px; height: 24px;
    border-radius: 50%;
    background: var(--color-orange);
    color: #FFF;
    font-size: 9px;
    font-weight: 700;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .preds-score-call {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-char);
  }
  .preds-conf-sub {
    font-family: 'EB Garamond', serif;
    font-size: 12px;
    color: var(--color-muted);
    margin-top: 2px;
  }
  .preds-score-actual {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-char);
  }
  .preds-score-na { color: var(--color-muted); }

  /* Result badge */
  .preds-result-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: var(--radius-pill);
    font-size: 11px;
    font-weight: 600;
    white-space: nowrap;
  }
  .rb--pending { background: var(--color-pending-soft); color: var(--color-pending); }
  .rb--correct { background: var(--color-success-soft); color: var(--color-success); }
  .rb--exact { background: var(--color-success-soft); color: var(--color-success); }
  .rb--wrong { background: var(--color-error-soft); color: var(--color-error); }

  .preds-conf-badge {
    font-size: 12px;
    color: var(--color-char-light);
  }
  .preds-empty {
    text-align: center;
    padding: 60px 20px;
    color: var(--color-muted);
    font-family: 'EB Garamond', serif;
    font-size: 16px;
  }
`;
