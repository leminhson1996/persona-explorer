import type { Lang } from "./i18n";

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
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD local
  createdAt: string;
  updatedAt?: string;
  text: string;
}

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface Reading {
  id: string;
  date: string;
  createdAt: string;
  kind?: "daily" | "chart"; // missing = daily
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
  } | null;
  asteroids: {
    count: number;
    hazardous: number;
    closest: { name: string; lunarDistances: number; diameterM: number; url: string } | null;
  } | null;
  errors: string[];
}
