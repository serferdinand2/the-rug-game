// Terraforming: green terraced fields cut into a barren rust-red mountain, fed by a waterfall from a spring near the summit.
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The mountain's skyline from left to right: a long climb to the summit, a saddle and a lower second peak. */
const RIDGE = [
	[0, 40],
	[5, 35],
	[9, 33],
	[13, 32],
	[17, 28],
	[22, 22],
	[26, 18],
	[30, 13],
	[34, 9],
	[37, 5],
	[40, 7],
	[43, 11],
	[47, 17],
	[50, 19],
	[54, 15],
	[57, 13],
	[60, 16],
	[64, 22],
];

/** The two summits and the saddle between them. */
const PEAK = { x: 37, y: 5 };
const SECOND = { x: 57, y: 13 };
const SADDLE = { x: 50, y: 19 };

/** The spring's column and row, and the row the terraces start on. */
const FALL_X = 33;
const SPRING_Y = 18;
const TERRACE_TOP = 27;

/** Bare rust-red rock, blended from the palette. */
const ROCK = {
	light: mix(C.sandShade, C.brickRedLight, 0.3),
	main: mix(C.timberLight, C.brickRed, 0.3),
	shade: mix(C.timber, C.brickRedShade, 0.35),
	dark: mix(C.timberShade, C.wood, 0.3),
};

/** The water. */
const WATER = {
	white: C.white,
	foam: C.dayWave,
	main: C.daySea1,
	deep: C.daySea3,
};

/**
 * Draws the Terraforming scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(733);

	drawSky(layer, { time: 'day', horizon: 47, random });
	drawTerrain(layer, { kind: 'mountain', top: 48, random });

	drawMountain(scene, random);
	drawTerraces(scene);
	drawWaterfall(scene);
	drawPool(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawSpray(scene);
	return scene;
}

/**
 * The mountain's skyline: its top row in each column, roughened a little between the points of RIDGE.
 * @param {number} x
 * @returns {number}
 */
function ridge(x) {
	let i = 0;
	while (i < RIDGE.length - 2 && RIDGE[i + 1][0] <= x) {
		i++;
	}
	const [x0, y0] = RIDGE[i];
	const [x1, y1] = RIDGE[i + 1];
	const y = y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
	return Math.round(y + Math.sin(x * 1.3) * 0.7);
}

/**
 * Whether a pixel of the mountain lies on a face turned away from the light: right of a summit's spine.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function shaded(x, y) {
	const spine = PEAK.x + (y - PEAK.y) * 0.4;
	const secondSpine = SECOND.x + (y - SECOND.y) * 0.3;
	const secondFace = SADDLE.x + (y - SADDLE.y) * 0.5;
	return (x > spine && x <= secondFace) || x > secondSpine;
}

/**
 * The barren mountain: rust-red rock, lit on the faces towards the left and shaded on the others,
 * with strata, cracks and loose stones.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawMountain(scene, random) {
	for (let x = 0; x < 64; x++) {
		const top = ridge(x);
		for (let y = top; y < 64; y++) {
			const dark = shaded(x, y);
			let colour = dark ? ROCK.shade : ROCK.main;
			if (y === top) {
				colour = dark ? ROCK.main : ROCK.light;
			} else if (dark && !shaded(x - 1, y)) {
				// The lit edge of each spine.
				colour = ROCK.light;
			} else if (dark && (y - x * 0.5) % 7 < 1) {
				// Strata running across the shaded faces.
				colour = ROCK.dark;
			} else if (!dark && (y + x * 0.4) % 9 < 1) {
				colour = ROCK.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Cracks and loose stones on the bare upper slopes.
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = ridge(x) + 2 + Math.floor(random() * 14);
		set(scene, x, y, ROCK.dark);
		set(scene, x + 1, y, ROCK.light);
	}
}

/**
 * The top row of terrace k in column x: each terrace's edge curves up towards the sides, following the slope.
 * @param {number} k - The terrace, 0 at the top
 * @param {number} x
 * @returns {number}
 */
function terraceRow(k, x) {
	const bend = ((x - FALL_X) / 34) ** 2 * 4;
	return TERRACE_TOP + k * 5 - Math.round(bend);
}

/**
 * The terraced fields: flat green steps held up by earth walls, reaching further across the slope
 * the lower they are, their far ends still bare, freshly dug earth.
 * @param {Canvas} scene
 */
function drawTerraces(scene) {
	for (let k = 0; k < 8; k++) {
		const reach = 38 + k * 4;
		for (let x = 0; x <= Math.min(63, reach); x++) {
			const top = terraceRow(k, x);
			if (top < ridge(x) + 2) {
				continue;
			}
			for (let y = top; y < top + 5 && y < 64; y++) {
				const row = y - top;
				let colour;
				if (row === 0) {
					colour = C.grassLight;
				} else if (row === 1) {
					colour = (x + k * 2) % 4 === 0 ? C.grassLight : C.grass;
				} else if (row === 2) {
					colour = (x + k * 2) % 4 === 2 ? C.grassShade : C.grass;
				} else if (row === 3) {
					colour = C.grassShade;
				} else {
					colour = (x + k) % 5 === 0 ? ROCK.dark : C.timberShade;
				}
				// The far end of each terrace is still being dug: rough earth.
				if (x >= reach - 2 && row > 0) {
					colour = row === 4 ? ROCK.dark : C.timber;
				}
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * The spring in its dark cleft near the summit and the waterfall dropping from it down the terraces.
 * @param {Canvas} scene
 */
function drawWaterfall(scene) {
	// The cleft: a dark mouth in the rock with a lit lip above it.
	rect(scene, FALL_X - 3, SPRING_Y - 4, 7, 1, ROCK.light);
	rect(scene, FALL_X - 2, SPRING_Y - 3, 5, 3, ROCK.dark);
	rect(scene, FALL_X - 1, SPRING_Y - 3, 3, 2, C.wood);
	for (let y = SPRING_Y; y < 64; y++) {
		for (let x = FALL_X - 1; x <= FALL_X + 1; x++) {
			let colour = WATER.foam;
			if (x === FALL_X - 1) {
				colour = WATER.white;
			} else if (x === FALL_X + 1) {
				colour = (y + 1) % 3 === 0 ? WATER.main : WATER.foam;
			} else if (y % 4 === 0) {
				colour = WATER.white;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The pool at the foot of the fall.
 * @param {Canvas} scene
 */
function drawPool(scene) {
	for (let y = 58; y < 64; y++) {
		const half = 7 + (y - 58);
		for (let x = FALL_X - half; x <= FALL_X + half; x++) {
			const colour =
				y === 58
					? WATER.foam
					: (x + y) % 5 === 0
						? WATER.foam
						: WATER.main;
			set(
				scene,
				x,
				y,
				y > 61 ? (x % 4 === 0 ? WATER.main : WATER.deep) : colour
			);
		}
	}
}

/**
 * Irrigation channels spreading from the fall along the back of each terrace, white spray where
 * the fall strikes each step, and foam on the pool.
 * @param {Canvas} scene
 */
function drawSpray(scene) {
	for (let k = 0; k < 8; k++) {
		const reach = 9 + (k % 3) * 2;
		for (let dx = 2; dx <= reach; dx++) {
			for (const x of [FALL_X - dx, FALL_X + dx]) {
				const y = terraceRow(k, x) + 1;
				if (
					get(scene, x, y) === C.grass ||
					get(scene, x, y) === C.grassLight
				) {
					set(
						scene,
						x,
						y,
						dx === reach
							? WATER.deep
							: (x + k) % 4 === 0
								? WATER.foam
								: WATER.main
					);
				}
			}
		}
		const y = terraceRow(k, FALL_X);
		set(scene, FALL_X - 2, y, WATER.white);
		set(scene, FALL_X + 2, y, WATER.white);
	}
	for (const dx of [-4, -2, 0, 2, 4]) {
		set(scene, FALL_X + dx, 57, WATER.white);
	}
	for (const dx of [-3, 3]) {
		set(scene, FALL_X + dx, 56, WATER.foam);
	}
}
