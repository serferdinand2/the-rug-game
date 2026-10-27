// Space tile Monolith: the black Monolith standing in the shallows of a glassy alien sea at dawn, three pale moons in the sky and its reflection broken by ripples.
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

/** The sky's last row; the sea begins below it. */
const HORIZON = 37;

/** The slab: its left column, top row, width and the row where it meets the water. The landmark's proportions, a little under 1 to 4. */
const SLAB = { x: 22, top: 6, w: 11, base: 47 };

/** The rising sun, just its rim above the horizon to the right of the slab. */
const SUN = { x: 47, y: HORIZON + 2, r: 5 };

/** The pale dawn sky, from the top down to the gold at the horizon. */
const SKY = [
	mix(C.daySky4, C.railLight, 0.55),
	mix(C.daySky5, C.railLight, 0.4),
	mix(C.daySky6, C.arcaneLight, 0.35),
	mix(C.creamLight, C.arcaneLight, 0.45),
	mix(C.creamLight, C.duskSky5, 0.35),
	mix(C.creamLight, C.duskSky6, 0.4),
	mix(C.lampGlow, C.creamLight, 0.35),
];

/** The far shore on the horizon, faded by the morning haze, and its darker foot at the water. */
const SHORE = mix(SKY[4], C.roofLight, 0.4);
const SHORE_FOOT = mix(SKY[4], C.roofLight, 0.6);

/** The line where the sea meets the sky, a touch darker than either. */
const SEA_LINE = mix(SKY[6], C.tealShade, 0.3);

/**
 * One of the three moons: its centre and radius, how far its shadow is shifted off it (0 is new, 1 is full),
 * the colours of its lit and unlit sides and a crater tone.
 * @typedef {{ x: number, y: number, r: number, phase: number, lit: Colour, dark: Colour, crater: Colour }} Moon
 */

/** @type {Moon[]} */
const MOONS = [
	{
		x: 13,
		y: 14,
		r: 5.4,
		phase: 0.55,
		lit: mix(C.creamLight, C.white, 0.5),
		dark: mix(SKY[1], C.roofLight, 0.12),
		crater: mix(C.creamLight, C.stoneLight, 0.55),
	},
	{
		x: 46,
		y: 9,
		r: 2.6,
		phase: 0.75,
		lit: mix(C.tealLight, C.white, 0.55),
		dark: mix(SKY[0], C.tealShade, 0.18),
		crater: mix(C.tealLight, C.teal, 0.35),
	},
	{
		x: 55,
		y: 19,
		r: 2.8,
		phase: 1.05,
		lit: mix(C.duskSky5, C.white, 0.45),
		dark: mix(SKY[2], C.duskSky4, 0.22),
		crater: mix(C.duskSky5, C.duskSky4, 0.3),
	},
];

/** The slab: utterly black, a sheen of dawn on its lower face, its right edge and top catching the sunrise. */
const SLAB_BODY = C.night;
const SLAB_SHEEN = mix(C.night, C.nightSky4, 0.28);
const SLAB_SHADE = mix(C.night, C.ink, 0.6);
const SLAB_RIM = mix(C.duskSky6, C.creamLight, 0.45);
const SLAB_RIM_DIM = mix(C.night, C.duskSky4, 0.45);
const SLAB_TOP = mix(C.railLight, C.creamLight, 0.35);

/** The slab's reflection in the water, black with a faint rim. */
const REFLECTION = mix(C.night, C.tealShade, 0.3);
const REFLECTION_RIM = mix(C.night, C.duskSky4, 0.45);

/** Ripples on the mirror-still water: bright where they catch the sky, dark in their troughs. */
const RIPPLE_LIGHT = mix(C.creamLight, C.daySky6, 0.4);
const RIPPLE_DARK = mix(C.tealShade, C.roofLight, 0.45);

/**
 * Draws the Monolith space tile.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(70123);

	drawDawnSky(layer);
	drawSun(layer);
	glow(layer, {
		x: SUN.x,
		y: HORIZON,
		radius: 16,
		colour: C.lampGlow,
		strength: 0.45,
		steps: 3,
	});
	drawShore(layer);
	drawMirror(layer);
	drawMoons(layer);
	drawSunPath(layer, random);
	drawReflection(layer);
	drawStillRipples(layer, random);

	const scene = createCanvas(64, 64);
	drawSlab(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawRings(scene);
	drawLapping(scene);
	return scene;
}

/**
 * The pale dawn sky, banded from lavender-blue overhead to gold at the horizon, dithered where the bands meet.
 * @param {Canvas} layer
 */
function drawDawnSky(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = (y / HORIZON) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.78 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * The three moons, washed pale by the day, each lit from the sunrise on its lower right.
 * @param {Canvas} layer
 */
function drawMoons(layer) {
	for (const moon of MOONS) {
		const reach = Math.ceil(moon.r);
		for (let y = moon.y - reach; y <= moon.y + reach; y++) {
			for (let x = moon.x - reach; x <= moon.x + reach; x++) {
				const dx = x - moon.x;
				const dy = y - moon.y;
				if (Math.hypot(dx, dy) > moon.r) {
					continue;
				}
				// The terminator: a second disc shifted towards the upper left leaves the lit crescent.
				const shadow =
					Math.hypot(
						dx + moon.r * moon.phase,
						dy + moon.r * moon.phase * 0.8
					) <
					moon.r * 0.95;
				set(layer, x, y, shadow ? moon.dark : moon.lit);
			}
		}
	}
	// A few craters on the big moon's lit side.
	const big = MOONS[0];
	for (const [dx, dy] of [
		[2, 1],
		[3, -1],
		[0, 3],
		[2, 3],
	]) {
		set(layer, big.x + dx, big.y + dy, big.crater);
	}
	set(layer, MOONS[1].x + 1, MOONS[1].y + 1, MOONS[1].crater);
	set(layer, MOONS[2].x + 1, MOONS[2].y, MOONS[2].crater);
}

/**
 * The sun's rim just clearing the horizon, white-gold.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - SUN.r; y <= HORIZON; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d <= SUN.r) {
				set(
					layer,
					x,
					y,
					d < SUN.r - 1.5 ? mix(C.lampGlow, C.white, 0.6) : C.lampGlow
				);
			}
		}
	}
}

/**
 * A far, low shore along the horizon on the left, and a lower spit beyond the sun.
 * @param {Canvas} layer
 */
function drawShore(layer) {
	/** @type {[number, number][]} The shore's height above the horizon, by column. */
	const heights = [];
	for (let x = 0; x < 17; x++) {
		heights.push([x, x < 9 ? 2 : x < 13 ? 1 : 0]);
	}
	for (let x = 57; x < 64; x++) {
		heights.push([x, x < 60 ? 0 : 1]);
	}
	for (const [x, h] of heights) {
		for (let y = HORIZON - h; y <= HORIZON; y++) {
			set(layer, x, y, y === HORIZON ? SHORE_FOOT : SHORE);
		}
	}
}

/**
 * The glassy sea: a mirror of the sky above it, a shade deeper and greener, swaying a pixel here and there.
 * @param {Canvas} layer
 */
function drawMirror(layer) {
	/** @type {Map<string, Colour>} */
	const deeper = new Map();
	for (let y = HORIZON + 1; y < 64; y++) {
		const sy = HORIZON * 2 + 1 - y;
		const sway = Math.round(Math.sin(y * 1.9) * 0.7);
		const depth = y > 55 ? 0.36 : y > 46 ? 0.28 : 0.2;
		for (let x = 0; x < 64; x++) {
			const source = get(layer, Math.min(63, Math.max(0, x + sway)), sy);
			if (!source) {
				continue;
			}
			const key = `${source}${depth}`;
			if (!deeper.has(key)) {
				deeper.set(key, mix(source, C.tealShade, depth));
			}
			set(layer, x, y, deeper.get(key));
		}
	}
	for (let x = 0; x < 64; x++) {
		if (get(layer, x, HORIZON) !== SHORE_FOOT) {
			set(layer, x, HORIZON + 1, SEA_LINE);
		}
	}
}

/**
 * The sun's path: a broken column of gold glints on the water below the sunrise.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSunPath(layer, random) {
	for (let y = HORIZON + 2; y < 64; y += 2) {
		const spread = 1 + Math.floor((y - HORIZON) / 5);
		const n = 1 + Math.floor(random() * (spread + 1));
		const x = SUN.x - spread + Math.floor(random() * spread * 2);
		rect(layer, x, y, n, 1, y < HORIZON + 10 ? C.lampGlow : C.gold);
	}
}

/**
 * The slab mirrored in the water, its lower part upside down, each row shifted and broken by the ripples.
 * @param {Canvas} layer
 */
function drawReflection(layer) {
	for (let y = SLAB.base + 1; y < 64; y++) {
		const away = y - SLAB.base;
		// Every fourth row a ripple's bright crest breaks the image.
		if (away % 4 === 3) {
			continue;
		}
		const sway = Math.round(Math.sin(away * 1.2) * Math.min(2, away / 5));
		const narrow = away > 10 && away % 2 === 0 ? 1 : 0;
		for (let x = SLAB.x + narrow; x < SLAB.x + SLAB.w - narrow; x++) {
			const rim = x === SLAB.x + SLAB.w - 1 - narrow;
			set(layer, x + sway, y, rim ? REFLECTION_RIM : REFLECTION);
		}
	}
}

/**
 * Long faint lines on the still water: bright where a swell catches the sky, darker in its trough.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStillRipples(layer, random) {
	for (let i = 0; i < 14; i++) {
		const y = HORIZON + 3 + Math.floor(random() * (63 - HORIZON - 3));
		const x = Math.floor(random() * 58);
		const n = 3 + Math.floor(random() * (3 + (y - HORIZON) / 4));
		const away = y - HORIZON;
		if (get(layer, x, y) === REFLECTION) {
			continue;
		}
		rect(layer, x, y, n, 1, i % 3 === 0 ? RIPPLE_DARK : RIPPLE_LIGHT);
		if (away > 12 && i % 3 !== 0) {
			rect(layer, x + 1, y + 1, n - 2, 1, RIPPLE_DARK);
		}
	}
}

/**
 * The Monolith: a black slab with the landmark's proportions, a sheen of dawn low on its face,
 * its right edge and top lit by the sunrise.
 * @param {Canvas} scene
 */
function drawSlab(scene) {
	const { x: sx, top, w, base } = SLAB;
	const sheen = top + Math.round((base - top) * 0.68);
	for (let y = top; y <= base; y++) {
		for (let x = sx; x < sx + w; x++) {
			let colour = SLAB_BODY;
			if (y > sheen + 1 || (y >= sheen - 1 && (x + y) % 2 === 0)) {
				colour = SLAB_SHEEN;
			}
			if (x === sx) {
				colour = SLAB_SHADE;
			} else if (x === sx + w - 2) {
				colour = SLAB_RIM_DIM;
			} else if (x === sx + w - 1) {
				colour = SLAB_RIM;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, sx, top, w, 1, SLAB_TOP);
	set(scene, sx, top, SLAB_RIM_DIM);
	set(scene, sx + w - 1, top, C.white);
}

/** @type {[number, boolean][]} The rings round the slab's foot: each one's half-width, and whether its far half shows. */
const RINGS = [
	[9, true],
	[15, true],
	[22, false],
];

/**
 * Rings spreading over the still water from the slab's foot: their near halves bright, their far halves dark.
 * @param {Canvas} scene
 */
function drawRings(scene) {
	const cx = SLAB.x + SLAB.w / 2 - 0.5;
	for (const [a, back] of RINGS) {
		const b = a * 0.22;
		for (let y = SLAB.base - 5; y <= SLAB.base + 6; y++) {
			for (let x = 0; x < 64; x++) {
				const d = Math.hypot((x - cx) / a, (y - SLAB.base) / b);
				if (Math.abs(d - 1) > 0.055) {
					continue;
				}
				const behind = get(scene, x, y);
				const inSlab = x >= SLAB.x - 1 && x <= SLAB.x + SLAB.w;
				if (
					behind === C.ink ||
					y <= HORIZON + 1 ||
					(inSlab && y <= SLAB.base)
				) {
					continue;
				}
				if (y > SLAB.base) {
					set(
						scene,
						x,
						y,
						behind === REFLECTION ? REFLECTION_RIM : RIPPLE_LIGHT
					);
				} else if (back) {
					set(scene, x, y, RIPPLE_DARK);
				}
			}
		}
	}
}

/**
 * The water lapping at the slab's foot: a bright line where it laps against the stone.
 * @param {Canvas} scene
 */
function drawLapping(scene) {
	rect(scene, SLAB.x - 2, SLAB.base + 1, SLAB.w + 4, 1, RIPPLE_LIGHT);
	set(scene, SLAB.x - 3, SLAB.base, RIPPLE_LIGHT);
	set(scene, SLAB.x + SLAB.w + 2, SLAB.base, RIPPLE_LIGHT);
}
