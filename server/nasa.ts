// Live cosmic data from NASA's open APIs (api.nasa.gov) and NOAA SWPC (Kp index).
// DEMO_KEY is limited to ~10 requests/hour/IP, so every source is cached on disk (.cache/nasa.json),
// stale data is served when NASA refuses, and we stop calling NASA while rate limited.
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { CosmosData } from "../src/lib/types";

const NASA = "https://api.nasa.gov";
const KEY = () => process.env.NASA_API_KEY || "DEMO_KEY";
const CACHE_FILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.cache/nasa.json");

const HOUR = 3600 * 1000;
const TTL = { apod: 12 * HOUR, flares: HOUR, storms: 3 * HOUR, cmes: HOUR, neo: 12 * HOUR, kp: 0.5 * HOUR, kpForecast: 3 * HOUR, wind: 0.5 * HOUR };
type Source = keyof typeof TTL;

interface Entry { at: number; value: unknown }
interface CacheFile { entries: Record<string, Entry>; blockedUntil: number; blockedKey?: string }

let cache: CacheFile | null = null;
let saveTimer: NodeJS.Timeout | null = null;

async function loadCache(): Promise<CacheFile> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(CACHE_FILE, "utf8")) as CacheFile;
  } catch {
    cache = { entries: {}, blockedUntil: 0 };
  }
  return cache;
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(async () => {
    saveTimer = null;
    try {
      await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
      // Keep only the last ~10 days of entries.
      const cutoff = Date.now() - 10 * 24 * HOUR;
      for (const [k, e] of Object.entries(cache!.entries)) if (e.at < cutoff) delete cache!.entries[k];
      await fs.writeFile(CACHE_FILE, JSON.stringify(cache), "utf8");
    } catch (err) {
      console.error("[nasa] couldn't write cache", err);
    }
  }, 500);
}

class RateLimited extends Error {}

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysBefore = (date: string, n: number) => isoDay(new Date(Date.parse(date) - n * 86400000));

async function getJson<T>(url: string): Promise<T> {
  const isNasa = url.startsWith(NASA);
  // A rate limit applies to the key that hit it; switching keys lifts the pause.
  if (isNasa && cache!.blockedUntil > Date.now() && cache!.blockedKey === KEY()) throw new RateLimited("rate limited");
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (res.status === 429 && isNasa) {
    // DEMO_KEY windows are rolling hours; back off for an hour (a real key rarely hits this).
    cache!.blockedUntil = Date.now() + HOUR;
    cache!.blockedKey = KEY();
    scheduleSave();
    throw new RateLimited("rate limited");
  }
  if (!res.ok) throw new Error(`${new URL(url).pathname} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

/** Fresh if cached within TTL; otherwise fetch; on failure fall back to any cached copy. */
async function cached<T>(source: Source, key: string, fetcher: () => Promise<T>): Promise<{ value: T; at: number; stale: boolean }> {
  const id = `${source}:${key}`;
  const hit = cache!.entries[id];
  if (hit && Date.now() - hit.at < TTL[source]) return { value: hit.value as T, at: hit.at, stale: false };
  try {
    const value = await fetcher();
    cache!.entries[id] = { at: Date.now(), value };
    scheduleSave();
    return { value, at: Date.now(), stale: false };
  } catch (err) {
    if (hit) return { value: hit.value as T, at: hit.at, stale: true };
    throw err;
  }
}

interface ApodRes { title: string; explanation: string; url: string; hdurl?: string; media_type: string; copyright?: string }
interface FlareRes { classType: string; peakTime: string }
interface StormRes { startTime: string; allKpIndex?: { kpIndex: number }[] }
interface CmeRes { cmeAnalyses?: { enlilList?: { isEarthGB?: boolean; estimatedShockArrivalTime?: string | null }[] | null }[] | null }
interface NeoRes {
  near_earth_objects: Record<string, {
    name: string;
    nasa_jpl_url: string;
    is_potentially_hazardous_asteroid: boolean;
    estimated_diameter: { meters: { estimated_diameter_min: number; estimated_diameter_max: number } };
    close_approach_data: { miss_distance: { lunar: string } }[];
  }[]>;
}
interface KpRow { time_tag: string; Kp: number }
interface KpForecastRow { time_tag: string; kp: number; observed: string }
interface WindRow { proton_speed: number }

// Flare classes sort by letter (A<B<C<M<X) then magnitude.
const flareScore = (c: string) => "ABCMX".indexOf(c[0]) * 100 + parseFloat(c.slice(1) || "0");

export async function getCosmos(date: string): Promise<CosmosData> {
  await loadCache();
  const errors: string[] = [];
  let rateLimited = false;
  let oldest = Infinity;
  const settle = async <T>(label: string, p: Promise<{ value: T; at: number; stale: boolean }>): Promise<T | null> => {
    try {
      const r = await p;
      if (r.stale) oldest = Math.min(oldest, r.at);
      return r.value;
    } catch (err) {
      if (err instanceof RateLimited) rateLimited = true;
      else errors.push(`${label}: ${(err as Error).message}`);
      return null;
    }
  };

  const [apodRes, flares, storms, cmes, kp, neo, kpFc, wind] = await Promise.all([
    // APOD publishes on US Eastern time, so early in the day in Asia "today" may not exist yet.
    settle("APOD", cached("apod", date, () =>
      getJson<ApodRes>(`${NASA}/planetary/apod?date=${date}&api_key=${KEY()}`).catch((err) => {
        if (err instanceof RateLimited) throw err;
        return getJson<ApodRes>(`${NASA}/planetary/apod?date=${daysBefore(date, 1)}&api_key=${KEY()}`);
      }))),
    settle("Solar flares", cached("flares", date, () => getJson<FlareRes[]>(`${NASA}/DONKI/FLR?startDate=${daysBefore(date, 3)}&endDate=${date}&api_key=${KEY()}`))),
    settle("Geomagnetic storms", cached("storms", date, () => getJson<StormRes[]>(`${NASA}/DONKI/GST?startDate=${daysBefore(date, 7)}&endDate=${date}&api_key=${KEY()}`))),
    settle("CMEs", cached("cmes", date, () => getJson<CmeRes[]>(`${NASA}/DONKI/CME?startDate=${daysBefore(date, 3)}&endDate=${date}&api_key=${KEY()}`))),
    settle("Kp index", cached("kp", "latest", () => getJson<KpRow[]>("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json"))),
    settle("Asteroids", cached("neo", date, () => getJson<NeoRes>(`${NASA}/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${KEY()}`))),
    settle("Kp forecast", cached("kpForecast", "latest", () => getJson<KpForecastRow[]>("https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json"))),
    settle("Solar wind", cached("wind", "latest", () => getJson<WindRow[]>("https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json"))),
  ]);

  // NOAA's 3-day outlook: max predicted Kp per UTC day.
  const forecastByDay = new Map<string, number>();
  for (const r of kpFc ?? []) {
    if (r.observed !== "predicted") continue;
    const day = r.time_tag.slice(0, 10);
    forecastByDay.set(day, Math.max(forecastByDay.get(day) ?? 0, Number(r.kp)));
  }
  const kpForecast = [...forecastByDay].slice(0, 3).map(([d, max]) => ({ date: d, max }));

  const apod: CosmosData["apod"] = apodRes
    ? { title: apodRes.title, explanation: apodRes.explanation, url: apodRes.url, hdurl: apodRes.hdurl, mediaType: apodRes.media_type, copyright: apodRes.copyright?.trim() }
    : null;

  let spaceWeather: CosmosData["spaceWeather"] = null;
  if (flares || storms || cmes || kp || kpForecast.length) {
    const recentKp = (kp ?? []).slice(-8).map((r) => Number(r.Kp)).filter((n) => !Number.isNaN(n));
    spaceWeather = {
      flares: (flares ?? []).map((f) => ({ classType: f.classType, peakTime: f.peakTime })),
      strongestFlare: (flares ?? []).reduce<string | null>((best, f) => (!best || flareScore(f.classType) > flareScore(best) ? f.classType : best), null),
      storms: (storms ?? []).map((s) => ({ startTime: s.startTime, maxKp: Math.max(0, ...(s.allKpIndex ?? []).map((k) => k.kpIndex)) })),
      cmeCount: cmes?.length ?? 0,
      earthDirectedCme: (cmes ?? []).some((c) => c.cmeAnalyses?.some((a) => a.enlilList?.some((e) => e.isEarthGB || e.estimatedShockArrivalTime))),
      kpNow: recentKp.length ? recentKp[recentKp.length - 1] : null,
      kpMax24h: recentKp.length ? Math.max(...recentKp) : null,
      partial: !flares || !storms || !cmes,
      kpForecast,
      solarWindKms: wind?.[0]?.proton_speed ?? null,
    };
  }

  let asteroids: CosmosData["asteroids"] = null;
  if (neo) {
    const list = Object.values(neo.near_earth_objects).flat();
    const withDist = list
      .map((o) => ({ o, lunar: parseFloat(o.close_approach_data[0]?.miss_distance.lunar ?? "Infinity") }))
      .sort((a, b) => a.lunar - b.lunar);
    const c = withDist[0];
    asteroids = {
      count: list.length,
      hazardous: list.filter((o) => o.is_potentially_hazardous_asteroid).length,
      closest: c
        ? {
            name: c.o.name.replace(/[()]/g, "").trim(),
            lunarDistances: c.lunar,
            diameterM: Math.round((c.o.estimated_diameter.meters.estimated_diameter_min + c.o.estimated_diameter.meters.estimated_diameter_max) / 2),
            url: c.o.nasa_jpl_url,
          }
        : null,
    };
  }

  return {
    date, apod, spaceWeather, asteroids, errors,
    rateLimited,
    usingDemoKey: !process.env.NASA_API_KEY,
    staleSince: Number.isFinite(oldest) ? new Date(oldest).toISOString() : null,
  };
}
