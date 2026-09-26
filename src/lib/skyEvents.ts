// Real sky events for where you are: eclipses, meteor showers, and what you can see tonight.
import * as A from "astronomy-engine";
import type { Bi } from "./i18n";
import type { Place } from "./types";

const ECLIPSE_KIND: Record<string, Bi> = {
  penumbral: { en: "Penumbral", vi: "Nửa tối" },
  partial: { en: "Partial", vi: "Một phần" },
  annular: { en: "Annular", vi: "Hình khuyên" },
  total: { en: "Total", vi: "Toàn phần" },
};

// Annual meteor showers: typical peak (month, day) and zenithal hourly rate.
const SHOWERS: { name: Bi; month: number; day: number; zhr: number }[] = [
  { name: { en: "Quadrantids", vi: "Quadrantids" }, month: 1, day: 3, zhr: 110 },
  { name: { en: "Lyrids", vi: "Lyrids (Thiên Cầm)" }, month: 4, day: 22, zhr: 18 },
  { name: { en: "Eta Aquariids", vi: "Eta Aquariids (Bảo Bình)" }, month: 5, day: 6, zhr: 50 },
  { name: { en: "Delta Aquariids", vi: "Delta Aquariids" }, month: 7, day: 30, zhr: 25 },
  { name: { en: "Perseids", vi: "Perseids (Anh Tiên)" }, month: 8, day: 12, zhr: 100 },
  { name: { en: "Draconids", vi: "Draconids (Thiên Long)" }, month: 10, day: 8, zhr: 10 },
  { name: { en: "Orionids", vi: "Orionids (Lạp Hộ)" }, month: 10, day: 21, zhr: 20 },
  { name: { en: "Leonids", vi: "Leonids (Sư Tử)" }, month: 11, day: 17, zhr: 15 },
  { name: { en: "Geminids", vi: "Geminids (Song Tử)" }, month: 12, day: 14, zhr: 150 },
  { name: { en: "Ursids", vi: "Ursids (Tiểu Hùng)" }, month: 12, day: 22, zhr: 10 },
];

const PLANETS: { body: A.Body; name: Bi }[] = [
  { body: A.Body.Mercury, name: { en: "Mercury", vi: "Sao Thủy" } },
  { body: A.Body.Venus, name: { en: "Venus", vi: "Sao Kim" } },
  { body: A.Body.Mars, name: { en: "Mars", vi: "Sao Hỏa" } },
  { body: A.Body.Jupiter, name: { en: "Jupiter", vi: "Sao Mộc" } },
  { body: A.Body.Saturn, name: { en: "Saturn", vi: "Sao Thổ" } },
];

const DIRS_EN = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
const DIRS_VI = ["Bắc", "Đông Bắc", "Đông", "Đông Nam", "Nam", "Tây Nam", "Tây", "Tây Bắc"];
const compass = (az: number): Bi => {
  const i = Math.round(az / 45) % 8;
  return { en: DIRS_EN[i], vi: DIRS_VI[i] };
};

export interface VisiblePlanet {
  name: Bi;
  altitude: number;
  direction: Bi;
  magnitude: number;
}

function visibleAt(time: Date, observer: A.Observer): VisiblePlanet[] {
  const sun = A.Equator(A.Body.Sun, time, observer, true, true);
  if (A.Horizon(time, observer, sun.ra, sun.dec, "normal").altitude > -6) return []; // not dark yet
  return PLANETS.map((p) => {
    const eq = A.Equator(p.body, time, observer, true, true);
    const hor = A.Horizon(time, observer, eq.ra, eq.dec, "normal");
    return { name: p.name, altitude: hor.altitude, direction: compass(hor.azimuth), magnitude: A.Illumination(p.body, time).mag };
  })
    .filter((p) => p.altitude > 10)
    .sort((a, b) => a.magnitude - b.magnitude);
}

export function skyEvents(now: Date, place: Place) {
  const observer = new A.Observer(place.lat, place.lon, 0);

  // Eclipses
  const lunar = A.SearchLunarEclipse(now);
  const moonAtPeak = A.Equator(A.Body.Moon, lunar.peak.date, observer, true, true);
  const lunarVisible = A.Horizon(lunar.peak.date, observer, moonAtPeak.ra, moonAtPeak.dec, "normal").altitude > 0;
  const solarGlobal = A.SearchGlobalSolarEclipse(now);
  let solarLocal: { date: Date; kind: Bi; obscuration: number } | null = null;
  try {
    const local = A.SearchLocalSolarEclipse(now, observer);
    solarLocal = { date: local.peak.time.date, kind: ECLIPSE_KIND[local.kind], obscuration: local.obscuration };
  } catch {
    /* none found */
  }

  // Meteor showers: the next three peaks, with how bright the Moon will be.
  const showers = SHOWERS.map((s) => {
    let peak = new Date(now.getFullYear(), s.month - 1, s.day, 3);
    if (peak.getTime() < now.getTime() - 86400000) peak = new Date(now.getFullYear() + 1, s.month - 1, s.day, 3);
    const moon = A.Illumination(A.Body.Moon, peak).phase_fraction;
    return { ...s, peak, moonIllumination: moon };
  })
    .sort((a, b) => a.peak.getTime() - b.peak.getTime())
    .slice(0, 3);

  // What you can see: this evening (~1.5h after sunset) and before dawn (~1h before sunrise).
  const set = A.SearchRiseSet(A.Body.Sun, observer, -1, new Date(now.getTime() - 12 * 3600000), 2)?.date;
  const rise = A.SearchRiseSet(A.Body.Sun, observer, +1, now, 2)?.date;
  const evening = set ? new Date(Math.max(set.getTime() + 1.5 * 3600000, Math.min(now.getTime(), set.getTime() + 5 * 3600000))) : null;
  const dawn = rise ? new Date(rise.getTime() - 3600000) : null;

  return {
    lunarEclipse: { date: lunar.peak.date, kind: ECLIPSE_KIND[lunar.kind], visibleHere: lunarVisible },
    solarEclipse: { date: solarGlobal.peak.date, kind: ECLIPSE_KIND[solarGlobal.kind], lat: solarGlobal.latitude, lon: solarGlobal.longitude },
    solarLocal,
    showers,
    evening: evening ? { time: evening, planets: visibleAt(evening, observer) } : null,
    dawn: dawn ? { time: dawn, planets: visibleAt(dawn, observer) } : null,
  };
}

export type SkyEvents = ReturnType<typeof skyEvents>;

export function describeSkyEvents(s: SkyEvents): string {
  const d = (x: Date) => x.toDateString();
  return [
    "### Real sky events (computed for their location)",
    `- Next lunar eclipse: ${s.lunarEclipse.kind.en}, ${d(s.lunarEclipse.date)}${s.lunarEclipse.visibleHere ? " (visible from their location)" : " (not visible from their location)"}`,
    `- Next solar eclipse anywhere: ${s.solarEclipse.kind.en}, ${d(s.solarEclipse.date)}`,
    s.solarLocal ? `- Next solar eclipse visible from their location: ${s.solarLocal.kind.en}, ${d(s.solarLocal.date)}, ${(s.solarLocal.obscuration * 100).toFixed(0)}% of the Sun covered` : "",
    `- Upcoming meteor showers: ${s.showers.map((m) => `${m.name.en} peak ~${d(m.peak)} (ZHR ${m.zhr}, Moon ${(m.moonIllumination * 100).toFixed(0)}% lit)`).join("; ")}`,
    s.evening ? `- Planets visible this evening: ${s.evening.planets.map((p) => `${p.name.en} (${p.direction.en}, ${p.altitude.toFixed(0)}° up)`).join(", ") || "none well placed"}` : "",
    s.dawn ? `- Planets visible before dawn: ${s.dawn.planets.map((p) => `${p.name.en} (${p.direction.en})`).join(", ") || "none well placed"}` : "",
  ].filter(Boolean).join("\n");
}
