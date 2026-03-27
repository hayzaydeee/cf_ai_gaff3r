// Accuracy chart — conditional render (≥3 GWs), simple bar chart via SVG

interface AccuracyChartProps {
    data: { gw: number; total: number; correct: number }[];
}

export default function AccuracyChart({ data }: AccuracyChartProps) {
    // Only render with sufficient data
    if (data.length < 3) return null;

    const maxPct = 100;
    const barWidth = Math.min(42, Math.floor(560 / data.length) - 8);
    const chartWidth = data.length * (barWidth + 12) + 40;
    const chartHeight = 240;
    const paddingBottom = 34;
    const paddingTop = 16;
    const usableHeight = chartHeight - paddingBottom - paddingTop;
    const averagePct = Math.round(
        data.reduce((sum, d) => sum + (d.total > 0 ? (d.correct / d.total) * 100 : 0), 0) / data.length
    );
    const avgY = paddingTop + usableHeight - (averagePct / maxPct) * usableHeight;

    return (
        <div className="accuracy-chart" id="accuracy-chart">
            <h3 className="chart-title">Accuracy Over Time</h3>
            <div className="chart-scroll">
                <svg width={chartWidth} height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    <line
                        x1="16"
                        y1={avgY}
                        x2={chartWidth - 12}
                        y2={avgY}
                        stroke="var(--color-muted)"
                        strokeDasharray="5 4"
                        strokeWidth="1"
                    />
                    <text
                        x={chartWidth - 14}
                        y={avgY - 6}
                        textAnchor="end"
                        fill="var(--color-muted)"
                        fontSize="10"
                        fontFamily="var(--font-display)"
                        fontWeight="600"
                    >
                        Avg {averagePct}%
                    </text>
                    {/* Bars */}
                    {data.map((d, i) => {
                        const x = 20 + i * (barWidth + 8);
                        const pct = d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0;
                        const barHeight = (pct / maxPct) * usableHeight;
                        const y = paddingTop + usableHeight - barHeight;

                        return (
                            <g key={d.gw}>
                                <rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={barHeight}
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
                                    GW{d.gw}
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
                                    {pct}%
                                </text>
                            </g>
                        );
                    })}
                </svg>
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
      `}</style>
        </div>
    );
}
