// Genies: a blue genie with folded arms rising on a twist of smoke from a golden lamp on a palace balcony at dusk, golden domes behind.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 32;

/** The balcony's first row, and the lamp's spout, where the smoke pours out. */
const BALCONY = 58;
const SPOUT = { x: 17, y: 51 };

/** The setting sun, low beyond the palace on the right. */
const SUN = { x: 66, y: 40 };

/** Blue genie skin: warm where the sunset lights it on his left, plain, shaded and in deep shadow. */
const SKIN = {
	glint: mix(C.daySky5, C.gold, 0.3),
	lit: mix(C.daySky3, C.duskSky6, 0.2),
	base: C.daySky1,
	shade: C.nightSea1,
	dark: C.nightSea3,
};

/** The open emerald vest. */
const VEST = {
	lit: mix(C.pineLight, C.duskSky6, 0.25),
	base: C.pine,
	shade: C.pineShade,
};

/** The silk turban: lit warm by the sunset, plain, shaded and in its deepest folds. */
const TURBAN = {
	lit: mix(C.creamLight, C.duskSky6, 0.2),
	base: C.cream,
	shade: C.creamShade,
	dark: mix(C.creamShade, C.duskSky2, 0.45),
};

/** The smoke he rises on: lit lilac, plain and shaded blue. */
const SMOKE = {
	lit: mix(C.arcaneLight, C.creamLight, 0.4),
	base: mix(C.arcaneLight, C.daySky4, 0.45),
	shade: mix(C.arcane, C.daySky2, 0.5),
	dark: mix(C.arcaneShade, C.daySky1, 0.4),
};

/** Black hair and beard, with a blue sheen. */
const HAIR = { base: C.ink, sheen: mix(C.ink, C.daySky1, 0.45) };

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.daySky1, 0.4) };

/** The figure is lit by hand, so the sun's glow leaves it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(VEST),
	...Object.values(TURBAN),
	...Object.values(SMOKE),
	...Object.values(HAIR),
	...Object.values(EYE),
	C.ink,
	C.gold,
	C.amber,
	C.lampGlow,
	C.lampFrame,
];

/**
 * Draws the Genies portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8423);

	drawSky(layer, { time: 'dusk', horizon: 47, random });
	drawPalace(layer);

	// Each piece on its own outlined layer, so the crossed forearms and the lamp stand clear of what lies behind.
	const back = createCanvas(64, 64);
	drawSmokeTail(back);
	drawBalcony(back);
	outline(back, C.ink);
	const body = createCanvas(64, 64);
	drawBody(body);
	drawHead(body);
	outline(body, C.ink);
	const arms = createCanvas(64, 64);
	drawUpperArms(arms);
	outline(arms, C.ink);
	const lower = createCanvas(64, 64);
	drawLowerForearm(lower);
	outline(lower, C.ink);
	const upper = createCanvas(64, 64);
	drawUpperForearm(upper);
	outline(upper, C.ink);

	drawLamp(scene);
	outline(scene, C.ink);
	underlay(scene, upper);
	underlay(scene, lower);
	underlay(scene, arms);
	underlay(scene, body);
	underlay(scene, back);
	underlay(scene, layer);

	glow(scene, {
		x: SUN.x,
		y: SUN.y,
		radius: 30,
		colour: C.duskSky6,
		strength: 0.35,
		steps: 3,
		skip: FIGURE,
	});
	drawWisps(scene, random);
	return scene;
}

/**
 * The palace behind him in the dusk: a great golden onion dome at the right, slim minarets with small domes
 * at the left, and a long arcaded wall with lit windows along the bottom.
 * @param {Canvas} layer
 */
function drawPalace(layer) {
	const wall = mix(C.plaster, C.duskSky4, 0.45);
	const wallShade = mix(C.plasterShade, C.duskSky2, 0.5);
	const wallLit = mix(C.plasterLight, C.duskSky6, 0.35);
	const gold = mix(C.gold, C.duskSky5, 0.15);
	const goldShade = mix(C.amber, C.duskSky3, 0.35);
	// The great dome on its drum, the right of it lit by the sun.
	onionDome(layer, 50, 37, 12, 20, gold, goldShade);
	rect(layer, 40, 37, 21, 5, wall);
	rect(layer, 40, 37, 21, 1, wallLit);
	for (let x = 42; x < 60; x += 4) {
		rect(layer, x, 39, 2, 3, wallShade);
	}
	// Two minarets at the left, and a small one on the far right.
	minaret(layer, 4, 3, 22, gold, goldShade, wall, wallShade, wallLit);
	minaret(layer, 13, 3, 30, gold, goldShade, wall, wallShade, wallLit);
	minaret(layer, 61, 2, 30, gold, goldShade, wall, wallShade, wallLit);
	// The long wall with its row of arched, lamp-lit windows.
	rect(layer, 0, 42, 64, BALCONY - 42, wall);
	rect(layer, 0, 42, 64, 1, wallLit);
	rect(layer, 0, 43, 64, 1, wallShade);
	for (let x = 2; x < 64; x += 6) {
		paint(layer, x, 46, ['.l.', 'lgl', 'lgl', 'lgl', 'sss'], {
			l: C.amber,
			g: C.gold,
			s: wallShade,
		});
	}
}

/**
 * An onion dome: a bulb swelling out from its base and drawing in to a point with a finial, lit on the right.
 * @param {Canvas} layer
 * @param {number} cx - The centre column
 * @param {number} base - The bulb's bottom row
 * @param {number} half - Half the bulb's widest width
 * @param {number} height - From the base to the tip of the finial
 * @param {string} gold
 * @param {string} shade
 */
function onionDome(layer, cx, base, half, height, gold, shade) {
	for (let y = base - height + 3; y <= base; y++) {
		const t = (base - y) / (height - 3);
		// Widest a third of the way up, then curving in to the point.
		const w =
			t < 0.35
				? half * (0.75 + 0.25 * Math.sin((t / 0.35) * (Math.PI / 2)))
				: half * Math.cos(((t - 0.35) / 0.65) * (Math.PI / 2)) ** 1.3;
		const left = Math.round(cx - w);
		const right = Math.round(cx + w);
		for (let x = left; x <= right; x++) {
			const u = (x - cx) / Math.max(1, w);
			let colour = gold;
			if (u < -0.35) {
				colour = shade;
			} else if (u > 0.4 && u < 0.7) {
				colour = mix(gold, C.lampGlow, 0.5);
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, cx, base - height, 1, 3, shade);
	set(layer, cx, base - height - 1, gold);
}

/**
 * A slim minaret: a shaft with a balcony ring and a small onion dome on top.
 * @param {Canvas} layer
 * @param {number} cx - The shaft's centre column
 * @param {number} half - Half the shaft's width
 * @param {number} top - The dome's tip
 * @param {string} gold
 * @param {string} goldShade
 * @param {string} wall
 * @param {string} wallShade
 * @param {string} wallLit
 */
function minaret(
	layer,
	cx,
	half,
	top,
	gold,
	goldShade,
	wall,
	wallShade,
	wallLit
) {
	onionDome(layer, cx, top + 9, half + 1, 9, gold, goldShade);
	for (let y = top + 10; y < 43; y++) {
		for (let x = cx - half; x <= cx + half; x++) {
			let colour = wall;
			if (x === cx + half) {
				colour = wallLit;
			} else if (x === cx - half) {
				colour = wallShade;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, cx - half - 1, top + 15, half * 2 + 3, 1, wallLit);
	rect(layer, cx - half - 1, top + 16, half * 2 + 3, 1, wallShade);
	set(layer, cx, top + 19, C.amber);
	set(layer, cx, top + 20, C.amber);
}

/**
 * The smoke: a chain of billows from the lamp's spout, swelling as it twists up into his waist.
 * @param {Canvas} scene
 */
function drawSmokeTail(scene) {
	/** @type {[number, number, number][]} */
	const billows = [
		[16, 49, 2],
		[14, 46, 3],
		[15, 42, 4],
		[21, 42, 5],
		[27, 42, 6],
		[33, 41, 7.5],
		[42, 42, 4],
	];
	for (const [cx, cy, r] of billows) {
		for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
			for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
				const d = Math.hypot(x - cx, y - cy) / r;
				if (d > 1) {
					continue;
				}
				let colour = SMOKE.base;
				if (x - cx > r * 0.3 && y - cy < r * 0.3) {
					colour = SMOKE.lit;
				} else if (y - cy > r * 0.45 || x - cx < -r * 0.6) {
					colour = SMOKE.shade;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// A darker curl winding round the twist.
	for (const [x, y] of [
		[15, 48],
		[14, 46],
		[15, 45],
		[16, 44],
		[18, 45],
		[20, 45],
		[21, 46],
		[23, 46],
		[25, 46],
		[26, 45],
		[28, 46],
		[30, 46],
		[31, 45],
		[33, 46],
		[35, 45],
		[36, 44],
	]) {
		set(scene, x, y, SMOKE.dark);
	}
}

/**
 * Half the chest's width on a row: full across the shoulders, drawing in below them to the waist.
 * @param {number} y
 * @returns {number}
 */
function chestHalf(y) {
	return y < 30 ? 17 : Math.max(10, 17 - (y - 30));
}

/**
 * Tells whether a pixel lies on the chest, whose top slopes down from the neck to the shoulders.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inChest(x, y) {
	const d = Math.abs(x - FACE_X);
	return d <= chestHalf(y) && y >= 22 + Math.max(0, d - 4) * 0.4;
}

/**
 * His bare chest and broad, rounded shoulders, the open crimson vest hemmed in gold, and a gold sash
 * where his waist turns to smoke.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The thick neck.
	for (let y = 20; y <= 25; y++) {
		for (let x = FACE_X - 4; x <= FACE_X + 4; x++) {
			let colour = SKIN.base;
			if (x >= FACE_X + 3) {
				colour = SKIN.lit;
			} else if (x <= FACE_X - 2 || y <= 22) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The chest, from the sloping shoulders down to the waist.
	for (let y = 22; y <= 42; y++) {
		const half = chestHalf(y);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			if (!inChest(x, y)) {
				continue;
			}
			const u = (x - FACE_X) / half;
			let colour = SKIN.base;
			if (u > 0.6) {
				colour = SKIN.lit;
			} else if (u < -0.5) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The line under the chest muscles, and the dip down the middle.
	for (let x = FACE_X - 6; x <= FACE_X + 6; x++) {
		const y = 29 + Math.round(Math.abs(x - FACE_X) / 4);
		set(scene, x, y, x > FACE_X + 2 ? SKIN.base : SKIN.shade);
	}
	rect(scene, FACE_X, 26, 1, 3, SKIN.shade);
	set(scene, FACE_X + 4, 26, SKIN.glint);
	set(scene, FACE_X + 5, 27, SKIN.glint);
	// The round shoulders: the one in shade, then the one the sunset lights.
	/** @type {[number, boolean][]} */
	const shoulders = [
		[16, false],
		[48, true],
	];
	for (const [cx, lit] of shoulders) {
		for (let y = 24; y <= 36; y++) {
			for (let x = cx - 6; x <= cx + 6; x++) {
				const d = Math.hypot(x - cx, (y - 31) * 1.1);
				if (d > 5.6) {
					continue;
				}
				let colour = lit ? SKIN.lit : SKIN.shade;
				if (lit && x - cx > 1 && y < 31) {
					colour = SKIN.glint;
				} else if (!lit && x - cx < -2) {
					colour = SKIN.dark;
				} else if (lit && x - cx < -2) {
					colour = SKIN.base;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// The vest, open over the chest, its edges hemmed in gold.
	for (let y = 23; y <= 42; y++) {
		const half = chestHalf(y);
		const inner = 6 + Math.round((y - 24) * 0.3);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const d = Math.abs(x - FACE_X);
			if (d < inner || !inChest(x, y)) {
				continue;
			}
			let colour = VEST.base;
			if (d === inner) {
				colour = x > FACE_X ? C.gold : C.amber;
			} else if (x > FACE_X + half - 2) {
				colour = VEST.lit;
			} else if (x < FACE_X - half + 3) {
				colour = VEST.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The gold sash.
	for (let x = FACE_X - 11; x <= FACE_X + 11; x++) {
		set(scene, x, 41, x > FACE_X + 6 ? C.lampGlow : C.gold);
		set(scene, x, 42, x < FACE_X - 6 ? C.lampFrame : C.amber);
	}
}

/**
 * His upper arms, hanging from the round shoulders down to the elbows at his sides, gold bands round them.
 * @param {Canvas} scene
 */
function drawUpperArms(scene) {
	drawLimb(
		scene,
		[16, 29],
		[14, 39],
		[3.8, 3.4],
		[SKIN.dark, SKIN.shade, SKIN.shade, SKIN.base]
	);
	drawLimb(
		scene,
		[48, 29],
		[50, 39],
		[3.8, 3.4],
		[SKIN.base, SKIN.lit, SKIN.lit, SKIN.glint]
	);
	line(scene, 12, 30, 19, 30, C.amber);
	line(scene, 45, 30, 52, 30, C.gold);
}

/**
 * Paints a straight, round limb between two points, its colours banded across it from one edge to the other.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {[number, number]} halves - Half the limb's thickness at each end
 * @param {Colour[]} ramp - The bands, from the edge on the left of the direction of travel to the right
 */
function drawLimb(scene, [x0, y0], [x1, y1], [h0, h1], ramp) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const ux = (x1 - x0) / length;
	const uy = (y1 - y0) / length;
	const reach = Math.ceil(Math.max(h0, h1)) + 1;
	for (let y = Math.min(y0, y1) - reach; y <= Math.max(y0, y1) + reach; y++) {
		for (
			let x = Math.min(x0, x1) - reach;
			x <= Math.max(x0, x1) + reach;
			x++
		) {
			const along = (x - x0) * ux + (y - y0) * uy;
			const across = (x - x0) * uy - (y - y0) * ux;
			const t = Math.min(1, Math.max(0, along / length));
			const half = h0 + (h1 - h0) * t;
			// Round ends: the limb's ends are half discs.
			const past =
				along < 0 ? -along : along > length ? along - length : 0;
			if (Math.hypot(past, across) > half) {
				continue;
			}
			const band = Math.min(
				ramp.length - 1,
				Math.max(
					0,
					Math.floor(((across + half) / (2 * half)) * ramp.length)
				)
			);
			set(scene, x, y, ramp[band]);
		}
	}
}

/**
 * His left forearm, the lower of the folded pair: from the elbow at the right across his body, a gold cuff
 * at the wrist and the fingers curled over his right arm, showing above the other forearm.
 * @param {Canvas} scene
 */
function drawLowerForearm(scene) {
	drawLimb(
		scene,
		[50, 40],
		[22, 38],
		[3.4, 2.8],
		[SKIN.lit, SKIN.base, SKIN.shade, SKIN.dark]
	);
	// The hand, reaching under the other forearm, three fingers over the upper arm.
	paint(scene, 15, 31, ['b.b.b.', 'b.b.bs', 'bbbbbs', 'sbbbbs', '.sssss'], {
		s: SKIN.shade,
		b: SKIN.base,
	});
	rect(scene, 20, 35, 3, 4, SKIN.shade);
	paint(scene, 23, 35, ['gG', 'gG', 'RG', 'gg', 'aa'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
		R: C.brickRed,
	});
}

/**
 * His right forearm, lying on top: from the elbow at the left up across his body, lit along its top,
 * a gold cuff on the wrist and three fingers gripping his left arm.
 * @param {Canvas} scene
 */
function drawUpperForearm(scene) {
	drawLimb(
		scene,
		[14, 39],
		[42, 33],
		[3.6, 3],
		[SKIN.dark, SKIN.shade, SKIN.base, SKIN.base, SKIN.lit]
	);
	// The lit top edge, where the sunset catches the arm.
	for (let x = 12; x <= 44; x++) {
		for (let y = 28; y < 44; y++) {
			if (scene.p[y * scene.w + x]) {
				set(scene, x, y, SKIN.glint);
				break;
			}
		}
	}
	// The hand: three fingers wrapped over the left upper arm, dark gaps between them.
	paint(scene, 43, 29, ['LLLLl', '.....', 'LLLll', '.....', 'lllb.'], {
		L: SKIN.glint,
		l: SKIN.lit,
		b: SKIN.base,
	});
	rect(scene, 42, 30, 2, 5, SKIN.lit);
	paint(scene, 38, 30, ['.gG', 'agG', 'agG', 'agg', 'aa.'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
	});
}

/**
 * His head: a jewelled turban, pointed ears and a gold hoop, heavy brows, a drooping moustache
 * and a braided beard, turned to the viewer with a proud smile, lit warm by the sunset on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The head: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[7, -3, 4],
		[8, -5, 6],
		[9, -6, 7],
		[10, -6, 7],
		[11, -7, 7],
		[12, -7, 7],
		[13, -7, 7],
		[14, -7, 7],
		[15, -6, 7],
		[16, -6, 7],
		[17, -6, 6],
		[18, -5, 6],
		[19, -5, 5],
		[20, -4, 5],
		[21, -3, 4],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
				colour = SKIN.glint;
			} else if (dx >= 3) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	drawTurban(scene);
	// Pointed ears, the near one lit, with gold hoops.
	paint(scene, FACE_X - 10, 11, ['d..', 'dd.', '.dd', '.ds', '..s'], {
		d: SKIN.dark,
		s: SKIN.shade,
	});
	paint(scene, FACE_X + 8, 11, ['..L', '.LL', 'LL.', 'lL.', 'l..'], {
		L: SKIN.glint,
		l: SKIN.lit,
	});
	paint(scene, FACE_X + 7, 16, ['g.g', '.g.'], { g: C.gold });
	// Heavy brows raised at the outer ends, and eyes looking straight out.
	paint(scene, FACE_X - 5, 11, ['kk...', '.kkk.'], { k: HAIR.base });
	paint(scene, FACE_X + 2, 11, ['...kk', '.kkk.'], { k: HAIR.base });
	set(scene, FACE_X - 3, 13, EYE.shade);
	set(scene, FACE_X - 2, 13, C.ink);
	set(scene, FACE_X + 3, 13, C.ink);
	set(scene, FACE_X + 4, 13, EYE.lit);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 14, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 16, SKIN.glint);
	set(scene, FACE_X - 1, 17, SKIN.dark);
	set(scene, FACE_X, 17, SKIN.dark);
	// A long moustache drooping past a closed, knowing smile, and a braided beard ending in a gold bead.
	paint(
		scene,
		FACE_X - 4,
		18,
		[
			'.kkk.kkk.',
			'kk.mmm.kk',
			'k..lLl..k',
			'k..kSk..k',
			'...kkk...',
			'...SkS...',
			'...kkk...',
			'...gGg...',
			'....a....',
		],
		{
			k: HAIR.base,
			S: HAIR.sheen,
			m: C.brickRedShade,
			l: mix(C.brickRed, SKIN.base, 0.5),
			L: mix(C.brickRedLight, SKIN.lit, 0.5),
			g: C.gold,
			G: C.lampGlow,
			a: C.amber,
		}
	);
}

/**
 * The turban: a tall wrap of cream silk with folds winding round it, a gold band at the brow,
 * a ruby in a gold setting at the front and a peacock feather rising from it.
 * @param {Canvas} scene
 */
function drawTurban(scene) {
	for (let y = 0; y <= 9; y++) {
		for (let x = FACE_X - 10; x <= FACE_X + 10; x++) {
			const u = (x - FACE_X) / 9.5;
			const v = (y - 6) / 6.5;
			if (u * u + v * v > 1) {
				continue;
			}
			// Folds winding up and round from the left.
			const fold = (x - FACE_X + 40 + Math.round(y * 1.4)) % 5;
			let colour = TURBAN.base;
			if (fold === 0) {
				colour = TURBAN.dark;
			} else if (fold === 1) {
				colour = TURBAN.shade;
			} else if (u > 0.45) {
				colour = TURBAN.lit;
			} else if (u < -0.55) {
				colour = TURBAN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The gold band along the brow.
	for (let x = FACE_X - 9; x <= FACE_X + 9; x++) {
		set(scene, x, 9, x > FACE_X + 2 ? C.gold : C.amber);
	}
	// The ruby in its setting, and the feather.
	paint(scene, FACE_X - 2, 4, ['.gGg.', 'gRWRg', 'gRrRg', '.ggg.'], {
		g: C.gold,
		G: C.lampGlow,
		R: C.brickRedLight,
		r: C.brickRed,
		W: C.white,
	});
	for (let y = 1; y <= 3; y++) {
		set(scene, FACE_X - 1 - Math.round((3 - y) * 0.7), y, C.teal);
	}
	paint(scene, FACE_X - 5, 0, ['.tT', 'tkT', '.t.'], {
		t: C.teal,
		T: C.tealLight,
		k: C.tealShade,
	});
}

/**
 * The balcony's stone balustrade along the bottom, the lamp standing on its rail.
 * @param {Canvas} scene
 */
function drawBalcony(scene) {
	const stone = mix(C.plasterLight, C.duskSky5, 0.25);
	const stoneShade = mix(C.plasterShade, C.duskSky2, 0.45);
	const stoneDark = mix(C.plasterShade, C.night, 0.55);
	rect(scene, 0, BALCONY, 64, 1, mix(stone, C.lampGlow, 0.3));
	rect(scene, 0, BALCONY + 1, 64, 2, stone);
	rect(scene, 0, BALCONY + 3, 64, 1, stoneShade);
	for (let y = BALCONY + 4; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const post = x % 6;
			let colour = stoneDark;
			if (post === 1 || post === 2) {
				colour = y === BALCONY + 4 ? stoneShade : stone;
			} else if (post === 3) {
				colour = stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The golden oil lamp on the rail: a squat body with a long spout to the left, a curled handle and a lid.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	paint(
		scene,
		SPOUT.x,
		SPOUT.y - 3,
		[
			'...........gW.........',
			'..........gWWa........',
			'........ggWWggaa......',
			'W.....gggggggaaa...aa.',
			'gW..ggWWWggggaaaa.a..a',
			'.gWgWWWggggggaaaaf...a',
			'..gggggggggggaaafffaa.',
			'...aagggggggaaaffff...',
			'......aaaaaafffff.....',
			'........afffffa.......',
			'.......aaffffffa......',
		],
		{
			W: C.lampGlow,
			g: C.gold,
			a: C.amber,
			f: C.lampFrame,
		}
	);
}

/**
 * Loose wisps of smoke curling off the twist, and a few sparkles of magic round the lamp.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawWisps(scene, random) {
	for (const [x, y] of [
		[10, 44],
		[9, 43],
		[8, 43],
		[42, 46],
		[43, 45],
		[44, 45],
	]) {
		set(scene, x, y, SMOKE.lit);
	}
	for (let i = 0; i < 6; i++) {
		const x = 6 + Math.floor(random() * 40);
		const y = 40 + Math.floor(random() * 14);
		set(scene, x, y, random() > 0.5 ? C.lampGlow : C.arcaneLight);
	}
}
