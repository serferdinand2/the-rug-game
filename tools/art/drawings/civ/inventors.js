// Inventors: a young inventor with goggles pushed up, holding out a light bulb that glows by itself beside her crackling coil-and-gear machine, a blueprint pinned to the workshop wall at dusk.
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
const BENCH = 56;

/** The glowing bulb's glass: its centre and radius. */
const BULB = { x: 48, y: 35, r: 5 };

/** The coil's crown, the ring the sparks leap from. */
const CROWN = { x: 8, y: 9 };

/** The window's box, frame included. */
const WINDOW = { x: 44, y: 2, w: 17, h: 15 };

/** The face's centre column. */
const FACE_X = 30;

/** Skin: lit warm by the bulb on her left, plain, shaded, and rimmed teal by the sparks on her right. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.55),
	lit: mix(C.skinTan, C.gold, 0.3),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.night, 0.35),
	rim: mix(C.skinTanShade, C.teal, 0.45),
};

/** Dark brown hair, lit warm by the bulb and teal by the sparks. */
const HAIR = {
	lit: mix(C.timber, C.gold, 0.3),
	base: C.timberShade,
	dark: mix(C.wood, C.night, 0.3),
	rim: mix(C.timberShade, C.teal, 0.5),
};

/** The blue work shirt, its sleeves rolled up. */
const SHIRT = {
	lit: mix(C.dayWaveDeep, C.gold, 0.3),
	base: mix(C.daySea2, C.roofShade, 0.3),
	shade: mix(C.daySea3, C.roofShade, 0.5),
	dark: mix(C.daySea3, C.night, 0.6),
};

/** The leather braces over it. */
const BRACES = {
	lit: mix(C.timberLight, C.gold, 0.25),
	base: C.timber,
	shade: C.timberShade,
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.45) };

/** Lips. */
const LIPS = {
	line: C.brickRedShade,
	lower: mix(C.brickRed, C.skinTan, 0.45),
};

/** The bulb's glass, which the glows leave alone. */
const GLASS = [C.lampGlow, C.white, C.beamLight, C.gold];

/** The figure is lit by hand, so the glows leave it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(SHIRT),
	...Object.values(BRACES),
	...Object.values(EYE),
	...Object.values(LIPS),
	C.ink,
	C.brass,
	C.tealLight,
	C.teal,
	C.brickRed,
	C.brickRedLight,
];

/**
 * Draws the Inventors portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8232);

	drawInterior(layer, {
		floor: BENCH,
		random,
		wall: 'panel',
		window: { ...WINDOW, time: 'dusk' },
	});
	dimRoom(layer);

	// The machine and the blueprint are outlined on their own, so they stand clear of the wall and of her.
	const machine = createCanvas(64, 64);
	drawCoil(machine);
	drawGear(machine, 16, 28, 5, 8);
	drawGear(machine, 12, 19, 3, 6);
	drawBlueprint(machine);
	outline(machine, C.ink);
	underlay(machine, layer);

	// The raised arm is outlined on its own, so it stands clear of her body.
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const arm = createCanvas(64, 64);
	drawArm(arm);
	outline(arm, C.ink);
	underlay(arm, figure);

	drawBench(scene);
	outline(scene, C.ink);
	underlay(scene, arm);
	underlay(scene, machine);

	glow(scene, {
		x: CROWN.x,
		y: CROWN.y,
		radius: 20,
		colour: C.teal,
		strength: 0.35,
		steps: 4,
		skip: FIGURE,
	});
	glow(scene, {
		x: BULB.x,
		y: BULB.y,
		radius: 30,
		colour: C.gold,
		strength: 0.4,
		steps: 5,
		skip: [...GLASS, ...FIGURE],
	});
	drawBulb(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Dims the workshop to dusk, leaving the sky in the window panes as it is.
 * @param {Canvas} layer
 */
function dimRoom(layer) {
	const { x, y, w, h } = WINDOW;
	for (let py = 0; py < 64; py++) {
		for (let px = 0; px < 64; px++) {
			const pane = px > x && px < x + w - 1 && py > y && py < y + h - 1;
			const colour = get(layer, px, py);
			if (colour && !pane) {
				set(layer, px, py, mix(colour, C.roofShade, 0.6));
			}
		}
	}
}

/**
 * One brass cogwheel of the machine: teeth round a rim, a dark ring inside it and a hub.
 * @param {Canvas} machine
 * @param {number} cx - The hub's column
 * @param {number} cy - The hub's row
 * @param {number} r - The radius to the tips of the teeth
 * @param {number} teeth - How many teeth
 */
function drawGear(machine, cx, cy, r, teeth) {
	const lit = C.brass;
	const base = mix(C.brass, C.lampFrame, 0.6);
	const dark = mix(C.lampFrame, C.night, 0.45);
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			const angle = Math.atan2(y - cy, x - cx);
			const tooth = Math.cos(angle * teeth) > 0.1;
			if (d > r + 0.4 || (d > r - 1.4 && !tooth)) {
				continue;
			}
			let colour = base;
			if (d < 1.5) {
				colour = lit;
			} else if (d < r - 2.5 && d > r - 4) {
				colour = dark;
			} else if (x - cx + (y - cy) < -2) {
				colour = lit;
			}
			set(machine, x, y, colour);
		}
	}
}

/**
 * A blueprint pinned under the window: blue paper with a faint grid and a cogwheel drawn on it.
 * @param {Canvas} machine
 */
function drawBlueprint(machine) {
	const paper = mix(C.daySea3, C.roofShade, 0.35);
	const grid = mix(C.daySea2, C.roofShade, 0.2);
	const ink = mix(C.daySeaLine, C.roofShade, 0.25);
	for (let y = 19; y <= 30; y++) {
		for (let x = 53; x <= 63; x++) {
			set(
				machine,
				x,
				y,
				(x - 53) % 3 === 2 || (y - 19) % 3 === 2 ? grid : paper
			);
		}
	}
	// A cogwheel drawn in pale ink: a solid toothed wheel round a hole for its axle.
	for (let y = 19; y <= 29; y++) {
		for (let x = 53; x <= 63; x++) {
			const d = Math.hypot(x - 58, y - 24);
			const tooth = Math.cos(Math.atan2(y - 24, x - 58) * 8) > 0;
			if (d > 1 && (d < 3.2 || (tooth && d < 4.6))) {
				set(machine, x, y, ink);
			}
		}
	}
	set(machine, 53, 19, C.brass);
	set(machine, 63, 19, C.brass);
}

/**
 * The coil machine at the left: a wooden base with brass studs, a tall copper winding and a steel
 * ring on top.
 * @param {Canvas} machine
 */
function drawCoil(machine) {
	// The winding: a copper drum wound with fine wire, rounded by its light and shade.
	for (let y = 14; y <= 46; y++) {
		for (let x = 5; x <= 11; x++) {
			const colour = [
				mix(C.lampFrame, C.night, 0.3),
				C.lampFrame,
				mix(C.amber, C.lampFrame, 0.5),
				C.amber,
				mix(C.amber, C.gold, 0.5),
				C.amber,
				mix(C.amber, C.lampFrame, 0.5),
			][x - 5];
			set(
				machine,
				x,
				y,
				y % 3 === 0 ? mix(colour, C.night, 0.35) : colour
			);
		}
	}
	// The steel ring on top, its hole showing as it is seen from a little above.
	for (let y = CROWN.y - 3; y <= CROWN.y + 3; y++) {
		for (let x = CROWN.x - 8; x <= CROWN.x + 8; x++) {
			const d = ((x - CROWN.x) / 7.5) ** 2 + ((y - CROWN.y) / 3.3) ** 2;
			if (d > 1) {
				continue;
			}
			const hole =
				((x - CROWN.x) / 3.5) ** 2 + ((y - CROWN.y + 0.5) / 1.2) ** 2 <=
				1;
			let colour = C.stone;
			if (hole) {
				colour = C.roofShade;
			} else if (y < CROWN.y - 1) {
				colour = C.stoneLight;
			} else if (y > CROWN.y + 1) {
				colour = C.stoneShade;
			}
			set(machine, x, y, colour);
		}
	}
	set(machine, CROWN.x + 3, CROWN.y - 2, C.white);
	// A neck joining the ring to the winding.
	rect(machine, 7, 12, 3, 2, C.stoneShade);
	// The wooden base with brass studs and a dark switch.
	for (let y = 47; y <= BENCH - 1; y++) {
		for (let x = 1; x <= 16; x++) {
			let colour = C.timber;
			if (y === 47) {
				colour = C.timberLight;
			} else if (x === 16 || y === BENCH - 1) {
				colour = C.timberShade;
			}
			set(machine, x, y, colour);
		}
	}
	set(machine, 3, 50, C.brass);
	set(machine, 14, 50, C.brass);
	rect(machine, 7, 50, 3, 3, C.wood);
	set(machine, 8, 49, C.brickRed);
}

/**
 * Her shoulders and body: a blue work shirt with a pencil in its pocket, leather braces and a red
 * bow tie, lit warm on the bulb's side.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, shaded under the chin, lit on the bulb's side.
	for (let y = 25; y <= 27; y++) {
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
	for (let y = 28; y < BENCH; y++) {
		const half = Math.min(19, 7 + Math.round((y - 28) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u > 0.75) {
				colour = SHIRT.lit;
			} else if (u < -0.8) {
				colour = SHIRT.dark;
			} else if (u < -0.3) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Sleeve creases and the button placket.
	for (let y = 36; y < BENCH; y++) {
		set(scene, FACE_X - 13 + Math.round((y - 36) * 0.2), y, SHIRT.dark);
		set(scene, FACE_X + 13 + Math.round((y - 36) * 0.15), y, SHIRT.shade);
	}
	for (let y = 31; y < BENCH; y++) {
		set(scene, FACE_X, y, SHIRT.shade);
		if (y % 5 === 0) {
			set(scene, FACE_X + 1, y, SHIRT.lit);
		}
	}
	// The collar's points.
	paint(scene, FACE_X - 4, 27, ['LL.....LL', '.LL...LL.', '..L...L..'], {
		L: SHIRT.lit,
	});
	// A pocket on her chest with a pencil and a little screwdriver in it.
	rect(scene, FACE_X - 6, 38, 4, 1, SHIRT.dark);
	rect(scene, FACE_X - 6, 39, 1, 4, SHIRT.dark);
	rect(scene, FACE_X - 6, 43, 4, 1, SHIRT.dark);
	rect(scene, FACE_X - 5, 35, 1, 3, C.gold);
	set(scene, FACE_X - 5, 34, C.brickRed);
	rect(scene, FACE_X - 3, 36, 1, 2, C.brickRed);
	set(scene, FACE_X - 3, 35, C.stoneLight);
	// The braces, from her shoulders straight down, with brass clips.
	for (let y = 29; y < BENCH; y++) {
		const spread = 7 + Math.round((y - 29) * 0.12);
		set(scene, FACE_X - spread, y, BRACES.shade);
		set(scene, FACE_X - spread - 1, y, BRACES.base);
		set(scene, FACE_X + spread, y, BRACES.base);
		set(scene, FACE_X + spread + 1, y, BRACES.lit);
	}
	// The bow tie.
	paint(scene, FACE_X - 3, 27, ['rR.Rr', 'rRkRr', 'rR.Rr'], {
		r: C.brickRedShade,
		R: C.brickRed,
		k: C.brickRedLight,
	});
}

/**
 * Her head: a dark bob, goggles pushed up on her forehead, her face turned three-quarters to the bulb,
 * lit warm on that side and teal along the other by the sparks.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 2; y <= 25; y++) {
		for (let x = FACE_X - 10; x <= FACE_X + 10; x++) {
			const dx = x - FACE_X - 0.5;
			const head = (dx / 8.5) ** 2 + ((y - 12) / 10) ** 2;
			// The bob hangs straight down to the chin at the sides.
			const bob =
				y >= 12 && y <= 24 && Math.abs(dx) <= 8.5 - (y - 12) * 0.08;
			if (head > 1 && !bob) {
				continue;
			}
			let colour = HAIR.base;
			if (dx > 6) {
				colour = HAIR.lit;
			} else if (dx < -7) {
				colour = HAIR.rim;
			} else if (dx < -3) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
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
				colour = SKIN.rim;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A fringe swept to one side.
	for (const [dx, y] of [
		[-3, 11],
		[-2, 11],
		[-1, 11],
		[0, 11],
		[-4, 12],
		[-3, 12],
		[-2, 12],
		[3, 11],
	]) {
		set(scene, FACE_X + dx, y, dx > 0 ? HAIR.lit : HAIR.base);
	}
	// The goggles pushed up on her hair: a strap round her head, two brass rims of teal glass.
	rect(scene, FACE_X - 9, 8, 19, 1, mix(C.wood, C.night, 0.2));
	rect(scene, FACE_X - 9, 9, 19, 1, C.wood);
	paint(
		scene,
		FACE_X - 6,
		5,
		[
			'.bBBb.bBBb..',
			'bTtTWbbTtTWb',
			'bttTTbbttTTB',
			'bttTTbbtttTB',
			'.bbbb..bbBB.',
		],
		{
			b: C.lampFrame,
			B: C.brass,
			t: C.tealShade,
			T: C.teal,
			W: C.tealLight,
		}
	);
	// Ears: the near one lit, with a brass stud; the far one hidden by her hair.
	rect(scene, FACE_X + 7, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X + 7, 18, C.brass);
	// The lit cheekbone and the shade under the far one.
	set(scene, FACE_X + 4, 17, SKIN.glint);
	set(scene, FACE_X - 3, 18, SKIN.dark);
	// Brows raised in wonder; eyes turned to the bulb.
	set(scene, FACE_X - 3, 13, C.wood);
	rect(scene, FACE_X - 2, 12, 2, 1, C.wood);
	rect(scene, FACE_X + 2, 12, 3, 1, C.wood);
	set(scene, FACE_X + 5, 13, C.wood);
	set(scene, FACE_X - 2, 15, EYE.shade);
	set(scene, FACE_X - 1, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.lit);
	set(scene, FACE_X + 3, 15, C.ink);
	// Lashes on the lit eye.
	set(scene, FACE_X + 4, 14, C.wood);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A delighted smile, open on a row of teeth between the corners.
	set(scene, FACE_X - 1, 20, LIPS.line);
	rect(scene, FACE_X, 20, 3, 1, C.creamLight);
	set(scene, FACE_X + 3, 20, LIPS.line);
	rect(scene, FACE_X, 21, 3, 1, LIPS.line);
	set(scene, FACE_X + 1, 22, LIPS.lower);
	// A smudge of grease on the shaded cheek.
	set(scene, FACE_X - 3, 20, SKIN.dark);
	set(scene, FACE_X - 2, 20, SKIN.dark);
}

/**
 * Her left arm: the blue sleeve rolled to the elbow, the bare forearm raised in front of her and the
 * hand holding the bulb up by its brass cap.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	// The forearm, lit along the bulb's side.
	for (let y = 46; y < BENCH; y++) {
		for (let x = 46; x <= 50; x++) {
			set(
				scene,
				x,
				y,
				[SKIN.shade, SKIN.base, SKIN.lit, SKIN.lit, SKIN.glint][x - 46]
			);
		}
	}
	// The rolled cuff above the elbow.
	for (let y = 52; y < BENCH; y++) {
		for (let x = 45; x <= 51; x++) {
			let colour = SHIRT.base;
			if (y === 52) {
				colour = SHIRT.lit;
			} else if (x >= 50) {
				colour = SHIRT.lit;
			} else if (x <= 46) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The hand: the thumb and fingers closed round the cap.
	paint(
		scene,
		44,
		41,
		['.s....W.', 'sSs..LLW', 'sSSLLLLW', '.sSSLLW.', '..sSLL..'],
		{ s: SKIN.shade, S: SKIN.base, L: SKIN.lit, W: SKIN.glint }
	);
	// The brass cap, threaded, between thumb and fingers.
	paint(scene, BULB.x - 2, BULB.y + 5, ['bBBBb', '.bBb.', '.bBb.'], {
		b: C.lampFrame,
		B: C.brass,
	});
}

/**
 * The workbench across the bottom, with loose bolts and a coil of copper wire on it.
 * @param {Canvas} scene
 */
function drawBench(scene) {
	for (let y = BENCH; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.roofShade, 0.4);
			if (y === BENCH) {
				colour = C.timberLight;
			} else if (y < BENCH + 3) {
				colour = (x * 3 + y * 7) % 13 === 0 ? C.timberShade : C.timber;
			} else if (y === BENCH + 3) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A few loose bolts.
	for (const x of [20, 24, 27]) {
		set(scene, x, BENCH, C.stoneLight);
		set(scene, x, BENCH + 1, C.stoneShade);
	}
	// A coil of copper wire.
	paint(scene, 36, BENCH - 3, ['.aaaa.', 'aAAAAa', 'aA..Aa', '.aaaa.'], {
		a: C.lampFrame,
		A: C.amber,
	});
}

/**
 * The bulb, painted after the glows: a pear of glass full of white light, narrowing to its cap.
 * @param {Canvas} scene
 */
function drawBulb(scene) {
	const { x: cx, y: cy, r } = BULB;
	for (let y = cy - r; y <= cy + r + 2; y++) {
		// Round above, narrowing below the middle to the neck.
		const half =
			y <= cy
				? Math.sqrt(Math.max(0, r * r - (y - cy) ** 2))
				: r - (y - cy) * 0.75;
		for (let x = cx - r; x <= cx + r; x++) {
			const dx = Math.abs(x - cx);
			if (dx > half + 0.3) {
				continue;
			}
			const d = Math.hypot(x - cx, y - cy) / r;
			let colour = C.lampGlow;
			if (d < 0.5) {
				colour = C.white;
			} else if (dx > half - 1) {
				colour = C.gold;
			}
			set(scene, x, y, colour);
		}
	}
	// The glint on the glass.
	set(scene, cx - 3, cy - 3, C.white);
	set(scene, cx - 2, cy - 4, C.white);
}

/**
 * Sparks leaping from the coil's ring: jagged white bolts edged in teal, and a few loose sparks.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (const bolt of [
		[
			[CROWN.x - 6, CROWN.y - 1],
			[CROWN.x - 8, CROWN.y - 4],
			[CROWN.x - 6, CROWN.y - 6],
			[CROWN.x - 8, CROWN.y - 9],
		],
		[
			[CROWN.x + 2, CROWN.y - 3],
			[CROWN.x + 1, CROWN.y - 6],
			[CROWN.x + 4, CROWN.y - 7],
			[CROWN.x + 3, CROWN.y - 9],
		],
		[
			[CROWN.x + 7, CROWN.y],
			[CROWN.x + 10, CROWN.y - 2],
			[CROWN.x + 11, CROWN.y + 2],
			[CROWN.x + 14, CROWN.y + 1],
		],
	]) {
		for (let i = 0; i < bolt.length - 1; i++) {
			const [x0, y0] = bolt[i];
			const [x1, y1] = bolt[i + 1];
			line(scene, x0 + 1, y0, x1 + 1, y1, C.teal);
			line(scene, x0, y0, x1, y1, C.white);
		}
	}
	for (let i = 0; i < 5; i++) {
		const x = 2 + Math.floor(random() * 16);
		const y = 1 + Math.floor(random() * 18);
		if (get(scene, x, y) !== C.white) {
			set(scene, x, y, C.tealLight);
		}
	}
}
