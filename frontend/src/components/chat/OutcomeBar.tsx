// Stacked horizontal bar showing Home Win % | Draw % | Away Win %
// Uses recharts BarChart in vertical layout with three stacked bars.

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface OutcomeBarProps {
  homeTeam: string;
  awayTeam: string;
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
}

export default function OutcomeBar({ homeTeam, awayTeam, homeWinPct, drawPct, awayWinPct }: OutcomeBarProps) {
  const data = [{ name: 'outcome', home: homeWinPct, draw: drawPct, away: awayWinPct }];

  return (
    <div className="ob-wrap">
      <ResponsiveContainer width="100%" height={36}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barSize={36}>
          <XAxis type="number" domain={[0, 100]} hide />
          <YAxis type="category" dataKey="name" hide />
          <Tooltip
            cursor={false}
            formatter={(value, name) => [
              `${value ?? 0}%`,
              name === 'home' ? homeTeam : name === 'away' ? awayTeam : 'Draw',
            ]}
            contentStyle={{
              fontFamily: 'var(--font-display)',
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              background: 'var(--color-cream)',
              color: 'var(--color-char)',
            }}
          />
          <Bar dataKey="home" stackId="a" fill="var(--color-orange)" radius={[4, 0, 0, 4]} />
          <Bar dataKey="draw" stackId="a" fill="var(--color-beige-hover, #E8D5A8)" />
          <Bar dataKey="away" stackId="a" fill="var(--color-char)" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="ob-labels">
        <span className="ob-label ob-label--home">
          <span className="ob-dot ob-dot--home" />
          {homeTeam} {homeWinPct}%
        </span>
        <span className="ob-label ob-label--draw">Draw {drawPct}%</span>
        <span className="ob-label ob-label--away">
          {awayWinPct}% {awayTeam}
          <span className="ob-dot ob-dot--away" />
        </span>
      </div>

      <style>{`
        .ob-wrap { display: flex; flex-direction: column; gap: 6px; }

        .ob-labels {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ob-label {
          display: flex;
          align-items: center;
          gap: 5px;
          font-family: var(--font-display);
          font-size: 11px;
          font-weight: 600;
          color: var(--color-char-light);
        }
        .ob-label--home { color: var(--color-orange); }
        .ob-label--draw { color: var(--color-char-muted); }
        .ob-label--away { color: var(--color-char); }
        .ob-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .ob-dot--home { background: var(--color-orange); }
        .ob-dot--away { background: var(--color-char); }
      `}</style>
    </div>
  );
}
