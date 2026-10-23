// Mime: a white-faced mime in a striped shirt and black beret leaning on an invisible wall in a sunny cobbled square, plane trees and a low wall behind and an upturned hat with coins at his feet.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last row of sky, the low wall's coping and its foot, where the cobbles begin. */
const HORIZON = 32;
const COPING = 33;
const SQUARE = 41;

/** The column of the invisible wall: both gloves press flat against it. */
const WALL = 13;

/** The mime's face: its left column and top row. */
const FACE = { x: 23, y: 10 };

/** The upturned hat at his feet: its brim's centre. */
const HAT = { x: 53, y: 55 };

/** The pigeon on the wall: its top-left pixel, and the green and violet sheen on its neck. */
const PIGEON = { x: 47, y: 26 };
const PIGEON_NECK = mix(C.teal, C.arcane, 0.45);

/** The plane trees behind the wall: each canopy's centre and radius. */
const TREES = [
	{ x: 6, y: 16, r: 12 },
	{ x: 30, y: 12, r: 13 },
	{ x: 56, y: 15, r: 12 },
];

/** The leafy clumps that make up each canopy, as fractions of its radius: their offsets from its centre and their radii. */
const CLUMPS = [
	[-0.3, -0.45, 0.55],
	[0.35, -0.4, 0.55],
	[0, -0.6, 0.45],
	[-0.55, 0.1, 0.5],
	[0.55, 0.1, 0.5],
	[0, 0.05, 0.6],
	[-0.25, 0.5, 0.45],
	[0.3, 0.5, 0.45],
];

/** Leaves catching the sun, lit, plain and in shade, and the plane trees' pale mottled bark. */
const LEAF = {
	glint: mix(C.grassLight, C.lampGlow, 0.4),
	lit: C.grassLight,
	base: C.grass,
	shade: C.grassShade,
	dark: C.forestFloor,
};
const BARK = mix(C.cream, C.stoneLight, 0.5);
const BARK_PATCH = mix(C.sand, C.grassShade, 0.3);

/** The low limestone wall: its sunlit coping, the face of its blocks and the joints between them. */
const COPE_TOP = C.creamLight;
const COPE = C.cream;
const BLOCK = mix(C.sandLight, C.cream, 0.5);
const BLOCK_SHADE = mix(C.sand, C.creamShade, 0.5);
const JOINT = C.creamShade;

/** The cobbles of the square: warm grey stones, each lit on its top, with dark gaps between them, and the shadows cast across them. */
const COBBLE_LIT = mix(C.stoneLight, C.sandLight, 0.35);
const COBBLE = mix(C.stone, C.sand, 0.25);
const COBBLE_WARM = mix(C.stone, C.sand, 0.5);
const COBBLE_SHADE = mix(C.stoneShade, C.sandShade, 0.25);
const GAP = mix(C.stoneShade, C.wood, 0.35);
const CAST = mix(C.stoneShade, C.roof, 0.35);
const GAP_SHADOW = mix(GAP, C.ink, 0.3);

/** The white greasepaint on his face, in sun and in shade. */
const PAINT = {
	lit: C.white,
	base: C.creamLight,
	shade: C.creamShade,
	ink: mix(C.ink, C.roofLight, 0.3),
};

/** The navy stripes of his shirt, in sun and in shade, between the white ones. */
const NAVY = {
	lit: mix(C.daySky1, C.roof, 0.35),
	base: mix(C.roof, C.daySky1, 0.25),
	shade: mix(C.roofShade, C.night, 0.2),
};
const STRIPE = { lit: C.white, base: C.cream, shade: C.creamShade };

/** His black beret, trousers and shoes, lit by the sun on the left. */
const BLACK = {
	lit: mix(C.roof, C.stone, 0.3),
	base: mix(C.roofShade, C.night, 0.3),
	shade: mix(C.night, C.ink, 0.4),
};

/** The white gloves, in sun and in shade. */
const GLOVE = { lit: C.white, base: C.creamLight, shade: C.creamShade };

/** The brown felt of the upturned bowler and its dark lining. */
const FELT = { lit: C.timberLight, base: C.timber, shade: C.timberShade };
const LINING = mix(C.wood, C.night, 0.45);

/** The red scarf knotted at his throat. */
const SCARF = {
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
};

/**
 * Draws the Mime masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1309);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawTrunks(layer);
	drawTrees(layer, random);
	drawWall(layer);
	drawCobbles(layer, random);
	drawWeeds(layer);
	drawShadows(layer);

	const mime = createCanvas(64, 64);
	drawLegs(mime);
	drawFarArm(mime);
	drawTorso(mime);
	drawScarf(mime);
	drawHead(mime);
	drawBeret(mime);
	drawNearArm(mime);
	drawGloves(mime);
	drawHat(mime);
	drawPigeon(mime);
	outline(mime, C.ink);
	underlay(mime, layer);

	drawCoins(mime);
	drawPane(mime);
	return mime;
}

/**
 * The plane trees' trunks between the canopies and the wall.
 * @param {Canvas} layer
 */
function drawTrunks(layer) {
	for (const tree of TREES) {
		for (let y = tree.y + 4; y < COPING; y++) {
			set(layer, tree.x - 1, y, BARK);
			set(layer, tree.x, y, (y * 3) % 5 === 1 ? BARK_PATCH : BARK);
			set(layer, tree.x + 1, y, BARK_PATCH);
		}
	}
}

/**
 * The round canopies of the plane trees, each built of leafy clumps lit on their upper left by the sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawTrees(layer, random) {
	for (const tree of TREES) {
		// Clumps from the back to the front: the lower ones overlap the ones above them.
		for (const [cx, cy, r] of CLUMPS) {
			const x0 = tree.x + Math.round(cx * tree.r);
			const y0 = tree.y + Math.round(cy * tree.r);
			const radius = r * tree.r;
			for (let y = Math.floor(y0 - radius); y <= y0 + radius; y++) {
				for (let x = Math.floor(x0 - radius); x <= x0 + radius; x++) {
					const dx = (x - x0) / radius;
					const dy = (y - y0) / radius;
					if (Math.hypot(dx, dy) > 1 || y > HORIZON - 5) {
						continue;
					}
					const light =
						-dx * 0.55 - dy * 0.75 + (random() - 0.5) * 0.45;
					let colour = LEAF.base;
					if (light > 0.75) {
						colour = LEAF.glint;
					} else if (light > 0.3) {
						colour = LEAF.lit;
					} else if (light < -0.6) {
						colour = LEAF.dark;
					} else if (light < -0.15) {
						colour = LEAF.shade;
					}
					set(layer, x, y, colour);
				}
			}
		}
	}
}

/**
 * The low limestone wall across the back of the square: a sunlit coping over courses of blocks.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	rect(layer, 0, COPING, 64, 1, COPE_TOP);
	rect(layer, 0, COPING + 1, 64, 1, COPE);
	rect(layer, 0, COPING + 2, 64, 1, JOINT);
	for (let y = COPING + 3; y < SQUARE; y++) {
		const course = Math.floor((y - COPING - 3) / 3);
		for (let x = 0; x < 64; x++) {
			let colour = BLOCK;
			if ((y - COPING - 3) % 3 === 2) {
				colour = JOINT;
			} else if ((x + course * 5) % 10 === 0) {
				colour = JOINT;
			} else if ((x + course * 5) % 10 === 9) {
				colour = BLOCK_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, SQUARE - 1, 64, 1, BLOCK_SHADE);
}

/**
 * The cobbled square: rows of rounded stones growing larger towards the viewer, each lit on its upper left.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCobbles(layer, random) {
	rect(layer, 0, SQUARE, 64, 64 - SQUARE, GAP);
	let top = SQUARE;
	for (let row = 0; top < 64; row++) {
		const h = 2 + Math.floor(row / 2);
		const w = 3 + row;
		const offset = (row % 2) * Math.floor(w / 2) - Math.floor(random() * 2);
		for (let x0 = -w + offset; x0 < 64; x0 += w + 1) {
			// Some stones are a warmer, sandier grey than the rest.
			const base = random() < 0.35 ? COBBLE_WARM : COBBLE;
			for (let j = 0; j < h; j++) {
				for (let i = 0; i < w; i++) {
					// Round off the stone's corners.
					const corner =
						(i === 0 || i === w - 1) && (j === 0 || j === h - 1);
					if (corner && h > 2) {
						continue;
					}
					let colour = base;
					if (j === 0 || (i === 0 && j < h - 1)) {
						colour = COBBLE_LIT;
					} else if (j === h - 1 || i === w - 1) {
						colour = COBBLE_SHADE;
					}
					set(layer, x0 + i, top + j, colour);
				}
			}
		}
		top += h + 1;
	}
}

/**
 * Tufts of grass growing where the wall meets the cobbles.
 * @param {Canvas} layer
 */
function drawWeeds(layer) {
	for (const x of [4, 37, 60]) {
		paint(layer, x, SQUARE - 2, ['l.l.', 'glgl', '.gg.'], {
			l: LEAF.lit,
			g: LEAF.shade,
		});
	}
}

/**
 * The shadows the sun throws down and to the right: the mime's along the cobbles, and the hat's.
 * @param {Canvas} layer
 */
function drawShadows(layer) {
	for (let y = 52; y < 64; y++) {
		for (let x = 24; x < 64; x++) {
			const along = Math.hypot((x - 44) / 18, (y - 58.5) / 3.2);
			const hat = Math.hypot((x - HAT.x - 3) / 7, (y - HAT.y - 2) / 2.2);
			if (along < 1 || hat < 1) {
				const colour = get(layer, x, y);
				set(layer, x, y, colour === GAP ? GAP_SHADOW : CAST);
			}
		}
	}
}

/**
 * The tone of a stripe across his shirt: white and navy rows, in sun on the left and in shade on the right.
 * @param {number} y - The row, which picks the stripe
 * @param {number} side - From -1 at the lit edge to 1 at the shaded edge
 * @returns {Colour}
 */
function stripe(y, side) {
	const tones = y % 2 === 0 ? STRIPE : NAVY;
	if (side < -0.45) {
		return tones.lit;
	}
	return side > 0.45 ? tones.shade : tones.base;
}

/**
 * His black trousers and shoes: the front leg bent towards the wall, the back leg pushing straight out behind.
 * @param {Canvas} mime
 */
function drawLegs(mime) {
	// The back leg, from the hip straight down and out to the right.
	for (let y = 38; y <= 56; y++) {
		const x = 33 + Math.round((y - 38) * 0.55);
		set(mime, x, y, BLACK.base);
		set(mime, x + 1, y, BLACK.base);
		set(mime, x + 2, y, BLACK.shade);
		set(mime, x + 3, y, BLACK.shade);
	}
	// The front leg: the thigh forward to the bent knee, the shin back down to the foot.
	for (let y = 38; y <= 47; y++) {
		const x = 28 - Math.round((y - 38) * 0.45);
		set(mime, x, y, BLACK.lit);
		rect(mime, x + 1, y, 3, 1, BLACK.base);
		set(mime, x + 4, y, BLACK.shade);
	}
	for (let y = 47; y <= 56; y++) {
		const x = 24 - Math.round((y - 47) * 0.1);
		set(mime, x, y, BLACK.lit);
		rect(mime, x + 1, y, 2, 1, BLACK.base);
		set(mime, x + 3, y, BLACK.shade);
	}
	// The shoes, pointing at the wall.
	paint(mime, 19, 57, ['.lbbbs', 'lbbbbs'], {
		l: BLACK.lit,
		b: BLACK.base,
		s: BLACK.shade,
	});
	paint(mime, 40, 57, ['.lbbbs', 'lbbbbs'], {
		l: BLACK.lit,
		b: BLACK.base,
		s: BLACK.shade,
	});
}

/**
 * The striped shirt over his leaning body, with black braces over his shoulders, tucked into his trousers.
 * @param {Canvas} mime
 */
function drawTorso(mime) {
	for (let y = 20; y <= 39; y++) {
		// The body leans towards the wall: its middle moves left as it rises.
		const centre = 32 - Math.round((39 - y) * 0.2);
		const half = y < 23 ? 4 + (y - 20) : 6 - (y > 34 ? 1 : 0);
		for (let x = centre - half; x <= centre + half; x++) {
			const side = (x - centre) / half;
			let colour = stripe(y, side);
			// Black trousers from the waist down.
			if (y >= 36) {
				colour =
					side < -0.5
						? BLACK.lit
						: side > 0.5
							? BLACK.shade
							: BLACK.base;
			}
			set(mime, x, y, colour);
		}
		// The braces, two black straps over the stripes.
		if (y < 36 && y > 21) {
			set(mime, centre - 3, y, BLACK.base);
			set(mime, centre + 2, y, BLACK.shade);
		}
	}
}

/**
 * The red scarf knotted at his throat, its ends hanging over his shoulder.
 * @param {Canvas} mime
 */
function drawScarf(mime) {
	paint(mime, 25, 18, ['.lbbbs..', 'lbbbbbss', '...bbs.s', '...s....'], {
		l: SCARF.lit,
		b: SCARF.base,
		s: SCARF.shade,
	});
}

/**
 * His white-painted face, turned out to the crowd while he leans: high black brows, the painted lines through his eyes and small red lips.
 * @param {Canvas} mime
 */
function drawHead(mime) {
	paint(
		mime,
		FACE.x,
		FACE.y,
		[
			'..WWWWWw.',
			'.WWWWWWWw',
			'WkkWWWkkw',
			'WWWWWWWWw',
			'WtWWWWtWw',
			'WEWWWWEWw',
			'WtWWWWtWw',
			'WWWWNWWww',
			'.WWrrrWw.',
			'..WWWww..',
		],
		{
			W: PAINT.lit,
			w: PAINT.shade,
			k: C.ink,
			E: C.ink,
			t: PAINT.ink,
			N: PAINT.base,
			r: SCARF.base,
		}
	);
	// The neck below the paint line.
	rect(mime, FACE.x + 3, FACE.y + 10, 3, 1, PAINT.shade);
}

/**
 * The black beret, pushed back and tipped to one side, with its little stalk on top.
 * @param {Canvas} mime
 */
function drawBeret(mime) {
	paint(
		mime,
		FACE.x,
		FACE.y - 4,
		['.....s....', '..lbbbbb..', '.lbbbbbbbs', 'lbbbbbbbbs', '.bbbbbbbs.'],
		{
			l: BLACK.lit,
			b: BLACK.base,
			s: BLACK.shade,
		}
	);
}

/**
 * A striped sleeve from one point to another, three pixels thick, its stripes ringing it, lit on its upper or left side.
 * @param {Canvas} mime
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} [thick=3] - How many pixels across
 */
function sleeve(mime, x0, y0, x1, y1, thick = 3) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	const across = Math.abs(x1 - x0) >= Math.abs(y1 - y0) ? [0, 1] : [1, 0];
	for (let i = 0; i <= steps; i++) {
		const x = Math.round(x0 + ((x1 - x0) * i) / steps);
		const y = Math.round(y0 + ((y1 - y0) * i) / steps);
		for (let j = 0; j < thick; j++) {
			const side = j === 0 ? -1 : j === thick - 1 ? 1 : 0;
			set(mime, x + across[0] * j, y + across[1] * j, stripe(i, side));
		}
	}
}

/**
 * His near arm, raised to the wall at the height of his head: the elbow dropped and the forearm reaching up to the glove.
 * @param {Canvas} mime
 */
function drawNearArm(mime) {
	sleeve(mime, 29, 21, 23, 24);
	sleeve(mime, 22, 23, 17, 17);
}

/**
 * His far arm, half behind his body, reaching to the wall lower down, at the height of his chest.
 * @param {Canvas} mime
 */
function drawFarArm(mime) {
	sleeve(mime, 31, 25, 18, 30);
}

/**
 * The two white gloves pressed flat on the invisible wall, fingers together and pointing up, their leading edges in one straight line.
 * @param {Canvas} mime
 */
function drawGloves(mime) {
	const glove = [
		'W.W.W.',
		'WWWWW.',
		'WWWWW.',
		'WWWWWs',
		'WWWWws',
		'wWWWs.',
		'.wWs..',
	];
	const colours = { W: GLOVE.lit, w: GLOVE.base, s: GLOVE.shade };
	paint(mime, WALL, 10, glove, colours);
	paint(mime, WALL, 25, glove, colours);
	// The cuffs at the wrists.
	rect(mime, WALL + 2, 17, 3, 1, GLOVE.shade);
	rect(mime, WALL + 2, 32, 3, 1, GLOVE.shade);
}

/**
 * A pigeon on the wall's coping, turned to watch the show.
 * @param {Canvas} mime
 */
function drawPigeon(mime) {
	paint(
		mime,
		PIGEON.x,
		PIGEON.y,
		[
			'.HH.....',
			'bHE.....',
			'.NNBB...',
			'.NBBBBW.',
			'..BBWWWt',
			'...BBWt.',
			'...f.f..',
		],
		{
			H: C.stone,
			E: C.ink,
			b: C.creamShade,
			N: PIGEON_NECK,
			B: C.stoneLight,
			W: C.stoneMid,
			t: C.stoneShade,
			f: C.brickRedLight,
		}
	);
}

/**
 * The upturned felt bowler on the cobbles, its crown down and its brim up, the lining showing inside.
 * @param {Canvas} mime
 */
function drawHat(mime) {
	paint(
		mime,
		HAT.x - 6,
		HAT.y - 3,
		[
			'...lllllll...',
			'.llDDDDDDDbb.',
			'lbDDDDDDDDDbs',
			'lbDDDDDDDDDbs',
			'.bbDDDDDDDbs.',
			'..bbbbbbbbs..',
			'...cbbbbss...',
			'....cccss....',
		],
		{
			l: FELT.lit,
			b: FELT.base,
			s: FELT.shade,
			c: FELT.shade,
			D: LINING,
		}
	);
}

/**
 * The coins heaped in the hat and two on the cobbles beside it, glinting in the sun.
 * @param {Canvas} mime
 */
function drawCoins(mime) {
	paint(
		mime,
		HAT.x - 4,
		HAT.y - 2,
		['..G.a..', '.gGagGa', 'agaGgaa', '.aga.a.'],
		{ g: C.gold, G: C.lampGlow, a: C.amber }
	);
	paint(mime, HAT.x + 7, HAT.y + 4, ['gG', 'aa'], {
		g: C.gold,
		G: C.lampGlow,
		a: C.amber,
	});
	paint(mime, HAT.x - 10, HAT.y + 5, ['Ga'], { G: C.lampGlow, a: C.brass });
}

/**
 * The barest hint of the wall he presses on: a faint sheen down its edge where the sun catches it, from the sky to the cobbles.
 * @param {Canvas} mime
 */
function drawPane(mime) {
	for (let y = 2; y <= 58; y++) {
		const colour = get(mime, WALL - 1, y);
		const end = y < 8 || y > 52;
		if (colour && colour !== C.ink) {
			set(mime, WALL - 1, y, mix(colour, C.white, end ? 0.15 : 0.3));
		}
	}
}
