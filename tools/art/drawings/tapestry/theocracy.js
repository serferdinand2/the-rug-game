// Theocracy: a grand marble temple atop a stepped mountain sanctuary, rays of sunlight breaking through the clouds onto it.
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
import { drawClassical } from '../../parts/classical.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The sky's last row, the temple's centre column and the break in the clouds the light pours from. */
const HORIZON = 44;
const CX = 32;
const SOURCE = { x: -14, y: -32 };

/** The break in the clouds, where the beams first show. */
const BREAK = { x: 14, y: 4 };

/** The rays' directions from the source, in radians from straight down (positive is to the right). */
const RAYS = [0.47, 0.565, 0.66, 0.755, 0.85];

/**
 * Draws the Theocracy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4639);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawTerrain(layer, { kind: 'mountain', top: HORIZON + 1, random });
	drawGlow(layer);
	drawRays(layer, 0.45);
	drawClouds(layer);

	drawSanctuary(scene);
	drawClassical(scene, { x: 12, y: 43, width: 40, columns: 6, height: 13 });
	drawDoor(scene);
	drawBraziers(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawRays(scene, 0.2);
	drawFinial(scene);
	drawFlames(scene);
	drawPilgrims(scene);
	return scene;
}

/**
 * Tells whether a pixel lies in one of the beams falling through the break in the clouds.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inRay(x, y) {
	if (y < BREAK.y) {
		return false;
	}
	const angle = Math.atan2(x - SOURCE.x, y - SOURCE.y);
	return RAYS.some((ray) => Math.abs(angle - ray) < 0.021);
}

/**
 * Warms every pixel inside the beams towards lamp light, fading as they fall.
 * @param {Canvas} canvas
 * @param {number} strength - How far towards the light at the top, 0 to 1
 */
function drawRays(canvas, strength) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const behind = get(canvas, x, y);
			if (behind && inRay(x, y)) {
				const fade = y < 20 ? 1 : y < 36 ? 0.75 : 0.5;
				set(canvas, x, y, mix(behind, C.lampGlow, strength * fade));
			}
		}
	}
}

/**
 * An overcast sky, greyer away from the break in the clouds, and glowing within it from the sun hidden above.
 * @param {Canvas} layer
 */
function drawGlow(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const far = Math.min(1, Math.hypot(x - BREAK.x, y - BREAK.y) / 48);
			const sky = get(layer, x, y);
			if (sky) {
				set(
					layer,
					x,
					y,
					mix(sky, C.stoneMid, Math.round(far * 4) / 12)
				);
			}
		}
	}
	for (let y = 0; y < 24; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.sqrt(
				(x - BREAK.x) ** 2 + ((y - BREAK.y) * 1.4) ** 2
			);
			const behind = get(layer, x, y);
			if (behind && d < 22) {
				const t = Math.round((1 - d / 22) * 6) / 8;
				set(layer, x, y, mix(behind, C.lampGlow, t));
			}
		}
	}
}

/**
 * A heavy bank of cloud across the top of the sky, grey beneath and white above,
 * its edge blazing gold where it parts to let the sun through.
 * @param {Canvas} layer
 */
function drawClouds(layer) {
	const blobs = [
		[34, 2, 10, 6],
		[46, 5, 10, 7],
		[58, 2, 10, 8],
		[39, 11, 9, 4],
		[54, 13, 11, 5],
		[64, 20, 6, 3],
	];
	/**
	 * @param {number} x
	 * @param {number} y
	 * @returns {boolean}
	 */
	const cloud = (x, y) =>
		blobs.some(([cx, cy, rx, ry]) => {
			const wobble = Math.sin(x * 0.8 + cy) * 0.7;
			return ((x - cx) / rx) ** 2 + ((y - cy + wobble) / ry) ** 2 <= 1;
		});
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			if (!cloud(x, y)) {
				continue;
			}
			let colour = C.stoneLight;
			if (!cloud(x, y + 1)) {
				colour = C.stoneMid;
			} else if (!cloud(x, y + 2) || !cloud(x, y + 3)) {
				colour = C.stone;
			} else if (!cloud(x, y - 1)) {
				colour = C.white;
			} else if (!cloud(x, y - 2) || !cloud(x, y - 3)) {
				colour = C.cloudShade;
			}
			const facing = x < BREAK.x ? !cloud(x + 1, y) : !cloud(x - 1, y);
			const near = Math.abs(x - BREAK.x) < 26 && y < 9;
			if (facing && near) {
				colour = C.lampGlow;
			} else if (
				near &&
				(x < BREAK.x ? !cloud(x + 2, y) : !cloud(x - 2, y))
			) {
				colour = C.gold;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Paints one pixel of a stone span, lit on the left and shaded at the right end.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {number} left - The span's first column
 * @param {number} right - The span's last column
 * @param {boolean} top - Whether this is the tier's top edge
 */
function stone(canvas, x, y, left, right, top) {
	let colour = C.stone;
	if (top) {
		colour = C.stoneLight;
	} else if (x === left) {
		colour = C.stoneLight;
	} else if (x >= right - 1) {
		colour = C.stoneShade;
	} else if ((x + y * 3) % 7 === 0) {
		colour = C.stoneMid;
	}
	set(canvas, x, y, colour);
}

/**
 * The sanctuary the temple stands on: three broad stone terraces with a grand stair
 * climbing the middle of them.
 * @param {Canvas} canvas
 */
function drawSanctuary(canvas) {
	for (const [top, bottom, left, right] of [
		[57, 63, -1, 64],
		[51, 56, 3, 60],
		[44, 50, 7, 56],
	]) {
		for (let y = top; y <= bottom; y++) {
			for (let x = left; x <= right; x++) {
				stone(canvas, x, y, left, right, y === top);
			}
		}
	}
	// The grand stair: light treads and shaded risers, widening towards the viewer.
	for (let y = 44; y < 64; y++) {
		const half = 5 + Math.floor((y - 44) / 5);
		const tread = (y - 44) % 2 === 0;
		for (let x = CX - half; x <= CX + half - 1; x++) {
			const colour = tread
				? x === CX - half
					? C.white
					: C.creamLight
				: x >= CX + half - 2
					? C.creamShade
					: C.cream;
			set(canvas, x, y, colour);
		}
		set(canvas, CX - half - 1, y, C.stoneShade);
		set(canvas, CX + half, y, C.stoneShade);
	}
}

/**
 * The temple's open door: warm light spilling from inside, between the two middle columns.
 * @param {Canvas} canvas
 */
function drawDoor(canvas) {
	for (let y = 32; y <= 40; y++) {
		for (let x = CX - 3; x <= CX + 2; x++) {
			const inset = y === 32 && (x === CX - 3 || x === CX + 2);
			if (!inset) {
				set(canvas, x, y, y < 35 ? C.gold : C.lampGlow);
			}
		}
	}
	rect(canvas, CX - 1, 34, 2, 7, C.white);
}

/**
 * Two bronze braziers on tall stands, flanking the top of the stair.
 * @param {Canvas} canvas
 */
function drawBraziers(canvas) {
	for (const cx of [CX - 11, CX + 10]) {
		rect(canvas, cx - 2, 38, 5, 1, C.brass);
		rect(canvas, cx - 1, 39, 3, 1, C.lampFrame);
		rect(canvas, cx, 40, 1, 4, C.lampFrame);
		rect(canvas, cx - 1, 43, 3, 1, C.lampFrame);
	}
}

/**
 * The braziers' flames, drawn over the outline so they flicker unbounded.
 * @param {Canvas} canvas
 */
function drawFlames(canvas) {
	for (const cx of [CX - 11, CX + 10]) {
		rect(canvas, cx - 1, 37, 3, 1, C.amber);
		set(canvas, cx, 37, C.gold);
		set(canvas, cx, 36, C.gold);
		set(canvas, cx - 1, 36, C.amber);
		set(canvas, cx, 35, C.lampGlow);
	}
}

/**
 * A gold orb crowning the pediment, with a glint where the light strikes it.
 * @param {Canvas} canvas
 */
function drawFinial(canvas) {
	const top = 13;
	/** @type {[number, number, string][]} */
	const pixels = [
		[-1, 0, C.gold],
		[0, 0, C.lampGlow],
		[1, 0, C.amber],
		[-1, 1, C.gold],
		[0, 1, C.gold],
		[1, 1, C.amber],
		[0, -1, C.ink],
		[-2, 0, C.ink],
		[2, 0, C.ink],
		[-2, 1, C.ink],
		[2, 1, C.ink],
	];
	for (const [dx, dy, colour] of pixels) {
		set(canvas, CX + dx, top + dy, colour);
	}
}

/**
 * Tiny robed pilgrims climbing the grand stair, to show its size.
 * @param {Canvas} canvas
 */
function drawPilgrims(canvas) {
	/** @type {[number, number, string][]} */
	const pilgrims = [
		[CX - 3, 52, C.white],
		[CX + 2, 56, C.daySky2],
		[CX - 5, 60, C.brickRed],
	];
	for (const [x, y, robe] of pilgrims) {
		set(canvas, x, y - 4, C.skin);
		rect(canvas, x - 1, y - 3, 3, 3, robe);
		set(canvas, x + 1, y - 3, C.ink);
		set(canvas, x - 1, y, C.ink);
		set(canvas, x + 1, y, C.ink);
		set(canvas, x, y - 5, C.ink);
	}
}
