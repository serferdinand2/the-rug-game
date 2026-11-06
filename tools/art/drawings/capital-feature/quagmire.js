// The Quagmire mat's printed reeds on its buildable plots, as one transparent picture (#133).
import { drawFeatures } from '../../parts/capital-feature/index.js';
import { matData, matLayout } from '../../parts/capital-relief/index.js';

/** Draws the features at the mat's relief size, to lie between its ground and its relief. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawFeatures(
		/** @type {readonly string[]} */ (matLayout('quagmire')),
		'quagmire',
		matData('quagmire')
	);
}
