// Reviewed 32×32 Cloud City capital plot, buildable variant 7.
import { drawBiomeTile } from '../../parts/capital-biomes/cloud-city.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(false, 6);
}
