// The sea hex: deep blue water with darker depths and wave crests, the picture every sea wedge is cut from.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the sea hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('sea', HEX_SEED);
}
