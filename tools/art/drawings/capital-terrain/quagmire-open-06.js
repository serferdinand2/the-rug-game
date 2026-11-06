// Reviewed 32×32 Quagmire capital plot, buildable variant 6: natural ground, its bog (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('quagmire', 5);
}
