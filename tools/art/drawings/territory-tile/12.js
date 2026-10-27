// Territory tile 12: sea, mountain, mountain, mountain, desert, desert from the top-left corner; it gives a research roll without its benefit.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 12;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
