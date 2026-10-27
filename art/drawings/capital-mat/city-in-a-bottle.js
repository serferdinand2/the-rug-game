// Example-only City in a Bottle capital mat, composed from its tiles on the printed layout.
import { drawBiomeMat } from '../../parts/capital-biomes/city-in-a-bottle.js';

/** Draws the example mat; generate actual mats from tiles for each game. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
