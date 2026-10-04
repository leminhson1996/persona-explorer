import { useCallback, useEffect, useMemo, useState } from "react";
import { useT, type Bi } from "../lib/i18n";
import {
  ACUPOINTS, CUN_GUIDE, MERIDIANS, PRESS_GUIDE, REGIONS, SAFETY, SYMPTOMS, SYMPTOM_GROUPS,
  findEmergency, pointById, searchPoints, searchSymptoms, symptomsForPoint,
  type Acupoint, type Region, type Symptom, type SymptomGroup,
} from "../lib/acupoints";
import type { ViewId } from "../lib/body3d";
import BodyViewer, { type Highlight } from "./BodyViewer";
import AcuAsk, { pointsInAnswer } from "./AcuAsk";
import type { Reading } from "../lib/types";
import { useGuide } from "../lib/guideStore";

const L = {
  title: { en: "Acupressure points", vi: "Huyệt đạo & bấm huyệt" },
  intro: {
    en: "Tell it what's bothering you to see which points are traditionally used, how to find them, and where they are on the body.",
    vi: "Nhập triệu chứng để xem các huyệt thường dùng, cách tìm, cách bấm và vị trí của từng huyệt trên cơ thể.",
  },
  search: { en: "What's bothering you? e.g. dry cough, insomnia, stiff neck…", vi: "Bạn đang bị gì? Ví dụ: ho khan, mất ngủ, đau vai gáy…" },
  symptoms: { en: "Symptoms", vi: "Triệu chứng" },
  points: { en: "Points", vi: "Huyệt" },
  noMatch: { en: "No symptom in the list matches. Try other words, browse below, or describe it to Claude.", vi: "Chưa có triệu chứng phù hợp trong danh sách. Thử từ khác, chọn bên dưới, hoặc mô tả cho Claude." },
  allPoints: { en: "All points", vi: "Tất cả huyệt" },
  browseHint: { en: "Choose a symptom above, or tap any point on the body.", vi: "Chọn một triệu chứng ở trên, hoặc bấm vào một huyệt bất kỳ trên cơ thể." },
  pointsFor: { en: "Points to press", vi: "Các huyệt nên bấm" },
  selfCare: { en: "Also helps", vi: "Chăm sóc thêm" },
  seeDoctor: { en: "See a doctor if", vi: "Nên đi khám khi" },
  location: { en: "Location", vi: "Vị trí" },
  howToFind: { en: "How to find & press", vi: "Cách tìm & bấm" },
  uses: { en: "Traditionally used for", vi: "Công dụng" },
  usedIn: { en: "In this guide for", vi: "Có trong" },
  meridian: { en: "Channel", vi: "Đường kinh" },
  bilateral: { en: "Both sides", vi: "Huyệt đôi (hai bên)" },
  midline: { en: "Single, on the midline", vi: "Huyệt đơn (đường giữa)" },
  pregnancy: { en: "Avoid in pregnancy", vi: "Tránh khi mang thai" },
  showAll: { en: "Show all points", vi: "Hiện mọi huyệt" },
  rotate: { en: "Rotate", vi: "Tự xoay" },
  controls: { en: "Drag to turn · scroll or pinch to zoom · right-drag to move · tap a point", vi: "Kéo để xoay · cuộn/chụm để phóng to · kéo chuột phải để dời · chạm vào huyệt để xem" },
  pressGuide: { en: "How to press", vi: "Cách bấm huyệt" },
  cunGuide: { en: "Measuring in cun (thốn)", vi: "Cách đo bằng thốn" },
  safety: { en: "Safety", vi: "An toàn" },
  emergency: { en: "This needs medical help, not acupressure", vi: "Trường hợp này cần cấp cứu, không phải bấm huyệt" },
  back: { en: "All symptoms", vi: "Tất cả triệu chứng" },
  fromClaude: { en: "Points from Claude's answer", vi: "Các huyệt trong câu trả lời của Claude" },
  close: { en: "Close", vi: "Đóng" },
} satisfies Record<string, Bi>;

const VIEW_BUTTONS: { id: ViewId; label: Bi }[] = [
  { id: "front", label: { en: "Front", vi: "Trước" } },
  { id: "back", label: { en: "Back", vi: "Sau" } },
  { id: "left", label: { en: "Side", vi: "Nghiêng" } },
  { id: "head", label: { en: "Face", vi: "Mặt" } },
  { id: "headSide", label: { en: "Head side", vi: "Bên đầu" } },
  { id: "headBack", label: { en: "Nape", vi: "Gáy" } },
  { id: "hand", label: { en: "Palm", vi: "Lòng tay" } },
  { id: "handBack", label: { en: "Back of hand", vi: "Mu tay" } },
  { id: "foot", label: { en: "Foot", vi: "Bàn chân" } },
  { id: "sole", label: { en: "Sole", vi: "Gan chân" } },
];

// Survives tab switches (the component unmounts).
let memory: { symptom: string | null; selected: string | null; mode: "symptom" | "ask" } = { symptom: null, selected: null, mode: "symptom" };

interface Props {
  reading?: Reading;
  today: string;
}

export default function Acupressure({ reading, today }: Props) {
  const { tr, lang } = useT();
  const [query, setQuery] = useState("");
  const [symptomId, setSymptomId] = useState<string | null>(memory.symptom);
  const [selected, setSelected] = useState<string | null>(memory.selected);
  const [mode, setMode] = useState(memory.mode);
  const [view, setView] = useState<{ id: ViewId; nonce: number } | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(!memory.symptom);
  const session = useGuide("acu");

  useEffect(() => {
    memory = { symptom: symptomId, selected, mode };
  }, [symptomId, selected, mode]);

  const symptom = SYMPTOMS.find((s) => s.id === symptomId);
  const emergency = findEmergency(query);
  const symptomHits = useMemo(() => searchSymptoms(query), [query]);
  const pointHits = useMemo(() => searchPoints(query).slice(0, 6), [query]);

  // Points mentioned in Claude's latest answer, in order.
  const lastAnswer = session?.pending ?? [...(session?.messages ?? [])].reverse().find((m) => m.role === "assistant")?.content ?? "";
  const askIds = useMemo(() => pointsInAnswer(lastAnswer), [lastAnswer]);

  const listIds = mode === "ask" ? askIds : symptom?.points ?? [];
  const highlights: Highlight[] = useMemo(
    () => listIds.map((id, i) => ({ id, n: i + 1, color: MERIDIANS[pointById(id)!.meridian].color })),
    [listIds.join(",")], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const labelFor = useCallback((id: string) => {
    const p = pointById(id)!;
    return lang === "vi" ? `${p.vi} · ${p.code}` : `${p.code} ${p.zh.split(" ")[0]}`;
  }, [lang]);

  const chooseSymptom = (s: Symptom) => {
    setMode("symptom");
    setSymptomId(s.id);
    setSelected(s.points[0]);
    setQuery("");
    setPickerOpen(false);
  };
  const choosePoint = (id: string) => setSelected((cur) => (cur === id ? cur : id));

  const groups = Object.keys(SYMPTOM_GROUPS) as SymptomGroup[];

  return (
    <div className="acu">
      <section className="card acu-head">
        <div className="guidance-head">
          <div>
            <h2>🖐 {tr(L.title)}</h2>
            <p className="muted small">{tr(L.intro)}</p>
          </div>
        </div>

        <div className="acu-search">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && symptomHits[0]) chooseSymptom(symptomHits[0]);
            }}
            placeholder={tr(L.search)}
            aria-label={tr(L.search)}
          />
        </div>

        {emergency && (
          <div className="acu-alert" role="alert">
            <strong>🚑 {tr(L.emergency)}</strong>
            <p>{tr(emergency.message)}</p>
          </div>
        )}

        {query.trim() && !emergency && (
          <div className="acu-results">
            {symptomHits.length > 0 && (
              <div>
                <p className="eyebrow">{tr(L.symptoms)}</p>
                <div className="chips">
                  {symptomHits.map((s) => (
                    <button key={s.id} className="chip" onClick={() => chooseSymptom(s)}>
                      {SYMPTOM_GROUPS[s.group].icon} {tr(s.name)}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {pointHits.length > 0 && (
              <div>
                <p className="eyebrow">{tr(L.points)}</p>
                <div className="chips">
                  {pointHits.map((p) => (
                    <button key={p.id} className="chip" onClick={() => { setSelected(p.id); setQuery(""); }}>
                      {p.vi} · {p.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {!symptomHits.length && !pointHits.length && <p className="muted small">{tr(L.noMatch)}</p>}
          </div>
        )}

        {!query.trim() && !pickerOpen && (
          <div className="row wrap acu-current">
            {symptom && mode === "symptom" && <span className="chip on">{SYMPTOM_GROUPS[symptom.group].icon} {tr(symptom.name)}</span>}
            <button className="ghost small" onClick={() => setPickerOpen(true)}>☰ {tr(L.back)}</button>
          </div>
        )}

        {!query.trim() && pickerOpen && (
          <div className="acu-groups">
            {groups.map((g) => (
              <div key={g} className="acu-group">
                <span className="acu-group-label">{SYMPTOM_GROUPS[g].icon} {tr(SYMPTOM_GROUPS[g].label)}</span>
                <div className="chips">
                  {SYMPTOMS.filter((s) => s.group === g).map((s) => (
                    <button key={s.id} className={`chip ${mode === "symptom" && s.id === symptomId ? "on" : ""}`} onClick={() => chooseSymptom(s)}>
                      {tr(s.name)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="acu-main">
        <section className="card acu-stage">
          <BodyViewer
            highlights={highlights}
            selected={selected}
            onSelect={choosePoint}
            view={view}
            showAll={showAll || (!symptom && mode === "symptom")}
            autoRotate={autoRotate}
            labelFor={labelFor}
          />
          <div className="acu-views">
            {VIEW_BUTTONS.map((b) => (
              <button key={b.id} className="chip" onClick={() => setView({ id: b.id, nonce: Date.now() })}>{tr(b.label)}</button>
            ))}
          </div>
          <div className="row between acu-toggles">
            <label className="tiny"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> {tr(L.showAll)}</label>
            <label className="tiny"><input type="checkbox" checked={autoRotate} onChange={(e) => setAutoRotate(e.target.checked)} /> {tr(L.rotate)}</label>
          </div>
          <p className="tiny muted">{tr(L.controls)}</p>
        </section>

        <section className="acu-side">
          {mode === "ask" ? (
            <div className="card">
              <div className="row between">
                <h3>✦ {tr(L.fromClaude)}</h3>
                <button className="ghost small" onClick={() => setMode("symptom")}>← {tr(L.back)}</button>
              </div>
              <PointList ids={askIds} selected={selected} onSelect={choosePoint} onSymptom={chooseSymptom} />
            </div>
          ) : symptom ? (
            <div className="card">
              <p className="eyebrow">{SYMPTOM_GROUPS[symptom.group].icon} {tr(SYMPTOM_GROUPS[symptom.group].label)}</p>
              <h3>{tr(symptom.name)}</h3>
              <p className="small">{tr(symptom.about)}</p>
              <h4>{tr(L.pointsFor)}</h4>
              <PointList ids={symptom.points} notes={symptom.notes} selected={selected} onSelect={choosePoint} onSymptom={chooseSymptom} current={symptom.id} />
              <h4>🌿 {tr(L.selfCare)}</h4>
              <p className="small">{tr(symptom.selfCare)}</p>
              <div className="acu-doctor">
                <strong>🩺 {tr(L.seeDoctor)}</strong>
                <p className="small">{tr(symptom.seeDoctor)}</p>
              </div>
            </div>
          ) : (
            <div className="card">
              <h3>{tr(L.allPoints)}</h3>
              <p className="small muted">{tr(L.browseHint)}</p>
              {selected && <PointCard p={pointById(selected)!} open onToggle={() => setSelected(null)} onSymptom={chooseSymptom} />}
              <RegionIndex selected={selected} onSelect={choosePoint} />
            </div>
          )}
          {mode === "symptom" && symptom && selected && !symptom.points.includes(selected) && (
            <div className="card">
              <PointCard p={pointById(selected)!} open onToggle={() => setSelected(null)} onSymptom={chooseSymptom} />
            </div>
          )}
        </section>
      </div>

      <AcuAsk reading={reading} today={today} onAnswered={() => setMode("ask")} onShowPoints={() => { setMode("ask"); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

      <section className="card acu-guides">
        <details>
          <summary>👆 {tr(L.pressGuide)}</summary>
          <p className="small">{tr(PRESS_GUIDE)}</p>
        </details>
        <details>
          <summary>📏 {tr(L.cunGuide)}</summary>
          <p className="small">{tr(CUN_GUIDE)}</p>
        </details>
        <details open>
          <summary>⚠️ {tr(L.safety)}</summary>
          <p className="small">{tr(SAFETY)}</p>
        </details>
      </section>
    </div>
  );
}

function PointList({ ids, notes, selected, onSelect, onSymptom, current }: {
  ids: string[];
  notes?: Record<string, Bi>;
  selected: string | null;
  onSelect: (id: string) => void;
  onSymptom: (s: Symptom) => void;
  current?: string;
}) {
  return (
    <ol className="acu-list">
      {ids.map((id, i) => {
        const p = pointById(id);
        if (!p) return null;
        return (
          <li key={id}>
            <PointCard p={p} n={i + 1} note={notes?.[id]} open={selected === id} onToggle={() => onSelect(id)} onSymptom={onSymptom} current={current} />
          </li>
        );
      })}
    </ol>
  );
}

function PointCard({ p, n, note, open, onToggle, onSymptom, current }: {
  p: Acupoint;
  n?: number;
  note?: Bi;
  open: boolean;
  onToggle: () => void;
  onSymptom: (s: Symptom) => void;
  current?: string;
}) {
  const { tr } = useT();
  const m = MERIDIANS[p.meridian];
  const used = symptomsForPoint(p.id).filter((s) => s.id !== current);
  return (
    <article className={`acu-point ${open ? "open" : ""}`} style={{ "--c": m.color } as React.CSSProperties}>
      <button className="acu-point-head" onClick={onToggle} aria-expanded={open}>
        {n !== undefined && <span className="acu-num">{n}</span>}
        <span className="acu-name">
          <strong>{p.vi}</strong>
          <span className="tiny muted"> {p.code} · {p.zh}{p.pregnancy ? " · 🤰" : ""}</span>
        </span>
      </button>
      {note && <p className="tiny acu-note">{tr(note)}</p>}
      {open && (
        <div className="acu-point-body">
          <p className="tiny muted">
            <span className="acu-dot" /> {tr(L.meridian)}: {tr(m.name)} · {tr(p.bilateral ? L.bilateral : L.midline)} · “{p.en}”
          </p>
          <p className="small"><strong>📍 {tr(L.location)}:</strong> {tr(p.location)}</p>
          {p.tip && <p className="small"><strong>👆 {tr(L.howToFind)}:</strong> {tr(p.tip)}</p>}
          <p className="small"><strong>✦ {tr(L.uses)}:</strong> {tr(p.uses)}</p>
          {p.caution && <p className="small acu-caution">⚠️ {tr(p.caution)}</p>}
          {used.length > 0 && (
            <div className="chips">
              <span className="tiny muted">{tr(L.usedIn)}:</span>
              {used.map((s) => (
                <button key={s.id} className="chip static" onClick={() => onSymptom(s)}>{tr(s.name)}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function RegionIndex({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { tr } = useT();
  return (
    <div className="acu-regions">
      {(Object.keys(REGIONS) as Region[]).map((r) => {
        const pts = ACUPOINTS.filter((p) => p.region === r);
        if (!pts.length) return null;
        return (
          <div key={r}>
            <p className="eyebrow">{tr(REGIONS[r])}</p>
            <div className="chips">
              {pts.map((p) => (
                <button key={p.id} className={`chip ${selected === p.id ? "on" : ""}`} onClick={() => onSelect(p.id)}>{p.vi}</button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
