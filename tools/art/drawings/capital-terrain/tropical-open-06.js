// Reviewed 32×32 tropical capital plot, buildable variant 6.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('tropical', false, 5);
}
