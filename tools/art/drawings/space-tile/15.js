// Space tile 15: a convoy of three cargo freighters, their spines clamped with coloured containers, cruising past a teal nebula towards the gold lights of a far station.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A container's colours: its lit top, its side, and its ribs and seams.
 * @typedef {{ top: Colour, side: Colour, rib: Colour }} Crate
 */

/**
 * A freighter: a spine with containers clamped above and below it, a cab at the bow and an engine block at the stern.
 * @typedef {Object} Freighter
 * @property {number} x - The engine block's left column
 * @property {number} y - The spine's top row
 * @property {number} crateW - A container's width
 * @property {number} crateH - A container's height
 * @property {number} spine - The spine's thickness
 * @property {number} engine - The engine block's width
 * @property {number} cab - The cab's length
 * @property {number[]} above - How many containers high each stack stands above the spine, stern to bow
 * @property {number[]} below - How many hang below it
 */

/** The convoy, nearest first: the big freighter at the lower left, two more ahead and smaller with distance. */
const CONVOY = /** @type {Freighter[]} */ ([
	{
		x: 10,
		y: 44,
		crateW: 4,
		crateH: 3,
		spine: 2,
		engine: 6,
		cab: 9,
		above: [2, 3, 3, 2, 3, 3, 3, 2],
		below: [1, 2, 2, 1, 2, 2, 1, 1],
	},
	{
		x: 24,
		y: 29,
		crateW: 2,
		crateH: 2,
		spine: 1,
		engine: 3,
		cab: 4,
		above: [1, 2, 2, 1, 2, 2, 2],
		below: [1, 1, 1, 1, 1, 1, 0],
	},
	{
		x: 35,
		y: 19,
		crateW: 1,
		crateH: 1,
		spine: 1,
		engine: 2,
		cab: 2,
		above: [1, 2, 2, 1, 2, 1],
		below: [1, 1, 1, 1, 1, 0],
	},
]);

/** The far station: the top of its spine. */
const STATION = { x: 50, y: 10 };

/** The bright young star inside the nebula that lights it. */
const STAR = { x: 16, y: 21 };

/** Deep space, from the top down. */
const SPACE = [
	mix(C.ink, C.night, 0.5),
	mix(C.night, C.nightSea3, 0.35),
	mix(C.nightSky1, C.nightSea3, 0.55),
];

/** The nebula's teal, from its faint outskirts to its bright rims. */
const NEBULA = [
	mix(C.nightSea3, C.tealShade, 0.35),
	mix(C.nightSea3, C.tealShade, 0.7),
	mix(C.tealShade, C.teal, 0.3),
	mix(C.tealShade, C.teal, 0.7),
	mix(C.teal, C.tealLight, 0.4),
];

/** The dark lanes of dust that wind through the nebula. */
const DUST = mix(C.ink, C.nightSea3, 0.5);

/** Starlight in three brightnesses. */
const STARS = [mix(C.starDim, C.tealShade, 0.45), C.starDim, C.white];

/** The freighters' grey hulls, their tops catching the nebula's teal light. */
const HULL = {
	light: mix(C.stoneLight, C.tealLight, 0.3),
	main: C.stone,
	mid: C.stoneMid,
	shade: C.stoneShade,
	dark: mix(C.stoneShade, C.ink, 0.45),
};

/** The containers: red, blue, gold, green, cream, violet and orange. */
const CRATES = /** @type {Crate[]} */ ([
	{ top: C.brickRedLight, side: C.brickRed, rib: C.brickRedShade },
	{ top: C.daySky3, side: C.daySky1, rib: mix(C.daySky1, C.nightSea2, 0.6) },
	{ top: C.gold, side: C.amber, rib: C.lampFrame },
	{ top: C.grassLight, side: C.grass, rib: C.grassShade },
	{ top: C.creamLight, side: C.cream, rib: C.creamShade },
	{ top: C.arcaneLight, side: C.arcane, rib: C.arcaneShade },
	{
		top: mix(C.gold, C.brickRedLight, 0.5),
		side: mix(C.amber, C.brickRedLight, 0.5),
		rib: mix(C.timberLight, C.brickRed, 0.4),
	},
]);

/** The drives' violet-white plumes, from the white-hot nozzle out. */
const PLUME = [
	C.white,
	C.arcaneLight,
	C.arcane,
	mix(C.arcane, C.nightSea3, 0.5),
];

/** The lit windows of the cabs and the station. */
const WINDOW = C.lampGlow;

/**
 * Draws space tile 15.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(15015);
	drawSpace(layer, random);
	drawStation(layer);

	// Each freighter is outlined on its own, the far ones first, so each nearer one stands clear of the last.
	let scene = layer;
	for (const ship of [...CONVOY].reverse()) {
		const canvas = createCanvas(64, 64);
		drawFreighter(canvas, ship, random);
		outline(canvas, C.ink);
		underlay(canvas, scene);
		drawPlume(canvas, ship);
		scene = canvas;
	}
	drawRunningLights(scene, CONVOY[0]);
	return scene;
}

/**
 * Deep space and the teal nebula drifting across it: soft billows round a bright young star, a dark lane of dust,
 * stars in three brightnesses and a few sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 64; y++) {
		const t = (y / 63) * (SPACE.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SPACE.length && t - i > 0.5 && (x + y) % 2 === 0;
			let colour = dither ? SPACE[i + 1] : SPACE[i];
			const d = density(x, y);
			const seam = (x + y) % 2 === 0 ? 0.035 : -0.035;
			const level = Math.floor((d + seam) * 7) - 1;
			if (level >= 0) {
				colour = NEBULA[Math.min(NEBULA.length - 1, level)];
			}
			const lane =
				Math.sin(x * 0.13 - y * 0.27 + 0.9) +
				0.5 * Math.sin(x * 0.31 + y * 0.09);
			if (d > 0.3 && Math.abs(lane - 0.35) < 0.1 + d * 0.08) {
				colour = d > 0.6 ? NEBULA[0] : DUST;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 80; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const bright = random();
		set(layer, x, y, STARS[bright > 0.85 ? 2 : bright > 0.45 ? 1 : 0]);
	}
	glow(layer, {
		x: STAR.x,
		y: STAR.y,
		radius: 9,
		colour: C.tealLight,
		strength: 0.45,
		steps: 3,
	});
	for (const [x, y, arm] of [
		[STAR.x, STAR.y, 3],
		[38, 7, 1],
		[60, 30, 1],
		[7, 56, 1],
	]) {
		set(layer, x, y, C.white);
		for (let a = 1; a <= arm; a++) {
			const colour = a === 1 ? C.ghostLight : C.tealLight;
			set(layer, x + a, y, colour);
			set(layer, x - a, y, colour);
			set(layer, x, y + a, colour);
			set(layer, x, y - a, colour);
		}
	}
}

/**
 * How thick the nebula is at a pixel, from 0 (clear space) up: a great billowing cloud over the left and middle,
 * thinning to clear space at the upper right where the station waits.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function density(x, y) {
	const body = 0.95 - Math.hypot((x - 18) / 38, (y - 26) / 30);
	const billows =
		0.2 * Math.sin(x * 0.17 + y * 0.11 + 1.3) +
		0.16 * Math.sin(y * 0.23 - x * 0.13 + 0.2) +
		0.1 * Math.sin(x * 0.37 + y * 0.31 + 2.1) +
		0.06 * Math.sin(x * 0.71 - y * 0.59);
	return body + billows;
}

/**
 * The far station: a slender spine with two arms across it, strung with gold lights round a white beacon.
 * @param {Canvas} layer
 */
function drawStation(layer) {
	const { x, y } = STATION;
	rect(layer, x, y, 1, 11, HULL.mid);
	rect(layer, x - 5, y + 3, 11, 1, HULL.shade);
	rect(layer, x - 3, y + 7, 7, 1, HULL.shade);
	rect(layer, x - 1, y + 4, 3, 2, HULL.main);
	// Lit windows strung along both arms, brightest at the hub, and lamps at the tips.
	/** @type {[number, number, Colour][]} */
	const lights = [
		[-5, 3, C.gold],
		[5, 3, C.gold],
		[-3, 3, C.amber],
		[3, 3, C.amber],
		[-1, 3, WINDOW],
		[1, 3, WINDOW],
		[-3, 7, C.gold],
		[3, 7, C.gold],
		[-1, 7, C.amber],
		[1, 7, C.amber],
		[-1, 4, WINDOW],
		[1, 5, WINDOW],
		[0, 10, C.gold],
	];
	for (const [dx, dy, colour] of lights) {
		set(layer, x + dx, y + dy, colour);
	}
	// The beacon on top, flaring.
	set(layer, x, y, C.white);
	set(layer, x, y - 1, C.ghostLight);
	set(layer, x - 1, y, C.ghostLight);
	set(layer, x + 1, y, C.ghostLight);
}

/**
 * A freighter: its engine block, its spine, the containers clamped above and below it, and its cab.
 * @param {Canvas} canvas
 * @param {Freighter} ship
 * @param {() => number} random
 */
function drawFreighter(canvas, ship, random) {
	const { x, y, crateW, crateH, spine, engine, above, below } = ship;
	const start = x + engine;
	const end = start + above.length * crateW;
	// The spine, running from the engines to the cab.
	for (let i = start; i < end; i++) {
		set(canvas, i, y, spine > 1 ? HULL.main : HULL.mid);
		if (spine > 1) {
			set(
				canvas,
				i,
				y + 1,
				(i - start) % 4 === 3 ? HULL.dark : HULL.shade
			);
		}
	}
	let previous = -1;
	/**
	 * Picks a container's colours, never the same as the one just picked.
	 * @returns {Crate}
	 */
	const pick = () => {
		let n = Math.floor(random() * CRATES.length);
		if (n === previous) {
			n = (n + 1) % CRATES.length;
		}
		previous = n;
		return CRATES[n];
	};
	above.forEach((high, column) => {
		for (let j = 0; j < high; j++) {
			const top = y - (j + 1) * crateH;
			drawCrate(
				canvas,
				start + column * crateW,
				top,
				ship,
				pick(),
				j === high - 1
			);
		}
	});
	below.forEach((low, column) => {
		for (let j = 0; j < low; j++) {
			const top = y + spine + j * crateH;
			drawCrate(
				canvas,
				start + column * crateW,
				top,
				ship,
				pick(),
				false
			);
		}
	});
	drawEngineBlock(canvas, ship);
	drawCab(canvas, ship, end);
}

/**
 * One container: a lit top on the topmost of a stack, ribbed sides, a seam on its right.
 * @param {Canvas} canvas
 * @param {number} left
 * @param {number} top
 * @param {Freighter} ship
 * @param {Crate} crate
 * @param {boolean} topmost
 */
function drawCrate(canvas, left, top, { crateW, crateH }, crate, topmost) {
	for (let row = 0; row < crateH; row++) {
		for (let i = 0; i < crateW; i++) {
			let colour = crate.side;
			if (crateW === 1) {
				colour = topmost && row === 0 ? crate.top : crate.side;
			} else if (row === 0 && topmost) {
				colour = crate.top;
			} else if (i === crateW - 1 || (row === crateH - 1 && crateH > 2)) {
				colour = crate.rib;
			} else if (i === 1 && crateW > 2) {
				colour = crate.top;
			}
			set(canvas, left + i, top + row, colour);
		}
	}
}

/**
 * The engine block at the stern: a heavy housing, lit on top, with the drive bells behind it.
 * @param {Canvas} canvas
 * @param {Freighter} ship
 */
function drawEngineBlock(
	canvas,
	{ x, y, crateH, spine, engine, above, below }
) {
	const top = y - Math.max(...above) * crateH + Math.floor(crateH / 2);
	const bottom =
		y + spine + Math.max(...below) * crateH - 1 - Math.floor(crateH / 3);
	for (let j = top; j <= bottom; j++) {
		for (let i = x; i < x + engine; i++) {
			let colour = HULL.mid;
			if (j === top) {
				colour = HULL.light;
			} else if (j > y + spine) {
				colour = HULL.shade;
			} else if (i === x + engine - 1 && engine > 2) {
				colour = HULL.shade;
			} else if (j < y - 1 && engine > 2) {
				colour = HULL.main;
			}
			set(canvas, i, j, colour);
		}
	}
	// Panel seams and a row of vents on the big freighter's housing.
	if (engine > 3) {
		rect(canvas, x + 1, y - 2, engine - 2, 1, HULL.shade);
		for (let j = top + 2; j < y - 2; j += 2) {
			rect(canvas, x + 1, j, 2, 1, HULL.dark);
		}
		rect(canvas, x + 1, y + spine + 1, engine - 2, 1, HULL.dark);
	}
	// The drive bells: two on the big freighter, one on the others.
	const bells = engine > 3 ? [y - 3, y + 3] : [y];
	const size = engine > 3 ? 3 : engine > 2 ? 2 : 1;
	for (const row of bells) {
		rect(canvas, x - 2, row - Math.floor(size / 2), 2, size, HULL.shade);
		set(canvas, x - 1, row - Math.floor(size / 2), HULL.main);
	}
}

/**
 * The cab at the bow: a tapering nose with a row of lit windows.
 * @param {Canvas} canvas
 * @param {Freighter} ship
 * @param {number} start - The cab's first column
 */
function drawCab(canvas, { y, crateH, spine, cab }, start) {
	const reach = Math.max(1, Math.round(crateH * 1.6));
	for (let i = 0; i < cab; i++) {
		const taper = Math.max(0, i - Math.floor(cab / 3));
		const top = y - reach + Math.round(taper * 0.6);
		const bottom =
			y + spine - 1 + Math.max(0, reach - 1 - Math.round(taper * 0.5));
		for (let j = top; j <= bottom; j++) {
			let colour = HULL.main;
			if (j === top) {
				colour = HULL.light;
			} else if (j > y) {
				colour = HULL.shade;
			}
			if (j === y - Math.ceil(reach / 2) && i > 0 && i < cab - 2) {
				colour = i % 2 === 1 || cab < 5 ? WINDOW : HULL.dark;
			}
			set(canvas, start + i, j, colour);
		}
	}
}

/**
 * The drive plumes streaming back from a freighter's bells, violet round a white-hot core.
 * @param {Canvas} canvas
 * @param {Freighter} ship
 */
function drawPlume(canvas, { x, y, engine }) {
	const bells = engine > 3 ? [y - 3, y + 3] : [y];
	const length = engine > 3 ? 7 : engine > 2 ? 4 : 2;
	for (const row of bells) {
		for (let i = 0; i < length; i++) {
			const px = x - 3 - i;
			const step = Math.floor((i / length) * 4);
			set(canvas, px, row, PLUME[Math.min(3, step)]);
			if (engine > 3 && i < length - 2) {
				set(canvas, px, row - 1, PLUME[Math.min(3, step + 1)]);
				set(canvas, px, row + 1, PLUME[Math.min(3, step + 1)]);
			}
		}
	}
	if (engine > 3) {
		glow(canvas, {
			x: x - 4,
			y,
			radius: 9,
			colour: C.arcaneLight,
			strength: 0.3,
			steps: 2,
			skip: [...PLUME, C.ink],
		});
	}
}

/**
 * Small lights on the big freighter: red at the stern, green at the bow and a white beacon on the cab.
 * @param {Canvas} canvas
 * @param {Freighter} ship
 */
function drawRunningLights(canvas, { x, y, crateW, engine, cab, above }) {
	const bow = x + engine + above.length * crateW + cab - 1;
	set(canvas, x + 1, y - Math.max(...above) * 3 + 1, C.brickRedLight);
	set(canvas, bow, y, C.grassLight);
}
