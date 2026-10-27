// Oil Paint: an artist's wooden palette dabbed with blobs of colour, two squeezed tubes and a loaded brush, on a sunlit table by day.
import {
	createCanvas,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The palette: an oval centred at `x`, `y` with half-widths `rx` and `ry`, tilted by `tilt` radians,
 * with a bite out of its lower left (`notch`) and a thumb hole beside it (`hole`), both in the oval's own frame.
 */
const PALETTE_SHAPE = {
	x: 32,
	y: 27,
	rx: 29,
	ry: 19,
	tilt: -0.12,
	notch: { u: -24, v: 11, r: 8 },
	hole: { u: -12, v: 2, r: 3 },
};

/** How thick the palette board looks, in rows. */
const THICKNESS = 2;

/** The table: dark boards, their seams, and the window's sunlight falling across them. */
const TABLE = C.floor;
const TABLE_SEAM = C.floorShade;
const SUN = mix(C.floor, C.sandLight, 0.28);
const SUN_SEAM = mix(C.floorShade, C.sandLight, 0.22);
const TABLE_SHADOW = mix(C.floorShade, C.ink, 0.35);

/** The palette's honey wood: lit edge, face, grain and shaded edge. */
const WOOD_LIGHT = mix(C.sandLight, C.timberLight, 0.35);
const WOOD = mix(C.sand, C.timberLight, 0.45);
const WOOD_GRAIN = mix(C.sandShade, C.timberLight, 0.5);
const WOOD_SHADE = C.timber;

/** Each colour of paint: lit, plain and shaded. */
const PAINTS = {
	white: [C.white, C.creamLight, C.creamShade],
	yellow: [C.lampGlow, C.gold, C.amber],
	red: [C.brickRedLight, C.brickRed, C.brickRedShade],
	violet: [C.arcaneLight, C.arcane, C.arcaneShade],
	blue: [C.daySky4, C.daySky1, C.nightSea2],
	green: [C.grassLight, C.grass, C.grassShade],
};

/** The blobs round the palette's top: where each sits and its colour. */
const BLOBS = [
	{ x: 10, y: 20, paint: PAINTS.white },
	{ x: 17, y: 13, paint: PAINTS.yellow },
	{ x: 26, y: 9, paint: PAINTS.red },
	{ x: 35, y: 8, paint: PAINTS.violet },
	{ x: 44, y: 10, paint: PAINTS.blue },
	{ x: 51, y: 16, paint: PAINTS.green },
];

/** A blob of paint squeezed into a little peak: lit on its upper left, shaded underneath. */
const BLOB = ['..ll...', '.lppp..', 'lppppps', 'pppppss', '.sssss.'];

/**
 * Draws the Oil Paint tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3361);

	drawTable(layer);
	drawShadow(layer);

	drawBoard(scene, random);
	drawSmears(scene);
	const blobs = createCanvas(64, 64);
	for (const blob of BLOBS) {
		const [lit, plain, shaded] = blob.paint;
		paint(blobs, blob.x, blob.y, BLOB, { l: lit, p: plain, s: shaded });
	}
	outline(blobs, C.ink);
	stamp(scene, blobs);
	const tubes = createCanvas(64, 64);
	drawTube(tubes, 4, 50, PAINTS.red, true);
	drawTube(tubes, 13, 57, PAINTS.blue, false);
	outline(tubes, C.ink);
	stamp(scene, tubes);
	const brush = createCanvas(64, 64);
	drawBrush(brush);
	outline(brush, C.ink);
	stamp(scene, brush);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawGleams(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * The table: dark boards, with two panes of window light slanting across them from the upper left.
 * @param {Canvas} layer
 */
function drawTable(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const seam = y % 9 === 8;
			const slant = x + y * 0.7;
			const sunlit =
				(slant > 6 && slant < 28) || (slant > 32 && slant < 52);
			if (sunlit) {
				set(layer, x, y, seam ? SUN_SEAM : SUN);
			} else {
				set(layer, x, y, seam ? TABLE_SEAM : TABLE);
			}
		}
	}
}

/**
 * Whether a pixel lies on the palette board, shifted down by some rows.
 * @param {number} x
 * @param {number} y
 * @param {number} [drop] - How many rows lower to test, for the board's edge and its shadow
 * @returns {boolean}
 */
function onBoard(x, y, drop = 0) {
	const { tilt, notch, hole } = PALETTE_SHAPE;
	const dx = x + 0.5 - PALETTE_SHAPE.x;
	const dy = y + 0.5 - PALETTE_SHAPE.y - drop;
	const u = dx * Math.cos(tilt) + dy * Math.sin(tilt);
	const v = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
	if (Math.hypot(u / PALETTE_SHAPE.rx, v / PALETTE_SHAPE.ry) > 1) {
		return false;
	}
	if (Math.hypot(u - notch.u, v - notch.v) < notch.r) {
		return false;
	}
	return Math.hypot(u - hole.u, v - hole.v) >= hole.r;
}

/**
 * The palette's shadow on the table, thrown down and to the right.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (onBoard(x - 3, y, THICKNESS + 2) && !onBoard(x, y, THICKNESS)) {
				set(layer, x, y, TABLE_SHADOW);
			}
		}
	}
}

/**
 * The palette board: its thickness showing below, a lit edge on the upper left, a shaded edge on the lower right, and a little grain.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBoard(scene, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (onBoard(x, y)) {
				let colour = WOOD;
				if (!onBoard(x - 1, y - 1)) {
					colour = WOOD_LIGHT;
				} else if (!onBoard(x + 1, y + 1)) {
					colour = WOOD_SHADE;
				}
				set(scene, x, y, colour);
			} else if (onBoard(x, y, THICKNESS)) {
				set(scene, x, y, WOOD_SHADE);
			}
		}
	}
	// Grain: a few long streaks along the board.
	for (let i = 0; i < 9; i++) {
		const x = 10 + Math.floor(random() * 40);
		const y = 14 + Math.floor(random() * 26);
		const length = 5 + Math.floor(random() * 8);
		for (let k = 0; k < length; k++) {
			const gx = x + k;
			const gy = y - Math.round(k * 0.12);
			if (onBoard(gx - 1, gy - 1) && onBoard(gx + 1, gy + 1)) {
				set(scene, gx, gy, WOOD_GRAIN);
			}
		}
	}
}

/**
 * Two smudges where colours have been mixed on the board: a pale sky blue and an orange.
 * @param {Canvas} scene
 */
function drawSmears(scene) {
	drawSmudge(scene, { x: 25, y: 26, rx: 6.5, ry: 3.2 }, [
		mix(C.daySky1, C.white, 0.7),
		mix(C.daySky1, C.white, 0.4),
	]);
	drawSmudge(scene, { x: 41, y: 27, rx: 5.5, ry: 2.8 }, [
		mix(C.brickRed, C.gold, 0.8),
		mix(C.brickRed, C.gold, 0.5),
	]);
}

/**
 * One smudge of mixed paint: a flat oval, its upper left catching the light.
 * @param {Canvas} scene
 * @param {{ x: number, y: number, rx: number, ry: number }} oval
 * @param {[Colour, Colour]} tones - Lit and plain
 */
function drawSmudge(scene, { x: cx, y: cy, rx, ry }, [lit, plain]) {
	for (let y = Math.floor(cy - ry); y <= cy + ry; y++) {
		for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
			const dx = (x - cx) / rx;
			const dy = (y - cy) / ry;
			if (Math.hypot(dx, dy) <= 1) {
				set(scene, x, y, dx + dy * 1.5 < -0.6 ? lit : plain);
			}
		}
	}
}

/**
 * One squeezed tube of paint lying on the table: a crimped tail, a dented silver body with a band of its colour, and a cap.
 * The red one has a worm of paint curling from its open nozzle.
 * @param {Canvas} canvas
 * @param {number} x - Left column of the crimped tail
 * @param {number} y - Top row
 * @param {string[]} colours - The paint's lit, plain and shaded tones
 * @param {boolean} open - Whether its cap is off and paint is coming out
 */
function drawTube(canvas, x, y, [lit, plain, shaded], open) {
	// The crimped tail, flat and wider than the body, with its folds.
	rect(canvas, x, y - 1, 3, 7, C.stone);
	rect(canvas, x, y - 1, 3, 1, C.stoneLight);
	set(canvas, x + 1, y + 1, C.stoneShade);
	set(canvas, x + 1, y + 3, C.stoneShade);
	// The body: silver, lit along its top, with a dent where it was squeezed.
	rect(canvas, x + 3, y, 14, 5, C.stoneLight);
	rect(canvas, x + 3, y, 14, 1, C.white);
	rect(canvas, x + 3, y + 3, 14, 2, C.stone);
	rect(canvas, x + 7, y + 1, 2, 2, C.stone);
	set(canvas, x + 8, y + 3, C.stoneShade);
	// A band of the paint's own colour, in place of a label.
	rect(canvas, x + 11, y, 4, 5, plain);
	rect(canvas, x + 11, y, 4, 1, lit);
	rect(canvas, x + 11, y + 4, 4, 1, shaded);
	// The shoulder and nozzle.
	rect(canvas, x + 17, y + 1, 1, 3, C.stone);
	if (open) {
		rect(canvas, x + 18, y + 2, 2, 1, C.stoneShade);
		// The worm of paint, curling out onto the table.
		rect(canvas, x + 20, y + 1, 3, 3, plain);
		set(canvas, x + 20, y + 1, lit);
		set(canvas, x + 21, y + 1, lit);
		rect(canvas, x + 21, y + 4, 4, 2, plain);
		set(canvas, x + 22, y + 3, plain);
		rect(canvas, x + 21, y + 5, 4, 1, shaded);
	} else {
		rect(canvas, x + 18, y + 1, 3, 3, shaded);
		set(canvas, x + 18, y + 1, plain);
	}
}

/**
 * The brush lying across the palette: a long red-lacquered handle, a silver ferrule and a tip loaded with blue.
 * @param {Canvas} brush
 */
function drawBrush(brush) {
	const tail = { x: 64, y: 58 };
	const neck = { x: 37, y: 40 };
	line(brush, tail.x, tail.y - 1, neck.x, neck.y - 1, C.brickRedLight);
	line(brush, tail.x, tail.y, neck.x, neck.y, C.brickRed);
	line(brush, tail.x, tail.y + 1, neck.x, neck.y + 1, C.brickRedShade);
	// The ferrule.
	line(brush, neck.x, neck.y - 1, neck.x - 4, neck.y - 4, C.white);
	line(brush, neck.x, neck.y, neck.x - 4, neck.y - 3, C.stoneLight);
	line(brush, neck.x, neck.y + 1, neck.x - 4, neck.y - 2, C.stone);
	// The bristles, loaded with blue, coming to a point.
	const blue = PAINTS.blue;
	line(brush, neck.x - 5, neck.y - 4, neck.x - 9, neck.y - 7, blue[0]);
	line(brush, neck.x - 5, neck.y - 3, neck.x - 10, neck.y - 6, blue[1]);
	line(brush, neck.x - 5, neck.y - 2, neck.x - 9, neck.y - 5, blue[2]);
	set(brush, neck.x - 11, neck.y - 7, blue[1]);
}

/**
 * Wet gleams of daylight on the blobs and the brush, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const blob of BLOBS) {
		set(scene, blob.x + 2, blob.y + 1, C.white);
	}
	set(scene, 29, 35, C.white);
	set(scene, 52, 47, C.white);
}
