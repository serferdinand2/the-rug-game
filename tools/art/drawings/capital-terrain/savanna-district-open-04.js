// Reviewed 32×32 Savanna capital plot, buildable variant 4: natural ground, its district ground (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('savanna-district', 3);
}
