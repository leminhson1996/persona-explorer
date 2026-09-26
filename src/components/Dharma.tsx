import { useEffect, useRef, useState, type ReactNode } from "react";
import { fmt, useT } from "../lib/i18n";
import { buddhistCalendar, meditationStats, readMind } from "../lib/dharma";
import { localDateKey, uid } from "../lib/storage";
import type { CheckIn, Meditation } from "../lib/types";

/** A soft singing-bowl bell synthesized with WebAudio. */
function ringBell() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    [[392, 0.5], [784, 0.22], [1176, 0.12], [1568, 0.06]].forEach(([freq, gain]) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(gain, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 6);
      osc.connect(g).connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 6.1);
    });
    setTimeout(() => ctx.close(), 6500);
  } catch {
    /* audio unavailable */
  }
}

const DURATIONS = [5, 10, 15, 20, 30];

function MeditationTimer({ sessions, onSave }: { sessions: Meditation[]; onSave: (m: Meditation) => void }) {
  const { t } = useT();
  const [minutes, setMinutes] = useState(10);
  const [remaining, setRemaining] = useState(10 * 60);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [flash, setFlash] = useState(false);
  const endAt = useRef(0);
  const stats = meditationStats(sessions, new Date());

  const finish = (secondsDone: number) => {
    setRunning(false);
    setStarted(false);
    setRemaining(minutes * 60);
    const done = Math.round((secondsDone / 60) * 10) / 10;
    if (done >= 1) {
      onSave({ id: uid(), date: localDateKey(), createdAt: new Date().toISOString(), minutes: done });
      setFlash(true);
      setTimeout(() => setFlash(false), 4000);
    }
  };

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endAt.current - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        ringBell();
        finish(minutes * 60);
      }
    }, 250);
    return () => clearInterval(id);
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => {
    if (!started) ringBell();
    endAt.current = Date.now() + remaining * 1000;
    setStarted(true);
    setRunning(true);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

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
            <button key={d} className={d === minutes ? "chip on" : "chip"} onClick={() => { setMinutes(d); setRemaining(d * 60); }}>
              {fmt(t("minutes"), { n: d })}
            </button>
          ))}
        </div>
      )}
      <div className="row center-row">
        {!running ? (
          <button className="primary" onClick={start}>{started ? t("resume") : t("start")}</button>
        ) : (
          <button className="ghost" onClick={() => setRunning(false)}>{t("pause")}</button>
        )}
        {started && <button className="ghost" onClick={() => finish(minutes * 60 - remaining)}>{t("finishEarly")}</button>}
      </div>
      <p className="tiny muted center">{flash ? t("sessionSaved") : fmt(t("weekPractice"), { s: stats.weekSessions, m: stats.weekMinutes })}</p>
    </section>
  );
}

interface Props {
  now: Date;
  checkin?: CheckIn;
  meditations: Meditation[];
  onSaveMeditation: (m: Meditation) => void;
  onGoCheckin: () => void;
  children?: ReactNode;
}

export default function Dharma({ now, checkin, meditations, onSaveMeditation, onGoCheckin, children }: Props) {
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

        <MeditationTimer sessions={meditations} onSave={onSaveMeditation} />

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
