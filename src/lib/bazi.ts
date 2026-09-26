// Bát Tự (Tứ Trụ / Four Pillars of Destiny).
// Year and month pillars follow the real solar terms (Lập Xuân and the 12 "tiết"), computed astronomically.
import * as A from "astronomy-engine";
import type { Bi } from "./i18n";
import { CAN, CAN_ELEMENT, CHI, CONTROLS, GENERATES, canChi, jdFromDate, type CanChi, type Element } from "./lunar";
import type { Profile } from "./types";

export const CHI_ELEMENT: Element[] = ["Thủy", "Thổ", "Mộc", "Mộc", "Thổ", "Hỏa", "Hỏa", "Thổ", "Kim", "Kim", "Thổ", "Thủy"];

/** Tàng can: hidden stems of each branch, main qi first. */
export const HIDDEN_STEMS: number[][] = [
  [9], [5, 9, 7], [0, 2, 4], [1], [4, 1, 9], [2, 6, 4],
  [3, 5], [5, 3, 1], [6, 8, 4], [7], [4, 7, 3], [8, 0],
];
const HIDDEN_WEIGHTS = [1, 0.5, 0.3];

export const ELEMENTS: Element[] = ["Mộc", "Hỏa", "Thổ", "Kim", "Thủy"];
export const isYang = (stem: number) => stem % 2 === 0;

// ---------- Birth moment ----------

export type Gender = "male" | "female";

export function genderOf(p: Profile): Gender | null {
  const g = (p.gender ?? "").trim().toLowerCase();
  if (/^(male|nam|m|man|boy|trai)$/.test(g)) return "male";
  if (/^(female|nữ|nu|f|woman|girl|gái)$/.test(g)) return "female";
  return null;
}

export interface BirthInfo {
  utc: Date; // exact moment
  /** Local calendar date used for the day pillar and lunar date. Births from 23:00 count as the next day (giờ Tý). */
  y: number;
  m: number;
  d: number;
  hourChi: number;
  gender: Gender | null;
}

export function birthInfo(p: Profile): BirthInfo | null {
  if (!p.birthTime || !p.birthDate) return null;
  const [y, m, d] = p.birthDate.split("-").map(Number);
  const [hh, mm] = p.birthTime.split(":").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d, hh, mm) - p.birthUtcOffset * 3600000);
  const local = new Date(Date.UTC(y, m - 1, d + (hh >= 23 ? 1 : 0)));
  return {
    utc,
    y: local.getUTCFullYear(),
    m: local.getUTCMonth() + 1,
    d: local.getUTCDate(),
    hourChi: Math.floor((hh + 1) / 2) % 12,
    gender: genderOf(p),
  };
}

// ---------- Ten Gods ----------

export type TenGod = "Tỷ Kiên" | "Kiếp Tài" | "Thực Thần" | "Thương Quan" | "Thiên Tài" | "Chính Tài" | "Thất Sát" | "Chính Quan" | "Thiên Ấn" | "Chính Ấn";

export const TEN_GOD_MEANING: Record<TenGod, Bi> = {
  "Tỷ Kiên": { en: "Peer: self-reliance, friends, independence", vi: "Bạn bè, tự lập, ý chí riêng" },
  "Kiếp Tài": { en: "Rival: competition, boldness, sharing resources", vi: "Cạnh tranh, liều lĩnh, chia sẻ tài lực" },
  "Thực Thần": { en: "Artist: creativity, enjoyment, gentle expression", vi: "Sáng tạo, hưởng thụ, biểu đạt nhẹ nhàng" },
  "Thương Quan": { en: "Performer: talent, rebellion, sharp expression", vi: "Tài hoa, phá cách, biểu đạt sắc sảo" },
  "Thiên Tài": { en: "Windfall wealth: opportunity, business, generosity", vi: "Tài bất ngờ, kinh doanh, hào phóng" },
  "Chính Tài": { en: "Steady wealth: diligence, saving, responsibility", vi: "Tài chính đáng, cần cù, trách nhiệm" },
  "Thất Sát": { en: "Challenger: pressure, courage, decisive power", vi: "Áp lực, dũng khí, quyết đoán" },
  "Chính Quan": { en: "Authority: order, reputation, self-discipline", vi: "Kỷ cương, danh dự, tự kỷ luật" },
  "Thiên Ấn": { en: "Mystic: intuition, unconventional learning", vi: "Trực giác, học thuật khác thường" },
  "Chính Ấn": { en: "Mentor: support, learning, nurture", vi: "Được nâng đỡ, học hỏi, bao dung" },
};

export function tenGod(dayMaster: number, other: number): TenGod {
  const me = CAN_ELEMENT[dayMaster];
  const them = CAN_ELEMENT[other];
  const samePolarity = isYang(dayMaster) === isYang(other);
  if (me === them) return samePolarity ? "Tỷ Kiên" : "Kiếp Tài";
  if (GENERATES[me] === them) return samePolarity ? "Thực Thần" : "Thương Quan";
  if (CONTROLS[me] === them) return samePolarity ? "Thiên Tài" : "Chính Tài";
  if (CONTROLS[them] === me) return samePolarity ? "Thất Sát" : "Chính Quan";
  return samePolarity ? "Thiên Ấn" : "Chính Ấn";
}

// ---------- Pillars ----------

const norm = (deg: number) => ((deg % 360) + 360) % 360;
/** Index of the solar month: 0 = Dần month (from Lập Xuân, 315°) … 11 = Sửu month. */
const solarMonthIndex = (sunLon: number) => Math.floor(norm(sunLon - 315) / 30);

export interface Pillar extends CanChi {
  hidden: number[];
  stemGod: TenGod | null; // null for the day stem itself (Nhật chủ)
  hiddenGods: TenGod[];
}

function pillar(can: number, chi: number, dayMaster: number | null): Pillar {
  const base = canChi(can, chi);
  const dm = dayMaster ?? can;
  return {
    ...base,
    hidden: HIDDEN_STEMS[chi],
    stemGod: dayMaster === null ? null : tenGod(dm, can),
    hiddenGods: HIDDEN_STEMS[chi].map((s) => tenGod(dm, s)),
  };
}

export function computeBazi(p: Profile, now = new Date()) {
  const b = birthInfo(p);
  if (!b) return null;

  const sunLon = A.SunPosition(b.utc).elon;
  const k = solarMonthIndex(sunLon);
  // Before Lập Xuân (Tý/Sửu solar months in Jan–Feb) still belongs to the previous year.
  const [by, bm] = p.birthDate.split("-").map(Number);
  const baziYear = bm <= 2 && k >= 10 ? by - 1 : by;

  const yearStem = (baziYear + 6) % 10;
  const yearBranch = (baziYear + 8) % 12;
  const monthStem = ((yearStem % 5) * 2 + 2 + k) % 10;
  const monthBranch = (2 + k) % 12;
  const jd = jdFromDate(b.d, b.m, b.y);
  const dayStem = (jd + 9) % 10;
  const dayBranch = (jd + 1) % 12;
  const hourStem = ((dayStem % 5) * 2 + b.hourChi) % 10;

  const pillars = {
    year: pillar(yearStem, yearBranch, dayStem),
    month: pillar(monthStem, monthBranch, dayStem),
    day: pillar(dayStem, dayBranch, null),
    hour: pillar(hourStem, b.hourChi, dayStem),
  };
  pillars.day.hiddenGods = HIDDEN_STEMS[dayBranch].map((s) => tenGod(dayStem, s));

  // ---- Five-element balance: 8 characters, plus weighted hidden stems; the month branch counts double. ----
  const count: Record<Element, number> = { Mộc: 0, Hỏa: 0, Thổ: 0, Kim: 0, Thủy: 0 };
  const weighted: Record<Element, number> = { Mộc: 0, Hỏa: 0, Thổ: 0, Kim: 0, Thủy: 0 };
  for (const [key, pl] of Object.entries(pillars)) {
    count[CAN_ELEMENT[pl.can]] += 1;
    count[CHI_ELEMENT[pl.chi]] += 1;
    weighted[CAN_ELEMENT[pl.can]] += 1;
    const branchFactor = key === "month" ? 2 : 1;
    pl.hidden.forEach((s, i) => (weighted[CAN_ELEMENT[s]] += HIDDEN_WEIGHTS[i] * branchFactor));
  }

  const dmElement = CAN_ELEMENT[dayStem];
  const resource = ELEMENTS.find((e) => GENERATES[e] === dmElement)!;
  const output = GENERATES[dmElement];
  const wealth = CONTROLS[dmElement];
  const officer = ELEMENTS.find((e) => CONTROLS[e] === dmElement)!;
  const total = Object.values(weighted).reduce((a, n) => a + n, 0);
  const supportRatio = (weighted[dmElement] + weighted[resource]) / total;
  const strength: "strong" | "weak" | "balanced" = supportRatio > 0.55 ? "strong" : supportRatio < 0.42 ? "weak" : "balanced";
  const favorable: Element[] =
    strength === "weak" ? [resource, dmElement] : strength === "strong" ? [output, wealth, officer] : [output, resource];

  // ---- Đại vận (10-year luck pillars) ----
  let luck: { startAge: number; forward: boolean; pillars: { age: number; year: number; can: number; chi: number; name: string; god: TenGod }[] } | null = null;
  if (b.gender) {
    const forward = isYang(yearStem) === (b.gender === "male");
    const target = forward ? norm(315 + 30 * (k + 1)) : norm(315 + 30 * k);
    const from = forward ? b.utc : new Date(b.utc.getTime() - 40 * 86400000);
    let term = A.SearchSunLongitude(target, from, 40)?.date ?? null;
    if (term && !forward && term > b.utc) term = null;
    const days = term ? Math.abs(term.getTime() - b.utc.getTime()) / 86400000 : 0;
    const startAge = Math.max(1, Math.round(days / 3)); // 3 days ≈ 1 year
    const list = [];
    for (let i = 1; i <= 8; i++) {
      const step = forward ? i : -i;
      const can = (((monthStem + step) % 10) + 10) % 10;
      const chi = (((monthBranch + step) % 12) + 12) % 12;
      const age = startAge + (i - 1) * 10;
      list.push({ age, year: by + age, can, chi, name: `${CAN[can]} ${CHI[chi]}`, god: tenGod(dayStem, can) });
    }
    luck = { startAge, forward, pillars: list };
  }

  // ---- Today & this year against the Day Master ----
  const todayJd = jdFromDate(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const todayStem = (todayJd + 9) % 10;
  const nowSun = A.SunPosition(now).elon;
  const nowYear = now.getMonth() + 1 <= 2 && solarMonthIndex(nowSun) >= 10 ? now.getFullYear() - 1 : now.getFullYear();
  const nowYearStem = (nowYear + 6) % 10;
  const age = now.getFullYear() - by;
  const currentLuck = luck ? [...luck.pillars].reverse().find((l) => age >= l.age) ?? null : null;

  return {
    pillars,
    dayMaster: { stem: dayStem, name: CAN[dayStem], element: dmElement, yang: isYang(dayStem) },
    count, weighted, strength, supportRatio, favorable,
    luck, currentLuck,
    today: {
      dayPillar: canChi(todayStem, (todayJd + 1) % 12),
      dayGod: tenGod(dayStem, todayStem),
      yearPillar: canChi(nowYearStem, (nowYear + 8) % 12),
      yearGod: tenGod(dayStem, nowYearStem),
    },
  };
}

export type Bazi = NonNullable<ReturnType<typeof computeBazi>>;

export const STRENGTH_LABEL: Record<Bazi["strength"], Bi> = {
  strong: { en: "Strong (thân vượng)", vi: "Thân vượng" },
  weak: { en: "Weak (thân nhược)", vi: "Thân nhược" },
  balanced: { en: "Balanced (trung hòa)", vi: "Trung hòa" },
};

export const DAY_MASTER_NATURE: Record<number, Bi> = {
  0: { en: "Tall tree: upright, principled, growth-oriented", vi: "Cây đại thụ: ngay thẳng, có nguyên tắc, hướng thượng" },
  1: { en: "Flower & vine: adaptable, gentle, resilient", vi: "Hoa cỏ, dây leo: mềm dẻo, khéo léo, bền bỉ" },
  2: { en: "The Sun: warm, generous, radiant", vi: "Mặt Trời: ấm áp, rộng lượng, tỏa sáng" },
  3: { en: "Candlelight: attentive, refined, inspiring", vi: "Ngọn nến: tinh tế, chu đáo, truyền cảm hứng" },
  4: { en: "Mountain: stable, reliable, protective", vi: "Núi cao: vững chãi, đáng tin, che chở" },
  5: { en: "Garden soil: nurturing, practical, accommodating", vi: "Đất ruộng vườn: nuôi dưỡng, thực tế, bao dung" },
  6: { en: "Raw metal/axe: decisive, bold, just", vi: "Kim loại thô, rìu: quyết đoán, mạnh mẽ, chính trực" },
  7: { en: "Jewel: precise, elegant, values quality", vi: "Châu báu: tinh xảo, thanh lịch, trọng chất lượng" },
  8: { en: "Ocean/river: expansive, clever, restless", vi: "Sông biển: rộng mở, thông minh, không ngừng chảy" },
  9: { en: "Rain & dew: intuitive, gentle, perceptive", vi: "Mưa sương: trực giác, dịu dàng, thấu hiểu" },
};
