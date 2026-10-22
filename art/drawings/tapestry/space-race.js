// Space Race: two rival rockets climbing side by side into the dusk on twin trails of smoke, the sun setting between them.
import {
	createCanvas,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row (seed 841 sets the dusk sun at column 32, between the trails). */
const HORIZON = 54;

/**
 * The two rockets: the column of each one's centre, the row of its nozzles, its flame's half-width and length,
 * and the column of the launch pad its trail runs back to. The right one is ahead.
 */
const LEFT = { x: 18, base: 33, flame: 3, length: 9, pad: 12 };
const RIGHT = { x: 45, base: 28, flame: 5, length: 10, pad: 52 };

/** The smoke, lit warm on the side facing the sunset and cool on the side away from it. */
const SMOKE = {
	core: C.creamLight,
	warm: mix(C.cream, C.duskSky6, 0.25),
	glow: mix(C.duskSky5, C.cream, 0.4),
	cool: mix(C.cloudShade, C.duskSky3, 0.45),
	deep: mix(C.cloudShade, C.duskSky2, 0.6),
};

/**
 * Draws the Space Race scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(841);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawLand(layer);
	for (const rocket of [LEFT, RIGHT]) {
		drawTrail(layer, rocket, random);
		for (const drift of /** @type {const} */ ([-1, 1])) {
			drawSmoke(layer, {
				x: rocket.pad,
				y: 63,
				tone: 'steam',
				puffs: 2,
				drift,
			});
		}
	}

	drawLeftRocket(scene);
	drawRightRocket(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	for (const rocket of [LEFT, RIGHT]) {
		drawFlame(scene, rocket);
		glow(scene, {
			x: rocket.x,
			y: rocket.base + 4,
			radius: rocket.flame + 7,
			colour: C.gold,
			strength: 0.45,
			steps: 3,
			skip: [C.white, C.lampGlow, C.gold, C.amber],
		});
	}
	return scene;
}

/**
 * Flat land under the sunset, in silhouette, with the two launch towers standing empty beside the trails.
 * @param {Canvas} layer
 */
function drawLand(layer) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === HORIZON + 1
					? C.headlandRidge
					: y > 59
						? mix(C.headland, C.ink, 0.35)
						: C.headland;
			set(layer, x, y, colour);
		}
	}
	// The empty launch towers, clear of the trails: lattice masts with a platform, an arm swung towards the pad
	// and a red warning light on top.
	for (const [x, arm] of /** @type {[number, 1 | -1][]} */ ([
		[4, 1],
		[57, -1],
	])) {
		for (let y = HORIZON - 12; y <= HORIZON; y++) {
			set(layer, x, y, C.roofShade);
			set(layer, x + 2, y, C.roofShade);
			if (y % 2 === 0) {
				set(layer, x + 1, y, C.roofShade);
			}
		}
		for (let i = -1; i <= 3; i++) {
			set(layer, x + i, HORIZON - 12, C.roofShade);
		}
		const reach = arm > 0 ? x + 3 : x - 1;
		for (let i = 0; i < 3; i++) {
			set(layer, reach + i * arm, HORIZON - 7, C.roofShade);
		}
		set(layer, x + 1, HORIZON - 13, C.brickRedLight);
	}
}

/**
 * One trail of exhaust smoke, from a rocket's flame down to its launch pad, widening as it falls, its edges billowing.
 * The side facing the sunset, between the trails, is lit warm.
 * @param {Canvas} layer
 * @param {{ x: number, base: number, length: number, pad: number }} rocket
 * @param {() => number} random
 */
function drawTrail(layer, { x, base, length, pad }, random) {
	const top = base + length;
	const bottom = HORIZON + 6;
	const drift = Math.sign(pad - x);
	const phases = [random() * 6, random() * 6];
	for (let y = top; y <= bottom; y++) {
		const t = (y - top) / (bottom - top);
		const cx = x + (pad + 1 - x) * t * t;
		// Each edge billows on its own rhythm.
		const [left, right] = phases.map(
			(phase) =>
				1 +
				t * 4 +
				Math.abs(Math.sin(y * 0.45 + phase)) * (0.4 + t * 2.2)
		);
		for (
			let px = Math.floor(cx - left);
			px <= Math.ceil(cx + right);
			px++
		) {
			const half = px < cx ? left : right;
			const off = (px - cx) / half;
			if (Math.abs(off) > 1) {
				continue;
			}
			const inner = off * drift < 0;
			let colour = SMOKE.core;
			if (Math.abs(off) > 0.6) {
				colour = inner ? SMOKE.glow : SMOKE.deep;
			} else if (Math.abs(off) > 0.15) {
				colour = inner ? SMOKE.warm : SMOKE.cool;
			}
			set(layer, px, y, colour);
		}
	}
}

/**
 * The left rocket: a tall white stack in three stages with black rings between them, red fins and an escape tower on its capsule.
 * @param {Canvas} scene
 */
function drawLeftRocket(scene) {
	const rows = [
		'....r....',
		'....k....',
		'....k....',
		'...wwW...',
		'...wwW...',
		'..wwwWW..',
		'..kkkkk..',
		'..wwwwW..',
		'..wwwwW..',
		'..wwwwW..',
		'..wwwwW..',
		'..wwwwW..',
		'..kkkkk..',
		'.wwwwwWW.',
		'.wwwwwWW.',
		'.wwwwwWW.',
		'.wwwwwWW.',
		'.wwwwwWW.',
		'.kkkkkkk.',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'wwwwwwwWW',
		'rwwwwwwWr',
		'rrwwwwWrr',
		'rr.ddd.rr',
	];
	paint(scene, LEFT.x - 4, LEFT.base - rows.length + 1, rows, {
		w: C.white,
		W: C.cloudShade,
		k: C.night,
		r: C.brickRed,
		d: C.stoneShade,
	});
}

/**
 * The right rocket: a slim pale-green core with a red nose, and four strap-on boosters flaring at its foot.
 * @param {Canvas} scene
 */
function drawRightRocket(scene) {
	const rows = [
		'......r......',
		'.....rrR.....',
		'.....rrR.....',
		'.....LLm.....',
		'....LLLmm....',
		'....LLLmm....',
		'....LLLmm....',
		'....bbbbb....',
		'.....LLm.....',
		'.....LLm.....',
		'....LLLmm....',
		'....LLLmm....',
		'....LLLmm....',
		'...gLLLmmG...',
		'...gLLLmmG...',
		'..ggLLLmmGG..',
		'..ggLLLmmGG..',
		'..ggLLLmmGG..',
		'.gggLLLmmGGG.',
		'.gggbbbbbGGG.',
		'.gggLLLmmGGG.',
		'ggggLLLmmGGGG',
		'ggggLLLmmGGGG',
		'ggggLLLmmGGGG',
		'ggggLLLmmGGGG',
		'ddd..ddd..ddd',
	];
	paint(scene, RIGHT.x - 6, RIGHT.base - rows.length + 1, rows, {
		L: mix(C.cream, C.pineLight, 0.3),
		m: mix(C.stoneLight, C.pine, 0.35),
		g: mix(C.creamShade, C.pineLight, 0.35),
		G: mix(C.stone, C.pine, 0.4),
		b: C.daySea2,
		r: C.brickRed,
		R: C.brickRedShade,
		d: C.stoneShade,
	});
}

/**
 * A rocket's flame under its nozzles: a white-hot core in gold, narrowing and fraying to amber and red at the tip.
 * @param {Canvas} scene
 * @param {{ x: number, base: number, flame: number, length: number }} rocket
 */
function drawFlame(scene, { x, base, flame, length }) {
	for (let j = 0; j < length; j++) {
		const t = j / length;
		const half = flame * (1 - t ** 1.6) + 0.5;
		for (let px = Math.floor(x - half); px <= Math.ceil(x + half); px++) {
			const off = Math.abs(px - x) / half;
			if (off > 1) {
				continue;
			}
			let colour = C.amber;
			if (t > 0.75) {
				colour = off < 0.5 ? C.amber : C.brickRedLight;
			} else if (off < 0.45 && t < 0.6) {
				colour = C.lampGlow;
			} else if (off < 0.8) {
				colour = C.gold;
			}
			set(scene, px, base + 1 + j, colour);
		}
	}
}
