// Local weather and air quality from Open-Meteo (free, no key): now, and daily history for insights.
import type { EnvDaily, EnvNow } from "../src/lib/types";

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const HISTORY = "https://historical-forecast-api.open-meteo.com/v1/forecast"; // archived forecasts, any past date
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";
const TTL = 20 * 60 * 1000;
const cache = new Map<string, { at: number; value: unknown }>();

async function getJson<T>(url: string): Promise<T> {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.value as T;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`${new URL(url).host} → HTTP ${res.status}`);
  const value = (await res.json()) as T;
  cache.set(url, { at: Date.now(), value });
  if (cache.size > 200) cache.delete(cache.keys().next().value!);
  return value;
}

const round = (n: number) => Math.round(n * 100) / 100;
const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const clean = (xs: (number | null)[]) => xs.filter((x): x is number => typeof x === "number" && !Number.isNaN(x));

interface ForecastRes {
  utc_offset_seconds: number;
  current: {
    time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; precipitation: number;
    weather_code: number; surface_pressure: number; cloud_cover: number; wind_speed_10m: number; uv_index: number; is_day: number;
  };
  hourly: { time: string[]; surface_pressure: (number | null)[]; uv_index: (number | null)[]; relative_humidity_2m?: (number | null)[]; temperature_2m?: (number | null)[]; apparent_temperature?: (number | null)[] };
  daily: {
    time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; apparent_temperature_max: number[];
    uv_index_max: number[]; precipitation_probability_max?: number[]; precipitation_sum: number[];
  };
}
interface AirRes {
  current?: { us_aqi: number; pm2_5: number; pm10: number; ozone: number; nitrogen_dioxide: number };
  hourly: { time: string[]; us_aqi: (number | null)[]; pm2_5: (number | null)[] };
}

export async function getEnvironmentNow(lat: number, lon: number): Promise<EnvNow> {
  const loc = `latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&timezone=auto`;
  const [wx, air] = await Promise.all([
    getJson<ForecastRes>(
      `${FORECAST}?${loc}&past_days=1&forecast_days=2` +
        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,cloud_cover,wind_speed_10m,uv_index,is_day" +
        "&hourly=surface_pressure,uv_index" +
        "&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,uv_index_max,precipitation_probability_max,precipitation_sum",
    ),
    getJson<AirRes>(`${AIR}?${loc}&past_days=1&forecast_days=1&current=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide&hourly=us_aqi,pm2_5`).catch(() => null),
  ]);

  // Pressure change over the last 24h (a fast drop often comes before rain and headaches).
  const nowIdx = wx.hourly.time.findIndex((t) => t >= wx.current.time.slice(0, 13) + ":00");
  const p = wx.hourly.surface_pressure;
  const pressureDelta24h = nowIdx >= 24 && p[nowIdx] != null && p[nowIdx - 24] != null ? round(p[nowIdx]! - p[nowIdx - 24]!) : null;

  // Today's hours with UV ≥ 6 (high), in local time.
  const today = wx.current.time.slice(0, 10);
  const highUv = wx.hourly.time
    .map((t, i) => ({ t, uv: wx.hourly.uv_index[i] ?? 0 }))
    .filter((h) => h.t.startsWith(today) && h.uv >= 6)
    .map((h) => h.t.slice(11, 16));
  const di = wx.daily.time.indexOf(today);

  return {
    time: wx.current.time,
    utcOffsetSeconds: wx.utc_offset_seconds,
    tempC: wx.current.temperature_2m,
    feelsLikeC: wx.current.apparent_temperature,
    humidity: wx.current.relative_humidity_2m,
    pressure: wx.current.surface_pressure,
    pressureDelta24h,
    cloudCover: wx.current.cloud_cover,
    windKmh: wx.current.wind_speed_10m,
    precipitationMm: wx.current.precipitation,
    weatherCode: wx.current.weather_code,
    isDay: wx.current.is_day === 1,
    uvNow: wx.current.uv_index,
    today: di >= 0
      ? {
          tempMax: wx.daily.temperature_2m_max[di],
          tempMin: wx.daily.temperature_2m_min[di],
          feelsLikeMax: wx.daily.apparent_temperature_max[di],
          uvMax: wx.daily.uv_index_max[di],
          rainChance: wx.daily.precipitation_probability_max?.[di] ?? null,
          rainMm: wx.daily.precipitation_sum[di],
          highUvFrom: highUv[0] ?? null,
          highUvTo: highUv.length ? highUv[highUv.length - 1] : null,
        }
      : null,
    air: air?.current
      ? { aqi: air.current.us_aqi, pm25: air.current.pm2_5, pm10: air.current.pm10, ozone: air.current.ozone, no2: air.current.nitrogen_dioxide }
      : null,
  };
}

/** Daily aggregates for [start, end] (up to ~92 days back), used to backfill insights. */
export async function getEnvironmentDaily(lat: number, lon: number, start: string, end: string): Promise<EnvDaily[]> {
  const loc = `latitude=${lat.toFixed(2)}&longitude=${lon.toFixed(2)}&timezone=auto&start_date=${start}&end_date=${end}`;
  const [wx, air] = await Promise.all([
    getJson<ForecastRes>(
      `${HISTORY}?${loc}&hourly=surface_pressure,relative_humidity_2m,uv_index` +
        "&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,uv_index_max,precipitation_sum",
    ),
    getJson<AirRes>(`${AIR}?${loc}&hourly=us_aqi,pm2_5`).catch(() => null),
  ]);
  const byDay = <T>(times: string[], values: (T | null)[] | undefined, day: string) =>
    clean((values ?? []).filter((_, i) => times[i].startsWith(day)) as (number | null)[]);

  return wx.daily.time.map((day, i) => {
    const pressures = byDay(wx.hourly.time, wx.hourly.surface_pressure, day);
    const aqi = air ? byDay(air.hourly.time, air.hourly.us_aqi, day) : [];
    const pm = air ? byDay(air.hourly.time, air.hourly.pm2_5, day) : [];
    const prevPressures = i > 0 ? byDay(wx.hourly.time, wx.hourly.surface_pressure, wx.daily.time[i - 1]) : [];
    const mean = avg(pressures);
    const prevMean = avg(prevPressures);
    return {
      date: day,
      tempMax: wx.daily.temperature_2m_max[i] ?? null,
      feelsLikeMax: wx.daily.apparent_temperature_max[i] ?? null,
      humidity: avg(byDay(wx.hourly.time, wx.hourly.relative_humidity_2m, day)),
      pressure: mean,
      pressureDelta24h: mean !== null && prevMean !== null ? round(mean - prevMean) : null,
      uvMax: wx.daily.uv_index_max[i] ?? null,
      rainMm: wx.daily.precipitation_sum[i] ?? null,
      aqi: avg(aqi),
      pm25: avg(pm),
    };
  });
}
