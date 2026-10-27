// Netherworld 32×32 capital plot, impassable variant 5.
import { drawBiomeTile } from '../../parts/capital-biomes/netherworld.js';

/** Draws this fixed plot variant. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeTile(true, 4);
}
