// App-level Claude conversations, one per kind. Streams live here (not in a component),
// so switching tabs never interrupts a reading. Progress is saved while it streams.
import { useSyncExternalStore } from "react";
import { uid } from "./storage";
import type { ChatMsg, ContextScope, Reading, ReadingKind } from "./types";
import type { TarotDraw } from "./tarot";
import type { PhysioRecord } from "./physiognomy";
import type { RippleGraph } from "./ripple";

export interface Session {
  kind: ReadingKind;
  scope: string; // day key for daily/dharma, "chart" for charts; a new scope starts a new conversation
  readingId: string;
  createdAt: string;
  date: string;
  messages: ChatMsg[];
  pending: string | null; // text streaming right now, null when idle
  error: string | null;
  retry: string | null; // a follow-up that got no answer, to put back in the input box
  contextScope: ContextScope; // fixed for the whole conversation, so follow-ups see the same context
  tarot?: TarotDraw;
  physio?: PhysioRecord;
  ripple?: RippleGraph;
}

type State = Partial<Record<ReadingKind, Session>>;

let state: State = {};
const controllers = new Map<ReadingKind, AbortController>();
const listeners = new Set<() => void>();
let saver: (r: Reading) => void = () => {};

function update(kind: ReadingKind, patch: Partial<Session>) {
  const current = state[kind];
  if (!current) return;
  state = { ...state, [kind]: { ...current, ...patch } };
  listeners.forEach((l) => l());
}

// Photos are stripped before anything is written to my_data; only the count is kept.
const stripImages = (messages: ChatMsg[]): ChatMsg[] =>
  messages.map(({ images, ...m }) => (images?.length ? { ...m, imageCount: images.length } : m));

function persist(s: Session, messages: ChatMsg[], status: Reading["status"]) {
  saver({ id: s.readingId, date: s.date, createdAt: s.createdAt, kind: s.kind, messages: stripImages(messages), status, ...(s.contextScope !== "full" ? { scope: s.contextScope } : {}), ...(s.tarot ? { tarot: s.tarot } : {}), ...(s.physio ? { physio: s.physio } : {}), ...(s.ripple ? { ripple: s.ripple } : {}) });
}

export const guide = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  get: () => state,

  /** Register how finished (and in-progress) readings are saved. */
  setSaver(fn: (r: Reading) => void) {
    saver = fn;
  },

  /** Make sure a session exists for this kind and scope, resuming the saved reading if there is one. */
  ensure(kind: ReadingKind, scope: string, date: string, saved?: Reading) {
    const s = state[kind];
    if (s && (s.scope === scope || s.pending !== null)) return;
    state = {
      ...state,
      [kind]: {
        kind, scope, date,
        readingId: saved?.id ?? uid(),
        createdAt: saved?.createdAt ?? new Date().toISOString(),
        messages: saved?.messages ?? [],
        pending: null,
        error: null,
        retry: null,
        contextScope: saved?.scope ?? "full",
        tarot: saved?.tarot,
        physio: saved?.physio,
        ripple: saved?.ripple,
      },
    };
    listeners.forEach((l) => l());
  },

  /** Start a brand-new conversation (e.g. "Read again"). */
  restart(kind: ReadingKind, date: string, scope: ContextScope = "full", tarot?: TarotDraw, physio?: PhysioRecord) {
    const s = state[kind];
    if (!s || s.pending !== null) return;
    update(kind, { readingId: uid(), createdAt: new Date().toISOString(), date, messages: [], error: null, contextScope: scope, tarot, physio, ripple: undefined });
  },

  /**
   * The causal map parsed out of a ripple answer, kept beside the conversation so notes added to it
   * later survive. While the answer is still streaming the stream's own save picks it up.
   */
  setRipple(kind: ReadingKind, ripple: RippleGraph) {
    const s = state[kind];
    if (!s) return;
    update(kind, { ripple });
    // Nothing to persist until the conversation exists; while streaming, the stream's own save takes it.
    if (s.pending === null && s.messages.length) persist({ ...s, ripple }, s.messages, "done");
  },

  clearRetry(kind: ReadingKind) {
    update(kind, { retry: null });
  },

  stop(kind: ReadingKind) {
    controllers.get(kind)?.abort();
  },

  async send(kind: ReadingKind, history: ChatMsg[], body: { lang: string; context: string }) {
    const s0 = state[kind];
    if (!s0 || s0.pending !== null) return;
    const ctrl = new AbortController();
    controllers.set(kind, ctrl);
    update(kind, { messages: history, pending: "", error: null, retry: null });

    let text = "";
    let lastSave = 0;
    let failed = false;
    try {
      const res = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, messages: history }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error ?? `HTTP ${res.status}`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        update(kind, { pending: text });
        // Save progress every ~2s so a page reload never loses what was written.
        if (Date.now() - lastSave > 2000) {
          lastSave = Date.now();
          persist(state[kind]!, [...history, { role: "assistant", content: text }], "streaming");
        }
      }
    } catch (err) {
      failed = true;
      if ((err as Error).name !== "AbortError") update(kind, { error: (err as Error).message });
    } finally {
      controllers.delete(kind);
      const s = state[kind]!;
      if (text.trim()) {
        const messages = [...history, { role: "assistant" as const, content: text }];
        update(kind, { messages, pending: null });
        persist(s, messages, failed ? "interrupted" : "done");
      } else {
        // Nothing came back: roll back the unanswered question so it can be retried.
        update(kind, {
          messages: history.slice(0, -1),
          pending: null,
          retry: history.length > 1 ? history[history.length - 1].content : null,
        });
      }
    }
  },
};

export function useGuide(kind: ReadingKind): Session | undefined {
  return useSyncExternalStore(guide.subscribe, () => guide.get()[kind]);
}

/** Kinds currently streaming. Re-renders only when that set changes, not on every chunk. */
export function useStreamingKinds(): ReadingKind[] {
  const key = useSyncExternalStore(guide.subscribe, () =>
    (Object.values(guide.get()) as Session[]).filter((x) => x.pending !== null).map((x) => x.kind).sort().join(","),
  );
  return key ? (key.split(",") as ReadingKind[]) : [];
}

/** All sessions (re-renders on every chunk; use only where live text is shown). */
export const useSessions = () => useSyncExternalStore(guide.subscribe, guide.get);
