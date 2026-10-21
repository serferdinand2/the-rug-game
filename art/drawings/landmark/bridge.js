// The Bridge landmark at dusk: a stone arch bridge with lit lamps, a river flowing through it toward the viewer.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { FOOTPRINTS, clipToFootprint } from '../../footprints.js';
import { drawSky } from '../../parts/sky.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The bridge's footprint is .XX./XXXX/.XX. at 32 pixels per plot. */
const W = 128;
const H = 96;

/** The deck's top row and the row the arches spring from. */
const DECK = 34;
const SPRING = 58;

/** The arches' centres and radius. */
const ARCHES = [44, 64, 84];
const ARCH_R = 8;

/**
 * Draws the Bridge scene.
 * @returns {Canvas} A 128×96 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(167);

	drawSky(layer, { time: 'dusk', horizon: 26, random });
	drawLand(layer);
	drawRiver(layer);

	drawSpan(scene);
	drawLamps(scene);
	drawFigure(scene, { x: 44, y: DECK - 1, clothes: C.roofLight });
	drawFigure(scene, {
		x: 80,
		y: DECK - 1,
		facing: 'left',
		clothes: C.brickRed,
	});
	outline(scene, C.ink);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS.bridge);
	return scene;
}

/**
 * Hills on the far side and meadows on both banks.
 * @param {Canvas} layer
 */
function drawLand(layer) {
	for (let x = 0; x < W; x++) {
		const far = Math.round(24 + Math.sin(x * 0.11) * 2);
		for (let y = far; y < H; y++) {
			set(
				layer,
				x,
				y,
				y < 32
					? C.pineShade
					: (x + y) % 5 === 0
						? C.grassShade
						: C.grass
			);
		}
	}
}

/**
 * The river: narrow in the distance and widening toward the viewer, catching the dusk light.
 * @param {Canvas} layer
 */
function drawRiver(layer) {
	for (let y = 26; y < H; y++) {
		const half = riverHalf(y);
		for (let x = 64 - half; x <= 64 + half; x++) {
			let colour = y < 40 ? C.nightSea1 : C.nightSea2;
			// Sparse horizontal glints of the dusk sky on every third row.
			const glint = (x * 5 + y * 3) % 23;
			if (y % 3 === 0 && glint < 3) {
				colour = glint === 0 ? C.duskSky6 : C.duskSky5;
			}
			set(layer, x, y, colour);
		}
		set(layer, 64 - half, y, C.grassShade);
		set(layer, 64 + half, y, C.grassShade);
	}
	// The arches' dark reflections, on the water only.
	for (const cx of ARCHES) {
		for (let y = SPRING + 1; y < SPRING + 10; y++) {
			const half = riverHalf(y);
			for (let x = cx - ARCH_R; x <= cx + ARCH_R; x++) {
				const onWater = Math.abs(x - 64) < half;
				if (
					onWater &&
					Math.hypot(x - cx, (y - SPRING) * 1.3) <= ARCH_R
				) {
					set(layer, x, y, mix(C.nightSea3, C.night, 0.4));
				}
			}
		}
	}
}

/**
 * Half the river's width on a row: narrow in the distance, wide near the viewer.
 * @param {number} y
 * @returns {number}
 */
function riverHalf(y) {
	return 6 + Math.round((y - 26) * 0.32);
}

/**
 * The span: a parapet and deck above masonry, with three open arches over the river.
 * @param {Canvas} scene
 */
function drawSpan(scene) {
	for (let y = DECK; y <= SPRING; y++) {
		for (let x = 0; x < W; x++) {
			const inArch = ARCHES.some(
				(cx) =>
					y > SPRING - ARCH_R &&
					Math.hypot(x - cx, y - SPRING) < ARCH_R
			);
			if (inArch) {
				continue;
			}
			let colour = C.stone;
			if (y <= DECK + 1) {
				colour = y === DECK ? C.stoneLight : C.stone;
			} else if (y === DECK + 4) {
				colour = C.stoneShade;
			} else if (
				(y - DECK) % 4 === 0 ||
				(x + (Math.floor(y / 4) % 2) * 4) % 8 === 0
			) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// Voussoirs around each arch.
	for (const cx of ARCHES) {
		for (let a = 0; a <= Math.PI; a += 0.05) {
			set(
				scene,
				Math.round(cx + Math.cos(a) * ARCH_R),
				Math.round(SPRING - Math.sin(a) * ARCH_R),
				C.stoneLight
			);
		}
	}
}

/**
 * Lit lamps along the parapet.
 * @param {Canvas} scene
 */
function drawLamps(scene) {
	for (const x of [36, 56, 72, 92]) {
		rect(scene, x, DECK - 8, 1, 8, C.night);
		rect(scene, x - 1, DECK - 11, 3, 3, C.gold);
		set(scene, x, DECK - 10, C.lampGlow);
	}
}
