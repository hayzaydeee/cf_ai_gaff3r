// Accuracy chart — conditional render (≥3 GWs), simple bar chart via SVG

interface AccuracyChartProps {
    data: { gw: number; total: number; correct: number }[];
}

export default function AccuracyChart({ data }: AccuracyChartProps) {
    // Only render with sufficient data
    if (data.length < 3) return null;

    const maxTotal = Math.max(...data.map(d => d.total), 1);
    const barWidth = Math.min(40, Math.floor(500 / data.length) - 8);
    const chartWidth = data.length * (barWidth + 8) + 40;
    const chartHeight = 200;
    const paddingBottom = 30;
    const paddingTop = 10;
    const usableHeight = chartHeight - paddingBottom - paddingTop;

    return (
        <div className="accuracy-chart" id="accuracy-chart">
            <h3 className="chart-title">Accuracy by Gameweek</h3>
            <div className="chart-scroll">
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Bars */}
                    {data.map((d, i) => {
                        const x = 20 + i * (barWidth + 8);
                        const totalHeight = (d.total / maxTotal) * usableHeight;
                        const correctHeight = (d.correct / maxTotal) * usableHeight;
                        const y = paddingTop + usableHeight - totalHeight;
                        const yCorrect = paddingTop + usableHeight - correctHeight;

                        return (
                            <g key={d.gw}>
                                {/* Total bar (background) */}
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={totalHeight}
                                    rx={4}
                                    fill="var(--color-beige-hover)"
                                />
                                {/* Correct bar (foreground) */}
                                <rect
                                    x={x}
                                    y={yCorrect}
                                    width={barWidth}
                                    height={correctHeight}
                                    rx={4}
                                    fill="var(--color-orange)"
                                />
                                {/* GW label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={chartHeight - 8}
                                    textAnchor="middle"
                                    fill="var(--color-char-muted)"
                                    fontSize="11"
                                    fontFamily="var(--font-display)"
                                    fontWeight="600"
                                >
                                    {d.gw}
                                </text>
                                {/* Accuracy label */}
                                <text
                                    x={x + barWidth / 2}
                                    y={y - 4}
                                    textAnchor="middle"
                                    fill="var(--color-char-light)"
                                    fontSize="10"
                                    fontFamily="var(--font-display)"
                                    fontWeight="600"
                                >
                                    {d.total > 0 ? Math.round((d.correct / d.total) * 100) + '%' : ''}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            <div className="chart-legend">
                <span className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ background: 'var(--color-orange)' }} />
                    Correct
                </span>
                <span className="chart-legend-item">
                    <span className="chart-legend-dot" style={{ background: 'var(--color-beige-hover)' }} />
                    Total
                </span>
            </div>

            <style>{`
        .accuracy-chart {
          padding: 20px;
          background: var(--color-beige);
          border-radius: var(--radius-lg);
        }
        .chart-title {
          font-family: var(--font-display);
          font-size: 14px;
          font-weight: 700;
          color: var(--color-char);
          margin-bottom: 12px;
        }
        .chart-scroll {
          overflow-x: auto;
        }
        .chart-legend {
          display: flex;
          gap: 16px;
          margin-top: 8px;
          justify-content: center;
        }
        .chart-legend-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-display);
          font-size: 12px;
          font-weight: 500;
          color: var(--color-char-light);
        }
        .chart-legend-dot {
          width: 10px;
          height: 10px;
          border-radius: 3px;
        }
      `}</style>
        </div>
    );
}
