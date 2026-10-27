// The desert hex: warm sand with crescent dunes lit from the top left, the picture every desert wedge is cut from.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the desert hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('desert', HEX_SEED);
}
