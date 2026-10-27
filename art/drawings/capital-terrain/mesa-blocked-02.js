// Reviewed 32×32 mesa capital plot, impassable variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/mesa.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 1);
}
