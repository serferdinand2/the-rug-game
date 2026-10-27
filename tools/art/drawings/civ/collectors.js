// Collectors: an old collector at his table by daylight, studying a ruby through a magnifying glass, his cabinet of curiosities behind: a stuffed bird, a skull, a vase and a framed painting.
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
import { glow } from '../../effects.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The table top's first row. */
const TABLE = 56;

/** The face's centre column. */
const FACE_X = 24;

/** The magnifying glass: its lens's centre and radius. */
const LENS = { x: 32, y: 41, r: 7 };

/** The cabinet of curiosities: its left column and its shelves' top rows. */
const CABINET = { x: 41, shelves: [15, 30, 45] };

/** Skin: lit by the window on his right (the picture's left), plain, and shaded on the far side. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.45),
	lit: mix(C.skinTan, C.lampGlow, 0.2),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.wood, 0.4),
};

/** White hair and beard, lit and shaded. */
const HAIR = {
	lit: C.white,
	base: C.cream,
	shade: C.creamShade,
	dark: mix(C.creamShade, C.stoneShade, 0.4),
};

/** The brown tweed jacket: lit by the window, plain and shaded. */
const COAT = {
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
	dark: mix(C.timberShade, C.wood, 0.5),
};

/** The ruby, seen large through the glass. */
const RUBY = {
	light: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
	glint: C.white,
};

/** The face, hair and hands are lit by hand, so the window's glow leaves them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(RUBY),
	C.ink,
	C.creamLight,
];

/**
 * Draws the Collectors portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8431);

	drawInterior(layer, { floor: TABLE, random, wall: 'panel' });
	drawPainting(layer);
	drawCabinet(layer);
	drawBird(layer);
	drawSkull(layer);
	drawVase(layer);
	drawCase(layer);

	// The figure, then the hands and the glass on their own layer, so they stand clear of the coat.
	const figure = createCanvas(64, 64);
	drawCoat(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const hands = createCanvas(64, 64);
	drawArms(hands);
	drawLens(hands);
	drawHands(hands);
	outline(hands, C.ink);
	underlay(hands, figure);

	drawTable(scene);
	drawTray(scene);
	outline(scene, C.ink);
	underlay(scene, hands);
	underlay(scene, layer);

	glow(scene, {
		x: -6,
		y: 18,
		radius: 44,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 4,
		skip: FIGURE,
	});
	drawSparkles(scene);
	return scene;
}

/**
 * A gilt-framed landscape on the wall at the top left: green hills under a blue sky, a tree and a river.
 * @param {Canvas} layer
 */
function drawPainting(layer) {
	const x0 = 1;
	const y0 = 2;
	const w = 15;
	const h = 13;
	for (let y = y0; y < y0 + h; y++) {
		for (let x = x0; x < x0 + w; x++) {
			const edge =
				x === x0 || y === y0 || x === x0 + w - 1 || y === y0 + h - 1;
			const inner =
				x === x0 + 1 ||
				y === y0 + 1 ||
				x === x0 + w - 2 ||
				y === y0 + h - 2;
			let colour = C.daySky4;
			if (edge) {
				colour = x === x0 || y === y0 ? C.gold : C.lampFrame;
			} else if (inner) {
				colour = x === x0 + 1 || y === y0 + 1 ? C.amber : C.brass;
			} else if (y >= y0 + 8 + Math.round(Math.sin(x * 0.7))) {
				colour = y >= y0 + 10 ? C.grassShade : C.grass;
			} else if (y <= y0 + 3) {
				colour = C.daySky3;
			}
			set(layer, x, y, colour);
		}
	}
	// A cloud, a tree on the hill and a winding river.
	rect(layer, x0 + 3, y0 + 4, 3, 1, C.white);
	rect(layer, x0 + 10, y0 + 5, 2, 4, C.pine);
	set(layer, x0 + 11, y0 + 9, C.wood);
	set(layer, x0 + 4, y0 + 10, C.daySea1);
	set(layer, x0 + 5, y0 + 10, C.daySea1);
	set(layer, x0 + 6, y0 + 9, C.daySea1);
}

/**
 * The tall cabinet of curiosities on the right: a dark wooden case of open shelves, lit along its left edge.
 * @param {Canvas} layer
 */
function drawCabinet(layer) {
	const back = mix(C.timberShade, C.wood, 0.55);
	for (let y = 0; y < TABLE; y++) {
		for (let x = CABINET.x; x < 64; x++) {
			let colour = back;
			if (x === CABINET.x) {
				colour = C.timberLight;
			} else if (x <= CABINET.x + 2) {
				colour = C.timber;
			} else if (x >= 62) {
				colour = C.timberShade;
			} else if (CABINET.shelves.some((s) => y === s)) {
				colour = C.timberLight;
			} else if (
				CABINET.shelves.some((s) => y === s + 1 || y === s + 2)
			) {
				colour = C.timber;
			} else if (CABINET.shelves.some((s) => y === s + 3)) {
				colour = mix(back, C.night, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A stuffed parrot, green with a red breast, on a perch on the top shelf.
 * @param {Canvas} layer
 */
function drawBird(layer) {
	paint(
		layer,
		47,
		1,
		[
			'....gGg....',
			'...gGGGk...',
			'...gGwKyy..',
			'...gGGGy...',
			'..gRRGg....',
			'..gRRRgg...',
			'..gRRRgG...',
			'...gRRgG...',
			'...ggggG...',
			'....bgbG...',
			'.....b.g...',
			'.ppppppppp.',
			'.....d.....',
			'....dDd....',
		],
		{
			g: C.pine,
			G: C.pineLight,
			R: C.brickRed,
			w: C.white,
			K: C.ink,
			k: C.pineShade,
			y: C.gold,
			b: C.amber,
			p: C.timberLight,
			d: C.timberShade,
			D: C.timber,
		}
	);
}

/**
 * A skull on the middle shelf, its crown lit from the window.
 * @param {Canvas} layer
 */
function drawSkull(layer) {
	paint(
		layer,
		45,
		22,
		[
			'..wwWw..',
			'.wWWWWw.',
			'wWWWWWWc',
			'wkkWWkkc',
			'wkkWWkkc',
			'.wWkkWc.',
			'..wtttc.',
			'..ccccc.',
		],
		{
			W: C.cream,
			w: C.creamLight,
			c: C.creamShade,
			k: C.ink,
			t: C.creamLight,
		}
	);
}

/**
 * A blue-and-white vase on the middle shelf.
 * @param {Canvas} layer
 */
function drawVase(layer) {
	paint(
		layer,
		55,
		21,
		[
			'.wWWw.',
			'..bB..',
			'.wBBw.',
			'wbWWbB',
			'wBbbBB',
			'wbWWbB',
			'.wBBB.',
			'..bbB.',
			'.wwWW.',
		].map((row) => row.padEnd(6, '.')),
		{
			w: C.white,
			W: C.cream,
			b: C.daySea1,
			B: C.daySea3,
		}
	);
}

/**
 * A pinned blue butterfly in a small glass case on the bottom shelf.
 * @param {Canvas} layer
 */
function drawCase(layer) {
	paint(
		layer,
		48,
		33,
		[
			'aaaaaaaaaaa',
			'akkkkkkkkkl',
			'akBBk.kBBkl',
			'akBbbkbbBkl',
			'akkbbkbbkkl',
			'akkkdkdkkkl',
			'akkbbkbbkkl',
			'akkBbkbBkkl',
			'akkkkkkkkkl',
			'allllllllll',
		],
		{
			a: C.gold,
			l: C.lampFrame,
			k: mix(C.wood, C.night, 0.3),
			B: C.daySky3,
			b: C.daySea2,
			d: C.ink,
		}
	);
}

/**
 * The tweed jacket over his shoulders and chest: a white collar, a red bow tie and a green waistcoat
 * with brass buttons and a watch chain, lit on the window's side.
 * @param {Canvas} scene
 */
function drawCoat(scene) {
	for (let y = 26; y < TABLE; y++) {
		const half = Math.min(21, 8 + Math.round((y - 26) * 2.2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = COAT.base;
			if (u < -0.8) {
				colour = COAT.lit;
			} else if (u > 0.75) {
				colour = COAT.dark;
			} else if (u > 0.3) {
				colour = COAT.shade;
			}
			// A tweed fleck.
			if ((x * 3 + y * 5) % 13 === 0 && colour !== COAT.dark) {
				colour = mix(colour, C.creamShade, 0.25);
			}
			set(scene, x, y, colour);
		}
	}
	// The waistcoat in the jacket's opening, widening down the chest.
	for (let y = 30; y < TABLE; y++) {
		const half = Math.min(7, 1 + Math.floor((y - 30) / 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(scene, x, y, x < FACE_X ? C.pine : C.pineShade);
		}
		// The lapels: lit on the window's side, dark on the other.
		set(scene, FACE_X - half - 1, y, C.timberLight);
		set(scene, FACE_X + half + 1, y, COAT.dark);
	}
	for (let y = 34; y < TABLE; y += 4) {
		set(scene, FACE_X, y, C.brass);
	}
	// A gold watch chain across the waistcoat.
	for (const [x, y] of [
		[FACE_X + 1, 42],
		[FACE_X + 2, 43],
		[FACE_X + 3, 43],
		[FACE_X + 4, 43],
		[FACE_X + 5, 42],
	]) {
		set(scene, x, y, C.gold);
	}
	// The shirt collar and the bow tie.
	paint(
		scene,
		FACE_X - 4,
		26,
		['wwW...Wcc', '.wwWrWcc.', '..rRrrr..', '..rr.rr..'],
		{
			w: C.creamLight,
			W: C.cream,
			c: C.creamShade,
			r: C.brickRed,
			R: C.brickRedLight,
		}
	);
}

/**
 * His head: bald and lit along the crown, with white tufts over the ears, bushy white brows, a big nose
 * and a trimmed white beard; his eyes are lowered to the glass.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	/** @type {[number, number, number][]} */
	const rows = [
		[5, -3, 3],
		[6, -5, 5],
		[7, -6, 6],
		[8, -6, 7],
		[9, -7, 7],
		[10, -7, 7],
		[11, -7, 7],
		[12, -7, 7],
		[13, -7, 7],
		[14, -7, 7],
		[15, -7, 7],
		[16, -7, 7],
		[17, -6, 7],
		[18, -6, 6],
		[19, -6, 6],
		[20, -5, 6],
		[21, -5, 5],
		[22, -4, 5],
		[23, -3, 4],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from) {
				colour = SKIN.glint;
			} else if (dx <= -2) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The shine on his bald crown.
	rect(scene, FACE_X - 4, 7, 3, 1, SKIN.glint);
	rect(scene, FACE_X - 5, 8, 2, 1, SKIN.glint);
	// Lines across the brow.
	rect(scene, FACE_X - 3, 10, 5, 1, mix(SKIN.base, SKIN.shade, 0.6));
	// Ears: the near one lit, the far one in shade.
	rect(scene, FACE_X - 8, 13, 1, 4, SKIN.lit);
	set(scene, FACE_X - 8, 14, SKIN.base);
	rect(scene, FACE_X + 8, 13, 1, 4, SKIN.shade);
	// White tufts of hair over the ears and round the back of the head.
	for (const [dx, y0, y1] of [
		[-8, 10, 12],
		[-7, 9, 17],
		[-6, 11, 15],
		[7, 9, 17],
		[8, 10, 12],
		[6, 12, 14],
	]) {
		for (let y = y0; y <= y1; y++) {
			let colour = dx < 0 ? HAIR.lit : HAIR.shade;
			if (dx < 0 && (y + dx) % 3 === 0) {
				colour = HAIR.base;
			} else if (dx > 0 && y % 3 === 0) {
				colour = HAIR.dark;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Bushy white brows.
	paint(scene, FACE_X - 5, 11, ['.wwww...wcc.', 'wwW.....Wccc'], {
		w: HAIR.lit,
		W: HAIR.base,
		c: HAIR.shade,
	});
	// Eyes lowered to the glass, with heavy lids and a fold of skin under each.
	set(scene, FACE_X - 3, 14, SKIN.shade);
	rect(scene, FACE_X - 3, 15, 2, 1, C.ink);
	set(scene, FACE_X - 4, 15, C.creamLight);
	rect(scene, FACE_X - 4, 16, 2, 1, SKIN.base);
	set(scene, FACE_X + 3, 14, SKIN.dark);
	rect(scene, FACE_X + 3, 15, 2, 1, C.ink);
	set(scene, FACE_X + 2, 15, mix(C.cream, SKIN.shade, 0.4));
	rect(scene, FACE_X + 3, 16, 2, 1, SKIN.dark);
	// Crow's feet by the near eye.
	set(scene, FACE_X - 6, 15, SKIN.base);
	set(scene, FACE_X - 6, 16, SKIN.shade);
	// A big nose: lit down its near side, shaded down its far side, with a dark nostril.
	rect(scene, FACE_X, 15, 1, 4, SKIN.lit);
	rect(scene, FACE_X + 1, 15, 1, 4, SKIN.shade);
	set(scene, FACE_X - 1, 18, SKIN.lit);
	set(scene, FACE_X, 19, SKIN.glint);
	set(scene, FACE_X + 1, 19, SKIN.dark);
	set(scene, FACE_X - 1, 19, SKIN.shade);
	// The beard: down his cheeks from the ears and full round the chin.
	for (let y = 16; y <= 27; y++) {
		for (let dx = -7; dx <= 8; dx++) {
			const x = FACE_X + dx;
			const cheek = y <= 19 ? Math.abs(dx - 0.5) >= 6.5 : true;
			const shape = (dx - 0.5) ** 2 / 50 + ((y - 19) / 8.5) ** 2 <= 1;
			if (!cheek || !shape) {
				continue;
			}
			let colour = HAIR.base;
			if (dx <= -3) {
				colour = HAIR.lit;
			} else if (dx >= 6) {
				colour = HAIR.dark;
			} else if (dx >= 3) {
				colour = HAIR.shade;
			}
			if (y >= 24 && (x + y) % 3 === 0) {
				colour = colour === HAIR.lit ? HAIR.base : HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The moustache over the mouth, and the lower lip under it.
	paint(scene, FACE_X - 3, 20, ['.wwWWcc.', 'ww....cc'], {
		w: HAIR.lit,
		W: HAIR.base,
		c: HAIR.shade,
	});
	rect(scene, FACE_X - 1, 21, 3, 1, C.brickRedShade);
	rect(scene, FACE_X - 1, 22, 3, 1, mix(C.brickRed, C.skinTan, 0.5));
}

/**
 * A thick sleeve or forearm from one point to another, rounded at both ends, lit on its upper-left side.
 * @param {Canvas} scene
 * @param {[number, number]} from
 * @param {[number, number]} to
 * @param {number} r - Its half-thickness
 * @param {{ lit: string, base: string, shade: string }} colours
 */
function drawLimb(scene, [x0, y0], [x1, y1], r, { lit, base, shade }) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = Math.hypot(dx, dy);
	// The normal that faces the window, up and to the left.
	let nx = -dy / length;
	let ny = dx / length;
	if (nx + ny > 0) {
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
			if (side > 0.55) {
				colour = lit;
			} else if (side < -0.35) {
				colour = shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * His arms resting on the table: the near forearm runs in from the left to the hand on the glass's handle,
 * the far one rises from its elbow on the right to the fingers holding the ruby behind the lens.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	drawLimb(scene, [3, 55], [17, 50], 4.6, COAT);
	drawLimb(scene, [55, 56], [46, 41], 4.4, {
		lit: COAT.base,
		base: COAT.shade,
		shade: COAT.dark,
	});
	// White shirt cuffs at both wrists.
	paint(scene, 17, 46, ['ww', 'wW', 'wW', 'WW', 'Wc', '.c'], {
		w: C.creamLight,
		W: C.cream,
		c: C.creamShade,
	});
	paint(scene, 42, 39, ['..ww', '.wWc', 'wWcc', 'Wcc.'], {
		w: C.cream,
		W: C.creamShade,
		c: mix(C.creamShade, C.stoneShade, 0.4),
	});
}

/**
 * The magnifying glass: a brass ring round the lens, the ruby seen large inside it, and a turned wooden handle.
 * @param {Canvas} scene
 */
function drawLens(scene) {
	const { x: cx, y: cy, r } = LENS;
	// The handle, running down to the left to the near hand.
	for (let i = 0; i < 9; i++) {
		set(scene, cx - 5 - i, cy + 5 + i, C.timberLight);
		set(scene, cx - 4 - i, cy + 5 + i, C.timber);
		set(scene, cx - 4 - i, cy + 6 + i, C.wood);
	}
	rect(scene, cx - 7, cy + 6, 2, 2, C.brass);
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.6) {
				continue;
			}
			let colour = mix(C.daySky6, C.cream, 0.4);
			if (d > r - 0.6) {
				colour = x + y < cx + cy ? C.gold : C.lampFrame;
			} else if (d > r - 1.6) {
				colour = x + y < cx + cy ? C.lampGlow : C.brass;
			} else if (x > cx + 2 && y > cy - 2 && y < cy + 3) {
				// The fingertips behind the glass, seen large.
				colour = x > cx + 3 && y === cy + 2 ? SKIN.shade : SKIN.base;
			}
			set(scene, x, y, colour);
		}
	}
	// The ruby, magnified: a cut stone with a table facet and bright and dark bevels.
	paint(
		scene,
		cx - 6,
		cy - 4,
		[
			'...LLLLL...',
			'..LlllllB..',
			'.LlWWWWWbB.',
			'LllWWWWWbbB',
			'.llbbbbbbB.',
			'..lbbbbbB..',
			'...bbbbB...',
			'....bBB....',
			'.....B.....',
		],
		{
			L: RUBY.glint,
			l: RUBY.light,
			W: mix(RUBY.light, C.white, 0.35),
			b: RUBY.base,
			B: RUBY.shade,
		}
	);
	// The glint on the glass.
	set(scene, cx - 4, cy - 5, C.white);
	set(scene, cx - 5, cy - 4, C.white);
}

/**
 * His hands: the near one gripping the glass's handle, the far one pinching the ruby behind the lens's rim.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	// The near hand, a fist round the handle, knuckles lit by the window.
	paint(
		scene,
		19,
		47,
		['.LLL..', 'LLSSs.', 'LSkSSs', 'LSSkSs', '.SSSs.', '..ss..'],
		{ L: SKIN.lit, S: SKIN.base, s: SKIN.shade, k: SKIN.dark }
	);
	// The far hand, its thumb and finger reaching round the lens's right rim.
	paint(
		scene,
		39,
		35,
		['ss...', 'SSs..', 'sSSs.', '.sSSs', 'ss.Ss', 'SSsSs', '.sss.'],
		{ S: SKIN.base, s: SKIN.shade }
	);
}

/**
 * The table across the bottom: a plum velvet cloth, lit along its front edge.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.roof;
			if (y === TABLE) {
				colour = C.roofLight;
			} else if (y >= 62) {
				colour = C.roofShade;
			} else if ((x + y * 2) % 9 === 0) {
				colour = mix(C.roof, C.roofLight, 0.4);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * A small open jewel box on the cloth, with a green stone and a gold ring in it.
 * @param {Canvas} scene
 */
function drawTray(scene) {
	paint(
		scene,
		52,
		54,
		[
			'.ggggggggg.',
			'gGGGGGGGGGa',
			'gktTkkyyYka',
			'gkTTkkykyka',
			'aaaaaaaaaaa',
			'.lllllllll.',
		],
		{
			g: C.gold,
			G: C.lampGlow,
			a: C.amber,
			k: C.roofShade,
			t: C.pine,
			T: C.pineLight,
			y: C.amber,
			Y: C.gold,
			l: C.lampFrame,
		}
	);
}

/**
 * The ruby's sparkle and a glint on the box's stone, painted after the glow so they stay bright.
 * @param {Canvas} scene
 */
function drawSparkles(scene) {
	set(scene, LENS.x + 2, LENS.y - 2, C.white);
	set(scene, LENS.x + 2, LENS.y - 4, C.lampGlow);
	set(scene, LENS.x + 1, LENS.y - 3, C.lampGlow);
	set(scene, LENS.x + 3, LENS.y - 3, C.lampGlow);
	set(scene, 55, 56, C.white);
}
