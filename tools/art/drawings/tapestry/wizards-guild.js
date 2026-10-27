// Wizards' Guild: a cosy, crooked guildhall of leaning towers with pointed hats, coloured sparks rising from its chimneys at night.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
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

/** The ground's top row under the hall. */
const GROUND = 56;

/**
 * A wall's lit, mid and shaded colours, and the timber of its beams.
 * @typedef {{ light: Colour, mid: Colour, shade: Colour, beam?: Colour }} Wall
 */

/**
 * A roof's lit, mid and shaded colours.
 * @typedef {{ light: Colour, mid: Colour, shade: Colour }} Roof
 */

/**
 * A leaning tower with a pointed hat of a roof.
 * @typedef {Object} Tower
 * @property {number} x - The wall's leftmost column at its foot
 * @property {number} w - The wall's width
 * @property {number} base - The wall's bottom row
 * @property {number} top - The wall's top row, where the roof begins
 * @property {number} peak - The roof's tip row
 * @property {number} lean - How far the wall's top sits from its foot, in columns
 * @property {number} bend - How far the roof's tip curls over, in columns
 * @property {Wall} wall
 * @property {Roof} roof
 * @property {number[]} windows - The rows of the lit windows' tops
 */

/** Moonlit plaster with dark beams, and moonlit stone, both a little dimmed by the night. */
const PLASTER = {
	light: mix(C.cream, C.nightSky4, 0.2),
	mid: mix(C.creamShade, C.nightSky4, 0.25),
	shade: mix(C.plasterShade, C.nightSky3, 0.4),
	beam: C.timberShade,
};
const STONE = {
	light: mix(C.stoneLight, C.nightSky4, 0.2),
	mid: mix(C.stone, C.nightSky4, 0.25),
	shade: mix(C.stoneShade, C.nightSky3, 0.3),
};

/** Roofs in violet, teal and red. */
const VIOLET = { light: C.roofLight, mid: C.roof, shade: C.roofShade };
const TEAL = {
	light: mix(C.teal, C.nightSky4, 0.35),
	mid: mix(C.tealShade, C.nightSky3, 0.2),
	shade: mix(C.tealShade, C.ink, 0.45),
};
const RED = {
	light: mix(C.brickRedLight, C.nightSky4, 0.3),
	mid: C.brickRedShade,
	shade: mix(C.brickRedShade, C.ink, 0.45),
};
const BLUE = { light: C.nightWave, mid: C.nightSea1, shade: C.nightSea3 };

/** The towers at the back, tallest in the middle. */
const BACK = [
	{
		x: 9,
		w: 10,
		base: 46,
		top: 26,
		peak: 11,
		lean: -3,
		bend: -4,
		wall: PLASTER,
		roof: TEAL,
		windows: [30, 38],
	},
	{
		x: 26,
		w: 12,
		base: 46,
		top: 21,
		peak: 2,
		lean: 2,
		bend: 5,
		wall: STONE,
		roof: VIOLET,
		windows: [25, 33],
	},
	{
		x: 44,
		w: 10,
		base: 46,
		top: 28,
		peak: 15,
		lean: 4,
		bend: 4,
		wall: PLASTER,
		roof: RED,
		windows: [32],
	},
];

/** The small towers at the front corners of the hall. */
const FRONT = [
	{
		x: 2,
		w: 8,
		base: GROUND,
		top: 40,
		peak: 29,
		lean: -1,
		bend: -3,
		wall: STONE,
		roof: BLUE,
		windows: [44],
	},
	{
		x: 54,
		w: 8,
		base: GROUND,
		top: 39,
		peak: 28,
		lean: 2,
		bend: 3,
		wall: PLASTER,
		roof: VIOLET,
		windows: [43],
	},
];

/** The chimneys' tops, where the sparks start. */
const CHIMNEYS = [
	{ x: 20, y: 34 },
	{ x: 42, y: 33 },
];

/**
 * Draws the Wizards' Guild scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9203);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND + 7,
		random,
		stars: 22,
		starRows: 36,
		moon: { x: 52, y: 6 },
	});
	drawHill(layer, random);

	// The tall towers stand behind the hall, so they get their own outline.
	const back = createCanvas(64, 64);
	for (const tower of BACK) {
		drawTower(back, tower);
	}
	outline(back, C.ink);

	drawHall(scene);
	for (const tower of FRONT) {
		drawTower(scene, tower);
	}
	drawChimneys(scene);
	outline(scene, C.ink);
	underlay(scene, back);
	underlay(scene, layer);

	for (const tower of [...BACK, ...FRONT]) {
		for (const top of tower.windows) {
			const x =
				tower.x + leanAt(tower, top + 1) + Math.floor(tower.w / 2);
			glow(scene, {
				x,
				y: top + 2,
				radius: 5,
				colour: C.gold,
				strength: 0.3,
				steps: 2,
				skip: [C.ink, C.gold, C.lampGlow, C.amber],
			});
		}
	}
	glow(scene, {
		x: 32,
		y: 54,
		radius: 9,
		colour: C.gold,
		strength: 0.35,
		skip: [C.ink, C.gold, C.lampGlow, C.amber],
	});
	drawSparks(scene);
	return scene;
}

/**
 * A grassy knoll under the guild, its crown lit by the moon, with a stone path to the door.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHill(layer, random) {
	const grass = mix(C.forestFloor, C.nightSky4, 0.45);
	const lit = mix(C.forestFloorLight, C.nightSky5, 0.35);
	const deep = mix(C.forestFloorShade, C.nightSky1, 0.5);
	for (let x = 0; x < 64; x++) {
		const top = GROUND - 3 + Math.round(((x - 32) / 32) ** 2 * 5);
		for (let y = top; y < 64; y++) {
			const t = (y - top) / (64 - top);
			let colour = t > 0.6 ? deep : grass;
			if (t > 0.5 && t <= 0.6 && (x + y) % 2 === 0) {
				colour = deep;
			}
			set(layer, x, y, y === top ? lit : colour);
		}
		if (random() > 0.7) {
			set(layer, x, top - 1, lit);
		}
	}
	// Stepping stones down from the door.
	for (const [x, y, w] of [
		[30, 57, 4],
		[29, 59, 4],
		[31, 61, 5],
		[29, 63, 5],
	]) {
		rect(layer, x, y, w, 1, mix(C.stone, C.nightSky4, 0.3));
	}
}

/**
 * How far a tower's wall has leaned at a given row.
 * @param {Tower} tower
 * @param {number} y
 * @returns {number} The column offset.
 */
function leanAt(tower, y) {
	const t = (tower.base - y) / (tower.base - tower.top);
	return Math.round(tower.lean * Math.max(0, Math.min(1, t)) ** 1.6);
}

/**
 * A leaning tower: a wall lit on the left by the moon, lit windows, and a pointed hat of a roof whose tip curls over.
 * @param {Canvas} canvas
 * @param {Tower} tower
 */
function drawTower(canvas, tower) {
	const { x, w, base, top, peak, bend, wall, roof } = tower;
	for (let y = top; y <= base; y++) {
		const left = x + leanAt(tower, y);
		for (let i = 0; i < w; i++) {
			let colour = wall.mid;
			if (i === 0) {
				colour = wall.light;
			} else if (i >= w - 2) {
				colour = wall.shade;
			} else if (wall.beam && (base - y) % 7 === 0) {
				colour = wall.beam;
			} else if (wall.beam && i === 1 + ((base - y) % 7) && i < w - 2) {
				colour = wall.beam;
			} else if (!wall.beam && (y + (i % 4 < 2 ? 0 : 2)) % 4 === 0) {
				colour = wall.shade;
			}
			set(canvas, left + i, y, colour);
		}
	}
	// Arched windows, lit warm from inside.
	for (const row of tower.windows) {
		const left = x + leanAt(tower, row + 1) + Math.floor(w / 2) - 1;
		paint(canvas, left, row, ['.G.', 'GLG', 'GLG', 'AAA'], {
			G: C.gold,
			L: C.lampGlow,
			A: C.amber,
		});
	}
	// The hat: a cone wider than the wall, its tip curling over.
	const cx = x + leanAt(tower, top) + (w - 1) / 2;
	const span = top - peak;
	for (let y = peak; y <= top; y++) {
		const t = (top - y) / span;
		const half = (w / 2 + 2) * (1 - t) ** 1.1;
		const centre = cx + bend * t ** 3;
		const from = Math.round(centre - half);
		const to = Math.round(centre + half);
		for (let col = from; col <= to; col++) {
			let colour = roof.mid;
			if (y >= top - 1) {
				colour = roof.light;
			} else if (col === from || col === from + 1) {
				colour = roof.light;
			} else if (col >= to - 1) {
				colour = roof.shade;
			}
			set(canvas, col, y, colour);
		}
	}
	// A gold band round the hat.
	for (let col = 0; col < w + 2; col++) {
		const y = top - 3;
		const t = 3 / span;
		const half = (w / 2 + 2) * (1 - t) ** 1.1;
		const from = Math.round(cx - half);
		const to = Math.round(cx + half);
		if (from + col <= to) {
			set(canvas, from + col, y, from + col >= to - 1 ? C.amber : C.gold);
		}
	}
	// The tip flops over, with a gold bead on its end.
	const tipX = Math.round(cx + bend);
	const side = Math.sign(bend);
	set(canvas, tipX + side, peak, roof.mid);
	set(canvas, tipX + side * 2, peak + 1, roof.mid);
	set(canvas, tipX + side * 2, peak + 2, C.gold);
}

/**
 * The long stone hall the towers grow from: a shingled roof, a row of lit windows and a round wooden door.
 * @param {Canvas} scene
 */
function drawHall(scene) {
	const left = 9;
	const right = 54;
	// The walls.
	for (let y = 46; y <= GROUND; y++) {
		for (let x = left; x <= right; x++) {
			let colour = STONE.mid;
			if (x === left) {
				colour = STONE.light;
			} else if (x >= right - 1) {
				colour = STONE.shade;
			} else if (
				(y + (Math.floor((x + (y % 2) * 2) / 4) % 2)) % 3 ===
				0
			) {
				colour = mix(C.stoneMid, C.nightSky4, 0.25);
			}
			set(scene, x, y, colour);
		}
	}
	// The roof, its shingles in steps, sagging a little in the middle.
	for (let y = 40; y <= 45; y++) {
		const inset = 45 - y;
		const sag = y === 40 ? 1 : 0;
		for (let x = left - 1 + inset; x <= right + 1 - inset; x++) {
			if (sag && x > 26 && x < 38) {
				continue;
			}
			let colour =
				y === 45
					? BLUE.light
					: (x + y * 3) % 5 === 0
						? BLUE.shade
						: BLUE.mid;
			if (x >= right - inset) {
				colour = BLUE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A row of small lit windows.
	for (const x of [13, 19, 41, 47]) {
		paint(scene, x, 48, ['GG', 'LG', 'AA'], {
			G: C.gold,
			L: C.lampGlow,
			A: C.amber,
		});
	}
	// The round door under a stone arch, open a crack to the warm light.
	paint(
		scene,
		28,
		45,
		[
			'..ssss..',
			'.sTTTTs.',
			'sTTtTTTs',
			'sTTtTTGs',
			'sTTtTTGs',
			'sTTtTTGs',
			'sTTbTTGs',
			'sTTtTTGs',
			'sTTtTTGs',
			'sTTtTTGs',
			'sTTtTTGs',
			'sTTtTTGs',
		],
		{
			s: STONE.light,
			T: C.timber,
			t: C.timberShade,
			b: C.brass,
			G: C.lampGlow,
		}
	);
}

/**
 * Two crooked chimneys on the hall's roof.
 * @param {Canvas} scene
 */
function drawChimneys(scene) {
	for (const { x, y } of CHIMNEYS) {
		for (let row = y; row <= 42; row++) {
			const lean = row < y + 3 ? 1 : 0;
			set(scene, x - 1 + lean, row, C.brickRedLight);
			set(scene, x + lean, row, C.brickRed);
			set(scene, x + 1 + lean, row, C.brickRedShade);
		}
		rect(scene, x - 1, y - 1, 4, 1, C.stoneLight);
	}
}

/**
 * Coloured sparks rising from each chimney in a swaying, widening stream: single motes low down, four-point stars higher up.
 * @param {Canvas} scene
 */
function drawSparks(scene) {
	const colours = [C.arcaneLight, C.tealLight, C.gold, C.ghostLight];
	CHIMNEYS.forEach(({ x, y }, n) => {
		const drift = n === 0 ? -0.45 : 0.4;
		// A puff of tinted smoke just above the pot.
		for (const [dx, dy, r] of [
			[0, -3, 1.5],
			[Math.sign(drift), -6, 2],
		]) {
			for (let py = -2; py <= 2; py++) {
				for (let px = -2; px <= 2; px++) {
					const behind = get(scene, x + dx + px, y + dy + py);
					if (behind && Math.hypot(px, py) <= r) {
						set(
							scene,
							x + dx + px,
							y + dy + py,
							mix(behind, n === 0 ? C.arcane : C.teal, 0.4)
						);
					}
				}
			}
		}
		for (let i = 0; i < 12; i++) {
			const sy = y - 3 - Math.round(i * 2.5);
			const sx =
				x +
				Math.round(
					Math.sin(i * 1.3 + n * 2) * (1 + i * 0.45) + drift * i
				);
			const colour = colours[(i + n * 2) % colours.length];
			const behind = get(scene, sx, sy);
			if (behind === C.moon || behind === C.moonRim) {
				continue;
			}
			if (i >= 2 && i % 2 === 0) {
				set(scene, sx, sy, C.white);
				for (const [dx, dy] of [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
				]) {
					set(scene, sx + dx, sy + dy, colour);
				}
			} else {
				set(scene, sx, sy, colour);
				set(scene, sx, sy + 1, mix(colour, C.nightSky3, 0.5));
			}
		}
	});
}
