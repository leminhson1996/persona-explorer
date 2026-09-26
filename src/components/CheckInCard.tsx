import { useEffect, useState } from "react";
import { FEELINGS, MOODS, useT } from "../lib/i18n";
import { uid } from "../lib/storage";
import type { CheckIn } from "../lib/types";

interface Props {
  existing?: CheckIn;
  today: string;
  onSave: (c: CheckIn) => void;
}

export default function CheckInCard({ existing, today, onSave }: Props) {
  const { t, tr } = useT();
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? 5);
  const [feelings, setFeelings] = useState<string[]>(existing?.feelings ?? []);
  const [note, setNote] = useState(existing?.note ?? "");
  const [focus, setFocus] = useState(existing?.focus ?? "");
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 2000);
    return () => clearTimeout(id);
  }, [flash]);

  const toggle = (id: string) => setFeelings((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));

  const save = () => {
    onSave({
      id: existing?.id ?? uid(),
      date: today,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      mood, energy, feelings, note: note.trim(), focus: focus.trim(),
    });
    setFlash(true);
  };

  return (
    <section className="card checkin">
      <h2>{t("checkinTitle")}</h2>

      <div className="field">
        <label>{t("mood")}</label>
        <div className="moods" role="radiogroup" aria-label={t("mood")}>
          {MOODS.map((m) => (
            <button key={m.value} type="button" role="radio" aria-checked={mood === m.value}
              className={mood === m.value ? "on" : ""} onClick={() => setMood(m.value)}>
              <span className="emoji">{m.emoji}</span>
              <span>{tr(m.label)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="energy">{t("energy")}: <strong>{energy}/10</strong></label>
        <input id="energy" type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(+e.target.value)} />
      </div>

      <div className="field">
        <label>{t("feelings")}</label>
        <div className="chips">
          {FEELINGS.map((f) => (
            <button key={f.id} type="button" className={feelings.includes(f.id) ? "chip on" : "chip"}
              aria-pressed={feelings.includes(f.id)} onClick={() => toggle(f.id)}>
              {tr(f.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <label htmlFor="focus">{t("focus")}</label>
        <input id="focus" value={focus} onChange={(e) => setFocus(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="note">{t("onMind")}</label>
        <textarea id="note" rows={3} placeholder={t("onMindHint")} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <div className="actions">
        <button className="primary" onClick={save}>{flash ? `✓ ${t("checkinSaved")}` : t("saveCheckin")}</button>
      </div>
    </section>
  );
}
