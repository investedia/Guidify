// Your Guidify G, extruded into 3D. Built from the traced logo outline (4 pieces).
import { studioLights, shadowFloor, ease, lerp } from './common.js';

const DEPTH = 0.26;
const extrudeOpts = {
  depth: DEPTH,
  bevelEnabled: true,
  bevelThickness: 0.035,
  bevelSize: 0.03,
  bevelSegments: 4,
  curveSegments: 4,
};

function pieceGeometries(THREE, data) {
  return data.pieces.map((pts) => {
    const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(shape, extrudeOpts);
    geo.translate(0, 0, -DEPTH / 2); // centre each piece on z = 0
    geo.computeVertexNormals();
    return geo;
  });
}

export const variants = {
  // A · Solid: the G as one chamfered block, soft floor shadow, like a product object.
  solid: (ctx, data) => {
    const { THREE, scene } = ctx;
    studioLights(scene, { shadows: true });
    shadowFloor(THREE, scene, -1.55);
    const group = new THREE.Group();
    scene.add(group);
    const mat = new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: 0.32, metalness: 0.2, envMapIntensity: 1.0 });
    pieceGeometries(THREE, data).forEach((geo) => {
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
    });
    group.scale.setScalar(2.0);
    return {
      update(t, p, s, reduce) {
        group.rotation.y = 0.5 + p.x * 0.4 + (reduce ? 0 : Math.sin(t * 0.3) * 0.25) + s * 0.6;
        group.rotation.x = p.y * 0.15;
        group.position.y = reduce ? 0 : Math.sin(t * 0.5) * 0.04;
      },
    };
  },

  // B · Layers: the four strokes separate in depth, then close together. Idle and scroll both drive it.
  layers: (ctx, data) => {
    const { THREE, scene } = ctx;
    studioLights(scene, { shadows: false });
    const group = new THREE.Group();
    scene.add(group);
    const tones = [0xf2f2f2, 0xd2d2d2, 0xb0b0b0, 0xf2f2f2];
    const parts = pieceGeometries(THREE, data).map((geo, i) => {
      const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: tones[i % tones.length], roughness: 0.3, metalness: 0.25, envMapIntensity: 1.0 }));
      group.add(m);
      return { m, exZ: (i - 1.5) * 0.7, exRy: (i - 1.5) * 0.35 };
    });
    group.scale.setScalar(2.0);
    return {
      update(t, p, s, reduce) {
        const cycle = reduce ? 1 : 0.5 + 0.5 * Math.sin(t * 0.45 - Math.PI / 2);
        const a = Math.max(ease(cycle), s);
        parts.forEach(({ m, exZ, exRy }) => {
          m.position.z = lerp(exZ, 0, a);
          m.rotation.y = lerp(exRy, 0, a);
        });
        group.rotation.y = 0.4 + p.x * 0.4 + (reduce ? 0 : Math.sin(t * 0.25) * 0.2);
        group.rotation.x = p.y * 0.15;
      },
    };
  },

  // C · Mirror: polished metal with reflections sweeping as it turns.
  mirror: (ctx, data) => {
    const { THREE, scene } = ctx;
    studioLights(scene, { shadows: false });
    const group = new THREE.Group();
    scene.add(group);
    const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 1.0, envMapIntensity: 1.6 });
    pieceGeometries(THREE, data).forEach((geo) => group.add(new THREE.Mesh(geo, mat)));
    group.scale.setScalar(2.0);
    return {
      update(t, p, s, reduce) {
        group.rotation.y = (reduce ? 0 : t * 0.18) + p.x * 0.5 + s * 0.8;
        group.rotation.x = p.y * 0.2;
      },
    };
  },
};
