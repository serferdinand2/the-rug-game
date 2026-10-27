// Lithium-Ion Battery: a big cylindrical cell on a workbench at night, cut away to its rolled layers, a teal spark arcing from a charging lead to its terminal.
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
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The cell: its axis column, radius, the top and bottom rows of its axis, and how tall its round ends look. */
const CELL = { x: 35, r: 16, top: 15, bottom: 51, ry: 7 };

/** The window cut out of the casing's front-right quarter, between these two heights on the axis. */
const CUT = { top: 20, bottom: 37 };

/** The positive terminal: a short button on the cap, its radius, how tall its top looks and how high it stands. */
const TERMINAL = { rx: 6, ry: 2, height: 3 };

/** The charging lead's plug, pointing right at the terminal, and the tip the spark leaves from. */
const PLUG = { x: 8, y: 4, tip: { x: 20, y: 3 } };

/** Where the spark lands on the terminal, and its middle, where the teal light comes from. */
const STRIKE = { x: 30, y: 9 };
const SPARK = { x: 25, y: 7 };

/** The back edge of the workbench; the bench top fills the rows below it. */
const BENCH = 45;

/** The window in the back wall, onto the night sky. */
const WINDOW = { x: 49, y: 2, w: 15, h: 34 };

/** The back wall, a dark pegboard, and the bench top, each in two tones. */
const WALL = mix(C.nightSky3, C.roofShade, 0.4);
const WALL_HOLE = mix(C.nightSky1, C.ink, 0.3);
const BENCH_TOP = mix(C.roofShade, C.wood, 0.5);
const BENCH_GRAIN = mix(C.roofShade, C.ink, 0.35);
const BENCH_LIP = mix(C.roof, C.stoneShade, 0.4);
const SHADOW = mix(BENCH_TOP, C.ink, 0.55);

/** The sleeve: a teal wrap, from its gleam to its deepest shade. */
const SLEEVE_DEEP = mix(C.tealShade, C.ink, 0.45);
const SLEEVE_MID = mix(C.teal, C.tealShade, 0.35);

/** Nickel-plated steel for the can, the cap and the terminal, from the brightest gleam down. */
const STEEL = [
	mix(C.white, C.tealLight, 0.25),
	C.stoneLight,
	C.stone,
	C.stoneShade,
	mix(C.stoneShade, C.ink, 0.45),
];

/** The rolled layers, lit and in shade: copper foil and its graphite coat, then aluminium foil and its grey cathode coat. */
const LAYERS = [
	[C.gold, C.amber],
	[C.amber, mix(C.amber, C.brickRedShade, 0.4)],
	[mix(C.stoneShade, C.ink, 0.3), mix(C.stoneShade, C.ink, 0.55)],
	[C.white, C.stoneLight],
	[C.stoneLight, C.stone],
];

/** The hollow pin at the heart of the roll. */
const CORE = mix(C.ink, C.night, 0.5);

/** The charging lead: red rubber, lit and shaded. */
const LEAD = C.brickRedLight;
const LEAD_SHADE = C.brickRedShade;

/**
 * Draws the Lithium-Ion Battery tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1991);

	drawWall(layer);
	drawWindow(layer, random);
	drawBench(layer, random);

	drawLeadRise(scene);
	drawCell(scene);
	drawCutaway(scene);
	drawTerminal(scene);
	drawBolt(scene);
	drawCoil(scene);
	drawPlug(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: SPARK.x,
		y: SPARK.y,
		radius: 64,
		colour: C.tealLight,
		strength: 0.32,
		steps: 5,
		skip: [C.ink],
	});
	glow(scene, {
		x: SPARK.x,
		y: SPARK.y,
		radius: 16,
		colour: C.tealLight,
		strength: 0.4,
		steps: 3,
		skip: [C.ink],
	});
	drawSpark(scene);
	drawGleams(scene);
	return scene;
}

/**
 * How far round the cell a column lies, from -1 at its left edge to 1 at its right.
 * @param {number} x
 * @returns {number}
 */
function across(x) {
	return (x - CELL.x) / CELL.r;
}

/**
 * How far below an axis row the cell's front surface shows in a column: its round ends seen from a little above.
 * @param {number} x
 * @returns {number}
 */
function frontDrop(x) {
	const u = across(x);
	return CELL.ry * Math.sqrt(Math.max(0, 1 - u * u));
}

/**
 * The back wall: a dark pegboard, its holes in a grid.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	rect(layer, 0, 0, 64, BENCH, WALL);
	for (let y = 2; y < BENCH - 1; y += 4) {
		for (let x = 1; x < 64; x += 4) {
			set(layer, x, y, WALL_HOLE);
		}
	}
}

/**
 * The window on the right: a dark frame round a night sky with a few stars and the moon's edge.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const { x: wx, y: wy, w, h } = WINDOW;
	const ramp = [C.nightSky1, C.nightSky2, C.nightSky3, C.nightSky4];
	for (let y = wy; y < wy + h; y++) {
		const tone = ramp[Math.min(ramp.length - 1, Math.floor((y - wy) / 9))];
		rect(layer, wx, y, w, 1, tone);
	}
	for (let i = 0; i < 9; i++) {
		const x = wx + 2 + Math.floor(random() * (w - 3));
		const y = wy + 2 + Math.floor(random() * (h - 6));
		set(layer, x, y, i % 3 === 0 ? C.white : C.starDim);
	}
	// The moon, low in the corner.
	for (let y = wy + 2; y < wy + 9; y++) {
		for (let x = wx + 8; x < wx + w; x++) {
			const d = Math.hypot(x - (wx + 11), y - (wy + 5));
			if (d < 3.2) {
				set(layer, x, y, d < 2.2 ? C.moon : C.moonRim);
			}
		}
	}
	const frame = mix(C.roofShade, C.ink, 0.3);
	rect(layer, wx - 1, wy - 1, 1, h + 2, frame);
	rect(layer, wx - 1, wy - 1, w + 1, 1, frame);
	rect(layer, wx - 1, wy + h, w + 1, 1, frame);
	rect(layer, wx + 7, wy, 1, h, frame);
	rect(layer, wx, wy + 16, w, 1, frame);
	rect(layer, wx - 1, wy + h + 1, w + 1, 1, C.roof);
}

/**
 * The workbench top, its lip along the back, its grain and the cell's shadow cast down and to the right.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBench(layer, random) {
	rect(layer, 0, BENCH, 64, 64 - BENCH, BENCH_TOP);
	rect(layer, 0, BENCH, 64, 1, BENCH_LIP);
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 60);
		const y = BENCH + 2 + Math.floor(random() * (62 - BENCH));
		const length = 2 + Math.floor(random() * 5);
		rect(layer, x, y, length, 1, BENCH_GRAIN);
	}
	for (let y = BENCH + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const e =
				((x - (CELL.x + 6)) / (CELL.r + 3)) ** 2 +
				((y - (CELL.bottom + 3)) / (CELL.ry + 3)) ** 2;
			if (e < 1) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * Picks a tone along a ramp for a column of a round surface lit from the upper left.
 * @param {readonly Colour[]} ramp - Five tones, from the gleam to the deepest shade
 * @param {number} u - How far round the column lies, from -1 to 1
 * @returns {Colour}
 */
function roundTone(ramp, u) {
	if (u < -0.88) {
		return ramp[2];
	}
	if (u < -0.62) {
		return ramp[1];
	}
	if (u < -0.42) {
		return ramp[0];
	}
	if (u < 0.2) {
		return ramp[2];
	}
	if (u < 0.65) {
		return ramp[3];
	}
	return ramp[4];
}

/**
 * The cell's can: the teal sleeve over its side, the bare steel crimp at the shoulder and the base, and the flat cap on top.
 * @param {Canvas} scene
 */
function drawCell(scene) {
	const sleeve = [C.tealLight, C.teal, SLEEVE_MID, C.tealShade, SLEEVE_DEEP];
	for (let x = CELL.x - CELL.r; x <= CELL.x + CELL.r; x++) {
		const u = across(x);
		const drop = Math.round(frontDrop(x));
		const top = CELL.top + drop;
		const bottom = CELL.bottom + drop;
		for (let y = top; y <= bottom; y++) {
			let colour = roundTone(sleeve, u);
			if (y <= top + 2 || y >= bottom - 1) {
				colour = roundTone(STEEL, u);
			} else if (y === top + 3 || y === bottom - 2) {
				colour = SLEEVE_DEEP;
			}
			set(scene, x, y, colour);
		}
	}
	// The cap: a flat steel disc with a raised rim and a dark ring of vents round the terminal.
	for (let y = CELL.top - CELL.ry; y <= CELL.top + CELL.ry; y++) {
		for (let x = CELL.x - CELL.r; x <= CELL.x + CELL.r; x++) {
			const dx = (x - CELL.x) / CELL.r;
			const dy = (y - CELL.top) / CELL.ry;
			const e = dx * dx + dy * dy;
			if (e > 1.05) {
				continue;
			}
			let colour = dx + dy < 0 ? STEEL[1] : STEEL[2];
			if (e > 0.72) {
				colour = dx + dy < -0.3 ? STEEL[0] : STEEL[1];
			} else if (e > 0.42 && e < 0.58) {
				colour = STEEL[3];
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The colour of the rolled layers at a distance from the roll's heart.
 * @param {number} r - Distance from the axis, in pixels
 * @param {boolean} lit - The lit tone, for surfaces facing up
 * @returns {Colour}
 */
function layerTone(r, lit) {
	if (r < 1.2) {
		return CORE;
	}
	if (r < 2.2) {
		return lit ? STEEL[1] : STEEL[2];
	}
	if (r > CELL.r - 0.6) {
		return C.tealShade;
	}
	if (r > CELL.r - 1.6) {
		return lit ? STEEL[0] : STEEL[1];
	}
	const band = LAYERS[Math.floor(r - 2.2) % LAYERS.length];
	return lit ? band[0] : band[1];
}

/**
 * The window cut into the front-right quarter: the cut face shows the layers as stripes, and the floor of the cut shows them rolled in rings.
 * @param {Canvas} scene
 */
function drawCutaway(scene) {
	for (let x = CELL.x; x <= CELL.x + CELL.r; x++) {
		const dx = x - CELL.x;
		const drop = frontDrop(x);
		const from = Math.round(CUT.top + drop);
		const to = Math.round(CUT.bottom + drop);
		for (let y = from; y <= to; y++) {
			if (y < CUT.bottom) {
				// The cut face, through the axis: one stripe per layer, with the casing's shadow along its top.
				const colour = layerTone(dx, y > from + 1);
				set(scene, x, y, y === from ? mix(colour, C.ink, 0.5) : colour);
			} else {
				// The floor of the cut, seen from above: the layers wound round the heart.
				const dz = ((y - CUT.bottom) * CELL.r) / CELL.ry;
				set(scene, x, y, layerTone(Math.hypot(dx, dz), true));
			}
		}
		// The bright cut edges of the casing above and below the window.
		set(scene, x, from - 1, STEEL[1]);
		set(scene, x, to + 1, STEEL[3]);
	}
	// The casing's cut edge down the window's left side.
	const left = CELL.x;
	for (
		let y = Math.round(CUT.top + CELL.ry);
		y <= Math.round(CUT.bottom + CELL.ry);
		y++
	) {
		set(scene, left, y, STEEL[1]);
	}
}

/**
 * The positive terminal: a short steel button in the middle of the cap.
 * @param {Canvas} scene
 */
function drawTerminal(scene) {
	const { rx, ry, height } = TERMINAL;
	const top = CELL.top - height;
	for (let x = CELL.x - rx; x <= CELL.x + rx; x++) {
		const u = (x - CELL.x) / rx;
		const drop = Math.round(ry * Math.sqrt(Math.max(0, 1 - u * u)));
		for (let y = top + drop; y <= CELL.top + drop; y++) {
			set(scene, x, y, roundTone(STEEL, u));
		}
	}
	for (let y = top - ry; y <= top + ry; y++) {
		for (let x = CELL.x - rx; x <= CELL.x + rx; x++) {
			const e = ((x - CELL.x) / rx) ** 2 + ((y - top) / ry) ** 2;
			if (e <= 1.05) {
				set(scene, x, y, e > 0.6 ? STEEL[1] : STEEL[0]);
			}
		}
	}
}

/**
 * A gold lightning bolt printed on the sleeve's lit side.
 * @param {Canvas} scene
 */
function drawBolt(scene) {
	paint(
		scene,
		CELL.x - 11,
		26,
		[
			'....gg',
			'...gg.',
			'..ggy.',
			'.gg...',
			'gggggg',
			'yyygg.',
			'..gg..',
			'.gg...',
			'.g....',
			'g.....',
		],
		{ g: C.gold, y: C.amber }
	);
}

/**
 * Paints a thick stretch of cable between two points: lit along its top, shaded along its bottom.
 * @param {Canvas} scene
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 */
function cable(scene, x0, y0, x1, y1) {
	line(scene, x0, y0 + 1, x1, y1 + 1, LEAD_SHADE);
	line(scene, x0, y0, x1, y1, LEAD);
}

/**
 * The lead rising from the coil on the bench up the left side to the plug held over the cell.
 * @param {Canvas} scene
 */
function drawLeadRise(scene) {
	const points = [
		[6, 51],
		[3, 45],
		[3, 37],
		[6, 29],
		[6, 21],
		[4, 14],
		[5, 9],
		[7, 6],
	];
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		line(scene, x0 + 1, y0, x1 + 1, y1, LEAD_SHADE);
		line(scene, x0, y0, x1, y1, LEAD);
	}
}

/**
 * The lead's slack, coiled in loose loops on the bench in front of the cell's foot.
 * @param {Canvas} scene
 */
function drawCoil(scene) {
	const loops = [
		{ x: 12, y: 54, rx: 9, ry: 3.5 },
		{ x: 13, y: 57, rx: 10, ry: 4 },
		{ x: 12, y: 60, rx: 11, ry: 3.5 },
	];
	for (const loop of loops) {
		// Each loop's back half first, then its front half, each a stroke with a dark edge below it.
		for (const front of [false, true]) {
			for (let k = 0; k < 120; k++) {
				const t = (k / 120) * Math.PI * 2;
				if (Math.sin(t) > 0 !== front) {
					continue;
				}
				const x = Math.round(loop.x + Math.cos(t) * loop.rx);
				const y = Math.round(loop.y + Math.sin(t) * loop.ry);
				set(scene, x, y + 2, C.ink);
				set(scene, x, y + 1, LEAD_SHADE);
				set(scene, x, y, LEAD);
			}
		}
	}
	// The lead runs out of the top loop's back and up.
	cable(scene, 5, 52, 6, 50);
}

/**
 * The clip at the lead's end: a ribbed red boot and open copper jaws pointing at the terminal.
 * @param {Canvas} scene
 */
function drawPlug(scene) {
	const { x, y } = PLUG;
	rect(scene, x, y, 6, 5, C.brickRed);
	rect(scene, x, y, 6, 1, C.brickRedLight);
	rect(scene, x, y + 4, 6, 1, C.brickRedShade);
	for (let k = 1; k < 6; k += 2) {
		rect(scene, x + k, y + 1, 1, 3, C.brickRedShade);
	}
	// The jaws, sprung open, with teeth along their inner edges.
	line(scene, x + 6, y + 1, x + 11, y - 1, C.gold);
	line(scene, x + 6, y + 2, x + 11, y, C.amber);
	line(scene, x + 6, y + 3, x + 11, y + 5, C.amber);
	line(scene, x + 6, y + 4, x + 11, y + 6, C.lampFrame);
	set(scene, x + 9, y + 1, C.brass);
	set(scene, x + 11, y + 1, C.brass);
	set(scene, x + 9, y + 3, C.brass);
	set(scene, x + 11, y + 4, C.brass);
	set(scene, x + 6, y + 2, C.brass);
}

/**
 * The spark: a jagged white-hot arc from the plug's tip to the terminal, with a fork and a halo of teal.
 * @param {Canvas} scene
 */
function drawSpark(scene) {
	const core = [
		[PLUG.tip.x, PLUG.tip.y],
		[22, 6],
		[25, 3],
		[27, 8],
		[STRIKE.x, STRIKE.y],
	];
	/** @type {[number, number][]} */
	const pixels = [];
	const trace = (/** @type {number[][]} */ points) => {
		for (let i = 0; i < points.length - 1; i++) {
			const [x0, y0] = points[i];
			const [x1, y1] = points[i + 1];
			const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
			for (let k = 0; k <= steps; k++) {
				pixels.push([
					Math.round(x0 + ((x1 - x0) * k) / steps),
					Math.round(y0 + ((y1 - y0) * k) / steps),
				]);
			}
		}
	};
	trace(core);
	const main = pixels.length;
	trace([
		[25, 3],
		[27, 1],
		[29, 2],
	]);
	trace([
		[22, 6],
		[21, 9],
		[23, 11],
	]);
	// The teal halo round every pixel of the arc.
	for (const [x, y] of pixels) {
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const behind = get(scene, x + dx, y + dy);
			if (behind) {
				set(scene, x + dx, y + dy, mix(behind, C.tealLight, 0.7));
			}
		}
	}
	pixels.forEach(([x, y], i) => {
		set(scene, x, y, i < main ? C.white : C.tealLight);
	});
	// A white-hot star where the arc strikes the terminal, with teal tips.
	for (const [dx, dy] of [
		[0, 0],
		[1, 0],
		[-1, 0],
		[0, 1],
		[0, -1],
	]) {
		set(scene, STRIKE.x + dx, STRIKE.y + dy, C.white);
	}
	for (const [dx, dy] of [
		[2, 0],
		[-2, 0],
		[0, -2],
	]) {
		set(scene, STRIKE.x + dx, STRIKE.y + dy, C.tealLight);
	}
	// Sparks thrown off where the arc strikes and where it leaves the tip.
	for (const [x, y] of [
		[STRIKE.x + 2, STRIKE.y - 2],
		[STRIKE.x - 2, STRIKE.y + 2],
		[STRIKE.x + 3, STRIKE.y + 1],
		[PLUG.tip.x + 1, PLUG.tip.y + 2],
		[PLUG.tip.x + 2, PLUG.tip.y - 2],
	]) {
		set(scene, x, y, C.tealLight);
	}
}

/**
 * The last gleams of the spark's light on the terminal, the cap's rim and the sleeve.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[31, 10],
		[32, 10],
		[22, 12],
		[23, 11],
		[CELL.x - 8, 24],
		[CELL.x - 8, 25],
		[CELL.x - 8, 44],
	]) {
		set(scene, x, y, C.white);
	}
}
