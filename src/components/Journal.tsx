import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { FEELINGS, MOODS, fmt, useT } from "../lib/i18n";
import { localDateKey } from "../lib/storage";
import type { CheckIn, Reading } from "../lib/types";

interface Props {
  checkins: CheckIn[];
  readings: Reading[];
  onDeleteCheckin: (id: string) => void;
  onDeleteReading: (id: string) => void;
}

function streak(checkins: CheckIn[]): number {
  const days = new Set(checkins.map((c) => c.date));
  let n = 0;
  const d = new Date();
  if (!days.has(localDateKey(d))) d.setDate(d.getDate() - 1); // today not logged yet doesn't break it
  while (days.has(localDateKey(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export default function Journal({ checkins, readings, onDeleteCheckin, onDeleteReading }: Props) {
  const { t, tr, lang } = useT();
  const [open, setOpen] = useState<string | null>(null);
  const locale = lang === "vi" ? "vi-VN" : "en-US";

  const dates = [...new Set([...checkins.map((c) => c.date), ...readings.map((r) => r.date)])].sort().reverse();
  const last7 = checkins.slice(-7);
  const avg = last7.length ? last7.reduce((a, c) => a + c.energy, 0) / last7.length : null;
  const s = streak(checkins);

  if (!dates.length) return <section className="card"><h2>{t("journalTitle")}</h2><p className="muted">{t("journalEmpty")}</p></section>;

  return (
    <section className="journal">
      <div className="card stats">
        <h2>{t("journalTitle")}</h2>
        <div className="row wrap">
          {s > 0 && <span className="pill">🔥 {fmt(t("streak"), { n: s })}</span>}
          {avg !== null && <span className="pill">⚡ {t("avgEnergy")}: {avg.toFixed(1)}/10</span>}
        </div>
      </div>

      {dates.map((date) => {
        const dayCheckins = checkins.filter((c) => c.date === date);
        const dayReadings = readings.filter((r) => r.date === date);
        const label = new Date(`${date}T12:00:00`).toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long", year: "numeric" });
        return (
          <article key={date} className="card entry">
            <h3>{label}</h3>
            {dayCheckins.map((c) => {
              const mood = MOODS.find((m) => m.value === c.mood);
              return (
                <div key={c.id} className="entry-checkin">
                  <p>
                    <span className="emoji">{mood?.emoji}</span> <strong>{mood && tr(mood.label)}</strong> · {t("energy")} {c.energy}/10
                    <button className="link danger-link" onClick={() => onDeleteCheckin(c.id)}>{t("delete")}</button>
                  </p>
                  {c.feelings.length > 0 && (
                    <div className="chips">
                      {c.feelings.map((id) => {
                        const f = FEELINGS.find((x) => x.id === id);
                        return <span key={id} className="chip on static">{f ? tr(f.label) : id}</span>;
                      })}
                    </div>
                  )}
                  {c.focus && <p className="small">🎯 {c.focus}</p>}
                  {c.note && <p className="small note">“{c.note}”</p>}
                </div>
              );
            })}
            {dayReadings.map((r) => (
              <div key={r.id} className="entry-reading">
                <p>
                  <button className="link" onClick={() => setOpen(open === r.id ? null : r.id)}>
                    {open === r.id ? "▾" : "▸"} ✦ {t("readingLabel")}
                  </button>
                  <button className="link danger-link" onClick={() => onDeleteReading(r.id)}>{t("delete")}</button>
                </p>
                {open === r.id && (
                  <div className="thread">
                    {r.messages.slice(1).map((m, i) =>
                      m.role === "assistant" ? (
                        <article key={i} className="msg guide"><ReactMarkdown>{m.content}</ReactMarkdown></article>
                      ) : (
                        <p key={i} className="msg me"><span className="who">{t("you")}</span>{m.content}</p>
                      ),
                    )}
                  </div>
                )}
              </div>
            ))}
          </article>
        );
      })}
    </section>
  );
}
