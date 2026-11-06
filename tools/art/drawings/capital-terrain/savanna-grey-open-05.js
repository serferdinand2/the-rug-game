// Reviewed 32×32 Savanna capital plot, buildable variant 5: natural ground, its grey ground outside the districts (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('savanna-grey', 4);
}
