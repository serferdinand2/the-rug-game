// Feudalism: a lord's manor with its keep on a green hill, and below it a serf ploughing the strip fields behind an ox.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawBuilding } from '../../parts/buildings.js';
import { drawFigure } from '../../parts/figures.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The sky's last row, the fields' far edge, and where the field strips meet far off to the right. */
const HORIZON = 36;
const FIELDS = 39;
const VANISH = { x: 150, y: 35 };

/** The ploughing team's ground row. */
const FURROW = 57;

/**
 * Draws the Feudalism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(5717);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawWoods(layer);
	drawCottages(layer);
	drawFields(layer, random);
	drawSmoke(layer, { x: 27, y: 6, tone: 'steam', puffs: 3, drift: 1 });

	// The manor on its hill stands behind the ploughing team, so each gets its own outline.
	const manor = createCanvas(64, 64);
	drawHill(manor);
	drawManor(manor);
	outline(manor, C.ink);

	drawOx(scene, 14, FURROW);
	drawPlough(scene);
	drawFigure(scene, { x: 40, y: FURROW, facing: 'left', clothes: C.daySky1 });
	outline(scene, C.ink);
	underlay(scene, manor);
	underlay(scene, layer);
	drawPennant(scene);
	drawTraces(scene);
	return scene;
}

/**
 * Distant blue-green woods along the skyline to the right of the hill.
 * @param {Canvas} layer
 */
function drawWoods(layer) {
	const far = mix(C.forestFloor, C.daySky4, 0.45);
	const near = mix(C.forestFloorLight, C.daySky5, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(HORIZON - 3 - Math.abs(Math.sin(x * 0.55)) * 2);
		for (let y = top; y <= FIELDS; y++) {
			set(layer, x, y, y === top ? near : far);
		}
	}
}

/**
 * Which strip of the open field a pixel lies in, and how far across it.
 * @param {number} x
 * @param {number} y
 * @returns {{ index: number, within: number }}
 */
function strip(x, y) {
	const k = (y - VANISH.y) / (VANISH.x - x);
	const band = (k - (FIELDS - VANISH.y) / VANISH.x) / 0.03;
	const index = Math.floor(band);
	return { index, within: band - index };
}

/**
 * The open fields: broad strips running off towards the right, ploughed, sown, ripening
 * and fallow by turns, split by thin grassy balks. The ploughman's strip is half done:
 * dark furrows behind the plough, pale stubble ahead of it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFields(layer, random) {
	const kinds = ['green', 'wheat', 'earth', 'fallow', 'wheat', 'green'];
	const team = strip(36, FURROW).index;
	for (let y = FIELDS; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { index, within } = strip(x, y);
			let kind = kinds[index % kinds.length];
			if (index === team) {
				kind = x > 33 ? 'earth' : 'stubble';
			}
			let colour;
			if (within < 0.07) {
				colour = C.grassShade;
			} else if (kind === 'earth') {
				colour = Math.floor(within * 7) % 2 ? C.timberShade : C.timber;
			} else if (kind === 'green') {
				colour = Math.floor(within * 6) % 2 ? C.grass : C.grassLight;
			} else if (kind === 'wheat') {
				colour =
					(x * 7 + y * 3) % 13 === 0
						? C.sand
						: within < 0.45
							? C.gold
							: C.sandLight;
			} else if (kind === 'stubble') {
				colour = (x + y * 2) % 5 === 0 ? C.sandShade : C.sand;
			} else {
				colour = (x * 3 + y) % 7 === 0 ? C.grass : C.forestFloorLight;
			}
			set(layer, x, y, colour);
		}
	}
	// Poppies and cornflowers in the wheat.
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = FIELDS + 4 + Math.floor(random() * 20);
		const here = get(layer, x, y);
		if (here === C.sandLight || here === C.gold) {
			set(layer, x, y, i % 2 ? C.brickRed : C.daySky1);
		}
	}
}

/**
 * Two thatched cottages of the manor's tenants at the edge of the woods.
 * @param {Canvas} layer
 */
function drawCottages(layer) {
	for (const [x, w] of [
		[44, 8],
		[54, 7],
	]) {
		const base = FIELDS - 1;
		rect(layer, x + 1, base - 3, w - 2, 4, C.cream);
		rect(layer, x + w - 2, base - 3, 1, 4, C.creamShade);
		rect(layer, x + 3, base - 2, 1, 3, C.wood);
		for (let r = 0; r < 3; r++) {
			rect(
				layer,
				x + r,
				base - 4 - r,
				w - 2 * r,
				1,
				r === 0 ? C.sandShade : C.sand
			);
		}
	}
}

/**
 * The hill the manor stands on, rising at the left and falling away to the fields.
 * @param {Canvas} canvas
 */
function drawHill(canvas) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(26 + (x - 16) ** 2 * 0.028);
		const foot = FIELDS + 6 - Math.floor(x / 6);
		for (let y = top; y <= Math.min(foot, 63); y++) {
			const t = (y - top) / Math.max(1, foot - top);
			let colour = y === top ? C.grassLight : C.grass;
			if (t > 0.55 || (t > 0.35 && (x + y) % 2 === 0)) {
				colour = C.grassShade;
			}
			if (x > 30 && (x + y) % 2 === 0 && t > 0.2) {
				colour = C.grassShade;
			}
			set(canvas, x, y, colour);
		}
	}
	// A track winding down from the gate.
	for (const [x, y] of [
		[20, 29],
		[21, 30],
		[22, 31],
		[22, 32],
		[23, 33],
		[24, 34],
		[25, 35],
		[27, 36],
		[28, 37],
	]) {
		set(canvas, x, y, C.sand);
		set(canvas, x + 1, y, C.sandShade);
	}
}

/**
 * Paints one row of a span, lit on the left and shaded on the right.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} right
 * @param {number} y
 * @param {[string, string, string]} colours - Lit, plain and shaded
 */
function span(canvas, left, right, y, [light, main, shade]) {
	for (let x = left; x <= right; x++) {
		set(canvas, x, y, x === left ? light : x >= right - 1 ? shade : main);
	}
}

/**
 * The manor: a stone keep with battlements beside a tall hall of plaster and timber
 * under a steep red roof, ringed by a low stone wall with a gate.
 * @param {Canvas} canvas
 */
function drawManor(canvas) {
	// The keep.
	drawBuilding(canvas, { kind: 'tower', x: 3, y: 26, width: 9 });
	// The hall's walls: plaster between dark timbers.
	for (let y = 15; y <= 26; y++) {
		span(canvas, 12, 31, y, [C.creamLight, C.cream, C.creamShade]);
	}
	for (const x of [12, 17, 22, 27, 31]) {
		rect(canvas, x, 15, 1, 12, C.timberShade);
	}
	rect(canvas, 12, 15, 20, 1, C.timberShade);
	rect(canvas, 12, 20, 20, 1, C.timberShade);
	for (const x of [14, 19, 24, 29]) {
		rect(canvas, x, 17, 2, 2, C.gold);
		set(canvas, x + 1, 18, C.amber);
	}
	// The steep roof.
	for (let r = 0; r < 9; r++) {
		const from = 11 + r;
		const to = 32 - r;
		span(canvas, from, to, 14 - r, [
			C.brickRedLight,
			C.brickRed,
			C.brickRedShade,
		]);
	}
	rect(canvas, 11, 14, 22, 1, C.brickRedShade);
	// The chimney.
	rect(canvas, 26, 7, 3, 4, C.stone);
	set(canvas, 26, 7, C.stoneLight);
	set(canvas, 28, 8, C.stoneShade);
	// The curtain wall with a gate.
	for (let y = 22; y <= 28; y++) {
		span(canvas, 0, 34, y, [C.stoneLight, C.stone, C.stoneShade]);
	}
	for (let x = 0; x <= 34; x += 3) {
		set(canvas, x, 21, C.stone);
		set(canvas, x + 1, 21, C.stoneLight);
	}
	for (let x = 0; x <= 34; x++) {
		if ((x + 1) % 4 === 0) {
			set(canvas, x, 25, C.stoneMid);
		}
	}
	for (let y = 24; y <= 28; y++) {
		const inset = y === 24 ? 1 : 0;
		for (let x = 19 + inset; x <= 22 - inset; x++) {
			set(canvas, x, y, C.wood);
		}
	}
	rect(canvas, 20, 26, 2, 1, C.timber);
}

/**
 * A lord's two-colour pennant flying from the keep, drawn over the outline.
 * @param {Canvas} canvas
 */
function drawPennant(canvas) {
	rect(canvas, 7, 2, 1, 7, C.wood);
	for (let i = 0; i < 6; i++) {
		const h = 3 - Math.floor(i / 2);
		for (let j = 0; j < h; j++) {
			set(canvas, 8 + i, 2 + j, j < h / 2 ? C.gold : C.brickRed);
		}
	}
}

/**
 * The ox, side on, walking left with its head low under the yoke.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - The hooves' row
 */
function drawOx(canvas, x, y) {
	const rows = [
		'.h...............',
		'.hh..yy..........',
		'HHHHHyyBBBBBBBBB.',
		'HeHHHyBBBBBBBBBBB',
		'HHHHBBBBBBBBBBBBBt',
		'mmHHBBBBBBBBBBBBBt',
		'mm.HBBBBBBBBBBBB.t',
		'....bbbbbbbbbbbb..',
		'....bbbbbbbbbbbb..',
		'....LL.L....LL.L..',
		'....LL.L....LL.L..',
		'....kk.k....kk.k..',
	];
	/** @type {Record<string, string>} */
	const colours = {
		h: C.creamLight,
		H: C.timber,
		e: C.ink,
		m: C.creamShade,
		y: C.wood,
		B: C.timberLight,
		b: C.timber,
		L: C.timberShade,
		k: C.wood,
		t: C.wood,
	};
	const top = y - rows.length + 1;
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, top + j, colours[key]);
			}
		});
	});
	// A lighter back where the sun catches it.
	rect(canvas, x + 7, top + 2, 9, 1, mix(C.timberLight, C.sandLight, 0.4));
}

/**
 * The wooden plough behind the ox: its share biting the soil and its handles rising to the ploughman.
 * @param {Canvas} canvas
 */
function drawPlough(canvas) {
	for (const [x, y] of [
		[34, 55],
		[35, 54],
		[36, 53],
		[37, 52],
		[38, 51],
		[39, 50],
	]) {
		set(canvas, x, y, C.timber);
	}
	rect(canvas, 33, 56, 3, 1, C.stoneLight);
	set(canvas, 32, 57, C.stone);
	rect(canvas, 33, 57, 2, 1, C.stoneShade);
}

/**
 * The trace from the yoke to the plough, drawn after the outline so it stays fine.
 * @param {Canvas} canvas
 */
function drawTraces(canvas) {
	for (const [x, y] of [
		[31, 52],
		[32, 52],
		[33, 53],
	]) {
		set(canvas, x, y, C.wood);
	}
}
