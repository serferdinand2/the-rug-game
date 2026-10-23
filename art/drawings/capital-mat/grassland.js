// Example-only 9×9 grassland capital mat; mask from research §6.2.
import { drawCapitalMat } from '../../parts/capital-terrain.js';

/** Draws a fixed example composition at 288×288; generate actual mats from tiles for each game. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawCapitalMat('grassland');
}
