// Transmogrification: a grey stone in a shallow porcelain dish at night, its left half still stone and its right half turned to gold, violet sparks swirling round it.
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
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The stone: its centre and its two radii before the lumps. */
const STONE = { x: 32, y: 28, rx: 19, ry: 17 };

/** The dish: the centre of its rim, the rim's two radii, and the row of its foot. */
const DISH = { x: 32, y: 47, rx: 26, ry: 4.5, foot: 54 };

/** The two crossing orbits the sparks swirl round. */
const ORBITS = [
	{ x: 32, y: 31, rx: 28, ry: 8, tilt: -0.3, heads: [1.4, 4.3] },
	{ x: 32, y: 27, rx: 24, ry: 6, tilt: 0.38, heads: [2.6] },
];

/** The rows of the dado rail, the table's far edge and its front edge. */
const ROWS = { rail: 37, table: 44, front: 59 };

/** The night room: a dusky violet wall above the rail, a darker panel below it. */
const WALL = mix(C.roof, C.roofLight, 0.3);
const WAINSCOT = mix(C.roof, C.roofShade, 0.45);
const RAIL = mix(C.roofLight, C.railLight, 0.25);

/** The table: its top, its lit front edge and its front in shadow. */
const TABLE = mix(C.floor, C.roofShade, 0.3);
const TABLE_EDGE = C.floorLight;
const TABLE_FRONT = mix(C.floorShade, C.ink, 0.2);

/** The dish's inside, in the stone's shadow. */
const DISH_INSIDE = C.creamShade;
const DISH_SHADOW = mix(C.creamShade, C.stoneShade, 0.55);

/** The gold side's deepest shade, at its far edge. */
const GOLD_DEEP = mix(C.amber, C.lampFrame, 0.35);

/**
 * Draws the Transmogrification tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4127);

	drawRoom(layer);
	// The sparks' violet light spills over the wall and the table.
	glow(layer, {
		x: STONE.x,
		y: STONE.y,
		radius: 36,
		colour: C.arcane,
		strength: 0.32,
		steps: 3,
	});
	drawOrbit(layer, false);

	drawDishBack(scene);
	drawStone(scene, random);
	drawDishFront(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The sparks cast a faint violet light over the stone and the dish; the gold keeps its own shine.
	glow(scene, {
		x: STONE.x + 1,
		y: STONE.y + 4,
		radius: 20,
		colour: C.arcaneLight,
		strength: 0.2,
		steps: 2,
		skip: [
			C.ink,
			C.white,
			C.arcaneLight,
			C.arcane,
			C.arcaneShade,
			C.lampGlow,
			C.gold,
			C.amber,
			GOLD_DEEP,
		],
	});
	drawOrbit(scene, true);
	drawSparks(scene, random);
	return scene;
}

/**
 * The room: the two-tone wall with its rail, the table top and its front.
 * @param {Canvas} layer
 */
function drawRoom(layer) {
	rect(layer, 0, 0, 64, ROWS.rail, WALL);
	rect(layer, 0, ROWS.rail, 64, 1, RAIL);
	rect(layer, 0, ROWS.rail + 1, 64, ROWS.table - ROWS.rail - 1, WAINSCOT);
	rect(layer, 0, ROWS.table, 64, ROWS.front - ROWS.table, TABLE);
	rect(layer, 0, ROWS.front, 64, 1, TABLE_EDGE);
	rect(layer, 0, ROWS.front + 1, 64, 64 - ROWS.front - 1, TABLE_FRONT);
}

/** The stone's outline: its radius at nine evenly spaced angles, so it comes out chipped and angular. */
const CHIPS = [1.02, 0.9, 1.04, 0.94, 1.0, 0.88, 1.03, 0.95, 0.98];

/** The stone's facets: the middle of each flat face, in fractions of its radii. */
const FACETS = [
	[-0.55, -0.55],
	[0.05, -0.72],
	[0.6, -0.48],
	[-0.8, 0.05],
	[-0.28, -0.12],
	[0.3, -0.1],
	[0.8, 0.12],
	[-0.5, 0.55],
	[0.08, 0.5],
	[0.62, 0.58],
];

/**
 * How far a pixel lies inside the chipped stone, as a fraction of its radius at that angle; below 1 is inside.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function stoneReach(x, y) {
	const dx = (x - STONE.x) / STONE.rx;
	const dy = (y - STONE.y) / STONE.ry;
	const turn = ((Math.atan2(dy, dx) / (Math.PI * 2) + 1) % 1) * CHIPS.length;
	const i = Math.floor(turn);
	const t = turn - i;
	const radius = CHIPS[i] * (1 - t) + CHIPS[(i + 1) % CHIPS.length] * t;
	return Math.hypot(dx, dy) / radius;
}

/**
 * The column where stone gives way to gold in a given row: a ragged line just right of the middle.
 * @param {number} y
 * @returns {number}
 */
function seamColumn(y) {
	return (
		STONE.x +
		1 +
		Math.round(1.4 * Math.sin(y * 0.9) + 0.9 * Math.sin(y * 2.3))
	);
}

/**
 * How brightly a facet catches the light from the upper left, from -1 to 1.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function facetLight(x, y) {
	const u = (x - STONE.x) / STONE.rx;
	const v = (y - STONE.y) / STONE.ry;
	let best = FACETS[0];
	for (const facet of FACETS) {
		if (
			Math.hypot(u - facet[0], v - facet[1]) <
			Math.hypot(u - best[0], v - best[1])
		) {
			best = facet;
		}
	}
	const [nx, ny] = best;
	const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
	return -0.55 * nx - 0.6 * ny + 0.58 * nz;
}

/**
 * The stone: chipped into flat facets lit from the upper left, plain grey on the left of the seam and gold on the right,
 * the seam itself flickering violet, with specks of gold creeping into the stone.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawStone(scene, random) {
	for (let y = 0; y < DISH.y + 1; y++) {
		for (let x = 0; x < 64; x++) {
			if (stoneReach(x, y) >= 1) {
				continue;
			}
			const light = facetLight(x, y);
			const seam = seamColumn(y);
			let colour;
			if (x < seam) {
				colour =
					light > 0.75
						? C.stoneLight
						: light > 0.3
							? C.stone
							: C.stoneShade;
			} else if (x === seam) {
				colour = C.arcaneLight;
			} else {
				colour =
					light > 0.7
						? C.lampGlow
						: light > 0.3
							? C.gold
							: light > -0.1
								? C.amber
								: GOLD_DEEP;
			}
			set(scene, x, y, colour);
		}
	}
	// Specks of gold already showing in the stone near the seam.
	for (let i = 0; i < 10; i++) {
		const y = 16 + Math.floor(random() * 28);
		const x = seamColumn(y) - 2 - Math.floor(random() * 5);
		if (stoneReach(x, y) < 0.9) {
			set(scene, x, y, C.gold);
		}
	}
	// Gleams on the gold.
	for (const [x, y] of [
		[39, 17],
		[40, 17],
		[46, 25],
	]) {
		set(scene, x, y, C.white);
	}
}

/**
 * Whether a pixel lies inside an ellipse centred on the dish's rim.
 * @param {number} x
 * @param {number} y
 * @param {number} rx
 * @param {number} ry
 * @returns {boolean}
 */
function inRim(x, y, rx, ry) {
	return ((x - DISH.x) / rx) ** 2 + ((y - DISH.y) / ry) ** 2 < 1;
}

/**
 * The back of the dish: its inside, shaded where the stone stands, and the far half of its rim.
 * @param {Canvas} scene
 */
function drawDishBack(scene) {
	for (let y = DISH.y - 6; y <= DISH.y + 2; y++) {
		for (let x = 0; x < 64; x++) {
			if (inRim(x, y, DISH.rx - 1.5, DISH.ry - 1)) {
				set(scene, x, y, DISH_INSIDE);
			} else if (inRim(x, y, DISH.rx, DISH.ry) && y < DISH.y) {
				set(scene, x, y, x < DISH.x + 8 ? C.creamLight : C.cream);
			}
		}
	}
	// The stone's short shadow on the floor of the dish, falling to the right.
	for (let y = DISH.y - 1; y <= DISH.y + 1; y++) {
		for (let x = STONE.x; x < STONE.x + 22 - (y - DISH.y) * 4; x++) {
			if (inRim(x, y, DISH.rx - 1.5, DISH.ry - 1)) {
				set(scene, x, y, DISH_SHADOW);
			}
		}
	}
}

/**
 * The front of the dish: the near half of its rim, its shallow curved body lit from the left, and its foot.
 * @param {Canvas} scene
 */
function drawDishFront(scene) {
	for (let y = DISH.y; y <= DISH.foot; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x - DISH.x;
			if (inRim(x, y, DISH.rx, DISH.ry)) {
				if (!inRim(x, y, DISH.rx - 1.5, DISH.ry - 1)) {
					set(scene, x, y, dx < 10 ? C.creamLight : C.cream);
				}
				continue;
			}
			const t = (y - DISH.y) / (DISH.foot - DISH.y - 1);
			const half =
				y < DISH.foot - 1
					? DISH.rx * Math.sqrt(Math.max(0, 1 - t * t * 0.75))
					: 10;
			if (Math.abs(dx) >= half) {
				continue;
			}
			let colour = C.cream;
			if (dx > half * 0.35 || y >= DISH.foot - 1) {
				colour = C.creamShade;
			} else if (dx < -half * 0.55 && y < DISH.foot - 2) {
				colour = C.creamLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * An orbit the sparks swirl round: its centre, radii, tilt, and where its comets' heads start.
 * @typedef {Object} Orbit
 * @property {number} x
 * @property {number} y
 * @property {number} rx
 * @property {number} ry
 * @property {number} tilt
 * @property {number[]} heads
 */

/**
 * Where a point of an orbit falls: its column and row, and whether it swings in front of the stone.
 * @param {Orbit} orbit
 * @param {number} t - The angle round the orbit
 * @returns {{ x: number, y: number, front: boolean }}
 */
function orbitPoint(orbit, t) {
	const ex = Math.cos(t) * orbit.rx;
	const ey = Math.sin(t) * orbit.ry;
	return {
		x: Math.round(
			orbit.x + ex * Math.cos(orbit.tilt) - ey * Math.sin(orbit.tilt)
		),
		y: Math.round(
			orbit.y + ex * Math.sin(orbit.tilt) + ey * Math.cos(orbit.tilt)
		),
		front: Math.sin(t) > 0,
	};
}

/**
 * The swirl: comet trails of violet sparks chasing round the stone on two crossing orbits, bright at the head and
 * breaking up behind. The back of each orbit goes on the background, the front over the stone.
 * @param {Canvas} canvas
 * @param {boolean} front - Whether to paint the front halves rather than the backs
 */
function drawOrbit(canvas, front) {
	for (const orbit of ORBITS) {
		for (const head of orbit.heads) {
			for (let s = 2.2; s >= 0; s -= 0.012) {
				const point = orbitPoint(orbit, head - s);
				if (point.front !== front) {
					continue;
				}
				// The fading tail breaks up into separate sparks.
				if (s > 1.3 && Math.round(s * 40) % 3 !== 0) {
					continue;
				}
				let colour = C.arcane;
				if (s < 0.1) {
					colour = C.white;
				} else if (s < 0.8) {
					colour = C.arcaneLight;
				}
				if (get(canvas, point.x, point.y) === C.white) {
					continue;
				}
				set(canvas, point.x, point.y, colour);
				// The head and the bright run behind it are two pixels thick.
				if (s < 0.5) {
					set(canvas, point.x, point.y - 1, C.arcaneLight);
				}
			}
		}
	}
}

/**
 * Loose sparks: four-point stars and specks drifting up off the seam.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (const [x, y] of [
		[34, 8],
		[11, 18],
		[52, 40],
	]) {
		set(scene, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(scene, x + dx, y + dy, C.arcaneLight);
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = 26 + Math.floor(random() * 14);
		const y = 4 + Math.floor(random() * 10);
		set(scene, x, y, random() < 0.5 ? C.arcaneLight : C.arcane);
	}
}
