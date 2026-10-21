// The Lighthouse landmark at night: the approved style C reference scene, drawn with the toolkit.
import {
	createCanvas,
	get,
	set,
	rect,
	fillEmpty,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The tower's centre column. */
const CX = 24;

/**
 * Draws the Lighthouse scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7);

	drawSky(layer, {
		time: 'night',
		horizon: 41,
		random,
		sparkles: [
			[8, 6],
			[58, 22],
			[37, 4],
			[3, 24],
		],
		moon: { x: 50, y: 10 },
	});
	drawHeadland(layer);
	drawSea(layer, { time: 'night', top: 42, random });
	drawReflection(layer, random);

	drawLantern(scene);
	drawTower(scene);
	drawRocks(scene);
	outline(scene, C.ink);
	// Railing posts sit in front of the sky, so they skip the outline pass.
	for (let x = 16; x <= 31; x += 2) {
		set(scene, x, 19, C.roof);
	}
	drawBeams(layer);
	drawFoam(scene);
	underlay(scene, layer);
	drawGulls(scene);
	return scene;
}

/**
 * The distant headland on the right, rising towards the edge.
 * @param {Canvas} layer
 */
function drawHeadland(layer) {
	for (let x = 40; x < 64; x++) {
		const top = Math.round(
			37 - Math.min(x - 40, 14) * 0.45 + Math.sin(x * 0.7) * 0.6
		);
		for (let y = top; y <= 41; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The lamp's broken reflection on the water, narrowing with distance.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawReflection(layer, random) {
	for (let y = 47; y < 64; y += 2) {
		const jitter = Math.floor(random() * 5) - 2;
		const n = 4 - Math.floor((y - 47) / 6);
		rect(
			layer,
			CX - 1 + jitter,
			y,
			Math.max(1, n),
			1,
			y < 54 ? C.gold : C.brass
		);
	}
}

/**
 * The roof, the lit lantern room and the gallery around it.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	set(scene, 23, 3, C.roofLight);
	set(scene, 24, 3, C.roofLight);
	set(scene, 23, 4, C.roofLight);
	set(scene, 24, 4, C.roof);
	for (const [y, half] of [
		[5, 1],
		[6, 2],
		[7, 3],
		[8, 4],
		[9, 5],
		[10, 6],
	]) {
		for (let x = CX - half; x < CX + half; x++) {
			const colour =
				x < CX - half + 2
					? C.roofLight
					: x >= CX + half - 3
						? C.roofShade
						: C.roof;
			set(scene, x, y, colour);
		}
	}
	for (let y = 11; y <= 17; y++) {
		for (let x = 19; x <= 28; x++) {
			const core = (x - 23.5) ** 2 + (y - 14) ** 2;
			const colour =
				x === 21 || x === 26
					? C.lampFrame
					: core <= 3
						? C.white
						: core <= 7
							? C.lampGlow
							: x >= 27
								? C.amber
								: C.gold;
			set(scene, x, y, colour);
		}
	}
	for (let x = 16; x <= 31; x++) {
		set(scene, x, 18, x <= 17 ? C.railLight : C.roofLight);
		set(scene, x, 20, x >= 29 ? C.night : C.roofShade);
	}
	for (let x = 18; x <= 29; x++) {
		set(scene, x, 21, C.roofShade);
	}
}

/**
 * The striped, brick-shaded tower with its windows and door.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = 22; y <= 44; y++) {
		const half = Math.round(4 + ((y - 22) * 3) / 22);
		towerRow(scene, y, half, Math.floor((y - 22) / 5) % 2 === 0);
	}
	for (const y of [27, 36]) {
		rect(scene, 23, y, 2, 3, C.gold);
		set(scene, 24, y + 2, C.amber);
	}
	rect(scene, 22, 41, 4, 4, C.wood);
	set(scene, 24, 43, C.brass);
}

/**
 * One row of the tower: lit on the left, shaded on the right, with bricks on the white bands.
 * @param {Canvas} scene
 * @param {number} y
 * @param {number} half - Half the row's width
 * @param {boolean} band - A red band rather than a white one
 */
function towerRow(scene, y, half, band) {
	const [main, dark, light] = band
		? [C.brickRed, C.brickRedShade, C.brickRedLight]
		: [C.cream, C.creamShade, C.creamLight];
	const shade = 3;
	const x0 = CX - half;
	const x1 = CX + half - 1;
	for (let x = x0; x <= x1; x++) {
		let colour = /** @type {Colour} */ (main);
		if (x === x0) {
			colour = light;
		} else if (x > x1 - shade) {
			colour = dark;
		} else if (x === x1 - shade && y % 2) {
			colour = dark;
		}
		const brick =
			!band &&
			colour === main &&
			y % 2 === 0 &&
			(x + (Math.floor(y / 2) % 2) * 2) % 4 === 0;
		if (brick) {
			colour = mix(C.cream, C.creamShade, 0.5);
		}
		set(scene, x, y, colour);
	}
}

/**
 * The rock island: a stone ledge and a pile of shaded boulders.
 * @param {Canvas} scene
 */
function drawRocks(scene) {
	for (let x = 14; x <= 33; x++) {
		for (let y = 45; y <= 47; y++) {
			const colour =
				y === 45
					? C.stoneLight
					: x >= 31 || (x + y) % 6 === 0
						? C.stoneShade
						: C.stone;
			set(scene, x, y, colour);
		}
	}
	const boulders = [
		[20, 48, 6],
		[29, 48, 6],
		[13, 51, 5],
		[36, 51, 5],
		[24, 53, 6],
		[7, 54, 3],
		[42, 54, 3],
	];
	boulders.forEach(([bx, by, r], n) => {
		for (let y = by - r; y <= by + r; y++) {
			for (let x = bx - r; x <= bx + r; x++) {
				const dx = x - bx;
				const dy = y - by;
				if (
					dx * dx + dy * dy > r * r ||
					get(scene, x, y) !== null ||
					y > 57
				) {
					continue;
				}
				const colour =
					dx + dy < -r * 0.7
						? C.stoneLight
						: dx + dy > r * 0.45
							? C.stoneShade
							: n % 2
								? C.stone
								: C.stoneMid;
				set(scene, x, y, colour);
			}
		}
	});
}

/**
 * The lamp's two beams, brightening the sky behind them and fading with distance.
 * @param {Canvas} layer
 */
function drawBeams(layer) {
	for (let distance = 1; distance <= 40; distance++) {
		const spread = Math.floor(distance * 0.2);
		for (let y = 14 - spread; y <= 14 + spread; y++) {
			const t =
				(distance < 12 ? 0.55 : 0.4) *
				(1 - Math.abs(y - 14) / (spread + 1.5));
			for (const x of [19 - distance, 28 + distance]) {
				const behind = get(layer, x, y);
				if (behind && y < 41) {
					set(layer, x, y, mix(behind, C.beamLight, t));
				}
			}
		}
	}
}

/**
 * Foam where the outlined rock meets the sea.
 * @param {Canvas} scene
 */
function drawFoam(scene) {
	for (let x = 0; x < 64; x++) {
		for (let y = 50; y < 60; y++) {
			if (
				get(scene, x, y) === C.ink &&
				get(scene, x, y + 1) === null &&
				(x + y) % 3
			) {
				fillEmpty(scene, x, y + 1, C.foam);
			}
		}
	}
}

/**
 * Two gulls over the sea.
 * @param {Canvas} scene
 */
function drawGulls(scene) {
	for (const [gx, gy] of [
		[41, 21],
		[46, 17],
	]) {
		for (const [dx, dy] of [
			[-2, 0],
			[-1, -1],
			[0, 0],
			[1, -1],
			[2, 0],
		]) {
			set(scene, gx + dx, gy + dy, C.gull);
		}
	}
}
