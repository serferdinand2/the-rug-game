// Weefolk: a tiny man in a thimble helmet, a sewing needle for a sword, hiding behind a towering teacup on a gingham kitchen table by day.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column. */
const FACE_X = 49;

/** The table's far edge: the first row of the tablecloth. */
const TABLE = 50;

/** The teacup: its centre column, its rim row, its foot row, and its half-widths at the rim and the foot. */
const CUP = { x: 19, rim: 10, foot: 54, top: 22, base: 13 };

/** Skin lit by the window on his left, plain, and shaded. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.35),
	lit: mix(C.skinTan, C.skin, 0.45),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.wood, 0.35),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.4) };

/** The thimble: polished silver, lit by the window and shaded away from it. */
const SILVER = {
	glint: C.white,
	lit: mix(C.stoneLight, C.white, 0.35),
	base: C.stoneLight,
	shade: C.stone,
	dark: C.stoneShade,
};

/** Fine china: lit, plain and shaded white, and the blue of its painted band. */
const CHINA = {
	lit: C.white,
	base: mix(C.white, C.cloudShade, 0.5),
	shade: C.cloudShade,
	dark: mix(C.cloudShade, C.stone, 0.45),
	blue: C.daySea2,
	blueShade: C.daySea3,
};

/**
 * Draws the Weefolk portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8944);

	drawInterior(layer, {
		floor: TABLE,
		random,
		wall: 'panel',
		window: { x: 42, y: 0, w: 22, h: 21, time: 'day' },
	});
	drawCloth(layer);
	drawSmoke(layer, { x: 13, y: 7, tone: 'steam', puffs: 2, drift: -1 });
	drawSmoke(layer, { x: 25, y: 7, tone: 'steam', puffs: 2, drift: 1 });

	const man = createCanvas(64, 64);
	drawLegs(man);
	drawBody(man);
	drawHead(man);
	drawHelmet(man);
	outline(man, C.ink);
	const front = createCanvas(64, 64);
	drawSaucer(front);
	drawCup(front);
	drawHands(front);
	drawNeedle(front);
	drawCrumbs(front);
	outline(front, C.ink);
	underlay(front, man);
	underlay(scene, front);
	underlay(scene, layer);

	drawThread(scene);
	drawShine(scene);
	return scene;
}

/**
 * The red gingham tablecloth over the table, each square as wide as his head.
 * @param {Canvas} layer
 */
function drawCloth(layer) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const across = Math.floor(x / 7) % 2 === 0;
			const down = Math.floor((y - TABLE) / 5) % 2 === 0;
			let colour = C.creamLight;
			if (across && down) {
				colour = C.brickRed;
			} else if (across || down) {
				colour = C.brickRedLight;
			}
			if (y === TABLE) {
				colour = mix(colour, C.white, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * His legs in brown hose and his little boots, standing on the cloth behind the saucer.
 * @param {Canvas} scene
 */
function drawLegs(scene) {
	for (let y = 45; y <= 61; y++) {
		for (const [from, to] of [
			[FACE_X - 6, FACE_X - 1],
			[FACE_X + 2, FACE_X + 7],
		]) {
			for (let x = from; x <= to; x++) {
				let colour = C.timber;
				if (y >= 57) {
					colour = x === to ? C.wood : C.timberShade;
					if (y === 57) {
						colour = C.timber;
					}
				} else if (x === to) {
					colour = C.timberLight;
				} else if (x === from) {
					colour = C.timberShade;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// The boots' toes, turned up.
	set(scene, FACE_X - 7, 61, C.timberShade);
	set(scene, FACE_X + 8, 60, C.wood);
	set(scene, FACE_X + 8, 61, C.wood);
}

/**
 * His body: a green tunic with a leaf collar, a leather baldric across it and a brass button at the belt.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck.
	rect(scene, FACE_X - 2, 29, 5, 3, SKIN.shade);
	set(scene, FACE_X + 2, 29, SKIN.base);
	for (let y = 31; y <= 48; y++) {
		const half =
			Math.min(9, 4 + Math.round((y - 31) * 1.6)) + (y > 44 ? 1 : 0);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = C.grass;
			if (u > 0.6) {
				colour = C.grassLight;
			} else if (u < -0.55) {
				colour = C.grassShade;
			}
			if (y === 48 && (x - FACE_X) % 3 === 0) {
				colour = C.grassShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The leather baldric from his left shoulder to his right hip.
	for (let y = 32; y <= 43; y++) {
		const x = FACE_X + 6 - Math.round((y - 32) * 0.9);
		rect(scene, x - 1, y, 3, 1, C.timber);
		set(scene, x + 1, y, C.timberLight);
	}
	// The leaf collar: pointed tips over the shoulders.
	paint(
		scene,
		FACE_X - 6,
		30,
		['P..........L', 'PPPP....LLLL', '.PPPPPLLLLL.', '...PPPLLL...'],
		{ L: C.pineLight, P: C.pine }
	);
	// The belt and its button buckle.
	for (let x = FACE_X - 10; x <= FACE_X + 11; x++) {
		set(scene, x, 44, C.timber);
		set(scene, x, 45, C.timberShade);
	}
	paint(scene, FACE_X - 1, 43, ['.bb.', 'bkkb', 'bkkb', '.bb.'], {
		b: C.brass,
		k: C.lampFrame,
	});
}

/**
 * His head: the face turned to the viewer and lit by the window on his left, eyes glancing warily towards
 * the cup, hair sticking out under the helmet.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// Hair poking out under the helmet's rim.
	for (const [x, y] of [
		[FACE_X - 7, 17],
		[FACE_X - 7, 18],
		[FACE_X - 8, 18],
		[FACE_X - 6, 19],
		[FACE_X + 7, 17],
		[FACE_X + 8, 18],
		[FACE_X + 7, 18],
		[FACE_X + 7, 19],
	]) {
		set(scene, x, y, x > FACE_X ? C.timberLight : C.timber);
	}
	/** @type {[number, number, number][]} */
	const rows = [
		[16, -5, 6],
		[17, -5, 6],
		[18, -5, 6],
		[19, -5, 6],
		[20, -5, 6],
		[21, -5, 6],
		[22, -5, 6],
		[23, -4, 5],
		[24, -4, 5],
		[25, -4, 5],
		[26, -3, 4],
		[27, -3, 4],
		[28, -2, 3],
		[29, -1, 2],
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
	// Big ears, the near one lit.
	paint(scene, FACE_X - 7, 20, ['ds', 'ds', '.s'], {
		s: SKIN.shade,
		d: SKIN.dark,
	});
	paint(scene, FACE_X + 7, 20, ['lg', 'lg', 'l.'], {
		g: SKIN.glint,
		l: SKIN.lit,
	});
	// Brows raised in alarm, and the eyes glancing towards the cup.
	rect(scene, FACE_X - 3, 17, 3, 1, C.timberShade);
	rect(scene, FACE_X + 2, 17, 3, 1, C.timber);
	set(scene, FACE_X - 3, 19, SKIN.dark);
	set(scene, FACE_X + 2, 19, SKIN.shade);
	set(scene, FACE_X - 3, 20, C.ink);
	set(scene, FACE_X - 2, 20, EYE.shade);
	set(scene, FACE_X + 2, 20, C.ink);
	set(scene, FACE_X + 3, 20, EYE.lit);
	// A button nose, lit at its tip.
	rect(scene, FACE_X, 21, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 23, SKIN.glint);
	set(scene, FACE_X, 24, SKIN.dark);
	// Rosy cheeks and a small round mouth.
	set(scene, FACE_X - 3, 23, mix(SKIN.shade, C.brickRed, 0.3));
	set(scene, FACE_X + 4, 23, mix(SKIN.lit, C.brickRedLight, 0.35));
	rect(scene, FACE_X, 26, 2, 1, C.brickRedShade);
	set(scene, FACE_X, 27, mix(C.brickRed, C.skinTan, 0.4));
}

/**
 * The thimble he wears as a helmet: a silver dome covered in dimples, a rolled rim over his brow.
 * @param {Canvas} scene
 */
function drawHelmet(scene) {
	for (let y = 4; y <= 16; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 9; x++) {
			const dx = x - FACE_X - 0.5;
			const half = y < 7 ? 5 + (y - 4) * 1.2 : 8.5;
			if (Math.abs(dx) > half || (y === 4 && Math.abs(dx) > 4)) {
				continue;
			}
			const u = dx / half;
			let colour = SILVER.base;
			if (u > 0.75) {
				colour = SILVER.glint;
			} else if (u > 0.3) {
				colour = SILVER.lit;
			} else if (u < -0.7) {
				colour = SILVER.dark;
			} else if (u < -0.25) {
				colour = SILVER.shade;
			}
			// The dimples, in staggered rows.
			if (y >= 6 && y <= 13 && y % 2 === 0 && (x + y) % 3 === 0) {
				colour = u < -0.25 ? SILVER.dark : SILVER.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The rolled rim.
	for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
		const u = (x - FACE_X - 0.5) / 9.5;
		let colour = SILVER.lit;
		if (u > 0.2) {
			colour = SILVER.glint;
		} else if (u < -0.5) {
			colour = SILVER.shade;
		}
		set(scene, x, 15, colour);
		set(scene, x, 16, u < -0.4 ? SILVER.dark : SILVER.shade);
	}
}

/**
 * The saucer under the cup, its rim edged in blue, reaching in front of his legs.
 * @param {Canvas} scene
 */
function drawSaucer(scene) {
	for (let y = CUP.foot - 2; y <= CUP.foot + 6; y++) {
		const half = Math.round(
			28 * Math.sqrt(Math.max(0, 1 - ((y - CUP.foot - 2) / 4.6) ** 2))
		);
		for (let x = CUP.x - half; x <= CUP.x + half; x++) {
			let colour = CHINA.base;
			if (y >= CUP.foot + 4) {
				colour = CHINA.dark;
			} else if (x > CUP.x + half - 5) {
				colour = CHINA.lit;
			} else if (x < CUP.x - half + 7) {
				colour = CHINA.shade;
			}
			if (y === CUP.foot + 3) {
				colour = x > CUP.x ? CHINA.blue : CHINA.blueShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The teacup towering over him: fine white china with a blue band and painted flowers, tea at the brim.
 * @param {Canvas} scene
 */
function drawCup(scene) {
	// The bowl, narrowing from the rim to the foot.
	for (let y = CUP.rim; y <= CUP.foot; y++) {
		const t = (y - CUP.rim) / (CUP.foot - CUP.rim);
		const half = Math.round(CUP.top - (CUP.top - CUP.base) * t ** 1.8);
		for (let x = CUP.x - half; x <= CUP.x + half; x++) {
			const u = (x - CUP.x) / half;
			let colour = CHINA.base;
			if (u > 0.6) {
				colour = CHINA.lit;
			} else if (u < -0.75) {
				colour = CHINA.dark;
			} else if (u < -0.35) {
				colour = CHINA.shade;
			}
			// The blue band below the rim with a gold line under it, and a gold foot ring.
			if (y >= CUP.rim + 3 && y <= CUP.rim + 6) {
				colour = u < -0.35 ? CHINA.blueShade : CHINA.blue;
			} else if (y === CUP.rim + 7 || y === CUP.foot - 1) {
				colour = u < -0.35 ? C.amber : C.gold;
			}
			set(scene, x, y, colour);
		}
	}
	// Blue flowers painted round the bowl.
	for (const [fx, fy] of [
		[CUP.x - 12, 24],
		[CUP.x + 1, 22],
		[CUP.x + 13, 26],
		[CUP.x - 6, 33],
		[CUP.x + 7, 35],
		[CUP.x - 1, 44],
		[CUP.x - 13, 40],
	]) {
		paint(scene, fx - 1, fy - 1, ['.b.', 'bcb', '.b.'], {
			b: CHINA.blue,
			c: C.gold,
		});
	}
	// The rim, seen from a little above, with the tea inside.
	for (let y = CUP.rim - 4; y <= CUP.rim; y++) {
		const half = Math.round(
			CUP.top * Math.sqrt(Math.max(0, 1 - ((y - CUP.rim + 2) / 2.6) ** 2))
		);
		for (let x = CUP.x - half; x <= CUP.x + half; x++) {
			const inner =
				Math.abs(x - CUP.x) < half - 1 &&
				y > CUP.rim - 4 &&
				y < CUP.rim;
			let colour = x > CUP.x ? CHINA.lit : CHINA.base;
			if (inner) {
				colour = x > CUP.x + 8 ? C.timberLight : C.timber;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * His hands: the right gripping the cup's edge as he peers round it, the left raised in a fist round the needle.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	// His fingers curled round the cup's edge, their tips pale against the china.
	paint(
		scene,
		CUP.x + 18,
		24,
		['.bbs.', 'lbbbs', 'dddds', 'lbbbs', 'dddds', 'lbbbs', '.dds.'],
		{ l: SKIN.lit, b: SKIN.base, s: SKIN.shade, d: SKIN.dark }
	);
	// The sleeve of his raised left arm.
	for (let y = 26; y <= 38; y++) {
		const x0 = FACE_X + 8 + Math.round((y - 26) * 0.1);
		for (let x = x0; x <= x0 + 4; x++) {
			set(scene, x, y, x >= x0 + 3 ? C.grassLight : C.grass);
		}
	}
	paint(scene, FACE_X + 8, 22, ['.hhh.', 'hhhhg', 'hhhgg', '.hhg.'], {
		h: SKIN.lit,
		g: SKIN.glint,
	});
}

/**
 * The needle he holds as a sword: a long steel blade raised high beside his helmet, its eye below his fist.
 * @param {Canvas} scene
 */
function drawNeedle(scene) {
	for (let y = 0; y <= 21; y++) {
		const x = FACE_X + 12 - Math.round((21 - y) * -0.05);
		set(scene, x - 1, y, C.stone);
		set(scene, x, y, y < 2 ? C.stone : C.white);
		if (y >= 3) {
			set(scene, x + 1, y, C.stoneLight);
		}
	}
	// The eye, below the fist.
	paint(scene, FACE_X + 10, 26, ['sLs', 's.s', 's.s', 'sLs', '.s.'], {
		s: C.stone,
		L: C.stoneLight,
	});
}

/**
 * Crumbs on the cloth, each as big as his fist.
 * @param {Canvas} scene
 */
function drawCrumbs(scene) {
	paint(scene, 57, 58, ['.tT.', 'tTTs', '.ss.'], {
		t: C.sandLight,
		T: C.sand,
		s: C.sandShade,
	});
	paint(scene, 39, 61, ['tT', 'ss'], {
		t: C.sandLight,
		T: C.sand,
		s: C.sandShade,
	});
}

/**
 * The red thread through the needle's eye, trailing down past him to the cloth, drawn after the outline.
 * @param {Canvas} scene
 */
function drawThread(scene) {
	for (let y = 28; y <= 63; y++) {
		const x =
			FACE_X +
			11 +
			Math.round(Math.sin((y - 28) * 0.25) * 2) +
			Math.round((y - 28) * 0.08);
		set(scene, x, y, C.brickRedShade);
	}
}

/**
 * Glints of window light on the china and the steel, drawn last.
 * @param {Canvas} scene
 */
function drawShine(scene) {
	for (const [x, y] of [
		[CUP.x + 17, 19],
		[CUP.x + 17, 20],
		[CUP.x + 16, 22],
		[FACE_X + 6, 8],
	]) {
		set(scene, x, y, C.white);
	}
}
