// Shared scene mount for the Guidify 3D concepts.
// Handles renderer setup, resizing, pointer easing, scroll progress,
// pausing when offscreen or hidden, reduced motion and WebGL fallback.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export function mount(el, buildConcept, opts = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
  } catch (err) {
    el.classList.add('is-static'); // WebGL unavailable: the static SVG stays visible
    return null;
  }

  // Cap pixel ratio to keep fill-rate cheap on phones and 4K screens.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // Procedural studio reflections: no HDR download, which keeps the page light.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 30, 1, 0.1, 100);
  camera.position.set(0, opts.y ?? 0, opts.z ?? 8);
  camera.lookAt(0, 0, 0);

  const concept = buildConcept({ THREE, scene, camera, renderer });

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  });
  el.addEventListener('pointerleave', () => { pointer.tx = 0; pointer.ty = 0; });

  const resize = () => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(el);
  resize();

  // 0 at rest, rising as the hero scrolls away.
  const scrollProgress = () => {
    const r = el.getBoundingClientRect();
    return Math.min(1, Math.max(0, -r.top / window.innerHeight));
  };

  const t0 = performance.now();
  let visible = true;
  let running = false;
  let raf = 0;

  const frame = (now) => {
    const t = (now - t0) / 1000;
    pointer.x += (pointer.tx - pointer.x) * 0.05;
    pointer.y += (pointer.ty - pointer.y) * 0.05;
    concept.update(t, pointer, scrollProgress(), false);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (running || !visible || document.hidden || reduceMotion.matches) return;
    running = true;
    raf = requestAnimationFrame(frame);
  };
  const stop = () => {
    running = false;
    cancelAnimationFrame(raf);
  };

  // Pause rendering whenever the canvas is offscreen or the tab is hidden.
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  }).observe(el);
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));

  // Reduced motion: draw one still frame, no loop.
  const drawStill = () => {
    stop();
    concept.update(0, pointer, 0, true);
    renderer.render(scene, camera);
  };
  reduceMotion.addEventListener('change', () => (reduceMotion.matches ? drawStill() : start()));
  if (reduceMotion.matches) drawStill();

  el.classList.add('is-3d');
  start();
  return { start, stop };
}

// Shared key and fill light for all concepts.
export function studioLights(scene, { shadows = true } = {}) {
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(3, 5, 4);
  key.castShadow = shadows;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3;
  key.shadow.camera.right = 3;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -3;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  const fill = new THREE.HemisphereLight(0xffffff, 0x1a1a1a, 0.5);
  scene.add(key, fill);
  return key;
}

// Soft contact shadow on a transparent floor: only the shadow is drawn.
export function shadowFloor(THREE, scene, y) {
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(14, 14),
    new THREE.ShadowMaterial({ opacity: 0.45 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = y;
  floor.receiveShadow = true;
  scene.add(floor);
  return floor;
}

export const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const lerp = (a, b, t) => a + (b - a) * t;
