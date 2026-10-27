// Example-only 9×9 Cavern capital mat, composed from the biome's plots on its printed layout.
import { drawBiomeMat } from '../../parts/capital-biomes/cavern.js';

/** Draws a fixed example composition at 288×288. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
