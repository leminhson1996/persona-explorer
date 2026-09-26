import { useState } from "react";
import { useT } from "../lib/i18n";
import type { CosmosData } from "../lib/types";

const L = {
  title: { en: "Live from NASA", vi: "Trực tiếp từ NASA" },
  loading: { en: "Reaching out to NASA…", vi: "Đang kết nối NASA…" },
  unavailable: { en: "NASA data is unavailable right now.", vi: "Hiện chưa lấy được dữ liệu NASA." },
  kp: { en: "Geomagnetic activity (Kp)", vi: "Hoạt động địa từ (Kp)" },
  flares: { en: "Solar flares · 3 days", vi: "Bão lửa Mặt Trời · 3 ngày" },
  storms: { en: "Geomagnetic storms · 7 days", vi: "Bão địa từ · 7 ngày" },
  cmes: { en: "Coronal mass ejections · 3 days", vi: "Phun trào nhật hoa · 3 ngày" },
  earthward: { en: "one heading toward Earth", vi: "có đợt hướng về Trái Đất" },
  asteroids: { en: "Asteroids passing Earth today", vi: "Tiểu hành tinh bay qua hôm nay" },
  closest: { en: "closest", vi: "gần nhất" },
  lunarDist: { en: "× Moon distance", vi: "× khoảng cách Trăng" },
  apod: { en: "Astronomy Picture of the Day", vi: "Ảnh thiên văn trong ngày" },
  more: { en: "Read more", vi: "Đọc thêm" },
  less: { en: "Show less", vi: "Thu gọn" },
  none: { en: "none", vi: "không có" },
  limited: {
    en: "NASA is rate-limiting the shared DEMO_KEY (about 10 requests per hour). Get a free personal key at api.nasa.gov and add NASA_API_KEY=… to .env, then restart. It will retry automatically within an hour.",
    vi: "NASA đang giới hạn khóa dùng chung DEMO_KEY (khoảng 10 lượt/giờ). Hãy lấy khóa cá nhân miễn phí tại api.nasa.gov, thêm NASA_API_KEY=… vào file .env rồi khởi động lại. App sẽ tự thử lại sau tối đa 1 giờ.",
  },
  limitedServer: {
    en: "NASA is rate-limiting requests right now; it will retry automatically within an hour.",
    vi: "NASA đang tạm giới hạn lượt truy cập; app sẽ tự thử lại sau tối đa 1 giờ.",
  },
  staleNote: { en: "Showing saved data from", vi: "Đang hiện dữ liệu đã lưu lúc" },
  calm: { en: "calm", vi: "yên tĩnh" },
  active: { en: "active", vi: "hoạt động" },
  storm: { en: "storm", vi: "bão" },
};

function kpLevel(kp: number) {
  if (kp >= 5) return { key: "storm" as const, cls: "kp-storm" };
  if (kp >= 4) return { key: "active" as const, cls: "kp-active" };
  return { key: "calm" as const, cls: "kp-calm" };
}

export default function CosmosCard({ data }: { data: CosmosData | null | undefined }) {
  const { tr, lang } = useT();
  const [expanded, setExpanded] = useState(false);

  if (data === undefined) return <section className="card cosmos"><h3>{tr(L.title)}</h3><p className="muted">{tr(L.loading)}</p></section>;
  const limitMsg = data?.rateLimited ? <p className="hint small">⏳ {tr(data.usingDemoKey ? L.limited : L.limitedServer)}</p> : null;
  if (!data || (!data.apod && !data.spaceWeather && !data.asteroids))
    return (
      <section className="card cosmos">
        <h3>🛰 {tr(L.title)}</h3>
        {limitMsg ?? <p className="muted">{tr(L.unavailable)}</p>}
        {data?.errors.length ? <p className="tiny muted">{data.errors.join(" · ")}</p> : null}
      </section>
    );

  const w = data.spaceWeather;
  const a = data.asteroids;
  const apod = data.apod;

  return (
    <section className="card cosmos">
      <h3>🛰 {tr(L.title)}</h3>
      {limitMsg}
      {data.staleSince && (
        <p className="tiny muted">
          🕘 {tr(L.staleNote)} {new Date(data.staleSince).toLocaleString(lang === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
        </p>
      )}

      {apod && (
        <figure className="apod">
          {apod.mediaType === "image" ? (
            <a href={apod.hdurl ?? apod.url} target="_blank" rel="noreferrer">
              <img src={apod.url} alt={apod.title} />
            </a>
          ) : (
            <a className="apod-video" href={apod.url} target="_blank" rel="noreferrer">▶ {apod.title}</a>
          )}
          <figcaption>
            <p className="eyebrow">{tr(L.apod)}</p>
            <strong>{apod.title}</strong>
            {apod.copyright && <span className="tiny muted"> · © {apod.copyright}</span>}
            <p className={`small ${expanded ? "" : "clamp"}`}>{apod.explanation}</p>
            <button className="link" onClick={() => setExpanded((x) => !x)}>{tr(expanded ? L.less : L.more)}</button>
          </figcaption>
        </figure>
      )}

      {w && (
        <dl className="kv">
          <dt>{tr(L.kp)}</dt>
          <dd>
            {w.kpNow !== null ? (
              <span className={`pill ${kpLevel(w.kpNow).cls}`}>{w.kpNow.toFixed(1)} · {tr(L[kpLevel(w.kpNow).key])}</span>
            ) : "—"}
          </dd>
          <dt>{tr(L.flares)}</dt>
          <dd>{w.flares.length}{w.strongestFlare ? ` · max ${w.strongestFlare}` : ""}</dd>
          <dt>{tr(L.storms)}</dt>
          <dd>{w.storms.length || tr(L.none)}</dd>
          <dt>{tr(L.cmes)}</dt>
          <dd>{w.cmeCount}{w.earthDirectedCme ? ` · ${tr(L.earthward)}` : ""}</dd>
        </dl>
      )}

      {a && (
        <p className="small">
          ☄️ <strong>{a.count}</strong> {tr(L.asteroids)}
          {a.closest && (
            <>
              {" "}· {tr(L.closest)}{" "}
              <a href={a.closest.url} target="_blank" rel="noreferrer">{a.closest.name}</a>{" "}
              (~{a.closest.diameterM} m, {a.closest.lunarDistances.toFixed(1)}{tr(L.lunarDist)})
            </>
          )}
        </p>
      )}
    </section>
  );
}
