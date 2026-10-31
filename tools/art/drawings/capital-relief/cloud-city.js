// The Cloud City mat's impassable plots as one transparent 2.5D relief, drawn from its printed layout and clouds (#132).
import {
	drawRelief,
	matData,
	matLayout,
} from '../../parts/capital-relief/index.js';

/** Draws the relief at 296×296, to lie over the mat's per-plot ground. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawRelief(
		/** @type {readonly string[]} */ (matLayout('cloud-city')),
		'cloud-city',
		matData('cloud-city')
	);
}
