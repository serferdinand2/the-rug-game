// Territory tile 2: sea, mountain, mountain, desert, desert, sea from the top-left corner; it gives 2 territory tiles.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 2;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
