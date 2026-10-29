// The desert hex: the 2.5D desert painted alone, rolling dunes on warm sand with a few low rocks (#134).
import { drawHexTerrain } from '../../parts/territory.js';

/** Draws the desert hex, 64×56 and transparent outside the hex. @returns {import('../../painter.js').Canvas} */
export function draw() {
	return drawHexTerrain('desert');
}
