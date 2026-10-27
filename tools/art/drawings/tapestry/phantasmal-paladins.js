// Phantasmal Paladins: spectral knights on ghostly horses charging across a moonlit field, the leader's sword raised and mist streaming behind them.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The far edge of the field, the front knight's top-left corner, and the two knights riding behind him. */
const HORIZON = 39;
const KNIGHT = { x: 8, y: 34 };
const FAR_KNIGHTS = [
	[-1, 25],
	[26, 16],
];

/** The spectres' blue-white light: lit edges, body, shade, the mane and the trailing mist. */
const SPECTRE_LIGHT = C.white;
const SPECTRE = mix(C.foam, C.white, 0.45);
const SPECTRE_SHADE = mix(C.nightWave, C.foam, 0.45);
const MANE = mix(C.nightWave, C.foam, 0.2);
const MIST = mix(C.nightWave, C.foam, 0.5);
const DEEP = C.nightSea3;

/** The colour of each key in the knights' sprites. */
const KEYS = {
	H: SPECTRE,
	r: SPECTRE,
	m: MANE,
	t: MANE,
	s: SPECTRE_SHADE,
	S: SPECTRE_SHADE,
	c: C.lampGlow,
	k: DEEP,
	e: DEEP,
};

/** The front knight at full gallop, facing right: H horse, m mane, t tail, r rider, k visor, s shield, c its cross, S the rider's leg, e the eye. */
const RIDER = [
	'............mmmm..................',
	'..........mmm.rrrr................',
	'..............rrkk................',
	'..............rrrr..........H.H...',
	'...............rr..........HHHH...',
	'..............rrrrr.......mHHHHH..',
	'.............sssssrr.....mmHHeHHH.',
	'.............sscssrr....mmHHHHHHHH',
	'.............cccccrr...mmHHHH..HHH',
	'.............sscssr...mmHHHH......',
	'..............scs.r..mmHHHHH......',
	'..........HHHHHsHHHSmHHHHHHH......',
	'.......HHHHHHHHHHHHSHHHHHHHHH.....',
	'ttt..HHHHHHHHHHHHHSHHHHHHHHHH.....',
	'.tttHHHHHHHHHHHHHHSHHHHHHHHHH.....',
	'..ttHHHHHHHHHHHHHHHHHHHHHHHHH.....',
	'...tHHHHHHHHHHHHHHHHHHHHHHHH......',
	'....HHHHHHHHHHHHHHHHHHHHHHH.......',
	'.....HHHHHH........HHHHHHH........',
	'...HHHH.HH.........HH..HHHH.......',
	'..HHH..HH...........HH...HHHH.....',
	'.HHH...HH...........HHH....HHHH...',
	'HH......HH............HH.....HHH..',
	'H.......HH.............H.......H..',
];

/** A knight further off, drawn smaller. */
const FAR_RIDER = [
	'......mr..........',
	'.....mrrk...H.H...',
	'......sr...mHHHH..',
	'......cr..mHHeHHH.',
	'....HHsHHmHHH..HH.',
	'ttHHHHHHHHHHH.....',
	'.tHHHHHHHHHHH.....',
	'..HHHH....HHHH....',
	'.HH.HH.....H..HH..',
	'H....H......H...H.',
];

/**
 * Draws the Phantasmal Paladins scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(881);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 34,
		starRows: 28,
		sparkles: [[6, 5]],
		moon: { x: 52, y: 9 },
	});
	coolSky(layer);
	drawTreeLine(layer);
	drawField(layer, random);
	glow(layer, {
		x: KNIGHT.x + 18,
		y: KNIGHT.y + 12,
		radius: 22,
		colour: C.foam,
		strength: 0.3,
		steps: 3,
	});
	drawTrails(layer);

	// Two knights ride behind, further off; they get their own outline and lie under the front knight.
	const back = createCanvas(64, 64);
	for (const [x, y] of FAR_KNIGHTS) {
		paint(back, x, y, FAR_RIDER, KEYS);
	}
	shade(back);
	outline(back, C.ink);

	paint(scene, KNIGHT.x, KNIGHT.y, RIDER, KEYS);
	shade(scene);
	outline(scene, C.ink);
	underlay(scene, back);
	underlay(scene, layer);
	drawSword(scene);
	fadeHooves(scene);
	return scene;
}

/**
 * Turns the night sky a colder, deeper blue.
 * @param {Canvas} layer
 */
function coolSky(layer) {
	const keep = [C.moon, C.moonRim, C.white];
	for (let i = 0; i < 64 * (HORIZON + 1); i++) {
		const colour = layer.p[i];
		if (colour && !keep.includes(colour)) {
			layer.p[i] = mix(colour, C.nightSea3, 0.35);
		}
	}
}

/**
 * A dark line of woods along the far edge of the field.
 * @param {Canvas} layer
 */
function drawTreeLine(layer) {
	const wood = mix(C.pineShade, C.nightSky2, 0.6);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON -
				3 -
				Math.abs(Math.sin(x * 0.7)) * 2 -
				Math.sin(x * 0.13) * 1.5
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, wood);
		}
	}
}

/**
 * The moonlit field: dark grass with pale tips, a low mist lying on it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawField(layer, random) {
	const tip = mix(C.grassLight, C.starDim, 0.5);
	const grass = mix(C.grassShade, C.nightSky3, 0.55);
	const deep = mix(C.forestFloorShade, C.ink, 0.45);
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = grass;
			if (y === HORIZON + 1) {
				colour = tip;
			} else if (y > 58 || (y > 53 && (x + y) % 2 === 0)) {
				colour = deep;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 36; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 3 + Math.floor(random() * (63 - HORIZON - 3));
		set(layer, x, y, tip);
		set(layer, x + 1, y - 1, tip);
	}
	// Mist lying low over the grass.
	for (let x = 0; x < 64; x++) {
		const top = HORIZON + 2 + Math.round(Math.sin(x * 0.25) * 1.2);
		for (let y = top; y <= top + 3; y++) {
			const behind = get(layer, x, y);
			if (behind) {
				set(layer, x, y, mix(behind, MIST, 0.35));
			}
		}
	}
}

/**
 * Streaks of mist trailing behind each rider, in three steps brightest where they leave the rider, showing their speed.
 * @param {Canvas} layer
 */
function drawTrails(layer) {
	for (const [x, y, n] of [
		[0, 46, 11],
		[0, 49, 10],
		[0, 43, 9],
		[0, 52, 7],
		[0, 27, 6],
		[8, 21, 18],
		[12, 24, 14],
		[15, 18, 10],
	]) {
		for (let k = 0; k < n; k++) {
			const behind = get(layer, x + k, y);
			if (behind) {
				const t = [0.2, 0.35, 0.55][Math.floor((3 * k) / n)];
				set(layer, x + k, y, mix(behind, MIST, t));
			}
		}
	}
}

/**
 * Shades the spectres: body pixels with nothing above them are lit white, those with nothing below are shaded.
 * @param {Canvas} canvas
 */
function shade(canvas) {
	/** @type {[number, number, Colour][]} */
	const changes = [];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (get(canvas, x, y) !== SPECTRE) {
				continue;
			}
			if (!get(canvas, x, y - 1)) {
				changes.push([x, y, SPECTRE_LIGHT]);
			} else if (!get(canvas, x, y + 1)) {
				changes.push([x, y, SPECTRE_SHADE]);
			}
		}
	}
	for (const [x, y, colour] of changes) {
		set(canvas, x, y, colour);
	}
}

/**
 * The front knight's sword, raised high at the charge: a glowing blade above a gold crossguard.
 * @param {Canvas} scene
 */
function drawSword(scene) {
	const x = KNIGHT.x + 19;
	const y = KNIGHT.y + 4;
	glow(scene, {
		x: x + 4,
		y: y - 6,
		radius: 5,
		colour: C.foam,
		strength: 0.35,
		steps: 2,
		skip: [C.ink],
	});
	// The hand and crossguard.
	set(scene, x, y, SPECTRE);
	line(scene, x - 1, y - 2, x + 2, y + 1, C.lampGlow);
	// The blade, lit on its upper edge.
	line(scene, x + 1, y - 2, x + 5, y - 9, SPECTRE_LIGHT);
	line(scene, x + 2, y - 2, x + 6, y - 9, SPECTRE);
	set(scene, x + 5, y - 10, SPECTRE_LIGHT);
}

/**
 * Lets the front horse's hooves fade into mist, so it seems to ride the air above the grass.
 * @param {Canvas} scene
 */
function fadeHooves(scene) {
	for (let y = KNIGHT.y + 21; y <= KNIGHT.y + 24; y++) {
		const t = y < KNIGHT.y + 23 ? 0.3 : 0.5;
		for (let x = KNIGHT.x - 1; x <= KNIGHT.x + 34; x++) {
			const colour = get(scene, x, y);
			if (colour) {
				set(scene, x, y, mix(colour, MIST, t));
			}
		}
	}
}
