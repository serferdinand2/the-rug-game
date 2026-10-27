// Reviewed 32×32 mountain capital plot, impassable variant 2.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('mountain', true, 1);
}
