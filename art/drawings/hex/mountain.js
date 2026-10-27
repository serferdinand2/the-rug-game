// The mountain hex: grey scree under a crowd of snow-capped peaks, the picture every mountain wedge is cut from.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the mountain hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('mountain', HEX_SEED);
}
