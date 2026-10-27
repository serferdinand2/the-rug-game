// Reviewed 32×32 City in a Bottle capital plot, open variant 3.
import { drawBiomeTile } from '../../parts/capital-biomes/city-in-a-bottle.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 2);
}
