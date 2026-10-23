// Graffiti: a bright mural of a big cartoon eye in a pink bubble cloud, a yellow arrow, teal bubbles, stars and drips across a brick wall at night under a streetlight, a hand's spray can hissing out a lime mist in front.
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

/** A paint's three tones: its lit edge, its fill and its shaded edge. */
/** @typedef {{ lit: Colour, base: Colour, shade: Colour }} Paint */

/** The streetlight's bulb, hanging in from the top left on its arm. */
const LAMP = { x: 10, y: 7 };

/** The wall's foot: the plinth course starts at this row and the pavement below it. */
const PLINTH = 52;
const PAVEMENT = 55;

/** The pink bubble cloud: the circles it is made of, as [x, y, radius]. */
/** @type {[number, number, number][]} */
const CLOUD = [
	[16, 27, 9],
	[27, 20, 11],
	[38, 26, 9],
	[22, 32, 8],
	[34, 32, 8],
];

/** The drips running down from the cloud: [column, last row]. */
/** @type {[number, number][]} */
const DRIPS = [
	[12, 44],
	[19, 49],
	[29, 44],
	[37, 50],
];

/** The cartoon eye in the middle of the cloud: its centre and its half width and half height. */
const EYE = { x: 27, y: 25, rx: 12, ry: 7 };

/** The iris, glancing right towards the spray can. */
const IRIS = { x: 29, y: 25, r: 5 };

/** The teal bubbles rising on the right, as [x, y, radius]. */
/** @type {[number, number, number][]} */
const BUBBLES = [
	[56, 25, 4.5],
	[61, 33, 2.4],
];

/** The spray can held in front: its left and right columns, the top of its shoulder and the top of its body. */
const CAN = { left: 43, right: 54, shoulder: 38, body: 42 };

/** The rows of the lime label round the can. */
const LABEL = { top: 49, bottom: 57 };

/** The nozzle on the side of the can's actuator, where the mist comes out. */
const NOZZLE = { x: 47, y: 36 };

/** The mist: how far it carries, how steeply it falls and how fast its cone widens. */
const MIST = { reach: 20, fall: 0.2, spread: 0.5 };

/** The brick wall by night: three brick tones, the mortar, and each brick's top edge catching the lamp. */
const BRICK = mix(C.brickRedShade, C.night, 0.3);
const BRICK_ALT = mix(C.brickRed, C.night, 0.5);
const BRICK_DARK = mix(C.brickRedShade, C.night, 0.55);
const BRICK_TOP = mix(C.brickRed, C.night, 0.3);
const MORTAR = mix(C.stoneShade, C.night, 0.55);

/** The plinth and pavement: concrete by night, its slab joints and the plinth's lit edge. */
const SLAB = mix(C.stoneShade, C.night, 0.35);
const SLAB_DARK = mix(C.stoneShade, C.night, 0.6);
const SLAB_LIGHT = mix(C.stone, C.night, 0.25);
const PLINTH_TONE = mix(C.stoneShade, C.night, 0.45);

/** The mural's paints. */
const PINK = {
	lit: mix(C.brickRedLight, C.arcane, 0.35),
	base: mix(C.brickRed, C.arcane, 0.4),
	shade: mix(C.brickRedShade, C.arcaneShade, 0.4),
};
/** The brick courses showing faintly through the pink. */
const PINK_COURSE = mix(PINK.base, PINK.shade, 0.4);
const YELLOW = { lit: C.lampGlow, base: C.gold, shade: C.amber };
const TEAL = { lit: C.tealLight, base: C.teal, shade: C.tealShade };
const LIME = {
	lit: mix(C.grassLight, C.lampGlow, 0.45),
	base: mix(C.grassLight, C.gold, 0.2),
	shade: C.grass,
};

/** The spray can: brushed steel, lit from the lamp on its left. */
const STEEL = { lit: C.stoneLight, base: C.stone, shade: C.stoneShade };

/** The hand round the can and the hoodie sleeve it comes out of. */
const SKIN = {
	lit: mix(C.skinTan, C.skin, 0.5),
	base: C.skinTan,
	shade: C.skinTanShade,
};
const SLEEVE = { lit: C.roofLight, base: C.roof, shade: C.roofShade };

/**
 * Draws the Graffiti masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const random = seededRandom(5150);

	const layer = createCanvas(64, 64);
	drawWall(layer, random);
	drawPavement(layer);

	// The mural in three coats, each outlined on its own so the shapes part from one another.
	const back = createCanvas(64, 64);
	drawArrow(back);
	drawBubbles(back);
	drawStar(back, 8, 44, 6, YELLOW);
	drawStar(back, 43, 5, 3.5, PINK);
	drawLamp(back);
	outline(back, C.ink);
	underlay(back, layer);

	const cloud = createCanvas(64, 64);
	drawCloud(cloud);
	drawDrips(cloud);
	outline(cloud, C.ink);
	underlay(cloud, back);

	const eye = createCanvas(64, 64);
	drawEye(eye);
	outline(eye, C.ink);
	underlay(eye, cloud);

	// The hand behind the can, the can, and the fingers in front of it, each outlined on its own.
	const hand = createCanvas(64, 64);
	drawSleeve(hand);
	outline(hand, C.ink);
	underlay(hand, eye);

	const can = createCanvas(64, 64);
	drawCan(can);
	outline(can, C.ink);
	underlay(can, hand);

	const scene = createCanvas(64, 64);
	drawFingers(scene);
	outline(scene, C.ink);
	underlay(scene, can);

	glow(scene, {
		x: LAMP.x,
		y: LAMP.y,
		radius: 38,
		colour: C.lampGlow,
		strength: 0.35,
		steps: 3,
		skip: [
			C.ink,
			C.white,
			C.lampGlow,
			...Object.values(PINK),
			PINK_COURSE,
			...Object.values(YELLOW),
		],
	});
	drawBulb(scene);
	drawMist(scene, random);
	return scene;
}

/**
 * Tells whether a point lies inside the union of some circles.
 * @param {[number, number, number][]} circles - [x, y, radius] each
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inCircles(circles, x, y) {
	return circles.some(([cx, cy, r]) => Math.hypot(x - cx, y - cy) < r);
}

/**
 * Picks a paint's tone for a pixel of a shape by where the shape's edge lies: lit where the edge is just above or
 * to the left (towards the lamp), shaded where it is just below or to the right.
 * @param {(x: number, y: number) => boolean} within - Tells whether a point is in the shape
 * @param {number} x
 * @param {number} y
 * @param {Paint} paint
 * @returns {Colour}
 */
function toneAt(within, x, y, paint) {
	if (!within(x + 2, y + 2) || !within(x + 1, y + 1)) {
		return paint.shade;
	}
	if (!within(x - 1, y - 1)) {
		return paint.lit;
	}
	return paint.base;
}

/**
 * The brick wall: staggered courses of bricks in three tones, each lit along its top, with mortar between.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let course = 0; course * 4 < PLINTH; course++) {
		const top = course * 4;
		const offset = course % 2 ? 4 : 0;
		for (let start = -offset; start < 64; start += 8) {
			const pick = random();
			let tone = BRICK;
			if (pick > 0.75) {
				tone = BRICK_ALT;
			} else if (pick < 0.25) {
				tone = BRICK_DARK;
			}
			for (let y = top; y < top + 3; y++) {
				for (let x = start; x < start + 7; x++) {
					set(layer, x, y, y === top ? BRICK_TOP : tone);
				}
			}
			rect(layer, start + 7, top, 1, 3, MORTAR);
		}
		rect(layer, 0, top + 3, 64, 1, MORTAR);
	}
}

/**
 * The concrete plinth at the wall's foot and the pavement in front, its slabs laid in rows.
 * @param {Canvas} layer
 */
function drawPavement(layer) {
	rect(layer, 0, PLINTH, 64, PAVEMENT - PLINTH, PLINTH_TONE);
	rect(layer, 0, PLINTH, 64, 1, SLAB_LIGHT);
	for (let y = PAVEMENT; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = SLAB;
			if (y === PAVEMENT || y === 60) {
				colour = SLAB_DARK;
			} else if ((x + (y > 60 ? 7 : 0)) % 14 === 0) {
				colour = SLAB_DARK;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The streetlight: a dark arm in from the left edge carrying a hood over the bulb.
 * @param {Canvas} canvas
 */
function drawLamp(canvas) {
	// The arm: a pipe in from the left edge, with its collar where it meets the hood.
	rect(canvas, 0, 1, 5, 1, C.stoneShade);
	rect(canvas, 0, 2, 5, 1, C.roofShade);
	rect(canvas, 3, 0, 2, 4, C.roof);
	/** Each row of the hood: [first column, last column], top row first; it sweeps out longer at the bottom. */
	/** @type {[number, number][]} */
	const rows = [
		[6, 12],
		[5, 15],
		[5, 16],
		[6, 16],
	];
	rows.forEach(([from, to], row) => {
		for (let x = from; x <= to; x++) {
			let colour = C.roof;
			if (row === 0 || (row === 1 && x < 9)) {
				colour = C.roofLight;
			} else if (row === rows.length - 1) {
				colour = C.roofShade;
			}
			set(canvas, x, 1 + row, colour);
		}
	});
	rect(canvas, LAMP.x - 4, 5, 10, 1, C.gold);
}

/**
 * The bulb's glass, painted after the glow so it keeps its brightest colours.
 * @param {Canvas} scene
 */
function drawBulb(scene) {
	rect(scene, LAMP.x - 4, 5, 10, 1, C.lampGlow);
	rect(scene, LAMP.x - 2, 5, 5, 1, C.white);
	rect(scene, LAMP.x - 2, 6, 5, 1, C.lampGlow);
	set(scene, LAMP.x, 6, C.white);
}

/**
 * The pink bubble cloud the eye sits in, with a shine on each bubble's upper left and the brick courses showing
 * faintly through the paint.
 * @param {Canvas} canvas
 */
function drawCloud(canvas) {
	const within = (/** @type {number} */ x, /** @type {number} */ y) =>
		inCircles(CLOUD, x, y);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!within(x, y)) {
				continue;
			}
			let colour = toneAt(within, x, y, PINK);
			if (colour === PINK.base && y % 4 === 3) {
				colour = PINK_COURSE;
			}
			set(canvas, x, y, colour);
		}
	}
	// The shine: a short arc on each bubble's upper left.
	for (const [cx, cy, r] of CLOUD) {
		for (let a = 3.5; a <= 4.3; a += 0.12) {
			const x = Math.round(cx + Math.cos(a) * (r - 2.5));
			const y = Math.round(cy + Math.sin(a) * (r - 2.5));
			if (within(x - 1, y - 1)) {
				set(canvas, x, y, PINK.lit);
			}
		}
	}
}

/**
 * Pink drips running down the wall from the cloud's underside, each ending in a round bead.
 * @param {Canvas} canvas
 */
function drawDrips(canvas) {
	for (const [x, end] of DRIPS) {
		for (let y = 34; y <= end; y++) {
			set(canvas, x, y, PINK.base);
			set(canvas, x + 1, y, PINK.shade);
		}
		rect(canvas, x - 1, end, 3, 2, PINK.base);
		set(canvas, x - 1, end, PINK.lit);
		rect(canvas, x, end + 2, 2, 1, PINK.shade);
		set(canvas, x + 1, end + 1, PINK.shade);
	}
}

/**
 * The top edge of the eye's almond at a column.
 * @param {number} x
 * @returns {number} The row of the almond's first pixel.
 */
function eyeTop(x) {
	const t = (x - EYE.x) / EYE.rx;
	return Math.ceil(EYE.y - EYE.ry * (1 - t * t));
}

/**
 * The big cartoon eye: a white almond under a heavy lid, its teal iris glancing right, with three lashes above.
 * @param {Canvas} canvas
 */
function drawEye(canvas) {
	const { x: cx, y: cy, rx, ry } = EYE;
	for (let x = cx - rx; x <= cx + rx; x++) {
		const t = (x - cx) / rx;
		const half = ry * (1 - t * t);
		for (let y = Math.ceil(cy - half); y <= Math.floor(cy + half); y++) {
			const lid = y < cy - half + 2;
			let colour = C.creamLight;
			if (lid) {
				colour = C.creamShade;
			} else if (y > cy + half - 1.5 || x > cx + rx - 3) {
				colour = C.cream;
			}
			const d = Math.hypot(x - IRIS.x, y - IRIS.y);
			if (d < IRIS.r) {
				if (d < 2.4) {
					colour = C.ink;
				} else if (d > IRIS.r - 1.2 || lid) {
					colour = C.tealShade;
				} else if (x + y > IRIS.x + IRIS.y + 1) {
					colour = C.tealLight;
				} else {
					colour = C.teal;
				}
			}
			set(canvas, x, y, colour);
		}
	}
	// The pupil's catch lights.
	rect(canvas, IRIS.x - 2, IRIS.y - 2, 2, 2, C.white);
	set(canvas, IRIS.x + 2, IRIS.y + 2, C.white);
	// The heavy upper lid line, and three lashes fanning out above it.
	for (let x = cx - rx + 1; x <= cx + rx - 1; x++) {
		set(canvas, x, eyeTop(x) - 1, C.ink);
	}
	for (const [dx, tipX, tipY] of [
		[-7, -9, -3],
		[0, 0, -3],
		[7, 9, -3],
	]) {
		const y0 = eyeTop(cx + dx) - 1;
		line(canvas, cx + dx, y0, cx + tipX, y0 + tipY, C.ink);
		set(canvas, cx + dx + 1, y0 - 1, C.ink);
	}
}

/**
 * Tells whether a point lies in a polygon, by the even-odd rule.
 * @param {[number, number][]} points
 * @param {number} px
 * @param {number} py
 * @returns {boolean}
 */
function inPolygon(points, px, py) {
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
 * Paints a shape over the whole canvas in a paint's three tones.
 * @param {Canvas} canvas
 * @param {(x: number, y: number) => boolean} within - Tells whether a point is in the shape
 * @param {Paint} paint
 */
function fillShape(canvas, within, paint) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (within(x, y)) {
				set(canvas, x, y, toneAt(within, x, y, paint));
			}
		}
	}
}

/**
 * The yellow arrow bursting from behind the cloud and swooping up to the top right corner.
 * @param {Canvas} canvas
 */
function drawArrow(canvas) {
	/** @type {[number, number, number][]} */
	const shaft = [];
	for (let t = 0; t <= 1; t += 0.04) {
		const x = (1 - t) ** 2 * 40 + 2 * (1 - t) * t * 52 + t * t * 52;
		const y = (1 - t) ** 2 * 20 + 2 * (1 - t) * t * 20 + t * t * 10;
		shaft.push([x, y, 2.6]);
	}
	/** @type {[number, number][]} */
	const head = [
		[45, 12],
		[60, 0],
		[59, 15],
	];
	fillShape(
		canvas,
		(x, y) => inCircles(shaft, x, y) || inPolygon(head, x + 0.5, y + 0.5),
		YELLOW
	);
}

/**
 * The teal bubbles rising on the right, each with a white shine.
 * @param {Canvas} canvas
 */
function drawBubbles(canvas) {
	for (const bubble of BUBBLES) {
		fillShape(canvas, (x, y) => inCircles([bubble], x, y), TEAL);
		const [cx, cy, r] = bubble;
		set(canvas, Math.round(cx - r / 2), Math.round(cy - r / 2), C.white);
	}
}

/**
 * A five-pointed star.
 * @param {Canvas} canvas
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} r - The points' reach
 * @param {Paint} paint
 */
function drawStar(canvas, cx, cy, r, paint) {
	/** @type {[number, number][]} */
	const points = [];
	for (let i = 0; i < 10; i++) {
		const a = -Math.PI / 2 + (i * Math.PI) / 5;
		const reach = i % 2 ? r * 0.45 : r;
		points.push([
			cx + 0.5 + Math.cos(a) * reach,
			cy + 0.5 + Math.sin(a) * reach,
		]);
	}
	fillShape(canvas, (x, y) => inPolygon(points, x + 0.5, y + 0.5), paint);
}

/**
 * Picks a tone across the can for a column, lit on its left towards the lamp, with a bright streak of shine.
 * @param {number} x
 * @param {Paint} paint
 * @returns {Colour}
 */
function canTone(x, paint) {
	const u = (x - CAN.left) / (CAN.right - CAN.left);
	if (u < 0.12) {
		return paint.base;
	}
	if (u < 0.42) {
		return paint.lit;
	}
	if (u < 0.75) {
		return paint.base;
	}
	return paint.shade;
}

/**
 * The spray can: a steel body with a lime label, its rolled lip, its domed shoulder and the lime actuator on top.
 * @param {Canvas} canvas
 */
function drawCan(canvas) {
	const { left, right, shoulder, body } = CAN;
	for (let y = body; y < 64; y++) {
		const label = y >= LABEL.top && y <= LABEL.bottom;
		for (let x = left; x <= right; x++) {
			let colour = canTone(x, label ? LIME : STEEL);
			if (y === LABEL.top || y === LABEL.bottom) {
				colour = canTone(x, STEEL);
				colour = colour === STEEL.lit ? C.white : STEEL.shade;
			}
			set(canvas, x, y, colour);
		}
		// The shine running down the steel.
		if (y < LABEL.top || y > LABEL.bottom) {
			set(canvas, left + 3, y, C.white);
		}
	}
	// The rolled lip at the top of the body.
	for (let x = left; x <= right; x++) {
		set(canvas, x, body, x < left + 7 ? C.white : STEEL.base);
	}
	// The domed shoulder narrowing to the valve.
	for (let row = 0; row < body - shoulder; row++) {
		const inset = body - shoulder - row;
		for (let x = left + inset; x <= right - inset; x++) {
			set(canvas, x, shoulder + row, canTone(x, STEEL));
		}
	}
	// The actuator: a small lime button with its nozzle facing left.
	rect(canvas, NOZZLE.x, NOZZLE.y - 1, 5, 3, LIME.base);
	rect(canvas, NOZZLE.x + 4, NOZZLE.y - 1, 1, 3, LIME.shade);
	set(canvas, NOZZLE.x + 1, NOZZLE.y - 1, LIME.lit);
	set(canvas, NOZZLE.x, NOZZLE.y, C.ink);
}

/**
 * The hand behind the can and the hoodie sleeve it comes out of, running off the bottom right corner.
 * @param {Canvas} canvas
 */
function drawSleeve(canvas) {
	// The back of the hand, showing past the can's right side, rounded over the knuckles.
	for (let y = 41; y <= 54; y++) {
		const to = CAN.right + (y < 43 ? 4 : 6);
		for (let x = CAN.right + 1; x <= to; x++) {
			let colour = SKIN.base;
			if (x === to || y === 54) {
				colour = SKIN.shade;
			} else if (y === 41 || x === CAN.right + 1) {
				colour = SKIN.lit;
			}
			set(canvas, x, y, colour);
		}
	}
	// The knuckles' creases.
	for (const y of [45, 49]) {
		set(canvas, CAN.right + 2, y, SKIN.shade);
		set(canvas, CAN.right + 3, y, SKIN.shade);
	}
	// The sleeve's ribbed cuff and the arm going off the corner.
	for (let y = 53; y < 64; y++) {
		const from = CAN.right + 1 + Math.max(0, 3 - Math.floor((y - 53) / 2));
		for (let x = from; x < 64; x++) {
			let colour = SLEEVE.base;
			if (y < 56) {
				colour = x % 2 ? SLEEVE.lit : SLEEVE.base;
			} else if (x === from) {
				colour = SLEEVE.lit;
			} else if (x > 60 || y > 60) {
				colour = SLEEVE.shade;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The fingers in front of the can: the index finger crooked over the shoulder onto the actuator,
 * and the other fingertips curled round the can's left side.
 * @param {Canvas} canvas
 */
function drawFingers(canvas) {
	// The index finger, up from the knuckle beside the shoulder and hooked over onto the actuator.
	const knuckle = CAN.right + 1;
	const top = NOZZLE.y - 3;
	for (let y = top + 1; y <= CAN.body; y++) {
		set(canvas, knuckle, y, SKIN.lit);
		set(canvas, knuckle + 1, y, SKIN.shade);
	}
	for (let x = NOZZLE.x + 1; x <= knuckle; x++) {
		set(canvas, x, top, SKIN.lit);
		set(canvas, x, top + 1, x === knuckle ? SKIN.lit : SKIN.base);
	}
	set(canvas, knuckle + 1, top + 1, SKIN.base);
	set(canvas, NOZZLE.x + 1, top + 1, SKIN.shade);
	// The fingertips round the left edge.
	for (const y of [45, 48, 51]) {
		rect(canvas, CAN.left - 1, y, 2, 2, SKIN.base);
		set(canvas, CAN.left - 1, y, SKIN.lit);
		set(canvas, CAN.left, y + 1, SKIN.shade);
	}
}

/**
 * The lime mist hissing out of the nozzle in a widening cone towards the wall, thick by the nozzle and thinning out.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawMist(scene, random) {
	const { reach, fall, spread } = MIST;
	for (let y = NOZZLE.y - reach; y <= NOZZLE.y + reach; y++) {
		for (let x = NOZZLE.x - reach; x < NOZZLE.x; x++) {
			const dx = NOZZLE.x - x;
			const dy = y - NOZZLE.y - dx * fall;
			const d = Math.hypot(dx, dy);
			if (d > reach || Math.abs(dy) > dx * spread + 0.5) {
				continue;
			}
			const core = Math.abs(dy) < dx * spread * 0.5;
			const density = (1 - d / reach) * (core ? 1.7 : 1);
			if (random() > density) {
				continue;
			}
			let colour = LIME.base;
			if (d < 3.5) {
				colour = C.white;
			} else if (d < 9 && core) {
				colour = LIME.lit;
			}
			set(scene, x, y, colour);
		}
	}
	// A few droplets flung past the cone.
	for (let i = 0; i < 6; i++) {
		const x = NOZZLE.x - 6 - Math.floor(random() * 16);
		const y = NOZZLE.y + Math.floor(random() * 12);
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, LIME.base);
		}
	}
}
