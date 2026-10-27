// Reviewed 32×32 swamp capital plot, buildable variant 3.
import { drawBiomeTile } from '../../parts/capital-biomes/swamp.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 2);
}
