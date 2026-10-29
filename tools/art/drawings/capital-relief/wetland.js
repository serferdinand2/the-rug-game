// The Wetland mat's impassable plots as one transparent 2.5D relief, drawn from its printed layout (#82).
import { CAPITAL_GRIDS } from '../../parts/capital-terrain.js';
import { drawRelief } from '../../parts/capital-relief/index.js';

/** Draws the relief at 296×296, to lie over the mat's per-plot ground. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawRelief(CAPITAL_GRIDS.wetland, 'wetland');
}
