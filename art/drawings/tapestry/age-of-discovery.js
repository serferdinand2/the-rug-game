// Age of Discovery: an explorer planting a compass-star flag on an empty palm-lined shore, a small ship at anchor in the bay.
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
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, and the flagpole's column. */
const HORIZON = 30;
const POLE = 33;

/**
 * The shoreline: the first row of sand in each column, higher on the left where the palms grow.
 * @param {number} x
 * @returns {number}
 */
function shore(x) {
	return Math.round(41 + x * 0.19 + Math.sin(x * 0.3) * 0.7);
}

/**
 * Draws the Age of Discovery scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(103);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawSea(layer, { time: 'day', top: HORIZON + 1, random, waves: 40 });
	drawBeach(layer, random);

	// The ship lies out in the bay, behind everything on the shore, so it gets its own outline.
	const bay = createCanvas(64, 64);
	drawAnchoredShip(bay, 42, 38);
	outline(bay, C.ink);
	drawAnchorCable(bay, 42, 38);

	drawJungle(scene, random);
	drawPalm(scene, 2, 44, 30, 7);
	drawPalm(scene, 11, 46, 24, 5);
	drawExplorer(scene, 21, 57);
	drawFlag(scene);
	outline(scene, C.ink);
	underlay(scene, bay);
	underlay(scene, layer);
	drawFootprints(scene);
	return scene;
}

/**
 * The beach: turquoise shallows, a broken line of foam, wet sand at the water's edge, then dry sand.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	const shallow = mix(C.daySea1, C.grassLight, 0.3);
	const shallowLight = mix(C.daySeaLine, C.grassLight, 0.2);
	for (let x = 0; x < 64; x++) {
		const top = shore(x);
		for (let y = top - 4; y < top; y++) {
			set(layer, x, y, y >= top - 2 ? shallowLight : shallow);
		}
		if ((x * 7) % 5 !== 0) {
			set(layer, x, top - 1, C.foam);
		}
		for (let y = top; y < 64; y++) {
			let colour = C.sand;
			if (y === top) {
				colour = C.sandShade;
			} else if (y > top + 1 && (y - top) % 5 === 2 && (x + y) % 4 < 2) {
				colour = C.sandLight;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = shore(x) + 3 + Math.floor(random() * 14);
		set(layer, x, y, random() > 0.5 ? C.sandShade : C.sandLight);
	}
}

/**
 * A small two-masted ship riding at anchor, its sails furled.
 * @param {Canvas} canvas
 * @param {number} x - The bow's column (the ship faces left)
 * @param {number} y - The waterline
 */
function drawAnchoredShip(canvas, x, y) {
	// The hull, with a raised stern on the right: each row's offset from the waterline, first and last column, and colour.
	/** @type {[number, number, number, Colour][]} */
	const hull = [
		[-3, 1, 15, C.timberLight],
		[-2, 1, 15, C.timber],
		[-1, 2, 15, C.timber],
		[0, 4, 14, C.timberShade],
	];
	for (const [dy, from, to, colour] of hull) {
		for (let i = from; i <= to; i++) {
			set(canvas, x + i, y + dy, i >= 14 ? C.timberShade : colour);
		}
	}
	rect(canvas, x + 11, y - 5, 5, 1, C.timberLight);
	rect(canvas, x + 11, y - 4, 5, 1, C.timber);
	set(canvas, x + 15, y - 6, C.gold);
	// The bowsprit.
	set(canvas, x, y - 4, C.timber);
	set(canvas, x - 1, y - 5, C.timber);
	set(canvas, x - 2, y - 5, C.timber);
	// Two masts with their sails furled along the yards.
	for (const [mx, height] of [
		[5, 11],
		[10, 14],
	]) {
		for (let row = y - 4 - height; row < y - 3; row++) {
			set(canvas, x + mx, row, C.wood);
		}
		for (const yard of [
			y - 4 - height + 3,
			y - 4 - Math.floor(height / 2) + 1,
		]) {
			for (let i = -2; i <= 2; i++) {
				set(canvas, x + mx + i, yard, C.wood);
				set(
					canvas,
					x + mx + i,
					yard + 1,
					i === 2 ? C.creamShade : C.cream
				);
			}
		}
	}
	// A red pennant at the mainmast's head.
	for (const [dx, dy] of [
		[1, 0],
		[2, 0],
		[3, 0],
		[1, 1],
	]) {
		set(canvas, x + 10 + dx, y - 18 + dy, C.brickRed);
	}
}

/**
 * The anchor cable, slanting from the bow down into the water; drawn after the outline so it stays thin.
 * @param {Canvas} canvas
 * @param {number} x - The bow's column
 * @param {number} y - The waterline
 */
function drawAnchorCable(canvas, x, y) {
	for (let i = 0; i < 5; i++) {
		set(canvas, x - 1 - i, y - 3 + i, C.wood);
	}
}

/**
 * Dense green undergrowth under the palms on the left, rounded clumps against the sea.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawJungle(scene, random) {
	for (const [cx, cy, r] of [
		[2, 40, 7],
		[10, 41, 6],
		[17, 44, 4],
		[-2, 34, 5],
	]) {
		for (let y = cy - r; y <= cy + r; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				const d = (x - cx) ** 2 + (y - cy) ** 2;
				if (d > r * r || y >= shore(x) + 1) {
					continue;
				}
				const lit = x - cx + (y - cy) < -r * 0.5;
				const colour = lit
					? C.grassLight
					: x - cx > r * 0.3 || y - cy > r * 0.4
						? C.grassShade
						: C.grass;
				set(scene, x, y, colour);
			}
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 20);
		const y = 34 + Math.floor(random() * 10);
		if (get(scene, x, y) === C.grass) {
			set(scene, x, y, C.grassLight);
		}
	}
}

/**
 * A palm: a ringed trunk curving towards the crown, and drooping fronds.
 * @param {Canvas} scene
 * @param {number} x - The trunk's base column
 * @param {number} base - The trunk's bottom row
 * @param {number} height - From the base to the crown
 * @param {number} lean - How many columns the crown leans to the right
 */
function drawPalm(scene, x, base, height, lean) {
	for (let i = 0; i <= height; i++) {
		const t = i / height;
		const tx = x + Math.round(lean * t * t);
		const ring = i % 3 === 0;
		set(scene, tx, base - i, ring ? C.timber : C.timberLight);
		set(scene, tx + 1, base - i, ring ? C.timberShade : C.timber);
	}
	const cx = x + lean;
	const cy = base - height;
	for (const [angle, length] of [
		[165, 9],
		[140, 8],
		[100, 5],
		[50, 8],
		[15, 10],
		[-20, 7],
		[200, 6],
	]) {
		frond(scene, cx, cy, (angle * Math.PI) / 180, length);
	}
	for (const [dx, dy] of [
		[0, 1],
		[1, 1],
		[-1, 2],
	]) {
		set(scene, cx + dx, cy + dy, C.wood);
	}
}

/**
 * One palm frond: a curved, drooping leaf, lit along its top, with leaflets hanging below.
 * @param {Canvas} scene
 * @param {number} cx - The crown's column
 * @param {number} cy - The crown's row
 * @param {number} angle - The leaf's starting direction, in radians from the right, upwards positive
 * @param {number} length
 */
function frond(scene, cx, cy, angle, length) {
	for (let k = 1; k <= length; k++) {
		const px = cx + Math.round(Math.cos(angle) * k);
		const py = cy - Math.round(Math.sin(angle) * k - 0.09 * k * k);
		set(scene, px, py, k < length - 1 ? C.pineLight : C.pine);
		if (k < length - 1) {
			set(scene, px, py + 1, C.pine);
		}
		if (k > 2 && k % 2 === 0 && k < length) {
			set(scene, px, py + 2, C.pineShade);
		}
	}
}

/**
 * The explorer, in a plumed hat and long coat, both hands driving the flagpole into the sand.
 * @param {Canvas} scene
 * @param {number} x - The figure's leftmost column
 * @param {number} feet - The row the boots stand on
 */
function drawExplorer(scene, x, feet) {
	const rows = [
		'.....FF.....',
		'....FHHH....',
		'...HHHHHH...',
		'.hhhhhhhhhh.',
		'....SSSSS...',
		'....SSeSs...',
		'....SSSSs...',
		'....BBSSs...',
		'.....BBB....',
		'...CCWWCC...',
		'..CCCCCCCSS.',
		'..CCCCCCccSS',
		'..CCCgCCc...',
		'..CbbbbbbC..',
		'..CCCCCCcc..',
		'..CCCCCCcc..',
		'...PPP.Pp...',
		'...PPP.Pp...',
		'...KKK.KK...',
		'...KKK.KK...',
		'..KKKK.KKK..',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		F: C.brickRedLight,
		H: C.timberShade,
		h: C.wood,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		B: C.timber,
		C: C.roofLight,
		c: C.roof,
		W: C.creamLight,
		g: C.gold,
		b: C.wood,
		P: C.cream,
		p: C.creamShade,
		K: C.timberShade,
	};
	const top = feet - rows.length + 1;
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (colours[key]) {
				set(scene, x + i, top + j, colours[key]);
			}
		});
	});
}

/**
 * The flagpole planted in the sand and the swallowtail flag streaming from it: gold, with a red compass star.
 * @param {Canvas} scene
 */
function drawFlag(scene) {
	for (let y = 9; y <= 58; y++) {
		set(scene, POLE, y, y === 9 ? C.gold : C.wood);
	}
	const width = 17;
	const height = 11;
	for (let i = 0; i < width; i++) {
		const wave = Math.round(Math.sin(i * 0.45) * (i / width) * 2);
		const notch = i >= width - 4 ? i - (width - 5) : 0;
		for (let j = 0; j < height; j++) {
			const middle = Math.abs(j - (height - 1) / 2);
			if (middle < notch) {
				continue;
			}
			const fold = Math.sin(i * 0.45) < -0.3;
			const colour =
				j === height - 1 || fold
					? C.amber
					: j === 0
						? C.lampGlow
						: C.gold;
			set(scene, POLE + 1 + i, 10 + j + wave, colour);
		}
	}
	// The four-point compass star near the hoist, where the cloth hangs flat.
	const star = [
		'....x....',
		'....x....',
		'...xxx...',
		'..xxxxx..',
		'xxxxxxxxx',
		'..xxxxx..',
		'...xxx...',
		'....x....',
		'....x....',
	];
	star.forEach((line, j) => {
		[...line].forEach((key, k) => {
			if (key !== 'x') {
				return;
			}
			const i = k + 1;
			const wave = Math.round(Math.sin(i * 0.45) * (i / width) * 2);
			set(scene, POLE + 1 + i, 11 + j + wave, C.brickRed);
		});
	});
}

/**
 * Footprints in the sand, from the water's edge to the explorer.
 * @param {Canvas} scene
 */
function drawFootprints(scene) {
	for (const [x, y] of [
		[54, 52],
		[51, 54],
		[48, 53],
		[45, 55],
		[42, 54],
		[39, 56],
		[36, 57],
	]) {
		set(scene, x, y, C.sandShade);
		set(scene, x + 1, y, C.sandShade);
	}
}
