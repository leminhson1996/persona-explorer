import type { CheckIn, DiaryEntry, Meditation, Profile, Reading } from "./types";
import { emptyQuoteState, type QuoteState } from "./buddhaQuotes";

// Source of truth: JSON files in ./my_data on our server. The browser keeps a cache in localStorage
// so the app still works (and later catches up) if the server is down.

const KEYS = { profile: "ue.profile", checkins: "ue.checkins", readings: "ue.readings", diary: "ue.diary", meditations: "ue.meditations", quotes: "ue.quotes", lang: "ue.lang" } as const;
type LocalKey = keyof typeof KEYS;
const SERVER_KEY: Record<LocalKey, string> = { profile: "profile", checkins: "checkins", readings: "readings", diary: "diary", meditations: "meditations", quotes: "quotes", lang: "settings" };
const META_KEY = "ue.meta"; // last local write time per key

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the server copy still has it.
  }
}

// ---------- Sync status ----------

export type SyncStatus = "syncing" | "saved" | "offline";
let status: SyncStatus = "syncing";
const listeners = new Set<(s: SyncStatus) => void>();
const setStatus = (s: SyncStatus) => {
  status = s;
  listeners.forEach((l) => l(s));
};
export const syncStatus = {
  get: () => status,
  subscribe: (l: (s: SyncStatus) => void) => {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
};

const dirty = new Set<LocalKey>();

const toServer = (key: LocalKey, value: unknown) => (key === "lang" ? { lang: value } : value);
const fromServer = (key: LocalKey, value: unknown) => (key === "lang" ? (value as { lang?: string } | null)?.lang ?? null : value);

async function push(key: LocalKey) {
  const meta = read<Record<string, number>>(META_KEY, {});
  const value = read<unknown>(KEYS[key], null);
  try {
    const res = await fetch(`/api/data/${SERVER_KEY[key]}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: toServer(key, value), updatedAt: meta[key] ?? Date.now() }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    dirty.delete(key);
    if (!dirty.size) setStatus("saved");
  } catch {
    dirty.add(key);
    setStatus("offline");
  }
}

function save(key: LocalKey, value: unknown) {
  writeLocal(KEYS[key], value);
  writeLocal(META_KEY, { ...read<Record<string, number>>(META_KEY, {}), [key]: Date.now() });
  void push(key);
}

/**
 * Reconcile the browser cache with ./my_data: for each key the newer copy wins.
 * Returns true when server data replaced something locally (the app should reload its state).
 */
export async function syncWithServer(): Promise<boolean> {
  setStatus("syncing");
  let res: Response;
  try {
    res = await fetch("/api/data");
    if (!res.ok) throw new Error();
  } catch {
    setStatus("offline");
    return false;
  }
  const { data, updated } = (await res.json()) as { data: Record<string, unknown>; updated: Record<string, number> };
  const meta = read<Record<string, number>>(META_KEY, {});
  let changed = false;
  const pushes: Promise<void>[] = [];
  for (const key of Object.keys(KEYS) as LocalKey[]) {
    const sk = SERVER_KEY[key];
    const hasServer = sk in data;
    const hasLocal = localStorage.getItem(KEYS[key]) !== null;
    const localTs = meta[key] ?? 0;
    if (hasServer && (!hasLocal || updated[sk] >= localTs)) {
      const value = fromServer(key, data[sk]);
      if (JSON.stringify(value) !== localStorage.getItem(KEYS[key])) {
        writeLocal(KEYS[key], value);
        changed = true;
      }
      meta[key] = updated[sk];
    } else if (hasLocal) {
      if (!meta[key]) meta[key] = Date.now();
      pushes.push(push(key)); // local is newer, or ./my_data doesn't have it yet (first run)
    }
  }
  writeLocal(META_KEY, meta);
  await Promise.all(pushes);
  if (!dirty.size) setStatus("saved");
  return changed;
}

// Retry unsaved changes every 30s while the server is unreachable.
setInterval(() => {
  if (dirty.size) void syncWithServer();
}, 30000);

export const store = {
  loadProfile: () => read<Profile | null>(KEYS.profile, null),
  saveProfile: (p: Profile) => save("profile", p),
  loadCheckins: () => read<CheckIn[]>(KEYS.checkins, []),
  saveCheckins: (c: CheckIn[]) => save("checkins", c),
  loadReadings: () => read<Reading[]>(KEYS.readings, []),
  saveReadings: (r: Reading[]) => save("readings", r),
  loadDiary: () => read<DiaryEntry[]>(KEYS.diary, []),
  saveDiary: (d: DiaryEntry[]) => save("diary", d),
  loadMeditations: () => read<Meditation[]>(KEYS.meditations, []),
  saveMeditations: (m: Meditation[]) => save("meditations", m),
  loadQuotes: () => read<QuoteState>(KEYS.quotes, emptyQuoteState()),
  saveQuotes: (q: QuoteState) => save("quotes", q),
  loadLang: () => read<"en" | "vi" | null>(KEYS.lang, null),
  saveLang: (l: "en" | "vi") => save("lang", l),
  clear: async () => {
    [...Object.values(KEYS), META_KEY, "ue.diaryDraft"].forEach((k) => localStorage.removeItem(k));
    dirty.clear();
    try {
      await fetch("/api/data", { method: "DELETE" });
    } catch {
      /* server down: files stay until the next erase */
    }
  },
};

export interface Backup {
  app: "universal-explorer";
  version: 1;
  profile: Profile | null;
  checkins: CheckIn[];
  readings: Reading[];
  diary?: DiaryEntry[];
  meditations?: Meditation[];
  quotes?: QuoteState;
}

export const makeBackup = (): Backup => ({
  app: "universal-explorer",
  version: 1,
  profile: store.loadProfile(),
  checkins: store.loadCheckins(),
  readings: store.loadReadings(),
  diary: store.loadDiary(),
  meditations: store.loadMeditations(),
  quotes: store.loadQuotes(),
});

export function isBackup(x: unknown): x is Backup {
  return !!x && typeof x === "object" && (x as Backup).app === "universal-explorer" && Array.isArray((x as Backup).checkins);
}

export const localDateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
