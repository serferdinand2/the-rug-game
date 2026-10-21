// The Fusion Reactor landmark at night: a great containment dome with a blazing core, fed by power pylons.
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
import {
	FOOTPRINTS,
	clipToFootprint,
} from '../../../src/lib/art/footprints.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The picture fills the reactor's 3×3 footprint, minus its top-left plot, at 32 pixels each. */
const SIZE = 96;

/** The dome's centre and radius, and its core window. */
const DOME_X = 54;
const DOME_Y = 66;
const DOME_R = 34;
const CORE_Y = 50;

/**
 * Draws the Fusion Reactor scene.
 * @returns {Canvas} A 96×96 canvas in the shape of its footprint (the top-left plot empty).
 */
export function draw() {
	const scene = createCanvas(SIZE, SIZE);
	const layer = createCanvas(SIZE, SIZE);
	const random = seededRandom(89);

	drawSky(layer, {
		time: 'night',
		horizon: 66,
		random,
		stars: 70,
		starRows: 60,
		sparkles: [[88, 14]],
	});
	drawGround(layer);
	drawCoreGlow(layer);

	drawDome(scene);
	drawBase(scene);
	drawPylon(scene, 9);
	drawPylon(scene, 88);
	outline(scene, C.ink);
	drawCore(scene);
	drawWires(scene);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS['fusion-reactor']);
	return scene;
}

/**
 * Dark ground with a faint blue sheen from the reactor.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = 67; y < SIZE; y++) {
		for (let x = 0; x < SIZE; x++) {
			const near = Math.abs(x - DOME_X) < 50 - (y - 67);
			set(layer, x, y, near && (x + y) % 3 === 0 ? C.roof : C.night);
		}
	}
}

/**
 * The core's blue light spilling onto the night sky above the dome.
 * @param {Canvas} layer
 */
function drawCoreGlow(layer) {
	for (let y = 20; y <= 66; y++) {
		for (let x = 10; x < SIZE; x++) {
			const d = Math.hypot(x - DOME_X, y - CORE_Y);
			const behind = get(layer, x, y);
			if (behind && d < 46) {
				set(layer, x, y, mix(behind, C.daySky3, 0.4 * (1 - d / 46)));
			}
		}
	}
}

/**
 * The containment dome: smooth white panels, lit on the left, with ribs and a ring.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	for (let y = DOME_Y - DOME_R; y <= DOME_Y; y++) {
		for (let x = DOME_X - DOME_R; x <= DOME_X + DOME_R; x++) {
			const d = Math.hypot(x - DOME_X, (y - DOME_Y) * 1.15);
			if (d > DOME_R) {
				continue;
			}
			let colour = C.stone;
			if (x - DOME_X < -DOME_R * 0.45) {
				colour = C.stoneLight;
			} else if (x - DOME_X > DOME_R * 0.45) {
				colour = C.stoneShade;
			}
			if (Math.round(x - DOME_X) % 9 === 0 || y === DOME_Y - 10) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The reactor hall the dome stands on, its windows lit blue.
 * @param {Canvas} scene
 */
function drawBase(scene) {
	rect(scene, 16, 66, 76, 18, C.stoneMid);
	rect(scene, 16, 66, 1, 18, C.stone);
	rect(scene, 89, 66, 3, 18, C.stoneShade);
	rect(scene, 14, 65, 80, 2, C.stoneLight);
	for (let x = 20; x <= 84; x += 8) {
		rect(scene, x, 71, 4, 6, C.daySky4);
		rect(scene, x, 71, 4, 1, C.daySky5);
	}
	rect(scene, 49, 76, 10, 8, C.lampGlow);
}

/**
 * A lattice power pylon.
 * @param {Canvas} scene
 * @param {number} cx - Its centre column
 */
function drawPylon(scene, cx) {
	for (let y = 42; y <= 86; y++) {
		const half = 1 + Math.round(((y - 42) / 44) * 5);
		set(scene, cx - half, y, C.stoneMid);
		set(scene, cx + half, y, C.stoneShade);
		if ((y - 42) % 5 === 0) {
			rect(scene, cx - half, y, half * 2 + 1, 1, C.stoneMid);
		}
	}
	rect(scene, cx - 6, 46, 13, 1, C.stoneMid);
	rect(scene, cx - 4, 52, 9, 1, C.stoneMid);
}

/**
 * The blazing core behind its round window; drawn after the outline so it glows.
 * @param {Canvas} scene
 */
function drawCore(scene) {
	for (let y = CORE_Y - 9; y <= CORE_Y + 9; y++) {
		for (let x = DOME_X - 9; x <= DOME_X + 9; x++) {
			const d = Math.hypot(x - DOME_X, y - CORE_Y);
			if (d > 9) {
				continue;
			}
			let colour = C.daySky3;
			if (d > 8) {
				colour = C.ink;
			} else if (d < 2.5) {
				colour = C.white;
			} else if (d < 5) {
				colour = C.daySky6;
			} else if (d < 7) {
				colour = C.daySky4;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Power lines from the pylons to the reactor hall.
 * @param {Canvas} scene
 */
function drawWires(scene) {
	for (const [x0, y0, x1, y1] of [
		[3, 46, 16, 67],
		[15, 46, 16, 70],
		[82, 46, 92, 67],
		[94, 46, 92, 70],
	]) {
		for (let i = 0; i <= 30; i++) {
			const t = i / 30;
			const sag = Math.round(Math.sin(t * Math.PI) * 2);
			const x = Math.round(x0 + (x1 - x0) * t);
			const y = Math.round(y0 + (y1 - y0) * t) + sag;
			if (!get(scene, x, y)) {
				set(scene, x, y, C.stoneShade);
			}
		}
	}
}
