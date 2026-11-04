// Guidify G, Layers. Scroll unbuilds the mark: the four strokes lift apart in turn,
// each lagging slightly behind the last so the motion feels fluid. Scroll back up and they rebuild.
import { studioLights, shadowFloor } from './common.js';

const DEPTH = 0.26;
const extrude = {
  depth: DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.008,
  bevelSize: 0.006,
  bevelSegments: 2,
  curveSegments: 12,
};
const tones = [0xf6f6f6, 0xd9d9d9, 0xbcbcbc, 0xe8e8e8];

export function buildLayers({ THREE, scene }, data) {
  studioLights(scene, { shadows: true });
  shadowFloor(THREE, scene, -1.6);

  // A soft light that circles the mark, so the lacquer catches a moving highlight.
  const sweep = new THREE.PointLight(0xffffff, 9, 0, 2);
  scene.add(sweep);

  const group = new THREE.Group();
  scene.add(group);

  const parts = data.pieces.map((pts, i) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, extrude);
    geo.translate(0, 0, -DEPTH / 2);
    const mat = new THREE.MeshPhysicalMaterial({
      color: tones[i % tones.length],
      roughness: 0.38 + i * 0.04,
      metalness: 0.15,
      clearcoat: 0.7,
      clearcoatRoughness: 0.18,
      envMapIntensity: 1.1,
    });
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
    return {
      m, i,
      cur: 0,
      exZ: (i - 1.5) * 0.9,
      exY: (i - 1.5) * 0.14,
      exRy: (i - 1.5) * 0.45,
      rate: 0.045 + i * 0.012, // each stroke eases at its own pace
    };
  });
  group.scale.setScalar(2.0);

  let hover = 0;
  return {
    update(t, p, s, reduce) {
      const hoverTarget = reduce ? 0 : Math.min(1, Math.hypot(p.x, p.y)) * 0.12;
      hover += (hoverTarget - hover) * 0.05;
      const idle = reduce ? 0 : (Math.sin(t * 0.6) * 0.5 + 0.5) * 0.04;
      const master = Math.min(1, s * 1.3); // scroll drives the unbuild

      parts.forEach((P) => {
        // Staggered: the first stroke leaves first, the last one trails behind.
        const want = Math.min(1, Math.max(0, master * 1.25 - P.i * 0.12 + hover + idle));
        P.cur += (want - P.cur) * (reduce ? 1 : P.rate);
        P.m.position.set(0, P.exY * P.cur, P.exZ * P.cur);
        P.m.rotation.y = P.exRy * P.cur;
      });

      sweep.position.set(Math.cos(t * 0.35) * 4, 2.2, Math.sin(t * 0.35) * 4 + 1);
      group.rotation.y = 0.4 + p.x * 0.35 + (reduce ? 0 : Math.sin(t * 0.25) * 0.18) + s * 0.5;
      group.rotation.x = p.y * 0.12;
      group.position.y = reduce ? 0 : Math.sin(t * 0.5) * 0.03;
    },
  };
}
