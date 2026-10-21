// Capitalism: a busy shopping street of striped awnings and full windows, a great gold coin hanging as the sign over it.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The awnings' top row, the shop windows' bottom row and the kerb. */
const AWNING = 32;
const SILL = 47;
const KERB = 50;

/** The coin's centre and radius. */
const COIN_X = 31;
const COIN_Y = 19;
const COIN_R = 9;

/**
 * One shop: its columns, its roofline, its walls and its awning's two stripe colours.
 * @typedef {Object} Shop
 * @property {number} x - Left column
 * @property {number} w - Width
 * @property {number} top - The roofline
 * @property {[Colour, Colour, Colour]} wall - Light, main and shade
 * @property {[Colour, Colour]} awning - The stripe colours
 */

/** @type {Shop[]} */
const SHOPS = [
	{
		x: 0,
		w: 19,
		top: 9,
		wall: [C.creamLight, C.cream, C.creamShade],
		awning: [C.brickRed, C.creamLight],
	},
	{
		x: 19,
		w: 26,
		top: 3,
		wall: [
			C.brickRedLight,
			C.brickRedShade,
			mix(C.brickRedShade, C.ink, 0.3),
		],
		awning: [C.pine, C.creamLight],
	},
	{
		x: 45,
		w: 19,
		top: 7,
		wall: [C.sandLight, C.sand, C.sandShade],
		awning: [C.daySea2, C.creamLight],
	},
];

/**
 * Draws the Capitalism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(67);

	drawSky(layer, { time: 'day', horizon: 12, random });
	drawStreet(layer, { top: KERB });

	// The shopfronts stand behind the crowd and the sign, so they get their own outline.
	const fronts = createCanvas(64, 64);
	for (const shop of SHOPS) {
		drawShop(fronts, shop, random);
	}
	outline(fronts, C.ink);

	drawBracket(scene);
	drawCoin(scene);
	drawCrowd(scene, { x: 1, y: 62, count: 15, random });
	drawParcels(scene);
	outline(scene, C.ink);
	underlay(scene, fronts);
	underlay(scene, layer);
	return scene;
}

/**
 * One tall shop house: the walls and roofline, rows of upper windows, a striped awning, and a window full of goods.
 * @param {Canvas} canvas
 * @param {Shop} shop
 * @param {() => number} random
 */
function drawShop(canvas, { x, w, top, wall, awning }, random) {
	const [light, main, shade] = wall;
	for (let y = top; y < KERB; y++) {
		for (let i = 0; i < w; i++) {
			const colour = i === 0 ? light : i >= w - 2 ? shade : main;
			set(canvas, x + i, y, colour);
		}
	}
	// A cornice along the roofline.
	rect(canvas, x, top, w, 1, C.stoneLight);
	rect(canvas, x, top + 1, w, 1, C.stone);
	// Upper windows with light sills.
	for (let y = top + 4; y < AWNING - 5; y += 7) {
		for (let i = 3; i + 3 <= w - 2; i += 6) {
			if (
				x + i + 3 > COIN_X - COIN_R - 2 &&
				x + i < COIN_X + COIN_R + 4 &&
				y < COIN_Y + COIN_R + 2
			) {
				continue;
			}
			rect(canvas, x + i, y, 3, 4, C.roofShade);
			rect(canvas, x + i, y, 3, 1, C.daySky4);
			rect(canvas, x + i - 1, y + 4, 5, 1, C.stoneLight);
		}
	}
	// The shop window, with goods on show, and a door.
	const door = x + w - 6;
	rect(
		canvas,
		x + 2,
		AWNING + 6,
		door - x - 3,
		SILL - AWNING - 6,
		mix(C.daySky6, C.foam, 0.3)
	);
	for (let i = x + 2; i < door - 1; i++) {
		for (const y of [SILL - 2, SILL - 5]) {
			if (random() < 0.7) {
				const goods = [
					C.gold,
					C.brickRedLight,
					C.pineLight,
					C.roofLight,
					C.amber,
					C.daySea1,
				];
				set(canvas, i, y, goods[Math.floor(random() * goods.length)]);
				set(canvas, i, y + 1, C.timber);
			}
		}
	}
	rect(canvas, door, AWNING + 6, 4, KERB - AWNING - 6, C.wood);
	set(canvas, door + 3, AWNING + 12, C.brass);
	rect(canvas, x + 1, SILL, door - x - 2, 1, C.stoneLight);
	rect(canvas, x + 1, SILL + 1, door - x - 2, KERB - SILL - 1, C.stone);
	// The awning: slanted stripes, ending in a scalloped edge.
	for (let y = AWNING; y < AWNING + 6; y++) {
		const reach = y - AWNING;
		for (
			let i = 1 - Math.floor(reach / 2);
			i < w - 1 + Math.floor(reach / 2);
			i++
		) {
			const stripe = Math.floor((i + 40) / 3) % 2;
			const scallop = y === AWNING + 5 && (i + 40) % 3 === 1;
			if (y === AWNING + 5 && !scallop) {
				continue;
			}
			let colour = awning[stripe];
			if (y === AWNING) {
				colour = mix(awning[stripe], C.ink, 0.2);
			}
			set(canvas, x + i, y, colour);
		}
	}
}

/**
 * The iron bracket the coin hangs from, with two short chains.
 * @param {Canvas} scene
 */
function drawBracket(scene) {
	rect(scene, COIN_X - 7, 4, 17, 1, C.wood);
	set(scene, COIN_X + 10, 4, C.wood);
	set(scene, COIN_X + 10, 5, C.wood);
	set(scene, COIN_X - 8, 3, C.wood);
	for (const x of [COIN_X - 4, COIN_X + 4]) {
		for (let y = 5; y < COIN_Y - COIN_R + 2; y++) {
			set(scene, x, y, y % 2 ? C.stoneShade : C.stone);
		}
	}
}

/**
 * The coin sign: a plain gold disc with a raised rim, its thick edge showing on the right. No mark on its face.
 * @param {Canvas} scene
 */
function drawCoin(scene) {
	// The edge, milled with ridges, set back behind the face.
	for (let y = COIN_Y - COIN_R; y <= COIN_Y + COIN_R; y++) {
		for (let x = COIN_X - COIN_R; x <= COIN_X + COIN_R + 2; x++) {
			const d = Math.hypot(x - COIN_X - 2, y - COIN_Y);
			if (d <= COIN_R + 0.3) {
				set(scene, x, y, y % 2 ? C.lampFrame : C.amber);
			}
		}
	}
	// The face: a raised rim catching the light on its upper left, a sunk field inside it.
	for (let y = COIN_Y - COIN_R; y <= COIN_Y + COIN_R; y++) {
		for (let x = COIN_X - COIN_R; x <= COIN_X + COIN_R; x++) {
			const d = Math.hypot(x - COIN_X, y - COIN_Y);
			if (d > COIN_R + 0.3) {
				continue;
			}
			const towards = -(x - COIN_X + (y - COIN_Y)) / (COIN_R * 1.4);
			let colour = C.gold;
			if (d > COIN_R - 1.2) {
				colour =
					towards > 0.25
						? C.lampGlow
						: towards < -0.25
							? C.amber
							: C.gold;
			} else if (d > COIN_R - 2.2) {
				colour =
					towards > 0.2
						? C.amber
						: towards < -0.2
							? C.lampGlow
							: C.gold;
			} else if (towards < -0.35) {
				colour = mix(C.gold, C.amber, 0.4);
			}
			set(scene, x, y, colour);
		}
	}
	// A glint.
	set(scene, COIN_X - 4, COIN_Y - 4, C.white);
	set(scene, COIN_X - 3, COIN_Y - 5, C.lampGlow);
	set(scene, COIN_X - 5, COIN_Y - 3, C.lampGlow);
}

/**
 * Parcels and bags carried by some of the shoppers.
 * @param {Canvas} scene
 */
function drawParcels(scene) {
	/** @type {[number, number, Colour][]} */
	const parcels = [
		[5, 56, C.gold],
		[18, 54, C.brickRedLight],
		[34, 56, C.roofLight],
		[47, 54, C.gold],
		[58, 56, C.pineLight],
	];
	for (const [x, y, colour] of parcels) {
		rect(scene, x, y, 3, 3, colour);
		set(scene, x + 1, y - 1, C.wood);
	}
}
