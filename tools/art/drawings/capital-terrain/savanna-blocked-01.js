// Savanna capital plot, impassable variant 1.
import { drawBiomeTile } from '../../parts/capital-biomes/savanna.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 0);
}
