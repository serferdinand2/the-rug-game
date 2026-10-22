// Public Works: road-menders laying a paved road that runs under the long arcade of a new aqueduct.
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
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';
import { drawFigure } from '../../parts/figures.js';
import { drawWheel } from '../../parts/wheel.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon (where the road vanishes) and the row the aqueduct's piers stand on. */
const HORIZON = 40;
const BASE = 50;

/** The lower tier: arch spacing, pier width, the springing row and the cornice above it. */
const PITCH = 16;
const PIER = 5;
const SPRING = 35;
const LOWER_TOP = 26;

/** The upper tier: arch spacing, the springing row, and the water channel's top. */
const UPPER_PITCH = 8;
const UPPER_SPRING = 20;
const CHANNEL = 9;

/** The road at the piers' feet: its far kerb, its near kerb, and the column where the fresh paving stops. */
const ROAD_TOP = 51;
const ROAD_BOTTOM = 58;
const SEAM = 34;

/** The aqueduct's golden stone: lit, main, shaded, and mortar. */
const GOLD_LIGHT = mix(C.sandLight, C.creamLight, 0.35);
const GOLD = C.sandLight;
const GOLD_MID = C.sand;
const GOLD_SHADE = C.sandShade;
const MORTAR = mix(C.sandShade, C.timber, 0.35);

/**
 * Draws the Public Works scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7202);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	drawRoad(layer, random);

	const aqueduct = createCanvas(64, 64);
	drawAqueduct(aqueduct);
	outline(aqueduct, C.ink);

	drawStonePile(scene);
	drawWorkers(scene);
	outline(scene, C.ink);
	underlay(scene, aqueduct);
	underlay(scene, layer);
	drawRammer(scene);
	return scene;
}

/**
 * Soft green hills on the horizon, with a few dark cypresses.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.daySky5, C.grass, 0.45);
	const farLight = mix(C.daySky6, C.grassLight, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			35 + Math.sin(x * 0.09 + 2) * 2 + Math.sin(x * 0.27) * 1
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? farLight : far);
		}
	}
}

/**
 * The road along the piers' feet: grey setts in staggered courses between two kerbs as far as the
 * menders have got, and a raw gravel bed beyond.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRoad(layer, random) {
	const gravel = mix(C.sand, C.stone, 0.45);
	const gravelShade = mix(C.sandShade, C.stoneShade, 0.5);
	for (let y = ROAD_TOP; y <= ROAD_BOTTOM; y++) {
		const course = Math.floor((y - ROAD_TOP - 1) / 2);
		for (let x = 0; x < 64; x++) {
			let colour;
			if (y === ROAD_TOP || y === ROAD_BOTTOM) {
				colour = x < SEAM + 6 ? C.stoneLight : gravelShade;
			} else if (x < SEAM) {
				const joint =
					(y - ROAD_TOP) % 2 === 0 || (x + course * 2) % 5 === 0;
				colour = joint
					? C.stoneShade
					: course % 2
						? C.stone
						: C.stoneLight;
			} else {
				colour = (x * 7 + y * 3) % 5 === 0 ? gravelShade : gravel;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 10; i++) {
		set(
			layer,
			SEAM + 1 + Math.floor(random() * (63 - SEAM)),
			ROAD_TOP + 1 + Math.floor(random() * 6),
			gravelShade
		);
	}
}

/**
 * Paints a pixel of masonry: courses of blocks with staggered joints.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} course - Rows per course
 * @param {number} block - Columns per block
 */
function masonry(canvas, x, y, course, block) {
	const n = Math.floor(y / course);
	let colour = n % 2 ? GOLD : GOLD_MID;
	if (
		y % course === course - 1 ||
		(x + n * Math.floor(block / 2)) % block === 0
	) {
		colour = MORTAR;
	}
	set(canvas, x, y, colour);
}

/**
 * Whether a pixel lies in one of a tier's arched openings.
 * @param {number} x
 * @param {number} y
 * @param {number} pitch - Columns from one opening's centre to the next
 * @param {number} radius - The opening's half-width and its arch's radius
 * @param {number} spring - The row where the arch springs
 * @param {number} bottom - The opening's last row
 * @returns {boolean}
 */
function opening(x, y, pitch, radius, spring, bottom) {
	const centre = Math.round(x / pitch) * pitch;
	const dx = x - centre;
	if (y > bottom || Math.abs(dx) > radius) {
		return false;
	}
	return y >= spring || Math.hypot(dx, spring - y) <= radius + 0.3;
}

/**
 * The aqueduct across the whole scene: a lower tier of tall arches on piers, a cornice, an upper
 * tier of small arches and the water channel on top, its stone lit along each ledge.
 * @param {Canvas} canvas
 */
function drawAqueduct(canvas) {
	const radius = (PITCH - PIER - 1) / 2;
	const upperRadius = 2;
	for (let y = CHANNEL; y <= BASE; y++) {
		for (let x = 0; x < 64; x++) {
			if (y > LOWER_TOP) {
				if (opening(x, y, PITCH, radius, SPRING, BASE)) {
					continue;
				}
				masonry(canvas, x, y, 3, 6);
			} else if (y > LOWER_TOP - 2) {
				set(
					canvas,
					x,
					y,
					y === LOWER_TOP - 1 ? GOLD_LIGHT : GOLD_SHADE
				);
			} else if (y > CHANNEL + 4) {
				if (
					opening(
						x + 4,
						y,
						UPPER_PITCH,
						upperRadius,
						UPPER_SPRING,
						LOWER_TOP - 2
					)
				) {
					continue;
				}
				masonry(canvas, x, y, 2, 4);
			} else {
				let colour = y === CHANNEL ? GOLD_LIGHT : GOLD;
				if (y === CHANNEL + 4) {
					colour = GOLD_SHADE;
				} else if (y === CHANNEL + 1) {
					colour = GOLD_MID;
				}
				set(canvas, x, y, colour);
			}
		}
	}
	// Each arch's ring of stones, and the shade on each pier's right face.
	for (let c = 0; c <= 64; c += PITCH) {
		for (let y = SPRING - radius - 2; y <= SPRING; y++) {
			for (let x = c - radius - 2; x <= c + radius + 2; x++) {
				const d = Math.hypot(x - c, SPRING - y);
				if (d > radius + 0.3 && d <= radius + 2) {
					set(canvas, x, y, d > radius + 1.3 ? GOLD_LIGHT : GOLD);
				}
			}
		}
		for (let y = SPRING; y <= BASE; y++) {
			set(canvas, c - radius - 1, y, GOLD_SHADE);
			set(canvas, c + radius + 1, y, GOLD_LIGHT);
		}
	}
}

/**
 * One paving sett: lit on top, shaded on its right.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function sett(scene, x, y) {
	rect(scene, x, y, 4, 2, C.stone);
	rect(scene, x, y, 3, 1, C.stoneLight);
	set(scene, x + 3, y + 1, C.stoneShade);
}

/**
 * The stack of new setts waiting on the gravel bed.
 * @param {Canvas} scene
 */
function drawStonePile(scene) {
	for (const [x, y] of [
		[38, 55],
		[42, 55],
		[40, 53],
		[46, 56],
	]) {
		sett(scene, x, y);
	}
}

/**
 * The road-menders: one kneeling to set a sett at the edge of the paving, one ramming the
 * laid setts down, and one wheeling a barrow of setts in from the right.
 * @param {Canvas} scene
 */
function drawWorkers(scene) {
	paint(
		scene,
		SEAM - 4,
		51,
		['.HHH..', 'HHSSS.', '.SSs..', 'CCCC..', 'CCCCSS', 'LLLL..', 'LL.LL.'],
		{
			H: C.wood,
			S: C.skin,
			s: C.skinShade,
			C: C.brickRed,
			L: C.roofShade,
		}
	);
	sett(scene, SEAM + 2, 54);
	drawFigure(scene, { x: 20, y: 57, facing: 'right', clothes: C.amber });
	drawFigure(scene, { x: 56, y: 57, facing: 'left', clothes: C.daySea2 });
	// The barrow: a tray heaped with setts, its legs and its handles back to the man's hands.
	paint(
		scene,
		45,
		49,
		['..ssss..', '.sssss..', 'tttttttt', '.tttttthh', '..t...t.'],
		{ t: C.timber, s: C.stoneLight, h: C.timberShade }
	);
}

/**
 * The barrow's wheel and the rammer, drawn after the outline so they stay fine: a T-handled
 * wooden rammer lifted in both hands above the setts.
 * @param {Canvas} scene
 */
function drawRammer(scene) {
	drawWheel(scene, { x: 46, y: 55, r: 2, spokes: 4 });
	rect(scene, 25, 43, 4, 1, C.timberLight);
	rect(scene, 27, 44, 1, 9, C.timber);
	rect(scene, 26, 53, 3, 3, C.timberShade);
	rect(scene, 26, 53, 3, 1, C.timber);
	// His arms, raised to the crossbar.
	line(scene, 24, 51, 25, 44, C.skin);
	set(scene, 24, 50, C.amber);
	// A shovel stuck in the gravel beyond the paving.
	rect(scene, 61, 45, 1, 9, C.timber);
	rect(scene, 60, 45, 3, 1, C.timberLight);
	rect(scene, 60, 54, 3, 2, C.stoneLight);
}
