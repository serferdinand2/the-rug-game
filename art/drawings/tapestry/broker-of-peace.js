// Broker of Peace: a white dove with a green sprig flying over a sheathed, cord-bound sword lying in a meadow.
import {
	createCanvas,
	set,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The meadow's first row, and the sword's middle row. */
const MEADOW = 37;
const SWORD_Y = 50;

/**
 * Draws the Broker of Peace scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(62);

	drawSky(layer, { time: 'day', horizon: MEADOW, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: MEADOW, random });

	// The dove's far wing is behind its body, so it gets its own outline.
	const farWing = createCanvas(64, 64);
	drawFarWing(farWing);
	outline(farWing, C.ink);
	drawSword(scene);
	drawDove(scene);
	outline(scene, C.ink);
	underlay(scene, farWing);
	drawShadow(layer);
	underlay(scene, layer);
	drawSprig(scene);
	drawGrassInFront(scene, random);
	return scene;
}

/**
 * Tells whether a pixel's centre lies inside a polygon (even-odd rule).
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} points - The corners, in order
 * @returns {boolean}
 */
function inPolygon(x, y, points) {
	const px = x + 0.5;
	const py = y + 0.5;
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const [xi, yi] = points[i];
		const [xj, yj] = points[j];
		if (
			yi > py !== yj > py &&
			px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
		) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * Fills a polygon, choosing each pixel's colour with a function.
 * @param {Canvas} canvas
 * @param {[number, number][]} points - The corners, in order
 * @param {(x: number, y: number) => Colour} colour
 */
function fillPolygon(canvas, points, colour) {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
		for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
			if (inPolygon(x, y, points)) {
				set(canvas, x, y, colour(x, y));
			}
		}
	}
}

/**
 * Soft green hills on the skyline, hazy with distance, with a few round trees.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.grass, C.daySky5, 0.55);
	const farLight = mix(C.grassLight, C.daySky6, 0.5);
	const near = mix(C.grass, C.daySky5, 0.3);
	for (let x = 0; x < 64; x++) {
		const farTop = Math.round(31 + Math.sin(x * 0.11 + 1) * 2.5);
		const nearTop = Math.round(34 + Math.sin(x * 0.17 + 3) * 1.6);
		for (let y = farTop; y < MEADOW; y++) {
			set(layer, x, y, y === farTop ? farLight : far);
		}
		for (let y = nearTop; y < MEADOW; y++) {
			set(layer, x, y, near);
		}
	}
	for (const [cx, cy] of [
		[6, 31],
		[10, 32],
		[47, 33],
		[58, 30],
	]) {
		[1, 2, 2, 1].forEach((half, j) => {
			for (let x = cx - half; x <= cx + half; x++) {
				set(
					layer,
					x,
					cy - 3 + j,
					x > cx
						? mix(C.pine, C.daySky5, 0.4)
						: mix(C.pineLight, C.daySky5, 0.4)
				);
			}
		});
	}
}

/**
 * The sword lying in the grass: a round pommel, a wrapped grip, a crossguard
 * and the blade hidden in a red leather scabbard with brass fittings, tied shut with a cord.
 * @param {Canvas} scene
 */
function drawSword(scene) {
	const y = SWORD_Y;
	// The pommel.
	for (let j = -3; j <= 3; j++) {
		for (let i = 1; i <= 7; i++) {
			if ((i - 4) ** 2 + j ** 2 <= 9) {
				set(scene, i, y + j, j < 0 || i < 4 ? C.gold : C.amber);
			}
		}
	}
	set(scene, 3, y - 2, C.lampGlow);
	set(scene, 2, y - 1, C.lampGlow);
	// The grip, bound in leather.
	for (let x = 8; x <= 13; x++) {
		for (let j = -1; j <= 1; j++) {
			const wrap = (x + j) % 2 === 0;
			set(scene, x, y + j, wrap ? C.timber : C.wood);
		}
	}
	// The crossguard, standing up out of the grass, with rounded ends.
	for (let j = -7; j <= 7; j++) {
		set(scene, 14, y + j, Math.abs(j) === 7 ? C.lampGlow : C.gold);
		set(scene, 15, y + j, C.gold);
		set(scene, 16, y + j, C.amber);
	}
	// The scabbard: red leather narrowing a little towards a blunt, rounded brass chape.
	for (let x = 17; x <= 58; x++) {
		const top = x >= 57 ? -1 : x >= 46 ? -2 : -3;
		const bottom = x >= 57 ? 1 : 2;
		for (let j = top; j <= bottom; j++) {
			let colour =
				j === top
					? C.brickRed
					: j === bottom
						? C.wood
						: C.brickRedShade;
			const fitting = x <= 21 || x >= 53 || x === 37 || x === 38;
			if (fitting) {
				colour =
					j === top
						? C.lampGlow
						: j === bottom
							? C.lampFrame
							: j > 0
								? C.amber
								: C.gold;
			}
			set(scene, x, y + j, colour);
		}
	}
	// The cord that ties the hilt to the scabbard: two turns and a bow on top.
	for (let j = -4; j <= 3; j++) {
		set(scene, 17, y + j, C.creamLight);
		set(scene, 19, y + j, C.creamLight);
	}
	for (const [x, dy] of [
		[18, -5],
		[16, -6],
		[15, -6],
		[14, -5],
		[15, -4],
		[20, -6],
		[21, -6],
		[22, -5],
		[21, -4],
	]) {
		set(scene, x, y + dy, C.creamLight);
	}
}

/**
 * The dove's far wing, raised behind its body and in shade, its feather tips ragged.
 * @param {Canvas} canvas
 */
function drawFarWing(canvas) {
	fillPolygon(
		canvas,
		[
			[24, 18],
			[22, 10],
			[20, 3],
			[23, 5],
			[25, 3],
			[27, 6],
			[29, 5],
			[31, 9],
			[33, 9],
			[33, 17],
		],
		(x, y) =>
			y > 14 || (y < 9 && (x - y) % 3 === 0) ? C.stoneLight : C.cloudShade
	);
}

/**
 * The sword's shadow on the grass below it.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let x = 3; x <= 57; x++) {
		set(layer, x, SWORD_Y + 4, C.grassShade);
		if (x > 8 && x < 54) {
			set(layer, x, SWORD_Y + 5, mix(C.grass, C.grassShade, 0.5));
		}
	}
}

/**
 * The dove, flying left with both wings raised: white, shaded underneath, with feathered wingtips.
 * @param {Canvas} scene
 */
function drawDove(scene) {
	// The tail, a fan of feathers to the right.
	fillPolygon(
		scene,
		[
			[37, 19],
			[47, 16],
			[49, 18],
			[48, 20],
			[50, 22],
			[47, 24],
			[37, 24],
		],
		(x, y) =>
			y >= 22 ? C.cloudShade : (x + y) % 4 === 0 ? C.cloudShade : C.white
	);
	// The body and head.
	for (let y = 14; y <= 26; y++) {
		for (let x = 16; x <= 40; x++) {
			const body = ((x - 30) / 9.5) ** 2 + ((y - 21) / 4.2) ** 2 <= 1;
			const head = (x - 21) ** 2 + (y - 18) ** 2 <= 12;
			const neck = x >= 21 && x <= 26 && y >= 17 && y <= 23;
			if (body || head || neck) {
				const under = y >= 23 || (y === 22 && x > 27);
				set(scene, x, y, under ? C.cloudShade : C.white);
			}
		}
	}
	set(scene, 24, 25, C.cloudShade);
	// The near wing, raised high, with the feather rows marked.
	fillPolygon(
		scene,
		[
			[26, 19],
			[30, 13],
			[34, 7],
			[38, 2],
			[42, 0],
			[44, 2],
			[43, 6],
			[45, 8],
			[42, 10],
			[43, 13],
			[40, 14],
			[39, 17],
			[36, 19],
			[33, 21],
		],
		(x, y) => {
			if (x + y * 0.9 > 54) {
				return C.cloudShade;
			}
			if (x + y * 0.9 > 50 && (x + y) % 2 === 0) {
				return C.cloudShade;
			}
			return C.white;
		}
	);
	// The eye and the beak.
	set(scene, 20, 17, C.ink);
	set(scene, 17, 18, C.amber);
	set(scene, 16, 18, C.amber);
	set(scene, 17, 19, C.gold);
}

/**
 * A green sprig held in the dove's beak, leaves on a thin twig.
 * @param {Canvas} scene
 */
function drawSprig(scene) {
	for (const [x, y] of [
		[15, 19],
		[14, 20],
		[13, 21],
		[12, 22],
		[11, 23],
	]) {
		set(scene, x, y, C.timber);
	}
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[15, 20, C.grassLight],
		[16, 20, C.grass],
		[13, 19, C.grassLight],
		[13, 20, C.grass],
		[12, 21, C.grassLight],
		[11, 21, C.grass],
		[13, 22, C.grassLight],
		[13, 23, C.grass],
		[10, 22, C.grassLight],
		[10, 23, C.grass],
		[11, 24, C.grassLight],
		[10, 24, C.grass],
	])) {
		set(scene, x, y, colour);
	}
}

/**
 * Grass blades and a few flowers growing up in front of the sword, so it lies in the meadow.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawGrassInFront(scene, random) {
	for (let x = 0; x < 64; x++) {
		if (random() > 0.55) {
			const h = 1 + Math.floor(random() * 3);
			for (let j = 0; j < h; j++) {
				set(
					scene,
					x,
					SWORD_Y + 4 - j,
					j === h - 1 ? C.grassLight : C.grass
				);
			}
		}
	}
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[24, 55, C.gold],
		[41, 57, C.creamLight],
		[52, 54, C.brickRedLight],
		[8, 58, C.creamLight],
		[33, 60, C.gold],
		[58, 60, C.creamLight],
	])) {
		set(scene, x, y, colour);
		set(scene, x - 1, y, mix(colour, C.grass, 0.4));
		set(scene, x + 1, y, mix(colour, C.grass, 0.4));
		set(scene, x, y - 1, mix(colour, C.grass, 0.4));
		set(scene, x, y + 1, C.grassShade);
	}
}
