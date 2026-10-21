// Trade Economy: a market square of striped stalls heaped with fruit, cloth and pots, two traders swapping goods in front.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The street's kerb row, and the row the traders stand on. */
const STREET = 46;
const FEET = 59;

/** House walls: light, main and shade. */
const WALLS = {
	cream: [C.creamLight, C.cream, C.creamShade],
	sand: [C.sandLight, C.sand, C.sandShade],
	plaster: [C.plasterLight, C.plaster, C.plasterShade],
};

/** Clay for the pots, blended from the palette. */
const CLAY = {
	light: mix(C.timberLight, C.sand, 0.35),
	main: C.timberLight,
	shade: C.timber,
};

/**
 * Draws the Trade Economy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const town = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(971);

	drawSky(layer, { time: 'day', horizon: STREET - 1, random });
	drawStreet(layer, { top: STREET });

	// The tall houses round the square stand behind the stalls, so they get their own outline.
	drawTownhouse(town, -2, 13, 11, WALLS.cream, C.brickRed);
	drawTownhouse(town, 12, 12, 6, WALLS.sand, C.roof);
	drawTownhouse(town, 25, 12, 10, WALLS.plaster, C.brickRed);
	drawTownhouse(town, 38, 12, 4, WALLS.cream, C.timber);
	drawTownhouse(town, 51, 14, 9, WALLS.sand, C.brickRed);
	outline(town, C.ink);
	underlay(town, layer);

	drawStall(scene, 1, [C.brickRed, C.creamLight]);
	drawStall(scene, 36, [C.daySky1, C.creamLight]);
	drawFruit(scene, 1);
	drawCloth(scene, 38);
	drawPots(scene, 51);
	drawFigure(scene, { x: 22, y: FEET, facing: 'right', clothes: C.grass });
	drawFigure(scene, { x: 37, y: FEET, facing: 'left', clothes: C.roofLight });
	drawSwap(scene);
	drawBasket(scene, 8, FEET);
	outline(scene, C.ink);
	underlay(scene, town);
	return scene;
}

/**
 * A market stall: a striped awning with a scalloped edge on two poles, over a wooden counter.
 * @param {Canvas} scene
 * @param {number} left - The stall's leftmost column
 * @param {[Colour, Colour]} stripes - The awning's two stripe colours
 */
function drawStall(scene, left, stripes) {
	const width = 27;
	const right = left + width - 1;
	// The poles.
	for (const x of [left + 1, right - 1]) {
		rect(scene, x, 27, 1, STREET + 4 - 27, C.timber);
	}
	// The counter: a lit top board over planks.
	for (let y = 38; y <= STREET + 2; y++) {
		for (let x = left; x <= right; x++) {
			let colour = C.timber;
			if (y === 38) {
				colour = C.timberLight;
			} else if (y === 39 || x >= right - 1) {
				colour = C.timberShade;
			} else if ((x - left) % 5 === 0) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The awning, its stripes three columns wide, each ending in a rounded tab.
	for (let y = 19; y <= 27; y++) {
		for (let x = left - 1; x <= right + 1; x++) {
			const stripe = Math.floor((x - left + 1) / 3) % 2;
			const tab = (x - left + 1) % 3;
			if (y === 27 && tab !== 1) {
				continue;
			}
			let colour = stripes[stripe];
			if (y === 19) {
				colour = stripe ? C.cream : mix(stripes[0], C.ink, 0.25);
			} else if (y >= 25) {
				colour = mix(stripes[stripe], C.ink, 0.18);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * A tall townhouse facing the square: a gable roof over rows of windows with sills.
 * @param {Canvas} town
 * @param {number} left - Its leftmost column
 * @param {number} width
 * @param {number} top - The row of its roof's ridge
 * @param {Colour[]} wall - Light, main and shade wall colours
 * @param {Colour} roof - The roof's colour
 */
function drawTownhouse(town, left, width, top, wall, roof) {
	const right = left + width - 1;
	const eaves = top + Math.ceil(width / 2) - 1;
	// The gable roof, narrowing by a column on each side every row.
	for (let y = top; y <= eaves; y++) {
		const inset = eaves - y;
		for (let x = left + inset; x <= right - inset; x++) {
			const colour =
				x <= left + inset + 1
					? mix(roof, C.white, 0.2)
					: x >= right - inset - 1
						? mix(roof, C.ink, 0.3)
						: roof;
			set(town, x, y, colour);
		}
	}
	// The wall and its windows.
	for (let y = eaves + 1; y < STREET; y++) {
		for (let x = left; x <= right; x++) {
			const colour =
				x === left ? wall[0] : x >= right - 1 ? wall[2] : wall[1];
			set(town, x, y, colour);
		}
	}
	for (let y = eaves + 3; y < STREET - 4; y += 6) {
		for (let x = left + 2; x + 2 <= right - 1; x += 3) {
			rect(town, x, y, 2, 3, C.roofShade);
			set(town, x, y, C.daySky4);
			rect(town, x - 1, y + 3, 4, 1, wall[2]);
		}
	}
}

/**
 * Crates of fruit on the left counter: oranges, apples, pears and plums, each heaped in round fruit.
 * @param {Canvas} scene
 * @param {number} left - The first crate's leftmost column
 */
function drawFruit(scene, left) {
	/** @type {[Colour, Colour][]} */
	const kinds = [
		[C.amber, C.gold],
		[C.brickRed, C.brickRedLight],
		[C.grassShade, C.grassLight],
		[C.roof, C.roofLight],
	];
	kinds.forEach(([main, light], n) => {
		const x0 = left + n * 7;
		rect(scene, x0, 35, 6, 3, C.timberShade);
		rect(scene, x0, 35, 6, 1, C.timberLight);
		// Three fruit in the bottom row, two above, one on top.
		for (const [fx, fy] of [
			[0, 33],
			[2, 33],
			[4, 33],
			[1, 31],
			[3, 31],
			[2, 29],
		]) {
			rect(scene, x0 + fx, fy, 2, 2, main);
			set(scene, x0 + fx, fy, light);
		}
	});
}

/**
 * Bolts of cloth on the right counter: rolls seen from the side, each with its rolled end showing.
 * @param {Canvas} scene
 * @param {number} left - The stack's leftmost column
 */
function drawCloth(scene, left) {
	/** @type {[number, number, Colour, Colour, Colour][]} */
	const bolts = [
		[0, 35, C.brickRed, C.brickRedLight, C.brickRedShade],
		[6, 35, C.daySky1, C.daySky3, C.daySea3],
		[3, 31, C.gold, C.lampGlow, C.amber],
	];
	for (const [dx, y, main, light, shade] of bolts) {
		const x = left + dx;
		rect(scene, x, y, 6, 3, main);
		rect(scene, x, y, 6, 1, light);
		// The rolled end, a darker spiral.
		set(scene, x + 5, y, main);
		set(scene, x + 5, y + 1, shade);
		set(scene, x + 5, y + 2, shade);
		set(scene, x, y + 2, shade);
		// The seam between bolts.
		rect(scene, x, y + 3, 6, 1, C.ink);
	}
	// A length of red cloth hanging over the counter's edge.
	rect(scene, left + 1, 38, 3, 6, C.brickRed);
	rect(scene, left + 1, 38, 1, 6, C.brickRedLight);
	set(scene, left + 2, 44, C.brickRedShade);
}

/**
 * Clay jars and a bowl at the right end of the counter.
 * @param {Canvas} scene
 * @param {number} left - The row of pots' leftmost column
 */
function drawPots(scene, left) {
	jar(scene, left, 37, 'big');
	jar(scene, left + 6, 37, 'small');
	jar(scene, left + 5, 32, 'bowl');
}

/** Pot sprites: r rim, l lit side, m clay, d shade. */
const JARS = {
	big: ['.rrr.', '.lmd.', 'lmmmd', 'lmmmd', 'lmmmd', '.lmd.'],
	small: ['rrr', 'lmd', 'lmd', '.m.'],
	bowl: ['rrrrrr', 'lmmmmd', '.lmmd.'],
};

/**
 * One clay pot standing on its bottom row.
 * @param {Canvas} scene
 * @param {number} x - Its leftmost column
 * @param {number} bottom - Its bottom row
 * @param {keyof typeof JARS} kind
 */
function jar(scene, x, bottom, kind) {
	const rows = JARS[kind];
	/** @type {Record<string, Colour>} */
	const colours = {
		r: CLAY.light,
		l: CLAY.light,
		m: CLAY.main,
		d: CLAY.shade,
	};
	const top = bottom - rows.length + 1;
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, top + j, colours[key]);
			}
		});
	});
}

/**
 * The swap between the two traders: one holds out a folded red cloth, the other a small clay jar.
 * @param {Canvas} scene
 */
function drawSwap(scene) {
	const y = FEET - 5;
	rect(scene, 27, y - 1, 3, 2, C.brickRed);
	rect(scene, 27, y - 1, 3, 1, C.brickRedLight);
	set(scene, 28, y + 1, C.brickRedShade);
	jar(scene, 33, y + 1, 'small');
}

/**
 * A basket of oranges on the cobbles.
 * @param {Canvas} scene
 * @param {number} x - Its leftmost column
 * @param {number} bottom - Its bottom row
 */
function drawBasket(scene, x, bottom) {
	for (let y = bottom - 3; y <= bottom; y++) {
		const inset = y === bottom ? 1 : 0;
		for (let i = inset; i < 8 - inset; i++) {
			set(scene, x + i, y, (i + y) % 2 ? C.timberLight : C.timber);
		}
	}
	for (const [dx, dy] of [
		[0, -5],
		[2, -5],
		[4, -5],
		[6, -5],
		[1, -7],
		[3, -7],
		[5, -7],
	]) {
		rect(scene, x + dx, bottom + dy, 2, 2, C.amber);
		set(scene, x + dx, bottom + dy, C.gold);
	}
}
