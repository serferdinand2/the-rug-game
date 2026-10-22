// Infrastructure Upgrade: a yellow tower crane lowering the last span onto a new concrete overpass, a glass skyline behind and cones on the road.
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
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ground's first row, the deck's top row and the crane mast's left column. */
const GROUND = 52;
const DECK = 30;
const MAST = 55;

/** Fresh concrete, warmer and lighter than old stone. */
const CONCRETE = {
	light: mix(C.cream, C.stoneLight, 0.45),
	main: mix(C.creamShade, C.stoneLight, 0.45),
	shade: mix(C.creamShade, C.stone, 0.6),
	dark: mix(C.stoneShade, C.creamShade, 0.25),
};

/** Rusty reinforcing bars and safety orange. */
const REBAR = mix(C.timberLight, C.brickRedShade, 0.35);
const ORANGE = mix(C.amber, C.brickRedLight, 0.45);

/** The glass towers' colours, keyed by the day skyline's own. */
const GLASS = new Map([
	[C.stoneMid, mix(C.daySky2, C.stoneMid, 0.35)],
	[C.stoneLight, mix(C.daySky6, C.white, 0.4)],
	[C.stoneShade, mix(C.daySky1, C.roof, 0.3)],
	[C.daySky5, C.daySky6],
]);

/**
 * Draws the Infrastructure Upgrade scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(821);

	drawSky(layer, { time: 'day', horizon: GROUND - 1, random });
	drawCity(layer, random);
	drawFarCrane(layer);
	drawGround(layer);

	drawPiers(scene);
	drawDeck(scene);
	drawSpan(scene);
	drawCrane(scene);
	drawCones(scene);
	drawCar(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawRebar(scene);
	drawCables(scene);
	return scene;
}

/**
 * The glass skyline behind the works: the skyline part, drawn on its own canvas and recoloured as blue glass.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCity(layer, random) {
	const city = createCanvas(64, 64);
	drawSkyline(city, { base: GROUND - 1, time: 'day', random, height: 30 });
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(city, x, y);
			if (colour) {
				set(layer, x, y, GLASS.get(colour) ?? colour);
			}
		}
	}
}

/**
 * A second, distant tower crane among the towers, pale with the haze and left without an outline.
 * @param {Canvas} layer
 */
function drawFarCrane(layer) {
	const colour = mix(C.amber, C.daySky4, 0.55);
	for (let y = 9; y < GROUND; y++) {
		set(layer, 9, y, colour);
		set(layer, 11, y, colour);
		if (y % 2 === 0) {
			set(layer, 10, y, colour);
		}
	}
	rect(layer, 1, 9, 24, 1, colour);
	for (let x = 2; x < 24; x += 2) {
		set(layer, x, 10, colour);
	}
	rect(layer, 10, 6, 1, 3, colour);
	line(layer, 10, 6, 23, 9, colour);
	rect(layer, 1, 10, 3, 2, mix(C.stone, C.daySky4, 0.4));
	line(layer, 19, 10, 19, 17, mix(C.stoneShade, C.daySky4, 0.4));
}

/**
 * The ground: a strip of bare earth under the works and a new road along the front, with lane marks.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour;
			if (y === GROUND) {
				colour = C.sandShade;
			} else if (y < GROUND + 4) {
				colour = (x * 3 + y) % 7 === 0 ? C.timberLight : C.timber;
			} else if (y === GROUND + 4) {
				colour = CONCRETE.light;
			} else {
				colour =
					y > 59 ? mix(C.stoneShade, C.roof, 0.35) : C.stoneShade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let x = 2; x < 64; x += 8) {
		rect(layer, x, 60, 4, 1, C.cream);
	}
}

/**
 * The finished piers: square columns under hammerhead caps, and a lone new pier waiting for its span.
 * @param {Canvas} scene
 */
function drawPiers(scene) {
	for (const [x, top] of [
		[6, DECK + 6],
		[25, DECK + 6],
		[45, DECK + 6],
	]) {
		rect(scene, x - 3, top, 10, 2, CONCRETE.light);
		rect(scene, x - 3, top + 2, 10, 1, CONCRETE.shade);
		for (let y = top + 3; y < GROUND + 1; y++) {
			rect(scene, x, y, 4, 1, CONCRETE.main);
			set(scene, x, y, CONCRETE.light);
			set(scene, x + 3, y, CONCRETE.shade);
		}
	}
}

/**
 * The finished deck: a parapet over a thick slab, from the left edge to its raw end.
 * @param {Canvas} scene
 */
function drawDeck(scene) {
	const end = 34;
	for (let x = 0; x <= end; x++) {
		set(scene, x, DECK, CONCRETE.light);
		set(scene, x, DECK + 1, CONCRETE.main);
		set(scene, x, DECK + 2, x % 6 === 0 ? CONCRETE.shade : CONCRETE.main);
		set(scene, x, DECK + 3, CONCRETE.light);
		set(scene, x, DECK + 4, CONCRETE.main);
		set(scene, x, DECK + 5, CONCRETE.dark);
	}
	// The raw end, broken back unevenly.
	clearPixel(scene, end, DECK);
	clearPixel(scene, end, DECK + 1);
	clearPixel(scene, end - 1, DECK);
}

/**
 * Empties one pixel of the foreground.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function clearPixel(scene, x, y) {
	scene.p[y * 64 + x] = null;
}

/**
 * The precast span hanging from the crane's hook, about to be lowered into the gap.
 * @param {Canvas} scene
 */
function drawSpan(scene) {
	const left = 37;
	const right = 52;
	const top = 22;
	for (let x = left; x <= right; x++) {
		set(scene, x, top, CONCRETE.light);
		set(scene, x, top + 1, CONCRETE.main);
		set(scene, x, top + 2, CONCRETE.main);
		set(scene, x, top + 3, CONCRETE.dark);
	}
	set(scene, left, top + 1, CONCRETE.light);
	set(scene, left, top + 2, CONCRETE.light);
}

/**
 * The tower crane: a yellow lattice mast, the cab, a long jib reaching left over the deck,
 * the counter-jib with its weights, and the trolley.
 * @param {Canvas} scene
 */
function drawCrane(scene) {
	// The mast: two chords with alternating braces.
	for (let y = 9; y <= GROUND; y++) {
		set(scene, MAST, y, C.gold);
		set(scene, MAST + 3, y, C.amber);
		const brace = (y - 9) % 4;
		if (brace === 1) {
			set(scene, MAST + 1, y, C.gold);
		} else if (brace === 2) {
			set(scene, MAST + 2, y, C.amber);
		} else if (brace === 0) {
			set(scene, MAST + 1, y, C.gold);
			set(scene, MAST + 2, y, C.amber);
		}
	}
	// The base it stands on.
	rect(scene, MAST - 2, GROUND, 8, 2, CONCRETE.main);
	// The jib and counter-jib: a top chord, a bottom chord and braces.
	for (let x = 14; x <= 63; x++) {
		set(scene, x, 5, C.gold);
		set(scene, x, 8, C.amber);
		const brace = (x - 14) % 4;
		if (brace === 1) {
			set(scene, x, 6, C.gold);
		} else if (brace === 2) {
			set(scene, x, 7, C.amber);
		}
	}
	// The apex and its tie lines.
	rect(scene, MAST + 1, 0, 2, 5, C.gold);
	line(scene, MAST + 1, 0, 26, 4, C.amber);
	// The cab, below the jib on the left of the mast.
	paint(scene, MAST - 4, 9, ['cccc', 'cwwc', 'cwwc', 'cccc'], {
		c: C.cream,
		w: C.daySky4,
	});
	// The counterweights.
	rect(scene, 60, 9, 4, 4, CONCRETE.main);
	rect(scene, 60, 9, 4, 1, CONCRETE.light);
	// The trolley.
	rect(scene, 43, 9, 4, 2, C.stoneShade);
}

/**
 * The hoist cables from the trolley to the hook, and the slings to the span's ends.
 * @param {Canvas} scene
 */
function drawCables(scene) {
	line(scene, 44, 11, 44, 16, C.ink);
	line(scene, 45, 11, 45, 16, C.ink);
	paint(scene, 43, 16, ['.kk.', 'kbbk', '.bb.', '..b.'], {
		k: C.ink,
		b: C.brickRed,
	});
	line(scene, 44, 19, 38, 21, C.ink);
	line(scene, 45, 19, 51, 21, C.ink);
}

/**
 * Rebar bristling from the deck's raw end and from the top of the lone pier.
 * @param {Canvas} scene
 */
function drawRebar(scene) {
	for (const y of [DECK + 1, DECK + 3]) {
		line(scene, 35, y, 38, y - 1, REBAR);
	}
	set(scene, 35, DECK + 5, REBAR);
	for (const x of [43, 45, 47, 49]) {
		line(scene, x, DECK + 3, x, DECK + 5, REBAR);
	}
}

/**
 * Traffic cones along the kerb and a striped barrier closing off the works.
 * @param {Canvas} scene
 */
function drawCones(scene) {
	for (const x of [3, 13, 33]) {
		paint(
			scene,
			x,
			GROUND + 1,
			['..o..', '..o..', '.www.', '.ooo.', 'ooooo', 'kkkkk'],
			{ o: ORANGE, w: C.white, k: C.stoneShade }
		);
	}
	for (let x = 19; x <= 29; x++) {
		set(scene, x, GROUND + 1, Math.floor(x / 2) % 2 ? C.brickRed : C.white);
		set(scene, x, GROUND + 2, Math.floor(x / 2) % 2 ? C.white : C.brickRed);
	}
	rect(scene, 20, GROUND + 3, 1, 4, C.stoneShade);
	rect(scene, 28, GROUND + 3, 1, 4, C.stoneShade);
}

/**
 * A small blue car driving along the road under the works.
 * @param {Canvas} scene
 */
function drawCar(scene) {
	paint(
		scene,
		38,
		57,
		[
			'...bbbbb....',
			'..bwwbwwb...',
			'bbbbbbbbbbbb',
			'bBBBBBBBBBBl',
			'.kk.....kk..',
		],
		{
			b: C.daySea1,
			B: C.daySea2,
			w: C.daySky6,
			l: C.lampGlow,
			k: C.wood,
		}
	);
}
