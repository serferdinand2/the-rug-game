// Renegades: an outlaw in a red bandana mask at dusk, a torch in one fist and a black-and-red flag in the other, the tollhouse roof ablaze behind her.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The road's first row. */
const GROUND = 48;

/** The face's centre column. */
const FACE_X = 27;

/** The flagpole's column. */
const POLE = 45;

/** The torch's flame, and the fire on the tollhouse roof. */
const FLAME = { x: 6, y: 35 };
const FIRE = { x: 56, y: 35 };

/** Skin: lit by the torch on her right (the picture's left), plain, and in the dusk's violet shade. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.45),
	lit: mix(C.skin, C.amber, 0.2),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.roof, 0.4),
};

/** Long dark auburn hair. */
const HAIR = {
	lit: mix(C.brickRedShade, C.amber, 0.4),
	base: mix(C.brickRedShade, C.wood, 0.45),
	dark: mix(C.wood, C.night, 0.3),
};

/** The red bandana over her nose and mouth, and its white dots. */
const BANDANA = {
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
	dot: C.cream,
};

/** The long leather coat: torchlit, plain, shaded and in the dusk's shadow. */
const COAT = {
	lit: mix(C.timber, C.amber, 0.25),
	base: C.timberShade,
	shade: mix(C.timberShade, C.roofShade, 0.45),
	dark: mix(C.wood, C.night, 0.35),
};

/** The flag's two halves, each with a lit and a folded tone. */
const FLAG = {
	black: C.night,
	blackFold: C.ink,
	blackLit: mix(C.night, C.stone, 0.3),
	red: C.brickRed,
	redFold: C.brickRedShade,
	redLit: mix(C.brickRed, C.amber, 0.3),
};

/** The face, hands, flames and flag are painted by hand, so the glows leave them be. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(BANDANA),
	...Object.values(FLAG),
	C.ink,
	C.creamLight,
	C.lampGlow,
	C.gold,
	C.amber,
];

/**
 * Draws the Renegades portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8434);

	drawSky(layer, { time: 'dusk', horizon: GROUND, random });
	drawFields(layer);

	// Back to front: the burning tollhouse and its snapped barrier, the flag, the outlaw, then her arms, torch and pole.
	const back = createCanvas(64, 64);
	drawTollhouse(back);
	drawBarrier(back);
	drawFlag(back);
	outline(back, C.ink);
	const figure = createCanvas(64, 64);
	drawHair(figure);
	drawCoat(figure);
	drawHead(figure);
	outline(figure, C.ink);
	underlay(figure, back);

	drawPoleArm(scene);
	drawTorchArm(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, layer);

	glow(scene, {
		x: FIRE.x,
		y: FIRE.y,
		radius: 22,
		colour: C.amber,
		strength: 0.35,
		steps: 4,
		skip: FIGURE,
	});
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 26,
		colour: C.gold,
		strength: 0.3,
		steps: 4,
		skip: FIGURE,
	});
	drawFlames(scene);
	drawEmbers(scene, random);
	return scene;
}

/**
 * Dark fields and the road along the horizon.
 * @param {Canvas} layer
 */
function drawFields(layer) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.roofShade, C.forestFloorShade, 0.4);
			if (y === GROUND) {
				colour = mix(C.roof, C.duskSky4, 0.3);
			} else if (y > 53) {
				colour = mix(C.sandShade, C.roofShade, 0.6);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The tollhouse by the road at the right: a small stone lodge with its roof ablaze and its window glowing.
 * @param {Canvas} scene
 */
function drawTollhouse(scene) {
	const left = 47;
	const eaves = 42;
	for (let y = eaves; y <= GROUND + 1; y++) {
		for (let x = left; x < 64; x++) {
			let colour = mix(C.stone, C.duskSky3, 0.35);
			if (x <= left + 1) {
				colour = mix(C.stoneShade, C.roofShade, 0.4);
			} else if (y % 3 === 0 || (x + (y % 6 === 0 ? 2 : 0)) % 5 === 0) {
				colour = mix(C.stoneMid, C.roofShade, 0.35);
			}
			set(scene, x, y, colour);
		}
	}
	// The roof, its timbers black and broken by the fire.
	for (let r = 0; r < 7; r++) {
		for (let x = left - 1 + r; x < 64; x++) {
			const burnt = (x * 5 + r * 3) % 7 < 2;
			let colour = mix(C.brickRedShade, C.night, 0.35);
			if (burnt) {
				colour = C.night;
			} else if (r === 0) {
				colour = C.brickRedShade;
			}
			set(scene, x, eaves - 1 - r, colour);
		}
	}
	// The window lit by the fire inside.
	rect(scene, 54, 44, 5, 3, C.amber);
	rect(scene, 55, 45, 3, 1, C.gold);
	rect(scene, 56, 44, 1, 3, C.brickRedShade);
}

/**
 * The toll barrier: a red-and-white striped boom on its post, snapped, its broken end hanging to the road.
 * @param {Canvas} scene
 */
function drawBarrier(scene) {
	rect(scene, 62, 44, 2, 6, mix(C.stoneShade, C.roofShade, 0.3));
	for (let i = 0; i < 10; i++) {
		const x = 61 - i;
		const y = 45 + (i > 6 ? i - 6 : 0);
		const stripe = Math.floor(i / 2) % 2 === 0;
		set(scene, x, y, stripe ? C.brickRed : C.cream);
		set(scene, x, y + 1, stripe ? C.brickRedShade : C.creamShade);
	}
}

/**
 * The flag on its long pole: split corner to corner, black over red, lit from below by the fire.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	rect(scene, POLE, 8, 1, 56, C.timber);
	rect(scene, POLE + 1, 8, 1, 56, C.timberShade);
	paint(scene, POLE - 1, 6, ['.g.', 'gGg'], { g: C.amber, G: C.gold });
	const w = 64 - POLE - 2;
	const h = 14;
	for (let i = 0; i < w; i++) {
		const wave = Math.round(Math.sin(i * 0.5) * 1.2);
		const folded = Math.sin(i * 0.5) < -0.3;
		const lit = Math.sin(i * 0.5) > 0.5;
		for (let j = 0; j < h; j++) {
			// Above the diagonal from the hoist's foot to the fly's top corner the cloth is black; below it, red.
			const black = j < h - 1 - Math.round((i * (h - 1)) / (w - 1));
			let colour;
			if (black) {
				colour = folded
					? FLAG.blackFold
					: lit
						? FLAG.blackLit
						: FLAG.black;
			} else {
				colour = folded ? FLAG.redFold : lit ? FLAG.redLit : FLAG.red;
			}
			// The fire below lights the cloth's lower edge.
			if (j === h - 1 && !folded) {
				colour = black ? FLAG.blackLit : FLAG.redLit;
			}
			set(scene, POLE + 2 + i, 10 + j + wave, colour);
		}
	}
}

/**
 * Her long hair falling behind her shoulders, swept to the right.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	for (let y = 5; y <= 36; y++) {
		const t = Math.max(0, y - 14);
		const left = FACE_X - 9 + Math.round(t * 0.05);
		const right = FACE_X + 9 + Math.round(t * 0.35);
		for (let x = left; x <= right; x++) {
			const d = ((x - FACE_X) / 9.5) ** 2 + ((y - 15) / 10.5) ** 2;
			if (y < 15 && d > 1) {
				continue;
			}
			// Below the jaw the hair narrows to its ends.
			if (y > 28 && (x < left + (y - 28) || x > right - (y - 28) * 0.6)) {
				continue;
			}
			let colour = HAIR.base;
			if (x < FACE_X - 5) {
				colour = HAIR.lit;
			} else if (x > FACE_X + 6 && (x + y) % 3 === 0) {
				colour = HAIR.dark;
			} else if ((x * 2 + y) % 5 === 0) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her long coat over a cream shirt, the collar turned up, a bandolier across her chest, torchlit on her right.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	// The neck, in the bandana's shadow.
	rect(scene, FACE_X - 3, 25, 6, 4, SKIN.shade);
	rect(scene, FACE_X - 3, 25, 2, 4, SKIN.base);
	for (let y = 29; y < 64; y++) {
		const half = Math.min(17, 8 + Math.round((y - 29) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const u = (x - FACE_X) / half;
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
	// The shirt in the coat's opening.
	for (let y = 29; y < 64; y++) {
		const half = Math.min(4, 1 + Math.floor((y - 29) / 4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X ? C.cream : C.creamShade);
		}
		set(scene, FACE_X - half - 1, y, COAT.lit);
		set(scene, FACE_X + half + 1, y, COAT.dark);
	}
	// The turned-up collar standing round her neck.
	paint(
		scene,
		FACE_X - 8,
		25,
		[
			'll..............',
			'lLL.........dd..',
			'.lLL.......ddd..',
			'..lLL.....dds...',
		],
		{ l: COAT.lit, L: COAT.base, d: COAT.shade, s: COAT.dark }
	);
	// A leather bandolier across her chest, with brass cartridges.
	for (let i = 0; i < 24; i++) {
		const x = FACE_X - 10 + i;
		const y = 31 + Math.round(i * 0.95);
		set(scene, x, y, C.wood);
		set(scene, x, y + 1, C.timberShade);
		set(scene, x, y + 2, C.wood);
		if (i % 3 === 1) {
			set(scene, x, y + 1, C.brass);
		}
	}
	// Buttons down the coat's edge.
	for (const y of [46, 52, 58]) {
		set(scene, FACE_X - 6, y, C.brass);
	}
}

/**
 * Her head: a fringe swept over her brow, fierce lashed eyes under level brows, and a red bandana
 * pulled over her nose and mouth; lit by the torch on her right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -3, 3],
		[10, -5, 4],
		[11, -6, 5],
		[12, -6, 6],
		[13, -6, 6],
		[14, -7, 6],
		[15, -7, 6],
		[16, -7, 6],
		[17, -7, 6],
		[18, -6, 6],
		[19, -6, 6],
		[20, -6, 5],
		[21, -5, 5],
		[22, -4, 4],
		[23, -3, 3],
		[24, -2, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from) {
				colour = SKIN.glint;
			} else if (dx <= -3) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A long fringe swept across her brow and down past the far eye.
	paint(
		scene,
		FACE_X - 7,
		7,
		[
			'..LLbbbbbbbd...',
			'.LLbbbbbbbbbdd.',
			'LLb...bbbbbbbdd',
			'L.......bbbbbdd',
			'.........bb.ddd',
			'............dd.',
			'............dd.',
			'.............d.',
		],
		{ L: HAIR.lit, b: HAIR.base, d: HAIR.dark }
	);
	// Level brows drawn down hard, and fierce eyes with dark lashes at their outer corners.
	rect(scene, FACE_X - 5, 13, 4, 1, HAIR.dark);
	rect(scene, FACE_X + 1, 13, 3, 1, HAIR.dark);
	set(scene, FACE_X - 6, 14, C.ink);
	set(scene, FACE_X + 4, 14, C.ink);
	rect(scene, FACE_X - 5, 14, 3, 1, SKIN.shade);
	rect(scene, FACE_X + 1, 14, 3, 1, SKIN.dark);
	set(scene, FACE_X - 5, 15, C.creamLight);
	rect(scene, FACE_X - 4, 15, 2, 1, C.ink);
	set(scene, FACE_X + 1, 15, mix(C.cream, C.roof, 0.3));
	rect(scene, FACE_X + 2, 15, 2, 1, C.ink);
	rect(scene, FACE_X - 5, 16, 3, 1, SKIN.lit);
	rect(scene, FACE_X + 1, 16, 3, 1, SKIN.shade);
	// The bridge of the nose above the mask.
	rect(scene, FACE_X, 15, 1, 3, SKIN.shade);
	set(scene, FACE_X - 1, 17, SKIN.glint);
	// The near ear, lit, with a small gold ring.
	rect(scene, FACE_X - 8, 15, 1, 3, SKIN.lit);
	set(scene, FACE_X - 8, 18, C.gold);
	// The bandana: pulled over her nose, dotted, its point hanging over her collar.
	for (let y = 18; y <= 31; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 8; x++) {
			const dx = x - FACE_X;
			const inFace =
				y <= 24 &&
				Math.abs(dx + 0.5) <= 7.5 - Math.max(0, y - 20) * 1.2;
			const point = y >= 22 && Math.abs(dx + 0.5) <= (31 - y) * 0.85;
			if (!inFace && !point) {
				continue;
			}
			let colour = BANDANA.base;
			if (dx <= -4) {
				colour = BANDANA.lit;
			} else if (dx >= 3) {
				colour = BANDANA.shade;
			}
			if (y === 18 && Math.abs(dx) <= 1) {
				colour = BANDANA.lit;
			}
			if ((x * 2 + y * 3) % 7 === 0 && y > 19) {
				colour = colour === BANDANA.shade ? BANDANA.base : BANDANA.dot;
			}
			set(scene, x, y, colour);
		}
	}
	// A crease where the cloth leaves the nose.
	rect(scene, FACE_X - 3, 21, 6, 1, BANDANA.shade);
	set(scene, FACE_X, 20, BANDANA.lit);
}

/**
 * A thick sleeve from one point to another, rounded at both ends, lit on the side facing the torch.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Its half-thickness
 */
function drawSleeve(scene, [x0, y0], [x1, y1], r) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	// The normal that faces the torch, up and to the left.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx + ny * 0.5 > 0) {
		nx = -nx;
		ny = -ny;
	}
	const reach = Math.ceil(r) + 1;
	for (let y = Math.min(y0, y1) - reach; y <= Math.max(y0, y1) + reach; y++) {
		for (
			let x = Math.min(x0, x1) - reach;
			x <= Math.max(x0, x1) + reach;
			x++
		) {
			const t = Math.max(
				0,
				Math.min(1, ((x - x0) * dx + (y - y0) * dy) / length ** 2)
			);
			const px = x - (x0 + t * dx);
			const py = y - (y0 + t * dy);
			if (Math.hypot(px, py) > r) {
				continue;
			}
			const side = (px * nx + py * ny) / r;
			let colour = COAT.base;
			if (side > 0.45) {
				colour = COAT.lit;
			} else if (side < -0.4) {
				colour = COAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Her near arm holding the torch out to the left, away from her body: the sleeve, the fist, the shaft and the flame,
 * which is outlined with the figure so it stands out against the bright dusk.
 * @param {Canvas} scene
 */
function drawTorchArm(scene) {
	drawSleeve(scene, [15, 35], [8, 45], 4.4);
	// The torch's shaft, from below the fist up to its pitch-soaked head.
	line(scene, 5, 52, FLAME.x, FLAME.y + 3, C.wood);
	line(scene, 6, 52, FLAME.x + 1, FLAME.y + 3, C.timber);
	paint(scene, FLAME.x - 2, FLAME.y + 1, ['wWwww', '.www.'], {
		w: C.wood,
		W: C.timberShade,
	});
	// The bare wrist and the fist round the shaft.
	paint(scene, 3, 42, ['.lll.', 'gLLLs', 'gLkLs', 'gLLLs', '.gLs.'], {
		g: SKIN.glint,
		l: SKIN.lit,
		L: SKIN.base,
		k: SKIN.shade,
		s: SKIN.shade,
	});
	paint(
		scene,
		FLAME.x - 4,
		FLAME.y - 10,
		[
			'....r....',
			'...rg....',
			'...rgr.r.',
			'..rgwgrg.',
			'.rrgwWgr.',
			'.rgwWWgr.',
			'rgwWWWwgr',
			'rgwWWWwgr',
			'rgwWWWWgr',
			'.rgwWwgr.',
		],
		{ r: C.brickRed, g: C.amber, w: C.gold, W: C.lampGlow }
	);
}

/**
 * Her far arm holding the flagpole upright: the sleeve down to the elbow, the forearm across to the fist round the pole,
 * and the pole itself in front of her coat.
 * @param {Canvas} scene
 */
function drawPoleArm(scene) {
	drawSleeve(scene, [41, 32], [43, 50], 4.6);
	drawSleeve(scene, [43, 50], [POLE - 2, 44], 3.4);
	// The pole passes in front of her coat and through her fist.
	rect(scene, POLE, 30, 1, 34, C.timber);
	rect(scene, POLE + 1, 30, 1, 34, C.timberShade);
	paint(scene, POLE - 2, 40, ['.ss.', 'sLLs', 'LLLs', 'sLLs', '.ss.'], {
		L: SKIN.shade,
		s: SKIN.dark,
	});
}

/**
 * The fire on the tollhouse roof, painted after the glows so it keeps its colours.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	paint(
		scene,
		FIRE.x - 9,
		FIRE.y - 7,
		[
			'............r......',
			'.......r...rg......',
			'..r...rg...rgr..r..',
			'..rr..rgr.rgwgr.rg.',
			'.rgr.rgwgrrgwgrrgwr',
			'.rgwrgwWwggwWwgrgwr',
			'rgwWwgwWwgwWWwgwgwr',
			'rgwWWwWWWwWWWwwgwgr',
			'.rgwWWWWWWWWwwgwr..',
		],
		{ r: C.brickRed, g: C.amber, w: C.gold, W: C.lampGlow }
	);
}

/**
 * Sparks flying up past the flag from the burning roof, and from the torch.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawEmbers(scene, random) {
	for (let i = 0; i < 6; i++) {
		const x = 50 + Math.floor(random() * 13);
		const y = 2 + Math.floor(random() * 6);
		if (get(scene, x, y) && !FIGURE.includes(get(scene, x, y) ?? '')) {
			set(scene, x, y, random() > 0.5 ? C.gold : C.amber);
		}
	}
	for (const [x, y] of [
		[3, 21],
		[9, 19],
		[5, 16],
	]) {
		set(scene, x, y, C.gold);
	}
}
