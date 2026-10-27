// Territory tile 29: sea, desert, desert, grassland, grassland, sea from the top-left corner; it gives 1 tapestry card.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 29;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
