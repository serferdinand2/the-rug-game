// Artistic Inspiration: a sculptor with mallet and chisel freeing a marble figure from its block in a sunlit studio.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row. */
const FLOOR = 46;

/** The studio window's box, frame included. */
const WINDOW = { x: 2, y: 3, w: 21, h: 27 };

/** The statue's top-left corner. */
const STATUE = { x: 34, y: 5 };

/** How far the sunbeam moves right for each row it falls. */
const SLOPE = 0.85;

/**
 * The carved figure, top row first: one hand resting on its head, carved down to the knees,
 * where it sinks into the rough block. m marble.
 */
const FIGURE = [
	'........mmm...........',
	'......mmmmmm..........',
	'....mmmmmmmmm.........',
	'...mm..mmmmmmm........',
	'..mm...mmmmmmm........',
	'..mm...mmmmmmm........',
	'..mm...mmmmmmm........',
	'..mm...mmmmmmm........',
	'..mm....mmmmm.........',
	'..mm.....mmm..........',
	'..mm.....mmm..........',
	'..mmm..mmmmmmmmm......',
	'...mmmmmmmmmmmmmmm....',
	'...mmmmmmmmmmmmmmmm...',
	'....mmmmmmmmmmmmmmm...',
	'.....mmmmmmmmmmm.mm...',
	'.....mmmmmmmmmmm.mm...',
	'.....mmmmmmmmmmm.mm...',
	'.....mmmmmmmmmmm.mm...',
	'......mmmmmmmmm..mm...',
	'......mmmmmmmmm..mm...',
	'......mmmmmmmmm..mm...',
	'......mmmmmmmmmm.mm...',
	'.....mmmmmmmmmmm.mmm..',
	'.....mmmmmmmmmmmmmmm..',
	'.....mmmmmmmmmmmm.m...',
	'.....mmmmmmmmmmmm.....',
	'.....mmmmm.mmmmmm.....',
	'.....mmmmm..mmmmm.....',
	'......mmmm..mmmm......',
	'......mmmm..mmmm......',
	'......mmmm..mmmm......',
	'......mmmm..mmmm......',
	'......mmmm..mmmm......',
	'......mmm...mmm.......',
];

/**
 * The rough block's top row in each of the statue's columns: the stone still standing behind the figure,
 * rising round its hips in jagged chunks, and the front of the block still hiding its shins.
 */
const BACK_TOP = [
	24, 22, 21, 21, 22, 24, 25, 26, 26, 26, 26, 26, 26, 26, 26, 25, 24, 22, 20,
	19, 20, 22,
];
const FRONT_TOP = [
	33, 33, 34, 35, 35, 35, 36, 35, 35, 36, 36, 36, 35, 35, 36, 36, 35, 34, 33,
	33, 33, 34,
];

/** The statue's last row, and the first column of the block's shaded right side. */
const STATUE_ROWS = 54;
const SIDE = 18;

/**
 * The sculptor, facing right: the mallet raised behind the head, the chisel held to the block.
 * M mallet head, m its shade, w handle, H hair, S skin, s skin shade, e eye, T tunic, t tunic shade,
 * A apron, a apron shade, g chisel, L legs, B boots.
 */
const SCULPTOR = [
	'.MMm..........',
	'MMMMm.........',
	'MMMMm.........',
	'.MMm..........',
	'..w...........',
	'..w...........',
	'..ww..HHH.....',
	'...w.HHHHH....',
	'...S.HHSSSS...',
	'...SSHHSSeS...',
	'....SHSSSSs...',
	'....STSSSs....',
	'....TTTTTTT...',
	'....TTTTTTTTT.',
	'....TAAAATTSSg',
	'....tAAAAtt...',
	'....tAAAAt....',
	'....tAAAAt....',
	'....taAAAt....',
	'....taAAAa....',
	'.....aAAAa....',
	'.....LL.LL....',
	'.....LL.LL....',
	'.....LL.LL....',
	'.....LL.LL....',
	'....BBB.BBB...',
];

/**
 * Draws the Artistic Inspiration scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2203);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'plaster',
		window: { ...WINDOW, time: 'day' },
	});
	coolTheWall(layer);
	drawGlazing(layer);
	drawSketch(layer);
	drawSunbeam(layer);
	drawMotes(layer, random);

	drawStatue(scene);
	paint(scene, 20, 61 - SCULPTOR.length + 1, SCULPTOR, {
		M: C.timberLight,
		m: C.timber,
		w: C.timberShade,
		H: C.wood,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		T: C.pine,
		t: C.pineShade,
		A: C.timberLight,
		a: C.timber,
		g: C.stoneLight,
		L: C.roof,
		B: C.wood,
	});
	outline(scene, C.ink);
	underlay(scene, layer);
	drawFace(scene);
	drawDust(scene);
	drawChips(scene, random);
	return scene;
}

/**
 * Tells whether a point lies in the shaft of sunlight falling from the window towards the statue.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inBeam(x, y) {
	const top = WINDOW.y + 2;
	if (y < top) {
		return false;
	}
	const shift = (y - top) * SLOPE;
	return x >= WINDOW.x + 1 + shift && x <= WINDOW.x + WINDOW.w - 2 + shift;
}

/**
 * Washes the plaster a cool grey, so the white marble stands out from it, and leaves the panes alone.
 * @param {Canvas} layer
 */
function coolTheWall(layer) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			const pane =
				x > WINDOW.x &&
				x < WINDOW.x + WINDOW.w - 1 &&
				y > WINDOW.y &&
				y < WINDOW.y + WINDOW.h - 1;
			const colour = get(layer, x, y);
			if (!pane && colour) {
				set(layer, x, y, mix(colour, C.stoneMid, 0.6));
			}
		}
	}
}

/**
 * Extra glazing bars that turn the window into a tall studio light of many small panes.
 * @param {Canvas} layer
 */
function drawGlazing(layer) {
	const { x, y, w, h } = WINDOW;
	for (const bx of [x + 5, x + 15]) {
		rect(layer, bx, y + 1, 1, h - 2, C.timber);
	}
	for (const by of [y + 7, y + 20]) {
		rect(layer, x + 1, by, w - 2, 1, C.timber);
	}
}

/**
 * A red-chalk study of the statue's pose, pinned to the wall beside the window.
 * @param {Canvas} layer
 */
function drawSketch(layer) {
	const x = 25;
	const y = 8;
	rect(layer, x, y, 7, 10, C.creamLight);
	rect(layer, x + 6, y, 1, 10, C.cream);
	rect(layer, x, y + 9, 7, 1, C.cream);
	set(layer, x + 3, y, C.brickRed);
	// A few sanguine strokes: a head, a raised arm and a body.
	paint(
		layer,
		x + 1,
		y + 2,
		['r.rr.', 'r.rr.', '.rrrr', '..rr.', '..rr.', '.r..r'],
		{ r: mix(C.brickRedLight, C.cream, 0.35) }
	);
}

/**
 * The shaft of sunlight: it brightens the wall beside the window and the floor where it falls.
 * @param {Canvas} layer
 */
function drawSunbeam(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pane = x < WINDOW.x + WINDOW.w && y < WINDOW.y + WINDOW.h + 1;
			const behind = get(layer, x, y);
			if (behind && !pane && inBeam(x, y)) {
				set(layer, x, y, mix(behind, C.lampGlow, 0.45));
			}
		}
	}
}

/**
 * Specks of marble dust drifting in the sunbeam.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMotes(layer, random) {
	for (let i = 0; i < 90; i++) {
		const x = 23 + Math.floor(random() * 30);
		const y = 6 + Math.floor(random() * 50);
		if (inBeam(x - 2, y) && inBeam(x + 2, y)) {
			set(layer, x, y, random() > 0.5 ? C.white : C.lampGlow);
		}
	}
}

/**
 * The statue: the carved figure lit from the window on the left, stepping out of a rough block that
 * still stands behind its hips and hides its shins. Where the sunbeam crosses it, it warms.
 * @param {Canvas} scene
 */
function drawStatue(scene) {
	/**
	 * Tells whether a point of the statue shows the carved figure.
	 * @param {number} i
	 * @param {number} j
	 * @returns {boolean}
	 */
	const carved = (i, j) =>
		FIGURE[j]?.[i] === 'm' && j < (FRONT_TOP[i] ?? Infinity);
	for (let j = 0; j <= STATUE_ROWS; j++) {
		for (let i = 0; i < BACK_TOP.length; i++) {
			const x = STATUE.x + i;
			const y = STATUE.y + j;
			let colour;
			if (carved(i, j)) {
				let left = 0;
				while (carved(i - left - 1, j) && left < 3) {
					left++;
				}
				let right = 0;
				while (carved(i + right + 1, j) && right < 3) {
					right++;
				}
				colour = C.creamLight;
				if (left <= 1) {
					colour = C.white;
				} else if (right === 0) {
					colour = C.creamShade;
				} else if (right <= 2) {
					colour = C.cream;
				}
			} else if (j >= FRONT_TOP[i] || j >= BACK_TOP[i]) {
				colour = blockColour(i, j, j >= FRONT_TOP[i]);
				// The figure casts a shadow on the stone to its right.
				if (
					j < FRONT_TOP[i] &&
					(carved(i - 1, j) || carved(i - 2, j))
				) {
					colour = C.stoneMid;
				} else if (j < FRONT_TOP[i] && carved(i + 1, j)) {
					colour = C.stone;
				}
			} else {
				continue;
			}
			set(
				scene,
				x,
				y,
				inBeam(x, y) ? mix(colour, C.lampGlow, 0.3) : colour
			);
		}
	}
}

/**
 * The colour of one pixel of the rough block: lit chunk tops, faces scored by the tooth chisel,
 * greyer towards the floor, and a shaded right side.
 * @param {number} i - The column within the statue
 * @param {number} j - The row within the statue
 * @param {boolean} front - Whether it is the front of the block, nearer than the figure
 * @returns {Colour}
 */
function blockColour(i, j, front) {
	const top = front ? FRONT_TOP : BACK_TOP;
	if (j === top[i] || (i > 0 && j < top[i - 1] && j >= top[i])) {
		return i >= SIDE ? C.stoneLight : C.creamLight;
	}
	if (i >= SIDE) {
		return (i + j) % 5 === 0 ? C.stoneMid : C.stone;
	}
	if (i === 0) {
		return C.cream;
	}
	if (i === SIDE - 1) {
		return C.stoneLight;
	}
	if ((i + j) % 4 === 0 && j % 3 !== 0) {
		return C.stone;
	}
	return j > 46 ? C.stoneLight : mix(C.creamShade, C.stoneLight, 0.6);
}

/**
 * The figure's face, hair and the grooves that model its body, cut after the outline so they stay fine.
 * @param {Canvas} scene
 */
function drawFace(scene) {
	const { x, y } = STATUE;
	// Curls along the hairline.
	for (const [i, j] of [
		[8, 3],
		[10, 3],
		[12, 3],
		[9, 4],
		[11, 4],
		[13, 4],
	]) {
		set(scene, x + i, y + j, C.creamShade);
	}
	// Eyes under the brow, the nose's shade and the mouth.
	set(scene, x + 9, y + 6, C.stone);
	set(scene, x + 12, y + 6, C.stone);
	set(scene, x + 11, y + 7, C.creamShade);
	set(scene, x + 10, y + 9, C.creamShade);
	// The chest, the arm against the body, and the navel.
	rect(scene, x + 8, y + 15, 2, 1, C.creamShade);
	rect(scene, x + 11, y + 15, 2, 1, C.creamShade);
	set(scene, x + 10, y + 21, C.creamShade);
	for (let j = 15; j <= 23; j++) {
		set(scene, x + 15, y + j, C.creamShade);
	}
}

/**
 * A puff of marble dust where the chisel bites into the block.
 * @param {Canvas} scene
 */
function drawDust(scene) {
	/** @type {[number, number, Colour][]} */
	const puff = [
		[33, 46, C.white],
		[34, 45, C.creamLight],
		[33, 44, C.white],
		[35, 43, C.creamLight],
		[32, 42, C.white],
		[34, 41, C.cream],
		[35, 48, C.creamLight],
		[33, 49, C.cream],
	];
	for (const [x, y, colour] of puff) {
		set(scene, x, y, colour);
	}
}

/**
 * Marble chips and drifts of dust on the floorboards around the block.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawChips(scene, random) {
	for (let x = 30; x < 62; x++) {
		const y = 59 + Math.floor(random() * 4);
		if (random() > 0.55) {
			set(scene, x, y, random() > 0.5 ? C.creamLight : C.cream);
		}
	}
	for (const [x, y] of [
		[28, 62],
		[31, 60],
		[57, 61],
		[60, 63],
		[13, 62],
	]) {
		set(scene, x, y, C.white);
		set(scene, x + 1, y, C.creamShade);
	}
}
