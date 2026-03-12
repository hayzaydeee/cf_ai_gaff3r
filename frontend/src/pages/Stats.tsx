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

    return (
        <div className="stats-page" id="stats-page">
            <h1 className="stats-title">Accuracy Dashboard</h1>

            {/* Hero stat */}
            <div className="stats-hero">
                <StatCard
                    label="Outcome Accuracy"
                    value={`${stats.outcomeAccuracy}%`}
                    description={`${stats.resolved} resolved of ${stats.totalPredictions} total`}
                    accent
                />
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
            </div>

            {/* Accuracy chart */}
            {stats.byGameweek.length >= 3 && (
                <div className="stats-chart">
                    <AccuracyChart data={stats.byGameweek} />
                </div>
            )}

            <style>{statsStyles}</style>
        </div>
    );
}

const statsStyles = `
  .stats-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
  }
  .stats-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    .stats-title { font-size: 32px; }
  }
  .stats-hero {
    margin-bottom: 16px;
  }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    .stats-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  .stats-chart {
    margin-bottom: 20px;
  }
  .stats-empty {
    text-align: center;
    padding: 40px 20px;
    color: var(--color-char-muted);
    font-size: 16px;
  }
`;
