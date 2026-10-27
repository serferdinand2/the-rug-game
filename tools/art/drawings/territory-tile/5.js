// Territory tile 5: an island of desert in the sea; it gives 1 food.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 5;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
