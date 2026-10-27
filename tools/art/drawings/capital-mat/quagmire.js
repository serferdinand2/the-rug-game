// Example-only Quagmire capital mat, composed from its tiles on the printed layout.
import { drawBiomeMat } from '../../parts/capital-biomes/quagmire.js';

/** Draws the example mat; generate actual mats from tiles for each game. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
