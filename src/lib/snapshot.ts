// Combines every system into one "state of the universe, for you, today" snapshot.
import * as astro from "./astro";
import * as num from "./numerology";
import * as lunar from "./lunar";
import { FEELINGS, MOODS } from "./i18n";
import type { CheckIn, CosmosData, Place, Profile } from "./types";

export const CITIES: (Place & { label: string; tz: number })[] = [
  { label: "Hà Nội", lat: 21.0285, lon: 105.8542, tz: 7 },
  { label: "TP. Hồ Chí Minh", lat: 10.8231, lon: 106.6297, tz: 7 },
  { label: "Đà Nẵng", lat: 16.0544, lon: 108.2022, tz: 7 },
  { label: "Huế", lat: 16.4637, lon: 107.5909, tz: 7 },
  { label: "Hải Phòng", lat: 20.8449, lon: 106.6881, tz: 7 },
  { label: "Cần Thơ", lat: 10.0452, lon: 105.7469, tz: 7 },
  { label: "Nha Trang", lat: 12.2388, lon: 109.1967, tz: 7 },
  { label: "Đà Lạt", lat: 11.9404, lon: 108.4583, tz: 7 },
  { label: "Vinh", lat: 18.6796, lon: 105.6813, tz: 7 },
  { label: "Quy Nhơn", lat: 13.782, lon: 109.2197, tz: 7 },
  { label: "Singapore", lat: 1.3521, lon: 103.8198, tz: 8 },
  { label: "Bangkok", lat: 13.7563, lon: 100.5018, tz: 7 },
  { label: "Tokyo", lat: 35.6762, lon: 139.6503, tz: 9 },
  { label: "Seoul", lat: 37.5665, lon: 126.978, tz: 9 },
  { label: "Sydney", lat: -33.8688, lon: 151.2093, tz: 10 },
  { label: "Berlin", lat: 52.52, lon: 13.405, tz: 1 },
  { label: "Paris", lat: 48.8566, lon: 2.3522, tz: 1 },
  { label: "London", lat: 51.5074, lon: -0.1278, tz: 0 },
  { label: "New York", lat: 40.7128, lon: -74.006, tz: -5 },
  { label: "Los Angeles", lat: 34.0522, lon: -118.2437, tz: -8 },
  { label: "Toronto", lat: 43.6532, lon: -79.3832, tz: -5 },
];

const DEFAULT_PLACE: Place = CITIES[1];

function birthMoment(p: Profile, hh: number, mm: number): Date {
  const [y, m, d] = p.birthDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, hh, mm) - p.birthUtcOffset * 3600000);
}

export function buildSnapshot(profile: Profile, now = new Date()) {
  const [by, bm, bd] = profile.birthDate.split("-").map(Number);
  const hasTime = !!profile.birthTime;
  const [bh, bmin] = hasTime ? profile.birthTime!.split(":").map(Number) : [12, 0];
  const birth = birthMoment(profile, bh, bmin);

  // --- Natal chart ---
  const natalSky = astro.positions(birth);
  const find = (k: astro.PlanetKey) => natalSky.find((p) => p.key === k)!;
  const moonStart = astro.signIndex(astro.longitude("Moon", birthMoment(profile, 0, 0)));
  const moonEnd = astro.signIndex(astro.longitude("Moon", birthMoment(profile, 23, 59)));
  const moonCertain = hasTime || moonStart === moonEnd;
  const asc = hasTime && profile.birthPlace ? astro.ascendant(birth, profile.birthPlace.lat, profile.birthPlace.lon) : null;
  const natalPoints: astro.NatalPoint[] = (["Sun", "Moon", "Mercury", "Venus", "Mars"] as const)
    .filter((k) => k !== "Moon" || moonCertain)
    .map((k) => ({ key: k, lon: find(k).lon }));
  if (asc !== null) natalPoints.push({ key: "Ascendant", lon: asc });

  // --- Sky now ---
  const sky = astro.positions(now);
  const transits = astro.transits(sky, natalPoints).slice(0, 8);
  const moon = astro.moonInfo(now);

  // --- Numerology ---
  const numbers = {
    lifePath: num.lifePath(by, bm, bd),
    expression: num.expressionNumber(profile.name),
    birthday: num.birthdayNumber(bd),
    ...num.personalCycles(bm, bd, now),
    universalDay: num.universalDay(now),
  };

  // --- Eastern ---
  const birthLunar = lunar.solarToLunar(bd, bm, by);
  const birthYear = lunar.yearCanChi(birthLunar.year);
  const todayLunar = lunar.solarToLunar(now.getDate(), now.getMonth() + 1, now.getFullYear());
  const dayPillar = lunar.dayCanChi(todayLunar);
  const monthPillar = lunar.monthCanChi(todayLunar);
  const yearPillar = lunar.yearCanChi(todayLunar.year);
  const eastern = {
    birthLunar, birthYear,
    todayLunar, dayPillar, monthPillar, yearPillar,
    dayRelation: lunar.elementRelation(birthYear.napAmElement, dayPillar.napAmElement),
    yearRelation: lunar.elementRelation(birthYear.napAmElement, yearPillar.napAmElement),
    solarTerm: lunar.solarTerm(astro.longitude("Sun", now)),
  };

  // --- Nature ---
  const place = profile.currentPlace ?? profile.birthPlace ?? DEFAULT_PLACE;
  const nature = {
    place,
    season: astro.season(now, place.lat),
    sun: astro.sunTimes(now, place.lat, place.lon),
  };

  return {
    now,
    natal: { sun: find("Sun"), moon: find("Moon"), moonCertain, asc, mercury: find("Mercury"), venus: find("Venus"), mars: find("Mars") },
    sky, transits, moon, numbers, eastern, nature,
  };
}

export type Snapshot = ReturnType<typeof buildSnapshot>;

// ---------- Text for Claude (always English; Claude replies in the user's language) ----------

const sn = (i: number) => astro.SIGNS[i].name.en;
const deg = (d: number) => `${Math.floor(d)}°`;
const numLine = (label: string, n: number | null) =>
  n === null ? "" : `- ${label}: ${n} (${num.NUMBER_MEANING[n].keyword.en}: ${num.NUMBER_MEANING[n].essence.en})`;
const fmtDate = (d: Date | null) => (d ? d.toDateString() : "unknown");

export function describeSnapshot(s: Snapshot): string {
  const e = s.eastern;
  const phase = astro.MOON_PHASES[s.moon.phaseIndex];
  const lines = [
    `## Today: ${s.now.toDateString()} (local time ${s.now.toTimeString().slice(0, 5)})`,
    "",
    "### Natal signature",
    `- Sun in ${sn(s.natal.sun.sign)} ${deg(s.natal.sun.deg)}`,
    `- Moon in ${sn(s.natal.moon.sign)}${s.natal.moonCertain ? ` ${deg(s.natal.moon.deg)}` : ""}${s.natal.moonCertain ? "" : " (uncertain: no birth time, Moon changed sign that day)"}`,
    s.natal.asc !== null ? `- Rising (Ascendant) in ${sn(astro.signIndex(s.natal.asc))}` : "- Rising sign unknown (no birth time/place)",
    `- Mercury in ${sn(s.natal.mercury.sign)}, Venus in ${sn(s.natal.venus.sign)}, Mars in ${sn(s.natal.mars.sign)}`,
    "",
    "### Sky right now",
    ...s.sky.map((p) => `- ${p.key} in ${sn(p.sign)} ${deg(p.deg)}${p.retrograde ? " (retrograde)" : ""}`),
    `- Moon phase: ${phase.name.en}, ${Math.round(s.moon.illumination * 100)}% illuminated. Next full moon ${fmtDate(s.moon.nextFull)}, next new moon ${fmtDate(s.moon.nextNew)}.`,
    "",
    "### Transits to the natal chart (strongest first)",
    ...(s.transits.length
      ? s.transits.map((t) => `- Transiting ${t.transiting} ${t.aspect.name.en} natal ${t.natal} (orb ${t.orb.toFixed(1)}°): ${t.aspect.tone.en}`)
      : ["- None within orb today."]),
    "",
    "### Numerology",
    numLine("Life Path", s.numbers.lifePath),
    numLine("Expression (from name)", s.numbers.expression),
    numLine("Birthday", s.numbers.birthday),
    `- Personal Year ${s.numbers.year}: ${num.PERSONAL_YEAR_THEME[s.numbers.year].en}`,
    numLine("Personal Month", s.numbers.month),
    numLine("Personal Day", s.numbers.day),
    numLine("Universal Day", s.numbers.universalDay),
    "",
    "### Vietnamese / Eastern calendar",
    `- Born in lunar year ${e.birthYear.name} (${e.birthYear.animal.en}), bản mệnh ${e.birthYear.napAm} → element ${e.birthYear.napAmElement} (${lunar.ELEMENT_EN[e.birthYear.napAmElement]})`,
    `- Today (âm lịch): day ${e.todayLunar.day}, month ${e.todayLunar.month}${e.todayLunar.leap ? " (leap)" : ""}, year ${e.yearPillar.name}`,
    `- Day pillar ${e.dayPillar.name} (${e.dayPillar.napAm}, ${lunar.ELEMENT_EN[e.dayPillar.napAmElement]}); month pillar ${e.monthPillar.name}; year pillar ${e.yearPillar.name} (${e.yearPillar.napAm})`,
    `- Today's element vs theirs: ${e.dayRelation.label.en}. ${e.dayRelation.meaning.en}`,
    `- This year's element vs theirs: ${e.yearRelation.label.en}.`,
    `- Solar term (tiết khí): ${e.solarTerm.vi} / ${e.solarTerm.en}`,
    "",
    "### Nature where they are",
    `- Location: ${s.nature.place.label ?? `${s.nature.place.lat.toFixed(2)}, ${s.nature.place.lon.toFixed(2)}`}; season: ${s.nature.season.en}`,
    s.nature.sun.daylightHours ? `- Daylight: ${s.nature.sun.daylightHours.toFixed(1)} hours` : "",
  ];
  return lines.filter((l) => l !== "").join("\n").replace(/\n{3,}/g, "\n\n");
}

export function describeCosmos(c: CosmosData | null): string {
  if (!c) return "";
  const out = ["### Live data from NASA & NOAA"];
  if (c.spaceWeather) {
    const w = c.spaceWeather;
    out.push(
      `- Planetary Kp index now: ${w.kpNow ?? "n/a"} (24h max ${w.kpMax24h ?? "n/a"}; 5+ = geomagnetic storm)`,
      `- Solar flares in the last 3 days: ${w.flares.length}${w.strongestFlare ? `, strongest ${w.strongestFlare}` : ""}`,
      `- Geomagnetic storms in the last 7 days: ${w.storms.length}${w.storms.length ? ` (max Kp ${Math.max(...w.storms.map((s) => s.maxKp))})` : ""}`,
      `- CMEs in the last 3 days: ${w.cmeCount}${w.earthDirectedCme ? " (at least one modeled to reach Earth)" : ""}`,
    );
  }
  if (c.asteroids) {
    const a = c.asteroids;
    out.push(`- Near-Earth asteroids passing today: ${a.count}${a.closest ? `; closest ${a.closest.name} at ${a.closest.lunarDistances.toFixed(1)} lunar distances` : ""}`);
  }
  if (c.apod) out.push(`- NASA Astronomy Picture of the Day: "${c.apod.title}" (${c.apod.explanation.slice(0, 280)}…)`);
  return out.length > 1 ? out.join("\n") : "";
}

export function describeProfile(p: Profile): string {
  return [
    "## About them",
    `- Name: ${p.name || "(not given)"}`,
    `- Born: ${p.birthDate}${p.birthTime ? ` at ${p.birthTime}` : ""} (UTC${p.birthUtcOffset >= 0 ? "+" : ""}${p.birthUtcOffset})${p.birthPlace?.label ? ` in ${p.birthPlace.label}` : ""}`,
    p.gender ? `- Gender: ${p.gender}` : "",
    `- What they're doing in life: ${p.occupation || "(not given)"}`,
    `- What they want to grow toward: ${p.goals || "(not given)"}`,
    `- What feels hard or stuck: ${p.challenges || "(not given)"}`,
    `- What matters most to them: ${p.values || "(not given)"}`,
  ].filter(Boolean).join("\n");
}

export function describeCheckin(c: CheckIn | undefined): string {
  if (!c) return "They haven't checked in today.";
  const mood = MOODS.find((m) => m.value === c.mood);
  const feelings = c.feelings.map((id) => FEELINGS.find((f) => f.id === id)?.label.en ?? id).join(", ");
  return [
    `Mood: ${mood?.label.en ?? c.mood} (${c.mood}/5). Energy: ${c.energy}/10.`,
    feelings ? `Feelings: ${feelings}.` : "",
    c.focus ? `Working on today: ${c.focus}` : "",
    c.note ? `On their mind: ${c.note}` : "",
  ].filter(Boolean).join("\n");
}

export function describeRecent(checkins: CheckIn[]): string {
  if (!checkins.length) return "";
  return [
    "### Recent check-ins (oldest → newest)",
    ...checkins.map((c) => {
      const feelings = c.feelings.map((id) => FEELINGS.find((f) => f.id === id)?.label.en ?? id).join(", ");
      return `- ${c.date}: mood ${c.mood}/5, energy ${c.energy}/10${feelings ? `, ${feelings}` : ""}${c.note ? `, "${c.note.slice(0, 140)}"` : ""}`;
    }),
  ].join("\n");
}
