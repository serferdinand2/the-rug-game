// Found Art: a big fish built from driftwood planks, painted slats and beach junk, mounted on a post on a pebbly northern beach.
import {
	createCanvas,
	get,
	set,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sea's horizon row. */
const HORIZON = 30;

/** The fish: its nose column, the column where the body meets the tail, and its middle row. */
const NOSE = 5;
const TAIL = 47;
const MID = 26;

/** The dorsal fin's sticks: each one's base column on the back, and its tip. */
const FIN = [
	[16, 19, 5],
	[19, 24, 4],
	[22, 29, 5],
	[25, 33, 7],
	[28, 37, 10],
	[31, 40, 14],
];

/** Sun-bleached driftwood: lit, plain, a warmer plank, shaded, and the dark between planks. */
const DRIFT = {
	light: mix(C.cream, C.stoneLight, 0.35),
	main: mix(C.timberLight, C.stoneLight, 0.55),
	warm: mix(mix(C.timberLight, C.stoneLight, 0.55), C.timberLight, 0.4),
	shade: mix(C.timber, C.stone, 0.5),
	gap: mix(C.timberShade, C.roofShade, 0.4),
};

/** A cool northern beach: pale sand, wet sand at the water's edge, and pebbles. */
const SAND = {
	light: mix(C.sandLight, C.creamLight, 0.4),
	main: mix(C.sand, C.stoneLight, 0.35),
	shade: mix(C.sandShade, C.stone, 0.35),
	wet: mix(C.sandShade, C.daySea3, 0.3),
};

/** Rusty sheet metal for the head. */
const RUST = {
	light: mix(C.amber, C.brickRedLight, 0.35),
	main: mix(C.brickRed, C.amber, 0.45),
	shade: mix(C.brickRedShade, C.timber, 0.4),
};

/**
 * Draws the Found Art scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3307);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHeadland(layer);
	drawSea(layer, { time: 'day', top: HORIZON + 1, random, waves: 30 });
	drawBeach(layer, random);
	drawFinNet(layer);

	drawPost(scene);
	drawFin(scene);
	drawTail(scene);
	drawBody(scene);
	drawHead(scene);
	drawJunk(scene);
	drawFigure(scene, { x: 53, y: 59, facing: 'left', clothes: C.amber });
	outline(scene, C.ink);
	underlay(scene, layer);
	drawEye(scene);
	drawCaps(scene, random);
	drawLashings(scene);
	return scene;
}

/**
 * The fish's half-height at a column of its body: blunt at the head, tapering to the tail.
 * @param {number} x
 * @returns {number}
 */
function halfHeight(x) {
	const u = (x - NOSE) / (TAIL - NOSE);
	if (u < 0 || u > 1) {
		return -1;
	}
	return 3 + 9 * Math.sin(Math.PI * Math.min(1, u ** 0.75 * 1.05 + 0.04));
}

/**
 * A low grey-green headland on the horizon at the left.
 * @param {Canvas} layer
 */
function drawHeadland(layer) {
	for (let x = 0; x < 26; x++) {
		const top = Math.round(HORIZON - 5 + x * 0.2 + Math.sin(x * 0.5) * 0.8);
		for (let y = top; y <= HORIZON; y++) {
			set(
				layer,
				x,
				y,
				y === top
					? mix(C.grass, C.daySky5, 0.45)
					: mix(C.grassShade, C.daySky4, 0.5)
			);
		}
	}
}

/**
 * The shoreline row at a column: the wet edge of the beach, waving gently.
 * @param {number} x
 * @returns {number}
 */
function shore(x) {
	return Math.round(42 + Math.sin(x * 0.18 + 1) * 1.5);
}

/**
 * The beach: a line of foam, dark wet sand, then pale dry sand scattered with pebbles and shells.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBeach(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top = shore(x);
		set(layer, x, top - 1, (x * 5) % 7 < 5 ? C.foam : C.dayWave);
		for (let y = top; y < 64; y++) {
			let colour = SAND.main;
			if (y < top + 3) {
				colour = y === top ? SAND.wet : mix(SAND.wet, SAND.main, 0.5);
			} else if ((y - top) % 6 === 4 && (x + y) % 5 < 2) {
				colour = SAND.light;
			} else if (y > 58 && (x + y) % 2 === 0) {
				colour = SAND.shade;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 63);
		const y = shore(x) + 4 + Math.floor(random() * (60 - shore(x)));
		const big = random() > 0.6;
		set(layer, x, y, big ? C.stone : C.stoneLight);
		if (big) {
			set(layer, x + 1, y, C.stoneShade);
		}
	}
}

/**
 * The stout driftwood post the fish is mounted on, driven into a cairn of beach stones.
 * @param {Canvas} scene
 */
function drawPost(scene) {
	const x = 26;
	for (let y = MID; y <= 53; y++) {
		set(scene, x, y, DRIFT.light);
		set(scene, x + 1, y, DRIFT.main);
		set(scene, x + 2, y, y % 6 === 0 ? DRIFT.gap : DRIFT.main);
		set(scene, x + 3, y, DRIFT.shade);
	}
	set(scene, x + 2, 44, DRIFT.gap);
	// The cairn: rounded stones heaped round the post's foot.
	paint(
		scene,
		x - 7,
		51,
		[
			'.....LLL..LL.....',
			'..LLLSSSLLSSLL...',
			'.LSSSSSsLSSSsSLL.',
			'LSSSsSSsSSSsSSSsL',
			'SSSsssSSSssSSSsss',
		],
		{ L: C.stoneLight, S: C.stone, s: C.stoneShade }
	);
}

/**
 * The dorsal fin: a fan of bleached sticks rising from the fish's back and sweeping back towards the tail.
 * @param {Canvas} scene
 */
function drawFin(scene) {
	for (const [x, tipX, tipY] of FIN) {
		const base = Math.round(MID - halfHeight(x)) + 1;
		line(scene, x, base, tipX, tipY, DRIFT.light);
		line(scene, x + 1, base, tipX + 1, tipY, DRIFT.shade);
	}
}

/**
 * The tail: two lobes fanned out of old slats, some still in their red, blue and white paint.
 * @param {Canvas} scene
 */
function drawTail(scene) {
	const slats = [
		C.brickRed,
		DRIFT.light,
		C.daySea2,
		DRIFT.main,
		C.creamLight,
		DRIFT.light,
		C.brickRed,
		DRIFT.main,
		C.daySea2,
		DRIFT.light,
	];
	const jx = TAIL - 3;
	for (let y = MID - 18; y <= MID + 18; y++) {
		for (let x = jx; x < 64; x++) {
			const dx = x - jx;
			const dy = MID - y;
			const r = Math.hypot(dx, dy);
			const a = (Math.atan2(dy, dx) * 180) / Math.PI;
			const upper = a >= 12 && a <= 62 && r <= 17;
			const lower = a <= -12 && a >= -58 && r <= 16;
			const root = r <= 5 && a > -60 && a < 64;
			if (!upper && !lower && !root) {
				continue;
			}
			const slat = Math.floor((a + 90) / 8);
			let colour = slats[slat % slats.length];
			// The slats' far ends are ragged, and a dark seam runs between neighbours.
			if (Math.floor((a + 90) * 4) % 32 === 0) {
				colour = DRIFT.gap;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * A fishing net strung between the fin's sticks, drawn on the background so its mesh stays fine.
 * @param {Canvas} layer
 */
function drawFinNet(layer) {
	/** @type {[number, number][]} */
	const shape = [
		[FIN[0][0], Math.round(MID - halfHeight(FIN[0][0]))],
		...FIN.map(([, tx, ty]) => /** @type {[number, number]} */ ([tx, ty])),
		[FIN[5][0], Math.round(MID - halfHeight(FIN[5][0]))],
	];
	for (let y = 0; y < MID; y++) {
		for (let x = 0; x < 64; x++) {
			if (inside(shape, x + 0.5, y + 0.5) && (x + y) % 3 === 0) {
				set(layer, x, y, C.creamShade);
			} else if (
				inside(shape, x + 0.5, y + 0.5) &&
				(x - y + 60) % 3 === 0
			) {
				set(layer, x, y, C.creamShade);
			}
		}
	}
}

/**
 * Tells whether a point lies inside a polygon, by counting the edges a ray to its right crosses.
 * @param {[number, number][]} shape - The polygon's corners in order
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inside(shape, x, y) {
	let crossings = 0;
	for (let i = 0; i < shape.length; i++) {
		const [ax, ay] = shape[i];
		const [bx, by] = shape[(i + 1) % shape.length];
		if (ay > y !== by > y && x < ax + ((y - ay) / (by - ay)) * (bx - ax)) {
			crossings++;
		}
	}
	return crossings % 2 === 1;
}

/**
 * The body: rows of driftwood planks of different tones, laid nose to tail with staggered ends.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	const tones = [DRIFT.main, DRIFT.light, DRIFT.warm];
	for (let x = NOSE + 8; x <= TAIL; x++) {
		const half = halfHeight(x);
		const top = Math.round(MID - half);
		const bottom = Math.round(MID + half * 0.85);
		for (let y = top; y <= bottom; y++) {
			const plank = Math.floor((y - MID + 30) / 3);
			const row = (y - MID + 30) % 3;
			const end = (x + plank * 7) % 13 === 0;
			let colour = tones[plank % tones.length];
			if (row === 2 || end) {
				colour = DRIFT.gap;
			} else if (y === top) {
				colour = DRIFT.light;
			} else if (y >= bottom - 1) {
				colour = DRIFT.shade;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The head: a rusty sheet of iron bent round the front of the body, with an open mouth.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let x = NOSE; x < NOSE + 11; x++) {
		const half = halfHeight(x);
		const top = Math.round(MID - half);
		const bottom = Math.round(MID + half * 0.85);
		for (let y = top; y <= bottom; y++) {
			let colour = RUST.main;
			if (x === NOSE + 10 || y === bottom) {
				colour = RUST.shade;
			} else if (y === top || x <= NOSE + 1) {
				colour = RUST.light;
			}
			set(scene, x, y, colour);
		}
	}
	// The open mouth: a dark notch.
	for (let i = 0; i < 4; i++) {
		set(scene, NOSE + i, MID + 2, C.ink);
		set(scene, NOSE + i, MID + 3, C.ink);
	}
	set(scene, NOSE + 4, MID + 2, C.ink);
}

/**
 * Beach junk: a slatted crate side for a fin, a float hanging under the belly, and a bucket and a bottle in the sand.
 * @param {Canvas} scene
 */
function drawJunk(scene) {
	// The pectoral fin: a broken crate side, slatted.
	paint(
		scene,
		20,
		MID + 3,
		['SSSSS.', 'SsSsSS', 'SsSsSs', '.SsSsS', '..SsSs', '...SsS'],
		{ S: C.timberLight, s: C.timber }
	);
	// A red and white float on a short net.
	paint(
		scene,
		28,
		MID + 9,
		['.nn.', 'n..n', '.rr.', 'rrrr', 'wwww', '.rr.'],
		{
			n: C.creamShade,
			r: C.brickRed,
			w: C.white,
		}
	);
	// A tin bucket and a bottle in the sand.
	paint(scene, 39, 49, ['bbbbb', '.BBB.', '.BBB.', '.BbB.'], {
		b: C.stoneLight,
		B: C.stone,
	});
	paint(scene, 11, 50, ['.g', '.g', 'gG', 'gG', 'gG'], {
		g: mix(C.pineLight, C.foam, 0.3),
		G: C.pine,
	});
}

/**
 * The eye: a brass porthole with dark glass and a glint, drawn after the outline so its ring stays crisp.
 * @param {Canvas} scene
 */
function drawEye(scene) {
	paint(
		scene,
		NOSE + 3,
		MID - 6,
		['.kkkk.', 'kbbbbk', 'kbddbk', 'kbdwbk', 'kbbbbk', '.kkkk.'],
		{ k: C.ink, b: C.brass, d: C.nightSea3, w: C.white }
	);
	set(scene, NOSE + 4, MID - 5, C.gold);
}

/**
 * Scales of bottle caps and sea glass pressed into the planks.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawCaps(scene, random) {
	const colours = [C.gold, C.brickRedLight, C.dayWaveDeep, C.grassLight];
	for (let i = 0; i < 40; i++) {
		const x = NOSE + 12 + Math.floor(random() * (TAIL - NOSE - 14));
		const y = MID - 8 + Math.floor(random() * 16);
		const colour = colours[Math.floor(random() * colours.length)];
		const plank = get(scene, x, y);
		if (
			plank === DRIFT.main ||
			plank === DRIFT.light ||
			plank === DRIFT.warm
		) {
			set(scene, x, y, colour);
		}
	}
}

/**
 * Rope lashings where the post meets the belly and the tail meets the body.
 * @param {Canvas} scene
 */
function drawLashings(scene) {
	const rope = C.sand;
	for (const [x, y] of [
		[26, Math.round(MID + halfHeight(26) * 0.85) + 2],
		[TAIL - 3, MID - 1],
		[TAIL - 3, MID + 1],
	]) {
		set(scene, x, y, rope);
		set(scene, x + 1, y + 1, rope);
		set(scene, x + 2, y, rope);
	}
}
