// Riverfolk: a ferrywoman in a teal headwrap poling her golden reed boat through the dawn mist, stilt houses on the banks behind her.
import {
	createCanvas,
	get,
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
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from its lit edge to its dark one.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the sun
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the sun
 */

/** The far bank: the last row of sky. */
const HORIZON = 33;

/** The face's centre column. */
const FACE_X = 27;

/** The punting pole, from its top to its foot under the water. */
const POLE = { x0: 51, y0: 0, x1: 29, y1: 63 };

/** The boat's keel, where it runs level. */
const KEEL = 57;

/** Skin: gilded by the dawn on her right, purple in the shade on her left. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.45),
	lit: mix(C.skinTan, C.gold, 0.25),
	base: C.skinTan,
	shade: mix(C.skinTanShade, C.duskSky3, 0.2),
	dark: mix(C.skinTanShade, C.night, 0.4),
};

/** The teal headwrap. */
const WRAP = {
	glint: mix(C.tealLight, C.lampGlow, 0.4),
	lit: mix(C.teal, C.gold, 0.3),
	base: C.teal,
	shade: C.tealShade,
	dark: mix(C.tealShade, C.night, 0.4),
};

/** The indigo tunic. */
const TUNIC = {
	glint: mix(C.roofLight, C.duskSky6, 0.45),
	lit: mix(C.roofLight, C.duskSky5, 0.2),
	base: C.roof,
	shade: C.roofShade,
	dark: mix(C.roofShade, C.night, 0.4),
};

/** Her black braid. */
const HAIR = {
	lit: mix(C.wood, C.duskSky5, 0.35),
	base: C.wood,
	dark: mix(C.wood, C.night, 0.5),
};

/** Eye whites on the lit and the shaded side, and the lips. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.45) };
const LIPS = { line: C.brickRedShade, lower: mix(C.brickRed, C.skinTan, 0.4) };

/** The face, wrap and braid are lit by hand, so the sun's glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(WRAP),
	...Object.values(HAIR),
	...Object.values(EYE),
	...Object.values(LIPS),
	C.ink,
	C.gold,
	C.wood,
];

/**
 * Draws the Riverfolk portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(82722);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	// The sky part sets the rising sun on the horizon; the reflection and the glow follow it there.
	const sun = { x: findSun(layer), y: HORIZON };
	drawRiver(layer, random, sun.x);
	drawReeds(layer, random);
	drawStiltHouse(layer, 0, 26, 15, 0.3);
	drawStiltHouse(layer, 54, 28, 11, 0.5);
	drawMist(layer);

	// Four layers, each outlined, so the arms stand clear of the tunic, the boat of her, and the pole of all.
	const body = createCanvas(64, 64);
	drawTunic(body);
	drawFace(body);
	drawWrap(body);
	drawBraid(body);
	outline(body, C.ink);
	const arms = createCanvas(64, 64);
	drawArms(arms);
	outline(arms, C.ink);
	underlay(arms, body);
	const boat = createCanvas(64, 64);
	drawBoat(boat);
	outline(boat, C.ink);
	underlay(boat, arms);
	const scene = createCanvas(64, 64);
	drawPole(scene);
	drawHands(scene);
	outline(scene, C.ink);
	underlay(scene, boat);
	underlay(scene, layer);

	glow(scene, {
		x: sun.x,
		y: sun.y,
		radius: 30,
		colour: C.gold,
		strength: 0.3,
		steps: 4,
		skip: FIGURE,
	});
	drawWetPole(scene);
	return scene;
}

/**
 * Adds a round-ended stroke along a line of points to a mask.
 * @param {Mask} mask
 * @param {[number, number][]} points
 * @param {number} radius
 */
function stroke(mask, points, radius) {
	for (let i = 0; i + 1 < points.length; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2));
		for (let s = 0; s <= steps; s++) {
			const cx = x0 + ((x1 - x0) * s) / steps;
			const cy = y0 + ((y1 - y0) * s) / steps;
			for (let y = Math.floor(cy - radius); y <= cy + radius; y++) {
				for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
					if (Math.hypot(x - cx, y - cy) <= radius) {
						mask.add(`${x},${y}`);
					}
				}
			}
		}
	}
}

/**
 * Paints a mask lit from the right: a glint and a lit band on its right edge, shade on its left.
 * @param {Canvas} canvas
 * @param {Mask} mask
 * @param {Tone} tone
 */
function fill(canvas, mask, tone) {
	for (const key of mask) {
		const [x, y] = key.split(',').map(Number);
		let colour = tone.base;
		if (!mask.has(`${x + 1},${y}`)) {
			colour = tone.glint;
		} else if (!mask.has(`${x + 2},${y}`) || !mask.has(`${x},${y - 1}`)) {
			colour = tone.lit;
		} else if (!mask.has(`${x - 1},${y}`)) {
			colour = tone.dark;
		} else if (!mask.has(`${x - 2},${y}`) || !mask.has(`${x},${y + 1}`)) {
			colour = tone.shade;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * Finds the sun the sky part painted on the horizon: the middle of its bright core.
 * @param {Canvas} layer
 * @returns {number} The sun's column.
 * @throws {Error} When the horizon holds no sun.
 */
function findSun(layer) {
	const core = [];
	for (let x = 0; x < 64; x++) {
		if (get(layer, x, HORIZON) === C.lampGlow) {
			core.push(x);
		}
	}
	if (core.length === 0) {
		throw new Error('riverfolk: no sun on the horizon');
	}
	return Math.round((core[0] + core[core.length - 1]) / 2);
}

/**
 * The river below the far bank: the dawn colours mirrored and darkening towards the viewer,
 * ripples, and the sun's broken reflection.
 * @param {Canvas} layer
 * @param {() => number} random
 * @param {number} sunX - The sun's column, where its reflection falls
 */
function drawRiver(layer, random, sunX) {
	const ramp = [
		mix(C.duskSky6, C.duskSky5, 0.5),
		mix(C.duskSky5, C.duskSky4, 0.6),
		mix(C.duskSky4, C.nightSea2, 0.35),
		mix(C.duskSky3, C.nightSea3, 0.45),
		mix(C.duskSky2, C.nightSea3, 0.5),
	];
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = ((y - HORIZON - 1) / (63 - HORIZON)) * (ramp.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
	for (let i = 0; i < 40; i++) {
		const y = HORIZON + 2 + Math.floor(random() * (62 - HORIZON));
		const x = Math.floor(random() * 60);
		const n = 2 + Math.floor(random() * 4);
		const near = y < HORIZON + 12;
		rect(
			layer,
			x,
			y,
			n,
			1,
			near
				? mix(C.duskSky6, C.lampGlow, 0.3)
				: mix(C.duskSky4, C.duskSky5, 0.5)
		);
	}
	for (let y = HORIZON + 1; y < 64; y += 1 + Math.floor(random() * 2)) {
		const half = Math.max(0, 3 - Math.floor((y - HORIZON) / 8));
		const x = sunX + Math.floor(random() * 3) - 1;
		rect(
			layer,
			x - half,
			y,
			half * 2 + 1,
			1,
			y < HORIZON + 8 ? C.lampGlow : C.gold
		);
	}
}

/**
 * Clumps of reeds and bulrushes along the far bank.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawReeds(layer, random) {
	const reed = mix(C.pineShade, C.duskSky3, 0.55);
	const reedLit = mix(C.pine, C.duskSky5, 0.5);
	const head = mix(C.timberShade, C.duskSky3, 0.4);
	for (const [from, to] of [
		[14, 24],
		[36, 48],
	]) {
		for (let x = from; x <= to; x++) {
			if (random() < 0.35) {
				continue;
			}
			const h = 3 + Math.floor(random() * 6);
			rect(layer, x, HORIZON - h + 1, 1, h, x % 3 ? reed : reedLit);
			if (random() < 0.25) {
				rect(layer, x, HORIZON - h - 1, 1, 2, head);
			}
		}
	}
}

/**
 * A thatched reed house on stilts at the river's edge, its lamp still lit, softened by the mist.
 * @param {Canvas} layer
 * @param {number} x - The house's leftmost column
 * @param {number} floor - The platform's row
 * @param {number} width - The platform's width
 * @param {number} haze - How far the mist and the dawn wash it out, from 0 to 1
 */
function drawStiltHouse(layer, x, floor, width, haze) {
	/** @param {Colour} colour */
	const far = (colour) => mix(colour, C.duskSky3, haze);
	const right = x + width - 1;
	// Stilts down into the water.
	for (let px = x + 1; px <= right; px += 5) {
		rect(layer, px, floor + 1, 1, HORIZON + 6 - floor, far(C.wood));
	}
	// The platform.
	rect(layer, x, floor, width, 1, far(C.timberLight));
	rect(layer, x, floor + 1, width, 1, far(C.timberShade));
	// Woven reed walls, a dark door and a lamp-lit window.
	const wallTop = floor - 7;
	for (let py = wallTop; py < floor; py++) {
		for (let px = x + 1; px < right; px++) {
			set(layer, px, py, far((px + py) % 3 === 0 ? C.sandShade : C.sand));
		}
	}
	const door = x + Math.floor(width / 2);
	rect(layer, door, floor - 5, 2, 5, far(C.wood));
	rect(layer, x + 2, floor - 5, 2, 2, mix(C.gold, C.duskSky4, haze * 0.5));
	// A thatched roof overhanging the walls.
	const apex = x + Math.floor(width / 2);
	for (let r = 0; r <= 7; r++) {
		const py = wallTop - 7 + r;
		for (let px = apex - r - 1; px <= apex + r + 1; px++) {
			let colour = (px + r) % 4 === 0 ? C.timber : C.timberLight;
			if (r === 7) {
				colour = C.timberShade;
			} else if (px > apex) {
				colour = (px + r) % 4 === 0 ? C.sandShade : C.sand;
			}
			set(layer, px, py, far(colour));
		}
	}
}

/**
 * A band of mist lying on the water along the far bank, thickest at the waterline.
 * @param {Canvas} layer
 */
function drawMist(layer) {
	const mist = mix(C.cream, C.duskSky6, 0.35);
	for (let y = 22; y < 48; y++) {
		for (let x = 0; x < 64; x++) {
			const centre = HORIZON + 1 + Math.round(Math.sin(x * 0.17) * 2);
			const t = 1 - Math.abs(y - centre) / 9;
			const behind = get(layer, x, y);
			if (t <= 0 || !behind) {
				continue;
			}
			set(layer, x, y, mix(behind, mist, Math.ceil(t * 3) * 0.15));
		}
	}
}

/**
 * Her sleeveless indigo tunic over the shoulders and chest, a string of gold beads at the neck,
 * and her neck in the chin's shadow.
 * @param {Canvas} scene
 */
function drawTunic(scene) {
	for (let y = 24; y <= 27; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 2; x++) {
			let colour = SKIN.shade;
			if (x === FACE_X + 2) {
				colour = SKIN.lit;
			} else if (y === 25) {
				colour = SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 27; y < 52; y++) {
		const half = [6, 9, 11][y - 27] ?? (y < 40 ? 12 : 11);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = TUNIC.base;
			if (u > 0.9) {
				colour = TUNIC.glint;
			} else if (u > 0.6) {
				colour = TUNIC.lit;
			} else if (u < -0.85) {
				colour = TUNIC.dark;
			} else if (u < -0.35) {
				colour = TUNIC.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The round neckline.
	for (let y = 27; y <= 29; y++) {
		const half = 29 - y + 1;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x > FACE_X ? SKIN.lit : SKIN.shade);
		}
	}
	// Folds falling from the shoulders.
	for (let y = 32; y < 52; y++) {
		set(scene, FACE_X - 6 + Math.round((y - 32) * 0.1), y, TUNIC.dark);
		set(scene, FACE_X + 4 + Math.round((y - 32) * 0.15), y, TUNIC.shade);
	}
	// A woven belt.
	for (let x = FACE_X - 11; x <= FACE_X + 11; x++) {
		set(scene, x, 46, x > FACE_X + 6 ? C.brickRedLight : C.brickRed);
		set(scene, x, 47, x % 3 === 0 ? C.gold : C.brickRedShade);
	}
	// Gold beads along the neckline.
	for (const [x, y] of [
		[FACE_X - 4, 28],
		[FACE_X - 3, 30],
		[FACE_X - 1, 31],
		[FACE_X + 1, 31],
		[FACE_X + 3, 30],
		[FACE_X + 4, 28],
	]) {
		set(scene, x, y, C.gold);
	}
}

/**
 * Her face in three-quarters, turned towards the sunrise on her right, which gilds that side.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -3, 4],
		[11, -4, 5],
		[12, -5, 5],
		[13, -5, 5],
		[14, -6, 5],
		[15, -6, 5],
		[16, -6, 5],
		[17, -6, 6],
		[18, -6, 5],
		[19, -5, 5],
		[20, -5, 4],
		[21, -4, 4],
		[22, -3, 4],
		[23, -2, 3],
		[24, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 4) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Black hair at the temples under the wrap.
	rect(scene, FACE_X - 6, 12, 2, 3, HAIR.base);
	set(scene, FACE_X - 6, 15, HAIR.dark);
	set(scene, FACE_X + 5, 12, HAIR.lit);
	// The near ear in shade, with a gold ring.
	rect(scene, FACE_X - 7, 15, 1, 3, SKIN.shade);
	set(scene, FACE_X - 7, 18, C.gold);
	// The lit cheekbone and the shadow under the near one.
	set(scene, FACE_X + 3, 17, SKIN.glint);
	set(scene, FACE_X - 3, 18, SKIN.dark);
	// Brows, and eyes looking to her right, up the river.
	rect(scene, FACE_X - 4, 13, 3, 1, C.wood);
	rect(scene, FACE_X + 2, 13, 3, 1, C.wood);
	set(scene, FACE_X - 3, 15, EYE.shade);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.lit);
	set(scene, FACE_X + 3, 15, C.ink);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A closed, steady mouth.
	rect(scene, FACE_X - 1, 21, 4, 1, LIPS.line);
	rect(scene, FACE_X, 22, 2, 1, LIPS.lower);
}

/**
 * The teal headwrap: wound high round her head, folds slanting across it and a knot at the front.
 * @param {Canvas} scene
 */
function drawWrap(scene) {
	for (let y = 0; y <= 13; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 8; x++) {
			const dx = x - FACE_X;
			const inside =
				((x - FACE_X + 0.5) / 8.3) ** 2 + ((y - 8) / 7.5) ** 2;
			const edge = Math.abs(dx) <= 3 ? 11 : Math.abs(dx) <= 5 ? 12 : 13;
			if (inside > 1 || y > edge) {
				continue;
			}
			const rim =
				((x + 1 - FACE_X + 0.5) / 8.3) ** 2 + ((y - 8) / 7.5) ** 2 > 1;
			let colour = WRAP.base;
			if (rim && dx > 0) {
				colour = WRAP.glint;
			} else if (dx >= 4) {
				colour = WRAP.lit;
			} else if (dx <= -6) {
				colour = WRAP.dark;
			} else if (dx <= -2) {
				colour = WRAP.shade;
			}
			// The cloth wound round in curving bands.
			const band = y - dx * 0.4 + (dx * dx) / 18;
			if (Math.floor(band) % 3 === 0 && y < edge && !rim) {
				colour = dx > 2 ? WRAP.base : WRAP.dark;
			}
			if (y === edge) {
				colour = dx > 2 ? WRAP.lit : WRAP.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The knot at the front.
	paint(scene, FACE_X + 1, 1, ['.lg', 'lbg', '.l.'], {
		l: WRAP.lit,
		b: WRAP.base,
		g: WRAP.glint,
	});
}

/**
 * Her braid, falling from behind her ear over the near shoulder, tied with a teal cord.
 * @param {Canvas} scene
 */
function drawBraid(scene) {
	for (let y = 14; y <= 36; y++) {
		const x = FACE_X - 8 + Math.round(Math.max(0, y - 22) * -0.08);
		const odd = y % 2 === 1;
		set(scene, x, y, odd ? HAIR.lit : HAIR.dark);
		set(scene, x + 1, y, odd ? HAIR.base : HAIR.lit);
	}
	rect(scene, FACE_X - 10, 37, 3, 1, WRAP.base);
	paint(scene, FACE_X - 10, 38, ['hhh', '.h.'], { h: HAIR.base });
}

/**
 * Her bare arms: the near one down at her side and across to the lower grip, the far one out
 * at the elbow and up to the high grip.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	/** @type {Mask} */
	const near = new Set();
	stroke(
		near,
		[
			[FACE_X - 11, 30],
			[FACE_X - 13, 38],
			[FACE_X - 10, 42],
			[FACE_X + 6, 42],
		],
		2.2
	);
	fill(scene, near, SKIN);
	/** @type {Mask} */
	const far = new Set();
	stroke(
		far,
		[
			[FACE_X + 11, 30],
			[FACE_X + 18, 36],
			[FACE_X + 15, 27],
		],
		2.2
	);
	fill(scene, far, SKIN);
}

/**
 * The punting pole, two pixels wide, lit along its right side.
 * @param {Canvas} scene
 */
function drawPole(scene) {
	const { x0, y0, x1, y1 } = POLE;
	for (let y = y0; y <= y1; y++) {
		const x = Math.round(x0 + ((x1 - x0) * (y - y0)) / (y1 - y0));
		set(scene, x, y, C.timber);
		set(scene, x + 1, y, C.timberLight);
	}
}

/**
 * Her two fists round the pole: the high one by her shoulder, the low one at her waist.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	const fist = ['.sbl.', 'sbbll', 'sbblg', '.sbl.'];
	const keys = { s: SKIN.shade, b: SKIN.base, l: SKIN.lit, g: SKIN.glint };
	paint(scene, poleX(24) - 2, 22, fist, keys);
	paint(scene, poleX(42) - 2, 40, fist, keys);
}

/**
 * The pole's column at a row.
 * @param {number} y
 * @returns {number}
 */
function poleX(y) {
	const { x0, y0, x1, y1 } = POLE;
	return Math.round(x0 + ((x1 - x0) * (y - y0)) / (y1 - y0));
}

/**
 * The golden reed boat: bundles bound with rope, its prow sweeping up to a curl on the right.
 * @param {Canvas} scene
 */
function drawBoat(scene) {
	for (let x = 0; x <= 60; x++) {
		const t = Math.max(0, x - 40);
		const centre = 53 - Math.round((t / 20) ** 2 * 21);
		const half = Math.max(1, 4 - Math.round(t * 0.15));
		const top = centre - half;
		const bottom = centre + half;
		for (let y = top; y <= bottom; y++) {
			const band = (y - top) % 3;
			let colour =
				band === 1 ? C.sand : band === 2 ? C.sandShade : C.sandLight;
			if (y >= bottom - 1) {
				colour = C.sandShade;
			}
			if (x % 11 === 5 && x < 50) {
				colour = y === top ? C.timberLight : C.timber;
			}
			set(scene, x, y, colour);
		}
	}
	// The curl at the prow's tip, bending back over the boat.
	paint(scene, 57, 28, ['.ml', 's..l', 's..l'], {
		l: C.sandLight,
		m: C.sand,
		s: C.sandShade,
	});
}

/**
 * Darkens the pole below the waterline and rings the water where it goes in.
 * @param {Canvas} scene
 */
function drawWetPole(scene) {
	for (let y = KEEL + 2; y < 64; y++) {
		for (let x = poleX(y) - 1; x <= poleX(y) + 2; x++) {
			const colour = get(scene, x, y);
			if (colour) {
				set(scene, x, y, mix(colour, C.duskSky2, 0.45));
			}
		}
	}
	const x = poleX(KEEL + 2);
	rect(scene, x - 3, KEEL + 2, 2, 1, mix(C.duskSky6, C.lampGlow, 0.3));
	rect(scene, x + 3, KEEL + 2, 2, 1, mix(C.duskSky6, C.lampGlow, 0.3));
}
