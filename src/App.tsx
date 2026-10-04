import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { LangContext, UI, type Lang } from "./lib/i18n";
import { localDateKey, store, syncStatus, syncWithServer, type SyncStatus } from "./lib/storage";
import { buildSnapshot } from "./lib/snapshot";
import type { CheckIn, CheckInEnv, CosmosData, DiaryEntry, EnvDaily, EnvNow, Meditation, Profile, Reading, ReadingKind } from "./lib/types";
import { sunTimes } from "./lib/astro";
import { moonIlluminationOn } from "./lib/insights";
import { genderOf } from "./lib/bazi";
import { guide, useStreamingKinds } from "./lib/guideStore";
import { meditation, useMeditationRunning } from "./lib/meditationStore";
import ProfileForm from "./components/ProfileForm";
import CheckInCard from "./components/CheckInCard";
import Dashboard from "./components/Dashboard";
import CosmosCard from "./components/CosmosCard";
import GuidancePanel, { buildContextFor } from "./components/GuidancePanel";
import Tarot from "./components/Tarot";
import Progress from "./components/Progress";
import Physiognomy from "./components/Physiognomy";
import { describeProfile } from "./lib/snapshot";
import Journal from "./components/Journal";
import Charts from "./components/Charts";
import Dharma from "./components/Dharma";
import Library from "./components/Library";
import BuddhaWords from "./components/BuddhaWords";
import { quoteById, quoted, type QuoteState } from "./lib/buddhaQuotes";
import Starfield from "./components/Starfield";
// Three.js is large; load the acupressure tab only when it is opened.
const Acupressure = lazy(() => import("./components/Acupressure"));

type Tab = "today" | "charts" | "dharma" | "tarot" | "physio" | "acu" | "progress" | "library" | "journal" | "profile";

const KIND_TAB: Record<ReadingKind, Tab> = { daily: "today", chart: "charts", dharma: "dharma", tarot: "tarot", progress: "progress", physio: "physio", acu: "acu" };

const TAB_LABEL = { today: "tabToday", charts: "tabCharts", dharma: "tabDharma", tarot: "tabTarot", physio: "tabPhysio", acu: "tabAcu", progress: "tabProgress", library: "tabLibrary", journal: "tabJournal", profile: "tabProfile" } as const;

const initialLang = (): Lang => store.loadLang() ?? (navigator.language.startsWith("vi") ? "vi" : "en");

export default function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [profile, setProfile] = useState<Profile | null>(store.loadProfile);
  const [checkins, setCheckins] = useState<CheckIn[]>(store.loadCheckins);
  const [readings, setReadings] = useState<Reading[]>(store.loadReadings);
  const [diary, setDiary] = useState<DiaryEntry[]>(store.loadDiary);
  const [meditations, setMeditations] = useState<Meditation[]>(store.loadMeditations);
  const [quotes, setQuotes] = useState<QuoteState>(store.loadQuotes);
  const [tab, setTab] = useState<Tab>("today");
  const [now, setNow] = useState(() => new Date());
  const [cosmos, setCosmos] = useState<CosmosData | null | undefined>(undefined);
  const [env, setEnv] = useState<EnvNow | null | undefined>(undefined);
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
        setQuotes(store.loadQuotes());
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
  const place = snapshot?.nature.place;
  const placeKey = place ? `${place.lat.toFixed(2)},${place.lon.toFixed(2)}` : null;

  // Local weather & air, refreshed every ~20 minutes.
  const envSlot = Math.floor(now.getTime() / (20 * 60 * 1000));
  useEffect(() => {
    if (!placeKey) return;
    let cancelled = false;
    const [lat, lon] = placeKey.split(",");
    fetch(`/api/environment?lat=${lat}&lon=${lon}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d: EnvNow | null) => !cancelled && setEnv(d))
      .catch(() => !cancelled && setEnv(null));
    return () => {
      cancelled = true;
    };
  }, [placeKey, envSlot]);

  /** Conditions to store with today's check-in. */
  const envForCheckin = (): CheckInEnv => ({
    aqi: env?.air?.aqi ?? null,
    pm25: env?.air?.pm25 ?? null,
    tempMax: env?.today?.tempMax ?? null,
    feelsLikeMax: env?.today?.feelsLikeMax ?? null,
    humidity: env?.humidity ?? null,
    pressure: env?.pressure ?? null,
    pressureDelta24h: env?.pressureDelta24h ?? null,
    uvMax: env?.today?.uvMax ?? null,
    rainMm: env?.today?.rainMm ?? null,
    kp: cosmos?.spaceWeather?.kpMax24h ?? null,
    moonIllumination: snapshot?.moon.illumination,
    daylightHours: snapshot?.nature.sun.daylightHours ?? null,
  });

  const changeLang = (l: Lang) => {
    setLang(l);
    store.saveLang(l);
    if (profile) saveProfile({ ...profile, lang: l });
  };
  const saveProfile = (p: Profile) => {
    setProfile(p);
    store.saveProfile(p);
  };
  const checkinsRef = useRef(checkins);
  checkinsRef.current = checkins;
  const saveCheckins = (c: CheckIn[]) => {
    checkinsRef.current = c;
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
  const saveQuotes = (q: QuoteState) => {
    setQuotes(q);
    store.saveQuotes(q);
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
  const meditating = useMeditationRunning();
  const streamingTabs = [...streamingKinds.map((k) => KIND_TAB[k]), ...(meditating ? (["dharma"] as Tab[]) : [])];
  // The meditation timer runs app-wide and saves finished sessions here (upsert by session id).
  const meditationsRef = useRef(meditations);
  meditationsRef.current = meditations;
  meditation.setSaver((m) => {
    const next = [...meditationsRef.current.filter((x) => x.id !== m.id), m];
    meditationsRef.current = next;
    saveMeditations(next);
  });


  // Backfill conditions for older check-ins that have none (weather history from Open-Meteo).
  const backfilled = useRef(false);
  useEffect(() => {
    if (!ready || !placeKey || backfilled.current) return;
    const cutoff = localDateKey(new Date(Date.now() - 90 * 86400000));
    const missing = checkins.filter((c) => c.env?.humidity == null && c.date >= cutoff && c.date < today);
    backfilled.current = true;
    if (!missing.length) return;
    const dates = missing.map((c) => c.date).sort();
    const [lat, lon] = placeKey.split(",");
    fetch(`/api/environment/daily?lat=${lat}&lon=${lon}&start=${dates[0]}&end=${dates[dates.length - 1]}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((rows: EnvDaily[] | null) => {
        if (!rows) return;
        const byDate = new Map(rows.map((r) => [r.date, r]));
        const next = checkinsRef.current.map((c) => {
          const d = byDate.get(c.date);
          if (!d || c.env?.humidity != null) return c;
          const sun = sunTimes(new Date(`${c.date}T12:00:00`), Number(lat), Number(lon));
          return {
            ...c,
            env: {
              ...c.env,
              aqi: d.aqi, pm25: d.pm25, tempMax: d.tempMax, feelsLikeMax: d.feelsLikeMax, humidity: d.humidity,
              pressure: d.pressure, pressureDelta24h: d.pressureDelta24h, uvMax: d.uvMax, rainMm: d.rainMm,
              moonIllumination: moonIlluminationOn(c.date), daylightHours: sun.daylightHours,
            },
          };
        });
        saveCheckins(next);
      })
      .catch(() => {});
  }, [ready, placeKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const todayCheckin = [...checkins].reverse().find((c) => c.date === today);
  const todayReading = [...readings].reverse().find((r) => r.date === today && (r.kind ?? "daily") === "daily");
  const dharmaReading = [...readings].reverse().find((r) => r.date === today && r.kind === "dharma");
  const chartReading = [...readings].reverse().find((r) => r.kind === "chart");
  const tarotReading = [...readings].reverse().find((r) => r.kind === "tarot");
  const physioReading = [...readings].reverse().find((r) => r.kind === "physio");
  const acuReading = [...readings].reverse().find((r) => r.kind === "acu");
  const recent = checkins.slice(-8, todayCheckin ? -1 : undefined);
  const todayDiaryCount = diary.filter((d) => d.date === today).length;
  const todayQuote = quoteById(quotes.picks.find((p) => p.date === today)?.id ?? "");

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
              {(["today", "charts", "dharma", "tarot", "physio", "acu", "progress", "library", "journal", "profile"] as const).map((t) => (
                <button key={t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
                  {UI[TAB_LABEL[t]][lang]}
                  {streamingTabs.includes(t) && <span className="live-dot" aria-label={UI.libWriting[lang]} />}
                </button>
              ))}
            </nav>
            <main>
              {tab === "today" && snapshot && (
                <div className="today">
                  {todayQuote ? (
                    <button className="card quote-banner" onClick={() => setTab("dharma")}>
                      <span className="eyebrow">📿 {UI.quoteOfDay[lang]}</span>
                      <span className="quote-line">{quoted(todayQuote.text[lang])}</span>
                      <span className="tiny muted">— {todayQuote.source[lang]}</span>
                    </button>
                  ) : (
                    <button className="card quote-banner empty" onClick={() => setTab("dharma")}>
                      <span>📿 {UI.chooseQuote[lang]} →</span>
                    </button>
                  )}
                  <Dashboard s={snapshot} env={env}>
                    <CosmosCard data={cosmos} />
                  </Dashboard>
                  <div className="today-cols">
                    <div className="stack">
                      <CheckInCard
                        existing={todayCheckin}
                        today={today}
                        onSave={(c) => saveCheckins([...checkins.filter((x) => x.id !== c.id), { ...c, env: envForCheckin() }])}
                        history={checkins}
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
                      env={env}
                      allCheckins={checkins}
                      quotes={quotes}
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
                    env={env}
                    allCheckins={checkins}
                    quotes={quotes}
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
                  onGoCheckin={() => setTab("today")}
                  words={<BuddhaWords state={quotes} today={today} onChange={saveQuotes} />}
                >
                  <GuidancePanel
                    kind="dharma"
                    diary={diary}
                    meditations={meditations}
                    profile={profile}
                    snapshot={snapshot}
                    cosmos={cosmos}
                    env={env}
                    allCheckins={checkins}
                    quotes={quotes}
                    checkin={todayCheckin}
                    recent={recent}
                    reading={dharmaReading}
                    today={today}
                  />
                </Dharma>
              )}
              {tab === "tarot" && snapshot && (
                <Tarot
                  reading={tarotReading}
                  today={today}
                  contextFor={(scope) =>
                    // For tarot, "profile" means the profile itself (no birth charts), to keep the reading focused.
                    scope === "profile"
                      ? describeProfile(profile)
                      : buildContextFor(scope, { diary, meditations, profile, snapshot, cosmos, env, allCheckins: checkins, checkin: todayCheckin, recent, today })
                  }
                />
              )}
              {tab === "physio" && snapshot && (
                <Physiognomy
                  reading={physioReading}
                  today={today}
                  gender={genderOf(profile)}
                  // "profile" here means the profile plus birth charts, so the reading can relate face and fate.
                  contextFor={(scope) =>
                    scope === "profile"
                      ? buildContextFor("profile", { diary, meditations, profile, snapshot, cosmos, env, allCheckins: checkins, checkin: todayCheckin, recent, today })
                      : "(They chose to share only their photos and the measurements; nothing else is known about them on purpose.)"
                  }
                />
              )}
              {tab === "acu" && (
                <Suspense fallback={<p className="muted center">✦</p>}>
                  <Acupressure reading={acuReading} today={today} />
                </Suspense>
              )}
              {tab === "progress" && (
                <Progress profile={profile} checkins={checkins} diary={diary} meditations={meditations} readings={readings} today={today} />
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
                    setQuotes(store.loadQuotes());
                  }}
                  onReset={() => {
                    void store.clear();
                    setProfile(null);
                    setCheckins([]);
                    setReadings([]);
                    setDiary([]);
                    setMeditations([]);
                    setQuotes({ picks: [], favorites: [] });
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
