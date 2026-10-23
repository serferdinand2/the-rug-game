// Animation: a brass zoetrope drum spinning on its turned stand by candlelight at night, a galloping horse in a row of frames showing over its rim.
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
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The drum: the centre of its open top, the top's half-width and half-depth, and the wall's height. */
const DRUM = { x: 37, y: 19, rx: 22, ry: 9, height: 17 };

/** Rows of the slit band under the rim, and of the picture strip under the slits, inside and out. */
const SLITS = 6;
const STRIP = 9;

/** How many slits and how many frames run round the drum, and how far it has turned. */
const SLIT_COUNT = 26;
const FRAME_COUNT = 12;
const TURN = 0.12;

/** The rows of the painted band round the drum's foot. */
const BAND = { top: 12, bottom: 14 };

/** The row where the wall meets the table top. */
const TABLE = 50;

/** The candle: its centre column, its top row and the row its saucer stands on; and the flame above its wick. */
const CANDLE = { x: 7, top: 37, foot: 57 };
const FLAME = { x: 7, y: 31 };

/** The wallpaper: a dark green damask with paler stripes, and the shadow the drum throws on it. */
const WALL = mix(C.tealShade, C.night, 0.6);
const WALL_STRIPE = mix(C.tealShade, C.night, 0.42);
const WALL_DARK = mix(C.tealShade, C.night, 0.78);
const WALL_SHADOW = mix(C.tealShade, C.ink, 0.82);

/** The mahogany table top, its grain, its lit back edge and the shadow of the stand. */
const TABLE_TOP = mix(C.timberShade, C.brickRedShade, 0.35);
const TABLE_LIGHT = mix(C.timber, C.brickRedShade, 0.3);
const TABLE_DARK = mix(C.timberShade, C.wood, 0.6);
const TABLE_SHADOW = mix(C.wood, C.ink, 0.45);
const REFLECTION = mix(TABLE_LIGHT, C.cream, 0.5);

/** The darkest brass, deep inside the drum, and the gloom seen through a near slit. */
const BRASS_DEEP = mix(C.lampFrame, C.wood, 0.55);
const SLIT_DARK = mix(C.wood, C.ink, 0.5);

/** The painted band round the foot of the drum. */
const BAND_RED = C.brickRedShade;
const BAND_RED_LIGHT = C.brickRed;
const BAND_RED_DARK = mix(C.brickRedShade, C.wood, 0.5);

/** The paper strip's frame lines and the horse's ink. */
const FRAME_LINE = mix(C.creamShade, C.lampFrame, 0.55);
const HORSE = mix(C.wood, C.ink, 0.35);

/** The turned stand's wood. */
const STAND_LIGHT = C.timberLight;
const STAND = C.timber;
const STAND_SHADE = C.timberShade;

/** The candle's wax, lit by its own flame from above. */
const WAX = C.creamLight;
const WAX_SHADE = C.cream;
const WAX_DARK = C.creamShade;

/** The faint arcs of motion beside the spinning drum. */
const SPIN = mix(WALL_STRIPE, C.brass, 0.45);
const SPIN_BRIGHT = mix(WALL_STRIPE, C.lampGlow, 0.75);

/** The warm light the candle spreads round the room. */
const CANDLELIGHT = mix(C.lampGlow, C.amber, 0.3);

/** The flame's colours, which the glow leaves alone. */
const FLAME_COLOURS = [C.white, C.lampGlow, C.gold, C.amber];

/**
 * A galloping horse in four poses, one per frame from left to right, facing right. `x` is the horse's ink.
 * @type {readonly (readonly string[])[]}
 */
const HORSES = [
	[
		'.......x.',
		'......xxx',
		'.xxxxxxx.',
		'x.xxxxx..',
		'.x....x..',
		'x......x.',
	],
	[
		'.......x.',
		'......xxx',
		'.xxxxxxx.',
		'x.xxxxx..',
		'...xx.x..',
		'..x..x...',
	],
	[
		'.......x.',
		'......xxx',
		'.xxxxxxx.',
		'x.xxxxx..',
		'..x...xx.',
		'.x....x..',
	],
];

/**
 * Draws the Animation masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6107);

	drawWall(layer);
	drawTable(layer, random);

	drawCandle(scene);
	drawStand(scene);
	drawOutside(scene);
	drawInside(scene);
	drawFrames(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 52,
		colour: CANDLELIGHT,
		strength: 0.32,
		steps: 4,
		skip: [C.ink, ...FLAME_COLOURS],
	});
	drawFlame(scene);
	drawSpin(scene);
	drawGleams(scene);
	return scene;
}

/**
 * The half-depth of the drum's open top at a column, as a share of `DRUM.ry`: 1 in the middle, 0 at the sides.
 * @param {number} x
 * @returns {number}
 */
function depthAt(x) {
	const u = (x - DRUM.x) / DRUM.rx;
	return Math.sqrt(Math.max(0, 1 - u * u));
}

/**
 * Tells whether a point lies on the drum's silhouette, from its far rim down to its foot.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onDrum(x, y) {
	if (Math.abs(x - DRUM.x) > DRUM.rx) {
		return false;
	}
	const s = depthAt(x);
	return y >= DRUM.y - DRUM.ry * s && y <= DRUM.y + DRUM.ry * s + DRUM.height;
}

/**
 * The columns where a slit or a frame edge falls, for marks spaced evenly round the drum.
 * @param {number} count - How many marks run round the whole drum
 * @param {number} turn - How far the first mark has turned, in marks
 * @param {boolean} near - The near side of the drum, or the far side
 * @returns {Set<number>}
 */
function markColumns(count, turn, near) {
	/** @type {Set<number>} */
	const columns = new Set();
	for (let k = 0; k < count; k++) {
		const angle = ((k + turn) / count) * Math.PI * 2;
		const facing = Math.sin(angle);
		// Skip the marks turned edge-on at the drum's sides, where they would crowd into a dark seam.
		if ((near ? facing : -facing) < 0.3) {
			continue;
		}
		columns.add(Math.round(DRUM.x + DRUM.rx * Math.cos(angle)));
	}
	return columns;
}

/**
 * The wallpaper: dark green with paler stripes and a small damask diamond, darker towards the ceiling, and the drum's shadow.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < TABLE; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = x % 8 < 2 ? WALL_STRIPE : WALL;
			const motif =
				Math.abs((x % 8) - 5) + Math.abs((y % 10) - 5) === 1 &&
				x % 8 !== 5;
			if (motif) {
				colour = WALL_STRIPE;
			}
			if (y < 6 || (y < 12 && (x + y) % 2 === 0)) {
				colour = colour === WALL_STRIPE ? WALL : WALL_DARK;
			}
			// The candle throws the drum's shadow up and to the right on the wall.
			if (onDrum(x - 7, y + 2) && !onDrum(x, y)) {
				colour = WALL_SHADOW;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The polished mahogany table: a lit back edge, streaks of grain, the stand's shadow and the candle's reflection.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTable(layer, random) {
	rect(layer, 0, TABLE, 64, 64 - TABLE, TABLE_TOP);
	rect(layer, 0, TABLE, 64, 1, TABLE_LIGHT);
	rect(layer, 0, TABLE + 1, 64, 1, TABLE_DARK);
	for (let i = 0; i < 14; i++) {
		const y = TABLE + 3 + Math.floor(random() * (61 - TABLE));
		const x = Math.floor(random() * 60);
		const length = 4 + Math.floor(random() * 12);
		rect(layer, x, y, length, 1, random() < 0.5 ? TABLE_DARK : TABLE_LIGHT);
	}
	// The stand's shadow, thrown to the right, away from the candle.
	for (let y = 54; y < 62; y++) {
		for (let x = 30; x < 64; x++) {
			if (((x - 50) / 15) ** 2 + ((y - 58) / 3.2) ** 2 < 1) {
				set(layer, x, y, TABLE_SHADOW);
			}
		}
	}
	// The candle mirrored in the polish below its saucer.
	rect(layer, CANDLE.x - 2, 60, 5, 4, TABLE_LIGHT);
	rect(layer, CANDLE.x - 1, 60, 2, 3, REFLECTION);
}

/**
 * Picks a brass tone for a point on the drum's outside by how much it faces the candle, which stands to the left.
 * @param {number} facing - From -1 (turned away) to 1 (facing the candle)
 * @returns {Colour}
 */
function brassTone(facing) {
	if (facing > 0.72) {
		return C.lampGlow;
	}
	if (facing > 0.32) {
		return C.gold;
	}
	if (facing > -0.15) {
		return C.brass;
	}
	if (facing > -0.6) {
		return C.amber;
	}
	return C.lampFrame;
}

/**
 * Picks a darker brass tone for the inside of the drum, whose far right wall faces the candle.
 * @param {number} facing - From -1 (turned away) to 1 (facing the candle)
 * @returns {Colour}
 */
function innerTone(facing) {
	if (facing > 0.55) {
		return C.brass;
	}
	if (facing > 0) {
		return C.amber;
	}
	if (facing > -0.55) {
		return C.lampFrame;
	}
	return BRASS_DEEP;
}

/**
 * The drum's outside: a rolled lip, a band of slits blurred by the spin, a raised rib, plain brass and a painted band at the foot.
 * @param {Canvas} scene
 */
function drawOutside(scene) {
	const { x: cx, y: cy, rx, ry, height } = DRUM;
	const slits = markColumns(SLIT_COUNT, TURN, true);
	for (let x = cx - rx; x <= cx + rx; x++) {
		const u = (x - cx) / rx;
		const top = Math.round(cy + ry * depthAt(x));
		const facing = -u * 0.95 + 0.12;
		for (let d = 0; d <= height; d++) {
			let colour = brassTone(facing);
			if (d === 0) {
				colour = brassTone(facing + 0.45);
			} else if (d <= SLITS) {
				colour = brassTone(facing - 0.1);
				if (slits.has(x)) {
					colour = SLIT_DARK;
				} else if (slits.has(x + 1)) {
					// The spin smears each slit to its left.
					colour = brassTone(facing - 0.75);
				}
			} else if (d === SLITS + 1) {
				colour = brassTone(facing + 0.5);
			} else if (d === SLITS + 2) {
				colour = brassTone(facing - 0.45);
			} else if (d >= BAND.top && d <= BAND.bottom) {
				colour = BAND_RED;
				if (d === BAND.top || u < -0.55) {
					colour = BAND_RED_LIGHT;
				} else if (u > 0.5) {
					colour = BAND_RED_DARK;
				}
			} else if (d === BAND.bottom + 1) {
				colour = brassTone(facing + 0.3);
			} else if (d === height) {
				colour = brassTone(facing - 0.6);
			}
			set(scene, x, top + d, colour);
		}
	}
}

/**
 * The inside of the drum over the near rim: the far rim, the slits seen from within and the paper strip of frames below them.
 * @param {Canvas} scene
 */
function drawInside(scene) {
	const { x: cx, y: cy, rx, ry } = DRUM;
	const slits = markColumns(SLIT_COUNT, TURN + 0.5, false);
	const edges = markColumns(FRAME_COUNT, 0.5, false);
	for (let x = cx - rx; x <= cx + rx; x++) {
		const u = (x - cx) / rx;
		const far = Math.round(cy - ry * depthAt(x));
		const near = Math.round(cy + ry * depthAt(x));
		for (let y = far; y < near; y++) {
			const d = y - far;
			let colour;
			if (d === 0) {
				colour = innerTone(u + 0.7);
			} else if (d <= SLITS) {
				colour = slits.has(x) ? WALL_DARK : innerTone(u);
			} else if (d <= SLITS + STRIP) {
				colour = paperTone(u);
				if (d === SLITS + 1 || d === SLITS + STRIP || edges.has(x)) {
					colour = FRAME_LINE;
				}
			} else {
				colour = BRASS_DEEP;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The paper strip's tone across the far wall: lit on the right, where it faces the candle, and shaded on the left.
 * @param {number} u - Across the drum, -1 to 1
 * @returns {Colour}
 */
function paperTone(u) {
	if (u > 0.15) {
		return C.creamLight;
	}
	return u > -0.45 ? C.cream : C.creamShade;
}

/**
 * The galloping horse, one pose in each of the frames that face us squarely enough to show it.
 * @param {Canvas} scene
 */
function drawFrames(scene) {
	const { x: cx, y: cy, rx, ry } = DRUM;
	let pose = 0;
	for (let k = FRAME_COUNT - 1; k >= 0; k--) {
		const from = ((k + 0.5) / FRAME_COUNT) * Math.PI * 2;
		const to = ((k + 1.5) / FRAME_COUNT) * Math.PI * 2;
		if (Math.sin(from) > -0.3 || Math.sin(to) > -0.3) {
			continue;
		}
		const left = Math.round(cx + rx * Math.cos(from));
		const right = Math.round(cx + rx * Math.cos(to));
		const centre = Math.round((left + right) / 2);
		const top = Math.round(cy - ry * depthAt(centre)) + SLITS + 2;
		const rows = HORSES[pose % HORSES.length];
		paint(scene, centre - 4, top, rows, { x: HORSE });
		pose++;
	}
}

/**
 * The turned stand: a brass spindle with a knob, on a stepped wooden base standing on the table.
 * @param {Canvas} scene
 */
function drawStand(scene) {
	const cx = DRUM.x;
	const bottom = DRUM.y + DRUM.ry + DRUM.height;
	for (let y = bottom + 1; y <= 51; y++) {
		set(scene, cx - 1, y, C.gold);
		set(scene, cx, y, C.brass);
		set(scene, cx + 1, y, C.amber);
	}
	// The knob halfway down the spindle.
	rect(scene, cx - 2, bottom + 3, 5, 2, C.brass);
	set(scene, cx - 2, bottom + 3, C.lampGlow);
	set(scene, cx - 1, bottom + 3, C.gold);
	set(scene, cx + 2, bottom + 4, C.lampFrame);
	// The base: a small turned step on a broad disc, each lit from the left.
	turnedDisc(scene, 51, 5, 1);
	turnedDisc(scene, 54, 11, 3);
}

/**
 * One turned wooden disc of the stand: a lit rim on top and a shaded side below it.
 * @param {Canvas} scene
 * @param {number} top - The row of its top edge
 * @param {number} half - Its half-width
 * @param {number} side - How many rows its side shows
 */
function turnedDisc(scene, top, half, side) {
	const cx = DRUM.x;
	for (let x = cx - half; x <= cx + half; x++) {
		const across = (x - cx) / half;
		let colour = STAND;
		if (across < -0.45) {
			colour = STAND_LIGHT;
		} else if (across > 0.5) {
			colour = STAND_SHADE;
		}
		set(scene, x, top, across < 0.3 ? STAND_LIGHT : STAND);
		for (let d = 1; d <= side; d++) {
			set(scene, x, top + d, d === side ? STAND_SHADE : colour);
		}
	}
}

/**
 * The candle in its brass chamberstick: a saucer with a ring handle, the wax with a run of drips, and the wick.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	const { x: cx, top, foot } = CANDLE;
	// The saucer and its rim.
	for (let x = cx - 6; x <= cx + 6; x++) {
		const facing = -(x - cx) / 6;
		set(scene, x, foot - 1, brassTone(facing + 0.5));
		set(scene, x, foot, brassTone(facing - 0.1));
	}
	for (let x = cx - 4; x <= cx + 4; x++) {
		set(scene, x, foot + 1, brassTone(-(x - cx) / 4 - 0.5));
	}
	// The ring handle on the saucer's right.
	set(scene, cx + 7, foot - 2, C.amber);
	set(scene, cx + 8, foot - 1, C.amber);
	set(scene, cx + 8, foot - 3, C.brass);
	set(scene, cx + 9, foot - 2, C.lampFrame);
	// The socket the candle stands in.
	rect(scene, cx - 3, foot - 3, 7, 2, C.brass);
	set(scene, cx - 3, foot - 3, C.gold);
	set(scene, cx + 3, foot - 2, C.amber);
	// The wax, lit on its left and down its middle.
	for (let y = top; y < foot - 3; y++) {
		set(scene, cx - 2, y, WAX);
		set(scene, cx - 1, y, C.white);
		set(scene, cx, y, WAX);
		set(scene, cx + 1, y, WAX_SHADE);
		set(scene, cx + 2, y, WAX_DARK);
	}
	// The pool of melted wax at the top and its drips down the side.
	rect(scene, cx - 2, top, 5, 1, WAX_SHADE);
	set(scene, cx - 1, top, WAX);
	for (const [x, y] of [
		[cx - 2, top + 1],
		[cx - 2, top + 2],
		[cx + 2, top + 1],
		[cx + 2, top + 2],
		[cx + 2, top + 3],
		[cx + 2, top + 4],
		[cx + 3, top + 4],
	]) {
		set(scene, x, y, x < cx ? C.white : WAX_SHADE);
	}
	// The wick.
	set(scene, cx, top - 1, C.wood);
}

/**
 * The flame: a bright teardrop over the wick, with a white heart, painted over the glow.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 2,
		FLAME.y - 5,
		[
			'..a..',
			'..g..',
			'.aga.',
			'.gyg.',
			'agwga',
			'gywyg',
			'.gyg.',
			'..a..',
		],
		{ a: C.amber, g: C.gold, y: C.lampGlow, w: C.white }
	);
}

/**
 * Two faint arcs of motion just outside the drum, one on each side, showing which way it spins.
 * @param {Canvas} scene
 */
function drawSpin(scene) {
	const { x: cx, y: cy, rx, ry } = DRUM;
	// Each arc runs over the far rim, from its faint tail to its bright head in the direction of the spin.
	const arcs = [
		{ from: Math.PI + 1.25, to: Math.PI + 0.35 },
		{ from: Math.PI * 2 - 0.35, to: Math.PI * 2 - 1.25 },
	];
	for (const { from, to } of arcs) {
		for (let i = 0; i <= 16; i++) {
			const t = i / 16;
			const angle = from + (to - from) * t;
			const x = Math.round(cx + (rx + 4) * Math.cos(angle));
			const y = Math.round(cy + (ry + 5) * Math.sin(angle));
			set(scene, x, y, t > 0.6 ? SPIN_BRIGHT : SPIN);
		}
	}
}

/**
 * The brightest gleams of candlelight on the drum's lip, its rib and the spindle's knob.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[17, 23],
		[18, 24],
		[16, 27],
		[19, 33],
		[35, 47],
		[3, 56],
	]) {
		set(scene, x, y, C.white);
	}
}
