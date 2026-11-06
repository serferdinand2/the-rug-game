// The City in a Bottle mat's impassable plots as one transparent 2.5D relief, drawn from its printed layout (#133).
import {
	drawRelief,
	matData,
	matLayout,
} from '../../parts/capital-relief/index.js';

/** Draws the relief at 197×197, to lie over the mat's per-plot ground. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawRelief(
		/** @type {readonly string[]} */ (matLayout('city-in-a-bottle')),
		'city-in-a-bottle',
		matData('city-in-a-bottle')
	);
}
