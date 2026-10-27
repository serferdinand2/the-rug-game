// Infiltrators: a black-masked infiltrator crouched on a rooftop against the full moon, dagger drawn, above an enemy camp of tents and campfires at night.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The head's centre column. */
const HEAD_X = 24;

/** The full moon behind the head. */
const MOON = { x: 34, y: 12, r: 10 };

/** The far hills' line, and the roof ridge the infiltrator crouches on, rising from left to right. */
const HILLS = 36;
const RIDGE = 55;

/**
 * The ridge's top row at a column.
 * @param {number} x
 * @returns {number}
 */
function ridgeAt(x) {
	return Math.round(RIDGE + 3 - x * 0.1);
}

/** The campfires below: their centres, the last one at the door of the far-left tent, clear of the knee. */
const FIRES = [
	{ x: 46, y: 47 },
	{ x: 59, y: 43 },
	{ x: 3, y: 49 },
];

/** The flames' and logs' colours, which the glows leave alone. */
const FLAMES = [C.lampGlow, C.white, C.gold, C.amber, C.timberShade];

/** Skin round the eyes: lit warm by the fires below on its left, plain, and shaded. */
const SKIN = {
	lit: mix(C.skinTan, C.amber, 0.3),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.night, 0.4),
};

/** The dark blue-black hood and clothes: moonlit on the edge, plain, in shadow and in the folds. */
const CLOTH = {
	moon: mix(C.railLight, C.roofLight, 0.3),
	lit: C.roofLight,
	base: C.roof,
	shade: C.roofShade,
	dark: mix(C.roofShade, C.night, 0.6),
};

/** The red scarf streaming from the neck. */
const SCARF = {
	lit: C.brickRed,
	base: C.brickRedShade,
	dark: mix(C.brickRedShade, C.night, 0.4),
};

/** The dagger's blade, catching the moon. */
const BLADE = { edge: C.white, base: C.stoneLight, shade: C.stone };

/** Colours the fires' glow leaves alone: the figure, lit by hand. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(CLOTH),
	...Object.values(SCARF),
	...Object.values(BLADE),
	C.ink,
	C.cream,
	C.brass,
	C.gold,
];

/**
 * Draws the Infiltrators portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48239);

	drawSky(layer, {
		time: 'night',
		horizon: HILLS,
		random,
		stars: 34,
		starRows: 30,
	});
	drawMoon(layer);
	drawCamp(layer, random);
	drawFires(layer);

	// Two layers, each outlined, so the dagger arm and the raised knee stand clear of the body.
	const figure = createCanvas(64, 64);
	drawScarf(figure);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	drawKnee(scene);
	drawDaggerArm(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	const roof = createCanvas(64, 64);
	drawRoof(roof);
	underlay(roof, scene);
	underlay(roof, layer);

	for (const fire of FIRES) {
		glow(roof, {
			x: fire.x,
			y: fire.y,
			radius: 11,
			colour: C.amber,
			strength: 0.45,
			steps: 3,
			skip: [...FIGURE, ...FLAMES],
		});
	}
	return roof;
}

/**
 * The full moon, low behind the infiltrator's head, with a few darker seas.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.4) {
				continue;
			}
			set(layer, x, y, d > r - 1.2 ? C.moonRim : C.moon);
		}
	}
	for (const [x, y, w] of [
		[cx + 2, cy - 5, 3],
		[cx + 4, cy + 1, 2],
		[cx - 6, cy + 4, 2],
	]) {
		rect(layer, x, y, w, 2, C.moonRim);
	}
	// A pale halo round it.
	for (let y = cy - r - 3; y <= cy + r + 3; y++) {
		for (let x = cx - r - 3; x <= cx + r + 3; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.4 && d <= r + 2.5 && y <= HILLS) {
				set(layer, x, y, mix(C.nightSky4, C.starDim, 0.25));
			}
		}
	}
}

/**
 * The enemy camp below: dark hills, trampled ground, pale tents lit by their fires and a war banner.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCamp(layer, random) {
	// The hills, a dark rolling line.
	for (let x = 0; x < 64; x++) {
		const top =
			HILLS -
			3 +
			Math.round(2.5 * Math.sin(x * 0.11 + 1) + 1.5 * Math.sin(x * 0.29));
		for (let y = top; y <= HILLS + 3; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
	// The ground the camp stands on.
	for (let y = HILLS + 4; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				mix(C.forestFloorShade, C.night, 0.55 - (y - HILLS) * 0.008)
			);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = HILLS + 5 + Math.floor(random() * (RIDGE - HILLS - 5));
		set(layer, x, y, mix(C.forestFloor, C.night, 0.5));
	}
	// Tents: pale canvas, lit on the side facing their fire.
	/** @type {[number, number, number, number, boolean][]} */
	const tents = [
		[36, 47, 9, 7, false],
		[50, 44, 7, 6, true],
		[54, 52, 10, 7, false],
		[0, 46, 6, 5, false],
		[11, 49, 8, 6, true],
	];
	for (const [x, base, w, h, litLeft] of tents) {
		drawTent(layer, x, base, w, h, litLeft);
	}
	// A war banner on a tall pole at the camp's far end.
	line(layer, 57, 30, 57, 43, C.wood);
	rect(layer, 58, 30, 6, 4, C.brickRedShade);
	rect(layer, 58, 30, 6, 1, C.brickRed);
	set(layer, 60, 31, C.ink);
	set(layer, 61, 32, C.ink);
}

/**
 * One tent: a peaked canvas with a dark door slit, lit on one side by the nearest fire.
 * @param {Canvas} layer
 * @param {number} x - The tent's leftmost column
 * @param {number} base - The tent's bottom row
 * @param {number} w - Its width
 * @param {number} h - Its height
 * @param {boolean} litLeft - Whether the fire is on its left
 */
function drawTent(layer, x, base, w, h, litLeft) {
	const lit = mix(mix(C.cream, C.amber, 0.3), C.night, 0.25);
	const dim = mix(C.creamShade, C.night, 0.55);
	const peak = x + Math.floor(w / 2);
	for (let y = base - h + 1; y <= base; y++) {
		const half = Math.round(((y - (base - h + 1)) / (h - 1)) * (w / 2));
		for (let px = peak - half; px <= peak + half; px++) {
			const left = px < peak;
			set(layer, px, y, left === litLeft ? lit : dim);
		}
	}
	line(layer, peak, base - h + 3, peak, base, mix(C.wood, C.night, 0.3));
}

/**
 * The scarf's long red tail streaming out behind the neck in the wind.
 * @param {Canvas} scene
 */
function drawScarf(scene) {
	for (let x = 1; x <= HEAD_X - 6; x++) {
		const t = (HEAD_X - 6 - x) / (HEAD_X - 7);
		const mid = Math.round(26 - t * 6 + Math.sin(x * 0.7) * 1.5);
		const half = t > 0.7 ? 0 : 1;
		for (let y = mid - half; y <= mid + half + 1; y++) {
			let colour = SCARF.base;
			if (y === mid - half) {
				colour = SCARF.lit;
			} else if (y === mid + half + 1) {
				colour = SCARF.dark;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The crouched body: hunched shoulders and a back bent over the ridge, a red sash at the waist,
 * moonlight along the far shoulder, and the folded leg's foot on the ridge.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	for (let x = 8; x <= 40; x++) {
		for (let y = 24; y < ridgeAt(x); y++) {
			const left = Math.max(9, HEAD_X - 6 - Math.round((y - 24) * 1.3));
			const right = Math.min(37, HEAD_X + 7 + Math.round((y - 24) * 0.9));
			if (x < left || x > right) {
				continue;
			}
			const u = (x - left) / Math.max(1, right - left);
			let colour = CLOTH.base;
			if (u > 0.85) {
				colour = CLOTH.lit;
			} else if (u < 0.25) {
				colour = CLOTH.dark;
			} else if (u < 0.55) {
				colour = CLOTH.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Moonlight along the top of the far shoulder.
	for (let x = HEAD_X + 7; x <= HEAD_X + 13; x++) {
		set(scene, x, 24 + Math.round((x - HEAD_X - 7) * 1.1), CLOTH.moon);
	}
	// The scarf's knot at the throat.
	rect(scene, HEAD_X - 5, 24, 8, 3, SCARF.base);
	rect(scene, HEAD_X - 5, 24, 8, 1, SCARF.lit);
	rect(scene, HEAD_X - 6, 25, 2, 3, SCARF.dark);
	// A red sash round the waist.
	for (let x = 14; x <= 37; x++) {
		rect(scene, x, 47, 1, 2, x > 31 ? SCARF.lit : SCARF.base);
	}
	set(scene, 36, 49, SCARF.base);
	set(scene, 37, 50, SCARF.dark);
	// The folded leg's foot on the ridge at the right.
	paint(
		scene,
		33,
		ridgeAt(36) - 4,
		['..lll..', '.lbbbb.', 'dbbbbbb', 'dddddbb'],
		{
			l: CLOTH.lit,
			b: CLOTH.base,
			d: CLOTH.dark,
		}
	);
}

/**
 * The hooded head with only the eyes bared: a mask over nose and mouth, the eyes narrowed and turned
 * down towards the camp, the moon catching the hood's edge.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 5; y <= 25; y++) {
		for (let x = HEAD_X - 9; x <= HEAD_X + 9; x++) {
			const dx = x - HEAD_X;
			const hood = (dx / 8.6) ** 2 + ((y - 15) / 10.2) ** 2;
			if (hood > 1) {
				continue;
			}
			let colour = CLOTH.base;
			if (hood > 0.72 && dx > 2) {
				colour = CLOTH.moon;
			} else if (dx > 3) {
				colour = CLOTH.lit;
			} else if (dx < -5) {
				colour = CLOTH.dark;
			} else if (dx < -1) {
				colour = CLOTH.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The bared band round the eyes: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const band = [
		[13, -5, 5],
		[14, -6, 6],
		[15, -6, 6],
		[16, -5, 5],
	];
	for (const [y, from, to] of band) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx >= 3) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, HEAD_X + dx, y, colour);
		}
	}
	// Brows drawn down in a frown, and the eyes narrowed, looking down to its left at the camp.
	rect(scene, HEAD_X - 4, 13, 3, 1, SKIN.dark);
	set(scene, HEAD_X - 1, 14, SKIN.dark);
	rect(scene, HEAD_X + 2, 13, 3, 1, mix(C.skinTanShade, C.night, 0.2));
	set(scene, HEAD_X + 1, 14, SKIN.shade);
	set(scene, HEAD_X - 4, 15, mix(C.cream, C.skinTanShade, 0.5));
	set(scene, HEAD_X - 3, 15, C.ink);
	set(scene, HEAD_X - 2, 15, C.ink);
	set(scene, HEAD_X + 2, 15, C.cream);
	set(scene, HEAD_X + 3, 15, C.ink);
	set(scene, HEAD_X + 4, 15, C.ink);
	// The bridge of the nose between the eyes, under the mask's top edge.
	set(scene, HEAD_X, 15, SKIN.lit);
	set(scene, HEAD_X - 1, 16, SKIN.shade);
	// The mask over nose and mouth: the nose raising the cloth, a fold under it.
	rect(scene, HEAD_X - 5, 17, 11, 1, CLOTH.lit);
	set(scene, HEAD_X, 18, CLOTH.moon);
	set(scene, HEAD_X + 1, 19, CLOTH.lit);
	rect(scene, HEAD_X - 2, 21, 4, 1, CLOTH.shade);
}

/**
 * The raised near knee in the foreground at the left, the near hand resting on it.
 * @param {Canvas} scene
 */
function drawKnee(scene) {
	for (let x = 5; x <= 22; x++) {
		for (let y = 36; y < ridgeAt(x); y++) {
			const thigh = ((x - 14) / 7.5) ** 2 + ((y - 41) / 5) ** 2 <= 1;
			const shin = y >= 41 && x >= 7 && x <= 15;
			if (!thigh && !shin) {
				continue;
			}
			let colour = CLOTH.base;
			if (thigh && ((x - 14) / 7.5) ** 2 + ((y - 1 - 41) / 5) ** 2 > 1) {
				colour = CLOTH.moon;
			} else if (y < 40 && thigh) {
				colour = CLOTH.lit;
			} else if (x < 9 || (x > 13 && y > 44)) {
				colour = CLOTH.dark;
			} else if (y > 44) {
				colour = CLOTH.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Bindings round the shin.
	for (const y of [48, 52]) {
		rect(scene, 7, y, 9, 1, CLOTH.lit);
	}
	// The hand hanging over the knee.
	paint(scene, 16, 37, ['.bbl.', 'sbbll', 'sbbbl', '.sbb.', '.s.b.'], {
		l: SKIN.lit,
		b: SKIN.base,
		s: SKIN.shade,
	});
}

/**
 * The dagger arm, thrust forward over the camp: the sleeve from the far shoulder, the gloved fist and the
 * blade pointing up, gleaming in the moonlight.
 * @param {Canvas} scene
 */
function drawDaggerArm(scene) {
	// The forearm reaching out to the right.
	for (let x = 30; x <= 44; x++) {
		const mid = Math.round(38 - (x - 30) * 0.25);
		for (let y = mid - 2; y <= mid + 2; y++) {
			let colour = CLOTH.base;
			if (y === mid - 2) {
				colour = CLOTH.moon;
			} else if (y === mid - 1) {
				colour = CLOTH.lit;
			} else if (y === mid + 2) {
				colour = CLOTH.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The fist round the grip, knuckles lit by the fires.
	paint(scene, 44, 32, ['.lll.', 'lbbbd', 'lbbbd', 'bbbdd', '.ddd.'], {
		l: SKIN.lit,
		b: SKIN.base,
		d: SKIN.shade,
	});
	// The guard, and the blade rising from the fist.
	rect(scene, 43, 31, 7, 1, C.gold);
	set(scene, 43, 31, C.brass);
	for (let y = 20; y <= 30; y++) {
		const x = 46 + Math.round((30 - y) * 0.25);
		set(scene, x, y, BLADE.edge);
		set(scene, x + 1, y, y < 22 ? BLADE.edge : BLADE.base);
		if (y > 22) {
			set(scene, x + 2, y, BLADE.shade);
		}
	}
	// The pommel under the fist.
	rect(scene, 45, 37, 3, 2, C.brass);
}

/**
 * The tiled roof the infiltrator crouches on: a stone-capped ridge rising across the frame and rows of
 * dark curved tiles below it, their lips catching the moon.
 * @param {Canvas} roof
 */
function drawRoof(roof) {
	const tile = mix(C.roofShade, C.night, 0.25);
	const tileLit = mix(C.roof, C.railLight, 0.25);
	const tileDark = mix(C.roofShade, C.night, 0.65);
	for (let x = 0; x < 64; x++) {
		const top = ridgeAt(x);
		for (let y = top; y < 64; y++) {
			const depth = y - top - 2;
			let colour = tile;
			if (depth < 0) {
				colour = depth === -2 ? C.stoneLight : C.stone;
			} else if (depth % 4 === 3) {
				colour = tileLit;
			} else if (
				(x + Math.floor(depth / 4) * 2) % 4 === 0 ||
				depth % 4 === 2
			) {
				colour = tileDark;
			}
			set(roof, x, y, colour);
		}
	}
}

/**
 * The campfires, painted on the background so the figure always covers them; the glows skip their colours.
 * @param {Canvas} layer
 */
function drawFires(layer) {
	for (const { x, y } of FIRES) {
		paint(layer, x - 1, y - 3, ['.g.', 'gwg', 'gWa', 'aaa'], {
			w: C.lampGlow,
			W: C.white,
			g: C.gold,
			a: C.amber,
		});
		rect(layer, x - 2, y + 1, 5, 1, C.timberShade);
	}
}
