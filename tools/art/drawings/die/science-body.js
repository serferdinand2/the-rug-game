// The science die's body (#61): a cream d12, its face left plain for the tray to draw the rolled track on.
import { d12 } from '../../parts/dice.js';
import { PALETTE } from '../../palette.js';

/** @returns {import('../../painter.js').Canvas} */
export function draw() {
	return d12({
		face: PALETTE.creamLight,
		light: PALETTE.cream,
		body: PALETTE.creamShade,
		shade: PALETTE.stoneShade,
	});
}
