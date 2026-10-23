// Birdwatching Perch: from inside the wooden hide at dawn, black-and-brass field glasses lie on the plank sill of the viewing slot, lenses to the viewer, while a grey heron lands in the reeds of a misty pond beyond.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from the edge facing the dawn to the edge away from it.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the light
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the light
 */

/** The viewing slot, both ends included: the pond shows through it. */
const SLOT = { x0: 6, y0: 6, x1: 57, y1: 45 };

/** The sill: its lit top surface, then its front edge, then the shadow it throws on the wall below. */
const SILL = { top: 46, edge: 49, shadow: 51 };

/** The far bank's waterline, where the pond begins. */
const SHORE = 31;

/** The low sun, just risen over the trees on the left. */
const SUN = { x: 15, y: 15, r: 4 };

/** The heron's body centre; the rest of the bird is measured from it. */
const HERON = { x: 42, y: 32 };

/** The field glasses: the left lens's centre, and how far the right lens sits from it. */
const GLASSES = { x: 11, y: 41, gap: 10 };

/** Each barrel: where its eyepiece end lies from its lens, and its radius at the lens and at the eyepiece. */
const BARREL = { back: { x: 9, y: -5 }, front: 4.6, rear: 3.4 };

/** The pale dawn sky from the top of the slot to the bank, cool above and warm low down, each with its paler halo near the sun. */
const SKY = [
	mix(C.daySky6, C.duskSky4, 0.3),
	mix(C.duskSky4, C.cream, 0.55),
	mix(C.duskSky5, C.cream, 0.55),
	mix(C.duskSky6, C.creamLight, 0.55),
];
const HALO = SKY.map((colour) => mix(colour, C.lampGlow, 0.45));

/** The trees on the far bank, the further row paler in the mist, and the mist lying in front of them. */
const TREES_FAR = mix(C.roofLight, C.cream, 0.38);
const TREES = mix(C.roofLight, C.pineShade, 0.3);
const MIST = mix(C.creamLight, C.duskSky6, 0.2);
const MIST_THIN = mix(MIST, TREES, 0.4);

/** The pond mirroring the sky, from the far bank towards the hide, and its ripples. */
const POND = [
	mix(C.duskSky6, C.creamLight, 0.45),
	mix(C.duskSky5, C.cream, 0.5),
	mix(C.duskSky4, C.stoneLight, 0.55),
];
const RIPPLE = mix(C.creamLight, C.duskSky6, 0.3);

/** Reeds and bulrush heads in the soft light. */
const REED = mix(C.forestFloorShade, C.duskSky3, 0.3);
const REED_LIT = mix(C.grassShade, C.duskSky6, 0.35);
const BULRUSH = mix(C.timber, C.duskSky3, 0.2);

/** The hide's planks, in the shade inside it, and their edges lit by the dawn through the slot. */
const PLANK = C.timberShade;
const PLANK_DARK = mix(C.timberShade, C.wood, 0.55);
const PLANK_GAP = mix(C.wood, C.night, 0.45);
const PLANK_LIT = mix(C.timber, C.duskSky6, 0.25);
const EDGE_LIT = mix(C.timberLight, C.duskSky6, 0.35);
const SILL_MID = mix(C.timberLight, C.timber, 0.35);
const SUNLIT = [
	mix(EDGE_LIT, C.lampGlow, 0.45),
	mix(SILL_MID, C.duskSky6, 0.35),
	mix(C.timber, C.duskSky6, 0.3),
];

/** The grey heron: pale coverts, grey flight feathers, black primaries, a white neck and a grey body. */
const PALE = mix(C.stoneLight, C.creamLight, 0.45);
const COVERTS = {
	glint: mix(C.stoneLight, C.creamLight, 0.7),
	lit: PALE,
	base: mix(C.stoneLight, C.creamLight, 0.2),
	shade: C.stoneLight,
	dark: C.stone,
};
const UNDERWING = {
	glint: C.stoneMid,
	lit: C.stoneShade,
	base: C.stoneShade,
	shade: mix(C.stoneShade, C.night, 0.3),
	dark: mix(C.stoneShade, C.night, 0.3),
};
const FEATHERS = {
	glint: C.stone,
	lit: C.stone,
	base: C.stoneMid,
	shade: C.stoneMid,
	dark: C.stoneShade,
};
const QUILL = mix(C.stoneShade, C.night, 0.45);
const PRIMARIES = {
	glint: C.stoneMid,
	lit: C.stoneShade,
	base: QUILL,
	shade: QUILL,
	dark: QUILL,
};
const NECK = {
	glint: C.creamLight,
	lit: C.creamLight,
	base: mix(C.creamLight, C.stoneLight, 0.35),
	shade: C.stoneLight,
	dark: C.stoneLight,
};
const BODY = {
	glint: PALE,
	lit: C.stoneLight,
	base: C.stoneLight,
	shade: C.stone,
	dark: C.stoneMid,
};
const BILL = mix(C.gold, C.amber, 0.45);
const LEG = mix(C.amber, C.timberLight, 0.5);
const LEG_SHADE = mix(C.timber, C.wood, 0.3);

/** The brass rings of the field glasses, lit from the slot, their black leather barrels, and the lens glass. */
const BRASS = {
	glint: mix(C.gold, C.lampGlow, 0.5),
	lit: C.gold,
	base: C.brass,
	shade: mix(C.brass, C.lampFrame, 0.55),
	dark: C.lampFrame,
};
const LEATHER = mix(C.wood, C.night, 0.35);
const LEATHER_LIT = mix(C.wood, C.timber, 0.45);
const LENS = mix(C.duskSky3, C.night, 0.55);
const LENS_LIT = mix(C.duskSky4, C.night, 0.2);

/** The leather strap trailing off the sill. */
const STRAP = mix(C.brickRedShade, C.timber, 0.5);
const STRAP_LIT = mix(C.brickRed, C.timberLight, 0.45);

/**
 * Draws the Birdwatching Perch landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(70413);

	drawSky(layer);
	drawSun(layer);
	drawFarBank(layer, random);
	drawPond(layer, random);
	drawMist(layer);
	drawReeds(layer, random);

	// The heron, the hide and the glasses are each outlined on their own, so each stands clear of what lies behind.
	const bird = createCanvas(64, 64);
	drawHeron(bird);
	outline(bird, C.ink);
	underlay(bird, layer);
	drawLegs(bird);

	const hide = createCanvas(64, 64);
	drawWalls(hide, random);
	drawSill(hide, random);
	outline(hide, C.ink);
	underlay(hide, bird);

	const glasses = createCanvas(64, 64);
	drawFieldGlasses(glasses);
	outline(glasses, C.ink);
	underlay(glasses, hide);
	drawSunPatch(glasses);
	drawStrap(glasses);
	return glasses;
}

/**
 * Adds a polygon's pixels to a mask, testing each pixel's centre.
 * @param {Mask} mask
 * @param {[number, number][]} points
 */
function polygon(mask, points) {
	const xs = points.map(([x]) => x);
	const ys = points.map(([, y]) => y);
	for (let y = Math.floor(Math.min(...ys)); y <= Math.max(...ys); y++) {
		for (let x = Math.floor(Math.min(...xs)); x <= Math.max(...xs); x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			let inside = false;
			for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
				const [xi, yi] = points[i];
				const [xj, yj] = points[j];
				if (
					yi > py !== yj > py &&
					px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
				) {
					inside = !inside;
				}
			}
			if (inside) {
				mask.add(`${x},${y}`);
			}
		}
	}
}

/**
 * Adds a round-ended stroke along a line of points to a mask.
 * @param {Mask} mask
 * @param {[number, number][]} points
 * @param {number} radius
 */
function stroke(mask, points, radius) {
	for (let i = 0; i + 1 < points.length; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
		for (let s = 0; s <= steps; s++) {
			const cx = x0 + ((x1 - x0) * s) / steps;
			const cy = y0 + ((y1 - y0) * s) / steps;
			for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
				for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
					if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) <= radius) {
						mask.add(`${x},${y}`);
					}
				}
			}
		}
	}
}

/**
 * Adds a tilted ellipse to a mask.
 * @param {Mask} mask
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {number} angle - The tilt in radians, clockwise
 */
function ellipse(mask, cx, cy, rx, ry, angle) {
	const reach = Math.ceil(Math.max(rx, ry)) + 1;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	for (let y = Math.floor(cy - reach); y <= cy + reach; y++) {
		for (let x = Math.floor(cx - reach); x <= cx + reach; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			const u = dx * cos + dy * sin;
			const v = -dx * sin + dy * cos;
			if ((u / rx) ** 2 + (v / ry) ** 2 <= 1) {
				mask.add(`${x},${y}`);
			}
		}
	}
}

/**
 * Paints a mask lit from the upper left, where the dawn sun stands: a glint and a lit band
 * on the edges facing it, shade on the edges away from it.
 * @param {Canvas} canvas
 * @param {Mask} mask
 * @param {Tone} tone
 */
function fill(canvas, mask, tone) {
	for (const key of mask) {
		const [x, y] = key.split(',').map(Number);
		const has = (/** @type {number} */ dx, /** @type {number} */ dy) =>
			mask.has(`${x + dx},${y + dy}`);
		let colour = tone.base;
		if (!has(-1, 0) || !has(0, -1)) {
			colour = tone.glint;
		} else if (!has(-2, 0) || !has(0, -2)) {
			colour = tone.lit;
		} else if (!has(1, 0) || !has(0, 1)) {
			colour = tone.dark;
		} else if (!has(2, 0) || !has(0, 2)) {
			colour = tone.shade;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * The dawn sky, dithered where one band gives way to the next and paler in a ring round the sun.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= SHORE; y++) {
		const t =
			(Math.max(0, y - SLOT.y0) / (SHORE - SLOT.y0)) * (SKY.length - 1);
		const i = Math.min(SKY.length - 1, Math.floor(t));
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			const band = dither ? i + 1 : i;
			const near = Math.hypot(x - SUN.x, y - SUN.y) < SUN.r + 6;
			set(layer, x, y, near ? HALO[band] : SKY[band]);
		}
	}
}

/**
 * The low sun, a pale disc softened by the mist.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - SUN.r; y <= SUN.y + SUN.r; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d <= SUN.r + 0.3) {
				set(layer, x, y, d < SUN.r - 1 ? C.creamLight : C.lampGlow);
			}
		}
	}
}

/**
 * Two rows of round tree crowns on the far bank, the further row paler in the mist.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFarBank(layer, random) {
	/** @type {[Colour, number, number][]} */
	const rows = [
		[TREES_FAR, 27, 3],
		[TREES, SHORE + 1, 2],
	];
	for (const [colour, base, smallest] of rows) {
		for (let cx = -2; cx < 68; cx += 4 + Math.floor(random() * 4)) {
			const r = smallest + Math.floor(random() * 3);
			const cy = base - r - Math.floor(random() * 2);
			for (let y = cy - r; y <= SHORE; y++) {
				for (let x = cx - r; x <= cx + r; x++) {
					if (y >= cy || Math.hypot(x - cx, y - cy) <= r + 0.3) {
						set(layer, x, y, colour);
					}
				}
			}
		}
	}
}

/**
 * The pond: the dawn sky mirrored in still water, a few ripple lines and the sun's reflection.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPond(layer, random) {
	for (let y = SHORE + 1; y < 64; y++) {
		const t = ((y - SHORE - 1) / (SLOT.y1 - SHORE)) * (POND.length - 1);
		const i = Math.min(POND.length - 1, Math.floor(t));
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < POND.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? POND[i + 1] : POND[i]);
		}
	}
	for (let i = 0; i < 12; i++) {
		const y = SHORE + 3 + Math.floor(random() * (SLOT.y1 - SHORE - 3));
		const x = 20 + Math.floor(random() * 40);
		rect(layer, x, y, 3 + Math.floor(random() * 5), 1, RIPPLE);
	}
	for (let y = SHORE + 2; y <= SLOT.y1; y += 2) {
		const half = Math.max(0, 2 - Math.floor((y - SHORE) / 5));
		rect(layer, SUN.x - half + (y % 3) - 1, y, half * 2 + 2, 1, C.lampGlow);
	}
}

/**
 * A bank of mist lying on the water along the far shore, hiding the foot of the trees, its top edge frayed.
 * @param {Canvas} layer
 */
function drawMist(layer) {
	for (let x = 0; x < 64; x++) {
		const top = SHORE - 4 + Math.round(Math.sin(x * 0.19 + 1) * 1.5);
		const bottom = SHORE + 3 + Math.round(Math.sin(x * 0.27) * 1.2);
		for (let y = top - 2; y <= bottom; y++) {
			if (y >= top) {
				set(layer, x, y, MIST);
			} else if (y === top - 1 || Math.sin(x * 0.7) > 0.2) {
				set(layer, x, y, MIST_THIN);
			}
		}
	}
}

/**
 * Reeds and bulrushes along the near edge of the pond, where the heron comes down.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawReeds(layer, random) {
	for (const [from, to, tallest] of [
		[24, 57, 9],
		[6, 14, 6],
	]) {
		for (let x = from; x <= to; x++) {
			if (random() < 0.3) {
				continue;
			}
			// Short reeds under the heron, so its legs stay clear.
			const under = Math.abs(x - HERON.x + 2) < 6;
			const h = under ? 2 : 3 + Math.floor(random() * tallest);
			const lean = random() < 0.3 ? 1 : 0;
			for (let j = 0; j < h; j++) {
				set(
					layer,
					x + (j > h - 3 ? lean : 0),
					SLOT.y1 - j,
					x % 3 ? REED : REED_LIT
				);
			}
			if (random() < 0.2) {
				rect(layer, x + lean, SLOT.y1 - h - 2, 1, 3, BULRUSH);
			}
		}
	}
}

/**
 * The grey heron coming in to land: wings raised high, neck in an S, legs reaching for the reeds.
 * @param {Canvas} bird
 */
function drawHeron(bird) {
	const { x: ox, y: oy } = HERON;
	/**
	 * Moves points measured from the heron's body centre onto the canvas.
	 * @param {[number, number][]} points
	 * @returns {[number, number][]}
	 */
	const at = (points) => points.map(([x, y]) => [ox + x, oy + y]);
	/**
	 * Draws dark quills from one point to another, both measured from the body centre.
	 * @param {[number, number, number, number][]} list
	 */
	const quills = (list) => {
		for (const [x0, y0, x1, y1] of list) {
			line(bird, ox + x0, oy + y0, ox + x1, oy + y1, QUILL);
		}
	};

	// The far wing, raised just ahead of the near one: only its shaded leading edge and fingered tip show.
	/** @type {Mask} */
	const farWing = new Set();
	polygon(
		farWing,
		at([
			[-2, -2],
			[-5, -8],
			[-6, -14],
			[-6, -20],
			[-5, -25],
			[-2, -25],
			[0, -19],
			[1, -12],
			[1, -2],
		])
	);
	fill(bird, farWing, UNDERWING);
	quills([
		[-6, -22, -8, -27],
		[-5, -24, -6, -28],
		[-3, -25, -3, -28],
	]);

	/** @type {Mask} */
	const body = new Set();
	ellipse(body, ox, oy, 7, 3.6, -0.4);
	polygon(
		body,
		at([
			[5, -1],
			[11, 3],
			[5, 3],
		])
	);
	fill(bird, body, BODY);

	// The near wing, raised up and back: pale coverts along its leading edge,
	// grey flight feathers behind them and black primaries fanned at its tip.
	/** @type {Mask} */
	const flight = new Set();
	polygon(
		flight,
		at([
			[-1, -2],
			[0, -9],
			[2, -15],
			[5, -20],
			[9, -24],
			[13, -21],
			[14, -15],
			[12, -9],
			[9, -4],
			[5, 0],
			[2, 1],
		])
	);
	fill(bird, flight, FEATHERS);
	// The trailing edge's feather tips.
	for (let y = -14; y <= -2; y += 3) {
		const x = Math.round(13 - (y + 14) * 0.6);
		set(bird, ox + x, oy + y, C.stoneShade);
	}
	/** @type {Mask} */
	const coverts = new Set();
	polygon(
		coverts,
		at([
			[-1, -2],
			[0, -9],
			[2, -15],
			[5, -19],
			[8, -16],
			[8, -11],
			[6, -6],
			[3, -1],
		])
	);
	fill(bird, coverts, COVERTS);
	/** @type {Mask} */
	const primaries = new Set();
	polygon(
		primaries,
		at([
			[5, -20],
			[9, -24],
			[12, -25],
			[14, -21],
			[14, -16],
			[10, -16],
		])
	);
	fill(bird, primaries, PRIMARIES);
	quills([
		[10, -24, 11, -28],
		[12, -23, 14, -27],
		[13, -21, 16, -24],
		[14, -18, 16, -19],
	]);

	// The neck, drawn back in an S, and the head turned to the water.
	/** @type {Mask} */
	const neck = new Set();
	stroke(
		neck,
		at([
			[-5, -2],
			[-8, -3],
			[-10, -5],
			[-10, -8],
			[-8, -10],
			[-8, -12],
			[-10, -14],
		]),
		1.25
	);
	ellipse(neck, ox - 12, oy - 15.5, 3, 2.1, 0);
	fill(bird, neck, NECK);
	// The head: a white crown and cheek round the dark eye, and the black crest stripe running back from
	// above the eye into the trailing plume, set inside the white so the outline can't swallow it.
	paint(
		bird,
		ox - 15,
		oy - 18,
		['.wwww.', 'wwkkkk', 'wwewww', 'wwwwws', '.wwwss'],
		{ w: NECK.lit, k: C.night, e: C.ink, s: NECK.shade }
	);
	line(bird, ox - 9, oy - 17, ox - 6, oy - 15, C.night);
	// Then the streaks down the front of the neck.
	for (const [x, y] of [
		[-9, -12],
		[-11, -7],
		[-9, -4],
	]) {
		set(bird, ox + x, oy + y, C.stoneMid);
	}
	// The dagger bill.
	line(bird, ox - 15, oy - 16, ox - 23, oy - 14, BILL);
	line(bird, ox - 15, oy - 15, ox - 20, oy - 14, C.amber);
}

/**
 * The heron's long legs swung forward for the landing, toes spread. They skip the outline,
 * which would knot two thin legs into one dark bar.
 * @param {Canvas} bird
 */
function drawLegs(bird) {
	const { x: ox, y: oy } = HERON;
	for (const [x0, x1, foot] of [
		[-2, -6, 11],
		[2, -1, 12],
	]) {
		line(bird, ox + x0, oy + 3, ox + x1, oy + foot, LEG);
		line(bird, ox + x0 + 1, oy + 4, ox + x1 + 1, oy + foot, LEG_SHADE);
		set(bird, ox + x1 - 1, oy + foot + 1, LEG_SHADE);
		set(bird, ox + x1 + 1, oy + foot + 1, LEG_SHADE);
	}
}

/**
 * The hide's plank walls round the slot: a lintel beam above, posts at either side and the wall below the sill.
 * @param {Canvas} hide
 * @param {() => number} random
 */
function drawWalls(hide, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const inSlot =
				x >= SLOT.x0 && x <= SLOT.x1 && y >= SLOT.y0 && y <= SLOT.y1;
			if (inSlot) {
				continue;
			}
			// Vertical boards five pixels wide, a dark gap between each and a knot here and there.
			const board = Math.floor((x + 2) / 5);
			const gap = (x + 2) % 5 === 0;
			let colour = board % 2 ? PLANK : PLANK_DARK;
			if (gap || (x * 7 + y * 3 + board * 5) % 17 === 0) {
				colour = PLANK_GAP;
			}
			set(hide, x, y, colour);
		}
	}
	// Grain running down the boards, in streaks a few pixels long.
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const n = 2 + Math.floor(random() * 4);
		for (let j = 0; j < n; j++) {
			const colour = get(hide, x, y + j);
			if (colour === PLANK || colour === PLANK_DARK) {
				set(hide, x, y + j, colour === PLANK ? PLANK_LIT : PLANK);
			}
		}
	}
	// The lintel beam over the slot, its top edge catching a little light.
	rect(hide, 0, SLOT.y0 - 4, 64, 4, PLANK);
	rect(hide, 0, SLOT.y0 - 4, 64, 1, PLANK_LIT);
	rect(hide, 0, SLOT.y0 - 1, 64, 1, PLANK_DARK);
	for (let x = 2; x < 64; x += 7 + Math.floor(random() * 4)) {
		rect(hide, x, SLOT.y0 - 3, 3, 1, PLANK_DARK);
	}
	for (const x of [3, 31, 60]) {
		set(hide, x, SLOT.y0 - 2, C.stoneShade);
	}
	// The posts either side of the slot, their inner edges lit.
	rect(hide, SLOT.x0 - 1, SLOT.y0, 1, SLOT.y1 - SLOT.y0 + 1, EDGE_LIT);
	rect(hide, SLOT.x0 - 2, SLOT.y0, 1, SLOT.y1 - SLOT.y0 + 1, PLANK_LIT);
	rect(hide, SLOT.x1 + 1, SLOT.y0, 1, SLOT.y1 - SLOT.y0 + 1, PLANK_LIT);
}

/**
 * The plank sill: a shelf along the wall, its top lit by the dawn, its front edge in shade.
 * @param {Canvas} hide
 * @param {() => number} random
 */
function drawSill(hide, random) {
	const top = [EDGE_LIT, SILL_MID, C.timber];
	for (let y = SILL.top; y < SILL.edge; y++) {
		rect(hide, 0, y, 64, 1, top[y - SILL.top]);
	}
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 58);
		rect(
			hide,
			x,
			SILL.top + 1 + Math.floor(random() * 2),
			4,
			1,
			C.timberShade
		);
	}
	rect(hide, 0, SILL.edge, 64, 1, C.timberShade);
	rect(hide, 0, SILL.edge + 1, 64, 1, PLANK_DARK);
	rect(hide, 0, SILL.shadow, 64, 2, PLANK_GAP);
}

/**
 * Field glasses laid on the sill in three-quarter view, their lenses turned towards the viewer:
 * two black barrels running back to the right, brass rings round the lenses and at the eyepieces,
 * and a hinge with a focus wheel between them.
 * @param {Canvas} glasses
 */
function drawFieldGlasses(glasses) {
	const { x, y, gap } = GLASSES;
	// The left barrel first: the right one's lens stands in front of its back end.
	drawBarrel(glasses, x, y);
	// The hinge bridging the barrels halfway along, and the focus wheel on it.
	rect(glasses, x + 4, y - 3, gap - 3, 2, LEATHER);
	rect(glasses, x + 4, y - 3, gap - 3, 1, LEATHER_LIT);
	paint(glasses, x + 7, y - 6, ['glg', 'bsb', 'sds'], {
		g: BRASS.glint,
		l: BRASS.lit,
		b: BRASS.base,
		s: BRASS.shade,
		d: BRASS.dark,
	});
	drawBarrel(glasses, x + gap, y - 1);
}

/**
 * One barrel lying on its side: a round lens in a brass ring at the front, the black body running back
 * up to the right, and a brass ring at the eyepiece end.
 * @param {Canvas} glasses
 * @param {number} cx - The lens's centre column
 * @param {number} cy - The lens's centre row
 */
function drawBarrel(glasses, cx, cy) {
	const { back, front: rf, rear: rb } = BARREL;
	const length = Math.hypot(back.x, back.y);
	const ax = back.x / length;
	const ay = back.y / length;
	for (let y = cy - 8; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 12; x++) {
			const px = x + 0.5 - cx;
			const py = y + 0.5 - cy;
			const t = (px * ax + py * ay) / length;
			// Distance from the barrel's axis, signed so it grows towards the lit upper left.
			const side = px * ay - py * ax;
			const radius = rf + (rb - rf) * Math.min(1, Math.max(0, t));
			const toFront = Math.hypot(px, py);
			const toBack = Math.hypot(px - back.x, py - back.y);
			const onBody = t >= 0 && t <= 1 && Math.abs(side) <= radius;
			if (toFront <= rf) {
				set(glasses, x, y, lensColour(px, py, toFront));
			} else if (onBody || toBack <= rb) {
				let colour =
					Math.abs(side) > radius - 1.2 && side > 0
						? LEATHER_LIT
						: LEATHER;
				if (t > 0.86) {
					colour =
						side > radius - 1.5
							? BRASS.glint
							: side > 0
								? BRASS.lit
								: BRASS.shade;
				} else if (side < -radius + 1) {
					colour = C.night;
				}
				set(glasses, x, y, colour);
			}
		}
	}
}

/**
 * The colour of a point on a barrel's front: a brass ring, lit on its upper left, round dark glass with two glints.
 * @param {number} px - Columns from the lens's centre
 * @param {number} py - Rows from the lens's centre
 * @param {number} distance - From the lens's centre
 * @returns {Colour}
 */
function lensColour(px, py, distance) {
	if (distance > BARREL.front - 1.1) {
		const lit = px + py < 0;
		return lit ? (px < 0 && py < 0 ? BRASS.glint : BRASS.lit) : BRASS.shade;
	}
	if (Math.hypot(px + 1, py + 1) < 1) {
		return C.creamLight;
	}
	if (Math.hypot(px - 1.2, py - 1.2) < 0.8) {
		return LENS_LIT;
	}
	return LENS;
}

/**
 * The low sun through the slot: a warm patch on the sill's top, broken by the shadows the lenses throw to the right.
 * @param {Canvas} canvas
 */
function drawSunPatch(canvas) {
	for (let y = SILL.top; y < SILL.edge; y++) {
		for (let x = SLOT.x0; x <= SLOT.x1 - 6; x++) {
			const shadow = [GLASSES.x + 4, GLASSES.x + GLASSES.gap + 4].some(
				(sx) => x > sx && x <= sx + 3 + (y - SILL.top)
			);
			const colour = get(canvas, x, y);
			if (colour === C.ink) {
				continue;
			}
			set(canvas, x, y, shadow ? C.timberShade : SUNLIT[y - SILL.top]);
		}
	}
}

/**
 * The leather strap, looping from the glasses over the sill's edge and down the wall.
 * @param {Canvas} canvas
 */
function drawStrap(canvas) {
	for (let t = 0; t <= 1; t += 0.02) {
		const x = Math.round(GLASSES.x + 2 + t * 17);
		const y = Math.round(45 + Math.sin(t * Math.PI) * 13);
		set(canvas, x, y, STRAP);
		set(canvas, x, y - 1, STRAP_LIT);
	}
}
