// Face & hand measurements from MediaPipe landmarks, mapped onto traditional physiognomy
// (Tam đình, Ngũ hành face shapes, Ngũ quan) and palmistry hand types. Runs fully in the browser.
import type { FaceLandmarker, HandLandmarker, ImageSegmenter, NormalizedLandmark, Landmark } from "@mediapipe/tasks-vision";
import type { Bi } from "./i18n";

// ---------- Records kept with a reading ----------

export interface FaceMetrics {
  thirds: { upper: number; middle: number; lower: number }; // share of hairline→chin (or landmark 10→chin when no hairline was found)
  hairlineFound: boolean; // true when the hair segmenter located the real hairline
  lengthToWidth: number; // face height (10→152) / cheekbone width
  foreheadToCheek: number;
  jawToCheek: number;
  chinToJaw: number;
  eyeSpacingToEyeWidth: number; // inner-eye gap / average eye width (≈1 is the classic "one eye apart")
  eyeOpenness: number; // eye height / eye width
  browToEyeLength: number; // eyebrow length / eye length
  browEyeGap: number; // brow-to-eye distance / eye width
  noseWidthToEyeGap: number; // alar width / inner-eye gap
  noseLengthToFace: number; // nasion→subnasale / face height
  mouthToNoseWidth: number;
  lipRatio: number; // upper lip height / lower lip height
  philtrumToFace: number;
  symmetry: number; // 0–100, higher = more symmetric
  yaw: number; // head turn, as a share of face width (0 = frontal)
  roll: number; // degrees
  shape: { element: FaceElement; scores: Record<FaceElement, number> };
}

export type FaceElement = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export type HandElement = "earth" | "air" | "water" | "fire";

export interface HandMetrics {
  side: "left" | "right";
  palmLengthToWidth: number;
  fingerToPalm: number; // middle finger / palm length
  indexToRing: number; // 2D:4D
  pinkyToRing: number;
  thumbToIndex: number;
  spread: number; // average angle between neighbouring fingers, degrees
  type: HandElement;
}

export interface PhysioRecord {
  subject: "face" | "hand" | "both";
  face?: FaceMetrics;
  hands?: HandMetrics[];
  thumbnails?: string[]; // small JPEG data URLs, only if the person chose to save them
}

// ---------- Loading the models (lazily, once) ----------

let visionPromise: Promise<typeof import("@mediapipe/tasks-vision")> | null = null;
let facePromise: Promise<FaceLandmarker> | null = null;
let handPromise: Promise<HandLandmarker> | null = null;
let hairPromise: Promise<ImageSegmenter> | null = null;
const vision = () => (visionPromise ??= import("@mediapipe/tasks-vision"));
const fileset = async () => (await vision()).FilesetResolver.forVisionTasks("/mediapipe/wasm");

export function faceLandmarker() {
  return (facePromise ??= (async () => {
    const v = await vision();
    return v.FaceLandmarker.createFromOptions(await fileset(), {
      baseOptions: { modelAssetPath: "/mediapipe/models/face_landmarker.task", delegate: "CPU" },
      runningMode: "IMAGE",
      numFaces: 2,
      minFaceDetectionConfidence: 0.3,
      minFacePresenceConfidence: 0.3,
    });
  })());
}

export function hairSegmenter() {
  return (hairPromise ??= (async () => {
    const v = await vision();
    return v.ImageSegmenter.createFromOptions(await fileset(), {
      baseOptions: { modelAssetPath: "/mediapipe/models/hair_segmenter.tflite", delegate: "CPU" },
      runningMode: "IMAGE",
      outputCategoryMask: true,
      outputConfidenceMasks: false,
    });
  })());
}

/**
 * Find the real hairline: walk up the facial midline from the top face landmark until the hair
 * segmenter says "hair" for a few pixels in a row. Returns a y in pixels, or null.
 */
export async function findHairline(image: HTMLCanvasElement, landmarks: NormalizedLandmark[]): Promise<number | null> {
  try {
    const seg = await hairSegmenter();
    const result = seg.segment(image);
    const mask = result.categoryMask;
    if (!mask) return null;
    const data = mask.getAsUint8Array();
    const w = mask.width;
    const h = mask.height;
    const faceW = Math.abs(landmarks[454].x - landmarks[234].x) * w;
    const startY = Math.floor(landmarks[10].y * h);
    const cx = landmarks[10].x * w;
    const hits: number[] = [];
    // Sample a few columns around the midline so a parting or a stray strand doesn't fool us.
    for (const dx of [-0.08, -0.04, 0, 0.04, 0.08]) {
      const x = Math.round(cx + dx * faceW);
      if (x < 0 || x >= w) continue;
      let run = 0;
      for (let y = startY; y >= 0; y--) {
        run = data[y * w + x] > 0 ? run + 1 : 0;
        if (run >= Math.max(3, Math.round(h * 0.004))) {
          hits.push(y + run - 1);
          break;
        }
      }
    }
    mask.close();
    result.close?.();
    if (hits.length < 3) return null;
    hits.sort((a, b) => a - b);
    return (hits[Math.floor(hits.length / 2)] / h) * image.height;
  } catch {
    return null;
  }
}

export function handLandmarker() {
  return (handPromise ??= (async () => {
    const v = await vision();
    return v.HandLandmarker.createFromOptions(await fileset(), {
      baseOptions: { modelAssetPath: "/mediapipe/models/hand_landmarker.task", delegate: "CPU" },
      runningMode: "IMAGE",
      numHands: 2,
    });
  })());
}

// ---------- Geometry ----------

type P = { x: number; y: number; z?: number };
const dist = (a: P, b: P) => Math.hypot(a.x - b.x, a.y - b.y, (a.z ?? 0) - (b.z ?? 0));
const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Normalized landmarks → pixel space, so ratios aren't distorted by the image's aspect ratio. */
const toPx = (lm: NormalizedLandmark[], w: number, h: number): P[] => lm.map((p) => ({ x: p.x * w, y: p.y * h }));

// MediaPipe face-mesh indices used below.
const F = {
  top: 10, chin: 152, glabella: 9, nasion: 168, subnasale: 2, noseTip: 1,
  cheekR: 234, cheekL: 454, foreheadR: 54, foreheadL: 284, jawR: 172, jawL: 397, chinR: 148, chinL: 377,
  eyeROut: 33, eyeRIn: 133, eyeLIn: 362, eyeLOut: 263, eyeRTop: 159, eyeRBot: 145, eyeLTop: 386, eyeLBot: 374,
  browROut: 70, browRIn: 107, browLIn: 336, browLOut: 300, browRMid: 105, browLMid: 334,
  alarR: 98, alarL: 327, mouthR: 61, mouthL: 291, lipTop: 0, lipUpperIn: 13, lipLowerIn: 14, lipBottom: 17,
};

/** Rough classification into the five elemental face shapes of Eastern physiognomy. */
function faceShape(lengthToWidth: number, foreheadToCheek: number, jawToCheek: number, chinToJaw: number) {
  const s: Record<FaceElement, number> = {
    // Mộc: long and straight-sided
    Mộc: Math.max(0, lengthToWidth - 1.2) * 4 + (1 - Math.abs(foreheadToCheek - jawToCheek)) * 0.5,
    // Kim: square, jaw about as wide as the forehead, not long
    Kim: (jawToCheek > 0.82 ? 1 : 0.3) + (1 - Math.abs(foreheadToCheek - jawToCheek) * 3) + Math.max(0, 1.25 - lengthToWidth) * 2,
    // Thổ: broad, heavy lower face (jaw wider than forehead)
    Thổ: Math.max(0, jawToCheek - foreheadToCheek) * 6 + (jawToCheek > 0.85 ? 0.8 : 0) + Math.max(0, 1.2 - lengthToWidth) * 2,
    // Hỏa: wide upper face tapering to a pointed chin
    Hỏa: Math.max(0, foreheadToCheek - jawToCheek) * 5 + Math.max(0, 0.8 - jawToCheek) * 4 + Math.max(0, 0.45 - chinToJaw) * 3,
    // Thủy: round and soft, short and full
    Thủy: Math.max(0, 1.18 - lengthToWidth) * 5 + (jawToCheek > 0.72 && jawToCheek < 0.86 ? 0.8 : 0),
  };
  const element = (Object.keys(s) as FaceElement[]).reduce((a, b) => (s[b] > s[a] ? b : a));
  const total = Object.values(s).reduce((a, b) => a + Math.max(0, b), 0) || 1;
  const scores = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, round((Math.max(0, v) / total) * 100, 0)])) as Record<FaceElement, number>;
  return { element, scores };
}

export function measureFace(landmarks: NormalizedLandmark[], width: number, height: number, hairlineY: number | null = null): FaceMetrics {
  const p = toPx(landmarks, width, height);
  const faceH = dist(p[F.top], p[F.chin]);
  const cheekW = dist(p[F.cheekR], p[F.cheekL]);
  // Use the segmented hairline when it's plausible (above landmark 10, not absurdly high).
  const topY = hairlineY !== null && hairlineY < p[F.top].y && p[F.glabella].y - hairlineY < 1.8 * (p[F.subnasale].y - p[F.glabella].y) ? hairlineY : p[F.top].y;
  const hairlineFound = topY !== p[F.top].y;
  const upper = Math.abs(p[F.glabella].y - topY);
  const middle = Math.abs(p[F.subnasale].y - p[F.glabella].y);
  const lower = Math.abs(p[F.chin].y - p[F.subnasale].y);
  const sum = upper + middle + lower;
  const eyeRW = dist(p[F.eyeROut], p[F.eyeRIn]);
  const eyeLW = dist(p[F.eyeLOut], p[F.eyeLIn]);
  const eyeW = (eyeRW + eyeLW) / 2;
  const eyeGap = dist(p[F.eyeRIn], p[F.eyeLIn]);
  const eyeH = (dist(p[F.eyeRTop], p[F.eyeRBot]) + dist(p[F.eyeLTop], p[F.eyeLBot])) / 2;
  const browLen = (dist(p[F.browROut], p[F.browRIn]) + dist(p[F.browLOut], p[F.browLIn])) / 2;
  const browGap = (dist(p[F.browRMid], p[F.eyeRTop]) + dist(p[F.browLMid], p[F.eyeLTop])) / 2;
  const jawW = dist(p[F.jawR], p[F.jawL]);
  const foreheadW = dist(p[F.foreheadR], p[F.foreheadL]);
  const chinW = dist(p[F.chinR], p[F.chinL]);
  const noseW = dist(p[F.alarR], p[F.alarL]);
  const mouthW = dist(p[F.mouthR], p[F.mouthL]);
  const upperLip = dist(p[F.lipTop], p[F.lipUpperIn]);
  const lowerLip = dist(p[F.lipLowerIn], p[F.lipBottom]);

  // Symmetry: compare each left/right point's distance to the facial midline (nasion → chin).
  const a = p[F.nasion];
  const b = p[F.chin];
  const lineDist = (q: P) => Math.abs((b.x - a.x) * (a.y - q.y) - (a.x - q.x) * (b.y - a.y)) / dist(a, b);
  const pairs: [number, number][] = [[F.eyeROut, F.eyeLOut], [F.eyeRIn, F.eyeLIn], [F.mouthR, F.mouthL], [F.cheekR, F.cheekL], [F.jawR, F.jawL], [F.browROut, F.browLOut], [F.alarR, F.alarL]];
  const asym = pairs.reduce((acc, [r, l]) => acc + Math.abs(lineDist(p[r]) - lineDist(p[l])), 0) / pairs.length / cheekW;

  // Pose: nose tip offset from the cheek midpoint (yaw) and eye-line tilt (roll).
  const midX = (p[F.cheekR].x + p[F.cheekL].x) / 2;
  const yaw = (p[F.noseTip].x - midX) / cheekW;
  const roll = (Math.atan2(p[F.eyeLOut].y - p[F.eyeROut].y, p[F.eyeLOut].x - p[F.eyeROut].x) * 180) / Math.PI;

  const lengthToWidth = faceH / cheekW;
  const foreheadToCheek = foreheadW / cheekW;
  const jawToCheek = jawW / cheekW;
  const chinToJaw = chinW / jawW;
  return {
    thirds: { upper: round(upper / sum), middle: round(middle / sum), lower: round(lower / sum) },
    hairlineFound,
    lengthToWidth: round(lengthToWidth),
    foreheadToCheek: round(foreheadToCheek),
    jawToCheek: round(jawToCheek),
    chinToJaw: round(chinToJaw),
    eyeSpacingToEyeWidth: round(eyeGap / eyeW),
    eyeOpenness: round(eyeH / eyeW),
    browToEyeLength: round(browLen / eyeW),
    browEyeGap: round(browGap / eyeW),
    noseWidthToEyeGap: round(noseW / eyeGap),
    noseLengthToFace: round(dist(p[F.nasion], p[F.subnasale]) / faceH),
    mouthToNoseWidth: round(mouthW / noseW),
    lipRatio: round(upperLip / Math.max(lowerLip, 1e-6)),
    philtrumToFace: round(dist(p[F.subnasale], p[F.lipTop]) / faceH, 3),
    symmetry: Math.round(Math.max(0, 100 - asym * 400)),
    yaw: round(yaw),
    roll: round(roll, 1),
    shape: faceShape(lengthToWidth, foreheadToCheek, jawToCheek, chinToJaw),
  };
}

// Hand landmark indices: 0 wrist; thumb 1–4; index 5–8; middle 9–12; ring 13–16; pinky 17–20.
const chain = (w: Landmark[], ids: number[]) => ids.slice(1).reduce((acc, id, i) => acc + dist(w[ids[i]], w[id]), 0);

export function measureHand(world: Landmark[], side: "left" | "right"): HandMetrics {
  const palmLen = dist(world[0], world[9]);
  const palmW = dist(world[5], world[17]);
  const index = chain(world, [5, 6, 7, 8]);
  const middle = chain(world, [9, 10, 11, 12]);
  const ring = chain(world, [13, 14, 15, 16]);
  const pinky = chain(world, [17, 18, 19, 20]);
  const thumb = chain(world, [2, 3, 4]);
  const dir = (a: number, b: number) => {
    const v = { x: world[b].x - world[a].x, y: world[b].y - world[a].y, z: world[b].z - world[a].z };
    const n = Math.hypot(v.x, v.y, v.z) || 1;
    return { x: v.x / n, y: v.y / n, z: v.z / n };
  };
  const angle = (u: P, v: P) => (Math.acos(Math.min(1, Math.max(-1, u.x * v.x + u.y * v.y + (u.z ?? 0) * (v.z ?? 0)))) * 180) / Math.PI;
  const fingers = [dir(5, 8), dir(9, 12), dir(13, 16), dir(17, 20)];
  const spread = (angle(fingers[0], fingers[1]) + angle(fingers[1], fingers[2]) + angle(fingers[2], fingers[3])) / 3;

  const palmLengthToWidth = palmLen / palmW;
  const fingerToPalm = middle / palmLen;
  // Knuckle width understates the full palm width, so "square" sits higher than 1.
  const longPalm = palmLengthToWidth > 1.28;
  const longFingers = fingerToPalm > 0.86;
  const type: HandElement = longPalm ? (longFingers ? "water" : "fire") : longFingers ? "air" : "earth";
  return {
    side,
    palmLengthToWidth: round(palmLengthToWidth),
    fingerToPalm: round(fingerToPalm),
    indexToRing: round(index / ring, 3),
    pinkyToRing: round(pinky / ring),
    thumbToIndex: round(thumb / index),
    spread: round(spread, 0),
    type,
  };
}

// ---------- Labels ----------

export const FACE_ELEMENT: Record<FaceElement, { label: Bi; traits: Bi }> = {
  Kim: { label: { en: "Metal (square)", vi: "Kim (mặt vuông)" }, traits: { en: "decisive, principled, organized", vi: "quyết đoán, có nguyên tắc, ngăn nắp" } },
  Mộc: { label: { en: "Wood (long)", vi: "Mộc (mặt dài)" }, traits: { en: "idealistic, growth-minded, upright", vi: "lý tưởng, cầu tiến, ngay thẳng" } },
  Thủy: { label: { en: "Water (round)", vi: "Thủy (mặt tròn)" }, traits: { en: "adaptable, sociable, intuitive", vi: "linh hoạt, hòa đồng, giàu trực giác" } },
  Hỏa: { label: { en: "Fire (tapered)", vi: "Hỏa (mặt nhọn)" }, traits: { en: "passionate, quick, expressive", vi: "nhiệt huyết, nhanh nhạy, giàu biểu cảm" } },
  Thổ: { label: { en: "Earth (broad)", vi: "Thổ (mặt đầy đặn)" }, traits: { en: "steady, reliable, patient", vi: "vững vàng, đáng tin, kiên nhẫn" } },
};

export const HAND_TYPE: Record<HandElement, { label: Bi; traits: Bi }> = {
  earth: { label: { en: "Earth hand", vi: "Bàn tay Đất" }, traits: { en: "square palm, short fingers: practical, grounded, hands-on", vi: "lòng vuông, ngón ngắn: thực tế, vững chãi, giỏi làm" } },
  air: { label: { en: "Air hand", vi: "Bàn tay Khí" }, traits: { en: "square palm, long fingers: curious, communicative, analytical", vi: "lòng vuông, ngón dài: tò mò, giỏi giao tiếp, tư duy phân tích" } },
  water: { label: { en: "Water hand", vi: "Bàn tay Nước" }, traits: { en: "long palm, long fingers: sensitive, imaginative, empathetic", vi: "lòng dài, ngón dài: nhạy cảm, giàu tưởng tượng, thấu cảm" } },
  fire: { label: { en: "Fire hand", vi: "Bàn tay Lửa" }, traits: { en: "long palm, short fingers: energetic, bold, driven", vi: "lòng dài, ngón ngắn: năng động, táo bạo, nhiều động lực" } },
};

/** Warnings about photo quality that would make the measurements unreliable. */
export function faceQuality(m: FaceMetrics): Bi[] {
  const out: Bi[] = [];
  if (Math.abs(m.yaw) > 0.07) out.push({ en: "Your head is turned; face the camera straight on.", vi: "Đầu đang nghiêng sang một bên; hãy nhìn thẳng vào máy ảnh." });
  if (Math.abs(m.roll) > 6) out.push({ en: "Your head is tilted; keep your eyes level.", vi: "Đầu đang nghiêng; hãy giữ hai mắt ngang bằng." });
  return out;
}

// ---------- Text for Claude ----------

export function describeFace(m: FaceMetrics): string {
  const t = m.thirds;
  return [
    "### Face measurements (MediaPipe Face Landmarker, 478 points; computed in the browser)",
    m.hairlineFound
      ? `- Three courts (Tam đình), hairline (found with the hair segmenter) → brows → nose base → chin: upper ${t.upper}, middle ${t.middle}, lower ${t.lower} (classic ideal ≈ equal thirds)`
      : `- Three courts (Tam đình) from the top face landmark (the hairline couldn't be found, so the upper court is understated) → brows → nose base → chin: upper ${t.upper}, middle ${t.middle}, lower ${t.lower}`,
    `- Face length/cheekbone width ${m.lengthToWidth}; forehead/cheek ${m.foreheadToCheek}; jaw/cheek ${m.jawToCheek}; chin/jaw ${m.chinToJaw}`,
    `- Estimated elemental face shape: ${m.shape.element} (${Object.entries(m.shape.scores).map(([k, v]) => `${k} ${v}%`).join(", ")}); treat as a hint and confirm from the photo`,
    `- Eyes: gap/eye width ${m.eyeSpacingToEyeWidth} (≈1 classic), openness ${m.eyeOpenness}`,
    `- Eyebrows: length/eye length ${m.browToEyeLength}; brow–eye gap/eye width ${m.browEyeGap} (Điền trạch)`,
    `- Nose: alar width/eye gap ${m.noseWidthToEyeGap}; nose length/face ${m.noseLengthToFace}`,
    `- Mouth width/nose width ${m.mouthToNoseWidth}; upper/lower lip ${m.lipRatio}; philtrum/face ${m.philtrumToFace}`,
    `- Symmetry ${m.symmetry}/100; pose yaw ${m.yaw}, roll ${m.roll}°`,
  ].join("\n");
}

export function describeHand(m: HandMetrics): string {
  return [
    `### ${m.side === "left" ? "Left" : "Right"} hand measurements (MediaPipe Hand Landmarker, 21 points, 3D world coordinates)`,
    `- Palm length/knuckle width ${m.palmLengthToWidth}; middle finger/palm length ${m.fingerToPalm} → estimated ${m.type} hand`,
    `- Index/ring (2D:4D) ${m.indexToRing}; pinky/ring ${m.pinkyToRing}; thumb/index ${m.thumbToIndex}; average finger spread ${m.spread}°`,
  ].join("\n");
}
