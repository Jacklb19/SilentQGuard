import type { Space } from '../../../../packages/http-contracts/src/index';
export function RadarVisual({ spaces, live }: { spaces: Space[]; live: boolean }) {
  const points = [
    [73, 91],
    [178, 66],
    [188, 177],
    [89, 190],
  ];
  return (
    <div className={`radar-visual ${live ? 'radar-live' : ''}`} aria-hidden="true">
      <svg className="radar-rings" viewBox="0 0 260 260" fill="none">
        <circle cx="130" cy="130" r="113" />
        <circle cx="130" cy="130" r="78" />
        <circle cx="130" cy="130" r="42" />
        <path d="M130 17V243M17 130H243M50 50L210 210M50 210L210 50" className="radar-guides" />
      </svg>
      <div className="radar-sweep" />
      <div className="radar-core">
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5 14.5V9.5M9.5 18V6M14 15.5V8.5M18.5 13V11"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      {points.map(([x, y], index) => (
        <span
          key={index}
          className={`radar-point radar-point-${spaces[index]?.status.toLowerCase() ?? 'no_data'}`}
          style={{ left: `${x / 2.6}%`, top: `${y / 2.6}%` }}
        />
      ))}
    </div>
  );
}
