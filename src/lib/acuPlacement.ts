// Where each acupoint sits on the 3D mannequin, built from the same landmarks and cun
// proportions the location texts use. Each spec gives a point inside the body near the
// spot and the direction of the skin there; the point is then snapped onto the surface.
import * as THREE from "three";
import { CUN, LM, belowSpinous, forearm, legAxisAt, snap, type Body, type Part } from "./body3d";
import { ACUPOINTS } from "./acupoints";

interface Spec {
  parts: Part[];
  anchor: THREE.Vector3;
  dir: THREE.Vector3;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const at = (parts: Part | Part[], anchor: THREE.Vector3, dir: [number, number, number]): Spec => ({
  parts: Array.isArray(parts) ? parts : [parts],
  anchor,
  dir: v(...dir).normalize(),
});

const W = LM.wrist, E = LM.elbow, S = LM.shoulder, A = LM.ankle;
const fa = (cun: number, dx = 0, dz = 0) => forearm(cun).add(v(dx, 0, dz));
const leg = (y: number, dx = 0, dz = 0) => legAxisAt(y).add(v(dx, 0, dz));
const back = (vert: string, cun: number) => v(cun * CUN.backX, belowSpinous(vert), -2);
const chest = (cunX: number, y: number) => v(cunX * CUN.chestX, y, 0);
const umb = LM.umbY;
const st35Y = 46.6; // lower border of the patella
const thumbBase = W.clone().add(v(3.4, -4.6, 1.1));
const thumbDir = v(0.42, -0.8, 0.43).normalize();
const gb20 = v(3.1, 152.6, -4);
const te17 = v(5.2, 153.8, -2.2);

const SPECS: Record<string, Spec | Spec[]> = {
  LU1: at("torso", chest(6, 134), [0.45, 0.05, 1]),
  LU5: at("arm", E.clone().add(v(1.6, 0, 0)), [0.25, 0, 1]),
  LU6: at("arm", fa(7, 1.7), [0.45, 0, 1]),
  LU7: at("arm", fa(1.5, 1.8), [1, 0, 0.3]),
  LU9: at(["arm", "hand"], fa(0, 1.6), [0.35, 0, 1]),
  LU10: at("hand", W.clone().add(v(3.0, -4.3, 0.6)), [1, 0, 0.5]),
  LU11: at("hand", thumbBase.clone().addScaledVector(thumbDir, 5.0), [0.6, 0, -1]),

  LI4: at("hand", W.clone().add(v(3.0, -5.3, 0)), [0.35, 0, -1]),
  LI10: at("arm", fa(10, 2.2, -0.6), [1, 0, -0.35]),
  LI11: at("arm", E.clone().add(v(2.6, 0, 0)), [1, 0, 0.35]),
  LI15: at("arm", S.clone().add(v(2, 1.5, 1.5)), [0.75, 0.45, 0.55]),
  LI20: at("head", v(2.5, 153.6, 5), [0.3, 0, 1]),

  ST2: at("head", v(3.2, 156.2, 5), [0.1, 0, 1]),
  ST6: at("head", v(3.5, 150.4, 2.5), [1, 0, 0.35]),
  ST7: at("head", v(5.0, 156.2, 3.0), [1, 0, 0.3]),
  ST25: at("torso", chest(2, umb), [0.1, 0, 1]),
  ST35: at("leg", leg(st35Y, 1.9, 1), [0.45, 0, 1]),
  ST36: at("leg", leg(st35Y - 3 * CUN.legLat, 1.7), [0.4, 0, 1]),
  ST40: at("leg", leg(LM.latMalleolus.y + 8 * CUN.legLat, 2.6), [0.7, 0, 1]),
  ST41: at(["foot", "leg"], v(A.x, 7.5, 0), [0, 0.35, 1]),
  ST44: at("foot", v(A.x - 0.75, 1.5, 13.6), [0, 1, 0.25]),

  SP4: at("foot", v(A.x - 2.5, 1.6, 6.5), [-1, -0.25, 0]),
  SP6: at("leg", leg(LM.medMalleolus.y + 3 * CUN.legMed, -2.0, -0.4), [-1, 0, 0.05]),
  SP8: at("leg", leg(43.8 - 3 * CUN.legMed, -2.4), [-1, 0, 0.1]),
  SP9: at("leg", leg(43.8, -3.0, 0.5), [-1, 0, 0.25]),
  SP10: at("leg", leg(52.3 + 2 * CUN.thighMed, -3.0, 1.5), [-0.75, 0, 0.65]),
  SP15: at("torso", chest(4, umb), [0.4, 0, 1]),

  HT7: at(["arm", "hand"], fa(0, -1.6), [-0.3, 0, 1]),
  SI3: at("hand", W.clone().add(v(-3.0, -9.0, 0)), [-1, 0, 0.15]),
  SI11: at("torso", v(10.7, 129.7, -2), [0.15, 0, -1]),
  SI19: at("head", v(5.5, 157.2, 1.6), [1, 0, 0.3]),

  BL2: at("head", v(1.6, 160.9, 5), [0.15, 0, 1]),
  BL12: at("torso", back("T2", 1.5), [0, 0.1, -1]),
  BL13: at("torso", back("T3", 1.5), [0, 0.05, -1]),
  BL15: at("torso", back("T5", 1.5), [0, 0, -1]),
  BL17: at("torso", back("T7", 1.5), [0, 0, -1]),
  BL20: at("torso", back("T11", 1.5), [0, 0, -1]),
  BL21: at("torso", back("T12", 1.5), [0, 0, -1]),
  BL23: at("torso", back("L2", 1.5), [0, 0, -1]),
  BL25: at("torso", back("L4", 1.5), [0, 0, -1]),
  BL40: at("leg", leg(LM.knee.y), [0, 0, -1]),
  BL57: at("leg", leg(LM.knee.y - 8 * CUN.legLat), [0, 0, -1]),
  BL60: at(["foot", "leg"], v(A.x + 2.4, 7, -3.5), [0.6, 0, -1]),
  BL62: at("foot", v(A.x + 2.4, 4.9, -2.0), [1, 0, 0]),

  KI1: at("foot", v(A.x - 0.75, 1, 7.7), [0, -1, 0]),
  KI3: at(["foot", "leg"], v(A.x - 2.4, 8, -3.4), [-0.6, 0, -1]),
  KI6: at("foot", v(A.x - 2.4, 5.6, -1.4), [-1, 0, 0]),
  KI27: at("torso", chest(2, 137), [0.1, 0.1, 1]),

  PC6: at("arm", fa(2), [0, 0, 1]),
  PC7: at(["arm", "hand"], fa(0), [0, 0, 1]),
  PC8: at("hand", W.clone().add(v(1.0, -6.0, 0)), [0, 0, 1]),
  TE3: at("hand", W.clone().add(v(-1.7, -9.2, 0)), [0, 0, -1]),
  TE5: at("arm", fa(2), [0, 0, -1]),
  TE6: at("arm", fa(3), [0, 0, -1]),
  TE17: at("head", te17, [1, 0, -0.35]),

  GB14: at("head", v(3.2, 163, 4), [0.1, 0.15, 1]),
  GB20: at(["head", "neck"], gb20, [0.35, 0.1, -1]),
  GB21: at("torso", v(9.5, 140, -1.5), [0, 1, 0]),
  GB30: at(["torso", "leg"], v(10.7, 88.3, -4), [0.45, 0, -1]),
  GB31: at("leg", leg(LM.knee.y + 7 * CUN.thighLat, 2), [1, 0, 0]),
  GB34: at("leg", leg(42.5, 3.2, 0.8), [1, 0, 0.25]),
  GB39: at(["leg", "foot"], leg(LM.latMalleolus.y + 3 * CUN.legLat, 2.2), [1, 0, 0.2]),

  LR2: at("foot", v(A.x - 2.75, 1.5, 13.6), [0, 1, 0.25]),
  LR3: at("foot", v(A.x - 2.75, 3, 8.2), [0, 1, 0.2]),

  GV4: at("torso", back("L2", 0), [0, 0, -1]),
  GV14: at(["torso", "neck"], back("C7", 0), [0, 0.25, -1]),
  GV20: at("head", v(0, 166, -1), [0, 1, -0.15]),
  GV26: at("head", v(0, 152.1, 5), [0, 0, 1]),

  CV4: at("torso", v(0, umb - 3 * CUN.lowerAbdY, 0), [0, 0, 1]),
  CV6: at("torso", v(0, umb - 1.5 * CUN.lowerAbdY, 0), [0, 0, 1]),
  CV12: at("torso", v(0, umb + 4 * CUN.upperAbdY, 0), [0, 0, 1]),
  CV17: at("torso", v(0, LM.nippleY, 0), [0, 0, 1]),
  CV22: at(["torso", "neck"], v(0, 139.6, 0), [0, 0.25, 1]),

  YINTANG: at("head", v(0, 160.6, 5), [0, 0, 1]),
  TAIYANG: at("head", v(5, 159.2, 3.5), [1, 0, 0.5]),
  ANMIAN: at(["head", "neck"], gb20.clone().lerp(te17, 0.5), [0.8, 0, -0.6]),
  DINGCHUAN: at(["torso", "neck"], back("C7", 0.5), [0, 0.25, -1]),
  YAOTONGDIAN: [at("hand", W.clone().add(v(1.7, -3.6, 0)), [0, 0, -1]), at("hand", W.clone().add(v(-1.7, -3.6, 0)), [0, 0, -1])],
  WAILAOGONG: at("hand", W.clone().add(v(1.7, -9.2, 0)), [0, 0, -1]),
  NEIXIYAN: at("leg", leg(st35Y, -1.9, 1), [-0.45, 0, 1]),
};

export interface PlacedSpot {
  pos: THREE.Vector3;
  normal: THREE.Vector3;
}

/** Surface positions of every point: bilateral points get a mirrored copy on the right side. */
export function placePoints(body: Body): Map<string, PlacedSpot[]> {
  body.group.updateMatrixWorld(true);
  const out = new Map<string, PlacedSpot[]>();
  for (const p of ACUPOINTS) {
    const specs = SPECS[p.id];
    if (!specs) continue;
    const spots: PlacedSpot[] = [];
    for (const s of Array.isArray(specs) ? specs : [specs]) {
      const hit = snap(s.parts.flatMap((part) => body.parts[part]), s.anchor, s.dir);
      if (!hit) {
        if (import.meta.env.DEV) console.warn("[acupoints] no surface for", p.id);
        continue;
      }
      spots.push(hit);
      if (p.bilateral) spots.push({ pos: hit.pos.clone().setX(-hit.pos.x), normal: hit.normal.clone().setX(-hit.normal.x) });
    }
    out.set(p.id, spots);
  }
  return out;
}
