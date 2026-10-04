import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { VIEWS, buildBody, type ViewId } from "../lib/body3d";
import { placePoints, type PlacedSpot } from "../lib/acuPlacement";
import { ACUPOINTS, pointById } from "../lib/acupoints";

export interface Highlight {
  id: string;
  n: number; // number shown on the badge
  color: string;
}

interface Props {
  highlights: Highlight[];
  selected: string | null;
  onSelect: (id: string) => void;
  view: { id: ViewId; nonce: number } | null;
  showAll: boolean;
  autoRotate: boolean;
  labelFor: (id: string) => string;
}

const CLOSE_REGIONS = new Set(["head", "hand", "foot"]);

function glowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}

function shadowTexture(): THREE.Texture {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/** A preset camera position, pulled back on narrow (portrait) canvases so the subject still fits. */
function viewPos(id: ViewId, aspect: number): THREE.Vector3 {
  const v = VIEWS[id];
  const target = new THREE.Vector3(...v.target);
  const offset = new THREE.Vector3(...v.pos).sub(target);
  return target.add(offset.multiplyScalar(Math.max(1, 0.85 / aspect)));
}

interface Marker {
  id: string;
  spot: PlacedSpot;
  dot: THREE.Mesh;
  pick: THREE.Mesh;
  glow: THREE.Sprite;
  label: CSS2DObject;
}

/** The interactive 3D figure. Three.js lives in refs; React only pushes props in. */
export default function BodyViewer({ highlights, selected, onSelect, view, showAll, autoRotate, labelFor }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<{
    markers: Marker[];
    spots: Map<string, PlacedSpot[]>;
    controls: OrbitControls;
    camera: THREE.PerspectiveCamera;
    fly: (pos: THREE.Vector3, target: THREE.Vector3) => void;
    dirty: () => void;
  } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // ---------- Scene setup (once) ----------
  useEffect(() => {
    const el = host.current!;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const labels = new CSS2DRenderer();
    labels.domElement.className = "acu-labels";
    el.appendChild(labels.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 12;
    controls.maxDistance = 480;
    controls.autoRotateSpeed = 1.2;
    const v0 = VIEWS.front;
    controls.target.set(...v0.target);

    scene.add(new THREE.HemisphereLight(0xfff6ee, 0x3a3f5c, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.7);
    key.position.set(120, 220, 180);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xc8d4ff, 0.7);
    fill.position.set(-160, 120, -200);
    scene.add(fill);
    const under = new THREE.DirectionalLight(0xffe2cc, 0.8);
    under.position.set(0, -200, 60);
    scene.add(under);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.05;
    scene.add(floor);

    const body = buildBody();
    scene.add(body.group);
    const bodyMeshes = body.group.children as THREE.Mesh[];
    const spots = placePoints(body);

    // One marker per spot (bilateral points have two).
    const glowTex = glowTexture();
    const dotGeo = new THREE.SphereGeometry(0.6, 16, 12);
    const pickGeo = new THREE.SphereGeometry(1.8, 8, 6);
    const pickMat = new THREE.MeshBasicMaterial({ visible: false });
    const markers: Marker[] = [];
    const markerGroup = new THREE.Group();
    scene.add(markerGroup);
    for (const p of ACUPOINTS) {
      for (const spot of spots.get(p.id) ?? []) {
        const pos = spot.pos.clone().addScaledVector(spot.normal, 0.25);
        const dot = new THREE.Mesh(dotGeo, new THREE.MeshBasicMaterial({ color: 0x999999 }));
        dot.position.copy(pos);
        const pick = new THREE.Mesh(pickGeo, pickMat);
        pick.position.copy(pos);
        pick.userData.id = p.id;
        const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        glow.position.copy(pos);
        glow.scale.setScalar(4);
        const div = document.createElement("button");
        div.type = "button";
        div.className = "acu-badge";
        div.addEventListener("click", () => onSelectRef.current(p.id));
        div.addEventListener("pointerdown", (e) => e.stopPropagation());
        const label = new CSS2DObject(div);
        label.position.copy(pos);
        label.center.set(-0.15, 1.15);
        markerGroup.add(dot, pick, glow, label);
        markers.push({ id: p.id, spot, dot, pick, glow, label });
      }
    }

    // Camera flights
    let flight: { from: THREE.Vector3; to: THREE.Vector3; tFrom: THREE.Vector3; tTo: THREE.Vector3; start: number; ms: number } | null = null;
    const fly = (pos: THREE.Vector3, target: THREE.Vector3) => {
      flight = { from: camera.position.clone(), to: pos, tFrom: controls.target.clone(), tTo: target, start: performance.now(), ms: 750 };
      dirty();
    };

    // Picking (click without dragging)
    const ray = new THREE.Raycaster();
    let down: { x: number; y: number } | null = null;
    const ndc = (e: PointerEvent) => {
      const r = renderer.domElement.getBoundingClientRect();
      return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    };
    const onDown = (e: PointerEvent) => (down = { x: e.clientX, y: e.clientY });
    const onUp = (e: PointerEvent) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
      ray.setFromCamera(ndc(e), camera);
      const picks = markers.filter((m) => m.dot.visible).map((m) => m.pick);
      const hit = ray.intersectObjects(picks, false)[0];
      if (!hit) return;
      const bodyHit = ray.intersectObjects(bodyMeshes, false)[0];
      // Ignore markers hidden behind the body.
      if (bodyHit && bodyHit.distance < hit.distance - 1.5) return;
      onSelectRef.current(hit.object.userData.id);
    };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointerup", onUp);

    // Labels are hidden when their spot faces away or something is in front of it.
    const occlusion = new THREE.Raycaster();
    let lastOcclusion = 0;
    const updateLabels = (now: number) => {
      if (now - lastOcclusion < 120) return;
      lastOcclusion = now;
      for (const m of markers) {
        const el = m.label.element as HTMLElement;
        if (!el.dataset.on) {
          m.label.visible = false;
          continue;
        }
        const toCam = camera.position.clone().sub(m.spot.pos);
        let visible = toCam.dot(m.spot.normal) > 0;
        if (visible) {
          const dist = toCam.length();
          occlusion.set(m.spot.pos.clone().addScaledVector(m.spot.normal, 0.6), toCam.normalize());
          occlusion.far = dist;
          visible = occlusion.intersectObjects(bodyMeshes, false).length === 0;
        }
        m.label.visible = visible;
      }
      // A paired point shows its name on whichever copy can be seen; the other keeps its number.
      const named = new Set<string>();
      for (const m of markers) {
        const el = m.label.element as HTMLElement;
        if (!el.dataset.long) continue;
        const long = m.label.visible && !named.has(m.id);
        if (long) named.add(m.id);
        const text = long ? el.dataset.long : el.dataset.short!;
        if (el.textContent !== text) el.textContent = text;
        el.classList.toggle("sel", long);
      }
    };

    let needsRender = true;
    const dirty = () => {
      needsRender = true;
      lastOcclusion = 0;
    };
    controls.addEventListener("change", dirty);

    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      labels.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      dirty();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    camera.position.copy(viewPos("front", camera.aspect));

    let raf = 0;
    let lastDist = -1;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (flight) {
        const t = Math.min(1, (now - flight.start) / flight.ms);
        const e = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
        camera.position.lerpVectors(flight.from, flight.to, e);
        controls.target.lerpVectors(flight.tFrom, flight.tTo, e);
        if (t >= 1) flight = null;
        needsRender = true;
      }
      // Keep markers about the same size on screen at any zoom.
      const camDist = camera.position.distanceTo(controls.target);
      if (Math.abs(camDist - lastDist) > 0.5) {
        lastDist = camDist;
        const k = THREE.MathUtils.clamp(camDist / 300, 0.28, 1);
        for (const m of markers) m.dot.scale.setScalar(m.dot.userData.base * k);
        for (const m of markers) m.glow.userData.k = k;
      }
      const pulsing = markers.some((m) => m.glow.visible);
      if (pulsing) {
        const s = 1 + 0.25 * Math.sin(now / 260);
        for (const m of markers) if (m.glow.visible) m.glow.scale.setScalar(m.glow.userData.base * (m.glow.userData.k ?? 1) * s);
        needsRender = true;
      }
      if (controls.update() || controls.autoRotate) needsRender = true;
      if (!needsRender) return;
      needsRender = false;
      updateLabels(now);
      renderer.render(scene, camera);
      labels.render(scene, camera);
    };
    raf = requestAnimationFrame(loop);

    api.current = { markers, spots, controls, camera, fly, dirty };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointerup", onUp);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose();
        const mat = m.material as THREE.Material | THREE.Material[] | undefined;
        (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
      });
      glowTex.dispose();
      renderer.dispose();
      el.innerHTML = "";
      api.current = null;
    };
  }, []);

  // ---------- Marker styling ----------
  useEffect(() => {
    const a = api.current;
    if (!a) return;
    const byId = new Map(highlights.map((h) => [h.id, h]));
    for (const m of a.markers) {
      const h = byId.get(m.id);
      const isSel = m.id === selected;
      const shown = !!h || isSel || showAll;
      m.dot.visible = m.pick.visible = shown;
      const color = new THREE.Color(h?.color ?? (isSel ? "#ffd166" : "#b8b3d6"));
      (m.dot.material as THREE.MeshBasicMaterial).color = color;
      m.dot.userData.base = isSel ? 1.7 : h ? 1.25 : 0.8;
      const k = THREE.MathUtils.clamp(a.camera.position.distanceTo(a.controls.target) / 300, 0.28, 1);
      m.dot.scale.setScalar(m.dot.userData.base * k);
      m.glow.userData.k = k;
      m.glow.visible = isSel;
      m.glow.userData.base = 6;
      (m.glow.material as THREE.SpriteMaterial).color = color;
      const el = m.label.element as HTMLButtonElement;
      if (h || isSel) {
        el.dataset.on = "1";
        el.style.setProperty("--c", h?.color ?? "#ffd166");
        el.dataset.short = String(h?.n ?? "•");
        if (isSel) el.dataset.long = `${h ? `${h.n} · ` : ""}${labelFor(m.id)}`;
        else delete el.dataset.long;
        el.classList.remove("sel");
        el.textContent = el.dataset.short;
      } else {
        delete el.dataset.on;
        m.label.visible = false;
      }
    }
    a.dirty();
  }, [highlights, selected, showAll, labelFor]);

  // ---------- Fly to the selected point ----------
  useEffect(() => {
    const a = api.current;
    const p = selected ? pointById(selected) : undefined;
    if (!a || !p) return;
    const spots = a.spots.get(p.id) ?? [];
    if (!spots.length) return;
    // Of the left/right copies, take the one already facing the camera.
    const cam = a.camera.position;
    const spot = spots.reduce((best, s) => (cam.clone().sub(s.pos).normalize().dot(s.normal) > cam.clone().sub(best.pos).normalize().dot(best.normal) ? s : best));
    const dist = CLOSE_REGIONS.has(p.region) ? 48 : p.region === "leg" || p.region === "arm" ? 85 : 100;
    const outward = spot.normal.clone().setY(spot.normal.y * 0.6).normalize();
    a.fly(spot.pos.clone().addScaledVector(outward, dist).add(new THREE.Vector3(0, dist * 0.12, 0)), spot.pos.clone());
  }, [selected]);

  // ---------- Preset views ----------
  useEffect(() => {
    const a = api.current;
    if (!a || !view) return;
    a.fly(viewPos(view.id, a.camera.aspect), new THREE.Vector3(...VIEWS[view.id].target));
  }, [view]);

  useEffect(() => {
    const a = api.current;
    if (!a) return;
    a.controls.autoRotate = autoRotate;
    a.dirty();
  }, [autoRotate]);

  return <div className="acu-canvas" ref={host} />;
}
