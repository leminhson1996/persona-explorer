// Two ways to reach Claude, behind one streaming interface:
//  - "cli": your local Claude Code login (`claude -p`), no API key needed. Default.
//  - "api": the Anthropic SDK, used automatically when ANTHROPIC_API_KEY is set.
import { spawn } from "node:child_process";
import os from "node:os";
import readline from "node:readline";
import Anthropic from "@anthropic-ai/sdk";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export type Backend = "cli" | "api";

export const BACKEND: Backend =
  (process.env.CLAUDE_BACKEND as Backend) || (process.env.ANTHROPIC_API_KEY ? "api" : "cli");
const EFFORT = (process.env.CLAUDE_EFFORT || "medium") as "low" | "medium" | "high" | "xhigh" | "max";
export const MODEL = process.env.CLAUDE_MODEL || (BACKEND === "cli" ? "opus" : "claude-opus-5");
export const describeBackend = () => `${BACKEND} backend, model ${MODEL}, effort ${EFFORT}`;

export class ClaudeError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
  }
}

export function streamClaude(system: string, messages: ChatTurn[], signal: AbortSignal): AsyncGenerator<string> {
  return BACKEND === "api" ? streamApi(system, messages, signal) : streamCli(system, messages, signal);
}

// ---------- Claude Code CLI (uses your logged-in session) ----------

/** `claude -p` is single-turn, so earlier turns are replayed as a transcript. */
function transcript(messages: ChatTurn[]): string {
  if (messages.length === 1) return messages[0].content;
  const earlier = messages.slice(0, -1).map((m) => `[${m.role === "user" ? "Person" : "Guide (you)"}]\n${m.content}`);
  return `Conversation so far:\n\n${earlier.join("\n\n")}\n\n---\nReply to the person's latest message:\n\n${messages[messages.length - 1].content}`;
}

async function* streamCli(system: string, messages: ChatTurn[], signal: AbortSignal): AsyncGenerator<string> {
  const args = [
    "-p",
    "--output-format", "stream-json",
    "--verbose",
    "--include-partial-messages",
    "--system-prompt", system,
    "--tools", "",
    "--no-session-persistence",
    "--setting-sources", "",
    "--strict-mcp-config",
    "--model", MODEL,
    "--effort", EFFORT,
  ];
  // Run outside the project so no CLAUDE.md or project settings leak into the guide.
  const child = spawn(process.env.CLAUDE_BIN || "claude", args, { cwd: os.tmpdir(), stdio: ["pipe", "pipe", "pipe"] });
  const kill = () => child.kill("SIGTERM");
  signal.addEventListener("abort", kill, { once: true });

  let stderr = "";
  child.stderr.on("data", (d) => (stderr += d));
  const exited = new Promise<number | null>((resolve, reject) => {
    child.on("error", (err) =>
      reject(new ClaudeError(
        (err as NodeJS.ErrnoException).code === "ENOENT"
          ? "Couldn't find the `claude` command. Install Claude Code and log in, or set CLAUDE_BIN to its path."
          : err.message,
      )));
    child.on("close", resolve);
  });
  child.stdin.end(transcript(messages));

  let resultError: string | null = null;
  try {
    for await (const line of readline.createInterface({ input: child.stdout })) {
      if (!line.trim()) continue;
      let event: any;
      try {
        event = JSON.parse(line);
      } catch {
        continue;
      }
      if (event.type === "stream_event" && event.event?.type === "content_block_delta" && event.event.delta?.type === "text_delta") {
        yield event.event.delta.text as string;
      } else if (event.type === "result" && (event.is_error || event.subtype !== "success")) {
        resultError = typeof event.result === "string" && event.result ? event.result : `Claude Code returned ${event.subtype}`;
      }
    }
    const code = await exited;
    if (signal.aborted) return;
    if (resultError) throw new ClaudeError(resultError, 502);
    if (code !== 0) {
      const hint = /log ?in|auth|credential/i.test(stderr) ? " Run `claude` in a terminal and log in first." : "";
      throw new ClaudeError(`Claude Code exited with code ${code}. ${stderr.trim().slice(0, 400)}${hint}`, 502);
    }
  } finally {
    signal.removeEventListener("abort", kill);
    if (child.exitCode === null) kill();
  }
}

// ---------- Anthropic API (when ANTHROPIC_API_KEY is set) ----------

let client: Anthropic | null = null;

async function* streamApi(system: string, messages: ChatTurn[], signal: AbortSignal): AsyncGenerator<string> {
  client ??= new Anthropic();
  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 64000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      thinking: { type: "adaptive" },
      output_config: { effort: EFFORT },
      system,
      messages,
    },
    { signal },
  );
  try {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") yield event.delta.text;
    }
    const final = await stream.finalMessage();
    if (final.stop_reason === "refusal") throw new ClaudeError("Claude declined to complete this reading. Try rephrasing.", 422);
  } catch (err) {
    if (signal.aborted || err instanceof ClaudeError) throw err;
    if (err instanceof Anthropic.AuthenticationError) throw new ClaudeError("ANTHROPIC_API_KEY is invalid. Fix it in .env, or remove it to use your Claude Code login.", 401);
    if (err instanceof Anthropic.RateLimitError) throw new ClaudeError("Rate limited by the Claude API. Wait a moment and try again.", 429);
    if (err instanceof Anthropic.APIError) throw new ClaudeError(`Claude API error ${err.status ?? ""}: ${err.message}`, err.status ?? 502);
    throw err;
  }
}
