import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useT, type Bi } from "../lib/i18n";
import { guide, useGuide } from "../lib/guideStore";
import {
  FACE_ELEMENT, HAND_TYPE, describeFace, describeHand, faceLandmarker, faceQuality, findHairline, hairSegmenter, handLandmarker, measureFace, measureHand,
  type FaceMetrics, type HandMetrics, type PhysioRecord,
} from "../lib/physiognomy";
import type { ChatImage, ContextScope, Reading } from "../lib/types";
import ChatThread from "./ChatThread";

type SlotId = "face" | "left" | "right";

interface Slot {
  dataUrl: string; // downscaled JPEG sent to Claude
  width: number;
  height: number;
  points: { x: number; y: number }[]; // normalized landmarks, for the overlay
  hairlineY?: number | null; // pixels
  face?: FaceMetrics;
  hand?: HandMetrics;
  error?: Bi;
}

// ---------- Draft (survives tab switches; photos stay in memory only) ----------

interface Draft {
  slots: Partial<Record<SlotId, Slot>>;
  own: boolean;
  saveThumbs: boolean;
  view: "setup" | "reading";
  sent: Partial<Record<SlotId, string>>; // photos of the conversation being shown
}
let draft: Draft = { slots: {}, own: false, saveThumbs: false, view: "setup", sent: {} };
let draftInit = false;
const listeners = new Set<() => void>();
const setDraft = (patch: Partial<Draft>) => {
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
};
const useDraft = () => useSyncExternalStore((l) => (listeners.add(l), () => void listeners.delete(l)), () => draft);

const L = {
  title: { en: "Physiognomy & palm reading", vi: "Nhân tướng học & xem chỉ tay" },
  intro: {
    en: "Photograph your face and/or palms. Landmarks are measured in your browser with MediaPipe (478 face points, 21 hand points), then Claude reads the photos with Eastern physiognomy and palmistry.",
    vi: "Chụp khuôn mặt và/hoặc lòng bàn tay. Các điểm mốc được đo ngay trong trình duyệt bằng MediaPipe (478 điểm trên mặt, 21 điểm trên tay), rồi Claude xem ảnh theo nhân tướng học Á Đông và thuật xem chỉ tay.",
  },
  face: { en: "Face", vi: "Khuôn mặt" },
  left: { en: "Left palm", vi: "Lòng bàn tay trái" },
  right: { en: "Right palm", vi: "Lòng bàn tay phải" },
  take: { en: "Take photo", vi: "Chụp ảnh" },
  upload: { en: "Upload", vi: "Tải ảnh" },
  remove: { en: "Remove", vi: "Xóa" },
  analyzing: { en: "Measuring landmarks…", vi: "Đang đo điểm mốc…" },
  noFace: { en: "No face found. Use a clear, front-facing photo.", vi: "Không tìm thấy khuôn mặt. Hãy dùng ảnh rõ nét, nhìn thẳng." },
  manyFaces: { en: "More than one face found. Use a photo of just yourself.", vi: "Có nhiều hơn một khuôn mặt. Hãy dùng ảnh chỉ có mình bạn." },
  noHand: { en: "No hand found. Show your open palm, fingers slightly apart.", vi: "Không tìm thấy bàn tay. Hãy xòe lòng bàn tay, các ngón hơi tách nhau." },
  loadFail: { en: "Couldn't load the landmark model. Check the server is running.", vi: "Không tải được mô hình đo điểm mốc. Hãy kiểm tra server đang chạy." },
  tipsTitle: { en: "For an accurate reading", vi: "Để phân tích chính xác" },
  tipsFace: { en: "Face: look straight at the camera, even daylight, hair off the forehead, no glasses, neutral expression.", vi: "Khuôn mặt: nhìn thẳng vào máy, ánh sáng tự nhiên đều, vén tóc để lộ trán, bỏ kính, biểu cảm tự nhiên." },
  tipsHand: { en: "Palm: open hand facing the camera, fingers slightly apart, bright light from the side so the lines show, whole hand and wrist in frame.", vi: "Bàn tay: xòe lòng bàn tay hướng vào máy, các ngón hơi tách, ánh sáng mạnh chiếu xiên để thấy rõ chỉ tay, lấy trọn bàn tay và cổ tay." },
  tipsWhich: { en: "In Eastern tradition men read the left hand, women the right; in Western palmistry your dominant hand shows the present, the other your potential. Both is best.", vi: "Theo truyền thống phương Đông: nam xem tay trái, nữ xem tay phải; theo phương Tây: tay thuận cho thấy hiện tại, tay kia cho thấy tiềm năng. Chụp cả hai là tốt nhất." },
  own: { en: "These are photos of me (only analyze your own face and hands).", vi: "Đây là ảnh của chính mình (chỉ phân tích khuôn mặt và bàn tay của bạn)." },
  saveThumbs: { en: "Also keep small thumbnails in my_data (photos are never stored in full)", vi: "Lưu thêm ảnh thu nhỏ vào my_data (ảnh gốc không bao giờ được lưu)" },
  privacy: {
    en: "Photos are sent to Claude (Anthropic) for this analysis and aren't written to disk unless you tick the thumbnail option.",
    vi: "Ảnh sẽ được gửi cho Claude (Anthropic) để phân tích và không được ghi xuống ổ đĩa, trừ khi bạn chọn lưu ảnh thu nhỏ.",
  },
  analyze: { en: "Analyze", vi: "Phân tích" },
  needPhoto: { en: "Add at least one photo.", vi: "Hãy thêm ít nhất một ảnh." },
  needOwn: { en: "Please confirm these are your own photos.", vi: "Hãy xác nhận đây là ảnh của chính bạn." },
  readingTitle: { en: "Reading", vi: "Lời luận giải" },
  newAnalysis: { en: "New analysis", vi: "Phân tích mới" },
  last: { en: "See last analysis", vi: "Xem lần gần nhất" },
  scopeOnly: { en: "Photos & measurements only", vi: "Chỉ ảnh & số đo" },
  scopeProfile: { en: "With my Profile", vi: "Kèm Hồ sơ" },
  scopeHint: { en: "Adding your Profile lets the reading connect to your birth charts and life situation.", vi: "Thêm Hồ sơ để lời luận giải liên hệ với lá số và hoàn cảnh sống của bạn." },
  shape: { en: "Face shape", vi: "Hình tướng" },
  noHairline: { en: "hairline not found", vi: "không thấy chân tóc" },
  thirds: { en: "Three courts", vi: "Tam đình" },
  symmetry: { en: "Symmetry", vi: "Độ cân xứng" },
  eyes: { en: "Eye spacing", vi: "Khoảng cách mắt" },
  handType: { en: "Hand type", vi: "Loại bàn tay" },
  ratio24: { en: "Index/ring", vi: "Ngón trỏ/áp út" },
  fingers: { en: "Fingers/palm", vi: "Ngón/lòng bàn tay" },
  camTitle: { en: "Camera", vi: "Máy ảnh" },
  capture: { en: "Capture", vi: "Chụp" },
  close: { en: "Close", vi: "Đóng" },
  camFail: { en: "Couldn't open the camera. Allow camera access or upload a photo instead.", vi: "Không mở được máy ảnh. Hãy cho phép quyền camera hoặc tải ảnh lên." },
  disclaimer: {
    en: "Physiognomy and palmistry are cultural traditions, not science. Use them as a mirror for reflection: “the face follows the heart” (tướng tùy tâm sinh).",
    vi: "Nhân tướng học và xem chỉ tay là truyền thống văn hóa, không phải khoa học. Hãy xem như tấm gương để chiêm nghiệm: “tướng tùy tâm sinh, tướng tùy tâm diệt”.",
  },
} satisfies Record<string, Bi>;

const REQUEST: Bi = {
  en: `Please give me a physiognomy and palm reading from the attached photos and measurements (Markdown, about 600–900 words). Use the sections that apply:
### 🧭 Overall impression (Ngũ hành face shape, overall energy)
### 🏛 Three courts (Tam đình) and Five Peaks (Ngũ nhạc)
### 👁 Five features (Ngũ quan: brows, eyes, nose, mouth, ears)
### 🗺 Notable palaces of the face (12 cung: Mệnh/Ấn đường, Quan lộc, Tài bạch, Phu thê, Tử tức, Điền trạch, Tật ách…)
### ✋ Hand shape and fingers
### 〰 Major palm lines (life, head, heart, fate, sun) and mounts
### 🌱 Strengths to use and how to grow (tướng tùy tâm sinh)
Only describe what you can actually see; say so when a line or feature isn't clear in the photo.`,
  vi: `Hãy xem nhân tướng và chỉ tay cho mình từ các ảnh và số đo đính kèm (Markdown, khoảng 600–900 chữ). Dùng những phần phù hợp với ảnh có:
### 🧭 Ấn tượng tổng quan (hình tướng Ngũ hành, khí sắc chung)
### 🏛 Tam đình và Ngũ nhạc
### 👁 Ngũ quan (mày, mắt, mũi, miệng, tai)
### 🗺 Các cung nổi bật trên mặt (12 cung: Mệnh/Ấn đường, Quan lộc, Tài bạch, Phu thê, Tử tức, Điền trạch, Tật ách…)
### ✋ Hình dáng bàn tay và ngón tay
### 〰 Các đường chỉ chính (sinh đạo, trí đạo, tâm đạo, vận mệnh, thái dương) và các gò
### 🌱 Điểm mạnh nên phát huy và cách tu dưỡng (tướng tùy tâm sinh)
Chỉ mô tả những gì thật sự nhìn thấy; nói rõ khi một đường chỉ hay đặc điểm không rõ trong ảnh.`,
};

// ---------- Image helpers ----------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Downscale to ≤1568 px on the long edge (Claude's sweet spot) as JPEG. */
async function prepare(src: string, max = 1568, quality = 0.88) {
  const img = await loadImage(src);
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, dataUrl: canvas.toDataURL("image/jpeg", quality) };
}

const toChatImage = (dataUrl: string): ChatImage => ({ mediaType: "image/jpeg", data: dataUrl.split(",")[1] });

async function analyzeSlot(id: SlotId, src: string): Promise<Slot> {
  const { canvas, dataUrl } = await prepare(src);
  const base = { dataUrl, width: canvas.width, height: canvas.height, points: [] as { x: number; y: number }[] };
  try {
    if (id === "face") {
      const res = (await faceLandmarker()).detect(canvas);
      if (!res.faceLandmarks.length) return { ...base, error: L.noFace };
      if (res.faceLandmarks.length > 1) return { ...base, error: L.manyFaces };
      const lm = res.faceLandmarks[0];
      const hairlineY = await findHairline(canvas, lm);
      return { ...base, points: lm, hairlineY, face: measureFace(lm, canvas.width, canvas.height, hairlineY) };
    }
    const res = (await handLandmarker()).detect(canvas);
    if (!res.landmarks.length) return { ...base, error: L.noHand };
    // Take the largest hand in the photo.
    const sizes = res.landmarks.map((lm) => Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y));
    const i = sizes.indexOf(Math.max(...sizes));
    return { ...base, points: res.landmarks[i], hand: measureHand(res.worldLandmarks[i], id) };
  } catch (err) {
    console.error(err);
    return { ...base, error: L.loadFail };
  }
}

// ---------- Overlay ----------

const HAND_BONES = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12], [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]];

function Overlay({ id, slot }: { id: SlotId; slot: Slot }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    let cancelled = false;
    loadImage(slot.dataUrl).then((img) => {
      if (cancelled) return;
      c.width = slot.width;
      c.height = slot.height;
      const g = c.getContext("2d")!;
      g.drawImage(img, 0, 0);
      const s = Math.max(1, slot.width / 500);
      const P = (i: number) => ({ x: slot.points[i].x * slot.width, y: slot.points[i].y * slot.height });
      if (id === "face" && slot.points.length) {
        g.fillStyle = "rgba(201,168,255,0.8)";
        slot.points.forEach((p) => g.fillRect(p.x * slot.width - s / 2, p.y * slot.height - s / 2, s, s));
        // Tam đình guides: top (10), glabella (9), subnasale (2), chin (152).
        g.strokeStyle = "rgba(245,207,122,0.9)";
        g.lineWidth = 2 * s;
        g.setLineDash([8 * s, 6 * s]);
        const xs = [P(234).x, P(454).x];
        const top = slot.face?.hairlineFound && slot.hairlineY ? slot.hairlineY : P(10).y;
        [top, P(9).y, P(2).y, P(152).y].forEach((y) => {
          g.beginPath();
          g.moveTo(Math.min(...xs) - 20 * s, y);
          g.lineTo(Math.max(...xs) + 20 * s, y);
          g.stroke();
        });
      }
      if (id !== "face" && slot.points.length) {
        g.strokeStyle = "rgba(111,179,255,0.95)";
        g.lineWidth = 3 * s;
        HAND_BONES.forEach(([a, b]) => {
          g.beginPath();
          g.moveTo(P(a).x, P(a).y);
          g.lineTo(P(b).x, P(b).y);
          g.stroke();
        });
        g.fillStyle = "rgba(245,207,122,1)";
        slot.points.forEach((_, i) => {
          g.beginPath();
          g.arc(P(i).x, P(i).y, 4 * s, 0, Math.PI * 2);
          g.fill();
        });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, slot]);
  return <canvas ref={ref} className="physio-canvas" />;
}

// ---------- Camera ----------

function CameraModal({ facing, onShot, onClose }: { facing: "user" | "environment"; onShot: (dataUrl: string) => void; onClose: () => void }) {
  const { tr } = useT();
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState(false);
  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1440 } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setErr(true));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, [facing]);
  const shoot = () => {
    const v = video.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const g = c.getContext("2d")!;
    // The preview is mirrored for selfies; the saved photo is not.
    g.drawImage(v, 0, 0);
    onShot(c.toDataURL("image/jpeg", 0.92));
  };
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={tr(L.camTitle)}>
      <div className="modal-body card">
        {err ? <p className="error">{tr(L.camFail)}</p> : <video ref={video} autoPlay playsInline muted className={facing === "user" ? "mirror" : ""} />}
        <div className="actions">
          <button className="ghost" onClick={onClose}>{tr(L.close)}</button>
          {!err && <button className="primary" onClick={shoot}>📸 {tr(L.capture)}</button>}
        </div>
      </div>
    </div>
  );
}

// ---------- Page ----------

function Metrics({ face, hand }: { face?: FaceMetrics; hand?: HandMetrics }) {
  const { tr } = useT();
  if (face)
    return (
      <dl className="kv small">
        <dt>{tr(L.shape)}</dt><dd>{tr(FACE_ELEMENT[face.shape.element].label)} · {face.shape.scores[face.shape.element]}%</dd>
        <dt>{tr(L.thirds)}</dt><dd>{Math.round(face.thirds.upper * 100)} · {Math.round(face.thirds.middle * 100)} · {Math.round(face.thirds.lower * 100)}%{!face.hairlineFound && <span className="tiny muted"> ({tr(L.noHairline)})</span>}</dd>
        <dt>{tr(L.eyes)}</dt><dd>{face.eyeSpacingToEyeWidth}×</dd>
        <dt>{tr(L.symmetry)}</dt><dd>{face.symmetry}/100</dd>
      </dl>
    );
  if (hand)
    return (
      <dl className="kv small">
        <dt>{tr(L.handType)}</dt><dd>{tr(HAND_TYPE[hand.type].label)}</dd>
        <dt>{tr(L.fingers)}</dt><dd>{hand.fingerToPalm}</dd>
        <dt>{tr(L.ratio24)}</dt><dd>{hand.indexToRing}</dd>
      </dl>
    );
  return null;
}

interface Props {
  reading?: Reading;
  today: string;
  contextFor: (scope: ContextScope) => string;
}

export default function Physiognomy({ reading, today, contextFor }: Props) {
  const { tr, t, lang } = useT();
  const d = useDraft();
  const session = useGuide("physio");
  const busy = (session?.pending ?? null) !== null;
  const [camera, setCamera] = useState<SlotId | null>(null);
  const [working, setWorking] = useState<SlotId | null>(null);
  const [scope, setScope] = useState<"cards" | "profile">("cards");
  const [problem, setProblem] = useState<Bi | null>(null);
  const files = useRef<Partial<Record<SlotId, HTMLInputElement | null>>>({});

  useEffect(() => {
    guide.ensure("physio", "physio", today, reading);
  }, [today, reading]);
  useEffect(() => {
    if (draftInit || !session) return;
    draftInit = true;
    if (session.physio && session.messages.length) setDraft({ view: "reading" });
  }, [session]);

  // Warm up the models in the background.
  useEffect(() => {
    void faceLandmarker().catch(() => {});
    void handLandmarker().catch(() => {});
    void hairSegmenter().catch(() => {});
  }, []);

  const setPhoto = async (id: SlotId, src: string) => {
    setWorking(id);
    const slot = await analyzeSlot(id, src);
    setWorking(null);
    setDraft({ slots: { ...draft.slots, [id]: slot } });
  };

  const onFile = (id: SlotId, f?: File) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => void setPhoto(id, String(r.result));
    r.readAsDataURL(f);
  };

  const analyze = async () => {
    const ids = (["face", "left", "right"] as SlotId[]).filter((id) => d.slots[id] && !d.slots[id]!.error);
    if (!ids.length) return setProblem(L.needPhoto);
    if (!d.own) return setProblem(L.needOwn);
    setProblem(null);
    const face = d.slots.face?.face;
    const hands = ids.filter((id) => id !== "face").map((id) => d.slots[id]!.hand!).filter(Boolean);
    const thumbnails = d.saveThumbs ? await Promise.all(ids.map(async (id) => (await prepare(d.slots[id]!.dataUrl, 240, 0.7)).dataUrl)) : undefined;
    const record: PhysioRecord = { subject: face && hands.length ? "both" : face ? "face" : "hand", face, hands, thumbnails };
    const labels = ids.map((id, i) => `Photo ${i + 1}: ${id === "face" ? "face (front view)" : `${id} palm`}`);
    const content = [
      tr(REQUEST),
      "",
      labels.join("; "),
      face ? describeFace(face) : "",
      ...hands.map(describeHand),
      scope === "cards" ? (lang === "vi" ? "\nChỉ dựa vào ảnh và số đo; bạn cố ý không biết gì thêm về mình." : "\nUse only the photos and measurements; you intentionally know nothing else about me.") : "",
    ].filter(Boolean).join("\n");
    guide.restart("physio", today, scope, undefined, record);
    void guide.send("physio", [{ role: "user", content, images: ids.map((id) => toChatImage(d.slots[id]!.dataUrl)) }], { lang, context: contextFor(scope) });
    setDraft({ view: "reading", sent: Object.fromEntries(ids.map((id) => [id, d.slots[id]!.dataUrl])) });
  };

  // ----- Reading view -----
  if (d.view === "reading" && session?.physio) {
    const rec = session.physio;
    const photos = Object.values(d.sent).length && session.messages[0]?.images ? Object.values(d.sent) : rec.thumbnails ?? [];
    return (
      <div className="today physio">
        <section className="card">
          <div className="guidance-head">
            <div>
              <h2>👤 {tr(L.readingTitle)}</h2>
              <p className="muted small">{tr(L.disclaimer)}</p>
            </div>
            {busy ? (
              <button className="ghost" onClick={() => guide.stop("physio")}>■ {t("stop")}</button>
            ) : (
              <button className="primary" onClick={() => setDraft({ view: "setup" })}>📷 {tr(L.newAnalysis)}</button>
            )}
          </div>
          <div className="physio-summary">
            {photos.map((src, i) => <img key={i} src={src} alt="" className="physio-thumb" />)}
            {rec.face && <Metrics face={rec.face} />}
            {rec.hands?.map((h) => <Metrics key={h.side} hand={h} />)}
          </div>
        </section>
        <section className="card guidance">
          <ChatThread kind="physio" reading={reading} contextFor={contextFor} />
        </section>
      </div>
    );
  }

  // ----- Setup view -----
  const slotCard = (id: SlotId, label: Bi) => {
    const slot = d.slots[id];
    return (
      <div className="physio-slot" key={id}>
        <h4>{id === "face" ? "🙂" : "✋"} {tr(label)}</h4>
        {working === id ? (
          <div className="physio-empty shimmer">{tr(L.analyzing)}</div>
        ) : slot ? (
          <>
            <Overlay id={id} slot={slot} />
            {slot.error ? <p className="error small">⚠️ {tr(slot.error)}</p> : <Metrics face={slot.face} hand={slot.hand} />}
            {slot.face && faceQuality(slot.face).map((w, i) => <p key={i} className="hint tiny">⚠️ {tr(w)}</p>)}
          </>
        ) : (
          <div className="physio-empty">{id === "face" ? "🙂" : "🖐"}</div>
        )}
        <div className="row wrap">
          <button className="ghost" onClick={() => setCamera(id)}>📷 {tr(L.take)}</button>
          <button className="ghost" onClick={() => files.current[id]?.click()}>🖼 {tr(L.upload)}</button>
          {slot && <button className="link danger-link" onClick={() => { const s = { ...draft.slots }; delete s[id]; setDraft({ slots: s }); }}>{tr(L.remove)}</button>}
          <input ref={(el) => void (files.current[id] = el)} type="file" accept="image/*" capture={id === "face" ? "user" : "environment"} hidden onChange={(e) => onFile(id, e.target.files?.[0])} />
        </div>
      </div>
    );
  };

  return (
    <div className="today physio">
      <section className="card">
        <h2>👤 {tr(L.title)}</h2>
        <p className="muted small">{tr(L.intro)}</p>
        <div className="physio-slots">
          {slotCard("face", L.face)}
          {slotCard("left", L.left)}
          {slotCard("right", L.right)}
        </div>

        <details className="tips">
          <summary className="small"><strong>💡 {tr(L.tipsTitle)}</strong></summary>
          <ul className="advice">
            <li className="small">{tr(L.tipsFace)}</li>
            <li className="small">{tr(L.tipsHand)}</li>
            <li className="small">{tr(L.tipsWhich)}</li>
          </ul>
        </details>

        <div className="scope-picker">
          <div className="chips" role="radiogroup">
            {(["cards", "profile"] as const).map((v) => (
              <button key={v} role="radio" aria-checked={scope === v} className={`chip ${scope === v ? "on" : ""}`} onClick={() => setScope(v)}>
                {tr(v === "cards" ? L.scopeOnly : L.scopeProfile)}
              </button>
            ))}
          </div>
          <p className="tiny muted">{tr(L.scopeHint)}</p>
        </div>
        <label className="check small"><input type="checkbox" checked={d.own} onChange={(e) => setDraft({ own: e.target.checked })} /> {tr(L.own)}</label>
        <label className="check small"><input type="checkbox" checked={d.saveThumbs} onChange={(e) => setDraft({ saveThumbs: e.target.checked })} /> {tr(L.saveThumbs)}</label>
        <p className="tiny muted">🔒 {tr(L.privacy)}</p>
        {problem && <p className="error small">⚠️ {tr(problem)}</p>}
        <div className="actions">
          {session?.physio && session.messages.length > 0 && <button className="ghost" onClick={() => setDraft({ view: "reading" })}>{tr(L.last)}</button>}
          <button className="primary" onClick={() => void analyze()} disabled={busy || working !== null}>🔍 {tr(L.analyze)}</button>
        </div>
      </section>
      <p className="tiny muted center">{tr(L.disclaimer)}</p>
      {camera && (
        <CameraModal
          facing={camera === "face" ? "user" : "environment"}
          onClose={() => setCamera(null)}
          onShot={(src) => {
            const id = camera;
            setCamera(null);
            void setPhoto(id, src);
          }}
        />
      )}
    </div>
  );
}
