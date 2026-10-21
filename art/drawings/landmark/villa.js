// The Villa landmark by day: a white villa with a terracotta roof and arched loggia, a tall cypress beside it.
import {
	createCanvas,
	set,
	rect,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { FOOTPRINTS, clipToFootprint } from '../../footprints.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The villa's footprint is X../XXX/XXX: only the top-left of the top row is used. */
const SIZE = 96;

/** The villa's walls. */
const LEFT = 30;
const RIGHT = 89;
const GROUND = 84;

/**
 * Draws the Villa scene.
 * @returns {Canvas} A 96×96 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(149);

	drawSky(layer, { time: 'day', horizon: 80, random });
	drawTerrain(layer, { kind: 'grassland', top: 81, random });

	drawCypress(scene, 15, 4, GROUND, 6);
	drawCypress(scene, 4, 48, GROUND, 3);
	drawVilla(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS.villa);
	return scene;
}

/**
 * A tall, narrow cypress.
 * @param {Canvas} scene
 * @param {number} cx - Its centre column
 * @param {number} top
 * @param {number} bottom
 * @param {number} half - Half its widest width
 */
function drawCypress(scene, cx, top, bottom, half) {
	const height = bottom - top;
	for (let y = top; y < bottom - 3; y++) {
		const t = (y - top) / height;
		const w = Math.max(
			1,
			Math.round(half * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5))
		);
		for (let x = cx - w; x <= cx + w; x++) {
			const colour =
				x < cx
					? C.pine
					: x > cx
						? C.pineShade
						: y % 3
							? C.pine
							: C.pineLight;
			set(scene, x, y, colour);
		}
	}
	rect(scene, cx, bottom - 3, 1, 3, C.timberShade);
}

/**
 * The villa: white walls, a terracotta roof, an arched loggia and shuttered windows.
 * @param {Canvas} scene
 */
function drawVilla(scene) {
	// Roof, low-pitched and wide.
	for (let r = 0; r < 7; r++) {
		const from = LEFT - 3 + r * 3;
		const to = RIGHT + 3 - r * 3;
		for (let x = from; x <= to; x++) {
			const colour =
				x <= from + 2
					? C.brickRedLight
					: x >= to - 2 || r === 0
						? C.brickRedShade
						: C.brickRed;
			set(scene, x, 47 - r, colour);
		}
	}
	// Walls.
	rect(scene, LEFT, 48, RIGHT - LEFT + 1, GROUND - 47, C.creamLight);
	rect(scene, LEFT, 48, 1, GROUND - 47, C.white);
	rect(scene, RIGHT - 2, 48, 3, GROUND - 47, C.cream);
	// Upper windows with green shutters.
	for (let x = LEFT + 5; x < RIGHT - 6; x += 12) {
		rect(scene, x, 52, 5, 8, C.roofShade);
		rect(scene, x - 2, 52, 2, 8, C.pine);
		rect(scene, x + 5, 52, 2, 8, C.pine);
	}
	// The arched loggia below.
	for (let x = LEFT + 6; x < RIGHT - 8; x += 11) {
		for (let y = 66; y <= GROUND; y++) {
			for (let i = 0; i < 8; i++) {
				const inArch = y >= 70 || Math.hypot(i - 3.5, y - 70) <= 4;
				if (inArch) {
					set(scene, x + i, y, C.roofShade);
				}
			}
		}
	}
	rect(scene, LEFT - 1, 64, RIGHT - LEFT + 3, 1, C.cream);
	// Terracotta pots by the door.
	for (const x of [LEFT - 4, RIGHT + 1]) {
		rect(scene, x, GROUND - 3, 3, 4, C.brickRed);
		rect(scene, x, GROUND - 6, 3, 3, C.grassLight);
	}
}
