// Scene part: the ground a scene stands on, in the four land terrains of the map.
import { set } from '../painter.js';
import { PALETTE } from '../palette.js';

/** @typedef {import('../painter.js').Canvas} Canvas */
/** @typedef {import('../painter.js').Colour} Colour */

/**
 * Options for drawTerrain.
 * @typedef {Object} TerrainOptions
 * @property {'forest' | 'mountain' | 'desert' | 'grassland'} kind - The terrain
 * @property {number} top - The ground's first row; rows top to the bottom are filled. Trees, peaks and dunes may rise above it
 * @property {() => number} random - The scene's seeded random stream
 */

/** @type {Record<string, (canvas: Canvas, top: number, random: () => number) => void>} */
const TERRAINS = {
	grassland: drawGrassland,
	forest: drawForest,
	mountain: drawMountain,
	desert: drawDesert,
};

/**
 * Draws a band of ground from its top row to the bottom of the canvas.
 * @param {Canvas} canvas - The background layer
 * @param {TerrainOptions} options
 * @throws {Error} For an unknown terrain.
 */
export function drawTerrain(canvas, { kind, top, random }) {
	const draw = TERRAINS[kind];
	if (!draw) {
		throw new Error(`drawTerrain: unknown kind "${kind}"`);
	}
	draw(canvas, top, random);
}

/**
 * Fills the ground with a lit top edge and a dithered shade that deepens towards the viewer.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {Colour} light
 * @param {Colour} main
 * @param {Colour} shade
 */
function ground(canvas, top, light, main, shade) {
	const depth = canvas.h - top;
	for (let y = top; y < canvas.h; y++) {
		const t = (y - top) / depth;
		for (let x = 0; x < canvas.w; x++) {
			let colour = main;
			if (y === top) {
				colour = light;
			} else if (t > 0.7 || (t > 0.45 && (x + y) % 2 === 0)) {
				colour = shade;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Picks a random pixel inside the ground band, below its top edge.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {() => number} random
 * @returns {[number, number]}
 */
function groundSpot(canvas, top, random) {
	const x = Math.floor(random() * canvas.w);
	const y = top + 1 + Math.floor(random() * Math.max(1, canvas.h - top - 1));
	return [x, y];
}

/**
 * Grass with blades along the skyline, tufts and a few flowers.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {() => number} random
 */
function drawGrassland(canvas, top, random) {
	ground(canvas, top, PALETTE.grassLight, PALETTE.grass, PALETTE.grassShade);
	for (let x = 0; x < canvas.w; x++) {
		if (random() < 0.3) {
			set(canvas, x, top - 1, PALETTE.grass);
		}
	}
	const tufts = Math.floor((canvas.w * (canvas.h - top)) / 40);
	for (let i = 0; i < tufts; i++) {
		const [x, y] = groundSpot(canvas, top, random);
		set(canvas, x, y, PALETTE.grassLight);
		if (y - 1 > top) {
			set(canvas, x + 1, y - 1, PALETTE.grassLight);
		}
	}
	for (let i = 0; i < 4; i++) {
		const [x, y] = groundSpot(canvas, top, random);
		set(canvas, x, y, i % 2 ? PALETTE.gold : PALETTE.creamLight);
	}
}

/**
 * A forest floor with a back row of pines on the skyline and a few nearer pines.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {() => number} random
 */
function drawForest(canvas, top, random) {
	ground(
		canvas,
		top,
		PALETTE.forestFloorLight,
		PALETTE.forestFloor,
		PALETTE.forestFloorShade
	);
	for (
		let x = 2 + Math.floor(random() * 4);
		x < canvas.w;
		x += 6 + Math.floor(random() * 3)
	) {
		drawPine(canvas, x, top + 1, 9 + Math.floor(random() * 5));
	}
	const near = Math.max(1, Math.floor(canvas.w / 24));
	for (let i = 0; i < near; i++) {
		const x =
			Math.floor(((i + 0.5) * canvas.w) / near) +
			Math.floor(random() * 5) -
			2;
		const base = Math.min(canvas.h - 1, top + 8 + Math.floor(random() * 4));
		drawPine(canvas, x, base, 12 + Math.floor(random() * 4));
	}
}

/**
 * A pine: a short trunk under a stepped cone, lit on the left and shaded on the right.
 * @param {Canvas} canvas
 * @param {number} cx - The trunk's column
 * @param {number} base - The row the trunk stands on
 * @param {number} height - From the base to the tip
 */
function drawPine(canvas, cx, base, height) {
	set(canvas, cx, base, PALETTE.wood);
	set(canvas, cx, base - 1, PALETTE.wood);
	const tip = base - height + 1;
	for (let y = tip; y <= base - 2; y++) {
		const half = Math.min(
			4,
			Math.floor((y - tip + 1) / 2) - ((y - tip) % 3 === 2 ? 1 : 0)
		);
		for (let x = cx - half; x <= cx + half; x++) {
			const colour =
				x === cx - half
					? PALETTE.pineLight
					: x > cx
						? PALETTE.pineShade
						: PALETTE.pine;
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Rocky ground under a range of snow-capped peaks, the far ones paler.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {() => number} random
 */
function drawMountain(canvas, top, random) {
	const peaks = 3;
	for (let i = 0; i < peaks; i++) {
		const px =
			Math.floor(((i + 0.5) * canvas.w) / peaks) +
			Math.floor(random() * 9) -
			4;
		const height = Math.min(
			top,
			10 + Math.floor(random() * 8) + (i === 1 ? 4 : 0)
		);
		drawPeak(canvas, px, top, height);
	}
	ground(canvas, top, PALETTE.stone, PALETTE.stoneMid, PALETTE.stoneShade);
	const pebbles = Math.floor((canvas.w * (canvas.h - top)) / 50);
	for (let i = 0; i < pebbles; i++) {
		const [x, y] = groundSpot(canvas, top, random);
		set(canvas, x, y, PALETTE.stoneLight);
		set(canvas, x + 1, y, PALETTE.stoneShade);
	}
}

/**
 * One peak rising from the ground line: lit on the left, shaded on the right, with snow on top.
 * @param {Canvas} canvas
 * @param {number} px - The summit's column
 * @param {number} top - The ground line
 * @param {number} height - Rows above the ground line
 */
function drawPeak(canvas, px, top, height) {
	const summit = top - height;
	for (let y = summit; y < top; y++) {
		const half = y - summit;
		for (let x = px - half; x <= px + half; x++) {
			const snow = y - summit < 4;
			const left = x <= px;
			const colour = snow
				? left
					? PALETTE.snow
					: PALETTE.snowShade
				: left
					? PALETTE.stoneLight
					: PALETTE.stoneShade;
			set(canvas, x, y, colour);
		}
	}
}

/**
 * Sand with dunes on the skyline and wind ripples across the ground.
 * @param {Canvas} canvas
 * @param {number} top
 * @param {() => number} random
 */
function drawDesert(canvas, top, random) {
	ground(canvas, top, PALETTE.sandLight, PALETTE.sand, PALETTE.sandShade);
	const phase = random() * Math.PI * 2;
	for (let x = 0; x < canvas.w; x++) {
		const rise = Math.round(2.5 + 2.5 * Math.sin(x * 0.12 + phase));
		// The slope facing the light (rising to the right) is lit; the far side is plain sand.
		const lit = Math.cos(x * 0.12 + phase) > 0;
		for (let y = top - rise; y < top; y++) {
			set(canvas, x, y, lit ? PALETTE.sandLight : PALETTE.sand);
		}
	}
	for (let y = top + 3; y < canvas.h - 1; y += 4) {
		const shift = random() * Math.PI * 2;
		for (let x = 0; x < canvas.w; x++) {
			if (Math.sin(x * 0.35 + shift) > 0.55) {
				set(canvas, x, y, PALETTE.sandShade);
			}
		}
	}
}
