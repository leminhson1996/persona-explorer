// Personal data stored as JSON files in ./my_data (gitignored).
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const DATA_DIR = path.resolve(
  process.env.DATA_DIR || path.join(path.dirname(fileURLToPath(import.meta.url)), "../my_data"),
);

export const DATA_KEYS = ["profile", "checkins", "readings", "diary", "meditations", "settings"] as const;
export type DataKey = (typeof DATA_KEYS)[number];

export const isDataKey = (k: string): k is DataKey => (DATA_KEYS as readonly string[]).includes(k);
const file = (key: DataKey) => path.join(DATA_DIR, `${key}.json`);

export async function readAll() {
  const data: Partial<Record<DataKey, unknown>> = {};
  const updated: Partial<Record<DataKey, number>> = {};
  await Promise.all(
    DATA_KEYS.map(async (key) => {
      try {
        const [raw, stat] = await Promise.all([fs.readFile(file(key), "utf8"), fs.stat(file(key))]);
        const parsed = JSON.parse(raw) as { updatedAt?: number; value: unknown };
        data[key] = parsed.value;
        updated[key] = parsed.updatedAt ?? stat.mtimeMs;
      } catch {
        // missing or unreadable file: treat as no data
      }
    }),
  );
  return { data, updated };
}

// Writes are serialized per key and atomic (temp file + rename), so a crash never leaves half a file.
const queues = new Map<DataKey, Promise<void>>();

export function writeKey(key: DataKey, value: unknown, updatedAt: number): Promise<void> {
  const prev = queues.get(key) ?? Promise.resolve();
  const next = prev.then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${file(key)}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify({ updatedAt, value }, null, 2), "utf8");
    await fs.rename(tmp, file(key));
  });
  queues.set(key, next.catch(() => undefined));
  return next;
}

export async function clearAll() {
  await Promise.all(DATA_KEYS.map((key) => fs.rm(file(key), { force: true })));
}
