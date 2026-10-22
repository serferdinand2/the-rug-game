// Monuments: a stepped red-granite monument crowned by a bronze rider on a rearing horse, mirrored in a park's long pool.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row, the monument's base row, and the pool's kerb and far edge. */
const HORIZON = 46;
const BASE = 49;
const KERB = 53;
const POOL_END = 61;

/** The monument's centre column, its tiers' count and height, and the pedestal's top row above them. */
const CX = 32;
const TIER_COUNT = 5;
const TIER_H = 3;
const PEDESTAL = BASE - TIER_COUNT * TIER_H - 6 + 1;

/** Polished red granite. */
const GRANITE = {
	light: mix(C.brickRedLight, C.creamLight, 0.45),
	main: mix(C.brickRed, C.stone, 0.45),
	mid: mix(C.brickRed, C.stoneShade, 0.55),
	shade: mix(C.brickRedShade, C.roofShade, 0.4),
};

/** Bronze weathered green. */
const VERDIGRIS = {
	light: mix(C.pineLight, C.foam, 0.5),
	main: mix(C.pineLight, C.daySky1, 0.3),
	shade: mix(C.pine, C.roofShade, 0.4),
};

/**
 * The statue's parts, in the statue's own grid: capsules (a line thickened to a radius) and discs.
 * The rider sits upright on a horse rearing to the left, a sword raised; the rider's parts are marked
 * so a line of shade can part them from the horse.
 * @type {{ from: [number, number], to: [number, number], r: number, rider?: boolean }[]}
 */
const STATUE = [
	// The horse: body, chest and rump, neck, head and ears.
	{ from: [11, 15], to: [20, 18], r: 3.6 },
	{ from: [10, 13], to: [10, 13], r: 3.4 },
	{ from: [21, 18], to: [21, 18], r: 3.6 },
	{ from: [9, 12], to: [6, 6], r: 2.2 },
	{ from: [6, 5], to: [1, 9], r: 1.6 },
	{ from: [6, 3], to: [6, 4], r: 0.6 },
	// The forelegs, raised and bent at the knee.
	{ from: [8, 15], to: [4, 16], r: 1 },
	{ from: [4, 16], to: [4, 20], r: 0.7 },
	{ from: [11, 17], to: [8, 19], r: 1 },
	{ from: [8, 19], to: [8, 22], r: 0.7 },
	// The hind legs, braced on the pedestal.
	{ from: [19, 19], to: [18, 24], r: 1.3 },
	{ from: [18, 24], to: [19, 27], r: 0.8 },
	{ from: [22, 20], to: [22, 24], r: 1.3 },
	{ from: [22, 24], to: [23, 27], r: 0.8 },
	// The tail, streaming behind.
	{ from: [24, 15], to: [27, 17], r: 0.9 },
	{ from: [27, 17], to: [27, 22], r: 0.7 },
	// The rider: body, head, the raised arm and the leg.
	{ from: [14, 13], to: [14, 7], r: 1.5, rider: true },
	{ from: [14, 5], to: [14, 5], r: 1.5, rider: true },
	{ from: [15, 8], to: [18, 4], r: 0.8, rider: true },
	{ from: [13, 13], to: [12, 16], r: 1, rider: true },
];

/** The sword's blade, above the rider's fist, in the statue's grid. */
const SWORD = { x: 18, top: 0, bottom: 3 };

/** The statue's width and height. */
const STATUE_W = 28;
const STATUE_H = 28;

/**
 * Draws the Monuments scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6607);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawTreeLine(layer);
	drawLawn(layer);

	drawTiers(scene);
	drawPedestal(scene);
	drawRider(scene);
	drawVisitors(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawPool(scene);
	return scene;
}

/**
 * A line of round park trees across the horizon, behind the monument.
 * @param {Canvas} layer
 */
function drawTreeLine(layer) {
	for (let x = 0; x < 64; x++) {
		const crown = Math.round(
			HORIZON -
				7 +
				Math.abs(Math.sin(x * 0.42)) * -3 +
				Math.sin(x * 0.13) * 1.5
		);
		for (let y = crown; y <= HORIZON + 1; y++) {
			let colour = C.forestFloor;
			if (y === crown) {
				colour = C.forestFloorLight;
			} else if (y > HORIZON - 2 || (x + y) % 5 === 0) {
				colour = C.forestFloorShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The lawn round the monument and a pale gravel walk along the pool's far side.
 * @param {Canvas} layer
 */
function drawLawn(layer) {
	for (let y = HORIZON + 2; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x + y) % 7 === 0 ? C.grassLight : C.grass;
			if (y >= BASE + 1 && y < KERB) {
				colour = y === BASE + 1 ? C.sandShade : C.sandLight;
				if ((x * 3 + y) % 7 === 0) {
					colour = C.sand;
				}
			} else if (y > POOL_END) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The monument's stepped tiers of red granite, lit on top and on the left, jointed in courses.
 * @param {Canvas} scene
 */
function drawTiers(scene) {
	for (let t = 0; t < TIER_COUNT; t++) {
		const bottom = BASE - t * TIER_H;
		const top = bottom - TIER_H + 1;
		const half = 29 - t * 4;
		for (let y = top; y <= bottom; y++) {
			for (let x = CX - half; x < CX + half; x++) {
				let colour = GRANITE.main;
				if (y === top) {
					colour = GRANITE.light;
				} else if (x === CX - half) {
					colour = GRANITE.light;
				} else if (x >= CX + half - 2) {
					colour = GRANITE.shade;
				} else if (y === bottom || (x - CX + half + t * 3) % 6 === 0) {
					colour = GRANITE.mid;
				}
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * The pedestal on the top tier: a tall block with a cornice and a plain bronze panel.
 * @param {Canvas} scene
 */
function drawPedestal(scene) {
	const top = PEDESTAL;
	const half = 8;
	for (let y = top; y < top + 6; y++) {
		for (let x = CX - half; x < CX + half; x++) {
			let colour = GRANITE.main;
			if (x === CX - half) {
				colour = GRANITE.light;
			} else if (x >= CX + half - 2) {
				colour = GRANITE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, CX - half - 1, top - 1, half * 2 + 2, 1, GRANITE.light);
	rect(scene, CX - half - 1, top, half * 2 + 2, 1, GRANITE.mid);
	// A plain bronze panel, with nothing written on it.
	rect(scene, CX - 4, top + 2, 8, 3, VERDIGRIS.main);
	rect(scene, CX - 4, top + 2, 8, 1, VERDIGRIS.light);
	rect(scene, CX + 3, top + 2, 1, 3, VERDIGRIS.shade);
}

/**
 * The bronze rider on the rearing horse, lit from the upper left, standing on the pedestal's cornice.
 * A line of shade parts the rider from the horse.
 * @param {Canvas} scene
 */
function drawRider(scene) {
	const x0 = CX - 15;
	const y0 = PEDESTAL - 1 - STATUE_H;
	/** @type {number[][]} 0 air, 1 horse, 2 rider */
	const grid = Array.from({ length: STATUE_H }, () =>
		new Array(STATUE_W).fill(0)
	);
	for (const { from, to, r, rider } of STATUE) {
		for (let j = 0; j < STATUE_H; j++) {
			for (let i = 0; i < STATUE_W; i++) {
				if (distanceToSegment(i, j, from, to) <= r) {
					grid[j][i] = rider ? 2 : grid[j][i] || 1;
				}
			}
		}
	}
	for (let j = SWORD.top; j <= SWORD.bottom; j++) {
		grid[j][SWORD.x] = 2;
	}
	/**
	 * The statue's part at a point, or 0 outside it.
	 * @param {number} i
	 * @param {number} j
	 * @returns {number}
	 */
	const at = (i, j) => grid[j]?.[i] ?? 0;
	for (let j = 0; j < STATUE_H; j++) {
		for (let i = 0; i < STATUE_W; i++) {
			const part = at(i, j);
			if (!part) {
				continue;
			}
			let colour = VERDIGRIS.main;
			if (!at(i - 1, j) || !at(i, j - 1)) {
				colour = VERDIGRIS.light;
			} else if (!at(i + 1, j) || !at(i, j + 1)) {
				colour = VERDIGRIS.shade;
			} else if (
				part === 1 &&
				(at(i - 1, j) === 2 || at(i, j - 1) === 2)
			) {
				colour = VERDIGRIS.shade;
			}
			set(scene, x0 + i, y0 + j, colour);
		}
	}
}

/**
 * How far a point lies from a line segment.
 * @param {number} x
 * @param {number} y
 * @param {[number, number]} a - One end
 * @param {[number, number]} b - The other end
 * @returns {number}
 */
function distanceToSegment(x, y, [ax, ay], [bx, by]) {
	const dx = bx - ax;
	const dy = by - ay;
	const length = dx * dx + dy * dy;
	const t =
		length === 0
			? 0
			: Math.max(
					0,
					Math.min(1, ((x - ax) * dx + (y - ay) * dy) / length)
				);
	return Math.hypot(x - ax - t * dx, y - ay - t * dy);
}

/**
 * Three tiny visitors on the walk at the monument's foot, to show how big it is.
 * @param {Canvas} scene
 */
function drawVisitors(scene) {
	/** @type {[number, Colour][]} */
	const people = [
		[8, C.daySea2],
		[12, C.gold],
		[52, C.brickRedLight],
	];
	for (const [x, clothes] of people) {
		paint(scene, x, KERB - 5, ['.h.', '.s.', 'ccc', '.c.', '.l.'], {
			h: C.wood,
			s: C.skin,
			c: clothes,
			l: C.roofShade,
		});
	}
}

/**
 * The long pool in front: a stone kerb, then still water mirroring the monument and the sky, rippled every few rows.
 * @param {Canvas} scene
 */
function drawPool(scene) {
	const axis = KERB;
	const copy = scene.p.slice();
	for (let y = KERB; y <= POOL_END + 1; y++) {
		for (let x = 0; x < 64; x++) {
			if (y === KERB || y === POOL_END + 1) {
				set(scene, x, y, y === KERB ? C.stoneLight : C.stone);
				continue;
			}
			const ripple = (y - KERB) % 3 === 0 ? ((x >> 2) % 2 ? 1 : -1) : 0;
			const sx = Math.min(63, Math.max(0, x + ripple));
			const sy = 2 * axis - y - 4;
			const source = copy[sy * 64 + sx] ?? C.daySky3;
			set(scene, x, y, mix(source, C.daySea2, 0.62));
		}
	}
	// Ripples catching the light.
	for (const [x, y, n] of [
		[6, 56, 4],
		[41, 55, 3],
		[50, 58, 5],
		[18, 59, 3],
		[29, 57, 2],
		[57, 60, 3],
		[2, 60, 2],
	]) {
		rect(scene, x, y, n, 1, C.dayWave);
	}
}
