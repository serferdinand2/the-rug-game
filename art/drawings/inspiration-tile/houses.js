// Houses inspiration tile: the houses row's six innovations, from a hand print on rock to a chip in the mind.
import {
	createCanvas,
	get,
	line,
	mix,
	outline,
	paint,
	rect,
	seededRandom,
	set,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { INSIDE, drawInspirationTile } from '../../parts/inspiration-tile.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A shape's tones, lit from the top left.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/**
 * Tells whether a pixel belongs to a shape.
 * @typedef {(x: number, y: number) => boolean} Shape
 */

/**
 * A point on a space, as [x, y].
 * @typedef {readonly [number, number]} Point
 */

/** Polished brass, for the inkpot's collar and the telephone's fittings. */
const BRASS = { light: C.gold, base: C.brass, shade: C.lampFrame };

/**
 * Fills a shape with its base tone, lit along its top and left edges and shaded along its bottom and right ones.
 * @param {Canvas} canvas
 * @param {Shape} within
 * @param {Tones} tones
 * @param {number} [depth] - How many pixels deep the shade reaches in from the bottom and right
 */
function fillShape(canvas, within, tones, depth = 1) {
	for (let y = 0; y < INSIDE; y++) {
		for (let x = 0; x < INSIDE; x++) {
			if (!within(x, y)) {
				continue;
			}
			const lit = !within(x - 1, y) || !within(x, y - 1);
			let dark = false;
			for (let d = 1; d <= depth; d++) {
				dark ||= !within(x + d, y) || !within(x, y + d);
			}
			let colour = tones.base;
			if (dark && !lit) {
				colour = tones.shade;
			} else if (lit && !dark) {
				colour = tones.light;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Paints a shape in one flat colour.
 * @param {Canvas} canvas
 * @param {Shape} within
 * @param {Colour} colour
 */
function fillFlat(canvas, within, colour) {
	fillShape(canvas, within, { light: colour, base: colour, shade: colour });
}

/**
 * An ellipse, its centre and radii measured on pixel edges.
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @returns {Shape}
 */
function ellipse(cx, cy, rx, ry) {
	return (x, y) =>
		((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
}

/**
 * A rectangle, both corners included.
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @returns {Shape}
 */
function box(left, top, right, bottom) {
	return (x, y) => x >= left && x <= right && y >= top && y <= bottom;
}

/**
 * A rectangle with its corners rounded off by one pixel.
 * @param {number} left
 * @param {number} top
 * @param {number} right
 * @param {number} bottom
 * @returns {Shape}
 */
function rounded(left, top, right, bottom) {
	return (x, y) => {
		if (!box(left, top, right, bottom)(x, y)) {
			return false;
		}
		const fromSide = Math.min(x - left, right - x);
		const fromEnd = Math.min(y - top, bottom - y);
		return fromSide + fromEnd >= 2 || (fromSide >= 1 && fromEnd >= 1);
	};
}

/**
 * A shape given row by row as its leftmost and rightmost columns.
 * @param {number} top - The first row
 * @param {readonly Point[]} rows
 * @returns {Shape}
 */
function spans(top, rows) {
	return (x, y) => {
		const row = rows[y - top];
		return Boolean(row) && x >= row[0] && x <= row[1];
	};
}

/**
 * A polygon, its corners measured on pixel edges; a pixel is inside when its centre is.
 * @param {readonly Point[]} corners
 * @returns {Shape}
 */
function polygon(corners) {
	return (x, y) => {
		const px = x + 0.5;
		const py = y + 0.5;
		let inside = false;
		corners.forEach(([x1, y1], i) => {
			const [x0, y0] = corners.at(i - 1) ?? [x1, y1];
			const crosses =
				y0 > py !== y1 > py &&
				px < x0 + ((py - y0) * (x1 - x0)) / (y1 - y0);
			if (crosses) {
				inside = !inside;
			}
		});
		return inside;
	};
}

/**
 * Joins shapes into one.
 * @param {...Shape} shapes
 * @returns {Shape}
 */
function union(...shapes) {
	return (x, y) => shapes.some((within) => within(x, y));
}

/**
 * Paints one-pixel lines from point to point.
 * @param {Canvas} canvas
 * @param {readonly Point[]} points
 * @param {Colour} colour
 */
function path(canvas, points, colour) {
	points.slice(1).forEach(([x1, y1], i) => {
		const [x0, y0] = points[i];
		line(canvas, x0, y0, x1, y1, colour);
	});
}

/**
 * Paints single pixels.
 * @param {Canvas} canvas
 * @param {readonly Point[]} points
 * @param {Colour} colour
 */
function dots(canvas, points, colour) {
	for (const [x, y] of points) {
		set(canvas, x, y, colour);
	}
}

/**
 * Draws a part on its own layer, outlines it in ink and lays it over the canvas, so it stands out from what is behind.
 * @param {Canvas} canvas
 * @param {(layer: Canvas) => void} drawPart
 */
function inFront(canvas, drawPart) {
	const layer = createCanvas(INSIDE, INSIDE);
	drawPart(layer);
	outline(layer, C.ink);
	for (let y = 0; y < INSIDE; y++) {
		for (let x = 0; x < INSIDE; x++) {
			set(canvas, x, y, get(layer, x, y));
		}
	}
}

// Space 1, Symbology: a rock slab painted with a red hand print and a little ochre bison.

/** The slab, row by row from its top. */
const SLAB = spans(3, [
	[9, 17],
	[6, 21],
	[4, 23],
	[3, 24],
	[3, 25],
	[2, 26],
	[2, 26],
	[2, 26],
	[2, 27],
	[2, 27],
	[2, 27],
	[3, 27],
	[2, 27],
	[2, 27],
	[2, 26],
	[2, 27],
	[2, 27],
	[2, 27],
	[2, 27],
	[2, 27],
	[3, 27],
	[3, 26],
	[4, 26],
	[5, 25],
]);

/** The slab's warm grey stone, its pits and flecks, and the cracks across it. */
const ROCK = {
	light: mix(C.stoneLight, C.sandLight, 0.5),
	base: mix(C.stone, C.sand, 0.5),
	shade: mix(C.stoneShade, C.sandShade, 0.4),
};
const ROCK_PIT = mix(C.stone, C.sandShade, 0.4);
const ROCK_FLECK = mix(C.stoneLight, C.sand, 0.4);
const ROCK_SEED = 11;
const ROCK_SPECKLES = 50;
/** @type {readonly (readonly Point[])[]} */
const CRACKS = [
	[
		[17, 4],
		[19, 7],
		[18, 9],
	],
	[
		[2, 21],
		[5, 22],
		[6, 25],
	],
];

/** The red ochre hand print, splayed: `x` paint and `d` where it ran thin. */
const HAND = [
	'....x....',
	'..x.x.x..',
	'..x.x.x..',
	'..x.x.x.x',
	'x.xxxxx.x',
	'.xxxxxdxx',
	'..xxxxxxx',
	'..xdxxxx.',
	'...xxxx..',
	'...xxx...',
];
const HAND_AT = { x: 4, y: 5 };
const HAND_PAINT = { x: C.brickRed, d: mix(C.brickRed, ROCK.base, 0.45) };

/** The little bison, facing left as on a cave wall: `o` its ochre body, `d` its umber hump and legs, `k` its dark head and `h` its horn. */
const BISON = [
	'.h....ddd.......',
	'.h..dddddddo....',
	'..kkddddddoooo..',
	'.kkkdddddooooooo',
	'kkkkddddoooooooo',
	'kkk.ddoooooooood',
	'.k..ddooooooooo.',
	'.....d.d....d.d.',
	'.....d.d....d.d.',
];
const BISON_AT = { x: 11, y: 15 };
const BISON_PAINT = {
	o: mix(C.amber, C.timberLight, 0.35),
	d: C.timber,
	k: mix(C.wood, C.ink, 0.3),
	h: mix(C.wood, C.ink, 0.3),
};

/**
 * Space 1, Symbology.
 * @param {Canvas} canvas
 */
function drawSymbology(canvas) {
	fillShape(canvas, SLAB, ROCK, 2);
	const random = seededRandom(ROCK_SEED);
	for (let i = 0; i < ROCK_SPECKLES; i++) {
		const x = Math.floor(random() * INSIDE);
		const y = Math.floor(random() * INSIDE);
		if (get(canvas, x, y) === ROCK.base) {
			set(canvas, x, y, random() < 0.5 ? ROCK_PIT : ROCK_FLECK);
		}
	}
	for (const crack of CRACKS) {
		path(canvas, crack, ROCK.shade);
	}
	paint(canvas, HAND_AT.x, HAND_AT.y, HAND, HAND_PAINT);
	paint(canvas, BISON_AT.x, BISON_AT.y, BISON, BISON_PAINT);
	outline(canvas, C.ink);
}

// Space 2, Language: two speech bubbles, one holding a sun and the other a bird.

/** The speech bubbles' paper. */
const BUBBLE = { light: C.white, base: C.creamLight, shade: C.cream };

/** The first speaker's bubble, its tail pointing down to the left, and the second's in front of it, pointing down to the right. */
const SUN_BUBBLE = union(
	rounded(2, 2, 16, 12),
	spans(13, [
		[4, 6],
		[3, 4],
		[2, 2],
	])
);
const BIRD_BUBBLE = union(
	rounded(11, 13, 27, 25),
	spans(26, [
		[21, 24],
		[23, 25],
	])
);

/** The sun: `g` gold, `l` its lit edge, `a` amber shade and rays. */
const SUN = [
	'....a....',
	'.a.....a.',
	'...lgg...',
	'..lgggg..',
	'a.lggga.a',
	'..gggaa..',
	'...gaa...',
	'.a.....a.',
	'....a....',
];
const SUN_AT = { x: 5, y: 3 };
const SUN_PAINT = { g: C.gold, l: C.lampGlow, a: C.amber };

/** The songbird, facing right: `l` its lit crown and back, `r` red, `s` its shaded wing and tail, `e` eye, `b` beak, `k` legs. */
const BIRD = [
	'.......lll..',
	'......lrrrr.',
	'......rrerrbb',
	'ss...lrrrrr.',
	'.sslrrrrrrr.',
	'..ssssrrrr..',
	'...sssrrr...',
	'.....k.k....',
];
const BIRD_AT = { x: 13, y: 15 };
const BIRD_PAINT = {
	l: C.brickRedLight,
	r: C.brickRed,
	s: C.brickRedShade,
	e: C.ink,
	b: C.amber,
	k: C.timberShade,
};

/**
 * Space 2, Language.
 * @param {Canvas} canvas
 */
function drawLanguage(canvas) {
	inFront(canvas, (layer) => {
		fillShape(layer, SUN_BUBBLE, BUBBLE);
		paint(layer, SUN_AT.x, SUN_AT.y, SUN, SUN_PAINT);
	});
	inFront(canvas, (layer) => {
		fillShape(layer, BIRD_BUBBLE, BUBBLE);
		paint(layer, BIRD_AT.x, BIRD_AT.y, BIRD, BIRD_PAINT);
	});
	outline(canvas, C.ink);
}

// Space 3, Writing: a quill dipped in an inkpot beside a scroll of plain ruled lines.

/** The parchment sheet, its rolled ends, and its plain ruled lines: each line's row and last column. */
const SHEET = box(3, 4, 16, 25);
const ROLLS = [box(2, 2, 17, 4), box(2, 25, 17, 27)];
const PARCHMENT = { light: C.creamLight, base: C.cream, shade: C.creamShade };
const ROLL = { light: C.sandLight, base: C.sand, shade: C.sandShade };
const RULE = mix(C.creamShade, C.timber, 0.4);
const RULE_LEFT = 5;
const RULES = [
	[7, 14],
	[9, 14],
	[11, 12],
	[14, 14],
	[16, 14],
	[18, 10],
	[21, 14],
];

/** The squat inkpot of dark blue glass, row by row from its neck, its brass collar, the ink in its mouth and its shine. */
const INKPOT = spans(20, [
	[19, 23],
	[17, 25],
	[16, 26],
	[16, 26],
	[16, 26],
	[16, 26],
	[16, 26],
	[16, 26],
]);
const INKPOT_COLLAR = box(18, 18, 24, 19);
const INKPOT_MOUTH = box(20, 18, 22, 18);
const GLASS = {
	light: mix(C.daySea2, C.daySea1, 0.5),
	base: mix(C.daySea3, C.ink, 0.35),
	shade: mix(C.daySea3, C.ink, 0.65),
};
const GLASS_SHINE = box(18, 23, 18, 25);
const GLASS_GLINT = { x: 18, y: 22 };

/** The white quill: its shaft from the ink up to its tip, and the rows its vane covers, widest in the middle. */
const QUILL = { x0: 21, y0: 19, x1: 25, y1: 2 };
const VANE = { top: 3, bottom: 14, wideFrom: 5, wideTo: 12 };
const FEATHER = C.white;
const FEATHER_SHADE = C.cream;
const SHAFT = C.creamShade;

/**
 * Paints the quill's vane on either side of its shaft: lit on the left, in shade on the right.
 * @param {Canvas} canvas
 */
function drawVane(canvas) {
	const length = QUILL.y0 - QUILL.y1;
	for (let y = VANE.top; y <= VANE.bottom; y++) {
		const x = Math.round(
			QUILL.x1 - ((QUILL.x1 - QUILL.x0) * (y - QUILL.y1)) / length
		);
		const half = y < VANE.wideFrom || y > VANE.wideTo ? 1 : 2;
		for (let i = 1; i <= half; i++) {
			set(canvas, x - i, y, FEATHER);
			set(canvas, x + i, y, FEATHER_SHADE);
		}
	}
}

/**
 * Space 3, Writing.
 * @param {Canvas} canvas
 */
function drawWriting(canvas) {
	inFront(canvas, (layer) => {
		fillShape(layer, SHEET, PARCHMENT);
		for (const [y, right] of RULES) {
			rect(layer, RULE_LEFT, y, right - RULE_LEFT + 1, 1, RULE);
		}
		for (const roll of ROLLS) {
			fillShape(layer, roll, ROLL);
		}
	});
	inFront(canvas, (layer) => {
		fillShape(layer, INKPOT, GLASS, 2);
		fillShape(layer, INKPOT_COLLAR, BRASS);
		fillFlat(layer, INKPOT_MOUTH, C.ink);
		fillFlat(layer, GLASS_SHINE, mix(C.white, GLASS.light, 0.4));
		set(layer, GLASS_GLINT.x, GLASS_GLINT.y, C.white);
		line(layer, QUILL.x0, QUILL.y0, QUILL.x1, QUILL.y1, SHAFT);
		drawVane(layer);
	});
	outline(canvas, C.ink);
}

// Space 4, Telephone: a black candlestick telephone, its earpiece hung on a cord.

/** The telephone's black enamel: a charcoal well apart from the ink outline, lit along its edges and glinting. */
const ENAMEL = {
	light: mix(C.stone, C.stoneLight, 0.2),
	base: mix(C.stoneShade, C.night, 0.35),
	shade: mix(C.night, C.stoneShade, 0.25),
};
const GLINT = C.snow;
const GLINTS = union(
	box(12, 10, 12, 17),
	box(19, 12, 19, 15),
	box(19, 7, 20, 7),
	box(9, 6, 10, 6)
);

/** The bell-shaped foot, the stem, the transmitter's neck and the mouthpiece flaring to the left, row by row. */
const FOOT = spans(21, [
	[10, 15],
	[9, 16],
	[7, 18],
	[5, 20],
	[4, 21],
	[3, 22],
]);
const STEM = box(11, 8, 14, 21);
const NECK = box(8, 5, 14, 9);
const HORN = spans(2, [
	[4, 5],
	[3, 6],
	[2, 7],
	[2, 8],
	[2, 8],
	[2, 8],
	[2, 8],
	[2, 8],
	[2, 7],
	[3, 6],
	[4, 5],
]);

/** The mouthpiece's dark opening, and the brass rim round it. */
const MOUTH = box(3, 4, 4, 10);
const MOUTH_RIM = union(box(2, 4, 2, 10), box(3, 3, 4, 3), box(3, 11, 4, 11));

/** The earpiece hanging on its hook, its cup at the top, row by row. */
const RECEIVER = spans(7, [
	[18, 24],
	[18, 24],
	[19, 23],
	[20, 22],
	[20, 22],
	[19, 23],
	[19, 23],
	[19, 23],
	[19, 23],
	[19, 23],
	[19, 23],
	[19, 23],
	[20, 22],
]);

/** The brass hook the earpiece hangs on, the brass collar where the stem meets the foot, and the brass rim round the foot. */
const HOOK = box(15, 10, 19, 10);
const STEM_COLLAR = box(10, 19, 15, 20);
const FOOT_RIM = box(3, 26, 22, 26);
const FOOT_RIM_GLINT = box(5, 26, 8, 26);

/** The braided cloth cord, from the foot of the earpiece down to the telephone's foot, and where it catches the light. */
const CORD = mix(C.timberShade, C.wood, 0.4);
const CORD_LIGHT = C.timber;
/** @type {readonly Point[]} */
const CORD_RUN = [
	[21, 20],
	[22, 22],
	[25, 23],
	[26, 24],
	[24, 26],
];
/** @type {readonly Point[]} */
const CORD_GLINTS = [
	[22, 22],
	[25, 23],
	[25, 25],
];

/**
 * Space 4, Telephone.
 * @param {Canvas} canvas
 */
function drawTelephone(canvas) {
	fillShape(canvas, union(FOOT, STEM, NECK, HORN), ENAMEL, 2);
	fillFlat(canvas, MOUTH, C.ink);
	fillShape(canvas, MOUTH_RIM, BRASS);
	fillShape(canvas, HOOK, BRASS);
	fillShape(canvas, STEM_COLLAR, BRASS);
	fillFlat(canvas, FOOT_RIM, BRASS.base);
	fillFlat(canvas, FOOT_RIM_GLINT, BRASS.light);
	fillShape(canvas, RECEIVER, ENAMEL, 2);
	path(canvas, CORD_RUN, CORD);
	dots(canvas, CORD_GLINTS, CORD_LIGHT);
	fillFlat(canvas, GLINTS, GLINT);
	outline(canvas, C.ink);
}

// Space 5, Email: a white envelope leaping out of a computer screen.

/** The monitor: its grey plastic case and stand, and its screen, lit brightest where the envelope bursts out. */
const CASE = box(2, 9, 21, 23);
const STAND = union(box(10, 24, 13, 25), box(6, 26, 17, 27));
const PLASTIC = {
	light: C.stone,
	base: C.stoneShade,
	shade: mix(C.stoneShade, C.night, 0.5),
};
const SCREEN = box(4, 11, 19, 21);
const SCREEN_INSIDE = box(5, 12, 18, 20);
const SCREEN_GLASS = {
	light: C.teal,
	base: C.tealShade,
	shade: mix(C.tealShade, C.night, 0.4),
};
const BURST = { x: 17, y: 14 };
const BURST_GLOW = [
	{ reach: 7, colour: C.teal },
	{ reach: 4, colour: C.tealLight },
];

/** The envelope, tilted as it leaps up and to the right: its four corners, and its flap folding to a point. */
const ENVELOPE = polygon([
	[11, 7],
	[25, 2],
	[28, 11],
	[14, 16],
]);
/** @type {readonly Point[]} */
const FLAP = [
	[12, 7],
	[19, 10],
	[24, 3],
];
const PAPER = { light: C.white, base: C.creamLight, shade: C.cream };
const FLAP_FOLD = C.creamShade;

/** The speed lines it leaves behind it on the violet. */
const SPEED = C.tealLight;
/** @type {readonly (readonly Point[])[]} */
const SPEED_LINES = [
	[
		[2, 3],
		[8, 1],
	],
	[
		[3, 7],
		[9, 5],
	],
];

/**
 * Space 5, Email.
 * @param {Canvas} canvas
 */
function drawEmail(canvas) {
	fillShape(canvas, CASE, PLASTIC);
	fillShape(canvas, SCREEN, SCREEN_GLASS);
	for (const { reach, colour } of BURST_GLOW) {
		const glow = ellipse(BURST.x, BURST.y, reach, reach);
		fillFlat(canvas, (x, y) => SCREEN_INSIDE(x, y) && glow(x, y), colour);
	}
	fillShape(canvas, STAND, PLASTIC);
	inFront(canvas, (layer) => {
		fillShape(layer, ENVELOPE, PAPER);
		path(layer, FLAP, FLAP_FOLD);
	});
	outline(canvas, C.ink);
	for (const speedLine of SPEED_LINES) {
		path(canvas, speedLine, SPEED);
	}
}

// Space 6, Neural Implants: a head in profile, a glowing teal chip at its temple wired into the brain.

/** The head, facing right, row by row from its crown. */
const HEAD = spans(2, [
	[8, 15],
	[6, 17],
	[5, 19],
	[4, 20],
	[3, 21],
	[3, 21],
	[2, 22],
	[2, 22],
	[2, 22],
	[2, 22],
	[2, 21],
	[2, 22],
	[2, 23],
	[2, 24],
	[2, 25],
	[3, 24],
	[3, 22],
	[4, 23],
	[5, 22],
	[6, 23],
	[7, 22],
	[8, 22],
	[9, 21],
	[9, 19],
	[9, 16],
	[9, 16],
	[8, 17],
	[7, 18],
]);
const SKIN = {
	light: mix(C.skinTan, C.skin, 0.6),
	base: C.skinTan,
	shade: C.skinTanShade,
};

/** The eye under its shaded brow, and the ear, a curl open to the front. */
const EYE = { x: 20, y: 12 };
const BROW = box(19, 11, 21, 11);
const EAR = ['.sss', 's...', 's.s.', 's...', '.ss.'];
const EAR_AT = { x: 9, y: 12 };

/** The chip at the temple, the glow round it, and the circuit traces it sends into the brain, each ending in a node. */
const CHIP = { x: 14, y: 8, size: 4 };
const CHIP_GLOW = mix(SKIN.light, C.tealLight, 0.55);
/** @type {readonly (readonly Point[])[]} */
const TRACES = [
	[
		[13, 9],
		[8, 9],
		[8, 6],
		[5, 6],
	],
	[
		[15, 7],
		[15, 4],
		[11, 4],
	],
	[
		[13, 11],
		[6, 11],
	],
	[
		[11, 9],
		[11, 7],
	],
	[
		[17, 7],
		[17, 5],
	],
];
const TRACE = C.tealLight;
const NODE = C.ghostLight;

/**
 * Paints the chip: a dark teal rim round a lit teal core, its glow already on the skin round it.
 * @param {Canvas} canvas
 */
function drawChip(canvas) {
	const { x, y, size } = CHIP;
	fillFlat(canvas, rounded(x - 1, y - 1, x + size, y + size), CHIP_GLOW);
	rect(canvas, x, y, size, size, C.tealShade);
	rect(canvas, x + 1, y + 1, size - 2, size - 2, C.teal);
	set(canvas, x + 1, y + 1, C.tealLight);
}

/**
 * Space 6, Neural Implants.
 * @param {Canvas} canvas
 */
function drawNeuralImplants(canvas) {
	fillShape(canvas, HEAD, SKIN, 2);
	fillFlat(canvas, BROW, SKIN.shade);
	set(canvas, EYE.x, EYE.y, C.ink);
	paint(canvas, EAR_AT.x, EAR_AT.y, EAR, { s: SKIN.shade });
	outline(canvas, C.ink);
	for (const trace of TRACES) {
		path(canvas, trace, TRACE);
		dots(canvas, trace.slice(-1), NODE);
	}
	drawChip(canvas);
}

/**
 * Draws the houses inspiration tile.
 * @returns {Canvas} A 192×32 canvas.
 */
export function draw() {
	return drawInspirationTile([
		drawSymbology,
		drawLanguage,
		drawWriting,
		drawTelephone,
		drawEmail,
		drawNeuralImplants,
	]);
}
