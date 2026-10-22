// Engineering: a treadwheel crane lowering the keystone into a stone arch held up on timber centering.
import {
	createCanvas,
	set,
	rect,
	line,
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

/** The sky's last row, and the work yard's first row. */
const HORIZON = 49;
const YARD = 57;

/** The arch: its centre, its inner and outer radius, how many stones make its ring and the keystone's half-angle. */
const CX = 24;
const CY = 38;
const RI = 12;
const RO = 20;
const STONES = 9;
const KEY = 0.24;

/** The hanging keystone's centre, and how far it tilts as it swings in, in radians. */
const STONE_X = CX + 4;
const STONE_Y = 13;
const TILT = 0.3;

/** The crane: the jib's tip, the mast's column and the row where the jib leaves it, and the treadwheel's hub and radius at its foot. */
const TIP_X = STONE_X + 2;
const TIP_Y = 1;
const MAST = 54;
const MAST_TOP = 24;
const WHEEL_X = 53;
const WHEEL_Y = 46;
const WHEEL_R = 11;

/** The arch's limestone: lit, main, a second tone, shaded, and the mortar joints. */
const LIME_LIGHT = mix(C.creamLight, C.stoneLight, 0.45);
const LIME = mix(C.cream, C.stoneLight, 0.5);
const LIME_ALT = mix(C.cream, C.stone, 0.45);
const LIME_SHADE = mix(C.creamShade, C.stoneShade, 0.55);
const JOINT = C.stoneShade;

/**
 * Draws the Engineering scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7101);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	drawYard(layer, random);

	drawCrane(scene);
	drawArch(scene);
	drawCentering(scene);
	drawScaffold(scene);
	drawKeystone(scene);
	drawBlocks(scene);
	drawMason(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawTreadwheel(scene);
	drawRopes(scene);
	drawLewis(scene);
	return scene;
}

/**
 * Hazy blue-green hills along the horizon.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.daySky5, C.grassShade, 0.35);
	const farLight = mix(C.daySky6, C.grassLight, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			42 + Math.sin(x * 0.11 + 1) * 2.5 + Math.sin(x * 0.31) * 1
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? farLight : far);
		}
	}
}

/**
 * The trodden earth of the work yard, with chips of stone.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawYard(layer, random) {
	const earth = mix(C.timberLight, C.sand, 0.45);
	const earthShade = mix(C.timber, C.sandShade, 0.4);
	for (let y = YARD; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = (x * 3 + y * 5) % 7 === 0 ? earthShade : earth;
			if (y === YARD) {
				colour = mix(C.sandLight, earth, 0.4);
			} else if (y > 60 && (x + y) % 2 === 0) {
				colour = earthShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 12; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			YARD + 1 + Math.floor(random() * 6),
			LIME_LIGHT
		);
	}
}

/**
 * Where a pixel sits in the arch's ring: the keystone fills the crown, and four stones fill each side.
 * @param {number} x
 * @param {number} y
 * @returns {{ d: number, k: number, joint: boolean } | null} Its distance from the centre, its stone
 * (the keystone is the middle one) and whether it lies on a joint; null outside the ring.
 */
function ring(x, y) {
	if (y > CY) {
		return null;
	}
	const d = Math.hypot(x - CX, CY - y);
	if (d <= RI || d > RO) {
		return null;
	}
	const angle = Math.atan2(CY - y, x - CX);
	const half = (STONES - 1) / 2;
	const side = (Math.PI / 2 - KEY) / half;
	let k = half;
	let from = Math.PI / 2 - KEY;
	if (angle < Math.PI / 2 - KEY) {
		k = Math.min(half - 1, Math.floor(angle / side));
		from = k * side;
	} else if (angle > Math.PI / 2 + KEY) {
		const j = Math.min(
			half - 1,
			Math.floor((angle - Math.PI / 2 - KEY) / side)
		);
		k = half + 1 + j;
		from = Math.PI / 2 + KEY + j * side;
	}
	const to = from + (k === half ? KEY * 2 : side);
	const joint = Math.min(angle - from, to - angle) * d < 0.6;
	return { d, k, joint };
}

/**
 * The arch: two piers of coursed blocks and a ring of wedge-shaped stones, its keystone still missing.
 * @param {Canvas} scene
 */
function drawArch(scene) {
	const middle = (STONES - 1) / 2;
	for (let y = CY - RO; y <= CY; y++) {
		for (let x = CX - RO; x <= CX + RO; x++) {
			const at = ring(x, y);
			if (!at || at.k === middle) {
				continue;
			}
			let colour = at.k % 2 ? LIME_ALT : LIME;
			if (at.joint) {
				colour = JOINT;
			} else if (at.d > RO - 1.2) {
				colour = x <= CX ? LIME_LIGHT : LIME;
			} else if (at.d <= RI + 1) {
				colour = LIME_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	pier(scene, CX - RO, CX - RI - 1);
	pier(scene, CX + RI + 1, CX + RO);
}

/**
 * One pier of coursed blocks from the arch's springing down to the yard, lit on its left.
 * @param {Canvas} scene
 * @param {number} left - First column
 * @param {number} right - Last column
 */
function pier(scene, left, right) {
	for (let y = CY + 1; y <= YARD; y++) {
		const course = Math.floor((y - CY - 1) / 4);
		for (let x = left; x <= right; x++) {
			let colour = course % 2 ? LIME_ALT : LIME;
			if ((y - CY - 1) % 4 === 3 || (x - left + course * 4) % 8 === 7) {
				colour = JOINT;
			} else if (x === left) {
				colour = LIME_LIGHT;
			} else if (x === right) {
				colour = LIME_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The timber centering that holds the ring up until the keystone locks it: a curved rib under
 * the stones, struts fanning out from a hub on the tie beam, and a post and two raking shores below.
 * @param {Canvas} scene
 */
function drawCentering(scene) {
	for (let y = CY - RI; y <= CY; y++) {
		for (let x = CX - RI; x <= CX + RI; x++) {
			const d = Math.hypot(x - CX, CY - y);
			if (d <= RI && d > RI - 2) {
				set(scene, x, y, d > RI - 1 ? C.timberLight : C.timber);
			}
		}
	}
	for (const degrees of [30, 60, 90, 120, 150]) {
		const angle = (degrees * Math.PI) / 180;
		line(
			scene,
			CX,
			CY,
			CX + Math.round(Math.cos(angle) * (RI - 2)),
			CY - Math.round(Math.sin(angle) * (RI - 2)),
			degrees < 90 ? C.timber : C.timberLight
		);
	}
	rect(scene, CX - RI, CY + 1, RI * 2 + 1, 1, C.timberLight);
	rect(scene, CX - RI, CY + 2, RI * 2 + 1, 1, C.timber);
	rect(scene, CX - 1, CY - 1, 3, 3, C.timberShade);
	rect(scene, CX, CY + 3, 1, YARD - CY - 2, C.timber);
	line(scene, CX, CY + 3, CX - 8, YARD, C.timber);
	line(scene, CX, CY + 3, CX + 8, YARD, C.timberShade);
}

/**
 * The masons' scaffold on the left: two poles, ledgers and a plank deck at the crown's height.
 * @param {Canvas} scene
 */
function drawScaffold(scene) {
	for (const px of [1, 7]) {
		rect(scene, px, 16, 1, YARD - 15, C.timber);
	}
	for (const ly of [33, 47]) {
		rect(scene, 0, ly, 9, 1, C.timber);
	}
	rect(scene, 0, 19, 15, 1, C.timberLight);
	rect(scene, 0, 20, 15, 1, C.timberShade);
}

/**
 * A mason on the scaffold deck, reaching out to steady the keystone.
 * @param {Canvas} scene
 */
function drawMason(scene) {
	const x = 9;
	const feet = 18;
	drawFigure(scene, { x, y: feet, facing: 'right', clothes: C.daySea2 });
	set(scene, x + 5, feet - 5, C.daySea2);
	set(scene, x + 6, feet - 6, C.skin);
	set(scene, x + 7, feet - 7, C.skin);
}

/**
 * Where a point lies in the hanging keystone's own frame: turned back by its tilt, measured from its centre.
 * @param {number} x
 * @param {number} y
 * @returns {[number, number]}
 */
function local(x, y) {
	const dx = x - STONE_X;
	const dy = y - STONE_Y;
	const cos = Math.cos(TILT);
	const sin = Math.sin(TILT);
	return [dx * cos + dy * sin, -dx * sin + dy * cos];
}

/**
 * The middle of the hanging keystone's top edge, where the rope holds it.
 * @returns {[number, number]}
 */
function top() {
	return [
		Math.round(STONE_X + 5.5 * Math.sin(TILT)),
		Math.round(STONE_Y - 5.5 * Math.cos(TILT)),
	];
}

/**
 * The keystone swinging in on the rope, tilted: a wedge wider at the top, like the slot waiting for it.
 * @param {Canvas} scene
 */
function drawKeystone(scene) {
	for (let y = STONE_Y - 8; y <= STONE_Y + 8; y++) {
		for (let x = STONE_X - 8; x <= STONE_X + 8; x++) {
			const [u, v] = local(x, y);
			const half = 4.6 - ((v + 5) / 9) * 2;
			if (v < -5 || v > 4 || Math.abs(u) > half) {
				continue;
			}
			let colour = LIME;
			if (v < -3.6 || u < -half + 1.1) {
				colour = LIME_LIGHT;
			} else if (u > half - 1.3 || v > 2.8) {
				colour = LIME_SHADE;
			} else if ((x * 3 + y * 5) % 11 === 0) {
				colour = LIME_ALT;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Spare dressed stones waiting in the yard.
 * @param {Canvas} scene
 */
function drawBlocks(scene) {
	for (const [x, y, w, h] of [
		[13, 53, 6, 4],
		[15, 50, 4, 3],
		[37, 54, 5, 3],
	]) {
		for (let j = 0; j < h; j++) {
			for (let i = 0; i < w; i++) {
				const colour =
					j === 0
						? LIME_LIGHT
						: i === w - 1 || j === h - 1
							? LIME_SHADE
							: LIME;
				set(scene, x + i, y + j, colour);
			}
		}
	}
}

/**
 * The crane: a mast behind the treadwheel, a jib rising from its head out over the crown, and the wheel frame's legs.
 * @param {Canvas} scene
 */
function drawCrane(scene) {
	// The mast, standing behind the wheel.
	rect(scene, MAST, MAST_TOP - 1, 3, WHEEL_Y - MAST_TOP + 1, C.timber);
	rect(scene, MAST, MAST_TOP - 1, 1, WHEEL_Y - MAST_TOP + 1, C.timberLight);
	rect(
		scene,
		MAST + 2,
		MAST_TOP - 1,
		1,
		WHEEL_Y - MAST_TOP + 1,
		C.timberShade
	);
	// The jib, rising from the mast's head out over the crown, and its brace.
	line(scene, TIP_X, TIP_Y, MAST + 2, MAST_TOP - 1, C.timberLight);
	line(scene, TIP_X, TIP_Y + 1, MAST + 2, MAST_TOP, C.timber);
	line(scene, MAST, MAST_TOP + 8, MAST - 7, MAST_TOP - 6, C.timber);
	// The pulley block at the jib's tip.
	rect(scene, TIP_X - 1, TIP_Y, 3, 2, C.wood);
	// The frame's legs, splayed under the hub.
	for (const dx of [-9, 9]) {
		line(scene, WHEEL_X, WHEEL_Y, WHEEL_X + dx, YARD, C.timber);
		line(
			scene,
			WHEEL_X + 1,
			WHEEL_Y,
			WHEEL_X + dx + 1,
			YARD,
			C.timberShade
		);
	}
}

/**
 * The treadwheel at the boom's foot, with its walker inside. Drawn after the outline so its spokes stay open.
 * @param {Canvas} scene
 */
function drawTreadwheel(scene) {
	drawWheel(scene, { x: WHEEL_X, y: WHEEL_Y, r: WHEEL_R, spokes: 12 });
	// Treads across the inside of the rim.
	for (let i = 0; i < 28; i++) {
		const angle = (i / 28) * Math.PI * 2;
		set(
			scene,
			WHEEL_X + Math.round(Math.cos(angle) * (WHEEL_R - 2)),
			WHEEL_Y + Math.round(Math.sin(angle) * (WHEEL_R - 2)),
			i % 2 ? C.timberLight : C.timber
		);
	}
	drawFigure(scene, {
		x: WHEEL_X - 2,
		y: WHEEL_Y + WHEEL_R - 3,
		facing: 'left',
		clothes: C.brickRed,
	});
}

/**
 * The ropes: from the jib's tip down to the keystone, and the hoist rope back to the wheel.
 * @param {Canvas} scene
 */
function drawRopes(scene) {
	const [, ty] = top();
	for (let y = TIP_Y + 2; y < ty; y++) {
		set(scene, TIP_X, y, C.wood);
	}
	// The hoist rope runs under the jib to the mast's head, then down the mast to the wheel's axle.
	line(scene, TIP_X + 2, TIP_Y + 3, MAST - 1, MAST_TOP + 1, C.wood);
	for (let y = MAST_TOP + 1; y < WHEEL_Y - WHEEL_R; y++) {
		set(scene, MAST - 1, y, C.wood);
	}
}

/**
 * The lewis: the iron set in the keystone's top that the rope lifts it by. Drawn after the outline, so it stays fine.
 * @param {Canvas} scene
 */
function drawLewis(scene) {
	const [x, y] = top();
	set(scene, x, y, C.stoneShade);
}
