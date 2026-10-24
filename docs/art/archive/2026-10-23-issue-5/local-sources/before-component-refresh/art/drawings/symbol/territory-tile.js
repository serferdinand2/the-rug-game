// Issue #5 game icon, drawn as a crisp 24×24 pixel sprite.
import { drawIcon } from '../../icons.js';

/** Draws the territory tile icon at 24×24. */
export function draw() {
	return drawIcon('symbol/territory-tile');
}
