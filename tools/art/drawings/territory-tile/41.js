// Territory tile 41: an island of mountain in the sea; it gives 1 food.
import { paintTerritory } from '../../../../src/lib/art/paint/map.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 41;

/** Draws the tile unturned, painted as the map paints it alone, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return paintTerritory(TERRITORY_TILES[ID - 1]);
}
