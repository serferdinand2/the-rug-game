// Pillage and Plunder: a raiders' longship beached below a burning village at night, chests of loot on the firelit sand.
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
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The sea's horizon row, the longship's keel row, and the heart of the fire. */
const HORIZON = 38;
const KEEL = 54;
const FIRE = { x: 52, y: 24 };

/**
 * The first column of sand on each row: the shore runs diagonally from the bottom left up to the village.
 * @param {number} y
 * @returns {number}
 */
function shore(y) {
	return Math.round(40 - (y - HORIZON) * 1.6);
}

/**
 * Draws the Pillage and Plunder scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(523);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 26,
		starRows: 22,
	});
	drawSea(layer, { time: 'night', top: HORIZON + 1, random, waves: 36 });
	drawBeach(layer, random);
	drawGlow(layer);
	drawPlume(layer);

	// The village burns on the rise behind the ship, so it gets its own outline.
	const village = createCanvas(64, 64);
	drawRise(village);
	drawLonghouse(village, 51, 33, 14);
	drawLonghouse(village, 35, 37, 14);
	outline(village, C.ink);
	drawFlames(village);

	drawLongship(scene);
	drawChest(scene, 44, 61, false);
	drawChest(scene, 53, 62, true);
	outline(scene, C.ink);
	underlay(scene, village);
	underlay(scene, layer);
	drawLoot(scene);
	drawEmbers(scene, random);
	return scene;
}

/**
 * The beach: dark sand reddened by the fire, with foam along the shore.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	const sand = mix(C.sandShade, C.brickRedShade, 0.45);
	const sandLight = mix(C.sand, C.amber, 0.35);
	const sandDeep = mix(C.sandShade, C.nightSky3, 0.55);
	for (let y = HORIZON + 1; y < 64; y++) {
		const from = shore(y);
		set(layer, from - 1, y, C.foam);
		for (let x = Math.max(0, from); x < 64; x++) {
			let colour = sand;
			if (x === from) {
				colour = sandDeep;
			} else if (y > 58 && (x + y) % 2 === 0) {
				colour = sandDeep;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 16; i++) {
		const y = 44 + Math.floor(random() * 19);
		const x = shore(y) + 2 + Math.floor(random() * 30);
		set(layer, x, y, sandLight);
	}
}

/**
 * The fire's red glow over the sky, strongest near the village.
 * @param {Canvas} layer
 */
function drawGlow(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.sqrt((x - FIRE.x) ** 2 + ((y - FIRE.y) * 1.3) ** 2);
			const t = Math.max(0, 1 - d / 46) * 0.75;
			const behind = get(layer, x, y);
			if (behind && t > 0.05) {
				const tint =
					d < 14 ? mix(C.brickRed, C.amber, 0.4) : C.brickRedShade;
				// Three stepped bands, so the glow keeps a pixel-art look.
				set(layer, x, y, mix(behind, tint, Math.ceil(t / 0.25) * 0.18));
			}
		}
	}
}

/**
 * A heavy column of smoke rising from the fires and leaning away to the left, lit red from below.
 * @param {Canvas} layer
 */
function drawPlume(layer) {
	const smoke = mix(C.roofShade, C.stoneShade, 0.35);
	const smokeLit = mix(C.stoneShade, C.brickRed, 0.35);
	for (let i = 0; i < 9; i++) {
		const cx = 54 - i * 4 + Math.round(Math.sin(i) * 1.5);
		const cy = 10 - i * 1.6;
		const r = 4 + i * 0.7;
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				if ((x - cx) ** 2 + (y - cy) ** 2 > r * r) {
					continue;
				}
				set(layer, x, y, y - cy > r * 0.35 && i < 5 ? smokeLit : smoke);
			}
		}
	}
}

/**
 * The rise the village stands on, dark earth catching the firelight.
 * @param {Canvas} canvas
 */
function drawRise(canvas) {
	const earth = mix(C.forestFloorShade, C.brickRedShade, 0.5);
	const earthLit = mix(C.forestFloor, C.amber, 0.4);
	for (let x = 32; x < 64; x++) {
		const top = Math.round(
			38 - Math.min(x - 32, 20) * 0.25 + Math.sin(x * 0.5) * 0.6
		);
		const foot = Math.min(63, 40 + Math.round((x - 32) * 0.3));
		for (let y = top; y <= foot; y++) {
			set(canvas, x, y, y === top ? earthLit : earth);
		}
	}
}

/**
 * A timber longhouse with a steep thatched roof and crossed gable ends, its doorway glowing.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - The bottom row
 * @param {number} w - Width
 */
function drawLonghouse(canvas, x, y, w) {
	for (let row = y - 6; row <= y; row++) {
		for (let i = 0; i < w; i++) {
			let colour = i % 3 === 0 ? C.timberShade : C.timber;
			if (i === 0) {
				colour = mix(C.timberLight, C.amber, 0.3);
			} else if (i >= w - 2) {
				colour = C.timberShade;
			}
			set(canvas, x + i, row, colour);
		}
	}
	rect(canvas, x + 3, y - 4, 3, 5, C.amber);
	rect(canvas, x + 4, y - 3, 1, 4, C.lampGlow);
	rect(canvas, x + w - 5, y - 4, 2, 2, C.gold);
	// The thatch, overhanging the walls, lit on the left, darker towards the right.
	const thatch = mix(C.sandShade, C.brickRed, 0.25);
	const thatchLit = mix(C.sandLight, C.amber, 0.35);
	const half = Math.ceil(w / 2) + 1;
	for (let r = 0; r < half; r++) {
		const row = y - 7 - r;
		for (let i = r - 1; i <= w - r; i++) {
			let colour = (i + r * 2) % 4 === 0 ? C.timberShade : thatch;
			if (i <= r) {
				colour = thatchLit;
			} else if (i >= w - r - 1) {
				colour = C.timberShade;
			}
			set(canvas, x + i, row, colour);
		}
	}
	// The crossed gable boards above the ridge.
	const cx = x + Math.floor(w / 2);
	const ridge = y - 7 - half + 1;
	for (const [dx, dy] of [
		[-2, -2],
		[-1, -1],
		[2, -2],
		[1, -1],
	]) {
		set(canvas, cx + dx, ridge + dy, C.timberShade);
	}
}

/**
 * Flames bursting through the thatch, drawn after the outline so they glow without an edge.
 * @param {Canvas} canvas
 */
function drawFlames(canvas) {
	for (const [cx, base, h, w] of [
		[45, 25, 11, 4],
		[60, 22, 15, 5],
		[55, 20, 7, 2],
		[49, 27, 6, 2],
		[40, 28, 4, 1],
	]) {
		for (let y = base - h; y <= base; y++) {
			const t = (y - (base - h)) / h;
			const half = Math.round(
				w * Math.sin(t * Math.PI * 0.62) + Math.sin(y * 1.7 + cx) * 0.8
			);
			for (let x = cx - half; x <= cx + half; x++) {
				const edge = Math.abs(x - cx) / Math.max(1, half);
				let colour = C.brickRed;
				if (edge < 0.35 && t > 0.45) {
					colour = C.lampGlow;
				} else if (edge < 0.6 && t > 0.25) {
					colour = C.gold;
				} else if (edge < 0.9) {
					colour = C.amber;
				}
				set(canvas, x, y, colour);
			}
		}
		// Tongues of flame breaking off above.
		set(canvas, cx - 1, base - h - 2, C.amber);
		set(canvas, cx + 1, base - h - 3, C.brickRedLight);
	}
}

/**
 * The longship, beached with its prow on the sand: a low clinker hull, a curled prow and stern,
 * a row of painted shields, oars, and one striped square sail.
 * @param {Canvas} scene
 */
function drawLongship(scene) {
	// The hull, narrowing to the keel, with clinker strakes and a firelit gunwale.
	const firelit = mix(C.timberLight, C.amber, 0.45);
	for (const [y, from, to] of [
		[KEEL - 7, 5, 39],
		[KEEL - 6, 5, 39],
		[KEEL - 5, 6, 38],
		[KEEL - 4, 7, 37],
		[KEEL - 3, 8, 36],
		[KEEL - 2, 10, 34],
		[KEEL - 1, 12, 32],
		[KEEL, 15, 29],
	]) {
		for (let x = from; x <= to; x++) {
			let colour = (KEEL - y) % 2 ? C.timber : C.timberShade;
			if (y === KEEL - 7) {
				colour = firelit;
			} else if (x >= to - 1) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The prow on the right, a tall neck curling over at the top, and the lower curled stern on the left.
	for (const [x, y] of [
		[40, 46],
		[41, 45],
		[41, 44],
		[42, 43],
		[42, 42],
		[43, 41],
		[43, 40],
		[43, 39],
		[43, 38],
		[43, 37],
		[42, 36],
		[41, 36],
		[40, 37],
		[40, 38],
		[41, 39],
	]) {
		set(scene, x, y, C.timberShade);
		set(scene, x - 1, y, get(scene, x - 1, y) ?? firelit);
	}
	set(scene, 41, 37, C.amber);
	for (const [x, y] of [
		[4, 46],
		[3, 45],
		[3, 44],
		[2, 43],
		[2, 42],
		[3, 41],
		[4, 41],
		[4, 42],
	]) {
		set(scene, x, y, C.timber);
		set(scene, x + 1, y + 1, get(scene, x + 1, y + 1) ?? C.timber);
	}
	// The mast and yard, and the square sail in broad red and cream stripes, bellied by the wind.
	for (let y = 20; y < KEEL - 7; y++) {
		set(scene, 22, y, C.wood);
	}
	for (let x = 12; x <= 32; x++) {
		set(scene, x, 22, C.wood);
	}
	for (let y = 23; y <= 37; y++) {
		const belly = Math.round(Math.sin(((y - 23) / 14) * Math.PI) * 1.5);
		for (let x = 13 - belly; x <= 31 + belly; x++) {
			const stripe = Math.floor((x - 13 + 1) / 4) % 2 === 0;
			let colour = stripe ? C.brickRed : C.cream;
			if (x >= 29 + belly || y === 37) {
				colour = stripe ? C.brickRedShade : C.creamShade;
			}
			set(scene, x, y, colour);
		}
	}
	// Ropes from the yard's ends down to the gunwale.
	for (let i = 0; i < 9; i++) {
		set(scene, 12 - Math.floor(i / 3), 38 + i, C.wood);
		set(scene, 32 + Math.floor(i / 3), 38 + i, C.wood);
	}
	// Oars, run out and resting on the sand.
	for (const ox of [10, 17, 24, 31]) {
		for (let i = 0; i < 7; i++) {
			set(scene, ox - Math.floor(i * 0.6), KEEL - 4 + i, C.timberLight);
		}
	}
	// The shields along the side.
	const colours = [C.gold, C.brickRedLight, C.creamLight, C.nightWave];
	for (let n = 0, x = 7; x <= 35; x += 4, n++) {
		const face = colours[n % colours.length];
		for (const [dx, dy] of [
			[0, -1],
			[-1, 0],
			[0, 0],
			[1, 0],
			[0, 1],
			[-1, -1],
			[1, -1],
			[-1, 1],
			[1, 1],
		]) {
			set(scene, x + dx, KEEL - 7 + dy, face);
		}
		set(scene, x, KEEL - 7, C.stone);
		set(scene, x + 1, KEEL - 6, mix(face, C.ink, 0.35));
	}
}

/**
 * A brass-bound chest, open and heaped with gold or shut fast.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - The bottom row
 * @param {boolean} open - Whether the lid is thrown back
 */
function drawChest(scene, x, y, open) {
	const w = 9;
	for (let j = 0; j < 5; j++) {
		for (let i = 0; i < w; i++) {
			let colour =
				j === 0
					? mix(C.timberLight, C.amber, 0.4)
					: i >= w - 2
						? C.timberShade
						: C.timber;
			if (i === 1 || i === w - 2) {
				colour = C.brass;
			}
			set(scene, x + i, y - 4 + j, colour);
		}
	}
	rect(scene, x + 4, y - 3, 1, 2, C.gold);
	if (open) {
		for (let i = 1; i < w - 1; i++) {
			set(scene, x + i, y - 5, i % 3 === 0 ? C.lampGlow : C.gold);
			if (i > 1 && i < w - 2) {
				set(scene, x + i, y - 6, i % 2 ? C.gold : C.amber);
			}
		}
		rect(scene, x, y - 9, w, 3, C.timberShade);
		rect(scene, x, y - 9, w, 1, mix(C.timberLight, C.amber, 0.4));
	} else {
		for (let i = 0; i < w; i++) {
			set(
				scene,
				x + i,
				y - 5,
				i === 1 || i === w - 2 ? C.brass : C.timberLight
			);
			set(
				scene,
				x + i,
				y - 6,
				i === 0 || i === w - 1
					? C.timber
					: mix(C.timberLight, C.amber, 0.4)
			);
		}
	}
}

/**
 * Spilled gold and a silver goblet on the sand, without an outline so they glint.
 * @param {Canvas} scene
 */
function drawLoot(scene) {
	for (const [x, y] of [
		[50, 63],
		[52, 60],
		[61, 63],
		[42, 63],
		[47, 62],
	]) {
		set(scene, x, y, C.gold);
	}
	// The goblet.
	rect(scene, 38, 57, 3, 2, C.stoneLight);
	set(scene, 39, 59, C.stone);
	rect(scene, 38, 60, 3, 1, C.stoneLight);
}

/**
 * Embers whirling up from the fires into the smoke.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawEmbers(scene, random) {
	for (let i = 0; i < 14; i++) {
		const x = 30 + Math.floor(random() * 32);
		const y = 4 + Math.floor(random() * 20);
		set(scene, x, y, random() > 0.5 ? C.gold : C.amber);
	}
}
