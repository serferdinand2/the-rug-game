// The grassland hex: a bright meadow with tufts, bushes and flowers, the picture every grassland wedge is cut from.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the grassland hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('grassland', HEX_SEED);
}
