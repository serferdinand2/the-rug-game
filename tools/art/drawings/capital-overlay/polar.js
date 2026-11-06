// The Polar mat's printed field lines and rings, as one transparent picture laid over its relief (#133).
import { drawOverlay } from '../../parts/capital-overlay/index.js';
import { matData, matLayout } from '../../parts/capital-relief/index.js';

/** Draws the overlay at the mat's relief size, to lie over its relief. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawOverlay(
		/** @type {readonly string[]} */ (matLayout('polar')),
		'polar',
		matData('polar')
	);
}
