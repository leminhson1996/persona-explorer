import type { ReactNode } from "react";
import { fmt, useT } from "../lib/i18n";
import { DAY_MASTER_NATURE, ELEMENTS, STRENGTH_LABEL, TEN_GOD_MEANING, type Bazi, type Pillar } from "../lib/bazi";
import { CAN, CHI, CAN_ELEMENT, ELEMENT_EN, type Element } from "../lib/lunar";
import { CHI_ELEMENT } from "../lib/bazi";
import { MAIN_STAR_MEANING, PALACE_MEANING, TUVI_GRID, type MainStar, type TuVi } from "../lib/tuvi";

const EL_CLASS: Record<Element, string> = { Mộc: "el-wood", Hỏa: "el-fire", Thổ: "el-earth", Kim: "el-metal", Thủy: "el-water" };

function ElementTag({ el }: { el: Element }) {
  const { lang } = useT();
  return <span className={`el ${EL_CLASS[el]}`}>{lang === "vi" ? el : ELEMENT_EN[el]}</span>;
}

function BaziView({ b }: { b: Bazi }) {
  const { t, tr } = useT();
  // Traditional order, read right to left: Giờ · Ngày · Tháng · Năm.
  const cols: [string, Pillar][] = [
    [t("hourPillar"), b.pillars.hour],
    [t("dayPillar"), b.pillars.day],
    [t("monthPillar"), b.pillars.month],
    [t("yearPillar"), b.pillars.year],
  ];
  const max = Math.max(...Object.values(b.weighted));

  return (
    <section className="card">
      <h2>{t("baziTitle")}</h2>
      <div className="pillars-wrap">
        <table className="pillars">
          <thead>
            <tr><th />{cols.map(([label]) => <th key={label}>{label}</th>)}</tr>
          </thead>
          <tbody>
            <tr>
              <th>{t("tenGods")}</th>
              {cols.map(([label, p]) => <td key={label} className="god">{p.stemGod ?? t("dayMaster")}</td>)}
            </tr>
            <tr className="big-row">
              <th>{t("stem")}</th>
              {cols.map(([label, p]) => (
                <td key={label}><span className={`glyph-cell ${EL_CLASS[CAN_ELEMENT[p.can]]}`}>{CAN[p.can]}</span></td>
              ))}
            </tr>
            <tr className="big-row">
              <th>{t("branch")}</th>
              {cols.map(([label, p]) => (
                <td key={label}><span className={`glyph-cell ${EL_CLASS[CHI_ELEMENT[p.chi]]}`}>{CHI[p.chi]}</span></td>
              ))}
            </tr>
            <tr>
              <th>{t("hiddenStems")}</th>
              {cols.map(([label, p]) => (
                <td key={label} className="tiny">
                  {p.hidden.map((h, i) => <div key={h}>{CAN[h]} · <span className="muted">{p.hiddenGods[i]}</span></div>)}
                </td>
              ))}
            </tr>
            <tr>
              <th>{t("napAm")}</th>
              {cols.map(([label, p]) => <td key={label} className="tiny muted">{p.napAm}</td>)}
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bazi-grid">
        <div>
          <h4>{t("dayMaster")}: {b.dayMaster.name} <ElementTag el={b.dayMaster.element} /></h4>
          <p className="small">{tr(DAY_MASTER_NATURE[b.dayMaster.stem])}</p>
          <p className="small"><strong>{tr(STRENGTH_LABEL[b.strength])}</strong> · {t("favorable")}: {b.favorable.map((e) => <ElementTag key={e} el={e} />)}</p>
        </div>
        <div>
          <h4>{t("elementBalance")}</h4>
          <ul className="el-bars">
            {ELEMENTS.map((e) => (
              <li key={e}>
                <ElementTag el={e} />
                <span className="bar"><span className={`fill ${EL_CLASS[e]}`} style={{ width: `${(b.weighted[e] / max) * 100}%` }} /></span>
                <span className="tiny muted">{b.count[e]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="relation">
        <p className="eyebrow">{t("todayForYou")}</p>
        <p>
          <strong>{b.today.dayPillar.name}</strong> → <strong>{b.today.dayGod}</strong>: {tr(TEN_GOD_MEANING[b.today.dayGod])}
        </p>
        <p className="small muted">
          {t("thisYearForYou")}: {b.today.yearPillar.name} → {b.today.yearGod} ({tr(TEN_GOD_MEANING[b.today.yearGod])})
        </p>
      </div>

      <h4>{t("luckPillars")}</h4>
      {b.luck ? (
        <>
          <p className="tiny muted">{fmt(t("startsAt"), { n: b.luck.startAge })}</p>
          <div className="luck-row">
            {b.luck.pillars.map((l) => (
              <div key={l.age} className={`luck ${b.currentLuck?.age === l.age ? "now" : ""}`}>
                <span className="tiny muted">{l.age}</span>
                <strong>{CAN[l.can]}</strong>
                <strong>{CHI[l.chi]}</strong>
                <span className="tiny">{l.god}</span>
                {b.currentLuck?.age === l.age && <span className="tiny now-tag">{t("current")}</span>}
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="small muted">{t("chartsNeedGender")}</p>
      )}
    </section>
  );
}

function TuViView({ tv, name }: { tv: TuVi; name: string }) {
  const { t, tr, lang } = useT();

  const cell = (chi: number) => {
    const pl = tv.palaces[chi];
    const classes = ["palace", chi === tv.menh ? "menh" : "", tv.currentDaiHan?.chi === chi ? "daihan" : "", tv.luuNien === chi ? "luunien" : ""];
    return (
      <div key={chi} className={classes.join(" ")} title={tr(PALACE_MEANING[pl.name])}>
        <div className="palace-head">
          <span className="palace-name">{pl.name}{pl.isThan && <span className="than"> · {t("thanCu")}</span>}</span>
          <span className="tiny muted">{CAN[pl.can]} {CHI[pl.chi]}</span>
        </div>
        <ul className="stars">
          {pl.stars.map((s) => (
            <li key={s.name} className={`${s.main ? "main" : "minor"} tone-${s.tone}`}
              title={s.main ? tr(MAIN_STAR_MEANING[s.name as MainStar]) : undefined}>
              {s.name}{s.hoa && <span className={`hoa hoa-${s.hoa === "Kỵ" ? "ky" : "good"}`}>{s.hoa}</span>}
            </li>
          ))}
        </ul>
        <div className="palace-foot tiny muted">
          <span>{pl.daiHan}–{pl.daiHan + 9}</span>
          {tv.luuNien === chi && <span className="ln">LN</span>}
        </div>
      </div>
    );
  };

  const center = (
    <div key="center" className="palace-center">
      <p className="eyebrow">{t("tuviTitle")}</p>
      <h3>{name || "—"}</h3>
      <dl className="kv small">
        <dt>{t("lunarDate")}</dt>
        <dd>{tv.day}/{tv.month}{tv.lunar.leap ? ` (${t("leapMonth")})` : ""} · {tv.year.name} · {tv.hourName}</dd>
        <dt>Âm dương</dt><dd>{tv.amDuong}</dd>
        <dt>{t("banMenh")}</dt><dd>{tv.banMenh.name}</dd>
        <dt>{t("cuc")}</dt><dd>{tv.cuc.name}</dd>
        <dt>{t("menhChu")}</dt><dd>{tv.menhChu}</dd>
        <dt>{t("thanChu")}</dt><dd>{tv.thanChu}</dd>
        <dt>{t("lunarAge")}</dt><dd>{tv.tuoiAm}</dd>
      </dl>
      <p className="tiny">{t("cuc")} – {t("banMenh")}: {tr(tv.cucVsMenh.label)}</p>
      {tv.lunar.leap && <p className="tiny muted">* {t("leapNote")}</p>}
    </div>
  );

  const rows: ReactNode[] = [];
  TUVI_GRID.forEach((row, r) =>
    row.forEach((chi, c) => {
      if (chi !== null) rows.push(cell(chi));
      else if (r === 1 && c === 1) rows.push(center);
    }),
  );

  const dh = tv.currentDaiHan;
  return (
    <section className="card">
      <h2>{t("tuviTitle")}</h2>
      <div className="tuvi-wrap">
        <div className="tuvi-grid">{rows}</div>
      </div>
      <div className="legend tiny muted">
        <span><i className="sw menh" /> {lang === "vi" ? "Cung Mệnh" : "Mệnh palace"}</span>
        <span><i className="sw daihan" /> {t("daiHanNow")}{dh ? `: ${dh.name}` : ""}</span>
        <span><i className="sw luunien" /> {t("luuNien")}: {tv.palaces[tv.luuNien].name}</span>
        <span><span className="hoa hoa-good">Lộc</span><span className="hoa hoa-good">Quyền</span><span className="hoa hoa-good">Khoa</span><span className="hoa hoa-ky">Kỵ</span> Tứ Hóa</span>
      </div>
      {dh && (
        <p className="small">
          <strong>{t("daiHanNow")}: {dh.name}</strong> ({dh.daiHan}–{dh.daiHan + 9}) · {tr(PALACE_MEANING[dh.name])}
        </p>
      )}
    </section>
  );
}

interface Props {
  bazi: Bazi | null;
  tuvi: TuVi | null;
  name: string;
  onOpenProfile: () => void;
  children?: ReactNode;
}

export default function Charts({ bazi, tuvi, name, onOpenProfile, children }: Props) {
  const { t } = useT();
  if (!bazi || !tuvi)
    return (
      <section className="card">
        <h2>{t("tabCharts")}</h2>
        <p>{t("chartsNeedTime")}</p>
        <button className="primary" onClick={onOpenProfile}>{t("goToProfile")}</button>
      </section>
    );
  return (
    <div className="today">
      <TuViView tv={tuvi} name={name} />
      <BaziView b={bazi} />
      {children}
      <p className="tiny muted center">{t("chartDisclaimer")}</p>
    </div>
  );
}
