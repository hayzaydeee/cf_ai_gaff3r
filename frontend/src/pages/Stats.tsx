// Stats page — accuracy dashboard

import { useState, useEffect } from 'react';
import { getStats, type StatsData } from '../services/api';
import StatCard from '../components/stats/StatCard';
import AccuracyChart from '../components/stats/AccuracyChart';

export default function Stats() {
    const [stats, setStats] = useState<StatsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            try {
                const data = await getStats();
                if (!cancelled) setStats(data);
            } catch (err) {
                console.error('Failed to load stats:', err);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => { cancelled = true; };
    }, []);

    if (loading) {
        return (
            <div className="stats-loading">
                <div className="spinner" />
                <style>{statsStyles}</style>
            </div>
        );
    }

    if (!stats || stats.totalPredictions === 0) {
        return (
            <div className="stats-page" id="stats-page">
                <h1 className="stats-title">Stats</h1>
                <div className="stats-empty">
                    <p>🎯 No predictions yet — make some calls first!</p>
                </div>
                <style>{statsStyles}</style>
            </div>
        );
    }

    const pending = Math.max(0, stats.totalPredictions - stats.resolved);

    return (
        <div className="stats-page" id="stats-page">
            <h1 className="stats-title">Stats</h1>

            {/* Hero stat */}
            <div className="stats-hero" id="stats-hero">
                <div className="stats-hero-main">
                    <span className="stats-hero-label">OVERALL ACCURACY</span>
                    <span className="stats-hero-value">{stats.outcomeAccuracy}%</span>
                    <span className="stats-hero-sub">{stats.resolved} of {stats.totalPredictions} predictions correct</span>
                    {stats.resolved === 0 && (
                        <span className="stats-hero-note">No resolved fixtures yet. Accuracy stabilizes as results come in.</span>
                    )}
                </div>
            </div>

            {/* Stat cards grid */}
            <div className="stats-grid">
                <StatCard
                    label="Exact Score Rate"
                    value={`${stats.scoreAccuracy}%`}
                />
                <StatCard
                    label="Current Streak"
                    value={stats.currentStreak}
                    description={stats.currentStreak > 0 ? '🔥 On fire!' : 'Start a streak'}
                />
                <StatCard
                    label="Best Streak"
                    value={stats.bestStreak}
                />
                <StatCard
                    label="Total Predictions"
                    value={stats.totalPredictions}
                />
                <StatCard
                    label="Resolved"
                    value={stats.resolved}
                    description="Matches with final results"
                />
                <StatCard
                    label="Pending"
                    value={pending}
                    description="Awaiting match outcome"
                />
            </div>

            {/* Accuracy chart */}
            {stats.byGameweek.length >= 3 && (
                <section className="stats-chart" id="stats-chart-section">
                    <h2 className="stats-section-title">Accuracy Over Time</h2>
                    <AccuracyChart data={stats.byGameweek} />
                </section>
            )}

            <style>{statsStyles}</style>
        </div>
    );
}

const statsStyles = `
    .stats-page {
        width: 100%;
        box-sizing: border-box;
        padding: 16px clamp(14px, 2.2vw, 24px) 22px;
    }
    @media (min-width: 768px) {
        .stats-page {
            padding: 16px clamp(18px, 2.8vw, 32px) 26px;
        }
    }
  .stats-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  .stats-title {
        font-family: var(--font-display);
        font-size: 24px;
    font-weight: 800;
                margin-bottom: 12px;
  }
  @media (min-width: 768px) {
        .stats-title { font-size: 28px; }
  }
  .stats-hero {
                display: block;
                margin-bottom: 14px;
                padding: 18px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
      background: var(--color-beige);
    }
    .stats-hero-main {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }
    .stats-hero-label {
        font-family: var(--font-display);
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.9px;
        text-transform: uppercase;
        color: var(--color-muted);
    }
    .stats-hero-value {
        font-family: var(--font-display);
        font-size: clamp(44px, 9vw, 74px);
        font-weight: 800;
        line-height: 0.9;
        color: var(--color-orange);
    }
    .stats-hero-sub {
        font-family: 'EB Garamond', serif;
        font-size: 18px;
        font-style: italic;
        color: var(--color-char-light);
    }
    .stats-hero-note {
        font-family: var(--font-display);
        font-size: 12px;
        color: var(--color-muted);
    }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-bottom: 14px;
  }
  @media (min-width: 768px) {
    .stats-grid {
            grid-template-columns: repeat(3, 1fr);
    }
  }
    .stats-chart {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        background: color-mix(in srgb, var(--color-beige) 85%, transparent);
        padding: 14px;
        margin-bottom: 12px;
    }
    .stats-section-title {
        font-family: var(--font-display);
        font-size: 16px;
        font-weight: 700;
        margin: 0 0 12px;
        color: var(--color-char);
    }
  .stats-chart {
      margin-bottom: 14px;
  }
  .stats-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-char-muted);
    font-size: 16px;
  }
`;
