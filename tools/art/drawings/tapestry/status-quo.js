// Status Quo: a great brass balance scale resting perfectly level on a stone plinth in a quiet, sunny town square.
import {
	createCanvas,
	set,
	rect,
	line,
	paint,
	outline,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The paving's first row, and the arcade's roof line. */
const SQUARE = 48;
const ARCADE = 34;

/** The beam's top row, and the hub column of the left pan (the right one mirrors it). */
const BEAM = 15;
const PAN = 10;

/** The pans' rim row. */
const RIM = 30;

/**
 * Draws the Status Quo scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(73);

	drawSky(layer, { time: 'day', horizon: SQUARE - 1, random });
	drawStreet(layer, { top: SQUARE });
	mirrorHalves(layer);

	// The arcade closes the square behind the plinth, so it gets its own outline.
	const back = createCanvas(64, 64);
	drawArcade(back);
	outline(back, C.ink);

	drawPlinth(scene);
	drawScale(scene);
	drawWeight(scene, PAN);
	drawWeight(scene, 63 - PAN);
	drawPigeons(scene);
	outline(scene, C.ink);
	const chains = createCanvas(64, 64);
	drawChains(chains, PAN);
	drawChains(chains, 63 - PAN);
	underlay(scene, chains);
	underlay(scene, back);
	underlay(scene, layer);
	return scene;
}

/**
 * Copies the left half of a canvas onto the right half, so the clouds and the paving are symmetrical.
 * @param {Canvas} canvas
 */
function mirrorHalves(canvas) {
	for (let y = 0; y < canvas.h; y++) {
		for (let x = canvas.w / 2; x < canvas.w; x++) {
			canvas.p[y * canvas.w + x] =
				canvas.p[y * canvas.w + canvas.w - 1 - x];
		}
	}
}

/**
 * Paints a pixel and its mirror image across the centre line.
 * @param {Canvas} canvas
 * @param {number} x - The left-hand column
 * @param {number} y
 * @param {Colour} left - The colour on the left
 * @param {Colour} [right] - The colour on the right; the left colour by default
 */
function pair(canvas, x, y, left, right = left) {
	set(canvas, x, y, left);
	set(canvas, 63 - x, y, right);
}

/**
 * A low cream arcade across the back of the square: a red tiled roof and a row of round-headed arches.
 * @param {Canvas} canvas
 */
function drawArcade(canvas) {
	rect(canvas, 0, ARCADE, 64, 1, C.brickRedLight);
	rect(canvas, 0, ARCADE + 1, 64, 1, C.brickRed);
	rect(canvas, 0, ARCADE + 2, 64, 1, C.brickRedShade);
	rect(canvas, 0, ARCADE + 3, 64, SQUARE - ARCADE - 3, C.cream);
	rect(canvas, 0, ARCADE + 3, 64, 1, C.creamShade);
	rect(canvas, 0, SQUARE - 1, 64, 1, C.creamShade);
	// Arches every eight columns, symmetrical about the centre, each with a lit keystone.
	for (let x0 = 2; x0 < 32; x0 += 8) {
		for (let y = ARCADE + 6; y < SQUARE - 1; y++) {
			for (let i = 0; i < 4; i++) {
				const corner = y === ARCADE + 6 && (i === 0 || i === 3);
				if (!corner) {
					pair(canvas, x0 + i, y, i === 0 ? C.roof : C.roofShade);
				}
			}
		}
		pair(canvas, x0 + 1, ARCADE + 5, C.creamLight);
		pair(canvas, x0 + 2, ARCADE + 5, C.creamLight);
		// A pilaster between the arches.
		for (let y = ARCADE + 5; y < SQUARE - 1; y++) {
			pair(canvas, x0 + 6, y, C.creamLight, C.creamShade);
		}
	}
}

/**
 * The plinth: two broad steps and a tall pedestal with a cornice, a recessed panel and a moulded base.
 * @param {Canvas} canvas
 */
function drawPlinth(canvas) {
	// The steps, lit on top.
	for (const [top, left, h] of [
		[57, 16, 4],
		[53, 19, 4],
	]) {
		for (let y = top; y < top + h; y++) {
			for (let x = left; x < 32; x++) {
				const lit = y === top;
				pair(
					canvas,
					x,
					y,
					lit ? C.stoneLight : x === left ? C.stoneLight : C.stone,
					lit ? C.stoneLight : x === left ? C.stoneShade : C.stoneMid
				);
			}
		}
	}
	// The pedestal, lit on its left edge.
	for (let y = 41; y < 53; y++) {
		for (let x = 23; x <= 40; x++) {
			set(
				canvas,
				x,
				y,
				x === 23 ? C.stoneLight : x >= 39 ? C.stoneShade : C.stone
			);
		}
	}
	// The cornice and the base moulding.
	for (let x = 21; x < 32; x++) {
		pair(canvas, x, 38, C.stoneLight);
		pair(canvas, x, 39, C.stone, C.stoneMid);
		pair(canvas, x, 40, C.stoneShade);
		pair(canvas, x + 1, 51, C.stoneLight, C.stoneMid);
		pair(canvas, x + 1, 52, C.stoneShade);
	}
	// A recessed panel on the pedestal's face: shadow along its top and left, light along its sill.
	for (let y = 43; y <= 49; y++) {
		for (let x = 26; x <= 37; x++) {
			let colour = C.stoneMid;
			if (y === 43 || x === 26) {
				colour = C.stoneShade;
			} else if (y === 49 || x === 37) {
				colour = C.stoneLight;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The scale: a fluted brass post on a flared foot, a level beam on a pivot, and a needle standing straight up over its index plate.
 * @param {Canvas} canvas
 */
function drawScale(canvas) {
	// The post and its foot.
	for (let y = BEAM + 2; y < 38; y++) {
		pair(canvas, 30, y, C.gold, C.amber);
		pair(canvas, 31, y, y % 4 === 0 ? C.amber : C.gold, C.brass);
	}
	for (const [y, half] of [
		[35, 3],
		[36, 4],
		[37, 5],
	]) {
		for (let x = 32 - half; x < 32; x++) {
			pair(canvas, x, y, y === 35 ? C.gold : C.amber, C.brass);
		}
	}
	// A knop halfway up the post.
	for (let x = 29; x < 32; x++) {
		pair(canvas, x, 26, C.gold, C.amber);
		pair(canvas, x, 27, C.amber, C.brass);
	}
	// The beam, tapering to a knob at each end.
	for (let x = PAN - 1; x < 32; x++) {
		const thick = x >= 24;
		pair(canvas, x, BEAM, C.gold, C.gold);
		pair(canvas, x, BEAM + 1, C.amber, C.brass);
		if (thick) {
			pair(canvas, x, BEAM - 1, C.lampGlow, C.gold);
			pair(canvas, x, BEAM + 2, C.brass, C.lampFrame);
		}
	}
	// The beam's end knobs.
	/** @type {[number, number, Colour][]} */
	const knob = [
		[-2, 0, C.gold],
		[-2, 1, C.amber],
		[-3, 0, C.lampGlow],
		[-3, 1, C.gold],
		[-2, -1, C.gold],
		[-2, 2, C.brass],
	];
	for (const [dx, dy, colour] of knob) {
		pair(canvas, PAN + dx, BEAM + dy, colour);
	}
	// The pivot: a round boss with a dark pin.
	paint(
		canvas,
		28,
		BEAM - 2,
		['.gggg.', 'gGGGGa', 'gGkkGa', 'gGkkGa', 'gaaaaa', '.bbbb.'],
		{ g: C.gold, G: C.lampGlow, a: C.amber, b: C.brass, k: C.lampFrame }
	);
	// The index plate behind the needle: a brass half-disc on the pivot.
	for (let y = 7; y < BEAM - 2; y++) {
		for (let x = 25; x < 32; x++) {
			if ((x - 31.5) ** 2 + (y - 13) ** 2 <= 36) {
				pair(
					canvas,
					x,
					y,
					y === 7 || x === 26 ? C.gold : C.brass,
					C.lampFrame
				);
			}
		}
	}
	// The needle, standing straight up from the pivot to the plate's top.
	for (let y = 5; y < BEAM - 2; y++) {
		set(canvas, 31, y, C.lampGlow);
		set(canvas, 32, y, C.amber);
	}
	set(canvas, 31, 4, C.lampGlow);
	set(canvas, 32, 4, C.gold);
	// The hooks the pans hang from.
	pair(canvas, PAN, BEAM + 2, C.brass);
	pair(canvas, PAN, BEAM + 3, C.brass);
	// The pans: wide shallow bowls.
	/** @type {[number, number, Colour][]} */
	const bowl = [
		[RIM, 7, C.gold],
		[RIM + 1, 6, C.amber],
		[RIM + 2, 4, C.brass],
	];
	for (const [y, half, colour] of bowl) {
		for (let x = PAN - half; x <= PAN + half; x++) {
			const shade = x > PAN + half - 2 ? C.brass : colour;
			pair(
				canvas,
				x,
				y,
				x === PAN - half && y === RIM ? C.lampGlow : shade
			);
		}
	}
}

/**
 * A bell-shaped iron weight with a bronze ring handle, standing on a pan.
 * @param {Canvas} canvas
 * @param {number} cx - The pan's centre column
 */
function drawWeight(canvas, cx) {
	paint(
		canvas,
		cx - 3,
		RIM - 7,
		[
			'..aaa..',
			'..a.a..',
			'..GGa..',
			'.GgggA.',
			'.ggggA.',
			'Gggggba',
			'GggggbA',
		],
		{
			a: C.lampFrame,
			G: C.lampGlow,
			g: C.stoneLight,
			A: C.stone,
			b: C.stoneMid,
		}
	);
}

/**
 * Three chains from a beam end's hook to its pan's rim, links in alternating brass and dark bronze.
 * @param {Canvas} canvas
 * @param {number} cx - The pan's centre column
 */
function drawChains(canvas, cx) {
	for (const dx of [-6, 0, 6]) {
		line(canvas, cx, BEAM + 4, cx + dx, RIM - 1, C.brass);
	}
	for (let y = BEAM + 5; y < RIM; y += 2) {
		for (let x = cx - 7; x <= cx + 7; x++) {
			if (canvas.p[y * 64 + x] === C.brass) {
				set(canvas, x, y, C.lampFrame);
			}
		}
	}
}

/**
 * Two pigeons on the paving, one on each side, facing each other.
 * @param {Canvas} canvas
 */
function drawPigeons(canvas) {
	const rows = [
		'.....hh.',
		'.....hkb',
		'tt..nmh.',
		'.tGGGgg.',
		'..gggss.',
		'...f.f..',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		h: C.stoneLight,
		k: C.ink,
		b: C.stoneShade,
		n: C.pineLight,
		m: C.railLight,
		t: C.stoneShade,
		G: C.stoneLight,
		g: C.stone,
		s: C.stoneShade,
		f: C.brickRedLight,
	};
	paint(canvas, 5, 56, rows, colours);
	paint(canvas, 51, 56, rows, colours, { mirror: true });
}
