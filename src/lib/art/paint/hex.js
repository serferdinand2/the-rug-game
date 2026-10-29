// The map's hex geometry in pixels and its cloud and volcano overlays, shared by the game's map painter and the art toolkit (#6, #134).
import { createCanvas, outline, set } from './painter.js';
import { PALETTE as C } from './palette.js';
import { CLOUD_SIZE, VOLCANO_SIZE } from '../hex-overlays.js';

/** @typedef {import('./painter.js').Canvas} Canvas */

/** A territory picture's width: a flat-topped hex from corner to corner. */
export const HEX_W = 64;

/** A territory picture's height: the hex from side to side, √3·32 rounded so the board tiles in whole pixels. */
export const HEX_H = 56;

/** The hex's radius in pixels: the distance from its centre to a corner. */
export const HEX_R = 32;

/** The hex's centre in pixels. */
export const CX = HEX_W / 2;
export const CY = HEX_H / 2;

/** The island's small hexagon, as a share of the radius (hexmap.js). */
export const ISLAND = 0.42;

export const HALF_ROOT_3 = Math.sqrt(3) / 2;

/** The hex's corners in pixels, clockwise from the top-left: hexmap.js's corners, stretched to 64×56. */
export const CORNERS = /** @type {readonly [number, number][]} */ ([
	[16, 0],
	[48, 0],
	[64, 28],
	[48, 56],
	[16, 56],
	[0, 28],
]);

/**
 * Tells whether a pixel's centre lies inside the hex. Neighbouring hexes, 48 pixels across and 28 down, or 56 down,
 * share no pixel and leave none out.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function inHex(x, y) {
	const dx = Math.abs(x + 0.5 - CX);
	const dy = Math.abs(y + 0.5 - CY);
	return dy < CY && dx < HEX_R - (dy * HEX_R) / HEX_H;
}

/**
 * How far round the hex a pixel's centre lies, in hexmap.js's undistorted frame: 0 towards corner 0, then
 * clockwise, one per corner, so 0 ≤ turn < 6.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
export function turnOf(x, y) {
	const gx = (x + 0.5 - CX) / HEX_R;
	const gy = ((y + 0.5 - CY) / CY) * HALF_ROOT_3;
	const sixths = ((Math.atan2(gy, gx) * 180) / Math.PI + 120) / 60;
	return ((sixths % 6) + 6) % 6;
}

/**
 * The corner whose wedge holds a pixel: hexmap.js's cornerWedge in pixels, within 30° of the corner's direction.
 * No pixel centre lies on a wedge's edge.
 * @param {number} x
 * @param {number} y
 * @returns {number} 0–5, clockwise from the top-left corner
 */
export function wedgeOf(x, y) {
	return Math.round(turnOf(x, y)) % 6;
}

/**
 * Tells whether a pixel lies on the island's small hexagon in the middle.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
export function inIsland(x, y) {
	const gx = Math.abs((x + 0.5 - CX) / HEX_R);
	const gy = Math.abs(((y + 0.5 - CY) / CY) * HALF_ROOT_3);
	return gy < ISLAND * HALF_ROOT_3 && gx < ISLAND - gy / Math.sqrt(3);
}

/**
 * The island part a pixel lies in: hexmap.js's islandParts in pixels, which gives part i the sixths of the island
 * between corners k and k + 1 for which ⌊k·count/6⌋ = i.
 * @param {number} x
 * @param {number} y
 * @param {number} count - How many terrains the island has; 0 for none
 * @returns {number} The part's index, or −1 off the island
 */
export function islandPartOf(x, y, count) {
	if (count < 1 || !inIsland(x, y)) {
		return -1;
	}
	return Math.floor((Math.floor(turnOf(x, y)) * count) / 6);
}

/**
 * Draws the cloud overlay: three puffs, lit on top and shaded underneath, in the map clouds' own colours.
 * It goes at CLOUD_SPOT, wholly inside the hex.
 * @returns {Canvas} 22×12, transparent round the cloud
 */
export function drawCloud() {
	const canvas = createCanvas(CLOUD_SIZE[0], CLOUD_SIZE[1]);
	const puffs = [
		[6, 7, 4],
		[11, 5, 5],
		[16, 7, 4],
	];
	const bottom = 10;
	for (let y = 1; y <= bottom; y++) {
		for (let x = 1; x < canvas.w - 1; x++) {
			const puff = puffs.find(
				([px, py, r]) =>
					(x - px) ** 2 + (y - py) ** 2 <= r * r + r * 0.5
			);
			if (!puff) {
				continue;
			}
			const [px, py, r] = puff;
			let colour = C.mapCloud;
			if (y >= bottom - 1) {
				colour = C.mapCloudShade;
			} else if (x - px + (y - py) <= -r + 1) {
				colour = C.mapCloudLight;
			}
			set(canvas, x, y, colour);
		}
	}
	outline(canvas, C.mapCloudEdge);
	return canvas;
}

/** The volcano's crater in its overlay: the pixel set on its corner's line from the hex's centre. */
export const VOLCANO_CRATER = /** @type {readonly [number, number]} */ (
	Object.freeze([8, 9])
);

/** How far the crater stands from the hex's centre towards its corner, as a share of the way. */
const VOLCANO_REACH = 0.55;

/**
 * Draws the volcano overlay: a dark cone outlined in ink, lava glowing in its crater and running down its front,
 * under a column of ash that billows to the right with embers in it. Nothing in it is as light as a cloud.
 * It goes at volcanoSpot(volcanoCorner(corners)).
 * @returns {Canvas} 17×17, transparent round the volcano
 */
export function drawVolcano() {
	const canvas = createCanvas(VOLCANO_SIZE, VOLCANO_SIZE);
	const [cx, crater] = VOLCANO_CRATER;
	// The lava's column on each row of the cone, the crater first, wandering a little.
	const lava = [0, 0, 1, 1, 0, 0, -1];
	lava.forEach((run, r) => {
		const half = 2 + Math.round((r * 5) / 6);
		for (let dx = -half; dx <= half; dx++) {
			let colour = C.basalt;
			if (dx < -half / 3) {
				colour = C.basaltLight;
			} else if (dx > half / 3) {
				colour = C.basaltShade;
			}
			if (r === 0 && Math.abs(dx) < half) {
				colour = dx === 0 ? C.gold : C.amber;
			} else if (r > 0 && dx === run) {
				colour = r < 3 ? C.amber : C.brickRed;
			}
			set(canvas, cx + dx, crater + r, colour);
		}
	});
	outline(canvas, C.ink);
	const puffs = [
		[8, 7, 1],
		[9, 5, 2],
		[6, 3, 2],
		[11, 3, 3],
	];
	for (const [px, py, r] of puffs) {
		for (let dy = -r; dy <= r; dy++) {
			for (let dx = -r; dx <= r; dx++) {
				if (dx * dx + dy * dy > r * r + r) {
					continue;
				}
				let colour = C.ash;
				if (dy > 0 && dy >= r - 1) {
					colour = C.ashShade;
				} else if (dx + dy <= -r) {
					colour = C.ashLight;
				}
				set(canvas, px + dx, py + dy, colour);
			}
		}
	}
	set(canvas, 9, 6, C.amber);
	set(canvas, 12, 2, C.amber);
	set(canvas, 7, 3, C.brickRed);
	return canvas;
}

/**
 * Where the volcano overlay's top-left pixel goes in a territory picture: its crater on the line from the hex's
 * centre to the corner, a little over half way, so the whole volcano stays inside the hex.
 * @param {number} corner - 0–5
 * @returns {[number, number]}
 */
export function volcanoSpot(corner) {
	const [x, y] = CORNERS[corner];
	return [
		Math.round(CX + (x - CX) * VOLCANO_REACH - 0.5) - VOLCANO_CRATER[0],
		Math.round(CY + (y - CY) * VOLCANO_REACH - 0.5) - VOLCANO_CRATER[1],
	];
}
