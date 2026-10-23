// Villa: a rustic table on the villa's terrace one golden afternoon, a carafe of red wine, a round loaf, a bunch of grapes and a dish of olives on a striped linen cloth dappled by the vine-hung pergola, beside a white column and a pot of geraniums, looking out over rolling hills and cypresses.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {{ x: number, y: number }} Point */
/** @typedef {{ x: number, y: number, rx: number, ry: number }} Oval */

/** The rows of the setting: the horizon, the parapet's coping, the table's far edge, its near edge and the stripes in the cloth's hem. */
const ROWS = {
	horizon: 31,
	coping: 33,
	table: 40,
	edge: 55,
	stripes: [58, 61],
};

/** The sun, low in the west on the right. */
const SUN = { x: 46, y: 16, r: 3.4 };

/** The white column on the left: its shaft's right edge and the top row of its capital. */
const COLUMN = { right: 7, capital: 4 };

/** The carafe: its centre column, the rows of its lip, the top of its belly, the wine's surface and its foot, and its belly. */
const CARAFE = { x: 16, lip: 21, shoulder: 29, wine: 31, foot: 51 };
const BELLY = { x: 16, y: 41.5, rx: 7.6, ry: 9.6 };

/** The round loaf, and the board under it. */
const LOAF = { x: 36.5, y: 43, rx: 9.4, ry: 6.4 };
const BOARD = { x: 36, y: 49, rx: 12, ry: 2.6 };

/** The bunch of grapes lying on the cloth: from its stalk to its tip, and how wide it is at the stalk. */
const BUNCH = {
	stalk: { x: 50, y: 40 },
	tip: { x: 59, y: 53 },
	width: 6.5,
	rows: 7,
};

/** The small bunch hanging from the pergola. */
const HANGING = {
	stalk: { x: 28, y: 4 },
	tip: { x: 29, y: 14 },
	width: 3.6,
	rows: 5,
};

/** The dish of olives at the front, below the loaf. */
const DISH = { x: 25, y: 54, rx: 8.5, ry: 2.8 };

/** The terracotta pot of geraniums on the parapet at the right. */
const POT = { left: 54, right: 62, top: 25 };

/** The patches of sun on the cloth, let through the gaps in the leaves, flattened by the table's slant. */
const SUN_PATCHES = [
	{ x: 4, y: 44, rx: 4, ry: 1.6 },
	{ x: 26, y: 41.5, rx: 6, ry: 1.4 },
	{ x: 47, y: 43, rx: 4, ry: 1.4 },
	{ x: 60, y: 41.5, rx: 4, ry: 1.2 },
	{ x: 43, y: 53, rx: 5, ry: 1.6 },
	{ x: 61, y: 54, rx: 3, ry: 1.2 },
	{ x: 14, y: 54, rx: 3.5, ry: 1.2 },
];

/** The vine leaves on the pergola: centre, size and how far each is turned. */
const CANOPY = [
	[2, 3, 4, 0.2],
	[8, 7, 3.6, -0.3],
	[13, 2, 3.4, 0.4],
	[3, 11, 3.2, 0.5],
	[19, 5, 3, -0.2],
	[24, 1, 3.2, 0.1],
	[35, 2, 3, -0.4],
	[41, 5, 2.6, 0.3],
	[52, 1, 3.4, 0],
	[58, 5, 3.8, -0.2],
	[63, 10, 3.6, 0.3],
	[56, 11, 2.8, 0.6],
];

/** The golden sky, from overhead down to the haze on the horizon. */
const SKY = [
	mix(C.daySky4, C.lampGlow, 0.25),
	mix(C.daySky5, C.lampGlow, 0.5),
	mix(C.daySky6, C.gold, 0.35),
	mix(C.lampGlow, C.gold, 0.45),
	mix(C.gold, C.amber, 0.25),
];

/** The hills: the far ridge in the haze, the golden middle fields with their furrows, and the near green slope with its rows of vines. */
const HILL_FAR = mix(C.roofLight, C.sand, 0.55);
const HILL_MID = mix(C.grassLight, C.gold, 0.45);
const HILL_MID_SHADE = mix(C.grass, C.amber, 0.4);
const HILL_NEAR = mix(C.grass, C.gold, 0.2);
const HILL_NEAR_SHADE = mix(C.grassShade, C.timber, 0.3);

/** The cypresses: dark green, deeper on the side away from the sun, lit along their sunny edge. */
const CYPRESS = C.pine;
const CYPRESS_SHADE = C.pineShade;
const CYPRESS_LIT = mix(C.pineLight, C.gold, 0.35);

/** The vine leaves, glowing where the sun shines through them. */
const VINE_GLOW = mix(C.grassLight, C.gold, 0.45);
const VINE = C.grass;
const VINE_SHADE = C.grassShade;

/** The red wine in the carafe: lit by the sun through the glass, plain and deep. */
const WINE_LIGHT = C.brickRed;
const WINE = C.brickRedShade;
const WINE_DEEP = mix(C.brickRedShade, C.ink, 0.45);

/** The carafe's glass above the wine, and its rim. The glass is painted in a stand-in colour, then replaced by whatever lies behind it, brightened. */
const GLASS = mix(C.gold, C.creamLight, 0.55);
const GLASS_TINT = C.white;
const GLASS_EDGE = mix(C.creamShade, C.amber, 0.3);

/** The loaf's crust: lit by the sun, plain, shaded and deep, and its crumb. */
const CRUST_LIGHT = mix(C.amber, C.gold, 0.35);
const CRUST = mix(C.amber, C.timberLight, 0.5);
const CRUST_SHADE = C.timberLight;
const CRUST_DEEP = C.timber;
const CRUMB = C.sandLight;

/** The grapes: lit, plain, shaded, and the dusty bloom on them. */
const GRAPE_LIGHT = mix(C.roofLight, C.arcane, 0.35);
const GRAPE = mix(C.roof, C.arcaneShade, 0.5);
const GRAPE_SHADE = mix(C.roofShade, C.brickRedShade, 0.3);
const GRAPE_BLOOM = mix(C.roofLight, C.stoneLight, 0.5);

/** The olives, green and black. */
const OLIVE_LIGHT = mix(C.grassLight, C.sand, 0.4);
const OLIVE = mix(C.grass, C.sand, 0.35);
const OLIVE_SHADE = mix(C.grassShade, C.timberShade, 0.45);
const OLIVE_BLACK = mix(C.roofShade, C.night, 0.4);

/** Terracotta, for the pot and the olive dish: lit, plain and shaded. */
const CLAY_LIGHT = mix(C.brickRedLight, C.amber, 0.5);
const CLAY = mix(C.brickRed, C.amber, 0.4);
const CLAY_SHADE = mix(C.brickRedShade, C.timber, 0.35);

/** The linen cloth: in the sun through the leaves, in the pergola's shade, in its folds and under the food's shadows. */
const LINEN_SUN = mix(C.creamLight, C.lampGlow, 0.75);
const LINEN = C.cream;
const LINEN_SHADE = mix(C.cream, C.creamShade, 0.5);
const LINEN_FOLD = C.creamShade;
const LINEN_SHADOW = mix(C.creamShade, C.roofLight, 0.3);
const WINE_CAST = mix(C.cream, C.brickRedLight, 0.4);

/** The colours the sun's haze leaves alone: the sun itself, and the cypresses, which stand dark against it. */
const KEEP = [C.white, C.lampGlow, CYPRESS, CYPRESS_SHADE, CYPRESS_LIT];

/**
 * Draws the Villa landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const back = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8823);

	drawSky(layer);
	drawSun(layer);
	drawHills(layer, random);
	drawCypresses(layer);
	// The haze round the low sun lies over the view only; the terrace is in the pergola's shade.
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 22,
		colour: C.lampGlow,
		strength: 0.45,
		steps: 2,
		skip: KEEP,
	});

	// The column, the parapet, its pot and the pergola frame the view; they are outlined apart from the table so the spread stands clear.
	drawParapet(back);
	drawPot(back, random);
	drawColumn(back);
	drawPergola(back);
	outline(back, C.ink);
	underlay(back, layer);

	drawCloth(scene);
	drawCarafe(scene);
	drawBoard(scene);
	drawLoaf(scene, random);
	drawVineLeaf(scene, { x: 56, y: 43 }, 4.6, -0.9);
	drawBunch(scene, BUNCH);
	drawDish(scene);
	outline(scene, C.ink);
	underlay(scene, back);

	seeThrough(scene, back);
	drawGleams(scene);
	return scene;
}

/**
 * How far a pixel lies from the middle of an oval, as a share of it: below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @param {Oval} o
 * @returns {number}
 */
function oval(x, y, o) {
	return Math.hypot((x + 0.5 - o.x) / o.rx, (y + 0.5 - o.y) / o.ry);
}

/**
 * The golden afternoon sky, dithered between its bands.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.horizon; y++) {
		const t = (y / ROWS.horizon) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * The low sun, a white disc with a pale rim.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	const { x: cx, y: cy, r } = SUN;
	for (let y = Math.floor(cy - r); y <= cy + r; y++) {
		for (let x = Math.floor(cx - r); x <= cx + r; x++) {
			const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
			if (d < r) {
				set(layer, x, y, d < r - 1.2 ? C.white : C.lampGlow);
			}
		}
	}
}

/**
 * The rolling hills: a hazy far ridge, golden fields in the middle with furrows along them, and a near green slope with rows of vines.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHills(layer, random) {
	for (let x = 0; x < 64; x++) {
		const far = Math.round(23 + 2.5 * Math.sin(x / 7 + 0.5));
		const mid = Math.round(27 + 2.5 * Math.sin(x / 9 + 2.2));
		const near = Math.round(31 + 1.5 * Math.sin(x / 8 + 4));
		for (let y = far; y < 64; y++) {
			let colour = HILL_FAR;
			if (y >= near) {
				colour =
					(x + (y - near) * 2) % 5 === 0
						? HILL_NEAR_SHADE
						: HILL_NEAR;
			} else if (y >= mid) {
				colour = (y - mid) % 3 === 2 ? HILL_MID_SHADE : HILL_MID;
			}
			set(layer, x, y, colour);
		}
	}
	// Olive trees dotted on the golden fields.
	for (let i = 0; i < 6; i++) {
		const x = 10 + Math.floor(random() * 30);
		const y = Math.round(27 + 2.5 * Math.sin(x / 9 + 2.2)) + 1;
		rect(layer, x, y, 2, 1, HILL_NEAR_SHADE);
		set(layer, x, y - 1, HILL_MID_SHADE);
	}
}

/**
 * One cypress: a tall, narrow flame of dark green, lit along its right edge by the low sun.
 * @param {Canvas} layer
 * @param {number} cx - Its centre column
 * @param {number} base - The row it stands on
 * @param {number} height
 * @param {number} half - Half its widest width
 */
function drawCypress(layer, cx, base, height, half) {
	const top = base - height;
	for (let y = top; y <= base; y++) {
		const t = (y - top) / height;
		const w =
			t < 0.6
				? half * Math.sin((t / 0.6) * Math.PI * 0.5)
				: half * (1 - ((t - 0.6) / 0.4) * 0.35);
		for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) {
			let colour = CYPRESS;
			if (x < cx - w * 0.3) {
				colour = CYPRESS_SHADE;
			} else if (x >= Math.round(cx + w) && w > 0.8) {
				colour = CYPRESS_LIT;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The cypresses: a line of small ones along a far lane, and two tall ones on the near slope.
 * @param {Canvas} layer
 */
function drawCypresses(layer) {
	for (const [x, base] of [
		[21, 27],
		[25, 27],
		[29, 26],
		[33, 26],
	]) {
		drawCypress(layer, x, base, 7, 1);
	}
	drawCypress(layer, 40, 33, 18, 2.5);
	drawCypress(layer, 45.5, 33, 13, 2);
}

/**
 * The low white parapet round the terrace, behind the table.
 * @param {Canvas} back
 */
function drawParapet(back) {
	rect(back, 0, ROWS.coping, 64, 1, C.white);
	rect(back, 0, ROWS.coping + 1, 64, 1, C.creamShade);
	for (let y = ROWS.coping + 2; y < ROWS.table; y++) {
		rect(back, 0, y, 64, 1, y % 2 ? LINEN : C.creamLight);
	}
}

/**
 * The terracotta pot of red geraniums standing on the parapet.
 * @param {Canvas} back
 * @param {() => number} random
 */
function drawPot(back, random) {
	const { left, right, top } = POT;
	const mid = (left + right) / 2 + 0.5;
	for (let y = top - 10; y < top; y++) {
		for (let x = left - 2; x <= right + 2; x++) {
			if (oval(x, y, { x: mid, y: top - 2, rx: 6.4, ry: 6.5 }) < 1) {
				let colour = VINE;
				if (x > mid + 2) {
					colour = VINE_GLOW;
				} else if (x < mid - 2) {
					colour = VINE_SHADE;
				}
				set(back, x, y, colour);
			}
		}
	}
	for (const [cx, cy] of [
		[55.5, top - 7],
		[60, top - 7.5],
		[58, top - 3.5],
		[53.5, top - 2.5],
	]) {
		for (let y = Math.floor(cy - 2); y <= cy + 2; y++) {
			for (let x = Math.floor(cx - 2); x <= cx + 2; x++) {
				if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) < 2) {
					let colour = random() < 0.3 ? C.brickRedShade : C.brickRed;
					if (x + 0.5 > cx && y + 0.5 < cy) {
						colour = C.brickRedLight;
					}
					set(back, x, y, colour);
				}
			}
		}
	}
	// The pot: a rolled rim and a tapering body, lit on the right by the sun.
	rect(back, left - 1, top, right - left + 3, 2, CLAY);
	rect(back, right, top, 2, 1, CLAY_LIGHT);
	rect(back, left - 1, top + 1, right - left + 3, 1, CLAY_SHADE);
	for (let y = top + 2; y < ROWS.coping; y++) {
		const inset = Math.floor((y - top - 2) / 3);
		for (let x = left + inset; x <= right - inset; x++) {
			let colour = CLAY;
			if (x >= right - inset - 1) {
				colour = CLAY_LIGHT;
			} else if (x <= left + inset + 1) {
				colour = CLAY_SHADE;
			}
			set(back, x, y, colour);
		}
	}
}

/**
 * The white column on the left, holding up the pergola: a plain capital and a fluted shaft, lit on its right by the sun, with a shoot of the vine trailing over it.
 * @param {Canvas} back
 */
function drawColumn(back) {
	const { right, capital } = COLUMN;
	rect(back, 0, capital, right + 3, 2, C.white);
	rect(back, 0, capital + 2, right + 2, 1, C.cream);
	rect(back, 0, capital + 3, right + 1, 1, C.creamShade);
	for (let y = capital + 4; y < ROWS.table; y++) {
		for (let x = 0; x <= right; x++) {
			let colour = C.cream;
			if (x >= right - 1) {
				colour = C.white;
			} else if (x === right - 2) {
				colour = C.creamLight;
			} else if (x < 2 || x % 3 === 0) {
				colour = C.creamShade;
			}
			set(back, x, y, colour);
		}
	}
	// A shoot of the vine trailing down from the pergola over the capital, with a leaf at its end.
	for (let y = capital + 2; y < 15; y++) {
		set(back, Math.round(6 + 1.5 * Math.sin(y / 2)), y, C.timber);
	}
	drawVineLeaf(back, { x: 7, y: 17 }, 2.8, 0.6);
}

/**
 * One vine leaf: a rounded leaf with three broad lobes, glowing where the sun shines through it, with veins from its stalk.
 * @param {Canvas} canvas
 * @param {Point} centre
 * @param {number} r - Its radius
 * @param {number} turn - How far it is turned, in radians
 */
function drawVineLeaf(canvas, centre, r, turn) {
	for (let y = Math.floor(centre.y - r - 1); y <= centre.y + r + 1; y++) {
		for (let x = Math.floor(centre.x - r - 1); x <= centre.x + r + 1; x++) {
			const dx = x + 0.5 - centre.x;
			const dy = y + 0.5 - centre.y;
			const angle = Math.atan2(dy, dx) - turn;
			// Three lobes, pointing down and out to either side.
			const lobes =
				r * (0.8 + 0.22 * Math.cos(3 * (angle - Math.PI / 2)));
			const d = Math.hypot(dx, dy);
			if (d > lobes) {
				continue;
			}
			// The leaf's own frame, so its veins turn with it.
			const ax = dx * Math.cos(turn) + dy * Math.sin(turn);
			const ay = -dx * Math.sin(turn) + dy * Math.cos(turn);
			let colour = VINE;
			if (ax > r * 0.1 && ay < r * 0.3) {
				colour = VINE_GLOW;
			} else if (ax < -r * 0.3 || ay > r * 0.5) {
				colour = VINE_SHADE;
			}
			const vein =
				(Math.abs(ax) < 0.5 && ay > -r * 0.5) ||
				(Math.abs(Math.abs(ax) - (ay + r * 0.5) * 0.8) < 0.45 &&
					ay > -r * 0.4 &&
					ay < r * 0.4);
			if (vein && d < lobes - 0.8) {
				colour = VINE_SHADE;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The pergola overhead: a timber beam across the top under a canopy of vine leaves, with a small bunch of grapes hanging down.
 * @param {Canvas} back
 */
function drawPergola(back) {
	rect(back, 0, 0, 64, 3, C.timber);
	rect(back, 0, 3, 64, 1, C.timberShade);
	rect(back, 0, 0, 64, 1, C.timberLight);
	// The rafters' ends running back over the terrace.
	for (const x of [18, 38, 48]) {
		rect(back, x, 4, 3, 2, C.timberShade);
		rect(back, x, 4, 1, 2, C.timber);
	}
	for (const [x, y, r, turn] of CANOPY) {
		drawVineLeaf(back, { x, y }, r, turn);
	}
	// A tendril curling down from the beam.
	line(back, 33, 4, 33, 8, VINE_SHADE);
	set(back, 34, 9, VINE_SHADE);
	set(back, 34, 10, VINE_SHADE);
	set(back, 33, 11, VINE_SHADE);
	drawBunch(back, HANGING);
}

/**
 * A bunch of grapes: round grapes heaped from the stalk to the tip, narrowing as they go, each lit on the side towards the sun with a dusty bloom.
 * @param {Canvas} canvas
 * @param {{ stalk: Point, tip: Point, width: number, rows: number }} bunch
 */
function drawBunch(canvas, { stalk, tip, width, rows }) {
	const dx = tip.x - stalk.x;
	const dy = tip.y - stalk.y;
	const length = Math.hypot(dx, dy);
	/** @type {Point[]} */
	const grapes = [];
	for (let row = 0; row < rows; row++) {
		const t = (row + 0.6) / rows;
		const half = width * (1 - t * 0.7);
		const count = Math.max(1, Math.round(half / 1.5));
		for (let i = 0; i < count; i++) {
			const side =
				count === 1 ? 0 : -half * 0.8 + (1.6 * half * i) / (count - 1);
			grapes.push({
				x: stalk.x + dx * t - (dy / length) * side,
				y: stalk.y + dy * t + (dx / length) * side,
			});
		}
	}
	line(
		canvas,
		Math.round(stalk.x),
		Math.round(stalk.y),
		Math.round(stalk.x - (dx / length) * 3),
		Math.round(stalk.y - (dy / length) * 3),
		C.timber
	);
	// Heaped from the back: those higher in the frame first, so the lower ones sit in front.
	grapes.sort((a, b) => a.y - b.y);
	for (const g of grapes) {
		for (let y = Math.floor(g.y - 2); y <= g.y + 2; y++) {
			for (let x = Math.floor(g.x - 2); x <= g.x + 2; x++) {
				const d = Math.hypot(x + 0.5 - g.x, y + 0.5 - g.y);
				if (d >= 1.9) {
					continue;
				}
				let colour = GRAPE;
				if (x + 0.5 > g.x && y + 0.5 < g.y) {
					colour = GRAPE_LIGHT;
				} else if (d > 1.1 && (x + 0.5 < g.x || y + 0.5 > g.y)) {
					colour = GRAPE_SHADE;
				}
				set(canvas, x, y, colour);
			}
		}
		set(canvas, Math.round(g.x), Math.round(g.y - 1), GRAPE_BLOOM);
	}
}

/**
 * Tells whether the sun, through the gaps in the pergola's leaves, falls on a point of the cloth.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function dappled(x, y) {
	return SUN_PATCHES.some((o) => oval(x, y, o) < 1);
}

/**
 * The linen cloth over the table: its top dappled with sun through the pergola, the food's shadows thrown towards us,
 * and its hem hanging down at the front with folds and two terracotta stripes.
 * @param {Canvas} scene
 */
function drawCloth(scene) {
	for (let y = ROWS.table; y < ROWS.edge; y++) {
		for (let x = 0; x < 64; x++) {
			set(scene, x, y, dappled(x, y) ? LINEN_SUN : LINEN_SHADE);
		}
	}
	rect(scene, 0, ROWS.table, 64, 1, LINEN_FOLD);
	// Shadows thrown down and to the left, away from the sun.
	for (const o of [
		{ x: 10, y: 52, rx: 8, ry: 2.4 },
		{ x: 33, y: 51.5, rx: 10, ry: 2.2 },
		{ x: 20, y: 56, rx: 7, ry: 1 },
		{ x: 51, y: 53, rx: 7, ry: 2 },
	]) {
		for (let y = ROWS.table; y < ROWS.edge; y++) {
			for (let x = 0; x < 64; x++) {
				if (oval(x, y, o) < 1) {
					set(scene, x, y, LINEN_SHADOW);
				}
			}
		}
	}
	// The wine's red light, thrown through the carafe onto the cloth.
	for (let y = 50; y < 55; y++) {
		for (let x = 3; x < 13; x++) {
			if (oval(x, y, { x: 7.5, y: 52.5, rx: 4, ry: 1.5 }) < 1) {
				set(scene, x, y, WINE_CAST);
			}
		}
	}
	// The hem: a lit edge, soft folds, and the woven stripes.
	rect(scene, 0, ROWS.edge, 64, 1, LINEN_SUN);
	for (let y = ROWS.edge + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = LINEN;
			if (x % 12 === 5 || x % 12 === 6) {
				colour = LINEN_FOLD;
			} else if (x % 12 === 7) {
				colour = LINEN_SUN;
			}
			if (ROWS.stripes.includes(y)) {
				colour = CLAY;
			} else if (ROWS.stripes.includes(y - 1)) {
				colour = CLAY_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The carafe of red wine: a round-bellied glass jug with a short neck and a flared lip, filled nearly to the neck,
 * the wine glowing where the sun shines through it.
 * @param {Canvas} scene
 */
function drawCarafe(scene) {
	const { x: cx, lip, shoulder, wine, foot } = CARAFE;
	for (let y = lip; y <= foot; y++) {
		for (let x = cx - 9; x <= cx + 9; x++) {
			const across = Math.abs(x + 0.5 - cx);
			// The neck flares a little towards the lip, then widens into the belly.
			const neckHalf =
				2.4 +
				Math.max(0, lip + 3 - y) * 0.5 +
				Math.max(0, y - shoulder) * 1.2;
			const inBelly = oval(x, y, BELLY) < 1;
			if (!inBelly && !(y <= shoulder + 3 && across < neckHalf)) {
				continue;
			}
			let colour = GLASS;
			if (y >= wine) {
				const u = (x + 0.5 - BELLY.x) / BELLY.rx;
				const v = (y + 0.5 - BELLY.y) / BELLY.ry;
				const d = Math.hypot(u, v);
				colour = WINE;
				// The sun shines through from the right, so the left of the belly glows and the rim stays deep.
				if (d > 0.84 || (y < shoulder + 3 && across > neckHalf - 1)) {
					colour = WINE_DEEP;
				} else if (u < 0.15 && u > -0.75 && v > -0.3 && v < 0.65) {
					colour = WINE_LIGHT;
				}
			} else if (across > neckHalf - 1) {
				colour = GLASS_EDGE;
			}
			set(scene, x, y, colour);
		}
	}
	// The flared lip with its pinched spout, and the wine's bright surface.
	rect(scene, cx - 4, lip - 1, 8, 1, GLASS_EDGE);
	set(scene, cx - 5, lip - 2, GLASS_EDGE);
	set(scene, cx - 4, lip - 2, GLASS);
	rect(scene, cx - 3, wine, 7, 1, C.brickRedLight);
	// The foot ring.
	rect(scene, cx - 5, foot, 11, 1, GLASS_EDGE);
}

/**
 * The bread board under the loaf: an oval of olive wood with its grain and its edge.
 * @param {Canvas} scene
 */
function drawBoard(scene) {
	for (
		let y = Math.floor(BOARD.y - BOARD.ry);
		y <= BOARD.y + BOARD.ry + 1;
		y++
	) {
		for (
			let x = Math.floor(BOARD.x - BOARD.rx);
			x <= BOARD.x + BOARD.rx;
			x++
		) {
			if (oval(x, y, BOARD) < 1) {
				set(
					scene,
					x,
					y,
					(x * 2 + y * 5) % 9 === 0 ? C.timber : C.timberLight
				);
			} else if (oval(x, y - 1, BOARD) < 1) {
				set(scene, x, y, C.timberShade);
			}
		}
	}
}

/**
 * The round loaf: a domed crust, lit gold on the right, with floured slashes across its top and its cut end showing the crumb.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLoaf(scene, random) {
	for (let y = Math.floor(LOAF.y - LOAF.ry); y <= LOAF.y + LOAF.ry; y++) {
		for (let x = Math.floor(LOAF.x - LOAF.rx); x <= LOAF.x + LOAF.rx; x++) {
			// A dome: round on top, flatter where it sits on the board.
			const flat = y + 0.5 > LOAF.y + LOAF.ry * 0.4;
			const d = oval(x, y, {
				...LOAF,
				ry: flat ? LOAF.ry * 0.62 : LOAF.ry,
			});
			if (d >= 1) {
				continue;
			}
			const u = (x + 0.5 - LOAF.x) / LOAF.rx;
			const v = (y + 0.5 - LOAF.y) / LOAF.ry;
			const facing = u * 0.75 - v * 0.55;
			let colour = CRUST;
			if (facing > 0.42) {
				colour = CRUST_LIGHT;
			} else if (facing < -0.5 || (flat && u < 0.3)) {
				colour = CRUST_DEEP;
			} else if (facing < -0.08) {
				colour = CRUST_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// Three slashes across the top, opened in the oven and floured.
	for (const sx of [32, 36, 40]) {
		for (let k = 0; k < 4; k++) {
			const x = sx + Math.floor(k / 2);
			const y = Math.round(LOAF.y - 5 + k);
			set(scene, x, y, CRUMB);
			set(scene, x + 1, y, CRUST_LIGHT);
		}
	}
	for (let i = 0; i < 7; i++) {
		const x = Math.round(LOAF.x - 6 + random() * 12);
		const y = Math.round(LOAF.y - 6 + random() * 3);
		if (get(scene, x, y)) {
			set(scene, x, y, C.creamLight);
		}
	}
	// The cut end on the left: soft crumb inside a rim of crust, with holes.
	const face = { x: 28.6, y: 43.6, rx: 2.6, ry: 5 };
	for (let y = 38; y < 50; y++) {
		for (let x = 25; x < 32; x++) {
			const d = oval(x, y, face);
			if (d < 1) {
				let colour = d > 0.76 ? CRUST_DEEP : CRUMB;
				if (d <= 0.76 && (x * 3 + y * 5) % 7 === 0) {
					colour = C.sand;
				}
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * The dish of olives at the front: a shallow terracotta dish heaped with green and black olives, each with a gleam.
 * @param {Canvas} scene
 */
function drawDish(scene) {
	const olives = [
		[19.5, 51, false],
		[23.5, 51.5, true],
		[27.5, 51, false],
		[31, 51.5, true],
		[21.5, 48.5, true],
		[25.5, 48.5, false],
		[29.5, 49, false],
	];
	// The back olives first, so the front ones overlap them.
	olives.sort((a, b) => Number(a[1]) - Number(b[1]));
	for (const [ox, oy, black] of olives) {
		const o = { x: Number(ox), y: Number(oy), rx: 2.3, ry: 1.7 };
		for (let y = Math.floor(o.y - 2); y <= o.y + 2; y++) {
			for (let x = Math.floor(o.x - 2); x <= o.x + 2; x++) {
				const d = oval(x, y, o);
				if (d >= 1) {
					continue;
				}
				let colour = black ? OLIVE_BLACK : OLIVE;
				if (x + 0.5 > o.x && y + 0.5 < o.y && d < 0.8) {
					colour = black ? C.roof : OLIVE_LIGHT;
				} else if (d > 0.72 && (y + 0.5 > o.y || x + 0.5 < o.x)) {
					// A dark rim on the side away from the sun parts each olive from the ones behind.
					colour = black ? C.night : OLIVE_SHADE;
				}
				set(scene, x, y, colour);
			}
		}
		set(
			scene,
			Math.round(o.x + 0.5),
			Math.round(o.y - 1),
			black ? C.roofLight : C.lampGlow
		);
	}
	// The dish: a shallow bowl under the olives, its near rim lit on the right.
	for (let y = Math.floor(DISH.y - 2); y <= DISH.y + DISH.ry; y++) {
		for (let x = Math.floor(DISH.x - DISH.rx); x <= DISH.x + DISH.rx; x++) {
			const d = oval(x, y, DISH);
			if (d >= 1 || y + 0.5 < DISH.y - 1.5) {
				continue;
			}
			// Its rim, lit towards the sun, then its rounded side, darker underneath.
			let colour = CLAY;
			if (y + 0.5 < DISH.y - 0.5) {
				colour = x > DISH.x - 2 ? CLAY_LIGHT : CLAY;
			} else if (y + 0.5 > DISH.y + 1 || x < DISH.x - 4) {
				colour = CLAY_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Lets the view show through the carafe's empty glass: each stand-in pixel takes the colour behind it, brightened by the glass.
 * @param {Canvas} scene
 * @param {Canvas} back - Everything behind the table, already merged
 */
function seeThrough(scene, back) {
	for (let i = 0; i < scene.p.length; i++) {
		const behind = back.p[i];
		if (scene.p[i] === GLASS && behind) {
			scene.p[i] = mix(behind, GLASS_TINT, 0.35);
		}
	}
}

/**
 * The sun's gleams on the carafe's glass, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	const { x: cx, shoulder } = CARAFE;
	for (let y = shoulder + 5; y < shoulder + 14; y++) {
		set(scene, cx + 5, y, C.white);
	}
	set(scene, cx + 4, shoulder + 3, C.white);
	set(scene, cx + 2, shoulder - 5, C.white);
	set(scene, cx + 2, shoulder - 4, C.white);
}
