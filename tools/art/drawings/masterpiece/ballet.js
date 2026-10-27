// Ballet: a ballerina in a white tutu and pink pointe shoes holding an arabesque en pointe in a daylit rehearsal studio, a wooden barre on the wall, a tall window behind her and a spare pair of shoes on the boards.
import {
	createCanvas,
	get,
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
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The first row of the floor. */
const FLOOR = 48;

/** The tall window on the left: its box, frame included. */
const WINDOW = { x: 2, y: 3, w: 15, h: 40 };

/** The barre's row, and the columns of its two brackets. */
const BARRE = { y: 33, from: WINDOW.x + WINDOW.w + 2, brackets: [26, 56] };

/** The cool studio wall, palest by the window. */
const WALL_LIGHT = mix(C.cloudShade, C.creamLight, 0.4);
const WALL = mix(C.cloudShade, C.stoneLight, 0.45);
const WALL_SHADE = mix(C.stoneLight, C.stoneMid, 0.3);
const WALL_DEEP = mix(C.stoneLight, C.stoneMid, 0.6);
const WALL_MOTTLE = mix(WALL, WALL_SHADE, 0.5);

/** A glint of light on the window glass. */
const GLINT = mix(C.daySky6, C.white, 0.6);

/** The painted window frame. */
const FRAME = { light: C.white, base: C.cream, shade: C.creamShade };

/** The pale honey floorboards, and the sunlight falling on them. */
const BOARD_LIGHT = mix(C.sandLight, C.timberLight, 0.3);
const BOARD = mix(C.sand, C.timberLight, 0.5);
const BOARD_SHADE = mix(C.timberLight, C.timber, 0.35);
const BOARD_GRAIN = mix(BOARD, BOARD_SHADE, 0.5);
const BOARD_SUN = mix(C.sandLight, C.lampGlow, 0.6);
const BOARD_SUN_JOINT = mix(BOARD_LIGHT, C.sand, 0.4);

/** The barre's pale wood and its iron brackets. */
const BARRE_WOOD = {
	light: mix(C.timberLight, C.sandLight, 0.45),
	base: C.timberLight,
	shade: C.timber,
};

/** The dancer's skin, lit from the window. */
const SKIN = { light: C.skin, base: C.skinTan, shade: C.skinTanShade };

/** Pink tights over the legs. */
const TIGHTS = {
	light: mix(C.skin, C.white, 0.35),
	base: mix(C.skin, C.brickRedLight, 0.18),
	shade: mix(C.skinShade, C.brickRedLight, 0.15),
};

/** Pink satin pointe shoes and their ribbons. */
const SATIN = {
	light: mix(C.brickRedLight, C.white, 0.7),
	base: mix(C.brickRedLight, C.white, 0.45),
	shade: mix(C.brickRedLight, C.skinShade, 0.45),
};

/** The white bodice and the tulle of the tutu, shaded cool. */
const WHITE = { light: C.white, base: C.creamLight, shade: C.cloudShade };
const TULLE_FOLD = mix(C.cloudShade, C.stoneLight, 0.45);
const TULLE_DEEP = mix(C.stoneLight, C.creamShade, 0.4);
const EMBROIDERY = mix(C.gold, C.creamLight, 0.5);

/** The hair, drawn back into a bun. */
const HAIR = { light: C.timber, base: C.timberShade, shade: C.wood };

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Ballet masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6113);

	drawWall(layer, random);
	drawWindow(layer, random);
	drawBarre(layer);
	drawShaft(layer);
	drawFloor(layer, random);

	drawDancer(scene);
	drawSpareShoes(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawFace(scene);
	return scene;
}

/**
 * Whether a point lies inside a polygon, testing the pixel's centre.
 * @param {number} x
 * @param {number} y
 * @param {readonly (readonly [number, number])[]} points
 * @returns {boolean}
 */
function inPolygon(x, y, points) {
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
	return inside;
}

/**
 * Whether a pixel lies within a distance of a line segment whose width tapers from one end to the other: a limb.
 * @param {number} x
 * @param {number} y
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r0 - The half-width at the first end
 * @param {number} [r1] - The half-width at the second end; the first by default
 * @returns {boolean}
 */
function inLimb(x, y, x0, y0, x1, y1, r0, r1 = r0) {
	const px = x + 0.5;
	const py = y + 0.5;
	const dx = x1 - x0;
	const dy = y1 - y0;
	const t = Math.max(
		0,
		Math.min(1, ((px - x0) * dx + (py - y0) * dy) / (dx * dx + dy * dy))
	);
	return (
		Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy)) < r0 + (r1 - r0) * t
	);
}

/**
 * Whether a pixel lies inside an ellipse, optionally turned about its centre.
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {number} [turn=0] - The turn in radians, clockwise on the canvas
 * @returns {boolean}
 */
function inEllipse(x, y, cx, cy, rx, ry, turn = 0) {
	const dx = x + 0.5 - cx;
	const dy = y + 0.5 - cy;
	const u = dx * Math.cos(turn) + dy * Math.sin(turn);
	const v = -dx * Math.sin(turn) + dy * Math.cos(turn);
	return (u / rx) ** 2 + (v / ry) ** 2 < 1;
}

/**
 * Paints a part lit from the window on the upper left: lit along its upper-left edge, shaded along its
 * lower-right edge, with an ink line where it overlaps parts already painted behind it.
 * @param {Canvas} canvas
 * @param {Shape} shape
 * @param {Tones} tones
 * @param {number} [depth=1] - How deep the shade reaches in from the lower-right edge
 */
function part(canvas, shape, tones, depth = 1) {
	/** @type {[number, number][]} */
	const seams = [];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!shape(x, y)) {
				if (
					get(canvas, x, y) &&
					NEIGHBOURS.some(([dx, dy]) => shape(x + dx, y + dy))
				) {
					seams.push([x, y]);
				}
				continue;
			}
			let colour = tones.base;
			if (!shape(x + depth, y + depth) || !shape(x + depth + 1, y)) {
				colour = tones.shade;
			}
			if (!shape(x - 1, y - 1) || !shape(x - 1, y)) {
				colour = tones.light;
			}
			set(canvas, x, y, colour);
		}
	}
	for (const [x, y] of seams) {
		set(canvas, x, y, C.ink);
	}
}

/**
 * The studio wall: cool plaster, palest by the window and deepening away from it in soft rings, with a faint
 * mottle and a skirting board at its foot.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	const tones = [WALL_LIGHT, WALL, WALL_SHADE, WALL_DEEP];
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			// Rings round the window, their edges dithered by a pixel.
			const reach = Math.hypot(x - 9, (y - 22) * 0.8) + ((x + y) % 2);
			const ring = Math.min(
				3,
				Math.max(0, Math.floor((reach - 14) / 13))
			);
			set(layer, x, y, tones[ring]);
		}
	}
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (FLOOR - 4));
		set(layer, x, y, WALL_MOTTLE);
	}
	// The cornice under the ceiling.
	rect(layer, 0, 0, 64, 1, WALL_DEEP);
	rect(layer, 0, 1, 64, 1, C.creamLight);
	rect(layer, 0, FLOOR - 3, 64, 1, C.cream);
	rect(layer, 0, FLOOR - 2, 64, 1, C.creamShade);
	rect(layer, 0, FLOOR - 1, 64, 1, WALL_DEEP);
}

/**
 * The shaft of daylight slanting from the window down to the floor, a faint brightening of the wall behind it.
 * @param {Canvas} layer
 */
function drawShaft(layer) {
	for (let y = WINDOW.y + 6; y < FLOOR - 3; y++) {
		for (let x = WINDOW.x + WINDOW.w; x < 64; x++) {
			const colour = get(layer, x, y);
			if (
				colour &&
				inPolygon(x, y, [
					[WINDOW.x + WINDOW.w, WINDOW.y + 6],
					[WINDOW.x + WINDOW.w + 9, WINDOW.y + 6],
					[WINDOW.x + WINDOW.w + 28, FLOOR],
					[WINDOW.x + WINDOW.w + 8, FLOOR],
				])
			) {
				set(layer, x, y, mix(colour, C.lampGlow, 0.45));
			}
		}
	}
}

/**
 * The tall window: a round-headed white frame of small panes, the day sky with one cloud behind it,
 * and a deep sill.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const { x, y, w, h } = WINDOW;
	const cx = x + (w - 1) / 2;
	const r = (w - 1) / 2;
	/** @type {Shape} */
	const opening = (px, py) =>
		px >= x &&
		px < x + w &&
		py < y + h &&
		(py >= y + r || Math.hypot(px - cx, py - (y + r)) <= r + 0.3);
	/** @type {Shape} */
	const glass = (px, py) =>
		opening(px, py) &&
		opening(px - 1, py) &&
		opening(px + 1, py) &&
		opening(px, py - 1) &&
		py < y + h - 1;
	const sky = [C.daySky3, C.daySky4, C.daySky5, C.daySky6];
	for (let py = y; py < y + h; py++) {
		for (let px = x; px < x + w; px++) {
			if (!opening(px, py)) {
				continue;
			}
			if (!glass(px, py)) {
				set(layer, px, py, px < cx ? FRAME.light : FRAME.shade);
				continue;
			}
			const band = Math.min(3, Math.floor(((py - y) / h) * 4.4));
			set(layer, px, py, sky[band]);
		}
	}
	// One soft cloud drifting across the upper panes.
	for (const [cx0, cy0, rx, ry] of [
		[8, 14, 4, 1.6],
		[11, 13, 3, 1.8],
		[13, 15, 3, 1.2],
	]) {
		for (let py = y; py < y + h; py++) {
			for (let px = x; px < x + w; px++) {
				if (glass(px, py) && inEllipse(px, py, cx0, cy0, rx, ry)) {
					set(layer, px, py, py > cy0 ? C.cloudShade : C.white);
				}
			}
		}
	}
	// Glints on the glass, slanting across two panes.
	for (const [gx, gy] of [
		[5, 27],
		[6, 26],
		[7, 25],
		[12, 37],
		[13, 36],
	]) {
		if (glass(gx, gy)) {
			set(layer, gx, gy, GLINT);
		}
	}
	// The far treetops at the foot of the panes.
	for (let px = x + 1; px < x + w - 1; px++) {
		const top =
			y + h - 6 + Math.floor(random() * 2) + (px % 3 === 0 ? 1 : 0);
		for (let py = top; py < y + h - 1; py++) {
			if (glass(px, py)) {
				set(layer, px, py, py === top ? C.pineLight : C.pine);
			}
		}
	}
	// The glazing bars: one upright and a crossbar every eight rows, lit on their left.
	for (let py = y + 2; py < y + h - 1; py++) {
		set(layer, Math.round(cx), py, FRAME.base);
	}
	for (let py = y + Math.round(r) + 1; py < y + h - 2; py += 8) {
		for (let px = x + 1; px < x + w - 1; px++) {
			set(layer, px, py, FRAME.base);
		}
	}
	// The sill, deep enough to cast a shadow on the wall below it.
	rect(layer, x - 1, y + h, w + 2, 1, FRAME.light);
	rect(layer, x - 1, y + h + 1, w + 2, 1, FRAME.shade);
	rect(layer, x, y + h + 2, w, 1, WALL);
}

/**
 * The barre: a pale wooden rail on two iron brackets, casting a thin shadow on the wall.
 * @param {Canvas} layer
 */
function drawBarre(layer) {
	const { y, from, brackets } = BARRE;
	for (const bx of brackets) {
		rect(layer, bx, y + 2, 2, 3, C.stoneShade);
		rect(layer, bx - 1, y + 5, 4, 1, C.roofShade);
		set(layer, bx, y + 2, C.stoneLight);
		set(layer, bx + 2, y + 3, WALL_DEEP);
		set(layer, bx + 2, y + 4, WALL_DEEP);
	}
	rect(layer, from, y, 64 - from, 1, BARRE_WOOD.light);
	rect(layer, from, y + 1, 64 - from, 1, BARRE_WOOD.base);
	rect(layer, from, y + 2, 64 - from, 1, BARRE_WOOD.shade);
	rect(layer, from + 1, y + 3, 64 - from, 1, WALL_DEEP);
	set(layer, from, y + 1, BARRE_WOOD.shade);
}

/**
 * The floorboards: pale honey planks running across the room, darker by the wall, with the window's
 * sunlight laid across them and the dancer's soft shadow to the right of her foot.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	let joint = 0;
	for (let y = FLOOR; y < 64; y++) {
		const row = y - FLOOR;
		if (row % 4 === 0) {
			joint = Math.floor(random() * 20);
		}
		for (let x = 0; x < 64; x++) {
			let colour = row < 2 ? BOARD_SHADE : BOARD;
			if (row % 4 === 3 || (x + joint) % 21 === 0) {
				colour = BOARD_SHADE;
			} else if (row % 4 === 0 && row >= 4) {
				colour = BOARD_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	// The grain, a few dark flecks in the boards.
	for (let i = 0; i < 24; i++) {
		const x = Math.floor(random() * 64);
		const y = FLOOR + 3 + Math.floor(random() * (64 - FLOOR - 3));
		if (get(layer, x, y) === BOARD) {
			set(layer, x, y, BOARD_GRAIN);
			set(layer, x + 1, y, BOARD_GRAIN);
		}
	}
	// The window's light, thrown long across the boards towards the right.
	/** @type {Shape} */
	const sun = (x, y) =>
		y >= FLOOR + 2 &&
		inPolygon(x, y, [
			[3, FLOOR + 1],
			[17, FLOOR + 1],
			[44, 64],
			[16, 64],
		]);
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!sun(x, y)) {
				continue;
			}
			const seam = get(layer, x, y) === BOARD_SHADE;
			set(layer, x, y, seam ? BOARD_SUN_JOINT : BOARD_SUN);
		}
	}
	// The dancer's shadow, cast forward and away from the window.
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (
				inLimb(x, y, 32, 57.5, 41, 61.5, 1.2, 0.9) ||
				inEllipse(x, y, 45, 61.5, 6, 1.3, 0.12)
			) {
				set(layer, x, y, sun(x, y) ? BOARD : BOARD_SHADE);
			}
		}
	}
}

/**
 * A worn pair of pointe shoes left on the sunlit boards, toe boxes to the left, their ribbons trailing.
 * Painted on the foreground so they take the outline.
 * @param {Canvas} scene
 */
function drawSpareShoes(scene) {
	const rows = [
		'.LLLLLL....',
		'LllllllLd..',
		'lbbbbbbbbdd',
		'.bbbbbbbb..',
		'...........',
		'...LLLLLL..',
		'..LllllllLd',
		'..lbbbbbbbb',
		'...bbbbbbb.',
	];
	paint(scene, 3, 53, rows, {
		L: SATIN.light,
		l: SATIN.base,
		b: SATIN.shade,
		d: C.brickRedShade,
	});
	// The ribbons, loose on the boards.
	line(scene, 14, 55, 18, 56, SATIN.base);
	line(scene, 19, 57, 21, 56, SATIN.base);
	line(scene, 14, 59, 17, 61, SATIN.base);
}

/**
 * The dancer, back to front: the far arm, the raised leg, the standing leg en pointe, the bodice,
 * the tutu, the near arm and the head.
 * @param {Canvas} scene
 */
function drawDancer(scene) {
	// The far arm, opened back over the raised leg.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 31, 21.5, 38, 21, 1.5, 1.25) ||
			inLimb(x, y, 38, 21, 45, 22.5, 1.25, 0.9) ||
			inEllipse(x, y, 46.3, 22.8, 1.6, 0.9, 0.2),
		SKIN
	);
	// The raised leg, stretched straight back and up in the arabesque.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 33, 31, 44, 28.5, 2.5, 1.7) ||
			inLimb(x, y, 44, 28.5, 53, 26, 1.7, 1.1),
		TIGHTS
	);
	// Its pointed foot in its satin shoe.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 52.5, 26, 59, 24, 1.3, 0.8) &&
			!inLimb(x, y, 33, 31, 44, 28.5, 2.5, 1.7),
		SATIN
	);
	// The standing leg, straight and turned out.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 30.5, 31, 31, 43, 2.6, 1.9) ||
			inLimb(x, y, 31, 43, 31.5, 52, 1.9, 1.1) ||
			inEllipse(x, y, 32.2, 46, 1.4, 3.2),
		TIGHTS
	);
	// The pointe shoe, standing on the very tip of its toe box.
	part(
		scene,
		(x, y) => inLimb(x, y, 31.5, 51.5, 31.5, 56.5, 1.3, 1.05) && y <= 57,
		SATIN
	);
	// The ribbons crossed over the ankle.
	set(scene, 30, 51, SATIN.light);
	set(scene, 31, 52, SATIN.light);
	set(scene, 32, 51, SATIN.shade);
	set(scene, 52, 26, SATIN.light);
	set(scene, 53, 25, SATIN.light);
	// The neck and the bare shoulders.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 28.5, 16.5, 29.5, 21, 1.4) ||
			inEllipse(x, y, 30, 21.5, 3, 1.6),
		SKIN
	);
	// The fitted bodice, leaning a little forward over the hips.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[26.5, 21.5],
				[33, 21.5],
				[34, 25],
				[33.5, 31],
				[28.5, 31],
				[27, 26],
			]),
		WHITE
	);
	// Its seams and a few sequins catching the light.
	line(scene, 29, 25, 31, 30, C.cloudShade);
	set(scene, 28, 23, C.lampGlow);
	set(scene, 30, 27, C.gold);
	set(scene, 32, 24, C.lampGlow);
	drawTutu(scene);
	// The near arm, reaching forward towards the window, a little above the shoulder.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 28, 21.5, 20, 18.5, 1.5, 1.2) ||
			inLimb(x, y, 20, 18.5, 12.5, 16, 1.2, 0.85) ||
			inEllipse(x, y, 11.2, 15.6, 1.8, 0.95, -0.35),
		SKIN
	);
	// The head, tipped up to follow the hand.
	part(scene, (x, y) => inEllipse(x, y, 27.2, 13.6, 3.3, 3.7), SKIN);
	// The hair, smoothed back from the face into a bun at the crown.
	part(
		scene,
		(x, y) =>
			(inEllipse(x, y, 27.2, 13.6, 3.5, 3.9) &&
				(y < 12 || x > 27) &&
				!(x < 26 && y > 10)) ||
			inEllipse(x, y, 31.3, 10.6, 2.2, 2.1),
		HAIR
	);
	// The bun's band and lit strands sweeping back from the brow.
	set(scene, 30, 11, C.gold);
	set(scene, 30, 10, C.amber);
	line(scene, 25, 10, 28, 10, HAIR.light);
	line(scene, 28, 12, 29, 13, HAIR.light);
	set(scene, 32, 9, HAIR.light);
}

/**
 * The tutu: a flat disc of stiff tulle seen almost edge on, its back tipped up with the raised leg,
 * lit on top and layered underneath in scalloped frills.
 * @param {Canvas} scene
 */
function drawTutu(scene) {
	const cx = 31;
	const cy = 31.5;
	const turn = -0.13;
	/** @type {Shape} */
	const disc = (x, y) => inEllipse(x, y, cx, cy, 12.8, 3.3, turn);
	part(scene, disc, WHITE);
	for (let y = 24; y < 40; y++) {
		for (let x = 16; x < 48; x++) {
			if (!disc(x, y)) {
				continue;
			}
			// The distance below the disc's middle, measured across its tilt.
			const v =
				-(x + 0.5 - cx) * Math.sin(turn) +
				(y + 0.5 - cy) * Math.cos(turn);
			if (v > 1.4) {
				// The frilled underside: a scallop every three columns.
				set(scene, x, y, x % 3 === 0 ? TULLE_DEEP : TULLE_FOLD);
			} else if (v > 0.3) {
				set(scene, x, y, x % 3 === 1 ? C.cloudShade : C.creamLight);
			} else if (v < -1.6) {
				set(scene, x, y, C.white);
			} else if ((x + 1) % 4 === 0) {
				// The pleats of the top layer, radiating from the waist.
				set(scene, x, y, C.cloudShade);
			}
		}
	}
	// The waist, where the bodice meets the tulle, and gold embroidery on the top layer.
	line(scene, 28, 30, 33, 30, C.cloudShade);
	for (const [x, y] of [
		[22, 31],
		[25, 30],
		[36, 29],
		[39, 29],
		[42, 28],
	]) {
		set(scene, x, y, C.gold);
		set(scene, x + 1, y, EMBROIDERY);
	}
}

/**
 * The face in profile, looking along the reaching hand: an eye, a rosy cheek and the lips.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	set(scene, 25, 13, C.wood);
	set(scene, 24, 12, C.timberShade);
	set(scene, 26, 15, mix(C.skinTan, C.brickRedLight, 0.35));
	set(scene, 24, 16, C.brickRedShade);
	set(scene, 23, 14, C.skinTan);
}
