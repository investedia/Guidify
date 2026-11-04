// Homepage hero: the Guidify G in Layers form, built from the traced logo outline.
import { mount } from './common.js';
import { buildLayers } from './hero-layers.js';

const el = document.getElementById('hero-stage');
if (el) {
  const data = await (await fetch('assets/3d/g-outline.json')).json();
  mount(el, (ctx) => buildLayers(ctx, data), { z: 8, fov: 30 });
}
