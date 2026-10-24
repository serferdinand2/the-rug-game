// Issue #5 player-colored outpost flag, toppled.
import { drawOutpost } from '../../parts/outpost.js';

/** Draws the fallen outpost flag at 128×128. */
export function draw() {
	return drawOutpost({ toppled: true });
}
