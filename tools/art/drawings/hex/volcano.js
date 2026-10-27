// The map's volcano (R77): a dark cone glowing with lava under a column of dark ash, laid on a mountain corner.
import { drawVolcano } from '../../parts/territory.js';

/** Draws the volcano overlay, 17×17 and transparent round the volcano. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawVolcano();
}
