// Tapestry: a great tapestry half woven on an upright wooden loom by the daylight of a lancet window, a white unicorn among tiny flowers on red, loose threads and bobbins hanging below where the weaving stops.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * Four tones of one material, from the side facing the window to the deepest shade.
 * @typedef {[Colour, Colour, Colour, Colour]} Tones
 */

/** The flagstones start at this row. */
const FLOOR = 59;

/** The lancet window in the wall to the left, the daylight's source: its opening, without the stone reveal. */
const WINDOW = { x: 1, y: 5, w: 7, h: 27 };

/** The loom's two uprights (their left columns; each is four wide) and its two beams (their top rows; each is five tall). */
const POSTS = [11, 58];
const POST_WIDTH = 4;
const BEAM_TOP = 2;
const BEAM_BOTTOM = 53;
const BEAM_HEIGHT = 5;

/** The woven cloth between the uprights, from just under the top beam; its lower edge is ragged (see fellRow). */
const WEAVE = { left: 15, right: 57, top: 7 };

/** The red field inside the blue border. */
const FIELD = { left: 18, right: 54, top: 11 };

/** The unicorn's top-left corner: its horn tip is two pixels in. */
const UNICORN = { x: 21, y: 12 };

/**
 * Where the weaving stops, column by column, left to right: each weaver's section has its own height,
 * as tapestries are woven in patches.
 */
const FELL = [
	{ to: 22, row: 44 },
	{ to: 29, row: 42 },
	{ to: 37, row: 43 },
	{ to: 45, row: 41 },
	{ to: 51, row: 42 },
	{ to: 57, row: 40 },
];

/** The unicorn's coat and its horn. */
const COAT = /** @type {Tones} */ ([
	C.white,
	C.creamLight,
	C.cream,
	C.creamShade,
]);
const HORN = /** @type {Tones} */ ([C.lampGlow, C.gold, C.amber, C.lampFrame]);

/** The woven colours: the red ground, its darker weft, the blue border and the dark contour round every figure. */
const RED = C.brickRed;
const RED_WEFT = mix(C.brickRed, C.brickRedShade, 0.45);
const BORDER = mix(C.roof, C.daySky1, 0.5);
const BORDER_DARK = mix(C.roof, C.daySky1, 0.2);
const CONTOUR = mix(C.brickRedShade, C.ink, 0.55);

/** The flowers of the field and the yarns on the bobbins. */
const BLUE = mix(C.daySky2, C.daySky4, 0.3);
const PINK = mix(C.brickRedLight, C.white, 0.45);
const LEAF = mix(C.pine, C.grassShade, 0.5);

/** The loose ends below the weaving: the column each hangs from, its length, its yarn and its shade, and whether a bobbin hangs on it. */
const YARNS = [
	{ x: 21, length: 7, yarn: [C.white, C.cream], bobbin: true },
	{ x: 25, length: 4, yarn: [C.gold, C.amber], bobbin: false },
	{ x: 29, length: 5, yarn: [RED, C.brickRedShade], bobbin: true },
	{ x: 34, length: 3, yarn: [LEAF, C.pine], bobbin: false },
	{ x: 39, length: 4, yarn: [BLUE, C.daySky1], bobbin: true },
	{ x: 45, length: 6, yarn: [PINK, C.brickRedLight], bobbin: false },
	{ x: 49, length: 3, yarn: [C.gold, C.amber], bobbin: true },
];

/** The wall behind the bare warp, in the loom's shadow. */
const BEHIND = mix(C.stoneShade, C.stoneMid, 0.3);

const BEHIND_JOINT = mix(C.stoneShade, C.night, 0.3);

/** The colours the daylight leaves alone: the sky, the darkest edges and the tiny flowers, which are too small to show it. */
const KEEP = [
	C.white,
	C.ink,
	C.daySky3,
	C.daySky4,
	C.daySky5,
	C.daySky6,
	C.cloudShade,
	C.grassLight,
	C.grass,
	BLUE,
	PINK,
	LEAF,
	C.pine,
	C.gold,
	C.amber,
	C.lampGlow,
	CONTOUR,
];

/**
 * Draws the Tapestry masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1107);

	drawInterior(layer, { floor: FLOOR, random, wall: 'stone' });
	drawWindow(layer);
	drawBehind(layer);

	const scene = createCanvas(64, 64);
	drawLoom(scene);
	drawCloth(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawWarp(scene);

	// The loose ends hang in front of the bare warp; the bobbins on them and the basket each get their own dark edge.
	drawThreads(scene);
	const ends = createCanvas(64, 64);
	drawBobbins(ends);
	drawBasket(ends);
	outline(ends, C.ink);
	copyInto(scene, ends);

	glow(scene, {
		x: WINDOW.x + 2,
		y: WINDOW.y + 14,
		radius: 50,
		colour: C.lampGlow,
		strength: 0.26,
		steps: 2,
		skip: KEEP,
	});
	drawGlints(scene);
	return scene;
}

/**
 * The lancet window: a pointed opening onto the day sky and a far green hill, edged in dressed stone with a sill.
 * @param {Canvas} layer
 */
function drawWindow(layer) {
	const { x, y, w, h } = WINDOW;
	// The day sky, paling towards a far green hill.
	const ramp = [C.daySky3, C.daySky4, C.daySky5, C.daySky6];
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			if (!inLancet(i, j, w)) {
				continue;
			}
			const band = Math.min(
				ramp.length - 1,
				Math.floor((j / (h - 4)) * ramp.length)
			);
			set(layer, x + i, y + j, ramp[band]);
		}
	}
	// A small cloud drifting past, and the hill.
	paint(layer, x + 1, y + 11, ['..w..', '.www.', 'sssss'], {
		w: C.white,
		s: C.cloudShade,
	});
	for (let i = 0; i < w; i++) {
		const top = y + h - 4 + (i > 3 ? 1 : 0);
		for (let j = top; j < y + h; j++) {
			set(layer, x + i, j, j === top ? C.grassLight : C.grass);
		}
	}
	// The dressed stone round the opening: in shadow on the left and over the arch, lit where it faces the room.
	for (let j = -1; j < h; j++) {
		for (let i = -1; i <= w; i++) {
			if (inLancet(i, j, w)) {
				continue;
			}
			const edge = [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			].some(([dx, dy]) => inLancet(i + dx, j + dy, w));
			if (edge) {
				set(
					layer,
					x + i,
					y + j,
					i > w / 2 ? C.stoneLight : C.stoneShade
				);
			}
		}
	}
	// The sill.
	rect(layer, x - 1, y + h, w + 2, 1, C.stoneLight);
	rect(layer, x - 1, y + h + 1, w + 2, 1, C.stoneShade);
}

/**
 * Tells whether a point lies inside a pointed lancet: straight sides under a two-centred arch whose apex is the top row.
 * @param {number} i - Column from the lancet's left edge
 * @param {number} j - Row from its top
 * @param {number} w - Its width
 * @returns {boolean}
 */
function inLancet(i, j, w) {
	if (i < 0 || i >= w || j < 0) {
		return false;
	}
	// The arch rises 0.87 of the width above its springing line; each side is a circle centred on the other's springing point.
	const spring = w * 0.87;
	if (j >= spring) {
		return true;
	}
	const dy = spring - j - 0.5;
	const left = Math.hypot(i + 0.5 - w, dy) <= w;
	const right = Math.hypot(i + 0.5, dy) <= w;
	return left && right;
}

/**
 * The wall seen through the bare warp, darkened by the cloth and the loom.
 * @param {Canvas} layer
 */
function drawBehind(layer) {
	for (let y = WEAVE.top; y < BEAM_BOTTOM; y++) {
		for (let x = WEAVE.left; x <= WEAVE.right; x++) {
			const colour = get(layer, x, y);
			set(layer, x, y, colour === C.stoneShade ? BEHIND_JOINT : BEHIND);
		}
	}
}

/**
 * The weaving's lower edge at a column: the last woven row.
 * @param {number} x
 * @returns {number}
 */
function fellRow(x) {
	for (let i = 0; i < FELL.length; i++) {
		if (x <= FELL[i].to) {
			// A one-pixel slope where two sections meet, as the weft steps up or down.
			const next = FELL[i + 1];
			if (next && x === FELL[i].to && next.row < FELL[i].row) {
				return FELL[i].row - 1;
			}
			return FELL[i].row;
		}
	}
	return FELL[FELL.length - 1].row;
}

/**
 * The loom: two heavy uprights on wide feet, the cloth beam on top and the warp beam below, both round, with wedges.
 * @param {Canvas} scene
 */
function drawLoom(scene) {
	for (const [n, left] of POSTS.entries()) {
		for (let y = 0; y < FLOOR + 3; y++) {
			set(scene, left, y, n === 0 ? C.timberLight : C.timber);
			set(scene, left + 1, y, n === 0 ? C.timberLight : C.timber);
			set(scene, left + 2, y, C.timber);
			set(scene, left + 3, y, C.timberShade);
		}
		// Grain down the post.
		for (let y = 2; y < FLOOR; y += 7) {
			rect(scene, left + 2, y, 1, 3, C.timberShade);
		}
		// The foot: a block lying on the floor, lit on top.
		rect(scene, left - 3, FLOOR, POST_WIDTH + 6, 3, C.timber);
		rect(scene, left - 3, FLOOR, POST_WIDTH + 6, 1, C.timberLight);
		rect(scene, left - 3, FLOOR + 2, POST_WIDTH + 6, 1, C.timberShade);
	}
	drawBeam(scene, BEAM_TOP);
	drawBeam(scene, BEAM_BOTTOM);
}

/**
 * One round beam across the loom, running through both uprights, its ends pinned by wedges.
 * @param {Canvas} scene
 * @param {number} top - Its first row
 */
function drawBeam(scene, top) {
	const tones = [
		C.timberLight,
		C.timberLight,
		C.timber,
		C.timberShade,
		C.wood,
	];
	for (let j = 0; j < BEAM_HEIGHT; j++) {
		rect(
			scene,
			POSTS[0] - 3,
			top + j,
			POSTS[1] + POST_WIDTH + 6 - POSTS[0],
			1,
			tones[j]
		);
	}
	// The end grain on the left, where the window lights it.
	rect(scene, POSTS[0] - 4, top + 1, 1, 3, C.sandShade);
	set(scene, POSTS[0] - 4, top + 2, C.timberLight);
	// Wedges through the beam's ends, outside each post.
	for (const x of [POSTS[0] - 2, POSTS[1] + POST_WIDTH + 1]) {
		rect(scene, x, top - 1, 1, BEAM_HEIGHT + 2, C.timberShade);
		set(scene, x, top - 1, C.timberLight);
	}
}

/**
 * The woven cloth: a red field scattered with tiny flowers, a blue border round it and the unicorn in the middle,
 * finished with the fine ribs of the warp showing through the weft.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawCloth(scene, random) {
	const { left, right, top } = WEAVE;
	for (let x = left; x <= right; x++) {
		const fell = fellRow(x);
		for (let y = top; y <= fell; y++) {
			set(scene, x, y, RED);
		}
	}
	drawBorder(scene);

	const unicorn = createCanvas(64, 64);
	drawUnicorn(unicorn);
	outline(unicorn, CONTOUR);
	copyInto(scene, unicorn);

	drawFlowers(scene, unicorn, random);
	drawSprigs(scene, unicorn, random);
	drawRibs(scene);
}

/**
 * The blue border along the top and both sides, with a gold rule on its inner edge and a running chain of dots.
 * @param {Canvas} scene
 */
function drawBorder(scene) {
	const { left, right, top } = WEAVE;
	for (let x = left; x <= right; x++) {
		const fell = fellRow(x);
		for (let y = top; y <= fell; y++) {
			const side = x < FIELD.left || x > FIELD.right;
			const head = y < FIELD.top;
			if (!side && !head) {
				continue;
			}
			let colour = BORDER;
			const inner =
				x === FIELD.left - 1 ||
				x === FIELD.right + 1 ||
				(y === FIELD.top - 1 && !side);
			const outer = x === left || x === right || y === top;
			if (inner && y >= FIELD.top - 1) {
				colour = C.gold;
			} else if (outer) {
				colour = BORDER_DARK;
			} else if ((x + y) % 4 === 0) {
				colour = (x + y) % 8 === 0 ? C.creamLight : C.gold;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Picks one of four tones for a point on a round body lit from the window, up and to the left.
 * @param {Tones} tones
 * @param {number} u - Across the body, -1 (left) to 1 (right)
 * @param {number} v - Down the body, -1 (top) to 1 (bottom)
 * @returns {Colour}
 */
function shade(tones, u, v) {
	const facing = -u * 0.6 - v * 0.75;
	if (facing > 0.42) {
		return tones[0];
	}
	if (facing > -0.25) {
		return tones[1];
	}
	if (facing > -0.65) {
		return tones[2];
	}
	return tones[3];
}

/**
 * Fills an ellipse, shaded as a round body.
 * @param {Canvas} canvas
 * @param {number} cx - Centre, in the unicorn's own coordinates
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Tones} tones
 */
function blob(canvas, cx, cy, rx, ry, tones) {
	for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
		for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
			const u = (x + 0.5 - cx) / rx;
			const v = (y + 0.5 - cy) / ry;
			if (u * u + v * v <= 1) {
				set(canvas, UNICORN.x + x, UNICORN.y + y, shade(tones, u, v));
			}
		}
	}
}

/**
 * Fills a capsule: every point within a radius of a segment, lit on its left edge.
 * @param {Canvas} canvas
 * @param {number} x0 - One end, in the unicorn's own coordinates
 * @param {number} y0
 * @param {number} x1 - The other end
 * @param {number} y1
 * @param {number} r - Its radius
 * @param {Tones} tones
 */
function limb(canvas, x0, y0, x1, y1, r, tones) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = dx * dx + dy * dy;
	for (
		let y = Math.floor(Math.min(y0, y1) - r);
		y <= Math.ceil(Math.max(y0, y1) + r);
		y++
	) {
		for (
			let x = Math.floor(Math.min(x0, x1) - r);
			x <= Math.ceil(Math.max(x0, x1) + r);
			x++
		) {
			const px = x + 0.5;
			const py = y + 0.5;
			const t = Math.max(
				0,
				Math.min(1, ((px - x0) * dx + (py - y0) * dy) / length)
			);
			const ex = px - (x0 + dx * t);
			const ey = py - (y0 + dy * t);
			if (ex * ex + ey * ey <= r * r) {
				set(
					canvas,
					UNICORN.x + x,
					UNICORN.y + y,
					shade(tones, ex / r, ey / r)
				);
			}
		}
	}
}

/**
 * The unicorn, prancing to the left with one foreleg raised: a goat's beard, a lion's tufted tail and a long gold horn.
 * Far legs first, in shade, then the body, the neck and the head, then the near legs.
 * @param {Canvas} uni
 */
function drawUnicorn(uni) {
	const far = /** @type {Tones} */ ([
		C.cream,
		C.cream,
		C.creamShade,
		C.creamShade,
	]);
	limb(uni, 13, 19, 13.5, 26.3, 1.1, far);
	limb(uni, 20.5, 18, 21.5, 22, 1.4, far);
	limb(uni, 21.5, 22, 20.5, 26.3, 1.0, far);

	// The tail first, so the rump overlaps its root: it rises, arcs over and drops to its tuft.
	for (const [x, y] of [
		[26, 13],
		[27, 12],
		[28, 11],
		[29, 11],
		[30, 12],
		[30, 13],
		[31, 14],
	]) {
		set(uni, UNICORN.x + x, UNICORN.y + y, C.cream);
	}
	blob(uni, 30.8, 16.5, 1.6, 2.2, COAT);

	blob(uni, 17.5, 15.8, 7.5, 4.1, COAT);
	blob(uni, 11.8, 15.8, 3.5, 3.8, COAT);
	blob(uni, 23, 15.2, 3.9, 4, COAT);
	limb(uni, 12.5, 14.5, 9.5, 9.2, 2.6, COAT);
	blob(uni, 8, 8, 2.6, 2.2, COAT);
	limb(uni, 7, 9.2, 3.4, 12, 1.55, COAT);
	limb(uni, 9.2, 6, 9.8, 4.2, 0.8, COAT);

	limb(uni, 10.5, 17.5, 5.5, 19, 1.3, COAT);
	limb(uni, 5.5, 19, 5.8, 22.5, 1.0, COAT);
	limb(uni, 24, 17, 25.5, 21.5, 1.6, COAT);
	limb(uni, 25.5, 21.5, 24.5, 26.3, 1.0, COAT);

	// The mane, rippling down the crest of the neck.
	for (let i = 0; i <= 6; i++) {
		const x = Math.round(10.6 + i * 0.62);
		const y = 6 + i;
		set(uni, UNICORN.x + x, UNICORN.y + y, i % 2 ? C.cream : C.creamShade);
		set(
			uni,
			UNICORN.x + x + 1,
			UNICORN.y + y,
			i % 2 ? C.creamShade : C.cream
		);
	}
	// The goat's beard under the chin.
	paint(uni, UNICORN.x + 5, UNICORN.y + 13, ['c', 'sc'], {
		c: C.cream,
		s: C.creamShade,
	});
	// Cloven hooves.
	for (const [x, y] of [
		[13, 27],
		[14, 27],
		[20, 27],
		[21, 27],
		[24, 27],
		[25, 27],
		[5, 23],
		[6, 23],
	]) {
		set(uni, UNICORN.x + x, UNICORN.y + y, x % 2 ? C.stone : C.stoneShade);
	}
	// The horn: a twist of gold rising from the brow, its spiral picked out in amber.
	for (let i = 0; i <= 6; i++) {
		const x = Math.round(6.5 - i * 0.8);
		const y = 5 - i;
		set(uni, UNICORN.x + x, UNICORN.y + y, i % 2 ? HORN[2] : HORN[1]);
		if (i < 3) {
			set(
				uni,
				UNICORN.x + x + 1,
				UNICORN.y + y,
				i % 2 ? HORN[1] : HORN[0]
			);
		}
	}
	// The eye and the nostril.
	set(uni, UNICORN.x + 7, UNICORN.y + 8, CONTOUR);
	set(uni, UNICORN.x + 3, UNICORN.y + 12, C.creamShade);
}

/**
 * Copies every painted pixel of one canvas onto another.
 * @param {Canvas} target
 * @param {Canvas} source
 */
function copyInto(target, source) {
	for (let i = 0; i < source.p.length; i++) {
		if (source.p[i]) {
			target.p[i] = source.p[i];
		}
	}
}

/**
 * The thousand flowers: tiny blossoms of four kinds on short green stems, scattered over the red wherever the unicorn is not.
 * @param {Canvas} scene
 * @param {Canvas} unicorn - The unicorn with its contour, kept clear
 * @param {() => number} random
 */
function drawFlowers(scene, unicorn, random) {
	const kinds = [
		{ petal: C.white, heart: C.gold },
		{ petal: BLUE, heart: C.creamLight },
		{ petal: PINK, heart: C.gold },
		{ petal: C.gold, heart: C.amber },
	];
	let n = 0;
	for (let gy = FIELD.top + 2; gy < 46; gy += 4) {
		for (let gx = FIELD.left + 1; gx <= FIELD.right - 1; gx += 4) {
			const x = gx + Math.floor(random() * 2) + ((gy / 4) % 2 ? 2 : 0);
			const y = gy + Math.floor(random() * 3) - 1;
			n++;
			if (!clearAround(scene, unicorn, x, y)) {
				continue;
			}
			const kind =
				kinds[(n * 3 + Math.floor(random() * 2)) % kinds.length];
			// A stem and a leaf, then the blossom: a heart with four petals, or a bud of three.
			set(scene, x, y + 2, LEAF);
			set(scene, x + (n % 2 ? 1 : -1), y + 2, C.pine);
			set(scene, x, y, kind.heart);
			set(scene, x - 1, y, kind.petal);
			set(scene, x + 1, y, kind.petal);
			set(scene, x, y - 1, kind.petal);
			if (n % 3) {
				set(scene, x, y + 1, kind.petal);
			} else {
				set(scene, x, y + 1, LEAF);
			}
		}
	}
}

/**
 * Single-pixel buds with a leaf under each, sown in the red still left between the flowers.
 * @param {Canvas} scene
 * @param {Canvas} unicorn
 * @param {() => number} random
 */
function drawSprigs(scene, unicorn, random) {
	const buds = [C.white, C.gold, BLUE, PINK];
	for (let i = 0; i < 60; i++) {
		const x =
			FIELD.left +
			1 +
			Math.floor(random() * (FIELD.right - FIELD.left - 1));
		const y = FIELD.top + 1 + Math.floor(random() * 33);
		let free = true;
		for (let j = -1; j <= 2 && free; j++) {
			for (let k = -1; k <= 1 && free; k++) {
				if (
					get(scene, x + k, y + j) !== RED ||
					get(unicorn, x + k, y + j)
				) {
					free = false;
				}
			}
		}
		if (free) {
			set(scene, x, y, buds[i % buds.length]);
			set(scene, x, y + 1, LEAF);
		}
	}
}

/**
 * Tells whether a small flower fits at a point: inside the woven red field and clear of the unicorn.
 * @param {Canvas} scene
 * @param {Canvas} unicorn
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function clearAround(scene, unicorn, x, y) {
	for (let j = -2; j <= 3; j++) {
		for (let i = -2; i <= 2; i++) {
			const own = Math.abs(i) <= 1 && j >= -1 && j <= 2;
			const near = Math.abs(i) <= 1 || (j >= -1 && j <= 2);
			if (near && get(unicorn, x + i, y + j)) {
				return false;
			}
			if (own && get(scene, x + i, y + j) !== RED) {
				return false;
			}
		}
	}
	return true;
}

/**
 * The ribs of the weave: every other row of weft a little darker, so the cloth reads as woven, not painted.
 * @param {Canvas} scene
 */
function drawRibs(scene) {
	for (let x = WEAVE.left; x <= WEAVE.right; x++) {
		const fell = fellRow(x);
		for (let y = WEAVE.top; y <= fell; y++) {
			if (get(scene, x, y) === RED && (x + y * 2) % 4 === 0) {
				set(scene, x, y, RED_WEFT);
			}
		}
	}
}

/**
 * The bare warp under the weaving: pale threads running down from the fell and wrapping round the warp beam.
 * @param {Canvas} scene
 */
function drawWarp(scene) {
	for (let x = WEAVE.left + 1; x < WEAVE.right; x += 2) {
		for (let y = fellRow(x) + 1; y < BEAM_BOTTOM + BEAM_HEIGHT; y++) {
			const onBeam = y >= BEAM_BOTTOM;
			let colour = x % 4 === 0 ? C.cream : C.creamShade;
			if (onBeam) {
				colour =
					y === BEAM_BOTTOM + BEAM_HEIGHT - 1
						? C.creamShade
						: C.cream;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The loose weft ends hanging from the fell, swaying a pixel as they fall.
 * @param {Canvas} scene
 */
function drawThreads(scene) {
	for (const { x, length, yarn } of YARNS) {
		const top = fellRow(x) + 1;
		for (let j = 0; j < length; j++) {
			set(scene, x + (j % 4 === 2 ? 1 : 0), top + j, yarn[0]);
		}
	}
}

/**
 * The pointed wooden bobbins wound with yarn at the ends of the longer threads.
 * @param {Canvas} ends
 */
function drawBobbins(ends) {
	for (const { x, length, yarn, bobbin } of YARNS) {
		if (bobbin) {
			drawBobbin(ends, x, fellRow(x) + 1 + length, yarn);
		}
	}
}

/**
 * One tapestry bobbin: a pointed wooden spindle with yarn wound thick round its middle.
 * @param {Canvas} ends
 * @param {number} x - Its middle column
 * @param {number} top - Its first row
 * @param {Colour[]} yarn - The yarn's colour and its shade
 */
function drawBobbin(ends, x, top, yarn) {
	set(ends, x, top, C.timberLight);
	for (let j = 1; j <= 4; j++) {
		set(
			ends,
			x - 1,
			top + j,
			j === 1 ? yarn[0] : mix(yarn[0], C.white, 0.35)
		);
		set(ends, x, top + j, yarn[0]);
		set(ends, x + 1, top + j, yarn[1]);
	}
	set(ends, x - 1, top + 5, C.timberLight);
	set(ends, x, top + 5, C.timber);
	set(ends, x, top + 6, C.timber);
	set(ends, x, top + 7, C.timberShade);
}

/**
 * A wicker basket of yarn balls on the floor by the window.
 * @param {Canvas} ends
 */
function drawBasket(ends) {
	const top = 56;
	for (let y = top; y < 64; y++) {
		const inset = y === top ? 1 : 0;
		for (let x = inset; x <= 9 - inset; x++) {
			let colour =
				(x + Math.floor((y - top) / 2) * 2) % 4 < 2
					? C.sand
					: C.sandShade;
			if (y === top) {
				colour = C.sandLight;
			} else if (x >= 8) {
				colour = C.timberLight;
			}
			set(ends, x, y, colour);
		}
	}
	// Balls of red, blue and gold yarn heaped in it.
	const balls = [
		{ x: 2.5, y: 54, tones: [C.brickRedLight, RED, C.brickRedShade] },
		{ x: 6.5, y: 54.5, tones: [mix(BLUE, C.white, 0.35), BLUE, C.daySky1] },
		{ x: 4.5, y: 52, tones: [C.lampGlow, C.gold, C.amber] },
	];
	for (const { x: cx, y: cy, tones } of balls) {
		for (let y = Math.floor(cy - 2); y <= Math.ceil(cy + 2); y++) {
			for (let x = Math.floor(cx - 2); x <= Math.ceil(cx + 2); x++) {
				const u = (x + 0.5 - cx) / 2.2;
				const v = (y + 0.5 - cy) / 2.2;
				if (u * u + v * v <= 1 && y < top) {
					const facing = -u * 0.7 - v * 0.6;
					set(
						ends,
						x,
						y,
						facing > 0.3
							? tones[0]
							: facing > -0.4
								? tones[1]
								: tones[2]
					);
				}
			}
		}
	}
}

/**
 * The daylight's brightest touches: the horn's tip and the sun on the near post.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	set(scene, UNICORN.x + 2, UNICORN.y + 1, C.white);
	set(scene, UNICORN.x + 6, UNICORN.y + 7, C.white);
	line(
		scene,
		POSTS[0],
		10,
		POSTS[0],
		40,
		mix(C.timberLight, C.sandLight, 0.5)
	);
}
