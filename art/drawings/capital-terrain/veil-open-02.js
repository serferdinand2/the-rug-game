// Veil capital plot, buildable variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/veil.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 1);
}
