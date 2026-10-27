// Citadel of Power: one sheer black spire on a crag, crowned by a huge glowing crystal that throws lightning into a storm at night.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The spire's centre column, and the crystal's centre row. */
const CX = 32;
const CRYSTAL_Y = 9;

/** Dark stone, rimmed with the crystal's violet where it faces up and left. */
const STONE = {
	rim: mix(C.stoneLight, C.arcaneLight, 0.5),
	light: mix(C.stone, C.arcane, 0.25),
	mid: mix(C.stoneShade, C.roof, 0.45),
	shade: mix(C.roofShade, C.stoneShade, 0.3),
	deep: C.roofShade,
};

/** Lit windows and slits: a cold violet fire inside. */
const SLIT = C.arcane;
const SLIT_LIT = C.arcaneLight;

/** The crystal's facets between lit and shaded, and its hot core. */
const GEM_MID = mix(C.arcaneLight, C.arcane, 0.5);
const GEM_CORE = mix(C.white, C.arcaneLight, 0.5);

/**
 * Draws the Citadel of Power scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9409);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 14,
		starRows: 30,
	});
	drawStormClouds(layer);
	glow(layer, {
		x: CX,
		y: CRYSTAL_Y,
		radius: 25,
		colour: C.arcane,
		strength: 0.5,
		steps: 5,
	});
	drawPlain(layer);
	drawLightning(layer, random);
	glow(layer, {
		x: 57,
		y: 50,
		radius: 7,
		colour: C.arcaneLight,
		strength: 0.5,
		steps: 3,
		skip: [C.white],
	});
	for (const [x, y] of [
		[55, 50],
		[56, 49],
		[58, 49],
		[59, 50],
		[57, 51],
	]) {
		set(layer, x, y, C.white);
	}

	drawCrag(scene);
	drawCitadel(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	glow(scene, {
		x: CX,
		y: CRYSTAL_Y,
		radius: 24,
		colour: C.arcaneLight,
		strength: 0.35,
		steps: 4,
		skip: [C.ink, C.white],
	});
	drawCrystal(scene);
	drawSlits(scene);
	return scene;
}

/**
 * Heavy banks of storm cloud, their undersides lit violet by the crystal.
 * @param {Canvas} layer
 */
function drawStormClouds(layer) {
	for (const [cx, cy, rx, ry] of [
		[6, 6, 16, 5],
		[58, 4, 15, 5],
		[14, 20, 13, 3],
		[54, 19, 14, 3],
		[2, 31, 10, 3],
		[63, 33, 10, 3],
	]) {
		for (let y = cy - ry; y <= cy + ry; y++) {
			for (let x = cx - rx; x <= cx + rx; x++) {
				const bump = Math.sin(x * 0.55 + cy) * 1.3;
				const d =
					((x - cx) / rx) ** 2 + ((y - cy + bump * 0.5) / ry) ** 2;
				if (d > 1) {
					continue;
				}
				let colour = C.nightSky4;
				if (y - cy > ry * 0.35) {
					colour = mix(C.nightSky6, C.arcane, 0.3);
				} else if (y - cy < -ry * 0.4) {
					colour = C.nightSky3;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * A bleak plain far below, fading into the dark.
 * @param {Canvas} layer
 */
function drawPlain(layer) {
	for (let y = 50; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour =
				y === 50
					? C.headlandRidge
					: (x + y) % 7 === 0
						? C.nightSky2
						: C.headland;
			set(layer, x, y, colour);
		}
	}
}

/**
 * Paints one bolt of lightning: a white core with a violet fringe, stepping from one end to the other with jagged turns.
 * @param {Canvas} layer
 * @param {[number, number][]} points - The bolt's turning points, from the crystal outwards
 */
function bolt(layer, points) {
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let s = 0; s <= steps; s++) {
			const x = Math.round(x0 + ((x1 - x0) * s) / steps);
			const y = Math.round(y0 + ((y1 - y0) * s) / steps);
			for (const [dx, dy] of [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			]) {
				const behind = get(layer, x + dx, y + dy);
				if (behind && behind !== C.white) {
					set(
						layer,
						x + dx,
						y + dy,
						mix(behind, C.arcaneLight, 0.55)
					);
				}
			}
		}
	}
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let s = 0; s <= steps; s++) {
			set(
				layer,
				Math.round(x0 + ((x1 - x0) * s) / steps),
				Math.round(y0 + ((y1 - y0) * s) / steps),
				C.white
			);
		}
	}
}

/**
 * Lightning leaping from the crystal into the clouds on both sides, and one bolt striking the plain.
 * Each bolt wanders in many short, uneven steps and forks, so none of them reads as a letter.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLightning(layer, random) {
	/**
	 * A wandering path from one point towards another.
	 * @param {number} x0
	 * @param {number} y0
	 * @param {number} x1
	 * @param {number} y1
	 * @param {number} n - How many turns
	 * @returns {[number, number][]}
	 */
	const path = (x0, y0, x1, y1, n) => {
		/** @type {[number, number][]} */
		const points = [[x0, y0]];
		for (let i = 1; i < n; i++) {
			const t = i / n;
			points.push([
				Math.round(x0 + (x1 - x0) * t + (random() * 4 - 2)),
				Math.round(y0 + (y1 - y0) * t + (random() * 4 - 2)),
			]);
		}
		points.push([x1, y1]);
		return points;
	};
	const left = path(CX - 6, CRYSTAL_Y - 1, 3, 15, 7);
	bolt(layer, left);
	bolt(layer, path(left[3][0], left[3][1], 9, 2, 4));
	const right = path(CX + 6, CRYSTAL_Y, 62, 14, 7);
	bolt(layer, right);
	bolt(layer, path(right[2][0], right[2][1], 52, 1, 4));
	const strike = path(CX + 6, CRYSTAL_Y + 4, 57, 50, 9);
	bolt(layer, strike);
	bolt(layer, path(strike[5][0], strike[5][1], 61, 38, 3));
	bolt(layer, path(CX - 6, CRYSTAL_Y + 4, 8, 40, 8));
}

/**
 * The crag the citadel stands on: a dark mass of rock, its ledges catching the violet light.
 * @param {Canvas} scene
 */
function drawCrag(scene) {
	for (let x = 0; x < 64; x++) {
		const spread = Math.abs(x - CX);
		const ledge = Math.floor(spread / 5) * 2;
		const top =
			46 + Math.round(spread * 0.18) + ledge + (x % 5 === 2 ? 1 : 0);
		for (let y = top; y < 64; y++) {
			let colour = x < CX ? C.roofShade : mix(C.roofShade, C.ink, 0.35);
			if (y === top) {
				colour = x < CX ? STONE.rim : STONE.light;
			} else if (y === top + 1 && x < CX) {
				colour = STONE.light;
			} else if ((x * 2 + y * 3) % 13 === 0) {
				colour = x < CX ? STONE.mid : C.roofShade;
			} else if (y > 59) {
				colour = mix(C.roofShade, C.ink, 0.5);
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Paints one row of the spire's stone: a violet rim on the left, shaded on the right.
 * @param {Canvas} scene
 * @param {number} from - The first column
 * @param {number} to - The last column
 * @param {number} y
 */
function stoneRow(scene, from, to, y) {
	for (let x = from; x <= to; x++) {
		let colour = STONE.mid;
		if (x === from) {
			colour = STONE.rim;
		} else if (x === from + 1) {
			colour = STONE.light;
		} else if (x >= to - 1) {
			colour = STONE.deep;
		} else if (x > CX) {
			colour = STONE.shade;
		}
		set(scene, x, y, colour);
	}
}

/**
 * The citadel: one sheer, stepped spire narrowing to a claw-like crown, with buttress fins and needle turrets.
 * @param {Canvas} scene
 */
function drawCitadel(scene) {
	// The stepped body, wide at the foot and sheer above.
	for (const [half, top, bottom] of [
		[11, 43, 54],
		[7, 31, 43],
		[5, 21, 31],
		[3, 16, 21],
	]) {
		for (let y = top; y <= bottom; y++) {
			stoneRow(scene, CX - half, CX + half - 1, y);
		}
		// A lit ledge where each step begins, with a row of spiked merlons.
		for (let x = CX - half; x < CX + half; x++) {
			set(scene, x, top, x < CX ? STONE.rim : STONE.light);
			if ((x - CX + half) % 3 !== 1 && half > 3) {
				set(scene, x, top - 1, x < CX ? STONE.light : STONE.mid);
			}
		}
	}
	// Needle turrets on the corners of the lower steps.
	for (const [x, base, top] of [
		[CX - 13, 54, 33],
		[CX + 11, 54, 33],
		[CX - 9, 43, 24],
		[CX + 7, 43, 24],
	]) {
		for (let y = top + 6; y <= base; y++) {
			stoneRow(scene, x, x + 2, y);
		}
		for (let y = top; y < top + 6; y++) {
			set(scene, x + 1, y, y < top + 3 ? STONE.rim : STONE.light);
			if (y >= top + 3) {
				set(scene, x, y, STONE.rim);
				set(scene, x + 2, y, STONE.deep);
			}
		}
	}
	// The gate, shut, at the foot.
	rect(scene, CX - 3, 48, 6, 7, C.ink);
	rect(scene, CX - 2, 47, 4, 1, C.ink);
	rect(scene, CX - 2, 49, 4, 6, mix(C.arcaneShade, C.ink, 0.4));
}

/**
 * The huge crystal: a tall six-sided gem with pointed ends, lit from within.
 * Painted after the outline pass with its own ink edge, so the claws hold it.
 * @param {Canvas} scene
 */
function drawCrystal(scene) {
	const bottom = 19;
	const waist = 8;
	/** @type {[number, number][]} */
	const rows = [];
	for (let y = 0; y <= bottom; y++) {
		const half =
			y <= waist
				? 1 + Math.round((y / waist) * 6)
				: 7 - Math.round(((y - waist) / (bottom - waist)) * 5);
		rows.push([y, half]);
	}
	for (const [y, half] of rows) {
		for (let x = CX - half - 1; x <= CX + half; x++) {
			set(scene, x, y, C.ink);
		}
	}
	for (const [y, half] of rows) {
		if (y === 0 || y === bottom) {
			continue;
		}
		for (let x = CX - half; x < CX + half; x++) {
			const facet = x - (CX - half);
			const width = half * 2;
			let colour = GEM_MID;
			if (facet < width * 0.3) {
				colour = C.arcaneLight;
			} else if (facet >= width * 0.72) {
				colour = C.arcane;
			}
			if (x === CX - 1 || x === CX) {
				colour = y < 13 ? C.white : GEM_CORE;
			}
			set(scene, x, y, colour);
		}
	}
	// Glints near the top of the lit facet.
	set(scene, CX - 4, 6, C.white);
	set(scene, CX - 4, 7, C.white);
	set(scene, CX - 3, 3, C.white);
	// The crown's claws, gripping the crystal's lower half.
	for (const side of [-1, 1]) {
		for (let i = 0; i <= 8; i++) {
			const y = 20 - i;
			const x =
				CX + (side < 0 ? -1 : 0) + side * (3 + Math.round(i * 0.45));
			set(scene, x, y, side < 0 ? STONE.rim : STONE.light);
			set(scene, x + side, y, C.ink);
			if (i < 6) {
				set(scene, x - side, y, STONE.mid);
			}
		}
		set(scene, CX + (side < 0 ? -1 : 0) + side * 7, 11, C.ink);
	}
}

/**
 * Lit slits and windows climbing the spire in a line, violet fire within.
 * @param {Canvas} scene
 */
function drawSlits(scene) {
	for (const [x, y, h] of [
		[CX - 1, 23, 3],
		[CX - 1, 28, 2],
		[CX - 4, 34, 3],
		[CX + 3, 34, 3],
		[CX - 1, 37, 3],
		[CX - 7, 46, 2],
		[CX + 6, 46, 2],
		[CX - 12, 40, 2],
		[CX + 12, 40, 2],
	]) {
		for (let j = 0; j < h; j++) {
			set(scene, x, y + j, j === 0 ? SLIT_LIT : SLIT);
			if (x === CX - 1) {
				set(scene, x + 1, y + j, j === 0 ? SLIT_LIT : SLIT);
			}
		}
	}
}
