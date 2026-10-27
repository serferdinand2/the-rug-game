// Nomads: a horsewoman in a fur hat and a fur-collared coat standing beside her chestnut horse on the open steppe by day, felt yurts with smoke behind.
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
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row. */
const HORIZON = 39;

/** The face's centre column. */
const FACE_X = 24;

/** The horse's head: the middle of its brow and of its muzzle, and its width at each. */
const BROW = { x: 55, y: 12, r: 6 };
const MUZZLE = { x: 43, y: 27, r: 4 };

/** Where the reins leave the bit, and where her hand holds them. */
const BIT = { x: 45, y: 30 };
const HAND = { x: 35, y: 44 };

/** Skin: lit by the sun on her right, plain, and shaded on the side towards the horse. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.4),
	lit: mix(C.skinTan, C.skin, 0.55),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.wood, 0.4),
};

/** Her coat: deep blue felt. */
const COAT = {
	lit: mix(C.daySea2, C.daySky4, 0.3),
	base: C.daySea3,
	shade: mix(C.daySea3, C.night, 0.35),
	dark: mix(C.daySea3, C.night, 0.6),
};

/** Fox fur on her hat, and white sheepskin at her collar. */
const FOX = {
	lit: mix(C.amber, C.gold, 0.3),
	base: C.amber,
	shade: mix(C.amber, C.timber, 0.55),
};
const FLEECE = { lit: C.creamLight, base: C.cream, shade: C.creamShade };

/** Her black braids. */
const HAIR = { lit: mix(C.wood, C.roofLight, 0.35), base: C.wood, dark: C.ink };

/** The chestnut horse: sunlit, plain, shaded and dark, with a black mane and a white blaze. */
const HORSE = {
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
	dark: mix(C.timberShade, C.night, 0.35),
	mane: mix(C.wood, C.night, 0.4),
	maneLit: C.wood,
	blaze: C.cream,
};

/**
 * Draws the Nomads portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8014);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	ripenGrass(layer);
	drawSmoke(layer, { x: 6, y: 31, tone: 'smoke', puffs: 3, drift: -1 });
	drawSmoke(layer, { x: 46, y: 35, tone: 'smoke', puffs: 2, drift: 1 });

	const far = createCanvas(64, 64);
	drawYurt(far, 6, HORIZON + 2, 7);
	drawYurt(far, 47, HORIZON, 4);
	outline(far, C.ink);
	underlay(far, layer);

	const horse = createCanvas(64, 64);
	drawHorse(horse);
	outline(horse, C.ink);
	underlay(horse, far);

	// The rider, then her arm on its own layer, so its outline sets it off from the coat.
	const rider = createCanvas(64, 64);
	drawQuiver(rider);
	drawCoat(rider);
	drawHead(rider);
	outline(rider, C.ink);
	underlay(rider, horse);

	drawHand(scene);
	outline(scene, C.ink);
	drawReins(scene);
	underlay(scene, rider);
	return scene;
}

/**
 * Low blue hills along the horizon, far across the steppe.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = HORIZON - 3 - Math.round(2 + 2 * Math.sin(x * 0.11 + 1));
		for (let y = top; y <= HORIZON; y++) {
			set(
				layer,
				x,
				y,
				y === top
					? mix(C.daySky4, C.grassShade, 0.3)
					: mix(C.daySky3, C.grassShade, 0.4)
			);
		}
	}
}

/**
 * Turns the green grass to the gold of the summer steppe.
 * @param {Canvas} layer
 */
function ripenGrass(layer) {
	for (let y = HORIZON - 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (
				colour === C.grass ||
				colour === C.grassLight ||
				colour === C.grassShade
			) {
				set(layer, x, y, mix(colour, C.sand, 0.4));
			}
		}
	}
}

/**
 * A felt yurt: a white drum wall under a low domed roof, a red door and a smoke hole at the crown.
 * @param {Canvas} canvas
 * @param {number} cx - The centre column
 * @param {number} base - The bottom row
 * @param {number} half - Half the width
 */
function drawYurt(canvas, cx, base, half) {
	const wall = Math.max(2, Math.round(half * 0.55));
	for (let y = base - wall; y <= base; y++) {
		for (let x = cx - half; x <= cx + half; x++) {
			set(canvas, x, y, x > cx + half / 2 ? C.creamShade : C.creamLight);
		}
	}
	const roof = Math.max(2, Math.round(half * 0.7));
	for (let y = base - wall - roof; y < base - wall; y++) {
		const w = Math.round(
			half * Math.sqrt(1 - ((base - wall - y) / (roof + 1)) ** 2)
		);
		for (let x = cx - w; x <= cx + w; x++) {
			set(canvas, x, y, x > cx + w / 2 ? C.creamShade : C.cream);
		}
	}
	// A band of rope round the wall, and the door.
	rect(canvas, cx - half, base - wall + 1, half * 2 + 1, 1, C.timberLight);
	rect(
		canvas,
		cx - 1,
		base - Math.min(2, wall - 1),
		2,
		Math.min(3, wall),
		C.brickRed
	);
	set(canvas, cx, base - wall - roof, C.timber);
}

/**
 * The horse standing at her side: its chestnut head turned down to her, the near eye on her,
 * a white blaze and a red bridle; its neck and shoulder filling the right of the picture.
 * @param {Canvas} canvas
 */
function drawHorse(canvas) {
	// The neck, running back from the head to the right edge, and the chest and foreleg below it.
	for (let y = 4; y < 64; y++) {
		let from = 58;
		if (y < 10) {
			from = 60 - Math.round((y - 4) * 0.5);
		} else if (y > 22 && y <= 38) {
			from = 60 - Math.round((y - 23) * 0.55);
		} else if (y > 38 && y <= 48) {
			from = 52 + Math.round(((y - 41) / 3.5) ** 2);
		} else if (y > 48) {
			from = 55;
		}
		for (let x = from; x < 64; x++) {
			let colour = HORSE.base;
			if (y > 48) {
				colour =
					x < 58 ? (x === from ? HORSE.lit : HORSE.base) : HORSE.dark;
			} else if (x >= 62) {
				colour = HORSE.dark;
			} else if (x >= 60 || (y > 44 && x > from + 3)) {
				colour = HORSE.shade;
			} else if (y > 22 && x < from + 3) {
				colour = HORSE.lit;
			}
			set(canvas, x, y, colour);
		}
	}
	// The line of the neck's muscle, and the shoulder above the foreleg.
	line(canvas, 59, 25, 61, 38, HORSE.shade);
	line(canvas, 56, 41, 60, 47, HORSE.shade);
	line(canvas, 58, 49, 58, 63, mix(HORSE.dark, C.night, 0.3));
	// The mane along the crest.
	for (let y = 4; y < 20; y++) {
		const x = 58 + Math.round((y - 4) * 0.35);
		set(canvas, x, y, HORSE.maneLit);
		set(canvas, x + 1, y, HORSE.mane);
		set(canvas, x + 2, y, HORSE.mane);
		set(canvas, x + 3, y, HORSE.mane);
	}
	// The head: a tapering shape from the brow down to the muzzle, with a round cheek.
	const ax = MUZZLE.x - BROW.x;
	const ay = MUZZLE.y - BROW.y;
	const length = Math.hypot(ax, ay);
	for (let y = 2; y < 36; y++) {
		for (let x = 36; x < 64; x++) {
			const t = Math.max(
				0,
				Math.min(
					1,
					((x - BROW.x) * ax + (y - BROW.y) * ay) / length ** 2
				)
			);
			const px = BROW.x + ax * t;
			const py = BROW.y + ay * t;
			const r = BROW.r + (MUZZLE.r - BROW.r) * t;
			const d = Math.hypot(x - px, y - py);
			const cheek = Math.hypot(x - 57, y - 17) <= 5.5;
			if (d > r && !cheek) {
				continue;
			}
			// Light from the upper left: which side of the head's line the pixel lies.
			const side = ((x - px) * ay - (y - py) * ax) / length;
			let colour = HORSE.base;
			if (cheek && d > r) {
				colour = x > 58 || y > 19 ? HORSE.shade : HORSE.base;
			} else if (side > r * 0.35) {
				colour = HORSE.lit;
			} else if (side < -r * 0.45) {
				colour = HORSE.shade;
			}
			set(canvas, x, y, colour);
		}
	}
	// The ears, pricked forward.
	paint(canvas, 53, 1, ['.L...', 'LB...', 'LpB..', 'LpB.L', '.BBLB'], {
		L: HORSE.lit,
		B: HORSE.base,
		p: mix(HORSE.shade, C.brickRed, 0.3),
	});
	paint(canvas, 57, 2, ['..B', '.BS', 'BpS', 'BBS'], {
		B: HORSE.base,
		S: HORSE.shade,
		p: mix(HORSE.shade, C.brickRed, 0.3),
	});
	// The forelock falling between the ears.
	paint(canvas, 54, 6, ['.mmm', 'mmM.', 'mM..', '.m..'], {
		m: HORSE.mane,
		M: HORSE.maneLit,
	});
	// The blaze down the middle of the face.
	for (let t = 0.25; t <= 1; t += 0.05) {
		const x = Math.round(BROW.x + ax * t + 0.6);
		const y = Math.round(BROW.y + ay * t - 0.6);
		set(canvas, x, y, HORSE.blaze);
		if (t < 0.55) {
			set(canvas, x + 1, y, HORSE.blaze);
		}
	}
	// The near eye, dark with a glint, and the nostril and mouth.
	paint(canvas, 51, 14, ['kk', 'kw'], { k: C.ink, w: C.white });
	rect(canvas, 51, 13, 2, 1, HORSE.dark);
	paint(canvas, 40, 26, ['.k', 'kk'], { k: HORSE.dark });
	line(canvas, 41, 30, 44, 31, HORSE.dark);
	// The bridle: a noseband, a cheek strap up to the brow band, brass rings.
	line(canvas, 41, 24, 47, 30, C.brickRed);
	line(canvas, 47, 30, 56, 21, C.brickRedShade);
	line(canvas, 53, 9, 59, 10, C.brickRed);
	line(canvas, 55, 21, 58, 10, C.brickRed);
	set(canvas, 47, 30, C.gold);
	set(canvas, 55, 21, C.gold);
}

/**
 * A leather quiver slung on her back, three fletched arrows standing up over her right shoulder.
 * @param {Canvas} scene
 */
function drawQuiver(scene) {
	for (let y = 22; y <= 32; y++) {
		const x = 9 + Math.round((y - 22) * 0.35);
		set(scene, x, y, C.timberLight);
		set(scene, x + 1, y, C.timber);
		set(scene, x + 2, y, C.timberShade);
	}
	rect(scene, 9, 22, 3, 1, C.brass);
	paint(
		scene,
		6,
		16,
		['c..r.', 'cc.rr', '.cr.r', 'c.r..', '.wwr.', '..w..'],
		{ c: C.creamLight, r: C.brickRed, w: C.timberLight }
	);
}

/**
 * Her coat: blue felt to the ground, closed across her chest from her right to her left, edged with gold,
 * a white fleece collar, a red sash with a knife and a pouch, and her right arm down by her side.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	for (let y = 26; y < 64; y++) {
		const half = Math.min(15, 7 + Math.round((y - 26) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = COAT.base;
			if (u < -0.75) {
				colour = COAT.lit;
			} else if (u > 0.7) {
				colour = COAT.dark;
			} else if (u > 0.2) {
				colour = COAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The arm hanging at her side: a seam down the sleeve.
	for (let y = 33; y < 64; y++) {
		set(scene, FACE_X - 11 + Math.round((y - 33) * 0.1), y, COAT.shade);
	}
	// The coat's closure, sweeping from the collar across to her left, edged in gold.
	for (let y = 30; y < 64; y++) {
		const x = FACE_X - 1 + Math.round(Math.min(y - 30, 10) * 0.9);
		set(scene, x, y, C.gold);
		set(scene, x + 1, y, C.amber);
	}
	// The sash.
	for (let x = FACE_X - 15; x <= FACE_X + 16; x++) {
		const u = (x - FACE_X) / 15;
		rect(
			scene,
			x,
			50,
			1,
			3,
			u > 0.4 ? mix(C.brickRed, C.brickRedShade, 0.5) : C.brickRed
		);
		set(scene, x, 50, u > 0.4 ? C.brickRed : C.brickRedLight);
	}
	// Folds in the skirt of the coat below the sash.
	for (const [x0, lean] of [
		[FACE_X - 9, -0.25],
		[FACE_X - 3, -0.1],
		[FACE_X + 10, 0.2],
	]) {
		for (let y = 54; y < 64; y++) {
			set(scene, x0 + Math.round((y - 54) * lean), y, COAT.shade);
		}
	}
	// A knife in a brass-tipped sheath and a leather pouch hanging from the sash.
	paint(scene, FACE_X + 5, 53, ['ww', 'tT', 'tT', 'tT', 'tT', '.b'], {
		w: C.wood,
		t: C.timber,
		T: C.timberShade,
		b: C.brass,
	});
	paint(scene, FACE_X - 8, 53, ['.LL.', 'LTTt', 'TTtt', 'Tgtt', '.tt.'], {
		L: C.timberLight,
		T: C.timber,
		t: C.timberShade,
		g: C.gold,
	});
	// The fleece collar round her neck and across her shoulders.
	for (let y = 24; y <= 31; y++) {
		const half = 5 + Math.round((y - 24) * 0.9);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			if (Math.abs(x - FACE_X - 0.5) < 3.5 && y < 28) {
				continue;
			}
			const curl = (x * 3 + y * 5) % 4 === 0;
			let colour = curl ? FLEECE.shade : FLEECE.base;
			if (x < FACE_X - 1) {
				colour = curl ? FLEECE.base : FLEECE.lit;
			}
			if (y === 31 && (x + y) % 2 === 0) {
				continue;
			}
			set(scene, x, y, colour);
		}
	}
	// Her throat inside the collar.
	for (let y = 24; y <= 27; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 3; x++) {
			set(scene, x, y, x <= FACE_X - 1 ? SKIN.base : SKIN.shade);
		}
	}
}

/**
 * Her head: a fox-fur hat with a peaked red crown, two long braids, and her face turned to the viewer,
 * sunlit on her right and shaded towards the horse, her cheeks red from the wind.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The braids, from under the hat down over her collar to her chest, tied with red.
	for (const bx of [FACE_X - 7, FACE_X + 7]) {
		for (let y = 12; y <= 40; y++) {
			const twist = (y + (bx > FACE_X ? 1 : 0)) % 3;
			set(scene, bx, y, twist === 0 ? HAIR.lit : HAIR.base);
			set(scene, bx + 1, y, twist === 1 ? HAIR.lit : HAIR.dark);
		}
		rect(scene, bx, 41, 2, 1, C.brickRed);
		rect(scene, bx, 42, 2, 2, HAIR.base);
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
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
		[24, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -4) {
				colour = SKIN.glint;
			} else if (dx <= -1) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Hair showing at the temples under the hat.
	rect(scene, FACE_X - 5, 10, 1, 3, HAIR.base);
	rect(scene, FACE_X + 6, 10, 1, 3, HAIR.dark);
	// The hat: a peaked red crown with a gold knob, over a thick fox-fur brim.
	for (let y = 0; y <= 6; y++) {
		const half = 1 + Math.round(y * 0.9);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / (half + 0.5);
			set(
				scene,
				x,
				y,
				u < -0.3
					? C.brickRedLight
					: u > 0.4
						? C.brickRedShade
						: C.brickRed
			);
		}
	}
	set(scene, FACE_X, 0, C.gold);
	set(scene, FACE_X + 1, 0, C.amber);
	for (let y = 6; y <= 10; y++) {
		const half = y < 8 ? 8 : 9 - (y - 8);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const tuft = (x * 7 + y * 3) % 5 === 0;
			let colour = tuft ? FOX.shade : FOX.base;
			if (x < FACE_X - 2) {
				colour = tuft ? FOX.base : FOX.lit;
			} else if (x > FACE_X + 4) {
				colour = tuft ? FOX.base : FOX.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The ear flaps, down past her temples.
	rect(scene, FACE_X - 8, 10, 3, 4, FOX.lit);
	set(scene, FACE_X - 7, 14, FOX.base);
	rect(scene, FACE_X + 7, 10, 3, 4, FOX.shade);
	set(scene, FACE_X + 8, 14, FOX.shade);
	// Brows, and eyes looking a little towards the horse.
	rect(scene, FACE_X - 4, 13, 3, 1, HAIR.base);
	rect(scene, FACE_X + 2, 13, 3, 1, HAIR.base);
	set(scene, FACE_X - 3, 15, C.creamLight);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, mix(C.cream, C.skinTanShade, 0.4));
	set(scene, FACE_X + 3, 15, C.ink);
	// Wind-reddened cheeks.
	set(scene, FACE_X - 4, 17, mix(C.skinTan, C.brickRedLight, 0.45));
	set(scene, FACE_X - 3, 18, mix(C.skinTan, C.brickRedLight, 0.35));
	set(scene, FACE_X + 4, 17, mix(C.skinTanShade, C.brickRed, 0.3));
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X + 1, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X, 18, SKIN.glint);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	// A small, set mouth.
	rect(
		scene,
		FACE_X - 1,
		21,
		3,
		1,
		mix(C.brickRedShade, C.skinTanShade, 0.3)
	);
	set(scene, FACE_X, 22, mix(C.brickRed, C.skinTan, 0.5));
}

/**
 * Her left hand, in a fur-cuffed sleeve, holding the reins at her waist.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	// The forearm, bent across her from the elbow at her side to the cuff: lit along its top, shaded below.
	for (let y = HAND.y - 7; y <= HAND.y + 1; y++) {
		const from = HAND.x - 10 + (y - HAND.y + 7);
		for (let x = from; x <= Math.min(from + 5, HAND.x - 3); x++) {
			let colour = COAT.base;
			if (x - from >= 4 || y === HAND.y - 7) {
				colour = COAT.lit;
			} else if (x === from) {
				colour = COAT.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The fox-fur cuff and the hand closed on the reins.
	rect(scene, HAND.x - 3, HAND.y - 3, 2, 5, FOX.base);
	set(scene, HAND.x - 3, HAND.y - 3, FOX.lit);
	paint(scene, HAND.x - 1, HAND.y - 3, ['lbb.', 'lbbs', 'bbss', '.ss.'], {
		l: SKIN.lit,
		b: SKIN.base,
		s: SKIN.shade,
	});
}

/**
 * The reins, from the bit down to her hand, painted after the outline so they stay thin.
 * @param {Canvas} scene
 */
function drawReins(scene) {
	line(scene, BIT.x, BIT.y, HAND.x + 2, HAND.y - 3, C.brickRedShade);
	line(scene, BIT.x - 1, BIT.y + 1, HAND.x + 1, HAND.y - 2, C.timberShade);
}
