import { useEffect, useState, useSyncExternalStore } from "react";
import { fmt, useT } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import { SUITS, SPREADS, cardById, describeDraw, shuffleDeck, spreadById, type DrawnCard, type TarotDraw } from "../lib/tarot";
import type { ContextScope, Reading } from "../lib/types";
import ChatThread from "./ChatThread";

// ---------- Draft (survives tab switches) ----------

interface Draft {
  phase: "setup" | "pick" | "ready" | "reading";
  question: string;
  spread: string;
  reversals: boolean;
  deck: DrawnCard[];
  picked: number[]; // indices into deck, in position order
}

let draft: Draft = { phase: "setup", question: "", spread: "ppf", reversals: true, deck: [], picked: [] };
let draftInit = false;
const draftListeners = new Set<() => void>();
const setDraft = (patch: Partial<Draft>) => {
  draft = { ...draft, ...patch };
  draftListeners.forEach((l) => l());
};
const useDraft = () =>
  useSyncExternalStore(
    (l) => {
      draftListeners.add(l);
      return () => void draftListeners.delete(l);
    },
    () => draft,
  );

const TAROT_SCOPES: ("cards" | "profile" | "full")[] = ["cards", "profile", "full"];
const SCOPE_KEY = "ue.tarotScope";
const SCOPE_LABEL = { cards: "scopeCards", profile: "scopeProfile", full: "scopeFull" } as const;
const SCOPE_HINT = { cards: "tarotScopeCardsHint", profile: "tarotScopeProfileHint", full: "tarotScopeFullHint" } as const;

// ---------- Card ----------

export function CardFace({ c, faceUp = true, size = "md", label }: { c?: DrawnCard; faceUp?: boolean; size?: "sm" | "md"; label?: string }) {
  const { tr, t } = useT();
  const card = c ? cardById(c.id) : null;
  return (
    <figure className={`tcard ${size} ${faceUp && card ? "up" : "down"}`}>
      <div className="tcard-inner">
        <div className="tcard-back" aria-hidden="true"><span>✦</span></div>
        {card && (
          <div className={`tcard-front ${card.suit} ${c!.reversed ? "reversed" : ""}`}>
            <span className="tcard-rank">{card.rank}</span>
            <span className="tcard-symbol">{card.symbol}</span>
            <span className="tcard-name">{tr(card.name)}</span>
          </div>
        )}
      </div>
      {(label || (faceUp && c?.reversed)) && (
        <figcaption className="tiny">
          {label}
          {faceUp && c?.reversed && <span className="rev-tag"> ↺ {t("tarotReversed")}</span>}
        </figcaption>
      )}
    </figure>
  );
}

function SpreadLayout({ spreadId, cards, faceUp }: { spreadId: string; cards: (DrawnCard | undefined)[]; faceUp: boolean }) {
  const { tr } = useT();
  const spread = spreadById(spreadId);
  return (
    <div className={`spread spread-${spread.id}`}>
      {spread.positions.map((pos, i) => (
        <div key={i} className={`slot slot-${i + 1}`}>
          <CardFace c={cards[i]} faceUp={faceUp && !!cards[i]} label={`${i + 1}. ${tr(pos)}`} size={spread.id === "celtic" ? "sm" : "md"} />
        </div>
      ))}
    </div>
  );
}

function Meanings({ draw }: { draw: TarotDraw }) {
  const { tr, t } = useT();
  const spread = spreadById(draw.spread);
  return (
    <ol className="meanings">
      {draw.cards.map((c, i) => {
        const card = cardById(c.id);
        return (
          <li key={i}>
            <span className="muted small">{tr(spread.positions[i])}</span>
            <div>
              <strong>{tr(card.name)}</strong>
              {c.reversed && <span className="rev-tag"> ↺ {t("tarotReversed")}</span>}
              {card.suit !== "major" && <span className="tiny muted"> · {tr(SUITS[card.suit].name)} ({tr(SUITS[card.suit].element)})</span>}
            </div>
            <p className="small muted">{tr(c.reversed ? card.rev : card.up)}</p>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- Page ----------

interface Props {
  reading?: Reading; // latest tarot reading
  today: string;
  contextFor: (scope: ContextScope) => string;
}

export default function Tarot({ reading, today, contextFor }: Props) {
  const { t, tr, lang } = useT();
  const d = useDraft();
  const session = useGuide("tarot");
  const busy = (session?.pending ?? null) !== null;
  const [scope, setScope] = useState<"cards" | "profile" | "full">(() => {
    try {
      const v = localStorage.getItem(SCOPE_KEY);
      return v === "profile" || v === "full" ? v : "cards";
    } catch {
      return "cards";
    }
  });

  useEffect(() => {
    guide.ensure("tarot", "tarot", today, reading);
  }, [today, reading]);

  // First visit: show the last reading if there is one.
  useEffect(() => {
    if (draftInit || !session) return;
    draftInit = true;
    if (session.tarot && session.messages.length) setDraft({ phase: "reading" });
  }, [session]);

  const spread = spreadById(d.spread);
  const need = spread.positions.length;
  const pickedCards = d.picked.map((i) => d.deck[i]);

  const shuffle = () => setDraft({ phase: "pick", deck: shuffleDeck(d.reversals), picked: [] });
  const pick = (i: number) => {
    if (d.phase !== "pick" || d.picked.includes(i) || d.picked.length >= need) return;
    const picked = [...d.picked, i];
    setDraft({ picked, phase: picked.length === need ? "ready" : "pick" });
  };
  const pickRandom = () => {
    const free = d.deck.map((_, i) => i).filter((i) => !d.picked.includes(i));
    const rand = new Uint32Array(need);
    crypto.getRandomValues(rand);
    const picked = [...d.picked];
    for (let k = 0; picked.length < need; k++) picked.push(free.splice(rand[k] % free.length, 1)[0]);
    setDraft({ picked, phase: "ready" });
  };

  const interpret = () => {
    const draw: TarotDraw = { question: d.question.trim(), spread: d.spread, cards: pickedCards };
    guide.restart("tarot", today, scope, draw);
    const content = describeDraw(draw, lang) + (scope === "cards" ? `\n\n${t("tarotCardsOnlyNote")}` : "");
    void guide.send("tarot", [{ role: "user", content }], { lang, context: contextFor(scope) });
    setDraft({ phase: "reading" });
  };

  const newDraw = () => setDraft({ phase: "setup", deck: [], picked: [] });

  const chooseScope = (v: "cards" | "profile" | "full") => {
    setScope(v);
    try {
      localStorage.setItem(SCOPE_KEY, v);
    } catch {
      /* ignore */
    }
  };

  // ----- Reading view -----
  if (d.phase === "reading" && session?.tarot) {
    const draw = session.tarot;
    return (
      <div className="today tarot">
        <section className="card">
          <div className="guidance-head">
            <div>
              <p className="eyebrow">🃏 {tr(spreadById(draw.spread).name)} · {t(SCOPE_LABEL[session.contextScope as "cards" | "profile" | "full"] ?? "scopeCards")}</p>
              <h2>{draw.question || t("tarotNoQuestion")}</h2>
            </div>
            {busy ? (
              <button className="ghost" onClick={() => guide.stop("tarot")}>■ {t("stop")}</button>
            ) : (
              <button className="primary" onClick={newDraw}>🔀 {t("tarotNewDraw")}</button>
            )}
          </div>
          <SpreadLayout spreadId={draw.spread} cards={draw.cards} faceUp />
          <details className="meanings-wrap" open={draw.cards.length <= 3}>
            <summary className="small">{t("tarotMeanings")}</summary>
            <Meanings draw={draw} />
          </details>
        </section>
        <section className="card guidance">
          <h2>✨ {t("tarotReadingTitle")}</h2>
          <ChatThread kind="tarot" reading={reading} contextFor={contextFor} />
        </section>
      </div>
    );
  }

  // ----- Setup / picking view -----
  return (
    <div className="today tarot">
      <section className="card">
        <h2>🃏 {t("tarotTitle")}</h2>
        <p className="muted small">{t("tarotIntro")}</p>

        {d.phase === "setup" && (
          <>
            <div className="field">
              <label htmlFor="tq">{t("tarotQuestion")}</label>
              <textarea id="tq" rows={2} placeholder={t("tarotQuestionHint")} value={d.question} onChange={(e) => setDraft({ question: e.target.value })} />
            </div>
            <div className="field">
              <label>{t("tarotSpread")}</label>
              <div className="spread-options">
                {SPREADS.map((s) => (
                  <button key={s.id} className={`spread-option ${d.spread === s.id ? "on" : ""}`} onClick={() => setDraft({ spread: s.id })}>
                    <strong>{tr(s.name)}</strong>
                    <span className="tiny muted">{tr(s.description)}</span>
                  </button>
                ))}
              </div>
            </div>
            <label className="check small">
              <input type="checkbox" checked={d.reversals} onChange={(e) => setDraft({ reversals: e.target.checked })} /> {t("tarotUseReversals")}
            </label>
            <div className="scope-picker">
              <p className="small"><strong>{t("scopeTitle")}</strong></p>
              <div className="chips" role="radiogroup" aria-label={t("scopeTitle")}>
                {TAROT_SCOPES.map((v) => (
                  <button key={v} role="radio" aria-checked={scope === v} className={`chip ${scope === v ? "on" : ""}`} onClick={() => chooseScope(v)}>
                    {t(SCOPE_LABEL[v])}
                  </button>
                ))}
              </div>
              <p className="tiny muted">{t(SCOPE_HINT[scope])}</p>
            </div>
            <div className="actions">
              {session?.tarot && session.messages.length > 0 && (
                <button className="ghost" onClick={() => setDraft({ phase: "reading" })}>{t("tarotLastReading")}</button>
              )}
              <button className="primary" onClick={shuffle}>🔀 {t("tarotShuffle")}</button>
            </div>
          </>
        )}

        {(d.phase === "pick" || d.phase === "ready") && (
          <>
            <p className="small">
              {d.question ? <>❓ <em>{d.question}</em> · </> : null}
              <strong>{tr(spread.name)}</strong>
            </p>
            <SpreadLayout spreadId={d.spread} cards={Array.from({ length: need }, (_, i) => pickedCards[i])} faceUp />
            {d.phase === "pick" ? (
              <>
                <p className="small center">{fmt(t("tarotPickPrompt"), { n: need - d.picked.length })}</p>
                <div className="deck-strip" role="list">
                  {d.deck.map((_, i) =>
                    d.picked.includes(i) ? null : (
                      <button key={i} className="deck-card" role="listitem" aria-label={`${t("tarotCard")} ${i + 1}`} onClick={() => pick(i)}>
                        <span>✦</span>
                      </button>
                    ),
                  )}
                </div>
                <div className="actions">
                  <button className="ghost" onClick={newDraw}>{t("diaryCancel")}</button>
                  <button className="ghost" onClick={shuffle}>🔀 {t("tarotReshuffle")}</button>
                  <button className="ghost" onClick={pickRandom}>🎲 {t("tarotPickRandom")}</button>
                </div>
              </>
            ) : (
              <div className="actions">
                <button className="ghost" onClick={newDraw}>{t("diaryCancel")}</button>
                <button className="primary" onClick={interpret} disabled={busy}>✨ {t("tarotInterpret")}</button>
              </div>
            )}
          </>
        )}
      </section>
      <p className="tiny muted center">{t("tarotDisclaimer")}</p>
    </div>
  );
}
