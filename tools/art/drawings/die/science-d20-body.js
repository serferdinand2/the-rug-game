// Arts & Architecture's science die (#35): a cream d20, its face left plain for the tray to draw the rolled track on.
import { d20 } from '../../parts/dice.js';
import { PALETTE } from '../../palette.js';

/** @returns {import('../../painter.js').Canvas} */
export function draw() {
	return d20({
		face: PALETTE.creamLight,
		light: PALETTE.cream,
		body: PALETTE.creamShade,
		shade: PALETTE.stoneShade,
	});
}
