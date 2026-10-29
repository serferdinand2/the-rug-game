// The grassland hex: the 2.5D grassland painted alone, #82's golden meadow, open land with no relief (#134).
import { drawHexTerrain } from '../../parts/territory.js';

/** Draws the grassland hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('grassland');
}
