// Trap: a cut-away of a path at dusk, a thin mat of branches hiding a pit of sharpened stakes, an enemy flag beyond.
import {
	createCanvas,
	set,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawBanner } from '../../parts/banner.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, the path's near edge (where the cut begins), and the pit's sides and floor. */
const HORIZON = 29;
const CUT = 37;
const PIT_LEFT = 13;
const PIT_RIGHT = 50;
const PIT_FLOOR = 60;

/**
 * Draws the Trap scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(120);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawFarLand(layer);
	drawPath(layer, random);
	drawEarth(layer, random);
	drawPit(layer);

	// The enemy flag stands far beyond the trap, so it gets its own outline.
	const flag = createCanvas(64, 64);
	drawBanner(flag, {
		kind: 'flag',
		x: 46,
		y: 28,
		cloth: C.night,
		device: C.brickRed,
		height: 20,
	});
	outline(flag, C.ink);

	drawStakes(scene);
	drawCover(scene);
	outline(scene, C.ink);
	underlay(scene, flag);
	underlay(scene, layer);
	drawLeaves(scene, random);
	return scene;
}

/**
 * Low hills and a dark tree line on the skyline, with the enemy's hill on the right.
 * @param {Canvas} layer
 */
function drawFarLand(layer) {
	const hill = mix(C.forestFloorShade, C.duskSky2, 0.55);
	const ridge = mix(C.forestFloor, C.duskSky4, 0.45);
	for (let x = 0; x < 64; x++) {
		const rise = x > 36 ? Math.min(5, (x - 36) * 0.4) : 0;
		const top = Math.round(HORIZON - 1 - rise + Math.sin(x * 0.5) * 0.8);
		for (let y = top; y < CUT; y++) {
			set(layer, x, y, y === top ? ridge : hill);
		}
	}
	// A few dark trees along the far side.
	for (const [cx, base] of [
		[4, 28],
		[9, 29],
		[27, 29],
		[58, 24],
	]) {
		for (let j = 0; j < 7; j++) {
			const half = Math.floor(j / 2);
			for (let x = cx - half; x <= cx + half; x++) {
				set(layer, x, base - 7 + j, x > cx ? C.headland : hill);
			}
		}
	}
}

/**
 * The path's surface seen from just above: grass verges and a dusty track crossing the frame.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPath(layer, random) {
	const verge = mix(C.grass, C.duskSky4, 0.3);
	const vergeShade = mix(C.grassShade, C.duskSky3, 0.35);
	const track = mix(C.sand, C.duskSky5, 0.25);
	const trackLight = mix(C.sandLight, C.duskSky6, 0.3);
	for (let x = 0; x < 64; x++) {
		set(layer, x, 31, vergeShade);
		set(layer, x, 32, verge);
		set(layer, x, 33, trackLight);
		set(layer, x, 34, track);
		set(layer, x, 35, track);
		set(layer, x, 36, verge);
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		set(
			layer,
			x,
			34 + Math.floor(random() * 2),
			mix(C.sandShade, C.duskSky4, 0.25)
		);
	}
}

/**
 * The cut face of the ground: turf on top, brown soil, darker clay with stones below.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawEarth(layer, random) {
	for (let y = CUT; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.timber;
			if (y <= CUT + 1) {
				colour = y === CUT ? C.grassShade : C.forestFloorShade;
			} else if (y > 50) {
				colour = (x + y) % 2 === 0 && y < 53 ? C.timber : C.timberShade;
			} else if (y > 44 && (x * 3 + y) % 7 === 0) {
				colour = C.timberShade;
			}
			set(layer, x, y, colour);
		}
	}
	// Stones in the clay, and pale roots near the top.
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = CUT + 6 + Math.floor(random() * 20);
		set(layer, x, y, C.stoneMid);
		set(layer, x + 1, y, C.stoneShade);
		set(layer, x, y - 1, C.stone);
	}
	for (const [x, y, length] of [
		[4, CUT + 2, 4],
		[8, CUT + 2, 3],
		[56, CUT + 2, 5],
		[60, CUT + 2, 3],
	]) {
		for (let j = 0; j < length; j++) {
			set(layer, x + (j % 2), y + j, C.timberLight);
		}
	}
}

/**
 * The pit: a dark hollow under the path, a little narrower at the bottom, its walls lit along the left.
 * @param {Canvas} layer
 */
function drawPit(layer) {
	const dark = mix(C.wood, C.ink, 0.45);
	const wall = mix(C.timberShade, C.ink, 0.25);
	for (let y = CUT; y <= PIT_FLOOR; y++) {
		const inset = Math.floor((y - CUT) / 8);
		const left = PIT_LEFT + inset;
		const right = PIT_RIGHT - inset;
		for (let x = left; x <= right; x++) {
			let colour = dark;
			if (x === left || x === right) {
				colour = C.timberShade;
			} else if (x <= left + 2) {
				colour = wall;
			}
			set(layer, x, y, colour);
		}
	}
	// The pit's floor.
	for (let x = PIT_LEFT + 2; x <= PIT_RIGHT - 2; x++) {
		set(layer, x, PIT_FLOOR, C.timberShade);
	}
}

/**
 * Sharpened stakes standing in the pit's floor, pale where they were cut to points.
 * @param {Canvas} scene
 */
function drawStakes(scene) {
	for (const [x, height, lean] of [
		[16, 16, -1],
		[21, 19, 0],
		[27, 15, 1],
		[32, 20, 0],
		[37, 16, -1],
		[42, 19, 0],
		[46, 14, 1],
	]) {
		const top = PIT_FLOOR - height;
		for (let y = top; y <= PIT_FLOOR; y++) {
			const point = y - top;
			const shift = Math.round(((PIT_FLOOR - y) * lean) / 6);
			const left = x + shift;
			// A long point: the freshly cut wood is pale and widens down a slanting cut to the bark.
			if (point < 2) {
				set(
					scene,
					left + 1,
					y,
					point === 0 ? C.creamLight : C.sandLight
				);
				continue;
			}
			if (point < 4) {
				set(scene, left + 1, y, C.sandLight);
				set(
					scene,
					left + (lean < 0 ? 2 : 0),
					y,
					lean < 0 ? C.sandShade : C.sandLight
				);
				if (point === 3) {
					set(
						scene,
						left + (lean < 0 ? 0 : 2),
						y,
						lean < 0 ? C.sandLight : C.sand
					);
				}
				continue;
			}
			set(scene, left, y, point < 5 ? C.sandLight : C.timberLight);
			set(scene, left + 1, y, point < 6 ? C.sand : C.timber);
			set(scene, left + 2, y, point < 7 ? C.sandShade : C.timberShade);
		}
	}
}

/**
 * How far the mat over the pit sags at a column: most in the middle of the pit's mouth.
 * @param {number} x
 * @returns {number}
 */
function sag(x) {
	return Math.round(
		Math.sin(((x - PIT_LEFT + 3) / (PIT_RIGHT - PIT_LEFT + 6)) * Math.PI) *
			1.5
	);
}

/**
 * The mat hiding the pit: crossed branches across its mouth, sagging a little, heaped with leaves.
 * @param {Canvas} scene
 */
function drawCover(scene) {
	// Branches laid across the mouth, criss-crossing.
	for (let x = PIT_LEFT - 3; x <= PIT_RIGHT + 3; x++) {
		const y = CUT - 1 + sag(x);
		set(scene, x, y, C.timberShade);
		set(scene, x, y + 1, (x * 5) % 3 === 0 ? C.wood : C.timber);
		const phase = (x - PIT_LEFT + 30) % 8;
		if (phase < 4) {
			set(scene, x, y - 1 + (phase > 1 ? 1 : 0), C.timberLight);
		} else {
			set(scene, x, y + 1 - (phase > 5 ? 1 : 0), C.timberLight);
		}
	}
	// Twigs poking out of the mat.
	for (const [x, dir] of [
		[PIT_LEFT - 2, -1],
		[20, 1],
		[29, -1],
		[39, 1],
		[PIT_RIGHT + 2, 1],
	]) {
		set(scene, x, CUT - 2 + sag(x), C.timber);
		set(scene, x + dir, CUT - 3 + sag(x), C.timber);
	}
}

/**
 * Leaves strewn over the mat, green and dry, so it passes for part of the path.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLeaves(scene, random) {
	const leaves = [C.grass, C.grassLight, C.amber, C.forestFloorLight, C.gold];
	for (let x = PIT_LEFT - 2; x <= PIT_RIGHT + 2; x++) {
		if (random() > 0.35) {
			set(
				scene,
				x,
				CUT - 2 + sag(x),
				leaves[Math.floor(random() * leaves.length)]
			);
		}
		if (random() > 0.7) {
			set(
				scene,
				x,
				CUT - 3 + sag(x),
				leaves[Math.floor(random() * leaves.length)]
			);
		}
	}
}
