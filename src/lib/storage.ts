import type { CheckIn, DiaryEntry, Meditation, Profile, Reading } from "./types";

const KEYS = { profile: "ue.profile", checkins: "ue.checkins", readings: "ue.readings", diary: "ue.diary", meditations: "ue.meditations", lang: "ue.lang" } as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the app keeps working in memory for this session.
  }
}

export const store = {
  loadProfile: () => read<Profile | null>(KEYS.profile, null),
  saveProfile: (p: Profile) => write(KEYS.profile, p),
  loadCheckins: () => read<CheckIn[]>(KEYS.checkins, []),
  saveCheckins: (c: CheckIn[]) => write(KEYS.checkins, c),
  loadReadings: () => read<Reading[]>(KEYS.readings, []),
  saveReadings: (r: Reading[]) => write(KEYS.readings, r),
  loadDiary: () => read<DiaryEntry[]>(KEYS.diary, []),
  saveDiary: (d: DiaryEntry[]) => write(KEYS.diary, d),
  loadMeditations: () => read<Meditation[]>(KEYS.meditations, []),
  saveMeditations: (m: Meditation[]) => write(KEYS.meditations, m),
  loadLang: () => read<"en" | "vi" | null>(KEYS.lang, null),
  saveLang: (l: "en" | "vi") => write(KEYS.lang, l),
  clear: () => [...Object.values(KEYS), "ue.diaryDraft"].forEach((k) => localStorage.removeItem(k)),
};

export interface Backup {
  app: "universal-explorer";
  version: 1;
  profile: Profile | null;
  checkins: CheckIn[];
  readings: Reading[];
  diary?: DiaryEntry[];
  meditations?: Meditation[];
}

export const makeBackup = (): Backup => ({
  app: "universal-explorer",
  version: 1,
  profile: store.loadProfile(),
  checkins: store.loadCheckins(),
  readings: store.loadReadings(),
  diary: store.loadDiary(),
  meditations: store.loadMeditations(),
});

export function isBackup(x: unknown): x is Backup {
  return !!x && typeof x === "object" && (x as Backup).app === "universal-explorer" && Array.isArray((x as Backup).checkins);
}

export const localDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
