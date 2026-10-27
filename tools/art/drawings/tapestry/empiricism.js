// Empiricism: a sunlit experiment bench, a flask bubbling over a burner beside a balance and an open notebook.
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

/** The floor's first row and the bench top's row. */
const FLOOR = 47;
const BENCH = 41;

/** The window's box, frame included. */
const WINDOW = { x: 45, y: 3, w: 16, h: 19 };

/** Clear glass: lit, plain and shaded. */
const GLASS = [C.white, C.daySky6, C.daySky5];

/**
 * Draws the Empiricism scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(83);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'stone',
		window: { ...WINDOW, time: 'day' },
	});
	warmTheWalls(layer);
	drawSunbeam(layer);

	// The wall shelf hangs behind the bench, so it gets its own outline.
	const shelf = createCanvas(64, 64);
	drawShelf(shelf);
	outline(shelf, C.ink);

	drawBench(scene);
	drawFlask(scene);
	drawConicalFlask(scene);
	drawBalance(scene);
	drawNotebook(scene);
	outline(scene, C.ink);
	underlay(scene, shelf);
	underlay(scene, layer);
	drawBubbles(scene, random);
	drawBurnerFlame(scene);
	return scene;
}

/**
 * Paints a small sprite from rows of keys; dots and unknown keys are left alone.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {string[]} rows
 * @param {Record<string, Colour>} colours
 */
function paint(canvas, x, y, rows, colours) {
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(canvas, x + i, y + j, colours[key]);
			}
		});
	});
}

/**
 * Warms the grey stone into sunlit sandstone, leaving the window's panes alone.
 * @param {Canvas} layer
 */
function warmTheWalls(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pane =
				x > WINDOW.x &&
				x < WINDOW.x + WINDOW.w - 1 &&
				y > WINDOW.y &&
				y < WINDOW.y + WINDOW.h - 1;
			const colour = layer.p[y * 64 + x];
			if (!pane && colour) {
				set(layer, x, y, mix(colour, C.sand, y < FLOOR ? 0.45 : 0.25));
			}
		}
	}
}

/**
 * A shaft of sunlight falling from the window down and to the left across the wall.
 * @param {Canvas} layer
 */
function drawSunbeam(layer) {
	for (let y = WINDOW.y + WINDOW.h + 1; y < 64; y++) {
		const drop = y - (WINDOW.y + WINDOW.h);
		const from = WINDOW.x + 1 - drop;
		const to = WINDOW.x + WINDOW.w - 2 - drop;
		for (let x = from; x <= to; x++) {
			const behind = layer.p[y * 64 + x];
			if (behind && x >= 0) {
				set(layer, x, y, mix(behind, C.lampGlow, 0.35));
			}
		}
	}
}

/**
 * A plank shelf on the back wall, lined with jars of coloured powders and a mortar and pestle.
 * @param {Canvas} canvas
 */
function drawShelf(canvas) {
	const y = 13;
	const left = 20;
	const right = 42;
	rect(canvas, left, y, right - left + 1, 1, C.timberLight);
	rect(canvas, left, y + 1, right - left + 1, 1, C.timber);
	for (const x of [left + 2, right - 2]) {
		set(canvas, x, y + 2, C.timber);
		set(canvas, x, y + 3, C.timberShade);
	}
	/** @type {[number, Colour, Colour, number][]} */
	const jars = [
		[left + 1, C.brickRedLight, C.brickRed, 6],
		[left + 6, C.gold, C.amber, 5],
		[left + 11, C.railLight, C.roofLight, 7],
		[left + 18, C.grassLight, C.grass, 5],
	];
	for (const [x, light, main, h] of jars) {
		const top = y - h;
		// The lid, the glass and its contents.
		rect(canvas, x, top, 4, 1, C.timber);
		rect(canvas, x, top + 1, 4, h - 1, GLASS[1]);
		rect(canvas, x, top + 3, 4, h - 3, main);
		set(canvas, x, top + 3, light);
		set(canvas, x, top + 1, GLASS[0]);
	}
	// A stone mortar with its pestle leaning out.
	paint(canvas, left + 15, y - 4, ['..p', 'mpm', 'mMm', '.m.'], {
		p: C.timberLight,
		M: C.stoneLight,
		m: C.stone,
	});
}

/**
 * The workbench: a thick top lit along its edge, a front of drawers and stout legs.
 * @param {Canvas} scene
 */
function drawBench(scene) {
	rect(scene, 0, BENCH, 64, 1, C.timberLight);
	rect(scene, 0, BENCH + 1, 64, 2, C.timber);
	rect(scene, 0, BENCH + 3, 64, 7, C.timberShade);
	for (const x of [3, 23, 43]) {
		rect(scene, x, BENCH + 4, 17, 5, C.timber);
		rect(scene, x, BENCH + 4, 17, 1, C.timberLight);
		set(scene, x + 8, BENCH + 6, C.brass);
		set(scene, x + 9, BENCH + 6, C.brass);
	}
	for (const x of [1, 61]) {
		rect(scene, x, BENCH + 10, 2, 64 - BENCH - 10, C.timber);
	}
}

/**
 * The hero of the bench: a big round-bottomed flask of green liquid on a tripod over a burner.
 * @param {Canvas} scene
 */
function drawFlask(scene) {
	const cx = 14;
	const cy = 29;
	const r = 6.6;
	// The tripod and the burner under it.
	rect(scene, cx - 6, 36, 13, 1, C.stoneShade);
	for (const [x0, step] of [
		[cx - 5, -1],
		[cx + 5, 1],
	]) {
		set(scene, x0, 37, C.stoneShade);
		set(scene, x0, 38, C.stoneShade);
		set(scene, x0, 39, C.stoneShade);
		set(scene, x0 + step, 40, C.stoneShade);
	}
	paint(scene, cx - 2, 38, ['.bbb.', 'BBBBB', 'BBBBb'], {
		b: C.brass,
		B: C.lampFrame,
	});
	// The bulb: glass above the liquid, the liquid below, lit from the window on the right.
	for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
		for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r) {
				continue;
			}
			const liquid = y >= cy - 2;
			const rim = d > r - 1.2;
			let colour;
			if (liquid) {
				colour =
					y === cy - 2
						? C.grassLight
						: x < cx - 3 || rim
							? C.pine
							: C.pineLight;
			} else {
				colour = rim ? GLASS[2] : GLASS[1];
			}
			set(scene, x, y, colour);
		}
	}
	// A highlight on the glass where the sun catches it.
	set(scene, cx + 3, cy - 4, GLASS[0]);
	set(scene, cx + 4, cy - 3, GLASS[0]);
	set(scene, cx + 4, cy + 1, C.grassLight);
	// Bubbles inside the liquid.
	for (const [x, y] of [
		[cx - 1, cy + 3],
		[cx + 2, cy + 1],
		[cx - 3, cy],
		[cx + 1, cy + 4],
	]) {
		set(scene, x, y, C.grassLight);
	}
	// The long neck and its lip.
	rect(scene, cx - 1, cy - 14, 3, 8, GLASS[1]);
	set(scene, cx + 1, cy - 12, GLASS[0]);
	set(scene, cx + 1, cy - 11, GLASS[0]);
	rect(scene, cx - 2, cy - 15, 5, 1, GLASS[2]);
	// Green froth climbing the neck.
	set(scene, cx, cy - 7, C.grassLight);
	set(scene, cx - 1, cy - 8, C.grassLight);
}

/**
 * A conical flask of blue liquid with a stopper, beside the big flask.
 * @param {Canvas} scene
 */
function drawConicalFlask(scene) {
	const cx = 26;
	for (let y = 29; y <= BENCH - 1; y++) {
		const half = y < 32 ? 1 : Math.min(5, 1 + Math.floor((y - 31) / 2));
		for (let x = cx - half; x <= cx + half; x++) {
			const liquid = y >= 35;
			let colour = liquid ? C.dayWaveDeep : GLASS[1];
			if (x === cx + half) {
				colour = liquid ? C.daySea2 : GLASS[2];
			} else if (x === cx - half + 1 && y > 31) {
				colour = liquid ? C.dayWave : GLASS[0];
			}
			if (y === 35) {
				colour = C.dayWave;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, cx - 1, 27, 3, 2, C.timber);
	set(scene, cx - 1, 27, C.timberLight);
}

/**
 * A brass balance: a pillar on a foot, a tilted beam, and two pans on chains, the left one weighed down.
 * @param {Canvas} scene
 */
function drawBalance(scene) {
	const cx = 42;
	// The foot and the pillar.
	rect(scene, cx - 4, BENCH - 2, 9, 2, C.lampFrame);
	rect(scene, cx - 4, BENCH - 2, 9, 1, C.brass);
	rect(scene, cx, 23, 2, BENCH - 25, C.brass);
	set(scene, cx, 23, C.gold);
	set(scene, cx, 22, C.gold);
	set(scene, cx + 1, 22, C.gold);
	// The beam, lower on the left.
	for (let x = cx - 8; x <= cx + 9; x++) {
		const y = 24 + Math.round((cx - x) * 0.18);
		set(scene, x, y, x < cx ? C.gold : C.amber);
	}
	// The pans hang on chains from the beam's ends.
	/** @type {[number, number, Colour][]} */
	const pans = [
		[cx - 8, 9, C.stoneShade],
		[cx + 9, 6, C.brickRedLight],
	];
	for (const [end, depth, load] of pans) {
		const top = 24 + Math.round((cx - end) * 0.18) + 1;
		for (let y = top; y < top + depth; y++) {
			set(scene, end - 2 + Math.floor((y - top) / depth), y, C.brass);
			set(scene, end + 2 - Math.floor((y - top) / depth), y, C.brass);
		}
		const pan = top + depth;
		rect(scene, end - 3, pan, 7, 1, C.gold);
		rect(scene, end - 2, pan + 1, 5, 1, C.amber);
		// A weight, or a small red sample, sitting in the pan.
		rect(scene, end - 1, pan - 2, 3, 2, load);
		set(scene, end - 1, pan - 2, load === C.stoneShade ? C.stone : C.white);
	}
}

/**
 * An open notebook lying in the sunlight at the bench's end, a pencil across it.
 * @param {Canvas} scene
 */
function drawNotebook(scene) {
	const left = 51;
	const right = 62;
	rect(scene, left, BENCH - 1, right - left + 1, 1, C.brickRedShade);
	for (let x = left + 1; x <= right - 1; x++) {
		const gutter = x === 56 || x === 57;
		for (let y = BENCH - 4; y <= BENCH - 2; y++) {
			set(
				scene,
				x,
				y,
				gutter ? C.cream : x < 56 ? C.creamLight : C.white
			);
		}
	}
	// A pencil lying across the right page.
	for (let i = 0; i < 6; i++) {
		set(scene, 57 + i, BENCH - 3 - Math.floor(i / 3), C.gold);
	}
	set(scene, 56, BENCH - 3, C.wood);
}

/**
 * Bubbles rising out of the big flask's neck, and a wisp of steam.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBubbles(scene, random) {
	/** @type {[number, number, boolean][]} */
	const bubbles = [
		[14, 12, true],
		[16, 8, false],
		[12, 6, true],
		[15, 3, false],
	];
	for (const [x, y, big] of bubbles) {
		const jitter = Math.floor(random() * 2);
		const bx = x + jitter;
		if (big) {
			paint(scene, bx - 1, y - 1, ['.b.', 'bwb', '.b.'], {
				b: C.grassLight,
				w: C.white,
			});
		} else {
			set(scene, bx, y, C.white);
		}
	}
}

/**
 * The burner's little flame under the flask.
 * @param {Canvas} scene
 */
function drawBurnerFlame(scene) {
	set(scene, 14, 37, C.lampGlow);
	set(scene, 13, 37, C.gold);
	set(scene, 15, 37, C.gold);
}
