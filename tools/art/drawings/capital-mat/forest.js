// Example-only 9×9 forest capital mat: natural ground and its relief on the mask from research §6.2.
import { drawCapitalMat } from '../../parts/capital-terrain.js';

/** Draws a fixed example composition at 296×296; a game composes its own from ground tiles under the relief. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawCapitalMat('forest');
}
