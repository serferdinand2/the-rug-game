// The 32×32 style C farm icon.
import { drawIncomeBuilding } from '../../parts/income-building.js';

/** Draws the farm income building at 32×32. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawIncomeBuilding('farm');
}
