// Reviewed 32×32 tropical capital plot, impassable variant 1.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('tropical', true, 0);
}
