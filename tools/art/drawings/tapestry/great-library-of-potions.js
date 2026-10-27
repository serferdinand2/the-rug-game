// Great Library of Potions: tall shelves of glowing coloured potions around a bubbling cauldron at night.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A glowing potion's centre and colour.
 * @typedef {{ x: number, y: number, colour: Colour }} Light
 */

/** The floor's first row, the cauldron's centre column and the brew's surface row. */
const FLOOR = 53;
const CX = 32;
const BREW = 40;

/** The window's box, frame included. */
const WINDOW = { x: 24, y: 2, w: 16, h: 17 };

/** The rows of the shelf boards, top first; each board is two rows thick. */
const BOARDS = [9, 18, 27, 36, 45];

/** The night the room sinks into away from the lights. */
const DARK = C.nightSky1;

/** The dark backs of the shelves, between the potions. */
const SHELF_BACK = mix(C.timberShade, DARK, 0.55);
const SHELF_DEEP = mix(C.timberShade, DARK, 0.75);

/** The cauldron's iron: in the open, lit by the brew, under the rim, in shadow, and over the fire. */
const IRON = mix(C.roofShade, C.ink, 0.15);
const IRON_LIT = mix(C.ghostShade, C.roof, 0.6);
const IRON_RIM = mix(C.ghostShade, C.roofShade, 0.5);
const IRON_DEEP = mix(C.roofShade, C.ink, 0.55);
const IRON_EMBER = mix(C.amber, C.roofShade, 0.55);
const IRON_BACK = mix(C.ghostShade, C.stoneShade, 0.35);
const CAULDRON = [
	IRON,
	IRON_LIT,
	IRON_RIM,
	IRON_DEEP,
	IRON_EMBER,
	IRON_BACK,
	C.ghostShade,
];

/**
 * A potion's liquid: lit, mid and shaded.
 * @type {[Colour, Colour, Colour][]}
 */
const POTIONS = [
	[C.ghostLight, C.ghost, C.ghostShade],
	[C.arcaneLight, C.arcane, C.arcaneShade],
	[C.tealLight, C.teal, C.tealShade],
	[C.brickRedLight, C.brickRed, C.brickRedShade],
	[C.lampGlow, C.gold, C.amber],
	[C.foam, C.nightWave, C.nightWaveDeep],
	[
		mix(C.arcaneLight, C.brickRedLight, 0.5),
		mix(C.arcane, C.brickRedLight, 0.5),
		mix(C.arcaneShade, C.brickRed, 0.5),
	],
];

/** Bottle shapes, bottom row last: c cork, g glass neck, w glint, L lit, M mid, S shaded liquid. */
const BOTTLES = [
	['..c..', '..g..', '.MLM.', 'MwLMS', 'MLMMS', '.MMS.'],
	['cc', 'gg', 'wM', 'LM', 'LS', 'MS'],
	['.cc.', '.gg.', 'MLMS', 'wLMS', 'MLMS', 'MMSS'],
	['..c..', '..L..', '.wLM.', '.LMS.', 'MLMMS', 'MMMSS'],
	['ccc', 'MLS', 'wMS', 'MMS'],
	['.c.', '.g.', 'wLS', 'LMS', 'MMS'],
];

/**
 * Draws the Great Library of Potions scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9101);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'stone',
		window: { ...WINDOW, time: 'night' },
	});
	drawArch(layer);
	drawMoon(layer);
	darken(layer, 0.7);

	// The shelves stand against the back wall, behind the cauldron, so they get their own outline.
	const shelves = createCanvas(64, 64);
	/** @type {Light[]} */
	const lights = [];
	drawShelves(shelves, 0, random, lights);
	drawShelves(shelves, 44, random, lights);
	outline(shelves, C.ink);

	drawCauldron(scene);
	drawFire(scene);
	outline(scene, C.ink);
	underlay(scene, shelves);
	underlay(scene, layer);

	haloPotions(scene, lights);
	glow(scene, {
		x: CX,
		y: BREW,
		radius: 30,
		colour: C.ghost,
		strength: 0.36,
		steps: 3,
		skip: [C.ink, C.ghostLight, C.ghost, C.white, ...CAULDRON],
	});
	glow(scene, {
		x: CX,
		y: 60,
		radius: 12,
		colour: C.amber,
		strength: 0.45,
		skip: [C.ink, C.gold, C.lampGlow, ...CAULDRON],
	});
	drawVapour(scene);
	drawBubbles(scene);
	return scene;
}

/**
 * Pulls every pixel of a canvas towards the dark of the night room.
 * @param {Canvas} canvas
 * @param {number} amount - 0 leaves it, 1 makes it night
 */
function darken(canvas, amount) {
	const panes = (/** @type {number} */ x, /** @type {number} */ y) =>
		x > WINDOW.x &&
		x < WINDOW.x + WINDOW.w - 1 &&
		y > WINDOW.y &&
		y < WINDOW.y + WINDOW.h - 1;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(canvas, x, y);
			if (colour && !panes(x, y)) {
				set(canvas, x, y, mix(colour, DARK, amount));
			}
		}
	}
}

/**
 * Each potion lights the shelf behind it with its own colour, in one soft band.
 * @param {Canvas} scene
 * @param {Light[]} lights
 */
function haloPotions(scene, lights) {
	for (const { x: cx, y: cy, colour } of lights) {
		for (let y = cy - 4; y <= cy + 4; y++) {
			for (let x = cx - 4; x <= cx + 4; x++) {
				const behind = get(scene, x, y);
				if (
					Math.hypot(x - cx, y - cy) <= 3.6 &&
					(behind === SHELF_BACK || behind === SHELF_DEEP)
				) {
					set(scene, x, y, mix(behind, colour, 0.3));
				}
			}
		}
	}
}

/**
 * Rounds the window's top corners into an arch of stone.
 * @param {Canvas} layer
 */
function drawArch(layer) {
	for (let i = 0; i < 5; i++) {
		for (let j = 0; j < 5 - i; j++) {
			const left = WINDOW.x + j;
			const right = WINDOW.x + WINDOW.w - 1 - j;
			const y = WINDOW.y + i;
			const colour = (i + j) % 4 === 3 ? C.stoneShade : C.stone;
			set(layer, left, y, colour);
			set(layer, right, y, colour);
		}
	}
}

/**
 * A full moon in the upper right panes.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	paint(layer, 33, 5, ['.mm.', 'mMMm', 'mMMm', '.mm.'], {
		m: C.moonRim,
		M: C.moon,
	});
}

/**
 * A tall bookcase from floor to ceiling, its five shelves crowded with potions and a few books.
 * @param {Canvas} canvas
 * @param {number} left - The case's leftmost column; it is 20 pixels wide
 * @param {() => number} random
 * @param {Light[]} lights - Collects each potion's glow
 */
function drawShelves(canvas, left, random, lights) {
	const right = left + 19;
	const back = SHELF_BACK;
	const backDeep = SHELF_DEEP;
	const board = mix(C.timberLight, DARK, 0.35);
	const boardShade = mix(C.timber, DARK, 0.45);
	const post = mix(C.timber, DARK, 0.35);
	rect(canvas, left, 0, 20, FLOOR + 2, back);
	for (let y = 0; y < FLOOR + 2; y++) {
		set(canvas, left + 2, y, backDeep);
		set(canvas, right - 2, y, backDeep);
	}
	for (const y of BOARDS) {
		rect(canvas, left, y, 20, 1, board);
		rect(canvas, left, y + 1, 20, 1, boardShade);
	}
	for (const x of [left, left + 1, right - 1, right]) {
		for (let y = 0; y < FLOOR + 2; y++) {
			set(canvas, x, y, x === left || x === right - 1 ? board : post);
		}
	}
	// A plinth of drawers under the lowest shelf.
	rect(canvas, left, BOARDS[4] + 2, 20, FLOOR + 2 - BOARDS[4] - 2, post);
	for (let x = left + 3; x <= right - 3; x += 7) {
		rect(canvas, x, BOARDS[4] + 4, 4, 3, boardShade);
		set(canvas, x + 1, BOARDS[4] + 5, C.brass);
	}
	// Potions and books on each shelf.
	for (const y of [0, ...BOARDS.slice(0, 4).map((b) => b + 2)]) {
		const base =
			(y === 0 ? BOARDS[0] : BOARDS[BOARDS.indexOf(y - 2) + 1]) - 1;
		fillShelf(canvas, left + 2, right - 2, base, random, lights);
	}
}

/**
 * Stands a row of potions, with now and then a pair of books, along one shelf.
 * @param {Canvas} canvas
 * @param {number} from - The first free column
 * @param {number} to - The last free column
 * @param {number} base - The row the bottles stand on
 * @param {() => number} random
 * @param {Light[]} lights - Collects each potion's glow
 */
function fillShelf(canvas, from, to, base, random, lights) {
	let x = from + Math.floor(random() * 2);
	while (x <= to) {
		if (random() > 0.82) {
			const w = 3;
			if (x + w - 1 > to) {
				break;
			}
			drawBooks(canvas, x, base, random);
			x += w + 1;
			continue;
		}
		const shape = BOTTLES[Math.floor(random() * BOTTLES.length)];
		const w = shape[0].length;
		if (x + w - 1 > to) {
			break;
		}
		const [light, mid, shade] =
			POTIONS[Math.floor(random() * POTIONS.length)];
		paint(canvas, x, base - shape.length + 1, shape, {
			c: C.timberLight,
			g: mix(C.stoneLight, DARK, 0.2),
			w: C.white,
			L: light,
			M: mid,
			S: shade,
		});
		lights.push({ x: x + Math.floor(w / 2), y: base - 2, colour: light });
		x += w + 1;
	}
}

/**
 * Two or three old books standing together, their spines dimmed by the dark.
 * @param {Canvas} canvas
 * @param {number} x - The first spine's column
 * @param {number} base - The row they stand on
 * @param {() => number} random
 */
function drawBooks(canvas, x, base, random) {
	const spines = [
		C.brickRedShade,
		C.roof,
		C.pineShade,
		C.timber,
		C.nightSea2,
	];
	for (let i = 0; i < 3; i++) {
		const h = 5 + Math.floor(random() * 2);
		const colour = mix(
			spines[Math.floor(random() * spines.length)],
			DARK,
			0.2
		);
		rect(canvas, x + i, base - h + 1, 1, h, colour);
		set(canvas, x + i, base - h + 2, mix(C.gold, DARK, 0.3));
	}
}

/**
 * The iron cauldron: a round black pot with a heavy rim, brimming with a glowing green brew, on three stubby legs.
 * @param {Canvas} scene
 */
function drawCauldron(scene) {
	// The round body, lit from the brew above and the fire below, darker on the right.
	const cy = 49;
	for (let y = BREW + 1; y <= 58; y++) {
		for (let x = CX - 13; x <= CX + 13; x++) {
			const nx = (x - CX) / 12.5;
			const ny = (y - cy) / 9;
			const d = nx * nx + ny * ny;
			if (d > 1) {
				continue;
			}
			const lit = -nx * 0.7 - ny * 0.45;
			let colour = IRON;
			if (y <= BREW + 3) {
				colour = IRON_RIM;
			} else if (y >= 55 && d > 0.45) {
				colour = IRON_EMBER;
			} else if (lit > 0.5 && d > 0.3) {
				colour = IRON_LIT;
			} else if (lit < -0.35) {
				colour = IRON_DEEP;
			}
			set(scene, x, y, colour);
		}
	}
	// A glint of green on the upper left of the belly.
	for (const [x, y] of [
		[CX - 9, 46],
		[CX - 9, 47],
		[CX - 8, 45],
	]) {
		set(scene, x, y, C.ghostShade);
	}
	// Three stubby legs.
	for (const x of [CX - 8, CX, CX + 7]) {
		rect(scene, x, 57, 2, 3, IRON);
	}
	// The heavy rim, seen from a little above, and the brew inside it.
	for (let y = BREW - 3; y <= BREW + 3; y++) {
		for (let x = CX - 15; x <= CX + 15; x++) {
			const d = ((x - CX) / 14.5) ** 2 + ((y - BREW) / 3.4) ** 2;
			if (d > 1) {
				continue;
			}
			const inner = ((x - CX) / 12) ** 2 + ((y - BREW) / 2.2) ** 2;
			let colour;
			if (inner <= 1) {
				colour = y <= BREW - 1 ? C.ghostLight : C.ghost;
			} else {
				colour = y >= BREW + 1 ? IRON_LIT : IRON_BACK;
			}
			set(scene, x, y, colour);
		}
	}
	// Brighter swirls on the brew's surface.
	for (const [x, y] of [
		[CX - 7, BREW],
		[CX - 6, BREW],
		[CX + 2, BREW - 1],
		[CX + 3, BREW - 1],
		[CX + 7, BREW + 1],
		[CX - 2, BREW + 1],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * Logs and leaping flames under the cauldron.
 * @param {Canvas} scene
 */
function drawFire(scene) {
	for (const [x0, y0, x1, y1] of [
		[CX - 12, 62, CX + 4, 60],
		[CX - 4, 60, CX + 12, 62],
	]) {
		line(scene, x0, y0, x1, y1, C.timber);
		line(scene, x0, y0 + 1, x1, y1 + 1, C.timberShade);
	}
	paint(
		scene,
		CX - 9,
		56,
		[
			'..a...g....a....a.',
			'.aga.aga..aga..aga',
			'agLgaaLga.gLga.gLg',
			'gLLLgLLLgagLLgaLLL',
		],
		{ a: C.amber, g: C.gold, L: C.lampGlow }
	);
}

/**
 * Green vapour curling up from the brew towards the window, soft-edged and see-through.
 * @param {Canvas} scene
 */
function drawVapour(scene) {
	for (let y = 8; y < BREW - 3; y++) {
		const t = (BREW - 3 - y) / (BREW - 11);
		const sway = Math.round(Math.sin(y * 0.38) * (2 + t * 4));
		const half = 2 + Math.round(t * 2.5);
		for (let x = CX + sway - half; x <= CX + sway + half; x++) {
			const behind = get(scene, x, y);
			if (!behind) {
				continue;
			}
			const edge = x === CX + sway - half || x === CX + sway + half;
			const strength = (edge ? 0.25 : 0.45) * (1 - t * 0.5);
			set(scene, x, y, mix(behind, C.ghost, strength));
		}
	}
}

/**
 * Bubbles breaking on the brew and drops of light rising from it.
 * @param {Canvas} scene
 */
function drawBubbles(scene) {
	for (const [x, y] of [
		[CX - 5, BREW - 3],
		[CX + 5, BREW - 3],
		[CX - 1, BREW - 4],
	]) {
		paint(scene, x - 1, y - 1, ['.w.', 'wGw', '.w.'], {
			w: C.ghostLight,
			G: C.ghostShade,
		});
	}
	/** @type {[number, number, Colour][]} */
	const drops = [
		[CX - 3, 30, C.ghostLight],
		[CX + 4, 26, C.white],
		[CX - 6, 22, C.ghostLight],
		[CX + 2, 18, C.ghostLight],
		[CX - 2, 13, C.white],
		[CX + 7, 33, C.white],
		[CX - 9, 34, C.ghostLight],
	];
	for (const [x, y, colour] of drops) {
		set(scene, x, y, colour);
	}
}
