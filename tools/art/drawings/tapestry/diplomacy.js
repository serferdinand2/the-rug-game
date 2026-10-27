// Diplomacy: two envoys bowing to each other across a green table, a sealed treaty between their pennants.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row, the table top's first row, and the table's ends. */
const FLOOR = 45;
const TABLE = 37;
const LEFT = 20;
const RIGHT = 43;

/**
 * Draws the Diplomacy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(72);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'plaster',
		window: { x: 23, y: 4, w: 18, h: 19, time: 'day' },
	});
	drawSunPatch(layer);

	// The curtains hang on the wall behind the table, so they get their own outline.
	const curtains = createCanvas(64, 64);
	drawCurtains(curtains);
	drawPainting(curtains, 3, 'hills');
	drawPainting(curtains, 50, 'sea');
	outline(curtains, C.ink);

	drawTable(scene);
	drawTreaty(scene);
	drawPennant(scene, LEFT + 2, 'right', [C.nightWave, C.nightSea1], C.gold);
	drawPennant(scene, RIGHT - 2, 'left', [C.gold, C.amber], C.roof);
	drawEnvoy(scene, 1, 'right', {
		L: C.nightWave,
		R: C.nightSea1,
		D: C.nightSea2,
		K: C.roof,
		k: C.roofShade,
	});
	drawEnvoy(scene, 43, 'left', {
		L: C.gold,
		R: C.amber,
		D: mix(C.amber, C.brickRedShade, 0.55),
		K: C.brickRed,
		k: C.brickRedShade,
	});
	outline(scene, C.ink);
	underlay(scene, curtains);
	underlay(scene, layer);
	return scene;
}

/**
 * Paints a sprite from rows of keys, mirrored when it faces left; dots and unknown keys are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 * @param {boolean} [mirror] - Flip the sprite left to right
 */
function paint(canvas, x, y, rows, colours, mirror = false) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			const col = mirror ? line.length - 1 - i : i;
			if (colours[key]) {
				set(canvas, x + col, y + j, colours[key]);
			}
		});
	});
}

/**
 * Daylight from the window lying in a bright patch on the floorboards.
 * @param {Canvas} layer
 */
function drawSunPatch(layer) {
	for (let y = FLOOR + 2; y < 64; y++) {
		const half = 9 + Math.floor((y - FLOOR) / 3);
		for (let x = 32 - half; x < 32 + half; x++) {
			const behind = layer.p[y * 64 + x];
			if (behind) {
				set(layer, x, y, mix(behind, C.lampGlow, 0.22));
			}
		}
	}
}

/**
 * Heavy wine-red curtains drawn back either side of the window, on a gold rod with gold tie-backs.
 * @param {Canvas} canvas
 */
function drawCurtains(canvas) {
	rect(canvas, 17, 2, 30, 1, C.gold);
	set(canvas, 16, 2, C.amber);
	set(canvas, 47, 2, C.amber);
	/** @type {[number, number, 'left' | 'right'][]} */
	const sides = [
		[18, 25, 'left'],
		[39, 46, 'right'],
	];
	for (const [from, to, tieSide] of sides) {
		for (let y = 3; y <= 30; y++) {
			// Gathered in at the tie-back, falling out wider below it.
			const pinch = y > 15 && y < 22 ? (y === 18 || y === 19 ? 3 : 2) : 0;
			const a = tieSide === 'left' ? from : from + pinch;
			const b = tieSide === 'left' ? to - pinch : to;
			for (let x = a; x <= b; x++) {
				const fold = (x - from) % 3;
				const colour =
					fold === 0
						? C.brickRedLight
						: fold === 1
							? C.brickRed
							: C.brickRedShade;
				set(canvas, x, y, colour);
			}
		}
		const tieX = tieSide === 'left' ? from : to - 4;
		rect(canvas, tieX, 18, 5, 1, C.gold);
		rect(canvas, tieX, 19, 5, 1, C.amber);
	}
}

/**
 * A small landscape painting in a gilt frame, hung on the wall.
 * @param {Canvas} canvas
 * @param {number} x - The frame's left column
 * @param {'hills' | 'sea'} view - What the painting shows
 */
function drawPainting(canvas, x, view) {
	const y = 9;
	const w = 11;
	const h = 9;
	rect(canvas, x, y, w, h, C.amber);
	rect(canvas, x, y, w, 1, C.gold);
	rect(canvas, x, y, 1, h, C.gold);
	for (let j = 1; j < h - 1; j++) {
		for (let i = 1; i < w - 1; i++) {
			let colour = j < 4 ? C.daySky4 : C.daySky5;
			if (view === 'hills') {
				const hill = 5 + Math.round(Math.sin(i * 0.9) * 1.2);
				if (j >= hill) {
					colour = j === hill ? C.grassLight : C.grass;
				}
			} else if (j >= 5) {
				colour = j === 5 ? C.daySeaLine : C.daySea2;
			} else if (j === 4 && i >= 5 && i <= 7) {
				colour = C.gold;
			}
			set(canvas, x + i, y + j, colour);
		}
	}
}

/**
 * The long table: a lit top and a green cloth falling to a gold fringe, its legs below.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	rect(scene, LEFT, TABLE, RIGHT - LEFT + 1, 1, C.forestFloorLight);
	rect(scene, LEFT, TABLE + 1, RIGHT - LEFT + 1, 2, C.forestFloor);
	for (let y = TABLE + 3; y <= TABLE + 11; y++) {
		for (let x = LEFT; x <= RIGHT; x++) {
			// Soft folds in the cloth.
			const fold = (x - LEFT) % 6;
			const colour =
				fold === 0
					? C.forestFloorLight
					: fold >= 4
						? C.forestFloorShade
						: C.forestFloor;
			set(scene, x, y, colour);
		}
	}
	for (let x = LEFT; x <= RIGHT; x++) {
		set(scene, x, TABLE + 12, x % 2 ? C.gold : C.amber);
	}
	for (const x of [LEFT + 2, RIGHT - 3]) {
		rect(scene, x, TABLE + 13, 2, 4, C.timber);
		set(scene, x + 1, TABLE + 13, C.timberShade);
	}
}

/**
 * The treaty: an unrolled parchment lying on the table, its red wax seal hanging over the front edge on a ribbon.
 * @param {Canvas} scene
 */
function drawTreaty(scene) {
	const left = 26;
	const right = 37;
	rect(scene, left + 1, TABLE - 1, right - left - 1, 1, C.cream);
	rect(scene, left + 1, TABLE, right - left - 1, 2, C.creamLight);
	rect(scene, left + 1, TABLE + 2, right - left - 1, 1, C.cream);
	// The rolled ends.
	for (const x of [left, right]) {
		rect(scene, x, TABLE - 2, 1, 5, C.creamShade);
	}
	set(scene, left, TABLE - 2, C.cream);
	set(scene, right, TABLE - 2, C.cream);
	// The ribbon and the seal.
	const cx = 32;
	for (const [x, y] of [
		[cx - 1, TABLE + 3],
		[cx - 1, TABLE + 4],
		[cx + 1, TABLE + 3],
		[cx + 1, TABLE + 4],
	]) {
		set(scene, x, y, C.gold);
	}
	paint(scene, cx - 2, TABLE + 5, ['.rrr.', 'rRrrr', 'rrrrs', '.rss.'], {
		R: C.brickRedLight,
		r: C.brickRed,
		s: C.brickRedShade,
	});
}

/**
 * A small swallowtail pennant on a stand at one end of the table.
 * @param {Canvas} scene
 * @param {number} pole - The pole's column
 * @param {'left' | 'right'} side - Which way the pennant flies from the pole
 * @param {[Colour, Colour]} field - The field's lit and main colours
 * @param {Colour} device - The colour of the square device near the pole
 */
function drawPennant(scene, pole, side, [lit, main], device) {
	rect(scene, pole, TABLE - 11, 1, 11, C.brass);
	set(scene, pole, TABLE - 12, C.gold);
	rect(scene, pole - 1, TABLE - 1, 3, 1, C.lampFrame);
	paint(
		scene,
		side === 'right' ? pole + 1 : pole - 7,
		TABLE - 11,
		['lllllll', 'mddmmm.', 'mddmm..', 'mmmmmm.', 'mmmmmmm'],
		{ l: lit, m: main, d: device },
		side === 'left'
	);
}

/**
 * The distance from a point to a line segment.
 * @param {number} px
 * @param {number} py
 * @param {[number, number]} a - The segment's start
 * @param {[number, number]} b - The segment's end
 * @returns {number}
 */
function toSegment(px, py, [ax, ay], [bx, by]) {
	const dx = bx - ax;
	const dy = by - ay;
	const t = Math.max(
		0,
		Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy))
	);
	return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}

/**
 * An envoy in a long robe and a soft cap, bowing deeply towards the table, one hand held out to it.
 * Drawn facing right on its own canvas, then copied in, mirrored when it faces left.
 * @param {Canvas} scene
 * @param {number} x - The figure's left column
 * @param {'left' | 'right'} facing
 * @param {Record<string, Colour>} robe - The robe's L, R, D colours and the cap's K, k colours
 */
function drawEnvoy(scene, x, facing, robe) {
	const fig = createCanvas(20, 36);
	const { L, R, D, K, k } = robe;
	/** @type {[number, number]} */
	const hip = [7, 21];
	/** @type {[number, number]} */
	const shoulder = [11, 13];
	const [hx, hy] = [14, 10];
	// The skirt, flaring from the hips to the hem.
	for (let y = 20; y <= 33; y++) {
		const t = (y - 20) / 13;
		const a = Math.round(4 - t * 3);
		const b = Math.round(10 + t * 2);
		for (let i = a; i <= b; i++) {
			set(fig, i, y, i === a ? L : i >= b - 1 ? D : R);
		}
	}
	rect(fig, 1, 34, 12, 1, C.gold);
	rect(fig, 10, 35, 3, 1, C.wood);
	// The torso, leaning forward from the hips, lit along the back.
	for (let y = 0; y < fig.h; y++) {
		for (let i = 0; i < fig.w; i++) {
			if (toSegment(i, y, hip, shoulder) <= 3.2) {
				const side = i - hip[0] + (y - hip[1]) * 0.45;
				set(fig, i, y, side < -1.8 ? L : side > 2 ? D : R);
			}
		}
	}
	// A gold belt across the hips.
	rect(fig, 4, 21, 7, 1, C.gold);
	// The arm hanging forward, the open hand held out towards the table.
	for (let y = 0; y < fig.h; y++) {
		for (let i = 0; i < fig.w; i++) {
			if (toSegment(i, y, [12, 14], [15, 21]) <= 1.1) {
				set(fig, i, y, D);
			}
		}
	}
	set(fig, 15, 21, C.gold);
	rect(fig, 16, 21, 2, 2, C.skin);
	set(fig, 17, 22, C.skinShade);
	// The head, bowed in front of the shoulders, with a white collar under the chin.
	for (let y = hy - 3; y <= hy + 3; y++) {
		for (let i = hx - 3; i <= hx + 3; i++) {
			if (Math.hypot(i - hx, y - hy) <= 2.7) {
				const hair = i - hx - (y - hy) < -1.5;
				const shade = i - hx + (y - hy) > 2;
				set(fig, i, y, hair ? C.wood : shade ? C.skinShade : C.skin);
			}
		}
	}
	set(fig, hx + 2, hy, C.ink);
	rect(fig, hx - 2, hy + 3, 2, 1, C.creamLight);
	set(fig, hx - 1, hy + 4, C.cream);
	// The soft cap on the bowed head, its brim tipped forward.
	rect(fig, hx - 2, hy - 4, 3, 1, K);
	rect(fig, hx - 3, hy - 3, 5, 1, K);
	set(fig, hx + 2, hy - 3, k);
	rect(fig, hx - 3, hy - 2, 7, 1, k);
	for (let y = 0; y < fig.h; y++) {
		for (let i = 0; i < fig.w; i++) {
			const colour = fig.p[y * fig.w + i];
			const col = facing === 'left' ? fig.w - 1 - i : i;
			set(scene, x + col, 61 - fig.h + 1 + y, colour);
		}
	}
}
