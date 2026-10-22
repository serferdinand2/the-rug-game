// Historians: an old archivist in spectacles and a blue shawl unrolling a scroll by lamplight among bookshelves at night, a bronze helmet, a sword and an urn kept as relics behind her.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The desk top's first row. */
const DESK = 55;

/** The shelf boards' top rows, from the top of the bookcase down. */
const SHELVES = [12, 29, 46];

/** The lamp flame on the desk at her right. */
const FLAME = { x: 6, y: 41 };

/** The face's centre column. */
const FACE_X = 33;

/** The scroll: its two rolls' left columns, and its top and bottom rows. */
const SCROLL = { left: 15, right: 47, top: 40, bottom: 50 };

/** Skin: lit warm by the lamp on her right, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.5),
	lit: mix(C.skin, C.gold, 0.22),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.night, 0.35),
};

/** White hair: warm where the lamp catches it, grey in shadow. */
const HAIR = {
	lit: mix(C.creamLight, C.lampGlow, 0.35),
	base: mix(C.cream, C.stoneLight, 0.35),
	shade: mix(C.stoneLight, C.stone, 0.45),
	dark: mix(C.stone, C.night, 0.35),
};

/** A dark blue knitted shawl: lit by the lamp, plain, and in shadow. */
const SHAWL = {
	lit: mix(C.nightSea1, C.amber, 0.4),
	base: mix(C.nightSea2, C.night, 0.2),
	shade: mix(C.nightSea3, C.night, 0.5),
	knit: mix(C.nightSea3, C.night, 0.25),
};

/** The plum dress under the shawl. */
const DRESS = {
	lit: mix(C.roofLight, C.brickRedShade, 0.45),
	base: mix(C.roof, C.brickRedShade, 0.4),
};

/** Parchment: lit by the lamp, plain and shaded, with its ruled lines. */
const PARCHMENT = {
	lit: mix(C.creamLight, C.lampGlow, 0.4),
	base: C.cream,
	shade: C.creamShade,
	rule: mix(C.creamShade, C.timberShade, 0.35),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinShade, 0.45) };

/** Lips. */
const LIPS = {
	line: mix(C.brickRedShade, C.skinShade, 0.3),
	lower: mix(C.brickRed, C.skin, 0.55),
};

/** The figure is lit by hand, so the lamp's glow leaves it as painted; gold keeps its shine. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(SHAWL),
	...Object.values(DRESS),
	...Object.values(PARCHMENT),
	...Object.values(EYE),
	...Object.values(LIPS),
	C.ink,
	C.gold,
	C.brass,
	C.lampFrame,
];

/**
 * Draws the Historians portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8231);

	drawBookcase(layer, random);

	// The relics are outlined on their own, so they stand clear of the books.
	const relics = createCanvas(64, 64);
	drawSword(relics);
	drawHelmet(relics);
	drawUrn(relics);
	outline(relics, C.ink);
	underlay(relics, layer);

	drawBody(scene);
	drawHead(scene);
	drawScroll(scene);
	drawHands(scene);
	drawDesk(scene);
	drawLamp(scene);
	outline(scene, C.ink);
	underlay(scene, relics);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 30,
		colour: C.amber,
		strength: 0.4,
		steps: 5,
		skip: FIGURE,
	});
	drawFlame(scene);
	return scene;
}

/**
 * A wall of dark bookshelves: three boards of leather spines in dim reds, blues, greens and browns.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBookcase(layer, random) {
	rect(layer, 0, 0, 64, 64, mix(C.wood, C.night, 0.45));
	const spines = [
		C.brickRedShade,
		C.roof,
		C.pineShade,
		C.timber,
		C.nightSea3,
		C.lampFrame,
		C.timberShade,
	];
	for (const board of SHELVES) {
		let x = 0;
		while (x < 64) {
			const w = 2 + Math.floor(random() * 2);
			const h = 7 + Math.floor(random() * 4);
			const spine = spines[Math.floor(random() * spines.length)];
			if (random() < 0.12) {
				x += 1;
				continue;
			}
			for (let i = 0; i < w; i++) {
				for (let j = 1; j <= h; j++) {
					const colour =
						i === w - 1 ? mix(spine, C.night, 0.3) : spine;
					set(layer, x + i, board - j, mix(colour, C.night, 0.45));
				}
			}
			// A gilt band across the spine near its top.
			if (random() < 0.5) {
				rect(layer, x, board - h + 2, w, 1, mix(C.brass, C.night, 0.5));
			}
			x += w;
		}
		rect(layer, 0, board, 64, 1, mix(C.timberLight, C.night, 0.45));
		rect(layer, 0, board + 1, 64, 1, mix(C.timberShade, C.night, 0.4));
	}
}

/**
 * An old sword hung point down across the shelves at the left: a bronze hilt, a long pale blade.
 * @param {Canvas} relics
 */
function drawSword(relics) {
	const blade = mix(C.stoneLight, C.night, 0.2);
	const edge = mix(C.stone, C.night, 0.3);
	const bronze = mix(C.brass, C.night, 0.2);
	line(relics, 7, 10, 17, 30, blade);
	line(relics, 8, 10, 18, 30, edge);
	set(relics, 18, 31, edge);
	// The crossguard, the grip and the pommel.
	line(relics, 2, 11, 10, 7, bronze);
	line(relics, 3, 11, 10, 8, mix(C.lampFrame, C.night, 0.2));
	line(relics, 5, 7, 4, 5, mix(C.timberShade, C.night, 0.1));
	line(relics, 6, 7, 5, 5, mix(C.timber, C.night, 0.2));
	rect(relics, 3, 2, 2, 2, bronze);
}

/**
 * A bronze crested helmet on the top shelf at the right: slanted eye holes over a narrow mouth gap.
 * @param {Canvas} relics
 */
function drawHelmet(relics) {
	paint(
		relics,
		48,
		0,
		[
			'..rRRRRrr...',
			'.rRRRRRrrr..',
			'...bBBBbd...',
			'..bBBBBBbd..',
			'.bBBBBBBBbd.',
			'.bkkBBBBkkd.',
			'.bBkkBBkkbd.',
			'.bBBBBBBBbd.',
			'..bBBkkBbd..',
			'..bBBkkbbd..',
			'...bb..bd...',
		],
		{
			r: mix(C.brickRedShade, C.night, 0.35),
			R: mix(C.brickRed, C.night, 0.4),
			B: mix(C.brass, C.night, 0.4),
			b: mix(C.lampFrame, C.night, 0.3),
			d: mix(C.lampFrame, C.night, 0.55),
			k: mix(C.ink, C.night, 0.3),
		}
	);
}

/**
 * A black-banded terracotta urn with two handles on the middle shelf at the right.
 * @param {Canvas} relics
 */
function drawUrn(relics) {
	paint(
		relics,
		50,
		16,
		[
			'...tTTt...',
			'....TT....',
			'.h.tTTt.h.',
			'.h.tTTtth.',
			'.htTTTTtth',
			'.tTTTTTTtt',
			'.kkkkkkkkk',
			'.tTTTTTTtt',
			'.kkkkkkkkk',
			'..tTTTTtt.',
			'...tTTtt..',
			'....tt....',
			'...kkkk...',
		],
		{
			T: mix(C.timberLight, C.night, 0.35),
			t: mix(C.timber, C.night, 0.4),
			h: mix(C.timber, C.night, 0.5),
			k: mix(C.ink, C.timberShade, 0.3),
		}
	);
}

/**
 * Her shoulders and body: the blue shawl over a plum dress, a lace collar and a cameo brooch,
 * lit by the lamp on her right.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, in the chin's shadow except on the lamp's side.
	for (let y = 25; y <= 28; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 1; x++) {
			let colour = SKIN.shade;
			if (y === 25) {
				colour = SKIN.dark;
			} else if (x === FACE_X - 2) {
				colour = SKIN.base;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 29; y < DESK; y++) {
		const half = Math.min(25, 8 + Math.round((y - 29) * 2.3));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHAWL.base;
			if (u < -0.82) {
				colour = SHAWL.lit;
			} else if (u > 0.35) {
				colour = SHAWL.shade;
			} else if ((x * 2 + y) % 4 === 0) {
				colour = SHAWL.knit;
			}
			set(scene, x, y, colour);
		}
	}
	// The dress showing where the shawl falls open.
	for (let y = 30; y < DESK; y++) {
		const half = Math.min(5, 2 + Math.floor((y - 30) / 3));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X - 1 ? DRESS.lit : DRESS.base);
		}
	}
	// The shawl's edges, lit on the lamp's side.
	for (let y = 30; y < DESK; y++) {
		const half = Math.min(5, 2 + Math.floor((y - 30) / 3));
		set(scene, FACE_X - half - 1, y, SHAWL.lit);
		set(scene, FACE_X + half + 1, y, SHAWL.shade);
	}
	// The lace collar round her neck, and a cameo at its knot.
	for (let x = FACE_X - 4; x <= FACE_X + 4; x++) {
		const lit = x < FACE_X;
		set(scene, x, 29, lit ? C.creamLight : C.cream);
		if (Math.abs(x - FACE_X) >= 2) {
			set(scene, x, 30, lit ? C.cream : C.creamShade);
		}
	}
	paint(scene, FACE_X - 1, 30, ['.g.', 'gWg', '.g.'], {
		g: C.gold,
		W: C.cream,
	});
	// Folds of the shawl falling from the shoulders.
	for (let y = 34; y < DESK; y++) {
		set(scene, FACE_X - 12 + Math.round((y - 34) * 0.25), y, SHAWL.shade);
		set(scene, FACE_X + 11 + Math.round((y - 34) * 0.2), y, SHAWL.knit);
	}
}

/**
 * Her head: short curly white hair and her lined face turned to the viewer, round spectacles low on
 * her nose, lit by the lamp on her right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The curls: a cloud of white round the head, bumpy at its edge.
	for (let y = 2; y <= 25; y++) {
		for (let x = FACE_X - 11; x <= FACE_X + 11; x++) {
			const dx = x - FACE_X + 0.5;
			const dy = y - 13;
			const angle = Math.atan2(dy, dx);
			const reach = 1 + 0.08 * Math.sin(angle * 9);
			const d = (dx / 9.5) ** 2 + (dy / 10.5) ** 2;
			if (d > reach * reach || y > 23) {
				continue;
			}
			let colour = HAIR.base;
			if (dx < -5 || (dx < 0 && dy < -6)) {
				colour = HAIR.lit;
			} else if (dx > 5) {
				colour = HAIR.shade;
			}
			if ((x * 3 + y * 5) % 7 === 0) {
				colour = dx < 0 ? HAIR.base : HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -3, 2],
		[11, -4, 3],
		[12, -5, 4],
		[13, -5, 4],
		[14, -6, 5],
		[15, -6, 5],
		[16, -6, 5],
		[17, -6, 5],
		[18, -5, 4],
		[19, -5, 4],
		[20, -5, 4],
		[21, -4, 3],
		[22, -4, 3],
		[23, -3, 2],
		[24, -2, 1],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx <= -3) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
		// The curls just outside the face sit in their own shadow, so the face stands clear of them.
		for (const x of [FACE_X + from - 1, FACE_X + to + 1]) {
			if (y > 10 && y < 23 && get(scene, x, y)) {
				set(scene, x, y, x < FACE_X ? HAIR.shade : HAIR.dark);
			}
		}
	}
	// The lit cheekbone.
	set(scene, FACE_X - 5, 17, SKIN.glint);
	set(scene, FACE_X - 4, 18, SKIN.glint);
	// A few curls falling over the brow.
	for (const [dx, y] of [
		[-3, 10],
		[-2, 10],
		[0, 10],
		[1, 10],
		[2, 10],
		[-1, 10],
		[1, 11],
		[-3, 11],
	]) {
		set(scene, FACE_X + dx, y, dx < 0 ? HAIR.lit : HAIR.base);
	}
	// Pale brows.
	rect(scene, FACE_X - 4, 13, 3, 1, HAIR.shade);
	rect(scene, FACE_X + 1, 13, 3, 1, HAIR.dark);
	// Round spectacles: gold rims round her eyes, the lit rim glinting, a bridge over the nose.
	paint(scene, FACE_X - 5, 14, ['.Wg...bb.', 'gwkgBBkeb', '.gg...bb.'], {
		W: C.white,
		g: C.gold,
		B: C.brass,
		b: C.lampFrame,
		w: EYE.lit,
		e: EYE.shade,
		k: C.ink,
	});
	// Lines at the corners of her eyes and under them.
	set(scene, FACE_X - 6, 16, SKIN.base);
	rect(scene, FACE_X - 4, 17, 2, 1, SKIN.base);
	set(scene, FACE_X + 4, 16, SKIN.dark);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X - 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// Lines from the nose to the mouth.
	set(scene, FACE_X - 3, 20, SKIN.base);
	set(scene, FACE_X + 2, 20, SKIN.dark);
	// A thin, kindly smile.
	set(scene, FACE_X - 2, 21, LIPS.line);
	rect(scene, FACE_X - 1, 22, 2, 1, LIPS.line);
	set(scene, FACE_X + 1, 21, LIPS.line);
	set(scene, FACE_X - 1, 23, LIPS.lower);
}

/**
 * The scroll held open across her body: two rolls with wooden knobs and a sheet of ruled parchment
 * between them, brighter towards the lamp.
 * @param {Canvas} scene
 */
function drawScroll(scene) {
	const { left, right, top, bottom } = SCROLL;
	for (let y = top + 1; y <= bottom - 1; y++) {
		for (let x = left + 3; x < right; x++) {
			const t = (x - left) / (right - left);
			let colour = PARCHMENT.base;
			if (t < 0.3) {
				colour = PARCHMENT.lit;
			} else if (t > 0.78) {
				colour = PARCHMENT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Plain ruled lines of faded ink.
	for (const [y, to] of [
		[42, right - 3],
		[44, right - 3],
		[46, right - 3],
		[48, right - 12],
	]) {
		rect(scene, left + 5, y, to - left - 5, 1, PARCHMENT.rule);
	}
	// A red wax seal hanging from the sheet on a ribbon.
	const mid = Math.round((left + right) / 2) + 1;
	rect(scene, mid, bottom, 1, 2, C.brickRedShade);
	paint(scene, mid - 1, bottom + 2, ['.r.', 'rRr', '.r.'], {
		r: C.brickRed,
		R: C.brickRedLight,
	});
	// The two rolls.
	for (const x of [left, right]) {
		for (let y = top - 1; y <= bottom + 1; y++) {
			set(scene, x, y, x === left ? PARCHMENT.lit : PARCHMENT.base);
			set(scene, x + 1, y, x === left ? PARCHMENT.base : PARCHMENT.shade);
			set(scene, x + 2, y, PARCHMENT.shade);
		}
		rect(scene, x, top - 3, 3, 2, x === left ? C.timberLight : C.timber);
		rect(scene, x, bottom + 2, 3, 2, x === left ? C.timber : C.timberShade);
	}
}

/**
 * Her hands round the two rolls: knuckles over their fronts, the right hand lit by the lamp.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	paint(
		scene,
		SCROLL.left - 3,
		42,
		['.WLL..', 'WLLLL.', 'WLLLSs', '.LLSSs', '.LSSs.', '..ss..'],
		{ W: SKIN.glint, L: SKIN.lit, S: SKIN.base, s: SKIN.shade }
	);
	paint(
		scene,
		SCROLL.right,
		42,
		['..ss..', '.sSSs.', 'sSSSds', '.sSSdd', '.ssdd.', '..dd..'],
		{ S: SKIN.base, s: SKIN.shade, d: SKIN.dark }
	);
}

/**
 * The desk across the bottom: a lit edge and a dark front.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	for (let y = DESK; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.night, 0.4);
			if (y === DESK) {
				colour = x < 32 ? C.timberLight : C.timber;
			} else if (y < DESK + 3) {
				colour = (x * 5 + y * 3) % 13 === 0 ? C.timberShade : C.timber;
			} else if (y === DESK + 3) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The oil lamp on the desk at her right: a brass foot, a glass bowl of oil and a tall glass chimney.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	paint(
		scene,
		FLAME.x - 4,
		FLAME.y - 6,
		[
			'...gg....',
			'...gG....',
			'..giiG...',
			'..giiG...',
			'..giiG...',
			'..giiG...',
			'..giiG...',
			'..giiG...',
			'.ggiiGG..',
			'.ggggGG..',
			'..bBBb...',
			'.oOOOOo..',
			'oOOOOOOo.',
			'oOOOOOOo.',
			'.oOOOOo..',
			'..bBBb...',
			'...bb....',
			'..bBBb...',
		],
		{
			g: mix(C.ghostLight, C.lampGlow, 0.5),
			G: mix(C.cream, C.ghostShade, 0.3),
			i: mix(C.lampGlow, C.amber, 0.25),
			b: C.lampFrame,
			B: C.brass,
			o: mix(C.amber, C.lampFrame, 0.4),
			O: C.amber,
		}
	);
}

/**
 * The lamp flame, painted after the glow so it keeps its colours.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 1,
		FLAME.y - 3,
		['.w.', '.W.', 'wWw', 'gWg', '.a.'],
		{
			w: C.lampGlow,
			W: C.white,
			g: C.gold,
			a: C.amber,
		}
	);
	// The flame's light inside the chimney glass.
	for (const [x, y] of [
		[FLAME.x - 2, FLAME.y - 2],
		[FLAME.x + 2, FLAME.y - 1],
	]) {
		if (get(scene, x, y)) {
			set(scene, x, y, mix(C.lampGlow, C.gold, 0.4));
		}
	}
}
