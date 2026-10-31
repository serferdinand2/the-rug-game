// The Archipelago mat's impassable plots as one transparent 2.5D relief, drawn from its printed layout and volcanoes (#132).
import {
	drawRelief,
	matData,
	matLayout,
} from '../../parts/capital-relief/index.js';

/** Draws the relief at 296×362, its 11 rows, to lie over the mat's per-plot ground. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawRelief(
		/** @type {readonly string[]} */ (matLayout('archipelago')),
		'archipelago',
		matData('archipelago')
	);
}
