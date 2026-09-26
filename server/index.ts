import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { getCosmos } from "./nasa";
import { buildSystemPrompt } from "./prompt";
import { ClaudeError, describeBackend, streamClaude, type ChatTurn } from "./claude";

const app = express();
app.use(express.json({ limit: "1mb" }));

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
app.listen(port, () => console.log(`✦ Universal Explorer API on http://localhost:${port} (${describeBackend()})`));
