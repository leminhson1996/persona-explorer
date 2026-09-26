// Pythagorean numerology.
import type { Bi } from "./i18n";

const MASTERS = new Set([11, 22, 33]);

const digitSum = (n: number) => String(Math.abs(n)).split("").reduce((a, d) => a + Number(d), 0);

export function reduce(n: number, keepMaster = true): number {
  while (n > 9 && !(keepMaster && MASTERS.has(n))) n = digitSum(n);
  return n;
}

export const lifePath = (y: number, m: number, d: number) => reduce(reduce(m) + reduce(d) + reduce(y));
export const birthdayNumber = (d: number) => reduce(d);

export function expressionNumber(fullName: string): number | null {
  // Strip Vietnamese diacritics so "Lê Minh Sơn" → "LE MINH SON".
  const letters = fullName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (!letters) return null;
  const total = [...letters].reduce((a, c) => a + ((c.charCodeAt(0) - 65) % 9) + 1, 0);
  return reduce(total);
}

export function personalCycles(birthMonth: number, birthDay: number, today: Date) {
  const year = reduce(reduce(birthMonth) + reduce(birthDay) + reduce(today.getFullYear()), false);
  const month = reduce(year + today.getMonth() + 1, false);
  const day = reduce(month + today.getDate(), false);
  return { year, month, day };
}

export const universalDay = (today: Date) =>
  reduce(digitSum(today.getFullYear()) + digitSum(today.getMonth() + 1) + digitSum(today.getDate()));

export const NUMBER_MEANING: Record<number, { keyword: Bi; essence: Bi }> = {
  1: { keyword: { en: "The Initiator", vi: "Người khởi xướng" }, essence: { en: "independence, courage, new beginnings", vi: "độc lập, can đảm, khởi đầu mới" } },
  2: { keyword: { en: "The Harmonizer", vi: "Người hòa giải" }, essence: { en: "partnership, patience, sensitivity", vi: "hợp tác, kiên nhẫn, nhạy cảm" } },
  3: { keyword: { en: "The Creator", vi: "Người sáng tạo" }, essence: { en: "expression, joy, communication", vi: "biểu đạt, niềm vui, giao tiếp" } },
  4: { keyword: { en: "The Builder", vi: "Người xây dựng" }, essence: { en: "structure, discipline, steady work", vi: "nền tảng, kỷ luật, làm việc bền bỉ" } },
  5: { keyword: { en: "The Explorer", vi: "Người khám phá" }, essence: { en: "change, freedom, adventure", vi: "thay đổi, tự do, phiêu lưu" } },
  6: { keyword: { en: "The Nurturer", vi: "Người chăm sóc" }, essence: { en: "care, responsibility, home and love", vi: "yêu thương, trách nhiệm, gia đình" } },
  7: { keyword: { en: "The Seeker", vi: "Người tìm kiếm" }, essence: { en: "reflection, wisdom, inner truth", vi: "chiêm nghiệm, trí tuệ, sự thật bên trong" } },
  8: { keyword: { en: "The Achiever", vi: "Người thành tựu" }, essence: { en: "power, ambition, material mastery", vi: "quyền lực, tham vọng, làm chủ vật chất" } },
  9: { keyword: { en: "The Humanitarian", vi: "Người nhân ái" }, essence: { en: "completion, compassion, letting go", vi: "hoàn tất, lòng trắc ẩn, buông bỏ" } },
  11: { keyword: { en: "The Intuitive", vi: "Người trực giác" }, essence: { en: "inspiration, insight, spiritual sensitivity", vi: "cảm hứng, thấu hiểu, nhạy cảm tâm linh" } },
  22: { keyword: { en: "The Master Builder", vi: "Kiến trúc sư bậc thầy" }, essence: { en: "turning big visions into reality", vi: "biến tầm nhìn lớn thành hiện thực" } },
  33: { keyword: { en: "The Master Teacher", vi: "Người thầy bậc thầy" }, essence: { en: "healing, devotion, uplifting others", vi: "chữa lành, cống hiến, nâng đỡ người khác" } },
};

export const PERSONAL_YEAR_THEME: Record<number, Bi> = {
  1: { en: "Plant seeds: a fresh 9-year cycle begins.", vi: "Gieo hạt: một chu kỳ 9 năm mới bắt đầu." },
  2: { en: "Patience and partnership; let seeds root.", vi: "Kiên nhẫn và hợp tác; để hạt giống bén rễ." },
  3: { en: "Expand, create, be seen.", vi: "Mở rộng, sáng tạo, thể hiện bản thân." },
  4: { en: "Build foundations through steady work.", vi: "Xây nền móng bằng sự bền bỉ." },
  5: { en: "Change and freedom; say yes to movement.", vi: "Thay đổi và tự do; đón nhận sự chuyển động." },
  6: { en: "Responsibility, love, home and healing.", vi: "Trách nhiệm, yêu thương, gia đình và chữa lành." },
  7: { en: "Go inward: study, rest, reflect.", vi: "Hướng vào trong: học hỏi, nghỉ ngơi, chiêm nghiệm." },
  8: { en: "Harvest: power, results, recognition.", vi: "Thu hoạch: sức mạnh, kết quả, sự công nhận." },
  9: { en: "Completion: release what's finished.", vi: "Hoàn tất: buông bỏ những gì đã xong." },
};
