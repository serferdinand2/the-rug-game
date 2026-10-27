// Living Cities: a giant living tree grown into a town, houses on its boughs and doors and lit windows in its trunk.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';
import { drawBuilding } from '../../parts/buildings.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ground's top row, and the trunk's centre column. */
const GROUND = 54;
const TRUNK = 32;

/** The canopy's leaf clumps: centre and radius, drawn back to front. */
const CLUMPS = [
	[34, 9, 10],
	[20, 13, 10],
	[48, 13, 10],
	[9, 22, 9],
	[57, 23, 8],
	[32, 22, 12],
	[18, 29, 8],
	[47, 29, 8],
];

/** Leaf colours, lit to shaded. */
const LEAF = [C.grassLight, C.forestFloorLight, C.pine, C.pineShade];

/**
 * Draws the Living Cities scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2718);

	drawSky(layer, { time: 'day', horizon: GROUND, random });
	drawHills(layer);
	drawTerrain(layer, { kind: 'grassland', top: GROUND, random });
	drawPath(layer);

	// The tree is one living thing behind its houses, so it gets its own outline.
	const tree = createCanvas(64, 64);
	drawTrunk(tree);
	drawBoughs(tree);
	drawCanopy(tree, random);
	outline(tree, C.ink);

	drawTreeHouses(scene);
	drawLeafTufts(scene);
	drawBridge(scene);
	drawDoor(scene);
	drawFigure(scene, { x: 41, y: 61, facing: 'left', clothes: C.amber });
	drawFigure(scene, { x: 17, y: 62, facing: 'right', clothes: C.daySea2 });
	outline(scene, C.ink);
	underlay(scene, tree);
	underlay(scene, layer);
	drawWindows(scene);
	drawLanterns(scene);
	return scene;
}

/**
 * Soft blue-green hills on the far horizon.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.forestFloorLight, C.daySky5, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(GROUND - 6 + Math.sin(x * 0.15 + 1) * 2);
		for (let y = top; y < GROUND; y++) {
			set(layer, x, y, y === top ? mix(far, C.white, 0.2) : far);
		}
	}
}

/**
 * A pale path leading up to the door in the trunk.
 * @param {Canvas} layer
 */
function drawPath(layer) {
	for (let y = GROUND + 1; y < 64; y++) {
		const half = 2 + Math.floor((y - GROUND) / 3);
		for (let x = TRUNK - half; x <= TRUNK + half; x++) {
			set(layer, x, y, (x + y) % 5 === 0 ? C.sand : C.sandLight);
		}
	}
}

/**
 * The trunk: broad and rooted at the foot, with bark grooves, lit on the left.
 * @param {Canvas} tree
 */
function drawTrunk(tree) {
	for (let y = 26; y < 64; y++) {
		const flare = y > GROUND - 5 ? ((y - (GROUND - 5)) / 14) ** 2 * 8 : 0;
		const half = Math.round(6 + Math.max(0, y - 34) * 0.08 + flare);
		for (let x = TRUNK - half; x <= TRUNK + half; x++) {
			const from = x - (TRUNK - half);
			let colour = C.timber;
			if (from <= 1) {
				colour = C.timberLight;
			} else if (x >= TRUNK + half - 2) {
				colour = C.timberShade;
			} else if ((x * 3 + Math.floor(y / 5)) % 7 === 0) {
				colour = C.timberShade;
			}
			set(tree, x, y, colour);
		}
	}
	// Roots snaking out over the grass.
	for (const [x0, x1, dir] of [
		[TRUNK - 9, TRUNK - 17, -1],
		[TRUNK + 9, TRUNK + 16, 1],
	]) {
		for (let x = x0; dir < 0 ? x >= x1 : x <= x1; x += dir) {
			const y = 61 + Math.round(Math.abs(x - x0) / 4);
			set(tree, x, y, C.timber);
			set(tree, x, y - 1, C.timberLight);
		}
	}
}

/**
 * The great boughs that leave the trunk and carry the houses out among the leaves.
 * @param {Canvas} tree
 */
function drawBoughs(tree) {
	for (const [x0, y0, x1, y1] of [
		[TRUNK - 3, 34, 8, 30],
		[TRUNK + 3, 32, 56, 26],
		[TRUNK - 2, 28, 22, 16],
		[TRUNK + 2, 28, 44, 14],
	]) {
		for (let t = 0; t <= 2; t++) {
			line(
				tree,
				x0,
				y0 + t,
				x1,
				y1 + t,
				t === 0 ? C.timberLight : t === 2 ? C.timberShade : C.timber
			);
		}
	}
}

/**
 * The canopy: overlapping round clumps of leaves, lit from the upper left and speckled with lighter leaves.
 * @param {Canvas} tree
 * @param {() => number} random
 */
function drawCanopy(tree, random) {
	for (const [cx, cy, r] of CLUMPS) {
		for (let y = cy - r; y <= cy + r; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > r) {
					continue;
				}
				const towards = (-(x - cx) * 0.6 - (y - cy) * 0.8) / r;
				let shade = 1;
				if (towards > 0.55) {
					shade = 0;
				} else if (towards < -0.5) {
					shade = 3;
				} else if (towards < -0.1) {
					shade = 2;
				}
				set(tree, x, y, LEAF[shade]);
			}
		}
		// A few lighter leaves catching the sun.
		for (let i = 0; i < r; i++) {
			const x = cx - r + Math.floor(random() * r * 2);
			const y = cy - r + Math.floor(random() * r * 2);
			const here = get(tree, x, y);
			if (here === LEAF[1] || here === LEAF[2]) {
				set(tree, x, y, here === LEAF[1] ? LEAF[0] : LEAF[1]);
			}
		}
	}
}

/**
 * The houses grown into the tree: a cottage on each low bough, a timber house high on the right and a turret on top.
 * @param {Canvas} scene
 */
function drawTreeHouses(scene) {
	// Plank decks under the bough houses.
	for (const [x, y, w] of [
		[2, 31, 14],
		[47, 28, 14],
	]) {
		rect(scene, x, y, w, 1, C.timberLight);
		rect(scene, x, y + 1, w, 1, C.timberShade);
	}
	drawBuilding(scene, { kind: 'house', x: 3, y: 30, width: 11 });
	timberHouse(scene, 48, 27, C.daySea2);
	timberHouse(scene, 14, 12, C.roofLight);
	// A little lookout turret poking out of the crown, under a pointed roof.
	for (let y = 8; y <= 14; y++) {
		for (let x = 30; x <= 36; x++) {
			const colour =
				x === 30 ? C.creamLight : x >= 35 ? C.creamShade : C.cream;
			set(scene, x, y, colour);
		}
	}
	for (let r = 0; r < 7; r++) {
		for (let x = 33 - r; x <= 33 + r; x++) {
			const colour =
				x === 33 - r
					? C.brickRedLight
					: x > 33
						? C.brickRedShade
						: C.brickRed;
			set(scene, x, 1 + r, colour);
		}
	}
}

/**
 * Tufts of leaves and vine grown over the houses' corners, so they look grown into the tree rather than set on it.
 * @param {Canvas} scene
 */
function drawLeafTufts(scene) {
	for (const [x, y] of [
		[1, 28],
		[12, 22],
		[46, 25],
		[57, 18],
		[13, 9],
		[22, 4],
		[28, 12],
		[36, 6],
	]) {
		paint(scene, x, y, ['.lg.', 'lggp', '.gp.'], {
			l: LEAF[0],
			g: LEAF[1],
			p: LEAF[2],
		});
	}
}

/**
 * A little timber house with a coloured roof, a round window and a plank door.
 * @param {Canvas} scene
 * @param {number} x - Its leftmost column
 * @param {number} y - Its bottom row
 * @param {Colour} roof - The roof's colour
 */
function timberHouse(scene, x, y, roof) {
	for (let row = y - 6; row <= y; row++) {
		for (let col = x + 1; col <= x + 9; col++) {
			const colour =
				col === x + 1
					? C.timberLight
					: col >= x + 8
						? C.timberShade
						: (row + col) % 3 === 0
							? C.timberLight
							: C.timber;
			set(scene, col, row, colour);
		}
	}
	rect(scene, x + 3, y - 3, 2, 4, C.wood);
	const roofShade = mix(roof, C.ink, 0.3);
	for (let r = 0; r < 6; r++) {
		for (let col = x + r; col <= x + 10 - r; col++) {
			set(scene, col, y - 7 - r, col >= x + 9 - r ? roofShade : roof);
		}
	}
}

/**
 * A rope bridge slung between the low boughs, sagging past the trunk.
 * @param {Canvas} scene
 */
function drawBridge(scene) {
	for (let x = 15; x <= 47; x++) {
		const t = (x - 15) / 32;
		const y = Math.round(31 - t * 3 + Math.sin(t * Math.PI) * 4);
		set(scene, x, y, x % 2 ? C.timberLight : C.timber);
		set(scene, x, y - 3, C.creamShade);
		if (x % 4 === 0) {
			set(scene, x, y - 1, C.creamShade);
			set(scene, x, y - 2, C.creamShade);
		}
	}
}

/**
 * The round-topped front door at the foot of the trunk, with a step.
 * @param {Canvas} scene
 */
function drawDoor(scene) {
	paint(
		scene,
		TRUNK - 3,
		GROUND - 4,
		[
			'..ddd..',
			'.dDDDd.',
			'dDDdDDd',
			'dDDdDDd',
			'dDDdDbd',
			'dDDdDDd',
			'dDDdDDd',
			'dDDdDDd',
			'sssssss',
		],
		{ d: C.timberShade, D: C.brickRed, b: C.gold, s: C.stoneLight }
	);
}

/**
 * Lit windows set into the trunk and peeping out of the leaves, drawn after the outline with dark frames.
 * @param {Canvas} scene
 */
function drawWindows(scene) {
	for (const [x, y] of [
		[TRUNK - 4, 39],
		[TRUNK + 2, 44],
		[TRUNK - 1, 33],
		[40, 21],
		[25, 22],
		[52, 15],
		[33, 10],
	]) {
		rect(scene, x - 1, y - 1, 4, 4, C.wood);
		rect(scene, x, y, 2, 2, C.gold);
		set(scene, x, y, C.lampGlow);
	}
}

/**
 * Lanterns hanging from the boughs on short cords.
 * @param {Canvas} scene
 */
function drawLanterns(scene) {
	for (const [x, y] of [
		[20, 36],
		[45, 34],
		[27, 31],
	]) {
		set(scene, x, y - 2, C.wood);
		set(scene, x, y - 1, C.wood);
		rect(scene, x - 1, y, 3, 3, C.lampFrame);
		set(scene, x, y + 1, C.lampGlow);
		set(scene, x, y, C.gold);
	}
}
