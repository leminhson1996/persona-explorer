// Vietnamese lunar calendar (Âm lịch), Can Chi, Nạp Âm and Ngũ Hành.
// Lunar conversion follows Hồ Ngọc Đức's algorithm with the Vietnamese time zone (UTC+7).

import type { Bi } from "./i18n";

const TZ = 7;

export const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
export const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
export const CHI_ANIMAL: Bi[] = [
  ["Rat", "Chuột"], ["Buffalo", "Trâu"], ["Tiger", "Hổ"], ["Cat", "Mèo"], ["Dragon", "Rồng"], ["Snake", "Rắn"],
  ["Horse", "Ngựa"], ["Goat", "Dê"], ["Monkey", "Khỉ"], ["Rooster", "Gà"], ["Dog", "Chó"], ["Pig", "Heo"],
].map(([en, vi]) => ({ en, vi }));

export type Element = "Mộc" | "Hỏa" | "Thổ" | "Kim" | "Thủy";
export const ELEMENT_EN: Record<Element, string> = {
  Mộc: "Wood", Hỏa: "Fire", Thổ: "Earth", Kim: "Metal", Thủy: "Water",
};
const CAN_ELEMENT: Element[] = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"];

// Nạp Âm for each pair of the 60-year cycle (index = floor(cycle / 2)).
const NAP_AM: [string, Element][] = [
  ["Hải Trung Kim", "Kim"], ["Lư Trung Hỏa", "Hỏa"], ["Đại Lâm Mộc", "Mộc"], ["Lộ Bàng Thổ", "Thổ"],
  ["Kiếm Phong Kim", "Kim"], ["Sơn Đầu Hỏa", "Hỏa"], ["Giản Hạ Thủy", "Thủy"], ["Thành Đầu Thổ", "Thổ"],
  ["Bạch Lạp Kim", "Kim"], ["Dương Liễu Mộc", "Mộc"], ["Tuyền Trung Thủy", "Thủy"], ["Ốc Thượng Thổ", "Thổ"],
  ["Tích Lịch Hỏa", "Hỏa"], ["Tùng Bách Mộc", "Mộc"], ["Trường Lưu Thủy", "Thủy"], ["Sa Trung Kim", "Kim"],
  ["Sơn Hạ Hỏa", "Hỏa"], ["Bình Địa Mộc", "Mộc"], ["Bích Thượng Thổ", "Thổ"], ["Kim Bạch Kim", "Kim"],
  ["Phú Đăng Hỏa", "Hỏa"], ["Thiên Hà Thủy", "Thủy"], ["Đại Trạch Thổ", "Thổ"], ["Thoa Xuyến Kim", "Kim"],
  ["Tang Đố Mộc", "Mộc"], ["Đại Khê Thủy", "Thủy"], ["Sa Trung Thổ", "Thổ"], ["Thiên Thượng Hỏa", "Hỏa"],
  ["Thạch Lựu Mộc", "Mộc"], ["Đại Hải Thủy", "Thủy"],
];

function jdFromDate(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
  return jd;
}

function newMoonDay(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let c1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  c1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  c1 -= 0.0004 * Math.sin(dr * 3 * Mpr);
  c1 += 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  c1 -= 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  c1 -= 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  c1 += 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat = T < -11
    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
    : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Math.floor(jd1 + c1 - deltat + 0.5 + TZ / 24);
}

function sunLongitudeSector(jdn: number): number {
  const T = (jdn - 2451545.5 - TZ / 24) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L -= Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

function lunarMonth11(yy: number): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  const nm = newMoonDay(k);
  return sunLongitudeSector(nm) >= 9 ? newMoonDay(k - 1) : nm;
}

function leapMonthOffset(a11: number): number {
  const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last: number;
  let i = 1;
  let arc = sunLongitudeSector(newMoonDay(k + i));
  do {
    last = arc;
    i++;
    arc = sunLongitudeSector(newMoonDay(k + i));
  } while (arc !== last && i < 14);
  return i - 1;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  jd: number;
}

export function solarToLunar(dd: number, mm: number, yy: number): LunarDate {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1);
  if (monthStart > dayNumber) monthStart = newMoonDay(k);
  let a11 = lunarMonth11(yy);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = lunarMonth11(yy - 1);
  } else {
    lunarYear = yy + 1;
    b11 = lunarMonth11(yy + 1);
  }
  const day = dayNumber - monthStart + 1;
  const diff = Math.floor((monthStart - a11) / 29);
  let leap = false;
  let month = diff + 11;
  if (b11 - a11 > 365) {
    const leapDiff = leapMonthOffset(a11);
    if (diff >= leapDiff) {
      month = diff + 10;
      if (diff === leapDiff) leap = true;
    }
  }
  if (month > 12) month -= 12;
  if (month >= 11 && diff < 4) lunarYear -= 1;
  return { day, month, year: lunarYear, leap, jd: dayNumber };
}

export interface CanChi {
  can: number;
  chi: number;
  name: string;
  animal: Bi;
  stemElement: Element;
  napAm: string;
  napAmElement: Element;
}

function canChi(can: number, chi: number): CanChi {
  let cycle = 0;
  while (cycle % 10 !== can || cycle % 12 !== chi) cycle++;
  const [napAm, napAmElement] = NAP_AM[Math.floor(cycle / 2)];
  return {
    can, chi,
    name: `${CAN[can]} ${CHI[chi]}`,
    animal: CHI_ANIMAL[chi],
    stemElement: CAN_ELEMENT[can],
    napAm, napAmElement,
  };
}

export const yearCanChi = (lunarYear: number) => canChi((lunarYear + 6) % 10, (lunarYear + 8) % 12);
export const monthCanChi = (l: LunarDate) => canChi((l.year * 12 + l.month + 3) % 10, (l.month + 1) % 12);
export const dayCanChi = (l: LunarDate) => canChi((l.jd + 9) % 10, (l.jd + 1) % 12);

const GENERATES: Record<Element, Element> = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" };
const CONTROLS: Record<Element, Element> = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" };

export type Relation = "same" | "nourishes-you" | "you-nourish" | "you-control" | "controls-you";

/** How an outside element (e.g. today's) relates to your own element. */
export function elementRelation(mine: Element, other: Element): { relation: Relation; label: Bi; meaning: Bi } {
  if (mine === other)
    return {
      relation: "same",
      label: { en: "Tương hòa · harmony", vi: "Tương hòa · hòa hợp" },
      meaning: {
        en: "Like meets like: your natural strengths are amplified. Good for being fully yourself.",
        vi: "Đồng khí tương cầu: điểm mạnh tự nhiên của bạn được khuếch đại. Hợp để sống đúng là chính mình.",
      },
    };
  if (GENERATES[other] === mine)
    return {
      relation: "nourishes-you",
      label: { en: "Tương sinh · supports you", vi: "Tương sinh · nâng đỡ bạn" },
      meaning: {
        en: "This energy feeds yours. A day to receive, learn and start things.",
        vi: "Năng lượng này nuôi dưỡng bạn. Ngày tốt để đón nhận, học hỏi và khởi đầu.",
      },
    };
  if (GENERATES[mine] === other)
    return {
      relation: "you-nourish",
      label: { en: "Sinh xuất · you give", vi: "Sinh xuất · bạn cho đi" },
      meaning: {
        en: "Your energy flows outward into this. Good for helping, teaching, creating, but pace yourself.",
        vi: "Năng lượng của bạn tỏa ra ngoài. Hợp để giúp đỡ, chia sẻ, sáng tạo, nhưng hãy giữ sức.",
      },
    };
  if (CONTROLS[mine] === other)
    return {
      relation: "you-control",
      label: { en: "Khắc xuất · you shape it", vi: "Khắc xuất · bạn làm chủ" },
      meaning: {
        en: "You have the upper hand over this energy. Good for effort, discipline and finishing work.",
        vi: "Bạn nắm thế chủ động với năng lượng này. Hợp để nỗ lực, kỷ luật và hoàn thành việc dang dở.",
      },
    };
  return {
    relation: "controls-you",
    label: { en: "Tương khắc · pressure", vi: "Tương khắc · áp lực" },
    meaning: {
      en: "This energy restrains yours. Move carefully, rest more, and avoid forcing big decisions.",
      vi: "Năng lượng này kìm hãm bạn. Hãy đi chậm, nghỉ ngơi nhiều hơn, tránh ép mình ra quyết định lớn.",
    },
  };
}

// 24 solar terms (Tiết khí), starting at solar longitude 0° (spring equinox).
const SOLAR_TERMS: [string, string][] = [
  ["Xuân phân", "Spring Equinox"], ["Thanh minh", "Pure Brightness"], ["Cốc vũ", "Grain Rain"],
  ["Lập hạ", "Start of Summer"], ["Tiểu mãn", "Grain Buds"], ["Mang chủng", "Grain in Ear"],
  ["Hạ chí", "Summer Solstice"], ["Tiểu thử", "Minor Heat"], ["Đại thử", "Major Heat"],
  ["Lập thu", "Start of Autumn"], ["Xử thử", "End of Heat"], ["Bạch lộ", "White Dew"],
  ["Thu phân", "Autumn Equinox"], ["Hàn lộ", "Cold Dew"], ["Sương giáng", "Frost Descent"],
  ["Lập đông", "Start of Winter"], ["Tiểu tuyết", "Minor Snow"], ["Đại tuyết", "Major Snow"],
  ["Đông chí", "Winter Solstice"], ["Tiểu hàn", "Minor Cold"], ["Đại hàn", "Major Cold"],
  ["Lập xuân", "Start of Spring"], ["Vũ thủy", "Rain Water"], ["Kinh trập", "Awakening of Insects"],
];

export function solarTerm(sunLongitude: number): { vi: string; en: string } {
  const [vi, en] = SOLAR_TERMS[Math.floor((((sunLongitude % 360) + 360) % 360) / 15)];
  return { vi, en };
}
