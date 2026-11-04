// Guidify G particles. The mark is 1,400 small arrows arranged as the G.
// Scroll sends them, in order along the stroke, to the Investedia and Droplates cards.
import * as THREE from 'three';

const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export async function startFlight(stageEl) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (err) {
    return false; // no WebGL: the static logo image stays
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const canvas = renderer.domElement;
  canvas.id = 'flight';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.prepend(canvas);

  const { points } = await (await fetch('assets/3d/g-particles.json')).json();
  const N = points.length;

  // Arrow: a slim triangle, drawn in CSS pixels.
  const shape = new THREE.Shape();
  shape.moveTo(1, 0);
  shape.lineTo(-0.7, 0.55);
  shape.lineTo(-0.35, 0);
  shape.lineTo(-0.7, -0.55);
  shape.closePath();
  const mesh = new THREE.InstancedMesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial(), N);
  const c = new THREE.Color();
  for (let i = 0; i < N; i++) mesh.setColorAt(i, c.setScalar(0.62 + 0.38 * hash(i)));
  mesh.instanceColor.needsUpdate = true;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);

  let W = 1, H = 1;
  const resize = () => {
    W = window.innerWidth;
    H = window.innerHeight;
    renderer.setSize(W, H, false);
    cam.left = 0; cam.right = W; cam.top = H; cam.bottom = 0;
    cam.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const dummy = new THREE.Object3D();
  const tgtA = () => document.querySelector('#investedia .frame');
  const tgtB = () => document.querySelectorAll('.showcase .frame')[1];
  const center = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  };

  const start = performance.now();
  const frame = (now) => {
    const t = (now - start) / 1000;
    const still = reduce.matches;

    // Scroll drives the flight: 0 at the top, 1 once the page is well down.
    const f = still ? 0 : clamp((window.scrollY - 80) / (window.innerHeight * 0.7));

    const r = stageEl.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const scale = Math.min(r.width, r.height) * 0.42;
    const A = center(tgtA());
    const B = center(tgtB());

    for (let i = 0; i < N; i++) {
      const [x, y, order] = points[i];
      // Home: the G, with a slow breathing motion.
      const bob = still ? 0 : Math.sin(t * 0.9 + i * 0.05) * 1.2;
      const hx = cx + x * scale + bob;
      const hy = cy - y * scale + bob;
      // Each arrow starts when the flow reaches its place in the stroke.
      const p = ease(clamp((f - order * 0.45) / 0.55));
      const target = (i % 2 === 0 ? A : B) || { x: hx, y: hy + 300 };
      // Curved path: bend each arrow out to one side, so the flow reads as movement.
      const dx = target.x - hx, dy = target.y - hy;
      const side = i % 2 === 0 ? 1 : -1;
      const cxp = (hx + target.x) / 2 - dy * 0.18 * side;
      const cyp = (hy + target.y) / 2 + dx * 0.18 * side;
      const u = p;
      let px = (1 - u) * (1 - u) * hx + 2 * (1 - u) * u * cxp + u * u * target.x;
      let py = (1 - u) * (1 - u) * hy + 2 * (1 - u) * u * cyp + u * u * target.y;
      // Direction of travel: at rest the arrows follow the stroke, in flight they follow the path.
      let tx, ty;
      if (p < 0.001) {
        const rx = x, ry = y;
        tx = -ry; ty = rx; // counter-clockwise tangent of the G
      } else {
        tx = 2 * (1 - u) * (cxp - hx) + 2 * u * (target.x - cxp);
        ty = 2 * (1 - u) * (cyp - hy) + 2 * u * (target.y - cyp);
      }
      const ang = Math.atan2(-ty, tx); // flip y: DOM is down, world is up
      // Arrows shrink as they reach a card, so they seem to enter it.
      const size = (5.5 + 5 * (1 - p)) * (1 - 0.85 * ease(clamp((p - 0.85) / 0.15)));
      dummy.position.set(px, H - py, 0);
      dummy.rotation.set(0, 0, ang);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, cam);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  return true;
}
