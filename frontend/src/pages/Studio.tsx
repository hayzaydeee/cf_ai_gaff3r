// Studio — Coming Soon placeholder
// V2 feature: time-window analysis, comparison engine, data cards, text-to-SQL

export default function Studio() {
  return (
    <div className="studio-wrap">
      <div className="studio-card">
        <div className="studio-icon">🔬</div>
        <h1 className="studio-title">Studio</h1>
        <p className="studio-sub">Coming Soon</p>
        <p className="studio-desc">
          Advanced analysis tools are in development — time-window breakdowns,
          head-to-head comparisons, custom data cards, and more.
        </p>
      </div>

      <style>{`
        .studio-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          padding: 24px;
        }
        .studio-card {
          text-align: center;
          max-width: 400px;
          padding: 48px 40px;
          background: var(--color-beige);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-lg);
        }
        .studio-icon {
          font-size: 40px;
          margin-bottom: 16px;
        }
        .studio-title {
          font-family: var(--font-display);
          font-size: 28px;
          font-weight: 700;
          color: var(--color-char);
          margin: 0 0 8px;
        }
        .studio-sub {
          display: inline-block;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: var(--color-orange);
          background: transparent;
          border: 1px solid var(--color-orange);
          border-radius: var(--radius-pill);
          padding: 3px 12px;
          margin-bottom: 20px;
        }
        .studio-desc {
          font-family: 'EB Garamond', serif;
          font-size: 15px;
          color: var(--color-char-light);
          line-height: 1.6;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
