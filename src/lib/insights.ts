// "What actually affects you": correlate check-ins with the conditions of each day.
import * as A from "astronomy-engine";
import type { Bi } from "./i18n";
import type { CheckIn, CheckInEnv } from "./types";

export type Outcome = "energy" | "mood";

export const FACTORS: { key: keyof CheckInEnv; label: Bi; unit: string; highLabel: Bi; lowLabel: Bi }[] = [
  { key: "aqi", label: { en: "Air pollution (AQI)", vi: "Ô nhiễm không khí (AQI)" }, unit: "", highLabel: { en: "more polluted days", vi: "ngày ô nhiễm hơn" }, lowLabel: { en: "cleaner days", vi: "ngày trong lành hơn" } },
  { key: "feelsLikeMax", label: { en: "Heat (feels-like max)", vi: "Nóng bức (nhiệt độ cảm nhận)" }, unit: "°C", highLabel: { en: "hotter days", vi: "ngày nóng hơn" }, lowLabel: { en: "cooler days", vi: "ngày mát hơn" } },
  { key: "humidity", label: { en: "Humidity", vi: "Độ ẩm" }, unit: "%", highLabel: { en: "more humid days", vi: "ngày ẩm hơn" }, lowLabel: { en: "drier days", vi: "ngày khô hơn" } },
  { key: "pressureDelta24h", label: { en: "Pressure change (24h)", vi: "Thay đổi áp suất (24h)" }, unit: " hPa", highLabel: { en: "rising-pressure days", vi: "ngày áp suất tăng" }, lowLabel: { en: "falling-pressure days", vi: "ngày áp suất giảm" } },
  { key: "rainMm", label: { en: "Rain", vi: "Lượng mưa" }, unit: " mm", highLabel: { en: "rainier days", vi: "ngày mưa nhiều" }, lowLabel: { en: "drier days", vi: "ngày ít mưa" } },
  { key: "uvMax", label: { en: "Sunshine (UV max)", vi: "Nắng (UV cao nhất)" }, unit: "", highLabel: { en: "sunnier days", vi: "ngày nắng hơn" }, lowLabel: { en: "duller days", vi: "ngày ít nắng" } },
  { key: "kp", label: { en: "Geomagnetic activity (Kp)", vi: "Hoạt động địa từ (Kp)" }, unit: "", highLabel: { en: "more active days", vi: "ngày địa từ mạnh hơn" }, lowLabel: { en: "quieter days", vi: "ngày địa từ yên tĩnh" } },
  { key: "moonIllumination", label: { en: "Moon brightness (full moon)", vi: "Độ sáng Mặt Trăng (trăng tròn)" }, unit: "", highLabel: { en: "near full moon", vi: "gần trăng tròn" }, lowLabel: { en: "near new moon", vi: "gần trăng non" } },
  { key: "daylightHours", label: { en: "Day length", vi: "Độ dài ban ngày" }, unit: " h", highLabel: { en: "longer days", vi: "ngày dài hơn" }, lowLabel: { en: "shorter days", vi: "ngày ngắn hơn" } },
];

export const MIN_DAYS = 10;

/** Moon brightness needs no API: computed for local noon of that date. */
export function moonIlluminationOn(date: string): number {
  return A.Illumination(A.Body.Moon, new Date(`${date}T12:00:00`)).phase_fraction;
}

function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    dx += (xs[i] - mx) ** 2;
    dy += (ys[i] - my) ** 2;
  }
  return dx === 0 || dy === 0 ? 0 : num / Math.sqrt(dx * dy);
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export interface Finding {
  key: keyof CheckInEnv;
  n: number;
  r: number;
  /** |r| beyond 2.5/√n: stricter than the usual 95% line (≈2/√n) because we test ~9 factors at once,
   *  which otherwise makes one chance "finding" likely. */
  reliable: boolean;
  strength: "none" | "weak" | "moderate" | "strong";
  highMean: number;
  lowMean: number;
  split: number;
}

export function analyze(checkins: CheckIn[], outcome: Outcome) {
  // One point per day: the latest check-in of each date.
  const byDate = new Map<string, CheckIn>();
  for (const c of checkins) byDate.set(c.date, c);
  const days = [...byDate.values()];

  const findings: Finding[] = [];
  for (const f of FACTORS) {
    const pairs = days
      .map((c) => {
        const x = f.key === "moonIllumination" ? c.env?.moonIllumination ?? moonIlluminationOn(c.date) : c.env?.[f.key];
        return typeof x === "number" && !Number.isNaN(x) ? { x, y: outcome === "energy" ? c.energy : c.mood } : null;
      })
      .filter((p): p is { x: number; y: number } => p !== null);
    if (pairs.length < MIN_DAYS) continue;
    const xs = pairs.map((p) => p.x);
    const ys = pairs.map((p) => p.y);
    const r = pearson(xs, ys);
    const split = median(xs);
    const high = pairs.filter((p) => p.x > split).map((p) => p.y);
    const low = pairs.filter((p) => p.x <= split).map((p) => p.y);
    if (!high.length || !low.length) continue;
    const abs = Math.abs(r);
    findings.push({
      key: f.key,
      n: pairs.length,
      r,
      reliable: abs >= 2.5 / Math.sqrt(pairs.length) && abs >= 0.2,
      strength: abs >= 0.5 ? "strong" : abs >= 0.3 ? "moderate" : abs >= 0.2 ? "weak" : "none",
      highMean: mean(high),
      lowMean: mean(low),
      split,
    });
  }
  findings.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
  return { days: days.length, findings };
}

export const STRENGTH_LABEL: Record<Finding["strength"], Bi> = {
  strong: { en: "strong", vi: "mạnh" },
  moderate: { en: "moderate", vi: "vừa" },
  weak: { en: "weak", vi: "yếu" },
  none: { en: "no clear link", vi: "không rõ liên hệ" },
};

export function describeInsights(checkins: CheckIn[]): string {
  const e = analyze(checkins, "energy");
  const m = analyze(checkins, "mood");
  if (e.days < MIN_DAYS) return `### Personal patterns\n- Only ${e.days} days of check-ins so far; at least ${MIN_DAYS} are needed before patterns mean anything.`;
  const fmtF = (f: Finding, outcome: string) => {
    const label = FACTORS.find((x) => x.key === f.key)!;
    return `${label.label.en}: r=${f.r.toFixed(2)} with ${outcome} (n=${f.n}; ${outcome} ${f.highMean.toFixed(1)} on ${label.highLabel.en} vs ${f.lowMean.toFixed(1)} on ${label.lowLabel.en})`;
  };
  const reliable = [...e.findings.filter((f) => f.reliable).map((f) => fmtF(f, "energy")), ...m.findings.filter((f) => f.reliable).map((f) => fmtF(f, "mood"))];
  return [
    `### Personal patterns from ${e.days} days of their own check-ins (correlation, not causation)`,
    reliable.length ? reliable.map((x) => `- ${x}`).join("\n") : "- No factor shows a reliable link with their energy or mood yet.",
    "- Factors not listed show no clear link for this person; don't claim they affect them.",
  ].join("\n");
}
