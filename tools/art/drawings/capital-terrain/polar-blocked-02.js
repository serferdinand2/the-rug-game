// Polar 32×32 capital plot, impassable variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/polar.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 1);
}
