import { useState, type ReactNode } from "react";
import { fmt, useT } from "../lib/i18n";
import { buddhistCalendar, meditationStats, readMind } from "../lib/dharma";
import { meditation, useMeditation, useMeditationClock } from "../lib/meditationStore";
import { localDateKey } from "../lib/storage";
import type { CheckIn, Meditation } from "../lib/types";

const DURATIONS = [5, 10, 15, 20, 30];

function MeditationTimer({ sessions }: { sessions: Meditation[] }) {
  const { t, lang } = useT();
  const timer = useMeditation();
  const remaining = useMeditationClock();
  const stats = meditationStats(sessions, new Date());
  const running = timer.status === "running";
  const started = timer.status !== "idle";
  const recent = [...sessions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const [manual, setManual] = useState(false);
  const [manualMin, setManualMin] = useState(15);
  const [manualDate, setManualDate] = useState(localDateKey());
  const secs = Math.ceil(remaining / 1000);
  const mm = String(Math.floor(secs / 60)).padStart(2, "0");
  const ss = String(secs % 60).padStart(2, "0");

  return (
    <section className="card meditation">
      <h3>🧘 {t("meditationTitle")}</h3>
      <p className="muted small">{t("meditationIntro")}</p>
      <div className={`breath ${running ? "on" : ""}`} aria-hidden="true">
        <div className="breath-circle" />
        <div className="breath-time">{mm}:{ss}</div>
      </div>
      {running && (
        <p className="breath-words small">
          <span className="in">{t("breatheIn")}</span>
          <span className="out">{t("breatheOut")}</span>
        </p>
      )}
      {!started && (
        <div className="chips center-chips">
          {DURATIONS.map((d) => (
            <button key={d} className={d === timer.minutes ? "chip on" : "chip"} onClick={() => meditation.choose(d)}>
              {fmt(t("minutes"), { n: d })}
            </button>
          ))}
        </div>
      )}
      <div className="row center-row">
        {!running ? (
          <button className="primary" onClick={() => meditation.start()}>{started ? t("resume") : t("start")}</button>
        ) : (
          <button className="ghost" onClick={() => meditation.pause()}>{t("pause")}</button>
        )}
        {started && <button className="ghost" onClick={() => meditation.finishEarly()}>{t("finishEarly")}</button>}
      </div>
      <p className="tiny muted center">
        {timer.justSaved !== null
          ? `${t("sessionSaved")} · ${fmt(t("minutes"), { n: timer.justSaved })}`
          : fmt(t("weekPractice"), { s: stats.weekSessions, m: stats.weekMinutes })}
      </p>
      {started && <p className="tiny muted center">{t("timerKeepsRunning")}</p>}
      {recent.length > 0 && (
        <>
          <h4>{t("recentSessions")}</h4>
          <ul className="sessions">
            {recent.map((m) => (
              <li key={m.id}>
                <span>{new Date(`${m.date}T12:00:00`).toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", { weekday: "short", day: "numeric", month: "short" })}{m.id.startsWith("manual-") ? " ✍️" : ""}</span>
                <span className="muted">{fmt(t("minutes"), { n: m.minutes })}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {!started && (
        !manual ? (
          <p className="center"><button className="link" onClick={() => setManual(true)}>+ {t("logManual")}</button></p>
        ) : (
          <div className="row center-row wrap">
            <input type="number" min={1} max={600} className="narrow-num" aria-label={t("minutesLabel")} value={manualMin} onChange={(e) => setManualMin(+e.target.value)} />
            <span className="small muted">{t("minutesLabel")}</span>
            <input type="date" className="date-input" value={manualDate} max={localDateKey()} onChange={(e) => setManualDate(e.target.value)} />
            <button className="primary" onClick={() => { meditation.logManual(manualMin, manualDate); setManual(false); }}>{t("save")}</button>
          </div>
        )
      )}
    </section>
  );
}

interface Props {
  now: Date;
  checkin?: CheckIn;
  meditations: Meditation[];
  onGoCheckin: () => void;
  children?: ReactNode;
}

export default function Dharma({ now, checkin, meditations, onGoCheckin, children }: Props) {
  const { t, tr, lang } = useT();
  const cal = buddhistCalendar(now);
  const mind = readMind(checkin);
  const d = cal.today;
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const tags = [d.soc && t("socDay"), d.vong && t("vongDay"), d.thapTrai && t("thapTrai"), ...d.holidays.map(tr)].filter(Boolean) as string[];
  const upcoming = [...(cal.nextSocVong ? [cal.nextSocVong] : []), ...cal.upcoming]
    .sort((a, b) => a.inDays - b.inDays)
    .filter((u, i, arr) => arr.findIndex((x) => x.inDays === u.inDays && tr(x.name) === tr(u.name)) === i)
    .slice(0, 5);

  return (
    <div className="today">
      <section className="card dharma-hero">
        <div className="lotus" aria-hidden="true">☸</div>
        <div>
          <p className="eyebrow">{t("buddhistEra")} {cal.buddhistEra} · {t("lunarDate")} {d.lunarDay}/{d.lunarMonth}</p>
          <h2>{t("dharmaTitle")}</h2>
          <p className="muted small">{t("dharmaIntro")}</p>
          <div className="row wrap">
            {tags.length ? tags.map((tag) => <span key={tag} className="pill gold">{tag}</span>) : <span className="small muted">{t("ordinaryDay")}</span>}
          </div>
        </div>
      </section>

      <div className="cards">
        <section className="card">
          <h3>🪷 {t("mindToday")}</h3>
          {!mind ? (
            <>
              <p className="small muted">{t("mindNeedsCheckin")}</p>
              <button className="ghost" onClick={onGoCheckin}>{t("checkinTitle")}</button>
            </>
          ) : (
            <>
              <h4>{t("hindrancesTitle")}</h4>
              {mind.hindrances.length ? (
                <ul className="mind-list">
                  {mind.hindrances.map((h) => (
                    <li key={h.id}>
                      <strong>{tr(h.name)}</strong> <span className="tiny muted">· {h.pali}</span>
                      <p className="small"><span className="muted">{t("antidote")}:</span> {tr(h.antidote)}</p>
                      <p className="small"><span className="muted">{t("tryThis")}:</span> {tr(h.practice)}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="small muted">{t("noHindrance")}</p>
              )}
              {mind.wholesome.length > 0 && (
                <>
                  <h4>{t("wholesomeTitle")}</h4>
                  <div className="chips">{mind.wholesome.map((w) => <span key={w.en} className="chip on static">{tr(w)}</span>)}</div>
                </>
              )}
            </>
          )}
        </section>

        <MeditationTimer sessions={meditations} />

        <section className="card">
          <h3>📿 {t("upcoming")}</h3>
          <ul className="upcoming">
            {upcoming.map((u) => (
              <li key={`${u.inDays}-${u.name.en}`}>
                <span>{tr(u.name)}</span>
                <span className="tiny muted">
                  {u.date.toLocaleDateString(locale, { day: "numeric", month: "short" })} · {fmt(t("inDays"), { n: u.inDays })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {children}
    </div>
  );
}
