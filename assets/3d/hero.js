// Homepage hero: the solid Guidify G, extruded from the traced logo, with a soft floor shadow.
import { mount } from './common.js';
import { variants } from './logo3d.js';

const el = document.getElementById('hero-stage');
if (el) {
  const data = await (await fetch('assets/3d/g-outline.json')).json();
  mount(el, (ctx) => variants.solid(ctx, data), { z: 8, fov: 30 });
}
