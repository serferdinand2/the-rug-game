// Example-only 9×9 Netherworld capital mat, composed from its tiles on the printed layout.
import { drawBiomeMat } from '../../parts/capital-biomes/netherworld.js';

/** Draws the example mat at 288×288. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
