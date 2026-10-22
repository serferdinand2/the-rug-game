// Islanders: an islander woman on a sunny beach with a three-pronged fishing spear and a shell necklace, a flower in her hair, an outrigger canoe under sail and a palm behind.
import {
	createCanvas,
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
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column. */
const FACE_X = 30;

/** The sea's horizon line, and the beach's first row. */
const HORIZON = 33;
const BEACH = 47;

/** The fishing spear's shaft column, and the row her hand grips it at. */
const SPEAR_X = 9;
const GRIP = 44;

/** The palm's crown, where its fronds spring from. */
const CROWN = { x: 59, y: 7 };

/** Deep skin in the sun: its glint and lit side towards the sun on her right, plain, and shaded. */
const SKIN = {
	glint: mix(C.skinDeep, C.lampGlow, 0.45),
	lit: mix(C.skinDeep, C.gold, 0.25),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.35),
};

/** Her thick black hair: sunlit, plain and in shadow. */
const HAIR = {
	lit: mix(C.wood, C.daySky3, 0.35),
	base: mix(C.wood, C.night, 0.4),
	dark: C.night,
};

/** The coral wrap and its cream pattern. */
const WRAP = {
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
	pattern: C.cream,
	patternShade: C.creamShade,
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinDeepShade, 0.4) };

/** Lips. */
const LIPS = {
	upper: mix(C.brickRedShade, C.skinDeepShade, 0.4),
	lower: mix(C.brickRed, C.skinDeep, 0.55),
};

/**
 * Draws the Islanders portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48247);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawSea(layer, { time: 'day', top: HORIZON, random, waves: 26 });
	drawIsland(layer);
	drawBeach(layer, random);

	// The palm and the canoe on their own outlined layer, behind the figure.
	const props = createCanvas(64, 64);
	drawCanoe(props);
	drawPalm(props);
	outline(props, C.ink);

	drawHair(scene);
	drawBody(scene);
	drawFace(scene);
	drawSpearArm(scene);
	drawSpear(scene);
	outline(scene, C.ink);
	underlay(scene, props);
	underlay(scene, layer);
	return scene;
}

/**
 * A far green island on the horizon at the left.
 * @param {Canvas} layer
 */
function drawIsland(layer) {
	for (let x = 0; x < 16; x++) {
		const h = Math.round(3 * Math.sin(((x + 2) / 18) * Math.PI));
		for (let y = HORIZON - h; y < HORIZON; y++) {
			set(
				layer,
				x,
				y,
				y === HORIZON - h
					? mix(C.grass, C.daySky5, 0.4)
					: mix(C.grassShade, C.daySky5, 0.45)
			);
		}
	}
}

/**
 * The beach: wet sand at the waterline with a line of foam, dry pale sand nearer, and a few shells.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top = BEACH + Math.round(Math.sin(x * 0.2) * 0.8);
		set(layer, x, top - 1, C.dayWave);
		for (let y = top; y < 64; y++) {
			let colour = C.sandLight;
			if (y < top + 2) {
				colour = C.sandShade;
			} else if (y < top + 4) {
				colour = C.sand;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 64);
		const y = BEACH + 5 + Math.floor(random() * (64 - BEACH - 5));
		set(layer, x, y, i % 2 ? C.creamLight : C.brickRedLight);
	}
}

/**
 * An outrigger canoe out on the water at the right, its crab-claw sail filled, the float on booms beside it.
 * @param {Canvas} props
 */
function drawCanoe(props) {
	const x0 = 45;
	// The hull: long and low, both ends turned up.
	paint(props, x0, 36, ['t...........t', 'ttTTTTTTTTTtt', '.sssssssssss.'], {
		t: C.timber,
		T: C.timberLight,
		s: C.timberShade,
	});
	// The booms and the float.
	line(props, x0 + 4, 37, x0 + 3, 40, C.timber);
	line(props, x0 + 9, 37, x0 + 9, 40, C.timber);
	rect(props, x0 + 1, 40, 11, 1, C.timberShade);
	// The mast and the crab-claw sail, its two spars curving up from the bow.
	line(props, x0 + 7, 24, x0 + 7, 36, C.wood);
	for (let y = 21; y <= 35; y++) {
		const t = (y - 21) / 14;
		const left = Math.round(x0 + 1 + t * 5 - Math.sin(t * Math.PI) * 2);
		const right = Math.round(x0 + 12 - t * 5);
		for (let x = left; x <= right; x++) {
			set(props, x, y, x < left + 2 ? C.creamShade : C.cream);
		}
	}
	line(props, x0 + 1, 21, x0 + 6, 35, C.timberLight);
	line(props, x0 + 12, 21, x0 + 7, 35, C.timber);
}

/**
 * A tall coconut palm leaning in from the right edge, its fronds fanning over the top right.
 * @param {Canvas} props
 */
function drawPalm(props) {
	// The ringed trunk, curving up from the sand to the crown.
	for (let y = CROWN.y; y < 64; y++) {
		const t = (64 - y) / (64 - CROWN.y);
		const x = Math.round(63 - t * 4 - Math.sin(t * Math.PI) * 2);
		set(props, x, y, y % 3 === 0 ? C.timberShade : C.timberLight);
		set(props, x + 1, y, y % 3 === 0 ? C.wood : C.timber);
		set(props, x - 1, y, y % 3 === 0 ? C.timber : C.sand);
	}
	// Coconuts under the crown.
	paint(props, CROWN.x - 2, CROWN.y + 1, ['.bb', 'bBb', '.b.'], {
		b: C.timber,
		B: C.timberLight,
	});
	// The fronds: each a curve drooping from the crown, leaflets hanging from it.
	/** @type {[number, number, number][]} */
	const fronds = [
		[-17, -3, 7],
		[-13, -6, 9],
		[-7, -7, 5],
		[5, -6, 4],
		[-12, 3, 9],
		[-4, 6, 6],
	];
	for (const [dx, dy, droop] of fronds) {
		const steps = Math.max(Math.abs(dx), Math.abs(dy));
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = Math.round(CROWN.x + dx * t);
			const y = Math.round(CROWN.y + dy * t + droop * t * t);
			set(props, x, y, C.pine);
			set(props, x, y + 1, i % 2 ? C.grassShade : C.pineShade);
			if (i > 1 && i % 2 === 0) {
				set(props, x, y + 2, C.pineShade);
			}
			set(props, x, y - 1, t < 0.8 ? C.pineLight : C.pine);
		}
	}
}

/**
 * Her thick black hair, falling behind her shoulders, a red hibiscus tucked behind her ear.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	for (let y = 2; y <= 34; y++) {
		for (let x = FACE_X - 11; x <= FACE_X + 11; x++) {
			const dx = x - FACE_X;
			const crown = (dx / 9.5) ** 2 + ((y - 13) / 11) ** 2 <= 1;
			const fall =
				y >= 13 && Math.abs(dx) <= 10.5 - Math.max(0, y - 28) * 0.3;
			if (!crown && !fall) {
				continue;
			}
			let colour = HAIR.base;
			if (dx < -5 && y < 18) {
				colour = HAIR.lit;
			} else if (dx > 6) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// Curls along the lit edge.
	for (const [x, y] of [
		[20, 18],
		[21, 22],
		[20, 26],
		[21, 30],
		[22, 8],
		[25, 4],
	]) {
		set(scene, x, y, HAIR.lit);
	}
	// The hibiscus behind her left ear.
	paint(scene, FACE_X + 6, 9, ['.rr.', 'rRRr', 'rRyR', '.rR.'], {
		r: C.brickRed,
		R: C.brickRedLight,
		y: C.gold,
	});
}

/**
 * Her bare shoulders and arms, the coral wrap patterned in cream across her chest, and the shell necklace.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, shaded under the chin.
	for (let y = 24; y <= 30; y++) {
		for (let x = FACE_X - 3; x <= FACE_X + 3; x++) {
			set(
				scene,
				x,
				y,
				x < FACE_X - 1 ? SKIN.lit : y < 27 ? SKIN.dark : SKIN.shade
			);
		}
	}
	// The shoulders, the upper arms and her sides down to the frame's foot.
	for (let y = 30; y < 64; y++) {
		const half = Math.min(17, 5 + Math.round((y - 30) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SKIN.base;
			if (u < -0.82) {
				colour = SKIN.glint;
			} else if (u < -0.3) {
				colour = SKIN.lit;
			} else if (u > 0.6) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The wrap across the chest, from under the arms down.
	for (let y = 41; y < 64; y++) {
		const half = Math.min(13, 11 + Math.round((y - 41) * 0.3));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = WRAP.base;
			if (y === 41) {
				colour = u < 0 ? WRAP.lit : WRAP.base;
			} else if (u > 0.55) {
				colour = WRAP.shade;
			} else if (u < -0.6) {
				colour = WRAP.lit;
			}
			// A band of cream triangles, the islands' pattern, and two plain stripes.
			const row = y - 44;
			if (
				row >= 0 &&
				row < 3 &&
				Math.abs(((x + 30) % 4) - 1.5) <= 1.5 - row
			) {
				colour = u > 0.55 ? WRAP.patternShade : WRAP.pattern;
			}
			if (y === 50 || y === 56) {
				colour = u > 0.55 ? WRAP.patternShade : WRAP.pattern;
			}
			set(scene, x, y, colour);
		}
	}
	// The line between each arm and her side.
	for (let y = 41; y < 64; y++) {
		set(scene, FACE_X - 14, y, SKIN.base);
		set(scene, FACE_X + 14, y, SKIN.dark);
	}
	// The shell necklace: a curve of cream shells round the base of her neck, a big shell at the front.
	for (let i = 0; i <= 12; i++) {
		const t = i / 12;
		const x = Math.round(FACE_X - 8 + 16 * t);
		const y = Math.round(31 + 5 * Math.sin(Math.PI * t));
		set(
			scene,
			x,
			y,
			i % 3 === 0 ? C.brickRedLight : i % 2 ? C.creamLight : C.cream
		);
	}
	paint(scene, FACE_X - 1, 36, ['WWW', 'WcW', '.c.'], {
		W: C.creamLight,
		c: C.creamShade,
	});
}

/**
 * Her face, turned to the viewer and lit by the sun on her right: dark brows, warm eyes, a broad nose
 * and full lips in a calm smile.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[8, -3, 3],
		[9, -5, 5],
		[10, -5, 5],
		[11, -6, 6],
		[12, -6, 6],
		[13, -6, 6],
		[14, -6, 6],
		[15, -6, 6],
		[16, -6, 6],
		[17, -6, 6],
		[18, -5, 5],
		[19, -5, 5],
		[20, -5, 5],
		[21, -4, 4],
		[22, -3, 3],
		[23, -2, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -2) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Her hair's edge over the forehead.
	rect(scene, FACE_X - 3, 8, 7, 1, HAIR.base);
	set(scene, FACE_X - 5, 9, HAIR.base);
	set(scene, FACE_X + 5, 9, HAIR.dark);
	// Ears, the near one lit, the far one under the flower.
	rect(scene, FACE_X - 7, 14, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 7, 14, 1, 3, SKIN.shade);
	// The lit cheekbone.
	set(scene, FACE_X - 4, 17, SKIN.glint);
	// Brows, lids and eyes.
	rect(scene, FACE_X - 4, 12, 3, 1, HAIR.base);
	rect(scene, FACE_X + 2, 12, 3, 1, HAIR.base);
	set(scene, FACE_X - 3, 14, EYE.lit);
	set(scene, FACE_X - 2, 14, C.ink);
	set(scene, FACE_X + 2, 14, C.ink);
	set(scene, FACE_X + 3, 14, EYE.shade);
	rect(scene, FACE_X - 3, 13, 2, 1, SKIN.shade);
	rect(scene, FACE_X + 2, 13, 2, 1, SKIN.dark);
	// A broad nose: the shade line down its far side, a lit tip, the nostrils.
	rect(scene, FACE_X + 1, 15, 1, 3, SKIN.shade);
	set(scene, FACE_X - 1, 18, SKIN.lit);
	set(scene, FACE_X, 18, SKIN.glint);
	set(scene, FACE_X - 1, 19, SKIN.dark);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	// Full lips, smiling.
	set(scene, FACE_X - 2, 20, LIPS.upper);
	rect(scene, FACE_X - 1, 21, 3, 1, LIPS.upper);
	set(scene, FACE_X + 2, 20, LIPS.upper);
	rect(scene, FACE_X - 1, 22, 3, 1, LIPS.lower);
}

/**
 * Her right forearm, angled out from her side to grip the spear.
 * @param {Canvas} scene
 */
function drawSpearArm(scene) {
	for (let y = GRIP + 2; y < 64; y++) {
		const x = Math.round(SPEAR_X + 3 + (y - GRIP - 2) * 0.3);
		set(scene, x, y, SKIN.glint);
		set(scene, x + 1, y, SKIN.lit);
		set(scene, x + 2, y, SKIN.lit);
		set(scene, x + 3, y, SKIN.base);
	}
	// A shell bracelet at the wrist.
	rect(scene, SPEAR_X + 3, GRIP + 4, 4, 1, C.creamLight);
}

/**
 * The three-pronged fishing spear, its shaft upright in her hand, the barbed prongs bound at the top.
 * @param {Canvas} scene
 */
function drawSpear(scene) {
	for (let y = 10; y < 64; y++) {
		set(scene, SPEAR_X, y, C.timberLight);
		set(scene, SPEAR_X + 1, y, C.timber);
	}
	// The binding, and the three prongs with barbs.
	rect(scene, SPEAR_X - 1, 10, 4, 2, C.cream);
	paint(
		scene,
		SPEAR_X - 3,
		1,
		[
			'W...W...W',
			'Wc..W..cW',
			'W...W...W',
			'W...W...W',
			'.W..W..W.',
			'..W.W.W..',
			'...WWW...',
			'....W....',
			'....W....',
		],
		{ W: C.stoneLight, c: C.stone }
	);
	// Her hand round the shaft.
	paint(scene, SPEAR_X - 1, GRIP, ['.WLL.', 'WLLLb', 'WLLLb', '.LLb.'], {
		W: SKIN.glint,
		L: SKIN.lit,
		b: SKIN.base,
	});
}
