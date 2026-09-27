// App-level meditation timer. It lives outside any component and is persisted, so switching tabs,
// a page reload, or closing the tab never loses a session. The screen is kept awake while sitting.
import { useSyncExternalStore } from "react";
import { localDateKey, uid } from "./storage";
import type { Meditation } from "./types";

const KEY = "ue.meditationTimer";

export interface TimerState {
  status: "idle" | "running" | "paused";
  sessionId: string | null;
  minutes: number; // chosen duration
  startedAt: number | null; // first start, epoch ms
  endAt: number | null; // while running
  remainingMs: number; // while paused/idle
  justSaved: number | null; // minutes of the last saved session, for a brief confirmation
}

const initial = (minutes = 10): TimerState => ({
  status: "idle", sessionId: null, minutes, startedAt: null, endAt: null, remainingMs: minutes * 60000, justSaved: null,
});

let state: TimerState = initial();
const listeners = new Set<() => void>();
let saver: ((m: Meditation) => void) | null = null;
const pendingSaves: Meditation[] = [];
let ticker: ReturnType<typeof setInterval> | null = null;
let now = Date.now();

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, justSaved: null }));
  } catch {
    /* storage blocked */
  }
}

function set(patch: Partial<TimerState>) {
  state = { ...state, ...patch };
  persist();
  emit();
}

function emit() {
  listeners.forEach((l) => l());
}

// ---------- Bell (WebAudio, scheduled ahead so it rings on time even in a background tab) ----------

let audio: AudioContext | null = null;
let scheduled: OscillatorNode[] = [];

function ctx(): AudioContext | null {
  try {
    audio ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

function bellAt(delaySec: number): OscillatorNode[] {
  const c = ctx();
  if (!c) return [];
  const t = c.currentTime + Math.max(0, delaySec);
  return [[392, 0.5], [784, 0.22], [1176, 0.12], [1568, 0.06]].map(([freq, gain]) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 6);
    osc.connect(g).connect(c.destination);
    osc.start(t);
    osc.stop(t + 6.1);
    return osc;
  });
}

function cancelScheduledBell() {
  scheduled.forEach((o) => {
    try {
      o.stop();
    } catch {
      /* already stopped */
    }
  });
  scheduled = [];
}

// ---------- Keep the screen awake ----------

let wakeLock: { release: () => Promise<void> } | null = null;

async function keepAwake() {
  try {
    const wl = (navigator as unknown as { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } }).wakeLock;
    if (wl && !wakeLock) wakeLock = await wl.request("screen");
  } catch {
    /* not supported or denied */
  }
}

function releaseAwake() {
  void wakeLock?.release().catch(() => {});
  wakeLock = null;
}

// The browser drops the wake lock when the tab is hidden; take it again on return.
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.status === "running") {
      wakeLock = null;
      void keepAwake();
    }
  });
}

// ---------- Saving ----------

function save(minutes: number) {
  if (!state.sessionId || minutes < 1) return;
  const m: Meditation = {
    id: state.sessionId,
    date: localDateKey(new Date(state.startedAt ?? Date.now())),
    createdAt: new Date(state.startedAt ?? Date.now()).toISOString(),
    minutes: Math.round(minutes * 10) / 10,
  };
  if (saver) saver(m);
  else pendingSaves.push(m);
}

function complete(opts: { ring: boolean }) {
  stopTicker();
  releaseAwake();
  if (!opts.ring) cancelScheduledBell();
  else if (!scheduled.length) bellAt(0); // e.g. restored after a reload: nothing was scheduled
  const minutes = state.minutes;
  save(minutes);
  scheduled = [];
  state = { ...initial(minutes), justSaved: minutes };
  persist();
  emit();
}

function startTicker() {
  if (ticker) return;
  ticker = setInterval(() => {
    now = Date.now();
    if (state.status === "running" && state.endAt !== null && now >= state.endAt) complete({ ring: true });
    else emit();
  }, 500);
}

function stopTicker() {
  if (ticker) clearInterval(ticker);
  ticker = null;
}

// ---------- Public API ----------

export const meditation = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => void listeners.delete(l);
  },
  get: () => state,
  remainingMs(): number {
    if (state.status === "running" && state.endAt !== null) return Math.max(0, state.endAt - now);
    return state.remainingMs;
  },

  /** Register where finished sessions are saved (flushes sessions finished before the app was ready). */
  setSaver(fn: (m: Meditation) => void) {
    saver = fn;
    while (pendingSaves.length) fn(pendingSaves.shift()!);
  },

  /** Log a session done without the timer. */
  logManual(minutes: number, date: string) {
    if (!(minutes > 0)) return;
    const m: Meditation = { id: `manual-${uid()}`, date, createdAt: new Date(`${date}T${new Date().toTimeString().slice(0, 8)}`).toISOString(), minutes: Math.round(minutes * 10) / 10 };
    if (saver) saver(m);
    else pendingSaves.push(m);
    set({ justSaved: m.minutes });
  },

  choose(minutes: number) {
    if (state.status !== "idle") return;
    set({ minutes, remainingMs: minutes * 60000, justSaved: null });
  },

  start() {
    if (state.status === "running") return;
    const fresh = state.status === "idle";
    const remaining = fresh ? state.minutes * 60000 : state.remainingMs;
    now = Date.now();
    cancelScheduledBell();
    if (fresh) bellAt(0); // opening bell
    scheduled = bellAt(remaining / 1000); // closing bell, scheduled ahead
    set({
      status: "running",
      sessionId: fresh ? uid() : state.sessionId,
      startedAt: fresh ? now : state.startedAt,
      endAt: now + remaining,
      justSaved: null,
    });
    startTicker();
    void keepAwake();
  },

  pause() {
    if (state.status !== "running" || state.endAt === null) return;
    cancelScheduledBell();
    stopTicker();
    releaseAwake();
    set({ status: "paused", remainingMs: Math.max(0, state.endAt - Date.now()), endAt: null });
  },

  /** End now and keep the minutes actually sat (if at least one). */
  finishEarly() {
    if (state.status === "idle") return;
    cancelScheduledBell();
    stopTicker();
    releaseAwake();
    const left = meditation.remainingMs();
    const sat = (state.minutes * 60000 - left) / 60000;
    save(sat);
    const minutes = state.minutes;
    state = { ...initial(minutes), justSaved: sat >= 1 ? Math.round(sat * 10) / 10 : null };
    persist();
    emit();
  },
};

// Restore a session that was running when the page was reloaded or closed.
(function restore() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const saved = JSON.parse(raw) as TimerState;
    state = { ...initial(saved.minutes || 10), ...saved, justSaved: null };
    if (state.status === "running" && state.endAt !== null) {
      if (Date.now() >= state.endAt) complete({ ring: false }); // it finished while the page was closed
      else {
        now = Date.now();
        startTicker();
        void keepAwake();
      }
    }
  } catch {
    state = initial();
  }
})();

export const useMeditation = () => useSyncExternalStore(meditation.subscribe, meditation.get);
/** Re-renders on every tick (for the clock display). */
export const useMeditationClock = () => useSyncExternalStore(meditation.subscribe, meditation.remainingMs);
export const useMeditationRunning = () => useSyncExternalStore(meditation.subscribe, () => meditation.get().status === "running");
