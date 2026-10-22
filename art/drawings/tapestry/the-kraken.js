// The Kraken: purple-red tentacles rising from a storm-tossed sea to wrap a tilting ship, lightning splitting the clouds behind.
import {
	createCanvas,
	get,
	set,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawShip } from '../../parts/ship.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, and the ship's waterline before it tips. */
const HORIZON = 34;
const WATERLINE = 50;

/**
 * The deck row, which stays put as the ship heels; how far each row above it slides left per row;
 * the mainmast's column before the heel; and the row its raised topmast reaches.
 */
const DECK = WATERLINE - 4;
const HEEL = 0.36;
const MAINMAST = 35;
const TOPMAST = 13;

/** The coil the left tentacle winds round the mainmast: its centre row and radius. */
const COIL = { y: 20, r: 3.4 };

/** The kraken's skin: lit, mid and shaded purple-red, and the pale suckers. */
const SKIN_LIGHT = mix(C.brickRed, C.arcane, 0.45);
const SKIN = mix(C.brickRedShade, C.arcaneShade, 0.4);
const SKIN_SHADE = mix(C.brickRedShade, C.ink, 0.45);
const SUCKER = mix(C.cream, C.brickRedLight, 0.45);

/** The lightning bolt's path, top first. */
const BOLT = [
	[12, 0],
	[12, 1],
	[11, 2],
	[11, 3],
	[10, 4],
	[11, 5],
	[12, 6],
	[12, 7],
	[11, 8],
	[10, 9],
	[10, 10],
	[9, 11],
	[9, 12],
	[10, 13],
	[11, 14],
	[11, 15],
	[10, 16],
	[9, 17],
	[9, 18],
	[8, 19],
	[8, 20],
	[9, 21],
	[9, 22],
	[8, 23],
	[8, 24],
	[7, 25],
	[7, 26],
	[7, 27],
	[8, 28],
	[8, 29],
	[8, 30],
	[7, 31],
	[7, 32],
	[7, 33],
	// The fork.
	[12, 15],
	[13, 16],
	[14, 17],
	[14, 18],
	[15, 19],
	[16, 20],
	[16, 21],
];

/**
 * Draws The Kraken scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(727);

	drawSky(layer, { time: 'night', horizon: HORIZON, random, stars: 0 });
	drawStormClouds(layer, random);
	drawSea(layer, { time: 'night', top: HORIZON + 1, random, waves: 70 });
	drawSwells(layer);
	drawLightning(layer);
	drawRain(layer, random);

	// A far tentacle rears up beyond the bow, its tip curled; it stands behind the ship, so it gets its own outline.
	const far = createCanvas(64, 64);
	tentacle(
		far,
		[
			...curve([
				[58, 46],
				[62, 30],
				[56, 16],
				[50, 14],
			]),
			...spiral(50, 19, 5, -Math.PI / 2, -Math.PI * 2.2, -1),
		],
		3,
		1,
		1
	);
	outline(far, C.ink);

	// The ship heels over as the kraken hauls on it: the higher a row, the further it slides to the left.
	const ship = createCanvas(64, 64);
	drawShip(ship, { x: 18, y: WATERLINE, masts: 2 });
	raiseTopmast(ship);
	stormlight(ship);
	const heeled = createCanvas(64, 64);
	heel(ship, heeled);
	underlay(scene, heeled);

	// One tentacle arches over from the left and winds its tip round the mainmast;
	// another climbs out of the sea and drapes across the hull.
	const cx = MAINMAST + lean(COIL.y);
	tentacle(
		scene,
		[
			...curve([
				[4, 62],
				[0, 30],
				[14, 8],
				[cx - 3, COIL.y - 1],
			]),
			...spiral(cx, COIL.y, COIL.r, -Math.PI * 0.9, Math.PI * 1.3, 1),
		],
		4,
		1,
		1
	);
	remast(scene, heeled);
	tentacle(
		scene,
		curve([
			[50, 62],
			[54, 40],
			[36, 34],
			[30, 48],
		]),
		4,
		1,
		-1
	);
	outline(scene, C.ink);
	underlay(scene, far);
	underlay(scene, layer);
	drawBreaker(scene, random);
	drawFoam(scene, random);
	return scene;
}

/**
 * Heavy storm clouds filling the sky, their undersides dark and their tops lit by the lightning on the left.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStormClouds(layer, random) {
	const dark = mix(C.roofShade, C.ink, 0.25);
	for (const [cx, cy, rx, ry] of [
		[50, 4, 22, 7],
		[18, 6, 20, 6],
		[36, 14, 22, 5],
		[8, 20, 14, 4],
		[56, 22, 14, 4],
		[30, 27, 18, 3],
	]) {
		const phase = random() * 6;
		for (let y = cy - ry - 2; y <= cy + ry; y++) {
			for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
				const bump = Math.sin(x * 0.55 + phase) * 1.5;
				const d = ((x - cx) / rx) ** 2 + ((y - cy + bump) / ry) ** 2;
				if (d > 1 || y > HORIZON) {
					continue;
				}
				const lit = Math.abs(x - 10) < 14 && y - cy < -ry * 0.3;
				const colour = lit
					? C.railLight
					: y - cy < -ry * 0.4
						? C.roofLight
						: y > cy + ry * 0.35
							? dark
							: C.roof;
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * Long rolling swells across the sea, each a darker trough under a pale crest.
 * @param {Canvas} layer
 */
function drawSwells(layer) {
	for (const [base, height, phase] of [
		[40, 2, 0],
		[46, 3, 2],
		[54, 3, 4],
	]) {
		for (let x = 0; x < 64; x++) {
			const top = Math.round(
				base - Math.abs(Math.sin(x * 0.16 + phase)) * height
			);
			set(layer, x, top, C.nightWave);
			set(layer, x, top + 1, C.nightSea1);
			for (let y = top + 2; y <= base + 1; y++) {
				set(layer, x, y, C.nightSea2);
			}
		}
	}
}

/**
 * The lightning bolt, white-hot, with a glow lighting the clouds and the sea around it.
 * @param {Canvas} layer
 */
function drawLightning(layer) {
	glow(layer, {
		x: 10,
		y: 16,
		radius: 18,
		colour: C.starDim,
		strength: 0.35,
		steps: 3,
	});
	for (const [x, y] of BOLT) {
		set(layer, x, y, C.white);
		const side = get(layer, x + 1, y);
		if (side && side !== C.white) {
			set(layer, x + 1, y, C.lampGlow);
		}
	}
}

/**
 * Rain driving down at a slant across the sky, in short faint streaks.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRain(layer, random) {
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (HORIZON - 4));
		for (let k = 0; k < 3; k++) {
			const behind = get(layer, x - k, y + k);
			if (behind && behind !== C.white) {
				set(layer, x - k, y + k, mix(behind, C.starDim, 0.3));
			}
		}
	}
}

/**
 * Catches the lightning on the ship: the top edge of every sail, spar and rail turns pale.
 * @param {Canvas} canvas
 */
function stormlight(canvas) {
	/** @type {[number, number, Colour][]} */
	const lit = [];
	for (let y = 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(canvas, x, y);
			if (colour && get(canvas, x - 1, y) === null) {
				lit.push([x, y, mix(colour, C.starDim, 0.45)]);
			}
		}
	}
	for (const [x, y, colour] of lit) {
		set(canvas, x, y, colour);
	}
}

/**
 * How far a row slides to the left as the ship heels: nothing at the deck and below, more the higher the row.
 * @param {number} y
 * @returns {number} The shift in columns, zero or negative.
 */
function lean(y) {
	return Math.round(Math.min(0, y - DECK) * HEEL);
}

/**
 * Copies a canvas onto another, heeled over: each row slides to the left by `lean`,
 * so the masts lean while the hull stays on the water.
 * @param {Canvas} from
 * @param {Canvas} to
 */
function heel(from, to) {
	for (let y = 0; y < 64; y++) {
		const dx = lean(y);
		for (let x = 0; x < 64; x++) {
			set(to, x + dx, y, from.p[y * 64 + x]);
		}
	}
}

/**
 * Raises the mainmast with a topmast above the part's masthead and flies the pennant from its top,
 * so the mast shows above the tentacle's coil.
 * @param {Canvas} ship - The upright ship, before the heel
 */
function raiseTopmast(ship) {
	for (let y = TOPMAST; y < DECK - 24; y++) {
		set(ship, MAINMAST, y, C.wood);
	}
	for (let dx = 1; dx <= 4; dx++) {
		set(ship, MAINMAST + dx, TOPMAST, C.brickRed);
	}
	set(ship, MAINMAST + 1, TOPMAST + 1, C.brickRed);
	set(ship, MAINMAST + 2, TOPMAST + 1, C.brickRed);
}

/**
 * Paints the mainmast back over the upper half of the coil, with a dark edge on each side,
 * so that half of the coil passes behind the mast while the lower half stays in front of it.
 * @param {Canvas} scene
 * @param {Canvas} heeled - The heeled ship, to copy the mast from where it really stands
 */
function remast(scene, heeled) {
	const skin = [SKIN_LIGHT, SKIN, SKIN_SHADE, SUCKER];
	for (let y = Math.floor(COIL.y - COIL.r - 2); y < COIL.y; y++) {
		const x = MAINMAST + lean(y);
		const mast = get(heeled, x, y);
		if (!mast || !skin.includes(/** @type {Colour} */ (get(scene, x, y)))) {
			continue;
		}
		set(scene, x, y, mast);
		for (const side of [x - 1, x + 1]) {
			if (skin.includes(/** @type {Colour} */ (get(scene, side, y)))) {
				set(scene, side, y, C.ink);
			}
		}
	}
}

/**
 * Samples a cubic Bézier curve densely enough for a tentacle to be stamped along it.
 * @param {number[][]} points - Four control points
 * @returns {[number, number][]}
 */
function curve(points) {
	/** @type {[number, number][]} */
	const samples = [];
	for (let i = 0; i <= 80; i++) {
		const t = i / 80;
		const u = 1 - t;
		const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
		samples.push([
			w.reduce((sum, k, j) => sum + k * points[j][0], 0),
			w.reduce((sum, k, j) => sum + k * points[j][1], 0),
		]);
	}
	return samples;
}

/**
 * Samples a curl: a spiral winding in towards its centre.
 * @param {number} cx - The centre column
 * @param {number} cy - The centre row
 * @param {number} r - The starting radius
 * @param {number} from - The starting angle, in radians (0 points right, angles grow clockwise on screen)
 * @param {number} to - The finishing angle
 * @param {number} shrink - How much of the radius is left at the end, from 0 to 1
 * @returns {[number, number][]}
 */
function spiral(cx, cy, r, from, to, shrink) {
	/** @type {[number, number][]} */
	const samples = [];
	for (let i = 1; i <= 40; i++) {
		const t = i / 40;
		const a = from + (to - from) * t;
		const radius = r * (1 - (1 - Math.abs(shrink)) * t);
		samples.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
	}
	return samples;
}

/**
 * One tentacle along a path, thick at its root in the sea and tapering to its tip:
 * lit on its upper left, shaded below, with a row of pale suckers along one side.
 * @param {Canvas} canvas
 * @param {[number, number][]} path - Points along the tentacle, root first
 * @param {number} root - Its radius at the root
 * @param {number} end - Its radius at the tip
 * @param {1 | -1} inner - Which side the suckers run along: 1 its right-hand side, -1 its left, going root to tip
 */
function tentacle(canvas, path, root, end, inner) {
	/** @type {[number, number][]} */
	const suckers = [];
	path.forEach(([px, py], i) => {
		const t = i / (path.length - 1);
		const [qx, qy] = path[Math.min(path.length - 1, i + 1)];
		const [ox, oy] = path[Math.max(0, i - 1)];
		const length = Math.hypot(qx - ox, qy - oy) || 1;
		// The normal to the path, on the suckers' side.
		const nx = (-(qy - oy) / length) * inner;
		const ny = ((qx - ox) / length) * inner;
		const r = root + (end - root) * t;
		for (let y = Math.floor(py - r - 1); y <= Math.ceil(py + r + 1); y++) {
			for (
				let x = Math.floor(px - r - 1);
				x <= Math.ceil(px + r + 1);
				x++
			) {
				const dx = x - px;
				const dy = y - py;
				if (dx * dx + dy * dy > r * r + 0.5) {
					continue;
				}
				// Light falls from the upper left, where the lightning is.
				const facing = (-dx - dy) / Math.max(1, r);
				const colour =
					facing > 0.6
						? SKIN_LIGHT
						: facing < -0.5
							? SKIN_SHADE
							: SKIN;
				set(canvas, x, y, colour);
			}
		}
		if (i % 6 === 3 && r >= 1.8) {
			suckers.push([
				Math.round(px + nx * (r - 0.8)),
				Math.round(py + ny * (r - 0.8)),
			]);
		}
	});
	for (const [x, y] of suckers) {
		set(canvas, x, y, SUCKER);
	}
}

/**
 * A breaking swell in front of the ship, hiding the foot of its hull, its crest curling into foam.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBreaker(scene, random) {
	for (let x = 10; x < 52; x++) {
		const top = Math.round(WATERLINE + 0.5 + Math.sin(x * 0.3) * 1.2);
		for (let y = top; y <= WATERLINE + 3; y++) {
			if (
				get(scene, x, y) === SKIN ||
				get(scene, x, y) === SKIN_SHADE ||
				get(scene, x, y) === SKIN_LIGHT
			) {
				continue;
			}
			set(
				scene,
				x,
				y,
				y === top ? C.foam : y === top + 1 ? C.nightWave : C.nightSea1
			);
		}
		if (random() < 0.3) {
			set(scene, x, top - 1, C.white);
		}
	}
}

/**
 * White water thrown up where the tentacles break the surface and spray along the swells, with no outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFoam(scene, random) {
	for (const [cx, cy, n] of [
		[7, 59, 9],
		[52, 59, 8],
		[58, 51, 6],
		[18, 62, 6],
		[33, 50, 10],
	]) {
		for (let i = 0; i < n; i++) {
			const x = cx + Math.floor(random() * 9) - 4;
			const y = cy + Math.floor(random() * 3) - 1;
			set(scene, x, y, i % 3 === 0 ? C.white : C.foam);
		}
	}
}
