// Heralds: a young herald in a quartered tabard blowing a long brass trumpet hung with a crowned banner over a town square at sunrise, townsfolk gathering to listen below the gabled houses.
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
import { drawStreet } from '../../parts/street.js';
import { drawBuilding } from '../../parts/buildings.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column and its first row. */
const FACE_X = 38;
const FACE_TOP = 14;

/** The trumpet, from the mouthpiece at his lips up to the left, to the rim of its bell. */
const TRUMPET = { x0: 32, y0: 25, x1: 4, y1: 11 };

/** The square's kerb, where the houses stand. */
const SQUARE = 47;

/** The rising sun, low on the right over the square. */
const SUN = { x: 59, y: 44 };

/** Skin: lit warm by the rising sun on his left (the viewer's right), plain, and shaded on the far side. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.55),
	lit: mix(C.skin, C.gold, 0.18),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.brickRedShade, 0.35),
};

/** Tousled light-brown hair. */
const HAIR = {
	lit: C.sandLight,
	base: C.sand,
	shade: C.sandShade,
	dark: C.timber,
};

/** The tabard's two colours, each lit and shaded. */
const BLUE = {
	lit: C.daySea1,
	base: C.daySea2,
	shade: C.daySea3,
};
const RED = {
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};

/** The trumpet's brass. */
const BRASS = {
	glint: C.lampGlow,
	lit: C.gold,
	base: C.brass,
	shade: C.lampFrame,
};

/**
 * Draws the Heralds portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(8006);

	drawSky(layer, { time: 'day', horizon: SQUARE, random });
	warmSky(layer);
	drawSun(layer);
	drawStreet(layer, { top: SQUARE });
	const town = createCanvas(64, 64);
	drawBuilding(town, { kind: 'house', x: -2, y: SQUARE - 1, width: 13 });
	drawBuilding(town, { kind: 'house', x: 10, y: SQUARE - 1, width: 11 });
	drawCrowd(town, { x: 1, y: 59, count: 5, random, facing: 'right' });
	outline(town, mix(C.timberShade, C.roofShade, 0.5));
	underlay(town, layer);

	const figure = createCanvas(64, 64);
	drawTabard(figure);
	drawHead(figure);
	outline(figure, C.ink);

	const scene = createCanvas(64, 64);
	drawTrumpet(scene);
	drawPennon(scene);
	drawArm(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, town);
	drawShine(scene);
	return scene;
}

/**
 * Turns the lower sky to a sunrise: the day's blue above gives way, band by band, to pale gold and then
 * warm peach along the rooftops.
 * @param {Canvas} layer
 */
function warmSky(layer) {
	const bands = [
		mix(C.daySky6, C.creamLight, 0.45),
		mix(C.creamLight, C.lampGlow, 0.6),
		mix(C.lampGlow, C.gold, 0.45),
		mix(C.gold, C.duskSky6, 0.45),
	];
	const from = 22;
	for (let y = from; y <= SQUARE; y++) {
		const t = ((y - from) / (SQUARE + 1 - from)) * bands.length;
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < bands.length && t - i > 0.7 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? bands[i + 1] : bands[i]);
		}
	}
	for (let y = 0; y < from; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = layer.p[y * 64 + x];
			if (colour) {
				layer.p[y * 64 + x] = mix(colour, C.creamLight, 0.15);
			}
		}
	}
}

/**
 * The rising sun, half up over the square on the right.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - 7; y <= SUN.y + 7; y++) {
		for (let x = SUN.x - 7; x <= SUN.x + 7; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d <= 4.5) {
				set(layer, x, y, C.lampGlow);
			} else if (d <= 6.5) {
				set(layer, x, y, mix(C.gold, C.duskSky6, 0.3));
			}
		}
	}
}

/**
 * The quartered tabard over his shoulders: blue and red in opposite quarters, edged in gold, over a cream
 * shirt; the sun on his left shoulder.
 * @param {Canvas} scene
 */
function drawTabard(scene) {
	// The neck, in the jaw's shadow.
	rect(scene, FACE_X - 2, 26, 5, 4, SKIN.shade);
	rect(scene, FACE_X + 2, 26, 1, 4, SKIN.lit);
	// The shirt's collar.
	rect(scene, FACE_X - 4, 30, 9, 2, C.cream);
	rect(scene, FACE_X + 2, 30, 3, 2, C.creamLight);
	for (let y = 31; y < 64; y++) {
		const half = Math.min(17, 8 + Math.round((y - 31) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const top = y < 46;
			const left = x <= FACE_X;
			const side = top === left ? BLUE : RED;
			let colour = side.base;
			if (x >= FACE_X + half - 1) {
				colour = side.lit;
			} else if (x <= FACE_X - half + 2) {
				colour = side.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Gold trim round the neck and down the middle.
	for (let x = FACE_X - 5; x <= FACE_X + 5; x++) {
		set(scene, x, 32 + Math.round(Math.abs(x - FACE_X) * -0.2 + 1), C.gold);
	}
	rect(scene, FACE_X, 34, 1, 30, C.amber);
	// A small gold crown in the blue quarter on his left.
	paint(scene, FACE_X + 7, 49, ['g.g.g', 'ggggg', 'gGgGg', 'aaaaa'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
	});
}

/**
 * His head turned three-quarters to the left, blowing the trumpet: tousled light-brown hair, the near cheek
 * puffed round, the eyes along the trumpet, lit by the rising sun on the viewer's right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The hair: a tousled mop over the crown, down over the ear at the back.
	for (let y = 5; y <= 22; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 9; x++) {
			const d = ((x - FACE_X - 0.5) / 8.5) ** 2 + ((y - 14) / 9) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = HAIR.base;
			if (x >= FACE_X + 5 && y < 14) {
				colour = HAIR.lit;
			} else if (x <= FACE_X - 4 || y > 18) {
				colour = HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre; the far cheek is the narrower.
	/** @type {[number, number, number][]} */
	const rows = [
		[0, -5, 4],
		[1, -6, 5],
		[2, -6, 5],
		[3, -6, 5],
		[4, -6, 6],
		[5, -7, 6],
		[6, -7, 6],
		[7, -7, 6],
		[8, -7, 6],
		[9, -6, 5],
		[10, -5, 4],
		[11, -4, 3],
		[12, -3, 2],
	];
	for (const [row, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -4) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, FACE_TOP + row, colour);
		}
	}
	// A fringe of hair falling over the brow.
	paint(
		scene,
		FACE_X - 4,
		FACE_TOP - 1,
		['lbbllbbbsb', '.l.b..b..s'],
		{ l: HAIR.lit, b: HAIR.base, s: HAIR.shade },
		{ mirror: true }
	);
	const eyes = FACE_TOP + 4;
	// The near ear in the hair at the back, and the sun on the near cheek, puffed out round the mouthpiece.
	rect(scene, FACE_X + 7, eyes + 1, 1, 3, SKIN.lit);
	paint(scene, FACE_X + 1, eyes + 3, ['.GG.', 'GLLG', 'LLLL', '.LL.'], {
		G: SKIN.glint,
		L: SKIN.lit,
	});
	// Brows raised with the effort, and eyes turned to the left, along the trumpet.
	rect(scene, FACE_X + 2, eyes - 2, 3, 1, HAIR.dark);
	rect(scene, FACE_X - 3, eyes - 2, 3, 1, HAIR.dark);
	set(scene, FACE_X + 2, eyes, C.ink);
	set(scene, FACE_X + 3, eyes, C.creamLight);
	set(scene, FACE_X - 3, eyes, C.ink);
	set(scene, FACE_X - 2, eyes, mix(C.cream, C.skinShade, 0.4));
	// The nose, its shaded far side and a lit tip.
	rect(scene, FACE_X - 1, eyes + 1, 1, 2, SKIN.shade);
	set(scene, FACE_X - 2, eyes + 3, SKIN.base);
	set(scene, FACE_X - 1, eyes + 3, SKIN.dark);
	// Pursed lips at the mouthpiece.
	paint(scene, FACE_X - 4, eyes + 5, ['Rr', 'rr'], {
		r: C.brickRedShade,
		R: mix(C.brickRed, C.skin, 0.3),
	});
}

/**
 * The long brass trumpet from his lips up to the left, its tube catching the sun along the top, its bell flaring.
 * @param {Canvas} scene
 */
function drawTrumpet(scene) {
	const { x0, y0, x1, y1 } = TRUMPET;
	line(scene, x0, y0 - 1, x1 + 5, y1 + 1, BRASS.lit);
	line(scene, x0, y0, x1 + 5, y1 + 2, BRASS.base);
	line(scene, x0, y0 + 1, x1 + 5, y1 + 3, BRASS.shade);
	// The mouthpiece.
	rect(scene, x0 + 1, y0 - 1, 2, 2, BRASS.base);
	// The bell, flaring open towards the left edge.
	for (let i = 0; i <= 6; i++) {
		const x = x1 + 6 - i;
		const cy = y1 + 2 - Math.round(i * 0.45);
		const half = 1 + Math.round(i * 0.75);
		for (let y = cy - half; y <= cy + half; y++) {
			let colour = BRASS.base;
			if (y === cy - half) {
				colour = BRASS.lit;
			} else if (y === cy + half) {
				colour = BRASS.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The bell's open mouth.
	for (let y = y1 - 5; y <= y1 + 5; y++) {
		set(scene, x1 - 1, y - 1, y < y1 ? BRASS.glint : BRASS.lit);
	}
	// Brass knops along the tube.
	for (const t of [0.35, 0.7]) {
		const x = Math.round(x0 + (x1 + 5 - x0) * t);
		const y = Math.round(y0 + (y1 + 1 - y0) * t);
		rect(scene, x - 1, y - 2, 2, 5, BRASS.base);
		set(scene, x, y - 2, BRASS.lit);
	}
}

/**
 * The banner hanging from the trumpet: blue, fringed in gold, with a gold crown, its tail cut in a swallowtail.
 * @param {Canvas} scene
 */
function drawPennon(scene) {
	const { x0, y0, x1, y1 } = TRUMPET;
	const from = 10;
	const to = 24;
	for (let x = from; x <= to; x++) {
		const top = Math.round(y0 + 2 + ((x - x0) * (y1 - y0)) / (x1 - x0));
		const length = 15;
		const middle = (from + to) / 2;
		for (let j = 0; j < length; j++) {
			const tail =
				j > length - 5 && Math.abs(x - middle) < j - (length - 5);
			if (tail) {
				continue;
			}
			let colour = BLUE.base;
			if (x >= to - 1) {
				colour = BLUE.lit;
			} else if (x <= from + 1) {
				colour = BLUE.shade;
			}
			if (j === 0) {
				colour = C.gold;
			}
			set(scene, x, top + j, colour);
		}
	}
	// The crown on it.
	paint(scene, 15, 23, ['g.g.g', 'ggggg', 'gGgGg', 'aaaaa'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
	});
}

/**
 * His near arm raised, the puffed cream sleeve slashed with red, the elbow down and the hand round the trumpet near his lips.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	// The upper arm, down from the shoulder to the elbow, puffed and slashed.
	for (let y = 32; y <= 46; y++) {
		const mid = 22 - Math.round((y - 32) * 0.1);
		const half = y > 34 && y < 44 ? 4 : 3;
		for (let x = mid - half; x <= mid + half; x++) {
			let colour = C.cream;
			if (x === mid + half) {
				colour = C.creamLight;
			} else if (x <= mid - half + 1) {
				colour = C.creamShade;
			} else if ((x - mid) % 3 === 0 && y > 35 && y < 43) {
				colour = RED.base;
			}
			set(scene, x, y, colour);
		}
	}
	// The forearm, up and in from the elbow to the hand.
	for (let i = 0; i <= 15; i++) {
		const x = 22 + Math.round(i * 0.4);
		const y = 44 - i;
		for (let t = -2; t <= 2; t++) {
			let colour = C.cream;
			if (t === 2) {
				colour = C.creamLight;
			} else if (t === -2) {
				colour = C.creamShade;
			}
			set(scene, x + t, y, colour);
		}
	}
	rect(scene, 25, 28, 6, 1, RED.base);
	rect(scene, 25, 29, 6, 1, RED.shade);
	paint(
		scene,
		27,
		22,
		['.LLS.', 'LLSSs', 'LSSSs', 'LSSs.', '.ss..'],
		{ L: SKIN.lit, S: SKIN.base, s: SKIN.shade },
		{ mirror: true }
	);
}

/**
 * The sun's glint on the trumpet, painted last so it skips the outline.
 * @param {Canvas} scene
 */
function drawShine(scene) {
	set(scene, 22, 19, BRASS.glint);
	set(scene, 21, 19, BRASS.glint);
	set(scene, 13, 15, BRASS.glint);
}
