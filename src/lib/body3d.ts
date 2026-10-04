// A procedural 3D mannequin in anatomical position (standing, palms forward), built so that
// every landmark is known exactly. Acupoints are placed the way the books do it: from bony
// landmarks and proportional "thốn" (cun) measurements, then snapped onto the skin by raycasting.
//
// Units are centimetres. y is up, the figure faces +z, and the person's LEFT side is +x.
// Limbs are modelled on the left and mirrored; bilateral points are placed on the left and mirrored.
import * as THREE from "three";

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

// ---------- Landmarks ----------

export const LM = {
  vertexY: 170,
  head: v(0, 158.5, 0.6), // head ellipsoid centre
  headR: v(7.6, 11.5, 9.8),
  browY: 160.8,
  eyeY: 158.6,
  noseBaseY: 153.2,
  mouthY: 150.6,
  c7Y: 145, // spinous process of C7
  shoulder: v(19, 138.5, -1),
  elbow: v(22.6, 108, -2.4), // cubital crease level
  wrist: v(25.2, 84, -0.2), // wrist crease level
  axillaFoldY: 129,
  nippleX: 10,
  nippleY: 125,
  xiphoidY: 119,
  umbY: 102,
  pubisY: 91.5,
  hip: v(9, 90, 0),
  trochanter: v(16.5, 89, -0.5),
  knee: v(9.6, 48, 0.6), // popliteal crease level
  ankle: v(9.6, 8.5, -1.6),
  latMalleolus: v(13.0, 7, -2.0),
  medMalleolus: v(6.3, 8, -1.4),
  scapulaMedialX: 8.4,
};

/** Proportional cun for each region (bone-proportional measurement, 骨度分寸). */
export const CUN = {
  chestX: (2 * LM.nippleX) / 8, // between the nipples = 8 cun
  upperAbdY: (LM.xiphoidY - LM.umbY) / 8, // xiphoid → umbilicus = 8 cun
  lowerAbdY: (LM.umbY - LM.pubisY) / 5, // umbilicus → pubic symphysis = 5 cun
  backX: LM.scapulaMedialX / 3, // midline → medial border of scapula = 3 cun
  upperArm: (LM.axillaFoldY - LM.elbow.y) / 9, // axillary fold → cubital crease = 9 cun
  forearm: LM.elbow.distanceTo(LM.wrist) / 12, // cubital crease → wrist crease = 12 cun
  thighLat: (LM.trochanter.y - LM.knee.y) / 19, // greater trochanter → popliteal crease = 19 cun
  thighMed: (LM.pubisY - 50) / 18, // pubic symphysis → medial epicondyle of femur = 18 cun
  legLat: (LM.knee.y - LM.latMalleolus.y) / 16, // popliteal crease → lateral malleolus = 16 cun
  legMed: (44 - LM.medMalleolus.y) / 13, // medial tibial condyle → medial malleolus = 13 cun
};

// Thoracic and lumbar spinous processes, top down.
const T = (n: number) => LM.c7Y - 2.35 * n;
const Lv = (n: number) => T(12) - 3.3 * n;
/** Height of the depression just below a spinous process: "C7", "T3", "L2"… */
export function belowSpinous(name: string): number {
  const n = Number(name.slice(1));
  const y = name[0] === "C" ? LM.c7Y : name[0] === "T" ? T(n) : Lv(n);
  return y - (name[0] === "L" ? 1.6 : 1.2);
}

const lerpY = (a: THREE.Vector3, b: THREE.Vector3, y: number) => a.clone().lerp(b, (y - a.y) / (b.y - a.y));
/** Point on the arm axis at height y. */
export const armAxisAt = (y: number) => (y >= LM.elbow.y ? lerpY(LM.elbow, LM.shoulder, y) : lerpY(LM.wrist, LM.elbow, y));
/** Point on the forearm axis, `cun` above the wrist crease. */
export const forearm = (cun: number) => LM.wrist.clone().lerp(LM.elbow, cun / 12);
/** Point on the leg axis at height y. */
export const legAxisAt = (y: number) => (y >= LM.knee.y ? lerpY(LM.knee, LM.hip, y) : lerpY(LM.ankle, LM.knee, y));

// ---------- Geometry helpers ----------

/** Smooth interpolation through keyframes [x, ...values] (cubic Hermite, no overshoot to speak of). */
function interp(keys: number[][], x: number): number[] {
  if (x <= keys[0][0]) return keys[0].slice(1);
  const last = keys[keys.length - 1];
  if (x >= last[0]) return last.slice(1);
  let i = 0;
  while (keys[i + 1][0] < x) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(keys.length - 1, i + 2)];
  const h = k2[0] - k1[0];
  const t = (x - k1[0]) / h;
  const h00 = 2 * t ** 3 - 3 * t ** 2 + 1, h10 = t ** 3 - 2 * t ** 2 + t, h01 = -2 * t ** 3 + 3 * t ** 2, h11 = t ** 3 - t ** 2;
  return k1.slice(1).map((p1, j) => {
    const p0 = k0[j + 1], p2 = k2[j + 1], p3 = k3[j + 1];
    const m1 = k2[0] === k0[0] ? 0 : ((p2 - p0) / (k2[0] - k0[0])) * h;
    const m2 = k3[0] === k1[0] ? 0 : ((p3 - p1) / (k3[0] - k1[0])) * h;
    // Flatten slopes at local extrema so the surface doesn't bulge past the keyframes.
    const s1 = (p1 - p0) * (p2 - p1) <= 0 ? 0 : m1;
    const s2 = (p2 - p1) * (p3 - p2) <= 0 ? 0 : m2;
    return h00 * p1 + h10 * s1 + h01 * p2 + h11 * s2;
  });
}

const spow = (c: number, p: number) => Math.sign(c) * Math.abs(c) ** p;

/** A closed surface from rings of equal size; the ends are closed with fans. */
function loft(rings: THREE.Vector3[][]): THREE.BufferGeometry {
  const m = rings[0].length;
  const pos: number[] = [];
  rings.forEach((r) => r.forEach((p) => pos.push(p.x, p.y, p.z)));
  const centre = (r: THREE.Vector3[]) => r.reduce((a, p) => a.add(p), v(0, 0, 0)).multiplyScalar(1 / r.length);
  const c0 = centre(rings[0]), c1 = centre(rings[rings.length - 1]);
  const i0 = pos.length / 3;
  pos.push(c0.x, c0.y, c0.z, c1.x, c1.y, c1.z);
  const idx: number[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < m; j++) {
      const a = i * m + j, b = i * m + ((j + 1) % m), c = (i + 1) * m + j, d = (i + 1) * m + ((j + 1) % m);
      idx.push(a, c, b, b, c, d);
    }
  }
  const last = (rings.length - 1) * m;
  for (let j = 0; j < m; j++) {
    idx.push(i0, j, (j + 1) % m);
    idx.push(i0 + 1, last + ((j + 1) % m), last + j);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  orientOutward(g);
  g.computeVertexNormals();
  return g;
}

/** Flip the winding if the surface came out inside-out (signed volume < 0). */
function orientOutward(g: THREE.BufferGeometry) {
  const p = g.getAttribute("position");
  const idx = g.getIndex()!;
  let vol = 0;
  const a = v(0, 0, 0), b = v(0, 0, 0), c = v(0, 0, 0);
  for (let i = 0; i < idx.count; i += 3) {
    a.fromBufferAttribute(p, idx.getX(i));
    b.fromBufferAttribute(p, idx.getX(i + 1));
    c.fromBufferAttribute(p, idx.getX(i + 2));
    vol += a.dot(b.clone().cross(c));
  }
  if (vol < 0) {
    const arr = idx.array as Uint16Array | Uint32Array;
    for (let i = 0; i < arr.length; i += 3) [arr[i + 1], arr[i + 2]] = [arr[i + 2], arr[i + 1]];
    idx.needsUpdate = true;
  }
}

/**
 * A limb along a smooth path with elliptical cross-sections. Profile keys are
 * [t (0..1 along the path), half-width across the body (x), half-depth front-back (z)].
 */
function limb(path: THREE.Vector3[], profile: number[][], seg = 64, radial = 28): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(path, false, "centripetal");
  const rings: THREE.Vector3[][] = [];
  const ring = (centre: THREE.Vector3, X: THREE.Vector3, Z: THREE.Vector3, rx: number, rz: number) =>
    Array.from({ length: radial }, (_, j) => {
      const th = (j / radial) * Math.PI * 2;
      return centre.clone().addScaledVector(X, rx * Math.cos(th)).addScaledVector(Z, rz * Math.sin(th));
    });
  const frame = (t: number) => {
    const T = curve.getTangentAt(t);
    // Cross-section "width" runs along world x; for paths that themselves run along x, use y.
    const ref = Math.abs(T.x) > 0.8 ? v(0, 1, 0) : v(1, 0, 0);
    const X = ref.addScaledVector(T, -T.dot(ref)).normalize();
    const Z = T.clone().cross(X).normalize();
    return { T, X, Z };
  };
  // Rounded ends: a few shrinking rings beyond each end.
  const cap = (t: number, sign: 1 | -1, out: THREE.Vector3[][]) => {
    const { T, X, Z } = frame(t);
    const [rx, rz] = interp(profile, t);
    const p = curve.getPointAt(t);
    for (let k = 1; k <= 4; k++) {
      const a = (k / 5) * (Math.PI / 2);
      out.push(ring(p.clone().addScaledVector(T, sign * Math.min(rx, rz) * Math.sin(a)), X, Z, rx * Math.cos(a), rz * Math.cos(a)));
    }
  };
  const start: THREE.Vector3[][] = [];
  cap(0, -1, start);
  rings.push(...start.reverse());
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const { X, Z } = frame(t);
    const [rx, rz] = interp(profile, t);
    rings.push(ring(curve.getPointAt(t), X, Z, rx, rz));
  }
  cap(1, 1, rings);
  return loft(rings);
}

/** Ellipsoid (optionally boxier with p < 1), rotated by Euler angles. */
function blob(centre: THREE.Vector3, r: THREE.Vector3, rot = new THREE.Euler(), p = 1, detail = 24): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, detail, Math.round(detail * 0.75));
  g.deleteAttribute("uv");
  const pos = g.getAttribute("position");
  const q = new THREE.Quaternion().setFromEuler(rot);
  const t = v(0, 0, 0);
  for (let i = 0; i < pos.count; i++) {
    t.set(spow(pos.getX(i), p) * r.x, spow(pos.getY(i), p) * r.y, spow(pos.getZ(i), p) * r.z).applyQuaternion(q).add(centre);
    pos.setXYZ(i, t.x, t.y, t.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Capsule from `a` towards `b`. */
function capsule(a: THREE.Vector3, b: THREE.Vector3, r: number, r2 = r): THREE.BufferGeometry {
  const len = a.distanceTo(b);
  const dir = b.clone().sub(a).normalize();
  if (r2 === r) {
    const g = new THREE.CapsuleGeometry(r, Math.max(0.01, len - 2 * r), 6, 14);
    g.deleteAttribute("uv");
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(v(0, 1, 0), dir));
    g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
    return g;
  }
  return limb([a.clone().addScaledVector(dir, r), a.clone().lerp(b, 0.5), b.clone().addScaledVector(dir, -r2)], [[0, r, r * 0.9], [1, r2, r2 * 0.9]], 8, 14);
}

function mirror(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const m = g.clone();
  m.scale(-1, 1, 1);
  const idx = m.getIndex();
  if (idx) {
    const arr = idx.array as Uint16Array | Uint32Array;
    for (let i = 0; i < arr.length; i += 3) [arr[i + 1], arr[i + 2]] = [arr[i + 2], arr[i + 1]];
  }
  m.computeVertexNormals();
  return m;
}

// ---------- Body parts ----------

export type Part = "head" | "neck" | "torso" | "arm" | "hand" | "leg" | "foot";

function torso(): THREE.BufferGeometry {
  // [y, half-width, front depth, back depth, centre z]
  const keys = [
    [79, 6, 4, 6, -0.5],
    [82, 14.5, 8.4, 11, -0.5],
    [87, 17.2, 9.4, 12.6, -0.5],
    [93, 17.2, 10, 12.2, -0.4],
    [99, 16.0, 10.2, 10.4, -0.2],
    [105, 15.0, 10.4, 9.0, 0],
    [110, 14.4, 10.2, 9.0, 0],
    [117, 15.0, 10.6, 10.0, 0],
    [125, 16.2, 11.6, 10.8, 0],
    [132, 16.8, 11.2, 11.2, -0.2],
    [137, 16.4, 9.4, 10.8, -0.6],
    [140.5, 14.0, 7.2, 9.2, -1],
    [143.5, 10.0, 6.0, 7.6, -1.2],
    [146.5, 6.2, 5.2, 6.0, -1.2],
  ];
  const radial = 48;
  const rings: THREE.Vector3[][] = [];
  for (let y = 79; y <= 146.5; y += 0.75) {
    const [a, f, b, zc] = interp(keys, y);
    rings.push(
      Array.from({ length: radial }, (_, j) => {
        const th = (j / radial) * Math.PI * 2;
        const s = Math.sin(th), c = Math.cos(th);
        const n = 2.6;
        return v(a * spow(s, 2 / n), y, zc + (c >= 0 ? f : b) * spow(c, 2 / n));
      }),
    );
  }
  return loft(rings);
}

function head(): THREE.BufferGeometry {
  const g = new THREE.SphereGeometry(1, 56, 42);
  g.deleteAttribute("uv");
  const pos = g.getAttribute("position");
  const { head: C, headR: R } = LM;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    if (y < 0) {
      const t = -y;
      x *= 1 - 0.24 * t ** 1.8; // narrower jaw
      if (z < 0) z *= 1 - 0.5 * t ** 1.2; // the skull stops above the nape
      else z *= 1 - 0.06 * t ** 2;
    } else if (z > 0) {
      z *= 1 - 0.08 * y; // flatter forehead
    }
    if (z > 0.55 && Math.abs(x) < 0.5 && y > -0.1 && y < 0.35) z -= 0.03 * (1 - Math.abs(x) / 0.5); // eye sockets, faintly
    pos.setXYZ(i, C.x + x * R.x, C.y + y * R.y, C.z + z * R.z);
  }
  g.computeVertexNormals();
  return g;
}

/** Surface point on a geometry, casting from far along `dir` back towards `anchor`. */
const raycaster = new THREE.Raycaster();
export function snap(meshes: THREE.Object3D[], anchor: THREE.Vector3, dir: THREE.Vector3): { pos: THREE.Vector3; normal: THREE.Vector3 } | null {
  const d = dir.clone().normalize();
  raycaster.set(anchor.clone().addScaledVector(d, 80), d.clone().negate());
  const hit = raycaster.intersectObjects(meshes, false)[0];
  if (!hit) return null;
  const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : d;
  return { pos: hit.point.clone(), normal };
}

export interface Body {
  group: THREE.Group;
  /** Left-side (and midline) meshes per part, used to place points. */
  parts: Record<Part, THREE.Mesh[]>;
  material: THREE.MeshStandardMaterial;
}

export function buildBody(): Body {
  const skin = new THREE.MeshStandardMaterial({ color: 0xe9c9ad, roughness: 0.72, metalness: 0.0 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x5b4034, roughness: 0.9 });
  const lip = new THREE.MeshStandardMaterial({ color: 0xc98f7e, roughness: 0.8 });
  const nail = new THREE.MeshStandardMaterial({ color: 0xf3ddd0, roughness: 0.4 });
  const group = new THREE.Group();
  const parts: Record<Part, THREE.Mesh[]> = { head: [], neck: [], torso: [], arm: [], hand: [], leg: [], foot: [] };

  const add = (part: Part | null, g: THREE.BufferGeometry, mat = skin, bilateral = true) => {
    const m = new THREE.Mesh(g, mat);
    group.add(m);
    if (part) parts[part].push(m);
    if (bilateral) group.add(new THREE.Mesh(mirror(g), mat));
    return m;
  };

  // Trunk, neck, head
  add("torso", torso(), skin, false);
  add("neck", limb([v(0, 139, -1.2), v(0, 146, -1.0), v(0, 153, -0.6)], [[0, 6.0, 6.0], [0.5, 5.3, 5.6], [1, 5.0, 5.4]], 16, 32), skin, false);
  const headMesh = add("head", head(), skin, false);
  // Face details sit on the skin (for orientation; points are placed on the head itself).
  const onFace = (x: number, y: number, out = 0) => {
    const hit = snap([headMesh], v(x, y, 0), v(0, 0, 1));
    return hit ? hit.pos.addScaledVector(hit.normal, out) : v(x, y, 9);
  };
  // Nose: lofted from the bridge (narrow, flat) to the tip (wide, projecting).
  const noseKeys = [
    // [y, half-width, projection from the face]
    [158.6, 0.55, 0.05], [157.6, 0.6, 0.45], [156, 0.75, 1.1], [154.6, 0.95, 1.75], [153.9, 1.15, 2.05], [153.35, 1.0, 1.7], [153.1, 0.6, 0.9],
  ];
  const noseRings: THREE.Vector3[][] = [];
  for (let y = 158.6; y >= 153.1; y -= 0.25) {
    const [w, proj] = interp([...noseKeys].reverse(), y);
    const base = onFace(0, y, -0.4);
    noseRings.push(Array.from({ length: 20 }, (_, j) => {
      const th = (j / 20) * Math.PI * 2;
      const c = Math.cos(th), sn = Math.sin(th);
      // A rounded triangle: wide at the back, ridge at the front.
      return v(w * sn * (0.65 + 0.35 * Math.max(0, -c)), y, base.z + (proj + 0.4) * Math.max(0, c) ** 0.9 + 0.4 * Math.min(0, c));
    }));
  }
  add(null, loft(noseRings), skin, false);
  add(null, blob(onFace(1.25, 153.55, 0.2), v(0.75, 0.6, 0.85)), skin); // alae
  add(null, blob(onFace(3.2, LM.eyeY, -0.12), v(1.2, 0.3, 0.3)), dark); // eyes (calm, half-closed)
  const surfaceTube = (xs: number[], y: (x: number) => number, out: number, prof: number[][], mat: THREE.MeshStandardMaterial, bilateral: boolean) =>
    add(null, limb(xs.map((x) => onFace(x, y(x), out)), prof, 24, 10), mat, bilateral);
  surfaceTube([1.3, 2.4, 3.6, 4.8, 5.7], (x) => LM.browY + 0.55 * Math.sin(((x - 1.3) / 4.4) * Math.PI) - 0.1, 0.05, [[0, 0.26, 0.16], [0.4, 0.3, 0.18], [1, 0.14, 0.1]], dark, true); // brows
  surfaceTube([-2.1, -1.1, 0, 1.1, 2.1], (x) => LM.mouthY + 0.12 * Math.abs(x), 0.0, [[0, 0.16, 0.16], [0.5, 0.36, 0.3], [1, 0.16, 0.16]], lip, false); // lips
  add(null, blob(v(7.5, 157.4, -0.6), v(0.9, 3.1, 1.9), new THREE.Euler(0, 0.35, 0.08)), skin); // ears

  // Arms (left; mirrored)
  const { shoulder: S, elbow: E, wrist: W } = LM;
  add("arm", limb([S.clone().add(v(-1.2, 1.5, 0)), S, E, W, W.clone().add(v(0.15, -1.2, 0))], [
    [0, 4.6, 5.0], [0.1, 5.2, 5.4], [0.22, 4.7, 5.0], [0.4, 4.1, 4.4], [0.52, 3.8, 3.9],
    [0.6, 4.3, 3.9], [0.7, 4.1, 3.5], [0.85, 3.2, 2.5], [0.97, 2.75, 1.9], [1, 2.7, 1.85],
  ]));
  add("arm", blob(v(18.7, 137.8, -0.9), v(5.8, 6.1, 5.8))); // deltoid

  // Hand (left; palm faces +z, thumb lateral = +x)
  const hand = (g: THREE.BufferGeometry, mat = skin) => add("hand", g, mat);
  hand(blob(W.clone().add(v(0.2, -5.4, 0)), v(4.0, 5.6, 1.45), new THREE.Euler(0, 0, 0.03), 0.75));
  hand(blob(W.clone().add(v(2.2, -4.1, 0.55)), v(1.6, 2.8, 1.1), new THREE.Euler(0, 0, 0.35))); // thenar eminence
  const fingers = [
    { dx: 2.55, len: 7.3, r: 0.86 },
    { dx: 0.85, len: 8.1, r: 0.9 },
    { dx: -0.85, len: 7.5, r: 0.84 },
    { dx: -2.5, len: 6.0, r: 0.74 },
  ];
  for (const f of fingers) {
    const base = W.clone().add(v(f.dx, -10.3, 0));
    const tip = base.clone().add(v(f.dx * 0.04, -f.len, 0.9));
    hand(capsule(base, tip, f.r, f.r * 0.9));
    hand(blob(tip.clone().add(v(0, 1.0, -0.62)), v(f.r * 0.62, 0.8, 0.12)), nail);
  }
  const thumbBase = W.clone().add(v(3.4, -4.6, 1.1));
  const thumbDir = v(0.42, -0.8, 0.43).normalize();
  const thumbTip = thumbBase.clone().addScaledVector(thumbDir, 6.2);
  hand(capsule(thumbBase, thumbTip, 1.15, 0.95));
  hand(blob(thumbTip.clone().addScaledVector(thumbDir, -1.0).add(v(0.45, 0, -0.55)), v(0.6, 0.85, 0.12), new THREE.Euler(0, 0.75, 0.45)), nail);

  // Legs (left; mirrored)
  const { hip: Hp, knee: K, ankle: A } = LM;
  add("leg", limb([Hp.clone().add(v(-0.6, 1, -0.5)), Hp.clone().add(v(0, -4, 0)), K, A, A.clone().add(v(0, -2.5, 0))], [
    [0, 7.4, 8.2], [0.06, 8.0, 8.6], [0.2, 7.4, 7.7], [0.38, 6.0, 6.2], [0.48, 5.4, 5.5],
    [0.55, 5.4, 5.6], [0.63, 5.6, 6.1], [0.78, 4.4, 4.5], [0.9, 3.4, 3.4], [1, 3.1, 3.2],
  ]));
  add("leg", blob(v(K.x, 49.6, 5.3), v(2.4, 2.7, 1.2))); // patella

  // Foot (left): lofted from heel to the metatarsal heads, then toes.
  const footKeys = [
    // [z, half-width, sole y, top y, centre x offset]
    [-7.0, 1.8, 1.2, 4.0, 0],
    [-6.2, 2.7, 0.3, 6.8, 0],
    [-3.5, 3.3, 0, 9.0, 0],
    [0, 3.6, 0, 8.4, -0.1],
    [4, 3.95, 0, 6.2, -0.3],
    [8, 4.4, 0, 4.6, -0.5],
    [12, 4.8, 0, 3.3, -0.6],
    [14.2, 4.6, 0.2, 2.8, -0.6],
    [15.0, 4.0, 0.5, 2.4, -0.6],
  ];
  const footRings: THREE.Vector3[][] = [];
  for (let z = -7; z <= 15.0; z += 0.4) {
    const [w, lo, hi, cx] = interp(footKeys, z);
    const yc = (lo + hi) / 2, hh = (hi - lo) / 2;
    footRings.push(
      Array.from({ length: 32 }, (_, j) => {
        const th = (j / 32) * Math.PI * 2;
        return v(A.x + cx + w * spow(Math.cos(th), 0.75), yc + hh * spow(Math.sin(th), 0.75), z);
      }),
    );
  }
  add("foot", loft(footRings));
  add("foot", blob(LM.latMalleolus.clone().add(v(-0.5, 0, 0)), v(0.8, 1.2, 1.1)));
  add("foot", blob(LM.medMalleolus.clone().add(v(0.5, 0, 0)), v(0.8, 1.3, 1.2)));
  const toes = [
    { dx: -3.25, len: 5.6, r: 1.25 },
    { dx: -1.05, len: 4.8, r: 0.88 },
    { dx: 0.75, len: 4.3, r: 0.82 },
    { dx: 2.35, len: 3.8, r: 0.78 },
    { dx: 3.8, len: 3.2, r: 0.74 },
  ];
  for (const t of toes) {
    const base = v(A.x - 0.6 + t.dx, t.r + 0.05, 13.4);
    add("foot", capsule(base, base.clone().add(v(t.dx * 0.03, -t.r * 0.3, t.len)), t.r, t.r * 0.92));
  }

  return { group, parts, material: skin };
}

// ---------- Camera views ----------

export type ViewId = "front" | "back" | "left" | "right" | "head" | "headSide" | "headBack" | "hand" | "handBack" | "foot" | "sole";

export const VIEWS: Record<ViewId, { pos: [number, number, number]; target: [number, number, number] }> = {
  front: { pos: [0, 92, 370], target: [0, 86, 0] },
  back: { pos: [0, 92, -370], target: [0, 86, 0] },
  left: { pos: [370, 92, 0], target: [0, 86, 0] },
  right: { pos: [-370, 92, 0], target: [0, 86, 0] },
  head: { pos: [16, 160, 74], target: [0, 155, 0] },
  headSide: { pos: [76, 158, 10], target: [0, 155, -1] },
  headBack: { pos: [14, 156, -76], target: [0, 151, -2] },
  hand: { pos: [48, 80, 56], target: [25.5, 77, 0] },
  handBack: { pos: [48, 80, -56], target: [25.5, 77, 0] },
  foot: { pos: [32, 32, 42], target: [9, 4, 4] },
  sole: { pos: [18, -24, -30], target: [9.5, 1, 5] },
};
