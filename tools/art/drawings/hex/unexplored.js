// The unexplored hex: dark fog with drifting wisps inside a dashed rim, as the map shows a hex nobody has explored.
import { HEX_SEED, drawHexTerrain } from '../../parts/territory.js';

/** Draws the unexplored hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('unexplored', HEX_SEED);
}
