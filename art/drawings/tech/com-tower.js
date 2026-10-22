// Com Tower (tech card): the Com Tower landmark's picture, cropped to the tower, its signal and the moon.
import { crop } from '../../painter.js';
import { draw as drawLandmark } from '../landmark/com-tower.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The crop's top-left in the 96×64 landmark picture. */
export const CROP = { x: 10, y: 0 };

/**
 * Draws the Com Tower tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	return crop(drawLandmark(), CROP.x, CROP.y, 64, 64);
}
