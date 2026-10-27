// Veil capital plot, impassable variant 3.
import { drawBiomeTile } from '../../parts/capital-biomes/veil.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 2);
}
