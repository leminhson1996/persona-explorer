import { useRef, useState } from "react";
import { useT } from "../lib/i18n";
import { CITIES } from "../lib/snapshot";
import { isBackup, makeBackup, store } from "../lib/storage";
import { genderOf } from "../lib/bazi";
import type { Place, Profile } from "../lib/types";

interface Props {
  initial: Profile | null;
  onSave: (p: Profile) => void;
  onboarding?: boolean;
  onRestore?: () => void;
  onReset?: () => void;
}

const empty = (): Profile => ({
  name: "",
  birthDate: "",
  birthTime: "",
  birthUtcOffset: -new Date().getTimezoneOffset() / 60,
  occupation: "",
  goals: "",
  challenges: "",
  values: "",
  lang: "en",
});

function PlaceField({ label, value, onChange, onTz, allowGeo }: {
  label: string;
  value?: Place;
  onChange: (p: Place | undefined) => void;
  onTz?: (tz: number) => void;
  allowGeo?: boolean;
}) {
  const { t } = useT();
  const preset = CITIES.find((c) => c.label === value?.label);
  const [custom, setCustom] = useState(!!value && !preset);

  return (
    <div className="field">
      <label>{label}</label>
      <div className="row">
        <select
          value={custom ? "__custom" : preset?.label ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "__custom") {
              setCustom(true);
              return;
            }
            setCustom(false);
            const c = CITIES.find((x) => x.label === v);
            onChange(c ? { lat: c.lat, lon: c.lon, label: c.label } : undefined);
            if (c && onTz) onTz(c.tz);
          }}
        >
          <option value="">{t("pickCity")}</option>
          {CITIES.map((c) => (
            <option key={c.label} value={c.label}>{c.label}</option>
          ))}
          <option value="__custom">{t("customPlace")}</option>
        </select>
        {allowGeo && "geolocation" in navigator && (
          <button
            type="button"
            className="ghost"
            onClick={() =>
              navigator.geolocation.getCurrentPosition((pos) => {
                setCustom(true);
                onChange({ lat: +pos.coords.latitude.toFixed(4), lon: +pos.coords.longitude.toFixed(4), label: "📍" });
              })
            }
          >
            📍 {t("useMyLocation")}
          </button>
        )}
      </div>
      {custom && (
        <div className="row">
          <input type="number" step="0.0001" placeholder={t("latitude")} aria-label={t("latitude")}
            value={value?.lat ?? ""} onChange={(e) => onChange({ lat: +e.target.value, lon: value?.lon ?? 0, label: value?.label })} />
          <input type="number" step="0.0001" placeholder={t("longitude")} aria-label={t("longitude")}
            value={value?.lon ?? ""} onChange={(e) => onChange({ lat: value?.lat ?? 0, lon: +e.target.value, label: value?.label })} />
        </div>
      )}
    </div>
  );
}

export default function ProfileForm({ initial, onSave, onboarding, onRestore, onReset }: Props) {
  const { t } = useT();
  const [p, setP] = useState<Profile>(initial ?? empty());
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Profile>(k: K, v: Profile[K]) => {
    setP((prev) => ({ ...prev, [k]: v }));
    setSaved(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!p.birthDate) return;
    onSave({ ...p, birthTime: p.birthTime || undefined });
    setSaved(true);
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(makeBackup(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `universal-explorer-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const importData = async (file: File) => {
    try {
      const data = JSON.parse(await file.text());
      if (!isBackup(data)) throw new Error();
      if (data.profile) store.saveProfile(data.profile);
      store.saveCheckins(data.checkins);
      store.saveReadings(data.readings ?? []);
      store.saveDiary(data.diary ?? []);
      if (data.profile) setP(data.profile);
      onRestore?.();
    } catch {
      alert(t("importFailed"));
    }
  };

  return (
    <form className="card profile" onSubmit={submit}>
      <h2>{onboarding ? t("welcomeTitle") : t("profileTitle")}</h2>
      <p className="muted">{onboarding ? t("welcomeIntro") : t("profileIntro")}</p>

      <div className="grid2">
        <div className="field">
          <label htmlFor="name">{t("fullName")}</label>
          <input id="name" value={p.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
          <small>{t("fullNameHint")}</small>
        </div>
        <div className="field">
          <label htmlFor="gender">{t("gender")}</label>
          <select id="gender" value={genderOf(p) ?? ""} onChange={(e) => set("gender", e.target.value)}>
            <option value="">{t("genderNone")}</option>
            <option value="male">{t("genderMale")}</option>
            <option value="female">{t("genderFemale")}</option>
          </select>
          <small>{t("genderHint")}</small>
        </div>
        <div className="field">
          <label htmlFor="bd">{t("birthDate")} *</label>
          <input id="bd" type="date" required value={p.birthDate} onChange={(e) => set("birthDate", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="bt">{t("birthTime")}</label>
          <div className="row">
            <input id="bt" type="time" value={p.birthTime ?? ""} onChange={(e) => set("birthTime", e.target.value)} />
            <input type="number" step="0.5" min={-12} max={14} className="narrow" aria-label={t("utcOffset")} title={t("utcOffset")}
              value={p.birthUtcOffset} onChange={(e) => set("birthUtcOffset", +e.target.value)} />
          </div>
          <small>{t("birthTimeHint")} · {t("utcOffset")}</small>
        </div>
        <PlaceField label={t("birthPlace")} value={p.birthPlace} onChange={(v) => set("birthPlace", v)} onTz={(tz) => set("birthUtcOffset", tz)} />
        <PlaceField label={t("currentPlace")} value={p.currentPlace} onChange={(v) => set("currentPlace", v)} allowGeo />
      </div>

      <div className="field">
        <label htmlFor="occ">{t("occupation")}</label>
        <textarea id="occ" rows={2} placeholder={t("occupationHint")} value={p.occupation} onChange={(e) => set("occupation", e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="goals">{t("goals")}</label>
        <textarea id="goals" rows={2} placeholder={t("goalsHint")} value={p.goals} onChange={(e) => set("goals", e.target.value)} />
      </div>
      <div className="grid2">
        <div className="field">
          <label htmlFor="chal">{t("challenges")}</label>
          <textarea id="chal" rows={2} value={p.challenges} onChange={(e) => set("challenges", e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="val">{t("values")}</label>
          <textarea id="val" rows={2} value={p.values} onChange={(e) => set("values", e.target.value)} />
        </div>
      </div>

      <div className="actions">
        <button type="submit" className="primary">{onboarding ? t("saveAndBegin") : saved ? t("saved") : t("save")}</button>
      </div>

      {!onboarding && (
        <section className="data-tools">
          <h3>{t("dataTitle")}</h3>
          <div className="row wrap">
            <button type="button" className="ghost" onClick={exportData}>⬇ {t("exportData")}</button>
            <button type="button" className="ghost" onClick={() => fileRef.current?.click()}>⬆ {t("importData")}</button>
            <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importData(e.target.files[0])} />
            <button type="button" className="danger" onClick={() => confirm(t("resetConfirm")) && onReset?.()}>{t("resetData")}</button>
          </div>
        </section>
      )}
    </form>
  );
}
