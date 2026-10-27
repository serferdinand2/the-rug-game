// Psionics: a psychic at night pressing her fingers to her glowing temples, her hair rising, stones and books floating round her and a ghostly copy of her on either side.
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

/** The face's centre column, and how far to each side her ghostly copies stand. */
const FACE_X = 32;
const ECHO = 26;

/** The temples where her fingers touch, which glow. */
const TEMPLES = [
	{ x: FACE_X - 6, y: 14 },
	{ x: FACE_X + 7, y: 14 },
];

/** The pink light of her mind: bright, mid and deep. */
const PSI = {
	light: mix(C.arcaneLight, C.white, 0.35),
	base: mix(C.arcaneLight, C.brickRedLight, 0.4),
	deep: mix(C.arcane, C.brickRed, 0.35),
};

/** Skin lit pink by her temples on her left, plain, and shaded violet. */
const SKIN = {
	glint: mix(C.skinTan, PSI.light, 0.45),
	lit: mix(C.skinTan, PSI.base, 0.25),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.roofShade, 0.45),
};

/** Black hair with a violet sheen, rising from her head. */
const HAIR = {
	lit: mix(C.arcaneShade, PSI.base, 0.35),
	base: mix(C.roofShade, C.night, 0.15),
	dark: mix(C.night, C.ink, 0.5),
};

/** A dark teal robe with a high collar. */
const ROBE = {
	lit: mix(C.teal, C.tealShade, 0.55),
	base: mix(C.tealShade, C.roofShade, 0.2),
	shade: mix(C.tealShade, C.night, 0.55),
};

/** The floating stones: lit, plain and shaded. */
const STONE = [C.stoneLight, C.stone, C.stoneShade];

/** The pages of the floating books, which keep their colour in the pink light. */
const PAGES = [C.white, C.cream, C.creamShade];

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.45) };

/** The face, hands and hair are lit by hand, so the glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(EYE),
	...Object.values(PSI),
	C.ink,
	C.brickRedShade,
];

/**
 * Draws the Psionics portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8943);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 40,
		starRows: 64,
	});
	darkenSky(layer);
	drawWaves(layer);
	for (const side of [-1, 1]) {
		drawEcho(layer, FACE_X + side * ECHO);
	}

	const figure = createCanvas(64, 64);
	drawPsychic(figure, FACE_X);
	outline(figure, C.ink);
	const hands = createCanvas(64, 64);
	drawArms(hands, FACE_X);
	outline(hands, C.ink);
	underlay(hands, figure);
	const things = createCanvas(64, 64);
	drawTome(things, 1, 1, C.brickRed, C.brickRedShade);
	drawStone(things, 51, 1, 11);
	drawStone(things, 1, 44, 10);
	drawBook(things, 50, 50, C.roofLight, C.roof);
	drawStone(things, 56, 28, 6);
	outline(things, C.ink);
	underlay(things, hands);
	underlay(scene, things);
	underlay(scene, layer);

	for (const { x, y } of TEMPLES) {
		glow(scene, {
			x,
			y,
			radius: 11,
			colour: PSI.base,
			strength: 0.45,
			steps: 3,
			skip: FIGURE,
		});
	}
	// The pink hold of her mind round each floating thing.
	for (const [x, y] of [
		[8, 6],
		[56, 4],
		[6, 47],
		[56, 53],
		[59, 30],
	]) {
		glow(scene, {
			x,
			y,
			radius: 7,
			colour: PSI.base,
			strength: 0.3,
			steps: 2,
			skip: [...FIGURE, ...STONE, ...PAGES],
		});
	}
	drawSparks(scene);
	return scene;
}

/**
 * Faint rings of thought rippling out from her head across the night.
 * @param {Canvas} layer
 */
function drawWaves(layer) {
	for (const r of [16, 22, 29]) {
		for (let a = 0; a < Math.PI * 2; a += 0.02) {
			const x = Math.round(FACE_X + 0.5 + Math.cos(a) * r);
			const y = Math.round(15 + Math.sin(a) * r * 0.9);
			const colour = get(layer, x, y);
			if (colour && Math.floor(a * 6) % 2 === 0) {
				set(layer, x, y, mix(colour, PSI.deep, 0.45));
			}
		}
	}
}

/**
 * A ghostly copy of her drawn into the background: a pink outline, a pale pink face and hands,
 * and the night showing through the rest.
 * @param {Canvas} layer
 * @param {number} cx - The copy's face column
 */
function drawEcho(layer, cx) {
	const echo = createCanvas(64, 64);
	drawPsychic(echo, cx);
	drawArms(echo, cx);
	const body = echo.p.slice();
	outline(echo, C.ink);
	const skin = Object.values(SKIN);
	const glow = Object.values(PSI);
	for (let i = 0; i < echo.p.length; i++) {
		const colour = echo.p[i];
		const behind = layer.p[i];
		if (!colour || !behind) {
			continue;
		}
		const x = i % 64;
		const y = Math.floor(i / 64);
		const face = y >= 10 && y <= 24 && Math.abs(x - cx - 0.5) <= 6;
		let ghost = mix(behind, PSI.deep, 0.08);
		if (!body[i]) {
			ghost = mix(PSI.base, behind, 0.35);
		} else if (skin.includes(colour)) {
			ghost = mix(PSI.light, behind, 0.4);
		} else if (face) {
			ghost = mix(PSI.deep, C.night, 0.3);
		} else if (glow.includes(colour)) {
			ghost = mix(PSI.base, behind, 0.5);
		}
		layer.p[i] = ghost;
	}
}

/**
 * The psychic herself: her rising hair, her face turned to the viewer and her high-collared robe.
 * @param {Canvas} scene
 * @param {number} cx - The face's centre column
 */
function drawPsychic(scene, cx) {
	drawRobe(scene, cx);
	drawHair(scene, cx);
	drawFace(scene, cx);
}

/**
 * Her hair: black locks lifting off her head in tongues of flame, each tongue tipped pink.
 * @param {Canvas} scene
 * @param {number} cx
 */
function drawHair(scene, cx) {
	for (let y = 4; y <= 24; y++) {
		for (let x = cx - 9; x <= cx + 10; x++) {
			const head = ((x - cx - 0.5) / 8.5) ** 2 + ((y - 14) / 10) ** 2;
			if (head > 1) {
				continue;
			}
			let colour = HAIR.base;
			if (x <= cx - 5) {
				colour = HAIR.dark;
			} else if (x >= cx + 7) {
				colour = HAIR.lit;
			}
			set(scene, x, y, colour);
		}
	}
	// The tongues rise from the crown, each column to its own height; the pairs of tallest columns
	// give every tongue a tip two pixels wide.
	const heights = [2, 4, 6, 6, 4, 3, 5, 7, 7, 5, 3, 4, 6, 6, 4, 2];
	heights.forEach((height, i) => {
		const x = cx - 7 + i;
		const dx = (x - cx - 0.5) / 8.5;
		const base = Math.round(14 - 10 * Math.sqrt(Math.max(0, 1 - dx * dx)));
		for (let j = 1; j <= height; j++) {
			let colour = i % 5 === 2 ? HAIR.lit : HAIR.base;
			if (j === height) {
				colour = PSI.base;
			} else if (j === height - 1) {
				colour = PSI.deep;
			}
			set(scene, x, base - j, colour);
		}
	});
}

/**
 * Her face, turned to the viewer and lit pink on her left; dark eyes wide open, brows drawn together.
 * @param {Canvas} scene
 * @param {number} cx
 */
function drawFace(scene, cx) {
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -2, 3],
		[11, -3, 4],
		[12, -4, 5],
		[13, -4, 5],
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
			if (dx === to && dx >= 4) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, cx + dx, y, colour);
		}
	}
	// A fringe of hair across the top of the brow.
	rect(scene, cx - 2, 10, 6, 1, HAIR.base);
	rect(scene, cx - 3, 11, 2, 1, HAIR.base);
	rect(scene, cx + 3, 11, 2, 1, HAIR.base);
	// Brows drawn together in effort, and the eyes wide open.
	set(scene, cx - 3, 13, HAIR.base);
	rect(scene, cx - 2, 12, 2, 1, HAIR.base);
	rect(scene, cx + 2, 12, 2, 1, HAIR.base);
	set(scene, cx + 4, 13, HAIR.base);
	set(scene, cx - 3, 14, SKIN.dark);
	set(scene, cx + 3, 14, SKIN.lit);
	set(scene, cx - 3, 15, EYE.shade);
	set(scene, cx - 2, 15, C.ink);
	set(scene, cx + 2, 15, C.ink);
	set(scene, cx + 3, 15, EYE.lit);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, cx, 16, 1, 3, SKIN.shade);
	set(scene, cx + 1, 18, SKIN.glint);
	set(scene, cx, 19, SKIN.dark);
	// Lips pressed together.
	rect(scene, cx - 1, 21, 4, 1, C.brickRedShade);
	set(scene, cx + 1, 22, mix(C.brickRed, C.skinTan, 0.45));
	// A pink jewel on her brow.
	set(scene, cx, 11, PSI.base);
	set(scene, cx + 1, 11, PSI.deep);
}

/**
 * Her robe: a high collar round her neck, sloping shoulders, folds falling to a pink sash, lit on her left.
 * @param {Canvas} scene
 * @param {number} cx
 */
function drawRobe(scene, cx) {
	for (let y = 23; y < 64; y++) {
		let half = 4;
		if (y >= 31) {
			half = Math.min(18, 14 + Math.round((y - 31) * 0.3));
		} else if (y >= 27) {
			half = [7, 10, 12, 13][y - 27];
		}
		for (let x = cx - half; x <= cx + 1 + half; x++) {
			const u = (x - cx - 0.5) / half;
			let colour = ROBE.base;
			if (u > 0.7) {
				colour = ROBE.lit;
			} else if (u < -0.55) {
				colour = ROBE.shade;
			}
			// Folds falling from the chest.
			if (
				y > 36 &&
				[-7, -3, 5, 9].includes(
					x - cx - Math.round((y - 36) * 0.08 * Math.sign(x - cx))
				)
			) {
				colour = u > 0.7 ? ROBE.base : ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The collar's pink rim, and the opening below it.
	rect(scene, cx - 4, 23, 10, 1, PSI.deep);
	for (let y = 27; y < 64; y++) {
		set(scene, cx, y, PSI.deep);
		set(scene, cx + 1, y, ROBE.shade);
	}
	// A pink sash at the waist, knotted on her lit side.
	for (let x = cx - 16; x <= cx + 17; x++) {
		set(scene, x, 52, x > cx + 10 ? PSI.base : PSI.deep);
		set(scene, x, 53, mix(PSI.deep, C.night, 0.3));
	}
	paint(scene, cx + 6, 51, ['.bb.', 'bdb.', '.dd.', '.d.d', 'd..d'], {
		b: PSI.base,
		d: PSI.deep,
	});
	// A pink gem at the throat.
	paint(scene, cx - 1, 25, ['.l.', 'lbd', '.d.'], {
		l: PSI.light,
		b: PSI.base,
		d: PSI.deep,
	});
}

/**
 * Her arms raised, elbows out and wide sleeves hanging from them, her fingertips pressed to her temples.
 * @param {Canvas} scene
 * @param {number} cx
 */
function drawArms(scene, cx) {
	for (const side of [-1, 1]) {
		const lit = side > 0;
		const elbow = { x: side < 0 ? cx - 19 : cx + 20, y: 29 };
		const wrist = { x: side < 0 ? cx - 9 : cx + 10, y: 18 };
		// The wide sleeve hanging from the raised upper arm down to the body, its folds falling inward.
		for (let y = 26; y <= 44; y++) {
			const outer =
				elbow.x + side - side * Math.round(Math.max(0, y - 30) * 0.45);
			const inner = side < 0 ? cx - 10 : cx + 11;
			const from = Math.min(outer, inner);
			const to = Math.max(outer, inner);
			for (let x = from; x <= to; x++) {
				const edge = x === outer;
				let colour = lit ? ROBE.lit : ROBE.base;
				if (edge) {
					colour = lit ? ROBE.base : ROBE.shade;
				} else if ((x - y * side * 0.4 + 40) % 5 < 1) {
					colour = lit ? ROBE.base : ROBE.shade;
				}
				set(scene, x, y, colour);
			}
		}
		// The pink cuff round the elbow.
		for (let y = 24; y <= 31; y++) {
			set(scene, elbow.x - side, y, PSI.deep);
			set(scene, elbow.x - side * 2, y, PSI.base);
		}
		// The bare forearm, from the cuff up to the wrist.
		limb(
			scene,
			elbow.x - side * 3,
			elbow.y - 3,
			wrist.x,
			wrist.y,
			2,
			lit
				? [SKIN.glint, SKIN.lit, SKIN.lit, SKIN.base]
				: [SKIN.base, SKIN.base, SKIN.shade, SKIN.dark]
		);
	}
	// The hands, fingers up, their tips on her temples.
	const hand = [
		'...hl',
		'..hhl',
		'.hhhl',
		'shhhl',
		'shhh.',
		'.shh.',
		'.sh..',
	];
	paint(scene, cx - 11, 12, hand, {
		h: SKIN.base,
		l: SKIN.lit,
		s: SKIN.shade,
	});
	paint(
		scene,
		cx + 8,
		12,
		hand,
		{ h: SKIN.lit, l: SKIN.glint, s: SKIN.base },
		{ mirror: true }
	);
}

/**
 * A floating stone, torn from the ground: a rough lit top, a shaded underside and crumbs falling from it.
 * @param {Canvas} scene
 * @param {number} x - The stone's left column
 * @param {number} y - Its top row
 * @param {number} size - Its width
 */
function drawStone(scene, x, y, size) {
	const h = Math.max(3, Math.round(size * 0.6));
	for (let j = 0; j < h; j++) {
		// Rounded on top, narrowing to a jagged point underneath.
		const inset = j === 0 ? 1 : 0;
		const narrow = j > h / 2 ? Math.round((j - h / 2) * 1.5) : 0;
		for (
			let i = inset + narrow;
			i < size - inset - Math.floor(narrow / 2);
			i++
		) {
			let colour = STONE[1];
			if (j === 0 || i === inset + narrow) {
				colour = STONE[0];
			} else if (
				j >= h - 2 ||
				i >= size - 2 - inset - Math.floor(narrow / 2)
			) {
				colour = STONE[2];
			}
			if (j === 0 && i % 3 === 1) {
				colour = C.grassShade;
			}
			set(scene, x + i, y + j, colour);
		}
	}
	set(scene, x + Math.floor(size / 2), y + h + 1, STONE[2]);
	set(scene, x + Math.floor(size / 2) + 2, y + h + 3, STONE[2]);
}

/**
 * A floating book, open, its blank pages fanned up either side of the spine.
 * @param {Canvas} scene
 * @param {number} x - The book's left column
 * @param {number} y - Its top row
 * @param {string} cover - The cover colour
 * @param {string} spine - The cover's shade
 */
function drawBook(scene, x, y, cover, spine) {
	paint(
		scene,
		x,
		y,
		[
			'ww........ww',
			'wpww....wwpw',
			'wpppww.wpppw',
			'wpllppwpllpw',
			'wppppwwppppw',
			'Cwwwwccwwww.',
			'.CCCCSCCCCC.',
		],
		{
			w: C.white,
			p: C.cream,
			l: C.creamShade,
			c: C.creamShade,
			C: cover,
			S: spine,
		}
	);
}

/**
 * Bright motes round the temples, painted after the glow.
 * @param {Canvas} scene
 */
function drawSparks(scene) {
	for (const [x, y] of [
		[FACE_X - 8, 11],
		[FACE_X - 9, 16],
		[FACE_X + 10, 10],
		[FACE_X + 10, 17],
		[FACE_X + 9, 9],
	]) {
		set(scene, x, y, PSI.light);
	}
	for (const { x, y } of TEMPLES) {
		set(scene, x, y, C.white);
	}
}

/**
 * Deepens the night sky to a dark navy so the pink light stands out.
 * @param {Canvas} layer
 */
function darkenSky(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour && colour !== C.white && colour !== C.starDim) {
			layer.p[i] = mix(mix(colour, C.nightSea3, 0.5), C.night, 0.35);
		}
	}
}

/**
 * Paints a limb between two points as a round-ended band, shaded across its width.
 * @param {Canvas} scene
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - Half its width
 * @param {string[]} tones - Colours from one edge to the other
 */
function limb(scene, x0, y0, x1, y1, r, tones) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const nx = -(y1 - y0) / length;
	const ny = (x1 - x0) / length;
	for (let y = Math.min(y0, y1) - r; y <= Math.max(y0, y1) + r; y++) {
		for (let x = Math.min(x0, x1) - r; x <= Math.max(x0, x1) + r; x++) {
			const t = Math.max(
				0,
				Math.min(
					1,
					((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / length ** 2
				)
			);
			const px = x0 + (x1 - x0) * t;
			const py = y0 + (y1 - y0) * t;
			if (Math.hypot(x - px, y - py) > r + 0.3) {
				continue;
			}
			const across = ((x - px) * nx + (y - py) * ny) / (r + 0.3);
			const k = Math.min(
				tones.length - 1,
				Math.floor(((across + 1) / 2) * tones.length)
			);
			set(scene, x, y, tones[k]);
		}
	}
}

/**
 * A floating closed tome, tilted: its cover with a gold clasp on top, its spine banded in gold along
 * the near long edge and the cream block of its pages at the end.
 * @param {Canvas} scene
 * @param {number} x - The tome's left column
 * @param {number} y - Its top row
 * @param {string} cover - The cover colour
 * @param {string} shade - The cover's shade
 */
function drawTome(scene, x, y, cover, shade) {
	/** @type {[number, number]} */
	const a = [x, y + 5];
	/** @type {[number, number]} */
	const b = [x + 9, y];
	/** @type {[number, number]} */
	const c = [x + 14, y + 4];
	/** @type {[number, number]} */
	const d = [x + 5, y + 9];
	const lit = mix(cover, C.white, 0.3);
	for (let py = y - 1; py <= y + 12; py++) {
		for (let px = x - 1; px <= x + 15; px++) {
			if (inPolygon(px, py, [a, b, c, d])) {
				const edge =
					!inPolygon(px - 1, py, [a, b, c, d]) ||
					!inPolygon(px, py - 1, [a, b, c, d]);
				set(scene, px, py, edge ? lit : cover);
			} else if (
				inPolygon(px, py, [d, c, [c[0], c[1] + 3], [d[0], d[1] + 3]])
			) {
				// The spine, with two gold bands.
				const band = px === x + 8 || px === x + 11;
				set(scene, px, py, band ? C.gold : shade);
			} else if (
				inPolygon(px, py, [a, d, [d[0], d[1] + 3], [a[0], a[1] + 3]])
			) {
				// The page block, its edges lined.
				set(scene, px, py, (py + px) % 2 ? C.cream : C.creamShade);
			}
		}
	}
	// A gold clasp on the cover.
	set(scene, x + 7, y + 4, C.gold);
	set(scene, x + 8, y + 4, C.amber);
	set(scene, x + 7, y + 5, C.amber);
}

/**
 * Tells whether a pixel's centre lies inside a polygon.
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} polygon
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
