import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getCosmos } from "./nasa";
import { buildSystemPrompt } from "./prompt";
import { ClaudeError, describeBackend, streamClaude, type ChatTurn } from "./claude";
import { DATA_DIR, clearAll, isDataKey, readAll, writeKey } from "./data";
import { getEnvironmentDaily, getEnvironmentNow } from "./environment";

const app = express();
app.use(express.json({ limit: "20mb" }));

// ---------- Personal data in ./my_data ----------

app.get("/api/data", async (_req, res) => {
  res.json(await readAll());
});

app.put("/api/data/:key", async (req, res) => {
  const { key } = req.params;
  const { value, updatedAt } = (req.body ?? {}) as { value?: unknown; updatedAt?: number };
  if (!isDataKey(key) || value === undefined) {
    res.status(400).json({ error: "Unknown key or missing value" });
    return;
  }
  try {
    await writeKey(key, value, typeof updatedAt === "number" ? updatedAt : Date.now());
    res.json({ ok: true });
  } catch (err) {
    console.error("[data]", err);
    res.status(500).json({ error: "Couldn't write to my_data" });
  }
});

app.delete("/api/data", async (_req, res) => {
  await clearAll();
  res.json({ ok: true });
});

// ---------- Local weather & air (Open-Meteo) ----------

const coords = (q: Record<string, unknown>) => {
  const lat = Number(q.lat);
  const lon = Number(q.lon);
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 ? { lat, lon } : null;
};

app.get("/api/environment", async (req, res) => {
  const c = coords(req.query);
  if (!c) return void res.status(400).json({ error: "lat & lon required" });
  try {
    res.json(await getEnvironmentNow(c.lat, c.lon));
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get("/api/environment/daily", async (req, res) => {
  const c = coords(req.query);
  const { start, end } = req.query as { start?: string; end?: string };
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!c || !start || !end || !iso.test(start) || !iso.test(end)) return void res.status(400).json({ error: "lat, lon, start, end required" });
  try {
    res.json(await getEnvironmentDaily(c.lat, c.lon, start, end));
  } catch (err) {
    res.status(502).json({ error: (err as Error).message });
  }
});

app.get("/api/cosmos", async (req, res) => {
  const date = String(req.query.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    res.status(400).json({ error: "date must be YYYY-MM-DD" });
    return;
  }
  res.json(await getCosmos(date));
});

interface GuideBody {
  lang: "en" | "vi";
  context: string; // profile + snapshot + NASA data, rendered client-side
  messages: ChatTurn[];
}

app.post("/api/guide", async (req, res) => {
  const body = req.body as GuideBody;
  const valid =
    body && typeof body.context === "string" && Array.isArray(body.messages) && body.messages.length > 0 &&
    body.messages.every((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length > 0) &&
    body.messages[body.messages.length - 1].role === "user";
  if (!valid) {
    res.status(400).json({ error: "Invalid request" });
    return;
  }

  const abort = new AbortController();
  res.on("close", () => {
    if (!res.writableEnded) abort.abort();
  });

  try {
    const system = buildSystemPrompt(body.lang === "vi" ? "vi" : "en", body.context);
    for await (const text of streamClaude(system, body.messages, abort.signal)) {
      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("X-Accel-Buffering", "no");
      }
      res.write(text);
    }
    res.end();
  } catch (err) {
    if (abort.signal.aborted || res.destroyed) return;
    const message = err instanceof Error ? err.message : "Unexpected error talking to Claude.";
    const status = err instanceof ClaudeError ? err.status : 500;
    console.error("[guide]", err);
    if (!res.headersSent) res.status(status).json({ error: message });
    else res.end(`\n\n⚠️ ${message}`);
  }
});

// In production, serve the built frontend from the same server.
if (process.env.NODE_ENV === "production") {
  const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
  app.use(express.static(dist));
  app.use((_req, res) => res.sendFile(path.join(dist, "index.html")));
}

const port = Number(process.env.PORT) || 8787;
// Localhost only by default: this server hands out your diary to whoever can reach it.
const host = process.env.HOST || "127.0.0.1";
app.listen(port, host, () => console.log(`✦ Universal Explorer API on http://${host}:${port} (${describeBackend()})\n  Data folder: ${DATA_DIR}`));
