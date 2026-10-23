// Modern Dance: a barefoot dancer in a flowing red dress caught mid-leap on a bare stage, the skirt swirling behind her, a spotlight from the right and a glowing dusk backdrop.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The first row of the stage floor. */
const STAGE = 45;

/** Where the spotlight hangs, off the top right corner, and the pool it throws on the stage. */
const SPOT = { x: 66, y: -4 };
const POOL = { x: 31, y: 55.5, rx: 20, ry: 4.8 };

/** The dancer's centre, where the backdrop glows brightest behind her. */
const HALO = { x: 31, y: 24 };

/** The backdrop, from the top down: dusk deepening to a warm glow at its foot. */
const BACKDROP = [
	C.duskSky1,
	C.duskSky2,
	C.duskSky3,
	C.duskSky4,
	C.duskSky5,
	C.duskSky6,
];
const GROUNDROW = mix(C.duskSky6, C.gold, 0.45);

/** The black masking curtains at the sides of the stage. */
const DRAPE = { light: C.roof, base: C.roofShade, shade: C.night };

/** The black stage floor, the backdrop's glow on it and the spotlight's pool. */
const FLOOR = mix(C.night, C.roofShade, 0.5);
const FLOOR_SEAM = C.night;
const FLOOR_SHEEN = mix(C.roofShade, C.duskSky4, 0.45);
const POOL_LIGHT = mix(C.floorShade, C.amber, 0.36);
const POOL_CORE = mix(C.floorShade, C.gold, 0.5);
const POOL_SEAM = mix(C.floorShade, C.amber, 0.25);
const POOL_EDGE = mix(FLOOR, C.amber, 0.22);
const SHADOW = mix(C.floorShade, C.amber, 0.1);

/** Deep skin, lit warm from the spotlight on the right. */
const SKIN = {
	light: mix(C.skinDeep, C.skinTan, 0.55),
	base: C.skinDeep,
	shade: C.skinDeepShade,
};
const SKIN_RIM = mix(C.skinTan, C.gold, 0.35);

/** The red dress: its tones, a deep fold and the hot edge where the spotlight catches it. */
const DRESS = {
	light: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};
const DRESS_DEEP = mix(C.brickRedShade, C.night, 0.35);
const DRESS_RIM = mix(C.brickRedLight, C.gold, 0.45);

/** The long black hair, lifted by the leap, with a violet sheen. */
const HAIR = {
	light: C.roofLight,
	base: mix(C.night, C.roof, 0.35),
	shade: C.night,
};

/** The lips. */
const LIPS = mix(C.brickRedShade, C.skinDeep, 0.35);

/**
 * The head in profile, a rounded skull with the face turned up towards the leap and the light.
 * h hair, H its sheen, L lit skin, S skin, d shaded skin and the ear, b the brow, e the eye, n the nose
 * tip in the light, m the lips and g the gold earring.
 */
const HEAD = [
	'...hhhhh...',
	'.hhhhhhhH..',
	'hhhhhhHLLL.',
	'hhhhhHLLLL.',
	'hhhhSLLbLL.',
	'hhhdSSSeLL.',
	'hhhddSSSSLn',
	'.hhhdSSSSS.',
	'.hhgddSSSm.',
	'..h..dSSSS.',
	'.....ddSS..',
];

/** Where the head sprite's top-left corner sits. */
const HEAD_AT = { x: 28, y: 5 };

/**
 * An arm's joints, from the shoulder out: the shoulder, the elbow, the wrist and the middle of the hand.
 * @typedef {{ shoulder: [number, number], elbow: [number, number], wrist: [number, number], hand: [number, number] }} Arm
 */

/** The far arm, thrown up and back from the far shoulder. */
/** @type {Arm} */
const FAR_ARM = {
	shoulder: [28.2, 19.8],
	elbow: [22.8, 14],
	wrist: [18.6, 7],
	hand: [16.9, 5.2],
};

/** The near arm, reaching up and forward towards the spotlight. */
/** @type {Arm} */
const NEAR_ARM = {
	shoulder: [36.2, 19.6],
	elbow: [42.4, 13.8],
	wrist: [46.6, 7],
	hand: [48.2, 5.2],
};

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Modern Dance masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7349);

	drawBackdrop(layer);
	drawStage(layer, random);
	drawBeam(layer);
	drawDrapes(layer);

	drawDancer(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawRimLight(scene);
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
 * Paints a part lit by the spotlight on the upper right: lit along its upper-right edge, shaded along its
 * lower-left edge, with an ink line where it overlaps parts already painted behind it.
 * @param {Canvas} canvas
 * @param {Shape} shape
 * @param {Tones} tones
 * @param {number} [depth=1] - How deep the shade reaches in from the lower-left edge
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
			if (!shape(x - depth, y + depth) || !shape(x - depth - 1, y)) {
				colour = tones.shade;
			}
			if (!shape(x + 1, y - 1) || !shape(x + 1, y)) {
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
 * The backdrop: dusk bands from deep violet down to orange, dithered where they meet, a hot groundrow
 * glow at its foot and a halo of light behind the dancer.
 * @param {Canvas} layer
 */
function drawBackdrop(layer) {
	const band = STAGE / BACKDROP.length;
	for (let y = 0; y < STAGE; y++) {
		for (let x = 0; x < 64; x++) {
			const shift = (x + y) % 2 ? 0.5 : -0.5;
			const index = Math.max(
				0,
				Math.min(BACKDROP.length - 1, Math.floor((y + shift) / band))
			);
			set(layer, x, y, BACKDROP[index]);
		}
	}
	rect(layer, 0, STAGE - 3, 64, 1, GROUNDROW);
	rect(layer, 0, STAGE - 2, 64, 2, mix(GROUNDROW, C.lampGlow, 0.5));
	glow(layer, {
		x: HALO.x,
		y: HALO.y,
		radius: 22,
		colour: C.gold,
		strength: 0.32,
		steps: 3,
	});
}

/**
 * The stage: black boards running away from the eye, a warm sheen at the back where the backdrop's
 * glow falls, the spotlight's pool and the dancer's shadow far below her.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStage(layer, random) {
	for (let y = STAGE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			// The board joints fan out from a point far behind the backdrop.
			const lean = ((x - 32) * (y - STAGE + 6)) / 6;
			const seam =
				Math.abs(((lean % 9) + 9) % 9) < (y - STAGE) / 14 + 0.6;
			set(layer, x, y, seam ? FLOOR_SEAM : FLOOR);
		}
	}
	rect(layer, 0, STAGE, 64, 1, FLOOR_SHEEN);
	for (let x = 0; x < 64; x += 2) {
		set(layer, x + (random() > 0.5 ? 1 : 0), STAGE + 1, FLOOR_SHEEN);
	}
	for (let y = STAGE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (inEllipse(x, y, POOL.x, POOL.y, POOL.rx, POOL.ry)) {
				const inner = inEllipse(
					x,
					y,
					POOL.x,
					POOL.y,
					POOL.rx - 3,
					POOL.ry - 1
				);
				const seam = get(layer, x, y) === FLOOR_SEAM;
				const edge = (x + y) % 2 === 0 ? POOL_EDGE : FLOOR;
				set(
					layer,
					x,
					y,
					inner ? (seam ? POOL_SEAM : POOL_LIGHT) : edge
				);
			}
		}
	}
	for (let y = STAGE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const seam = get(layer, x, y) === POOL_SEAM;
			if (inEllipse(x, y, POOL.x + 2, POOL.y - 0.5, 10, 2.2) && !seam) {
				set(layer, x, y, POOL_CORE);
			}
			if (inEllipse(x, y, POOL.x - 2, POOL.y + 0.5, 6, 1.4)) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * The spotlight's beam, falling from the upper right onto the pool: a faint warm brightening of
 * whatever lies behind it.
 * @param {Canvas} layer
 */
function drawBeam(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (
				colour &&
				y < POOL.y &&
				inPolygon(x, y, [
					[SPOT.x - 3, SPOT.y],
					[SPOT.x + 3, SPOT.y],
					[POOL.x + POOL.rx - 1, POOL.y],
					[POOL.x - POOL.rx + 1, POOL.y],
				])
			) {
				set(layer, x, y, mix(colour, C.lampGlow, 0.16));
			}
		}
	}
}

/**
 * The black masking curtains at both sides of the stage, hanging in soft folds.
 * @param {Canvas} layer
 */
function drawDrapes(layer) {
	for (let y = 0; y < 64; y++) {
		for (const [from, w] of [
			[0, 3],
			[61, 3],
		]) {
			for (let x = from; x < from + w; x++) {
				const fold = x % 3;
				set(
					layer,
					x,
					y,
					fold === 0
						? DRAPE.light
						: fold === 1
							? DRAPE.base
							: DRAPE.shade
				);
			}
		}
	}
}

/**
 * Tells how far round from the waist a pixel lies, as a fold number, so the skirt can be striped into folds.
 * @param {number} x
 * @param {number} y
 * @returns {number} A whole number that changes every few degrees.
 */
function foldAt(x, y) {
	const angle = Math.atan2(y + 0.5 - 30, x + 0.5 - 31);
	return Math.floor(angle * 5.2 + Math.hypot(x - 31, y - 30) * 0.12);
}

/**
 * The dancer, back to front: the streaming hair, the far arm, the bent back leg, the swirling skirt,
 * the front leg, the shoulders and bodice, the near arm and the head.
 * @param {Canvas} scene
 */
function drawDancer(scene) {
	// The hair, loose and streaming back from the head.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 30.5, 10, 24.5, 15, 3, 2.3) ||
			inLimb(x, y, 24.5, 15, 17.5, 18.5, 2.3, 1.1) ||
			inLimb(x, y, 21, 17, 15.5, 21, 1.2, 0.7),
		HAIR
	);
	// The sheen along the locks.
	line(scene, 28, 10, 24, 13, HAIR.light);
	line(scene, 22, 15, 19, 17, HAIR.light);
	drawArm(scene, FAR_ARM);
	// The back leg, bent at the knee with the bare foot kicked up behind.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 29, 31, 19, 36, 2.7, 2) ||
			inLimb(x, y, 19, 36, 12, 30, 2, 1.3) ||
			inLimb(x, y, 12, 30, 9.5, 26.5, 1.2, 0.9),
		SKIN
	);
	drawSkirt(scene);
	// The front leg, thrown long and level towards the light, the bare foot stretched.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 34, 31.5, 43, 33.5, 2.7, 2) ||
			inLimb(x, y, 43, 33.5, 51, 35.5, 2, 1.3) ||
			inLimb(x, y, 51, 35.5, 55.5, 37.5, 1.3, 0.8),
		SKIN
	);
	// The bare shoulders, the collarbone and the neck.
	part(
		scene,
		(x, y) =>
			inEllipse(x, y, 32.2, 20.3, 5.6, 2.2) ||
			inLimb(x, y, 34.4, 14.5, 33.4, 19.5, 1.8),
		SKIN
	);
	// The bodice: the chest lifted, the waist drawn in and the back arched, darker on the side away
	// from the light.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[27.6, 21],
				[30.4, 21.4],
				[32, 22.6],
				[33.6, 21.4],
				[36.8, 20.8],
				[37.8, 23.2],
				[36.4, 25.4],
				[34.8, 26.8],
				[35.4, 30.6],
				[28.2, 31],
				[28.8, 26.8],
				[27.2, 24],
			]),
		DRESS,
		2
	);
	// The seam under the bust and the dark band at the waist.
	line(scene, 31, 25, 35, 24, DRESS.shade);
	line(scene, 29, 27, 34, 27, DRESS_DEEP);
	line(scene, 30, 28, 34, 28, DRESS.shade);
	drawArm(scene, NEAR_ARM);
	paint(scene, HEAD_AT.x, HEAD_AT.y, HEAD, {
		h: HAIR.base,
		H: HAIR.light,
		L: SKIN.light,
		S: SKIN.base,
		d: SKIN.shade,
		b: SKIN.shade,
		e: C.night,
		n: SKIN_RIM,
		m: LIPS,
		g: C.gold,
	});
}

/**
 * Paints an arm from its joints: the upper arm, the forearm bent a little at the elbow and tapering to
 * the wrist, and a small open hand, all lit from the spotlight.
 * @param {Canvas} scene
 * @param {Arm} arm
 */
function drawArm(scene, { shoulder, elbow, wrist, hand }) {
	const turn = Math.atan2(hand[1] - wrist[1], hand[0] - wrist[0]);
	part(
		scene,
		(x, y) =>
			inLimb(
				x,
				y,
				shoulder[0],
				shoulder[1],
				elbow[0],
				elbow[1],
				2,
				1.65
			) ||
			inLimb(x, y, elbow[0], elbow[1], wrist[0], wrist[1], 1.65, 1.3) ||
			inEllipse(x, y, hand[0], hand[1], 2.1, 1.25, turn),
		SKIN
	);
}

/**
 * The red skirt: full and light, flying back from the waist in the leap, folded in long sweeps, its
 * trailing end curling up to show the darker underside.
 * @param {Canvas} scene
 */
function drawSkirt(scene) {
	/** @type {Shape} */
	const skirt = (x, y) =>
		inPolygon(x, y, [
			[28, 28],
			[35, 28.5],
			[40, 31],
			[42, 35],
			[37, 38],
			[31, 41],
			[24, 44],
			[16, 45.5],
			[9, 44.5],
			[4, 41],
			[3, 37],
			[6, 36],
			[9, 39.5],
			[16, 40],
			[22, 37],
			[25, 33],
		]);
	part(scene, skirt, DRESS);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!skirt(x, y) || !skirt(x - 1, y) || !skirt(x + 1, y)) {
				continue;
			}
			if (!skirt(x, y + 1) || !skirt(x, y - 1)) {
				continue;
			}
			if (x < 9 && y < 42 - (9 - x) * 0.3) {
				// The underside, turned up where the hem curls.
				set(scene, x, y, x < 6 ? DRESS_DEEP : DRESS.shade);
				continue;
			}
			const fold = ((foldAt(x, y) % 4) + 4) % 4;
			if (fold === 0) {
				set(scene, x, y, DRESS.light);
			} else if (fold === 2) {
				set(scene, x, y, DRESS.shade);
			}
		}
	}
	// The line where the curl turns over.
	line(scene, 6, 37, 9, 41, DRESS.light);
}

/**
 * The spotlight's hot edge on everything facing it: the right-hand edge of each limb and of the dress.
 * @param {Canvas} scene
 */
function drawRimLight(scene) {
	const skins = [SKIN.light, SKIN.base];
	const reds = [DRESS.light, DRESS.base];
	/** @type {[number, number, Colour][]} */
	const lit = [];
	for (let y = 0; y < STAGE; y++) {
		for (let x = 0; x < 63; x++) {
			const here = get(scene, x, y) ?? '';
			const right = get(scene, x + 1, y);
			const above = get(scene, x, y - 1 < 0 ? 0 : y - 1);
			if (right !== C.ink && above !== C.ink) {
				continue;
			}
			if (skins.includes(here)) {
				lit.push([x, y, SKIN_RIM]);
			} else if (reds.includes(here)) {
				lit.push([x, y, DRESS_RIM]);
			}
		}
	}
	for (const [x, y, colour] of lit) {
		if (x > 26) {
			set(scene, x, y, colour);
		}
	}
}
