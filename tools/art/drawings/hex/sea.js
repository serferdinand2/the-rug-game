// The sea hex: the 2.5D sea painted alone, long bands of depth under short wave crests lit on top (#134).
import { drawHexTerrain } from '../../parts/territory.js';

/** Draws the sea hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('sea');
}
