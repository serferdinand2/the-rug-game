// The Stock Market landmark at dusk: a columned exchange with a lit ticker board, in front of the city.
import {
	createCanvas,
	set,
	rect,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';
import { drawStreet } from '../../parts/street.js';
import { drawClassical } from '../../parts/classical.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/**
 * Draws the Stock Market scene.
 * @returns {Canvas} A 64×64 canvas, the shape of its 2×2 footprint.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(53);

	drawSky(layer, { time: 'dusk', horizon: 50, random });
	drawSkyline(layer, { base: 50, time: 'dusk', random, height: 26 });
	drawStreet(layer, { top: 51 });

	drawClassical(scene, {
		x: 5,
		y: 55,
		width: 54,
		columns: 5,
		roof: 'pediment',
		height: 17,
	});
	drawTicker(scene);
	drawFigure(scene, { x: 14, y: 52, clothes: C.night });
	drawFigure(scene, { x: 44, y: 52, facing: 'left', clothes: C.roofLight });
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * The ticker board hung across the colonnade: green rises and red falls on a dark band.
 * @param {Canvas} scene
 */
function drawTicker(scene) {
	rect(scene, 8, 37, 48, 5, C.night);
	rect(scene, 8, 37, 48, 1, C.roof);
	for (let x = 10, i = 0; x < 54; x += 4, i++) {
		const rising = (i * 7) % 3 !== 0;
		rect(scene, x, 39, 2, 1, C.gold);
		set(
			scene,
			x + 2,
			rising ? 38 : 40,
			rising ? C.grassLight : C.brickRedLight
		);
	}
}
