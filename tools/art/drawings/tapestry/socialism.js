// Socialism: workers from both sides of a wheat field carrying sheaves into one shared granary under a green banner.
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
import { drawTerrain } from '../../parts/terrain.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon, the field's first row, the cut stubble's first row, the granary's walls and the column everything converges on. */
const HORIZON = 30;
const FIELD = 35;
const CUT = 46;
const LEFT = 13;
const RIGHT = 50;
const BASE = 52;
const CX = 32;

/**
 * A worker carrying a sheaf to the granary.
 * @typedef {Object} Worker
 * @property {number} x - Left column
 * @property {number} y - Feet
 * @property {'left' | 'right'} facing - Towards the door
 * @property {Colour} clothes
 */

/**
 * The workers, nearest last.
 * @type {Worker[]}
 */
const WORKERS = [
	{ x: 18, y: 55, facing: 'right', clothes: C.daySea2 },
	{ x: 41, y: 55, facing: 'left', clothes: C.brickRed },
	{ x: 10, y: 59, facing: 'right', clothes: C.cream },
	{ x: 49, y: 59, facing: 'left', clothes: C.roofLight },
	{ x: 2, y: 63, facing: 'right', clothes: C.pine },
	{ x: 57, y: 63, facing: 'left', clothes: C.timberLight },
];

/**
 * Draws the Socialism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(61);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	drawField(layer, random);

	drawGranary(scene);
	drawBanner(scene);
	for (const worker of WORKERS) {
		drawWorker(scene, worker);
	}
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * The field: ripe wheat still standing behind the granary's sides, and the cut stubble in front.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawField(layer, random) {
	for (let y = FIELD; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour;
			if (y === FIELD) {
				colour = C.lampGlow;
			} else if (y < CUT - 2) {
				colour = (x * 3 + y) % 7 === 0 ? C.amber : C.gold;
			} else if (y < CUT) {
				colour = x % 2 ? C.amber : C.gold;
			} else {
				colour = (x * 5 + y * 3) % 7 === 0 ? C.sand : C.sandLight;
			}
			set(layer, x, y, colour);
		}
	}
	// Ears catching the sun in the standing wheat, and the odd fallen one on the stubble.
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = FIELD + 1 + Math.floor(random() * (CUT - FIELD - 3));
		set(layer, x, y, C.lampGlow);
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		const y = CUT + 1 + Math.floor(random() * (63 - CUT));
		set(layer, x, y, C.gold);
	}
}

/**
 * The granary's gable end: a stone footing, boarded walls, a tiled roof and a wide open door with grain heaped inside.
 * @param {Canvas} scene
 */
function drawGranary(scene) {
	const peak = 11;
	// The boarded gable wall, up into the roof's triangle.
	for (let y = peak + 2; y <= BASE; y++) {
		const half = Math.min(RIGHT - CX, Math.floor((y - peak) * 1.1));
		for (let x = CX - half; x <= CX + half - 1; x++) {
			let colour = (x - LEFT) % 3 === 2 ? C.timber : C.timberLight;
			if (x >= CX + half - 3) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The stone footing.
	for (let y = BASE - 2; y <= BASE; y++) {
		for (let x = LEFT; x < RIGHT; x++) {
			const colour =
				y === BASE - 2
					? C.stoneLight
					: (x + y) % 4 === 0
						? C.stoneShade
						: C.stone;
			set(scene, x, y, colour);
		}
	}
	// The tiled roof: two bands along the gable slopes, overhanging the walls.
	for (let i = 0; i <= 25; i++) {
		const y = peak + Math.floor(i * 0.9);
		for (let j = 0; j < 3; j++) {
			const colour =
				j === 0
					? C.brickRedLight
					: j === 1
						? C.brickRed
						: C.brickRedShade;
			set(scene, CX - 1 - i, y + j, colour);
			set(scene, CX + i, y + j, j === 0 ? C.brickRed : C.brickRedShade);
		}
	}
	// The open door: dark inside, the shared grain heaped up, the leaves swung back.
	const doorL = CX - 7;
	const doorR = CX + 6;
	rect(scene, doorL, 36, doorR - doorL + 1, BASE - 36 + 1, C.wood);
	for (let x = doorL; x <= doorR; x++) {
		const rise = Math.round(7 - Math.abs(x - CX + 0.5) * 0.6);
		for (let y = BASE - rise; y <= BASE; y++) {
			const colour =
				y === BASE - rise
					? C.lampGlow
					: (x + y) % 3 === 0
						? C.amber
						: C.gold;
			set(scene, x, y, colour);
		}
	}
	/** @type {[number, Colour][]} */
	const leaves = [
		[doorL - 4, C.timberLight],
		[doorR + 1, C.timber],
	];
	for (const [x, colour] of leaves) {
		rect(scene, x, 37, 4, BASE - 37 - 2, colour);
		rect(scene, x, 37 + 6, 4, 1, C.timberShade);
	}
}

/**
 * A green banner hanging from a gold rod under the roof's peak, with a gold four-point star.
 * @param {Canvas} scene
 */
function drawBanner(scene) {
	const x = CX - 5;
	const w = 10;
	rect(scene, x - 1, 16, w + 2, 1, C.gold);
	for (let y = 17; y <= 33; y++) {
		for (let i = 0; i < w; i++) {
			const tail = y > 29 && Math.abs(i - 4.5) < y - 29;
			if (tail) {
				continue;
			}
			const colour =
				i === 0 ? C.pineLight : i >= w - 2 ? C.pineShade : C.pine;
			set(scene, x + i, y, colour);
		}
	}
	rect(scene, x, 19, w, 1, C.gold);
	// A gold four-point star.
	for (const [dx, dy] of [
		[0, -3],
		[0, -2],
		[-1, -1],
		[0, -1],
		[1, -1],
		[-3, 0],
		[-2, 0],
		[-1, 0],
		[0, 0],
		[1, 0],
		[2, 0],
		[3, 0],
		[-1, 1],
		[0, 1],
		[1, 1],
		[0, 2],
		[0, 3],
	]) {
		set(
			scene,
			CX + dx,
			25 + dy,
			dx < 0 || (dx === 0 && dy < 0) ? C.gold : C.amber
		);
	}
	set(scene, CX, 25, C.lampGlow);
}

/**
 * A worker walking towards the door with a sheaf of wheat held up against the chest.
 * @param {Canvas} scene
 * @param {Worker} worker
 */
function drawWorker(scene, { x, y, facing, clothes }) {
	drawFigure(scene, { x, y, facing, clothes });
	const front = facing === 'right' ? x + 3 : x - 3;
	drawSheaf(scene, front, y - 12);
}

/**
 * A sheaf of wheat: ears on top, a binding round the middle and splayed stalks below.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawSheaf(scene, x, y) {
	const rows = [
		'.g.g.',
		'gGgGg',
		'GgGgG',
		'.GgG.',
		'.TTT.',
		'.GaG.',
		'.GaG.',
		'G.a.G',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		G: C.gold,
		g: C.lampGlow,
		a: C.amber,
		T: C.timber,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, y + j, colours[key]);
			}
		});
	});
}
