// Cloud Colonies: floating islands of houses high above a sea of clouds, joined by rope bridges, a waterfall spilling from the largest.
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
import { drawSky } from '../../parts/sky.js';
import { drawBuilding } from '../../parts/buildings.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A floating island: its grassy top's first and last columns and its row, and the row of the rock's lowest point.
 * @typedef {{ left: number, right: number, top: number, tip: number }} Island
 */

/** The big island in the middle and the two smaller ones at the frame's edges. */
const MAIN = { left: 17, right: 46, top: 34, tip: 60 };
const WEST = { left: -4, right: 8, top: 30, tip: 44 };
const EAST = { left: 56, right: 68, top: 27, tip: 41 };

/** The far haze colour that distant things fade towards. */
const HAZE = C.daySky5;

/**
 * Draws the Cloud Colonies scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3149);

	drawSky(layer, { time: 'day', horizon: 63, random });
	drawFarIsland(layer, 9, 13, 8);
	drawFarIsland(layer, 51, 8, 4);
	drawCloudBank(
		layer,
		44,
		{
			lit: mix(C.white, HAZE, 0.2),
			mid: mix(C.cloudShade, HAZE, 0.35),
			shade: mix(C.cloudShade, HAZE, 0.7),
		},
		random
	);

	drawIsland(scene, MAIN, random);
	drawIsland(scene, WEST, random);
	drawIsland(scene, EAST, random);
	drawBuilding(scene, { kind: 'house', x: 19, y: MAIN.top - 1, width: 11 });
	drawTurret(scene, 31, MAIN.top - 1);
	drawBuilding(scene, { kind: 'house', x: 38, y: MAIN.top - 1, width: 8 });
	drawBuilding(scene, { kind: 'house', x: -2, y: WEST.top - 1, width: 9 });
	drawTree(scene, 60, EAST.top - 1);
	drawBuilding(scene, { kind: 'house', x: 56, y: EAST.top - 1, width: 7 });
	outline(scene, C.ink);
	underlay(scene, layer);

	drawWaterfall(scene);
	drawBridge(scene, 8, WEST.top - 1, MAIN.left + 1, MAIN.top - 1);
	drawBridge(
		scene,
		MAIN.right - 1,
		MAIN.top - 1,
		EAST.left + 1,
		EAST.top - 1
	);
	const front = {
		lit: C.white,
		mid: C.cloudShade,
		shade: mix(C.cloudShade, HAZE, 0.45),
	};
	drawCloudBank(scene, 52, front, random);
	drawCloudBank(scene, 59, front, random);
	drawBirds(scene);
	return scene;
}

/**
 * A distant floating island, pale with haze, with a tiny roof on top.
 * @param {Canvas} layer
 * @param {number} cx - Its middle column
 * @param {number} top - Its top row
 * @param {number} half - Half its width
 */
function drawFarIsland(layer, cx, top, half) {
	const rock = mix(C.stoneShade, HAZE, 0.6);
	const grass = mix(C.grass, HAZE, 0.55);
	for (let y = top; y <= top + half + 1; y++) {
		const w =
			y === top ? half : Math.round(half * (1 - (y - top) / (half + 2)));
		for (let x = cx - w; x <= cx + w; x++) {
			set(layer, x, y, y === top ? grass : rock);
		}
	}
	const roof = mix(C.brickRed, HAZE, 0.5);
	rect(layer, cx - 1, top - 2, 3, 2, mix(C.cream, HAZE, 0.4));
	rect(layer, cx - 2, top - 3, 5, 1, roof);
	set(layer, cx, top - 4, roof);
}

/**
 * The colours of one bank of cloud: sunlit, middle and shaded.
 * @typedef {{ lit: Colour, mid: Colour, shade: Colour }} CloudColours
 */

/**
 * A bank of cumulus: a row of round puffs lit from the upper left, with the bank filled solid below them.
 * @param {Canvas} canvas
 * @param {number} top - The row the puffs' centres sit near
 * @param {CloudColours} colours
 * @param {() => number} random
 */
function drawCloudBank(canvas, top, { lit, mid, shade }, random) {
	rect(canvas, 0, top + 2, 64, 64 - top - 2, mid);
	for (
		let cx = -3 - Math.floor(random() * 4);
		cx < 70;
		cx += 8 + Math.floor(random() * 4)
	) {
		const r = 5 + Math.floor(random() * 4);
		const cy = top + Math.floor(random() * 4);
		for (let y = cy - r; y <= cy + r; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				if (Math.hypot(x - cx, y - cy) > r + 0.3) {
					continue;
				}
				const k = (x - cx + (y - cy) * 1.4) / r;
				set(canvas, x, y, k > 0.75 ? shade : k > 0.05 ? mid : lit);
			}
		}
	}
}

/**
 * A floating island: a grassy top over a cone of earth and rock that narrows to a point, with roots hanging below.
 * @param {Canvas} scene
 * @param {Island} island
 * @param {() => number} random
 */
function drawIsland(scene, { left, right, top, tip }, random) {
	const mid = (left + right) / 2;
	const half = (right - left) / 2;
	const depth = tip - top;
	for (let y = top; y <= tip; y++) {
		const t = (y - top) / depth;
		// The cone bulges a little before it narrows, so it looks like a clod torn from the ground.
		const w = half * Math.sqrt(1 - t) * (1 + 0.15 * Math.sin(t * Math.PI));
		const wobble = Math.round(Math.sin(y * 1.3) * 0.8);
		for (
			let x = Math.round(mid - w) + wobble;
			x <= Math.round(mid + w) + wobble;
			x++
		) {
			const fromLeft = x - (mid - w);
			const shaded = x > mid + w * 0.4;
			const rock = t > 0.4 || (t > 0.3 && (x + y) % 2 === 0);
			let colour = rock ? C.stone : C.timber;
			if (shaded) {
				colour = rock ? C.stoneShade : C.timberShade;
			}
			if (y === top) {
				colour = C.grassLight;
			} else if (y <= top + 2) {
				colour = y === top + 2 ? C.grassShade : C.grass;
			} else if (y === top + 3) {
				colour = shaded ? C.timber : C.timberLight;
			} else if (fromLeft < 1.5) {
				colour = rock ? C.stoneLight : C.timberLight;
			} else if ((y - top) % 4 === 1 && (x + y) % 5 !== 0) {
				// Strata running across the rock.
				colour = rock ? C.stoneMid : C.wood;
			}
			set(scene, x, y, colour);
		}
	}
	// Roots dangling from the underside.
	for (let i = 0; i < Math.max(2, Math.round(half / 4)); i++) {
		const x = Math.round(mid - half * 0.6 + random() * half * 1.2);
		const t = Math.abs(x - mid) / half;
		const from = Math.round(top + depth * (1 - t * t)) - 1;
		const length = 2 + Math.floor(random() * 4);
		for (let y = from; y < from + length; y++) {
			set(scene, x + (y - from > 2 ? 1 : 0), y, C.timberShade);
		}
	}
}

/**
 * A slim stone turret with a pointed slate roof and a pennant.
 * @param {Canvas} scene
 * @param {number} x - Its leftmost column
 * @param {number} base - The row it stands on
 */
function drawTurret(scene, x, base) {
	const tower = drawBuilding(scene, { kind: 'tower', x, y: base, width: 7 });
	for (let r = 0; r < 9; r++) {
		const half = Math.floor(r / 2);
		for (let dx = -half; dx <= half + 1; dx++) {
			const colour =
				dx <= -half ? C.roofLight : dx > 0 ? C.roofShade : C.roof;
			set(scene, x + 3 + dx, tower.y + 1 - 9 + r, colour);
		}
	}
	rect(scene, x + 3, tower.y - 11, 1, 3, C.wood);
	rect(scene, x + 4, tower.y - 11, 3, 1, C.brickRed);
	set(scene, x + 4, tower.y - 10, C.brickRed);
}

/**
 * A small round tree.
 * @param {Canvas} scene
 * @param {number} cx - The trunk's column
 * @param {number} base - The row the trunk stands on
 */
function drawTree(scene, cx, base) {
	rect(scene, cx, base - 3, 1, 4, C.wood);
	for (let y = base - 10; y <= base - 3; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			const d = Math.hypot(x - cx, (y - base + 6.5) * 1.1);
			if (d <= 4) {
				const colour =
					x - cx + (y - base + 6.5) < -2
						? C.pineLight
						: d > 3 && x > cx
							? C.pineShade
							: C.pine;
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * A waterfall spilling off the big island's edge and falling into the clouds.
 * @param {Canvas} scene
 */
function drawWaterfall(scene) {
	const x = MAIN.right - 3;
	for (let y = MAIN.top; y < 56; y++) {
		const drift = y > MAIN.top + 4 ? 1 : 0;
		set(scene, x + drift, y, C.dayWave);
		set(scene, x + 1 + drift, y, y % 3 === 0 ? C.white : C.daySeaLine);
		set(scene, x + 2 + drift, y, C.dayWaveDeep);
	}
}

/**
 * A rope bridge: a sagging deck of planks under a handrope, hung between two islands.
 * @param {Canvas} scene
 * @param {number} x0 - The near end's column
 * @param {number} y0 - The near end's row
 * @param {number} x1 - The far end's column
 * @param {number} y1 - The far end's row
 */
function drawBridge(scene, x0, y0, x1, y1) {
	const steps = x1 - x0;
	const sag = Math.max(2, Math.round(steps / 4));
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const x = x0 + i;
		const y = Math.round(y0 + (y1 - y0) * t + sag * Math.sin(t * Math.PI));
		const rope = Math.round(
			y0 - 3 + (y1 - y0) * t + (sag - 1) * Math.sin(t * Math.PI)
		);
		set(scene, x, y, i % 2 ? C.timberLight : C.timber);
		set(scene, x, y + 1, C.wood);
		set(scene, x, rope, C.timberShade);
		if (i % 3 === 0) {
			for (let r = rope + 1; r < y; r++) {
				set(scene, x, r, C.timberShade);
			}
		}
	}
}

/**
 * Three birds gliding between the islands.
 * @param {Canvas} scene
 */
function drawBirds(scene) {
	for (const [bx, by] of [
		[42, 13],
		[48, 17],
	]) {
		for (const [dx, dy] of [
			[-2, 0],
			[-1, -1],
			[0, 0],
			[1, -1],
			[2, 0],
		]) {
			set(scene, bx + dx, by + dy, C.roof);
		}
	}
}
