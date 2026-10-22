// Déjà Vu: a walker on a dusk street followed one step behind by fading ghost copies of himself, clocks floating in the sky.
import {
	createCanvas,
	get,
	set,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';
import { drawStreet } from '../../parts/street.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the kerb's row and the walkers' feet. */
const HORIZON = 49;
const KERB = 50;
const FEET = 61;

/**
 * The walker facing right in mid-stride, in a bowler hat, scarf and long coat.
 * h hat, b hat band, H hair, S skin, s skin shade, e eye, K scarf, C coat, c coat shade, l coat lit by the sunset,
 * a sleeve, L trousers, B shoes.
 */
const WALKER = [
	'.....hhh.....',
	'....hhhhh....',
	'....hhhhh....',
	'....bbbbb....',
	'..hhhhhhhhh..',
	'....HSSSS....',
	'....HSSeS....',
	'....HSSSSS...',
	'....HsSSS....',
	'.....ssS.....',
	'....KKKKKK...',
	'...lCKKKKCc..',
	'..llCCCKKCcc.',
	'..lCCCaCKCcc.',
	'..lCCCaaKccc.',
	'..lCCCCaaccc.',
	'..lCCCCCaacc.',
	'..lCCCCCCaSS.',
	'..lCCCCCCccS.',
	'..lCCCCCCcc..',
	'.llCCCCCCcc..',
	'.lCCCCCCCccc.',
	'.lCCCCCCCCccc',
	'..LL....LLL..',
	'.LL......LL..',
	'.LL.......LL.',
	'.LL.......LL.',
	'BB........BBB',
];

/**
 * Draws the Déjà Vu scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(611);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawSkyline(layer, { base: HORIZON, time: 'dusk', random, height: 15 });
	drawStreet(layer, { top: KERB });

	// The clocks float behind the walkers, so they get their own outline.
	const clocks = createCanvas(64, 64);
	drawClock(clocks, { x: 15, y: 13, r: 8, hour: 1.6, minute: -0.2 });
	drawClock(clocks, { x: 51, y: 9, r: 6, hour: 4.2, minute: 2.4 });
	drawClock(clocks, { x: 36, y: 27, r: 4, hour: 0.9, minute: 3.6 });
	drawLamp(clocks, 57);
	outline(clocks, C.ink);
	underlay(clocks, layer);
	glow(clocks, {
		x: 57,
		y: 30,
		radius: 7,
		colour: C.lampGlow,
		strength: 0.4,
		skip: [C.lampGlow, C.gold, C.white],
	});
	drawFadedClock(clocks, { x: 32, y: 6, r: 4, hour: 2.6, minute: 5.1 });
	drawFadedClock(clocks, { x: 45, y: 20, r: 3, hour: 5.4, minute: 1.2 });
	drawFadedClock(clocks, { x: 4, y: 31, r: 3, hour: 3.4, minute: 0.4 });

	paint(scene, 40, FEET - WALKER.length + 1, WALKER, walkerColours());
	outline(scene, C.ink);
	underlay(scene, clocks);
	drawEcho(scene, 24, 0.55);
	drawEcho(scene, 8, 0.3);
	return scene;
}

/**
 * The walker's colours: a slate-blue coat lit gold down its back by the setting sun, and a red scarf.
 * @returns {Record<string, Colour>}
 */
function walkerColours() {
	return {
		h: C.night,
		b: C.brickRedShade,
		H: C.wood,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		K: C.brickRed,
		C: C.nightSea1,
		c: C.nightSea3,
		l: mix(C.nightSea1, C.duskSky6, 0.55),
		a: C.nightSea2,
		L: C.roofShade,
		B: C.ink,
	};
}

/**
 * A ghost copy of the walker, the same pose a step behind, painted see-through over the finished scene.
 * @param {Canvas} scene
 * @param {number} x - The copy's leftmost column
 * @param {number} strength - How solid the copy is, from 0 to 1
 */
function drawEcho(scene, x, strength) {
	/** @type {Record<string, Colour>} */
	const tones = {
		h: C.ghostShade,
		b: C.ghost,
		H: C.ghostShade,
		S: C.ghostLight,
		s: C.ghost,
		e: C.ghostShade,
		K: C.ghost,
		C: C.ghost,
		c: C.ghostShade,
		l: C.ghostLight,
		a: C.ghostShade,
		L: C.ghostShade,
		B: C.ghostShade,
	};
	const copy = createCanvas(64, 64);
	paint(copy, x, FEET - WALKER.length + 1, WALKER, tones);
	outline(copy, C.ghostShade);
	for (let y = 0; y < 64; y++) {
		for (let px = 0; px < 64; px++) {
			const tone = get(copy, px, y);
			const behind = get(scene, px, y);
			if (tone && behind) {
				set(scene, px, y, mix(behind, tone, strength));
			}
		}
	}
}

/**
 * Options for a clock face.
 * @typedef {Object} ClockOptions
 * @property {number} x - The face's centre column
 * @property {number} y - The face's centre row
 * @property {number} r - The radius to the outside of the rim
 * @property {number} hour - The hour hand's angle in radians, clockwise from twelve
 * @property {number} minute - The minute hand's angle in radians, clockwise from twelve
 */

/**
 * A floating pocket-watch face: a brass rim with a crown, a cream face with tick marks (no numerals) and two hands.
 * @param {Canvas} canvas
 * @param {ClockOptions} options
 */
function drawClock(canvas, { x, y, r, hour, minute }) {
	for (let py = y - r; py <= y + r; py++) {
		for (let px = x - r; px <= x + r; px++) {
			const d = Math.hypot(px - x, py - y);
			if (d > r + 0.3) {
				continue;
			}
			let colour = d > r - 1.1 ? C.brass : C.cream;
			if (colour === C.brass && px - x + (py - y) < -r * 0.5) {
				colour = C.gold;
			} else if (colour === C.cream && px - x + (py - y) > r * 0.6) {
				colour = C.creamShade;
			}
			set(canvas, px, py, colour);
		}
	}
	// The crown and its ring on top.
	set(canvas, x, y - r - 1, C.gold);
	if (r >= 5) {
		set(canvas, x - 1, y - r - 2, C.brass);
		set(canvas, x + 1, y - r - 2, C.brass);
		set(canvas, x, y - r - 3, C.brass);
	}
	// Tick marks at the quarters, and between them on the larger faces.
	const ticks = r >= 6 ? 12 : 4;
	for (let i = 0; i < ticks; i++) {
		const angle = (i / ticks) * Math.PI * 2;
		const tx = Math.round(x + Math.sin(angle) * (r - 2));
		const ty = Math.round(y - Math.cos(angle) * (r - 2));
		set(
			canvas,
			tx,
			ty,
			i % 3 === 0 || ticks === 4 ? C.roofShade : C.creamShade
		);
	}
	hand(canvas, x, y, minute, r - 2.5, C.ink);
	hand(canvas, x, y, hour, r - 4, C.roof);
	set(canvas, x, y, C.brickRed);
}

/**
 * One clock hand from the centre outwards.
 * @param {Canvas} canvas
 * @param {number} x - The centre column
 * @param {number} y - The centre row
 * @param {number} angle - Radians clockwise from twelve
 * @param {number} length - In pixels
 * @param {Colour} colour
 */
function hand(canvas, x, y, angle, length, colour) {
	const ex = Math.round(x + Math.sin(angle) * Math.max(1, length));
	const ey = Math.round(y - Math.cos(angle) * Math.max(1, length));
	line(canvas, x, y, ex, ey, colour);
}

/**
 * A far, half-seen clock: drawn on its own canvas, then blended see-through into the sky.
 * @param {Canvas} scene
 * @param {ClockOptions} options
 */
function drawFadedClock(scene, options) {
	const face = createCanvas(64, 64);
	drawClock(face, options);
	outline(face, C.roof);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const tone = get(face, x, y);
			const behind = get(scene, x, y);
			if (tone && behind) {
				set(scene, x, y, mix(behind, tone, 0.45));
			}
		}
	}
}

/**
 * A street lamp at the kerb: an iron post with a lit lantern.
 * @param {Canvas} canvas
 * @param {number} x - The post's column
 */
function drawLamp(canvas, x) {
	for (let y = 33; y <= KERB + 1; y++) {
		set(canvas, x, y, C.night);
	}
	set(canvas, x - 1, KERB + 1, C.night);
	set(canvas, x + 1, KERB + 1, C.night);
	paint(
		canvas,
		x - 2,
		26,
		['..k..', '.kkk.', 'kgwgk', 'kgwgk', 'kgggk', '.kkk.', '..k..'],
		{ k: C.night, g: C.gold, w: C.lampGlow }
	);
}
