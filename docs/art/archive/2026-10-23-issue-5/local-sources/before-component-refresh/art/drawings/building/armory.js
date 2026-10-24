// The 32×32 style C armory icon.
import { drawIncomeBuilding } from '../../parts/income-building.js';

/** Draws the armory income building at 32×32. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawIncomeBuilding('armory');
}
