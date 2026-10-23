// Reviewed 32×32 wetland capital plot, impassable variant 5.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('wetland', true, 4);
}
