// Werefolk: a werewolf in a torn shirt howling at the full moon over a dark pine forest at night, one bloodied claw raised against the moon.
import {
	createCanvas,
	get,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {[number, number][]} Polygon */

/** The full moon: its centre and radius. */
const MOON = { x: 12, y: 12, r: 11 };

/** Dark brown fur: the moonlit rim, lit, plain, shaded and dark. */
const FUR = {
	rim: mix(C.timberLight, C.moon, 0.45),
	lit: C.timber,
	base: mix(C.timberShade, C.wood, 0.25),
	shade: mix(C.wood, C.night, 0.3),
	dark: mix(C.night, C.ink, 0.4),
};

/** The torn linen shirt: moonlit, plain and shaded. */
const SHIRT = {
	lit: mix(C.cream, C.moon, 0.4),
	base: mix(C.creamShade, C.stoneLight, 0.35),
	shade: mix(C.creamShade, C.roof, 0.5),
};

/** The open mouth: its dark inside, the tongue, and the teeth. */
const MOUTH = {
	inside: mix(C.brickRedShade, C.night, 0.45),
	tongue: C.brickRed,
	tooth: C.creamLight,
};

/** The head: the skull and upper jaw, from the nose round the brow and the back of the head to the mouth's corner. */
const HEAD = /** @type {Polygon} */ ([
	[25, 2],
	[29, 3],
	[33, 7],
	[37, 8],
	[41, 7],
	[45, 9],
	[48, 13],
	[49, 19],
	[46, 23],
	[38, 22],
	[35, 17],
	[25, 5],
]);

/** The lower jaw, dropped wide open. */
const JAW = /** @type {Polygon} */ ([
	[35, 17],
	[24, 11],
	[23, 14],
	[27, 17],
	[33, 22],
	[39, 23],
]);

/** The open mouth between the jaws. */
const MOUTH_SHAPE = /** @type {Polygon} */ ([
	[25, 5],
	[35, 17],
	[24, 11],
]);

/** The ears, laid back: the near one and the far one. */
const EARS = /** @type {Polygon[]} */ ([
	[
		[39, 9],
		[45, 10],
		[47, 0],
	],
	[
		[44, 12],
		[49, 15],
		[55, 4],
	],
]);

/** His neck, mane and hunched shoulders, down to the bottom of the picture. */
const BODY = /** @type {Polygon} */ ([
	[31, 21],
	[46, 22],
	[51, 17],
	[57, 23],
	[63, 29],
	[64, 64],
	[16, 64],
	[18, 44],
	[23, 34],
	[28, 27],
]);

/** His left arm raised, from the shoulder to the wrist, and the palm of the hand against the moon. */
const ARM = /** @type {Polygon} */ ([
	[24, 34],
	[27, 41],
	[17, 52],
	[11, 49],
	[7, 33],
	[14, 32],
]);
const PALM = /** @type {Polygon} */ ([
	[5, 25],
	[15, 24],
	[16, 30],
	[14, 34],
	[7, 34],
	[4, 30],
]);

/** The colours the moon's glow leaves alone: the moon itself and the werewolf, lit by hand. */
const KEEP = [
	C.moon,
	C.moonRim,
	...Object.values(FUR),
	...Object.values(SHIRT),
	...Object.values(MOUTH),
	C.ink,
	C.creamShade,
	C.brickRedShade,
];

/**
 * Draws the Werefolk portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8945);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 34,
		starRows: 44,
	});
	drawMoon(layer);
	drawForest(layer, random);

	const body = createCanvas(64, 64);
	fillFur(body, [BODY]);
	drawShirt(body);
	drawLowArm(body);
	outline(body, C.ink);
	const head = createCanvas(64, 64);
	fillFur(head, [...EARS, HEAD, JAW]);
	drawEars(head);
	drawMouth(head);
	outline(head, C.ink);
	underlay(head, body);
	const arm = createCanvas(64, 64);
	fillFur(arm, [ARM, PALM]);
	drawSleeve(arm);
	drawClaws(arm);
	outline(arm, C.ink);
	underlay(arm, head);
	underlay(scene, arm);
	underlay(scene, layer);

	glow(scene, {
		x: MOON.x,
		y: MOON.y,
		radius: 24,
		colour: C.moon,
		strength: 0.25,
		steps: 4,
		skip: KEEP,
	});
	drawFace(scene);
	drawBlood(scene);
	return scene;
}

/**
 * Tells whether a pixel's centre lies inside a polygon.
 * @param {number} x
 * @param {number} y
 * @param {Polygon} polygon
 * @returns {boolean}
 */
function inPolygon(x, y, polygon) {
	const px = x + 0.5;
	const py = y + 0.5;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const [xi, yi] = polygon[i];
		const [xj, yj] = polygon[j];
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
 * Fills shapes with fur, lit along the edges that face the moon at the upper left and shaded along the far edges.
 * @param {Canvas} scene
 * @param {Polygon[]} shapes
 */
function fillFur(scene, shapes) {
	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	const inside = (x, y) => shapes.some((shape) => inPolygon(x, y, shape));
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inside(x, y)) {
				continue;
			}
			let colour = FUR.base;
			if (!inside(x - 1, y - 1) || !inside(x - 1, y)) {
				colour = FUR.rim;
			} else if (!inside(x - 2, y - 2) || !inside(x - 3, y)) {
				colour = FUR.lit;
			} else if (!inside(x + 2, y + 2) || !inside(x + 3, y)) {
				colour = FUR.shade;
			} else if ((x * 3 + y * 5) % 13 === 0) {
				colour = FUR.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The full moon, pale with grey seas.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			set(layer, x, y, d > r - 1.2 ? C.moonRim : C.moon);
		}
	}
	for (const [x, y, w, h] of [
		[8, 6, 4, 3],
		[15, 9, 3, 2],
		[10, 13, 2, 1],
		[16, 16, 3, 2],
	]) {
		for (let j = 0; j < h; j++) {
			for (let i = 0; i < w; i++) {
				set(layer, x + i, y + j, C.moonRim);
			}
		}
	}
}

/**
 * A dark pine forest under the moon, the near trees black against the sky.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawForest(layer, random) {
	const forest = createCanvas(64, 64);
	drawTerrain(forest, { kind: 'forest', top: 50, random });
	for (let i = 0; i < forest.p.length; i++) {
		const colour = forest.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.nightSky2, 0.65);
		}
	}
	// Tall black pines rising behind him.
	for (const [cx, top] of [
		[2, 30],
		[22, 24],
		[60, 12],
		[30, 36],
	]) {
		for (let y = top; y < 64; y++) {
			const step = y - top;
			const half = Math.min(
				6,
				Math.floor(step / 2) - (step % 4 === 3 ? 1 : 0)
			);
			for (let x = cx - half; x <= cx + half; x++) {
				const edge = x === cx - half;
				set(
					layer,
					x,
					y,
					edge
						? mix(C.pineShade, C.nightSky5, 0.5)
						: mix(C.pineShade, C.night, 0.65)
				);
			}
		}
	}
}

/**
 * The shirt in rags over his shoulders, burst open down the chest where the fur shows through, slashed across.
 * @param {Canvas} scene
 */
function drawShirt(scene) {
	for (let y = 27; y < 64; y++) {
		for (let x = 16; x < 64; x++) {
			if (!get(scene, x, y)) {
				continue;
			}
			// The split down the chest, widening and ragged.
			const gapLeft =
				31 + Math.round((y - 27) * 0.1) + ((y * 3) % 4 === 0 ? 1 : 0);
			const gapRight =
				41 + Math.round((y - 27) * 0.35) - ((y * 5) % 3 === 0 ? 1 : 0);
			if (x >= gapLeft && x <= gapRight) {
				continue;
			}
			// The collar line: the mane covers the shirt above it.
			if (y < 31 - Math.round(Math.abs(x - 40) * 0.08) + ((x * 7) % 3)) {
				continue;
			}
			// Three slashes torn across his side, as if by claws.
			const slash = (x - 44) * 0.8 + (y - 44);
			if (
				x > 44 &&
				x < 58 &&
				[0, 4, 8].some((k) => Math.abs(slash - k) < 0.8)
			) {
				continue;
			}
			let colour = SHIRT.base;
			if (x === gapLeft - 1 || x < 22) {
				colour = SHIRT.lit;
			} else if (x === gapRight + 1 || x > 53 || y > 58) {
				colour = SHIRT.shade;
			} else if ((x - Math.round(y * 0.2)) % 6 === 0 && x > gapRight) {
				// Folds pulled tight over his ribs.
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Blood on the shirt: a splash on his side and a smear wiped across his hip, running down.
	for (const [x, y] of [
		[47, 39],
		[48, 39],
		[46, 40],
		[47, 40],
		[49, 41],
	]) {
		set(scene, x, y, C.brickRedShade);
	}
	paint(
		scene,
		21,
		47,
		[
			'.rr...',
			'rRRr..',
			'.rRRr.',
			'..rrRr',
			'....r.',
			'....r.',
			'......',
			'....r.',
		],
		{ r: C.brickRedShade, R: C.brickRed }
	);
}

/**
 * His right arm hanging at his side in a torn sleeve, the claws curled at the bottom.
 * @param {Canvas} scene
 */
function drawLowArm(scene) {
	for (let y = 36; y <= 63; y++) {
		const cx = 57 + Math.round((y - 36) * 0.1);
		for (let x = cx - 4; x <= Math.min(63, cx + 4); x++) {
			let colour = y < 50 ? SHIRT.shade : FUR.base;
			if (x === cx - 4) {
				colour = y < 50 ? SHIRT.base : FUR.lit;
			}
			if (y === 50 && x % 2 === 0) {
				colour = FUR.base;
			}
			set(scene, x, y, colour);
		}
	}
	paint(scene, 52, 59, ['c.c.c.', 'c.c.c.', '.c.c.c'], { c: C.creamShade });
}

/**
 * The inside of the near ear.
 * @param {Canvas} scene
 */
function drawEars(scene) {
	for (let y = 2; y <= 9; y++) {
		for (let x = 41; x <= 46; x++) {
			if (
				inPolygon(x, y, [
					[41, 9],
					[44, 9],
					[46, 3],
				])
			) {
				set(scene, x, y, mix(C.brickRedShade, C.night, 0.35));
			}
		}
	}
}

/**
 * The open mouth: its dark inside, the tongue along the lower jaw and the fangs.
 * @param {Canvas} scene
 */
function drawMouth(scene) {
	for (let y = 4; y <= 18; y++) {
		for (let x = 23; x <= 36; x++) {
			if (!inPolygon(x, y, MOUTH_SHAPE)) {
				continue;
			}
			const tongue =
				inPolygon(x, y - 2, MOUTH_SHAPE) &&
				!inPolygon(x + 1, y + 1, MOUTH_SHAPE);
			set(scene, x, y, tongue ? MOUTH.tongue : MOUTH.inside);
		}
	}
	// Fangs: down from the upper jaw and up from the lower.
	for (const [x, y] of [
		[26, 6],
		[26, 7],
		[30, 11],
		[30, 12],
		[25, 11],
		[25, 10],
		[29, 13],
	]) {
		set(scene, x, y, MOUTH.tooth);
	}
}

/**
 * The torn sleeve round the raised arm's elbow.
 * @param {Canvas} scene
 */
function drawSleeve(scene) {
	for (let y = 42; y <= 53; y++) {
		for (let x = 10; x <= 28; x++) {
			if (!get(scene, x, y) || ((x + y) % 4 === 0 && y === 42)) {
				continue;
			}
			if (y < 42 + Math.round((x - 10) * 0.25) && y > 40) {
				continue;
			}
			set(scene, x, y, x < 15 ? SHIRT.lit : SHIRT.base);
		}
	}
}

/**
 * The raised hand's fingers and long curved claws, spread against the moon.
 * @param {Canvas} scene
 */
function drawClaws(scene) {
	for (const [x, top] of [
		[5, 18],
		[8, 16],
		[11, 16],
		[14, 18],
	]) {
		for (let y = top + 3; y <= 26; y++) {
			set(scene, x, y, FUR.lit);
			set(scene, x + 1, y, FUR.base);
		}
		set(scene, x, top + 2, C.creamShade);
		set(scene, x, top + 1, C.creamShade);
		set(scene, x + 1, top, C.creamShade);
	}
	// The thumb, out to the side.
	paint(scene, 15, 26, ['ff..', 'fffc', '.ff.'], {
		f: FUR.base,
		c: C.creamShade,
	});
}

/**
 * The glowing amber eye under a heavy brow, and the nose at the tip of the snout, painted after the moon's glow.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	paint(scene, 35, 9, ['ddd.', '.gEk', '..a.'], {
		d: FUR.dark,
		g: C.gold,
		E: C.lampGlow,
		k: C.ink,
		a: C.amber,
	});
	paint(scene, 24, 1, ['.kk', 'kSk', 'kkk'], { k: C.ink, S: C.stone });
}

/**
 * Blood on the claws and drops running from them, painted last.
 * @param {Canvas} scene
 */
function drawBlood(scene) {
	for (const [x, y] of [
		[5, 20],
		[5, 21],
		[8, 19],
		[11, 19],
		[11, 20],
		[14, 21],
		[52, 61],
		[54, 61],
		[56, 62],
		[54, 63],
	]) {
		set(scene, x, y, C.brickRed);
	}
}
