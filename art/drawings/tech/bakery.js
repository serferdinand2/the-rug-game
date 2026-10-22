// Bakery (tech card): the Bakery landmark's own picture, which is already 64×64.
import { draw as drawLandmark } from '../landmark/bakery.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Bakery tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	return drawLandmark();
}
