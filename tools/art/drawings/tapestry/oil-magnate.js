// Oil Magnate: a timber derrick on an open desert at sundown, a black gusher of oil bursting from its crown, casks at its foot.
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
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The row the sun sets on and the far derricks stand on, the sand's top row, and the sun's column
 * (seed 151 sets the dusk sky's own small sun there, under the big one). */
const HORIZON = 44;
const SAND = 48;
const SUN_X = 48;

/** The derrick's floor row, its crown row, and its two legs' columns at the foot and at the crown. */
const FOOT = 51;
const CROWN = 17;
const LEFT_FOOT = 8;
const RIGHT_FOOT = 30;
const LEFT_TOP = 16;
const RIGHT_TOP = 22;

/** The gusher's centre column. */
const JET = 19;

/**
 * Draws the Oil Magnate scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(151);

	drawSky(layer, { time: 'dusk', horizon: SAND - 1, random });
	warmSky(layer);
	drawSun(layer);
	drawFarDerricks(layer);
	drawTerrain(layer, { kind: 'desert', top: SAND, random });
	warmSand(layer);
	drawOilPool(layer);

	drawDerrick(scene);
	drawGusher(scene);
	drawCasks(scene);
	drawFigure(scene, { x: 52, y: 58, facing: 'left', clothes: C.roof });
	outline(scene, C.ink);
	underlay(scene, layer);
	drawHat(scene);
	drawSpray(scene);
	drawDrops(scene);
	return scene;
}

/**
 * Moves every band of the dusk sky one step warmer, and clears the stars: the sun is not down yet.
 * @param {Canvas} layer
 */
function warmSky(layer) {
	/** @type {Record<string, Colour>} */
	const warmer = {
		[C.duskSky1]: C.duskSky2,
		[C.duskSky2]: C.duskSky3,
		[C.duskSky3]: C.duskSky4,
		[C.duskSky4]: C.duskSky5,
		[C.duskSky5]: C.duskSky6,
		[C.starDim]: C.duskSky2,
	};
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour && warmer[colour]) {
			layer.p[i] = warmer[colour];
		}
	}
}

/**
 * A big low sun sinking into the dunes, ringed with glow.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = HORIZON - 16; y <= HORIZON; y++) {
		for (let x = SUN_X - 16; x <= SUN_X + 16; x++) {
			const d = (x - SUN_X) ** 2 + (y - HORIZON) ** 2;
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			if (d <= 60) {
				set(layer, x, y, C.lampGlow);
			} else if (d <= 120) {
				set(layer, x, y, C.gold);
			} else if (d <= 150) {
				set(layer, x, y, C.amber);
			} else if (d <= 250) {
				set(layer, x, y, mix(behind, C.amber, 0.3));
			}
		}
	}
}

/**
 * Two small derricks on the far horizon, solid black against the sun.
 * @param {Canvas} layer
 */
function drawFarDerricks(layer) {
	for (const [cx, h] of [
		[43, 13],
		[55, 9],
	]) {
		for (let j = 0; j <= h; j++) {
			const y = HORIZON + 1 - j;
			const half = Math.floor((h - j) / 5);
			for (let x = cx - half; x <= cx + half; x++) {
				set(layer, x, y, C.roofShade);
			}
		}
		set(layer, cx - 1, HORIZON + 1 - h, C.roofShade);
		set(layer, cx + 1, HORIZON + 1 - h, C.roofShade);
	}
}

/**
 * Tints the sand with the sunset: warm on the lit slopes, rosy in the shade.
 * @param {Canvas} layer
 */
function warmSand(layer) {
	/** @type {Record<string, Colour>} */
	const tints = {
		[C.sandLight]: mix(C.sandLight, C.duskSky6, 0.35),
		[C.sand]: mix(C.sand, C.duskSky5, 0.35),
		[C.sandShade]: mix(C.sandShade, C.duskSky4, 0.4),
	};
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour && tints[colour]) {
			layer.p[i] = tints[colour];
		}
	}
}

/**
 * A black pool of oil spreading round the derrick's foot, with the sunset caught in streaks.
 * @param {Canvas} layer
 */
function drawOilPool(layer) {
	for (let y = FOOT - 1; y <= 60; y++) {
		for (let x = 0; x <= 40; x++) {
			const wobble = Math.sin(x * 0.7) * 0.6;
			const d = ((x - 19) / 20) ** 2 + ((y - 54 + wobble) / 5) ** 2;
			if (d <= 1) {
				const sheen = (y === 54 || y === 57) && (x * 3 + y) % 9 < 4;
				set(layer, x, y, sheen ? C.duskSky4 : C.night);
			}
		}
	}
}

/**
 * Plots a one-pixel line between two points.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {Colour} colour
 */
function line(canvas, x0, y0, x1, y1, colour) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
	for (let i = 0; i <= steps; i++) {
		const t = steps === 0 ? 0 : i / steps;
		set(
			canvas,
			Math.round(x0 + (x1 - x0) * t),
			Math.round(y0 + (y1 - y0) * t),
			colour
		);
	}
}

/**
 * The column a leg stands in at a given row, between its foot and the crown.
 * @param {number} foot - The leg's column at the foot
 * @param {number} top - The leg's column at the crown
 * @param {number} y
 * @returns {number}
 */
function legX(foot, top, y) {
	return Math.round(foot + ((top - foot) * (FOOT - y)) / (FOOT - CROWN));
}

/**
 * The derrick: two tapering timber legs, girts and cross-braces, a crown block on top and a
 * plank floor. Its right-hand edges catch the setting sun.
 * @param {Canvas} scene
 */
function drawDerrick(scene) {
	const girts = [FOOT - 1, 41, 32, 24, CROWN];
	// One cross-brace in each panel but the narrow top one, alternating, as a Howe truss.
	for (let i = 0; i + 2 < girts.length; i++) {
		const y0 = girts[i];
		const y1 = girts[i + 1];
		const a = legX(LEFT_FOOT, LEFT_TOP, y0) + 2;
		const b = legX(RIGHT_FOOT, RIGHT_TOP, y0) - 2;
		const c = legX(LEFT_FOOT, LEFT_TOP, y1) + 2;
		const d = legX(RIGHT_FOOT, RIGHT_TOP, y1) - 2;
		if (i % 2 === 0) {
			line(scene, a, y0, d, y1, C.timber);
		} else {
			line(scene, b, y0, c, y1, C.timber);
		}
	}
	for (const y of girts) {
		for (
			let x = legX(LEFT_FOOT, LEFT_TOP, y);
			x <= legX(RIGHT_FOOT, RIGHT_TOP, y);
			x++
		) {
			set(scene, x, y, C.timber);
		}
	}
	// The legs, two pixels thick: shaded on the left, lit by the sun on the right.
	for (let y = CROWN; y <= FOOT; y++) {
		const left = legX(LEFT_FOOT, LEFT_TOP, y);
		const right = legX(RIGHT_FOOT, RIGHT_TOP, y);
		set(scene, left, y, C.timberShade);
		set(scene, left + 1, y, C.timber);
		set(scene, right - 1, y, C.timberLight);
		set(scene, right, y, C.amber);
	}
	// The crown block.
	rect(scene, LEFT_TOP - 2, CROWN - 2, RIGHT_TOP - LEFT_TOP + 5, 2, C.timber);
	rect(scene, RIGHT_TOP, CROWN - 2, 3, 2, C.amber);
	// The plank floor.
	rect(scene, LEFT_FOOT - 3, FOOT, RIGHT_FOOT - LEFT_FOOT + 7, 2, C.timber);
	rect(
		scene,
		LEFT_FOOT - 3,
		FOOT,
		RIGHT_FOOT - LEFT_FOOT + 7,
		1,
		C.timberLight
	);
}

/**
 * The gusher's jet: a solid column of black oil roaring up out of the crown and widening as it
 * rises, its top and sunward side glinting amber and gold.
 * @param {Canvas} scene
 */
function drawGusher(scene) {
	for (let y = 1; y <= CROWN - 3; y++) {
		const half = 1 + Math.floor((CROWN - 3 - y) * 0.36);
		for (let x = JET - half; x <= JET + half; x++) {
			let colour = oil(x, y, JET - half, JET + half);
			if (y === 1) {
				colour = x > JET - 1 ? C.gold : C.roofLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The spray round the jet: a fan of oil, dense near the jet, breaking into drops as it rises
 * and spreads. Drawn after the outline, so each drop stays small; the sunward drops glint.
 * @param {Canvas} scene
 */
function drawSpray(scene) {
	for (let y = 0; y <= CROWN - 5; y++) {
		const half = 2 + Math.floor((CROWN - 3 - y) * 0.85);
		for (let x = JET - half; x <= JET + half; x++) {
			const near = Math.abs(x - JET) <= half * 0.5;
			const drop = near ? (x + y) % 2 === 0 : (x * 3 + y * 5) % 4 === 0;
			if (get(scene, x, y) === C.ink || !drop) {
				continue;
			}
			if (Math.abs(x - JET) > half - 2 && (x + y) % 3 === 0) {
				continue;
			}
			const glint = x > JET && (x + y) % 5 === 0;
			set(scene, x, y, glint ? C.amber : C.night);
		}
	}
}

/**
 * The colour of one pixel of oil: black, with a gold-and-amber rim on the sunward right and a
 * dull purple sheen on the left.
 * @param {number} x
 * @param {number} y
 * @param {number} left - The shape's leftmost column on this row
 * @param {number} right - The shape's rightmost column on this row
 * @returns {Colour}
 */
function oil(x, y, left, right) {
	if (x === right) {
		return C.amber;
	}
	// Streaks inside the jet where the oil shoots up fastest.
	if ((x - JET + 12) % 5 === 0 && (y + x) % 4 !== 0 && x > JET) {
		return C.lampFrame;
	}
	if (x === right - 1 && y % 3 === 0) {
		return C.lampFrame;
	}
	if (x === left) {
		return C.roof;
	}
	return C.night;
}

/**
 * Three wooden casks by the derrick's foot: bellied, with dark iron hoops and a lit rim.
 * @param {Canvas} scene
 */
function drawCasks(scene) {
	for (const [bx, base] of [
		[33, FOOT + 1],
		[40, FOOT + 1],
		[36, FOOT + 6],
	]) {
		for (let y = base - 7; y <= base; y++) {
			const belly = y === base - 7 || y === base ? 0 : 1;
			for (let x = bx - belly; x < bx + 5 + belly; x++) {
				let colour = C.timber;
				if (x <= bx) {
					colour = C.timberShade;
				} else if (x >= bx + 3) {
					colour = C.timberLight;
				}
				if (y === base - 5 || y === base - 2) {
					colour = x >= bx + 3 ? C.stone : C.wood;
				}
				set(scene, x, y, colour);
			}
		}
		rect(scene, bx, base - 7, 5, 1, C.sandLight);
		set(scene, bx + 4, base - 7, C.gold);
	}
}

/**
 * A tall black hat on the watching figure: he is the one who struck it rich.
 * @param {Canvas} scene
 */
function drawHat(scene) {
	rect(scene, 52, 48, 5, 1, C.ink);
	rect(scene, 53, 45, 3, 3, C.ink);
	set(scene, 55, 46, C.roofLight);
}

/**
 * The rain of oil: drops arcing out of the spray on both sides and falling in trails.
 * Drawn after the outline so each drop stays small; the sunward drops glint.
 * @param {Canvas} scene
 */
function drawDrops(scene) {
	for (const side of [-1, 1]) {
		for (const [reach, start, from] of [
			[0.5, 6, 9],
			[0.8, 4, 11],
			[1.1, 7, 12],
			[1.4, 5, 13],
		]) {
			for (let t = 2; t <= 26; t += 2) {
				const x = JET + side * (from + Math.round(reach * t * 0.5));
				const y = start + Math.round((t * t) / 22);
				if (x < 0 || x > 63 || y > HORIZON - 3) {
					continue;
				}
				if (get(scene, x, y) === C.ink) {
					continue;
				}
				set(scene, x, y, C.night);
				if (t > 8) {
					set(scene, x, y + 1, C.night);
				}
				if ((t + start) % 4 === 1) {
					set(scene, x, y - 1, side > 0 ? C.amber : C.roof);
				}
			}
		}
	}
}
