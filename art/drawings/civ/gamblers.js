// Gamblers: a card sharp in a green eyeshade at a felt table at night, a cigar in his smirk and a hand of cards held close, chips, dice and a glass of whiskey under the lamp.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The felt's first row (the table's far edge). */
const TABLE = 47;

/** The face's centre column. */
const FACE_X = 31;

/** The hanging lamp's bulb. */
const LAMP = { x: 47, y: 6 };

/** The cigar's glowing tip. */
const EMBER = { x: 41, y: 24 };

/** Skin: lit by the lamp on his left (the picture's right), plain, shaded, and tinted green under the eyeshade. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.45),
	lit: mix(C.skinTan, C.gold, 0.2),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.night, 0.35),
	visor: mix(C.skinTan, C.pine, 0.35),
	visorShade: mix(C.skinTanShade, C.pineShade, 0.45),
};

/** Slicked-back black hair. */
const HAIR = { lit: mix(C.wood, C.stoneLight, 0.3), base: C.wood, dark: C.ink };

/** The green eyeshade: its lit brim, its body and its band. */
const VISOR = {
	glint: mix(C.ghost, C.pineLight, 0.4),
	lit: C.pineLight,
	base: C.pine,
	shade: C.pineShade,
};

/** The white shirt and the dark waistcoat. */
const SHIRT = { lit: C.creamLight, base: C.cream, shade: C.creamShade };
const VEST = {
	lit: mix(C.roof, C.roofLight, 0.4),
	base: C.roofShade,
	shade: mix(C.roofShade, C.night, 0.5),
};

/** The felt: lit under the lamp, plain, and dark towards the edges. */
const FELT = {
	lit: mix(C.pine, C.pineLight, 0.5),
	base: C.pine,
	shade: C.pineShade,
	dark: mix(C.pineShade, C.night, 0.4),
};

/** The face, hands and cards are lit by hand, so the glows leave them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	C.ink,
	C.white,
	C.creamLight,
	C.brickRed,
	C.gold,
	C.lampGlow,
];

/**
 * Draws the Gamblers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8432);

	drawInterior(layer, { floor: TABLE, random, wall: 'panel' });
	drawWallpaper(layer);
	drawLamp(layer);
	drawSmoke(layer);

	// Back to front: the figure, the table across his waist, his arms on the table, and the props on the felt.
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const table = createCanvas(64, 64);
	drawTable(table);
	underlay(table, figure);
	const front = createCanvas(64, 64);
	drawCardHand(front);
	drawRestingArm(front);
	drawCigar(front);
	outline(front, C.ink);
	underlay(front, table);

	drawChips(scene);
	drawDice(scene);
	drawGlass(scene);
	outline(scene, C.ink);
	underlay(scene, front);
	underlay(scene, layer);

	glow(scene, {
		x: LAMP.x,
		y: LAMP.y + 4,
		radius: 40,
		colour: C.gold,
		strength: 0.3,
		steps: 5,
		skip: FIGURE,
	});
	glow(scene, {
		x: EMBER.x,
		y: EMBER.y,
		radius: 4,
		colour: C.amber,
		strength: 0.4,
		steps: 2,
		skip: FIGURE,
	});
	drawLights(scene);
	return scene;
}

/**
 * Turns the room dark and hangs a striped oxblood wallpaper above the panelling.
 * @param {Canvas} layer
 */
function drawWallpaper(layer) {
	const rail = Math.floor(TABLE * 0.55);
	for (let y = 0; y < TABLE; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (!colour) {
				continue;
			}
			if (y < rail) {
				const stripe = x % 6 < 2;
				const fleck = x % 6 === 4 && y % 4 === 1;
				let paper = mix(C.brickRedShade, C.night, 0.55);
				if (stripe) {
					paper = mix(C.brickRedShade, C.night, 0.35);
				} else if (fleck) {
					paper = mix(C.brass, C.night, 0.6);
				}
				set(layer, x, y, paper);
			} else {
				set(layer, x, y, mix(colour, C.night, 0.6));
			}
		}
	}
	// A dim mirror on the wall at the left, a pale sheen across its glass.
	for (let y = 4; y <= 20; y++) {
		for (let x = 2; x <= 13; x++) {
			const edge = x === 2 || x === 13 || y === 4 || y === 20;
			let colour = mix(C.nightSky4, C.night, 0.3);
			if (edge) {
				colour = mix(C.brass, C.night, 0.45);
			} else if (x + (20 - y) === 14 || x + (20 - y) === 15) {
				colour = mix(C.stoneShade, C.night, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The lamp hanging over the table on its cord: a green glass shade over a bright bulb.
 * @param {Canvas} layer
 */
function drawLamp(layer) {
	rect(layer, LAMP.x, 0, 1, 2, C.ink);
	paint(
		layer,
		LAMP.x - 6,
		2,
		[
			'.....kk.....',
			'...gGGGgg...',
			'..gGGGGggs..',
			'.gGGGGGggss.',
			'gGGGgggggsss',
			'yyyyyyyyyyyy',
			'....wWWw....',
		],
		{
			k: C.ink,
			G: VISOR.glint,
			g: VISOR.lit,
			s: VISOR.base,
			y: C.brass,
			w: C.lampGlow,
			W: C.white,
		}
	);
}

/**
 * A haze of cigar smoke hanging under the ceiling and drifting up from the ember.
 * @param {Canvas} layer
 */
function drawSmoke(layer) {
	for (let y = 0; y < EMBER.y; y++) {
		const t = (EMBER.y - y) / EMBER.y;
		const cx = EMBER.x - 1 + Math.round(Math.sin(y * 0.45) * (1 + t * 3));
		for (let x = cx - 1; x <= cx + 1; x++) {
			const behind = get(layer, x, y);
			if (behind) {
				set(layer, x, y, mix(behind, C.stoneLight, 0.35 - t * 0.15));
			}
		}
	}
	for (let x = 0; x < 64; x++) {
		const y = 13 + Math.round(Math.sin(x * 0.25) * 1.5);
		const behind = get(layer, x, y);
		if (behind && x > 16) {
			set(layer, x, y, mix(behind, C.stone, 0.2));
		}
	}
}

/**
 * His shoulders and chest: a white shirt with red sleeve garters under a dark waistcoat, a loose black string tie.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck.
	rect(scene, FACE_X - 2, 24, 6, 3, SKIN.shade);
	rect(scene, FACE_X + 2, 24, 2, 3, SKIN.base);
	for (let y = 27; y < TABLE + 2; y++) {
		const half = Math.min(25, 7 + Math.round((y - 27) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u > 0.7) {
				colour = SHIRT.lit;
			} else if (u < -0.6) {
				colour = SHIRT.shade;
			}
			// The waistcoat over the chest, open in a V down the middle.
			const open = Math.max(0, 4 - Math.floor((y - 27) / 4));
			if (Math.abs(x - FACE_X - 0.5) > open && Math.abs(u) < 0.62) {
				colour =
					u > 0.35 ? VEST.lit : u < -0.3 ? VEST.shade : VEST.base;
			}
			set(scene, x, y, colour);
		}
	}
	// The collar, open at the throat.
	paint(scene, FACE_X - 4, 26, ['ccW...WWl', '.cWW.WWl.'], {
		c: SHIRT.shade,
		W: SHIRT.base,
		l: SHIRT.lit,
	});
	// The string tie, hanging loose.
	for (let y = 28; y <= 36; y++) {
		set(scene, FACE_X - (y > 31 ? 1 : 0), y, C.ink);
		set(scene, FACE_X + 2 + (y > 31 ? 1 : 0), y, C.ink);
	}
	// Brass buttons down the waistcoat's edge.
	for (const y of [36, 40, 44]) {
		set(scene, FACE_X - 5 + Math.floor((y - 27) / 8), y, C.brass);
	}
}

/**
 * His head: black hair slicked back under a green eyeshade, the shade's green cast over his narrowed eyes,
 * a pencil moustache and a lopsided smirk; lit from the lamp on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[7, -4, 5],
		[8, -6, 7],
		[9, -6, 7],
		[10, -7, 7],
		[11, -7, 8],
		[12, -7, 8],
		[13, -7, 8],
		[14, -7, 8],
		[15, -7, 8],
		[16, -7, 8],
		[17, -6, 8],
		[18, -6, 7],
		[19, -6, 7],
		[20, -5, 7],
		[21, -5, 6],
		[22, -4, 6],
		[23, -3, 5],
		[24, -2, 4],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			const shaded = y <= 15;
			let colour = shaded ? SKIN.visor : SKIN.base;
			if (dx === to && dx >= 6) {
				colour = shaded ? SKIN.visor : SKIN.glint;
			} else if (dx >= 3) {
				colour = shaded ? SKIN.visor : SKIN.lit;
			} else if (dx === from) {
				colour = shaded ? SKIN.visorShade : SKIN.dark;
			} else if (dx <= -3) {
				colour = shaded ? SKIN.visorShade : SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Black hair, slicked back with pomade, showing above the band and over the ears.
	for (let y = 4; y <= 17; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 9; x++) {
			const d = ((x - FACE_X - 0.5) / 8.5) ** 2 + ((y - 11) / 7) ** 2;
			const sides = y >= 11 && Math.abs(x - FACE_X - 0.5) >= 7.5;
			if (d > 1 || (y >= 8 && !sides)) {
				continue;
			}
			let colour = HAIR.base;
			// A glossy shine along the crown on the lamp's side.
			if (d > 0.5 && d < 0.75 && x > FACE_X && y < 8) {
				colour = HAIR.lit;
			} else if (x < FACE_X - 4) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// Ears: the near one lit by the lamp, the far one in shade.
	rect(scene, FACE_X + 9, 14, 1, 4, SKIN.lit);
	rect(scene, FACE_X - 8, 14, 1, 4, SKIN.shade);
	// The eyeshade: a band round the head and a long green brim tilting out over the eyes.
	rect(scene, FACE_X - 7, 8, 16, 1, VISOR.shade);
	paint(
		scene,
		FACE_X - 10,
		9,
		[
			'.ssbbbbbbbbbbbblll...',
			'sssbbbbbbbbbbbllllGG.',
			'.ssssbbbbbbbbbbbllll.',
		],
		{ s: VISOR.shade, b: VISOR.base, l: VISOR.lit, G: VISOR.glint }
	);
	// Narrowed eyes under level brows: the far one in the shade's green dark, the near one catching the lamp.
	rect(scene, FACE_X - 4, 14, 3, 1, HAIR.base);
	rect(scene, FACE_X + 2, 13, 4, 1, HAIR.base);
	set(scene, FACE_X - 3, 15, mix(C.cream, C.pineShade, 0.45));
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 3, 15, mix(C.cream, C.pine, 0.2));
	set(scene, FACE_X + 4, 15, C.ink);
	rect(scene, FACE_X - 3, 16, 2, 1, SKIN.shade);
	rect(scene, FACE_X + 3, 16, 2, 1, SKIN.base);
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// A pencil moustache and a smirk, its near corner lifted round the cigar.
	rect(scene, FACE_X - 2, 20, 2, 1, HAIR.base);
	rect(scene, FACE_X + 1, 20, 3, 1, HAIR.base);
	rect(scene, FACE_X - 2, 21, 4, 1, C.brickRedShade);
	set(scene, FACE_X + 2, 21, C.brickRedShade);
	set(scene, FACE_X + 3, 20, C.brickRedShade);
	set(scene, FACE_X + 4, 20, C.brickRedShade);
	rect(scene, FACE_X - 1, 22, 3, 1, mix(C.brickRed, C.skinTan, 0.5));
	// Stubble along the jaw.
	for (const [x, y] of [
		[FACE_X - 4, 21],
		[FACE_X - 3, 23],
		[FACE_X - 1, 24],
		[FACE_X + 1, 24],
		[FACE_X + 4, 22],
		[FACE_X + 5, 21],
	]) {
		set(scene, x, y, mix(get(scene, x, y) ?? SKIN.base, C.wood, 0.3));
	}
}

/**
 * The cigar in the corner of his smirk, angled down and out, its tip glowing.
 * @param {Canvas} scene
 */
function drawCigar(scene) {
	paint(scene, FACE_X + 4, 21, ['bB....', '.bBb..', '..bbBb', '....bb'], {
		b: C.timber,
		B: C.timberLight,
	});
	set(scene, FACE_X + 5, 22, C.brickRed);
	set(scene, EMBER.x - 1, EMBER.y, mix(C.stone, C.ink, 0.3));
	set(scene, EMBER.x, EMBER.y, C.amber);
}

/**
 * His near hand holding a fan of cards close to his chest, the faces turned to us: plain white cards with red and black pips.
 * @param {Canvas} scene
 */
function drawCardHand(scene) {
	// The forearm rising from the table's edge.
	for (let y = 36; y < TABLE + 1; y++) {
		const x0 = 13 - Math.round((y - 36) * 0.15);
		for (let x = x0; x <= x0 + 6; x++) {
			let colour = SHIRT.shade;
			if (x === x0 + 6) {
				colour = SHIRT.base;
			} else if (x === x0) {
				colour = mix(SHIRT.shade, C.stoneShade, 0.4);
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 12, 41, 8, 2, C.brickRed);
	rect(scene, 12, 41, 8, 1, C.brickRedLight);
	// The fan of five cards, each tilted further, the front one fully seen.
	const cards = [
		{ x: 4, y: 24, tilt: -2 },
		{ x: 7, y: 23, tilt: -1 },
		{ x: 10, y: 22, tilt: 0 },
		{ x: 13, y: 23, tilt: 1 },
		{ x: 16, y: 24, tilt: 2 },
	];
	const pips = [
		{ colour: C.ink, shape: ['.k.', 'kkk', '.k.'] },
		{ colour: C.brickRed, shape: ['r.r', 'rrr', '.r.'] },
		{ colour: C.ink, shape: ['.k.', 'kkk', 'k.k'] },
		{ colour: C.brickRed, shape: ['.r.', 'rrr', '.r.'] },
		{ colour: C.brickRed, shape: ['r.r', 'rrr', '.r.'] },
	];
	/**
	 * How far a card's row leans sideways: the top leans most, the foot not at all.
	 * @param {number} tilt
	 * @param {number} j - The row, from the card's top
	 * @returns {number}
	 */
	const lean = (tilt, j) => Math.round((tilt * (11 - j)) / 11);
	cards.forEach(({ x, y, tilt }, i) => {
		for (let j = 0; j < 12; j++) {
			const shift = lean(tilt, j);
			for (let k = 0; k < 7; k++) {
				const edge = k === 0 || j === 0;
				set(
					scene,
					x + k + shift,
					y + j,
					edge ? C.creamShade : k === 6 ? C.cream : C.white
				);
			}
		}
		const { colour, shape } = pips[i];
		if (i < cards.length - 1) {
			// A card behind shows only its left strip: one corner pip at its top and one at its foot.
			set(scene, x + 1 + lean(tilt, 2), y + 2, colour);
			set(scene, x + 1 + lean(tilt, 9), y + 9, colour);
			return;
		}
		// The front card shows its whole suit pip, and a smaller one low on the card.
		paint(scene, x + 2 + Math.round(tilt / 2), y + 2, shape, {
			k: colour,
			r: colour,
		});
		set(scene, x + 4 + Math.round(tilt / 4), y + 8, colour);
	});
	// The hand gripping the fan's foot, thumb across the front card.
	paint(
		scene,
		11,
		33,
		[
			'..lll..',
			'.LLLLl.',
			'sLLLLLl',
			'sSLLLLl',
			'sSSSSLs',
			'.sSSSs.',
			'..sss..',
		],
		{ l: SKIN.lit, L: SKIN.base, S: SKIN.shade, s: SKIN.dark }
	);
}

/**
 * A thick sleeve or forearm from one point to another, rounded at both ends, lit on the side facing the lamp.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Its half-thickness
 * @param {{ lit: Colour, base: Colour, shade: Colour }} colours
 */
function drawLimb(scene, [x0, y0], [x1, y1], r, { lit, base, shade }) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	// The normal that faces the lamp, up and to the right.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx - ny < 0) {
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
			let colour = base;
			if (side > 0.5) {
				colour = lit;
			} else if (side < -0.4) {
				colour = shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * His far arm: the sleeve, held by a red garter, comes down to the elbow on the table's edge,
 * and the forearm lies along the felt to the hand laid flat beside his chips.
 * @param {Canvas} scene
 */
function drawRestingArm(scene) {
	drawLimb(scene, [53, 33], [57, 46], 4.5, SHIRT);
	drawLimb(scene, [57, 48], [47, 52], 3.6, SHIRT);
	// The red garter round the upper arm.
	for (let x = 49; x <= 61; x++) {
		const y = 37 + Math.round((x - 49) * 0.15);
		if (get(scene, x, y)) {
			set(scene, x, y, x > 56 ? C.brickRedLight : C.brickRed);
			set(scene, x, y + 1, C.brickRedShade);
		}
	}
	// The cuff and the hand, fingers spread on the felt.
	rect(scene, 45, 49, 2, 6, C.creamShade);
	paint(
		scene,
		38,
		50,
		['...LLLL', '.LLLLLL', 'lLLSSSS', 'lSSSSSs', '.s.s.ss'],
		{ L: SKIN.lit, S: SKIN.base, s: SKIN.shade, l: SKIN.glint }
	);
}

/**
 * The card table: green felt under the lamp, darker towards the edges, with a padded rim along the front.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot((x - LAMP.x + 6) / 1.6, y - TABLE - 4);
			let colour = FELT.dark;
			if (y >= 61) {
				colour = y === 61 ? C.timberLight : C.timber;
			} else if (d < 9) {
				colour = FELT.lit;
			} else if (d < 18) {
				colour = FELT.base;
			} else if (d < 28) {
				colour = FELT.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Round stacks of white, red and blue chips by his hand, striped down their rims, and one chip lying flat on the felt.
 * @param {Canvas} scene
 */
function drawChips(scene) {
	/** @type {[number, number, number, Colour, Colour][]} */
	const stacks = [
		[19, 53, 6, C.cream, C.white],
		[26, 52, 9, C.brickRed, C.brickRedLight],
		[33, 53, 5, C.daySea2, C.daySky4],
	];
	for (const [x, bottom, height, face, top] of stacks) {
		const shade = mix(face, C.night, 0.3);
		for (let i = 0; i < height; i++) {
			const y = bottom - i;
			const ring = i % 2 === 0 ? shade : face;
			paint(scene, x, y, [i === 0 ? '.rrrr.' : 'rwrrwR'], {
				r: ring,
				w: i % 2 === 0 ? C.creamShade : C.white,
				R: shade,
			});
		}
		paint(scene, x, bottom - height - 1, ['.tttt.', 'tttttT'], {
			t: top,
			T: face,
		});
	}
	paint(scene, 50, 57, ['.rrr.', 'rRwRr', '.rrr.'], {
		r: C.brickRed,
		R: C.brickRedLight,
		w: C.white,
	});
}

/**
 * Two dice on the felt in front of him, pips up.
 * @param {Canvas} scene
 */
function drawDice(scene) {
	paint(
		scene,
		23,
		55,
		['WWWWWc', 'WkWWWc', 'WWWWWc', 'WWWkWc', 'cccccc', 'cccccc'],
		{ W: C.white, c: C.creamShade, k: C.ink }
	);
	paint(scene, 31, 56, ['WWWWWc', 'WkWkWc', 'WWkWWc', 'WkWkWc', 'cccccc'], {
		W: C.cream,
		c: C.creamShade,
		k: C.ink,
	});
}

/**
 * A heavy tumbler of whiskey with a lump of ice, at the table's near edge.
 * @param {Canvas} scene
 */
function drawGlass(scene) {
	paint(
		scene,
		6,
		50,
		[
			'gGGGGGgg',
			'g.....Gg',
			'gAIIwAAg',
			'gAIIAaAg',
			'gAAAAaag',
			'gaAAaaag',
			'gaaaaaag',
			'.ggggggg',
			'.GGGGGG.',
		],
		{
			g: mix(C.stoneLight, C.pineShade, 0.3),
			G: C.white,
			A: C.amber,
			a: C.lampFrame,
			I: mix(C.white, C.amber, 0.3),
			w: C.lampGlow,
		}
	);
	// The glass is clear: the felt shows through above the whiskey.
	for (let x = 7; x <= 11; x++) {
		set(scene, x, 51, mix(FELT.shade, C.white, 0.25));
	}
}

/**
 * The bulb's glare and the cigar's ember, painted after the glows so they stay bright.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	set(scene, LAMP.x - 1, 8, C.white);
	set(scene, LAMP.x, 8, C.white);
	set(scene, EMBER.x, EMBER.y, C.gold);
	set(scene, EMBER.x + 1, EMBER.y, C.brickRedLight);
}
