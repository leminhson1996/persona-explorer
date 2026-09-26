import { fmt, useT } from "../lib/i18n";
import { aqiInfo, heatInfo, pressureNote, uvInfo, weatherInfo } from "../lib/environment";
import type { SkyEvents } from "../lib/skyEvents";
import type { EnvNow } from "../lib/types";

const L = {
  envTitle: { en: "Weather & air", vi: "Không khí & thời tiết" },
  loading: { en: "Checking the air…", vi: "Đang đo không khí…" },
  unavailable: { en: "Weather data is unavailable right now.", vi: "Hiện chưa lấy được dữ liệu thời tiết." },
  feels: { en: "feels", vi: "cảm giác" },
  humidity: { en: "Humidity", vi: "Độ ẩm" },
  air: { en: "Air (US AQI)", vi: "Không khí (AQI)" },
  uv: { en: "UV today (max)", vi: "UV hôm nay (cao nhất)" },
  rain: { en: "Rain chance", vi: "Khả năng mưa" },
  pressure: { en: "Pressure", vi: "Áp suất" },
  skyTitle: { en: "Sky events", vi: "Sự kiện bầu trời" },
  tonight: { en: "Visible this evening", vi: "Nhìn thấy tối nay" },
  beforeDawn: { en: "Before dawn", vi: "Trước bình minh" },
  noPlanets: { en: "no bright planets well placed", vi: "không có hành tinh sáng ở vị trí đẹp" },
  up: { en: "up", vi: "cao" },
  showers: { en: "Meteor showers", vi: "Mưa sao băng" },
  perHour: { en: "/h", vi: "/giờ" },
  moonLit: { en: "Moon {n}% lit", vi: "trăng sáng {n}%" },
  lunar: { en: "Lunar eclipse", vi: "Nguyệt thực" },
  solar: { en: "Solar eclipse", vi: "Nhật thực" },
  visibleHere: { en: "visible here", vi: "thấy được ở đây" },
  notVisibleHere: { en: "not visible here", vi: "không thấy ở đây" },
  solarHere: { en: "Next one you can see", vi: "Lần tới bạn thấy được" },
  covered: { en: "{n}% covered", vi: "che {n}%" },
};

export function EnvironmentCard({ env }: { env: EnvNow | null | undefined }) {
  const { tr } = useT();
  if (env === undefined) return <section className="card"><h3>🌿 {tr(L.envTitle)}</h3><p className="muted small">{tr(L.loading)}</p></section>;
  if (!env) return <section className="card"><h3>🌿 {tr(L.envTitle)}</h3><p className="muted small">{tr(L.unavailable)}</p></section>;

  const w = weatherInfo(env.weatherCode, env.isDay);
  const heat = heatInfo(env.today?.feelsLikeMax ?? env.feelsLikeC);
  const aqi = env.air ? aqiInfo(env.air.aqi) : null;
  const uv = env.today ? uvInfo(env.today.uvMax) : null;
  const pNote = pressureNote(env.pressureDelta24h);
  const advice = [aqi && aqi.level !== "good" ? aqi.advice : null, heat.advice, pNote].filter(Boolean);

  return (
    <section className="card">
      <h3>🌿 {tr(L.envTitle)}</h3>
      <div className="wx-now">
        <span className="wx-emoji">{w.emoji}</span>
        <div>
          <strong className="wx-temp">{Math.round(env.tempC)}°C</strong>
          <span className="small muted"> · {tr(L.feels)} {Math.round(env.feelsLikeC)}°C · {tr(w.label)}</span>
          {env.today && <p className="tiny muted">{Math.round(env.today.tempMin)}–{Math.round(env.today.tempMax)}°C · <span className={`lvl lvl-${heat.level}`}>{tr(heat.label)}</span></p>}
        </div>
      </div>
      <dl className="kv">
        {aqi && env.air && (
          <>
            <dt>{tr(L.air)}</dt>
            <dd><span className={`lvl lvl-${aqi.level}`}>● {env.air.aqi} · {tr(aqi.label)}</span><span className="tiny muted"> · PM2.5 {Math.round(env.air.pm25)}</span></dd>
          </>
        )}
        {uv && env.today && (
          <>
            <dt>{tr(L.uv)}</dt>
            <dd><span className={`lvl lvl-${uv.level}`}>● {env.today.uvMax.toFixed(0)} · {tr(uv.label)}</span></dd>
          </>
        )}
        <dt>{tr(L.humidity)}</dt><dd>{env.humidity}%</dd>
        {env.today?.rainChance != null && (<><dt>{tr(L.rain)}</dt><dd>{env.today.rainChance}%</dd></>)}
        <dt>{tr(L.pressure)}</dt>
        <dd>{Math.round(env.pressure)} hPa{env.pressureDelta24h !== null && <span className="tiny muted"> ({env.pressureDelta24h >= 0 ? "+" : ""}{env.pressureDelta24h.toFixed(1)}/24h)</span>}</dd>
      </dl>
      {advice.length > 0 && (
        <ul className="advice">
          {advice.map((a, i) => <li key={i} className="small">{tr(a!)}</li>)}
        </ul>
      )}
    </section>
  );
}

export function SkyEventsCard({ events }: { events: SkyEvents }) {
  const { tr, lang } = useT();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const date = (d: Date) => d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
  const planets = (list: SkyEvents["evening"]) =>
    list?.planets.length
      ? list.planets.map((p) => `${tr(p.name)} (${tr(p.direction)}, ${Math.round(p.altitude)}°)`).join(" · ")
      : tr(L.noPlanets);

  return (
    <section className="card">
      <h3>🔭 {tr(L.skyTitle)}</h3>
      <dl className="kv">
        <dt>{tr(L.tonight)}</dt><dd className="small">{planets(events.evening)}</dd>
        <dt>{tr(L.beforeDawn)}</dt><dd className="small">{planets(events.dawn)}</dd>
      </dl>
      <h4>☄️ {tr(L.showers)}</h4>
      <ul className="upcoming">
        {events.showers.map((s) => (
          <li key={s.name.en}>
            <span>{tr(s.name)} <span className="tiny muted">~{s.zhr}{tr(L.perHour)}</span></span>
            <span className="tiny muted">{s.peak.toLocaleDateString(locale, { day: "numeric", month: "short" })} · {fmt(tr(L.moonLit), { n: Math.round(s.moonIllumination * 100) })}</span>
          </li>
        ))}
      </ul>
      <h4>🌘 {tr(L.lunar)} · ☀️ {tr(L.solar)}</h4>
      <ul className="upcoming">
        <li>
          <span>{tr(L.lunar)} {tr(events.lunarEclipse.kind).toLowerCase()}</span>
          <span className="tiny muted">{date(events.lunarEclipse.date)} · {tr(events.lunarEclipse.visibleHere ? L.visibleHere : L.notVisibleHere)}</span>
        </li>
        <li>
          <span>{tr(L.solar)} {tr(events.solarEclipse.kind).toLowerCase()}</span>
          <span className="tiny muted">{date(events.solarEclipse.date)}</span>
        </li>
        {events.solarLocal && (
          <li>
            <span>{tr(L.solarHere)}</span>
            <span className="tiny muted">{date(events.solarLocal.date)} · {fmt(tr(L.covered), { n: Math.round(events.solarLocal.obscuration * 100) })}</span>
          </li>
        )}
      </ul>
    </section>
  );
}
