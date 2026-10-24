// Issue #5 game icon, drawn as a crisp 24×24 pixel sprite.
import { drawIcon } from '../../icons.js';

/** Draws the desert icon at 24×24. */
export function draw() {
	return drawIcon('terrain/desert');
}
