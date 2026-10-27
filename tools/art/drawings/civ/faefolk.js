// Faefolk: a pale fairy with see-through gossamer wings, fading to mist below the waist, reaching for the moon above a ring of mushrooms in a dark forest.
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 28;

/** The forest floor's first row. */
const GROUND = 45;

/** The moon, high on the right. */
const MOON = { x: 56, y: 8 };

/** The ring of mushrooms on the ground: its centre and radii. */
const RING = { x: 30, y: 54, rx: 27, ry: 7 };

/** Pale skin, silvered by the moon on her left, plain, and lilac in the shade. */
const SKIN = {
	glint: C.white,
	lit: mix(C.skin, C.white, 0.7),
	base: mix(C.skin, C.creamLight, 0.45),
	shade: mix(C.skinShade, C.arcaneLight, 0.4),
	dark: mix(C.skinShade, C.arcane, 0.45),
};

/** Long hair, silver-lilac. */
const HAIR = {
	lit: mix(C.arcaneLight, C.white, 0.5),
	base: C.arcaneLight,
	shade: mix(C.arcane, C.arcaneLight, 0.35),
	dark: mix(C.arcaneShade, C.arcane, 0.4),
};

/** The petal dress: pale green, lit, plain and shaded. */
const DRESS = {
	lit: C.ghostLight,
	base: C.ghost,
	shade: C.ghostShade,
	dark: mix(C.ghostShade, C.tealShade, 0.5),
};

/** Eye whites and irises. */
const EYE = {
	lit: C.white,
	shade: mix(C.cloudShade, C.arcaneLight, 0.4),
	iris: C.tealShade,
};

/** The figure is lit by hand, so the moon's glow leaves it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(DRESS),
	...Object.values(EYE),
	C.ink,
];

/**
 * Draws the Faefolk portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8419);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND,
		random,
		stars: 30,
		moon: MOON,
	});
	drawTerrain(layer, { kind: 'forest', top: GROUND, random });
	darkenForest(layer);
	drawClearing(layer);
	drawMushrooms(layer, false);
	drawWings(layer);

	drawBody(scene);
	drawHair(scene);
	drawFace(scene);
	drawArms(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	fadeSkirt(scene);
	const front = createCanvas(64, 64);
	drawMushrooms(front, true);
	outline(front, C.ink);
	over(scene, front);

	glow(scene, {
		x: MOON.x,
		y: MOON.y,
		radius: 20,
		colour: C.moon,
		strength: 0.25,
		steps: 3,
		skip: [...FIGURE, C.moon, C.moonRim],
	});
	glow(scene, {
		x: RING.x,
		y: RING.y,
		radius: 30,
		colour: C.ghost,
		strength: 0.2,
		steps: 3,
		skip: FIGURE,
	});
	drawSparkles(scene, random);
	return scene;
}

/**
 * Dims the forest to night: the trees and floor sink into deep blue, leaving the sky as it is.
 * @param {Canvas} layer
 */
function darkenForest(layer) {
	for (let y = 30; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			const sky =
				y < GROUND &&
				[
					C.nightSky4,
					C.nightSky5,
					C.nightSky6,
					C.white,
					C.starDim,
				].includes(colour ?? '');
			if (colour && !sky) {
				set(layer, x, y, mix(colour, C.nightSky2, 0.6));
			}
		}
	}
}

/**
 * The clearing inside the ring: soft moonlit moss, paler than the forest floor round it.
 * @param {Canvas} layer
 */
function drawClearing(layer) {
	const moss = mix(C.forestFloorLight, C.nightSky4, 0.45);
	const mossLit = mix(C.grassLight, C.moon, 0.15);
	for (let y = GROUND + 2; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d =
				((x - RING.x) / (RING.rx + 2)) ** 2 +
				((y - RING.y) / (RING.ry + 4)) ** 2;
			if (d < 1) {
				set(
					layer,
					x,
					y,
					(x * 5 + y * 3) % 11 === 0
						? mix(mossLit, C.nightSky4, 0.4)
						: moss
				);
			}
		}
	}
}

/**
 * The ring of red-capped toadstools: the far half small, on the background, the near half larger, in front.
 * @param {Canvas} canvas
 * @param {boolean} near - Whether to draw the near half
 */
function drawMushrooms(canvas, near) {
	// Each mushroom's place round the ring (in turns) and how big it grows.
	/** @type {[number, 1 | 2 | 3][]} */
	const ring = [
		[0.02, 2],
		[0.1, 3],
		[0.19, 2],
		[0.27, 3],
		[0.35, 2],
		[0.44, 3],
		[0.5, 2],
		[0.57, 1],
		[0.63, 1],
		[0.69, 2],
		[0.81, 1],
		[0.87, 1],
		[0.93, 2],
	];
	for (const [turn, size] of ring) {
		const angle = turn * Math.PI * 2;
		const x = Math.round(RING.x + Math.cos(angle) * RING.rx);
		const y = Math.round(RING.y + Math.sin(angle) * RING.ry);
		if (y >= RING.y !== near) {
			continue;
		}
		drawMushroom(canvas, x, y, size, near);
	}
}

/**
 * One toadstool: a white stalk under a red cap with pale spots, lit by the moon on its right.
 * @param {Canvas} canvas
 * @param {number} x - The stalk's column
 * @param {number} y - The row it stands on
 * @param {number} size - 1, 2 or 3
 * @param {boolean} near - Near mushrooms take full colour, far ones are dimmed
 */
function drawMushroom(canvas, x, y, size, near) {
	/** @param {Colour} colour */
	const tone = (colour) => (near ? colour : mix(colour, C.nightSky3, 0.2));
	const sprites = {
		1: ['.rR.', 'rrRR', '.s..'],
		2: ['.rrR..', 'rwrRR.', 'rrrwRR', '..ss..', '..sS..'],
		3: [
			'..rrRR..',
			'.rwrrRR.',
			'rrrrwRRR',
			'rwrrrRwR',
			'...sS...',
			'...sS...',
			'..ssSS..',
		],
	};
	const rows = sprites[/** @type {1 | 2 | 3} */ (size)];
	const w = rows[0].length;
	paint(canvas, x - Math.floor(w / 2), y - rows.length + 1, rows, {
		r: tone(C.brickRed),
		R: tone(C.brickRedLight),
		w: tone(C.creamLight),
		s: tone(C.creamShade),
		S: tone(C.cream),
	});
}

/**
 * Four gossamer wings rising behind her, see-through: the night shows through them, tinted pale,
 * with fine veins and a bright rim.
 * @param {Canvas} layer
 */
function drawWings(layer) {
	/** @type {[number, number, number, number, number][]} */
	const wings = [
		// Centre x, centre y, half width, half height, tilt.
		[15, 15, 9, 14, -0.55],
		[42, 15, 9, 14, 0.55],
		[16, 35, 6, 9, 0.7],
		[41, 35, 6, 9, -0.7],
	];
	const root = { x: FACE_X, y: 29 };
	for (const [cx, cy, a, b, tilt] of wings) {
		const cos = Math.cos(tilt);
		const sin = Math.sin(tilt);
		for (let y = cy - b - 2; y <= cy + b + 2; y++) {
			for (let x = cx - b - 2; x <= cx + b + 2; x++) {
				const u = ((x - cx) * cos + (y - cy) * sin) / a;
				const v = (-(x - cx) * sin + (y - cy) * cos) / b;
				const d = u * u + v * v;
				const behind = get(layer, x, y);
				if (d > 1 || !behind) {
					continue;
				}
				// Veins fan out from where the wings meet her back.
				const angle = Math.atan2(y - root.y, x - root.x);
				const vein = Math.abs(Math.sin(angle * 9)) < 0.12;
				let colour = mix(behind, C.arcaneLight, 0.3);
				if (d > 0.78) {
					colour = mix(behind, C.ghostLight, 0.65);
				} else if (vein) {
					colour = mix(behind, C.ghostLight, 0.45);
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * Her slender body in a dress of petals, which fades to mist below the waist.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck.
	for (let y = 23; y <= 27; y++) {
		for (let x = FACE_X - 1; x <= FACE_X + 1; x++) {
			set(scene, x, y, x === FACE_X + 1 ? SKIN.lit : SKIN.shade);
		}
	}
	// Bare shoulders and the bodice.
	for (let y = 27; y <= 40; y++) {
		const half =
			y < 30
				? 4 + (y - 27) * 2
				: Math.max(5, 9 - Math.floor((y - 30) / 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			const skin = y < 31;
			let colour = skin ? SKIN.base : DRESS.base;
			if (u > 0.5) {
				colour = skin ? SKIN.lit : DRESS.lit;
			} else if (u < -0.45) {
				colour = skin ? SKIN.shade : DRESS.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The bodice's top edge: petals in a scalloped line.
	for (let x = FACE_X - 7; x <= FACE_X + 7; x++) {
		set(scene, x, 31, x % 3 === 0 ? DRESS.lit : DRESS.base);
		set(scene, x, 30, x % 3 === 0 ? DRESS.base : get(scene, x, 30));
	}
	// The skirt of petals, flaring out below the waist.
	for (let y = 41; y <= 46; y++) {
		const half = 6 + (y - 41) * 2;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const petal = (x - FACE_X + 40) % 5;
			let colour =
				petal === 0 ? DRESS.dark : petal < 3 ? DRESS.base : DRESS.lit;
			if (x < FACE_X - half + 2) {
				colour = DRESS.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her skirt trails away into the ring below, fading row by row until the moss and mushrooms show through.
 * @param {Canvas} scene
 */
function fadeSkirt(scene) {
	for (let y = 47; y <= 58; y++) {
		const t = (y - 46) / 13;
		const half = 16 + (y - 47);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const behind = get(scene, x, y);
			if (!behind) {
				continue;
			}
			const petal = (x - FACE_X + 40) % 5;
			const colour =
				petal === 0 ? DRESS.shade : petal < 3 ? DRESS.base : DRESS.lit;
			const edge = Math.abs(x - FACE_X) / half;
			// The fade comes in four steps, which keeps the colours few.
			const fade = Math.min(
				1,
				Math.round((t * 0.8 + edge * 0.5) * 4) / 4
			);
			set(scene, x, y, mix(colour, behind, fade));
		}
	}
}

/**
 * Her long hair, streaming out to the right as if in a breeze, with a crown of small white flowers.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	for (let y = 5; y <= 36; y++) {
		for (let x = FACE_X - 10; x <= FACE_X + 14; x++) {
			const head = ((x - FACE_X) / 8.5) ** 2 + ((y - 14) / 9.5) ** 2 <= 1;
			// The long fall of hair behind the left shoulder.
			const fall =
				y > 14 &&
				x >= FACE_X - 10 &&
				x <= FACE_X - 5 + Math.round((y - 14) * -0.1) &&
				y <= 36 - (FACE_X - 5 - x);
			// A lock blowing out to the right.
			const lock =
				y >= 16 &&
				y <= 30 &&
				x > FACE_X + 4 &&
				x <= FACE_X + 6 + Math.round((y - 16) * 0.55) &&
				x >= FACE_X + 5 + Math.round((y - 16) * 0.3);
			if (!head && !fall && !lock) {
				continue;
			}
			const strand = (x * 2 + y) % 5;
			let colour = HAIR.base;
			if (x > FACE_X + 3) {
				colour = strand === 0 ? HAIR.base : HAIR.lit;
			} else if (x < FACE_X - 5) {
				colour = strand === 0 ? HAIR.dark : HAIR.shade;
			} else if (strand === 0) {
				colour = HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The flower crown.
	for (const [x, y] of [
		[FACE_X - 7, 9],
		[FACE_X - 4, 7],
		[FACE_X, 6],
		[FACE_X + 4, 7],
		[FACE_X + 7, 9],
	]) {
		paint(scene, x - 1, y - 1, ['.w.', 'wgw', '.w.'], {
			w: C.white,
			g: C.gold,
		});
	}
}

/**
 * Her face, turned up a little towards the moon on her left: large eyes, a small nose and a faint smile,
 * the moon side silvered and the other in lilac shade, a pointed ear showing through her hair.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -3, 4],
		[11, -4, 5],
		[12, -5, 5],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -4, 5],
		[18, -4, 5],
		[19, -3, 5],
		[20, -3, 4],
		[21, -2, 3],
		[22, -1, 2],
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
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The pointed ear on the moon side.
	paint(scene, FACE_X + 7, 11, ['..g', '.gl', 'gl.', 'll.', 'l..'], {
		g: SKIN.glint,
		l: SKIN.lit,
	});
	// Fine brows, and large eyes looking up to her left.
	rect(scene, FACE_X - 3, 12, 2, 1, HAIR.dark);
	rect(scene, FACE_X + 2, 12, 3, 1, HAIR.shade);
	paint(scene, FACE_X - 3, 13, ['si', 'kk'], {
		s: EYE.shade,
		i: EYE.iris,
		k: C.ink,
	});
	paint(scene, FACE_X + 2, 13, ['wi', 'kk'], {
		w: EYE.lit,
		i: EYE.iris,
		k: C.ink,
	});
	set(scene, FACE_X + 4, 14, EYE.lit);
	// The nose and a faint smile.
	set(scene, FACE_X, 16, SKIN.shade);
	set(scene, FACE_X + 1, 17, SKIN.glint);
	set(scene, FACE_X, 17, SKIN.dark);
	rect(scene, FACE_X - 1, 19, 3, 1, mix(C.brickRedLight, C.arcaneLight, 0.4));
	set(scene, FACE_X + 2, 18, mix(C.brickRedLight, C.arcaneLight, 0.4));
	// A blush on the shaded cheek.
	set(scene, FACE_X - 3, 17, mix(SKIN.shade, C.brickRedLight, 0.3));
}

/**
 * Her arms: the left raised high towards the moon, fingers spread, the right held out low and open.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	// The raised arm, from the shoulder up and out to the hand.
	for (let i = 0; i <= 16; i++) {
		const x = FACE_X + 8 + Math.round(i * 0.65);
		const y = 29 - i;
		set(scene, x, y, SKIN.lit);
		set(scene, x + 1, y, SKIN.glint);
		set(scene, x - 1, y, i < 9 ? SKIN.base : SKIN.lit);
	}
	paint(scene, FACE_X + 17, 9, ['g.g.', 'lglg', '.ll.', '.ll.'], {
		g: SKIN.glint,
		l: SKIN.lit,
	});
	// The low arm, held out to the side, palm open.
	for (let i = 0; i <= 13; i++) {
		const x = FACE_X - 8 - i;
		const y = 30 + Math.round(i * 0.6);
		set(scene, x, y, SKIN.base);
		set(scene, x, y + 1, SKIN.shade);
	}
	paint(scene, FACE_X - 25, 36, ['..sb', 'sbbb', '.s.s'], {
		s: SKIN.shade,
		b: SKIN.base,
	});
}

/**
 * Lays one canvas's painted pixels over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} top
 */
function over(canvas, top) {
	for (let i = 0; i < canvas.p.length; i++) {
		if (top.p[i]) {
			canvas.p[i] = top.p[i];
		}
	}
}

/**
 * Fairy dust: sparkles round her raised hand and drifting down over the ring.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparkles(scene, random) {
	for (let i = 0; i < 14; i++) {
		const t = random();
		const x = Math.round(FACE_X + 22 - t * 30 + (random() - 0.5) * 8);
		const y = Math.round(5 + t * 44 + (random() - 0.5) * 6);
		set(scene, x, y, random() > 0.5 ? C.ghostLight : C.gold);
	}
	for (const [x, y] of [
		[FACE_X + 23, 4],
		[FACE_X + 15, 5],
	]) {
		set(scene, x, y, C.white);
		set(scene, x - 1, y, C.ghost);
		set(scene, x + 1, y, C.ghost);
		set(scene, x, y - 1, C.ghost);
		set(scene, x, y + 1, C.ghost);
	}
}
