// Game Store: a player's hand letting go of two dice over a board game on the store's demo table, a map of hex tiles with wooden pieces and a fan of cards, under a warm lamp in the evening, shelves of blank game boxes on the brick wall behind.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The table's back edge against the shelves. */
const TABLE = 21;

/** The two shelves' planks: the rows of their top edges. */
const PLANKS = [8, 18];

/** The board on the table, narrower at the back: its rows and its left and right edges at the back and front. */
const BOARD = {
	top: 24,
	bottom: 56,
	backLeft: 8,
	backRight: 56,
	frontLeft: 1,
	frontRight: 63,
};

/** The hex map's lattice: how many hex widths across and rows down the board, and a row's height in hex widths. */
const HEX = { cols: 5.6, rows: 4.6, rowHeight: 0.866 };

/** The terrain of each hex, row by row: grass, forest, water, sand and mountain. */
const MAP = ['mfggwww', 'ffgggwg', 'sgfgwgg', 'ssggwgf', 'gsgwwgf', 'ggswggg'];

/** The pendant lamp over the table: its centre column and the row of its shade's rim. */
const LAMP = { x: 22, rim: 4 };

/** The two dice in the air: each one's top-left corner. */
const DICE = [
	{ x: 26, y: 30 },
	{ x: 37, y: 35 },
];

/** The brick wall behind the shelves, warm and dim, and its mortar. */
const BRICK = mix(C.brickRedShade, C.brickRed, 0.3);
const BRICK_DIM = mix(C.brickRedShade, C.ink, 0.25);
const MORTAR = mix(C.brickRedShade, C.ink, 0.55);

/** The shelving's planks: lit edge, face and shadow. */
const SHELF_LIGHT = C.timberLight;
const SHELF = C.timber;
const SHELF_SHADE = C.wood;

/** The game boxes on the shelves, in the dim back of the store: each colour's lid edge and side. */
const BOXES = [
	[C.brickRedLight, C.brickRed],
	[C.daySky3, mix(C.daySky1, C.roof, 0.4)],
	[C.gold, mix(C.amber, C.timber, 0.3)],
	[C.pineLight, C.pineShade],
	[C.railLight, C.roof],
	[C.cream, mix(C.creamShade, C.timber, 0.4)],
	[C.teal, C.tealShade],
];

/** The wooden table top, dim where the lamp's pool of light ends, and its grain. */
const TABLE_TOP = mix(C.timber, C.timberShade, 0.45);
const TABLE_GRAIN = C.wood;
const TABLE_EDGE = C.timberLight;

/** The board's frame, its lit back edge and its front edge in shadow. */
const BOARD_FRAME = mix(C.roof, C.night, 0.2);
const BOARD_FRAME_LIGHT = C.roofLight;
const BOARD_SIDE = C.night;

/** Each terrain's tile: its lit bevel, its face and its texture. The seams between tiles are one dark line. */
const TERRAIN = {
	g: { light: C.grassLight, face: C.grass, mark: C.grassShade },
	f: { light: C.forestFloorLight, face: C.forestFloor, mark: C.pineShade },
	w: { light: C.dayWave, face: C.daySea1, mark: C.daySea2 },
	s: { light: C.sandLight, face: C.sand, mark: C.sandShade },
	m: { light: C.stoneLight, face: C.stone, mark: C.snow },
};
const SEAM = mix(C.forestFloorShade, C.ink, 0.35);

/** A die's faces: the top catches the lamp, the sides turn away from it. */
const DIE_TOP = C.white;
const DIE_LEFT = C.cream;
const DIE_RIGHT = C.creamShade;
const PIP = C.ink;

/** The player's hand and sleeve: lit, plain and shaded skin, and a soft plum knit with a ribbed cuff. */
const HAND_LIGHT = mix(C.skin, C.lampGlow, 0.4);
const HAND = C.skin;
const HAND_SHADE = C.skinShade;
const SLEEVE_LIGHT = mix(C.roofLight, C.brickRed, 0.45);
const SLEEVE = mix(C.roof, C.brickRedShade, 0.45);
const SLEEVE_SHADE = mix(C.roofShade, C.brickRedShade, 0.3);

/** The wooden pieces: each colour lit and shaded. */
const RED_PIECE = [C.brickRedLight, C.brickRed];
const BLUE_PIECE = [C.daySky4, C.daySky2];
const YELLOW_PIECE = [C.gold, C.amber];

/** The cards: cream faces with a picture on each, and their edges. */
const CARD = C.creamLight;
const CARD_EDGE = C.creamShade;

/** The colours the lamp's glow leaves alone: the lamp itself, the darkest lines and the brightest whites. */
const KEEP = [C.ink, C.lampGlow, C.white, C.gold, C.brass];

/**
 * Draws the Game Store landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7219);

	drawWall(layer);
	drawShelves(layer, random);
	drawTable(layer);
	drawBoard(layer, random);
	drawShadows(layer);

	drawLamp(scene);
	drawPieces(scene);
	drawCards(scene);
	drawHand(scene);
	for (const [i, die] of DICE.entries()) {
		drawDie(scene, die.x, die.y, i);
	}
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: LAMP.x,
		y: LAMP.rim + 1,
		radius: 14,
		colour: C.gold,
		strength: 0.35,
		steps: 2,
		skip: KEEP,
	});
	drawBulb(scene);
	return scene;
}

/**
 * The brick wall behind the shelves, dimmer away from the lamp.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < TABLE; y++) {
		for (let x = 0; x < 64; x++) {
			const course = Math.floor(y / 3);
			const joint = (x + (course % 2) * 3) % 6 === 0;
			const lit = Math.abs(x - LAMP.x) + ((x + y) % 2) * 4 < 24;
			let colour = lit ? BRICK : BRICK_DIM;
			if (y % 3 === 2 || joint) {
				colour = MORTAR;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Two shelves of game boxes, lying flat in stacks as game stores keep them: wide, shallow boxes with their lids'
 * edges catching the light, all blank.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawShelves(layer, random) {
	for (const plank of PLANKS) {
		let x = Math.floor(random() * 3) - 2;
		while (x < 64) {
			const width = 9 + Math.floor(random() * 5);
			const count = 1 + Math.floor(random() * 3);
			let top = plank;
			for (let i = 0; i < count && top > plank - 7; i++) {
				const [lid, side] = BOXES[Math.floor(random() * BOXES.length)];
				const depth = 2 + Math.floor(random() * 2);
				const shift = Math.floor(random() * 2);
				top -= depth;
				rect(layer, x + shift, top, width - 1, depth, side);
				rect(layer, x + shift, top, width - 1, 1, lid);
			}
			x += width + 2 + Math.floor(random() * 3);
		}
		rect(layer, 0, plank, 64, 1, SHELF_LIGHT);
		rect(layer, 0, plank + 1, 64, 1, SHELF);
		rect(layer, 0, plank + 2, 64, 1, SHELF_SHADE);
	}
}

/**
 * The demo table: warm wood with a long grain, its back edge catching the lamp.
 * @param {Canvas} layer
 */
function drawTable(layer) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const grain = (x * 2 + y * 13 + Math.floor(x / 7) * 5) % 15 === 0;
			set(layer, x, y, grain ? TABLE_GRAIN : TABLE_TOP);
		}
	}
	rect(layer, 0, TABLE, 64, 1, TABLE_EDGE);
}

/**
 * Where a pixel falls on the board: across it and down it, each from 0 to 1, or null off the board.
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number } | null}
 */
function onBoard(x, y) {
	const v = (y + 0.5 - BOARD.top) / (BOARD.bottom - BOARD.top);
	if (v < 0 || v > 1) {
		return null;
	}
	const left = BOARD.backLeft + (BOARD.frontLeft - BOARD.backLeft) * v;
	const right = BOARD.backRight + (BOARD.frontRight - BOARD.backRight) * v;
	const u = (x + 0.5 - left) / (right - left);
	return u < 0 || u > 1 ? null : { u, v };
}

/**
 * Which hex of the map a point on the board lies in: the nearest centre of a hex lattice, so each cell is a hexagon.
 * @param {number} u
 * @param {number} v
 * @returns {{ row: number, col: number, dx: number, dy: number }} The hex, and the point's offset from its centre in hex widths.
 */
function hexAt(u, v) {
	const px = u * HEX.cols + 0.3;
	const py = v * HEX.rows * HEX.rowHeight + 0.2;
	let best = { row: 0, col: 0, dx: 0, dy: 0, d: Infinity };
	const near = Math.round(py / HEX.rowHeight);
	for (let row = near - 1; row <= near + 1; row++) {
		const shift = (((row % 2) + 2) % 2) * 0.5;
		const col = Math.round(px - shift);
		for (let c = col - 1; c <= col + 1; c++) {
			const dx = px - (c + shift);
			const dy = py - row * HEX.rowHeight;
			const d = Math.hypot(dx, dy);
			if (d < best.d) {
				best = { row, col: c, dx, dy, d };
			}
		}
	}
	return best;
}

/**
 * Names the hex a pixel lies in, so a pixel can tell whether its neighbour is on the same tile.
 * @param {number} x
 * @param {number} y
 * @returns {string | null} The hex's row and column, or null off the board.
 */
function hexId(x, y) {
	const at = onBoard(x, y);
	if (!at) {
		return null;
	}
	const hex = hexAt(at.u, at.v);
	return `${hex.row},${hex.col}`;
}

/**
 * The terrain of one hex, read from the map.
 * @param {number} row
 * @param {number} col
 * @returns {keyof typeof TERRAIN}
 */
function terrainOf(row, col) {
	const line = MAP[Math.max(0, Math.min(MAP.length - 1, row))];
	const key = line[Math.max(0, Math.min(line.length - 1, col))];
	return /** @type {keyof typeof TERRAIN} */ (key);
}

/**
 * The game board: a map of hex tiles in a dark frame, each tile bevelled where it catches the lamp, forests dotted
 * with trees, water rippled and mountains capped with snow, and the board's thickness along its front.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBoard(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const at = onBoard(x, y);
			if (!at) {
				continue;
			}
			const hex = hexAt(at.u, at.v);
			const here = hexId(x, y);
			const tile = TERRAIN[terrainOf(hex.row, hex.col)];
			let colour = tile.face;
			if (hexId(x + 1, y) !== here || hexId(x, y + 1) !== here) {
				colour = SEAM;
			} else if (hexId(x - 1, y) !== here || hexId(x, y - 1) !== here) {
				colour = tile.light;
			} else if (tile === TERRAIN.f && (x * 7 + y * 5) % 9 < 2) {
				colour = tile.mark;
			} else if (tile === TERRAIN.w && (x * 2 + y * 5) % 9 === 0) {
				colour = tile.light;
			} else if (tile === TERRAIN.m && peak(hex)) {
				colour = hex.dy < -0.1 ? tile.mark : tile.light;
			} else if (random() < 0.06) {
				colour = tile.mark;
			}
			set(layer, x, y, colour);
		}
	}
	// The frame round the map, and the board's edge towards us.
	for (let y = BOARD.top - 1; y <= BOARD.bottom + 2; y++) {
		for (let x = 0; x < 64; x++) {
			if (onBoard(x, y)) {
				continue;
			}
			const front = y >= BOARD.bottom && onBoard(x, BOARD.bottom - 1);
			const edge =
				onBoard(x - 1, y) ||
				onBoard(x + 1, y) ||
				onBoard(x, y - 1) ||
				onBoard(x, y + 1);
			if (front) {
				set(layer, x, y, y === BOARD.bottom ? BOARD_FRAME : BOARD_SIDE);
			} else if (edge) {
				set(
					layer,
					x,
					y,
					y === BOARD.top - 1 ? BOARD_FRAME_LIGHT : BOARD_FRAME
				);
			}
		}
	}
}

/**
 * Tells whether a point of a mountain hex lies on its peak, a small triangle in the middle of the tile.
 * @param {{ dx: number, dy: number }} hex
 * @returns {boolean}
 */
function peak(hex) {
	return (
		hex.dy > -0.3 &&
		hex.dy < 0.12 &&
		Math.abs(hex.dx) < (hex.dy + 0.3) * 0.9
	);
}

/**
 * The dice's shadows on the board below them, a little apart from the dice because they are still in the air.
 * @param {Canvas} layer
 */
function drawShadows(layer) {
	for (const die of DICE) {
		const sx = die.x + 5;
		const sy = die.y + 13;
		for (let y = sy - 2; y <= sy + 2; y++) {
			for (let x = sx - 5; x <= sx + 5; x++) {
				if (Math.hypot((x + 0.5 - sx) / 4, (y + 0.5 - sy) / 1.5) < 1) {
					const under = get(layer, x, y);
					if (under && under !== SEAM) {
						set(layer, x, y, mix(under, SEAM, 0.55));
					}
				}
			}
		}
	}
}

/**
 * The pendant lamp over the table: a wide brass shade on its cord, glowing underneath.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	const { x, rim } = LAMP;
	rect(scene, x, 0, 1, 1, C.ink);
	paint(
		scene,
		x - 6,
		rim - 3,
		['....lbbbd....', '..lbbbbbbbd..', '.lbbbbbbbbbd.', 'lbbbbbbbbbbdd'],
		{ l: C.gold, b: C.brass, d: C.lampFrame }
	);
}

/**
 * The lit bulb under the shade, drawn after the glow so it stays the brightest thing.
 * @param {Canvas} scene
 */
function drawBulb(scene) {
	rect(scene, LAMP.x - 4, LAMP.rim + 1, 9, 1, C.lampGlow);
	rect(scene, LAMP.x - 1, LAMP.rim + 1, 3, 2, C.white);
}

/**
 * The wooden pieces standing on the map: two little figures, a house and a cube.
 * @param {Canvas} scene
 */
function drawPieces(scene) {
	const figure = ['.l.', 'lbb', 'lbb', 'b.b'];
	paint(scene, 14, 33, figure, { l: RED_PIECE[0], b: RED_PIECE[1] });
	paint(scene, 48, 46, figure, { l: BLUE_PIECE[0], b: BLUE_PIECE[1] });
	paint(scene, 20, 44, ['.l.', 'lll', 'lbb', 'lbb'], {
		l: YELLOW_PIECE[0],
		b: YELLOW_PIECE[1],
	});
	paint(scene, 45, 27, ['ll', 'bb'], { l: RED_PIECE[0], b: RED_PIECE[1] });
}

/**
 * A fan of four cards face up on the table at the front left, each with one simple closed shape on its face: a blue
 * disc, a pine tree, a red diamond and an amber sun.
 * @param {Canvas} scene
 */
function drawCards(scene) {
	const pivot = { x: 13, y: 72 };
	const pictures = [
		{ shape: disc, colour: C.daySky2 },
		{ shape: tree, colour: C.pine },
		{ shape: diamond, colour: C.brickRed },
		{ shape: disc, colour: C.amber },
	];
	pictures.forEach(({ shape, colour: picture }, i) => {
		const angle = -0.55 + i * 0.4;
		const along = { x: Math.sin(angle), y: -Math.cos(angle) };
		const across = { x: Math.cos(angle), y: Math.sin(angle) };
		for (let y = 40; y < 64; y++) {
			for (let x = 0; x < 34; x++) {
				const dx = x + 0.5 - pivot.x;
				const dy = y + 0.5 - pivot.y;
				const a = dx * along.x + dy * along.y;
				const b = dx * across.x + dy * across.y;
				if (a < 6 || a > 21 || b < -4.5 || b > 4.5) {
					continue;
				}
				let colour = CARD;
				if (a > 20 || b > 3.6 || b < -3.6) {
					colour = CARD_EDGE;
				} else if (shape(a - 16.5, b + 1)) {
					// Each shape sits towards its card's left edge, the part the next card leaves showing.
					colour = picture;
				}
				set(scene, x, y, colour);
			}
		}
	});
}

/**
 * A round disc in the middle of a card, measured along the card and across it from the card's centre.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function disc(a, b) {
	return Math.hypot(a, b) < 2.1;
}

/**
 * A little pine tree in the middle of a card, its point towards the card's top.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function tree(a, b) {
	return a > -2 && a < 3 && Math.abs(b) < (3 - a) * 0.4;
}

/**
 * A gem-shaped diamond in the middle of a card.
 * @param {number} a
 * @param {number} b
 * @returns {boolean}
 */
function diamond(a, b) {
	return Math.abs(a) / 2.8 + Math.abs(b) / 2.1 < 1;
}

/**
 * Paints a finger: a thick rounded stroke from knuckle to tip, lit along its top and shaded underneath.
 * @param {Canvas} scene
 * @param {[number, number]} from - The knuckle
 * @param {[number, number]} to - The fingertip
 * @param {number} r - Half the finger's thickness
 */
function finger(scene, [x0, y0], [x1, y1], r) {
	const lx = x1 - x0;
	const ly = y1 - y0;
	const length = Math.hypot(lx, ly);
	for (
		let y = Math.floor(Math.min(y0, y1) - r - 1);
		y <= Math.max(y0, y1) + r + 1;
		y++
	) {
		for (
			let x = Math.floor(Math.min(x0, x1) - r - 1);
			x <= Math.max(x0, x1) + r + 1;
			x++
		) {
			const px = x + 0.5 - x0;
			const py = y + 0.5 - y0;
			const t = Math.max(
				0,
				Math.min(1, (px * lx + py * ly) / (length * length))
			);
			const ox = px - lx * t;
			const oy = py - ly * t;
			if (Math.hypot(ox, oy) > r) {
				continue;
			}
			// Which side of the finger the pixel is on: the side facing up catches the lamp.
			const side = (ox * -ly + oy * lx) / length;
			set(
				scene,
				x,
				y,
				side < -r * 0.35
					? HAND_LIGHT
					: side > r * 0.4
						? HAND_SHADE
						: HAND
			);
		}
	}
}

/**
 * The player's hand reaching in from the top right, palm down, its fingers spread wide as the dice drop away,
 * the back of the hand lit by the lamp, a plum knit sleeve behind it.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	// The sleeve, slanting up to the corner, with a ribbed cuff at the wrist.
	for (let i = 0; i < 18; i++) {
		const x = 47 + i;
		const y = 17 - Math.round(i * 0.55);
		for (let j = -5; j <= 4; j++) {
			const colour =
				j === -5 ? SLEEVE_LIGHT : j > 2 ? SLEEVE_SHADE : SLEEVE;
			set(
				scene,
				x,
				y + j,
				i < 2 && (j + x) % 2 === 0 ? SLEEVE_SHADE : colour
			);
		}
	}
	// The back of the hand: a broad rounded plate between the wrist and the knuckles.
	for (let y = 10; y < 28; y++) {
		for (let x = 33; x < 50; x++) {
			const d = Math.hypot((x + 0.5 - 42) / 6.5, (y + 0.5 - 19) / 5);
			if (d > 1) {
				continue;
			}
			const lit = x + 0.5 - 42 + (y + 0.5 - 19) * 1.2 < -2;
			set(
				scene,
				x,
				y,
				lit ? HAND_LIGHT : d > 0.8 && y > 19 ? HAND_SHADE : HAND
			);
		}
	}
	// Four fingers fanned out to the left and down, the thumb hanging below.
	finger(scene, [37, 15], [30, 13], 1.3);
	finger(scene, [36, 18], [28, 20], 1.4);
	finger(scene, [36, 21], [29, 26], 1.4);
	finger(scene, [38, 23], [34, 29], 1.3);
	finger(scene, [45, 23], [44, 30], 1.5);
}

/**
 * One die tumbling in the air, seen past its corner: a lit top face and two sides, each showing its pips.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} turn - Which way round the die is, so the two dice show different faces
 */
function drawDie(scene, x, y, turn) {
	paint(
		scene,
		x,
		y,
		[
			'...ttt...',
			'.ttttttt.',
			'ttttttttt',
			'ltttttttr',
			'lllltrrrr',
			'llllrrrrr',
			'llllrrrrr',
			'llllrrrrr',
			'.lllrrrr.',
		],
		{ t: DIE_TOP, l: DIE_LEFT, r: DIE_RIGHT }
	);
	// One pip on top; the sides show two and three, or three and two.
	set(scene, x + 4, y + 2, PIP);
	const two = [
		[1, 5],
		[2, 7],
	];
	const three = [
		[5, 5],
		[6, 6],
		[7, 7],
	];
	const [left, right] = turn
		? [
				three.map(([dx, dy]) => [dx - 4, dy]),
				two.map(([dx, dy]) => [dx + 4, dy]),
			]
		: [two, three];
	for (const [dx, dy] of [...left, ...right]) {
		set(scene, x + dx, y + dy, PIP);
	}
}
