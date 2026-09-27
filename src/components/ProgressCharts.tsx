// Small, dependency-free SVG charts for the growth overview, each with a hover tooltip.
import { useEffect, useRef, useState, type ReactNode } from "react";

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setWidth(Math.max(240, Math.floor(e.contentRect.width))));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

interface Tip { x: number; y: number; content: ReactNode }

function useTip() {
  const [tip, setTip] = useState<Tip | null>(null);
  const show = (e: React.MouseEvent | React.FocusEvent, content: ReactNode) => {
    const r = (e.currentTarget as Element).getBoundingClientRect();
    const x = "clientX" in e ? e.clientX : r.left + r.width / 2;
    setTip({ x, y: r.top, content });
  };
  const node = tip ? <div className="tooltip" style={{ left: tip.x, top: tip.y }} role="status">{tip.content}</div> : null;
  return { show, hide: () => setTip(null), node };
}

const shortDate = (date: string, locale: string) =>
  new Date(`${date}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "numeric" });

// ---------- Line: daily points (faded) + 7-day average (solid) ----------

export function TrendChart({ points, min, max, locale, labelDaily, labelAvg, format }: {
  points: { date: string; value: number | null; avg: number | null }[];
  min: number;
  max: number;
  locale: string;
  labelDaily: string;
  labelAvg: string;
  format: (v: number) => string;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { show, hide, node } = useTip();
  const [hover, setHover] = useState<number | null>(null);
  const h = 170, left = 26, right = 8, top = 10, bottom = 24;
  const n = points.length;
  const x = (i: number) => left + (n <= 1 ? 0 : (i / (n - 1)) * (width - left - right));
  const y = (v: number) => top + (1 - (v - min) / (max - min)) * (h - top - bottom);
  const ticks = [min, Math.round((min + max) / 2), max];
  const avgPath = points
    .map((p, i) => (p.avg === null ? null : `${x(i).toFixed(1)},${y(p.avg).toFixed(1)}`))
    .reduce<string[]>((acc, pt, i, arr) => {
      if (pt) acc.push(`${i === 0 || arr[i - 1] === null ? "M" : "L"}${pt}`);
      return acc;
    }, [])
    .join(" ");
  const colW = n > 1 ? (width - left - right) / (n - 1) : width;
  const labelIdx = n > 1 ? [0, Math.floor((n - 1) / 2), n - 1] : [0];

  return (
    <div ref={ref} className="chart" onMouseLeave={() => { hide(); setHover(null); }}>
      <svg width={width} height={h} role="img" aria-label={labelDaily}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={left} x2={width - right} y1={y(t)} y2={y(t)} className="grid" />
            <text x={left - 6} y={y(t) + 4} className="axis" textAnchor="end">{Number.isInteger(t) ? t : t.toFixed(1)}</text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={x(i)} y={h - 6} className="axis" textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}>
            {shortDate(points[i].date, locale)}
          </text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={top} y2={h - bottom} className="crosshair" />}
        <path d={avgPath} className="series-line" />
        {points.map((p, i) => (p.value === null ? null : <circle key={p.date} cx={x(i)} cy={y(p.value)} r={4} className="series-dot" />))}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.date}`}
            x={x(i) - colW / 2}
            y={top}
            width={Math.max(colW, 6)}
            height={h - top - bottom}
            fill="transparent"
            tabIndex={-1}
            onMouseMove={(e) => {
              setHover(i);
              show(e, (
                <>
                  <strong>{new Date(`${p.date}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}</strong>
                  <div>{labelDaily}: {p.value === null ? "—" : format(p.value)}</div>
                  <div className="muted">{labelAvg}: {p.avg === null ? "—" : format(p.avg)}</div>
                </>
              ));
            }}
          />
        ))}
      </svg>
      <div className="chart-key tiny muted">
        <span><i className="key-dot" /> {labelDaily}</span>
        <span><i className="key-line" /> {labelAvg}</span>
      </div>
      {node}
    </div>
  );
}

// ---------- Weekly bars ----------

export function WeeklyBars({ weeks, locale, unit, tooltip }: {
  weeks: { start: string; minutes: number; sessions: number }[];
  locale: string;
  unit: string;
  tooltip: (w: { start: string; minutes: number; sessions: number }) => ReactNode;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const { show, hide, node } = useTip();
  const h = 150, left = 8, right = 8, top = 16, bottom = 22;
  const max = Math.max(10, ...weeks.map((w) => w.minutes));
  const slot = (width - left - right) / Math.max(1, weeks.length);
  const barW = Math.max(4, Math.min(34, slot - 2));
  const peak = weeks.reduce((best, w, i) => (w.minutes > (weeks[best]?.minutes ?? -1) ? i : best), 0);
  const every = Math.ceil(weeks.length / 6);

  return (
    <div ref={ref} className="chart" onMouseLeave={hide}>
      <svg width={width} height={h} role="img" aria-label={unit}>
        <line x1={left} x2={width - right} y1={h - bottom} y2={h - bottom} className="grid" />
        {weeks.map((w, i) => {
          const bh = (w.minutes / max) * (h - top - bottom);
          const cx = left + slot * i + slot / 2;
          const yTop = h - bottom - bh;
          return (
            <g key={w.start}>
              {w.minutes > 0 && (
                <path
                  className="series-bar"
                  d={`M${cx - barW / 2},${h - bottom} V${yTop + 4} Q${cx - barW / 2},${yTop} ${cx - barW / 2 + 4},${yTop} H${cx + barW / 2 - 4} Q${cx + barW / 2},${yTop} ${cx + barW / 2},${yTop + 4} V${h - bottom} Z`}
                />
              )}
              {i === peak && w.minutes > 0 && <text x={cx} y={yTop - 4} className="value" textAnchor="middle">{w.minutes}</text>}
              {i % every === 0 && <text x={cx} y={h - 6} className="axis" textAnchor="middle">{shortDate(w.start, locale)}</text>}
              <rect x={left + slot * i} y={top} width={slot} height={h - top - bottom} fill="transparent" onMouseMove={(e) => show(e, tooltip(w))} />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

// ---------- Activity calendar ----------

export function ActivityCalendar({ days, score, locale, describe, lessLabel, moreLabel }: {
  days: string[];
  score: (d: string) => number;
  locale: string;
  describe: (d: string) => ReactNode;
  lessLabel: string;
  moreLabel: string;
}) {
  const { show, hide, node } = useTip();
  // Columns are weeks (Mon → Sun top to bottom).
  const first = new Date(`${days[0]}T12:00:00`);
  const offset = (first.getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...days];
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  const level = (s: number) => (s <= 0 ? 0 : s === 1 ? 1 : s <= 3 ? 2 : s <= 5 ? 3 : 4);

  return (
    <div className="calendar-wrap" onMouseLeave={hide}>
      <div className="calendar" role="img" aria-label={`${days.length} days`}>
        {weeks.map((w, i) => (
          <div key={i} className="cal-week">
            {w.map((d, j) =>
              d ? (
                <span
                  key={d}
                  className={`cal-day h${level(score(d))}`}
                  onMouseMove={(e) => show(e, (
                    <>
                      <strong>{new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" })}</strong>
                      {describe(d)}
                    </>
                  ))}
                />
              ) : (
                <span key={`e${j}`} className="cal-day empty" />
              ),
            )}
          </div>
        ))}
      </div>
      <div className="chart-key tiny muted">
        {lessLabel}
        {[0, 1, 2, 3, 4].map((l) => <i key={l} className={`cal-day h${l}`} />)}
        {moreLabel}
      </div>
      {node}
    </div>
  );
}

// ---------- Horizontal bars (counts) ----------

export function CountBars({ rows, tooltip }: { rows: { key: string; label: string; n: number }[]; tooltip: (r: { label: string; n: number }) => ReactNode }) {
  const { show, hide, node } = useTip();
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="count-bars" onMouseLeave={hide}>
      {rows.map((r) => (
        <div key={r.key} className="count-row" onMouseMove={(e) => show(e, tooltip(r))}>
          <span className="small">{r.label}</span>
          <span className="count-track"><span className="count-fill" style={{ width: `${(r.n / max) * 100}%` }} /></span>
          <span className="tiny muted">{r.n}</span>
        </div>
      ))}
      {node}
    </div>
  );
}
