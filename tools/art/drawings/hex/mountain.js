// The mountain hex: the 2.5D mountains painted alone, #82's snow-capped peaks and foothills on their alpine meadow (#134).
import { drawHexTerrain } from '../../parts/territory.js';

/** Draws the mountain hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('mountain');
}
