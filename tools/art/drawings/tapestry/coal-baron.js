// Coal Baron: a pithead in a dark valley at dusk, its great winding wheel against the afterglow, tubs of coal and a smoking chimney.
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
import { drawSmoke } from '../../parts/smoke.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row (seed 263 sets the dusk sun at column 55, behind the valley's right side) and the yard's first row. */
const HORIZON = 42;
const YARD = 47;

/** The headframe's feet row, its top row, the winding wheel's centre and radius. */
const FEET = 52;
const TOP = 26;
const WHEEL_X = 32;
const WHEEL_Y = 13;
const WHEEL_R = 10;

/** The rail the tubs run on. */
const RAIL = 60;

/**
 * Draws the Coal Baron scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(263);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawValley(layer, random);
	drawYard(layer, random);
	drawSmoke(layer, { x: 58, y: 19, tone: 'smoke', puffs: 4, drift: -1 });
	drawBraces(layer);

	// The winding house and its chimney stand behind the headframe, so they get their own outline.
	const house = createCanvas(64, 64);
	drawWindingHouse(house);
	outline(house, C.ink);

	drawHeadframe(scene);
	drawWheel(scene);
	drawTubs(scene);
	drawFigure(scene, {
		x: 21,
		y: RAIL - 1,
		facing: 'right',
		clothes: C.stoneShade,
	});
	outline(scene, C.ink);
	underlay(scene, house);
	underlay(scene, layer);
	drawCable(scene);
	drawLamps(scene);
	return scene;
}

/**
 * The valley's dark sides closing in from both edges, their ridges rimmed by the afterglow,
 * with a few pines on them.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawValley(layer, random) {
	const side = mix(C.headland, C.pineShade, 0.25);
	const ridge = mix(C.headlandRidge, C.duskSky4, 0.35);
	for (let x = 0; x < 64; x++) {
		const left = 14 + x * 1.15 + Math.sin(x * 0.5) * 1.2;
		const right = 18 + (63 - x) * 1.05 + Math.sin(x * 0.4 + 1) * 1.2;
		const top = Math.round(Math.min(left, right, HORIZON + 2));
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? ridge : side);
		}
	}
	for (const [px, h] of [
		[3, 7],
		[8, 6],
		[56, 6],
		[61, 7],
	]) {
		let base = 0;
		while (get(layer, px, base) !== side && base < 63) {
			base++;
		}
		for (let j = 0; j < h; j++) {
			const half = Math.floor(j / 2);
			for (let x = px - half; x <= px + half; x++) {
				set(layer, x, base - h + j + 1, C.headland);
			}
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = Math.floor(random() * 64);
		const y = 30 + Math.floor(random() * 14);
		if (get(layer, x, y) === side) {
			set(layer, x, y, C.headlandRidge);
		}
	}
}

/**
 * The pit yard: blackened ground, a heap of coal on the left and the rail the tubs run on.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawYard(layer, random) {
	const earth = mix(C.wood, C.night, 0.3);
	const earthLight = mix(C.timberShade, C.duskSky3, 0.3);
	for (let y = YARD; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === YARD
					? earthLight
					: y > 56 && (x + y) % 2 === 0
						? C.night
						: earth;
			set(layer, x, y, colour);
		}
	}
	// The coal heap: a black cone with glints.
	for (let y = 34; y < YARD + 4; y++) {
		const half = Math.floor((y - 34) * 1.1);
		for (let x = 8 - half; x <= 8 + half; x++) {
			const glint = random() > 0.88;
			const lit = x < 8 - half + 2 && y < YARD;
			set(
				layer,
				x,
				y,
				glint ? C.stoneShade : lit ? C.roofShade : C.night
			);
		}
	}
	// The rail.
	for (let x = 0; x < 64; x++) {
		set(layer, x, RAIL + 1, C.stone);
		set(layer, x, RAIL + 2, x % 4 === 0 ? C.timberShade : C.night);
	}
}

/**
 * The brick winding house on the right, its windows lit, with a tall chimney.
 * @param {Canvas} house
 */
function drawWindingHouse(house) {
	const left = 45;
	const top = 37;
	const brick = mix(C.brickRedShade, C.roofShade, 0.3);
	const brickLight = mix(C.brickRed, C.duskSky4, 0.3);
	const brickShade = mix(C.brickRedShade, C.roofShade, 0.65);
	for (let y = top; y <= FEET; y++) {
		for (let x = left; x < 64; x++) {
			let colour = brick;
			if (x === left) {
				colour = brickLight;
			} else if (
				(y - top) % 3 === 2 ||
				(x + (Math.floor((y - top) / 3) % 2) * 2) % 4 === 0
			) {
				colour = brickShade;
			}
			set(house, x, y, colour);
		}
	}
	// A slate roof sloping up to the right.
	for (let x = left - 1; x < 64; x++) {
		const rise = Math.min(4, Math.floor((x - left + 1) / 3));
		for (let y = top - 1 - rise; y < top; y++) {
			set(house, x, y, y === top - 1 - rise ? C.roofLight : C.roof);
		}
	}
	// Tall arched windows, lit by the engine inside.
	for (const wx of [48, 54]) {
		rect(house, wx, top + 4, 3, 7, C.gold);
		rect(house, wx, top + 4, 3, 2, C.lampGlow);
		set(house, wx, top + 4, brick);
		set(house, wx + 2, top + 4, brick);
	}
	// The chimney.
	for (let y = 21; y < top - 4; y++) {
		for (let x = 57; x <= 60; x++) {
			const colour =
				x === 57
					? brickLight
					: x === 60 || y % 3 === 0
						? brickShade
						: brick;
			set(house, x, y, colour);
		}
	}
	rect(house, 56, 20, 6, 2, C.stoneMid);
	set(house, 56, 20, C.stoneLight);
}

/**
 * Plots a line one or two pixels thick between two points.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {Colour} colour
 * @param {Colour} [second] - A colour for a second pixel to the right, making the line two thick
 */
function line(canvas, x0, y0, x1, y1, colour, second) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		const x = Math.round(x0 + (x1 - x0) * t);
		const y = Math.round(y0 + (y1 - y0) * t);
		set(canvas, x, y, colour);
		if (second) {
			set(canvas, x + 1, y, second);
		}
	}
}

/**
 * The headframe: two iron legs splaying down from a platform under the wheel, tied by girts
 * and cross-braced, and a raking back-leg down to the winding house. Their edges
 * catch the afterglow; the sky shows through between them.
 * @param {Canvas} scene
 */
function drawHeadframe(scene) {
	const iron = mix(C.roofShade, C.brickRedShade, 0.35);
	const ironLight = mix(C.brickRedShade, C.duskSky5, 0.45);
	// The back-leg.
	line(scene, 39, TOP + 1, 51, FEET - 7, iron, ironLight);
	// Girts tying the legs.
	for (const y of [TOP + 1, 36]) {
		rect(scene, legLeft(y), y, legRight(y) - legLeft(y) + 1, 1, iron);
	}
	// The legs.
	for (let y = TOP; y <= FEET; y++) {
		const l = legLeft(y);
		const r = legRight(y);
		set(scene, l, y, ironLight);
		set(scene, l + 1, y, iron);
		set(scene, r - 1, y, iron);
		set(scene, r, y, ironLight);
	}
	// The platform under the wheel.
	rect(scene, 22, TOP - 1, 21, 2, iron);
	rect(scene, 22, TOP - 1, 21, 1, ironLight);
	// The timber bank shed over the shaft, between the feet, with its lit doorway.
	for (let y = 44; y <= FEET; y++) {
		for (let x = legLeft(y) + 2; x <= legRight(y) - 2; x++) {
			let colour = (x + y) % 5 === 0 ? C.timberShade : C.timber;
			if (y === 44) {
				colour = C.roofLight;
			} else if (y === 45) {
				colour = C.roof;
			} else if (x === legLeft(y) + 2) {
				colour = C.timberLight;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 30, 48, 4, 5, C.gold);
	rect(scene, 30, 48, 4, 1, C.lampGlow);
}

/**
 * The headframe's cross-braces, thin iron against the sky. They go on the background layer,
 * so the outline pass leaves them fine and the afterglow shows between them.
 * @param {Canvas} layer
 */
function drawBraces(layer) {
	const iron = mix(C.ink, C.brickRedShade, 0.35);
	const girts = [TOP + 1, 36, 44];
	for (let i = 0; i + 1 < girts.length; i++) {
		const y0 = girts[i];
		const y1 = girts[i + 1];
		line(layer, legLeft(y0) + 2, y0 + 1, legRight(y1) - 2, y1 - 1, iron);
		line(layer, legRight(y0) - 2, y0 + 1, legLeft(y1) + 2, y1 - 1, iron);
	}
}

/**
 * The headframe's left leg column at a row.
 * @param {number} y
 * @returns {number}
 */
function legLeft(y) {
	return Math.round(17 + ((FEET - y) * 7) / (FEET - TOP));
}

/**
 * The headframe's right leg column at a row.
 * @param {number} y
 * @returns {number}
 */
function legRight(y) {
	return Math.round(47 - ((FEET - y) * 7) / (FEET - TOP));
}

/**
 * The winding wheel on top: a steel rim lit amber underneath by the afterglow, six iron spokes
 * and a hub on two posts.
 * @param {Canvas} scene
 */
function drawWheel(scene) {
	const iron = mix(C.roofShade, C.stoneShade, 0.4);
	for (let y = WHEEL_Y - WHEEL_R; y <= WHEEL_Y + WHEEL_R; y++) {
		for (let x = WHEEL_X - WHEEL_R; x <= WHEEL_X + WHEEL_R; x++) {
			const dx = x - WHEEL_X;
			const dy = y - WHEEL_Y;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d > WHEEL_R + 0.4) {
				continue;
			}
			if (d > WHEEL_R - 1.6) {
				set(
					scene,
					x,
					y,
					dy > 2 ? C.amber : dx + dy < -4 ? C.stoneLight : C.stone
				);
				continue;
			}
			const angle = Math.atan2(dy, dx);
			const spoke = Math.abs(Math.sin(angle * 3)) < 0.28 && d > 1;
			if (spoke) {
				set(scene, x, y, iron);
			}
		}
	}
	rect(scene, WHEEL_X - 1, WHEEL_Y - 1, 3, 3, iron);
	set(scene, WHEEL_X, WHEEL_Y, C.gold);
	// The axle's bearings on two posts down to the platform.
	for (let y = WHEEL_Y + 2; y < TOP - 1; y++) {
		set(scene, WHEEL_X - 1, y, iron);
		set(scene, WHEEL_X + 1, y, iron);
	}
}

/**
 * Three iron tubs on the rail, heaped with coal that glints in the last light.
 * @param {Canvas} scene
 */
function drawTubs(scene) {
	for (const tx of [1, 27, 40]) {
		// The coal heap.
		for (let y = RAIL - 10; y <= RAIL - 7; y++) {
			const inset = RAIL - 7 - y;
			for (let x = tx + inset; x < tx + 11 - inset; x++) {
				const glint = (x * 7 + y * 3) % 9 === 0;
				set(
					scene,
					x,
					y,
					glint
						? C.stoneLight
						: (x + y) % 3 === 0
							? C.roofShade
							: C.night
				);
			}
		}
		// The tub, its sides flaring out a little at the top.
		for (let y = RAIL - 6; y <= RAIL - 2; y++) {
			const inset = Math.floor((y - (RAIL - 6)) / 3);
			for (let x = tx + inset; x < tx + 11 - inset; x++) {
				let colour = C.stoneMid;
				if (y === RAIL - 6) {
					colour = C.stoneLight;
				} else if (x === tx + inset) {
					colour = C.stone;
				} else if (x >= tx + 9 - inset) {
					colour = C.stoneShade;
				}
				set(scene, x, y, colour);
			}
		}
		rect(scene, tx + 1, RAIL - 4, 9, 1, C.stoneShade);
		// Two small wheels on the rail.
		for (const wx of [tx + 2, tx + 7]) {
			rect(scene, wx, RAIL - 1, 2, 2, C.night);
			set(scene, wx, RAIL - 1, C.stone);
		}
	}
}

/**
 * The winding rope running from the winding house up to the top of the wheel.
 * Drawn after the outline, so it stays a fine line.
 * @param {Canvas} scene
 */
function drawCable(scene) {
	const steel = C.stoneLight;
	const steps = 24;
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = Math.round(WHEEL_X + WHEEL_R + (49 - WHEEL_X - WHEEL_R) * t);
		const y = Math.round(WHEEL_Y + (34 - WHEEL_Y) * t);
		if (get(scene, x, y) !== C.amber) {
			set(scene, x, y, steel);
		}
	}
}

/**
 * Lamps: one at each end of the platform under the wheel, and the miner's cap lamp.
 * @param {Canvas} scene
 */
function drawLamps(scene) {
	for (const x of [22, 42]) {
		set(scene, x, TOP - 3, C.lampGlow);
		set(scene, x, TOP - 2, C.gold);
	}
	// The miner's cap lamp.
	set(scene, 25, RAIL - 10, C.lampGlow);
}
