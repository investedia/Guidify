// Guidify G: the solid four-part mark stays put at rest. On scroll the whole G turns in 3D,
// then its parts leave in order and fly to the product titles.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export async function startFlight(stageEl) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    return false; // no WebGL: the static logo image stays
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.id = 'flight';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-3, 5, 6);
  scene.add(key, new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.5));

  // Same solid mark as before: four extruded parts, traced from the logo, sharp chamfers.
  const data = await (await fetch('assets/3d/g-outline.json')).json();
  const DEPTH = 0.26;
  const extrude = { depth: DEPTH, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2, curveSegments: 12 };
  const tones = [0xf6f6f6, 0xd9d9d9, 0xbcbcbc, 0xe8e8e8];
  const parts = data.pieces.map((pts, i) => {
    const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p[1], 0) / pts.length;
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x - cx, y - cy)));
    const geo = new THREE.ExtrudeGeometry(shape, extrude);
    geo.translate(0, 0, -DEPTH / 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: tones[i % tones.length], roughness: 0.38 + i * 0.04, metalness: 0.15,
      clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 1.1,
    });
    const m = new THREE.Mesh(geo, mat);
    scene.add(m);
    return { m, cx, cy, order: i };
  });

  // Pixel-true perspective camera: one unit of world space is one CSS pixel at z = 0.
  const FOV = 30;
  const cam = new THREE.PerspectiveCamera(FOV, 1, 1, 8000);
  let W = 1, H = 1;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
    const dist = (H / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    cam.aspect = W / H;
    cam.position.set(W / 2, H / 2, dist);
    cam.lookAt(W / 2, H / 2, 0);
    cam.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  // Product titles are the destinations, in DOM order: Investedia, then Droplates.
  const titles = () => Array.from(document.querySelectorAll('.showcase-copy h3'));
  const toWorld = (x, y) => new THREE.Vector3(x, H - y, 0);
  const centreOf = (el) => {
    const r = el.getBoundingClientRect();
    return toWorld(r.left + r.width / 2, r.top + r.height / 2);
  };

  const start = performance.now();
  const frame = (now) => {
    const t = (now - start) / 1000;
    const still = reduce.matches;
    const f = still ? 0 : clamp((window.scrollY - 80) / (window.innerHeight * 0.7));

    const r = stageEl.getBoundingClientRect();
    const C = toWorld(r.left + r.width / 2, r.top + r.height / 2);
    const unit = Math.min(r.width, r.height) * 0.42;
    // The whole G turns: a slow idle sway, plus a clear turn as you scroll.
    const rotY = (still ? 0 : Math.sin(t * 0.3) * 0.2) + f * 1.1;
    const rotX = (still ? 0 : Math.sin(t * 0.25) * 0.05) + f * 0.3;
    const cs = Math.cos(rotY), sn = Math.sin(rotY);
    const T = titles();
    const tgt = T.length ? T.map(centreOf) : [];

    parts.forEach((P) => {
      // Where the part sits in the G when at rest, after the G's own turn.
      const home = new THREE.Vector3(
        C.x + P.cx * unit * cs,
        C.y + P.cy * unit * Math.cos(rotX),
        C.z - P.cx * unit * sn
      );
      // Parts leave one after another, in the order of their place in the G.
      const p = ease(clamp((f - P.order * 0.16) / 0.5));
      const dest = tgt.length ? tgt[P.order < 2 ? 0 : 1] : home;
      const side = P.order % 2 === 0 ? 1 : -1;
      const ctrl = new THREE.Vector3().lerpVectors(home, dest, 0.5);
      ctrl.x += side * 140;
      ctrl.z += 220;
      const u = p;
      P.m.position.set(
        (1 - u) * (1 - u) * home.x + 2 * (1 - u) * u * ctrl.x + u * u * dest.x,
        (1 - u) * (1 - u) * home.y + 2 * (1 - u) * u * ctrl.y + u * u * dest.y,
        (1 - u) * (1 - u) * home.z + 2 * (1 - u) * u * ctrl.z + u * u * dest.z
      );
      P.m.rotation.set(rotX + p * 0.9 * side, rotY + p * Math.PI * 0.8, p * 0.6);
      // Parts shrink as they land on the title, so they seem to become the text.
      const shrink = 1 - 0.8 * ease(clamp((p - 0.7) / 0.3));
      P.m.scale.setScalar(unit * shrink);
    });

    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}
