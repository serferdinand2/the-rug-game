// Reviewed 32×32 Veil capital plot, buildable variant 2: natural ground, its worldly meadow (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('veil-worldly', 1);
}
