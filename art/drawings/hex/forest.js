// The forest hex: dense tree crowns seen from above on a dark forest floor, the picture every forest wedge is cut from.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the forest hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('forest', HEX_SEED);
}
