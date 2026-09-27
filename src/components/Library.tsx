import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { fmt, useT, type Bi } from "../lib/i18n";
import { useSessions, type Session } from "../lib/guideStore";
import type { Reading, ReadingKind } from "../lib/types";
import { spreadById } from "../lib/tarot";
import { CardFace } from "./Tarot";

export const KIND_META: Record<ReadingKind, { icon: string; label: Bi; cls: string }> = {
  daily: { icon: "✦", label: { en: "Daily guidance", vi: "Hằng ngày" }, cls: "k-daily" },
  chart: { icon: "☯", label: { en: "Tử Vi & Bát Tự", vi: "Tử Vi & Bát Tự" }, cls: "k-chart" },
  dharma: { icon: "☸", label: { en: "Buddhist path", vi: "Phật pháp" }, cls: "k-dharma" },
  tarot: { icon: "🃏", label: { en: "Tarot", vi: "Tarot" }, cls: "k-tarot" },
  progress: { icon: "📈", label: { en: "Growth review", vi: "Tổng kết" }, cls: "k-progress" },
};

const kindOf = (r: Reading): ReadingKind => r.kind ?? "daily";
const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase();
const plain = (md: string) => md.replace(/[#*_>`~-]+/g, " ").replace(/\s+/g, " ").trim();

/** First real sentence of the first answer (skipping headings), for the list preview. */
function snippet(r: Reading): string {
  const answer = r.messages.find((m) => m.role === "assistant")?.content ?? "";
  const para = answer.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#")) ?? answer;
  const text = plain(para);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

const followUps = (r: Reading) => r.messages.slice(1).filter((m) => m.role === "user").map((m) => m.content);

function toMarkdown(r: Reading, title: string, when: string, youLabel: string): string {
  const body = r.messages.slice(1).map((m) => (m.role === "assistant" ? m.content : `> **${youLabel}:** ${m.content}`));
  return `# ${title}\n\n_${when}_\n\n${body.join("\n\n---\n\n")}\n`;
}

interface Props {
  readings: Reading[];
  onDelete: (id: string) => void;
  onContinue: (kind: ReadingKind) => void;
}

export default function Library({ readings: savedReadings, onDelete, onContinue }: Props) {
  const { t, tr, lang } = useT();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const sessions = useSessions();
  const live = (Object.values(sessions) as Session[]).filter((x) => x.pending !== null);
  const streaming = live.map((x) => x.kind);
  const currentIds: Partial<Record<ReadingKind, string>> = {};
  (Object.values(sessions) as Session[]).forEach((x) => (currentIds[x.kind] = x.readingId));
  // Readings still being written appear right away, with their live text.
  const readings = useMemo(() => {
    const liveReadings: Reading[] = live.map((x) => ({
      id: x.readingId, kind: x.kind, date: x.date, createdAt: x.createdAt, status: "streaming",
      messages: x.pending ? [...x.messages, { role: "assistant", content: x.pending }] : x.messages,
    }));
    return [...savedReadings.filter((r) => !liveReadings.some((l) => l.id === r.id)), ...liveReadings];
  }, [savedReadings, sessions]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filter, setFilter] = useState<ReadingKind | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const sorted = useMemo(() => [...readings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [readings]);
  const counts = useMemo(() => {
    const c: Record<ReadingKind | "all", number> = { all: readings.length, daily: 0, chart: 0, dharma: 0, tarot: 0, progress: 0 };
    readings.forEach((r) => c[kindOf(r)]++);
    return c;
  }, [readings]);

  const q = fold(query.trim());
  const shown = sorted.filter(
    (r) => (filter === "all" || kindOf(r) === filter) && (!q || r.messages.some((m) => fold(m.content).includes(q))),
  );

  // Group by month.
  const groups: { key: string; label: string; items: Reading[] }[] = [];
  for (const r of shown) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    let g = groups.find((x) => x.key === key);
    if (!g) groups.push((g = { key, label: d.toLocaleDateString(locale, { month: "long", year: "numeric" }), items: [] }));
    g.items.push(r);
  }

  const selected = shown.find((r) => r.id === selectedId) ?? null;
  const when = (r: Reading) =>
    new Date(r.createdAt).toLocaleString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const isLive = (r: Reading) => streaming.includes(kindOf(r)) && currentIds[kindOf(r)] === r.id;

  const scopeBadge = (r: Reading) =>
    r.scope && r.scope !== "full" ? <span className="badge scope">{t(r.scope === "profile" ? "scopeProfile" : r.scope === "cards" ? "scopeCards" : "scopeBirth")}</span> : null;
  const statusBadge = (r: Reading) =>
    isLive(r) ? <span className="badge live">● {t("libWriting")}</span>
      : r.status === "streaming" || r.status === "interrupted" ? <span className="badge warn">{t("libInterrupted")}</span>
      : null;

  const copy = async (r: Reading) => {
    try {
      await navigator.clipboard.writeText(toMarkdown(r, tr(KIND_META[kindOf(r)].label), when(r), t("you")));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  };

  const download = (r: Reading) => {
    const blob = new Blob([toMarkdown(r, tr(KIND_META[kindOf(r)].label), when(r), t("you"))], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${kindOf(r)}-${r.date}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className={`library ${selected ? "has-selection" : ""}`}>
      <section className="card lib-list">
        <h2>📚 {t("libTitle")}</h2>
        <input className="lib-search" type="search" placeholder={t("libSearch")} value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="chips lib-filters" role="tablist">
          {(["all", "daily", "chart", "dharma", "tarot", "progress"] as const).map((k) => (
            <button key={k} role="tab" aria-selected={filter === k} className={`chip ${filter === k ? "on" : ""}`} onClick={() => setFilter(k)}>
              {k === "all" ? t("libAll") : `${KIND_META[k].icon} ${tr(KIND_META[k].label)}`} <span className="count">{counts[k]}</span>
            </button>
          ))}
        </div>

        {!shown.length ? (
          <p className="muted small">{readings.length ? t("libNoMatch") : t("libEmpty")}</p>
        ) : (
          groups.map((g) => (
            <div key={g.key} className="lib-group">
              <p className="eyebrow">{g.label}</p>
              <ul>
                {g.items.map((r) => {
                  const k = kindOf(r);
                  const fu = followUps(r);
                  return (
                    <li key={r.id}>
                      <button className={`lib-item ${selectedId === r.id ? "on" : ""}`} onClick={() => setSelectedId(r.id)}>
                        <div className="lib-item-head">
                          <span className={`kind-tag ${KIND_META[k].cls}`}>{KIND_META[k].icon} {tr(KIND_META[k].label)}</span>
                          <span className="tiny muted">{new Date(r.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short" })}</span>
                        </div>
                        {r.tarot?.question && <p className="small"><strong>❓ {r.tarot.question}</strong></p>}
                        <p className="small">{snippet(r) || "…"}</p>
                        <div className="lib-item-foot tiny muted">
                          {fu.length > 0 && <span>💬 {fmt(t("libFollowUps"), { n: fu.length })}</span>}
                          {scopeBadge(r)}
                          {statusBadge(r)}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>

      <section className="card lib-detail">
        {!selected ? (
          <p className="muted center">{t("libPick")}</p>
        ) : (
          <>
            <button className="link lib-back" onClick={() => setSelectedId(null)}>← {t("libBack")}</button>
            <div className="lib-detail-head">
              <div>
                <span className={`kind-tag ${KIND_META[kindOf(selected)].cls}`}>
                  {KIND_META[kindOf(selected)].icon} {tr(KIND_META[kindOf(selected)].label)}
                </span>
                {scopeBadge(selected)}
                {statusBadge(selected)}
                <p className="small muted">{when(selected)}</p>
              </div>
              <div className="row wrap">
                {currentIds[kindOf(selected)] === selected.id && (
                  <button className="primary" onClick={() => onContinue(kindOf(selected))}>{t("libContinue")} →</button>
                )}
                <button className="ghost" onClick={() => copy(selected)}>{copied ? "✓" : "⧉"} {t("libCopy")}</button>
                <button className="ghost" onClick={() => download(selected)}>⬇ .md</button>
                <button
                  className="danger"
                  disabled={isLive(selected)}
                  onClick={() => {
                    if (!confirm(t("libDeleteConfirm"))) return;
                    onDelete(selected.id);
                    setSelectedId(null);
                  }}
                >
                  {t("delete")}
                </button>
              </div>
            </div>
            {selected.tarot && (
              <div className="lib-tarot">
                {selected.tarot.question && <p><strong>❓ {selected.tarot.question}</strong></p>}
                <p className="tiny muted">{tr(spreadById(selected.tarot.spread).name)}</p>
                <div className="lib-cards">
                  {selected.tarot.cards.map((c, i) => (
                    <CardFace key={i} c={c} size="sm" label={`${i + 1}. ${tr(spreadById(selected.tarot!.spread).positions[i])}`} />
                  ))}
                </div>
              </div>
            )}
            <div className="thread">
              {selected.messages.slice(1).map((m, i) =>
                m.role === "assistant" ? (
                  <article key={i} className="msg guide"><ReactMarkdown>{m.content}</ReactMarkdown></article>
                ) : (
                  <p key={i} className="msg me"><span className="who">{t("you")}</span>{m.content}</p>
                ),
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
