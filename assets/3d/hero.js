// Homepage hero: the Guidify G as particles that flow to the products on scroll.
import { startFlight } from './flight.js';

const el = document.getElementById('hero-stage');
if (el) {
  startFlight(el).then((ok) => { if (ok) el.classList.add('is-3d'); });
}
