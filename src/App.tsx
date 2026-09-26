import { useEffect, useMemo, useState } from "react";
import { LangContext, UI, type Lang } from "./lib/i18n";
import { localDateKey, store } from "./lib/storage";
import { buildSnapshot } from "./lib/snapshot";
import type { CheckIn, CosmosData, Profile, Reading } from "./lib/types";
import ProfileForm from "./components/ProfileForm";
import CheckInCard from "./components/CheckInCard";
import Dashboard from "./components/Dashboard";
import CosmosCard from "./components/CosmosCard";
import GuidancePanel from "./components/GuidancePanel";
import Journal from "./components/Journal";
import Starfield from "./components/Starfield";

type Tab = "today" | "journal" | "profile";

const initialLang = (): Lang => store.loadLang() ?? (navigator.language.startsWith("vi") ? "vi" : "en");

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [profile, setProfile] = useState<Profile | null>(store.loadProfile);
  const [checkins, setCheckins] = useState<CheckIn[]>(store.loadCheckins);
  const [readings, setReadings] = useState<Reading[]>(store.loadReadings);
  const [tab, setTab] = useState<Tab>("today");
  const [now, setNow] = useState(() => new Date());
  const [cosmos, setCosmos] = useState<CosmosData | null | undefined>(undefined);
  const today = localDateKey(now);

  // Refresh the sky every 10 minutes; planets and the Moon keep moving.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setCosmos(undefined);
    fetch(`/api/cosmos?date=${today}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: CosmosData | null) => !cancelled && setCosmos(d))
      .catch(() => !cancelled && setCosmos(null));
    return () => {
      cancelled = true;
    };
  }, [today]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = UI.appName[lang];
  }, [lang]);

  const snapshot = useMemo(() => (profile ? buildSnapshot(profile, now) : null), [profile, now]);

  const changeLang = (l: Lang) => {
    setLang(l);
    store.saveLang(l);
    if (profile) saveProfile({ ...profile, lang: l });
  };
  const saveProfile = (p: Profile) => {
    setProfile(p);
    store.saveProfile(p);
  };
  const saveCheckins = (c: CheckIn[]) => {
    setCheckins(c);
    store.saveCheckins(c);
  };
  const saveReadings = (r: Reading[]) => {
    setReadings(r);
    store.saveReadings(r);
  };

  const todayCheckin = [...checkins].reverse().find((c) => c.date === today);
  const todayReading = [...readings].reverse().find((r) => r.date === today);

  return (
    <LangContext.Provider value={lang}>
      <Starfield />
      <div className="shell">
        <header className="topbar">
          <div className="brand">
            <span className="brand-mark">✦</span>
            <div>
              <h1>{UI.appName[lang]}</h1>
              <p>{UI.tagline[lang]}</p>
            </div>
          </div>
          <div className="lang-switch" role="group" aria-label={UI.language[lang]}>
            {(["en", "vi"] as const).map((l) => (
              <button key={l} className={l === lang ? "on" : ""} onClick={() => changeLang(l)} aria-pressed={l === lang}>
                {l === "en" ? "EN" : "VI"}
              </button>
            ))}
          </div>
        </header>

        {!profile ? (
          <main>
            <ProfileForm initial={null} onSave={(p) => saveProfile({ ...p, lang })} onboarding />
          </main>
        ) : (
          <>
            <nav className="tabs">
              {(["today", "journal", "profile"] as const).map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {UI[t === "today" ? "tabToday" : t === "journal" ? "tabJournal" : "tabProfile"][lang]}
                </button>
              ))}
            </nav>
            <main>
              {tab === "today" && snapshot && (
                <div className="today">
                  <Dashboard s={snapshot}>
                    <CosmosCard data={cosmos} />
                  </Dashboard>
                  <div className="today-cols">
                    <CheckInCard
                      existing={todayCheckin}
                      today={today}
                      onSave={(c) => saveCheckins([...checkins.filter((x) => x.id !== c.id), c])}
                    />
                    <GuidancePanel
                    profile={profile}
                    snapshot={snapshot}
                    cosmos={cosmos}
                    checkin={todayCheckin}
                    recent={checkins.slice(-8, todayCheckin ? -1 : undefined)}
                    reading={todayReading}
                    today={today}
                    onSave={(r) => saveReadings([...readings.filter((x) => x.id !== r.id), r])}
                    />
                  </div>
                </div>
              )}
              {tab === "journal" && (
                <Journal
                  checkins={checkins}
                  readings={readings}
                  onDeleteCheckin={(id) => saveCheckins(checkins.filter((c) => c.id !== id))}
                  onDeleteReading={(id) => saveReadings(readings.filter((r) => r.id !== id))}
                />
              )}
              {tab === "profile" && (
                <ProfileForm
                  initial={profile}
                  onSave={(p) => saveProfile({ ...p, lang })}
                  onRestore={() => {
                    setProfile(store.loadProfile());
                    setCheckins(store.loadCheckins());
                    setReadings(store.loadReadings());
                  }}
                  onReset={() => {
                    store.clear();
                    setProfile(null);
                    setCheckins([]);
                    setReadings([]);
                    setTab("today");
                  }}
                />
              )}
            </main>
          </>
        )}
        <footer className="foot">
          Sky: astronomy-engine · Space data: NASA Open APIs & NOAA SWPC · Guidance: Claude
        </footer>
      </div>
    </LangContext.Provider>
  );
}
