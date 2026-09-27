import { useEffect, useRef, useState } from "react";
import { useT, type Bi } from "../lib/i18n";
import { READING_PASSAGE, analyzeVoice, decodeToMono, type VoiceMetrics } from "../lib/voice";

const L = {
  record: { en: "Record", vi: "Ghi âm" },
  again: { en: "Record again", vi: "Ghi lại" },
  stop: { en: "Stop", vi: "Dừng" },
  readThis: { en: "Read aloud at your normal pace:", vi: "Đọc to với tốc độ bình thường:" },
  analyzing: { en: "Analyzing your voice…", vi: "Đang phân tích giọng nói…" },
  tooShort: { en: "Too short: keep reading for at least {n} seconds.", vi: "Hơi ngắn: hãy đọc ít nhất {n} giây." },
  noSpeech: { en: "Couldn't hear enough speech. Get closer to the mic, in a quiet room.", vi: "Chưa nghe rõ giọng nói. Hãy lại gần mic, ở nơi yên tĩnh." },
  micFail: { en: "Couldn't open the microphone. Allow microphone access.", vi: "Không mở được micro. Hãy cho phép quyền micro." },
  private: { en: "Audio stays on this device and is discarded after measuring; only the numbers are kept.", vi: "Âm thanh ở lại trên máy và bị xóa ngay sau khi đo; chỉ các con số được giữ lại." },
} satisfies Record<string, Bi>;

interface Props {
  onResult: (m: VoiceMetrics) => void;
  maxSec?: number;
  minSec?: number;
  compact?: boolean;
}

export default function VoiceRecorder({ onResult, maxSec = 30, minSec = 8, compact }: Props) {
  const { tr } = useT();
  const [state, setState] = useState<"idle" | "recording" | "analyzing">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const rec = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const raf = useRef(0);
  const started = useRef(0);

  const cleanup = () => {
    cancelAnimationFrame(raf.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  };
  useEffect(() => () => {
    if (rec.current?.state === "recording") rec.current.stop();
    cleanup();
  }, []);

  const start = async () => {
    setError(null);
    setDone(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
      stream.current = s;
      // Live level meter.
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      ctx.createMediaStreamSource(s).connect(analyser);
      const buf = new Float32Array(analyser.fftSize);
      const chunks: Blob[] = [];
      const r = new MediaRecorder(s);
      rec.current = r;
      r.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      r.onstop = async () => {
        cleanup();
        void ctx.close();
        const secs = (performance.now() - started.current) / 1000;
        if (secs < minSec) {
          setState("idle");
          setError(tr(L.tooShort).replace("{n}", String(minSec)));
          return;
        }
        setState("analyzing");
        try {
          const { samples, rate } = await decodeToMono(new Blob(chunks, { type: r.mimeType }));
          const m = analyzeVoice(samples, rate);
          chunks.length = 0; // drop the audio
          if (!m || m.speechSec < minSec * 0.5) setError(tr(L.noSpeech));
          else {
            onResult(m);
            setDone(true);
          }
        } catch {
          setError(tr(L.noSpeech));
        }
        setState("idle");
      };
      r.start();
      started.current = performance.now();
      setState("recording");
      const tick = () => {
        analyser.getFloatTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
        setLevel(Math.min(1, Math.sqrt(sum / buf.length) * 6));
        const e = (performance.now() - started.current) / 1000;
        setElapsed(e);
        if (e >= maxSec) r.stop();
        else raf.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      cleanup();
      setError(tr(L.micFail));
    }
  };

  const stop = () => rec.current?.state === "recording" && rec.current.stop();

  return (
    <div className={`voice-rec ${compact ? "compact" : ""}`}>
      <p className="tiny muted">{tr(L.readThis)}</p>
      <blockquote className="passage small">{tr(READING_PASSAGE)}</blockquote>
      {state === "recording" && (
        <div className="rec-live">
          <span className="rec-dot" aria-hidden="true" />
          <span className="rec-time">{Math.floor(elapsed)}s / {maxSec}s</span>
          <span className="rec-meter"><span style={{ width: `${level * 100}%` }} /></span>
        </div>
      )}
      {state === "analyzing" && <p className="shimmer small">{tr(L.analyzing)}</p>}
      {error && <p className="error small">⚠️ {error}</p>}
      <div className="row wrap">
        {state === "recording" ? (
          <button className="primary" onClick={stop} disabled={elapsed < minSec}>■ {tr(L.stop)}{elapsed < minSec ? ` (${Math.ceil(minSec - elapsed)})` : ""}</button>
        ) : (
          <button className="ghost" onClick={() => void start()} disabled={state === "analyzing"}>🎙 {done ? tr(L.again) : tr(L.record)}</button>
        )}
      </div>
      <p className="tiny muted">🔒 {tr(L.private)}</p>
    </div>
  );
}
