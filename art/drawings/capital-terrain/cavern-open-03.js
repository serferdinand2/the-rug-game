// Reviewed 32×32 Cavern capital plot, buildable variant 3.
import { drawBiomeTile } from '../../parts/capital-biomes/cavern.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 2);
}
