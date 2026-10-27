// Example-only swamp capital mat, composed from its tiles on the printed layout.
import { drawBiomeMat } from '../../parts/capital-biomes/swamp.js';

/** Draws the example mat: its layout × 32 pixels. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
