// The Savanna mat's printed herds and district borders, as one transparent picture laid over its relief (#133).
import { drawOverlay } from '../../parts/capital-overlay/index.js';
import { matData, matLayout } from '../../parts/capital-relief/index.js';

/** Draws the overlay at the mat's relief size, to lie over its relief. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawOverlay(
		/** @type {readonly string[]} */ (matLayout('savanna')),
		'savanna',
		matData('savanna')
	);
}
