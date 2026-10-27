// Territory tile 4: sea, mountain, desert, sea, sea, sea from the top-left corner; it gives 1 culture.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../src/lib/engine/data/territory-tiles.js';

const ID = 4;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
