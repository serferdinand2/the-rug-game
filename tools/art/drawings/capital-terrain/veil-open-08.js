// Veil capital plot, buildable variant 8.
import { drawBiomeTile } from '../../parts/capital-biomes/veil.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 7);
}
