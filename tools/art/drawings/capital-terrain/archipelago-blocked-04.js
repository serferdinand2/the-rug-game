// Reviewed 32×32 archipelago capital plot, impassable variant 4 (#6).
import { drawBiomeTile } from '../../parts/capital-biomes/archipelago.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 3);
}
