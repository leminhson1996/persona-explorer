// Western astrology & natural cycles, computed from real planetary positions.
import * as A from "astronomy-engine";
import type { Bi } from "./i18n";

export const SIGNS: { name: Bi; glyph: string; element: Bi; keywords: Bi }[] = [
  { name: { en: "Aries", vi: "Bạch Dương" }, glyph: "♈", element: { en: "Fire", vi: "Lửa" }, keywords: { en: "courage, drive, initiative", vi: "can đảm, nhiệt huyết, tiên phong" } },
  { name: { en: "Taurus", vi: "Kim Ngưu" }, glyph: "♉", element: { en: "Earth", vi: "Đất" }, keywords: { en: "stability, senses, patience", vi: "ổn định, cảm quan, kiên nhẫn" } },
  { name: { en: "Gemini", vi: "Song Tử" }, glyph: "♊", element: { en: "Air", vi: "Khí" }, keywords: { en: "curiosity, ideas, conversation", vi: "tò mò, ý tưởng, giao tiếp" } },
  { name: { en: "Cancer", vi: "Cự Giải" }, glyph: "♋", element: { en: "Water", vi: "Nước" }, keywords: { en: "feeling, home, protection", vi: "cảm xúc, gia đình, che chở" } },
  { name: { en: "Leo", vi: "Sư Tử" }, glyph: "♌", element: { en: "Fire", vi: "Lửa" }, keywords: { en: "radiance, creativity, heart", vi: "tỏa sáng, sáng tạo, trái tim" } },
  { name: { en: "Virgo", vi: "Xử Nữ" }, glyph: "♍", element: { en: "Earth", vi: "Đất" }, keywords: { en: "craft, service, refinement", vi: "tỉ mỉ, phụng sự, hoàn thiện" } },
  { name: { en: "Libra", vi: "Thiên Bình" }, glyph: "♎", element: { en: "Air", vi: "Khí" }, keywords: { en: "balance, beauty, relationships", vi: "cân bằng, cái đẹp, các mối quan hệ" } },
  { name: { en: "Scorpio", vi: "Bọ Cạp" }, glyph: "♏", element: { en: "Water", vi: "Nước" }, keywords: { en: "depth, transformation, truth", vi: "chiều sâu, chuyển hóa, sự thật" } },
  { name: { en: "Sagittarius", vi: "Nhân Mã" }, glyph: "♐", element: { en: "Fire", vi: "Lửa" }, keywords: { en: "meaning, freedom, adventure", vi: "ý nghĩa, tự do, phiêu lưu" } },
  { name: { en: "Capricorn", vi: "Ma Kết" }, glyph: "♑", element: { en: "Earth", vi: "Đất" }, keywords: { en: "ambition, mastery, structure", vi: "tham vọng, làm chủ, kỷ cương" } },
  { name: { en: "Aquarius", vi: "Bảo Bình" }, glyph: "♒", element: { en: "Air", vi: "Khí" }, keywords: { en: "vision, originality, community", vi: "tầm nhìn, độc đáo, cộng đồng" } },
  { name: { en: "Pisces", vi: "Song Ngư" }, glyph: "♓", element: { en: "Water", vi: "Nước" }, keywords: { en: "compassion, dreams, intuition", vi: "trắc ẩn, mơ mộng, trực giác" } },
];

export type PlanetKey = "Sun" | "Moon" | "Mercury" | "Venus" | "Mars" | "Jupiter" | "Saturn" | "Uranus" | "Neptune" | "Pluto";

export const PLANETS: Record<PlanetKey, { name: Bi; glyph: string; rules: Bi }> = {
  Sun: { name: { en: "Sun", vi: "Mặt Trời" }, glyph: "☉", rules: { en: "identity, vitality", vi: "bản ngã, sức sống" } },
  Moon: { name: { en: "Moon", vi: "Mặt Trăng" }, glyph: "☽", rules: { en: "emotions, needs", vi: "cảm xúc, nhu cầu" } },
  Mercury: { name: { en: "Mercury", vi: "Sao Thủy" }, glyph: "☿", rules: { en: "mind, communication", vi: "tư duy, giao tiếp" } },
  Venus: { name: { en: "Venus", vi: "Sao Kim" }, glyph: "♀", rules: { en: "love, values, beauty", vi: "tình yêu, giá trị, cái đẹp" } },
  Mars: { name: { en: "Mars", vi: "Sao Hỏa" }, glyph: "♂", rules: { en: "action, desire", vi: "hành động, khát khao" } },
  Jupiter: { name: { en: "Jupiter", vi: "Sao Mộc" }, glyph: "♃", rules: { en: "growth, luck, wisdom", vi: "phát triển, may mắn, trí tuệ" } },
  Saturn: { name: { en: "Saturn", vi: "Sao Thổ" }, glyph: "♄", rules: { en: "discipline, lessons", vi: "kỷ luật, bài học" } },
  Uranus: { name: { en: "Uranus", vi: "Sao Thiên Vương" }, glyph: "♅", rules: { en: "change, awakening", vi: "đổi mới, thức tỉnh" } },
  Neptune: { name: { en: "Neptune", vi: "Sao Hải Vương" }, glyph: "♆", rules: { en: "dreams, spirit", vi: "giấc mơ, tâm linh" } },
  Pluto: { name: { en: "Pluto", vi: "Sao Diêm Vương" }, glyph: "♇", rules: { en: "transformation, power", vi: "chuyển hóa, quyền năng" } },
};

const PLANET_KEYS = Object.keys(PLANETS) as PlanetKey[];

const norm = (deg: number) => ((deg % 360) + 360) % 360;
export const signIndex = (lon: number) => Math.floor(norm(lon) / 30);
export const degreeInSign = (lon: number) => norm(lon) % 30;

export function longitude(body: PlanetKey, date: Date): number {
  if (body === "Sun") return A.SunPosition(date).elon;
  if (body === "Moon") return A.EclipticGeoMoon(date).lon;
  return A.Ecliptic(A.GeoVector(A.Body[body], date, true)).elon;
}

export function positions(date: Date) {
  const dayBefore = new Date(date.getTime() - 86400000);
  return PLANET_KEYS.map((key) => {
    const lon = longitude(key, date);
    const prev = longitude(key, dayBefore);
    // Positive daily motion = direct; wrap across 0°/360°.
    const motion = ((lon - prev + 540) % 360) - 180;
    return { key, lon, sign: signIndex(lon), deg: degreeInSign(lon), retrograde: key !== "Sun" && key !== "Moon" && motion < 0 };
  });
}

/** Ascendant (rising sign longitude) for a moment and place. */
export function ascendant(date: Date, lat: number, lon: number): number {
  const lst = norm(A.SiderealTime(date) * 15 + lon);
  const ramc = (lst * Math.PI) / 180;
  const eps = (23.4393 * Math.PI) / 180;
  const phi = (lat * Math.PI) / 180;
  const asc = Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps)));
  return norm((asc * 180) / Math.PI);
}

export const ASPECTS: { angle: number; name: Bi; symbol: string; tone: Bi }[] = [
  { angle: 0, name: { en: "conjunct", vi: "hợp" }, symbol: "☌", tone: { en: "intensifies", vi: "khuếch đại" } },
  { angle: 60, name: { en: "sextile", vi: "lục hợp" }, symbol: "⚹", tone: { en: "opens a door", vi: "mở ra cơ hội" } },
  { angle: 90, name: { en: "square", vi: "vuông" }, symbol: "□", tone: { en: "creates friction to grow from", vi: "tạo ma sát để trưởng thành" } },
  { angle: 120, name: { en: "trine", vi: "tam hợp" }, symbol: "△", tone: { en: "flows easily", vi: "hanh thông, thuận lợi" } },
  { angle: 180, name: { en: "opposite", vi: "đối đỉnh" }, symbol: "☍", tone: { en: "asks for balance", vi: "đòi hỏi sự cân bằng" } },
];

export interface NatalPoint {
  key: PlanetKey | "Ascendant";
  lon: number;
}

export interface Transit {
  transiting: PlanetKey;
  natal: NatalPoint["key"];
  aspect: (typeof ASPECTS)[number];
  orb: number;
}

export function transits(sky: ReturnType<typeof positions>, natal: NatalPoint[]): Transit[] {
  const found: Transit[] = [];
  for (const p of sky) {
    const maxOrb = p.key === "Moon" ? 4 : p.key === "Sun" || p.key === "Mercury" || p.key === "Venus" || p.key === "Mars" ? 3 : 2;
    for (const n of natal) {
      const sep = Math.abs(((p.lon - n.lon + 540) % 360) - 180);
      for (const aspect of ASPECTS) {
        const orb = Math.abs(sep - aspect.angle);
        if (orb <= maxOrb) found.push({ transiting: p.key, natal: n.key, aspect, orb });
      }
    }
  }
  // Slow planets carry more weight; then tighter orbs.
  const weight = (k: PlanetKey) => PLANET_KEYS.indexOf(k);
  return found.sort((a, b) => weight(b.transiting) - weight(a.transiting) || a.orb - b.orb);
}

export const MOON_PHASES: { name: Bi; emoji: string; meaning: Bi }[] = [
  { name: { en: "New Moon", vi: "Trăng non" }, emoji: "🌑", meaning: { en: "Set intentions, begin quietly.", vi: "Đặt ý định, khởi đầu lặng lẽ." } },
  { name: { en: "Waxing Crescent", vi: "Trăng lưỡi liềm đầu tháng" }, emoji: "🌒", meaning: { en: "Take the first small steps.", vi: "Bước những bước nhỏ đầu tiên." } },
  { name: { en: "First Quarter", vi: "Trăng thượng huyền" }, emoji: "🌓", meaning: { en: "Act, decide, push through resistance.", vi: "Hành động, quyết định, vượt qua trở ngại." } },
  { name: { en: "Waxing Gibbous", vi: "Trăng khuyết đầu tháng" }, emoji: "🌔", meaning: { en: "Refine and adjust.", vi: "Tinh chỉnh và điều chỉnh." } },
  { name: { en: "Full Moon", vi: "Trăng tròn" }, emoji: "🌕", meaning: { en: "Culmination, clarity, strong emotions.", vi: "Viên mãn, sáng tỏ, cảm xúc dâng cao." } },
  { name: { en: "Waning Gibbous", vi: "Trăng khuyết cuối tháng" }, emoji: "🌖", meaning: { en: "Share what you've learned, give thanks.", vi: "Chia sẻ điều đã học, biết ơn." } },
  { name: { en: "Last Quarter", vi: "Trăng hạ huyền" }, emoji: "🌗", meaning: { en: "Release, forgive, clear space.", vi: "Buông bỏ, tha thứ, dọn chỗ trống." } },
  { name: { en: "Waning Crescent", vi: "Trăng tàn" }, emoji: "🌘", meaning: { en: "Rest and surrender before the next cycle.", vi: "Nghỉ ngơi, buông lơi trước chu kỳ mới." } },
];

export function moonInfo(date: Date) {
  const angle = A.MoonPhase(date); // 0 new, 90 first quarter, 180 full, 270 last quarter
  const illumination = A.Illumination(A.Body.Moon, date).phase_fraction;
  const phaseIndex = Math.floor(norm(angle + 22.5) / 45) % 8;
  const nextFull = A.SearchMoonPhase(180, date, 40)?.date ?? null;
  const nextNew = A.SearchMoonPhase(0, date, 40)?.date ?? null;
  return { angle, illumination, phaseIndex, nextFull, nextNew };
}

export function sunTimes(date: Date, lat: number, lon: number) {
  const observer = new A.Observer(lat, lon, 0);
  // Search from local midnight (approximated from longitude) so we get today's rise and set.
  const localMidnight = new Date(date);
  localMidnight.setHours(0, 0, 0, 0);
  const rise = A.SearchRiseSet(A.Body.Sun, observer, +1, localMidnight, 1)?.date ?? null;
  const set = rise ? A.SearchRiseSet(A.Body.Sun, observer, -1, rise, 1)?.date ?? null : null;
  const daylightHours = rise && set ? (set.getTime() - rise.getTime()) / 3600000 : null;
  return { rise, set, daylightHours };
}

export function season(date: Date, lat: number): Bi {
  const s = A.Seasons(date.getFullYear());
  const t = date.getTime();
  const marks = [s.mar_equinox.date, s.jun_solstice.date, s.sep_equinox.date, s.dec_solstice.date].map((d) => d.getTime());
  const north = [
    { en: "Winter", vi: "Mùa đông" }, { en: "Spring", vi: "Mùa xuân" }, { en: "Summer", vi: "Mùa hạ" },
    { en: "Autumn", vi: "Mùa thu" }, { en: "Winter", vi: "Mùa đông" },
  ];
  let i = marks.findIndex((m) => t < m);
  if (i === -1) i = 4;
  const idx = lat >= 0 ? i : (i + 2) % 4;
  return north[idx];
}
