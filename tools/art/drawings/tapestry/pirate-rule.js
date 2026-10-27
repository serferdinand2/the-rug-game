// Pirate Rule: a red-sailed pirate ship flying a plain black flag across a full moon in a cliff-walled cove, an open treasure chest glinting on the sand.
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
import { drawShip } from '../../parts/ship.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The horizon row, the ship's waterline, and the full moon's centre and radius. */
const HORIZON = 40;
const WATERLINE = 47;
const MOON = { x: 42, y: 14, r: 9 };

/**
 * The first row of sand in each column: the beach curves up towards the cliff on the left.
 * @param {number} x
 * @returns {number}
 */
function shore(x) {
	return Math.round(54 - Math.max(0, 22 - x) * 0.2 + Math.sin(x * 0.2) * 1.2);
}

/**
 * Draws the Pirate Rule scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(409);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 30,
		starRows: 30,
		sparkles: [
			[8, 5],
			[60, 26],
		],
	});
	drawMoon(layer);
	drawFarPoint(layer);
	drawSea(layer, { time: 'night', top: HORIZON + 1, random, waves: 40 });
	drawMoonPath(layer, random);
	drawBeach(layer, random);

	// The ship rides in the cove behind the beach, so it gets its own outline and moonlit edges.
	const ship = createCanvas(64, 64);
	drawShip(ship, {
		x: 22,
		y: WATERLINE,
		facing: 'left',
		sails: C.brickRed,
		flag: C.ink,
	});
	drawBlackFlag(ship, 43, WATERLINE - 29);
	moonlight(ship);
	outline(ship, C.ink);

	drawCliff(scene);
	drawPalm(scene, 5, 20);
	drawChest(scene, 31, 59);
	drawShovel(scene, 48, 60);
	outline(scene, C.ink);
	underlay(scene, ship);
	underlay(scene, layer);
	drawCoins(scene);
	return scene;
}

/**
 * A full moon with darker seas on its face and a faint halo around it.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	for (let y = cy - r - 3; y <= cy + r + 3; y++) {
		for (let x = cx - r - 3; x <= cx + r + 3; x++) {
			const d = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
			const behind = get(layer, x, y);
			if (!behind) {
				continue;
			}
			if (d <= r) {
				const sea =
					(x - cx + 3) ** 2 + (y - cy + 2) ** 2 <= 6 ||
					(x - cx - 3) ** 2 + (y - cy - 3) ** 2 <= 4 ||
					(x - cx + 1) ** 2 + (y - cy - 5) ** 2 <= 2;
				set(layer, x, y, d > r - 1 || sea ? C.moonRim : C.moon);
			} else if (d <= r + 3) {
				set(
					layer,
					x,
					y,
					mix(behind, C.starDim, d <= r + 1.5 ? 0.3 : 0.15)
				);
			}
		}
	}
}

/**
 * A far, low point of land closing the cove on the right.
 * @param {Canvas} layer
 */
function drawFarPoint(layer) {
	for (let x = 46; x < 64; x++) {
		const top = Math.round(
			HORIZON - 1 - (x - 46) * 0.25 - Math.sin(x * 0.6) * 0.6
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
}

/**
 * The moon's glitter on the water below it, narrowing towards the beach.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMoonPath(layer, random) {
	for (let y = HORIZON + 2; y < 54; y += 2) {
		const half = Math.max(1, 5 - Math.floor((y - HORIZON) / 4));
		const jitter = Math.floor(random() * 3) - 1;
		rect(
			layer,
			MOON.x - half + jitter,
			y,
			half * 2,
			1,
			y < 47 ? C.moon : C.moonRim
		);
	}
}

/**
 * The beach in moonlight: pale blue-grey sand with a line of foam where the waves run up.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	const sand = mix(C.sand, C.nightSky5, 0.55);
	const sandLight = mix(C.sandLight, C.nightSky6, 0.45);
	const sandShade = mix(C.sandShade, C.nightSky4, 0.6);
	for (let x = 0; x < 64; x++) {
		const top = shore(x);
		if (x % 5 !== 2) {
			set(layer, x, top - 1, C.foam);
		}
		for (let y = top; y < 64; y++) {
			let colour = sand;
			if (y === top) {
				colour = sandLight;
			} else if (y > 59 || (y > 56 && (x + y) % 2 === 0)) {
				colour = sandShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 64);
		const y = 54 + Math.floor(random() * 9);
		set(layer, x, y, sandLight);
	}
}

/**
 * Lights the top edge of every sail, spar and rail, as if the moon behind the ship caught them.
 * @param {Canvas} canvas
 */
function moonlight(canvas) {
	/** @type {[number, number, string][]} */
	const lit = [];
	for (let y = 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(canvas, x, y);
			if (colour && colour !== C.ink && get(canvas, x, y - 1) === null) {
				lit.push([x, y, mix(colour, C.moon, 0.45)]);
			}
		}
	}
	for (const [x, y, colour] of lit) {
		set(canvas, x, y, colour);
	}
}

/**
 * The dark cliff walling the cove on the left: a flat top, a steep face towards the cove, ledges rimmed with moonlight.
 * @param {Canvas} scene
 */
function drawCliff(scene) {
	for (let x = 0; x < 21; x++) {
		const top =
			x < 11
				? Math.round(19 + x * 0.3 + Math.sin(x * 0.9) * 0.8)
				: Math.round(22 + (x - 11) ** 2 * 0.3);
		const foot = shore(x) + 2;
		for (let y = top; y <= foot; y++) {
			let colour = C.headland;
			if (y <= top + (x >= 11 ? 0 : 1)) {
				colour = C.railLight;
			} else if (
				x >= 11 &&
				x === Math.round(11 + Math.sqrt((y - 22) / 0.3)) - 1
			) {
				colour = C.roofLight;
			} else if ((y - top) % 8 === 4 && x % 7 < 5) {
				colour = C.headlandRidge;
			} else if ((y * 3 + x) % 11 === 0) {
				colour = C.roofShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A few boulders where the cliff meets the beach.
	for (const [bx, by, r] of [
		[20, 56, 3],
		[24, 58, 2],
	]) {
		for (let y = by - r; y <= by + r; y++) {
			for (let x = bx - r; x <= bx + r; x++) {
				if ((x - bx) ** 2 + (y - by) ** 2 <= r * r) {
					set(
						scene,
						x,
						y,
						x - bx + y - by < -1 ? C.roofLight : C.roof
					);
				}
			}
		}
	}
}

/**
 * A palm on the clifftop, dark against the sky, its fronds edged by the moon.
 * @param {Canvas} scene
 * @param {number} x - The trunk's base column
 * @param {number} base - The trunk's bottom row
 */
function drawPalm(scene, x, base) {
	for (let i = 0; i <= 13; i++) {
		const tx = x + Math.round(4 * (i / 13) ** 2);
		set(scene, tx, base - i, i % 3 === 0 ? C.roofShade : C.roof);
		set(scene, tx + 1, base - i, C.roofShade);
	}
	const cx = x + 4;
	const cy = base - 13;
	for (const [angle, length] of [
		[165, 8],
		[130, 6],
		[85, 4],
		[40, 7],
		[5, 9],
		[-30, 6],
		[205, 6],
	]) {
		const a = (angle * Math.PI) / 180;
		for (let k = 1; k <= length; k++) {
			const px = cx + Math.round(Math.cos(a) * k);
			const py = cy - Math.round(Math.sin(a) * k - 0.1 * k * k);
			set(scene, px, py, k < length - 1 ? C.roofLight : C.roof);
			if (k < length - 1) {
				set(scene, px, py + 1, C.roof);
			}
		}
	}
}

/**
 * Widens the ship's pennant into a plain black flag, streaming from the mainmast's head.
 * @param {Canvas} canvas
 * @param {number} mast - The mainmast's column
 * @param {number} top - The masthead's row
 */
function drawBlackFlag(canvas, mast, top) {
	const rows = ['..kkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkkkk', 'kkkkkk..'];
	rows.forEach((line, j) => {
		[...line].forEach((key, i) => {
			if (key === 'k') {
				set(canvas, mast - 8 + i, top + j, C.ink);
			}
		});
	});
	set(canvas, mast, top - 1, C.wood);
}

/**
 * The open treasure chest: a brass-bound box, its lid thrown back and heaped with gold.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - The bottom row
 */
function drawChest(scene, x, y) {
	const w = 13;
	// The lid, thrown back, shown from inside.
	for (let j = 0; j < 4; j++) {
		for (let i = 1; i < w - 1; i++) {
			const colour =
				j === 0
					? C.timberLight
					: i === 1 || i === w - 2
						? C.brass
						: C.timberShade;
			set(scene, x + i, y - 13 + j, colour);
		}
	}
	// The heap of gold.
	for (let j = 0; j < 4; j++) {
		const inset = 3 - j;
		for (
			let i = 1 + Math.max(0, inset - 1);
			i < w - 1 - Math.max(0, inset - 1);
			i++
		) {
			const glint = (i + j * 2) % 4 === 0;
			const colour =
				j === 0
					? C.lampGlow
					: glint
						? C.lampGlow
						: (i + j) % 3 === 0
							? C.amber
							: C.gold;
			set(scene, x + i, y - 10 + j, colour);
		}
	}
	set(scene, x + 4, y - 8, C.brickRedLight);
	set(scene, x + 9, y - 9, C.nightWave);
	// The box, with brass bands and a lock plate.
	for (let j = 0; j < 6; j++) {
		for (let i = 0; i < w; i++) {
			let colour =
				j === 0 ? C.timberLight : i >= w - 2 ? C.timberShade : C.timber;
			if (i === 2 || i === w - 3) {
				colour = C.brass;
			}
			set(scene, x + i, y - 6 + j, colour);
		}
	}
	rect(scene, x + 5, y - 5, 3, 3, C.gold);
	set(scene, x + 6, y - 4, C.wood);
}

/**
 * A shovel stuck in the sand beside the dig.
 * @param {Canvas} scene
 * @param {number} x - The handle's column
 * @param {number} y - The blade's bottom row
 */
function drawShovel(scene, x, y) {
	for (let j = 0; j < 14; j++) {
		set(scene, x + Math.floor(j / 5), y - 18 + j, C.timberLight);
	}
	rect(scene, x - 1, y - 19, 3, 1, C.timber);
	rect(scene, x + 1, y - 5, 4, 5, C.stone);
	rect(scene, x + 1, y - 5, 1, 5, C.stoneLight);
	set(scene, x + 4, y - 1, C.stoneShade);
}

/**
 * Coins spilled on the sand in front of the chest, without an outline so they glint.
 * @param {Canvas} scene
 */
function drawCoins(scene) {
	for (const [x, y] of [
		[29, 60],
		[45, 60],
		[47, 62],
		[27, 62],
		[43, 62],
		[38, 62],
	]) {
		set(scene, x, y, C.gold);
		set(scene, x + 1, y, C.amber);
	}
}
