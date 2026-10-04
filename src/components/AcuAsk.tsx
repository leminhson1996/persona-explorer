import { useEffect, useState } from "react";
import { useT, type Bi } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import { ACUPOINTS, REGIONS, SYMPTOMS, pointById } from "../lib/acupoints";
import type { Reading } from "../lib/types";
import ChatThread from "./ChatThread";

const L = {
  title: { en: "Describe it in your own words", vi: "Mô tả tình trạng bằng lời của bạn" },
  intro: {
    en: "Claude chooses from the same verified points shown above and explains why. Mention how long it has lasted, what makes it better or worse, and whether you might be pregnant.",
    vi: "Claude chỉ chọn trong các huyệt đã được kiểm chứng ở trên và giải thích vì sao. Hãy nói rõ đã bị bao lâu, điều gì làm đỡ hay nặng hơn, và bạn có đang mang thai không.",
  },
  placeholder: {
    en: "e.g. A dry, tickly cough for 5 days, worse at night, throat feels dry…",
    vi: "Ví dụ: Ho khan 5 ngày nay, về đêm ho nhiều, họng khô rát, hơi khàn tiếng…",
  },
  ask: { en: "Ask Claude", vi: "Hỏi Claude" },
  again: { en: "New question", vi: "Hỏi điều khác" },
  show: { en: "Show these points on the body", vi: "Xem các huyệt này trên hình người" },
  stop: { en: "Stop", vi: "Dừng" },
  you: { en: "You", vi: "Bạn" },
} satisfies Record<string, Bi>;

const ID_BY_TOKEN = new Map<string, string>();
for (const p of ACUPOINTS) {
  ID_BY_TOKEN.set(p.id, p.id);
  ID_BY_TOKEN.set(p.code.replace(/\s/g, "").toUpperCase(), p.id);
}

/** Point ids referenced as [LI4], [YINTANG]… in an answer, in order of first mention. */
export function pointsInAnswer(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\[([A-Za-z]{2,}-?[A-Za-z0-9]*)\]/g)) {
    const id = ID_BY_TOKEN.get(m[1].toUpperCase());
    if (id && !out.includes(id)) out.push(id);
  }
  return out;
}

/** The point catalog Claude must choose from. */
function catalog(): string {
  const lines = ACUPOINTS.map((p) =>
    `[${p.id}] ${p.vi} (${p.zh}; ${p.code}) — ${REGIONS[p.region].en}${p.bilateral ? ", both sides" : ", midline"} — ${p.uses.en}${p.pregnancy ? " — AVOID IN PREGNANCY" : ""}`,
  );
  const sym = SYMPTOMS.map((s) => `- ${s.name.en} / ${s.name.vi}: ${s.points.map((id) => `[${id}]`).join(" ")}`);
  return `Acupressure point catalog (the only points the app can show on its 3D body):\n${lines.join("\n")}\n\nThe app's own symptom → point lists, for reference:\n${sym.join("\n")}`;
}

interface Props {
  reading?: Reading;
  today: string;
  onAnswered: () => void;
  onShowPoints: () => void;
}

export default function AcuAsk({ reading, today, onAnswered, onShowPoints }: Props) {
  const { tr, lang } = useT();
  const session = useGuide("acu");
  const [text, setText] = useState("");

  useEffect(() => {
    guide.ensure("acu", "acu", today, reading);
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const busy = session?.pending != null;
  const has = (session?.messages.length ?? 0) > 0 || busy;
  const lastAnswer = session?.pending ?? [...(session?.messages ?? [])].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const ids = pointsInAnswer(lastAnswer);
  const question = session?.messages[0]?.content.match(/"([\s\S]*)"/)?.[1];

  // Show Claude's points on the body as soon as an answer starts naming them.
  const named = ids.length > 0;
  useEffect(() => {
    if (busy && named) onAnswered();
  }, [busy, named]); // eslint-disable-line react-hooks/exhaustive-deps

  const contextFor = () => catalog();

  const ask = () => {
    const q = text.trim();
    if (!q || busy) return;
    guide.restart("acu", today, "cards");
    const content = `I'd like acupressure (bấm huyệt) self-care for this:\n\n"${q}"\n\nFollow the acupressure format. Choose only from the catalog and write each point's id in square brackets exactly as listed, e.g. [LI4].`;
    void guide.send("acu", [{ role: "user", content }], { lang, context: contextFor() });
    setText("");
  };

  return (
    <section className="card acu-ask">
      <h3>✦ {tr(L.title)}</h3>
      <p className="small muted">{tr(L.intro)}</p>
      {(!has || !busy) && (
        <form
          className="acu-ask-form"
          onSubmit={(e) => {
            e.preventDefault();
            ask();
          }}
        >
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={tr(L.placeholder)} rows={3}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) ask();
            }}
          />
          <button className="primary" disabled={!text.trim() || busy}>{has ? tr(L.again) : tr(L.ask)}</button>
        </form>
      )}
      {has && (
        <>
          {busy && <button className="ghost small" onClick={() => guide.stop("acu")}>■ {tr(L.stop)}</button>}
          {ids.length > 0 && (
            <div className="chips acu-ask-points">
              <button className="chip on" onClick={onShowPoints}>🧍 {tr(L.show)}</button>
              {ids.map((id) => <span key={id} className="chip static">{pointById(id)!.vi}</span>)}
            </div>
          )}
          {question && <p className="msg me"><span className="who">{tr(L.you)}</span>{question}</p>}
          <ChatThread kind="acu" reading={reading} contextFor={contextFor} />
        </>
      )}
    </section>
  );
}
