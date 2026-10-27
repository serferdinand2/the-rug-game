// Mystics: a bald monk in a saffron robe floating cross-legged in meditation at night, his third eye glowing, a wheel of star signs turning behind him.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 31;

/** The wheel of star signs: its hub, and the radii of its band. */
const WHEEL = { x: 31.5, y: 17, outer: 29, inner: 21 };

/** The third eye on his brow. */
const EYE3 = { x: FACE_X, y: 10 };

/** Skin: lit violet by the wheel on his left, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skinTan, C.arcaneLight, 0.35),
	lit: mix(mix(C.skinDeep, C.skinTan, 0.45), C.arcaneLight, 0.15),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.4),
};

/** The saffron robe: lit, plain, shaded and in deep shadow. */
const ROBE = {
	lit: mix(C.gold, C.amber, 0.35),
	base: C.amber,
	shade: mix(C.amber, C.brickRedShade, 0.4),
	dark: mix(C.amber, C.brickRedShade, 0.7),
};

/** The wheel's rims and spokes. */
const RING = {
	bright: mix(C.gold, C.nightSky4, 0.2),
	dim: mix(C.brass, C.nightSky3, 0.35),
};

/** Brows, eyes and lips. */
const FEATURE = {
	brow: mix(C.skinDeepShade, C.night, 0.6),
	white: mix(C.cream, C.skinDeepShade, 0.25),
	whiteLit: C.creamLight,
	lip: mix(C.skinDeepShade, C.brickRedShade, 0.45),
};

/** The figure is lit by hand, so the glows leave it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(ROBE),
	...Object.values(FEATURE),
	C.ink,
];

/**
 * Draws the Mystics portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8013);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 70,
		starRows: 64,
	});
	drawPeaks(layer);
	drawWheel(layer, random);

	drawLegs(scene);
	drawTorso(scene);
	drawArms(scene);
	drawHead(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: Math.round(WHEEL.x),
		y: WHEEL.y,
		radius: 36,
		colour: C.arcane,
		strength: 0.3,
		steps: 4,
		skip: FIGURE,
	});
	drawAura(scene);
	drawThirdEye(scene);
	return scene;
}

/**
 * Far mountains below him, dark violet under a band of mist.
 * @param {Canvas} layer
 */
function drawPeaks(layer) {
	const far = mix(C.headlandRidge, C.nightSky4, 0.3);
	for (let x = 0; x < 64; x++) {
		const farTop = 49 + Math.round(Math.abs(((x + 6) % 22) - 11) * 0.6);
		const nearTop = 56 + Math.round(Math.abs(((x + 15) % 28) - 14) * 0.4);
		for (let y = farTop; y < 64; y++) {
			set(layer, x, y, y >= nearTop ? C.headland : far);
		}
		if (x % 3 !== 0) {
			set(
				layer,
				x,
				59 + (x % 2),
				mix(C.headlandRidge, C.stoneLight, 0.3)
			);
		}
	}
}

/**
 * The wheel of star signs behind him: a violet band between two gold rims, cut into twelve houses
 * by gold spokes, each house holding a small constellation; inside it, a soft violet halo.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWheel(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			const d = Math.hypot(x - WHEEL.x, y - WHEEL.y);
			const angle = Math.atan2(y - WHEEL.y, x - WHEEL.x);
			const house = (((angle / (Math.PI * 2)) * 12 + 12) % 12) + 0.5;
			const spoke = Math.abs(house - Math.round(house)) * d * 0.52 < 0.5;
			let colour = behind;
			if (d > WHEEL.outer + 0.5) {
				continue;
			} else if (
				d > WHEEL.outer - 0.5 ||
				(d <= WHEEL.inner + 0.5 && d > WHEEL.inner - 0.5)
			) {
				colour = RING.bright;
			} else if (d > WHEEL.inner) {
				colour = spoke
					? RING.dim
					: mix(C.nightSky2, C.arcaneShade, 0.4);
			} else {
				colour = mix(behind, C.arcaneShade, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
	// A constellation in each house: three stars, one brighter than the others.
	for (let i = 0; i < 12; i++) {
		const middle = (i / 12) * Math.PI * 2;
		/** @type {[number, number][]} */
		const stars = [];
		for (let j = 0; j < 3; j++) {
			const r = WHEEL.inner + 2 + random() * 4.5;
			const a = middle + (random() - 0.5) * 0.3;
			stars.push([
				Math.round(WHEEL.x + Math.cos(a) * r),
				Math.round(WHEEL.y + Math.sin(a) * r),
			]);
		}
		stars.forEach(([x, y], j) => {
			set(layer, x, y, j === 0 ? C.white : C.starDim);
		});
	}
}

/**
 * His crossed legs, wrapped in the robe, the knees spread wide and both soles turned up.
 * @param {Canvas} scene
 */
function drawLegs(scene) {
	for (let y = 43; y <= 56; y++) {
		const t = (y - 43) / 13;
		const half =
			Math.round(
				17 + Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) * 9
			) -
			Math.max(0, y - 52) * 3;
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = ROBE.base;
			if (u > 0.55 && y < 53) {
				colour = ROBE.lit;
			} else if (u < -0.6 || y >= 54) {
				colour = ROBE.dark;
			} else if (u < -0.1 || y >= 52) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds where the shins cross in front of the knees.
	for (let x = FACE_X - 18; x <= FACE_X + 19; x++) {
		const y = 49 + Math.round(Math.abs(x - FACE_X - 0.5) / 5);
		set(scene, x, y, x > FACE_X ? ROBE.shade : ROBE.dark);
	}
	// The soles of his feet, turned up in the crook of each knee.
	paint(scene, FACE_X - 10, 46, ['.sbbl', 'sbbll', '.ssb.'], {
		s: SKIN.shade,
		b: SKIN.base,
		l: SKIN.lit,
	});
	paint(scene, FACE_X + 7, 46, ['bbll.', 'bblll', '.bbl.'], {
		b: SKIN.base,
		l: SKIN.lit,
	});
}

/**
 * His torso: the robe thrown over his left shoulder and across his chest, his right shoulder and chest bare.
 * @param {Canvas} scene
 */
function drawTorso(scene) {
	for (let y = 23; y <= 46; y++) {
		let half = 3;
		if (y >= 27) {
			half = Math.min(13, 7 + (y - 27) * 3);
		}
		if (y > 33) {
			half = Math.max(10, 13 - Math.floor((y - 33) / 3));
		}
		// The robe's edge runs from his left shoulder down to his right hip.
		const edge = FACE_X + 5 - Math.round((y - 27) * 0.95);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / (half + 0.5);
			let colour;
			if (x >= edge && y >= 27) {
				colour = ROBE.base;
				if (u > 0.7) {
					colour = ROBE.lit;
				} else if (x <= edge + 1) {
					colour = ROBE.shade;
				}
			} else {
				colour = SKIN.base;
				if (u < -0.75) {
					colour = SKIN.dark;
				} else if (u < -0.25 || y === 24 || (y < 27 && x <= FACE_X)) {
					colour = SKIN.shade;
				} else if (u > 0.2) {
					colour = SKIN.lit;
				}
			}
			set(scene, x, y, colour);
		}
	}
	// The robe's lit hem along its edge, and the folds falling from the shoulder.
	for (let y = 27; y <= 46; y++) {
		const edge = FACE_X + 5 - Math.round((y - 27) * 0.95);
		set(scene, edge, y, ROBE.lit);
		if (y > 31) {
			set(scene, FACE_X + 9 - Math.round((y - 31) * 0.4), y, ROBE.shade);
		}
		if (y > 36) {
			set(scene, FACE_X + 4 - Math.round((y - 36) * 0.5), y, ROBE.shade);
		}
	}
	// The bare chest: a shadow under the collarbone and down the breastbone.
	rect(scene, FACE_X - 7, 30, 5, 1, SKIN.shade);
	rect(scene, FACE_X - 3, 33, 1, 4, SKIN.shade);
}

/**
 * Both arms hanging from the shoulders and out to the knees, the hands turned up with thumb and finger touching:
 * his right arm bare, his left draped in the robe to the elbow.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	for (let y = 28; y <= 47; y++) {
		const out = y < 41 ? 14 + (y - 28) * 0.35 : 18.5 + (y - 41) * 0.4;
		// The bare right arm, on the picture's left.
		const left = FACE_X - Math.round(out) - 3;
		for (let i = 0; i < 5; i++) {
			const colour = [
				SKIN.dark,
				SKIN.shade,
				SKIN.shade,
				SKIN.base,
				SKIN.base,
			][i];
			set(scene, left + i, y, colour);
		}
		// The left arm, on the picture's right, in the robe to the elbow and bare below.
		const right = FACE_X + 1 + Math.round(out) - 1;
		for (let i = 0; i < 5; i++) {
			const colour =
				y < 40
					? [ROBE.shade, ROBE.base, ROBE.base, ROBE.lit, ROBE.lit][i]
					: [SKIN.base, SKIN.lit, SKIN.lit, SKIN.glint, SKIN.lit][i];
			set(scene, right + i, y, colour);
		}
	}
	// The sleeve's hem at the elbow.
	rect(scene, FACE_X + 18, 40, 6, 1, ROBE.dark);
	// The hands, palm up on the knees, thumb and forefinger touching in a ring.
	paint(scene, FACE_X - 25, 46, ['.sbb.', 'sbkbs', '.sbb.'], {
		s: SKIN.shade,
		b: SKIN.base,
		k: SKIN.dark,
	});
	paint(scene, FACE_X + 21, 46, ['.bll.', 'blkll', '.bll.'], {
		b: SKIN.base,
		l: SKIN.lit,
		k: SKIN.shade,
	});
}

/**
 * His head: bald and lit violet by the wheel on his left, eyes lowered in calm, a quiet smile.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The face and scalp: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[4, -2, 3],
		[5, -3, 4],
		[6, -4, 5],
		[7, -5, 6],
		[8, -5, 6],
		[9, -5, 6],
		[10, -5, 6],
		[11, -5, 6],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -4, 5],
		[19, -4, 5],
		[20, -4, 5],
		[21, -3, 4],
		[22, -3, 4],
		[23, -2, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 3) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The shine on his scalp.
	rect(scene, FACE_X + 2, 5, 2, 1, SKIN.glint);
	set(scene, FACE_X + 4, 6, SKIN.glint);
	// Ears: the far one in shadow, the near one lit.
	rect(scene, FACE_X - 6, 13, 1, 4, SKIN.shade);
	rect(scene, FACE_X + 7, 13, 1, 4, SKIN.lit);
	set(scene, FACE_X + 7, 14, SKIN.glint);
	// Brows, heavy lids and eyes lowered in calm.
	rect(scene, FACE_X - 4, 13, 3, 1, FEATURE.brow);
	rect(scene, FACE_X + 2, 13, 3, 1, FEATURE.brow);
	rect(scene, FACE_X - 3, 14, 2, 1, SKIN.dark);
	rect(scene, FACE_X + 2, 14, 2, 1, SKIN.base);
	set(scene, FACE_X - 3, 15, FEATURE.white);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, C.ink);
	set(scene, FACE_X + 3, 15, FEATURE.whiteLit);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A quiet smile.
	set(scene, FACE_X - 1, 20, FEATURE.lip);
	rect(scene, FACE_X, 21, 2, 1, FEATURE.lip);
	set(scene, FACE_X + 2, 20, FEATURE.lip);
}

/**
 * A ring of violet light under him where he floats, drawn after the glows.
 * @param {Canvas} scene
 */
function drawAura(scene) {
	for (let x = FACE_X - 17; x <= FACE_X + 18; x++) {
		const u = (x - FACE_X - 0.5) / 17.5;
		const lift = Math.sqrt(Math.max(0, 1 - u * u));
		set(
			scene,
			x,
			59 + Math.round(lift * 1.5),
			Math.abs(u) < 0.6 ? C.arcaneLight : C.arcane
		);
		if (Math.abs(u) < 0.8) {
			set(
				scene,
				x,
				58 + Math.round(lift * 1.5),
				mix(C.arcane, C.nightSky3, 0.45)
			);
		}
	}
}

/**
 * The third eye on his brow, open and glowing, its light on the brow round it; painted last so it stays bright.
 * @param {Canvas} scene
 */
function drawThirdEye(scene) {
	for (const [x, y] of [
		[EYE3.x - 2, EYE3.y],
		[EYE3.x + 2, EYE3.y],
		[EYE3.x, EYE3.y - 2],
		[EYE3.x - 1, EYE3.y + 2],
		[EYE3.x + 1, EYE3.y + 2],
	]) {
		set(scene, x, y, mix(SKIN.base, C.teal, 0.45));
	}
	paint(scene, EYE3.x - 1, EYE3.y - 1, ['.t.', 'TWT', '.t.'], {
		t: C.teal,
		T: C.tealLight,
		W: C.white,
	});
}
