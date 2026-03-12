// Stat card component — label, value, optional description

interface StatCardProps {
    label: string;
    value: string | number;
    description?: string;
    accent?: boolean;
}

export default function StatCard({ label, value, description, accent }: StatCardProps) {
    return (
        <div className={`stat-card ${accent ? 'stat-card-accent' : ''}`}>
            <span className="stat-card-label">{label}</span>
            <span className="stat-card-value">{value}</span>
            {description && <span className="stat-card-desc">{description}</span>}

            <style>{`
        .stat-card {
          padding: 16px;
          background: var(--color-beige);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .stat-card-accent {
          background: var(--color-orange-soft);
          border: 1px solid var(--color-orange);
        }
        .stat-card-label {
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--color-char-muted);
        }
        .stat-card-accent .stat-card-label {
          color: var(--color-orange);
        }
        .stat-card-value {
          font-family: var(--font-display);
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }
        .stat-card-accent .stat-card-value {
          color: var(--color-orange);
        }
        .stat-card-desc {
          font-size: 13px;
          color: var(--color-char-light);
        }
      `}</style>
        </div>
    );
}
