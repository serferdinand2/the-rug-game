// The red conquer die's body (#61): a brick-red d6, its face left plain for the tray to draw the rolled VP on.
import { d6 } from '../../parts/dice.js';
import { PALETTE } from '../../palette.js';

/** @returns {import('../../painter.js').Canvas} */
export function draw() {
	return d6({
		light: PALETTE.brickRedLight,
		body: PALETTE.brickRed,
		shade: PALETTE.brickRedShade,
	});
}
