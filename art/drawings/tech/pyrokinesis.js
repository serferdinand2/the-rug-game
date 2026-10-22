// Pyrokinesis: a fireball blazing above an open hand at night, the forearm in a brown sleeve rising from below, the fire lighting the sky around it.
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
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The fireball: its centre and its radius before the flames lick up from it. */
const FIRE = { x: 32, y: 17, r: 11.5 };

/** The first row of the hills far behind. */
const HILLS = 50;

/** The fire's bands, from its white heart out to its dark red edge. */
const FIRE_BANDS = [
	{ reach: 0.3, colour: C.white },
	{ reach: 0.5, colour: C.lampGlow },
	{ reach: 0.68, colour: C.gold },
	{ reach: 0.84, colour: C.amber },
	{ reach: 1, colour: C.brickRed },
];

/** The skin of the hand, its tops lit gold by the fire above. */
const SKIN = {
	light: mix(C.skin, C.lampGlow, 0.45),
	base: C.skin,
	shade: C.skinShade,
};

/** The brown sleeve, its top lit by the fire. */
const SLEEVE = { light: C.timberLight, base: C.timber, shade: C.timberShade };

/** The gold trim round the cuff. */
const CUFF = { light: C.gold, base: C.brass, shade: C.lampFrame };

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Pyrokinesis tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const fire = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9063);

	drawSky(layer, random);
	drawHills(layer);
	// The fire lights the night around it: a wide rosy wash and a hot halo close in.
	glow(layer, {
		x: FIRE.x,
		y: FIRE.y,
		radius: 44,
		colour: C.duskSky5,
		strength: 0.45,
		steps: 3,
	});
	glow(layer, {
		x: FIRE.x,
		y: FIRE.y,
		radius: 17,
		colour: C.amber,
		strength: 0.35,
		steps: 1,
	});

	drawFireball(fire);
	outline(fire, C.brickRedShade);
	underlay(fire, layer);

	drawSleeve(scene);
	drawHand(scene);
	outline(scene, C.ink);
	underlay(scene, fire);

	glow(scene, {
		x: FIRE.x,
		y: 36,
		radius: 9,
		colour: C.gold,
		strength: 0.3,
		steps: 1,
		skip: [C.ink, SKIN.light],
	});
	drawEmbers(scene, random);
	return scene;
}

/**
 * Whether a pixel lies within a distance of a line segment: a finger or a limb with rounded ends.
 * @param {number} x
 * @param {number} y
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - The half-width
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
 * Paints a part lit from above by the fire: lit along its top edge, shaded along its bottom and right edges,
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
			if (!shape(x, y + 2) || !shape(x + 2, y)) {
				colour = tones.shade;
			}
			if (!shape(x, y - 1)) {
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
 * The night sky: four plain bands, darkest at the top, and a scatter of stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	const bands = [C.nightSky1, C.nightSky2, C.nightSky3, C.nightSky4];
	for (let y = 0; y < 64; y++) {
		rect(layer, 0, y, 64, 1, bands[Math.min(3, Math.floor(y / 13))]);
	}
	for (let i = 0; i < 24; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (HILLS - 4));
		set(layer, x, y, C.starDim);
	}
}

/**
 * Low hills far behind, a dark ridge against the sky.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HILLS + 2 * Math.sin(x / 7) + Math.sin(x / 3 + 1)
		);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * How far a pixel lies out from the fireball's heart, as a share of the flame's reach in that direction:
 * round below, licking up into flame tongues above, with a slow swirl through it.
 * @param {number} x
 * @param {number} y
 * @returns {number} Below 1 inside the fire.
 */
function heat(x, y) {
	const dx = x + 0.5 - FIRE.x;
	const dy = y + 0.5 - FIRE.y;
	const angle = Math.atan2(dy, dx);
	const up = Math.max(0, -Math.sin(angle));
	const tongues = 1 + up ** 2 * (0.24 + 0.12 * Math.sin(9 * angle + Math.PI));
	const swirl = 0.06 * Math.sin(3 * angle + Math.hypot(dx, dy) * 0.55);
	return Math.hypot(dx, dy) / (FIRE.r * tongues) + swirl;
}

/**
 * The fireball: bands of fire from a white heart out to dark red, rising into tongues of flame.
 * @param {Canvas} fire
 */
function drawFireball(fire) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const h = heat(x, y);
			const band = FIRE_BANDS.find(({ reach }) => h < reach);
			if (band) {
				set(fire, x, y, band.colour);
			}
		}
	}
}

/**
 * The sleeve rising from the bottom edge, widening as it falls, with a gold-trimmed cuff at the wrist.
 * @param {Canvas} scene
 */
function drawSleeve(scene) {
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[25, 56],
				[40, 56],
				[45, 64],
				[19, 64],
			]),
		SLEEVE
	);
	part(scene, (x, y) => x >= 24 && x <= 40 && y >= 54 && y <= 56, CUFF);
}

/**
 * Whether a pixel lies inside the open hand: the wrist, the palm, the thumb and four fingers spread to cup the fire.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inHand(x, y) {
	return (
		inCapsule(x, y, 32, 48, 32, 55, 4.2) ||
		inPolygon(x, y, [
			[25, 40],
			[39, 40],
			[39, 47],
			[36, 52],
			[28, 52],
			[25, 47],
		]) ||
		inCapsule(x, y, 27, 46, 20, 39, 1.9) ||
		inCapsule(x, y, 26.5, 41, 23.5, 33, 1.7) ||
		inCapsule(x, y, 30.5, 40, 29.5, 31, 1.7) ||
		inCapsule(x, y, 34.5, 40, 35.5, 32, 1.7) ||
		inCapsule(x, y, 37.5, 42, 41.5, 35.5, 1.6)
	);
}

/**
 * The open hand, palm up, its fingertips and the heel of its palm lit by the fire, with the creases of the palm.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	part(scene, inHand, SKIN);
	// The crease across the palm and the line round the ball of the thumb.
	for (const [x, y] of [
		[28, 44],
		[29, 44],
		[30, 43],
		[31, 43],
		[32, 43],
		[33, 44],
		[34, 44],
		[29, 47],
		[29, 48],
		[30, 49],
	]) {
		set(scene, x, y, C.skinShade);
	}
}

/**
 * Embers flying up and out from the fire.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawEmbers(scene, random) {
	for (let i = 0; i < 14; i++) {
		const angle = -Math.PI * (0.05 + random() * 0.9);
		const r = FIRE.r * (1.6 + random() * 0.9);
		const x = Math.round(FIRE.x + Math.cos(angle) * r);
		const y = Math.round(FIRE.y + Math.sin(angle) * r * 0.9 + 4);
		set(scene, x, y, random() > 0.5 ? C.gold : C.amber);
	}
}
