import { useEffect, useRef, useState } from "react";
import { fmt, useT } from "../lib/i18n";
import { localDateKey, uid } from "../lib/storage";
import type { DiaryEntry } from "../lib/types";

const DRAFT_KEY = "ue.diaryDraft";

interface Props {
  editing: DiaryEntry | null;
  onSave: (e: DiaryEntry) => void;
  onCancelEdit: () => void;
}

export default function DiaryComposer({ editing, onSave, onCancelEdit }: Props) {
  const { t } = useT();
  const [date, setDate] = useState(localDateKey());
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem(DRAFT_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [flash, setFlash] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) return;
    setDate(editing.date);
    setText(editing.text);
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [editing]);

  // Keep an unsent draft so nothing is lost on reload.
  useEffect(() => {
    if (editing) return;
    try {
      localStorage.setItem(DRAFT_KEY, text);
    } catch {
      /* ignore */
    }
  }, [text, editing]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(false), 2000);
    return () => clearTimeout(id);
  }, [flash]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  const save = () => {
    const body = text.trim();
    if (!body) return;
    const now = new Date().toISOString();
    onSave(editing ? { ...editing, date, text: body, updatedAt: now } : { id: uid(), date, createdAt: now, text: body });
    setText("");
    setDate(localDateKey());
    setFlash(true);
  };

  return (
    <section className="card diary" id="diary">
      <div className="row between">
        <h2>✍️ {t("diaryTitle")}</h2>
        <input type="date" className="date-input" aria-label={t("diaryDate")} value={date} max={localDateKey()} onChange={(e) => setDate(e.target.value)} />
      </div>
      <p className="muted small">{t("diaryHint")}</p>
      <textarea
        ref={ref}
        rows={8}
        placeholder={t("diaryPlaceholder")}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && save()}
      />
      <div className="row between">
        <span className="tiny muted">{fmt(t("words"), { n: words })} · ⌘/Ctrl + Enter</span>
        <div className="row">
          {editing && (
            <button className="ghost" onClick={() => { onCancelEdit(); setText(""); setDate(localDateKey()); }}>{t("diaryCancel")}</button>
          )}
          <button className="primary" onClick={save} disabled={!text.trim()}>
            {flash ? `✓ ${t("diarySaved")}` : editing ? t("diaryUpdate") : t("diarySave")}
          </button>
        </div>
      </div>
    </section>
  );
}
