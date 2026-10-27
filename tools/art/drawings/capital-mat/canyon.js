// Example-only canyon capital mat composed from its tiles on the printed layout (#6).
import { drawBiomeMat } from '../../parts/capital-biomes/canyon.js';

/** Draws a fixed example composition; generate actual mats from tiles for each game. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawBiomeMat();
}
