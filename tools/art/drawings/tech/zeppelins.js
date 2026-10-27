// Zeppelins: a huge silver airship sailing above a sea of clouds on a clear day, its gondola and an engine car slung beneath.
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

/** The hull's axis, from the tail to the nose, rising slightly to the right, and its widest radius. */
const HULL = { x0: 2, y0: 29, x1: 62, y1: 22, r: 10.5 };

/** The axis's length, its direction, and the normal pointing up. */
const LENGTH = Math.hypot(HULL.x1 - HULL.x0, HULL.y1 - HULL.y0);
const AXIS = {
	x: (HULL.x1 - HULL.x0) / LENGTH,
	y: (HULL.y1 - HULL.y0) / LENGTH,
};
const UP = { x: AXIS.y, y: -AXIS.x };

/** The sky's ramp from the top down to the cloud sea. */
const SKY = [C.daySky1, C.daySky2, C.daySky3, C.daySky4, C.daySky5];

/** The silver skin: lit, base, shade and the dark underside, cool against the blue. */
const SILVER_LIGHT = mix(C.white, C.cloudShade, 0.4);
const SILVER = mix(C.stoneLight, C.cloudShade, 0.45);
const SILVER_SHADE = mix(C.stone, C.daySky2, 0.2);
const SILVER_DARK = mix(C.stoneShade, C.daySky1, 0.2);

/** Light thrown back up from the clouds onto the hull's lowest edge. */
const SILVER_BOUNCE = mix(SILVER_DARK, C.cloudShade, 0.35);

/** The cloud sea: far puffs, near puffs lit and shaded, and the airship's shadow on them. */
const CLOUD_FAR = mix(C.cloudShade, C.daySky5, 0.65);
const CLOUD_SHADE = C.cloudShade;
const CLOUD_DEEP = mix(C.cloudShade, C.daySky3, 0.45);

/** The sun's halo in the top-left corner. */
const SUN_HALO = mix(C.daySky1, C.lampGlow, 0.35);

/**
 * Draws the Zeppelins tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1900);

	drawDaySky(layer);
	drawSun(layer);
	drawClouds(layer, random);
	drawShadow(layer);

	drawFins(scene);
	drawHull(scene);
	drawEngineCar(scene);
	drawGondola(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 1,
		y: 1,
		radius: 44,
		colour: C.lampGlow,
		strength: 0.22,
		steps: 3,
		skip: [C.ink, C.lampGlow, SUN_HALO],
	});
	drawGleams(scene);
	return scene;
}

/**
 * The day sky: a plain gradient, deepest at the top, paling towards the clouds.
 * @param {Canvas} layer
 */
function drawDaySky(layer) {
	const bottom = 50;
	for (let y = 0; y < 64; y++) {
		const t = Math.min(1, y / bottom) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * The sun, cut by the top-left corner, with one ring of halo.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = 0; y < 12; y++) {
		for (let x = 0; x < 12; x++) {
			const d = Math.hypot(x - 1, y - 1);
			if (d < 5) {
				set(layer, x, y, C.lampGlow);
			} else if (d < 8) {
				set(layer, x, y, SUN_HALO);
			}
		}
	}
}

/**
 * The cloud sea: banks of cumulus one in front of the other, each bank a row of round tops
 * lit on their upper left and shaded below, paler and smaller towards the horizon.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawClouds(layer, random) {
	/** @type {[number, number, number, Colour, Colour][]} Each bank's baseline, top radius, top spacing, lit tone and body tone. */
	const banks = [
		[50, 3, 5, CLOUD_SHADE, CLOUD_FAR],
		[56, 6, 9, C.white, CLOUD_SHADE],
		[65, 9, 13, C.white, CLOUD_SHADE],
	];
	for (const [baseline, r, spacing, lit, body] of banks) {
		/** @type {[number, number][]} */
		const tops = [];
		for (let x = -spacing; x < 64 + spacing; x += spacing) {
			tops.push([
				x + Math.floor(random() * spacing * 0.5),
				r * (0.8 + random() * 0.4),
			]);
		}
		for (let x = 0; x < 64; x++) {
			for (let y = Math.floor(baseline - r * 1.3); y < 64; y++) {
				// The round top that reaches highest over this column decides its light.
				/** @type {[number, number] | null} */
				let best = null;
				let height = -1;
				for (const [cx, cr] of tops) {
					const h = cr * cr - (x - cx) ** 2;
					if (h > 0 && Math.sqrt(h) > height) {
						height = Math.sqrt(h);
						best = [cx, cr];
					}
				}
				if (y < baseline - height) {
					continue;
				}
				let colour = body;
				if (best && y < baseline) {
					// A lit cap along each round top, thicker on its left.
					const [cx, cr] = best;
					const depth = y - (baseline - height);
					if (depth < cr * 0.5 - (x - cx) * 0.3) {
						colour = lit;
					}
				} else if (y > baseline + 1 && body === CLOUD_SHADE) {
					colour = CLOUD_DEEP;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * The airship's shadow, cast down and to the right onto the cloud tops by the sun.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let y = 48; y < 60; y++) {
		for (let x = 0; x < 64; x++) {
			if (((x - 40) / 20) ** 2 + ((y - 54) / 2.5) ** 2 >= 1) {
				continue;
			}
			const colour = get(layer, x, y);
			if (colour === C.white) {
				set(layer, x, y, CLOUD_SHADE);
			} else if (colour === CLOUD_SHADE || colour === CLOUD_FAR) {
				set(layer, x, y, CLOUD_DEEP);
			}
		}
	}
}

/**
 * The hull's radius at a distance along its axis: a tapering tail, a long even middle and a round nose.
 * @param {number} a - Distance from the tail
 * @returns {number}
 */
function radius(a) {
	const t = a / LENGTH;
	if (t > 0.86) {
		return HULL.r * Math.sqrt(Math.max(0, 1 - ((t - 0.86) / 0.14) ** 2));
	}
	if (t > 0.5) {
		return HULL.r;
	}
	const f = 1 - (1 - t / 0.5) ** 1.7;
	return HULL.r * (0.06 + 0.94 * f);
}

/**
 * The silver hull: lit along its top, shaded below, with faint ribs between its gas cells.
 * @param {Canvas} scene
 */
function drawHull(scene) {
	for (let y = 0; y < 48; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - HULL.x0;
			const dy = y - HULL.y0;
			const a = dx * AXIS.x + dy * AXIS.y;
			const s = dx * UP.x + dy * UP.y;
			if (a < 0 || a > LENGTH) {
				continue;
			}
			const r = radius(a);
			if (Math.abs(s) >= r) {
				continue;
			}
			const side = s / r;
			if (side < -0.88 && a > 6) {
				set(scene, x, y, SILVER_BOUNCE);
				continue;
			}
			const tones = [SILVER_LIGHT, SILVER, SILVER_SHADE, SILVER_DARK];
			let index = side > 0.4 ? 0 : side > -0.3 ? 1 : side > -0.72 ? 2 : 3;
			const rib = Math.round(a) % 7 === 3 && a > 8 && a < LENGTH - 6;
			if (rib && index > 0 && index < 3) {
				index++;
			}
			set(scene, x, y, tones[index]);
		}
	}
}

/**
 * Paints a shape given in the hull's own frame: along the axis from the tail, and up from it.
 * @param {Canvas} scene
 * @param {(a: number, s: number) => Colour | null} shade - The colour at a point, or null outside the shape
 */
function paintAlong(scene, shade) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - HULL.x0;
			const dy = y - HULL.y0;
			const colour = shade(
				dx * AXIS.x + dy * AXIS.y,
				dx * UP.x + dy * UP.y
			);
			if (colour) {
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * The tail fins above and below, each with a red rudder along its trailing edge.
 * @param {Canvas} scene
 */
function drawFins(scene) {
	paintAlong(scene, (a, s) => {
		if (a < 1.5 || a > 14) {
			return null;
		}
		// The fin's outer edge runs level out past the hull's full height, then slopes back down to the hull.
		const tip = HULL.r + 1.5;
		const edge = a < 7 ? tip : tip + ((radius(14) - tip) * (a - 7)) / 7;
		const from = radius(a) - 1;
		const out = Math.abs(s) - from;
		if (out < 0 || Math.abs(s) > edge) {
			return null;
		}
		// The rudder and the elevator: the hinged trailing part of each fin, painted red.
		if (a < 4.5 && out > 1) {
			return s > 0 ? C.brickRed : C.brickRedShade;
		}
		return s > 0 ? SILVER : SILVER_SHADE;
	});
}

/**
 * The engine car: a small pod under the hull's middle, its propeller a pale blur at the back.
 * @param {Canvas} scene
 */
function drawEngineCar(scene) {
	const x = 22;
	const y = 39;
	// The strut up to the hull.
	rect(scene, x + 3, y - 3, 1, 3, SILVER_DARK);
	rect(scene, x, y, 8, 3, SILVER);
	rect(scene, x, y + 2, 8, 1, SILVER_SHADE);
	rect(scene, x + 1, y, 6, 1, SILVER_LIGHT);
	// The propeller, spinning.
	rect(scene, x - 2, y - 2, 1, 7, mix(C.white, C.daySky4, 0.4));
	set(scene, x - 1, y + 1, SILVER_DARK);
}

/**
 * The gondola: the control car tucked under the front of the hull, with a row of windows and a rounded bow.
 * @param {Canvas} scene
 */
function drawGondola(scene) {
	const x = 40;
	const y = 34;
	const rows = [
		'  ..........  ',
		' ............ ',
		' .w.w.w.w.ww. ',
		' ............ ',
		'  ,,,,,,,,,,  ',
	];
	rows.forEach((row, j) => {
		[...row].forEach((key, i) => {
			if (key === '.') {
				set(scene, x + i, y + j, j < 2 ? C.creamLight : C.cream);
			} else if (key === ',') {
				set(scene, x + i, y + j, C.creamShade);
			} else if (key === 'w') {
				set(scene, x + i, y + j, C.daySky1);
			}
		});
	});
}

/**
 * Sunlight glinting on the hull's top, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const a of [16, 17, 18, 26, 27]) {
		const r = radius(a) - 2;
		const x = Math.round(HULL.x0 + AXIS.x * a + UP.x * r);
		const y = Math.round(HULL.y0 + AXIS.y * a + UP.y * r);
		set(scene, x, y, C.white);
	}
}
