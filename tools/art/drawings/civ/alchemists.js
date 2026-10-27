// Alchemists: an alchemist at her candlelit workbench at night, holding up a glowing green flask, a skull, retorts and fumes behind.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The bench top's first row. */
const BENCH = 50;

/** The raised flask's bulb: its centre and radius. */
const FLASK = { x: 48, y: 17, r: 6 };

/** The candle flame on the skull, and the small burner flame under the bench flask. */
const FLAME = { x: 7, y: 30 };
const BURNER = { x: 57, y: 47 };

/** The face's centre column. */
const FACE_X = 28;

/** Skin: lit green by the flask on her left, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skinTan, C.ghostLight, 0.5),
	lit: mix(C.skinTan, C.ghost, 0.2),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.night, 0.35),
};

/** The crimson robe: lit by the flask, by the candle, plain and in shadow. */
const ROBE = {
	lit: mix(C.brickRed, C.ghost, 0.3),
	warm: mix(C.brickRed, C.amber, 0.3),
	base: C.brickRedShade,
	shade: mix(C.brickRedShade, C.night, 0.45),
};

/** Dark hair, lit green along the flask's side, with a grey streak. */
const HAIR = {
	lit: mix(C.timberShade, C.ghost, 0.4),
	base: C.wood,
	dark: mix(C.wood, C.night, 0.5),
	grey: mix(C.stoneLight, C.stone, 0.3),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.45) };

/** Lips. */
const LIPS = {
	line: C.brickRedShade,
	lower: mix(C.brickRed, C.skinTan, 0.45),
};

/** The colours of the glowing flask, which the glow leaves alone. */
const GLASS = [C.ghostLight, C.ghost, C.ghostShade, C.white, C.tealLight];

/** The face, hair and hands are lit by hand, so the glows leave them as painted; gold and brass keep their shine. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(EYE),
	...Object.values(LIPS),
	C.ink,
	C.gold,
	C.brass,
];

/**
 * Draws the Alchemists portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8001);

	drawInterior(layer, { floor: BENCH, random, wall: 'stone' });
	darkenRoom(layer);
	drawShelf(layer);
	drawFumes(layer);

	// Three layers, each outlined, so the raised arm stands clear of the robe and the bench of both.
	const figure = createCanvas(64, 64);
	drawRobe(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const arm = createCanvas(64, 64);
	drawRaisedArm(arm);
	drawFlask(arm);
	drawHand(arm);
	outline(arm, C.ink);
	underlay(arm, figure);

	drawBench(scene);
	drawSkull(scene);
	drawMortar(scene);
	drawBenchFlask(scene);
	outline(scene, C.ink);
	underlay(scene, arm);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 18,
		colour: C.amber,
		strength: 0.35,
		steps: 4,
		skip: FIGURE,
	});
	glow(scene, {
		x: FLASK.x,
		y: FLASK.y,
		radius: 30,
		colour: C.ghost,
		strength: 0.35,
		steps: 5,
		skip: [...GLASS, ...FIGURE],
	});
	drawFlames(scene);
	drawBubbles(scene, random);
	return scene;
}

/**
 * Dims the stone room to night.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.night, 0.75);
		}
	}
}

/**
 * A wall shelf at the top left holding a glass retort of red tincture and a stoppered jar.
 * @param {Canvas} layer
 */
function drawShelf(layer) {
	const board = mix(C.timber, C.night, 0.35);
	rect(layer, 0, 19, 18, 1, mix(C.timberLight, C.night, 0.3));
	rect(layer, 0, 20, 18, 1, board);
	rect(layer, 14, 21, 1, 2, board);
	set(layer, 13, 21, board);
	const glass = mix(C.ghostShade, C.night, 0.45);
	const glassLit = mix(C.ghost, C.night, 0.35);
	const tincture = mix(C.brickRed, C.night, 0.3);
	// The retort: a round bulb, its neck rising and bending down to the left.
	for (let y = 11; y <= 18; y++) {
		for (let x = 4; x <= 12; x++) {
			const d = Math.hypot(x - 8, y - 15);
			if (d > 3.7) {
				continue;
			}
			set(layer, x, y, y >= 16 ? tincture : d > 2.7 ? glassLit : glass);
		}
	}
	rect(layer, 7, 9, 2, 3, glass);
	set(layer, 7, 9, glassLit);
	set(layer, 7, 10, glassLit);
	line(layer, 6, 8, 0, 12, glassLit);
	line(layer, 7, 9, 1, 13, glass);
	set(layer, 6, 13, mix(C.white, C.night, 0.3));
	// A tall jar with a cork, half full of something dark.
	rect(layer, 13, 11, 4, 8, glass);
	rect(layer, 13, 15, 4, 4, mix(C.arcaneShade, C.night, 0.2));
	rect(layer, 14, 10, 2, 1, mix(C.timberLight, C.night, 0.3));
	rect(layer, 13, 11, 1, 2, glassLit);
}

/**
 * Pale fumes curling up from the bubbling flask on the bench to the top of the room.
 * @param {Canvas} layer
 */
function drawFumes(layer) {
	for (let y = 0; y < 34; y++) {
		const t = (34 - y) / 34;
		const cx = 57 + Math.round(Math.sin(y * 0.28) * (1.5 + t * 3));
		const half = 1 + Math.round(t * 2.5);
		for (let x = cx - half; x <= cx + half; x++) {
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			const edge = Math.abs(x - cx) === half;
			set(
				layer,
				x,
				y,
				mix(
					behind,
					edge ? C.ghostShade : C.stoneLight,
					0.25 + 0.2 * (1 - t)
				)
			);
		}
	}
}

/**
 * The crimson robe over her shoulders and chest: a gold-hemmed collar open over linen, folds falling
 * from the shoulders and a gold pendant; lit green on the flask's side and warm along the candle's.
 * @param {Canvas} scene
 */
function drawRobe(scene) {
	// The neck, in the chin's shadow except on the flask's side.
	for (let y = 24; y <= 26; y++) {
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
	for (let y = 27; y < BENCH; y++) {
		const half = Math.min(19, 7 + Math.round((y - 27) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = ROBE.base;
			if (u > 0.8) {
				colour = ROBE.lit;
			} else if (u < -0.85) {
				colour = ROBE.warm;
			} else if (u < -0.3) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The hood lies rolled round her neck, its top catching the light on the flask's side.
	for (let y = 23; y <= 29; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 9; x++) {
			const dx = Math.abs(x - FACE_X);
			if (dx < 3 || (dx / 9) ** 2 + ((y - 29) / 6) ** 2 > 1) {
				continue;
			}
			const top = ((dx + 1) / 9) ** 2 + ((y - 1 - 29) / 6) ** 2 > 1;
			let colour = dx < 5 ? ROBE.shade : ROBE.base;
			if (top) {
				colour = x > FACE_X ? ROBE.lit : ROBE.warm;
			}
			set(scene, x, y, colour);
		}
	}
	// The flask's light along the top of her left shoulder, out to the sleeve.
	for (let x = FACE_X + 9; x <= FACE_X + 11; x++) {
		const y = 27 + Math.ceil((x - FACE_X - 7) / 2.4);
		set(scene, x, y, ROBE.lit);
	}
	// Folds falling from the shoulders.
	for (let y = 33; y < BENCH; y++) {
		set(scene, FACE_X - 10 + Math.round((y - 33) * 0.2), y, ROBE.shade);
		set(scene, FACE_X + 7 + Math.round((y - 33) * 0.15), y, ROBE.shade);
		if (y >= 35) {
			set(scene, FACE_X - 5, y, mix(ROBE.shade, C.night, 0.3));
		}
	}
	// The open collar: a V of linen under a gold hem.
	for (let y = 27; y < 36; y++) {
		const half = Math.max(0, 3 - Math.floor((y - 27) / 3));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x > FACE_X ? C.cream : C.creamShade);
		}
		set(scene, FACE_X - half - 1, y, C.amber);
		set(scene, FACE_X + half + 1, y, C.gold);
	}
	// Below the collar the robe hangs open over a dark tunic, its edges hemmed in gold.
	for (let y = 37; y < BENCH; y++) {
		const half = Math.floor((y - 33) / 4);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, mix(C.roofShade, C.night, 0.3));
		}
		set(scene, FACE_X - half - 1, y, C.amber);
		set(scene, FACE_X + half + 1, y, C.gold);
	}
	// A gold pendant on a chain.
	for (const [x, y] of [
		[25, 28],
		[26, 30],
		[27, 32],
		[31, 28],
		[30, 30],
		[29, 32],
		[28, 34],
	]) {
		set(scene, x, y, C.brass);
	}
	paint(scene, FACE_X - 1, 35, ['.g.', 'gWa', '.a.'], {
		g: C.gold,
		W: C.lampGlow,
		a: C.amber,
	});
}

/**
 * Her head: dark hair pinned up in a bun with a grey streak, and her face turned to the viewer,
 * lit green by the flask on her left, her eyes on the glass.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The hair and the bun on top, with a brass pin through it.
	for (let y = 0; y <= 23; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 9; x++) {
			const head = ((x - FACE_X - 0.5) / 8) ** 2 + ((y - 13) / 9.5) ** 2;
			const bun = Math.hypot(x - FACE_X - 1, y - 3.5) <= 3.3;
			if (head > 1 && !bun) {
				continue;
			}
			// Lit along the flask's side, dark along the other.
			const rim =
				((x + 1 - FACE_X - 0.5) / 8) ** 2 + ((y - 13) / 9.5) ** 2 > 1;
			let colour = HAIR.base;
			if (x > FACE_X + 3 && (rim || bun)) {
				colour = HAIR.lit;
			} else if (x <= FACE_X - 6 || (bun && x <= FACE_X - 1)) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	line(scene, FACE_X - 5, 2, FACE_X + 5, 6, C.brass);
	set(scene, FACE_X - 5, 2, C.gold);
	// The grey streak sweeping back from her brow.
	for (const [x, y] of [
		[23, 9],
		[24, 8],
		[25, 7],
		[26, 6],
		[22, 10],
		[23, 10],
		[24, 9],
	]) {
		set(scene, x, y, HAIR.grey);
	}
	// The face: each row's first and last column, from the centre.
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
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Ears: the far one in shadow, the near one lit, with a gold earring.
	rect(scene, FACE_X - 6, 15, 1, 3, SKIN.shade);
	rect(scene, FACE_X + 7, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X + 7, 18, C.gold);
	// The lit cheekbone and the shade under the far one.
	set(scene, FACE_X + 4, 17, SKIN.glint);
	set(scene, FACE_X - 3, 18, SKIN.dark);
	// Brows, lids and eyes turned up to her left, towards the flask.
	rect(scene, FACE_X - 3, 13, 3, 1, C.wood);
	rect(scene, FACE_X + 2, 13, 3, 1, C.wood);
	set(scene, FACE_X - 2, 15, EYE.shade);
	set(scene, FACE_X - 1, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.lit);
	set(scene, FACE_X + 3, 15, C.ink);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A small smile.
	set(scene, FACE_X - 1, 20, LIPS.line);
	rect(scene, FACE_X, 21, 2, 1, LIPS.line);
	set(scene, FACE_X + 2, 20, LIPS.line);
	set(scene, FACE_X + 1, 22, LIPS.lower);
}

/**
 * Her left arm raised: the wide sleeve fallen back to the elbow, her bare forearm lit by the glass.
 * @param {Canvas} scene
 */
function drawRaisedArm(scene) {
	// The forearm, rising from the sleeve to the hand under the flask, narrowing to the wrist.
	for (let y = 24; y <= 33; y++) {
		for (let x = y < 27 ? 47 : 46; x <= 49; x++) {
			const colour = [SKIN.shade, SKIN.base, SKIN.lit, SKIN.glint][
				x - 46
			];
			set(scene, x, y, colour);
		}
	}
	// The sleeve, from the shoulder down to the elbow on the bench, its cuff open round the forearm.
	for (let y = 30; y < BENCH; y++) {
		const left = 40 + Math.round((y - 30) * 0.2);
		const right = Math.min(56, 50 + Math.round((y - 30) * 0.5));
		for (let x = left; x <= right; x++) {
			let colour = ROBE.base;
			if (x >= right - 1) {
				colour = ROBE.lit;
			} else if (x <= left + 1 || x === left + 6) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 45, 30, 6, 1, ROBE.lit);
	rect(scene, 46, 31, 4, 1, mix(ROBE.shade, C.night, 0.4));
}

/**
 * The raised flask: a round glass bulb of glowing green liquid with a long neck and a lip.
 * @param {Canvas} scene
 */
function drawFlask(scene) {
	const { x: cx, y: cy, r } = FLASK;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy) / r;
			if (d > 1.05) {
				continue;
			}
			let colour = C.ghostShade;
			if (y >= cy - 2) {
				colour =
					d < 0.55 ? C.ghostLight : d < 0.85 ? C.ghost : C.ghostShade;
			} else if (d > 0.85) {
				colour = C.tealLight;
			}
			set(scene, x, y, colour);
		}
	}
	// The neck and its lip.
	rect(scene, cx - 1, cy - r - 6, 3, 6, C.ghostShade);
	rect(scene, cx - 1, cy - r - 5, 1, 2, C.tealLight);
	rect(scene, cx - 2, cy - r - 7, 5, 1, C.ghost);
	// The glint on the glass.
	set(scene, cx - 3, cy - 3, C.white);
	set(scene, cx - 4, cy - 2, C.white);
}

/**
 * Her hand cupped under the bulb, fingers curled up its near side and the thumb round the far one.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	paint(
		scene,
		42,
		18,
		[
			'.S...........',
			'sSs..........',
			'sSL..........',
			'ssSs.......W.',
			'.sSLs.....LW.',
			'..sSSLLLLLLW.',
			'...sSLLLLLW..',
			'....sSLLLW...',
		],
		{ s: SKIN.shade, S: SKIN.base, L: SKIN.lit, W: SKIN.glint }
	);
}

/**
 * The workbench across the bottom: a lit top and a dark front with a drawer.
 * @param {Canvas} scene
 */
function drawBench(scene) {
	for (let y = BENCH; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.night, 0.35);
			if (y === BENCH) {
				colour = C.timberLight;
			} else if (y < BENCH + 3) {
				colour = (x + y * 3) % 11 === 0 ? C.timberShade : C.timber;
			} else if (y === BENCH + 3) {
				colour = C.timberShade;
			} else if (x % 16 === 0) {
				colour = mix(C.wood, C.night, 0.4);
			}
			set(scene, x, y, colour);
		}
	}
	// A drawer with a brass knob.
	rect(scene, 22, 56, 20, 1, mix(C.timberShade, C.night, 0.1));
	rect(scene, 22, 62, 20, 1, mix(C.wood, C.night, 0.4));
	set(scene, 32, 59, C.brass);
}

/**
 * A skull on the bench at her right, a candle melted onto its crown.
 * @param {Canvas} scene
 */
function drawSkull(scene) {
	paint(
		scene,
		1,
		33,
		[
			'.....wWw.....',
			'.....wWw.....',
			'.....wWw.....',
			'....dwWwd....',
			'...dwwWwwd...',
			'..cCCCCCCCc..',
			'.cCCCCCCCCcc.',
			'.cCCCCCCCCcc.',
			'cCkkCCCkkCCcc',
			'cCkkkCCkkkCcc',
			'cCCkCCCCkCCcc',
			'.cCCCCkCCCcc.',
			'..cCCkkkCcc..',
			'...tCtCtCt...',
			'...cCcCcCc...',
			'....ccccc....',
			'..aaaaaaaaa..',
		],
		{
			w: C.cream,
			W: C.creamLight,
			d: C.creamShade,
			C: C.cream,
			c: C.creamShade,
			k: C.ink,
			t: C.creamLight,
			a: C.brass,
		}
	);
}

/**
 * A stone mortar on the bench, its wooden pestle leaning in it.
 * @param {Canvas} scene
 */
function drawMortar(scene) {
	paint(
		scene,
		15,
		39,
		[
			'.........pP',
			'........pP.',
			'.......pP..',
			'......pP...',
			'.....pP....',
			'.LLLpPLLLs.',
			'LddddddddsS',
			'.SSSSSSSss.',
			'..SSSSSss..',
			'...sssss...',
			'..LSSSSss..',
		],
		{
			p: C.timber,
			P: C.timberLight,
			L: C.stoneLight,
			S: C.stone,
			s: C.stoneShade,
			d: C.roofShade,
		}
	);
}

/**
 * A small round flask of red tincture on a brass tripod, bubbling over a burner at the bench's right end.
 * @param {Canvas} scene
 */
function drawBenchFlask(scene) {
	const cx = BURNER.x;
	const cy = 40;
	const glass = mix(C.ghostShade, C.night, 0.3);
	for (let y = cy - 4; y <= cy + 4; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			const d = Math.hypot(x - cx, y - cy) / 4;
			if (d > 1.05) {
				continue;
			}
			let colour = glass;
			if (y >= cy - 1) {
				colour = d < 0.6 ? C.brickRedLight : C.brickRed;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, cx - 1, cy - 9, 3, 5, glass);
	rect(scene, cx - 2, cy - 10, 5, 1, mix(C.ghost, C.night, 0.2));
	// The tripod: a ring and two legs.
	rect(scene, cx - 5, cy + 5, 11, 1, C.brass);
	line(scene, cx - 4, cy + 6, cx - 6, BENCH - 1, C.lampFrame);
	line(scene, cx + 4, cy + 6, cx + 6, BENCH - 1, C.lampFrame);
}

/**
 * The candle flame and the burner flame, painted after the glows so they keep their colours.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	paint(
		scene,
		FLAME.x - 1,
		FLAME.y - 3,
		['.w.', '.g.', 'gwg', 'gWg', '.a.'],
		{ w: C.lampGlow, W: C.white, g: C.gold, a: C.amber }
	);
	paint(scene, BURNER.x - 1, BURNER.y - 1, ['.t.', 'tTt', '.a.'], {
		t: C.teal,
		T: C.tealLight,
		a: C.amber,
	});
}

/**
 * Bubbles rising through the green flask and out of its neck as wisps of glowing vapour.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBubbles(scene, random) {
	for (let i = 0; i < 5; i++) {
		const x = FLASK.x - 3 + Math.floor(random() * 7);
		const y = FLASK.y - 1 + Math.floor(random() * 6);
		set(scene, x, y, C.white);
	}
	for (const [x, y] of [
		[48, 3],
		[49, 2],
		[49, 1],
		[50, 0],
		[47, 1],
	]) {
		set(scene, x, y, mix(C.ghost, C.night, 0.3));
	}
	for (const [x, y] of [
		[56, 38],
		[58, 39],
		[57, 37],
	]) {
		set(scene, x, y, C.brickRedLight);
	}
}
