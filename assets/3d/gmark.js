// Guidify G marks. Three directions share one G centreline, drawn as a square-section tube.
import { studioLights } from './common.js';

const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

// The Guidify G centreline: arc from 40° round to 330°, then up into the bar.
export function gCurve(THREE) {
  const pts = [];
  for (let a = 40; a <= 330; a += 5) {
    const r = (a * Math.PI) / 180;
    pts.push(new THREE.Vector3(Math.cos(r), Math.sin(r), 0));
  }
  pts.push(
    new THREE.Vector3(0.92, -0.45, 0),
    new THREE.Vector3(0.94, -0.05, 0),
    new THREE.Vector3(0.5, -0.05, 0),
    new THREE.Vector3(0.12, -0.05, 0)
  );
  return new THREE.CatmullRomCurve3(pts, false, 'centripetal');
}

const metal = (THREE, color, roughness = 0.3, metalness = 0.55) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness, envMapIntensity: 1.3 });

export const concepts = {
  // 1. Monolith: the G floats in front of a dark slab, giving architectural depth.
  monolith: ({ THREE, scene }) => {
    studioLights(scene, { shadows: false });
    const group = new THREE.Group();
    scene.add(group);
    const g = new THREE.Mesh(new THREE.TubeGeometry(gCurve(THREE), 420, 0.13, 4, false), metal(THREE, 0xeeeeee));
    g.scale.setScalar(1.45);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(2.9, 2.9, 0.08), metal(THREE, 0x1e1e1e, 0.5, 0.3));
    slab.position.set(0, 0, -0.45);
    group.add(g, slab);
    return {
      update(t, p, s, reduce) {
        group.rotation.y = p.x * 0.35 + (reduce ? 0 : Math.sin(t * 0.25) * 0.2) + s * 0.5;
        group.rotation.x = p.y * 0.12;
        group.position.y = reduce ? 0 : Math.sin(t * 0.5) * 0.04;
      },
    };
  },

  // 2. Orbit G: a central G inside two tilted rings, with three product nodes riding one ring.
  orbit: ({ THREE, scene }) => {
    studioLights(scene, { shadows: false });
    const group = new THREE.Group();
    scene.add(group);
    const g = new THREE.Mesh(new THREE.TubeGeometry(gCurve(THREE), 420, 0.09, 4, false), metal(THREE, 0xeeeeee));
    g.scale.setScalar(1.45);
    group.add(g);
    const ringMat = metal(THREE, 0xbdbdbd, 0.25, 0.7);
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.02, 16, 256), ringMat);
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.02, 16, 256), ringMat);
    ringA.rotation.set(1.25, 0.2, 0);
    ringB.rotation.set(0.35, 0.9, 0.5);
    group.add(ringA, ringB);
    const nodeMat = metal(THREE, 0xffffff, 0.3, 0.4);
    const nodes = [0, 1, 2].map((i) => {
      const n = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16), nodeMat);
      const a = (i * Math.PI * 2) / 3;
      n.position.set(2.0 * Math.cos(a), 2.0 * Math.sin(a), 0);
      ringA.add(n); // nodes ride the ring
      return n;
    });
    return {
      update(t, p, s, reduce) {
        group.rotation.y = p.x * 0.35 + (reduce ? 0 : Math.sin(t * 0.2) * 0.18) + s * 0.5;
        group.rotation.x = p.y * 0.12;
        ringA.rotation.z = reduce ? 0 : t * 0.15;
        ringB.rotation.z = reduce ? 0 : -t * 0.1;
      },
    };
  },

  // 3. Skyline G: the G's centreline extruded in depth into towers of varying height.
  skyline: ({ THREE, scene }) => {
    studioLights(scene, { shadows: false });
    const group = new THREE.Group();
    scene.add(group);
    const curve = gCurve(THREE);
    const base = new THREE.Mesh(new THREE.TubeGeometry(curve, 420, 0.04, 4, false), metal(THREE, 0x9c9c9c, 0.35, 0.7));
    base.scale.setScalar(1.45);
    group.add(base);
    const N = 64;
    const towers = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.11, 0.11, 1),
      metal(THREE, 0xffffff, 0.28, 0.6),
      N
    );
    const d = new THREE.Object3D();
    const c = new THREE.Color();
    for (let i = 0; i < N; i++) {
      const p = curve.getPointAt(i / (N - 1));
      const h = 0.3 + 1.8 * hash(i) ** 1.5;
      d.position.set(p.x * 1.45, p.y * 1.45, 0);
      d.scale.set(1, 1, h);
      d.updateMatrix();
      towers.setMatrixAt(i, d.matrix);
      towers.setColorAt(i, c.setScalar(0.45 + 0.55 * (h / 2.1)));
    }
    towers.instanceMatrix.needsUpdate = true;
    towers.instanceColor.needsUpdate = true;
    group.add(towers);
    return {
      update(t, p, s, reduce) {
        group.rotation.y = p.x * 0.4 + (reduce ? 0 : Math.sin(t * 0.25) * 0.25) + s * 0.6;
        group.rotation.x = p.y * 0.12;
      },
    };
  },
};
