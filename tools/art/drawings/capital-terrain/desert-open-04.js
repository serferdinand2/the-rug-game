// Reviewed 32×32 desert capital plot, buildable variant 4.
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('desert', 3);
}
