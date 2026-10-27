// Golem Minions: a hulking clay golem striding forward at dusk, amber light in its eyes and a glowing diamond on its chest, two small golems on the horizon behind it.
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

/**
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The first row of the ground. */
const HORIZON = 48;

/** The glowing diamond on the golem's chest: its centre and its reach. */
const MARK = { x: 31, y: 29, r: 3 };

/** The two eyes: the left end of each slit. */
const EYES = [
	{ x: 27, y: 14 },
	{ x: 34, y: 14 },
];

/** The fired clay the golem is made of, warm in the last light. */
const CLAY = {
	light: mix(C.sandShade, C.sand, 0.35),
	base: mix(C.timberLight, C.sandShade, 0.35),
	shade: mix(C.timber, C.timberShade, 0.25),
};

/** The cracks in the clay. */
const CRACK = mix(C.timberShade, C.ink, 0.35);

/** The dusk plain: its lit far edge, its ground and the golem's shadow on it. */
const FAR_GROUND = mix(C.headlandRidge, C.duskSky4, 0.35);
const GROUND = mix(C.headland, C.timberShade, 0.35);
const GROUND_SHADOW = mix(GROUND, C.ink, 0.45);

/** The small golems far off, dark against the sky. */
const MINION = mix(C.headlandRidge, C.duskSky2, 0.4);

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Golem Minions tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5821);

	drawSky(layer);
	drawGround(layer, random);
	drawMinions(layer);

	drawGolem(scene);
	drawCracks(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawMark(scene);
	drawEyes(scene);
	glow(scene, {
		x: MARK.x,
		y: MARK.y,
		radius: 9,
		colour: C.amber,
		strength: 0.35,
		steps: 2,
		skip: [C.ink, C.gold, C.lampGlow, C.white],
	});
	glow(scene, {
		x: 31,
		y: 14,
		radius: 7,
		colour: C.amber,
		strength: 0.3,
		steps: 1,
		skip: [C.ink, C.gold, C.lampGlow],
	});
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
 * Whether a pixel lies within a distance of a line segment: a limb with rounded ends.
 * @param {number} x
 * @param {number} y
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - The limb's half-width
 * @returns {boolean}
 */
function inCapsule(x, y, x0, y0, x1, y1, r) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const t = Math.max(
		0,
		Math.min(1, ((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy))
	);
	return Math.hypot(x - (x0 + t * dx), y - (y0 + t * dy)) < r;
}

/**
 * Whether a pixel lies inside a rounded block, a superellipse between an ellipse and a rectangle.
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} hw - Half its width
 * @param {number} hh - Half its height
 * @returns {boolean}
 */
function inBlock(x, y, cx, cy, hw, hh) {
	return Math.abs((x - cx) / hw) ** 3 + Math.abs((y - cy) / hh) ** 3 < 1;
}

/**
 * Paints a part lit from the upper left: lit along its upper-left edge, shaded along its lower-right edge,
 * with an ink line where it overlaps parts already painted behind it.
 * @param {Canvas} canvas
 * @param {Shape} shape
 * @param {Tones} tones
 */
function part(canvas, shape, tones) {
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
			if (!shape(x + 2, y + 2) || !shape(x + 3, y)) {
				colour = tones.shade;
			}
			if (!shape(x - 1, y - 1)) {
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
 * The dusk sky: six plain bands from deep violet at the top to orange at the horizon.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	const bands = [
		C.duskSky1,
		C.duskSky2,
		C.duskSky3,
		C.duskSky4,
		C.duskSky5,
		C.duskSky6,
	];
	for (let y = 0; y < HORIZON; y++) {
		const band = Math.min(5, Math.floor(y / 8));
		rect(layer, 0, y, 64, 1, bands[band]);
	}
}

/**
 * The bare plain: a lit strip at the horizon, dark ground, a few pebbles and the golem's shadow.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	rect(layer, 0, HORIZON, 64, 2, FAR_GROUND);
	rect(layer, 0, HORIZON + 2, 64, 64 - HORIZON - 2, GROUND);
	for (let x = 0; x < 64; x += 3) {
		set(layer, x + (x % 2), HORIZON + 2, FAR_GROUND);
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 4 + Math.floor(random() * (64 - HORIZON - 4));
		set(layer, x, y, FAR_GROUND);
	}
	// The shadow stretches towards the viewer, away from the sunset.
	for (let y = 52; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (((x - 34) / 19) ** 2 + ((y - 58.5) / 4.5) ** 2 < 1) {
				set(layer, x, y, GROUND_SHADOW);
			}
		}
	}
}

/**
 * Two small golems far off on the horizon, dark against the sunset, with amber dots for eyes.
 * @param {Canvas} layer
 */
function drawMinions(layer) {
	for (const x of [3, 55]) {
		// The head, the broad body, the arms hanging past the hips, and two stubby legs.
		rect(layer, x + 2, HORIZON - 9, 3, 2, MINION);
		rect(layer, x, HORIZON - 7, 7, 4, MINION);
		rect(layer, x, HORIZON - 3, 1, 2, MINION);
		rect(layer, x + 6, HORIZON - 3, 1, 2, MINION);
		rect(layer, x + 1, HORIZON - 3, 5, 1, MINION);
		rect(layer, x + 1, HORIZON - 2, 2, 2, MINION);
		rect(layer, x + 4, HORIZON - 2, 2, 2, MINION);
		set(layer, x + 2, HORIZON - 8, C.gold);
		set(layer, x + 4, HORIZON - 8, C.gold);
	}
}

/**
 * The golem, back to front: the far leg and arm, the body and its shoulders, the head, then the near leg and arm.
 * @param {Canvas} scene
 */
function drawGolem(scene) {
	// The far leg, stepping back, its foot higher up the ground.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 38, 38, 40, 49, 4.6) ||
			inBlock(x, y, 41, 52, 5.5, 2.8),
		CLAY
	);
	// The far arm, swinging back, its fist level with the hip.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 45, 23, 48, 36, 4.4) ||
			inBlock(x, y, 49, 40, 4.6, 4.2),
		CLAY
	);
	// The great barrel of the body, broad at the shoulders and narrowing to the hips.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[21, 16],
				[42, 16],
				[47, 22],
				[45, 31],
				[40, 41],
				[23, 41],
				[18, 31],
				[16, 22],
			]),
		CLAY
	);
	// The shoulders: two heavy lumps of clay.
	part(scene, (x, y) => inBlock(x, y, 19.5, 21, 6, 5.5), CLAY);
	part(scene, (x, y) => inBlock(x, y, 43.5, 21, 6, 5.5), CLAY);
	// The head, small for the body and sunk between the shoulders.
	part(scene, (x, y) => inBlock(x, y, 31.5, 13, 6.2, 5.6), CLAY);
	// The near leg, striding forward, its foot planted low and broad.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 26, 39, 24, 53, 5.2) ||
			inBlock(x, y, 24, 57.5, 7, 3.2),
		CLAY
	);
	// The near arm, swinging forward, its fist big and close.
	part(
		scene,
		(x, y) =>
			inCapsule(x, y, 18, 23, 14, 39, 4.8) ||
			inBlock(x, y, 14, 44, 5.5, 4.8),
		CLAY
	);
	// The heavy brow over the eyes.
	rect(scene, 27, 12, 10, 1, CLAY.shade);
	// The knuckles on each fist and the toes on each foot.
	for (const [x, y, n] of [
		[10, 45, 3],
		[46, 41, 2],
	]) {
		for (let i = 0; i < n; i++) {
			set(scene, x + i * 3, y, CRACK);
			set(scene, x + i * 3, y + 1, CRACK);
		}
	}
	for (const x of [21, 24, 27]) {
		set(scene, x, 58, CRACK);
		set(scene, x, 59, CRACK);
	}
	for (const x of [40, 43]) {
		set(scene, x, 53, CRACK);
	}
}

/**
 * The cracks where the clay has dried: short jagged lines on the body, the arms and the legs.
 * @param {Canvas} scene
 */
function drawCracks(scene) {
	for (const [x0, y0, x1, y1] of [
		[22, 30, 25, 34],
		[25, 34, 24, 37],
		[39, 19, 37, 23],
		[41, 33, 38, 36],
		[13, 31, 15, 34],
		[26, 46, 24, 49],
		[47, 27, 46, 30],
		[35, 9, 36, 11],
	]) {
		line(scene, x0, y0, x1, y1, CRACK);
	}
}

/**
 * The plain glowing diamond pressed into the chest: a dark groove, a gold rim and a bright heart.
 * @param {Canvas} scene
 */
function drawMark(scene) {
	for (let y = MARK.y - MARK.r - 1; y <= MARK.y + MARK.r + 1; y++) {
		for (let x = MARK.x - MARK.r - 1; x <= MARK.x + MARK.r + 1; x++) {
			const d = Math.abs(x - MARK.x) + Math.abs(y - MARK.y);
			if (d === MARK.r + 1) {
				set(scene, x, y, CRACK);
			} else if (d === MARK.r) {
				set(scene, x, y, C.gold);
			} else if (d > 0 && d < MARK.r) {
				set(scene, x, y, C.lampGlow);
			} else if (d === 0) {
				set(scene, x, y, C.white);
			}
		}
	}
}

/**
 * The eyes: two amber slits under the brow, bright at their hearts.
 * @param {Canvas} scene
 */
function drawEyes(scene) {
	for (const { x, y } of EYES) {
		rect(scene, x - 1, y - 1, 5, 3, C.ink);
		rect(scene, x, y, 3, 1, C.gold);
		set(scene, x + 1, y, C.lampGlow);
	}
}
