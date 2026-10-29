// Territory tile 5: an island of desert in the sea; it gives 1 food.
import { paintTerritory } from '../../../../src/lib/art/paint/map.js';
import { TERRITORY_TILES } from '../../../../src/lib/engine/data/territory-tiles.js';

const ID = 5;

/** Draws the tile unturned, painted as the map paints it alone, 64×56. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return paintTerritory(TERRITORY_TILES[ID - 1]);
}
