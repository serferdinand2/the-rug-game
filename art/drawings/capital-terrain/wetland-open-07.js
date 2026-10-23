// Reviewed 32×32 wetland capital plot, buildable variant 7.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('wetland', false, 6);
}
