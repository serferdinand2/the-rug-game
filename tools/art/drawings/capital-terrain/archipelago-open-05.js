// Reviewed 32×32 Archipelago capital plot, buildable variant 5: natural ground (#132).
import { drawTile } from '../../parts/capital-terrain.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTile('archipelago', 4);
}
