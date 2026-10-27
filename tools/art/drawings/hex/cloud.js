// The map's cloud (R77): three white puffs shaded underneath, laid over a territory at CLOUD_SPOT, wholly inside the hex.
import { drawCloud } from '../../parts/territory.js';

/** Draws the cloud overlay, 22×12 and transparent round the cloud. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawCloud();
}
