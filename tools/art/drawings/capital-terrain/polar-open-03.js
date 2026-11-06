// Reviewed 32×32 Polar capital plot, buildable variant 3: natural ground, its snow (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('polar', 2);
}
