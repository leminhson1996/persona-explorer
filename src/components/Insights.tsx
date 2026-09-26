import { useMemo, useState } from "react";
import { fmt, useT } from "../lib/i18n";
import { FACTORS, MIN_DAYS, STRENGTH_LABEL, analyze, type Finding, type Outcome } from "../lib/insights";
import type { CheckIn } from "../lib/types";

const L = {
  title: { en: "What actually affects you", vi: "Điều gì thật sự ảnh hưởng đến bạn" },
  intro: {
    en: "Each check-in stores the day's air, weather, Moon and geomagnetic activity. Over time this shows which ones move your energy and mood, based on your own data, not general beliefs.",
    vi: "Mỗi lần check-in lưu lại không khí, thời tiết, Mặt Trăng và địa từ của ngày hôm đó. Theo thời gian, bạn sẽ thấy yếu tố nào thật sự tác động đến năng lượng và tâm trạng của mình, dựa trên dữ liệu của chính bạn chứ không phải niềm tin chung.",
  },
  energy: { en: "Energy", vi: "Năng lượng" },
  mood: { en: "Mood", vi: "Tâm trạng" },
  progress: { en: "{n} of {min} days collected. Keep checking in daily to unlock your patterns.", vi: "Đã có {n}/{min} ngày. Tiếp tục check-in mỗi ngày để mở khóa phân tích." },
  lower: { en: "← lower when higher", vi: "← thấp hơn khi yếu tố cao" },
  higher: { en: "higher when higher →", vi: "cao hơn khi yếu tố cao →" },
  unclear: { en: "not enough evidence", vi: "chưa đủ bằng chứng" },
  caveat: {
    en: "Correlation isn't causation. Faded bars could easily be chance; only solid bars are worth acting on.",
    vi: "Tương quan không phải nhân quả. Thanh mờ có thể chỉ là ngẫu nhiên; chỉ thanh đậm mới đáng để điều chỉnh thói quen.",
  },
  table: { en: "Show the numbers", vi: "Xem bảng số liệu" },
  factor: { en: "Factor", vi: "Yếu tố" },
  days: { en: "Days", vi: "Số ngày" },
  on: { en: "on", vi: "vào" },
  vs: { en: "vs", vi: "so với" },
  noFactors: { en: "Not enough days with weather data yet.", vi: "Chưa đủ ngày có dữ liệu thời tiết." },
};

function sentence(f: Finding, outcome: Outcome, tr: (b: { en: string; vi: string }) => string): string {
  const fac = FACTORS.find((x) => x.key === f.key)!;
  const out = tr(outcome === "energy" ? L.energy : L.mood).toLowerCase();
  const scale = outcome === "energy" ? "/10" : "/5";
  return `${tr(fac.label)}: ${out} ${f.highMean.toFixed(1)}${scale} ${tr(L.on)} ${tr(fac.highLabel)} ${tr(L.vs)} ${f.lowMean.toFixed(1)}${scale} ${tr(L.on)} ${tr(fac.lowLabel)}`;
}

export default function Insights({ checkins }: { checkins: CheckIn[] }) {
  const { tr } = useT();
  const [outcome, setOutcome] = useState<Outcome>("energy");
  const [hover, setHover] = useState<{ f: Finding; x: number; y: number } | null>(null);
  const result = useMemo(() => analyze(checkins, outcome), [checkins, outcome]);

  return (
    <section className="card insights">
      <h2>🧭 {tr(L.title)}</h2>
      <p className="muted small">{tr(L.intro)}</p>

      {result.days < MIN_DAYS ? (
        <div className="progress-wrap">
          <div className="bar"><span className="fill progress-fill" style={{ width: `${(result.days / MIN_DAYS) * 100}%` }} /></div>
          <p className="small">{fmt(tr(L.progress), { n: result.days, min: MIN_DAYS })}</p>
        </div>
      ) : (
        <>
          <div className="chips" role="tablist">
            {(["energy", "mood"] as const).map((o) => (
              <button key={o} role="tab" aria-selected={outcome === o} className={`chip ${outcome === o ? "on" : ""}`} onClick={() => setOutcome(o)}>
                {tr(o === "energy" ? L.energy : L.mood)}
              </button>
            ))}
          </div>

          {!result.findings.length ? (
            <p className="small muted">{tr(L.noFactors)}</p>
          ) : (
            <div className="corr" onMouseLeave={() => setHover(null)}>
              <div className="corr-axis tiny muted">
                <span>{tr(L.lower)}</span>
                <span>{tr(L.higher)}</span>
              </div>
              {result.findings.map((f) => {
                const fac = FACTORS.find((x) => x.key === f.key)!;
                const width = Math.min(Math.abs(f.r), 1) * 50;
                return (
                  <button
                    key={f.key}
                    className={`corr-row ${f.reliable ? "solid" : "faded"}`}
                    onMouseMove={(e) => setHover({ f, x: e.clientX, y: e.clientY })}
                    onFocus={(e) => {
                      const r = e.currentTarget.getBoundingClientRect();
                      setHover({ f, x: r.left + r.width / 2, y: r.top });
                    }}
                    onBlur={() => setHover(null)}
                    aria-label={`${tr(fac.label)}: r ${f.r.toFixed(2)}, ${tr(STRENGTH_LABEL[f.strength])}`}
                  >
                    <span className="corr-label small">{tr(fac.label)}</span>
                    <span className="corr-track">
                      <span className="corr-zero" />
                      <span
                        className={`corr-bar ${f.r >= 0 ? "pos" : "neg"}`}
                        style={f.r >= 0 ? { left: "50%", width: `${width}%` } : { right: "50%", width: `${width}%` }}
                      />
                    </span>
                    <span className="corr-value tiny">
                      {f.r >= 0 ? "+" : "−"}{Math.abs(f.r).toFixed(2)}
                      <span className="muted"> · {f.reliable ? tr(STRENGTH_LABEL[f.strength]) : tr(L.unclear)}</span>
                    </span>
                  </button>
                );
              })}
              {hover && (
                <div className="tooltip" style={{ left: hover.x, top: hover.y }} role="status">
                  <strong>{tr(FACTORS.find((x) => x.key === hover.f.key)!.label)}</strong>
                  <div>r = {hover.f.r.toFixed(2)} · n = {hover.f.n}</div>
                  <div className="muted">{sentence(hover.f, outcome, tr)}</div>
                </div>
              )}
            </div>
          )}

          {result.findings.filter((f) => f.reliable).length > 0 && (
            <ul className="advice">
              {result.findings.filter((f) => f.reliable).map((f) => <li key={f.key} className="small">{sentence(f, outcome, tr)}</li>)}
            </ul>
          )}
          <p className="tiny muted">{tr(L.caveat)}</p>

          <details className="corr-table">
            <summary className="small">{tr(L.table)}</summary>
            <table>
              <thead>
                <tr><th>{tr(L.factor)}</th><th>r</th><th>{tr(L.days)}</th><th>↑</th><th>↓</th></tr>
              </thead>
              <tbody>
                {result.findings.map((f) => (
                  <tr key={f.key}>
                    <td>{tr(FACTORS.find((x) => x.key === f.key)!.label)}</td>
                    <td>{f.r.toFixed(2)}</td>
                    <td>{f.n}</td>
                    <td>{f.highMean.toFixed(1)}</td>
                    <td>{f.lowMean.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
