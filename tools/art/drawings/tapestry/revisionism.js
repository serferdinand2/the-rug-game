// Revisionism: a mason on a scaffold chiselling a new marble face on a monument, the old bronze statue's head toppled in front.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The square's kerb row, the bust's head centre, and the scaffold's platform row. */
const PLAZA = 49;
const HEAD = { x: 44, y: 18 };
const PLATFORM = 30;

/** Old dark bronze: lit, main and shaded, a streak of green weathering, and the eyes. */
const BRONZE = {
	l: C.brass,
	m: C.lampFrame,
	d: C.timberShade,
	v: mix(C.pine, C.stoneLight, 0.35),
	e: C.ink,
};

/**
 * The old statue's head as it once looked out over the square: a laurel wreath, stern brows and a
 * drooping moustache, broken off at the neck. It lies on its cheek, so it is drawn a quarter turn round
 * and shaded after turning. m bronze, d grooves, v green weathering in the wreath, e eye.
 */
const OLD_HEAD = [
	'.....mmmmmm.....',
	'...mmmmmmmmmm...',
	'..mmmmmmmmmmmm..',
	'.mmmmmmmmmmmmmm.',
	'.vvmvvmvvmvvmvv.',
	'mvmmmmmmmmmmmmvm',
	'mmmmmmmmmmmmmmmm',
	'mmmmmmmmmmmmmmmm',
	'mmddddmmmmddddmm',
	'mmmmmddmmddmmmmm',
	'mmmeemmmmmmeemmm',
	'mmmmmmmmmmmmmmmm',
	'mmmmmmmddmmmmmmm',
	'mmmmmmmddmmmmmmm',
	'mmmmmmdddmmmmmmm',
	'mmmmmmmmmmmmmmmm',
	'mmmddddddddddmmm',
	'mmddmmmmmmmmddmm',
	'.mmmmmddddmmmmm.',
	'..mmmmmmmmmmmm..',
	'...mmmmmmmmmm...',
	'.....mdmmdm.....',
];

/**
 * The mason, facing right: hammer raised, chisel held to the marble. h hammer head, w handle,
 * c cap, H hair, S skin, s skin shade, e eye, T smock, t smock shade, A apron, g chisel, L legs, B boots.
 */
const MASON = [
	'.........hhh.',
	'.........hhh.',
	'..........w..',
	'..........w..',
	'...ccc...SS..',
	'..ccccc..S...',
	'..HSSSS..S...',
	'..HSSeS.S....',
	'...SSSs.T....',
	'..TTTTTTT....',
	'.TTAAAATTTSS.',
	'.tTAAAATt.Sgg',
	'.tTAAAAT.....',
	'..tAAAAT.....',
	'..tAAAAt.....',
	'..LLLLLL.....',
	'..LL..LL.....',
	'..LL..LL.....',
	'..LL..LL.....',
	'.BBB.BBB.....',
];

/**
 * Draws the Revisionism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(116);

	drawSky(layer, { time: 'day', horizon: PLAZA - 1, random });
	drawSkyline(layer, { base: PLAZA - 1, time: 'day', random, height: 12 });
	drawStreet(layer, { top: PLAZA });

	// The monument and the scaffold stand behind the fallen statue, so they get their own outline.
	const monument = createCanvas(64, 64);
	drawPlinth(monument);
	drawBust(monument);
	drawScaffold(monument);
	paint(monument, 23, PLATFORM - MASON.length, MASON, {
		h: C.stoneShade,
		w: C.timberLight,
		c: C.brickRed,
		H: C.timberShade,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		T: C.daySea2,
		t: C.daySea3,
		A: C.timber,
		g: C.stoneLight,
		L: C.wood,
		B: C.timberShade,
	});
	outline(monument, C.ink);
	drawFace(monument);
	drawChips(monument);

	drawFallenStatue(scene);
	outline(scene, C.ink);
	underlay(scene, monument);
	underlay(scene, layer);
	return scene;
}

/**
 * Paints a sprite from rows of keys; dots and unknown keys are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 */
function paint(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * The monument's stone plinth: a cornice, a plain die and a broad base.
 * @param {Canvas} canvas
 */
function drawPlinth(canvas) {
	rect(canvas, 33, 37, 23, 2, C.stoneLight);
	for (let y = 39; y <= 48; y++) {
		for (let x = 35; x <= 53; x++) {
			const colour =
				x === 35 ? C.stoneLight : x >= 52 ? C.stoneShade : C.stone;
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, 33, 49, 23, 2, C.stoneMid);
	rect(canvas, 33, 49, 23, 1, C.stoneLight);
	// An empty, plain panel where an inscription would go.
	rect(canvas, 39, 41, 11, 5, C.stoneMid);
}

/**
 * The new bust in fresh white marble: shoulders, neck and a big head, its crown still a rough block.
 * @param {Canvas} canvas
 */
function drawBust(canvas) {
	// Shoulders and chest, rounded at the top corners.
	for (let y = 28; y <= 36; y++) {
		const inset = y === 28 ? 4 : y === 29 ? 2 : y === 30 ? 1 : 0;
		for (let x = 33 + inset; x <= 55 - inset; x++) {
			const colour =
				x <= 35 + inset
					? C.creamLight
					: x >= 53 - inset
						? C.creamShade
						: C.cream;
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, 41, 25, 7, 4, C.cream);
	rect(canvas, 46, 25, 2, 4, C.creamShade);
	// The head, lit from the left.
	const { x: cx, y: cy } = HEAD;
	for (let y = cy - 10; y <= cy + 8; y++) {
		for (let x = cx - 8; x <= cx + 8; x++) {
			const rough = y < cy - 5;
			const inside = rough
				? Math.abs(x - cx) <= 6 &&
					y >= cy - 10 + (Math.abs(x - cx) > 4 ? 1 : 0)
				: ((x - cx) / 7.2) ** 2 + ((y - cy + 1) / 9) ** 2 <= 1;
			if (!inside) {
				continue;
			}
			let colour = C.cream;
			if (rough) {
				// The uncarved block: flat faces with chisel marks.
				colour = x < cx - 1 ? C.stoneLight : C.creamShade;
				if ((x * 3 + y * 5) % 7 === 0) {
					colour = C.stone;
				}
			} else if (x - cx < -4) {
				colour = C.creamLight;
			} else if (x - cx > 4) {
				colour = C.creamShade;
			}
			set(canvas, x, y, colour);
		}
	}
	// Ears.
	rect(canvas, cx - 8, cy - 1, 1, 4, C.creamLight);
	rect(canvas, cx + 8, cy - 1, 1, 4, C.creamShade);
}

/**
 * The new face's features, cut cleanly into the marble: brows, eyes, nose and a calm smile.
 * @param {Canvas} canvas
 */
function drawFace(canvas) {
	const { x: cx, y: cy } = HEAD;
	const groove = C.creamShade;
	const deep = C.stoneShade;
	rect(canvas, cx - 5, cy - 3, 3, 1, groove);
	rect(canvas, cx + 2, cy - 3, 3, 1, groove);
	set(canvas, cx - 4, cy - 1, deep);
	set(canvas, cx - 3, cy - 1, groove);
	set(canvas, cx + 3, cy - 1, deep);
	set(canvas, cx + 4, cy - 1, groove);
	// The nose's shaded side and its tip.
	for (let y = cy - 1; y <= cy + 2; y++) {
		set(canvas, cx + 1, y, groove);
	}
	set(canvas, cx - 1, cy + 3, groove);
	set(canvas, cx, cy + 3, deep);
	set(canvas, cx + 1, cy + 3, groove);
	// The smile.
	set(canvas, cx - 3, cy + 5, groove);
	rect(canvas, cx - 2, cy + 6, 4, 1, deep);
	set(canvas, cx + 2, cy + 5, groove);
}

/**
 * The scaffold the mason stands on: a plank platform on poles, with a cross brace.
 * @param {Canvas} canvas
 */
function drawScaffold(canvas) {
	rect(canvas, 8, PLATFORM, 25, 1, C.timberLight);
	rect(canvas, 8, PLATFORM + 1, 25, 1, C.timber);
	for (const x of [10, 30]) {
		rect(canvas, x, PLATFORM + 2, 2, PLAZA - PLATFORM - 1, C.timber);
		set(canvas, x, PLATFORM + 2, C.timberLight);
	}
	for (let i = 0; i < 18; i++) {
		set(canvas, 12 + i, PLATFORM + 2 + Math.floor(i * 0.9), C.timberShade);
	}
}

/**
 * Marble chips flying back from the chisel's point.
 * @param {Canvas} canvas
 */
function drawChips(canvas) {
	/** @type {[number, number, Colour][]} */
	const chips = [
		[35, 18, C.white],
		[34, 16, C.creamLight],
		[36, 15, C.white],
		[35, 13, C.cream],
	];
	for (const [x, y, colour] of chips) {
		set(canvas, x, y, colour);
	}
}

/**
 * The old statue's head, broken off when it was pulled down, lying on its cheek in the square,
 * with a few bronze fragments beside it.
 * @param {Canvas} scene
 */
function drawFallenStatue(scene) {
	const x0 = 4;
	const y0 = 40;
	const h = OLD_HEAD.length;
	/**
	 * The head's key at a point of the tilted picture: each row slides right as it goes down.
	 * @param {number} x
	 * @param {number} y
	 * @returns {string}
	 */
	const key = (x, y) => OLD_HEAD[y]?.[x - Math.floor((h - 1 - y) / 4)] ?? '.';
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < 24; x++) {
			const k = key(x, y);
			if (k === '.') {
				continue;
			}
			let colour = BRONZE[/** @type {keyof typeof BRONZE} */ (k)];
			if (k === 'm') {
				colour =
					key(x, y - 1) === '.' || key(x - 1, y) === '.'
						? BRONZE.l
						: key(x, y + 1) === '.' || key(x + 1, y) === '.'
							? BRONZE.d
							: BRONZE.m;
			}
			set(scene, x0 + x, y0 + y, colour);
		}
	}
	// Broken pieces of the old statue.
	for (const [x, y, wide] of [
		[29, 58, 3],
		[34, 60, 2],
		[27, 61, 2],
	]) {
		rect(scene, x, y, wide, 1, BRONZE.l);
		rect(scene, x, y + 1, wide, 1, BRONZE.d);
	}
}
