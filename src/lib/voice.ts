// Voice acoustics measured in the browser: pitch (YIN), harmonics-to-noise ratio (autocorrelation,
// Boersma 1993), spectral centroid (FFT), speaking rate (syllable nuclei), pauses and loudness.
// Audio never leaves the device and is never stored; only these numbers are kept.
import type { Bi } from "./i18n";

export interface VoiceMetrics {
  durationSec: number;
  speechSec: number;
  pitchHz: number; // median F0
  pitchRangeSt: number; // 5th–95th percentile span, semitones
  pitchVarSt: number; // standard deviation, semitones (intonation liveliness)
  pitchStability: number; // frame-to-frame F0 perturbation, % (lower = steadier)
  loudnessDb: number; // mean level while speaking, dBFS
  dynamicRangeDb: number;
  loudnessStability: number; // frame-to-frame amplitude perturbation, %
  hnrDb: number; // harmonics-to-noise ratio (higher = clearer, less breathy/hoarse)
  brightnessHz: number; // spectral centroid while voiced
  syllablesPerSec: number; // articulation rate, excluding pauses
  pauseRatio: number; // share of time in pauses ≥ 250 ms
  pausesPerMin: number;
}

export type VoiceTone = "cung" | "thuong" | "giac" | "chuy" | "vu";

const FRAME = 0.04; // 40 ms analysis window
const HOP = 0.01; // 10 ms step
const MIN_F0 = 70;
const MAX_F0 = 500;

// ---------- Recording ----------

export async function decodeToMono(blob: Blob): Promise<{ samples: Float32Array; rate: number }> {
  const ctx = new AudioContext();
  try {
    const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
    const n = buf.length;
    const out = new Float32Array(n);
    for (let c = 0; c < buf.numberOfChannels; c++) {
      const ch = buf.getChannelData(c);
      for (let i = 0; i < n; i++) out[i] += ch[i] / buf.numberOfChannels;
    }
    return { samples: out, rate: buf.sampleRate };
  } finally {
    void ctx.close();
  }
}

/** Resample to 16 kHz (plenty for voice) by linear interpolation, to keep the analysis fast. */
function resample(x: Float32Array, from: number, to = 16000): Float32Array {
  if (from === to) return x;
  const n = Math.floor((x.length * to) / from);
  const y = new Float32Array(n);
  const r = from / to;
  for (let i = 0; i < n; i++) {
    const t = i * r;
    const j = Math.floor(t);
    const f = t - j;
    y[i] = x[j] * (1 - f) + (x[j + 1] ?? x[j]) * f;
  }
  return y;
}

// ---------- DSP helpers ----------

const percentile = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const i = Math.min(s.length - 1, Math.max(0, (s.length - 1) * p));
  const lo = Math.floor(i);
  return s[lo] + (s[Math.ceil(i)] - s[lo]) * (i - lo);
};
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const std = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
};
const semitones = (hz: number, ref: number) => 12 * Math.log2(hz / ref);

/** YIN pitch estimate for one frame; returns [f0 Hz or 0, aperiodicity]. */
function yin(frame: Float32Array, rate: number): [number, number] {
  const maxLag = Math.floor(rate / MIN_F0);
  const minLag = Math.floor(rate / MAX_F0);
  const W = frame.length - maxLag;
  if (W <= 0) return [0, 1];
  const d = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const diff = frame[i] - frame[i + tau];
      s += diff * diff;
    }
    d[tau] = s;
  }
  // Cumulative mean normalized difference.
  let running = 0;
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += d[tau];
    cmnd[tau] = running ? (d[tau] * tau) / running : 1;
  }
  let tau = -1;
  for (let t = minLag; t <= maxLag; t++) {
    if (cmnd[t] < 0.15) {
      while (t + 1 <= maxLag && cmnd[t + 1] < cmnd[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau < 0) return [0, 1];
  // Parabolic interpolation around the minimum.
  const a = cmnd[tau - 1] ?? cmnd[tau];
  const b = cmnd[tau];
  const c = cmnd[tau + 1] ?? cmnd[tau];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return [rate / (tau + (Number.isFinite(shift) ? shift : 0)), b];
}

/** Normalized autocorrelation at the pitch period → harmonics-to-noise ratio (dB). */
function hnrAt(frame: Float32Array, lag: number): number | null {
  let r0 = 0;
  let r = 0;
  let rl = 0;
  const n = frame.length - lag;
  for (let i = 0; i < n; i++) {
    r0 += frame[i] * frame[i];
    rl += frame[i + lag] * frame[i + lag];
    r += frame[i] * frame[i + lag];
  }
  const rn = r / Math.sqrt(r0 * rl || 1);
  if (rn <= 0 || rn >= 1) return rn >= 1 ? 40 : null;
  return 10 * Math.log10(rn / (1 - rn));
}

/** In-place radix-2 FFT magnitude spectrum. */
function magnitude(frame: Float32Array): Float32Array {
  let n = 1;
  while (n < frame.length) n <<= 1;
  const re = new Float32Array(n);
  const im = new Float32Array(n);
  for (let i = 0; i < frame.length; i++) re[i] = frame[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (frame.length - 1))); // Hann
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < len / 2; k++) {
        const wr = Math.cos(ang * k);
        const wi = Math.sin(ang * k);
        const xr = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
        const xi = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
        re[i + k + len / 2] = re[i + k] - xr;
        im[i + k + len / 2] = im[i + k] - xi;
        re[i + k] += xr;
        im[i + k] += xi;
      }
    }
  }
  const mag = new Float32Array(n / 2);
  for (let i = 0; i < n / 2; i++) mag[i] = Math.hypot(re[i], im[i]);
  return mag;
}

// ---------- Analysis ----------

export function analyzeVoice(input: Float32Array, inputRate: number): VoiceMetrics | null {
  const rate = 16000;
  const x = resample(input, inputRate, rate);
  const frameLen = Math.round(FRAME * rate);
  const hop = Math.round(HOP * rate);
  const frames = Math.floor((x.length - frameLen) / hop);
  if (frames < 100) return null; // under ~1 s

  const db: number[] = [];
  const f0: number[] = [];
  const amp: number[] = [];
  for (let k = 0; k < frames; k++) {
    const fr = x.subarray(k * hop, k * hop + frameLen);
    let s = 0;
    for (let i = 0; i < fr.length; i++) s += fr[i] * fr[i];
    const rms = Math.sqrt(s / fr.length);
    amp.push(rms);
    db.push(20 * Math.log10(rms + 1e-9));
  }

  // Voice activity: frames well above the noise floor.
  const floor = percentile(db, 0.1);
  const peak = percentile(db, 0.98);
  const gate = Math.max(floor + 12, peak - 40);
  const active = db.map((v) => v > gate);

  const hnr: number[] = [];
  const centroid: number[] = [];
  for (let k = 0; k < frames; k++) {
    if (!active[k]) {
      f0.push(0);
      continue;
    }
    const fr = x.subarray(k * hop, k * hop + frameLen);
    const [hz] = yin(fr, rate);
    f0.push(hz);
    if (hz > 0) {
      const h = hnrAt(fr, Math.round(rate / hz));
      if (h !== null) hnr.push(h);
      if (k % 3 === 0) {
        const mag = magnitude(fr);
        let num = 0;
        let den = 0;
        for (let i = 0; i < mag.length; i++) {
          const f = (i * rate) / (2 * mag.length);
          num += f * mag[i];
          den += mag[i];
        }
        if (den) centroid.push(num / den);
      }
    }
  }

  const voiced = f0.filter((v) => v > 0);
  if (voiced.length < 30) return null; // not enough speech

  // Remove octave errors: keep F0 within ±1 octave of the median.
  const med = percentile(voiced, 0.5);
  const clean = voiced.filter((v) => v > med / 2 && v < med * 2);
  const st = clean.map((v) => semitones(v, med));

  // Perturbation between consecutive voiced frames (approximations of jitter & shimmer).
  const pitchPert: number[] = [];
  const ampPert: number[] = [];
  for (let k = 1; k < frames; k++) {
    if (f0[k] > 0 && f0[k - 1] > 0 && Math.abs(f0[k] / f0[k - 1] - 1) < 0.2) {
      pitchPert.push(Math.abs(f0[k] - f0[k - 1]) / ((f0[k] + f0[k - 1]) / 2));
      ampPert.push(Math.abs(amp[k] - amp[k - 1]) / ((amp[k] + amp[k - 1]) / 2 || 1));
    }
  }

  // Pauses: runs of inactive frames ≥ 250 ms between the first and last speech.
  const first = active.indexOf(true);
  const last = active.lastIndexOf(true);
  let pauseFrames = 0;
  let pauses = 0;
  let run = 0;
  for (let k = first; k <= last; k++) {
    if (!active[k]) run++;
    else {
      if (run * HOP >= 0.25) {
        pauseFrames += run;
        pauses++;
      }
      run = 0;
    }
  }
  const spanSec = (last - first + 1) * HOP;
  const speechSec = Math.max(0.1, spanSec - pauseFrames * HOP);

  // Syllable nuclei (after De Jong & Wempe 2009): intensity peaks above a threshold, separated from the
  // previous kept peak by a dip of at least 1 dB, and voiced.
  // Tuned on Vietnamese speech (syllable-timed, one syllable per word); stress-timed languages like
  // English are undercounted by roughly a third, as with the original method.
  const smooth = db;
  const activeDb = smooth.filter((_, k) => active[k]);
  const threshold = percentile(activeDb, 0.5) - 4;
  let syllables = 0;
  let lastPeak = -1;
  for (let k = 1; k < frames - 1; k++) {
    if (!(smooth[k] > smooth[k - 1] && smooth[k] >= smooth[k + 1])) continue;
    if (smooth[k] < threshold || f0[k] === 0) continue;
    if (lastPeak >= 0) {
      if ((k - lastPeak) * HOP < 0.06) continue;
      let dip = Infinity;
      for (let j = lastPeak; j <= k; j++) dip = Math.min(dip, smooth[j]);
      if (Math.min(smooth[k], smooth[lastPeak]) - dip < 1) {
        if (smooth[k] > smooth[lastPeak]) lastPeak = k; // same syllable, keep the higher peak
        continue;
      }
    }
    syllables++;
    lastPeak = k;
  }

  const speechDb = db.filter((_, k) => active[k]);
  const r = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;
  return {
    durationSec: r(x.length / rate),
    speechSec: r(speechSec),
    pitchHz: r(med, 0),
    pitchRangeSt: r(percentile(st, 0.95) - percentile(st, 0.05)),
    pitchVarSt: r(std(st)),
    pitchStability: r(mean(pitchPert) * 100, 2),
    loudnessDb: r(mean(speechDb)),
    dynamicRangeDb: r(percentile(speechDb, 0.95) - percentile(speechDb, 0.05)),
    loudnessStability: r(mean(ampPert) * 100),
    hnrDb: r(percentile(hnr, 0.5)),
    brightnessHz: r(percentile(centroid, 0.5), 0),
    syllablesPerSec: r(syllables / speechSec),
    pauseRatio: r((pauseFrames * HOP) / spanSec, 2),
    pausesPerMin: r((pauses / spanSec) * 60),
  };
}

// ---------- Ngũ âm (five tones of physiognomy) ----------

export const TONES: Record<VoiceTone, { name: Bi; element: Bi; traits: Bi }> = {
  cung: { name: { en: "Gong (宮)", vi: "Cung" }, element: { en: "Earth", vi: "Thổ" }, traits: { en: "deep, thick, steady: grounded and trustworthy", vi: "trầm, dày, vững: điềm đạm, đáng tin cậy" } },
  thuong: { name: { en: "Shang (商)", vi: "Thương" }, element: { en: "Metal", vi: "Kim" }, traits: { en: "clear, ringing, firm: decisive and principled", vi: "trong, vang, chắc: quyết đoán, có nguyên tắc" } },
  giac: { name: { en: "Jue (角)", vi: "Giốc" }, element: { en: "Wood", vi: "Mộc" }, traits: { en: "high, bright, carrying: aspiring and upright", vi: "cao, thanh, vang xa: cầu tiến, ngay thẳng" } },
  chuy: { name: { en: "Zhi (徵)", vi: "Chủy" }, element: { en: "Fire", vi: "Hỏa" }, traits: { en: "quick, sharp, lively: passionate and expressive", vi: "nhanh, sắc, sôi nổi: nhiệt huyết, giàu biểu cảm" } },
  vu: { name: { en: "Yu (羽)", vi: "Vũ" }, element: { en: "Water", vi: "Thủy" }, traits: { en: "round, flowing, soft: adaptable and intuitive", vi: "tròn, trôi chảy, mềm: linh hoạt, giàu trực giác" } },
};

/** Typical speaking pitch by gender, so "high" and "low" are relative to the right reference. */
const referencePitch = (gender: "male" | "female" | null) => (gender === "male" ? 120 : gender === "female" ? 210 : 160);

export function voiceTone(m: VoiceMetrics, gender: "male" | "female" | null) {
  const height = semitones(m.pitchHz, referencePitch(gender)); // + = higher than typical
  const clarity = (m.hnrDb - 12) / 6; // ~0 typical, + clearer
  const bright = (m.brightnessHz - 1000) / 400;
  const pace = (m.syllablesPerSec - 5) / 1.2;
  const lively = (m.pitchVarSt - 2.5) / 1.2;
  const flow = (0.18 - m.pauseRatio) / 0.1; // + fewer pauses
  const soft = (-22 - m.loudnessDb) / 6; // + quieter
  const s: Record<VoiceTone, number> = {
    cung: -height / 3 - bright - lively * 0.5 - pace * 0.4 + 1,
    thuong: clarity * 1.2 + bright * 0.6 - soft * 0.6 + 0.6,
    giac: height / 3 + lively * 0.7 + clarity * 0.4 + 0.4,
    chuy: pace * 1.1 + lively * 0.6 + bright * 0.4 - flow * 0.3 + 0.3,
    vu: flow * 0.9 + soft * 0.6 - bright * 0.3 - pace * 0.2 + 0.5,
  };
  const tone = (Object.keys(s) as VoiceTone[]).reduce((a, b) => (s[b] > s[a] ? b : a));
  const pos = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, Math.max(0, v)])) as Record<VoiceTone, number>;
  const total = Object.values(pos).reduce((a, b) => a + b, 0) || 1;
  return { tone, scores: Object.fromEntries(Object.entries(pos).map(([k, v]) => [k, Math.round((v / total) * 100)])) as Record<VoiceTone, number> };
}

// ---------- Baseline comparison (for daily voice check-ins) ----------

export function baseline(history: VoiceMetrics[]): VoiceMetrics | null {
  if (history.length < 3) return null;
  const keys = Object.keys(history[0]) as (keyof VoiceMetrics)[];
  return Object.fromEntries(keys.map((k) => [k, percentile(history.map((h) => h[k]), 0.5)])) as unknown as VoiceMetrics;
}

export interface VoiceDelta {
  key: "pitch" | "pace" | "clarity" | "loudness" | "liveliness" | "pauses";
  label: Bi;
  text: Bi;
}

/** Plain-language differences from the person's own usual voice (only meaningful changes). */
export function compareToBaseline(today: VoiceMetrics, base: VoiceMetrics): VoiceDelta[] {
  const out: VoiceDelta[] = [];
  const pitch = semitones(today.pitchHz, base.pitchHz);
  if (Math.abs(pitch) >= 1)
    out.push({ key: "pitch", label: { en: "Pitch", vi: "Cao độ" }, text: pitch > 0 ? { en: `${pitch.toFixed(1)} semitones higher than usual`, vi: `cao hơn thường ngày ${pitch.toFixed(1)} nửa cung` } : { en: `${(-pitch).toFixed(1)} semitones lower than usual`, vi: `thấp hơn thường ngày ${(-pitch).toFixed(1)} nửa cung` } });
  const pace = (today.syllablesPerSec / base.syllablesPerSec - 1) * 100;
  if (Math.abs(pace) >= 10)
    out.push({ key: "pace", label: { en: "Pace", vi: "Tốc độ" }, text: pace > 0 ? { en: `speaking ${pace.toFixed(0)}% faster`, vi: `nói nhanh hơn ${pace.toFixed(0)}%` } : { en: `speaking ${(-pace).toFixed(0)}% slower`, vi: `nói chậm hơn ${(-pace).toFixed(0)}%` } });
  const clar = today.hnrDb - base.hnrDb;
  if (Math.abs(clar) >= 2)
    out.push({ key: "clarity", label: { en: "Clarity", vi: "Độ trong" }, text: clar > 0 ? { en: "clearer, less breathy than usual", vi: "trong hơn, ít khàn hơn thường ngày" } : { en: "more breathy/hoarse than usual (tired? dry throat?)", vi: "khàn/hụt hơi hơn thường ngày (mệt? khô họng?)" } });
  const loud = today.loudnessDb - base.loudnessDb;
  if (Math.abs(loud) >= 3)
    out.push({ key: "loudness", label: { en: "Loudness", vi: "Âm lượng" }, text: loud > 0 ? { en: `${loud.toFixed(0)} dB louder`, vi: `to hơn ${loud.toFixed(0)} dB` } : { en: `${(-loud).toFixed(0)} dB softer`, vi: `nhỏ hơn ${(-loud).toFixed(0)} dB` } });
  const live = today.pitchVarSt - base.pitchVarSt;
  if (Math.abs(live) >= 0.6)
    out.push({ key: "liveliness", label: { en: "Intonation", vi: "Ngữ điệu" }, text: live > 0 ? { en: "more lively intonation", vi: "ngữ điệu sinh động hơn" } : { en: "flatter, more monotone intonation", vi: "ngữ điệu đều, phẳng hơn" } });
  const pause = today.pauseRatio - base.pauseRatio;
  if (Math.abs(pause) >= 0.06)
    out.push({ key: "pauses", label: { en: "Pauses", vi: "Ngắt nghỉ" }, text: pause > 0 ? { en: "more pauses than usual", vi: "ngắt nghỉ nhiều hơn thường ngày" } : { en: "fewer pauses, more flowing", vi: "ít ngắt nghỉ, trôi chảy hơn" } });
  return out;
}

// ---------- Text for Claude ----------

export function describeVoice(m: VoiceMetrics, gender: "male" | "female" | null): string {
  const t = voiceTone(m, gender);
  return [
    "### Voice acoustics (measured in the browser; Claude never hears the audio)",
    `- ${m.speechSec}s of speech in ${m.durationSec}s; median pitch ${m.pitchHz} Hz (typical for the stated gender ≈ ${referencePitch(gender)} Hz), range ${m.pitchRangeSt} semitones, intonation variability ${m.pitchVarSt} st`,
    `- Clarity HNR ${m.hnrDb} dB (typical healthy speech ≈ 12–20 dB); brightness (spectral centroid) ${m.brightnessHz} Hz`,
    `- Pace ${m.syllablesPerSec} syllables/s while speaking; pauses ${Math.round(m.pauseRatio * 100)}% of the time, ${m.pausesPerMin}/min`,
    `- Loudness ${m.loudnessDb} dBFS (depends on the microphone), dynamic range ${m.dynamicRangeDb} dB; steadiness: pitch ${m.pitchStability}%, loudness ${m.loudnessStability}% frame-to-frame`,
    `- Estimated Ngũ âm (five tones): ${TONES[t.tone].name.vi} / ${TONES[t.tone].element.en} (${Object.entries(t.scores).map(([k, v]) => `${TONES[k as VoiceTone].name.vi} ${v}%`).join(", ")}); a hint, weigh it with the other measurements`,
  ].join("\n");
}

export const READING_PASSAGE: Bi = {
  en: "Every morning the sun rises over the quiet river. I breathe slowly, listen to the wind in the trees, and remind myself that each day is a new chance to grow a little kinder, a little wiser, and a little braver than before.",
  vi: "Mỗi buổi sáng, mặt trời lên trên dòng sông yên ả. Mình hít thở thật chậm, lắng nghe tiếng gió trong những tán cây, và tự nhắc rằng mỗi ngày là một cơ hội mới để trở nên tử tế hơn, sáng suốt hơn và can đảm hơn một chút so với hôm qua.",
};
