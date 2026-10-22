// Library: a great brass-cornered book chained to a slanted lectern, open on illuminated pages, by an oil lamp at night.
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

/** The open book: its gutter column, its top and bottom page rows, and its pages' half-widths there (the lectern slants away). */
const BOOK = { x: 33, top: 17, bottom: 43, topHalf: 19, bottomHalf: 25 };

/** The oil lamp's flame, at the tip of its spout, on a shelf high on the wall to the left. */
const FLAME = { x: 16, y: 3 };

/** The narrow arched window onto the night, top right: its left column and top row. */
const WINDOW = { x: 52, y: 0 };

/** The floor's first row. */
const FLOOR = 57;

/** The stone wall in the dark: block, lit edge, joint; and the flagstones. */
const WALL = mix(C.stoneShade, C.night, 0.5);
const WALL_LIGHT = mix(C.stoneMid, C.night, 0.45);
const JOINT = mix(C.stoneShade, C.ink, 0.72);
const FLAG = mix(C.stoneShade, C.ink, 0.45);

/** The leather binding, the vellum's shaded fold and the ruled text lines. */
const LEATHER = mix(C.brickRedShade, C.brickRed, 0.3);
const LEATHER_SHADE = mix(C.brickRedShade, C.ink, 0.35);
const FOLD = mix(C.creamShade, C.timber, 0.35);
const RULE = mix(C.stone, C.creamShade, 0.2);

/** The chain's iron, lit and dark. */
const IRON = mix(C.stoneLight, C.stone, 0.4);
const IRON_DARK = mix(C.stoneShade, C.ink, 0.3);

/**
 * Draws the Library tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2417);

	drawWall(layer, random);
	drawWindow(layer);

	drawLectern(scene);
	drawBinding(scene);
	drawPages(scene);
	drawLeftPage(scene);
	drawRightPage(scene);
	drawChain(scene);
	drawLamp(scene);
	drawScrolls(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 66,
		colour: C.lampGlow,
		strength: 0.34,
		steps: 5,
		skip: [C.ink],
	});
	drawFlame(scene);
	return scene;
}

/**
 * The stone wall in courses of dark blocks, over a flagstone floor.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < FLOOR; y++) {
		const course = Math.floor(y / 5);
		const offset = (course % 2) * 6;
		for (let x = 0; x < 64; x++) {
			let colour = WALL;
			if (y % 5 === 4 || (x + offset) % 12 === 0) {
				colour = JOINT;
			} else if (y % 5 === 0 || (x + offset) % 12 === 1) {
				colour = WALL_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * FLOOR);
		if (get(layer, x, y) === WALL) {
			set(layer, x, y, random() > 0.5 ? WALL_LIGHT : JOINT);
		}
	}
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const seam =
				y === FLOOR + 2 || (x + (y > FLOOR + 2 ? 7 : 0)) % 14 === 0;
			set(layer, x, y, seam || y === FLOOR ? JOINT : FLAG);
		}
	}
}

/**
 * The arched window: night sky with a few stars, in a stone frame with glazing bars and a lit sill.
 * @param {Canvas} layer
 */
function drawWindow(layer) {
	const rows = [
		'...fff...',
		'.ffsssff.',
		'.fsssssf.',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fsssssssf',
		'fffffffff',
	];
	const skies = [C.nightSky2, C.nightSky3, C.nightSky4, C.nightSky5];
	rows.forEach((row, j) => {
		[...row].forEach((key, i) => {
			const x = WINDOW.x + i;
			const y = WINDOW.y + j;
			if (key === 'f') {
				set(layer, x, y, i < 4 ? C.stoneMid : C.stoneShade);
			} else if (key === 's') {
				set(layer, x, y, skies[Math.min(3, Math.floor(j / 3.5))]);
			}
		});
	});
	// A few stars, then the glazing bars over them.
	for (const [x, y, colour] of /** @type {[number, number, Colour][]} */ ([
		[2, 3, C.starDim],
		[6, 5, C.white],
		[2, 9, C.starDim],
		[6, 11, C.starDim],
	])) {
		set(layer, WINDOW.x + x, WINDOW.y + y, colour);
	}
	for (let j = 2; j < 13; j++) {
		set(layer, WINDOW.x + 4, WINDOW.y + j, C.stoneShade);
	}
	rect(layer, WINDOW.x + 1, WINDOW.y + 7, 7, 1, C.stoneShade);
	rect(layer, WINDOW.x - 1, WINDOW.y + 14, 11, 1, C.stoneLight);
	rect(layer, WINDOW.x - 1, WINDOW.y + 15, 11, 1, C.stoneShade);
}

/**
 * The page area's left and right columns on one row: wider towards the viewer.
 * @param {number} y
 * @returns {[number, number]}
 */
function pageSpan(y) {
	const t = (y - BOOK.top) / (BOOK.bottom - BOOK.top);
	const half = BOOK.topHalf + (BOOK.bottomHalf - BOOK.topHalf) * t;
	return [Math.round(BOOK.x - half), Math.round(BOOK.x + half)];
}

/**
 * How far the top of the pages dips on a column: low at the gutter, rising to a curl, easing at the outer edge.
 * @param {number} x
 * @returns {number} Rows below BOOK.top.
 */
function topDip(x) {
	const d = Math.abs(x - BOOK.x);
	if (d < 1) {
		return 3;
	}
	if (d < 3) {
		return 2;
	}
	if (d < 7) {
		return 1;
	}
	return d > 17 ? 1 : 0;
}

/**
 * The lectern: the slanted board standing out round the book, a lip along its front, a turned post and a broad foot.
 * @param {Canvas} scene
 */
function drawLectern(scene) {
	// The board, wider than the binding, its edges showing at the sides.
	for (let y = BOOK.top - 4; y <= BOOK.bottom + 3; y++) {
		const [l, r] = pageSpan(y);
		for (let x = l - 5; x <= r + 5; x++) {
			set(scene, x, y, x < BOOK.x ? C.timber : C.timberShade);
		}
		set(scene, l - 5, y, C.timberLight);
	}
	// The lip along the front edge that keeps the book from sliding.
	const [l, r] = pageSpan(BOOK.bottom + 4);
	rect(scene, l - 6, BOOK.bottom + 4, r - l + 13, 1, C.timberLight);
	rect(scene, l - 6, BOOK.bottom + 5, r - l + 13, 2, C.timber);
	rect(scene, l - 6, BOOK.bottom + 7, r - l + 13, 1, C.timberShade);
	// The post, lit on the left, with a carved knop.
	for (let y = BOOK.bottom + 8; y < 62; y++) {
		const knop = y >= 52 && y <= 54;
		const half = knop ? 5 : 3;
		for (let x = BOOK.x - half; x <= BOOK.x + half; x++) {
			let colour = C.timber;
			if (x <= BOOK.x - half + 1) {
				colour = C.timberLight;
			} else if (x >= BOOK.x + half - 1) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The foot.
	rect(scene, BOOK.x - 12, 60, 25, 2, C.timber);
	rect(scene, BOOK.x - 12, 60, 25, 1, C.timberLight);
	rect(scene, BOOK.x - 14, 62, 29, 2, C.timberShade);
}

/**
 * The leather binding round the pages, with brass corner pieces and studs.
 * @param {Canvas} scene
 */
function drawBinding(scene) {
	for (let y = BOOK.top - 2; y <= BOOK.bottom + 3; y++) {
		const [l, r] = pageSpan(y);
		for (let x = l - 2; x <= r + 2; x++) {
			set(scene, x, y, x < BOOK.x ? LEATHER : LEATHER_SHADE);
		}
	}
	// The brass corners: a triangle at each of the four corners.
	/**
	 * One corner piece.
	 * @param {number} cx - The corner's column
	 * @param {number} cy - The corner's row
	 * @param {1 | -1} sx - Which way the piece reaches across
	 * @param {1 | -1} sy - Which way the piece reaches down
	 */
	const corner = (cx, cy, sx, sy) => {
		for (let j = 0; j < 5; j++) {
			for (let i = 0; i < 5 - j; i++) {
				const lit = (sx === 1 && i === 0) || (sy === 1 && j === 0);
				set(scene, cx + i * sx, cy + j * sy, lit ? C.gold : C.brass);
			}
		}
	};
	const [tl, tr] = pageSpan(BOOK.top - 2);
	const [bl, br] = pageSpan(BOOK.bottom + 3);
	corner(tl - 2, BOOK.top - 2, 1, 1);
	corner(tr + 2, BOOK.top - 2, -1, 1);
	corner(bl - 2, BOOK.bottom + 3, 1, -1);
	corner(br + 2, BOOK.bottom + 3, -1, -1);
	// The spine's brass bosses, top and bottom.
	for (const y of [BOOK.top - 2, BOOK.bottom + 3]) {
		set(scene, BOOK.x - 1, y, C.brass);
		set(scene, BOOK.x, y, C.gold);
		set(scene, BOOK.x + 1, y, C.amber);
	}
}

/**
 * The vellum pages: lit on the left, a shaded fold at the gutter, and the edges of the leaves stacked below.
 * @param {Canvas} scene
 */
function drawPages(scene) {
	for (let y = BOOK.top; y <= BOOK.bottom + 1; y++) {
		const [l, r] = pageSpan(y);
		for (let x = l; x <= r; x++) {
			if (y < BOOK.top + topDip(x)) {
				continue;
			}
			const d = x - BOOK.x;
			let colour = d < 0 ? C.creamLight : C.cream;
			if (Math.abs(d) < 1) {
				colour = FOLD;
			} else if (d > 0 && d < 3) {
				colour = C.creamShade;
			} else if (d < 0 && d > -3) {
				colour = C.cream;
			}
			// The leaves' edges, stacked along the foot of the pages.
			if (y >= BOOK.bottom && Math.abs(d) > 2) {
				colour = y === BOOK.bottom ? C.creamShade : C.cream;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Ruled grey lines standing in for text: one pixel high, with a break here and there.
 * @param {Canvas} scene
 * @param {number} x0
 * @param {number} x1
 * @param {number} y
 */
function ruled(scene, x0, x1, y) {
	for (let x = x0; x <= x1; x++) {
		if ((x * 7 + y * 3) % 11 !== 0) {
			set(scene, x, y, RULE);
		}
	}
}

/**
 * The left page: an illuminated ornament block, ruled lines beside and below it, a framed miniature of a hill with a tree under the sun, and a vine down the margin.
 * @param {Canvas} scene
 */
function drawLeftPage(scene) {
	// The ornament: a gold square on blue, a red flower in its heart.
	const ox = 16;
	const oy = 20;
	rect(scene, ox, oy, 7, 7, C.gold);
	rect(scene, ox + 1, oy + 1, 5, 5, C.daySky1);
	set(scene, ox + 3, oy + 2, C.brickRed);
	set(scene, ox + 2, oy + 3, C.brickRed);
	set(scene, ox + 4, oy + 3, C.brickRed);
	set(scene, ox + 3, oy + 4, C.brickRed);
	set(scene, ox + 3, oy + 3, C.gold);
	set(scene, ox + 1, oy + 1, C.amber);
	set(scene, ox + 5, oy + 5, C.amber);
	for (const y of [20, 22, 24, 26]) {
		ruled(scene, 24, 30, y);
	}
	for (const y of [28, 30]) {
		ruled(scene, 15, 30, y);
	}
	// The miniature: a gold frame round a day sky, a green hill, a tree and the sun.
	const mx = 15;
	const my = 32;
	const mw = 16;
	const mh = 9;
	rect(scene, mx, my, mw, mh, C.amber);
	rect(scene, mx + 1, my + 1, mw - 2, mh - 2, C.daySky4);
	rect(scene, mx + 1, my + 1, mw - 2, 2, C.daySky3);
	for (let x = mx + 1; x < mx + mw - 1; x++) {
		const hill =
			my + 5 - Math.round(Math.sin(((x - mx) / mw) * Math.PI) * 2);
		for (let y = hill; y < my + mh - 1; y++) {
			set(scene, x, y, y === hill ? C.grassLight : C.grass);
		}
	}
	rect(scene, mx + 7, my + 1, 3, 3, C.pine);
	rect(scene, mx + 6, my + 2, 5, 1, C.pine);
	set(scene, mx + 7, my + 1, C.pineLight);
	set(scene, mx + 8, my + 4, C.timber);
	set(scene, mx + 12, my + 2, C.gold);
	set(scene, mx + 13, my + 2, C.gold);
	set(scene, mx + 12, my + 3, C.amber);
	// The vine down the outer margin, with red berries.
	for (let y = 20; y <= 40; y++) {
		const [l] = pageSpan(y);
		set(scene, l + 1 + (y % 4 === 0 ? 1 : 0), y, C.grass);
		if (y % 5 === 2) {
			set(scene, l + 2, y, C.brickRed);
		}
	}
}

/**
 * The right page: a round medallion of a gold star in a blue and red field, ruled lines and a gilded vine.
 * @param {Canvas} scene
 */
function drawRightPage(scene) {
	const cx = 42;
	const cy = 24;
	for (let y = cy - 5; y <= cy + 5; y++) {
		for (let x = cx - 5; x <= cx + 5; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d >= 5.3) {
				continue;
			}
			let colour = x < cx === y < cy ? C.daySky1 : C.brickRed;
			if (d >= 4.3) {
				colour = C.gold;
			}
			set(scene, x, y, colour);
		}
	}
	// The star at the medallion's heart.
	for (let k = -2; k <= 2; k++) {
		set(scene, cx + k, cy, C.gold);
		set(scene, cx, cy + k, C.gold);
	}
	set(scene, cx, cy, C.lampGlow);
	set(scene, cx - 1, cy - 1, C.amber);
	set(scene, cx + 1, cy + 1, C.amber);
	set(scene, cx + 1, cy - 1, C.amber);
	set(scene, cx - 1, cy + 1, C.amber);
	for (const y of [20, 22, 26, 28]) {
		ruled(scene, 36, 36, y);
		ruled(scene, 49, 50, y);
	}
	for (const y of [31, 33, 35, 37, 39]) {
		ruled(scene, 36, y === 39 ? 44 : 51, y);
	}
	// The gilded vine down the outer margin.
	for (let y = 19; y <= 40; y++) {
		const [, r] = pageSpan(y);
		set(scene, r - 1 - (y % 4 === 2 ? 1 : 0), y, C.grass);
		if (y % 5 === 0) {
			set(scene, r - 2, y, C.gold);
		}
	}
}

/**
 * The chain: from a staple on the binding's lower left corner, sagging to a ring on the lectern's post.
 * @param {Canvas} scene
 */
function drawChain(scene) {
	const [x0, y0] = [pageSpan(BOOK.bottom + 3)[0] + 2, BOOK.bottom + 4];
	const [x1, y1] = [BOOK.x - 4, 53];
	const steps = 26;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = Math.round(x0 + (x1 - x0) * t);
		const y = Math.round(y0 + (y1 - y0) * t + 9 * t * (1 - t));
		// Links alternate: one seen flat (two rows, lit over dark), the next edge-on (a single bright pixel).
		const link = i % 4;
		if (link < 2) {
			set(scene, x, y, C.stoneLight);
			set(scene, x, y + 1, IRON_DARK);
		} else {
			set(scene, x, y, link === 2 ? IRON : IRON_DARK);
		}
	}
	// The staple on the binding and the ring on the post.
	set(scene, x0, y0 - 1, C.stoneLight);
	set(scene, x0 + 1, y0 - 1, IRON);
	for (const [dx, dy] of [
		[-1, 0],
		[1, 0],
		[0, -1],
		[0, 1],
	]) {
		set(scene, x1 + dx, y1 + dy, IRON);
	}
	set(scene, x1 - 1, y1 - 1, C.stoneLight);
}

/**
 * The oil lamp: a brass lamp with a lidded bowl, a long spout and a looped handle, on a stone shelf.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	// The shelf and the corbel under it.
	rect(scene, 0, 11, 14, 1, C.stoneLight);
	rect(scene, 0, 12, 14, 1, C.stoneMid);
	rect(scene, 0, 13, 4, 2, C.stoneShade);
	rect(scene, 0, 15, 2, 2, C.stoneShade);
	paint(
		scene,
		0,
		2,
		[
			'......g..........',
			'.....gba.........',
			'...bgggbaa.......',
			'b.bgllgbbaa....gb',
			'b.glgggbbbaaabba.',
			'.bggbbbbbbaaaa...',
			'..baabbbaaaaa....',
			'....aaaaaaaa.....',
			'...rrrrrrrrr.....',
		],
		{ g: C.gold, l: C.lampGlow, b: C.brass, a: C.amber, r: C.lampFrame }
	);
}

/**
 * The flame at the spout and its bright heart, painted over the glow.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	const { x, y } = FLAME;
	for (const [dx, dy, colour] of /** @type {[number, number, Colour][]} */ ([
		[2, -3, C.gold],
		[2, -2, C.gold],
		[3, -2, C.amber],
		[1, -1, C.amber],
		[2, -1, C.lampGlow],
		[3, -1, C.gold],
		[2, 0, C.white],
		[3, 0, C.lampGlow],
		[1, 0, C.gold],
		[2, 1, C.amber],
	])) {
		set(scene, x + dx, y + dy, colour);
	}
}

/**
 * The basket of scrolls at the lectern's right: rolled scrolls leaning in a woven basket, each tied with red ribbon.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawScrolls(scene, random) {
	const rim = 53;
	// Three scrolls fanned out of the basket, each tied with red ribbon below its rolled end.
	for (const [x0, y0, x1, y1] of [
		[55, 58, 53, 42],
		[51, 58, 44, 46],
		[59, 58, 63, 46],
	]) {
		const steps = y0 - y1;
		for (let i = 0; i <= steps; i++) {
			const x = Math.round(x0 + ((x1 - x0) * i) / steps);
			const y = y0 - i;
			const tie = i === steps - 3;
			set(scene, x - 1, y, tie ? C.brickRedLight : C.creamLight);
			set(scene, x, y, tie ? C.brickRed : C.cream);
			set(scene, x + 1, y, tie ? C.brickRed : C.cream);
			set(scene, x + 2, y, tie ? C.brickRedShade : C.creamShade);
		}
		// The rolled end: a pale rim round the dark curl.
		set(scene, x1 - 1, y1 - 1, C.creamLight);
		set(scene, x1, y1 - 1, C.creamLight);
		set(scene, x1 + 1, y1 - 1, C.cream);
		set(scene, x1, y1, C.creamShade);
		set(scene, x1 + 1, y1, C.timberLight);
	}
	// The basket: a lit rim, then a woven body narrowing to its foot.
	for (let y = rim; y < 64; y++) {
		const inset = Math.floor((y - rim) / 5);
		for (let x = 45 + inset; x <= 63; x++) {
			const weave = (x + (Math.floor((y - rim) / 2) % 2) * 2) % 4 < 2;
			let colour = weave ? C.timberLight : C.timber;
			if (y === rim) {
				colour = C.sandShade;
			} else if (y === rim + 1) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = 47 + Math.floor(random() * 15);
		const y = rim + 3 + Math.floor(random() * 9);
		set(scene, x, y, C.timberShade);
	}
}
