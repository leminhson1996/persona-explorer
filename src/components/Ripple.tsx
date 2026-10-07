import { useEffect, useMemo, useState } from "react";
import { useT, type Bi, type Lang } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import {
  CONFIDENCE,
  DIR_LABEL,
  LOOP_LABEL,
  POLARITY,
  RING_LABEL,
  RINGS,
  SPHERE,
  collectNodes,
  describeRipple,
  leverageIn,
  parseRipple,
  rippleVocabulary,
  type Dir,
  type RippleGraph,
  type RippleNode,
} from "../lib/ripple";
import type { CheckIn, DiaryEntry, Reading } from "../lib/types";
import ChatThread from "./ChatThread";
import RippleMap from "./RippleMap";

const L = {
  title: { en: "Trace the ripples", vi: "Lần theo gợn sóng" },
  intro: {
    en: "One thought, one act. Where did it come from, and what does it touch? Nothing here is a prediction — it is a way of seeing that nothing arises on its own.",
    vi: "Một ý nghĩ, một việc làm. Nó khởi lên từ đâu, và nó chạm tới những gì? Đây không phải lời tiên đoán — chỉ là một cách thấy rằng không gì tự mình sinh ra.",
  },
  placeholder: {
    en: "e.g. I snapped at my mother on the phone this morning…",
    vi: "Ví dụ: Sáng nay mình gắt với mẹ qua điện thoại…",
  },
  seed: { en: "Plant it", vi: "Gieo hạt" },
  again: { en: "Another seed", vi: "Gieo hạt khác" },
  stop: { en: "Stop", vi: "Dừng" },
  fromToday: { en: "Or from today:", vi: "Hoặc lấy từ hôm nay:" },
  drawing: { en: "The map is still being drawn…", vi: "Bản đồ đang được vẽ…" },
  expand: { en: "And then what?", vi: "Rồi sao nữa?" },
  freedom: { en: "Room to act", vi: "Chỗ có tự do" },
  happened: { en: "Did this happen?", vi: "Điều này có xảy ra không?" },
  yes: { en: "It did", vi: "Có" },
  no: { en: "It didn't", vi: "Không" },
  asMap: { en: "Map", vi: "Bản đồ" },
  asList: { en: "List", vi: "Danh sách" },
  tapNode: { en: "Tap a point to follow its thread.", vi: "Chạm vào một điểm để lần theo mạch của nó." },
  legend: {
    en: "Above the line: what it ripples into. Below: what gave rise to it. Further out is further in time, and faint means it is only a guess.",
    vi: "Trên đường ngang: điều nó lan tới. Dưới: điều làm nó khởi lên. Càng ra ngoài càng xa về thời gian, càng mờ càng chỉ là phỏng đoán.",
  },
} satisfies Record<string, Bi>;

/** Seeds offered from what they already wrote today, so they needn't start from a blank box. */
function suggestions(diary: DiaryEntry[], checkin: CheckIn | undefined, today: string): string[] {
  const out: string[] = [];
  for (const e of diary.filter((d) => d.date === today)) {
    const first = e.text.trim().split(/(?<=[.!?…])\s|\n/)[0]?.trim();
    if (first && first.length > 12) out.push(first.slice(0, 160));
  }
  const note = checkin?.note?.trim();
  if (note && note.length > 12) out.push(note.split(/(?<=[.!?…])\s|\n/)[0].slice(0, 160));
  const focus = checkin?.focus?.trim();
  if (focus && focus.length > 8) out.push(focus.slice(0, 160));
  return [...new Set(out)].slice(0, 3);
}

interface Props {
  reading?: Reading;
  today: string;
  diary: DiaryEntry[];
  checkin?: CheckIn;
  /** Everything Claude may know about them, at full scope. */
  contextFor: () => string;
}

export default function Ripple({ reading, today, diary, checkin, contextFor }: Props) {
  const { tr, lang } = useT();
  const session = useGuide("ripple");
  const [text, setText] = useState("");
  const [view, setView] = useState<"map" | "list">("map");
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    guide.ensure("ripple", "ripple", today, reading);
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = session?.pending != null;
  const messages = useMemo(() => session?.messages ?? [], [session?.messages]);
  const answers = useMemo(
    () => [...messages.filter((m) => m.role === "assistant").map((m) => m.content), ...(session?.pending ? [session.pending] : [])],
    [messages, session?.pending],
  );
  const drawn = useMemo(() => collectNodes(answers), [answers]);
  const leverage = useMemo(() => answers.flatMap((a) => leverageIn(a, drawn)), [answers, drawn]);
  const saved = session?.ripple?.nodes;
  const seedText = session?.ripple?.seed.text ?? "";
  const started = messages.length > 0 || busy;

  // What has been drawn, carrying the ✓/✗ marks the person added to it afterwards.
  const nodes = useMemo(() => {
    const byId = new Map((saved ?? []).map((n) => [n.id, n.observed]));
    return drawn.map((n) => (byId.has(n.id) ? { ...n, observed: byId.get(n.id) } : n));
  }, [drawn, saved]);

  // Keep the saved map in step with what has been drawn, so marks added later survive a reload.
  useEffect(() => {
    if (!session || !nodes.length) return;
    const same = JSON.stringify(nodes) === JSON.stringify(saved) && leverage.join() === (session.ripple?.leverage ?? []).join();
    if (same) return;
    guide.setRipple("ripple", { seed: session.ripple?.seed ?? { text: seedText, source: "typed" }, nodes, leverage });
  }, [nodes, leverage]); // eslint-disable-line react-hooks/exhaustive-deps

  const mark = (id: string, value: boolean) => {
    const g = session?.ripple;
    if (!g) return;
    guide.setRipple("ripple", { ...g, nodes: g.nodes.map((n) => (n.id === id ? { ...n, observed: n.observed === value ? null : value } : n)) });
  };

  /**
   * Everything known about them, plus the vocabulary, plus whichever map is being worked on.
   * The map is passed in rather than read from the session: a new seed is planted before the
   * session has caught up, and must not be handed the previous seed's map.
   */
  const context = (map?: RippleGraph) =>
    [contextFor(), rippleVocabulary(), map ? describeRipple(map, lang) : ""].filter(Boolean).join("\n\n");

  const plant = (seedRaw: string, source: RippleGraph["seed"]["source"]) => {
    const seed = seedRaw.trim();
    if (!seed || busy) return;
    guide.restart("ripple", today, "full");
    guide.setRipple("ripple", { seed: { text: seed, source }, nodes: [], leverage: [] });
    const content = `Trace the ripples of this, as a map (duyên khởi):\n\n"${seed}"\n\nFollow the ripple-map format: the \`\`\`ripple fence of JSONL first, then the prose.`;
    void guide.send("ripple", [{ role: "user", content }], { lang, context: context() });
    setSelected(null);
    setText("");
  };

  const expand = (n: RippleNode) => {
    if (busy) return;
    const content = `And then what? Expand "${n.text[lang]}" [${n.id}] one more step. Add only new nodes that follow from it — keep every id already on the map unchanged — then a short paragraph, no headings.`;
    void guide.send("ripple", [...messages, { role: "user", content }], { lang, context: context(session?.ripple) });
  };

  const seeds = suggestions(diary, checkin, today);
  // The thread shows the writing; the data block that feeds the map is stripped out of it.
  const clean = (t: string) => withNodeText(parseRipple(t).prose, nodes, lang);
  const chosen = nodes.find((n) => n.id === selected);

  const card = (n: RippleNode, where: "map" | "list") => (
    <NodeCard n={n} lang={lang} lever={leverage.includes(n.id)} busy={busy} where={where}
      onExpand={() => expand(n)} onMark={(v) => mark(n.id, v)} />
  );

  return (
    <div className="stack ripple">
      <section className="card">
        <h2>🌊 {tr(L.title)}</h2>
        <p className="small muted">{tr(L.intro)}</p>
        {(!started || !busy) && (
          <form
            className="ripple-form"
            onSubmit={(e) => {
              e.preventDefault();
              plant(text, "typed");
            }}
          >
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={tr(L.placeholder)}
              rows={3}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) plant(text, "typed");
              }}
            />
            <button className="primary" disabled={!text.trim() || busy}>
              {started ? tr(L.again) : tr(L.seed)}
            </button>
          </form>
        )}
        {!started && seeds.length > 0 && (
          <div className="ripple-seeds">
            <span className="tiny muted">{tr(L.fromToday)}</span>
            <div className="chips">
              {seeds.map((s, i) => (
                <button key={i} className="chip" onClick={() => plant(s, i < diary.filter((d) => d.date === today).length ? "diary" : "checkin")}>
                  {s.length > 64 ? `${s.slice(0, 64)}…` : s}
                </button>
              ))}
            </div>
          </div>
        )}
        {busy && (
          <button className="ghost small" onClick={() => guide.stop("ripple")}>
            ■ {tr(L.stop)}
          </button>
        )}
      </section>

      {started && (
        <section className="card ripple-board">
          <div className="ripple-head">
            {seedText && <p className="ripple-seed-text">“{seedText}”</p>}
            {nodes.length > 0 && (
              <div className="chips" role="group">
                {(["map", "list"] as const).map((v) => (
                  <button key={v} className={`chip${view === v ? " on" : ""}`} onClick={() => setView(v)} aria-pressed={view === v}>
                    {v === "map" ? `🌐 ${tr(L.asMap)}` : `☰ ${tr(L.asList)}`}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!nodes.length ? (
            <p className="shimmer small">{tr(L.drawing)}</p>
          ) : view === "map" ? (
            <>
              <RippleMap nodes={nodes} leverage={leverage} seed={seedText} selected={selected} onSelect={setSelected} />
              {chosen ? (
                <div className="ripple-chosen">
                  <p className="eyebrow">
                    {tr(SPHERE[chosen.sphere].name)} · {tr(RING_LABEL[chosen.dir][chosen.ring])} · {tr(POLARITY[chosen.polarity].name)}
                  </p>
                  {card(chosen, "map")}
                </div>
              ) : (
                <p className="tiny muted center">{tr(L.tapNode)}</p>
              )}
            </>
          ) : (
            (["forward", "upstream"] as Dir[]).map((dir) => {
              const mine = nodes.filter((n) => n.dir === dir);
              if (!mine.length) return null;
              return (
                <div key={dir} className={`ripple-dir ripple-${dir}`}>
                  <h3>{dir === "forward" ? "🌊" : "🌱"} {tr(DIR_LABEL[dir])}</h3>
                  {RINGS.map((ring) => {
                    const row = mine.filter((n) => n.ring === ring);
                    if (!row.length) return null;
                    return (
                      <div key={ring} className="ripple-ring">
                        <span className="eyebrow">{tr(RING_LABEL[dir][ring])}</span>
                        <ul>{row.map((n) => <li key={n.id}>{card(n, "list")}</li>)}</ul>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
          {nodes.length > 0 && <p className="tiny muted">{tr(L.legend)}</p>}
        </section>
      )}

      {started && <ChatThread kind="ripple" reading={reading} contextFor={() => context(session?.ripple)} clean={clean} />}
    </div>
  );
}

interface CardProps {
  n: RippleNode;
  lang: Lang;
  lever: boolean;
  busy: boolean;
  where: "map" | "list";
  onExpand: () => void;
  onMark: (value: boolean) => void;
}

/** One node as it reads: on the map for the chosen point, in the list for every point at once. */
function NodeCard({ n, lang, lever, busy, where, onExpand, onMark }: CardProps) {
  const { tr } = useT();
  return (
    <div
      className={`ripple-node${lever ? " lever" : ""}`}
      style={{
        borderLeftColor: `var(${POLARITY[n.polarity].cssVar})`,
        // On the map the dot already carries the confidence; the text beside it stays readable.
        opacity: where === "map" ? 1 : CONFIDENCE[n.confidence].opacity,
      }}
    >
      <span className="ripple-sphere" title={tr(SPHERE[n.sphere].name)}>{SPHERE[n.sphere].icon}</span>
      <span className="ripple-text">{n.text[lang]}</span>
      <span className="ripple-tags">
        {lever && <span className="pill lever">🪷 {tr(L.freedom)}</span>}
        {n.loop && <span className="pill">🔁 {tr(LOOP_LABEL[n.loop])}</span>}
        <span className="tiny muted">{tr(CONFIDENCE[n.confidence].name)}</span>
      </span>
      <span className="ripple-acts">
        <button className="ghost tiny" disabled={busy} onClick={onExpand}>{tr(L.expand)}</button>
        {n.dir === "forward" && (
          <>
            <button className={`ghost tiny${n.observed === true ? " on" : ""}`} title={tr(L.happened)} onClick={() => onMark(true)}>
              ✓ {tr(L.yes)}
            </button>
            <button className={`ghost tiny${n.observed === false ? " on" : ""}`} title={tr(L.happened)} onClick={() => onMark(false)}>
              ✗ {tr(L.no)}
            </button>
          </>
        )}
      </span>
    </div>
  );
}

/** Turns the {{n4}} references in the prose into the node's own words. */
function withNodeText(prose: string, nodes: RippleNode[], lang: Lang): string {
  return prose.replace(/\{\{([A-Za-z0-9_-]{1,40})\}\}/g, (whole, id) => {
    const n = nodes.find((x) => x.id === id);
    return n ? `**“${n.text[lang]}”**` : whole;
  });
}
