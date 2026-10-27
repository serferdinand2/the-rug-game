// Territory tile 20: sea, grassland, grassland, forest, sea, sea from the top-left corner; it gives 1 culture.
import { drawTerritory } from '../../parts/territory.js';
import { TERRITORY_TILES } from '../../../src/lib/engine/data/territory-tiles.js';

const ID = 20;

/** Draws the tile unturned, composed from the terrain hexes, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawTerritory({ ...TERRITORY_TILES[ID - 1], seed: ID });
}
