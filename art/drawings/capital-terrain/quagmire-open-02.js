// Reviewed 32×32 Quagmire capital plot, open variant 2.
import { drawBiomeTile } from '../../parts/capital-biomes/quagmire.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 1);
}
