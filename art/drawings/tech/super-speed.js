// Super Speed: a runner leaning hard into a sprint along a dirt road, trailing speed streaks and a long plume of dust.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** A material's three tones: lit, base and shade. */
/** @typedef {[Colour, Colour, Colour]} Tones */

/** The last sky row, the road's far edge and its near edge. */
const ROWS = { sky: 33, road: 44, verge: 60 };

/** The row the runner's feet strike. */
const GROUND = 54;

/** The runner's joints, facing right and leaning into the run. */
const BODY = {
	head: { x: 48, y: 17 },
	neck: { x: 45, y: 23 },
	hip: { x: 36, y: 37 },
	near: {
		elbow: { x: 37, y: 30 },
		hand: { x: 31, y: 27 },
		knee: { x: 45, y: 42 },
		ankle: { x: 44, y: 50 },
	},
	far: {
		elbow: { x: 50, y: 30 },
		hand: { x: 55, y: 25 },
		knee: { x: 30, y: 45 },
		ankle: { x: 22, y: 48 },
	},
};

/** The sky's ramp from the top down to the far fields. */
const SKY = [C.daySky1, C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** The runner's materials: near and far skin, the red vest, dark leggings near and far, and white shoes. */
/** @type {Tones} */
const SKIN = [C.skin, C.skinTan, C.skinTanShade];
/** @type {Tones} */
const SKIN_FAR = [C.skinTan, C.skinTanShade, C.skinDeep];
/** @type {Tones} */
const VEST = [C.brickRedLight, C.brickRed, C.brickRedShade];
/** @type {Tones} */
const LEGS = [C.roofLight, C.roof, C.roofShade];
/** @type {Tones} */
const LEGS_FAR = [C.roof, C.roofShade, mix(C.roofShade, C.ink, 0.4)];
/** @type {Tones} */
const SHOES = [C.white, C.cloudShade, C.stone];

/** The far fields and the dirt road. */
const FIELD = mix(C.grass, C.daySky5, 0.35);
const FIELD_FAR = mix(C.grassShade, C.daySky5, 0.55);
const RUT = mix(C.sandShade, C.timberLight, 0.3);

/** The streaks the runner leaves: red from the vest, violet from the leggings, and pale wind. */
const STREAK_VEST = [
	mix(C.brickRed, C.daySky4, 0.35),
	mix(C.brickRedLight, C.daySky5, 0.6),
];
const STREAK_LEGS = [mix(C.roof, C.sand, 0.35), mix(C.roofLight, C.sand, 0.6)];
const STREAK_SKIN = [
	mix(C.skinTan, C.daySky4, 0.35),
	mix(C.skin, C.daySky5, 0.6),
];

/** The dust: lit puffs, their shaded undersides, and the thin wisps at the end. */
const DUST = C.cream;
const DUST_SHADE = C.sandLight;
const DUST_LIGHT = C.creamLight;

/**
 * Draws the Super Speed tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4119);

	drawSky(layer);
	drawFields(layer);
	drawRoad(layer, random);

	drawRunner(scene);
	drawStreaks(layer, scene, random);
	drawDust(layer, random);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawWind(scene, random);
	drawGleams(scene);
	return scene;
}

/**
 * The clear day sky, dithered between its bands.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.sky; y++) {
		const t = (y / ROWS.sky) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * Flat green fields running to a low, hazy horizon.
 * @param {Canvas} layer
 */
function drawFields(layer) {
	rect(layer, 0, ROWS.sky + 1, 64, ROWS.road - ROWS.sky - 1, FIELD);
	rect(layer, 0, ROWS.sky + 1, 64, 2, FIELD_FAR);
	// A low ridge far off on the left.
	for (let x = 0; x < 30; x++) {
		const h = Math.round(3 * Math.sin((x / 30) * Math.PI));
		rect(layer, x, ROWS.sky + 1 - h, 1, h, FIELD_FAR);
	}
	rect(layer, 0, ROWS.verge, 64, 64 - ROWS.verge, C.grass);
	rect(layer, 0, ROWS.verge, 64, 1, C.grassLight);
}

/**
 * The dirt road: packed sand with a lit far edge, two worn ruts and a few pebbles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoad(layer, random) {
	rect(layer, 0, ROWS.road, 64, ROWS.verge - ROWS.road, C.sand);
	rect(layer, 0, ROWS.road, 64, 1, C.sandShade);
	rect(layer, 0, ROWS.road + 1, 64, 1, C.sandLight);
	for (const y of [ROWS.road + 5, ROWS.verge - 3]) {
		rect(layer, 0, y, 64, 1, RUT);
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y =
			ROWS.road + 2 + Math.floor(random() * (ROWS.verge - ROWS.road - 3));
		set(layer, x, y, C.sandShade);
	}
	// The runner's shadow, short under the high sun.
	rect(layer, 34, GROUND + 1, 18, 1, C.sandShade);
	rect(layer, 37, GROUND + 2, 12, 1, C.sandShade);
}

/**
 * Paints a round-ended stroke between two points into a part canvas.
 * @param {Canvas} part
 * @param {{ x: number, y: number }} a
 * @param {{ x: number, y: number }} b
 * @param {number} r - Half the stroke's width
 */
function stroke(part, a, b, r) {
	const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) * 2) + 1;
	for (let i = 0; i <= steps; i++) {
		const cx = a.x + ((b.x - a.x) * i) / steps;
		const cy = a.y + ((b.y - a.y) * i) / steps;
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) {
					set(part, x, y, C.ink);
				}
			}
		}
	}
}

/**
 * Copies a part onto the runner in three flat tones: lit where the light from the upper left meets its edge,
 * shaded along its lower right edge, and its base between.
 * @param {Canvas} runner
 * @param {Canvas} part
 * @param {Tones} tones
 */
function shade(runner, part, tones) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!get(part, x, y)) {
				continue;
			}
			let colour = tones[1];
			if (!get(part, x + 1, y + 1) || !get(part, x + 1, y)) {
				colour = tones[2];
			} else if (!get(part, x - 1, y - 1) || !get(part, x, y - 1)) {
				colour = tones[0];
			}
			set(runner, x, y, colour);
		}
	}
}

/**
 * Builds one part of the body from strokes and shades it onto the runner.
 * @param {Canvas} runner
 * @param {[{ x: number, y: number }, { x: number, y: number }, number][]} strokes
 * @param {Tones} tones
 */
function part(runner, strokes, tones) {
	const canvas = createCanvas(64, 64);
	for (const [a, b, r] of strokes) {
		stroke(canvas, a, b, r);
	}
	shade(runner, canvas, tones);
}

/**
 * A shoe: a white wedge pointing forward along the foot, with a grey sole.
 * @param {Canvas} runner
 * @param {{ x: number, y: number }} ankle
 * @param {number} toe - The column of the toe
 * @param {number} sole - The row of the sole
 */
function shoe(runner, ankle, toe, sole) {
	const from = Math.min(ankle.x - 1, toe);
	const to = Math.max(ankle.x - 1, toe);
	rect(runner, from, sole - 2, to - from + 1, 2, SHOES[1]);
	rect(runner, from, sole - 2, to - from, 1, SHOES[0]);
	rect(runner, from, sole, to - from + 1, 1, SHOES[2]);
}

/**
 * The runner, built from the far limbs forward: a lean figure in a red vest and dark leggings,
 * head down and arms pumping.
 * @param {Canvas} scene
 */
function drawRunner(scene) {
	const { head, neck, hip, near, far } = BODY;
	part(
		scene,
		[
			[neck, far.elbow, 1.6],
			[far.elbow, far.hand, 1.4],
		],
		SKIN_FAR
	);
	part(
		scene,
		[
			[hip, far.knee, 2.6],
			[far.knee, far.ankle, 2],
		],
		LEGS_FAR
	);
	shoe(scene, far.ankle, far.ankle.x - 4, far.ankle.y + 2);
	part(
		scene,
		[
			[neck, hip, 4.2],
			[
				{ x: neck.x - 1, y: neck.y + 2 },
				{ x: hip.x + 1, y: hip.y - 3 },
				4.6,
			],
		],
		VEST
	);
	part(
		scene,
		[
			[hip, near.knee, 2.8],
			[near.knee, near.ankle, 2.1],
		],
		LEGS
	);
	shoe(scene, near.ankle, near.ankle.x + 4, GROUND);
	part(scene, [[{ x: neck.x + 1, y: neck.y - 1 }, head, 1.8]], SKIN);
	part(scene, [[head, head, 4.3]], SKIN);
	drawHair(scene);
	part(
		scene,
		[
			[{ x: neck.x - 1, y: neck.y + 1 }, near.elbow, 1.7],
			[near.elbow, near.hand, 1.5],
		],
		SKIN
	);
	// The eye, looking ahead.
	set(scene, head.x + 2, head.y - 1, C.ink);
}

/**
 * Short dark hair swept back by the wind, over the back and top of the head.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	const { head } = BODY;
	for (let y = head.y - 5; y <= head.y + 2; y++) {
		for (let x = head.x - 6; x <= head.x + 3; x++) {
			const d = Math.hypot(x - head.x, y - head.y);
			const back = x - head.x < 1 - (y - head.y) * 0.6;
			if (d <= 4.6 && back && y - head.y < 2 - (x - head.x)) {
				set(scene, x, y, y < head.y - 2 ? C.timber : C.wood);
			}
		}
	}
	// Two locks streaming out behind.
	rect(scene, head.x - 7, head.y - 3, 3, 1, C.wood);
	rect(scene, head.x - 6, head.y - 1, 2, 1, C.wood);
}

/**
 * The speed streaks: from the trailing edge of each row of the runner, a band runs back to the left
 * in the colour it leaves, strong near the runner and fading behind. Every third row is left clear.
 * @param {Canvas} layer
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawStreaks(layer, scene, random) {
	for (let y = 0; y < 64; y++) {
		let x0 = -1;
		for (let x = 0; x < 64; x++) {
			if (get(scene, x, y)) {
				x0 = x;
				break;
			}
		}
		if (x0 < 0 || y % 3 === 0) {
			continue;
		}
		const inside = get(scene, x0 + 1, y) ?? get(scene, x0, y);
		let tones = STREAK_SKIN;
		if (VEST.includes(/** @type {Colour} */ (inside))) {
			tones = STREAK_VEST;
		} else if (
			LEGS.includes(/** @type {Colour} */ (inside)) ||
			LEGS_FAR.includes(/** @type {Colour} */ (inside))
		) {
			tones = STREAK_LEGS;
		}
		const length = 10 + Math.floor(random() * 22);
		const strong = Math.floor(length * 0.45);
		for (let k = 2; k <= length; k++) {
			set(layer, x0 - k, y, k <= strong ? tones[0] : tones[1]);
		}
	}
}

/**
 * The dust kicked up behind the runner's heels: puffs that grow and rise as they fall behind, thinning to wisps.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawDust(layer, random) {
	const puffs = [
		{ x: 17, y: GROUND - 1, r: 2.5 },
		{ x: 11, y: GROUND - 3, r: 4 },
		{ x: 3, y: GROUND - 5, r: 5.5 },
		{ x: -5, y: GROUND - 7, r: 6 },
	];
	puffs.forEach(({ x: cx, y: cy, r }, i) => {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > r) {
					continue;
				}
				// The oldest puffs thin out into a dither.
				if (i >= 2 && (x + y) % 2 === 0 && d > r - 2) {
					continue;
				}
				let colour = DUST;
				if (y > cy + r * 0.3) {
					colour = DUST_SHADE;
				} else if (x - cx + y - cy < -r * 0.6) {
					colour = DUST_LIGHT;
				}
				set(layer, x, y, colour);
			}
		}
	});
	for (let i = 0; i < 10; i++) {
		set(
			layer,
			Math.floor(random() * 24),
			GROUND - 1 - Math.floor(random() * 10),
			DUST
		);
	}
}

/**
 * Pale wind lines rushing past, above and ahead of the runner, over the outline.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawWind(scene, random) {
	for (const [x, y, w] of [
		[2, 6, 14],
		[20, 10, 9],
		[4, 30, 8],
		[54, 38, 8],
		[56, 15, 7],
	]) {
		rect(scene, x, y, w, 1, C.white);
		rect(scene, x + w, y, 2 + Math.floor(random() * 3), 1, C.daySky6);
	}
}

/**
 * Sunlight catching the runner's shoulder and the top of the head, over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	set(scene, BODY.neck.x - 3, BODY.neck.y + 1, C.white);
	set(scene, BODY.head.x - 1, BODY.head.y - 4, C.timberLight);
}
