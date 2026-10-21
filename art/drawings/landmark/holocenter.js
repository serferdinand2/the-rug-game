// The Holocenter landmark at night: a sleek white hall projecting a vast hologram of a world into the night sky.
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
import { FOOTPRINTS, clipToFootprint } from '../../footprints.js';
import { drawSky } from '../../parts/sky.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The holocenter's footprint is XXX/XXX/XXX/.X. at 32 pixels per plot. */
const W = 96;
const H = 128;

/** The hologram's centre and radius, and the emitter it rises from. */
const HOLO_X = 48;
const HOLO_Y = 34;
const HOLO_R = 20;
const EMITTER_Y = 66;

/**
 * Draws the Holocenter scene.
 * @returns {Canvas} A 96×128 canvas in the shape of its footprint.
 */
export function draw() {
	const scene = createCanvas(W, H);
	const layer = createCanvas(W, H);
	const random = seededRandom(179);

	drawSky(layer, {
		time: 'night',
		horizon: 92,
		random,
		stars: 90,
		starRows: 88,
	});
	drawGround(layer);
	drawHologram(layer);

	drawHall(scene);
	drawFigure(scene, { x: 50, y: 118, facing: 'left', clothes: C.roofLight });
	outline(scene, C.ink);
	drawLightStrip(scene);
	underlay(scene, layer);
	clipToFootprint(scene, FOOTPRINTS.holocenter);
	return scene;
}

/**
 * Dark ground, with a lit walkway leading from the hall toward the viewer.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = 93; y < H; y++) {
		for (let x = 0; x < W; x++) {
			set(layer, x, y, (x + y) % 6 === 0 ? C.roof : C.night);
		}
	}
	for (let y = 93; y < H; y++) {
		rect(layer, 40, y, 16, 1, y % 4 === 0 ? C.daySky4 : C.roofShade);
	}
}

/**
 * The hologram: a translucent world with glowing latitude lines and a ring, and the beam that projects it.
 * @param {Canvas} layer
 */
function drawHologram(layer) {
	for (let y = 0; y < EMITTER_Y; y++) {
		for (let x = 0; x < W; x++) {
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			const d = Math.hypot(x - HOLO_X, y - HOLO_Y);
			// The beam widening from the emitter up to the globe.
			const beamHalf = ((EMITTER_Y - y) / (EMITTER_Y - HOLO_Y)) * 10;
			if (y > HOLO_Y && Math.abs(x - HOLO_X) <= beamHalf) {
				set(layer, x, y, mix(behind, C.daySky4, 0.25));
			}
			if (d <= HOLO_R) {
				// Latitude lines every 6 rows; longitude lines where the point's position
				// across its own row of the globe is close to a third of the way round.
				const lat = Math.abs((y - HOLO_Y) % 6) < 1;
				const rowHalf = Math.max(
					1,
					Math.sqrt(HOLO_R ** 2 - (y - HOLO_Y) ** 2)
				);
				const across = ((x - HOLO_X) / rowHalf) * 3;
				const lon = Math.abs(Math.round(across) - across) < 0.12;
				let t = 0.35;
				let tint = C.daySky4;
				if (d > HOLO_R - 1.2 || lat || lon) {
					t = 0.75;
					tint = C.daySky5;
				}
				if (Math.hypot(x - (HOLO_X - 7), y - (HOLO_Y - 7)) < 4) {
					t = 0.85;
					tint = C.white;
				}
				set(layer, x, y, mix(behind, tint, t));
			}
			// A tilted ring around the globe.
			const ring = Math.hypot(
				(x - HOLO_X) / (HOLO_R + 9),
				(y - HOLO_Y) / 6
			);
			if (Math.abs(ring - 1) < 0.06 && !(d < HOLO_R && y < HOLO_Y)) {
				set(layer, x, y, mix(behind, C.white, 0.7));
			}
		}
	}
}

/**
 * The hall: a long, low curve of white panels with a glass front, crowned by the emitter.
 * @param {Canvas} scene
 */
function drawHall(scene) {
	for (let y = EMITTER_Y + 2; y <= 94; y++) {
		const inset = Math.max(0, Math.round(((EMITTER_Y + 14 - y) / 12) * 20));
		for (let x = 4 + inset; x <= 91 - inset; x++) {
			let colour = C.stone;
			if (x < 30) {
				colour = C.stoneLight;
			} else if (x > 72) {
				colour = C.stoneMid;
			}
			if (y > 84) {
				colour = (x - 4) % 6 === 0 ? C.stoneShade : C.daySky1;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, 40, 84, 16, 11, C.lampGlow);
	// The emitter on the roof.
	rect(scene, 42, EMITTER_Y, 12, 3, C.stoneMid);
	rect(scene, 45, EMITTER_Y - 2, 6, 2, C.daySky5);
}

/**
 * A blue light strip running along the hall; drawn after the outline so it glows.
 * @param {Canvas} scene
 */
function drawLightStrip(scene) {
	for (let x = 10; x <= 85; x++) {
		set(scene, x, 82, x % 2 ? C.daySky4 : C.daySky5);
	}
}
