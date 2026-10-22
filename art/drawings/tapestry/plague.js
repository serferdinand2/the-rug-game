// Plague: a beaked plague doctor with a lantern in a deserted medieval street at night, the doors marked with red crosses.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawWheel } from '../../parts/wheel.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The street's vanishing point, and the columns where the two rows of houses meet the far house. */
const VP = { x: 24, y: 30 };
const FAR_LEFT = 14;
const FAR_RIGHT = 34;

/** The doctor's top-left corner, and the lantern's flame hanging from the outstretched hand. */
const DOCTOR_AT = { x: 31, y: 24 };
const LAMP = { x: 32, y: 45 };

/** The cold, sickly colours of the street by moonlight. */
const PLASTER_LIT = mix(C.stoneLight, C.pineLight, 0.25);
const PLASTER = mix(C.stone, C.pine, 0.3);
const PLASTER_OCHRE = mix(C.creamShade, C.stoneShade, 0.55);
const PLASTER_DIM = mix(C.stoneShade, C.pine, 0.3);
const PLASTER_DARK = mix(C.stoneShade, C.pineShade, 0.55);
const BEAM = mix(C.wood, C.pineShade, 0.35);
const SHUTTER = mix(C.timberShade, C.pineShade, 0.45);
const SLATE = mix(C.roofShade, C.pineShade, 0.3);
const COBBLE = mix(C.stoneShade, C.pineShade, 0.35);
const COBBLE_LIT = mix(C.stoneMid, C.pine, 0.3);
const MIST = mix(C.stoneLight, C.pineLight, 0.45);
const MOONLIT = mix(C.stoneLight, C.pineLight, 0.2);

/**
 * The plague doctor facing left: a wide-brimmed hat, a long pale beak with a red glass eye,
 * a shoulder cape and a long waxed coat, one arm held out for the lantern.
 * k hat, h hat lit by the moon, m beak, M beak shade, g glass eye, G its brass rim, o coat, d coat shade,
 * f cape and folds lit by the moon, r coat's moonlit edge, a coat lit by the lantern, l glove, B boot.
 */
const DOCTOR = [
	'..............hhhhhh........',
	'.............hkkkkkkh.......',
	'.............kkkkkkkk.......',
	'.............kddddddk.......',
	'........hhhhhhhhhhhhhhhhh...',
	'.........kkkkkkkkkkkkkkk....',
	'............ooddddddd.......',
	'..........mmGGoddddddd......',
	'.....mmmmmmmGgGodddddd......',
	'..mmmmmmmmmmMGGooddddd......',
	'....MMMMMMMMMMooddddddd.....',
	'..........MMMoooodddddd.....',
	'..........ffffffffffdddr....',
	'.........ffooooooooodddrr...',
	'..ffffffffoooooooooodddrrr..',
	'lloooooooooooooooooodddddr..',
	'llaaaaaaaaooooooooooddddddr.',
	'.........addddddddddddddddr.',
	'.........aoooofoooofoddddr',
	'.........aoooofoooofoddddr',
	'........aooooofoooofoddddr',
	'........aooooofoooofooddddr',
	'........aooooofoooofooddddr',
	'........aoooofooooofooddddr',
	'.......aooooofooooofooddddr',
	'.......aooooofooooofooddddr',
	'.......aooooofooooofooddddr',
	'......aoooooofooooofoooddddr',
	'......aoooooofooooofoooddddr',
	'......aoooooofooooofoooddddr',
	'.....aooooooofooooofoooddddr',
	'.....aoooooofoooooofoooddddr',
	'.....aoooooofoooooofoooddddr',
	'.....aoooooofoooooofooooddddr',
	'....aooooooofoooooofooooddddr',
	'....aooooooofoooooofooooddddr',
	'.......BBBB.......BBBB',
];

/**
 * Draws the Plague scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1347);

	drawSky(layer, {
		time: 'night',
		horizon: 30,
		random,
		stars: 14,
		starRows: 14,
	});
	tintSky(layer);
	drawMoon(layer);
	drawStreet(layer, random);
	drawFarHouse(layer);
	drawRow(layer, 'left');
	drawRow(layer, 'right');

	// The cart stands further down the street, behind the doctor, so it gets its own outline.
	const cart = createCanvas(64, 64);
	drawCart(cart);
	outline(cart, C.ink);
	underlay(cart, layer);
	drawCartWheel(cart);
	// The lantern lights the street and the cart; the doctor carries his own lit edge.
	glow(cart, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 19,
		colour: C.amber,
		strength: 0.55,
		steps: 4,
		skip: [C.ink],
	});

	paint(scene, DOCTOR_AT.x, DOCTOR_AT.y, DOCTOR, {
		k: C.night,
		h: MOONLIT,
		m: C.cream,
		M: C.creamShade,
		g: C.brickRedLight,
		G: C.brass,
		o: mix(C.night, C.pineShade, 0.5),
		d: mix(C.night, C.pineShade, 0.2),
		f: mix(C.pineShade, C.stoneShade, 0.55),
		r: MOONLIT,
		a: mix(C.timber, C.amber, 0.5),
		l: C.timber,
		B: C.wood,
	});
	// The pointing cane in the hidden hand.
	line(scene, 58, 37, 61, 61, C.timber);
	outline(scene, C.ink);
	underlay(scene, cart);
	drawLantern(scene);
	return scene;
}

/**
 * Tints the strip of night sky towards a cold grey-green.
 * @param {Canvas} layer
 */
function tintSky(layer) {
	const tint = mix(C.pineShade, C.nightSky2, 0.5);
	for (let y = 0; y <= 30; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && colour !== C.white && colour !== C.starDim) {
				set(layer, x, y, mix(colour, tint, 0.45));
			}
		}
	}
}

/**
 * A pale full moon above the far house, in a sickly greenish halo.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const moon = { x: 26, y: 6, r: 4 };
	glow(layer, {
		x: moon.x,
		y: moon.y,
		radius: 11,
		colour: mix(C.moon, C.grassLight, 0.3),
		strength: 0.3,
	});
	for (let y = moon.y - moon.r; y <= moon.y + moon.r; y++) {
		for (let x = moon.x - moon.r; x <= moon.x + moon.r; x++) {
			const d = Math.hypot(x - moon.x, y - moon.y);
			if (d <= moon.r + 0.3) {
				set(layer, x, y, d > moon.r - 1 ? C.moonRim : C.moon);
			}
		}
	}
	set(layer, moon.x + 1, moon.y - 1, C.moonRim);
	set(layer, moon.x - 2, moon.y + 1, C.moonRim);
}

/**
 * The cobbled street running away to the far house: courses that tighten with distance,
 * a gutter down the middle, and mist pooling at the far end.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStreet(layer, random) {
	for (let y = VP.y; y < 64; y++) {
		const depth = y - VP.y;
		const course = Math.sqrt(depth * 6);
		for (let x = 0; x < 64; x++) {
			const lean = Math.round(((x - VP.x) * 6) / Math.max(1, depth));
			const joint =
				course % 1 < 0.25 ||
				(x + lean + Math.floor(course) * 2) % 5 === 0;
			let colour = joint ? COBBLE : COBBLE_LIT;
			if (Math.abs(x - VP.x) <= depth * 0.05) {
				colour = PLASTER_DARK;
			}
			set(layer, x, y, colour);
		}
	}
	// Mist lying at the far end of the street.
	for (let y = 38; y <= 46; y++) {
		for (let x = 0; x < 64; x++) {
			const thick = y <= 42 ? (x + y) % 2 === 0 : (x + y) % 4 === 0;
			if (thick) {
				set(layer, x, y, MIST);
			}
		}
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = 48 + Math.floor(random() * 15);
		set(layer, x, y, PLASTER_DARK);
	}
}

/**
 * The top and bottom rows of one row of houses at a column, on lines that meet at the vanishing point.
 * @param {number} x
 * @returns {{ top: number, bottom: number }}
 */
function wallAt(x) {
	const dx = Math.abs(x - VP.x);
	return {
		top: Math.round(VP.y - dx * 1.05),
		bottom: Math.round(VP.y + dx),
	};
}

/**
 * A row of house fronts along one side of the street, in perspective: plaster between dark timbers,
 * jettied storeys and closed shutters, the nearest door on the left marked with a red cross.
 * @param {Canvas} layer
 * @param {'left' | 'right'} side
 */
function drawRow(layer, side) {
	// Where one house ends and the next begins, from near to far.
	const posts = side === 'left' ? [0, 10, FAR_LEFT] : [63, 50, 41, FAR_RIGHT];
	const tints =
		side === 'left'
			? [PLASTER_OCHRE, PLASTER_LIT]
			: [PLASTER, PLASTER_OCHRE, PLASTER_LIT];
	const step = side === 'left' ? 1 : -1;
	for (let i = 0; i < posts.length - 1; i++) {
		for (let x = posts[i]; x !== posts[i + 1] + step; x += step) {
			const { top, bottom } = wallAt(x);
			const height = bottom - top;
			// The roof's eaves overhang the wall.
			for (let y = top - 3; y < top; y++) {
				set(layer, x, y, y === top - 3 ? PLASTER_DIM : SLATE);
			}
			for (let y = top; y <= bottom; y++) {
				const f = (y - top) / height;
				let colour =
					f > 0.66 ? mix(tints[i], PLASTER_DARK, 0.45) : tints[i];
				for (const beam of [0.34, 0.66]) {
					const row = Math.round(top + beam * height);
					if (y === row) {
						colour = BEAM;
					} else if (y === row + 1) {
						colour = mix(tints[i], PLASTER_DARK, 0.7);
					}
				}
				if (x === posts[i] || y === top) {
					colour = BEAM;
				}
				set(layer, x, y, colour);
			}
		}
		const from = posts[i] + step * 2;
		const to = posts[i + 1] - step * 2;
		shutters(layer, from, to, 0.1, 0.25);
		shutters(layer, from, to, 0.43, 0.56);
		if (i === 0 && side === 'left') {
			door(layer, from, to);
		}
	}
}

/**
 * A pair of closed shutters on a wall, with a pale sill under them, between two columns and two heights
 * measured as fractions of the wall.
 * @param {Canvas} layer
 * @param {number} a - One edge column
 * @param {number} b - The other edge column
 * @param {number} f0 - The top, as a fraction of the wall's height
 * @param {number} f1 - The bottom, as a fraction of the wall's height
 */
function shutters(layer, a, b, f0, f1) {
	const [left, right] = a < b ? [a, b] : [b, a];
	const middle = Math.round((left + right) / 2);
	for (let x = left; x <= right; x++) {
		const { top, bottom } = wallAt(x);
		const y0 = Math.round(top + f0 * (bottom - top));
		const y1 = Math.round(top + f1 * (bottom - top));
		for (let y = y0; y <= y1; y++) {
			const edge = x === left || x === right || y === y0;
			set(layer, x, y, edge || x === middle ? BEAM : SHUTTER);
		}
		set(layer, x, y1 + 1, PLASTER_LIT);
	}
}

/**
 * A plank door on the ground floor with a broad red cross painted across it.
 * @param {Canvas} layer
 * @param {number} a - One edge column
 * @param {number} b - The other edge column
 */
function door(layer, a, b) {
	const [left, right] = a < b ? [a, b] : [b, a];
	const middle = Math.round((left + right) / 2);
	/** @type {{ x: number, y0: number, y1: number }[]} */
	const columns = [];
	for (let x = left; x <= right; x++) {
		const { top, bottom } = wallAt(x);
		const y0 = Math.round(top + 0.69 * (bottom - top));
		columns.push({ x, y0, y1: bottom });
		for (let y = y0; y <= bottom; y++) {
			const edge = x === left || x === right || y === y0;
			const plank = (x - left) % 3 === 0 ? SHUTTER : C.timberShade;
			set(layer, x, y, edge ? BEAM : plank);
		}
	}
	// The cross: an upright down the middle and a bar across its upper half.
	const centre = columns.find((c) => c.x === middle) ?? columns[0];
	const height = centre.y1 - centre.y0;
	for (let y = centre.y0 + 2; y <= centre.y1 - 2; y++) {
		set(layer, middle, y, C.brickRed);
		set(layer, middle + 1, y, C.brickRedShade);
	}
	for (const c of columns) {
		if (c.x > left && c.x < right) {
			const row = c.y0 + Math.round(height * 0.38);
			set(layer, c.x, row, C.brickRed);
			set(layer, c.x, row + 1, C.brickRedShade);
		}
	}
}

/**
 * The house at the far end of the street, facing down it: a gable against the moonlit sky,
 * shuttered windows, a marked door, and its foot lost in the mist.
 * @param {Canvas} layer
 */
function drawFarHouse(layer) {
	const top = wallAt(FAR_LEFT).top;
	const bottom = VP.y + 10;
	const middle = Math.round((FAR_LEFT + FAR_RIGHT) / 2);
	for (let y = top - 9; y <= bottom; y++) {
		for (let x = FAR_LEFT; x <= FAR_RIGHT; x++) {
			const rise = y - (top - 9);
			if (y < top && Math.abs(x - middle) > rise) {
				continue;
			}
			let colour = PLASTER_DIM;
			if (y < top && Math.abs(x - middle) >= rise - 1) {
				colour = SLATE;
			} else if (y === top || y === top + 9) {
				colour = BEAM;
			}
			set(layer, x, y, colour);
		}
	}
	// A shuttered gable window, two windows, and the marked door.
	rect(layer, middle - 1, top - 4, 3, 3, SHUTTER);
	rect(layer, FAR_LEFT + 3, top + 3, 4, 4, SHUTTER);
	rect(layer, FAR_RIGHT - 6, top + 3, 4, 4, SHUTTER);
	set(layer, FAR_LEFT + 4, top + 4, mix(C.amber, SHUTTER, 0.4));
	rect(layer, middle - 2, top + 12, 5, 9, C.timberShade);
	rect(layer, middle, top + 13, 1, 6, C.brickRed);
	rect(layer, middle - 1, top + 15, 3, 1, C.brickRed);
}

/**
 * A handcart left in the street with a covered load, its handles resting on the cobbles.
 * @param {Canvas} canvas
 */
function drawCart(canvas) {
	// The load under a pale shroud, and a spade laid across it.
	for (let y = 40; y <= 45; y++) {
		const half = y === 40 ? 3 : y === 41 ? 5 : 6;
		for (let x = 16 - half; x <= 16 + half; x++) {
			set(canvas, x, y, y === 40 || x < 16 - half + 2 ? MIST : PLASTER);
		}
	}
	line(canvas, 9, 41, 21, 38, C.timber);
	rect(canvas, 21, 37, 2, 2, C.stone);
	// The bed and its sides.
	rect(canvas, 8, 46, 17, 2, C.timber);
	rect(canvas, 8, 46, 17, 1, C.timberLight);
	// The handles, sloping down to the cobbles.
	line(canvas, 24, 46, 28, 50, C.timber);
}

/**
 * The cart's wheel, drawn after the outline so its spokes stay clear.
 * @param {Canvas} canvas
 */
function drawCartWheel(canvas) {
	for (let y = 45; y <= 55; y++) {
		for (let x = 7; x <= 17; x++) {
			if (Math.hypot(x - 12, y - 50) <= 5.6) {
				set(canvas, x, y, C.ink);
			}
		}
	}
	drawWheel(canvas, {
		x: 12,
		y: 50,
		r: 5,
		spokes: 6,
		tyre: C.timberShade,
		spoke: C.timber,
		hub: C.brass,
	});
}

/**
 * The lantern hanging from the doctor's gloved hand: an iron frame round a bright flame.
 * Drawn last, with its own ink edge.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	paint(
		scene,
		LAMP.x - 3,
		LAMP.y - 5,
		[
			'...k...',
			'..kfk..',
			'.kfffk.',
			'kfgggfk',
			'kfgwgfk',
			'kfgwgfk',
			'kfgggfk',
			'.kfffk.',
			'..kkk..',
		],
		{ k: C.ink, f: C.lampFrame, g: C.gold, w: C.lampGlow }
	);
	set(scene, LAMP.x, LAMP.y - 6, C.lampFrame);
}
