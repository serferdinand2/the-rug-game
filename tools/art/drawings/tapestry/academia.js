// Academia: a scholar's desk by a tall night window, one candle lighting an open book and a globe.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row, the desk top's row, and the candle flame's centre. */
const FLOOR = 48;
const DESK = 41;
const FLAME = { x: 39, y: 29 };

/** The window's box, frame included. */
const WINDOW = { x: 16, y: 3, w: 15, h: 27 };

/**
 * Draws the Academia scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(61);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'panel',
		window: { ...WINDOW, time: 'night' },
	});
	drawMoon(layer);

	// The bookcase and the wall shelf stand behind the desk, so they get their own outline.
	const behind = createCanvas(64, 64);
	drawBookcase(behind, random);
	drawWallShelf(behind, random);
	outline(behind, C.ink);

	// The things on the desk stand in front of it; candlelight leaves them at full strength.
	drawOpenBook(scene);
	drawCandle(scene);
	drawGlobe(scene);
	const subject = scene.p.map(Boolean);
	const desk = createCanvas(64, 64);
	drawDesk(desk);
	underlay(scene, desk);
	outline(scene, C.ink);
	underlay(scene, behind);
	underlay(scene, layer);
	drawCandlelight(scene, subject);
	drawFlame(scene);
	return scene;
}

/**
 * Paints a small sprite from rows of keys; dots and unknown keys are left alone.
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
 * A full moon high in the right-hand panes.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	paint(layer, 24, 6, ['.mmm.', 'mMMMm', 'mMMmm', 'mMMMm', '.mmm.'], {
		m: C.moonRim,
		M: C.moon,
	});
}

/**
 * The two colours of a book's spine, lit and shaded.
 * @type {[Colour, Colour][]}
 */
const BINDINGS = [
	[C.brickRed, C.brickRedShade],
	[C.roofLight, C.roof],
	[C.pineLight, C.pine],
	[C.nightWave, C.nightSea1],
	[C.amber, C.timber],
	[C.timberLight, C.timberShade],
	[C.creamShade, C.plasterShade],
];

/**
 * A row of books standing on a shelf, of random widths, heights and bindings, one leaning.
 * @param {Canvas} canvas
 * @param {number} left - The first column
 * @param {number} right - The last column
 * @param {number} base - The row the books stand on
 * @param {number} tallest - The tallest a book may be
 * @param {() => number} random
 */
function drawBookRow(canvas, left, right, base, tallest, random) {
	let x = left;
	while (x <= right) {
		const w = random() > 0.7 ? 3 : 2;
		const h = tallest - Math.floor(random() * 3);
		const [light, shade] = BINDINGS[Math.floor(random() * BINDINGS.length)];
		if (random() > 0.85 && x + w + 2 <= right) {
			// A book leaning on its neighbour.
			for (let j = 0; j < h; j++) {
				const lean = Math.floor(j / 3);
				set(canvas, x + lean, base - j, light);
				set(canvas, x + lean + 1, base - j, shade);
			}
			x += 4;
			continue;
		}
		for (let j = 0; j < h; j++) {
			for (let i = 0; i < w && x + i <= right; i++) {
				set(canvas, x + i, base - j, i === 0 ? light : shade);
			}
		}
		// A gilt band across some spines.
		if (random() > 0.5) {
			set(canvas, x, base - h + 2, C.gold);
			if (w > 1 && x + 1 <= right) {
				set(canvas, x + 1, base - h + 2, C.amber);
			}
		}
		x += w;
	}
}

/**
 * A tall bookcase against the left wall, its shelves full of books.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawBookcase(canvas, random) {
	const left = 0;
	const right = 11;
	const top = 4;
	const bottom = FLOOR + 3;
	rect(canvas, left, top, right - left + 1, bottom - top + 1, C.wood);
	for (let y = top; y <= bottom; y++) {
		set(canvas, right, y, C.timberShade);
		set(canvas, right - 1, y, C.timber);
	}
	rect(canvas, left, top, right - left + 1, 2, C.timberLight);
	for (const shelf of [15, 25, 35, 45]) {
		rect(canvas, left, shelf, right - 1, 1, C.timberLight);
		rect(canvas, left, shelf + 1, right - 1, 1, C.timber);
		drawBookRow(canvas, left, right - 2, shelf - 1, 8, random);
	}
	rect(canvas, left, bottom - 1, right - left + 1, 2, C.timber);
}

/**
 * A plank shelf on brackets to the right of the window, with a row of books and a small hourglass.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawWallShelf(canvas, random) {
	const y = 15;
	rect(canvas, 36, y, 28, 1, C.timberLight);
	rect(canvas, 36, y + 1, 28, 1, C.timber);
	for (const x of [39, 59]) {
		set(canvas, x, y + 2, C.timber);
		set(canvas, x, y + 3, C.timberShade);
	}
	drawBookRow(canvas, 37, 53, y - 1, 8, random);
	// A small brass hourglass at the end of the shelf.
	paint(
		canvas,
		56,
		y - 6,
		['bbbbb', '.sgs.', '..g..', '.sgs.', '.ggg.', 'bbbbb'],
		{ b: C.lampFrame, s: C.creamLight, g: C.gold }
	);
}

/**
 * The desk: a thick top lit along its front edge, an apron and turned legs.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	const left = 11;
	const right = 62;
	rect(scene, left, DESK, right - left + 1, 1, C.timberLight);
	rect(scene, left, DESK + 1, right - left + 1, 2, C.timber);
	rect(scene, left + 1, DESK + 3, right - left - 1, 4, C.timberShade);
	// A drawer with a brass pull.
	rect(scene, 33, DESK + 4, 12, 2, C.timber);
	set(scene, 38, DESK + 4, C.brass);
	set(scene, 39, DESK + 4, C.brass);
	for (const x of [left + 2, right - 4]) {
		for (let y = DESK + 7; y <= 58; y++) {
			set(scene, x, y, C.timber);
			set(scene, x + 1, y, C.timberShade);
		}
	}
}

/**
 * A big open book propped on a reading slope, a little coloured plate on its right page
 * and a red ribbon hanging from the gutter over the desk's edge.
 * @param {Canvas} scene
 */
function drawOpenBook(scene) {
	const left = 18;
	const right = 34;
	const gutter = 26;
	const top = DESK - 10;
	const bottom = DESK - 3;
	// The reading slope under the book.
	rect(scene, left + 1, DESK - 2, right - left - 1, 2, C.timber);
	rect(scene, left + 1, DESK - 2, right - left - 1, 1, C.timberLight);
	// The cover, a little wider than the pages.
	rect(scene, left - 1, bottom + 1, right - left + 3, 1, C.brickRedShade);
	for (let x = left; x <= right; x++) {
		const fromGutter = Math.abs(x - gutter);
		// The pages dip into the gutter and fan out at the outer edges.
		const dip = fromGutter === 0 ? 2 : fromGutter === 1 ? 1 : 0;
		for (let y = top + dip; y <= bottom; y++) {
			let colour = x < gutter ? C.creamLight : C.cream;
			if (fromGutter === 0 || x === left || x === right) {
				colour = C.creamShade;
			} else if (y === bottom && (x === left + 1 || x === right - 1)) {
				colour = C.creamShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A small coloured plate on the right page: a hill under a blue sky, in a thin frame.
	rect(scene, 28, top + 2, 6, 5, C.creamShade);
	rect(scene, 29, top + 3, 4, 2, C.daySky4);
	rect(scene, 29, top + 5, 4, 1, C.grass);
	set(scene, 30, top + 4, C.grass);
	set(scene, 31, top + 4, C.grassLight);
	// A red ribbon from the gutter, hanging over the desk's front edge.
	for (const [x, y] of [
		[gutter, bottom + 1],
		[gutter, DESK - 1],
		[gutter, DESK],
		[gutter + 1, DESK + 1],
		[gutter + 1, DESK + 2],
		[gutter, DESK + 3],
	]) {
		set(scene, x, y, C.brickRed);
	}
}

/**
 * A tall candle in a brass dish, and a quill in an inkpot at the desk's left end.
 * @param {Canvas} scene
 */
function drawCandle(scene) {
	paint(
		scene,
		FLAME.x - 3,
		DESK - 10,
		[
			'...k...',
			'..CCc..',
			'..CCc..',
			'.wCCc..',
			'..CCc..',
			'..CCc..',
			'..CCc..',
			'..CCc..',
			'.gGGGa.',
			'aaaaaaa',
		],
		{
			k: C.ink,
			w: C.white,
			C: C.creamLight,
			c: C.creamShade,
			g: C.gold,
			G: C.brass,
			a: C.lampFrame,
		}
	);
	// A glass inkpot with a brass lid, its quill leaning back against the bookcase.
	paint(
		scene,
		8,
		DESK - 13,
		[
			'f........',
			'fF.......',
			'.fF......',
			'.fFf.....',
			'..fFf....',
			'...fFf...',
			'....fF...',
			'.....F...',
			'.....F...',
			'....bbb..',
			'...nnnnn.',
			'...nWnnn.',
			'...nnnnn.',
		],
		{
			F: C.white,
			f: C.gull,
			b: C.brass,
			n: C.nightSea2,
			W: C.nightWave,
		}
	);
}

/**
 * A globe on a turned stand, the sea lit from the candle's side, a brass meridian ring around it.
 * @param {Canvas} scene
 */
function drawGlobe(scene) {
	const cx = 52;
	const cy = 28;
	const r = 7;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			const land = isLand(x - cx, y - cy);
			// Lit from the candle on the left.
			const lit = x - cx + (y - cy) * 0.6 < -2;
			const dark = x - cx + (y - cy) * 0.4 > 3.5;
			let colour = land
				? lit
					? C.grassLight
					: dark
						? C.grassShade
						: C.grass
				: lit
					? C.daySea1
					: dark
						? C.daySea3
						: C.daySea2;
			if (x - cx === -4 && y - cy === -4) {
				colour = C.dayWave;
			}
			set(scene, x, y, colour);
		}
	}
	// The meridian ring, a brass half-hoop on the right, and its pins.
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx; x <= cx + r + 2; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.8 && d <= r + 1.8) {
				set(scene, x, y, y < cy ? C.gold : C.amber);
			}
		}
	}
	set(scene, cx, cy - r - 1, C.gold);
	set(scene, cx, cy + r + 1, C.amber);
	// The stand: a short stem and a round foot.
	rect(scene, cx - 1, cy + r + 2, 3, 2, C.timber);
	set(scene, cx - 1, cy + r + 2, C.timberLight);
	rect(scene, cx - 4, DESK - 2, 9, 2, C.timber);
	rect(scene, cx - 4, DESK - 2, 9, 1, C.timberLight);
}

/**
 * Tells whether a point on the globe, measured from its centre, is land. Two invented continents.
 * @param {number} dx
 * @param {number} dy
 * @returns {boolean}
 */
function isLand(dx, dy) {
	const west = ((dx + 2.5) / 2.6) ** 2 + ((dy + 2) / 3.6) ** 2 <= 1;
	const south = ((dx - 2) / 2.2) ** 2 + ((dy - 3.5) / 2.4) ** 2 <= 1;
	const isle = (dx - 4) ** 2 + (dy + 3) ** 2 <= 1.2;
	return west || south || isle;
}

/**
 * Candlelight: the room glows warm near the flame and falls into night towards the edges.
 * The window's panes keep their own night sky, and the things on the desk keep their colours.
 * @param {Canvas} scene
 * @param {boolean[]} subject - Which pixels belong to the things on the desk
 */
function drawCandlelight(scene, subject) {
	const dark = C.nightSky1;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pane =
				x > WINDOW.x &&
				x < WINDOW.x + WINDOW.w - 1 &&
				y > WINDOW.y &&
				y < WINDOW.y + WINDOW.h - 1;
			const colour = get(scene, x, y);
			if (pane || subject[y * 64 + x] || !colour || colour === C.ink) {
				continue;
			}
			// Light falls off a little faster upwards and downwards than sideways.
			const d =
				Math.hypot(x - FLAME.x, (y - FLAME.y) * 1.15) +
				((x + y) % 2) * 1.5;
			if (d < 9) {
				set(scene, x, y, mix(colour, C.lampGlow, 0.25));
			} else if (d < 18) {
				continue;
			} else if (d < 27) {
				set(scene, x, y, mix(colour, dark, 0.3));
			} else if (d < 36) {
				set(scene, x, y, mix(colour, dark, 0.5));
			} else {
				set(scene, x, y, mix(colour, dark, 0.65));
			}
		}
	}
}

/**
 * The flame and the halo around it, painted last so nothing dims it.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 1,
		FLAME.y - 3,
		['.g.', '.y.', 'gyg', 'gwg', '.a.'],
		{
			g: C.gold,
			y: C.beamLight,
			w: C.white,
			a: C.amber,
		}
	);
}
