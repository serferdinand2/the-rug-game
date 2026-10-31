// Reviewed 32×32 Cloud City capital plot in its cream cloud, buildable variant 4: natural ground (#132).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('cloud-city-cream', 3);
}
