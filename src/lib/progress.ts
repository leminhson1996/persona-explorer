// Personal growth overview: aggregates everything in my_data over a period.
import { FEELINGS } from "./i18n";
import { localDateKey } from "./storage";
import { cardById } from "./tarot";
import type { CheckIn, DiaryEntry, Meditation, Reading, ReadingKind } from "./types";

export const PERIODS = [7, 30, 90, 365] as const;
export type Period = (typeof PERIODS)[number];

const keyOf = (d: Date) => localDateKey(d);
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const words = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

export interface DayPoint {
  date: string;
  energy: number | null;
  mood: number | null;
  energyAvg: number | null; // trailing 7-day average of logged days
  moodAvg: number | null;
}

export interface Summary {
  checkinDays: number;
  avgEnergy: number | null;
  avgMood: number | null;
  meditationMinutes: number;
  meditationSessions: number;
  diaryEntries: number;
  diaryWords: number;
  readings: number;
}

function summarize(dates: Set<string>, checkins: Map<string, CheckIn>, diary: DiaryEntry[], meds: Meditation[], readings: Reading[]): Summary {
  const cs = [...dates].map((d) => checkins.get(d)).filter((c): c is CheckIn => !!c);
  const ds = diary.filter((e) => dates.has(e.date));
  const ms = meds.filter((m) => dates.has(m.date));
  return {
    checkinDays: cs.length,
    avgEnergy: mean(cs.map((c) => c.energy)),
    avgMood: mean(cs.map((c) => c.mood)),
    meditationMinutes: Math.round(ms.reduce((a, m) => a + m.minutes, 0)),
    meditationSessions: ms.length,
    diaryEntries: ds.length,
    diaryWords: ds.reduce((a, e) => a + words(e.text), 0),
    readings: readings.filter((r) => dates.has(r.date)).length,
  };
}

export function buildProgress(
  period: Period,
  data: { checkins: CheckIn[]; diary: DiaryEntry[]; meditations: Meditation[]; readings: Reading[] },
  now = new Date(),
) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Array.from({ length: period }, (_, i) => keyOf(addDays(today, i - period + 1)));
  const dateSet = new Set(days);
  const prevSet = new Set(Array.from({ length: period }, (_, i) => keyOf(addDays(today, i - 2 * period + 1))));

  const byDate = new Map<string, CheckIn>();
  for (const c of [...data.checkins].sort((a, b) => a.createdAt.localeCompare(b.createdAt))) byDate.set(c.date, c);

  // Mood & energy series with a trailing 7-day average over logged days.
  const series: DayPoint[] = days.map((date, i) => {
    const c = byDate.get(date);
    const window = days.slice(Math.max(0, i - 6), i + 1).map((d) => byDate.get(d)).filter((x): x is CheckIn => !!x);
    return {
      date,
      energy: c?.energy ?? null,
      mood: c?.mood ?? null,
      energyAvg: window.length ? mean(window.map((x) => x.energy)) : null,
      moodAvg: window.length ? mean(window.map((x) => x.mood)) : null,
    };
  });

  // Meditation minutes per week (weeks start Monday), covering the period.
  const weekStart = (d: Date) => addDays(d, -((d.getDay() + 6) % 7));
  const weeks: { start: string; minutes: number; sessions: number }[] = [];
  const firstWeek = weekStart(addDays(today, -period + 1));
  for (let w = firstWeek; w <= today; w = addDays(w, 7)) weeks.push({ start: keyOf(w), minutes: 0, sessions: 0 });
  for (const m of data.meditations) {
    const wk = keyOf(weekStart(new Date(`${m.date}T12:00:00`)));
    const slot = weeks.find((x) => x.start === wk);
    if (slot) {
      slot.minutes += m.minutes;
      slot.sessions += 1;
    }
  }
  weeks.forEach((w) => (w.minutes = Math.round(w.minutes)));

  // Activity per day (for the calendar): what you did, not how you felt.
  const activity = new Map<string, { checkin: boolean; diary: number; meditation: number; readings: number }>();
  const touch = (date: string) => {
    if (!activity.has(date)) activity.set(date, { checkin: false, diary: 0, meditation: 0, readings: 0 });
    return activity.get(date)!;
  };
  data.checkins.forEach((c) => (touch(c.date).checkin = true));
  data.diary.forEach((e) => touch(e.date).diary++);
  data.meditations.forEach((m) => touch(m.date).meditation++);
  data.readings.forEach((r) => touch(r.date).readings++);
  const score = (date: string) => {
    const a = activity.get(date);
    return a ? Number(a.checkin) + Math.min(a.diary, 2) + Math.min(a.meditation, 2) + Math.min(a.readings, 2) : 0;
  };

  // Streaks: consecutive days with any activity.
  // Today not logged yet doesn't break the streak.
  let current = 0;
  for (let d = score(keyOf(today)) > 0 ? today : addDays(today, -1); score(keyOf(d)) > 0; d = addDays(d, -1)) current++;
  const allDates = [...activity.keys()].sort();
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of allDates) {
    run = prev && keyOf(addDays(new Date(`${prev}T12:00:00`), 1)) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  // Feelings in the period.
  const feelingCounts = new Map<string, number>();
  for (const d of days) byDate.get(d)?.feelings.forEach((f) => feelingCounts.set(f, (feelingCounts.get(f) ?? 0) + 1));
  const feelings = [...feelingCounts]
    .map(([id, n]) => ({ id, n, label: FEELINGS.find((f) => f.id === id)?.label ?? { en: id, vi: id } }))
    .sort((a, b) => b.n - a.n);

  // Readings by kind, and tarot cards that keep coming up.
  const periodReadings = data.readings.filter((r) => dateSet.has(r.date));
  const byKind: Record<ReadingKind, number> = { daily: 0, chart: 0, dharma: 0, tarot: 0, progress: 0, physio: 0, acu: 0 };
  periodReadings.forEach((r) => byKind[r.kind ?? "daily"]++);
  const cardCounts = new Map<string, number>();
  periodReadings.forEach((r) => r.tarot?.cards.forEach((c) => cardCounts.set(c.id, (cardCounts.get(c.id) ?? 0) + 1)));
  const topCards = [...cardCounts].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id, n]) => ({ card: cardById(id), n }));

  return {
    period, days, series, weeks, feelings, byKind, topCards,
    calendar: { days: Array.from({ length: Math.max(period, 84) }, (_, i) => keyOf(addDays(today, i - Math.max(period, 84) + 1))), score, activity },
    streak: { current, longest },
    now: summarize(dateSet, byDate, data.diary, data.meditations, data.readings),
    prev: summarize(prevSet, byDate, data.diary, data.meditations, data.readings),
    diaryInPeriod: data.diary.filter((e) => dateSet.has(e.date)).sort((a, b) => a.date.localeCompare(b.date)),
    readingsInPeriod: periodReadings,
  };
}

export type Progress = ReturnType<typeof buildProgress>;

const fmt1 = (n: number | null) => (n === null ? "n/a" : n.toFixed(1));

/** Everything Claude needs to write a growth review for the period. */
export function describeProgress(p: Progress): string {
  const n = p.now;
  const v = p.prev;
  const trend = p.series.filter((s) => s.energy !== null);
  const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
  const secondHalf = trend.slice(Math.floor(trend.length / 2));
  const lines = [
    `## Growth overview: last ${p.period} days (vs the ${p.period} days before)`,
    `- Check-in days: ${n.checkinDays} (before: ${v.checkinDays}); activity streak now ${p.streak.current} days, longest ever ${p.streak.longest}`,
    `- Average energy ${fmt1(n.avgEnergy)}/10 (before ${fmt1(v.avgEnergy)}); average mood ${fmt1(n.avgMood)}/5 (before ${fmt1(v.avgMood)})`,
    firstHalf.length >= 3 && secondHalf.length >= 3
      ? `- Within the period, energy moved from ${fmt1(mean(firstHalf.map((s) => s.energy!)))} (first half) to ${fmt1(mean(secondHalf.map((s) => s.energy!)))} (second half)`
      : "",
    `- Meditation: ${n.meditationMinutes} min in ${n.meditationSessions} sessions (before: ${v.meditationMinutes} min); weekly minutes: ${p.weeks.map((w) => w.minutes).join(", ")}`,
    `- Diary: ${n.diaryEntries} entries, ${n.diaryWords} words (before: ${v.diaryEntries} entries)`,
    `- Readings: ${Object.entries(p.byKind).filter(([, c]) => c).map(([k, c]) => `${k} ${c}`).join(", ") || "none"}`,
    p.feelings.length ? `- Most frequent feelings: ${p.feelings.slice(0, 8).map((f) => `${f.label.en} ×${f.n}`).join(", ")}` : "",
    p.topCards.length ? `- Tarot cards that kept appearing: ${p.topCards.map((c) => `${c.card.name.en} ×${c.n}`).join(", ")}` : "",
  ];
  if (p.diaryInPeriod.length) {
    lines.push("", "### Diary excerpts (oldest → newest)", ...p.diaryInPeriod.slice(-12).map((e) => `- ${e.date}: ${e.text.slice(0, 300)}${e.text.length > 300 ? "…" : ""}`));
  }
  const notes = p.readingsInPeriod.filter((r) => r.kind !== "progress").slice(-8);
  if (notes.length) {
    lines.push("", "### Themes from recent readings (first lines)", ...notes.map((r) => {
      const a = r.messages.find((m) => m.role === "assistant")?.content ?? "";
      const para = a.split("\n").map((l) => l.trim()).find((l) => l && !l.startsWith("#")) ?? "";
      return `- ${r.date} ${r.kind ?? "daily"}${r.tarot?.question ? ` ("${r.tarot.question.slice(0, 80)}")` : ""}: ${para.slice(0, 220)}`;
    }));
  }
  return lines.filter(Boolean).join("\n");
}
