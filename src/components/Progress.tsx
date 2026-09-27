import { useEffect, useMemo, useState } from "react";
import { fmt, useT, type Bi } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import { PERIODS, buildProgress, describeProgress, type Period, type Summary } from "../lib/progress";
import { describeInsights } from "../lib/insights";
import { describeProfile } from "../lib/snapshot";
import type { CheckIn, DiaryEntry, Meditation, Profile, Reading } from "../lib/types";
import { ActivityCalendar, CountBars, TrendChart, WeeklyBars } from "./ProgressCharts";
import { KIND_META } from "./Library";
import ChatThread from "./ChatThread";

const L = {
  title: { en: "Your growth journey", vi: "Hành trình phát triển của bạn" },
  intro: { en: "Everything you've logged in my_data, brought together.", vi: "Mọi điều bạn đã ghi lại trong my_data, gom về một nơi." },
  days: { en: "{n} days", vi: "{n} ngày" },
  year: { en: "1 year", vi: "1 năm" },
  checkinDays: { en: "Check-in days", vi: "Ngày check-in" },
  streak: { en: "Streak", vi: "Chuỗi ngày" },
  longest: { en: "longest {n}", vi: "dài nhất {n}" },
  energy: { en: "Avg energy", vi: "Năng lượng TB" },
  mood: { en: "Avg mood", vi: "Tâm trạng TB" },
  meditation: { en: "Meditation", vi: "Thiền" },
  diary: { en: "Diary", vi: "Nhật ký" },
  readings: { en: "Readings", vi: "Luận giải" },
  vsPrev: { en: "vs previous {n} days", vi: "so với {n} ngày trước" },
  minutes: { en: "min", vi: "phút" },
  entries: { en: "{n} entries · {w} words", vi: "{n} trang · {w} chữ" },
  sessions: { en: "{n} sessions", vi: "{n} buổi" },
  energyChart: { en: "Energy (1–10)", vi: "Năng lượng (1–10)" },
  moodChart: { en: "Mood (1–5)", vi: "Tâm trạng (1–5)" },
  daily: { en: "daily", vi: "từng ngày" },
  avg7: { en: "7-day average", vi: "trung bình 7 ngày" },
  noCheckins: { en: "No check-ins in this period yet.", vi: "Chưa có check-in trong khoảng này." },
  weeklyMeditation: { en: "Meditation minutes per week", vi: "Số phút thiền mỗi tuần" },
  weekOf: { en: "Week of", vi: "Tuần từ" },
  calendar: { en: "Practice calendar", vi: "Lịch thực tập" },
  calendarHint: { en: "Darker = more of check-in, diary, meditation, readings that day.", vi: "Càng đậm = càng nhiều check-in, nhật ký, thiền, luận giải trong ngày." },
  less: { en: "Less", vi: "Ít" },
  more: { en: "More", vi: "Nhiều" },
  nothing: { en: "nothing logged", vi: "chưa ghi gì" },
  checkin: { en: "check-in", vi: "check-in" },
  diaryN: { en: "{n} diary", vi: "{n} nhật ký" },
  medN: { en: "{n} meditation", vi: "{n} buổi thiền" },
  readN: { en: "{n} reading", vi: "{n} luận giải" },
  feelings: { en: "Feelings you named most", vi: "Cảm xúc bạn gọi tên nhiều nhất" },
  times: { en: "{n} times", vi: "{n} lần" },
  readingActivity: { en: "Readings in this period", vi: "Luận giải trong khoảng này" },
  topCards: { en: "Tarot cards that keep appearing", vi: "Lá Tarot xuất hiện nhiều lần" },
  reviewTitle: { en: "Growth review & advice", vi: "Tổng kết & lời khuyên" },
  reviewIntro: {
    en: "Claude reads your stats, diary and recent readings for this period and reflects your progress back to you.",
    vi: "Claude đọc số liệu, nhật ký và các lần luận giải gần đây trong khoảng thời gian này để phản chiếu tiến trình của bạn.",
  },
  reviewButton: { en: "Write my review", vi: "Tổng kết cho mình" },
  again: { en: "Review again", vi: "Tổng kết lại" },
  stop: { en: "Stop", vi: "Dừng" },
} satisfies Record<string, Bi>;

const REQUEST: Bi = {
  en: "Please review my personal growth over the last {n} days (about 450–650 words, Markdown), using my own numbers, diary and readings:\n### 📈 The big picture\n### 🌱 What's growing\n### 🔁 Patterns to notice\n### 🎯 Three concrete steps for the next {n} days\n### 💬 A word of encouragement\nBe honest and specific; if data is thin, say so and suggest what to track.",
  vi: "Hãy tổng kết hành trình phát triển bản thân của mình trong {n} ngày qua (khoảng 450–650 chữ, Markdown), dựa trên chính số liệu, nhật ký và các lần luận giải của mình:\n### 📈 Bức tranh tổng quan\n### 🌱 Điều đang tiến bộ\n### 🔁 Khuôn mẫu cần để ý\n### 🎯 Ba bước cụ thể cho {n} ngày tới\n### 💬 Một lời động viên\nHãy thẳng thắn và cụ thể; nếu dữ liệu còn ít, hãy nói rõ và gợi ý nên theo dõi thêm gì.",
};

function Delta({ now, prev, digits = 1, suffix = "" }: { now: number | null; prev: number | null; digits?: number; suffix?: string }) {
  if (now === null || prev === null || prev === 0) return null;
  const d = now - prev;
  if (Math.abs(d) < Math.pow(10, -digits) / 2) return <span className="delta flat">±0</span>;
  return <span className={`delta ${d > 0 ? "up" : "down"}`}>{d > 0 ? "▲" : "▼"} {Math.abs(d).toFixed(digits)}{suffix}</span>;
}

interface Props {
  profile: Profile;
  checkins: CheckIn[];
  diary: DiaryEntry[];
  meditations: Meditation[];
  readings: Reading[];
  today: string;
}

export default function Progress({ profile, checkins, diary, meditations, readings, today }: Props) {
  const { tr, lang } = useT();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const [period, setPeriod] = useState<Period>(30);
  const p = useMemo(() => buildProgress(period, { checkins, diary, meditations, readings }), [period, checkins, diary, meditations, readings]);
  const session = useGuide("progress");
  const busy = (session?.pending ?? null) !== null;
  const latest = [...readings].reverse().find((r) => r.kind === "progress");

  useEffect(() => {
    guide.ensure("progress", "progress", today, latest);
  }, [today, latest]);

  const contextFor = () => [describeProfile(profile), describeProgress(p), describeInsights(checkins)].join("\n\n");
  const review = () => {
    guide.restart("progress", today, "full");
    void guide.send("progress", [{ role: "user", content: fmt(tr(REQUEST), { n: period }) }], { lang, context: contextFor() });
  };

  const n: Summary = p.now;
  const v: Summary = p.prev;
  const hasCheckins = p.series.some((s) => s.energy !== null);
  const readingKinds = (Object.keys(p.byKind) as (keyof typeof p.byKind)[]).filter((k) => p.byKind[k] > 0);

  return (
    <div className="today progress">
      <section className="card">
        <div className="guidance-head">
          <div>
            <h2>📈 {tr(L.title)}</h2>
            <p className="muted small">{tr(L.intro)}</p>
          </div>
          <div className="chips" role="radiogroup">
            {PERIODS.map((d) => (
              <button key={d} role="radio" aria-checked={period === d} className={`chip ${period === d ? "on" : ""}`} onClick={() => setPeriod(d)}>
                {d === 365 ? tr(L.year) : fmt(tr(L.days), { n: d })}
              </button>
            ))}
          </div>
        </div>

        <div className="tiles">
          <div className="tile">
            <span className="tile-label">{tr(L.checkinDays)}</span>
            <span className="tile-value">{n.checkinDays}<small>/{period}</small></span>
            <Delta now={n.checkinDays} prev={v.checkinDays} digits={0} />
          </div>
          <div className="tile">
            <span className="tile-label">🔥 {tr(L.streak)}</span>
            <span className="tile-value">{p.streak.current}</span>
            <span className="tiny muted">{fmt(tr(L.longest), { n: p.streak.longest })}</span>
          </div>
          <div className="tile">
            <span className="tile-label">⚡ {tr(L.energy)}</span>
            <span className="tile-value">{n.avgEnergy?.toFixed(1) ?? "—"}<small>/10</small></span>
            <Delta now={n.avgEnergy} prev={v.avgEnergy} />
          </div>
          <div className="tile">
            <span className="tile-label">🌤 {tr(L.mood)}</span>
            <span className="tile-value">{n.avgMood?.toFixed(1) ?? "—"}<small>/5</small></span>
            <Delta now={n.avgMood} prev={v.avgMood} />
          </div>
          <div className="tile">
            <span className="tile-label">🧘 {tr(L.meditation)}</span>
            <span className="tile-value">{n.meditationMinutes}<small> {tr(L.minutes)}</small></span>
            <span className="tiny muted">{fmt(tr(L.sessions), { n: n.meditationSessions })} <Delta now={n.meditationMinutes} prev={v.meditationMinutes} digits={0} /></span>
          </div>
          <div className="tile">
            <span className="tile-label">✍️ {tr(L.diary)}</span>
            <span className="tile-value">{n.diaryEntries}</span>
            <span className="tiny muted">{fmt(tr(L.entries), { n: n.diaryEntries, w: n.diaryWords })}</span>
          </div>
          <div className="tile">
            <span className="tile-label">✦ {tr(L.readings)}</span>
            <span className="tile-value">{n.readings}</span>
            <Delta now={n.readings} prev={v.readings} digits={0} />
          </div>
        </div>
        <p className="tiny muted">▲▼ {fmt(tr(L.vsPrev), { n: period })}</p>
      </section>

      <div className="progress-grid">
        <section className="card">
          <h3>{tr(L.energyChart)}</h3>
          {hasCheckins ? (
            <TrendChart points={p.series.map((s) => ({ date: s.date, value: s.energy, avg: s.energyAvg }))} min={1} max={10} locale={locale}
              labelDaily={tr(L.daily)} labelAvg={tr(L.avg7)} format={(x) => `${x.toFixed(x % 1 ? 1 : 0)}/10`} />
          ) : <p className="small muted">{tr(L.noCheckins)}</p>}
        </section>
        <section className="card">
          <h3>{tr(L.moodChart)}</h3>
          {hasCheckins ? (
            <TrendChart points={p.series.map((s) => ({ date: s.date, value: s.mood, avg: s.moodAvg }))} min={1} max={5} locale={locale}
              labelDaily={tr(L.daily)} labelAvg={tr(L.avg7)} format={(x) => `${x.toFixed(x % 1 ? 1 : 0)}/5`} />
          ) : <p className="small muted">{tr(L.noCheckins)}</p>}
        </section>
        <section className="card">
          <h3>🧘 {tr(L.weeklyMeditation)}</h3>
          <WeeklyBars weeks={p.weeks} locale={locale} unit={tr(L.weeklyMeditation)}
            tooltip={(w) => (<><strong>{tr(L.weekOf)} {new Date(`${w.start}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "short" })}</strong><div>{w.minutes} {tr(L.minutes)} · {fmt(tr(L.sessions), { n: w.sessions })}</div></>)} />
        </section>
        <section className="card">
          <h3>🗓 {tr(L.calendar)}</h3>
          <p className="tiny muted">{tr(L.calendarHint)}</p>
          <ActivityCalendar days={p.calendar.days} score={p.calendar.score} locale={locale} lessLabel={tr(L.less)} moreLabel={tr(L.more)}
            describe={(d) => {
              const a = p.calendar.activity.get(d);
              if (!a) return <div className="muted">{tr(L.nothing)}</div>;
              const parts = [a.checkin && tr(L.checkin), a.diary && fmt(tr(L.diaryN), { n: a.diary }), a.meditation && fmt(tr(L.medN), { n: a.meditation }), a.readings && fmt(tr(L.readN), { n: a.readings })].filter(Boolean);
              return <div>{parts.join(" · ")}</div>;
            }} />
        </section>
        {p.feelings.length > 0 && (
          <section className="card">
            <h3>💭 {tr(L.feelings)}</h3>
            <CountBars rows={p.feelings.slice(0, 8).map((f) => ({ key: f.id, label: tr(f.label), n: f.n }))} tooltip={(r) => <><strong>{r.label}</strong><div>{fmt(tr(L.times), { n: r.n })}</div></>} />
          </section>
        )}
        {(readingKinds.length > 0 || p.topCards.length > 0) && (
          <section className="card">
            <h3>✦ {tr(L.readingActivity)}</h3>
            <div className="kind-tiles">
              {readingKinds.map((k) => (
                <div key={k} className="kind-tile">
                  <span className={`kind-tag ${KIND_META[k].cls}`}>{KIND_META[k].icon} {tr(KIND_META[k].label)}</span>
                  <strong>{p.byKind[k]}</strong>
                </div>
              ))}
            </div>
            {p.topCards.length > 0 && (
              <>
                <h4>🃏 {tr(L.topCards)}</h4>
                <ul className="upcoming">
                  {p.topCards.map((c) => <li key={c.card.id}><span>{c.card.symbol} {tr(c.card.name)}</span><span className="tiny muted">×{c.n}</span></li>)}
                </ul>
              </>
            )}
          </section>
        )}
      </div>

      <section className="card guidance">
        <div className="guidance-head">
          <div>
            <h2>🌱 {tr(L.reviewTitle)}</h2>
            <p className="muted small">{tr(L.reviewIntro)}</p>
          </div>
          {busy ? (
            <button className="ghost" onClick={() => guide.stop("progress")}>■ {tr(L.stop)}</button>
          ) : (
            <button className="primary" onClick={review}>{session?.messages.length ? tr(L.again) : tr(L.reviewButton)} · {period === 365 ? tr(L.year) : fmt(tr(L.days), { n: period })}</button>
          )}
        </div>
        <ChatThread kind="progress" reading={latest} contextFor={contextFor} />
      </section>
    </div>
  );
}
