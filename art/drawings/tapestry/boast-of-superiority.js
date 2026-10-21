// Boast of Superiority: a herald on a high sandstone rampart blowing a long banner-hung trumpet, streamers flying.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The parapet's top row, and the left tower's right edge and top row. */
const PARAPET = 45;
const TOWER_RIGHT = 10;
const TOWER_TOP = 27;

/** The herald's top-left corner, and the trumpet's mouthpiece and bell. */
const HERALD_X = 13;
const HERALD_Y = 16;
const MOUTH = [25, 23];
const BELL = [56, 15];

/**
 * Draws the Boast of Superiority scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(131);

	drawSky(layer, { time: 'day', horizon: 63, random });

	// The herald stands behind the parapet, so he gets his own outline.
	const herald = createCanvas(64, 64);
	drawHerald(herald);
	drawTrumpet(herald);
	outline(herald, C.ink);

	drawStreamer(
		scene,
		3,
		2,
		34,
		3,
		C.brickRedLight,
		C.brickRed,
		C.brickRedShade
	);
	drawStreamer(scene, 8, 8, 26, 2, C.lampGlow, C.gold, C.amber);
	drawTowerTop(scene);
	drawParapet(scene);
	outline(scene, C.ink);
	underlay(scene, herald);
	underlay(scene, layer);
	return scene;
}

/**
 * Paints one sandstone pixel: lit on the left edge of a block, shaded on the right, with mortar courses.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The block's first column
 * @param {number} right - The block's last column
 */
function sandstone(canvas, x, y, left, right) {
	let colour = C.sand;
	if (x === left) {
		colour = C.sandLight;
	} else if (x >= right - 1) {
		colour = C.sandShade;
	} else if (y % 4 === 0 || (y % 8 < 4 ? x % 6 === 2 : x % 6 === 5)) {
		colour = mix(C.sand, C.sandShade, 0.55);
	}
	set(canvas, x, y, colour);
}

/**
 * The top of the left tower, rising above the parapet, with its battlements.
 * @param {Canvas} scene
 */
function drawTowerTop(scene) {
	for (let y = TOWER_TOP; y < 64; y++) {
		for (let x = 0; x <= TOWER_RIGHT; x++) {
			sandstone(scene, x, y, 0, TOWER_RIGHT);
		}
	}
	for (const x0 of [0, 5, 9]) {
		for (let x = x0; x < Math.min(x0 + 2, TOWER_RIGHT + 1); x++) {
			for (let y = TOWER_TOP - 3; y < TOWER_TOP; y++) {
				sandstone(scene, x, y, x0, x0 + 3);
			}
		}
	}
	// An arrow slit.
	for (let y = 36; y <= 41; y++) {
		set(scene, 5, y, C.wood);
	}
}

/**
 * The parapet in front of the herald: a long sandstone wall with merlons along its top.
 * @param {Canvas} scene
 */
function drawParapet(scene) {
	for (let y = PARAPET; y < 64; y++) {
		for (let x = TOWER_RIGHT + 1; x < 64; x++) {
			sandstone(scene, x, y, TOWER_RIGHT + 1, 63);
		}
	}
	// Merlons, with a crenel in front of the herald.
	for (const x0 of [11, 32, 43, 54]) {
		for (let y = PARAPET - 5; y < PARAPET; y++) {
			for (let x = x0; x < x0 + 7; x++) {
				sandstone(scene, x, y, x0, x0 + 6);
			}
		}
	}
	// A coping stone along the parapet top.
	for (let x = TOWER_RIGHT + 1; x < 64; x++) {
		set(scene, x, PARAPET, C.sandLight);
	}
	// A banner hung over the wall below the herald.
	for (let y = PARAPET + 1; y <= 60; y++) {
		for (let x = 20; x <= 29; x++) {
			const tail = y > 56 && Math.abs(x - 24.5) < y - 56;
			if (!tail) {
				set(scene, x, y, x >= 28 ? C.brickRedShade : C.brickRed);
			}
		}
	}
	for (let x = 20; x <= 29; x++) {
		set(scene, x, PARAPET + 2, C.gold);
	}
	diamond(scene, 24, 52, C.gold);
}

/**
 * A small diamond device: a plus with a filled centre.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {Colour} colour
 */
function diamond(canvas, cx, cy, colour) {
	for (const [dx, dy] of [
		[0, -2],
		[-1, -1],
		[0, -1],
		[1, -1],
		[-2, 0],
		[-1, 0],
		[0, 0],
		[1, 0],
		[2, 0],
		[-1, 1],
		[0, 1],
		[1, 1],
		[0, 2],
	]) {
		set(canvas, cx + dx, cy + dy, colour);
	}
}

/**
 * A long pennant on a pole, streaming to the right in waves and narrowing to a point.
 * @param {Canvas} scene
 * @param {number} x - The pole's column
 * @param {number} top - The pole's top row
 * @param {number} length - How far it streams
 * @param {number} width - Its half-height at the pole
 * @param {Colour} light - The cloth's lit top edge
 * @param {Colour} cloth
 * @param {Colour} shade - Its folds and lower edge
 */
function drawStreamer(scene, x, top, length, width, light, cloth, shade) {
	for (let y = top; y < TOWER_TOP - 3; y++) {
		set(scene, x, y, C.timber);
	}
	set(scene, x, top - 1, C.gold);
	for (let i = 1; i <= length; i++) {
		const half = Math.min(
			width,
			Math.floor(((length - i) * (width + 1.5)) / length)
		);
		const wave = Math.round(Math.sin(i * 0.35) * 1.5);
		const cy = top + 2 + wave;
		for (let j = -half; j <= half; j++) {
			const folded = Math.sin(i * 0.35) > 0.6;
			let colour = folded ? shade : cloth;
			if (j === -half && !folded) {
				colour = light;
			} else if (j === half) {
				colour = shade;
			}
			set(scene, x + i, cy + j, colour);
		}
	}
}

/**
 * The herald, facing right, cheeks puffed, in a feathered cap and a quartered tabard,
 * his near arm raised to hold the trumpet.
 * @param {Canvas} canvas
 */
function drawHerald(canvas) {
	const rows = [
		'..ww........',
		'.wwwrrr.....',
		'..wwrrrrr...',
		'...rrrrrrrR.',
		'...hhSSSSS..',
		'...hhSSeSS..',
		'...hhSSSSPP.',
		'....hSSSPPPm',
		'....hsSSSPs.',
		'.....ssSSs..',
		'......ss....',
		'...ccccccc..',
		'..rrrrggggg.',
		'.rrrrrgggggg',
		'.rrrrrgggggg',
		'.rrrrrggggg.',
		'.rrrrrggggg.',
		'.rrrrrggggg.',
		'.rrrrrgggg..',
		'.bbbbbbbbbb.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
		'.ggggrrrrrr.',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		w: C.creamLight,
		r: C.brickRed,
		R: C.brickRedLight,
		h: C.timber,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		P: mix(C.skin, C.creamLight, 0.45),
		m: C.brickRedShade,
		c: C.cream,
		g: C.gold,
		b: C.wood,
	};
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, HERALD_X + i, HERALD_Y + j, colours[key]);
			}
		});
	});
	// The near arm, reaching forward and up from the shoulder to the trumpet.
	const [hx, hy] = [31, tubeAt(31) + 2];
	for (let i = 0; i <= 8; i++) {
		const x = 21 + i;
		const y = Math.round(29 + ((hy - 29) * i) / 9);
		set(canvas, x, y, C.brickRed);
		set(canvas, x, y + 1, C.brickRed);
		set(canvas, x, y + 2, C.brickRedShade);
	}
	set(canvas, hx - 1, hy, C.skin);
	set(canvas, hx, hy, C.skin);
	set(canvas, hx - 1, hy + 1, C.skinShade);
	set(canvas, hx, hy + 1, C.skin);
	set(canvas, hx + 1, hy, C.skinShade);
}

/**
 * The trumpet tube's top row at a column, on the straight line from the mouthpiece to the bell.
 * @param {number} x
 * @returns {number}
 */
function tubeAt(x) {
	const [mx, my] = MOUTH;
	const [bx, by] = BELL;
	return Math.round(my + ((by - my) * (x - mx)) / (bx - mx));
}

/**
 * The long straight trumpet rising from the herald's lips to a flared bell, a banner hung beneath it.
 * @param {Canvas} canvas
 */
function drawTrumpet(canvas) {
	const [mx] = MOUTH;
	const [bx] = BELL;
	// The banner hangs from the tube.
	for (let x = 36; x <= 47; x++) {
		const top = tubeAt(x) + 2;
		for (let y = top; y < top + 11; y++) {
			const fringe = y === top + 10;
			if (fringe && x % 2 === 0) {
				continue;
			}
			set(
				canvas,
				x,
				y,
				fringe ? C.gold : x >= 46 ? C.brickRedShade : C.brickRed
			);
		}
	}
	diamond(canvas, 41, tubeAt(41) + 7, C.gold);
	// The tube.
	for (let x = mx; x <= bx; x++) {
		const y = tubeAt(x);
		set(canvas, x, y, C.gold);
		set(canvas, x, y + 1, C.amber);
	}
	// A ring halfway along.
	set(canvas, 34, tubeAt(34), C.lampGlow);
	set(canvas, 34, tubeAt(34) + 1, C.gold);
	// The bell, flaring wide.
	for (let i = 0; i < 6; i++) {
		const x = bx - 5 + i;
		const half = Math.floor(i / 1.5);
		const y = tubeAt(x);
		for (let j = -half; j <= half + 1; j++) {
			set(canvas, x, y + j, j <= 0 ? C.gold : C.amber);
		}
	}
	for (let j = -4; j <= 5; j++) {
		set(canvas, bx + 1, BELL[1] + j, j < 0 ? C.lampGlow : C.gold);
	}
}
