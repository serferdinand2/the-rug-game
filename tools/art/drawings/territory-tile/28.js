// Territory tile 28: an island of grassland in the sea; it gives 1 coin.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 28;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
