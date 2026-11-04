// Homepage hero: the solid Guidify G. On scroll it turns and its parts fly to the product titles.
import { startFlight } from './flight.js';

const el = document.getElementById('hero-stage');
if (el) {
  startFlight(el).then((ok) => { if (ok) el.classList.add('is-3d'); });
}
