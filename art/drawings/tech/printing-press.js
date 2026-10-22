// Printing Press: a wooden screw press in a sunlit workshop, its platen raised over a freshly printed sheet, an ink ball beside it.
import {
	createCanvas,
	set,
	rect,
	line,
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

/** The two upright cheeks of the frame: their left columns, top row and width. */
const CHEEKS = { left: 5, right: 53, top: 5, w: 6 };

/** The screw and the box (the hose) that guides the platen, centred on this column. */
const SCREW_X = 32;

/** The raised platen, hanging from the hose. */
const PLATEN = { x: 19, y: 27, w: 26, h: 4 };

/** The bed's top, seen from a little above, and the sheet lying on it. */
const BED = { x: 11, y: 36, w: 42, h: 10 };
const SHEET = { x: 21, y: 37, w: 22, h: 8 };

/** Where the ink ball stands on the bed. */
const BALL = { x: 44, y: 40 };

/** The wood of the frame: lit, plain and shaded. */
const WOOD = { light: C.timberLight, base: C.timber, shade: C.timberShade };

/** The leather of the ink ball, stained with ink underneath. */
const LEATHER = mix(C.timberLight, C.amber, 0.35);

/**
 * Draws the Printing Press tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4521);

	drawRoom(layer);

	drawFrame(scene, random);
	drawBed(scene);
	drawScrew(scene);
	drawPlaten(scene);
	drawBar(scene);
	drawInkBall(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: 0,
		y: 8,
		radius: 44,
		colour: C.lampGlow,
		strength: 0.22,
		steps: 3,
		skip: [C.ink],
	});
	drawSheet(scene, random);
	return scene;
}

/**
 * The workshop behind the press: a plaster wall over a darker dado, a patch of window light, and floorboards.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.plaster;
			if (y >= 54) {
				colour = y === 54 ? C.floorShade : C.floor;
			} else if (y >= 40) {
				colour = y === 40 ? C.plasterLight : C.plasterShade;
			} else if (x - y * 0.5 > 6 && x - y * 0.5 < 22 && y > 4) {
				// The window's light falling on the wall from the left.
				colour = C.plasterLight;
			}
			set(layer, x, y, colour);
		}
	}
	// A seam in the floorboards.
	for (let x = 0; x < 64; x++) {
		set(layer, x, 59, C.floorShade);
	}
}

/**
 * Fills a wooden beam lit from the upper left: a light top row and left column, a shaded right column and bottom row.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function beam(scene, x, y, w, h) {
	rect(scene, x, y, w, h, WOOD.base);
	rect(scene, x, y, w, 1, WOOD.light);
	rect(scene, x, y, 1, h, WOOD.light);
	rect(scene, x + w - 1, y + 1, 1, h - 1, WOOD.shade);
	rect(scene, x + 1, y + h - 1, w - 1, 1, WOOD.shade);
}

/**
 * The frame: the cap, the two cheeks, the head that holds the screw, the cross rail under the bed and the feet.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFrame(scene, random) {
	const { left, right, top, w } = CHEEKS;
	beam(scene, left, top, w, 52);
	beam(scene, right, top, w, 52);
	// A little grain on the cheeks.
	for (const x0 of [left, right]) {
		for (let i = 0; i < 4; i++) {
			const x = x0 + 2 + Math.floor(random() * (w - 3));
			const y = top + 4 + Math.floor(random() * 40);
			rect(scene, x, y, 1, 3 + Math.floor(random() * 4), WOOD.shade);
		}
	}
	// The cap on top, overhanging the cheeks.
	beam(scene, 2, 1, 60, 4);
	// The head, through which the screw turns.
	beam(scene, 3, 7, 58, 6);
	// Pegs where the head is wedged into the cheeks.
	for (const x of [left + 2, right + 2]) {
		rect(scene, x, 9, 2, 2, C.timberShade);
		set(scene, x, 9, C.timberLight);
	}
	// The rail under the bed and the feet on the floor.
	beam(scene, 3, 51, 58, 4);
	beam(scene, 1, 57, 62, 4);
}

/**
 * The bed: a long table between the cheeks, its top seen from above and its front face in shade.
 * @param {Canvas} scene
 */
function drawBed(scene) {
	const { x, y, w, h } = BED;
	// The frame of the coffin round the stone.
	rect(scene, x, y, w, h, C.timberLight);
	rect(scene, x + 2, y + 1, w - 4, h - 2, C.stoneMid);
	rect(scene, x + 2, y + 1, w - 4, 1, C.stoneShade);
	// The front face.
	rect(scene, x, y + h, w, 4, C.timberShade);
	rect(scene, x, y + h, w, 1, C.timber);
}

/**
 * The fresh sheet: cream paper with ruled grey lines of print, and the platen's shadow along its back edge.
 * It is painted after the glow, so the paper stays crisp.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSheet(scene, random) {
	const { x, y, w, h } = SHEET;
	rect(scene, x, y, w, h, C.creamLight);
	rect(scene, x + w - 1, y, 1, h, C.cream);
	rect(scene, x, y + h - 1, w, 1, C.cream);
	// The shadow of the raised platen, cast down and to the right.
	rect(scene, x + 6, y, w - 6, 1, C.creamShade);
	// The lines of print, each broken into words of different lengths.
	for (let row = y + 2; row < y + h - 1; row += 2) {
		const end = x + w - 3 - (row === y + h - 2 ? 8 : 0);
		let col = x + 2;
		while (col < end) {
			const word = 2 + Math.floor(random() * 5);
			for (let k = 0; k < word && col + k < end; k++) {
				set(scene, col + k, row, C.stone);
			}
			col += word + 1;
		}
	}
}

/**
 * The great screw coming down from the head, its iron thread winding round it, and the wooden hose below.
 * @param {Canvas} scene
 */
function drawScrew(scene) {
	const x0 = SCREW_X - 4;
	for (let y = 13; y < 23; y++) {
		for (let x = x0; x < x0 + 8; x++) {
			// The thread slopes down to the right, one turn every three rows.
			const thread = (y * 3 - (x - x0)) % 9 < 3;
			let colour = C.stone;
			if (x - x0 <= 2) {
				colour = C.stoneLight;
			} else if (x - x0 >= 6) {
				colour = C.stoneShade;
			}
			if (thread) {
				colour = x - x0 <= 2 ? C.stone : C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The hose: the box that keeps the platen level.
	beam(scene, SCREW_X - 6, 22, 12, 5);
	rect(scene, SCREW_X - 1, 23, 2, 2, C.stoneShade);
}

/**
 * The platen: a flat iron block, raised clear of the sheet.
 * @param {Canvas} scene
 */
function drawPlaten(scene) {
	const { x, y, w, h } = PLATEN;
	rect(scene, x, y, w, h, C.stone);
	rect(scene, x, y, w, 1, C.stoneLight);
	rect(scene, x, y + h - 1, w, 1, C.stoneShade);
	rect(scene, x + w - 1, y, 1, h, C.stoneShade);
	// Two hooks tying it to the hose.
	for (const hx of [SCREW_X - 5, SCREW_X + 4]) {
		set(scene, hx, y - 1, C.stoneShade);
	}
}

/**
 * The bar: an iron lever from the screw out past the right cheek, with a worn wooden grip.
 * @param {Canvas} scene
 */
function drawBar(scene) {
	line(scene, SCREW_X + 6, 23, 56, 19, C.stone);
	line(scene, SCREW_X + 6, 24, 56, 20, C.stoneShade);
	line(scene, SCREW_X + 6, 22, 52, 19, C.stoneLight);
	// The grip, angled up towards the pressman.
	for (let i = 0; i < 6; i++) {
		set(scene, 56 + i, 19 - i, C.timberLight);
		set(scene, 57 + i, 19 - i, C.timber);
		set(scene, 56 + i, 20 - i, C.timberShade);
	}
}

/**
 * The ink ball: a stuffed leather pad, blackened with ink underneath, on a turned wooden handle.
 * @param {Canvas} scene
 */
function drawInkBall(scene) {
	const { x, y } = BALL;
	// The handle and its knob.
	rect(scene, x + 3, y - 6, 2, 6, C.timber);
	rect(scene, x + 3, y - 6, 1, 6, C.timberLight);
	rect(scene, x + 2, y - 8, 4, 2, C.timberLight);
	rect(scene, x + 4, y - 7, 2, 1, C.timber);
	// The pad: a low leather dome, black with ink where it meets the type.
	paint(
		scene,
		x,
		y,
		['...hhLs..', '.hhLLLLs.', 'hLLLLLLss', 'LLLLLLsss', 'kkkkkkkkk'],
		{ h: C.brass, L: LEATHER, s: C.lampFrame, k: C.wood }
	);
	// The collar where the leather is tied round the handle.
	rect(scene, x + 2, y, 4, 1, C.wood);
}
