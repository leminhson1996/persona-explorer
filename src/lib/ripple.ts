// Duyên khởi (dependent origination): how one thought or action is conditioned, and what it conditions
// in turn. The taxonomy lives here, not in the model's answer, so every map uses the same rings and
// spheres and can be compared across weeks. Claude fills in the nodes; the shape is ours.
//
// Nothing here predicts anything. A node is a plausible condition, offered for reflection.
import type { Bi } from "./i18n";

const bi = (en: string, vi: string): Bi => ({ en, vi });

/** Which way the causal chain runs from the seed. */
export type Dir = "forward" | "upstream";
/** Where an effect lands. Fixed set: the map's angles depend on it. */
export type Sphere = "body" | "mind" | "near" | "work" | "society" | "nature";
/** How far out in time. 1 = now, 2 = days, 3 = months and years. */
export type Ring = 1 | 2 | 3;
export type Polarity = "nourish" | "deplete" | "mixed" | "unclear";
export type Confidence = "likely" | "plausible" | "speculative";
/** A node that feeds back into the person: reinforcing (vòng xoáy) or balancing (tự điều hòa). */
export type Loop = "reinforcing" | "balancing";

export const SPHERES: Sphere[] = ["body", "mind", "near", "work", "society", "nature"];

export const SPHERE: Record<Sphere, { name: Bi; hint: Bi; icon: string; cssVar: string }> = {
  body: {
    name: bi("Body", "Thân"),
    hint: bi("breath, sleep, tension, appetite", "hơi thở, giấc ngủ, sự căng, ăn uống"),
    icon: "🫀",
    cssVar: "--sp-body",
  },
  mind: {
    name: bi("Mind", "Tâm"),
    hint: bi("mood, attention, habit energy (tập khí)", "cảm xúc, sự chú tâm, tập khí"),
    icon: "🪷",
    cssVar: "--sp-mind",
  },
  near: {
    name: bi("People close to you", "Người thân cận"),
    hint: bi("family, friends, the person in front of you", "gia đình, bạn bè, người đang ở trước mặt"),
    icon: "🫂",
    cssVar: "--sp-near",
  },
  work: {
    name: bi("Work & craft", "Công việc"),
    hint: bi("colleagues, the quality of what you make", "đồng nghiệp, chất lượng việc mình làm"),
    icon: "🛠",
    cssVar: "--sp-work",
  },
  society: {
    name: bi("The wider circle", "Vòng rộng hơn"),
    hint: bi("strangers, community, what spreads onward", "người lạ, cộng đồng, điều lan tiếp"),
    icon: "🌏",
    cssVar: "--sp-society",
  },
  nature: {
    name: bi("Living world", "Thiên nhiên"),
    hint: bi("other beings, materials, energy, waste", "các loài khác, vật chất, năng lượng, rác thải"),
    icon: "🌱",
    cssVar: "--sp-nature",
  },
};

export const RINGS: Ring[] = [1, 2, 3];

/** Time horizons read differently going forward and going back, so each direction gets its own words. */
export const RING_LABEL: Record<Dir, Record<Ring, Bi>> = {
  forward: {
    1: bi("Right away", "Ngay lúc đó"),
    2: bi("Over days", "Vài ngày tới"),
    3: bi("Months & years", "Tháng, năm"),
  },
  upstream: {
    1: bi("Just before", "Ngay trước đó"),
    2: bi("Recent days", "Mấy ngày qua"),
    3: bi("Long-standing", "Lâu dài, tập khí"),
  },
};

export const DIR_LABEL: Record<Dir, Bi> = {
  forward: bi("What it ripples into", "Điều nó lan tới"),
  upstream: bi("What gave rise to it", "Điều làm nó khởi lên"),
};

export const POLARITY: Record<Polarity, { name: Bi; cssVar: string }> = {
  nourish: { name: bi("Nourishing", "Nuôi dưỡng"), cssVar: "--good" },
  deplete: { name: bi("Depleting", "Bào mòn"), cssVar: "--bad" },
  mixed: { name: bi("Both at once", "Cả hai"), cssVar: "--warn" },
  unclear: { name: bi("Can't tell", "Chưa rõ"), cssVar: "--muted" },
};

export const CONFIDENCE: Record<Confidence, { name: Bi; opacity: number }> = {
  likely: { name: bi("Likely", "Nhiều khả năng"), opacity: 1 },
  plausible: { name: bi("Plausible", "Có thể"), opacity: 0.72 },
  speculative: { name: bi("A guess", "Chỉ là phỏng đoán"), opacity: 0.46 },
};

export const LOOP_LABEL: Record<Loop, Bi> = {
  reinforcing: bi("Feeds back and grows", "Quay lại, lớn thêm"),
  balancing: bi("Feeds back and settles", "Quay lại, tự lắng"),
};

export interface RippleNode {
  id: string;
  dir: Dir;
  ring: Ring;
  sphere: Sphere;
  text: Bi; // one short, concrete sentence
  polarity: Polarity;
  confidence: Confidence;
  from: string[]; // parent ids; SEED is the centre
  loop?: Loop; // comes back round to the person
  /** Set by the person days later: did this actually happen? null = asked, not sure. */
  observed?: boolean | null;
}

export interface RippleGraph {
  seed: { text: string; source: SeedSource };
  nodes: RippleNode[];
  /** Node ids where the person has the most freedom to act. Claude names these. */
  leverage: string[];
  /** Nodes grown later by asking "and then what?" about one node. */
  expandedFrom?: string[];
}

export type SeedSource = "typed" | "diary" | "checkin";

/** The centre of the map: the thought or act itself. */
export const SEED = "seed";

// ---------- Parsing Claude's answer ----------

// The answer carries the map as JSONL inside a ```ripple fence, one node per line, then prose.
// One node per line (rather than one JSON array) means a line that has finished streaming can be
// parsed immediately, so the map grows while the answer is still being written.

const FENCE = /```ripple[^\n]*\n([\s\S]*?)(?:```|$)/;

const MAX_NODES = 48;
const MAX_TEXT = 240;

const isSphere = (v: unknown): v is Sphere => SPHERES.includes(v as Sphere);
const isDir = (v: unknown): v is Dir => v === "forward" || v === "upstream";
const isPolarity = (v: unknown): v is Polarity => v === "nourish" || v === "deplete" || v === "mixed" || v === "unclear";
const isConfidence = (v: unknown): v is Confidence => v === "likely" || v === "plausible" || v === "speculative";
const isLoop = (v: unknown): v is Loop => v === "reinforcing" || v === "balancing";

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const s = v.trim().slice(0, max);
  return s.length ? s : null;
};

/** One JSONL line → a node, or null if anything about it is off. Claude's output is never trusted. */
function toNode(raw: unknown): RippleNode | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id, 40);
  const t = o.text as Record<string, unknown> | undefined;
  const en = t && str(t.en, MAX_TEXT);
  const vi = t && str(t.vi, MAX_TEXT);
  const ring = Number(o.ring);
  if (!id || id === SEED || !en || !vi) return null;
  if (!isDir(o.dir) || !isSphere(o.sphere) || !isPolarity(o.polarity) || !isConfidence(o.confidence)) return null;
  if (ring !== 1 && ring !== 2 && ring !== 3) return null;
  const from = (Array.isArray(o.from) ? o.from : [])
    .map((x) => str(x, 40))
    .filter((x): x is string => x !== null);
  return {
    id,
    dir: o.dir,
    ring: ring as Ring,
    sphere: o.sphere,
    text: { en, vi },
    polarity: o.polarity,
    confidence: o.confidence,
    from: from.length ? from : [SEED],
    ...(isLoop(o.loop) ? { loop: o.loop } : {}),
  };
}

export interface ParsedRipple {
  nodes: RippleNode[];
  /** The map block has been closed, so no more nodes are coming. */
  complete: boolean;
  /** The answer with the map block removed, for reading. */
  prose: string;
}

/**
 * Reads whatever has arrived so far. Safe to call on every streamed chunk: a half-written
 * last line is simply skipped, and shows up once it is finished.
 */
export function parseRipple(text: string): ParsedRipple {
  const m = text.match(FENCE);
  if (!m) return { nodes: [], complete: false, prose: text.trim() };
  const complete = m[0].trimEnd().endsWith("```");
  const lines = m[1].split("\n");
  // While streaming, the final line may be cut mid-object; leave it until the fence closes.
  const usable = complete ? lines : lines.slice(0, -1);

  const nodes: RippleNode[] = [];
  const seen = new Set<string>();
  for (const line of usable) {
    const s = line.trim();
    if (!s || s.startsWith("//")) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(s);
    } catch {
      continue; // a malformed line costs that one node, not the map
    }
    const node = toNode(parsed);
    if (!node || seen.has(node.id)) continue;
    seen.add(node.id);
    nodes.push(node);
    if (nodes.length >= MAX_NODES) break;
  }
  return { nodes, complete, prose: text.replace(m[0], "").trim() };
}

/**
 * Every node drawn so far, across the first answer and any "and then what?" that followed.
 * First mention wins, so expanding a branch never redraws what is already on the map.
 */
export function collectNodes(texts: string[]): RippleNode[] {
  const out: RippleNode[] = [];
  const seen = new Set<string>();
  for (const text of texts) {
    for (const n of parseRipple(text).nodes) {
      if (seen.has(n.id)) continue;
      seen.add(n.id);
      out.push(n);
    }
  }
  return resolveEdges(out);
}

/** Node ids Claude marked as the places with the most freedom, written as {{n3}} in the prose. */
export function leverageIn(text: string, nodes: RippleNode[]): string[] {
  const ids = new Set(nodes.map((n) => n.id));
  const out: string[] = [];
  for (const m of text.matchAll(/\{\{([A-Za-z0-9_-]{1,40})\}\}/g)) {
    if (ids.has(m[1]) && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

/** Drops parent ids that never arrived, so an edge never dangles. */
export function resolveEdges(nodes: RippleNode[]): RippleNode[] {
  const ids = new Set<string>([SEED, ...nodes.map((n) => n.id)]);
  return nodes.map((n) => {
    const from = n.from.filter((f) => ids.has(f) && f !== n.id);
    return from.length === n.from.length ? n : { ...n, from: from.length ? from : [SEED] };
  });
}

// ---------- Describing a map back to Claude ----------

/** The taxonomy Claude must use. Kept in one place so prompt and app can never drift apart. */
export function rippleVocabulary(): string {
  const spheres = SPHERES.map((s) => `  "${s}" — ${SPHERE[s].name.en} (${SPHERE[s].hint.en})`).join("\n");
  const fwd = RINGS.map((r) => `  ${r} = ${RING_LABEL.forward[r].en}`).join("\n");
  const up = RINGS.map((r) => `  ${r} = ${RING_LABEL.upstream[r].en}`).join("\n");
  return `The map's fixed vocabulary (never invent values outside these):
sphere:
${spheres}
ring, when dir is "forward":
${fwd}
ring, when dir is "upstream":
${up}
polarity: "nourish" | "deplete" | "mixed" | "unclear"
confidence: "likely" | "plausible" | "speculative"
loop (optional, only when the effect comes back round to them): "reinforcing" | "balancing"
dir: "forward" (what the seed conditions) | "upstream" (what conditioned the seed)
The centre of the map has the id "${SEED}".`;
}

/** An existing map, so follow-ups and "and then what?" see what is already drawn. */
export function describeRipple(graph: RippleGraph, lang: "en" | "vi"): string {
  if (!graph.nodes.length) return "";
  const lines = graph.nodes.map((n) => {
    const loop = n.loop ? `, loop ${n.loop}` : "";
    const seen = n.observed === true ? ", THEY LATER CONFIRMED THIS HAPPENED" : n.observed === false ? ", THEY LATER SAID THIS DID NOT HAPPEN" : "";
    return `[${n.id}] ${n.dir} ring ${n.ring} ${n.sphere} (${n.polarity}, ${n.confidence}${loop}${seen}) from ${n.from.join("+")}: ${n.text[lang]}`;
  });
  return `The map already drawn for the seed "${graph.seed.text}":\n${lines.join("\n")}`;
}

// ---------- What the map looks like over time (computed here, never asked of Claude) ----------

export interface RippleStats {
  maps: number;
  nodes: number;
  /** How often each sphere is touched, most-touched first. */
  spheres: { sphere: Sphere; count: number }[];
  nourish: number;
  deplete: number;
  loops: { reinforcing: number; balancing: number };
  /** Of the nodes they answered, how many actually happened. */
  checked: { confirmed: number; denied: number };
}

export function rippleStats(graphs: RippleGraph[]): RippleStats {
  const counts = new Map<Sphere, number>();
  let nourish = 0;
  let deplete = 0;
  let reinforcing = 0;
  let balancing = 0;
  let confirmed = 0;
  let denied = 0;
  let nodes = 0;
  for (const g of graphs) {
    for (const n of g.nodes) {
      nodes++;
      counts.set(n.sphere, (counts.get(n.sphere) ?? 0) + 1);
      if (n.polarity === "nourish") nourish++;
      else if (n.polarity === "deplete") deplete++;
      if (n.loop === "reinforcing") reinforcing++;
      else if (n.loop === "balancing") balancing++;
      if (n.observed === true) confirmed++;
      else if (n.observed === false) denied++;
    }
  }
  return {
    maps: graphs.length,
    nodes,
    spheres: SPHERES.map((sphere) => ({ sphere, count: counts.get(sphere) ?? 0 })).sort((a, b) => b.count - a.count),
    nourish,
    deplete,
    loops: { reinforcing, balancing },
    checked: { confirmed, denied },
  };
}

// ---------- Layout: where each node sits on the map ----------

// The seed is a stone dropped in water. Forward effects ripple outward across the upper half,
// what conditioned the seed spreads across the lower half like roots. Angle carries the sphere,
// radius carries time, so the same kind of effect always lands in the same place.

export interface Placed extends RippleNode {
  x: number;
  y: number;
  angle: number; // radians
}

const RING_RADIUS: Record<Ring, number> = { 1: 0.38, 2: 0.66, 3: 0.94 };

/** Degrees, measured clockwise from the positive x-axis (SVG's y grows downward). */
export function sectorCentre(dir: Dir, sphere: Sphere): number {
  const i = SPHERES.indexOf(sphere);
  const width = 180 / SPHERES.length;
  const within = i * width + width / 2;
  // Forward fans across the top, upstream mirrors it across the bottom, so one sphere keeps
  // one side of the map: what it ripples into above, what conditioned it directly below.
  return dir === "forward" ? 180 + within : 180 - within;
}

/**
 * Places every node. Siblings sharing a direction, ring and sphere are fanned out inside their
 * sector, so nothing overlaps and a node never jumps as later nodes stream in.
 */
export function layout(nodes: RippleNode[], radius: number): Placed[] {
  const width = 180 / SPHERES.length;
  const groups = new Map<string, RippleNode[]>();
  for (const n of nodes) {
    const key = `${n.dir}|${n.ring}|${n.sphere}`;
    const g = groups.get(key);
    if (g) g.push(n);
    else groups.set(key, [n]);
  }
  const out: Placed[] = [];
  for (const group of groups.values()) {
    group.forEach((n, i) => {
      // -0.5…+0.5 of the usable sector, centred however many siblings there are.
      const offset = group.length === 1 ? 0 : (i / (group.length - 1) - 0.5) * width * 0.7;
      const deg = sectorCentre(n.dir, n.sphere) + offset;
      const angle = (deg * Math.PI) / 180;
      const r = RING_RADIUS[n.ring] * radius;
      out.push({ ...n, angle, x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    });
  }
  // Draw inner rings first so edges pass under the nodes they connect.
  return out.sort((a, b) => a.ring - b.ring);
}

export const ringRadius = (ring: Ring, radius: number) => RING_RADIUS[ring] * radius;
