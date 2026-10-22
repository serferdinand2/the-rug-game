// Tinkerers: an old clockmaker with a loupe in one eye fitting a spring into a brass clockwork bird, clocks ticking on the wall of her daylit workshop.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The pixels a shape covers, keyed `x,y`, before it is coloured.
 * @typedef {Set<string>} Mask
 */

/**
 * A shape's colours, from its lit edge to its dark one.
 * @typedef {Object} Tone
 * @property {Colour} glint - The edge facing the window
 * @property {Colour} lit - Next to the lit edge
 * @property {Colour} base - The body of the shape
 * @property {Colour} shade - Next to the dark edge
 * @property {Colour} dark - The edge away from the window
 */

/** The bench top's first row. */
const BENCH = 51;

/** The face's centre column. */
const FACE_X = 27;

/** The window on the left, frame included. */
const WINDOW = { x: 1, y: 2, w: 13, h: 17 };

/** The wall clock's centre and radius. */
const CLOCK = { x: 54, y: 10, r: 9 };

/** The clockwork bird's top-left corner: the tip of its beak is on its left. */
const BIRD = { x: 36, y: 28 };

/** Deep skin, lit by the window on her right. */
const SKIN = {
	glint: mix(C.skinTan, C.daySky6, 0.4),
	lit: mix(C.skinDeep, C.skinTan, 0.62),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.night, 0.35),
};

/** White hair. */
const HAIR = {
	lit: C.white,
	base: C.cream,
	shade: C.creamShade,
	dark: mix(C.stone, C.creamShade, 0.4),
};

/** The violet blouse. */
const BLOUSE = {
	glint: mix(C.railLight, C.white, 0.3),
	lit: C.railLight,
	base: C.roofLight,
	shade: mix(C.roofLight, C.roof, 0.5),
	dark: C.roof,
};

/** The leather apron. */
const APRON = {
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
};

/** Eye whites, and lips. */
const EYE = mix(C.cream, C.skinDeepShade, 0.3);
const LIPS = mix(C.brickRedShade, C.skinDeepShade, 0.4);

/** The face and hair are lit by hand, so the window's light leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	EYE,
	LIPS,
	C.ink,
];

/**
 * Draws the Tinkerers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(82744);

	drawInterior(layer, {
		floor: BENCH,
		random,
		wall: 'panel',
		window: { ...WINDOW, time: 'day' },
	});
	paintWall(layer);
	// The clocks hang on the wall, outlined on their own so the figure's outline doesn't swallow them.
	const wall = createCanvas(64, 64);
	drawRegulator(wall);
	drawWallClock(wall);
	drawMantelClock(wall);
	outline(wall, C.ink);
	underlay(wall, layer);

	const body = createCanvas(64, 64);
	drawBlouse(body);
	drawFace(body);
	drawHair(body);
	outline(body, C.ink);
	const scene = createCanvas(64, 64);
	drawBench(scene);
	drawArms(scene);
	drawBird(scene);
	drawHands(scene);
	outline(scene, C.ink);
	underlay(scene, body);
	underlay(scene, wall);

	glow(scene, {
		x: WINDOW.x + 6,
		y: WINDOW.y + 8,
		radius: 34,
		colour: C.white,
		strength: 0.18,
		steps: 3,
		skip: FIGURE,
	});
	drawTweezers(scene);
	return scene;
}

/**
 * Paints the plaster above the panelling a cool blue-grey.
 * @param {Canvas} layer
 */
function paintWall(layer) {
	const plaster = [C.plasterLight, C.plaster, C.plasterShade];
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour && plaster.includes(colour)) {
			layer.p[i] = mix(colour, C.daySky3, 0.4);
		}
	}
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
 * Paints a mask lit from the left: a glint and a lit band on its left edge, shade on its right.
 * @param {Canvas} canvas
 * @param {Mask} mask
 * @param {Tone} tone
 */
function fill(canvas, mask, tone) {
	for (const key of mask) {
		const [x, y] = key.split(',').map(Number);
		let colour = tone.base;
		if (!mask.has(`${x - 1},${y}`)) {
			colour = tone.glint;
		} else if (!mask.has(`${x - 2},${y}`) || !mask.has(`${x},${y - 1}`)) {
			colour = tone.lit;
		} else if (!mask.has(`${x + 1},${y}`)) {
			colour = tone.dark;
		} else if (!mask.has(`${x + 2},${y}`) || !mask.has(`${x},${y + 1}`)) {
			colour = tone.shade;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * A round wall clock in a brass rim: a cream face with tick marks and two hands, no numerals.
 * @param {Canvas} wall
 */
function drawWallClock(wall) {
	const { x: cx, y: cy, r } = CLOCK;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			let colour = C.creamLight;
			if (d > r - 1.5) {
				colour =
					x < cx - 2 ? C.gold : x > cx + 2 ? C.lampFrame : C.brass;
			} else if (d > r - 2.5) {
				colour = C.creamShade;
			}
			set(wall, x, y, colour);
		}
	}
	// Twelve ticks: the quarters long, the rest single dots.
	for (let i = 0; i < 12; i++) {
		const a = (i / 12) * Math.PI * 2;
		const tx = cx + Math.round(Math.sin(a) * (r - 3.5));
		const ty = cy - Math.round(Math.cos(a) * (r - 3.5));
		set(wall, tx, ty, i % 3 === 0 ? C.wood : C.stone);
	}
	line(wall, cx, cy, cx - 3, cy - 2, C.ink);
	line(wall, cx, cy, cx + 1, cy - 5, C.ink);
	set(wall, cx, cy, C.brass);
}

/**
 * A tall regulator clock under the wall clock: a wooden case with a glass door and a brass pendulum.
 * @param {Canvas} wall
 */
function drawRegulator(wall) {
	const x = 52;
	const top = 22;
	const bottom = 48;
	for (let y = top; y <= bottom; y++) {
		for (let px = x; px <= x + 10; px++) {
			let colour = C.timberShade;
			if (px === x || y === top) {
				colour = C.timber;
			} else if (px >= x + 9 || y === bottom) {
				colour = C.wood;
			}
			set(wall, px, y, colour);
		}
	}
	// The glass door onto the pendulum, the rod swinging a little to the right.
	rect(
		wall,
		x + 2,
		top + 2,
		7,
		bottom - top - 4,
		mix(C.plasterShade, C.wood, 0.55)
	);
	rect(
		wall,
		x + 2,
		top + 2,
		1,
		bottom - top - 4,
		mix(C.plasterLight, C.daySky6, 0.3)
	);
	line(wall, x + 5, top + 2, x + 6, bottom - 7, C.brass);
	paint(wall, x + 4, bottom - 7, ['.gb.', 'gGbb', 'bbbl', '.ll.'], {
		g: C.gold,
		G: C.lampGlow,
		b: C.brass,
		l: C.lampFrame,
	});
	// A carved crest on top.
	rect(wall, x + 2, top - 2, 7, 2, C.timberShade);
	rect(wall, x + 4, top - 3, 3, 1, C.timber);
}

/**
 * A small brass-cased mantel clock on a shelf under the window.
 * @param {Canvas} wall
 */
function drawMantelClock(wall) {
	rect(wall, 0, 30, 15, 1, C.timberLight);
	rect(wall, 0, 31, 15, 1, C.timberShade);
	paint(
		wall,
		2,
		21,
		[
			'...bbbb...',
			'..bwwwwb..',
			'.bwwkwwwb.',
			'bbwwkwwwbl',
			'bbwwwkkwbl',
			'bbwwwwwwbl',
			'.bbwwwwbl.',
			'bbbbbbbbll',
			'gbbbbbbbll',
		],
		{
			b: C.brass,
			g: C.gold,
			l: C.lampFrame,
			w: C.creamLight,
			k: C.wood,
		}
	);
}

/**
 * Her violet blouse with a high collar and a gold brooch, a leather apron over it, her shoulders
 * bent forward over the work.
 * @param {Canvas} scene
 */
function drawBlouse(scene) {
	// The neck, shaded under the chin.
	rect(scene, FACE_X - 1, 23, 4, 3, SKIN.shade);
	set(scene, FACE_X - 1, 23, SKIN.lit);
	for (let y = 26; y < BENCH; y++) {
		const half = Math.min(18, 7 + Math.round((y - 26) * 2.2));
		const cx = FACE_X + 1;
		for (let x = cx - half; x <= cx + half; x++) {
			const u = (x - cx) / half;
			let colour = BLOUSE.base;
			if (u < -0.88) {
				colour = BLOUSE.glint;
			} else if (u < -0.55) {
				colour = BLOUSE.lit;
			} else if (u > 0.85) {
				colour = BLOUSE.dark;
			} else if (u > 0.35) {
				colour = BLOUSE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The high collar.
	for (let x = FACE_X - 3; x <= FACE_X + 4; x++) {
		set(scene, x, 24, x < FACE_X ? BLOUSE.lit : BLOUSE.base);
		set(scene, x, 25, x < FACE_X + 1 ? BLOUSE.base : BLOUSE.shade);
	}
	// The apron's bib and the straps over her shoulders.
	for (let y = 32; y < BENCH; y++) {
		const half = y < 36 ? 5 : 7;
		for (let x = FACE_X + 1 - half; x <= FACE_X + 1 + half; x++) {
			let colour = APRON.base;
			if (x === FACE_X + 1 - half) {
				colour = APRON.lit;
			} else if (x >= FACE_X + half) {
				colour = APRON.shade;
			}
			set(scene, x, y, colour);
		}
	}
	line(scene, FACE_X - 4, 32, FACE_X - 9, 26, APRON.lit);
	line(scene, FACE_X + 6, 32, FACE_X + 10, 26, APRON.shade);
	// A pocket with a screwdriver in it.
	rect(scene, FACE_X - 3, 40, 6, 1, APRON.shade);
	rect(scene, FACE_X - 2, 37, 1, 3, C.stoneLight);
	rect(scene, FACE_X - 2, 36, 1, 1, C.brickRed);
	// The brooch at her collar.
	paint(scene, FACE_X, 26, ['.g.', 'gWa', '.a.'], {
		g: C.gold,
		W: C.lampGlow,
		a: C.amber,
	});
}

/**
 * Her face in three-quarters, bent to the bird on her left, lit by the window on her right:
 * a brass loupe screwed into her near eye, the far eye lowered to the work, lines of age.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -4, 3],
		[10, -5, 4],
		[11, -5, 5],
		[12, -6, 5],
		[13, -6, 5],
		[14, -6, 5],
		[15, -6, 5],
		[16, -6, 6],
		[17, -6, 6],
		[18, -6, 5],
		[19, -5, 5],
		[20, -5, 4],
		[21, -4, 4],
		[22, -3, 3],
		[23, -1, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -3) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The near ear, lit, with a gold stud.
	rect(scene, FACE_X - 7, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X - 7, 18, C.gold);
	// Lines on her brow and down from the nose, and the hollow of the far cheek.
	rect(scene, FACE_X - 2, 11, 4, 1, SKIN.shade);
	set(scene, FACE_X - 3, 19, SKIN.shade);
	set(scene, FACE_X - 3, 20, SKIN.shade);
	set(scene, FACE_X + 3, 19, SKIN.dark);
	// Grey brows.
	rect(scene, FACE_X - 5, 12, 3, 1, HAIR.shade);
	rect(scene, FACE_X + 2, 13, 3, 1, HAIR.dark);
	// The loupe: a black barrel with a brass ring, its lens catching the window.
	paint(
		scene,
		FACE_X - 5,
		13,
		['.bbb.', 'bkkkb', 'bktkb', 'bkkkb', '.bbb.'],
		{ b: C.brass, k: C.ink, t: C.tealLight }
	);
	// The far eye, its lid lowered towards the bird.
	rect(scene, FACE_X + 2, 15, 2, 1, SKIN.dark);
	set(scene, FACE_X + 2, 16, EYE);
	set(scene, FACE_X + 3, 16, C.ink);
	// The nose: lit along its ridge, a shade line down its far side, the tip jutting out.
	rect(scene, FACE_X, 15, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 1, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 6, 17, SKIN.shade);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	// Thin lips pressed together in concentration.
	rect(scene, FACE_X - 1, 21, 4, 1, LIPS);
	set(scene, FACE_X, 22, SKIN.shade);
}

/**
 * Her white hair, drawn back into a bun on top and pinned with a pencil.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	for (let y = 0; y <= 15; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 8; x++) {
			const dx = x - FACE_X;
			const head = ((dx + 0.5) / 7.6) ** 2 + ((y - 10.5) / 8.6) ** 2 <= 1;
			const bun = Math.hypot(dx - 1, y - 2.5) <= 3.4;
			// The hairline: off the forehead, down past the near temple.
			const face = y >= 9 && dx >= -4 && dx <= 4;
			const temple = y >= 12 && dx > -6;
			if ((!head && !bun) || face || temple) {
				continue;
			}
			// Strands combed back and up into the bun, lit on the window's side.
			const strand =
				Math.floor(Math.atan2(y - 2.5, dx - 1) * 5 + 20) % 2 === 0;
			let colour = strand ? HAIR.base : HAIR.shade;
			if (dx <= -5 || (bun && dx <= 0)) {
				colour = strand ? HAIR.lit : HAIR.base;
			} else if (dx >= 5 || (bun && dx >= 3)) {
				colour = strand ? HAIR.shade : HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// A pencil through the bun.
	line(scene, FACE_X - 4, 1, FACE_X + 5, 5, C.amber);
	set(scene, FACE_X + 5, 5, C.wood);
	set(scene, FACE_X - 4, 1, C.brickRed);
}

/**
 * Her rolled sleeves and bare forearms reaching in to the bird, the near one from the left with
 * the tweezers, the far one cradling the bird from below.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	/** @type {Mask} */
	const nearSleeve = new Set();
	stroke(
		nearSleeve,
		[
			[FACE_X - 13, 31],
			[FACE_X - 15, 42],
		],
		3.2
	);
	fill(scene, nearSleeve, BLOUSE);
	/** @type {Mask} */
	const nearArm = new Set();
	stroke(
		nearArm,
		[
			[FACE_X - 15, 44],
			[FACE_X - 2, 43],
			[BIRD.x - 6, 40],
		],
		2.1
	);
	fill(scene, nearArm, SKIN);
	/** @type {Mask} */
	const farSleeve = new Set();
	stroke(
		farSleeve,
		[
			[FACE_X + 15, 31],
			[FACE_X + 21, 41],
		],
		3.2
	);
	fill(scene, farSleeve, BLOUSE);
	/** @type {Mask} */
	const farArm = new Set();
	stroke(
		farArm,
		[
			[FACE_X + 21, 44],
			[BIRD.x + 11, 45],
		],
		2.1
	);
	fill(scene, farArm, SKIN);
}

/**
 * The clockwork bird standing on her palm, facing the tweezers: a brass head with a steel beak
 * and a red jewel eye, a round body with its side panel open on a gear, and a fanned tail.
 * @param {Canvas} scene
 */
function drawBird(scene) {
	paint(
		scene,
		BIRD.x,
		BIRD.y,
		[
			'...............tT..',
			'..............tTt..',
			'.............tTt...',
			'...gghh.....tTt....',
			'..gGhhhh...tTt.....',
			'.ggEWhhhl.tTt......',
			'kkgEEhhhlbbt.......',
			'.kkghhhhbbbbbl.....',
			'...gghhbbbbbbbl....',
			'...gbbooooobbbl....',
			'...gbooeeeobbbl....',
			'...gboeGGeobbl.....',
			'....booeeeobbl.....',
			'.....bbooobbl......',
			'......bbbbll.......',
			'.......l...l.......',
		],
		{
			g: C.gold,
			G: C.lampGlow,
			h: C.brass,
			b: C.brass,
			l: C.lampFrame,
			o: C.wood,
			e: C.amber,
			k: C.stoneLight,
			E: C.brickRed,
			W: C.white,
			t: C.lampFrame,
			T: C.gold,
		}
	);
}

/**
 * Her two hands: the near one pinching the tweezers, the far one flat under the bird's feet.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	const keys = { g: SKIN.glint, l: SKIN.lit, b: SKIN.base, s: SKIN.shade };
	paint(scene, BIRD.x - 8, 37, ['.lb.', 'glbs', 'lbbs', '.bs.'], keys);
	paint(scene, BIRD.x + 4, 44, ['glbbbbbs', '.lbbbss.'], keys);
}

/**
 * Fine steel tweezers from her fingers into the bird's open side, a tiny spring in their tips.
 * @param {Canvas} scene
 */
function drawTweezers(scene) {
	line(scene, BIRD.x - 5, 37, BIRD.x + 5, 38, C.stoneLight);
	line(scene, BIRD.x - 5, 38, BIRD.x + 5, 39, C.stone);
	set(scene, BIRD.x + 6, 38, C.white);
	set(scene, BIRD.x + 6, 39, C.stoneLight);
}

/**
 * The workbench across the bottom, scattered with gears and a coil spring.
 * @param {Canvas} scene
 */
function drawBench(scene) {
	for (let y = BENCH; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.timberShade;
			if (y === BENCH) {
				colour = C.timberLight;
			} else if (y < BENCH + 4) {
				colour = (x * 3 + y) % 13 === 0 ? C.timberShade : C.timber;
			} else if (y === BENCH + 4) {
				colour = C.wood;
			}
			set(scene, x, y, colour);
		}
	}
	// Two loose cogs and a coiled mainspring on the bench.
	drawCog(scene, 7, BENCH + 5, 3);
	drawCog(scene, 15, BENCH + 4, 2);
	paint(scene, 52, BENCH + 1, ['.sss.', 'sl.ls', 's.l.s', 'sl..s', '.sss.'], {
		s: C.stone,
		l: C.stoneLight,
	});
}

/**
 * A loose brass cog: a solid disc lit on its upper left, a dark hub and short teeth round the rim.
 * @param {Canvas} scene
 * @param {number} cx - The hub's column
 * @param {number} cy - The hub's row
 * @param {number} r - The disc's radius, teeth not included
 */
function drawCog(scene, cx, cy, r) {
	const teeth = r >= 3 ? 8 : 6;
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const d = Math.hypot(x - cx, y - cy);
			const a = Math.atan2(y - cy, x - cx) / ((Math.PI * 2) / teeth);
			const tooth = Math.abs(a - Math.round(a)) < 0.2;
			if (d > r + 0.3 && !(tooth && d <= r + 1.3)) {
				continue;
			}
			let colour = C.brass;
			if (d <= 0.5) {
				colour = C.wood;
			} else if (d <= 1.5 && r >= 3) {
				colour = C.lampFrame;
			} else if (x + y < cx + cy - 1) {
				colour = C.gold;
			} else if (x + y > cx + cy + 1) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}
