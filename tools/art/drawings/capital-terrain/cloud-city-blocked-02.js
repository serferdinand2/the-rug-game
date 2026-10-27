// Reviewed 32×32 Cloud City capital plot, impassable variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/cloud-city.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 1);
}
