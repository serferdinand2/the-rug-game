// Islanders: a sunset seascape with a massive island on the horizon and two small sailboats, the sea the mat's hexes lie over; the card crops it to a wide band round the horizon.
import {
	createCanvas,
	set,
	rect,
	line,
	mix,
	seededRandom,
	outline,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The horizon: the last sky row. The card's band is centred on it. */
const HORIZON = 33;

/** The sun's glow on the horizon, and the column its reflection falls on. */
const GLOW_X = 18;

/** The island's silhouette: its highest rows by column, from its left foot to the right edge. */
const ISLAND_LEFT = 33;
const ISLAND_PEAKS = [
	[33, 0],
	[36, 3],
	[39, 6],
	[42, 8],
	[45, 10],
	[48, 12],
	[50, 13],
	[53, 12],
	[56, 10],
	[59, 11],
	[62, 9],
	[63, 8],
];

/**
 * Draws the Islanders portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48247);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawGlow(layer);
	drawClouds(layer, random);
	drawIsland(layer);
	drawSea(layer, random);

	// The boats on their own outlined layer, in front of the sea.
	drawBoat(scene, 8, 42, 1);
	drawBoat(scene, 31, 38, 0);
	outline(scene, C.ink);
	underlay(scene, layer);
	return scene;
}

/**
 * The low sun's glow: warm rings round a point on the horizon, strongest at the line.
 * @param {Canvas} layer
 */
function drawGlow(layer) {
	for (let y = 10; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot((x - GLOW_X) / 1.8, (y - HORIZON) * 1.1);
			if (d < 16) {
				const t = 1 - d / 16;
				const warm =
					t > 0.7 ? C.gold : t > 0.45 ? C.duskSky6 : C.duskSky5;
				if (t > 0.18) {
					set(
						layer,
						x,
						y,
						mix(
							layer.p[y * 64 + x] ?? warm,
							warm,
							Math.min(1, t + 0.1)
						)
					);
				}
			}
		}
	}
	// The sun itself, half sunk in the sea.
	for (let y = HORIZON - 3; y <= HORIZON; y++) {
		const half = Math.round(Math.sqrt(Math.max(0, 9 - (HORIZON - y) ** 2)));
		rect(layer, GLOW_X - half, y, half * 2 + 1, 1, C.lampGlow);
	}
}

/**
 * Streaks of cloud, long and thin, purple above and lit pink from below by the sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawClouds(layer, random) {
	for (let i = 0; i < 9; i++) {
		const y = 4 + Math.floor(random() * 24);
		const x = Math.floor(random() * 56) - 4;
		const length = 8 + Math.floor(random() * 22);
		const lit = y > 18;
		const base = lit ? C.duskSky4 : C.duskSky2;
		const edge = lit ? C.duskSky6 : C.duskSky3;
		rect(layer, Math.max(0, x), y, length, 1, edge);
		rect(
			layer,
			Math.max(0, x + 2),
			y + 1,
			Math.max(1, length - 5),
			1,
			base
		);
	}
}

/**
 * The massive island: a hazy violet mass with a warm lit ridge along its top and darker flanks.
 * @param {Canvas} layer
 */
function drawIsland(layer) {
	for (let x = ISLAND_LEFT; x < 64; x++) {
		let top = 0;
		for (let i = 0; i + 1 < ISLAND_PEAKS.length; i++) {
			const [x0, h0] = ISLAND_PEAKS[i];
			const [x1, h1] = ISLAND_PEAKS[i + 1];
			if (x >= x0 && x <= x1) {
				top = Math.round(h0 + ((h1 - h0) * (x - x0)) / (x1 - x0));
			}
		}
		for (let y = HORIZON - top; y <= HORIZON; y++) {
			const depth = y - (HORIZON - top);
			const colour =
				depth === 0
					? mix(C.duskSky6, C.duskSky3, 0.3)
					: depth < 3
						? mix(C.duskSky3, C.duskSky1, 0.35)
						: mix(C.duskSky2, C.duskSky1, 0.55);
			set(layer, x, y, colour);
		}
	}
}

/**
 * The sea: deep blue under the horizon, warm where the sun's reflection falls, with short waves and a boat's wake.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSea(layer, random) {
	const bands = [
		mix(C.duskSky5, C.nightSea1, 0.45),
		mix(C.duskSky3, C.nightSea1, 0.6),
		mix(C.duskSky2, C.nightSea1, 0.75),
		mix(C.duskSky1, C.nightSea1, 0.8),
	];
	for (let y = HORIZON + 1; y < 64; y++) {
		const band = Math.min(
			bands.length - 1,
			Math.floor((y - HORIZON - 1) / 7)
		);
		rect(layer, 0, y, 64, 1, bands[band]);
	}
	// The line of the horizon.
	rect(layer, 0, HORIZON + 1, 64, 1, mix(C.duskSky6, C.duskSky4, 0.4));
	// The sun's reflection: a broken column of warm strokes that widens towards the viewer.
	for (let y = HORIZON + 2; y < 56; y += 2) {
		const spread = 2 + Math.floor((y - HORIZON) / 3);
		const x = GLOW_X - spread + Math.floor(random() * spread * 2);
		rect(
			layer,
			x,
			y,
			2 + Math.floor(random() * 3),
			1,
			y < 42 ? C.gold : C.duskSky6
		);
	}
	// Waves.
	for (let i = 0; i < 40; i++) {
		const y = HORIZON + 3 + Math.floor(random() * (63 - HORIZON - 3));
		const x = Math.floor(random() * 60);
		const length = 2 + Math.floor(random() * 4);
		rect(
			layer,
			x,
			y,
			length,
			1,
			mix(C.duskSky4, C.nightSea1, y > 48 ? 0.7 : 0.45)
		);
	}
	// A wake behind the near boat, running to the left.
	line(layer, 4, 45, 12, 44, C.cream);
	line(layer, 0, 46, 5, 45, mix(C.cream, C.nightSea1, 0.4));
}

/**
 * A small sailboat seen from the side: a dark hull, a mast and a triangular sail lit by the sun.
 * @param {Canvas} canvas
 * @param {number} x - The mast's column
 * @param {number} y - The waterline row
 * @param {0 | 1} sails - 1 for a boat with two sails
 */
function drawBoat(canvas, x, y, sails) {
	rect(canvas, x - 4, y, 9, 1, C.wood);
	rect(canvas, x - 3, y + 1, 7, 1, mix(C.wood, C.night, 0.4));
	line(canvas, x, y - 8, x, y - 1, C.wood);
	for (let i = 0; i < 6; i++) {
		rect(
			canvas,
			x + 1,
			y - 7 + i,
			Math.min(5, 1 + i),
			1,
			i < 3 ? C.cream : C.creamShade
		);
	}
	if (sails) {
		for (let i = 0; i < 4; i++) {
			rect(
				canvas,
				x - 1 - Math.min(3, i),
				y - 5 + i,
				Math.min(3, i + 1),
				1,
				C.creamShade
			);
		}
	}
}
