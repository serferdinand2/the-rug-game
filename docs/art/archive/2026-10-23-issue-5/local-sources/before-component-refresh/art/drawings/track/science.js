// Issue #5 abstract advancement-track symbol, drawn directly at 32×32.
import { drawTrack } from '../../parts/track.js';

/** Draws the science track symbol at 32×32. */
export function draw() {
	return drawTrack('track/science');
}
