// Public Art: a bright looped ribbon of painted steel, red on one face and yellow on the other, standing on a white plinth in a sunny park.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, and the row where the far trees give way to the lawn. */
const ROWS = { sky: 40, lawn: 43 };

/** The plinth: its left and right columns, the top of its lit top face, the row its front begins and its last row. */
const PLINTH = { left: 20, right: 44, top: 46, front: 49, bottom: 59 };

/** The ribbon: the loop's radius, half the band's width, how the loop is turned and tipped towards us, and where its twist starts. */
const RIBBON = { r: 17.5, half: 6.2, turn: 0.7, tilt: 0.3, phase: Math.PI / 4 };

/** The sky's ramp from the top down to the trees. */
const SKY = [C.daySky1, C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** The far trees, hazy blue-green, with their sunlit crowns. */
const TREES = mix(C.pine, C.daySky4, 0.45);
const TREES_LIGHT = mix(C.pineLight, C.daySky5, 0.35);

/** The two painted faces of the steel: lit, base and shade. */
const RED = [C.brickRedLight, C.brickRed, C.brickRedShade];
const YELLOW = [mix(C.gold, C.lampGlow, 0.45), C.gold, C.amber];

/** The park bench to the left: its left column and the row its seat sits on. */
const BENCH = { x: 2, seat: 52 };

/** The plinth's shadow on the lawn. */
const SHADOW = mix(C.grassShade, C.ink, 0.25);

/**
 * Draws the Public Art tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1967);

	drawSky(layer);
	drawCloud(layer, 50, 9);
	drawCloud(layer, 10, 16);
	drawTrees(layer, random);
	drawLawn(layer, random);
	glow(layer, {
		x: 0,
		y: 0,
		radius: 34,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 3,
	});

	drawBench(scene);
	drawPlinth(scene);
	drawRibbon(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawGleams(scene);
	return scene;
}

/**
 * The clear day sky, dithered between its bands.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.sky; y++) {
		const t = (y / ROWS.sky) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * A small flat cloud with a shaded underside.
 * @param {Canvas} layer
 * @param {number} cx - Centre column
 * @param {number} cy - Bottom row
 */
function drawCloud(layer, cx, cy) {
	for (const [dx, dy, r] of [
		[-4, 0, 2.5],
		[0, -1, 3.5],
		[5, 0, 2.5],
	]) {
		for (let y = cy - 5; y <= cy; y++) {
			for (let x = cx - 9; x <= cx + 9; x++) {
				if ((x - cx - dx) ** 2 + (y - cy - dy) ** 2 <= r * r) {
					set(layer, x, y, y === cy ? C.cloudShade : C.white);
				}
			}
		}
	}
}

/**
 * The far edge of the park: a row of round tree crowns, hazy with distance.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTrees(layer, random) {
	for (let x = -4; x < 68; x += 6 + Math.floor(random() * 4)) {
		const r = 4 + random() * 2.5;
		const cy = ROWS.lawn - 3 - Math.floor(random() * 3);
		for (let y = Math.floor(cy - r); y < ROWS.lawn; y++) {
			for (let px = Math.floor(x - r); px <= x + r; px++) {
				const d = Math.hypot(px - x, Math.min(0, y - cy));
				if (d <= r) {
					const lit = d > r - 1.2 && y < cy && px < x;
					set(layer, px, y, lit ? TREES_LIGHT : TREES);
				}
			}
		}
	}
}

/**
 * The mown lawn: broad stripes of light and dark grass, and the plinth's shadow falling to the right.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLawn(layer, random) {
	for (let y = ROWS.lawn; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			// Stripes fan out towards us from a point far behind the plinth.
			const fan = (x - 32) / (y - ROWS.lawn + 6);
			const stripe = Math.floor(fan * 2.2 + 10) % 2 === 0;
			set(layer, x, y, stripe ? C.grassLight : C.grass);
		}
	}
	rect(layer, 0, ROWS.lawn, 64, 1, C.grassShade);
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = ROWS.lawn + 2 + Math.floor(random() * 20);
		set(layer, x, y, C.grassShade);
	}
	rect(layer, BENCH.x + 3, BENCH.seat + 5, 13, 2, SHADOW);
	for (let y = PLINTH.front + 1; y <= PLINTH.bottom; y++) {
		const reach = 6 + Math.floor((y - PLINTH.front) * 0.4);
		for (let x = PLINTH.right + 1; x <= PLINTH.right + reach; x++) {
			set(layer, x, y, SHADOW);
		}
	}
}

/**
 * A small park bench: two slats of timber for its back, one for its seat, on dark iron legs.
 * @param {Canvas} scene
 */
function drawBench(scene) {
	const { x, seat } = BENCH;
	const iron = C.roofShade;
	rect(scene, x, seat - 5, 13, 1, C.timberLight);
	rect(scene, x, seat - 4, 13, 1, C.timber);
	rect(scene, x, seat - 2, 13, 1, C.timberLight);
	rect(scene, x, seat - 1, 13, 1, C.timber);
	rect(scene, x - 1, seat, 15, 1, C.timberLight);
	rect(scene, x - 1, seat + 1, 15, 1, C.timberShade);
	for (const leg of [x + 1, x + 10]) {
		rect(scene, leg, seat - 6, 1, 5, iron);
		rect(scene, leg, seat + 2, 1, 4, iron);
	}
}

/**
 * The white plinth: a lit top face, a front in daylight and its right edge in shade.
 * @param {Canvas} scene
 */
function drawPlinth(scene) {
	const { left, right, top, front, bottom } = PLINTH;
	const width = right - left + 1;
	rect(scene, left, top, width, front - top, C.creamLight);
	rect(scene, left, front, width, bottom - front + 1, C.cream);
	rect(scene, left, front, width, 1, C.white);
	rect(scene, right - 2, front + 1, 3, bottom - front, C.creamShade);
	rect(scene, left, bottom, width, 1, C.creamShade);
}

/**
 * A point on the ribbon in screen space: across the loop at `t`, across the band at `s`, and off its face at `u`.
 * The band twists as it goes round, so its red face and its yellow face both come round to the front.
 * @param {number} t - Round the loop, in radians
 * @param {number} s - Across the band, from -1 to 1
 * @returns {{ x: number, y: number, z: number, nx: number, ny: number, nz: number }} The point (y up, z towards us) and its face normal.
 */
function ribbonPoint(t, s) {
	const { r, half, turn, tilt } = RIBBON;
	// The band twists one full turn on its way round the loop.
	const twist = t + RIBBON.phase;
	const radial = [Math.cos(t), Math.sin(t), 0];
	const across = [
		Math.cos(twist) * radial[0],
		Math.cos(twist) * radial[1],
		Math.sin(twist),
	];
	const tangent = [-Math.sin(t), Math.cos(t), 0];
	const point = [
		r * radial[0] + s * half * across[0],
		r * radial[1] + s * half * across[1],
		s * half * across[2],
	];
	const normal = [
		tangent[1] * across[2] - tangent[2] * across[1],
		tangent[2] * across[0] - tangent[0] * across[2],
		tangent[0] * across[1] - tangent[1] * across[0],
	];
	const [x, y, z] = view(point, turn, tilt);
	const [nx, ny, nz] = view(normal, turn, tilt);
	return { x, y, z, nx, ny, nz };
}

/**
 * Turns a vector about the upright axis, then tips it towards us.
 * @param {number[]} v - [x, y, z], y up
 * @param {number} turn - Radians about the upright axis
 * @param {number} tilt - Radians about the across axis
 * @returns {number[]}
 */
function view([x, y, z], turn, tilt) {
	const x1 = x * Math.cos(turn) + z * Math.sin(turn);
	const z1 = -x * Math.sin(turn) + z * Math.cos(turn);
	const y2 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
	const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
	return [x1, y2, z2];
}

/**
 * The ribbon: sampled across the loop and the band, kept nearest-first in a depth buffer,
 * coloured by the face it shows us and how squarely that face meets the light from the upper left.
 * Where one stretch of the band passes in front of another, the stretch behind gets an ink edge.
 * @param {Canvas} scene
 */
function drawRibbon(scene) {
	/** @type {{ x: number, y: number, z: number, t: number, colour: Colour }[]} */
	const samples = [];
	const light = [-0.55, 0.55, 0.63];
	for (let t = 0; t < Math.PI * 2; t += 0.004) {
		for (let s = -1; s <= 1; s += 0.04) {
			const p = ribbonPoint(t, s);
			const front = p.nz >= 0 ? 1 : -1;
			const lit =
				front * (p.nx * light[0] + p.ny * light[1] + p.nz * light[2]);
			const tones = front > 0 ? RED : YELLOW;
			const colour =
				lit > 0.7 ? tones[0] : lit > 0.25 ? tones[1] : tones[2];
			samples.push({ x: p.x, y: -p.y, z: p.z, t, colour });
		}
	}
	// Stand the loop on the middle of the plinth's top face.
	const maxY = Math.max(...samples.map((p) => p.y));
	const minX = Math.min(...samples.map((p) => p.x));
	const maxX = Math.max(...samples.map((p) => p.x));
	const dx = (PLINTH.left + PLINTH.right) / 2 - (minX + maxX) / 2;
	const dy = PLINTH.top + 1 - maxY;
	/** @type {Map<number, { z: number, t: number, colour: Colour }>} */
	const nearest = new Map();
	for (const p of samples) {
		const x = Math.round(p.x + dx);
		const y = Math.round(p.y + dy);
		const key = y * 64 + x;
		const held = nearest.get(key);
		if (!held || p.z > held.z) {
			nearest.set(key, { z: p.z, t: p.t, colour: p.colour });
		}
	}
	for (const [key, p] of nearest) {
		set(scene, key % 64, Math.floor(key / 64), p.colour);
	}
	for (const [key, p] of nearest) {
		const x = key % 64;
		const y = Math.floor(key / 64);
		for (const [ox, oy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const next = nearest.get((y + oy) * 64 + x + ox);
			if (!next) {
				continue;
			}
			const gap = Math.abs(next.t - p.t);
			const apart = Math.min(gap, Math.PI * 2 - gap);
			if (apart > 0.5 && next.z > p.z + 1) {
				set(scene, x, y, C.ink);
			}
		}
	}
}

/**
 * Sun glints on the lit faces of the steel, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const here = get(scene, x, y);
			if (
				(here === RED[0] || here === YELLOW[0]) &&
				get(scene, x - 1, y - 1) === C.ink &&
				(x + y) % 5 === 0
			) {
				set(scene, x, y, C.white);
			}
		}
	}
}
