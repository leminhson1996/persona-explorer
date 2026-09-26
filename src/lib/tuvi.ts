// Tử Vi Đẩu Số: a 12-palace chart from the lunar birth date and hour (Vietnamese school).
import type { Bi } from "./i18n";
import { CAN, CHI, canChi, elementRelation, solarToLunar, yearCanChi, type Element } from "./lunar";
import { birthInfo, isYang, type Gender } from "./bazi";
import type { Profile } from "./types";

export const PALACES = [
  "Mệnh", "Phụ Mẫu", "Phúc Đức", "Điền Trạch", "Quan Lộc", "Nô Bộc",
  "Thiên Di", "Tật Ách", "Tài Bạch", "Tử Tức", "Phu Thê", "Huynh Đệ",
] as const;
export type PalaceName = (typeof PALACES)[number];

export const PALACE_MEANING: Record<PalaceName, Bi> = {
  "Mệnh": { en: "Self, character, life direction", vi: "Bản thân, tính cách, hướng đi đời người" },
  "Phụ Mẫu": { en: "Parents, elders, mentors", vi: "Cha mẹ, bề trên, người dìu dắt" },
  "Phúc Đức": { en: "Inner peace, ancestry, spiritual fortune", vi: "Phúc phần, dòng họ, đời sống tinh thần" },
  "Điền Trạch": { en: "Home, property, environment", vi: "Nhà cửa, đất đai, môi trường sống" },
  "Quan Lộc": { en: "Career, achievement, reputation", vi: "Sự nghiệp, công danh, thành tựu" },
  "Nô Bộc": { en: "Friends, colleagues, network", vi: "Bạn bè, đồng nghiệp, cộng sự" },
  "Thiên Di": { en: "Travel, outside world, how others see you", vi: "Ra ngoài, xã hội, cách người khác nhìn bạn" },
  "Tật Ách": { en: "Health, stress, hidden troubles", vi: "Sức khỏe, áp lực, trắc trở ẩn" },
  "Tài Bạch": { en: "Money, earning, resources", vi: "Tiền bạc, cách kiếm tiền, tài nguyên" },
  "Tử Tức": { en: "Children, creativity, legacy", vi: "Con cái, sáng tạo, thành quả để lại" },
  "Phu Thê": { en: "Partner, marriage, close relationships", vi: "Vợ chồng, tình duyên, quan hệ thân mật" },
  "Huynh Đệ": { en: "Siblings, peers", vi: "Anh chị em, người ngang hàng" },
};

export type MainStar =
  | "Tử Vi" | "Thiên Cơ" | "Thái Dương" | "Vũ Khúc" | "Thiên Đồng" | "Liêm Trinh"
  | "Thiên Phủ" | "Thái Âm" | "Tham Lang" | "Cự Môn" | "Thiên Tướng" | "Thiên Lương" | "Thất Sát" | "Phá Quân";

export const MAIN_STAR_MEANING: Record<MainStar, Bi> = {
  "Tử Vi": { en: "Emperor star: leadership, dignity, responsibility", vi: "Đế tinh: lãnh đạo, uy nghi, trách nhiệm" },
  "Thiên Cơ": { en: "Strategist: intelligence, planning, change", vi: "Mưu trí: thông minh, tính toán, biến động" },
  "Thái Dương": { en: "Sun: generosity, visibility, giving", vi: "Mặt Trời: quảng đại, danh tiếng, cho đi" },
  "Vũ Khúc": { en: "Finance star: determination, money, execution", vi: "Tài tinh: cương quyết, tiền bạc, thực thi" },
  "Thiên Đồng": { en: "Blessing star: ease, harmony, enjoyment", vi: "Phúc tinh: hòa nhã, an nhàn, hưởng thụ" },
  "Liêm Trinh": { en: "Integrity & passion: principles, intensity", vi: "Liêm chính & đam mê: nguyên tắc, mãnh liệt" },
  "Thiên Phủ": { en: "Treasury: stability, prudence, abundance", vi: "Kho tàng: ổn định, cẩn trọng, sung túc" },
  "Thái Âm": { en: "Moon: sensitivity, wealth accumulation, care", vi: "Mặt Trăng: nhạy cảm, tích lũy, chăm sóc" },
  "Tham Lang": { en: "Desire: charm, ambition, versatility", vi: "Ham muốn: duyên dáng, tham vọng, đa tài" },
  "Cự Môn": { en: "Great gate: speech, analysis, debate", vi: "Cửa lớn: ăn nói, phân tích, thị phi" },
  "Thiên Tướng": { en: "Minister: fairness, support, loyalty", vi: "Tể tướng: công bằng, phò tá, trung thành" },
  "Thiên Lương": { en: "Elder/protector: wisdom, shelter, healing", vi: "Ấm tinh: hiền minh, che chở, cứu giải" },
  "Thất Sát": { en: "General: courage, independence, upheaval", vi: "Tướng tinh: dũng mãnh, độc lập, biến động" },
  "Phá Quân": { en: "Vanguard: breaking the old, reinvention", vi: "Tiên phong: phá cũ, đổi mới, cải cách" },
};

export type Hoa = "Lộc" | "Quyền" | "Khoa" | "Kỵ";

// Tứ Hóa by year stem: [Lộc, Quyền, Khoa, Kỵ].
const TU_HOA: string[][] = [
  ["Liêm Trinh", "Phá Quân", "Vũ Khúc", "Thái Dương"],
  ["Thiên Cơ", "Thiên Lương", "Tử Vi", "Thái Âm"],
  ["Thiên Đồng", "Thiên Cơ", "Văn Xương", "Liêm Trinh"],
  ["Thái Âm", "Thiên Đồng", "Thiên Cơ", "Cự Môn"],
  ["Tham Lang", "Thái Âm", "Hữu Bật", "Thiên Cơ"],
  ["Vũ Khúc", "Tham Lang", "Thiên Lương", "Văn Khúc"],
  ["Thái Dương", "Vũ Khúc", "Thái Âm", "Thiên Đồng"],
  ["Cự Môn", "Thái Dương", "Văn Khúc", "Văn Xương"],
  ["Thiên Lương", "Tử Vi", "Tả Phù", "Vũ Khúc"],
  ["Phá Quân", "Cự Môn", "Thái Âm", "Tham Lang"],
];
const HOA_ORDER: Hoa[] = ["Lộc", "Quyền", "Khoa", "Kỵ"];

const CUC: Record<Element, { n: number; name: string }> = {
  Thủy: { n: 2, name: "Thủy Nhị Cục" },
  Mộc: { n: 3, name: "Mộc Tam Cục" },
  Kim: { n: 4, name: "Kim Tứ Cục" },
  Thổ: { n: 5, name: "Thổ Ngũ Cục" },
  Hỏa: { n: 6, name: "Hỏa Lục Cục" },
};

const LOC_TON = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0]; // by year stem
const KHOI_VIET: [number, number][] = [[1, 7], [0, 8], [11, 9], [11, 9], [1, 7], [0, 8], [1, 7], [6, 2], [3, 5], [3, 5]];
const MENH_CHU = ["Tham Lang", "Cự Môn", "Lộc Tồn", "Văn Khúc", "Liêm Trinh", "Vũ Khúc", "Phá Quân", "Vũ Khúc", "Liêm Trinh", "Văn Khúc", "Lộc Tồn", "Cự Môn"];
const THAN_CHU = ["Hỏa Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ", "Hỏa Tinh", "Thiên Tướng", "Thiên Lương", "Thiên Đồng", "Văn Xương", "Thiên Cơ"];

const mod12 = (n: number) => ((n % 12) + 12) % 12;

export interface Star {
  name: string;
  main: boolean;
  hoa?: Hoa;
  tone: "good" | "bad" | "neutral";
}

export interface Palace {
  chi: number;
  can: number;
  name: PalaceName;
  isThan: boolean;
  stars: Star[];
  daiHan: number; // starting age of the 10-year period
}

export function computeTuVi(p: Profile, now = new Date()) {
  const b = birthInfo(p);
  if (!b) return null;

  const lunar = solarToLunar(b.d, b.m, b.y);
  const year = yearCanChi(lunar.year);
  const month = lunar.month; // a leap month is read as the month it repeats
  const day = lunar.day;
  const h = b.hourChi;

  const menh = mod12(2 + (month - 1) - h);
  const than = mod12(2 + (month - 1) + h);

  // Ngũ Hổ Độn: stem of the Dần palace from the year stem.
  const danStem = ((year.can % 5) * 2 + 2) % 10;
  const stemOf = (chi: number) => (danStem + mod12(chi - 2)) % 10;

  const menhCanChi = canChi(stemOf(menh), menh);
  const cuc = CUC[menhCanChi.napAmElement];

  // An Tử Vi from Cục and lunar day.
  const q = Math.ceil(day / cuc.n);
  const borrow = q * cuc.n - day;
  const tuVi = mod12(2 + (q - 1) + (borrow % 2 === 0 ? borrow : -borrow));
  const thienPhu = mod12(4 - tuVi);

  const positions: Record<string, number> = {
    "Tử Vi": tuVi,
    "Thiên Cơ": mod12(tuVi - 1),
    "Thái Dương": mod12(tuVi - 3),
    "Vũ Khúc": mod12(tuVi - 4),
    "Thiên Đồng": mod12(tuVi - 5),
    "Liêm Trinh": mod12(tuVi - 8),
    "Thiên Phủ": thienPhu,
    "Thái Âm": mod12(thienPhu + 1),
    "Tham Lang": mod12(thienPhu + 2),
    "Cự Môn": mod12(thienPhu + 3),
    "Thiên Tướng": mod12(thienPhu + 4),
    "Thiên Lương": mod12(thienPhu + 5),
    "Thất Sát": mod12(thienPhu + 6),
    "Phá Quân": mod12(thienPhu + 10),
  };
  const mainStars = new Set(Object.keys(positions));

  const locTon = LOC_TON[year.can];
  const [khoi, viet] = KHOI_VIET[year.can];
  const maGroup = year.chi % 4; // Thân Tý Thìn=0, Tỵ Dậu Sửu=1, Dần Ngọ Tuất=2, Hợi Mão Mùi=3
  const minor: [string, number, Star["tone"]][] = [
    ["Tả Phù", mod12(4 + month - 1), "good"],
    ["Hữu Bật", mod12(10 - (month - 1)), "good"],
    ["Văn Xương", mod12(10 - h), "good"],
    ["Văn Khúc", mod12(4 + h), "good"],
    ["Thiên Khôi", khoi, "good"],
    ["Thiên Việt", viet, "good"],
    ["Lộc Tồn", locTon, "good"],
    ["Thiên Mã", [2, 11, 8, 5][maGroup], "good"],
    ["Kình Dương", mod12(locTon + 1), "bad"],
    ["Đà La", mod12(locTon - 1), "bad"],
    ["Địa Không", mod12(11 - h), "bad"],
    ["Địa Kiếp", mod12(11 + h), "bad"],
  ];
  for (const [name, pos] of minor) positions[name] = pos;

  const hoaOf = new Map<string, Hoa>();
  TU_HOA[year.can].forEach((star, i) => hoaOf.set(star, HOA_ORDER[i]));

  // Đại hạn: starts at Mệnh at age = Cục; dương nam / âm nữ go forward, others backward.
  const gender: Gender | null = b.gender;
  const forward = gender ? isYang(year.can) === (gender === "male") : true;

  const palaces: Palace[] = [];
  for (let chi = 0; chi < 12; chi++) {
    const offset = mod12(chi - menh);
    const stepsFromMenh = forward ? offset : mod12(-offset);
    const stars: Star[] = Object.entries(positions)
      .filter(([, pos]) => pos === chi)
      .map(([name]) => {
        const main = mainStars.has(name);
        const hoa = hoaOf.get(name);
        const tone = minor.find(([n]) => n === name)?.[2] ?? "neutral";
        return { name, main, hoa, tone: hoa === "Kỵ" ? "bad" : hoa ? "good" : tone };
      })
      .sort((a, c) => Number(c.main) - Number(a.main));
    palaces.push({
      chi,
      can: stemOf(chi),
      name: PALACES[offset],
      isThan: chi === than,
      stars,
      daiHan: cuc.n + stepsFromMenh * 10,
    });
  }

  // Current periods (tuổi âm = lunar years + 1).
  const nowLunar = solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const tuoiAm = nowLunar.year - lunar.year + 1;
  const currentDaiHan = palaces.find((pl) => tuoiAm >= pl.daiHan && tuoiAm < pl.daiHan + 10) ?? null;
  const luuNien = mod12((nowLunar.year + 8) % 12); // palace of this year's branch (Thái Tuế)

  const napAmMenh = year.napAmElement;
  return {
    lunar, year, month, day, hourChi: h, gender, forward,
    menh, than, palaces,
    cuc: { ...cuc, element: menhCanChi.napAmElement },
    banMenh: { name: year.napAm, element: napAmMenh },
    cucVsMenh: elementRelation(napAmMenh, menhCanChi.napAmElement),
    amDuong: `${isYang(year.can) ? "Dương" : "Âm"} ${gender === "male" ? "Nam" : gender === "female" ? "Nữ" : ""}`.trim(),
    menhChu: MENH_CHU[menh],
    thanChu: THAN_CHU[year.chi],
    tuoiAm, currentDaiHan, luuNien,
    hourName: `giờ ${CHI[h]}`,
    stemName: (i: number) => CAN[i],
  };
}

export type TuVi = NonNullable<ReturnType<typeof computeTuVi>>;

/** Traditional 4×4 layout: grid [row][col] → branch index, null = center. */
export const TUVI_GRID: (number | null)[][] = [
  [5, 6, 7, 8],
  [4, null, null, 9],
  [3, null, null, 10],
  [2, 1, 0, 11],
];
