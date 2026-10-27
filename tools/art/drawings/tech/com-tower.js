// Com Tower: a dish antenna, a small dish, a horn and whip aerials on a mast top at night, signal rings pulsing out over far towns.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A dish aerial: the rim's centre and radius, how round the rim looks (its short axis over its long one),
 * the unit vector it faces along, the one along its rim's long axis, and how far its bowl reaches back.
 * @typedef {Object} Dish
 * @property {number} x
 * @property {number} y
 * @property {number} r
 * @property {number} round
 * @property {{ x: number, y: number }} face
 * @property {{ x: number, y: number }} across
 * @property {number} depth
 */

/**
 * Sets up a dish facing the given way.
 * @param {number} x - The rim's centre column
 * @param {number} y - The rim's centre row
 * @param {number} r - The rim's radius
 * @param {number} round - How round the rim looks, from 0 (edge-on) to 1 (face-on)
 * @param {number} facing - The way it faces, as an angle in the picture
 * @param {number} depth - How far the bowl reaches back
 * @returns {Dish}
 */
function makeDish(x, y, r, round, facing, depth) {
	const face = { x: Math.cos(facing), y: Math.sin(facing) };
	return { x, y, r, round, face, across: { x: -face.y, y: face.x }, depth };
}

/** The last sky row; the dark plain far below starts under it. */
const HORIZON = 50;

/** Where the moon hangs, off the top-left, lighting the dishes from that side. */
const MOON = { x: 10, y: 9 };

/** The big dish, facing left and a little up. */
const DISH = makeDish(30, 35, 20, 0.58, Math.PI + 0.2, 8);

/** The small dish on the platform, tipped up to the sky. */
const SMALL_DISH = makeDish(41, 7, 5.5, 0.62, Math.PI + 0.9, 3);

/** The feed horn at the big dish's focus, held out in front of it on struts. */
const FEED = {
	x: Math.round(DISH.x + DISH.face.x * 13.5),
	y: Math.round(DISH.y + DISH.face.y * 13.5),
};

/** The mast's two legs and the row its platform's deck sits on. */
const MAST = { left: 50, right: 59, deck: 14 };

/** The red warning light on top of the tallest aerial. */
const BEACON = { x: 55, y: 4 };

/** The top of the low hill on the left. */
const HILL = { x: 5, y: 41 };

/** Moonlit steel, from the brightest gleam down to the deepest shade. */
const STEEL = [
	mix(C.white, C.moon, 0.5),
	mix(C.stoneLight, C.white, 0.45),
	C.stoneLight,
	mix(C.stoneLight, C.stone, 0.5),
	C.stone,
	C.stoneMid,
	C.stoneShade,
	mix(C.stoneShade, C.roof, 0.6),
];

/** The red of the beacon falling on the steel nearest it. */
const RED_STEEL = mix(C.stoneShade, C.brickRedLight, 0.4);

/** The signal's glowing rings. */
const SIGNAL = C.tealLight;
const SIGNAL_DIM = mix(C.tealLight, C.teal, 0.5);

/**
 * Draws the Com Tower tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4127);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 34,
		starRows: 44,
		moon: MOON,
	});
	drawHaze(layer);
	drawLand(layer, random);
	drawSignal(layer);

	drawMast(scene);
	drawPlatform(scene);
	drawAerials(scene);
	drawSmallDish(scene);
	drawMount(scene);
	drawDish(scene, DISH);
	drawStruts(scene);
	drawFeed(scene);
	drawHorn(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: MOON.x,
		y: MOON.y,
		radius: 13,
		colour: C.moon,
		strength: 0.16,
		steps: 2,
		skip: [C.ink, C.moon, C.moonRim],
	});
	glow(scene, {
		x: BEACON.x,
		y: BEACON.y,
		radius: 11,
		colour: C.brickRedLight,
		strength: 0.5,
		steps: 4,
	});
	glow(scene, {
		x: FEED.x,
		y: FEED.y,
		radius: 7,
		colour: C.tealLight,
		strength: 0.35,
		steps: 3,
		skip: [C.ink],
	});
	drawBeacon(scene);
	drawGleams(scene);
	return scene;
}

/**
 * Where a point sits against a dish: along its rim's long axis (`u`) and along the way it faces (`v`).
 * @param {Dish} dish
 * @param {number} dx - Column offset from the centre it is measured from
 * @param {number} dy - Row offset from that centre
 * @returns {{ u: number, v: number }}
 */
function dishAxes(dish, dx, dy) {
	return {
		u: dx * dish.across.x + dy * dish.across.y,
		v: dx * dish.face.x + dy * dish.face.y,
	};
}

/**
 * How far out a point lies on a dish's rim ellipse: below 1 inside, 1 on the rim.
 * @param {Dish} dish
 * @param {number} dx - Column offset from the dish's centre
 * @param {number} dy - Row offset from the dish's centre
 * @param {number} [scale=1] - Shrinks the rim, for the bowl's back
 * @returns {number}
 */
function rimDistance(dish, dx, dy, scale = 1) {
	const { u, v } = dishAxes(dish, dx, dy);
	const r = dish.r * scale;
	return Math.sqrt((u / r) ** 2 + (v / (r * dish.round)) ** 2);
}

/**
 * A faint warm glow of far-off towns along the horizon.
 * @param {Canvas} layer
 */
function drawHaze(layer) {
	for (let y = HORIZON - 4; y <= HORIZON; y++) {
		const t = 0.06 * (y - (HORIZON - 5));
		for (let x = 0; x < 64; x++) {
			const behind = get(layer, x, y);
			if (behind) {
				set(layer, x, y, mix(behind, C.amber, t));
			}
		}
	}
}

/**
 * The land far below: a dark plain with a low hill on the left, and the lights of a few towns.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawLand(layer, random) {
	// The hill.
	for (let x = 0; x < 64; x++) {
		const top = Math.round(HILL.y + ((x - HILL.x) / 6) ** 2 * 1.3);
		for (let y = Math.max(top, 0); y <= HORIZON; y++) {
			set(layer, x, y, y === top ? C.headlandRidge : C.headland);
		}
	}
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, y === HORIZON + 1 ? C.headland : C.night);
		}
	}
	// The towns: clusters of single lights, never touching, dimmer towards the horizon.
	const towns = [
		{ x: 13, y: 53, spread: 5, count: 6 },
		{ x: 28, y: 57, spread: 7, count: 10 },
		{ x: 8, y: 61, spread: 6, count: 7 },
		{ x: 40, y: 52, spread: 3, count: 3 },
		{ x: 62, y: 53, spread: 2, count: 2 },
	];
	for (const town of towns) {
		for (let i = 0; i < town.count; i++) {
			const x = Math.round(town.x + (random() - 0.5) * 2 * town.spread);
			const y = Math.round(town.y + (random() - 0.5) * town.spread * 0.7);
			const colour = random() > 0.6 ? C.lampGlow : C.gold;
			const crowded = [
				[0, 0],
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			].some(([dx, dy]) => get(layer, x + dx, y + dy) !== C.night);
			if (!crowded) {
				const far = y < HORIZON + 5;
				set(layer, x, y, far ? mix(colour, C.amber, 0.6) : colour);
			}
		}
	}
}

/**
 * The signal: glowing rings spreading out from the feed horn the way the dish faces, each a clean arc
 * with a soft halo, fading at its ends.
 * @param {Canvas} layer
 */
function drawSignal(layer) {
	const span = 0.6;
	const facing = Math.atan2(DISH.face.y, DISH.face.x);
	const rings = [
		{ r: 6, colour: SIGNAL, halo: 0.4 },
		{ r: 10.5, colour: SIGNAL, halo: 0.32 },
		{ r: 15, colour: SIGNAL_DIM, halo: 0.22 },
		{ r: 19.5, colour: mix(SIGNAL_DIM, C.nightSky4, 0.5), halo: 0 },
	];
	/** @type {Map<number, { colour: Colour, halo: number }>} */
	const arcs = new Map();
	for (const ring of rings) {
		const steps = Math.ceil(ring.r * span * 4);
		for (let i = -steps; i <= steps; i++) {
			const a = facing + (span * i) / steps;
			const x = Math.round(FEED.x + Math.cos(a) * ring.r);
			const y = Math.round(FEED.y + Math.sin(a) * ring.r);
			const end = Math.abs(i) > steps * 0.75;
			const behind = get(layer, x, y);
			if (behind && !arcs.has(y * 64 + x)) {
				arcs.set(y * 64 + x, {
					colour: end ? mix(behind, ring.colour, 0.5) : ring.colour,
					halo: end ? ring.halo / 2 : ring.halo,
				});
			}
		}
	}
	for (const [key, { halo }] of arcs) {
		const x = key % 64;
		const y = Math.floor(key / 64);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const behind = get(layer, x + dx, y + dy);
			if (behind && halo > 0 && !arcs.has((y + dy) * 64 + x + dx)) {
				set(layer, x + dx, y + dy, mix(behind, C.teal, halo));
			}
		}
	}
	for (const [key, { colour }] of arcs) {
		set(layer, key % 64, Math.floor(key / 64), colour);
	}
}

/**
 * The lattice mast: two steel legs with a zigzag of braces, lit from the left, running off the bottom.
 * @param {Canvas} scene
 */
function drawMast(scene) {
	const { left, right, deck } = MAST;
	const top = deck + 2;
	for (let y = top; y < 64; y++) {
		set(scene, left, y, STEEL[2]);
		set(scene, left + 1, y, STEEL[4]);
		set(scene, right, y, STEEL[4]);
		set(scene, right + 1, y, y < top + 12 ? RED_STEEL : STEEL[6]);
	}
	for (let y = top + 11; y < 64; y += 12) {
		line(scene, left + 2, y, right - 1, y, STEEL[3]);
	}
	for (let y = top; y < 64; y += 24) {
		line(scene, left + 2, y + 1, right - 1, y + 11, STEEL[4]);
		line(scene, right - 1, y + 12, left + 2, y + 23, STEEL[4]);
	}
}

/**
 * The platform at the mast top: a steel deck on a bracket.
 * @param {Canvas} scene
 */
function drawPlatform(scene) {
	const from = 38;
	const { deck } = MAST;
	rect(scene, from, deck, 64 - from, 1, STEEL[1]);
	rect(scene, from, deck + 1, 64 - from, 1, STEEL[4]);
	rect(scene, from + 1, deck + 2, 63 - from, 1, STEEL[6]);
	line(scene, from + 2, deck + 3, MAST.left - 1, deck + 9, STEEL[5]);
}

/**
 * The aerials on the platform: a tall pole for the beacon between a whip with crossbars and a plain whip.
 * @param {Canvas} scene
 */
function drawAerials(scene) {
	const { deck } = MAST;
	// The beacon's pole, two pixels thick.
	line(scene, BEACON.x, BEACON.y + 2, BEACON.x, deck - 1, STEEL[2]);
	line(scene, BEACON.x + 1, BEACON.y + 2, BEACON.x + 1, deck - 1, RED_STEEL);
	// A whip with three crossbars.
	line(scene, 50, 2, 50, deck - 1, STEEL[3]);
	for (const y of [3, 5, 7]) {
		line(scene, 49, y, 51, y, STEEL[3]);
	}
	// A plain whip on the right.
	line(scene, 61, 6, 61, deck - 1, STEEL[4]);
	set(scene, 61, 5, STEEL[2]);
}

/**
 * The small dish on the platform, on a short post, with a stub of a feed.
 * @param {Canvas} scene
 */
function drawSmallDish(scene) {
	const { x, y, face } = SMALL_DISH;
	line(scene, x + 2, y + 2, x + 2, MAST.deck - 1, STEEL[5]);
	drawDish(scene, SMALL_DISH);
	const tip = {
		x: Math.round(x + face.x * 4),
		y: Math.round(y + face.y * 4),
	};
	line(scene, x, y, tip.x, tip.y, STEEL[6]);
	set(scene, tip.x, tip.y, STEEL[3]);
}

/**
 * The mount: an arm from the big dish's back to the mast, with a plate bolted to the leg.
 * @param {Canvas} scene
 */
function drawMount(scene) {
	const y = DISH.y - 2;
	const from = DISH.x + 6;
	rect(scene, from, y, MAST.left - from, 5, STEEL[4]);
	rect(scene, from, y, MAST.left - from, 1, STEEL[2]);
	rect(scene, from, y + 4, MAST.left - from, 1, STEEL[6]);
	rect(scene, MAST.left - 2, y - 3, 2, 11, STEEL[3]);
	rect(scene, MAST.left - 2, y - 3, 1, 11, STEEL[2]);
	set(scene, MAST.left - 2, y - 2, STEEL[6]);
	set(scene, MAST.left - 2, y + 6, STEEL[6]);
}

/**
 * A dish: its back bulging out behind the rim, and its bowl, lit inside from the moon's side.
 * @param {Canvas} scene
 * @param {Dish} dish
 */
function drawDish(scene, dish) {
	const { x: cx, y: cy, r, depth, face } = dish;
	const reach = Math.ceil(r + depth + 1);
	for (let y = cy - reach; y <= cy + reach; y++) {
		for (let x = cx - reach; x <= cx + reach; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const rho = rimDistance(dish, dx, dy);
			if (rho < 1) {
				set(scene, x, y, bowlTone(dish, dx, dy, rho));
				continue;
			}
			// The back: the bowl's outside, shrinking towards its deepest point behind the rim.
			for (let t = 0.05; t < 1; t += 0.05) {
				const bx = dx + face.x * depth * t;
				const by = dy + face.y * depth * t;
				if (rimDistance(dish, bx, by, Math.sqrt(1 - t)) < 1) {
					set(scene, x, y, backTone(dish, bx, by, t));
					break;
				}
			}
		}
	}
}

/**
 * Picks the tone for a point on a dish's back, which faces away from the moon: dark, with the beacon's red on its top.
 * @param {Dish} dish
 * @param {number} bx - Column offset from the ring of the back it lies on
 * @param {number} by - Row offset from that ring
 * @param {number} t - How far back towards the deepest point, from 0 to 1
 * @returns {Colour}
 */
function backTone(dish, bx, by, t) {
	const { u } = dishAxes(dish, bx, by);
	if (u > dish.r * 0.55 * Math.sqrt(1 - t)) {
		return RED_STEEL;
	}
	return t < 0.3 ? STEEL[5] : STEEL[6];
}

/**
 * Picks the tone for a point in a dish's bowl. The rim's lip catches the moon on its side, the rim casts a
 * crescent of shadow just inside it, and the far inner wall, which faces the moon, is brightest.
 * @param {Dish} dish
 * @param {number} dx - Column offset from the dish's centre
 * @param {number} dy - Row offset from the dish's centre
 * @param {number} rho - How far out towards the rim, 0 at the centre and 1 at the rim
 * @returns {Colour}
 */
function bowlTone(dish, dx, dy, rho) {
	const toward = (dx + dy) / (dish.r * Math.SQRT2);
	// A small dish is too small for shading: a lit lip, a dark lip and two tones inside.
	if (dish.r < 8) {
		if (rho > 0.72) {
			return toward < 0.1 ? STEEL[0] : STEEL[5];
		}
		return toward > 0.05 ? STEEL[1] : STEEL[3];
	}
	const lip = 1 - Math.min(0.1, 1.4 / dish.r);
	if (rho > lip) {
		if (toward < -0.62) {
			return C.white;
		}
		return toward < -0.15 ? STEEL[0] : toward < 0.25 ? STEEL[3] : STEEL[5];
	}
	// The rim's shadow: points whose way to the moon leaves the bowl.
	const shadow = dish.r * 0.22;
	if (rimDistance(dish, dx - shadow, dy - shadow) > lip) {
		const deep = rimDistance(dish, dx - shadow / 2, dy - shadow / 2) > lip;
		return deep ? STEEL[7] : STEEL[6];
	}
	if (rho < 0.12) {
		return STEEL[5];
	}
	let index = toward > 0.35 ? 1 : toward > 0.05 ? 2 : toward > -0.25 ? 3 : 4;
	if (rho > 0.5 && rho < 0.58) {
		index += 1;
	}
	if (rho > 0.62 && rho < 0.85 && toward > 0.42) {
		index = 0;
	}
	return STEEL[index];
}

/**
 * The three struts holding the feed: from the top and bottom of the rim and from its far side.
 * @param {Canvas} scene
 */
function drawStruts(scene) {
	const { x: cx, y: cy, r, round, face, across } = DISH;
	/** @type {[number, number][]} */
	const ends = [
		[cx + across.x * r * 0.92, cy + across.y * r * 0.92],
		[cx - across.x * r * 0.92, cy - across.y * r * 0.92],
		[cx - face.x * r * round * 0.85, cy - face.y * r * round * 0.85],
	];
	for (const [x, y] of ends) {
		line(scene, Math.round(x), Math.round(y), FEED.x, FEED.y, STEEL[6]);
	}
}

/**
 * The feed horn at the focus: a small steel can with its mouth turned back towards the dish.
 * @param {Canvas} scene
 */
function drawFeed(scene) {
	const { x, y } = FEED;
	rect(scene, x - 2, y - 2, 4, 5, STEEL[3]);
	rect(scene, x - 2, y - 2, 4, 1, STEEL[1]);
	rect(scene, x - 2, y - 1, 1, 4, STEEL[2]);
	rect(scene, x - 1, y + 2, 3, 1, STEEL[5]);
	rect(scene, x + 2, y - 3, 1, 7, STEEL[5]);
	rect(scene, x + 3, y - 3, 1, 7, STEEL[6]);
}

/**
 * A horn aerial bolted to the mast below the dish, flaring out to the left, its square mouth half turned to us.
 * @param {Canvas} scene
 */
function drawHorn(scene) {
	const throat = MAST.left;
	const mouth = 43;
	const mid = 56;
	// The body: a top face in the moonlight and a side face in shade.
	for (let x = mouth + 3; x < throat; x++) {
		const half = Math.round(1.5 + (throat - x) * 0.55);
		for (let y = mid - half; y <= mid + half; y++) {
			let colour = STEEL[5];
			if (y === mid - half) {
				colour = STEEL[2];
			} else if (y < mid - half + 3) {
				colour = STEEL[3];
			} else if (y === mid + half) {
				colour = STEEL[6];
			}
			set(scene, x, y, colour);
		}
	}
	// The mouth: a lit frame round a dark opening.
	const half = 6;
	for (let y = mid - half; y <= mid + half; y++) {
		for (let x = mouth; x < mouth + 3; x++) {
			let colour = C.night;
			if (y === mid - half || x === mouth) {
				colour = STEEL[1];
			} else if (y === mid + half || x === mouth + 2) {
				colour = STEEL[5];
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, throat, mid - 2, 1, 4, STEEL[6]);
}

/**
 * The red warning light: a small dome on the tallest aerial, shining.
 * @param {Canvas} scene
 */
function drawBeacon(scene) {
	const { x, y } = BEACON;
	const core = mix(C.brickRedLight, C.white, 0.55);
	rect(scene, x - 1, y, 4, 2, C.brickRed);
	rect(scene, x, y - 1, 2, 3, C.brickRedLight);
	set(scene, x, y, core);
	set(scene, x + 1, y, core);
	// The blink: short rays.
	for (const [dx, dy] of [
		[-3, 0],
		[4, 0],
		[0, -3],
		[1, -3],
	]) {
		const px = x + dx;
		const py = y + dy;
		const behind = get(scene, px, py);
		if (behind) {
			set(scene, px, py, mix(behind, C.brickRedLight, 0.6));
		}
	}
}

/**
 * The last gleams of moonlight on the feed and the mast, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[FEED.x - 2, FEED.y - 2],
		[MAST.left, MAST.deck + 4],
		[MAST.left, MAST.deck + 5],
	]) {
		set(scene, x, y, C.white);
	}
}
