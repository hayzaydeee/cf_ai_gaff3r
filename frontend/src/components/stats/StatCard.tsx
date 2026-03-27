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
          padding: 14px;
          background: color-mix(in srgb, var(--color-beige) 86%, transparent);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 104px;
        }
        .stat-card-accent {
          background: color-mix(in srgb, var(--color-orange-soft) 65%, var(--color-beige));
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
          font-size: 34px;
          font-weight: 800;
          line-height: 0.95;
          color: var(--color-char);
        }
        .stat-card-accent .stat-card-value {
          color: var(--color-orange);
        }
        .stat-card-desc {
          font-family: 'EB Garamond', serif;
          font-size: 17px;
          font-style: italic;
          color: var(--color-char-light);
          line-height: 1.2;
        }
        @media (max-width: 767px) {
          .stat-card-value {
            font-size: 30px;
          }
          .stat-card-desc {
            font-size: 15px;
          }
        }
      `}</style>
        </div>
    );
}
