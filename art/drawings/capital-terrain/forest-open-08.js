// Reviewed 32×32 forest capital plot, buildable variant 8.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('forest', false, 7);
}
