// Live cosmic data from NASA's open APIs (api.nasa.gov) and NOAA SWPC (Kp index).
// DEMO_KEY works but is rate limited (~30 req/hour/IP); results are cached per date.
import type { CosmosData } from "../src/lib/types";

const NASA = "https://api.nasa.gov";
const KEY = () => process.env.NASA_API_KEY || "DEMO_KEY";
const CACHE_MS = 60 * 60 * 1000;
const cache = new Map<string, { at: number; data: CosmosData }>();

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const daysBefore = (date: string, n: number) => isoDay(new Date(Date.parse(date) - n * 86400000));

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${new URL(url).pathname} → HTTP ${res.status}`);
  return (await res.json()) as T;
}

interface ApodRes { title: string; explanation: string; url: string; hdurl?: string; media_type: string; copyright?: string }
interface FlareRes { classType: string; peakTime: string }
interface StormRes { startTime: string; allKpIndex?: { kpIndex: number }[] }
interface CmeRes { cmeAnalyses?: { enlilList?: { isEarthGB?: boolean; estimatedShockArrivalTime?: string | null }[] | null }[] | null }
interface NeoRes {
  element_count: number;
  near_earth_objects: Record<string, {
    name: string;
    nasa_jpl_url: string;
    is_potentially_hazardous_asteroid: boolean;
    estimated_diameter: { meters: { estimated_diameter_min: number; estimated_diameter_max: number } };
    close_approach_data: { miss_distance: { lunar: string } }[];
  }[]>;
}
interface KpRow { time_tag: string; Kp: number }

// Flare classes sort by letter (A<B<C<M<X) then magnitude.
const flareScore = (c: string) => "ABCMX".indexOf(c[0]) * 100 + parseFloat(c.slice(1) || "0");

async function apod(date: string): Promise<CosmosData["apod"]> {
  // APOD publishes on US Eastern time, so early in the day in Asia "today" may not exist yet.
  const r = await getJson<ApodRes>(`${NASA}/planetary/apod?date=${date}&api_key=${KEY()}`)
    .catch(() => getJson<ApodRes>(`${NASA}/planetary/apod?date=${daysBefore(date, 1)}&api_key=${KEY()}`));
  return { title: r.title, explanation: r.explanation, url: r.url, hdurl: r.hdurl, mediaType: r.media_type, copyright: r.copyright?.trim() };
}

async function spaceWeather(date: string): Promise<CosmosData["spaceWeather"]> {
  const [flares, storms, cmes, kp] = await Promise.all([
    getJson<FlareRes[]>(`${NASA}/DONKI/FLR?startDate=${daysBefore(date, 3)}&endDate=${date}&api_key=${KEY()}`),
    getJson<StormRes[]>(`${NASA}/DONKI/GST?startDate=${daysBefore(date, 7)}&endDate=${date}&api_key=${KEY()}`),
    getJson<CmeRes[]>(`${NASA}/DONKI/CME?startDate=${daysBefore(date, 3)}&endDate=${date}&api_key=${KEY()}`),
    getJson<KpRow[]>("https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json").catch(() => [] as KpRow[]),
  ]);
  const strongest = flares.reduce<string | null>((best, f) => (!best || flareScore(f.classType) > flareScore(best) ? f.classType : best), null);
  const recentKp = kp.slice(-8).map((r) => Number(r.Kp)).filter((n) => !Number.isNaN(n));
  return {
    flares: flares.map((f) => ({ classType: f.classType, peakTime: f.peakTime })),
    strongestFlare: strongest,
    storms: storms.map((s) => ({ startTime: s.startTime, maxKp: Math.max(0, ...(s.allKpIndex ?? []).map((k) => k.kpIndex)) })),
    cmeCount: cmes.length,
    earthDirectedCme: cmes.some((c) => c.cmeAnalyses?.some((a) => a.enlilList?.some((e) => e.isEarthGB || e.estimatedShockArrivalTime))),
    kpNow: recentKp.length ? recentKp[recentKp.length - 1] : null,
    kpMax24h: recentKp.length ? Math.max(...recentKp) : null,
  };
}

async function asteroids(date: string): Promise<CosmosData["asteroids"]> {
  const r = await getJson<NeoRes>(`${NASA}/neo/rest/v1/feed?start_date=${date}&end_date=${date}&api_key=${KEY()}`);
  const list = Object.values(r.near_earth_objects).flat();
  const withDist = list.map((o) => ({ o, lunar: parseFloat(o.close_approach_data[0]?.miss_distance.lunar ?? "Infinity") }));
  withDist.sort((a, b) => a.lunar - b.lunar);
  const c = withDist[0];
  return {
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

export async function getCosmos(date: string): Promise<CosmosData> {
  const hit = cache.get(date);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

  const errors: string[] = [];
  const settle = async <T>(label: string, p: Promise<T>): Promise<T | null> => {
    try {
      return await p;
    } catch (err) {
      errors.push(`${label}: ${(err as Error).message}`);
      return null;
    }
  };
  const [a, w, n] = await Promise.all([
    settle("APOD", apod(date)),
    settle("Space weather", spaceWeather(date)),
    settle("Asteroids", asteroids(date)),
  ]);
  const data: CosmosData = { date, apod: a, spaceWeather: w, asteroids: n, errors };
  // Don't pin a fully failed result for an hour (e.g. a rate-limit blip).
  if (a || w || n) cache.set(date, { at: Date.now(), data });
  return data;
}
