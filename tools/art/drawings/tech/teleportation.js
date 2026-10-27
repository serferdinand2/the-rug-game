// Teleportation: a wooden crate dissolving into teal sparkles on one round pad and reappearing on a second pad at night.
import {
	createCanvas,
	get,
	set,
	clear,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A crate seen from the front and a little above: its front face, and how far its top and right side recede.
 * @typedef {{ left: number, top: number, w: number, h: number, depth: number }} Crate
 */

/**
 * A round pad seen from above at a slant: its centre, its radii and the thickness of its rim.
 * @typedef {{ x: number, y: number, rx: number, ry: number }} Pad
 */

/** The horizon's row. */
const HORIZON = 40;

/** The near pad on the left, where the crate leaves, and the far pad on the right, where it arrives. */
const PADS = /** @type {const} */ ([
	{ x: 18, y: 55, rx: 16, ry: 4 },
	{ x: 49, y: 47, rx: 13, ry: 3 },
]);

/** The two crates: the same crate, the far one smaller. */
const LEAVING = { left: 5, top: 36, w: 21, h: 19, depth: 6 };
const ARRIVING = { left: 38, top: 31, w: 17, h: 16, depth: 5 };

/**
 * Where the crates break up. The leaving crate goes from its far top corner, towards the pad it is bound for:
 * the line it is gone above starts at a row and drops by a slope across it. The arriving crate builds up from the bottom.
 */
const LEAVING_LINE = { row: 25, slope: 0.8 };
const ARRIVING_LINE = { row: 37, slope: 0 };

/** The night: the far ground, the near ground, and the ground and sky lit by the pads. */
const GROUND = C.headland;
const GROUND_RIDGE = C.headlandRidge;
const LIT = mix(C.headland, C.teal, 0.3);
const LIT_BRIGHT = mix(C.headland, C.tealLight, 0.45);

/** The pads: a steel top, its shaded rim, and the glowing ring inlaid in it. */
const STEEL = C.stoneMid;
const STEEL_LIGHT = C.stoneLight;
const STEEL_SHADE = C.stoneShade;
const STEEL_DARK = mix(C.stoneShade, C.ink, 0.4);

/**
 * Draws the Teleportation tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6582);

	drawSky(layer, random);
	drawGround(layer);
	for (const pad of PADS) {
		drawBeam(layer, pad);
	}

	for (const pad of PADS) {
		drawPad(scene, pad);
	}
	outline(scene, C.ink);
	const leaving = createCanvas(64, 64);
	drawCrate(leaving, LEAVING, random);
	outline(leaving, C.ink);
	dissolve(leaving, LEAVING_LINE, random);
	stamp(scene, leaving);
	const arriving = createCanvas(64, 64);
	drawCrate(arriving, ARRIVING, random);
	outline(arriving, C.ink);
	materialise(arriving, ARRIVING, ARRIVING_LINE, random);
	stamp(scene, arriving);
	underlay(scene, layer);

	drawSparkles(scene, random);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * Tells how far out a point lies in a pad's ellipse: 0 at the centre, 1 on the edge.
 * @param {number} x
 * @param {number} y
 * @param {Pad} pad
 * @returns {number}
 */
function reach(x, y, pad) {
	return Math.hypot((x - pad.x) / pad.rx, (y - pad.y) / pad.ry);
}

/**
 * The night sky in plain bands, lightest at the horizon, with a few stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	const bands = [
		C.nightSky1,
		C.nightSky2,
		C.nightSky3,
		C.nightSky4,
		C.nightSky5,
	];
	for (let y = 0; y < HORIZON; y++) {
		rect(layer, 0, y, 64, 1, bands[Math.min(4, Math.floor(y / 8))]);
	}
	for (let i = 0; i < 10; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * (HORIZON - 8)),
			C.starDim
		);
	}
}

/**
 * The flat ground, a ridge on the horizon, and teal light pooled round each pad.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	rect(layer, 0, HORIZON, 64, 64 - HORIZON, GROUND);
	rect(layer, 0, HORIZON, 64, 1, GROUND_RIDGE);
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			for (const pad of PADS) {
				const pool = { ...pad, rx: pad.rx * 1.6, ry: pad.ry * 2 };
				const d = reach(x, y, pool);
				if (d < 0.75) {
					set(layer, x, y, LIT_BRIGHT);
				} else if (d < 1 && get(layer, x, y) !== LIT_BRIGHT) {
					set(layer, x, y, LIT);
				}
			}
		}
	}
}

/**
 * A column of teal light rising from a pad into the night, in two bands, brighter near the pad.
 * @param {Canvas} layer
 * @param {Pad} pad
 */
function drawBeam(layer, pad) {
	const half = pad.rx - 3;
	for (let y = 0; y < pad.y; y++) {
		for (let x = pad.x - half; x <= pad.x + half; x++) {
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			const edge = Math.abs(x - pad.x) > half - 2;
			const low = y > pad.y - 26;
			const t = (low ? 0.3 : 0.15) * (edge ? 0.5 : 1);
			set(layer, x, y, mix(behind, C.teal, t));
		}
	}
}

/**
 * A pad: a steel disc with a shaded rim below, a lit near edge, and a glowing teal ring inlaid in its top.
 * @param {Canvas} scene
 * @param {Pad} pad
 */
function drawPad(scene, pad) {
	const rim = 2;
	for (let y = Math.floor(pad.y - pad.ry); y <= pad.y + pad.ry + rim; y++) {
		for (let x = pad.x - pad.rx; x <= pad.x + pad.rx; x++) {
			const top = reach(x, y, pad);
			const below = reach(x, y - rim, pad);
			if (top < 1) {
				let colour = STEEL;
				if (top > 0.62 && top < 0.82) {
					colour = C.tealLight;
				} else if (top < 0.35) {
					colour = C.teal;
				} else if (y < pad.y && top > 0.82) {
					colour = STEEL_LIGHT;
				}
				set(scene, x, y, colour);
			} else if (below < 1) {
				set(
					scene,
					x,
					y,
					x < pad.x - pad.rx / 2 ? STEEL_SHADE : STEEL_DARK
				);
			}
		}
	}
}

/**
 * A wooden crate: a frame of boards round planked faces, a lit top and a shaded right side.
 * @param {Canvas} canvas
 * @param {Crate} crate
 * @param {() => number} random
 */
function drawCrate(canvas, crate, random) {
	const { left, top, w, h, depth } = crate;
	const right = left + w - 1;
	const bottom = top + h - 1;
	// The top, receding up and to the right, with its frame boards.
	for (let k = 1; k <= depth; k++) {
		const edge = k === 1 || k === depth;
		rect(canvas, left + k, top - k, w, 1, edge ? C.timberLight : C.sand);
		set(canvas, left + k, top - k, C.timberLight);
		set(canvas, right + k, top - k, C.timberLight);
	}
	// The right side.
	for (let k = 1; k <= depth; k++) {
		for (let y = top - k + 1; y <= bottom - k; y++) {
			const frame = k === depth || y === top - k + 1 || y === bottom - k;
			set(canvas, right + k, y, frame ? C.timber : C.timberShade);
		}
	}
	// The front: planks with dark seams inside a frame of lit boards.
	rect(canvas, left, top, w, h, C.timber);
	const plank = h > 15 ? 4 : 3;
	for (let y = top + 2 + plank; y < bottom - 1; y += plank) {
		rect(canvas, left + 2, y, w - 4, 1, C.timberShade);
	}
	rect(canvas, left, top, w, 2, C.timberLight);
	rect(canvas, left, bottom - 1, w, 2, C.timberLight);
	rect(canvas, left, top, 2, h, C.timberLight);
	rect(canvas, right - 1, top, 2, h, C.timberLight);
	rect(canvas, right, top + 1, 1, h - 1, C.timber);
	rect(canvas, left + 1, bottom, w - 1, 1, C.timber);
	// A little grain on the planks.
	for (let i = 0; i < 4; i++) {
		const x = left + 3 + Math.floor(random() * (w - 8));
		const y = top + 3 + Math.floor(random() * (h - 6));
		if (get(canvas, x, y) === C.timber) {
			rect(canvas, x, y, 2, 1, C.timberShade);
		}
	}
	// Iron nails at the frame's corners.
	for (const [x, y] of [
		[left, top],
		[right - 1, top],
		[left, bottom - 1],
		[right - 1, bottom - 1],
	]) {
		set(canvas, x, y, C.stoneShade);
	}
}

/**
 * Tells the row a crate has broken up above at a column: a ragged, sloping line.
 * @param {number} x
 * @param {{ row: number, slope: number }} line
 * @returns {number}
 */
function ragged(x, line) {
	return Math.round(
		line.row +
			line.slope * x +
			Math.sin(x * 1.3) * 1.5 +
			Math.sin(x * 0.45 + 2)
	);
}

/**
 * Breaks the leaving crate up from the top: everything above a ragged line is gone, the edge glows,
 * and some of what was there lingers as teal flecks drifting upwards.
 * @param {Canvas} crate
 * @param {{ row: number, slope: number }} line
 * @param {() => number} random
 */
function dissolve(crate, line, random) {
	for (let x = 0; x < 64; x++) {
		const edge = ragged(x - LEAVING.left, line);
		for (let y = 0; y < 64; y++) {
			const pixel = get(crate, x, y);
			if (!pixel) {
				continue;
			}
			if (y < edge) {
				clear(crate, x, y);
				if (random() < 0.12) {
					const lift = 1 + Math.floor(random() * 6);
					set(
						crate,
						x + lift,
						y - lift,
						random() < 0.5 ? C.tealLight : C.teal
					);
				}
			} else {
				glowEdge(crate, x, y, y - edge, pixel);
			}
		}
	}
}

/**
 * Lights the wood along the line where a crate breaks up: the edge itself teal-white, the row below tinged teal.
 * @param {Canvas} crate
 * @param {number} x
 * @param {number} y
 * @param {number} below - How many rows below the edge the pixel lies
 * @param {Colour} pixel
 */
function glowEdge(crate, x, y, below, pixel) {
	if (below === 0) {
		set(crate, x, y, C.tealLight);
	} else if (below === 1 && pixel !== C.ink) {
		set(crate, x, y, mix(pixel, C.tealLight, 0.45));
	}
}

/**
 * Builds the arriving crate up from the bottom: below a ragged line it is solid, above it only its edges are there,
 * drawn in teal light, with flecks gathering inside.
 * @param {Canvas} crate
 * @param {Crate} box
 * @param {{ row: number, slope: number }} line
 * @param {() => number} random
 */
function materialise(crate, box, line, random) {
	const { left, top, w, h, depth } = box;
	const right = left + w - 1;
	const bottom = top + h - 1;
	for (let x = 0; x < 64; x++) {
		const edge = ragged(x + 7, line);
		for (let y = 0; y < 64; y++) {
			const pixel = get(crate, x, y);
			if (!pixel) {
				continue;
			}
			if (y < edge) {
				clear(crate, x, y);
				if (random() < 0.08) {
					set(crate, x, y, C.teal);
				}
			} else {
				glowEdge(crate, x, y, y - edge, pixel);
			}
		}
	}
	// The outline of the part still to come, traced in light.
	/** @param {number} x @param {number} y */
	const trace = (x, y) => {
		if (y < ragged(x + 7, line) && !get(crate, x, y)) {
			set(crate, x, y, C.tealLight);
		}
	};
	for (let y = top - depth - 1; y <= bottom; y++) {
		trace(left - 1, y);
		trace(right + 1, y);
	}
	for (let k = 0; k <= depth + 1; k++) {
		trace(left - 1 + k, top - k);
		trace(right + 1 + k, top - k);
		trace(right + 1 + k, bottom - k);
	}
	for (let x = left - 1; x <= right + 1; x++) {
		trace(x, top);
		trace(x + depth + 1, top - depth - 1);
	}
	for (let y = top - depth - 1; y <= bottom - depth - 1; y++) {
		trace(right + depth + 2, y);
	}
}

/**
 * The sparkles: a stream of teal flecks arcing from the leaving crate over to the arriving one, bright stars among them.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparkles(scene, random) {
	const from = { x: 18, y: 34 };
	const to = { x: 50, y: 26 };
	for (let i = 0; i < 80; i++) {
		const t = random();
		const spread = 3 + Math.sin(t * Math.PI) * 3;
		const x = Math.round(
			from.x + (to.x - from.x) * t + (random() - 0.5) * spread
		);
		const y = Math.round(
			from.y +
				(to.y - from.y) * t -
				Math.sin(t * Math.PI) * 24 +
				(random() - 0.5) * spread
		);
		const colour =
			i % 9 === 0 ? C.white : i % 3 === 0 ? C.teal : C.tealLight;
		set(scene, x, y, colour);
	}
	// A few four-point stars where the stream is thickest.
	for (const [x, y] of [
		[23, 17],
		[37, 11],
		[52, 20],
	]) {
		set(scene, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(scene, x + dx, y + dy, C.tealLight);
		}
	}
}
