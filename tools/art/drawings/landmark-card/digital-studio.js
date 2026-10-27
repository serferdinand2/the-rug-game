// Digital Studio: an artist's hand drawing with a stylus on a glowing tablet at night, the wide monitor above showing the pixel-art sunset over mountains nearly finished, its last corner still a pencil sketch on white, headphones and a mug on the desk in the dark room.
import {
	createCanvas,
	get,
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

/** The desk's back edge below the monitor. */
const DESK = 34;

/** The monitor: its outer box, bezel included, and its screen inside. */
const MONITOR = { x0: 3, y0: 2, x1: 60, y1: 29 };
const SCREEN = { x0: 5, y0: 4, x1: 58, y1: 27 };

/** The drawing app's canvas on the screen, right of the colour swatches, and the horizon in the picture. */
const ART = { x0: 11, y0: 4, x1: 58, y1: 27, horizon: 20 };

/** The setting sun in the picture on screen, low in the valley between the peaks. */
const SUN = { x: 29, y: 15, r: 4.2 };

/** The picture's mountains: each peak's column and how high it rises above the horizon. */
const PEAKS = [
	{ x: 15, h: 9 },
	{ x: 23, h: 5 },
	{ x: 41, h: 10 },
	{ x: 53, h: 7 },
];

/** The lake under the sun, in the near hills. */
const LAKE = { x: 29, y: 24.5, rx: 13, ry: 1.9 };

/** Pines on the near hills in the picture: each one's column. */
const PINES = [14, 18, 40];

/** Streaks of cloud lit pink by the sunset: each one's left end, row and length. */
const CLOUDS = [
	{ x: 13, y: 7, w: 9 },
	{ x: 36, y: 9, w: 8 },
];

/** The tablet on the desk, narrower at the back: its rows and its left and right edges at the back and front. */
const TABLET = {
	top: 40,
	bottom: 59,
	backLeft: 15,
	backRight: 51,
	frontLeft: 11,
	frontRight: 55,
};

/** The stylus: its nib on the end of the line just drawn, and its far end lying back over the knuckles towards the wrist. */
const PEN = { tip: [30, 50], end: [50, 40] };

/** The dark room: its wall high and low, and the desk top. */
const WALL_HIGH = C.nightSky1;
const WALL_LOW = mix(C.nightSky2, C.nightSky3, 0.5);
const DESK_TOP = mix(C.roofShade, C.night, 0.3);
const DESK_GRAIN = mix(C.roofShade, C.night, 0.6);
const DESK_EDGE = mix(C.roof, C.roofLight, 0.3);

/** The monitor's bezel: its rim catching the glow, its face, and the stand. */
const BEZEL_RIM = C.stoneShade;
const BEZEL = mix(C.night, C.ink, 0.3);
const STAND = mix(C.stoneShade, C.night, 0.4);

/** The drawing app round the picture: its panel and the swatches of the artist's colours. */
const PANEL = mix(C.roof, C.night, 0.4);
const SWATCHES = [C.gold, C.duskSky5, C.roofLight, C.pine, C.duskSky4];

/** The sunset on screen, from the top of the sky down, and its sun. */
const SKY = [C.duskSky2, C.duskSky3, C.duskSky4, C.duskSky5, C.duskSky6];
const SUN_EDGE = C.gold;
const SUN_CORE = C.lampGlow;

/** The far mountains in the picture, lit towards the sun and shaded away from it, with snow on the high peaks. */
const MOUNTAIN = C.roofLight;
const MOUNTAIN_SHADE = C.roof;
const MOUNTAIN_SNOW = C.duskSky6;

/** The near hills and the lake, with the sun's glints on the water. */
const HILL = C.pine;
const HILL_SHADE = C.pineShade;
const WATER = C.duskSky4;
const WATER_LIGHT = C.duskSky5;
const GLINT = C.gold;
const PINE = C.pineShade;
const CLOUD = C.duskSky5;
const CLOUD_LIGHT = C.duskSky6;

/** The corner not yet painted: a white canvas with the artist's pencil lines on it. */
const BLANK = C.white;
const BLANK_SHADE = mix(C.stoneLight, C.white, 0.5);
const SKETCH = C.stoneShade;

/** The tablet: its dark frame, its rim, its glowing face and the line just drawn on it. */
const TABLET_FRAME = mix(C.night, C.ink, 0.2);
const TABLET_RIM = C.stoneShade;
const TABLET_GLOW = mix(C.tealLight, C.white, 0.35);
const TABLET_FACE = mix(C.tealLight, C.teal, 0.3);
const TABLET_EDGE = mix(C.teal, C.tealShade, 0.3);
const STROKE = C.tealShade;

/** The stylus: dark with a lit edge and a pale tip. */
const PEN_BODY = mix(C.night, C.stoneShade, 0.4);
const PEN_LIGHT = C.stoneLight;
const PEN_TIP = C.creamShade;

/** The artist's hand, lit by the tablet below, and a grey hoodie sleeve. */
const HAND_LIGHT = mix(C.skinDeep, C.skinTan, 0.55);
const HAND = C.skinDeep;
const HAND_SHADE = C.skinDeepShade;
const KNUCKLE_LINE = mix(C.skinDeepShade, C.ink, 0.55);
const SLEEVE_LIGHT = mix(C.stone, C.teal, 0.25);
const SLEEVE = C.stoneShade;
const SLEEVE_SHADE = mix(C.stoneShade, C.night, 0.5);

/** The headphones: their band and cups, lit and dark, and the soft cushions. */
const PHONES = mix(C.night, C.roofShade, 0.5);
const PHONES_LIGHT = C.roofLight;
const CUSHION = C.arcaneShade;
const CUSHION_LIGHT = C.arcane;

/** The colours the tablet's light leaves alone: its own face, the hand and the darkest lines. */
const KEEP = [
	C.ink,
	TABLET_GLOW,
	TABLET_FACE,
	TABLET_EDGE,
	STROKE,
	PEN_TIP,
	HAND_LIGHT,
	HAND,
	HAND_SHADE,
	KNUCKLE_LINE,
];

/** The mug of tea: white china lit and shaded, and its red band. */
const MUG_LIGHT = C.creamLight;
const MUG = mix(C.cream, C.stoneLight, 0.5);
const MUG_SHADE = C.stone;
const MUG_BAND = C.brickRed;
const TEA = mix(C.timberShade, C.ink, 0.3);

/**
 * Draws the Digital Studio landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8839);

	drawRoom(layer, random);
	glow(layer, {
		x: 31,
		y: 16,
		radius: 44,
		colour: C.duskSky3,
		strength: 0.4,
		steps: 3,
	});

	drawMonitor(scene);
	drawPicture(scene);
	drawTablet(scene);
	drawPhones(scene);
	drawMug(scene);
	drawHand(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: PEN.tip[0],
		y: PEN.tip[1],
		radius: 24,
		colour: C.teal,
		strength: 0.35,
		steps: 2,
		skip: KEEP,
	});
	drawSteam(scene);
	return scene;
}

/**
 * The dark room: a wall fading lower down, and the desk top with its back edge catching the screen's light.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoom(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour;
			if (y < DESK) {
				colour = y + ((x + y) % 2) * 3 > 16 ? WALL_LOW : WALL_HIGH;
			} else {
				colour =
					y === DESK
						? DESK_EDGE
						: random() < 0.08
							? DESK_GRAIN
							: DESK_TOP;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The wide monitor: a thin dark bezel lit along its rim, on a stand down to the desk, the drawing app's panel of
 * colour swatches down the left of its screen.
 * @param {Canvas} scene
 */
function drawMonitor(scene) {
	const { x0, y0, x1, y1 } = MONITOR;
	rect(scene, x0, y0, x1 - x0 + 1, y1 - y0 + 1, BEZEL);
	rect(scene, x0, y0, x1 - x0 + 1, 1, BEZEL_RIM);
	rect(scene, 29, y1 + 1, 6, DESK - y1 - 1, STAND);
	rect(scene, 23, DESK, 18, 2, STAND);
	rect(scene, 23, DESK, 18, 1, BEZEL_RIM);
	rect(
		scene,
		SCREEN.x0,
		SCREEN.y0,
		ART.x0 - SCREEN.x0,
		SCREEN.y1 - SCREEN.y0 + 1,
		PANEL
	);
	SWATCHES.forEach((colour, i) => {
		rect(scene, SCREEN.x0 + 1, SCREEN.y0 + 2 + i * 4, 3, 3, colour);
	});
}

/**
 * How high the mountains reach at a column: the row of their skyline, and the peak that column belongs to.
 * @param {number} x
 * @returns {{ top: number, peak: number }}
 */
function mountainAt(x) {
	let best = { top: ART.horizon, peak: PEAKS[0].x };
	for (const peak of PEAKS) {
		const top = ART.horizon - peak.h + Math.abs(x + 0.5 - peak.x) * 0.9;
		if (top < best.top) {
			best = { top, peak: peak.x };
		}
	}
	return best;
}

/**
 * The row where the near hills begin at a column.
 * @param {number} x
 * @returns {number}
 */
function hillAt(x) {
	return ART.horizon - 1 + Math.round(Math.sin(x * 0.3 + 1) * 1.5);
}

/**
 * Tells whether a pixel of the picture is still unpainted: the bottom right corner, its edge stepping down in strokes.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function unpainted(x, y) {
	return y > 11 && x + Math.floor(y / 2) * 2 > 70;
}

/**
 * The picture being drawn on screen: a sunset over far mountains, the sun sinking into the valley and glinting on a
 * lake in the hills. Its bottom right corner is not painted yet: the white canvas shows the pencil outline of the
 * mountains and hills still to be coloured.
 * @param {Canvas} scene
 */
function drawPicture(scene) {
	const { x0, y0, x1, y1, horizon } = ART;
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const band = Math.min(
				SKY.length - 1,
				Math.floor(((y - y0) / (horizon - y0)) * SKY.length)
			);
			const mountain = mountainAt(x);
			const hill = hillAt(x);
			const sun = Math.hypot(x + 0.5 - SUN.x, y + 0.5 - SUN.y);
			let colour = SKY[band];
			const cloud = CLOUDS.find(
				(c) =>
					y >= c.y &&
					y <= c.y + 1 &&
					x >= c.x + (y - c.y) * 2 &&
					x < c.x + c.w
			);
			if (cloud) {
				colour = y === cloud.y ? CLOUD_LIGHT : CLOUD;
			}
			if (sun < SUN.r) {
				colour = sun < SUN.r - 1.5 ? SUN_CORE : SUN_EDGE;
			}
			if (y >= mountain.top) {
				colour = x + 0.5 > mountain.peak ? MOUNTAIN_SHADE : MOUNTAIN;
				if (y < mountain.top + 2 && y < horizon - 6) {
					colour = MOUNTAIN_SNOW;
				}
			}
			if (y >= hill) {
				colour = y > hill + 1 ? HILL_SHADE : HILL;
			}
			const lake = Math.hypot(
				(x + 0.5 - LAKE.x) / LAKE.rx,
				(y + 0.5 - LAKE.y) / LAKE.ry
			);
			if (lake < 1) {
				// The sun's reflection: a long streak of gold across the far water and a short one nearer.
				const across = Math.abs(x + 0.5 - SUN.x);
				const far = y < LAKE.y - 1;
				colour = far ? WATER_LIGHT : WATER;
				if (across < (far ? 3.5 : 1.5) && y !== Math.floor(LAKE.y)) {
					colour = GLINT;
				}
			}
			if (
				PINES.some(
					(px) =>
						Math.abs(x - px) <= Math.max(0, y - hill + 3) * 0.5 &&
						y < hill + 1 &&
						y > hill - 4
				)
			) {
				colour = PINE;
			}
			if (unpainted(x, y)) {
				const line = y === Math.ceil(mountain.top) || y === hill;
				colour = line
					? SKETCH
					: x % 4 === 0 && y % 4 === 0
						? BLANK_SHADE
						: BLANK;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Where a pixel falls on the tablet: across it and down it, each from 0 to 1, or null off it.
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number } | null}
 */
function onTablet(x, y) {
	const v = (y + 0.5 - TABLET.top) / (TABLET.bottom - TABLET.top);
	if (v < 0 || v > 1) {
		return null;
	}
	const left = TABLET.backLeft + (TABLET.frontLeft - TABLET.backLeft) * v;
	const right = TABLET.backRight + (TABLET.frontRight - TABLET.backRight) * v;
	const u = (x + 0.5 - left) / (right - left);
	return u < 0 || u > 1 ? null : { u, v };
}

/**
 * The pen tablet lying on the desk: a dark slate with a lit rim, its face glowing brightest round the pen's tip,
 * and the zigzag of a mountain ridge the artist has just drawn on it.
 * @param {Canvas} scene
 */
function drawTablet(scene) {
	for (let y = TABLET.top; y <= TABLET.bottom + 1; y++) {
		for (let x = 0; x < 64; x++) {
			const at = onTablet(x, Math.min(y, TABLET.bottom));
			if (!at) {
				continue;
			}
			let colour = TABLET_FRAME;
			if (y > TABLET.bottom) {
				colour = BEZEL;
			} else if (y === TABLET.top) {
				colour = TABLET_RIM;
			} else if (at.u > 0.1 && at.u < 0.95 && at.v > 0.12 && at.v < 0.9) {
				const near = Math.hypot(x - PEN.tip[0], (y - PEN.tip[1]) * 1.6);
				colour =
					near + ((x + y) % 2) * 2 < 9
						? TABLET_GLOW
						: near < 20
							? TABLET_FACE
							: TABLET_EDGE;
			}
			set(scene, x, y, colour);
		}
	}
	// Two buttons down the frame's left side.
	set(scene, 14, 45, TABLET_RIM);
	set(scene, 13, 49, TABLET_RIM);
	// The stroke: an uneven ridge of peaks, sketched up to the pen's tip.
	const ridge = [
		[16, 53],
		[19, 51],
		[21, 52],
		[24, 47],
		[26, 49],
		[28, 48],
		[30, 50],
	];
	for (let i = 1; i < ridge.length; i++) {
		const [ax, ay] = ridge[i - 1];
		const [bx, by] = ridge[i];
		const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay));
		for (let s = 0; s <= steps; s++) {
			set(
				scene,
				Math.round(ax + ((bx - ax) * s) / steps),
				Math.round(ay + ((by - ay) * s) / steps),
				STROKE
			);
		}
	}
}

/**
 * The stylus, from its nib on the end of the drawn line up over the knuckles to its end, a slim dark wand with a lit edge.
 * @param {Canvas} scene
 */
function drawPen(scene) {
	const pen = createCanvas(64, 64);
	const [x0, y0] = PEN.tip;
	const [x1] = PEN.end;
	rect(pen, x0, y0, 2, 1, PEN_TIP);
	// The barrel climbs one row for every two columns, a clean pixel slope.
	for (let x = x0 + 2; x <= x1; x++) {
		const y = y0 - 1 - Math.floor((x - x0 - 2) / 2);
		set(pen, x, y, PEN_BODY);
		set(pen, x, y - 1, x >= x1 - 1 ? PEN_BODY : PEN_LIGHT);
	}
	// Its own dark edge, so the slim pen stands out against the bright tablet and the hand.
	outline(pen, C.ink);
	for (let i = 0; i < pen.p.length; i++) {
		if (pen.p[i]) {
			scene.p[i] = pen.p[i];
		}
	}
}

/**
 * Paints a finger or a limb: a thick rounded stroke, lit along one side and shaded along the other.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Half its thickness
 * @param {readonly [Colour, Colour, Colour]} tones - Lit, plain and shaded
 */
function limb(scene, [x0, y0], [x1, y1], r, [light, plain, shade]) {
	const lx = x1 - x0;
	const ly = y1 - y0;
	const length = Math.hypot(lx, ly) || 1;
	for (
		let y = Math.floor(Math.min(y0, y1) - r - 1);
		y <= Math.max(y0, y1) + r + 1;
		y++
	) {
		for (
			let x = Math.floor(Math.min(x0, x1) - r - 1);
			x <= Math.max(x0, x1) + r + 1;
			x++
		) {
			const px = x + 0.5 - x0;
			const py = y + 0.5 - y0;
			const t = Math.max(
				0,
				Math.min(1, (px * lx + py * ly) / (length * length))
			);
			const ox = px - lx * t;
			const oy = py - ly * t;
			if (Math.hypot(ox, oy) > r) {
				continue;
			}
			const side = (ox * -ly + oy * lx) / length;
			set(
				scene,
				x,
				y,
				side < -r * 0.35 ? light : side > r * 0.4 ? shade : plain
			);
		}
	}
}

/**
 * The artist's hand coming in from the right, holding the stylus as a pen: pinched between the thumb below and the
 * arched index finger above, the other fingers curled under into a fist, the barrel lying back over the knuckles,
 * a grey hoodie sleeve behind.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	const hand = createCanvas(64, 64);
	const skin = /** @type {const} */ ([HAND_LIGHT, HAND, HAND_SHADE]);
	part(hand, (c) =>
		limb(c, [64, 59], [54, 54], 6, [SLEEVE_LIGHT, SLEEVE, SLEEVE_SHADE])
	);
	part(hand, drawFist);
	// The pinch: the thumb from below and the index finger arching over the pen, both tips meeting near the nib.
	// The pen rests across the thumb and the index finger's base, so it is drawn over them, under the fingertip.
	part(hand, (c) => limb(c, [45, 52], [35, 50], 1.7, skin));
	part(hand, (c) => limb(c, [44, 46], [39, 43], 1.6, skin));
	drawPen(hand);
	part(hand, (c) => limb(c, [39, 43], [35, 46], 1.5, skin));
	set(hand, 35, 45, HAND_LIGHT);
	for (let i = 0; i < hand.p.length; i++) {
		if (hand.p[i]) {
			scene.p[i] = hand.p[i];
		}
	}
}

/**
 * The fist behind the grip: the back of the hand and the curled middle, ring and little fingers, lit along the top
 * by the screen, with creases between the curled fingers.
 * @param {Canvas} canvas
 */
function drawFist(canvas) {
	const centre = { x: 46.5, y: 51 };
	const r = { x: 7.5, y: 5.5 };
	for (let y = 44; y < 58; y++) {
		for (let x = 38; x < 56; x++) {
			const dx = (x + 0.5 - centre.x) / r.x;
			const dy = (y + 0.5 - centre.y) / r.y;
			const d = Math.hypot(dx, dy);
			if (d > 1) {
				continue;
			}
			let colour = HAND;
			if (dy < -0.55 && dx < 0.5) {
				colour = HAND_LIGHT;
			} else if (dx + dy > 0.75 || (d > 0.8 && dy > 0.35)) {
				colour = HAND_SHADE;
			}
			set(canvas, x, y, colour);
		}
	}
	// The creases between the curled fingers, under the thumb.
	for (const [x0, y0] of [
		[40, 53],
		[42, 55],
	]) {
		rect(canvas, x0, y0, 3, 1, KNUCKLE_LINE);
	}
}

/**
 * Adds one part of the hand over the parts already drawn, with a dark line round it so fingers stay apart.
 * @param {Canvas} hand - Changed in place
 * @param {(part: Canvas) => void} paintPart - Paints the part on a blank canvas
 */
function part(hand, paintPart) {
	const piece = createCanvas(64, 64);
	paintPart(piece);
	outline(piece, KNUCKLE_LINE);
	for (let i = 0; i < piece.p.length; i++) {
		if (piece.p[i]) {
			hand.p[i] = piece.p[i];
		}
	}
}

/**
 * Over-ear headphones lying on the desk at the left, their padded band curving up between the two cups.
 * @param {Canvas} scene
 */
function drawPhones(scene) {
	for (let i = 0; i <= 24; i++) {
		const t = (i / 24) * Math.PI;
		const x = Math.round(5.5 - Math.cos(t) * 5.5);
		const y = Math.round(47 - Math.sin(t) * 7);
		rect(scene, x, y, 1, 2, PHONES);
		set(scene, x, y, PHONES_LIGHT);
	}
	for (const cx of [0, 11]) {
		paint(
			scene,
			cx - 2,
			45,
			['.ppp.', 'pllcp', 'plccp', 'pcccp', 'pcccp', 'pcccp', '.ppp.'],
			{ p: PHONES, c: CUSHION, l: CUSHION_LIGHT }
		);
	}
}

/**
 * A mug of tea at the back of the desk on the right, lit by the screen.
 * @param {Canvas} scene
 */
function drawMug(scene) {
	paint(
		scene,
		51,
		DESK - 2,
		[
			'ltttts..',
			'lmmmmmsss',
			'lmmmmms.s',
			'bbbbbbs.s',
			'lmmmmmsss',
			'lmmmmms..',
			'.mmmms...',
		],
		{ l: MUG_LIGHT, m: MUG, s: MUG_SHADE, b: MUG_BAND, t: TEA }
	);
}

/**
 * A thread of steam rising from the mug, blended with the dark behind it.
 * @param {Canvas} scene
 */
function drawSteam(scene) {
	for (let y = 30; y < DESK - 2; y++) {
		const x = 54 + Math.round(Math.sin(y * 0.9) * 1.2);
		const under = get(scene, x, y);
		if (under && under !== C.ink) {
			set(scene, x, y, mix(under, C.white, 0.3));
		}
	}
}
