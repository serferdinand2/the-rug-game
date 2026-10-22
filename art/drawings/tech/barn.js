// Barn (tech card): the Barn landmark's picture, cropped to the whole barn from its roof to the fence.
import { crop } from '../../painter.js';
import { draw as drawLandmark } from '../landmark/barn.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The crop's top-left in the 96×96 landmark picture. */
export const CROP = { x: 8, y: 22 };

/**
 * Draws the Barn tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	return crop(drawLandmark(), CROP.x, CROP.y, 64, 64);
}
