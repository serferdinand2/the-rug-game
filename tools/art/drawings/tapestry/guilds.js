// Guilds: a street of timber-framed craft houses, each hanging out its guild's sign: an anvil, a boot and a loaf.
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

/**
 * One house of the street.
 * @typedef {Object} House
 * @property {number} x - Leftmost column of the upper storey
 * @property {number} w - Width of the upper storey
 * @property {number} peak - The gable's top row
 * @property {[Colour, Colour, Colour]} plaster - Lit, plain and shaded plaster
 * @property {Colour} timber - The framing
 * @property {[Colour, Colour, Colour]} roof - Lit, plain and shaded roof
 * @property {'braces' | 'studs'} framing - Diagonal braces, or close-set upright studs
 * @property {[number, number][]} windows - Each upper window's offset from the house's centre, and its width
 * @property {Colour} shutters - The shutters' colour
 */

/** The eaves' row, the jetty's row (where the upper storey overhangs) and the street's kerb. */
const EAVES = 21;
const JETTY = 35;
const KERB = 57;

/** @type {House[]} */
const HOUSES = [
	{
		x: 0,
		w: 21,
		peak: 7,
		plaster: [C.creamLight, C.cream, C.creamShade],
		timber: C.wood,
		roof: [C.roofLight, C.roof, C.roofShade],
		framing: 'braces',
		windows: [
			[-7, 5],
			[3, 5],
		],
		shutters: C.pine,
	},
	{
		x: 21,
		w: 22,
		peak: 2,
		plaster: [C.sandLight, C.sand, C.sandShade],
		timber: C.timberShade,
		roof: [C.brickRedLight, C.brickRed, C.brickRedShade],
		framing: 'studs',
		windows: [[-4, 9]],
		shutters: C.brickRed,
	},
	{
		x: 43,
		w: 21,
		peak: 5,
		plaster: [
			mix(C.creamLight, C.brickRedLight, 0.2),
			mix(C.cream, C.brickRedLight, 0.3),
			mix(C.creamShade, C.brickRed, 0.3),
		],
		timber: C.wood,
		roof: [C.timberLight, C.timber, C.timberShade],
		framing: 'braces',
		windows: [
			[-7, 5],
			[3, 5],
		],
		shutters: C.daySky1,
	},
];

/**
 * Draws the Guilds scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6829);

	drawSky(layer, { time: 'day', horizon: KERB - 1, random });
	drawStreet(layer, { top: KERB });

	// Each house gets its own outline, so neighbours stay apart.
	const houses = HOUSES.map((house) => {
		const canvas = createCanvas(64, 64);
		drawHouse(canvas, house);
		outline(canvas, C.ink);
		return canvas;
	});

	drawSmithy(scene, 0);
	drawCobbler(scene, 21);
	drawBakery(scene, 43);
	drawFigure(scene, { x: 33, y: 61, facing: 'left', clothes: C.pine });
	outline(scene, C.ink);
	for (const house of houses) {
		underlay(scene, house);
	}
	underlay(scene, layer);
	return scene;
}

/**
 * Paints one row of a span, lit on the left and shaded on the right.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} right
 * @param {number} y
 * @param {[Colour, Colour, Colour]} colours - Lit, plain and shaded
 */
function span(canvas, left, right, y, [light, main, shade]) {
	for (let x = left; x <= right; x++) {
		set(canvas, x, y, x === left ? light : x >= right - 1 ? shade : main);
	}
}

/**
 * A casement window between two shutters: glass catching the sky, split by upright mullions.
 * @param {Canvas} canvas
 * @param {number} x - The glass's left column
 * @param {number} y - Top row
 * @param {number} w - The glass's width
 * @param {number} h
 * @param {Colour} shutter
 */
function casement(canvas, x, y, w, h, shutter) {
	rect(canvas, x - 1, y, 1, h, shutter);
	rect(canvas, x + w, y, 1, h, shutter);
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			const mullion = (i + 1) % 3 === 0 && i < w - 1;
			const glint = i === 0 && j === 0;
			set(
				canvas,
				x + i,
				y + j,
				mullion
					? C.stoneShade
					: glint
						? C.white
						: j < h / 2
							? C.daySky6
							: C.daySky4
			);
		}
	}
}

/**
 * One timber-framed house: a gable under its roof, an overhanging upper storey of
 * plaster panels and braces, and a narrower ground floor with a door.
 * @param {Canvas} canvas
 * @param {House} house
 */
function drawHouse(
	canvas,
	{ x, w, peak, plaster, timber, roof, framing, windows, shutters }
) {
	const right = x + w - 1;
	const cx = x + Math.floor(w / 2);
	// The ground floor, set back under the jetty.
	for (let y = JETTY + 1; y < KERB; y++) {
		span(canvas, x + 1, right - 1, y, plaster);
	}
	rect(canvas, x + 1, JETTY + 1, w - 2, 1, plaster[2]);
	rect(canvas, x + 1, JETTY + 1, 1, KERB - JETTY - 1, timber);
	rect(canvas, right - 1, JETTY + 1, 1, KERB - JETTY - 1, timber);
	// The door, on the right.
	for (let y = 46; y < KERB; y++) {
		for (let i = right - 5; i <= right - 2; i++) {
			const arch = y === 46 && (i === right - 5 || i === right - 2);
			if (!arch) {
				set(canvas, i, y, i === right - 5 ? C.timber : C.timberShade);
			}
		}
	}
	set(canvas, right - 4, 51, C.brass);
	// The upper storey: plaster panels between posts, rails and braces.
	for (let y = EAVES + 1; y <= JETTY; y++) {
		span(canvas, x, right, y, plaster);
	}
	rect(canvas, x, JETTY, w, 1, timber);
	rect(canvas, x, EAVES + 1, w, 1, timber);
	for (const post of [x, cx, right]) {
		rect(canvas, post, EAVES + 1, 1, JETTY - EAVES, timber);
	}
	if (framing === 'studs') {
		for (let i = x + 2; i < right; i += 3) {
			rect(canvas, i, EAVES + 2, 1, JETTY - EAVES - 2, timber);
		}
	} else {
		for (let i = 0; i < 6; i++) {
			set(canvas, x + 1 + i, JETTY - 1 - i, timber);
			set(canvas, right - 1 - i, JETTY - 1 - i, timber);
		}
	}
	for (const [dx, width] of windows) {
		casement(canvas, cx + dx, EAVES + 4, width, 6, shutters);
	}
	// The gable: plaster under a steep roof edge, with a king post and a small window.
	const half = Math.floor(w / 2);
	for (let y = peak; y <= EAVES; y++) {
		const t = (y - peak) / (EAVES - peak);
		const reach = Math.round(t * (half + 1));
		for (let i = cx - reach; i <= cx + reach; i++) {
			const edge = i <= cx - reach + 1 || i >= cx + reach - 1;
			const colour = edge
				? i < cx
					? roof[0]
					: roof[2]
				: i === cx
					? timber
					: plaster[1];
			set(canvas, i, y, colour);
		}
	}
	rect(canvas, x - 1, EAVES, w + 2, 1, roof[1]);
	rect(canvas, cx - 1, EAVES - 6, 3, 3, C.daySky4);
	set(canvas, cx - 1, EAVES - 6, C.daySky6);
	rect(canvas, cx - 4, EAVES - 1, 9, 1, timber);
}

/**
 * An iron bracket jutting from the wall, with a gilt-framed board hanging from it on two short chains.
 * @param {Canvas} canvas
 * @param {number} x - The board's left column
 * @param {Colour} board - The board's colour
 * @returns {{ x: number, y: number }} The board's inner top-left corner, for its picture.
 */
function hangSign(canvas, x, board) {
	const w = 14;
	const h = 13;
	rect(canvas, x - 1, JETTY + 1, w + 1, 1, C.night);
	set(canvas, x + w - 1, JETTY + 2, C.night);
	set(canvas, x + 1, JETTY + 2, C.stoneShade);
	set(canvas, x + w - 3, JETTY + 2, C.stoneShade);
	const top = JETTY + 3;
	rect(canvas, x, top, w, h, C.gold);
	rect(canvas, x + w - 1, top, 1, h, C.amber);
	rect(canvas, x, top + h - 1, w, 1, C.amber);
	rect(canvas, x + 1, top + 1, w - 2, h - 2, board);
	return { x: x + 1, y: top + 1 };
}

/**
 * Paints a small picture from rows of keys; dots are left alone.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 */
function sprite(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * The smith's: a pale blue sign with a black iron anvil, over a shop window glowing with the forge.
 * @param {Canvas} canvas
 * @param {number} x - The house's left column
 */
function drawSmithy(canvas, x) {
	const at = hangSign(canvas, x + 1, mix(C.daySky5, C.white, 0.35));
	sprite(
		canvas,
		at.x,
		at.y + 2,
		[
			'HHHHHHHHHHHH',
			'..SSSSSSSSSD',
			'....SSSSSSD.',
			'.....SSSSD..',
			'.....SSSSD..',
			'....SSSSSSD.',
			'...SSSSSSSSD',
		],
		{
			H: C.stoneLight,
			S: mix(C.stoneShade, C.night, 0.35),
			D: C.night,
		}
	);
	drawShop(canvas, x + 2, (i, j) =>
		j > 1
			? i % 4 === 1
				? C.gold
				: i % 4 === 3
					? C.brickRed
					: C.amber
			: C.brickRedShade
	);
}

/**
 * The cobbler's: a pale green sign with a laced brown boot, over a window of shoes.
 * @param {Canvas} canvas
 * @param {number} x - The house's left column
 */
function drawCobbler(canvas, x) {
	const at = hangSign(canvas, x + 1, mix(C.grassLight, C.creamLight, 0.45));
	sprite(
		canvas,
		at.x + 1,
		at.y,
		[
			'.....hhhhh',
			'.....hhhhh',
			'.....BBBBB',
			'.....BlBBb',
			'.....BBlBb',
			'.....BlBBb',
			'...BBBBlBb',
			'.BBBBBBBBb',
			'BBBBBBBBBb',
			'BBBBBBBBBb',
			'kkkkkk..kk',
		],
		{
			h: C.timberLight,
			B: C.timber,
			b: C.timberShade,
			l: C.sandLight,
			k: C.wood,
		}
	);
	drawShop(canvas, x + 2, (i, j) =>
		j >= 2 && i % 4 !== 3
			? j === 2
				? C.timberLight
				: C.timber
			: C.floorShade
	);
}

/**
 * The baker's: a red sign with a golden scored loaf, over a window of bread.
 * @param {Canvas} canvas
 * @param {number} x - The house's left column
 */
function drawBakery(canvas, x) {
	const at = hangSign(canvas, x + 1, C.brickRedShade);
	sprite(
		canvas,
		at.x,
		at.y + 2,
		[
			'....GGGG....',
			'..GGGGGGGG..',
			'.GGGwGGGwGG.',
			'GGGwGGGwGGGA',
			'GGwGGGwGGGAA',
			'.AAAAAAAAAA.',
		],
		{ G: C.gold, w: C.lampGlow, A: C.amber }
	);
	drawShop(canvas, x + 2, (i, j) =>
		j >= 2 ? ((i + j) % 4 < 2 ? C.amber : C.gold) : C.floorShade
	);
}

/**
 * A shop window under the sign, with a folded-down shutter for a counter; the wares
 * inside are painted by the shop.
 * @param {Canvas} canvas
 * @param {number} x - The window's left column
 * @param {(i: number, j: number) => Colour} ware - The colour inside at column i, row j
 */
function drawShop(canvas, x, ware) {
	const top = 52;
	for (let j = 0; j < 4; j++) {
		for (let i = 0; i < 12; i++) {
			set(canvas, x + i, top + j, ware(i, j));
		}
	}
	rect(canvas, x - 1, top + 4, 14, 1, C.timberLight);
}
