// Transistors: a green circuit board close up at night, a metal-can transistor and two small black ones standing on it over glowing traces.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The board's far edge, where the night beyond begins. */
const EDGE = 19;

/** The big metal-can transistor: its centre column, its radius, its top row and the row its flange sits on. */
const CAN = { cx: 31.5, r: 10, top: 20, base: 37 };

/** Where the can's three legs leave its base and where they meet the board. */
const CAN_LEGS = [
	{ top: [28, 41], foot: [25, 50] },
	{ top: [32, 41], foot: [32, 52] },
	{ top: [35, 41], foot: [39, 50] },
];

/** The two small plastic transistors further back: each body's left column and top row. */
const SMALL = [
	{ x: 3, y: 24 },
	{ x: 49, y: 25 },
];

/** How tall a small transistor's body is, and how long its legs are. */
const SMALL_BODY = { w: 11, h: 10, legs: 6 };

/** The night beyond the board, lighter towards the board's edge. */
const NIGHT_BANDS = [C.nightSky3, C.nightSky4, C.nightSky5];

/** The board: its green, its shadow, its lit far edge, and the soft halo round a glowing trace. */
const BOARD = C.pine;
const BOARD_SHADE = mix(C.pineShade, C.ink, 0.25);
const BOARD_EDGE = C.pineLight;
const BOARD_FAR = mix(C.pine, C.pineShade, 0.5);
const HALO = mix(C.pine, C.gold, 0.45);
const HALO_FAINT = mix(C.pine, C.gold, 0.15);
const HALO_SHADE = mix(BOARD_SHADE, C.gold, 0.25);

/** The dim traces under the green mask, not carrying current. */
const TRACE_DIM = mix(C.pine, C.pineLight, 0.45);

/** The glow of the traces caught on the metal from below. */
const UPLIGHT = mix(C.stoneShade, C.gold, 0.4);

/** The resistor lying in front: its body and the shade along its underside. */
const RESISTOR = mix(C.sand, C.sandShade, 0.4);
const RESISTOR_SHADE = C.sandShade;

/** The small transistors' black plastic: its face, its lit top and left edge, and its shaded right edge. */
const PLASTIC = mix(C.night, C.stoneShade, 0.45);
const PLASTIC_LIGHT = mix(C.stoneShade, C.stone, 0.15);
const PLASTIC_SHADE = mix(C.night, C.stoneShade, 0.2);

/**
 * Draws the Transistors tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4127);

	drawNight(layer);
	drawBoard(layer);
	drawTraces(layer, random);
	glow(layer, {
		x: 30,
		y: 60,
		radius: 30,
		colour: C.gold,
		strength: 0.2,
		steps: 3,
		skip: [C.gold, C.lampGlow],
	});

	for (const small of SMALL) {
		drawSmall(scene, small);
	}
	drawCan(scene);
	drawResistor(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawGleams(scene);
	return scene;
}

/**
 * The night beyond the board: three plain bands, lightest at the board's edge.
 * @param {Canvas} layer
 */
function drawNight(layer) {
	const band = Math.ceil(EDGE / NIGHT_BANDS.length);
	NIGHT_BANDS.forEach((colour, i) => {
		rect(layer, 0, i * band, 64, band, colour);
	});
}

/**
 * The board: flat green with a lit far edge, and the shadows the transistors cast to the right.
 * @param {Canvas} layer
 */
function drawBoard(layer) {
	rect(layer, 0, EDGE, 64, 64 - EDGE, BOARD);
	rect(layer, 0, EDGE + 1, 64, 9, BOARD_FAR);
	rect(layer, 0, EDGE, 64, 1, BOARD_EDGE);
	// The shadows, falling right and back from the lamp on the left.
	/** @type {[number, number, number, number][]} */
	const shadows = [
		[37, 48, 12, 2.6],
		[12, 38, 7, 1.8],
		[58, 39, 7, 1.8],
	];
	for (const [sx, sy, rx, ry] of shadows) {
		for (let y = Math.floor(sy - ry); y <= sy + ry; y++) {
			for (let x = Math.floor(sx - rx); x <= sx + rx; x++) {
				if (((x - sx) / rx) ** 2 + ((y - sy) / ry) ** 2 < 1) {
					set(layer, x, y, BOARD_SHADE);
				}
			}
		}
	}
}

/**
 * Paints a trace along a path of points.
 * @param {Canvas} layer
 * @param {number[][]} points
 * @param {Colour} colour
 */
function trace(layer, points, colour) {
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		line(layer, x0, y0, x1, y1, colour);
	}
}

/**
 * The traces: dim ones in the back under the green mask, and glowing ones linking the transistors, each with a soft halo and a few bright pulses.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTraces(layer, random) {
	trace(
		layer,
		[
			[0, 26],
			[20, 26],
			[24, 22],
			[44, 22],
			[47, 25],
		],
		TRACE_DIM
	);
	trace(
		layer,
		[
			[16, 30],
			[19, 33],
			[44, 33],
			[47, 30],
		],
		TRACE_DIM
	);
	/** The live traces, from pad to pad and off the board's edges. */
	const live = [
		[
			[25, 50],
			[20, 55],
			[0, 55],
		],
		[
			[32, 52],
			[32, 63],
		],
		[
			[39, 50],
			[44, 45],
			[50, 45],
			[50, 41],
		],
		[
			[54, 41],
			[54, 47],
			[60, 53],
			[63, 53],
		],
		[
			[58, 41],
			[63, 36],
		],
		[
			[4, 40],
			[4, 47],
			[1, 50],
			[1, 63],
		],
		[
			[8, 40],
			[8, 44],
			[14, 50],
			[25, 50],
		],
		[
			[12, 40],
			[17, 35],
		],
		[
			[39, 50],
			[45, 56],
			[45, 63],
		],
		[
			[6, 60],
			[6, 58],
		],
		[
			[22, 60],
			[25, 63],
		],
	];
	const glowing = createCanvas(64, 64);
	for (const path of live) {
		trace(glowing, path, C.gold);
	}
	// A halo round every glowing pixel, bright beside it and faint a step further out, then the traces themselves on top.
	for (const [
		reach,
		bright,
		shaded,
	] of /** @type {[number, Colour, Colour][]} */ ([
		[2, HALO_FAINT, BOARD_SHADE],
		[1, HALO, HALO_SHADE],
	])) {
		for (let y = EDGE + 1; y < 64; y++) {
			for (let x = 0; x < 64; x++) {
				if (!get(glowing, x, y)) {
					continue;
				}
				for (let dy = -reach; dy <= reach; dy++) {
					for (let dx = -reach; dx <= reach; dx++) {
						if (Math.abs(dx) + Math.abs(dy) !== reach) {
							continue;
						}
						const behind = get(layer, x + dx, y + dy);
						if (behind === BOARD || behind === HALO_FAINT) {
							set(layer, x + dx, y + dy, bright);
						} else if (
							behind === BOARD_SHADE ||
							behind === HALO_SHADE
						) {
							set(layer, x + dx, y + dy, shaded);
						}
					}
				}
			}
		}
	}
	for (let y = EDGE + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (get(glowing, x, y)) {
				set(layer, x, y, C.gold);
			}
		}
	}
	// Bright pulses of current running along the traces.
	let placed = 0;
	while (placed < 9) {
		const x = Math.floor(random() * 64);
		const y = EDGE + 1 + Math.floor(random() * (63 - EDGE));
		if (get(layer, x, y) === C.gold) {
			set(layer, x, y, C.lampGlow);
			placed++;
		}
	}
}

/**
 * A solder joint: a small silver blob where a leg meets the board.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function joint(scene, x, y) {
	rect(scene, x - 1, y, 3, 1, C.stone);
	set(scene, x, y - 1, C.stoneLight);
	set(scene, x - 1, y, C.stoneLight);
}

/**
 * A small plastic transistor: a black half-round body, its rounded top lit, standing on three straight legs.
 * @param {Canvas} scene
 * @param {{ x: number, y: number }} at - The body's left column and top row
 */
function drawSmall(scene, { x: x0, y: y0 }) {
	const { w, h, legs } = SMALL_BODY;
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			const corner =
				y === y0 &&
				(x === x0 ||
					x === x0 + 1 ||
					x === x0 + w - 1 ||
					x === x0 + w - 2);
			const nearCorner = y === y0 + 1 && (x === x0 || x === x0 + w - 1);
			if (corner || nearCorner) {
				continue;
			}
			let colour = PLASTIC;
			if (y <= y0 + 2 || x === x0) {
				colour = PLASTIC_LIGHT;
			} else if (x >= x0 + w - 2) {
				colour = PLASTIC_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The flat face's lower edge, a shade darker where the body narrows to its legs.
	rect(scene, x0 + 1, y0 + h - 1, w - 2, 1, PLASTIC_SHADE);
	for (const lx of [x0 + 1, x0 + 5, x0 + 9]) {
		rect(scene, lx, y0 + h, 1, legs, C.stoneLight);
		joint(scene, lx, y0 + h + legs);
	}
}

/**
 * Picks a metal tone for a column of the round can, lit from the left.
 * @param {number} dx - Column offset from the can's centre
 * @returns {Colour}
 */
function canTone(dx) {
	if (dx < -6.5) {
		return C.stone;
	}
	if (dx < -2.5) {
		return C.stoneLight;
	}
	if (dx < 3.5) {
		return C.stone;
	}
	return C.stoneShade;
}

/**
 * The metal-can transistor: a silver cylinder with a domed top, a wider flange at its foot with a small tab, and three splayed legs.
 * @param {Canvas} scene
 */
function drawCan(scene) {
	const { cx, r, top, base } = CAN;
	for (let y = top - 3; y <= base + 3; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - cx;
			const topFace = (dx / r) ** 2 + ((y - top) / 3) ** 2 < 1;
			const side = Math.abs(dx) < r && y >= top && y <= base;
			const flange =
				Math.abs(dx) < r + 1.5 &&
				y >= base - 1 &&
				(dx / (r + 1.5)) ** 2 + ((y - base) / 2.5) ** 2 < 1;
			if (topFace) {
				const rim = (dx / r) ** 2 + ((y - top) / 3) ** 2 > 0.5;
				let colour = C.stoneLight;
				if (rim && y > top) {
					colour = C.stoneShade;
				} else if (rim && dx > 0) {
					colour = C.stone;
				}
				set(scene, x, y, colour);
			} else if (flange && y >= base + 2) {
				set(scene, x, y, UPLIGHT);
			} else if (flange && y >= base) {
				set(scene, x, y, dx < -4 ? C.stone : C.stoneShade);
			} else if (side) {
				set(
					scene,
					x,
					y,
					dx > r - 1.5 && y > top + 6 ? UPLIGHT : canTone(dx)
				);
			} else if (flange) {
				set(scene, x, y, dx < -4 ? C.stoneLight : C.stone);
			}
		}
	}
	// The tab on the flange, pointing out to the front left.
	rect(scene, Math.floor(cx - r - 2), base, 2, 2, C.stone);
	// The legs, splaying out to their joints.
	for (const { top: from, foot } of CAN_LEGS) {
		line(scene, from[0], from[1], foot[0], foot[1] - 1, C.stoneLight);
		joint(scene, foot[0], foot[1]);
	}
}

/**
 * The resistor lying flat in front: a tan body with coloured bands (no numbers), its leads bent down into the board.
 * @param {Canvas} scene
 */
function drawResistor(scene) {
	const x0 = 9;
	const y0 = 58;
	rect(scene, x0, y0, 10, 3, RESISTOR);
	rect(scene, x0 + 1, y0 - 1, 8, 1, RESISTOR);
	rect(scene, x0 + 1, y0 + 3, 8, 1, RESISTOR_SHADE);
	rect(scene, x0, y0 + 2, 10, 1, RESISTOR_SHADE);
	rect(scene, x0 + 1, y0 - 1, 7, 1, C.sandLight);
	/** @type {[number, Colour][]} */
	const bands = [
		[x0 + 2, C.brickRed],
		[x0 + 4, C.arcane],
		[x0 + 7, C.gold],
	];
	for (const [bx, colour] of bands) {
		rect(scene, bx, y0 - 1, 1, 5, colour);
	}
	rect(scene, x0 - 3, y0 + 1, 3, 1, C.stoneLight);
	rect(scene, x0 + 10, y0 + 1, 3, 1, C.stoneLight);
	joint(scene, x0 - 3, y0 + 2);
	joint(scene, x0 + 13, y0 + 2);
}

/**
 * The last gleams of light on the can's dome and the small transistors' tops, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[25, 19],
		[26, 19],
		[25, 24],
		[25, 25],
		[25, 26],
		[5, 24],
		[51, 25],
	]) {
		set(scene, x, y, C.white);
	}
}
