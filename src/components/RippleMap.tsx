import { useMemo } from "react";
import { useT } from "../lib/i18n";
import {
  CONFIDENCE,
  POLARITY,
  RINGS,
  RING_LABEL,
  SEED,
  SPHERE,
  SPHERES,
  layout,
  ringRadius,
  sectorCentre,
  type Placed,
  type RippleNode,
} from "../lib/ripple";

// A stone dropped in water. The seed is the centre; what it ripples into fans across the top,
// what gave rise to it spreads below like roots. Angle carries the sphere, radius carries time,
// so the same kind of effect always lands in the same place and two maps can be compared by eye.

const R = 200; // the outermost ring, in viewBox units
// Labels reach sideways, so the frame is wider than it is tall rather than square with dead air.
const PAD_X = 136;
const PAD_Y = 52;
const W = (R + PAD_X) * 2;
const H = (R + PAD_Y) * 2;

const point = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: Math.cos(a) * r, y: Math.sin(a) * r };
};

const trim = (s: string, n = 20) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

interface Props {
  nodes: RippleNode[];
  leverage: string[];
  seed: string;
  selected: string | null;
  onSelect: (id: string | null) => void;
}

export default function RippleMap({ nodes, leverage, seed, selected, onSelect }: Props) {
  const { tr, lang } = useT();
  const placed = useMemo(() => layout(nodes, R), [nodes]);
  const at = useMemo(() => {
    const m = new Map<string, { x: number; y: number }>([[SEED, { x: 0, y: 0 }]]);
    placed.forEach((p) => m.set(p.id, { x: p.x, y: p.y }));
    return m;
  }, [placed]);

  /** Selecting a node dims everything off its chain, so one thread can be followed at a time. */
  const related = useMemo(() => {
    if (!selected) return null;
    const byId = new Map(placed.map((p) => [p.id, p]));
    const keep = new Set<string>([SEED, selected]);
    // Back to the seed…
    for (const queue = [selected]; queue.length; ) {
      const cur = byId.get(queue.pop()!);
      for (const f of cur?.from ?? []) if (!keep.has(f)) keep.add(f), queue.push(f);
    }
    // …and onward through everything that follows from the node itself.
    for (const queue = [selected]; queue.length; ) {
      const id = queue.pop()!;
      for (const p of placed) if (!keep.has(p.id) && p.from.includes(id)) keep.add(p.id), queue.push(p.id);
    }
    return keep;
  }, [selected, placed]);

  const dim = (id: string) => (related && !related.has(id) ? " dim" : "");

  return (
    <div className="ripple-map-wrap">
      <svg viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`} className="ripple-svg" role="img"
        aria-label={`${seed} — ${nodes.length}`} onClick={() => onSelect(null)}>
        <defs>
          <radialGradient id="rg-seed">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* The rings of time, and the horizon between what follows and what came before. */}
        {RINGS.map((ring) => (
          <circle key={ring} className="ripple-ring-line" r={ringRadius(ring, R)} />
        ))}
        <line className="ripple-horizon" x1={-R - 14} y1={0} x2={R + 14} y2={0} />

        {/* Sphere sectors: the same sphere sits above and below the horizon on the same side. */}
        {SPHERES.map((s) => {
          const up = point(sectorCentre("forward", s), R + 24);
          const down = point(sectorCentre("upstream", s), R + 24);
          return (
            <g key={s} className="ripple-rim" style={{ color: `var(${SPHERE[s].cssVar})` }}>
              <title>{tr(SPHERE[s].name)}</title>
              <text x={up.x} y={up.y} textAnchor="middle" dominantBaseline="middle">{SPHERE[s].icon}</text>
              <text x={down.x} y={down.y} textAnchor="middle" dominantBaseline="middle">{SPHERE[s].icon}</text>
            </g>
          );
        })}

        {/* How long it takes, read outward from the centre. */}
        {RINGS.map((ring) => (
          <g key={ring} className="ripple-ring-label">
            {/* Just inside the ring, in the empty band, so a node on the ring never sits on the words. */}
            <text x={5} y={-ringRadius(ring, R) + 13}>{tr(RING_LABEL.forward[ring])}</text>
            <text x={5} y={ringRadius(ring, R) - 7}>{tr(RING_LABEL.upstream[ring])}</text>
          </g>
        ))}

        {/* Edges first, so they pass under the nodes they join. */}
        {placed.map((n) =>
          n.from.map((f) => {
            const a = at.get(f);
            if (!a) return null;
            // Bowed toward the centre, so chains read as curves of water rather than a web.
            const cx = (a.x + n.x) * 0.42;
            const cy = (a.y + n.y) * 0.42;
            return (
              <path key={`${f}-${n.id}`} className={`ripple-edge${dim(n.id)}`}
                d={`M ${a.x} ${a.y} Q ${cx} ${cy} ${n.x} ${n.y}`}
                style={{ stroke: `var(${POLARITY[n.polarity].cssVar})`, opacity: CONFIDENCE[n.confidence].opacity * 0.4 }} />
            );
          }),
        )}

        {/* What comes back round to the person. */}
        {placed.filter((n) => n.loop).map((n) => (
          <path key={`loop-${n.id}`} className={`ripple-loop${dim(n.id)}`}
            d={`M ${n.x} ${n.y} Q ${-n.y * 0.5} ${n.x * 0.5} 0 0`} />
        ))}

        <circle className="ripple-seed-glow" r={46} fill="url(#rg-seed)" />
        <circle className="ripple-seed-dot" r={7} />

        {placed.map((n) => (
          <Node key={n.id} n={n} lang={lang} lever={leverage.includes(n.id)} sel={selected === n.id} dim={!!dim(n.id)}
            onSelect={onSelect} />
        ))}
      </svg>
    </div>
  );
}

interface NodeProps {
  n: Placed;
  lang: "en" | "vi";
  lever: boolean;
  sel: boolean;
  dim: boolean;
  onSelect: (id: string | null) => void;
}

function Node({ n, lang, lever, sel, dim, onSelect }: NodeProps) {
  const left = n.x < 0;
  const pick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(sel ? null : n.id);
  };
  return (
    <g
      className={`ripple-dot${sel ? " sel" : ""}${lever ? " lever" : ""}${dim ? " dim" : ""}`}
      transform={`translate(${n.x} ${n.y})`}
      style={{ opacity: CONFIDENCE[n.confidence].opacity }}
      role="button"
      tabIndex={0}
      onClick={pick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          pick(e);
        }
      }}
    >
      <title>{n.text[lang]}</title>
      {/* A wider invisible disc so the dot is easy to hit on a phone. */}
      <circle r={16} fill="transparent" />
      {n.observed === true && <circle className="ripple-seen" r={11} />}
      {lever && <circle className="ripple-lever-halo" r={10} />}
      <circle
        className="ripple-dot-core"
        r={n.observed === false ? 4 : 6}
        style={{ fill: `var(${SPHERE[n.sphere].cssVar})`, stroke: `var(${POLARITY[n.polarity].cssVar})` }}
      />
      <text className="ripple-dot-label" x={left ? -13 : 13} y={4} textAnchor={left ? "end" : "start"}>
        {trim(n.text[lang])}
      </text>
    </g>
  );
}
