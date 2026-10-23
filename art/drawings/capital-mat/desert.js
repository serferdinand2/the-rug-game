// Reviewed 9×9 desert capital mat; mask from research §6.2.
import { drawCapitalMat } from '../../parts/capital-terrain.js';

/** Draws the base capital mat at 288×288. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawCapitalMat('desert');
}
