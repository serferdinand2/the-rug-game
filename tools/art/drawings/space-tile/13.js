// Space tile 13: a black hole, its blazing gold accretion disc tilted across the dark, the light of the far side bent up over the top of the black centre and under its bottom.
import { createCanvas, get, set, mix, seededRandom } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The hole's centre and the radius of its black shadow. */
const HOLE = { x: 32, y: 31, r: 8 };

/** The disc: its inner and outer radius, how far it is tipped towards the viewer (the squash of its ellipse) and its slant across the frame. */
const DISC = { inner: 10.5, outer: 27, squash: 0.25, slant: -0.17 };

/** How thick the bent light is over the top of the hole and under its bottom, at its thickest. */
const ARC_TOP = 8;
const ARC_BOTTOM = 2.4;

/** The black of space, from the far dark to the warmer black near the hole. */
const SPACE = [C.ink, mix(C.ink, C.night, 0.6), mix(C.night, C.wood, 0.25)];

/** The gold of the light that spills from the disc into space, and its halo's bands from faint to strong. */
const GLOW = mix(C.amber, C.brickRed, 0.2);
const HALO = [0.08, 0.15, 0.23, 0.32, 0.42].map((t) => mix(SPACE[1], GLOW, t));

/** How far the halo reaches from the hole, across and along the disc. */
const HALO_REACH = { a: 34, b: 22 };

/** A faint red cloud of gas drifting far behind the hole. */
const NEBULA = [
	mix(SPACE[0], C.brickRedShade, 0.12),
	mix(SPACE[0], C.brickRedShade, 0.22),
];

/** The hole's shadow: darker than the space round it. */
const SHADOW = C.ink;

/** The disc's light, from dim red at its rim to white-hot at its inner edge. */
const HEAT = [
	mix(C.brickRedShade, C.night, 0.45),
	mix(C.brickRedShade, C.night, 0.15),
	C.brickRedShade,
	mix(C.brickRed, C.brickRedShade, 0.4),
	mix(C.brickRed, C.amber, 0.2),
	mix(C.amber, C.brickRed, 0.4),
	mix(C.amber, C.brickRed, 0.15),
	C.amber,
	mix(C.amber, C.gold, 0.5),
	C.gold,
	mix(C.gold, C.lampGlow, 0.5),
	C.lampGlow,
	C.white,
];

/** Far stars whose light the hole bends into short arcs round it: each arc's angle, distance and length. */
const LENSED = [
	{ angle: -2.55, d: 18, span: 0.1 },
	{ angle: -0.5, d: 20, span: 0.08 },
	{ angle: 2.3, d: 14, span: 0.12 },
];

/** The fainter ends of the lensed stars' arcs. */
const LENSED_DIM = mix(C.starDim, C.night, 0.4);

/** The disc's light on its left, where its gas rushes towards the viewer and burns whiter, and on its right, where it rushes away and reddens. */
const HEAT_NEAR = HEAT.map((colour) => mix(colour, C.gold, 0.2));
const HEAT_FAR = HEAT.map((colour) => mix(colour, C.brickRed, 0.22));

/** How far from the hole, along the disc, its light turns whiter on the left and redder on the right. */
const SHIFT = 9;

/**
 * Draws space tile 13.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const canvas = createCanvas(64, 64);
	const random = seededRandom(13013);

	drawSpace(canvas, random);
	drawHalo(canvas);
	drawLensedStars(canvas);
	drawDisc(canvas, false);
	drawTopArc(canvas);
	drawShadow(canvas);
	drawBottomArc(canvas);
	drawDisc(canvas, true);
	drawSparkles(canvas);
	return canvas;
}

/**
 * Turns a pixel into the disc's own frame: along its long axis, and across it.
 * @param {number} x
 * @param {number} y
 * @returns {{ a: number, b: number }} `a` along the disc, positive to the right; `b` across it, positive towards the viewer (down).
 */
function toDisc(x, y) {
	const dx = x + 0.5 - HOLE.x;
	const dy = y + 0.5 - HOLE.y;
	const cos = Math.cos(DISC.slant);
	const sin = Math.sin(DISC.slant);
	return { a: dx * cos + dy * sin, b: -dx * sin + dy * cos };
}

/**
 * Picks a colour from the heat ramp, from 0 (dim red) to 1 (white-hot): whiter on the disc's left and redder on its right,
 * dithered where the two meet.
 * @param {number} t
 * @param {number} [a] - Position along the disc, negative on the left
 * @param {number} [x] - The pixel's column, for the dither
 * @param {number} [y] - The pixel's row, for the dither
 * @returns {Colour}
 */
function heat(t, a = 0, x = 0, y = 0) {
	const i = Math.round(Math.max(0, Math.min(1, t)) * (HEAT.length - 1));
	const edge = Math.abs(a) - SHIFT;
	if (edge > 2 || (edge > 0 && (x + y) % 2 === 0)) {
		return a < 0 ? HEAT_NEAR[i] : HEAT_FAR[i];
	}
	return HEAT[i];
}

/**
 * How bright the disc burns at a point: hottest at its inner edge, with streaks of hotter and cooler gas
 * swirling round it, and brighter on the left, where its gas rushes towards the viewer.
 * @param {number} r - Distance from the hole, in the disc's plane
 * @param {number} angle - Angle round the disc
 * @param {number} a - Position along the disc, negative on the left
 * @returns {number} 0 to 1.
 */
function burn(r, angle, a) {
	const fall = 1 - (r - DISC.inner) / (DISC.outer - DISC.inner);
	const streak =
		Math.sin(r * 1.35 + angle * 2) * 0.08 +
		Math.sin(r * 0.55 - angle * 3 + 1.1) * 0.07;
	const beaming = (-a / DISC.outer) * 0.16;
	return fall ** 1.2 + streak + beaming;
}

/**
 * Deep space: black, warming towards the hole, with a faint red cloud and stars in three brightnesses.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawSpace(canvas, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x - HOLE.x, (y - HOLE.y) * 1.3) / 13;
			const t = Math.max(0, 2.9 - d);
			const i = Math.min(SPACE.length - 1, Math.floor(t));
			const dither =
				i + 1 < SPACE.length && t - i > 0.6 && (x + y) % 2 === 0;
			let colour = SPACE[dither ? i + 1 : i];
			const cloud =
				Math.sin(x * 0.07 - y * 0.1 + 0.4) +
				0.35 * Math.sin(y * 0.23 + x * 0.17 + 2);
			if (i === 0 && cloud > 0.7) {
				colour = NEBULA[cloud > 1.05 && (x + y) % 2 === 0 ? 1 : 0];
			}
			set(canvas, x, y, colour);
		}
	}
	const dim = mix(C.starDim, C.night, 0.55);
	const warm = mix(C.starDim, C.gold, 0.45);
	for (let i = 0; i < 55; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const roll = random();
		let colour = roll > 0.8 ? C.white : roll > 0.45 ? C.starDim : dim;
		if (roll > 0.4 && roll < 0.45) {
			colour = warm;
		}
		set(canvas, x, y, colour);
	}
}

/**
 * The disc's light spilling into space: a wide, soft halo in dithered bands that swallows the faint stars.
 * @param {Canvas} canvas
 */
function drawHalo(canvas) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { a, b } = toDisc(x, y);
			const d = Math.hypot(a / HALO_REACH.a, b / HALO_REACH.b);
			if (d >= 1) {
				continue;
			}
			const t = (1 - d) ** 1.4 * HALO.length;
			const band = Math.floor(t);
			const up = t - band > 0.5 && (x + y) % 2 === 0;
			const i = Math.min(HALO.length - 1, band + (up ? 1 : 0)) - 1;
			if (i >= 0) {
				set(canvas, x, y, HALO[i]);
			} else if (up) {
				set(canvas, x, y, HALO[0]);
			}
		}
	}
}

/**
 * Far stars whose light the hole bends into short arcs hugging it.
 * @param {Canvas} canvas
 */
function drawLensedStars(canvas) {
	for (const { angle, d, span } of LENSED) {
		for (let s = -span; s <= span; s += 0.04) {
			const x = Math.round(HOLE.x + Math.cos(angle + s) * d);
			const y = Math.round(HOLE.y + Math.sin(angle + s) * d);
			set(canvas, x, y, Math.abs(s) < span / 3 ? C.starDim : LENSED_DIM);
		}
	}
}

/**
 * One half of the disc in its plane: the far half behind the hole, or the near half that crosses in front of it.
 * @param {Canvas} canvas
 * @param {boolean} near
 */
function drawDisc(canvas, near) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { a, b } = toDisc(x, y);
			if (near !== b > 0) {
				continue;
			}
			const r = Math.hypot(a, b / DISC.squash);
			if (r < DISC.inner || r > DISC.outer) {
				continue;
			}
			// The rim's last pixels thin out into the halo.
			if (r > DISC.outer - 1.5 && (x + y) % 2 === 0) {
				continue;
			}
			const angle = Math.atan2(b / DISC.squash, a);
			set(canvas, x, y, heat(burn(r, angle, a), a, x, y));
		}
	}
}

/**
 * The light of the disc's far side, bent up and over the top of the hole: a broad arch, thickest at its crown,
 * thinning to meet the disc at either side, and fading from white-hot at the hole out through gold to red.
 * @param {Canvas} canvas
 */
function drawTopArc(canvas) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { a, b } = toDisc(x, y);
			if (b > 0) {
				continue;
			}
			const d = Math.hypot(a, b);
			const lift = Math.atan2(-b, a);
			const thick = 3 + (ARC_TOP - 3) * Math.sin(lift);
			const depth = (d - HOLE.r) / thick;
			if (depth < 0 || depth > 1) {
				continue;
			}
			if (depth > 0.85 && (x + y) % 2 === 0) {
				continue;
			}
			const streak = Math.sin(lift * 11 + d * 0.9) * 0.07;
			set(
				canvas,
				x,
				y,
				heat(
					1.02 - depth ** 1.3 * 0.95 + streak - (a / 40) * 0.5,
					a,
					x,
					y
				)
			);
		}
	}
}

/**
 * The hole: a black disc ringed by a thin, blazing ring of light that has circled it.
 * @param {Canvas} canvas
 */
function drawShadow(canvas) {
	for (let y = HOLE.y - HOLE.r - 1; y <= HOLE.y + HOLE.r + 1; y++) {
		for (let x = HOLE.x - HOLE.r - 1; x <= HOLE.x + HOLE.r + 1; x++) {
			const d = Math.hypot(x + 0.5 - HOLE.x, y + 0.5 - HOLE.y);
			if (d <= HOLE.r - 0.7) {
				set(canvas, x, y, SHADOW);
			} else if (d <= HOLE.r + 0.3) {
				set(canvas, x, y, x < HOLE.x + 2 ? C.white : C.lampGlow);
			}
		}
	}
}

/**
 * The light of the disc's underside, bent down under the bottom of the hole: a thin arc below the near disc.
 * @param {Canvas} canvas
 */
function drawBottomArc(canvas) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { a, b } = toDisc(x, y);
			if (b <= 0) {
				continue;
			}
			const d = Math.hypot(a, b);
			const drop = Math.atan2(b, a);
			const thick = 1.8 + (ARC_BOTTOM - 1.8) * Math.sin(drop);
			const depth = (d - HOLE.r - 0.3) / thick;
			if (depth < 0 || depth > 1) {
				continue;
			}
			set(
				canvas,
				x,
				y,
				heat(0.8 - depth * 0.45 - (a / 40) * 0.5, a, x, y)
			);
		}
	}
}

/**
 * Four-point sparkles: a few far stars, kept clear of the disc, the nearer ones tinted by its light.
 * @param {Canvas} canvas
 */
function drawSparkles(canvas) {
	for (const [x, y] of [
		[9, 8],
		[54, 9],
		[7, 54],
		[56, 52],
		[44, 59],
	]) {
		set(canvas, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const behind = /** @type {Colour} */ (get(canvas, x + dx, y + dy));
			set(canvas, x + dx, y + dy, mix(behind, C.starDim, 0.75));
		}
	}
}
