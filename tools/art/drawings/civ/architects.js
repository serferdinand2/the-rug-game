// Architects: a master builder in a violet cap measuring her unrolled plans with a brass set square and dividers, a sandstone cathedral in timber scaffolding behind her in the morning sun.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The table top's first row; the plans lie on it below. */
const TABLE = 51;

/** The face's centre column and its first row. */
const FACE_X = 22;
const FACE_TOP = 11;

/** Skin: lit by the sun on her right (the viewer's left), plain, and shaded on the far side. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.5),
	lit: mix(C.skinTan, C.sandLight, 0.3),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.roofShade, 0.3),
};

/** The green work tunic. */
const TUNIC = {
	lit: C.pineLight,
	base: C.pine,
	shade: C.pineShade,
	dark: mix(C.pineShade, C.night, 0.3),
};

/** The violet felt cap. */
const CAP = {
	lit: C.roofLight,
	base: mix(C.roof, C.roofLight, 0.35),
	shade: C.roof,
};

/** Dark auburn hair, sunlit along its left edge. */
const HAIR = {
	lit: C.timberLight,
	base: C.timber,
	dark: C.timberShade,
	deep: C.wood,
};

/** Sandstone, lit on the left, for the cathedral. */
const SANDSTONE = {
	lit: C.sandLight,
	base: C.sand,
	shade: C.sandShade,
	deep: mix(C.sandShade, C.timberShade, 0.35),
	glass: mix(C.roof, C.daySea3, 0.35),
};

/** The ink on the plans. */
const INK = {
	line: mix(C.daySea3, C.night, 0.25),
	faint: mix(C.daySea2, C.cream, 0.55),
};

/**
 * Draws the Architects portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(8002);

	drawSky(layer, { time: 'day', horizon: 63, random });
	const church = createCanvas(64, 64);
	drawCathedral(church);
	drawScaffolding(church);
	outline(church, mix(C.sandShade, C.roofShade, 0.55));
	underlay(church, layer);

	// The plans, her body, then her arms on top, each outlined so the arms stand clear of the tunic.
	const desk = createCanvas(64, 64);
	drawTable(desk);
	drawPlans(desk);
	outline(desk, C.ink);
	const figure = createCanvas(64, 64);
	drawTunic(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const scene = createCanvas(64, 64);
	drawDividerArm(scene);
	drawSquareArm(scene);
	drawSetSquare(scene);
	drawSquareHand(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, desk);
	underlay(scene, church);
	drawDividers(scene);
	return scene;
}

/**
 * The cathedral's west front across the right of the picture: a finished tower with a spire,
 * the gable of the nave with its rose window, and the unfinished second tower.
 * @param {Canvas} canvas
 */
function drawCathedral(canvas) {
	// The finished north tower and its spire.
	for (let y = 0; y < TABLE; y++) {
		const spire = y < 13 ? Math.floor((y + 1) / 2.6) : 5;
		const left = 41 - spire;
		const right = 41 + spire;
		for (let x = left; x <= right; x++) {
			let colour = SANDSTONE.base;
			if (x === left) {
				colour = SANDSTONE.lit;
			} else if (x >= right - 1) {
				colour = SANDSTONE.shade;
			} else if (y >= 13 && y % 6 === 0) {
				colour = SANDSTONE.shade;
			}
			set(canvas, x, y, colour);
		}
	}
	set(canvas, 41, 0, C.gold);
	// The nave's gable between the towers.
	for (let y = 14; y < TABLE; y++) {
		const half = Math.min(5, y - 14);
		for (let x = 51 - half; x <= 51 + half; x++) {
			set(canvas, x, y, x < 51 ? SANDSTONE.base : SANDSTONE.shade);
		}
	}
	// The unfinished south tower, its top still ragged.
	const ragged = [21, 20, 20, 19, 19, 20, 21, 21, 22, 22];
	for (let x = 54; x < 64; x++) {
		const top = ragged[x - 54];
		for (let y = top; y < TABLE; y++) {
			let colour = SANDSTONE.base;
			if (x === 54) {
				colour = SANDSTONE.lit;
			} else if (y === top) {
				colour = SANDSTONE.lit;
			} else if (x >= 62) {
				colour = SANDSTONE.shade;
			} else if (y % 6 === 0) {
				colour = SANDSTONE.shade;
			}
			set(canvas, x, y, colour);
		}
	}
	// Tall lancet windows in the towers.
	for (const [x, y, h] of [
		[40, 17, 8],
		[40, 31, 8],
		[57, 27, 7],
		[60, 27, 7],
		[58, 39, 6],
	]) {
		rect(canvas, x, y + 1, 2, h - 1, SANDSTONE.glass);
		set(canvas, x, y, SANDSTONE.glass);
		set(canvas, x + 1, y, SANDSTONE.deep);
	}
	// The rose window, a ring of glass round a hub.
	for (let y = 18; y <= 30; y++) {
		for (let x = 45; x <= 57; x++) {
			const d = Math.hypot(x - 51, y - 24);
			if (d > 4.6) {
				continue;
			}
			let colour = SANDSTONE.glass;
			if (d > 3.7) {
				colour = SANDSTONE.deep;
			} else if (d < 1.2) {
				colour = C.gold;
			} else if ((x + y) % 2 === 0) {
				colour = mix(C.daySea2, C.roof, 0.4);
			}
			set(canvas, x, y, colour);
		}
	}
	// The great pointed door.
	for (let y = 36; y < TABLE; y++) {
		const half = y < 39 ? y - 36 : 3;
		for (let x = 51 - half; x <= 51 + half; x++) {
			set(canvas, x, y, x === 51 - half ? SANDSTONE.deep : C.wood);
		}
	}
}

/**
 * Timber scaffolding round the unfinished tower: poles, plank platforms, braces and a hoist with a block on its rope.
 * @param {Canvas} canvas
 */
function drawScaffolding(canvas) {
	for (const x of [53, 58, 63]) {
		line(canvas, x, 6, x, TABLE - 1, C.timber);
	}
	for (const y of [12, 26, 38]) {
		rect(canvas, 52, y, 12, 1, C.timberLight);
		rect(canvas, 52, y + 1, 12, 1, C.timberShade);
	}
	line(canvas, 53, 26, 58, 13, C.timberShade);
	line(canvas, 58, 38, 63, 27, C.timberShade);
	// The hoist's jib, its rope and a dressed stone on the way up.
	line(canvas, 58, 6, 47, 3, C.timberLight);
	line(canvas, 47, 4, 47, 9, C.stoneShade);
	rect(canvas, 46, 10, 3, 2, C.sandLight);
	set(canvas, 48, 11, C.sandShade);
	// A mason at work on the top platform, for scale.
	paint(canvas, 59, 5, ['.hh.', '.ss.', 'tttt', '.tt.', '.ll.', '.l.l'], {
		h: C.wood,
		s: C.skinShade,
		t: C.daySea2,
		l: C.roofShade,
	});
}

/**
 * The green tunic over her shoulders and chest: a cream shirt open at the neck, a leather strap across
 * her chest, sunlit down her right side.
 * @param {Canvas} scene
 */
function drawTunic(scene) {
	// The neck, in the chin's shadow except on the sunlit side.
	for (let y = 25; y <= 28; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 2; x++) {
			let colour = SKIN.shade;
			if (x === FACE_X - 2) {
				colour = SKIN.lit;
			} else if (y === 26 && x > FACE_X - 2) {
				colour = SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 28; y < TABLE; y++) {
		const half = Math.min(19, 6 + Math.round((y - 28) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = TUNIC.base;
			if (u < -0.82) {
				colour = TUNIC.lit;
			} else if (u > 0.82) {
				colour = TUNIC.dark;
			} else if (u > 0.25) {
				colour = TUNIC.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Sunlight along the top of her right shoulder.
	for (let x = FACE_X - 16; x <= FACE_X - 6; x++) {
		const y = 28 + Math.ceil((FACE_X - 6 - x) / 2.6);
		set(scene, x, y, TUNIC.lit);
	}
	// Seams falling from the shoulders.
	for (let y = 34; y < TABLE; y++) {
		set(scene, FACE_X - 10, y, TUNIC.shade);
		set(scene, FACE_X + 9, y, TUNIC.dark);
	}
	// The open collar: cream linen in a V, its edges lit and shaded.
	for (let y = 28; y < 35; y++) {
		const half = Math.max(0, 3 - Math.floor((y - 28) / 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X ? C.creamLight : C.cream);
		}
		set(scene, FACE_X - half - 1, y, C.creamShade);
		set(scene, FACE_X + half + 1, y, C.creamShade);
	}
	// A leather satchel strap from her left shoulder down across her chest.
	for (let y = 29; y < TABLE; y++) {
		const x = FACE_X + 8 - Math.round((y - 29) * 0.75);
		set(scene, x, y, C.timberLight);
		set(scene, x + 1, y, C.timber);
	}
	set(scene, FACE_X + 2, 37, C.brass);
	set(scene, FACE_X + 3, 37, C.brass);
}

/**
 * Her head: a violet felt cap pulled down over dark auburn hair, a braid over her shoulder, and her face
 * turned to the viewer, lit by the sun on her right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The hair swept back under the cap, showing at the temples.
	for (let y = 6; y <= 22; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
			const d = ((x - FACE_X - 0.5) / 8.5) ** 2 + ((y - 14) / 8.5) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = HAIR.base;
			if (x <= FACE_X - 7) {
				colour = HAIR.lit;
			} else if (x >= FACE_X + 6) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// A thick plait from behind her left ear, over her shoulder and down her chest, tied with a ribbon.
	for (let y = 19; y <= 40; y++) {
		const x = FACE_X + 7 + Math.round((y - 19) * 0.12);
		const plait = (y + 1) % 3;
		set(scene, x, y, plait === 0 ? HAIR.dark : HAIR.base);
		set(scene, x + 1, y, plait === 1 ? HAIR.deep : HAIR.base);
		set(scene, x + 2, y, plait === 2 ? HAIR.deep : HAIR.dark);
	}
	rect(scene, FACE_X + 9, 41, 3, 1, CAP.base);
	rect(scene, FACE_X + 9, 42, 3, 2, HAIR.dark);
	set(scene, FACE_X + 10, 42, HAIR.base);
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[0, -3, 4],
		[1, -4, 5],
		[2, -4, 5],
		[3, -5, 6],
		[4, -5, 6],
		[5, -5, 6],
		[6, -5, 6],
		[7, -4, 5],
		[8, -4, 5],
		[9, -4, 5],
		[10, -3, 4],
		[11, -3, 4],
		[12, -2, 3],
		[13, -1, 2],
	];
	for (const [row, from, to] of rows) {
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
			set(scene, FACE_X + dx, FACE_TOP + row, colour);
		}
	}
	const eyes = FACE_TOP + 5;
	// Ears: the near one lit, the far one in shadow.
	rect(scene, FACE_X - 6, eyes, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 7, eyes, 1, 3, SKIN.shade);
	// The lit cheekbone and the shade under the far one.
	set(scene, FACE_X - 3, eyes + 2, SKIN.glint);
	set(scene, FACE_X + 4, eyes + 3, SKIN.dark);
	// Brows, lids and eyes, glancing down to the plans.
	rect(scene, FACE_X - 3, eyes - 2, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 2, eyes - 2, 3, 1, HAIR.deep);
	set(scene, FACE_X - 2, eyes, C.creamLight);
	set(scene, FACE_X - 1, eyes, C.ink);
	set(scene, FACE_X + 2, eyes, mix(C.cream, C.skinTanShade, 0.45));
	set(scene, FACE_X + 3, eyes, C.ink);
	rect(scene, FACE_X - 2, eyes - 1, 2, 1, SKIN.base);
	rect(scene, FACE_X + 2, eyes - 1, 2, 1, SKIN.shade);
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X + 1, eyes + 1, 1, 3, SKIN.shade);
	set(scene, FACE_X, eyes + 3, SKIN.glint);
	set(scene, FACE_X + 1, eyes + 4, SKIN.dark);
	// A small, intent mouth: a dark line and a fuller lower lip.
	rect(scene, FACE_X - 1, eyes + 6, 3, 1, C.brickRedShade);
	rect(scene, FACE_X - 1, eyes + 7, 2, 1, mix(C.brickRed, C.skinTan, 0.4));
	// The cap: a soft crown slumped to her left, over a band across the brow.
	for (let y = 2; y <= 12; y++) {
		for (let x = FACE_X - 11; x <= FACE_X + 12; x++) {
			const crown =
				((x - FACE_X - 1.5) / 10.5) ** 2 +
					((y - 7 - (x - FACE_X) / 12) / 4.2) ** 2 <=
				1;
			if (!crown) {
				continue;
			}
			let colour = CAP.base;
			if (x <= FACE_X - 6 && y <= 7) {
				colour = CAP.lit;
			} else if (x >= FACE_X + 6 || y >= 10) {
				colour = CAP.shade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, FACE_X - 7, 10, 15, 1, CAP.shade);
	rect(scene, FACE_X - 7, 11, 1, 1, CAP.shade);
	set(scene, FACE_X - 1, 2, CAP.shade);
	set(scene, FACE_X - 1, 1, CAP.base);
}

/**
 * Her right arm, the elbow out and the forearm in to the plans on the viewer's left, sunlit along its outer edge.
 * @param {Canvas} scene
 */
function drawDividerArm(scene) {
	for (let y = 33; y <= TABLE; y++) {
		const left = y < 43 ? 3 - Math.round((y - 33) * 0.2) : 1 + (y - 43);
		const right = y < 40 ? 10 : 10 + Math.round((y - 40) * 0.5);
		for (let x = left; x <= right; x++) {
			let colour = TUNIC.base;
			if (x <= left + 1) {
				colour = TUNIC.lit;
			} else if (x >= right - 1) {
				colour = TUNIC.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds at the elbow.
	line(scene, 4, 40, 8, 44, TUNIC.shade);
	line(scene, 5, 45, 8, 47, TUNIC.shade);
	// The cuff and the hand pinching the dividers' hinge.
	rect(scene, 9, TABLE - 2, 7, 1, C.creamLight);
	rect(scene, 10, TABLE - 1, 6, 1, C.creamShade);
	paint(
		scene,
		11,
		TABLE - 3,
		['..LLs.', '.LLSSs', 'LLSSSs', '.LSSs.', '..ss..'],
		{ L: SKIN.lit, S: SKIN.base, s: SKIN.shade }
	);
}

/**
 * Her left arm: the sleeve down to the elbow, then the bare forearm across to the set square she holds upright.
 * @param {Canvas} scene
 */
function drawSquareArm(scene) {
	for (let y = 32; y <= 47; y++) {
		const left = 36 + Math.round((y - 32) * 0.35);
		const right = 42 + Math.round((y - 32) * 0.3);
		for (let x = left; x <= right; x++) {
			let colour = TUNIC.shade;
			if (x <= left + 1) {
				colour = TUNIC.base;
			} else if (x >= right - 1) {
				colour = TUNIC.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The sleeve rolled back above the elbow.
	rect(scene, 37, 40, 8, 1, C.cream);
	rect(scene, 37, 41, 8, 1, C.creamShade);
	// The forearm, lit along its top.
	for (let x = 34; x <= 43; x++) {
		set(scene, x, 42, SKIN.lit);
		set(scene, x, 43, SKIN.base);
		set(scene, x, 44, SKIN.base);
		set(scene, x, 45, SKIN.shade);
	}
}

/**
 * The brass set square standing on the plans: a hollow right triangle, its right angle at the bottom left.
 * @param {Canvas} scene
 */
function drawSetSquare(scene) {
	const x0 = 31;
	const top = 30;
	const bottom = TABLE + 2;
	const right = 50;
	for (let y = top; y <= bottom; y++) {
		const reach =
			x0 + Math.round(((y - top) / (bottom - top)) * (right - x0));
		for (let x = x0; x <= reach; x++) {
			const inner = x > x0 + 1 && y < bottom - 1 && x < reach - 2;
			if (inner) {
				continue;
			}
			let colour = C.brass;
			if (x === x0 || y === bottom - 1 || x === reach) {
				colour = C.gold;
			} else if (y === bottom) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her hand gripping the set square's upright edge, the fingers curled round its near side.
 * @param {Canvas} scene
 */
function drawSquareHand(scene) {
	paint(
		scene,
		29,
		40,
		['..LLL...', '.LSSSSS.', 'sSSSSSS.', 'sSsSsSS.', '.s.s.ss.'],
		{ s: SKIN.shade, S: SKIN.base, L: SKIN.lit }
	);
}

/**
 * The table's edge behind the plans.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.timber;
			if (y === TABLE) {
				colour = C.timberLight;
			} else if ((x * 3 + y) % 13 === 0) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The unrolled parchment plans: the cathedral's floor drawn in blue ink, a cross of nave and transepts
 * with dots for its pillars and a round apse, the far end still rolled.
 * @param {Canvas} scene
 */
function drawPlans(scene) {
	for (let y = TABLE + 1; y < 64; y++) {
		for (let x = 2; x <= 57; x++) {
			let colour = C.cream;
			if (y === TABLE + 1 || x === 2) {
				colour = C.creamLight;
			} else if (x === 4 || y === TABLE + 3) {
				colour = INK.faint;
			}
			set(scene, x, y, colour);
		}
	}
	// The roll at the far end, lit along its near side.
	const roll = [
		C.creamLight,
		C.cream,
		C.cream,
		C.creamShade,
		C.creamShade,
		mix(C.creamShade, C.timberShade, 0.4),
	];
	for (let y = TABLE; y < 64; y++) {
		for (let x = 57; x <= 62; x++) {
			set(scene, x, y, roll[x - 57]);
		}
	}
	// The cross: the nave from the west door to the crossing, the transepts, the choir and the round apse.
	rect(scene, 18, 57, 15, 1, INK.line);
	rect(scene, 18, 61, 15, 1, INK.line);
	rect(scene, 37, 57, 8, 1, INK.line);
	rect(scene, 37, 61, 8, 1, INK.line);
	rect(scene, 32, 55, 6, 1, INK.line);
	rect(scene, 32, 55, 1, 3, INK.line);
	rect(scene, 37, 55, 1, 3, INK.line);
	rect(scene, 32, 61, 1, 3, INK.line);
	rect(scene, 37, 61, 1, 3, INK.line);
	for (const y of [58, 60]) {
		set(scene, 18, y, INK.line);
		set(scene, 46, y, INK.line);
		for (const x of [21, 24, 27, 30, 40, 43]) {
			set(scene, x, y, INK.line);
		}
	}
	set(scene, 45, 57, INK.line);
	set(scene, 45, 61, INK.line);
	set(scene, 47, 59, INK.line);
	set(scene, 18, 59, INK.faint);
}

/**
 * The iron dividers in her right hand, their points walked across the plans. Painted last so they keep a fine line.
 * @param {Canvas} scene
 */
function drawDividers(scene) {
	set(scene, 13, TABLE - 5, C.stoneLight);
	line(scene, 12, TABLE - 4, 9, TABLE + 7, C.stoneLight);
	line(scene, 13, TABLE - 4, 17, TABLE + 7, C.stone);
	set(scene, 9, TABLE + 8, C.ink);
	set(scene, 17, TABLE + 8, C.ink);
}
