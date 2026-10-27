// Reviewed 32×32 canyon capital plot, buildable variant 8 (#6).
import { drawBiomeTile } from '../../parts/capital-biomes/canyon.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 7);
}
