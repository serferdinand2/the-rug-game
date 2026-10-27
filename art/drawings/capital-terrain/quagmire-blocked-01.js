// Reviewed 32×32 Quagmire capital plot, blocked variant 1.
import { drawBiomeTile } from '../../parts/capital-biomes/quagmire.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 0);
}
