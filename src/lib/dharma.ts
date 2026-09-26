// Buddhist lens: the Vietnamese Buddhist calendar, the mind-states of today, and practice.
import type { Bi } from "./i18n";
import { solarToLunar } from "./lunar";
import type { CheckIn, Meditation } from "./types";

// ---------- Calendar ----------

interface Holiday {
  month: number;
  day: number | "last";
  name: Bi;
}

const HOLIDAYS: Holiday[] = [
  { month: 1, day: 1, name: { en: "Lunar New Year · Maitreya Buddha day", vi: "Tết Nguyên Đán · Vía Phật Di Lặc" } },
  { month: 1, day: 15, name: { en: "First full moon of the year (Thượng Nguyên)", vi: "Rằm tháng Giêng (Tết Thượng Nguyên)" } },
  { month: 2, day: 8, name: { en: "Shakyamuni's Renunciation", vi: "Phật Thích Ca xuất gia" } },
  { month: 2, day: 15, name: { en: "Shakyamuni's Parinirvana", vi: "Phật Thích Ca nhập Niết Bàn" } },
  { month: 2, day: 19, name: { en: "Avalokiteśvara's birth", vi: "Vía Quán Thế Âm đản sanh" } },
  { month: 2, day: 21, name: { en: "Samantabhadra day", vi: "Vía Bồ Tát Phổ Hiền" } },
  { month: 4, day: 4, name: { en: "Mañjuśrī day", vi: "Vía Bồ Tát Văn Thù" } },
  { month: 4, day: 15, name: { en: "Vesak · Buddha's Birthday", vi: "Đại lễ Phật Đản" } },
  { month: 6, day: 19, name: { en: "Avalokiteśvara's enlightenment", vi: "Vía Quán Thế Âm thành đạo" } },
  { month: 7, day: 13, name: { en: "Mahāsthāmaprāpta day", vi: "Vía Bồ Tát Đại Thế Chí" } },
  { month: 7, day: 15, name: { en: "Vu Lan · Ullambana, gratitude to parents", vi: "Lễ Vu Lan báo hiếu" } },
  { month: 7, day: "last", name: { en: "Kṣitigarbha day", vi: "Vía Bồ Tát Địa Tạng" } },
  { month: 9, day: 19, name: { en: "Avalokiteśvara's renunciation", vi: "Vía Quán Thế Âm xuất gia" } },
  { month: 11, day: 17, name: { en: "Amitābha Buddha day", vi: "Vía Phật A Di Đà" } },
  { month: 12, day: 8, name: { en: "Buddha's Enlightenment (Bodhi Day)", vi: "Phật Thích Ca thành đạo" } },
];

/** Thập trai: the ten traditional vegetarian/precept days of the lunar month. */
const THAP_TRAI = new Set([1, 8, 14, 15, 18, 23, 24, 28, 29, 30]);

export interface DayObservance {
  date: Date;
  lunarDay: number;
  lunarMonth: number;
  leap: boolean;
  soc: boolean; // mùng 1
  vong: boolean; // rằm
  thapTrai: boolean;
  holidays: Bi[];
}

function observance(date: Date): DayObservance {
  const l = solarToLunar(date.getDate(), date.getMonth() + 1, date.getFullYear());
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const isLast = solarToLunar(tomorrow.getDate(), tomorrow.getMonth() + 1, tomorrow.getFullYear()).day === 1;
  const holidays = l.leap
    ? []
    : HOLIDAYS.filter((h) => h.month === l.month && (h.day === "last" ? isLast : h.day === l.day)).map((h) => h.name);
  return {
    date,
    lunarDay: l.day,
    lunarMonth: l.month,
    leap: l.leap,
    soc: l.day === 1,
    vong: l.day === 15,
    thapTrai: THAP_TRAI.has(l.day),
    holidays,
  };
}

export function buddhistCalendar(now: Date) {
  const today = observance(now);
  const lunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  // Vietnamese Buddhist Era changes at Vesak (15/4 lunar).
  const afterVesak = lunar.month > 4 || (lunar.month === 4 && lunar.day >= 15);
  const buddhistEra = lunar.year + (afterVesak ? 544 : 543);

  const upcoming: { date: Date; inDays: number; name: Bi; kind: "holiday" | "soc" | "vong" }[] = [];
  let nextSocVong: (typeof upcoming)[number] | null = null;
  for (let i = 1; i <= 400 && upcoming.length < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const o = observance(d);
    for (const name of o.holidays) upcoming.push({ date: d, inDays: i, name, kind: "holiday" });
    if (!nextSocVong && (o.soc || o.vong))
      nextSocVong = {
        date: d, inDays: i, kind: o.soc ? "soc" : "vong",
        name: o.soc ? { en: "New moon day (Mùng 1)", vi: "Ngày Sóc (Mùng 1)" } : { en: "Full moon day (Rằm)", vi: "Ngày Vọng (Rằm)" },
      };
  }
  return { today, buddhistEra, upcoming, nextSocVong };
}

// ---------- Mind states (from the check-in) ----------

export interface MindState {
  id: string;
  name: Bi;
  pali: string;
  antidote: Bi;
  practice: Bi;
}

/** Ngũ triền cái (five hindrances) plus sorrow, which Vietnamese teachers often address directly. */
export const HINDRANCES: Record<string, MindState> = {
  san: {
    id: "san",
    name: { en: "Ill will (sân)", vi: "Sân hận" },
    pali: "byāpāda",
    antidote: { en: "Loving-kindness and patience", vi: "Từ tâm và nhẫn nhục" },
    practice: { en: "Mettā meditation: wish yourself, then the difficult person, to be safe and at ease", vi: "Quán từ bi: gửi lời chúc bình an đến chính mình, rồi đến người làm mình khó chịu" },
  },
  traoHoi: {
    id: "traoHoi",
    name: { en: "Restlessness & worry (trạo hối)", vi: "Trạo hối (bồn chồn, lo lắng)" },
    pali: "uddhacca-kukkucca",
    antidote: { en: "Calm abiding, returning to the present moment", vi: "An trú, trở về giây phút hiện tại" },
    practice: { en: "Mindful breathing: 10 slow breaths, counting each out-breath", vi: "Chánh niệm hơi thở: 10 hơi thở chậm, đếm theo mỗi hơi thở ra" },
  },
  honTram: {
    id: "honTram",
    name: { en: "Sloth & torpor (hôn trầm)", vi: "Hôn trầm (uể oải, nặng nề)" },
    pali: "thīna-middha",
    antidote: { en: "Gentle effort, light, movement, and honest rest", vi: "Tinh tấn nhẹ nhàng, ánh sáng, vận động, và nghỉ ngơi đúng lúc" },
    practice: { en: "Walking meditation for 10 minutes, feeling each step", vi: "Thiền hành 10 phút, cảm nhận từng bước chân" },
  },
  nghi: {
    id: "nghi",
    name: { en: "Doubt (nghi)", vi: "Hoài nghi, mơ hồ" },
    pali: "vicikicchā",
    antidote: { en: "Right view, inquiry, wise friends", vi: "Chánh kiến, quán chiếu, gần gũi thiện tri thức" },
    practice: { en: "Write down one question, then look at its causes and conditions (dependent origination)", vi: "Viết ra một câu hỏi, rồi quán các nhân duyên tạo nên nó (duyên khởi)" },
  },
  uuBi: {
    id: "uuBi",
    name: { en: "Sorrow (ưu bi)", vi: "Ưu bi (buồn, cô đơn)" },
    pali: "domanassa",
    antidote: { en: "Self-compassion, impermanence, community (saṅgha)", vi: "Từ bi với chính mình, quán vô thường, nương tựa Tăng thân" },
    practice: { en: "Hand on heart: \"This is suffering, it is part of life; may I be kind to myself\"", vi: "Đặt tay lên ngực: \"Đây là khổ, khổ là một phần của đời sống; mong mình dịu dàng với chính mình\"" },
  },
  thamDuc: {
    id: "thamDuc",
    name: { en: "Craving (tham dục)", vi: "Tham dục (khao khát, bám chấp)" },
    pali: "kāmacchanda",
    antidote: { en: "Contentment and seeing impermanence", vi: "Tri túc và quán vô thường" },
    practice: { en: "Before acting on a craving, pause for three breaths and name it", vi: "Trước khi chạy theo một mong muốn, dừng lại ba hơi thở và gọi tên nó" },
  },
};

const FEELING_TO_HINDRANCE: Record<string, keyof typeof HINDRANCES> = {
  angry: "san",
  anxious: "traoHoi",
  stressed: "traoHoi",
  restless: "traoHoi",
  tired: "honTram",
  confused: "nghi",
  sad: "uuBi",
  lonely: "uuBi",
};

export const WHOLESOME: Record<string, Bi> = {
  calm: { en: "Equanimity (xả)", vi: "Xả (an nhiên)" },
  grateful: { en: "Gratitude, sympathetic joy (tùy hỷ)", vi: "Biết ơn, tùy hỷ" },
  hopeful: { en: "Faith (tín)", vi: "Tín tâm" },
  inspired: { en: "Right effort (tinh tấn)", vi: "Tinh tấn" },
  loved: { en: "Loving-kindness (từ)", vi: "Từ tâm" },
  focused: { en: "Concentration (định)", vi: "Định" },
  curious: { en: "Investigation of dharma (trạch pháp)", vi: "Trạch pháp (tìm hiểu, quán xét)" },
};

export function readMind(c: CheckIn | undefined) {
  if (!c) return null;
  const ids = new Set<keyof typeof HINDRANCES>();
  c.feelings.forEach((f) => FEELING_TO_HINDRANCE[f] && ids.add(FEELING_TO_HINDRANCE[f]));
  if (c.energy <= 3) ids.add("honTram");
  if (c.mood <= 2 && ids.size === 0) ids.add("uuBi");
  return {
    hindrances: [...ids].map((id) => HINDRANCES[id]),
    wholesome: c.feelings.filter((f) => WHOLESOME[f]).map((f) => WHOLESOME[f]),
  };
}

// ---------- Practice log ----------

export function meditationStats(sessions: Meditation[], now: Date) {
  const weekAgo = now.getTime() - 7 * 86400000;
  const week = sessions.filter((s) => Date.parse(s.createdAt) >= weekAgo);
  return {
    weekSessions: week.length,
    weekMinutes: Math.round(week.reduce((a, s) => a + s.minutes, 0)),
    totalMinutes: Math.round(sessions.reduce((a, s) => a + s.minutes, 0)),
  };
}

// ---------- Text for Claude ----------

export function describeDharma(now: Date, checkin: CheckIn | undefined, sessions: Meditation[]): string {
  const cal = buddhistCalendar(now);
  const t = cal.today;
  const mind = readMind(checkin);
  const stats = meditationStats(sessions, now);
  const todayTags = [
    t.soc && "Sóc day (mùng 1)",
    t.vong && "Vọng day (full moon, rằm)",
    t.thapTrai && "one of the ten precept/vegetarian days (thập trai)",
    ...t.holidays.map((h) => h.en),
  ].filter(Boolean);
  return [
    "### Buddhist lens",
    `- Buddhist Era (Phật lịch) ${cal.buddhistEra}; lunar ${t.lunarDay}/${t.lunarMonth}${todayTags.length ? `; today is ${todayTags.join(", ")}` : ""}`,
    cal.nextSocVong ? `- Next ${cal.nextSocVong.name.en} in ${cal.nextSocVong.inDays} days` : "",
    cal.upcoming.length ? `- Upcoming Buddhist days: ${cal.upcoming.map((u) => `${u.name.en} in ${u.inDays} days`).join("; ")}` : "",
    mind
      ? `- Mind states suggested by today's check-in: hindrances ${mind.hindrances.map((h) => `${h.name.en} [${h.pali}]`).join(", ") || "none noticed"}; wholesome ${mind.wholesome.map((w) => w.en).join(", ") || "none named"}`
      : "- No check-in today, so the mind states are unknown.",
    `- Meditation: ${stats.weekSessions} sessions / ${stats.weekMinutes} minutes in the last 7 days (${stats.totalMinutes} minutes all-time, logged in this app)`,
  ].filter(Boolean).join("\n");
}
