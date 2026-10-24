// Issue #5 abstract resource symbol, drawn directly at 32×32.
import { drawResource } from '../../parts/resource.js';

/** Draws the any resource symbol at 32×32. */
export function draw() {
	return drawResource('resource/any');
}
