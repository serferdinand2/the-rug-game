// The forest hex: the 2.5D forest painted alone, #82's broadleaf trees and pines on their meadow (#134).
import { drawHexTerrain } from '../../parts/territory.js';

/** Draws the forest hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('forest');
}
