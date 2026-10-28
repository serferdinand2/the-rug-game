// The black conquer die's body (#61): a night-dark d6, its face left plain for the tray to draw the rolled reward on.
import { d6 } from '../../parts/dice.js';
import { PALETTE } from '../../palette.js';

/** @returns {import('../../painter.js').Canvas} */
export function draw() {
	return d6({
		light: PALETTE.roof,
		body: PALETTE.roofShade,
		shade: PALETTE.night,
	});
}
