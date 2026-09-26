import type { ReactNode } from "react";
import { fmt, useT } from "../lib/i18n";
import { MOON_PHASES, PLANETS, SIGNS, signIndex } from "../lib/astro";
import { ELEMENT_EN } from "../lib/lunar";
import { NUMBER_MEANING, PERSONAL_YEAR_THEME } from "../lib/numerology";
import type { Snapshot } from "../lib/snapshot";
import MoonGlyph from "./MoonGlyph";

const time = (d: Date | null, lang: string) =>
  d ? d.toLocaleTimeString(lang === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "—";

export default function Dashboard({ s, children }: { s: Snapshot; children?: ReactNode }) {
  const { t, tr, lang } = useT();
  const locale = lang === "vi" ? "vi-VN" : "en-US";
  const e = s.eastern;
  const phase = MOON_PHASES[s.moon.phaseIndex];
  const daysUntil = (d: Date | null) => {
    if (!d) return "—";
    const n = Math.round((d.getTime() - s.now.getTime()) / 86400000);
    return n <= 0 ? t("today") : fmt(t("inDays"), { n });
  };
  const sign = (i: number) => `${SIGNS[i].glyph} ${tr(SIGNS[i].name)}`;
  const element = (el: keyof typeof ELEMENT_EN) => (lang === "vi" ? el : `${el} · ${ELEMENT_EN[el]}`);
  const retro = s.sky.filter((p) => p.retrograde);
  const natalName = (k: string) => (k === "Ascendant" ? t("rising") : tr(PLANETS[k as keyof typeof PLANETS].name));

  return (
    <>
      <section className="hero card">
        <MoonGlyph angle={s.moon.angle} size={112} />
        <div className="hero-text">
          <p className="eyebrow">{s.now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
          <h2>
            {phase.emoji} {tr(phase.name)} · {tr(SIGNS[s.sky[1].sign].name)}
          </h2>
          <p className="muted">{tr(phase.meaning)} {Math.round(s.moon.illumination * 100)}% {t("illuminated")}.</p>
          <p className="lunar">
            {t("lunarDate")}: {e.todayLunar.day}/{e.todayLunar.month}
            {e.todayLunar.leap ? ` (${t("leapMonth")})` : ""} · {t("yearPillar")} {e.yearPillar.name} · {e.solarTerm.vi}
            {lang === "en" ? ` (${e.solarTerm.en})` : ""}
          </p>
        </div>
      </section>

      <div className="cards">
        <section className="card">
          <h3>{t("youTitle")}</h3>
          <dl className="kv">
            <dt>{t("sun")}</dt><dd>{sign(s.natal.sun.sign)}</dd>
            <dt>{t("moon")}</dt>
            <dd>{sign(s.natal.moon.sign)}{!s.natal.moonCertain && <em className="muted"> ({t("approx")})</em>}</dd>
            <dt>{t("rising")}</dt>
            <dd>{s.natal.asc !== null ? sign(signIndex(s.natal.asc)) : <em className="muted">{t("needsBirthTime")}</em>}</dd>
            <dt>{t("yourAnimal")}</dt><dd>{e.birthYear.name} · {tr(e.birthYear.animal)}</dd>
            <dt>{t("yourElement")}</dt><dd>{e.birthYear.napAm} · {element(e.birthYear.napAmElement)}</dd>
            <dt>{t("lifePath")}</dt><dd>{s.numbers.lifePath} · {tr(NUMBER_MEANING[s.numbers.lifePath].keyword)}</dd>
          </dl>
        </section>

        <section className="card">
          <h3>{t("skyTitle")}</h3>
          <ul className="planets">
            {s.sky.map((p) => (
              <li key={p.key} className={p.retrograde ? "retro" : ""}>
                <span className="glyph">{PLANETS[p.key].glyph}</span>
                <span>{tr(PLANETS[p.key].name)}</span>
                <span className="muted">{SIGNS[p.sign].glyph} {Math.floor(p.deg)}°{p.retrograde ? " ℞" : ""}</span>
              </li>
            ))}
          </ul>
          <p className="small">
            <strong>{t("retrograde")}:</strong>{" "}
            {retro.length ? retro.map((p) => tr(PLANETS[p.key].name)).join(", ") : t("noRetrograde")}
          </p>
          <h4>{t("transitsToYou")}</h4>
          {s.transits.length ? (
            <ul className="transits">
              {s.transits.slice(0, 5).map((tr_, i) => (
                <li key={i}>
                  <span className="glyph">{PLANETS[tr_.transiting].glyph} {tr_.aspect.symbol}</span>{" "}
                  {tr(PLANETS[tr_.transiting].name)} {tr(tr_.aspect.name)} {natalName(tr_.natal)}
                  <span className="muted"> · {tr(tr_.aspect.tone)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">{t("noTransits")}</p>
          )}
        </section>

        <section className="card">
          <h3>{t("numbersTitle")}</h3>
          <div className="numbers">
            {([
              ["personalYear", s.numbers.year],
              ["personalMonth", s.numbers.month],
              ["personalDay", s.numbers.day],
              ["universalDay", s.numbers.universalDay],
            ] as const).map(([k, n]) => (
              <div key={k} className="num">
                <span className="big">{n}</span>
                <span className="label">{t(k)}</span>
                <span className="muted tiny">{tr(NUMBER_MEANING[n].essence)}</span>
              </div>
            ))}
          </div>
          <p className="small"><strong>{t("personalYear")} {s.numbers.year}:</strong> {tr(PERSONAL_YEAR_THEME[s.numbers.year])}</p>
          <p className="small muted">
            {t("lifePath")} {s.numbers.lifePath} · {t("birthdayNum")} {s.numbers.birthday}
            {s.numbers.expression !== null && ` · ${t("expression")} ${s.numbers.expression}`}
          </p>
        </section>

        <section className="card">
          <h3>{t("easternTitle")}</h3>
          <dl className="kv">
            <dt>{t("dayPillar")}</dt><dd>{e.dayPillar.name} · {e.dayPillar.napAm}</dd>
            <dt>{t("monthPillar")}</dt><dd>{e.monthPillar.name}</dd>
            <dt>{t("yearPillar")}</dt><dd>{e.yearPillar.name} · {e.yearPillar.napAm}</dd>
            <dt>{t("solarTerm")}</dt><dd>{e.solarTerm.vi}{lang === "en" ? ` · ${e.solarTerm.en}` : ""}</dd>
          </dl>
          <div className={`relation rel-${e.dayRelation.relation}`}>
            <p className="eyebrow">{t("todayVsYou")}</p>
            <p><strong>{element(e.dayPillar.napAmElement)} → {element(e.birthYear.napAmElement)}</strong></p>
            <p><strong>{tr(e.dayRelation.label)}</strong></p>
            <p className="small">{tr(e.dayRelation.meaning)}</p>
          </div>
        </section>

        <section className="card">
          <h3>{t("natureTitle")}</h3>
          <dl className="kv">
            <dt>{t("season")}</dt><dd>{tr(s.nature.season)}</dd>
            <dt>{t("sunrise")}</dt><dd>{time(s.nature.sun.rise, lang)}</dd>
            <dt>{t("sunset")}</dt><dd>{time(s.nature.sun.set, lang)}</dd>
            <dt>{t("daylight")}</dt><dd>{s.nature.sun.daylightHours ? `${s.nature.sun.daylightHours.toFixed(1)} h` : "—"}</dd>
            <dt>{t("nextFull")}</dt><dd>🌕 {s.moon.nextFull?.toLocaleDateString(locale, { day: "numeric", month: "short" })} · {daysUntil(s.moon.nextFull)}</dd>
            <dt>{t("nextNew")}</dt><dd>🌑 {s.moon.nextNew?.toLocaleDateString(locale, { day: "numeric", month: "short" })} · {daysUntil(s.moon.nextNew)}</dd>
          </dl>
          {s.nature.place.label && <p className="tiny muted">📍 {s.nature.place.label}</p>}
        </section>
        {children}
      </div>
    </>
  );
}
