// Reviewed 32×32 City in a Bottle capital plot, buildable variant 7: natural ground, its seabed sand (#133).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('city-in-a-bottle', 6);
}
