// Krav Maga: on the gym mats, a fighter in white blocks an overhead knife stab with one forearm and punches the attacker's jaw in the same move, a punching bag hanging behind in the daylight.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A material's three tones: lit, base and shaded.
 * @typedef {{ light: Colour, base: Colour, shade: Colour }} Tones
 */

/** A test for whether a pixel lies inside a shape. */
/** @typedef {(x: number, y: number) => boolean} Shape */

/** The first row of the mats. */
const MATS = 50;

/** The punching bag: its centre column, its top and bottom rows and its half-width. */
const BAG = { x: 7, top: 6, bottom: 33, r: 4.5 };

/** The painted block wall, and the daylight falling on it from a window out of sight on the left. */
const BLOCK = mix(C.stoneLight, C.cream, 0.35);
const BLOCK_LIGHT = mix(C.stoneLight, C.creamLight, 0.6);
const MORTAR = mix(C.stoneLight, C.stone, 0.5);
const BLOCK_SHADE = mix(BLOCK, MORTAR, 0.5);
const MORTAR_SHADE = mix(MORTAR, C.stoneMid, 0.5);
const BLOCK_SUN = mix(BLOCK, C.lampGlow, 0.5);
const MORTAR_SUN = mix(MORTAR, C.lampGlow, 0.4);
const BLOCK_DIM = mix(BLOCK, C.lampGlow, 0.25);
const MORTAR_DIM = mix(MORTAR, C.lampGlow, 0.2);

/** The blue mats, their seams and the sheen of the light on them. */
const MAT = { light: C.dayWaveDeep, base: C.daySea2, shade: C.daySea3 };
const MAT_SEAM = mix(C.daySea3, C.night, 0.3);
const MAT_SHADOW = mix(C.daySea3, C.night, 0.15);
const MAT_CONTACT = mix(C.daySea3, C.night, 0.45);
const MAT_SUN = mix(C.daySea1, C.dayWaveDeep, 0.5);
const MAT_SUN_EDGE = mix(C.dayWaveDeep, C.dayWave, 0.5);

/** The black leather bag, its stitched band and its chain. */
const LEATHER = { light: C.roofLight, base: C.roof, shade: C.night };
const LEATHER_SEAM = mix(C.roof, C.roofShade, 0.5);
const CHAIN = { light: C.stoneLight, base: C.stone, shade: C.stoneShade };

/** The defender: light skin, a white tee, black training trousers and short brown hair. */
const DEFENDER_SKIN = {
	light: mix(C.skin, C.creamLight, 0.25),
	base: C.skin,
	shade: C.skinShade,
};
const DEFENDER_SKIN_LIT = mix(C.skin, C.creamLight, 0.4);
const TEE = { light: C.white, base: C.creamLight, shade: C.cloudShade };
const TEE_FOLD = mix(C.cloudShade, C.stoneLight, 0.5);
const TROUSERS = { light: C.roof, base: C.roofShade, shade: C.night };
const DEFENDER_HAIR = { light: C.timber, base: C.timberShade, shade: C.wood };

/** The attacker: tan skin, a red long-sleeved top, grey trousers and cropped black hair. */
const ATTACKER_SKIN = {
	light: mix(C.skinTan, C.skin, 0.4),
	base: C.skinTan,
	shade: C.skinTanShade,
};
const SHIRT = {
	light: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};
const SHIRT_FOLD = mix(C.brickRed, C.brickRedShade, 0.5);
const JEANS = { light: C.stone, base: C.stoneMid, shade: C.stoneShade };
const ATTACKER_HAIR = { light: C.roofShade, base: C.night, shade: C.ink };
const STUBBLE = mix(C.skinTanShade, C.night, 0.3);

/** The sparks of the blow, the sweat it throws off and the glint on the knife. */
const SPARK = mix(C.lampGlow, C.white, 0.5);
const SWEAT = mix(C.daySky6, C.white, 0.3);
const GLINT = mix(C.lampGlow, C.white, 0.7);

/** The knife: a bright steel blade and a black grip. */
const BLADE = mix(C.stoneLight, C.white, 0.5);
const BLADE_EDGE = C.white;
const BLADE_SPINE = C.stone;
const GRIP = C.wood;

/** The four neighbours a pixel touches along its edges. */
const NEIGHBOURS = [
	[1, 0],
	[-1, 0],
	[0, 1],
	[0, -1],
];

/**
 * Draws the Krav Maga masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9157);

	drawWall(layer, random);
	drawMats(layer);

	drawBag(scene);
	drawAttacker(scene);
	drawDefender(scene);
	drawKnife(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawFaces(scene);
	drawImpact(scene);
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
 * Paints a part lit from the upper left: lit along its upper-left edge, shaded along its lower-right edge,
 * with an ink line where it overlaps parts already painted behind it.
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
 * The gym wall: courses of painted blocks with a blue band along them, and two slanting panes of
 * daylight thrown across it from a window out of sight on the left.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	for (let y = 0; y < MATS; y++) {
		const course = Math.floor(y / 5);
		const offset = (course % 2) * 6;
		for (let x = 0; x < 64; x++) {
			let colour = BLOCK;
			if (y % 5 === 4 || (x + offset) % 12 === 0) {
				colour = MORTAR;
			} else if (y % 5 === 0) {
				colour = BLOCK_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * MATS);
		if (get(layer, x, y) === BLOCK) {
			set(layer, x, y, BLOCK_LIGHT);
		}
	}
	// The far end of the wall, further from the window, a step darker.
	for (let y = 0; y < MATS; y++) {
		for (let x = 0; x < 64; x++) {
			if (x + ((x + y) % 2) * 2 < 48) {
				continue;
			}
			const colour = get(layer, x, y);
			set(
				layer,
				x,
				y,
				colour === MORTAR
					? MORTAR_SHADE
					: colour === BLOCK_LIGHT
						? BLOCK
						: BLOCK_SHADE
			);
		}
	}
	// The daylight, two tall panes slanting down to the right, their edges soft.
	for (const [x0, w] of [
		[14, 9],
		[27, 9],
	]) {
		for (let y = 0; y < MATS - 2; y++) {
			for (let x = 0; x < 64; x++) {
				const left = x0 + Math.floor(y * 0.45);
				if (x < left || x >= left + w) {
					continue;
				}
				const colour = get(layer, x, y);
				const edge = x === left || x === left + w - 1;
				if (colour === MORTAR) {
					set(layer, x, y, edge ? MORTAR_DIM : MORTAR_SUN);
				} else {
					set(layer, x, y, edge ? BLOCK_DIM : BLOCK_SUN);
				}
			}
		}
	}
	// The skirting at the foot of the wall.
	rect(layer, 0, MATS - 2, 64, 1, C.roof);
	rect(layer, 0, MATS - 1, 64, 1, C.roofShade);
}

/**
 * The mats: blue squares with dark seams, lit at their far edge, the joins between them running towards
 * the eye, and the fighters' shadows.
 * @param {Canvas} layer
 */
function drawMats(layer) {
	for (let y = MATS; y < 64; y++) {
		const row = y - MATS;
		for (let x = 0; x < 64; x++) {
			// The joins run towards the eye, fanning out from the middle.
			const spread = ((x - 32) * 10) / (row + 10);
			const join = Math.abs(((spread % 16) + 16) % 16) < 0.6 + row * 0.02;
			let colour = MAT.base;
			if (row === 0 || row === 8) {
				colour = MAT_SEAM;
			} else if (join) {
				colour = MAT_SEAM;
			} else if (row === 1 || row === 9) {
				colour = MAT.light;
			} else if (row > 11) {
				colour = MAT.shade;
			}
			set(layer, x, y, colour);
		}
	}
	// The daylight carried on across the mats.
	for (const x0 of [14, 27]) {
		for (let y = MATS; y < 64; y++) {
			const left = x0 + Math.floor(y * 0.45);
			for (let x = left; x < left + 9; x++) {
				const colour = get(layer, x, y);
				if (colour === MAT.base || colour === MAT.shade) {
					set(layer, x, y, MAT_SUN);
				} else if (colour === MAT.light || colour === MAT_SEAM) {
					set(
						layer,
						x,
						y,
						colour === MAT.light ? MAT_SUN_EDGE : MAT.base
					);
				}
			}
		}
	}
	// The fighters' shadows, cast to the right.
	for (let y = MATS; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (
				inEllipse(x, y, 24, 56.5, 14, 1.6) ||
				inEllipse(x, y, 49, 56.5, 11, 1.6)
			) {
				const colour = get(layer, x, y);
				if (colour !== MAT_SEAM) {
					set(layer, x, y, MAT_SHADOW);
				}
			}
		}
	}
	// The darker shadow right under each foot.
	for (const [x0, w] of [
		[6, 7],
		[27, 7],
		[36, 6],
		[55, 6],
	]) {
		rect(layer, x0, 56, w, 1, MAT_CONTACT);
	}
}

/**
 * The punching bag hanging on its chain behind the defender: black leather, a band of stitching
 * round its middle, lit down its left side.
 * @param {Canvas} scene
 */
function drawBag(scene) {
	// The chain from the ceiling, links alternating lit and dark.
	for (let y = 0; y < BAG.top; y++) {
		set(scene, BAG.x, y, y % 2 ? CHAIN.light : CHAIN.shade);
		set(scene, BAG.x + 1, y, y % 2 ? CHAIN.shade : CHAIN.base);
	}
	part(
		scene,
		(x, y) =>
			y >= BAG.top &&
			y <= BAG.bottom &&
			Math.abs(x + 0.5 - (BAG.x + 1)) <
				BAG.r - (y < BAG.top + 2 || y > BAG.bottom - 1 ? 1 : 0),
		LEATHER,
		2
	);
	// The stitched bands near its top and bottom.
	for (const y of [BAG.top + 4, BAG.bottom - 5]) {
		for (let x = BAG.x - 3; x <= BAG.x + 4; x++) {
			set(scene, x, y, x % 2 ? C.brickRed : C.brickRedShade);
		}
	}
	// The steel ring the chain hangs from, and the seam down the leather.
	rect(scene, BAG.x - 1, BAG.top, 4, 1, CHAIN.base);
	set(scene, BAG.x - 1, BAG.top, CHAIN.light);
	for (let y = BAG.top + 2; y < BAG.bottom - 1; y++) {
		if (y !== BAG.top + 4 && y !== BAG.bottom - 5) {
			set(scene, BAG.x + 2, y, LEATHER_SEAM);
		}
	}
	// A shine down the leather.
	for (let y = BAG.top + 6; y < BAG.bottom - 6; y++) {
		set(scene, BAG.x - 2, y, y % 5 === 0 ? LEATHER.base : LEATHER.light);
	}
}

/**
 * The attacker, on the right, lunging in with the knife raised overhead, his head snapped back by the punch.
 * @param {Canvas} scene
 */
function drawAttacker(scene) {
	// The far leg, braced behind.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 49, 36, 53, 45, 2.6, 2) ||
			inLimb(x, y, 53, 45, 56, 54, 2, 1.7),
		JEANS
	);
	part(scene, (x, y) => inEllipse(x, y, 57.5, 55, 2.8, 1.5), LEATHER);
	// The near leg, stepping in.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 45, 36, 41, 45, 2.7, 2.1) ||
			inLimb(x, y, 41, 45, 40, 54, 2.1, 1.8),
		JEANS
	);
	part(scene, (x, y) => inEllipse(x, y, 38.5, 55, 2.9, 1.5), LEATHER);
	// The knife arm in its red sleeve, raised high and driving down.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 45, 22, 43, 13, 2.3, 2) ||
			inLimb(x, y, 43, 13, 38.5, 6.5, 2, 1.7),
		SHIRT
	);
	// The red top, the hood bunched behind the neck.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[42.5, 21],
				[50.5, 20.5],
				[52.5, 27],
				[51.5, 37],
				[43, 37],
				[42.5, 28],
			]) || inEllipse(x, y, 50.5, 20.5, 2.6, 2),
		SHIRT
	);
	// The seam of the near sleeve and the band at the hem.
	rect(scene, 43, 35, 9, 1, SHIRT.shade);
	// The near arm in its sleeve, flung back and down.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 49, 23, 53, 30, 2.1, 1.8) ||
			inLimb(x, y, 53, 30, 54, 34.5, 1.8, 1.6),
		SHIRT
	);
	part(scene, (x, y) => inEllipse(x, y, 54.2, 36.4, 1.6, 1.5), ATTACKER_SKIN);
	// The neck and the head, jolted back.
	part(scene, (x, y) => inLimb(x, y, 47, 21, 47.5, 17, 1.7), ATTACKER_SKIN);
	part(
		scene,
		(x, y) => inEllipse(x, y, 47.5, 14.5, 3.4, 3.9, 0.3),
		ATTACKER_SKIN
	);
	// His short black hair, cropped close at the back of the head.
	part(
		scene,
		(x, y) =>
			inEllipse(x, y, 47.5, 14.5, 3.6, 4.1, 0.3) &&
			(y < 12 || x > 49) &&
			!(x < 47 && y > 11) &&
			!(x < 46),
		ATTACKER_HAIR
	);
	// The fist round the knife's grip.
	part(scene, (x, y) => inEllipse(x, y, 38, 5.5, 2, 1.8), ATTACKER_SKIN);
	// The folds of the sleeves and the creases of the trousers.
	line(scene, 42, 15, 44, 14, SHIRT.shade);
	line(scene, 50, 26, 52, 25, SHIRT.shade);
	line(scene, 44, 26, 47, 30, SHIRT_FOLD);
	line(scene, 41, 42, 43, 44, JEANS.light);
	line(scene, 52, 42, 53, 44, JEANS.light);
	set(scene, 48, 11, ATTACKER_HAIR.light);
	set(scene, 49, 12, ATTACKER_HAIR.light);
}

/**
 * The defender, on the left, bursting in: the far forearm thrown up into the knife arm and the near fist
 * driving into the attacker's jaw in the same move.
 * @param {Canvas} scene
 */
function drawDefender(scene) {
	// The back leg, driving off the ball of the foot.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 19, 36, 14, 45, 3, 2.3) ||
			inLimb(x, y, 14, 45, 11, 53, 2.3, 1.9),
		TROUSERS
	);
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 10.5, 54.5, 7, 56, 1.4, 1) ||
			inEllipse(x, y, 10.5, 54, 1.8, 1.6),
		DEFENDER_SKIN
	);
	// The blocking arm: the elbow raised and the forearm thrown up against the attacker's forearm.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 26, 21, 31, 16, 2, 1.8) ||
			inLimb(x, y, 31, 16, 37.5, 10.5, 1.8, 1.6),
		DEFENDER_SKIN
	);
	part(
		scene,
		(x, y) => inEllipse(x, y, 38.4, 9.4, 1.7, 1.8, -0.6),
		DEFENDER_SKIN
	);
	// The front leg, bent and stepping through.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 23, 36, 29, 44, 3.1, 2.4) ||
			inLimb(x, y, 29, 44, 29, 53, 2.4, 1.9),
		TROUSERS
	);
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 28, 55, 32.5, 55.5, 1.6, 1.1) ||
			inEllipse(x, y, 28.5, 54.5, 1.9, 1.4),
		DEFENDER_SKIN
	);
	// The white tee, the body leaning into the strike.
	part(
		scene,
		(x, y) =>
			inPolygon(x, y, [
				[18.5, 22],
				[27, 20.5],
				[29.5, 26],
				[27.5, 37],
				[17.5, 37.5],
				[17, 29],
			]) || inLimb(x, y, 26, 21.5, 27.5, 23.5, 2.4),
		TEE
	);
	// Its folds, pulled towards the punch.
	line(scene, 19, 29, 24, 27, TEE_FOLD);
	line(scene, 20, 33, 26, 30, TEE_FOLD);
	rect(scene, 18, 36, 10, 1, TEE.shade);
	// The neck and the head, the chin tucked behind the shoulder.
	part(scene, (x, y) => inLimb(x, y, 22, 21, 22.5, 18, 1.8), DEFENDER_SKIN);
	part(scene, (x, y) => inEllipse(x, y, 22.2, 15, 3.5, 3.9), DEFENDER_SKIN);
	part(
		scene,
		(x, y) =>
			inEllipse(x, y, 22, 14.6, 3.7, 4.1) &&
			(y < 12.5 || x < 20.5) &&
			!(x > 23 && y > 11.5),
		DEFENDER_HAIR
	);
	// The punching arm, straight from the shoulder to the jaw, the sleeve over the shoulder.
	part(
		scene,
		(x, y) =>
			inLimb(x, y, 22, 24.5, 32, 22.5, 2, 1.8) ||
			inLimb(x, y, 32, 22.5, 41, 20, 1.8, 1.5),
		DEFENDER_SKIN
	);
	part(scene, (x, y) => inEllipse(x, y, 42.3, 19.5, 2.1, 2), DEFENDER_SKIN);
	part(scene, (x, y) => inLimb(x, y, 20.5, 24, 24.5, 23.2, 2.6), TEE);
	// The knuckles, catching the light.
	set(scene, 42, 18, DEFENDER_SKIN_LIT);
	set(scene, 43, 18, DEFENDER_SKIN_LIT);
	// Light on the hair, and the creases in the trousers at the knees.
	line(scene, 20, 11, 23, 11, DEFENDER_HAIR.light);
	set(scene, 19, 13, DEFENDER_HAIR.light);
	line(scene, 14, 42, 16, 44, TROUSERS.light);
	line(scene, 27, 41, 29, 43, TROUSERS.light);
	line(scene, 12, 48, 13, 50, TROUSERS.light);
}

/**
 * The knife, held point forward over the fist: a long bright blade aimed down at the defender's head.
 * @param {Canvas} scene
 */
function drawKnife(scene) {
	// The pommel showing above the fist.
	set(scene, 39, 3, GRIP);
	set(scene, 40, 2, GRIP);
	set(scene, 40, 3, C.stoneShade);
	// The guard, and the blade with its lit edge, its body and its darker spine.
	set(scene, 36, 4, C.stoneShade);
	set(scene, 36, 5, C.stone);
	set(scene, 36, 6, C.stoneShade);
	line(scene, 35, 4, 29, 6, BLADE_EDGE);
	line(scene, 35, 5, 28, 7, BLADE);
	line(scene, 35, 6, 31, 7, BLADE_SPINE);
}

/**
 * The faces: the defender's eye fixed on the target, the attacker's eye screwed shut and his mouth open,
 * a shadow of stubble along his jaw.
 * @param {Canvas} scene
 */
function drawFaces(scene) {
	set(scene, 24, 14, C.wood);
	set(scene, 23, 13, C.timberShade);
	set(scene, 25, 17, C.skinShade);
	set(scene, 45, 13, C.night);
	set(scene, 46, 13, C.skinTanShade);
	set(scene, 45, 16, C.brickRedShade);
	set(scene, 46, 17, STUBBLE);
	set(scene, 47, 18, STUBBLE);
	set(scene, 48, 18, STUBBLE);
}

/**
 * The impact: a few bright sparks where the fist lands on the jaw, drops of sweat flung off the
 * attacker's head, and a glint on the knife's point.
 * @param {Canvas} scene
 */
function drawImpact(scene) {
	for (const [x, y] of [
		[43, 15],
		[44, 14],
		[46, 22],
		[47, 23],
		[40, 16],
	]) {
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, SPARK);
		}
	}
	for (const [x, y] of [
		[53, 10],
		[55, 9],
		[54, 13],
		[57, 12],
	]) {
		set(scene, x, y, C.white);
		set(scene, x + 1, y + 1, SWEAT);
	}
	// The glint: a small cross of light on the point.
	set(scene, 28, 5, GLINT);
	set(scene, 27, 6, GLINT);
	set(scene, 28, 4, C.white);
	set(scene, 26, 6, C.white);
}
