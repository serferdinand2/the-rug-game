// Revolution: a crowd with torches storming a street barricade at dusk, a flag waving from its top.
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
import { drawSkyline } from '../../parts/skyline.js';
import { drawSmoke } from '../../parts/smoke.js';
import { drawStreet } from '../../parts/street.js';
import { drawFigure } from '../../parts/figures.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The street's kerb row, and the barricade's summit. */
const STREET = 52;
const PEAK_X = 42;
const PEAK_Y = 30;

/** The flag bearer's feet, on the summit crate. */
const SUMMIT = PEAK_Y - 1;

/** The climbers on the barricade's slope: left column, clothes and whether they carry a torch. */
const CLIMBERS = [
	{ x: 13, clothes: C.amber, torch: true },
	{ x: 21, clothes: C.brickRed, torch: false },
	{ x: 29, clothes: C.daySea2, torch: true },
];

/**
 * Draws the Revolution scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(89);

	drawSky(layer, { time: 'dusk', horizon: STREET - 1, random });
	drawSkyline(layer, { base: STREET - 1, time: 'dusk', random, height: 16 });
	drawSmoke(layer, { x: 9, y: 38, tone: 'smoke', puffs: 4, drift: 1 });
	tintSmoke(layer);
	drawStreet(layer, { top: STREET });

	/** @type {[number, number][]} */
	const flames = [];
	drawBarricade(scene, random);
	drawClimbers(scene, flames);
	drawCrowd(scene, { x: 0, y: 61, count: 5, random, facing: 'right' });
	torch(scene, 4, 59, flames);
	drawFlagBearer(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	for (const [x, y] of flames) {
		drawFlame(scene, x, y);
	}
	return scene;
}

/**
 * Tints the smoke towards the dusk sky, so it hangs dim and heavy over the rooftops.
 * @param {Canvas} layer
 */
function tintSmoke(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		if (layer.p[i] === C.stoneLight) {
			layer.p[i] = mix(C.stoneLight, C.duskSky4, 0.45);
		} else if (layer.p[i] === C.stone) {
			layer.p[i] = mix(C.stone, C.duskSky2, 0.5);
		}
	}
}

/**
 * The top of the barricade's heap at a column: a steep slope up from the left, a shorter one down to the right.
 * @param {number} x
 * @returns {number} The row of the heap's top.
 */
function heapTop(x) {
	return x <= PEAK_X
		? Math.round(PEAK_Y + (PEAK_X - x) * 0.72)
		: Math.round(PEAK_Y + (x - PEAK_X) * 0.55);
}

/**
 * The barricade: a heap of crates, paving stones and planks, with a cart wheel, a barrel and beams jutting out.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBarricade(scene, random) {
	// Dark crevices fill the heap; everything else is piled over them.
	for (let x = 6; x < 64; x++) {
		for (let y = heapTop(x) + 1; y <= STREET + 1; y++) {
			set(scene, x, y, C.wood);
		}
	}
	// Paving stones torn up from the street, heaped along the slopes.
	for (let i = 0; i < 40; i++) {
		const w = 4 + Math.floor(random() * 3);
		const x = 6 + Math.floor(random() * 56);
		const top = heapTop(Math.min(63, x + 2)) + 1;
		const y = top + Math.floor(random() * Math.max(1, STREET - top - 1));
		block(scene, x, y, w, 3, [C.stoneLight, C.stone, C.stoneShade]);
	}
	beam(scene, 46, 32, 1, -1, 10);
	beam(scene, 26, 40, -1, -1, 7);
	// A painted door torn off its hinges, and crates.
	block(scene, 23, 39, 13, 5, [C.roofLight, C.roof, C.roofShade]);
	crate(scene, 30, 43, 8, 6);
	crate(scene, 37, PEAK_Y, 10, 7);
	drawBarrel(scene, 47, 34);
	drawWheel(scene, 57, 44);
}

/**
 * One block of the heap, lit along its top and shaded on its right and bottom.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} w - Width
 * @param {number} h - Height
 * @param {[Colour, Colour, Colour]} colours - Light, main and shade
 */
function block(scene, x, y, w, h, [light, main, shade]) {
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			const colour =
				j === 0 ? light : i === w - 1 || j === h - 1 ? shade : main;
			set(scene, x + i, y + j, colour);
		}
	}
}

/**
 * A wooden crate of upright boards.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} w - Width
 * @param {number} h - Height
 */
function crate(scene, x, y, w, h) {
	block(scene, x, y, w, h, [C.timberLight, C.timber, C.timberShade]);
	for (let i = 3; i < w - 1; i += 3) {
		for (let j = 1; j < h - 1; j++) {
			set(scene, x + i, y + j, C.timberShade);
		}
	}
	rect(scene, x, y + 1, 1, h - 1, C.timberLight);
}

/**
 * A wooden beam two pixels thick, running diagonally out of the heap.
 * @param {Canvas} scene
 * @param {number} x - Where it leaves the heap
 * @param {number} y
 * @param {number} dx - Sideways step, 1 or -1
 * @param {number} dy - Upward step, -1
 * @param {number} length
 */
function beam(scene, x, y, dx, dy, length) {
	for (let i = 0; i < length; i++) {
		const px = x + dx * i;
		const py = y + dy * Math.floor(i * 0.6);
		set(scene, px, py, C.timberLight);
		set(scene, px, py + 1, C.timber);
	}
}

/**
 * A cart wheel stood on edge: a rim, a hub and eight spokes.
 * @param {Canvas} scene
 * @param {number} cx - The hub's column
 * @param {number} cy - The hub's row
 */
function drawWheel(scene, cx, cy) {
	for (let y = cy - 6; y <= cy + 6; y++) {
		for (let x = cx - 6; x <= cx + 6; x++) {
			const d = (x - cx) ** 2 + (y - cy) ** 2;
			if (d <= 42 && d >= 24) {
				set(scene, x, y, x <= cx && y <= cy ? C.timberLight : C.timber);
			} else if (d < 24) {
				const spoke =
					x === cx ||
					y === cy ||
					Math.abs(x - cx) === Math.abs(y - cy);
				if (spoke) {
					set(scene, x, y, C.timberLight);
				}
			}
		}
	}
	rect(scene, cx - 1, cy - 1, 3, 3, C.brass);
	set(scene, cx - 1, cy - 1, C.gold);
}

/**
 * A barrel standing upright, with iron hoops.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawBarrel(scene, x, y) {
	for (let j = 0; j < 9; j++) {
		const inset = j === 0 || j === 8 ? 1 : 0;
		for (let i = inset; i < 7 - inset; i++) {
			let colour =
				i <= 1 ? C.timberLight : i >= 5 ? C.timberShade : C.timber;
			if (j === 1 || j === 7) {
				colour = C.stoneShade;
			}
			set(scene, x + i, y + j, colour);
		}
	}
}

/**
 * The climbers on the slope, each standing where the heap rises under them, some with torches.
 * @param {Canvas} scene
 * @param {[number, number][]} flames - Collects each torch's flame
 */
function drawClimbers(scene, flames) {
	for (const { x, clothes, torch: carries } of CLIMBERS) {
		const feet = heapTop(x + 2) + 1;
		drawFigure(scene, { x, y: feet, facing: 'right', clothes });
		if (carries) {
			torch(scene, x, feet, flames);
		} else {
			// A raised fist.
			set(scene, x + 4, feet - 5, clothes);
			set(scene, x + 5, feet - 6, clothes);
			set(scene, x + 5, feet - 7, C.skin);
			set(scene, x + 5, feet - 8, C.skin);
		}
	}
}

/**
 * A raised arm holding up a torch, for a right-facing figure.
 * @param {Canvas} scene
 * @param {number} x - The figure's left column
 * @param {number} feet - The figure's feet row
 * @param {[number, number][]} flames - Collects the flame's base
 */
function torch(scene, x, feet, flames) {
	const top = feet - 9;
	set(scene, x + 4, top + 4, C.skin);
	set(scene, x + 5, top + 3, C.skin);
	for (let y = top - 1; y <= top + 2; y++) {
		set(scene, x + 5, y, C.wood);
	}
	flames.push([x + 5, top - 2]);
}

/**
 * The flag bearer on the summit, holding a tall pole with a broad flag rippling out over the crowd:
 * an invented flag of a gold band over a purple band, with an open cream ring.
 * @param {Canvas} scene
 */
function drawFlagBearer(scene) {
	const x = PEAK_X - 3;
	const feet = SUMMIT;
	drawFigure(scene, { x, y: feet, facing: 'left', clothes: C.cream });
	// The pole, gripped in both hands.
	const pole = x + 4;
	for (let y = 4; y <= feet - 3; y++) {
		set(scene, pole, y, C.timber);
	}
	set(scene, pole, 3, C.gold);
	// The flag flies left from the pole's top, rippling: a gold band over a purple band.
	const reach = 20;
	const height = 12;
	/**
	 * How far a column of the flag dips as it ripples.
	 * @param {number} i - Columns out from the pole
	 * @returns {number}
	 */
	const wave = (i) => Math.round(Math.sin(i * 0.45) * 1.4);
	for (let i = 1; i <= reach; i++) {
		const folded = Math.cos(i * 0.45) < -0.35;
		for (let j = 0; j < height; j++) {
			let colour;
			if (j < height / 2) {
				colour = folded ? C.amber : j === 0 ? C.lampGlow : C.gold;
			} else {
				colour = folded ? C.roof : C.roofLight;
			}
			set(scene, pole - i, 4 + j + wave(i), colour);
		}
	}
	// The device: an open cream ring astride the two bands.
	const ring = 11;
	for (let dy = -3; dy <= 3; dy++) {
		for (let dx = -3; dx <= 3; dx++) {
			const d = dx * dx + dy * dy;
			if (d >= 8 && d <= 10) {
				set(
					scene,
					pole - ring - dx,
					4 + height / 2 + dy + wave(ring + dx),
					C.creamLight
				);
			}
		}
	}
}

/**
 * A torch flame with a warm glow on everything around it. Drawn last, without an outline.
 * @param {Canvas} scene
 * @param {number} x - The flame's base column
 * @param {number} y - The flame's base row
 */
function drawFlame(scene, x, y) {
	for (let dy = -7; dy <= 4; dy++) {
		for (let dx = -5; dx <= 5; dx++) {
			const d = dx * dx + (dy + 2) * (dy + 2);
			const behind = get(scene, x + dx, y + dy);
			if (behind && d <= 26 && behind !== C.ink) {
				set(
					scene,
					x + dx,
					y + dy,
					mix(behind, C.amber, d <= 10 ? 0.35 : 0.18)
				);
			}
		}
	}
	/** @type {[number, number, Colour][]} */
	const pixels = [
		[0, -5, C.brickRedLight],
		[-1, -4, C.amber],
		[0, -4, C.gold],
		[-1, -3, C.gold],
		[0, -3, C.lampGlow],
		[1, -3, C.amber],
		[-1, -2, C.amber],
		[0, -2, C.lampGlow],
		[1, -2, C.gold],
		[-1, -1, C.brickRedLight],
		[0, -1, C.gold],
		[1, -1, C.amber],
		[0, 0, C.amber],
	];
	for (const [dx, dy, colour] of pixels) {
		set(scene, x + dx, y + dy, colour);
	}
}
