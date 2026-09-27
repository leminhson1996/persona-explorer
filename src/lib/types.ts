import type { Lang } from "./i18n";
import type { TarotDraw } from "./tarot";

export interface Place {
  lat: number;
  lon: number;
  label?: string;
}

export interface Profile {
  name: string;
  birthDate: string; // YYYY-MM-DD
  birthTime?: string; // HH:MM, local to birth place
  birthUtcOffset: number; // hours
  birthPlace?: Place;
  currentPlace?: Place;
  gender?: string;
  occupation: string;
  goals: string;
  challenges: string;
  values: string;
  lang: Lang;
}

export interface CheckIn {
  id: string;
  date: string; // YYYY-MM-DD local
  createdAt: string;
  mood: number; // 1-5
  energy: number; // 1-10
  feelings: string[];
  note: string;
  focus: string;
  /** Conditions at check-in time, kept so we can learn what actually affects this person. */
  env?: CheckInEnv;
}

export interface CheckInEnv {
  aqi?: number | null;
  pm25?: number | null;
  tempMax?: number | null;
  feelsLikeMax?: number | null;
  humidity?: number | null;
  pressure?: number | null;
  pressureDelta24h?: number | null;
  uvMax?: number | null;
  rainMm?: number | null;
  kp?: number | null;
  moonIllumination?: number;
  daylightHours?: number | null;
}

export interface EnvNow {
  time: string; // local ISO without zone
  utcOffsetSeconds: number;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  pressure: number;
  pressureDelta24h: number | null;
  cloudCover: number;
  windKmh: number;
  precipitationMm: number;
  weatherCode: number;
  isDay: boolean;
  uvNow: number;
  today: {
    tempMax: number; tempMin: number; feelsLikeMax: number; uvMax: number;
    rainChance: number | null; rainMm: number; highUvFrom: string | null; highUvTo: string | null;
  } | null;
  air: { aqi: number; pm25: number; pm10: number; ozone: number; no2: number } | null;
}

export interface EnvDaily {
  date: string;
  tempMax: number | null;
  feelsLikeMax: number | null;
  humidity: number | null;
  pressure: number | null;
  pressureDelta24h: number | null;
  uvMax: number | null;
  rainMm: number | null;
  aqi: number | null;
  pm25: number | null;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD local
  createdAt: string;
  updatedAt?: string;
  text: string;
}

export interface Meditation {
  id: string;
  date: string; // YYYY-MM-DD local
  createdAt: string;
  minutes: number;
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export type ReadingKind = "daily" | "chart" | "dharma" | "tarot";
/** What a reading was allowed to see: everything, the profile only, or just the birth data. */
export type ContextScope = "full" | "profile" | "birth" | "cards";

export interface Reading {
  id: string;
  date: string;
  createdAt: string;
  kind?: ReadingKind; // missing = daily
  status?: "streaming" | "done" | "interrupted";
  scope?: ContextScope; // missing = full
  tarot?: TarotDraw; // the question and cards, for tarot readings // "streaming" left over after a reload means it was cut off
  /** Full API conversation; messages[0] is the auto-generated request and isn't shown. */
  messages: ChatMsg[];
}

/** Live data from NASA (and NOAA for the Kp index), fetched by our server. */
export interface CosmosData {
  date: string;
  apod: {
    title: string;
    explanation: string;
    url: string;
    hdurl?: string;
    mediaType: string;
    copyright?: string;
  } | null;
  spaceWeather: {
    flares: { classType: string; peakTime: string }[];
    strongestFlare: string | null;
    storms: { startTime: string; maxKp: number }[];
    cmeCount: number;
    earthDirectedCme: boolean;
    kpNow: number | null;
    kpMax24h: number | null;
    partial?: boolean; // some DONKI feeds unavailable
    kpForecast?: { date: string; max: number }[]; // NOAA 3-day outlook
    solarWindKms?: number | null;
  } | null;
  asteroids: {
    count: number;
    hazardous: number;
    closest: { name: string; lunarDistances: number; diameterM: number; url: string } | null;
  } | null;
  errors: string[];
  rateLimited?: boolean; // NASA refused (429); we back off for an hour
  usingDemoKey?: boolean;
  staleSince?: string | null; // oldest cached value shown, when fresh data wasn't available
}
