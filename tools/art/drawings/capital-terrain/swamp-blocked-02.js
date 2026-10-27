// Reviewed 32×32 swamp capital plot, impassable variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/swamp.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 1);
}
