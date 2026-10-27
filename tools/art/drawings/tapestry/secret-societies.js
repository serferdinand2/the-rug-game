// Secret Societies: hooded figures with candles in a vaulted cellar, seen from above, ringed round an eye in a triangle carved into the floor.
import {
	createCanvas,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The back wall's last row, and the carved symbol's centre. */
const WALL = 17;
const EYE = { x: 32, y: 43 };

/** The triangle's corners on the floor: the far apex and the two near corners. */
const APEX = { x: 32, y: 29 };
const NEAR_LEFT = { x: 15, y: 54 };
const NEAR_RIGHT = { x: 49, y: 54 };

/** The triangle's face, cut a little below the floor. */
const FACE = mix(C.stoneShade, C.ink, 0.5);

/**
 * The robes' colours: m robe lit by the candle, h robe, d shade, k the dark inside the hood,
 * f skin in the hood's shadow, L skin lit from below by the candle, c the candle's wax.
 */
const ROBE = {
	m: C.brickRed,
	h: C.brickRedShade,
	d: mix(C.brickRedShade, C.ink, 0.45),
	k: C.ink,
	f: mix(C.skinShade, C.ink, 0.35),
	L: mix(C.skin, C.gold, 0.3),
	c: C.cream,
};

/**
 * A hooded figure facing the viewer: a face lit from below inside the hood's dark opening,
 * and a candle held in both hands at the chest. Its flame sits on the wax, a row above the hands.
 */
const FACING = [
	'.....h.....',
	'....hhh....',
	'...mhhhd...',
	'...hkkkd...',
	'..mkfffkd..',
	'..mkfLfkd..',
	'..mkLLLkd..',
	'..mhkkkhd..',
	'.mhhhhhhhd.',
	'mhhhhmhhhhd',
	'mhhhLcLhhhd',
	'mhhmLcLmhhd',
	'mhhhmmmhhdd',
	'mhhhhmhhhdd',
	'mhhhhmhhhdd',
	'mhhhhmhhddd',
	'mmhhhmhhddd',
];

/** A hooded figure in profile, facing right, its face lit from below and the candle held out in front. */
const PROFILE = [
	'..hh.....',
	'.hhhh....',
	'.hhhhhm..',
	'dhhhkff..',
	'dhhhkLL..',
	'dhhhkLk..',
	'dhhhhhm..',
	'dhhhhmLLc',
	'dhhhhhm..',
	'dhhhhhm..',
	'dhhhhhm..',
	'ddhhhhhm.',
	'ddhhhhhm.',
	'ddhhhhhm.',
	'ddhhhhhmm',
];

/** A hooded figure seen from behind, nearest the viewer, its edges lit by its own candle. */
const BEHIND = [
	'.....m......',
	'....mhd.....',
	'...mhhhd....',
	'...mhhhd....',
	'...mhhhdd...',
	'...mhhhdd...',
	'.mmmhhhdddd.',
	'mhhhhhhhhhdd',
	'mhhhhhhhhhdd',
	'mhhhhdhhhhdd',
	'mhhhhdhhhhdd',
	'mhhhhdhhhhdd',
	'mhhhhdhhhhdd',
];

/**
 * One cultist in the ring: where they stand and which way they are drawn.
 * @typedef {Object} Cultist
 * @property {number} x - The sprite's left column
 * @property {number} y - The sprite's top row
 * @property {readonly string[]} rows - The sprite
 * @property {boolean} [mirror] - Flip the sprite
 * @property {[number, number]} [flame] - The candle flame's pixel, when the candle shows
 */

/** The ring, far side first so the nearer figures overlap. */
/** @type {Cultist[]} */
const RING = [
	{ x: 27, y: 12, rows: FACING, flame: [32, 21] },
	{ x: 11, y: 17, rows: FACING, flame: [16, 26] },
	{ x: 43, y: 17, rows: FACING, flame: [48, 26] },
	{ x: 2, y: 30, rows: PROFILE, flame: [10, 36] },
	{ x: 53, y: 30, rows: PROFILE, mirror: true, flame: [53, 36] },
	{ x: 0, y: 52, rows: BEHIND, mirror: true },
	{ x: 52, y: 52, rows: BEHIND },
];

/**
 * Draws the Secret Societies scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(523);

	drawVault(layer, random);
	drawFloor(layer, random);
	drawSymbol(layer);

	// The gold in the grooves gives off a faint light of its own.
	glow(layer, {
		x: EYE.x,
		y: EYE.y,
		radius: 24,
		colour: C.gold,
		strength: 0.22,
		steps: 3,
		skip: [C.gold, C.amber, C.lampGlow, C.creamShade, C.ink, FACE],
	});
	// Each candle throws a pool of light on the floor and the wall behind.
	for (const { flame } of RING) {
		if (flame) {
			glow(layer, {
				x: flame[0],
				y: flame[1] + 2,
				radius: 11,
				colour: C.amber,
				strength: 0.45,
				steps: 3,
				skip: [C.gold, C.amber, C.lampGlow, C.creamShade],
			});
		}
	}

	for (const cultist of RING) {
		paint(scene, cultist.x, cultist.y, cultist.rows, ROBE, {
			mirror: cultist.mirror,
		});
	}
	outline(scene, C.ink);
	underlay(scene, layer);
	for (const { flame } of RING) {
		if (flame) {
			set(scene, flame[0], flame[1], C.lampGlow);
			set(scene, flame[0], flame[1] - 1, C.gold);
		}
	}
	return scene;
}

/**
 * The cellar's back wall: dark brick with three vaulted arches, passages leading off into the dark.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawVault(layer, random) {
	const brick = mix(C.brickRedShade, C.ink, 0.45);
	const mortar = mix(C.brickRedShade, C.ink, 0.7);
	const lit = mix(C.brickRed, C.ink, 0.45);
	for (let y = 0; y <= WALL; y++) {
		for (let x = 0; x < 64; x++) {
			const course = Math.floor(y / 3);
			const joint = y % 3 === 2 || (x + (course % 2) * 3) % 6 === 0;
			set(layer, x, y, joint ? mortar : random() > 0.9 ? lit : brick);
		}
	}
	// Three arches: the passages beyond are black, each under a lit brick rim.
	for (const cx of [10, 32, 54]) {
		for (let y = 1; y <= WALL; y++) {
			for (let x = cx - 8; x <= cx + 8; x++) {
				const d = Math.hypot((x - cx) / 7, (y - 9) / 7);
				const inside = y >= 9 ? Math.abs(x - cx) <= 6 : d <= 1;
				const rim = y >= 9 ? Math.abs(x - cx) === 7 : d <= 1.2;
				if (inside) {
					set(layer, x, y, C.night);
				} else if (rim) {
					set(layer, x, y, lit);
				}
			}
		}
	}
}

/**
 * The floor: big worn flagstones growing deeper towards the viewer, with dark joints.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	const stone = mix(C.stoneShade, C.timberShade, 0.4);
	const worn = mix(C.stone, C.timberShade, 0.4);
	const joint = mix(C.stoneShade, C.ink, 0.6);
	let top = WALL + 1;
	for (let course = 0; top < 64; course++) {
		const depth = 3 + course;
		const width = 9 + course * 3;
		const offset = (course % 2) * Math.floor(width / 2);
		for (let y = top; y < Math.min(top + depth, 64); y++) {
			for (let x = 0; x < 64; x++) {
				const edge =
					y === top + depth - 1 || (x + offset) % width === 0;
				set(layer, x, y, edge ? joint : stone);
			}
		}
		top += depth;
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = WALL + 2 + Math.floor(random() * (62 - WALL));
		if (layer.p[y * 64 + x] === stone) {
			set(layer, x, y, worn);
		}
	}
	rect(layer, 0, WALL + 1, 64, 1, joint);
}

/**
 * The carved symbol: a triangle cut into the floor with gold in its grooves, an open eye inside it,
 * and short rays round it.
 * @param {Canvas} layer
 */
function drawSymbol(layer) {
	const groove = C.gold;
	const deep = C.amber;
	// The triangle's face, a shade darker than the floor, then its edges two pixels wide.
	for (let y = APEX.y; y <= NEAR_LEFT.y; y++) {
		const t = (y - APEX.y) / (NEAR_LEFT.y - APEX.y);
		const half = Math.round(t * (APEX.x - NEAR_LEFT.x));
		for (let x = APEX.x - half; x <= APEX.x + half; x++) {
			set(layer, x, y, FACE);
		}
	}
	for (const [a, b] of [
		[APEX, NEAR_LEFT],
		[APEX, NEAR_RIGHT],
		[NEAR_LEFT, NEAR_RIGHT],
	]) {
		line(layer, a.x, a.y, b.x, b.y, groove);
		line(layer, a.x, a.y + 1, b.x, b.y + 1, deep);
	}
	// Rays: short strokes pointing out from the triangle.
	for (const [x0, y0, x1, y1] of [
		[32, 25, 32, 22],
		[23, 39, 19, 37],
		[41, 39, 45, 37],
		[17, 58, 14, 61],
		[47, 58, 50, 61],
		[26, 59, 25, 62],
		[38, 59, 39, 62],
	]) {
		line(layer, x0, y0, x1, y1, deep);
	}
	// The eye: an almond outline, a gold iris and a dark pupil with a glint.
	const eye = [
		'....ggggg....',
		'..gg.....gg..',
		'.g...aaa...g.',
		'g...aakaa...g',
		'.g...aaa...g.',
		'..gg.....gg..',
		'....ggggg....',
	];
	paint(layer, EYE.x - 6, EYE.y - 3, eye, {
		g: groove,
		a: deep,
		k: C.ink,
	});
	paint(
		layer,
		EYE.x - 5,
		EYE.y - 2,
		['..wwwww..', '.ww...ww.', 'ww.....ww', '.ww...ww.', '..wwwww..'],
		{ w: C.creamShade }
	);
	set(layer, EYE.x - 1, EYE.y - 1, C.lampGlow);
}
