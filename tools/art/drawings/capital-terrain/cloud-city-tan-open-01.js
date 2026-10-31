// Reviewed 32×32 Cloud City capital plot in its tan cloud, buildable variant 1: natural ground (#132).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('cloud-city-tan', 0);
}
