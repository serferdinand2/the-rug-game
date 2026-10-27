// War College: a war-game table, a terrain model of terraced hills, a river and a bridge, with ranks of toy soldiers, little blank flags and a pointer.
import {
	createCanvas,
	set,
	get,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The table's model inside its rim: the back edge's row and ends, and the front edge's row and ends, wider in perspective. */
const MODEL = {
	top: 13,
	topLeft: 9,
	topRight: 55,
	bottom: 57,
	bottomLeft: -1,
	bottomRight: 65,
};

/** The two terraced hills: centre, outer half-width and number of terraces. */
const HILLS = [
	{ x: 15, y: 30, rx: 14, terraces: 3 },
	{ x: 48, y: 40, rx: 14, terraces: 3 },
];

/** The road's row across the model, where it crosses the river on a bridge. */
const ROAD = 45;

/** The ground's tones, the terraces from low to high, and the steps between them. */
const LEVELS = [
	C.grass,
	mix(C.grass, C.grassLight, 0.5),
	C.grassLight,
	mix(C.grassLight, C.sandLight, 0.4),
];
const RISER = mix(C.grassShade, C.forestFloorShade, 0.45);

/** The river: its water, its lit ripples and its banks. */
const WATER = C.daySea2;
const WATER_LIGHT = C.dayWaveDeep;
const BANK = C.sandShade;

/** The toy armies' coats: red for one side, blue for the other. */
const RED = { coat: C.brickRed, lit: C.brickRedLight };
const BLUE = { coat: C.daySea3, lit: C.daySea1 };

/** The study wall behind the table. */
const WALL = C.plaster;
const WALL_LOW = C.plasterShade;

/**
 * Draws the War College tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4412);

	drawWall(layer);

	drawTable(scene);
	drawGround(scene);
	drawRiver(scene, random);
	for (const hill of HILLS) {
		drawHill(scene, hill);
	}
	drawRoad(scene);
	const pieces = createCanvas(64, 64);
	drawTrees(pieces);
	drawArmies(pieces);
	drawFlags(pieces);
	outline(pieces, C.ink);
	stamp(scene, pieces);
	const pointer = createCanvas(64, 64);
	drawPointer(pointer);
	outline(pointer, C.ink);
	stamp(scene, pointer);
	outline(scene, C.ink);
	glow(scene, {
		x: 2,
		y: 4,
		radius: 50,
		colour: C.lampGlow,
		strength: 0.14,
		steps: 1,
		skip: [C.ink, C.lampGlow, C.white],
	});
	underlay(scene, layer);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * The wall behind: warm plaster above a darker band at the table's height.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	rect(layer, 0, 0, 64, 64, WALL);
	rect(layer, 0, 7, 64, 64 - 7, WALL_LOW);
	rect(layer, 0, 7, 64, 1, C.plasterLight);
}

/**
 * The model's left and right edges at a row, which spread apart towards the front.
 * @param {number} y
 * @returns {[number, number]}
 */
function edges(y) {
	const t = (y - MODEL.top) / (MODEL.bottom - MODEL.top);
	return [
		MODEL.topLeft + (MODEL.bottomLeft - MODEL.topLeft) * t,
		MODEL.topRight + (MODEL.bottomRight - MODEL.topRight) * t,
	];
}

/**
 * The table: a wooden rim round the model, lit along its back and left, and its front apron.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = MODEL.top - 3; y < 64; y++) {
		const [left, right] = edges(Math.min(y, MODEL.bottom));
		const from = Math.max(0, Math.floor(left) - 3);
		const to = Math.min(63, Math.ceil(right) + 3);
		for (let x = from; x <= to; x++) {
			let colour = C.timber;
			if (y < MODEL.top - 1) {
				colour = C.timberLight;
			} else if (y > MODEL.bottom + 2) {
				colour = y === MODEL.bottom + 3 ? C.timberLight : C.timberShade;
			} else if (x < left) {
				colour = C.timberLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The model's flat ground inside the rim, with a shadow cast by the back rim.
 * @param {Canvas} scene
 */
function drawGround(scene) {
	for (let y = MODEL.top; y <= MODEL.bottom; y++) {
		const [left, right] = edges(y);
		for (
			let x = Math.max(0, Math.ceil(left));
			x <= Math.min(63, Math.floor(right));
			x++
		) {
			set(scene, x, y, y === MODEL.top ? RISER : LEVELS[0]);
		}
	}
}

/**
 * The river: winding down from the back of the model to the front, widening as it nears, with a few lit ripples.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawRiver(scene, random) {
	for (let y = MODEL.top + 1; y <= MODEL.bottom; y++) {
		const t = (y - MODEL.top) / (MODEL.bottom - MODEL.top);
		const centre = 31 + 5 * Math.sin(y * 0.16 + 0.5) - 6 * t;
		const half = 1.4 + 1.8 * t;
		for (
			let x = Math.floor(centre - half - 1);
			x <= centre + half + 1;
			x++
		) {
			const d = Math.abs(x - centre);
			if (d < half) {
				set(scene, x, y, WATER);
			} else if (d < half + 1) {
				set(scene, x, y, BANK);
			}
		}
		if (random() < 0.45) {
			set(scene, Math.round(centre - half * 0.3), y, WATER_LIGHT);
		}
	}
}

/**
 * One terraced hill: stacked flat layers, each smaller and higher, with a shaded step along its front.
 * @param {Canvas} scene
 * @param {{ x: number, y: number, rx: number, terraces: number }} hill
 */
function drawHill(scene, hill) {
	for (let level = 1; level <= hill.terraces; level++) {
		const rx = hill.rx * (1 - (level - 1) / (hill.terraces + 0.6));
		const ry = rx * 0.55;
		const cy = hill.y - (level - 1) * 3;
		for (let y = Math.floor(cy - ry) - 1; y <= cy + ry + 3; y++) {
			for (
				let x = Math.floor(hill.x - rx) - 1;
				x <= hill.x + rx + 1;
				x++
			) {
				const inTop = Math.hypot((x - hill.x) / rx, (y - cy) / ry) < 1;
				const inStep =
					Math.hypot((x - hill.x) / rx, (y - cy - 2) / ry) < 1 ||
					Math.hypot((x - hill.x) / rx, (y - cy - 1) / ry) < 1;
				if (inTop) {
					// The top's left rim catches the window light.
					const lit =
						Math.hypot((x + 1 - hill.x) / rx, (y + 1 - cy) / ry) >=
						1;
					set(
						scene,
						x,
						y,
						lit && x < hill.x
							? LEVELS[Math.min(3, level + 1)]
							: LEVELS[level]
					);
				} else if (inStep && get(scene, x, y) !== null) {
					set(scene, x, y, RISER);
				}
			}
		}
	}
}

/**
 * The sandy road across the model, and the wooden bridge where it crosses the river.
 * @param {Canvas} scene
 */
function drawRoad(scene) {
	for (let x = 0; x < 64; x++) {
		const y = Math.round(ROAD + 2 * Math.sin(x * 0.09 + 2));
		const [left, right] = edges(y);
		if (x < left || x > right) {
			continue;
		}
		const under = get(scene, x, y);
		if (under === WATER || under === WATER_LIGHT || under === BANK) {
			continue;
		}
		set(scene, x, y, C.sand);
		set(scene, x, y + 1, C.sandShade);
	}
	// The bridge over the river.
	const y = Math.round(ROAD + 2 * Math.sin(30 * 0.09 + 2));
	for (let x = 0; x < 64; x++) {
		const under = get(scene, x, y);
		if (under === WATER || under === WATER_LIGHT || under === BANK) {
			set(scene, x, y - 1, C.timberLight);
			set(scene, x, y, C.timber);
			set(scene, x, y + 1, C.timberShade);
		}
	}
}

/**
 * A few small round trees standing on the model.
 * @param {Canvas} pieces
 */
function drawTrees(pieces) {
	for (const [x, y] of [
		[39, 22],
		[43, 24],
		[8, 47],
		[56, 54],
	]) {
		paint(pieces, x - 1, y - 3, [' lp ', 'lppd', 'pppd', ' tt '], {
			l: C.pineLight,
			p: C.pine,
			d: C.pineShade,
			t: C.timberShade,
		});
	}
}

/**
 * One toy soldier: a dark shako, a face, a coat lit on the left, white trousers, and a little green stand.
 * @param {Canvas} pieces
 * @param {number} x - The left column
 * @param {number} y - The stand's row
 * @param {{ coat: Colour, lit: Colour }} side
 */
function drawSoldier(pieces, x, y, side) {
	paint(pieces, x, y - 5, [' k ', ' s ', 'lcc', ' c ', ' w ', 'ggg'], {
		k: C.wood,
		s: C.skin,
		l: side.lit,
		c: side.coat,
		w: C.cream,
		g: C.forestFloorShade,
	});
}

/**
 * The two toy armies: red ranks on the left hill, blue ranks on the right one.
 * @param {Canvas} pieces
 */
function drawArmies(pieces) {
	for (const [x, y] of [
		[5, 29],
		[10, 30],
		[15, 30],
		[20, 29],
	]) {
		drawSoldier(pieces, x, y, RED);
	}
	for (const [x, y] of [
		[39, 39],
		[44, 40],
		[49, 40],
		[54, 39],
	]) {
		drawSoldier(pieces, x, y, BLUE);
	}
}

/**
 * The little blank flags on their pins: one for each side and one marking the bridge.
 * @param {Canvas} pieces
 */
function drawFlags(pieces) {
	for (const { x, y, cloth, lit } of [
		{ x: 14, y: 23, cloth: RED.coat, lit: RED.lit },
		{ x: 47, y: 33, cloth: BLUE.coat, lit: BLUE.lit },
		{ x: 26, y: 40, cloth: C.cream, lit: C.creamLight },
	]) {
		rect(pieces, x, y - 7, 1, 8, C.stone);
		rect(pieces, x + 1, y - 7, 4, 3, cloth);
		rect(pieces, x + 1, y - 7, 4, 1, lit);
		set(pieces, x, y - 8, C.gold);
	}
}

/**
 * The pointer: a long wooden rod with a brass tip, laid in from the front right to rest on the bridge.
 * @param {Canvas} pointer
 */
function drawPointer(pointer) {
	const tip = { x: 33, y: 46 };
	line(pointer, 63, 58, tip.x + 3, tip.y + 1, C.timberLight);
	line(pointer, 63, 59, tip.x + 3, tip.y + 2, C.timber);
	line(pointer, 63, 60, 52, 57, C.timberShade);
	rect(pointer, tip.x, tip.y, 3, 2, C.brass);
	set(pointer, tip.x, tip.y, C.gold);
}
