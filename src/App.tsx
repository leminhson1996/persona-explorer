import { useEffect, useMemo, useRef, useState } from "react";
import { LangContext, UI, type Lang } from "./lib/i18n";
import { localDateKey, store, syncStatus, syncWithServer, type SyncStatus } from "./lib/storage";
import { buildSnapshot } from "./lib/snapshot";
import type { CheckIn, CosmosData, DiaryEntry, Meditation, Profile, Reading, ReadingKind } from "./lib/types";
import { guide, useStreamingKinds } from "./lib/guideStore";
import ProfileForm from "./components/ProfileForm";
import CheckInCard from "./components/CheckInCard";
import Dashboard from "./components/Dashboard";
import CosmosCard from "./components/CosmosCard";
import GuidancePanel from "./components/GuidancePanel";
import Journal from "./components/Journal";
import Charts from "./components/Charts";
import Dharma from "./components/Dharma";
import Library from "./components/Library";
import Starfield from "./components/Starfield";

type Tab = "today" | "charts" | "dharma" | "library" | "journal" | "profile";

const KIND_TAB: Record<ReadingKind, Tab> = { daily: "today", chart: "charts", dharma: "dharma" };

const TAB_LABEL = { today: "tabToday", charts: "tabCharts", dharma: "tabDharma", library: "tabLibrary", journal: "tabJournal", profile: "tabProfile" } as const;

const initialLang = (): Lang => store.loadLang() ?? (navigator.language.startsWith("vi") ? "vi" : "en");

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [profile, setProfile] = useState<Profile | null>(store.loadProfile);
  const [checkins, setCheckins] = useState<CheckIn[]>(store.loadCheckins);
  const [readings, setReadings] = useState<Reading[]>(store.loadReadings);
  const [diary, setDiary] = useState<DiaryEntry[]>(store.loadDiary);
  const [meditations, setMeditations] = useState<Meditation[]>(store.loadMeditations);
  const [tab, setTab] = useState<Tab>("today");
  const [now, setNow] = useState(() => new Date());
  const [cosmos, setCosmos] = useState<CosmosData | null | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [sync, setSync] = useState<SyncStatus>(syncStatus.get());
  const today = localDateKey(now);

  // Load from ./my_data (via the server); the newer copy of each collection wins.
  useEffect(() => {
    const unsubscribe = syncStatus.subscribe(setSync);
    syncWithServer().then((changed) => {
      if (changed) {
        setProfile(store.loadProfile());
        setCheckins(store.loadCheckins());
        setReadings(store.loadReadings());
        setDiary(store.loadDiary());
        setMeditations(store.loadMeditations());
        const l = store.loadLang();
        if (l) setLang(l);
      }
      setReady(true);
    });
    return unsubscribe;
  }, []);

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
  const readingsRef = useRef(readings);
  readingsRef.current = readings;
  const saveReadings = (r: Reading[]) => {
    readingsRef.current = r;
    setReadings(r);
    store.saveReadings(r);
  };

  const saveDiary = (d: DiaryEntry[]) => {
    setDiary(d);
    store.saveDiary(d);
  };
  const saveMeditations = (m: Meditation[]) => {
    setMeditations(m);
    store.saveMeditations(m);
  };
  const upsertReading = (r: Reading) => {
    const list = readingsRef.current;
    const i = list.findIndex((x) => x.id === r.id);
    saveReadings(i === -1 ? [...list, r] : list.map((x, j) => (j === i ? r : x)));
  };
  // The guide store streams readings in the background and saves through here.
  guide.setSaver(upsertReading);
  const streamingKinds = useStreamingKinds();
  const streamingTabs = streamingKinds.map((k) => KIND_TAB[k]);


  const todayCheckin = [...checkins].reverse().find((c) => c.date === today);
  const todayReading = [...readings].reverse().find((r) => r.date === today && (r.kind ?? "daily") === "daily");
  const dharmaReading = [...readings].reverse().find((r) => r.date === today && r.kind === "dharma");
  const chartReading = [...readings].reverse().find((r) => r.kind === "chart");
  const recent = checkins.slice(-8, todayCheckin ? -1 : undefined);
  const todayDiaryCount = diary.filter((d) => d.date === today).length;

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

        {!ready && !profile ? (
          <main><p className="muted center">✦</p></main>
        ) : !profile ? (
          <main>
            <ProfileForm initial={null} onSave={(p) => saveProfile({ ...p, lang })} onboarding />
          </main>
        ) : (
          <>
            <nav className="tabs">
              {(["today", "charts", "dharma", "library", "journal", "profile"] as const).map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {UI[TAB_LABEL[t]][lang]}
                  {streamingTabs.includes(t) && <span className="live-dot" aria-label={UI.libWriting[lang]} />}
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
                    <div className="stack">
                      <CheckInCard
                        existing={todayCheckin}
                        today={today}
                        onSave={(c) => saveCheckins([...checkins.filter((x) => x.id !== c.id), c])}
                      />
                      <button className="card diary-link" onClick={() => setTab("journal")}>
                        <span>{UI.writeDiary[lang]}</span>
                        {todayDiaryCount > 0 && <span className="pill">✓ {todayDiaryCount}</span>}
                      </button>
                    </div>
                    <GuidancePanel
                      diary={diary}
                      meditations={meditations}
                      profile={profile}
                      snapshot={snapshot}
                      cosmos={cosmos}
                      checkin={todayCheckin}
                      recent={recent}
                      reading={todayReading}
                      today={today}
                    />
                  </div>
                </div>
              )}
              {tab === "charts" && snapshot && (
                <Charts bazi={snapshot.bazi} tuvi={snapshot.tuvi} name={profile.name} onOpenProfile={() => setTab("profile")}>
                  <GuidancePanel
                    kind="chart"
                    diary={diary}
                    meditations={meditations}
                    profile={profile}
                    snapshot={snapshot}
                    cosmos={cosmos}
                    checkin={todayCheckin}
                    recent={recent}
                    reading={chartReading}
                    today={today}
                  />
                </Charts>
              )}
              {tab === "dharma" && snapshot && (
                <Dharma
                  now={now}
                  checkin={todayCheckin}
                  meditations={meditations}
                  onSaveMeditation={(m) => saveMeditations([...meditations, m])}
                  onGoCheckin={() => setTab("today")}
                >
                  <GuidancePanel
                    kind="dharma"
                    diary={diary}
                    meditations={meditations}
                    profile={profile}
                    snapshot={snapshot}
                    cosmos={cosmos}
                    checkin={todayCheckin}
                    recent={recent}
                    reading={dharmaReading}
                    today={today}
                  />
                </Dharma>
              )}
              {tab === "library" && (
                <Library
                  readings={readings}
                  onContinue={(k) => setTab(KIND_TAB[k])}
                  onDelete={(id) => saveReadings(readings.filter((r) => r.id !== id))}
                />
              )}
              {tab === "journal" && (
                <Journal
                  checkins={checkins}
                  diary={diary}
                  onSaveDiary={(e) => saveDiary([...diary.filter((x) => x.id !== e.id), e])}
                  onDeleteDiary={(id) => saveDiary(diary.filter((d) => d.id !== id))}
                  onDeleteCheckin={(id) => saveCheckins(checkins.filter((c) => c.id !== id))}
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
                    setDiary(store.loadDiary());
                    setMeditations(store.loadMeditations());
                  }}
                  onReset={() => {
                    void store.clear();
                    setProfile(null);
                    setCheckins([]);
                    setReadings([]);
                    setDiary([]);
                    setMeditations([]);
                    setTab("today");
                  }}
                />
              )}
            </main>
          </>
        )}
        <footer className="foot">
          <span className={`sync sync-${sync}`}>
            {sync === "saved" ? "💾 my_data ✓" : sync === "syncing" ? "💾 …" : "⚠️ my_data offline: saved in browser, will retry"}
          </span>
          {" · "}Sky: astronomy-engine · Space data: NASA Open APIs & NOAA SWPC · Guidance: Claude
        </footer>
      </div>
    </LangContext.Provider>
  );
}
