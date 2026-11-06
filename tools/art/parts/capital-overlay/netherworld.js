// The Netherworld's printed imps and city centre over its relief: an imp on each 'I' plot, the gold ring on the 'C' plot (#133).
import { PITCH, PLOT } from '../../../../src/lib/art/relief.js';
import { drawCentre, drawImp } from '../capital-biomes/netherworld.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Paints an imp standing on each plot the layout marks 'I', and the city centre's tower in its gold ring on the 'C' plot.
 * @param {Canvas} canvas - Empty, the mat's relief size
 * @param {readonly string[]} layout
 */
export function paintNetherworldOverlay(canvas, layout) {
	layout.forEach((row, r) => {
		[...row].forEach((mark, c) => {
			const cx = c * PITCH + PLOT / 2;
			const cy = r * PITCH + PLOT / 2;
			if (mark === 'I') {
				drawImp(canvas, cx, cy);
			} else if (mark === 'C') {
				drawCentre(canvas, cx, cy);
			}
		});
	});
}
