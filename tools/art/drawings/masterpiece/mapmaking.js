// Mapmaking: a big globe in a brass meridian ring on a turned wooden stand, half painted with the Americas and half still blank white, a printed paper gore being pasted on, paint pots and a brush on a stool in the sunlight from a window on the right.
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
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * Four tones of one surface, from the side facing the window to the deepest shade.
 * @typedef {[Colour, Colour, Colour, Colour]} Tones
 */

/** The floorboards start at this row. */
const FLOOR = 51;

/** The globe's centre and radius, and the brass ring round it (from its inner to its outer radius). */
const GLOBE = { x: 27, y: 26, r: 19 };
const RING = { inner: 20.5, outer: 22.6 };

/** How far the globe's axis leans to the right, and the longitude at the middle of the face we see. */
const TILT = (20 * Math.PI) / 180;
const FACING = -50;

/**
 * Which longitudes are done: everything west of PAINTED is painted; the gore from PAINTED to GORE_EAST is pasted down
 * as far south as GORE_SOUTH, and its lower end still hangs free; everything else is bare white plaster.
 */
const PAINTED = -50;
const GORE_EAST = -20;
const GORE_SOUTH = -35;

/** The window on the right, the light's source, and the stool with the paint pots under it. */
const WINDOW = { x: 49, y: 3, w: 18, h: 30 };
const STOOL = { left: 45, right: 63, top: 47 };

/** The world map in five-degree cells, from 150°W (left) to 0° (right) and from the north pole down: sea, green land, tan land or ice. */
const MAP_WEST = -150;
const MAP = [
	'..............................',
	'............iiiii.iiiiiiii....',
	'......gggggggg..iiiiiiiiii....',
	'.....ggggg.ggggg..iiiiiiii....',
	'gggggggggggggg.ggg.iiii.......',
	'ggggggggggg.....g...ii...gg...',
	'....ggggggg....ggg...........g',
	'....ggggggggg.ggggg.........gg',
	'.....gggggggggggggg..........g',
	'.....gttgggggggg............gg',
	'.....gtttgggggg.............gg',
	'......ttttgggg..............gt',
	'.......ttt...g.............ttt',
	'.........gg..gg............ttt',
	'..........ggg.gg...........ttt',
	'............g..............ggg',
	'.............gggggg........ggg',
	'..............gggggg..........',
	'..............gggggggg........',
	'..............ggggggggg.......',
	'...............ggggggg........',
	'................tggggg........',
	'................tggggg........',
	'................tggg..........',
	'................tggg..........',
	'...............gggg...........',
	'...............gt.............',
	'...............gt.............',
	'...............gt.............',
	'..............................',
	'..................i...........',
	'................ii............',
	'........iiiiiiiiii........iiii',
	'..iiiiiiiiiiiiiiii......iiiiii',
	'..iiiiiiiiiiiiiiiiiiiiiiiiiiii',
	'..iiiiiiiiiiiiiiiiiiiiiiiiiiii',
];

/** The globe's surfaces: the painted sea, the green and tan lands, the ice, and the bare white plaster. */
const SEA = /** @type {Tones} */ ([
	mix(C.daySea1, C.dayWave, 0.4),
	C.daySea1,
	C.daySea2,
	C.daySea3,
]);
const GREEN = /** @type {Tones} */ ([
	C.grassLight,
	C.grass,
	C.grassShade,
	C.forestFloor,
]);
const TAN = /** @type {Tones} */ ([
	C.sandLight,
	C.sand,
	C.sandShade,
	mix(C.sandShade, C.timber, 0.4),
]);
const ICE = /** @type {Tones} */ ([
	C.snow,
	C.snowShade,
	mix(C.snowShade, C.stone, 0.5),
	C.stone,
]);
const PLASTER = /** @type {Tones} */ ([
	C.white,
	C.creamLight,
	C.cream,
	C.creamShade,
]);

/** The earthenware of the paint pots, from lit to shaded. */
const CLAY = [
	mix(C.brickRedLight, C.sandLight, 0.45),
	mix(C.brickRed, C.sandShade, 0.4),
	mix(C.brickRedShade, C.timber, 0.4),
];

/** The brass of the ring and the pins, from lit to dark. */
const BRASS = /** @type {Tones} */ ([C.lampGlow, C.gold, C.brass, C.lampFrame]);

/** The globe's shadow on the wall behind it and on the floor. */
const WALL_SHADOW = mix(C.plaster, C.plasterShade, 0.65);
const FLOOR_SHADOW = mix(C.floorShade, C.wood, 0.5);

/** The light from the window: up and to the right, and a little towards us. */
const LIGHT = normalise([0.62, 0.38, 0.68]);

/**
 * Draws the Mapmaking masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(3311);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'plaster',
		window: { ...WINDOW, time: 'day' },
	});
	drawShadows(layer);

	const stand = createCanvas(64, 64);
	drawStand(stand);
	drawStool(stand);
	outline(stand, C.ink);
	underlay(stand, layer);

	const scene = createCanvas(64, 64);
	drawGlobe(scene);
	drawRing(scene);
	drawPots(scene);
	outline(scene, C.ink);
	underlay(scene, stand);

	// The loose end of the gore, peeling away from the globe, and the brush each get their own edge.
	const loose = createCanvas(64, 64);
	drawLooseGore(loose);
	outline(loose, C.ink);
	const brush = createCanvas(64, 64);
	drawBrush(brush);
	outline(brush, C.ink);
	for (const top of [loose, brush]) {
		for (let i = 0; i < top.p.length; i++) {
			if (top.p[i]) {
				scene.p[i] = top.p[i];
			}
		}
	}

	glow(scene, {
		x: 62,
		y: 14,
		radius: 40,
		colour: C.lampGlow,
		strength: 0.3,
		steps: 2,
		skip: [C.ink, C.white, ...SEA, ...GREEN, ...TAN, ...ICE, ...PLASTER],
	});
	drawGlints(scene);
	return scene;
}

/**
 * Scales a vector to length 1.
 * @param {number[]} v
 * @returns {number[]}
 */
function normalise(v) {
	const length = Math.hypot(...v);
	return v.map((n) => n / length);
}

/**
 * Picks a tone for a surface by how squarely it faces the window.
 * @param {Tones} tones
 * @param {number} facing - The cosine between the surface and the light, -1 to 1
 * @returns {Colour}
 */
function tone(tones, facing) {
	if (facing > 0.82) {
		return tones[0];
	}
	if (facing > 0.42) {
		return tones[1];
	}
	if (facing > 0.06) {
		return tones[2];
	}
	return tones[3];
}

/**
 * Turns a point on the globe's face into latitude and longitude, undoing the axis's lean.
 * @param {number} u - Across the face, -1 to 1
 * @param {number} v - Up the face, -1 to 1
 * @param {number} w - Towards us, 0 to 1
 * @returns {{ lat: number, lon: number }} In degrees
 */
function toEarth(u, v, w) {
	const x = u * Math.cos(TILT) - v * Math.sin(TILT);
	const y = u * Math.sin(TILT) + v * Math.cos(TILT);
	return {
		lat: (Math.asin(Math.max(-1, Math.min(1, y))) * 180) / Math.PI,
		lon: FACING + (Math.atan2(x, w) * 180) / Math.PI,
	};
}

/**
 * Finds where a latitude and longitude sit on the picture.
 * @param {number} lat - Degrees
 * @param {number} lon - Degrees
 * @returns {{ x: number, y: number }}
 */
function toPicture(lat, lon) {
	const phi = (lat * Math.PI) / 180;
	const lambda = ((lon - FACING) * Math.PI) / 180;
	const x = Math.cos(phi) * Math.sin(lambda);
	const y = Math.sin(phi);
	return {
		x: GLOBE.x + (x * Math.cos(TILT) + y * Math.sin(TILT)) * GLOBE.r,
		y: GLOBE.y - (-x * Math.sin(TILT) + y * Math.cos(TILT)) * GLOBE.r,
	};
}

/**
 * The surface of the world at a point: sea, green or tan land, or ice.
 * @param {number} lat
 * @param {number} lon
 * @returns {Tones}
 */
function earth(lat, lon) {
	const row = Math.min(
		MAP.length - 1,
		Math.max(0, Math.floor((90 - lat) / 5))
	);
	const col = Math.floor((lon - MAP_WEST) / 5);
	const cell = col >= 0 && col < MAP[0].length ? MAP[row][col] : '.';
	if (cell === 'g') {
		return GREEN;
	}
	if (cell === 't') {
		return TAN;
	}
	if (cell === 'i') {
		return ICE;
	}
	return SEA;
}

/**
 * The globe: the painted western half, the pasted part of the new gore, and the bare plaster beyond,
 * shaded as a ball lit from the window, with the equator ruled across the painted half.
 * @param {Canvas} scene
 */
function drawGlobe(scene) {
	const { x: cx, y: cy, r } = GLOBE;
	/** @type {Map<number, { tones: Tones, facing: number, lat: number, lon: number }>} */
	const surface = new Map();
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const u = (x + 0.5 - cx) / r;
			const v = -(y + 0.5 - cy) / r;
			const d = u * u + v * v;
			if (d >= 1) {
				continue;
			}
			const w = Math.sqrt(1 - d);
			const { lat, lon } = toEarth(u, v, w);
			const facing = u * LIGHT[0] + v * LIGHT[1] + w * LIGHT[2];
			const pasted =
				lon >= PAINTED && lon < GORE_EAST && lat > GORE_SOUTH;
			const tones = lon < PAINTED || pasted ? earth(lat, lon) : PLASTER;
			surface.set(y * 64 + x, { tones, facing, lat, lon });
		}
	}
	for (const [i, { tones, facing, lat, lon }] of surface) {
		const x = i % 64;
		const y = Math.floor(i / 64);
		let colour = tone(tones, facing);
		const land = tones === GREEN || tones === TAN;
		const neighbours = [i - 1, i + 1, i - 64, i + 64].map((n) =>
			surface.get(n)
		);
		if (land && neighbours.some((n) => n && n.tones === SEA)) {
			// The coast, inked a step darker.
			colour = tones[Math.min(3, tones.indexOf(colour) + 1)];
		} else if (
			tones === SEA &&
			lat >= 0 &&
			neighbours[3] &&
			neighbours[3].lat < 0
		) {
			// The equator, ruled across the sea.
			colour = tones[Math.min(3, tones.indexOf(colour) + 1)];
		} else if (tones === PLASTER && pencilled(lat, lon, neighbours)) {
			// The maker's pencil lines on the bare plaster, where the next gores will go.
			colour = tones[Math.min(3, tones.indexOf(colour) + 1)];
		}
		set(scene, x, y, colour);
	}
	drawSeams(scene);
}

/**
 * Tells whether a pixel of bare plaster carries a pencil line: the equator, or a gore's edge every thirty degrees.
 * @param {number} lat
 * @param {number} lon
 * @param {({ lat: number, lon: number } | undefined)[]} neighbours - Left, right, above and below
 * @returns {boolean}
 */
function pencilled(lat, lon, neighbours) {
	const [, right, , below] = neighbours;
	const equator = lat >= 0 && below !== undefined && below.lat < 0;
	const gore = (l = 0) => Math.floor((l - GORE_EAST) / 30);
	const seam =
		right !== undefined && gore(lon) !== gore(right.lon) && lat > -80;
	return equator || seam;
}

/**
 * The new gore's edge where it lies on the bare plaster: the paper's thin shadow.
 * @param {Canvas} scene
 */
function drawSeams(scene) {
	for (let lat = 88; lat > GORE_SOUTH; lat -= 0.5) {
		const east = toPicture(lat, GORE_EAST);
		const x = Math.floor(east.x);
		const y = Math.floor(east.y);
		if (PLASTER.includes(/** @type {Colour} */ (get(scene, x, y)))) {
			set(scene, x, y, C.creamShade);
		}
	}
}

/**
 * The free end of the gore: a tapering strip of printed paper peeling off the globe and curling at its tip to show its white back.
 * @param {Canvas} loose
 */
function drawLooseGore(loose) {
	const a = toPicture(GORE_SOUTH, PAINTED);
	const b = toPicture(GORE_SOUTH, GORE_EAST);
	const steps = 80;
	for (let i = 0; i <= steps; i++) {
		const s = i / steps;
		// The strip's centre bows out and down, away from the ball.
		const mx = (a.x + b.x) / 2 + s * 9 + Math.sin(s * Math.PI) * 2;
		const my = (a.y + b.y) / 2 + s * 15;
		const half = (Math.hypot(b.x - a.x, b.y - a.y) / 2) * (1 - s * 0.85);
		const ax = (b.x - a.x) / Math.hypot(b.x - a.x, b.y - a.y);
		const ay = (b.y - a.y) / Math.hypot(b.x - a.x, b.y - a.y);
		for (let t = -half; t <= half; t += 0.25) {
			const x = Math.floor(mx + ax * t);
			const y = Math.floor(my + ay * t);
			let colour = t < -half * 0.3 ? SEA[1] : SEA[0];
			if (s > 0.82) {
				colour = t < 0 ? C.creamLight : C.cream;
			} else if (Math.abs(t) < 0.6 && s > 0.15 && s < 0.4) {
				// A scrap of land printed on the strip: a southern island.
				colour = GREEN[1];
			}
			set(loose, x, y, colour);
		}
	}
	// The paste still wet along the edge where the strip lifts away.
	line(
		loose,
		Math.round(a.x),
		Math.round(a.y),
		Math.round(b.x) - 1,
		Math.round(b.y),
		SEA[0]
	);
}

/**
 * The brass meridian ring round the globe, ruled with tick marks, with the pins that hold the axis.
 * @param {Canvas} scene
 */
function drawRing(scene) {
	const { x: cx, y: cy } = GLOBE;
	const reach = Math.ceil(RING.outer);
	for (let y = cy - reach; y <= cy + reach; y++) {
		for (let x = cx - reach; x <= cx + reach; x++) {
			const dx = x + 0.5 - cx;
			const dy = y + 0.5 - cy;
			const d = Math.hypot(dx, dy);
			if (d < RING.inner || d >= RING.outer) {
				continue;
			}
			// The outer edge catches the light on the upper right, the inner edge on the lower left.
			const outward = d > (RING.inner + RING.outer) / 2;
			const facing =
				((dx * LIGHT[0] - dy * LIGHT[1]) / d) * (outward ? 1 : -0.4) +
				0.3;
			let colour = tone(BRASS, facing);
			// A tick every ten degrees on the outer edge; no numbers.
			const angle = (Math.atan2(dy, dx) * 180) / Math.PI + 180;
			if (outward && angle % 10 < 2.2) {
				colour = BRASS[3];
			}
			set(scene, x, y, colour);
		}
	}
	// The pins at the poles, bridging the gap between the ball and the ring, each with a round cap outside it.
	for (const sign of [1, -1]) {
		const px = cx + sign * Math.sin(TILT) * GLOBE.r;
		const py = cy - sign * Math.cos(TILT) * GLOBE.r;
		for (let t = -0.5; t <= 4.5; t += 0.5) {
			set(
				scene,
				Math.floor(px + sign * Math.sin(TILT) * t),
				Math.floor(py - sign * Math.cos(TILT) * t),
				C.brass
			);
		}
		const kx = Math.floor(px + sign * Math.sin(TILT) * 5.5);
		const ky = Math.floor(py - sign * Math.cos(TILT) * 5.5);
		rect(scene, kx - 1, ky - 1, 3, 3, C.gold);
		set(scene, kx - 1, ky - 1, C.lampGlow);
		set(scene, kx + 1, ky + 1, C.amber);
	}
}

/**
 * The turned walnut stand: a brass cup under the ring, a baluster, a round base and three splayed legs.
 * @param {Canvas} stand
 */
function drawStand(stand) {
	const cx = GLOBE.x;
	const top = GLOBE.y + Math.ceil(RING.outer);
	// Half-widths of the turned column, row by row from the cup down to the base.
	const profile = [2, 2, 3, 4, 4, 4, 3, 2, 2, 3, 5, 5];
	profile.forEach((half, j) => {
		for (let x = cx - half; x <= cx + half; x++) {
			const across = (x + 0.5 - cx) / (half + 0.5);
			let colour = C.timber;
			if (across > 0.4) {
				colour = C.timberLight;
			} else if (across < -0.45) {
				colour = C.timberShade;
			}
			if (j < 2) {
				colour = across > 0.2 ? C.gold : C.brass;
			}
			set(stand, x, top + j, colour);
		}
	});
	// A groove under the bulb and the base's lit rim.
	const groove = top + 6;
	for (let x = cx - 3; x <= cx + 3; x++) {
		set(stand, x, groove, C.timberShade);
	}
	const base = top + profile.length - 2;
	for (let x = cx - 5; x <= cx + 5; x++) {
		set(stand, x, base, x > cx ? C.timberLight : C.timber);
	}
	// Three legs splaying out from under the base to the floor, each with a round foot.
	const foot = top + profile.length;
	for (const [dx, length] of [
		[-1, 9],
		[1, 9],
		[0, 4],
	]) {
		const ex = cx + dx * length;
		const ey = dx === 0 ? 63 : 61;
		line(
			stand,
			cx + dx * 3,
			foot,
			ex,
			ey,
			dx > 0 ? C.timberLight : C.timber
		);
		line(stand, cx + dx * 3, foot + 1, ex, ey + 1, C.timberShade);
		if (dx !== 0) {
			rect(stand, ex - 1, ey, 3, 2, C.timber);
			set(stand, ex + 1, ey, C.timberLight);
		}
	}
}

/**
 * The stool under the window: a lit top on four legs.
 * @param {Canvas} stand
 */
function drawStool(stand) {
	const { left, right, top } = STOOL;
	rect(stand, left, top, right - left + 1, 1, C.timberLight);
	rect(stand, left, top + 1, right - left + 1, 2, C.timber);
	rect(stand, left, top + 3, right - left + 1, 1, C.timberShade);
	for (const x of [left + 1, right - 3]) {
		rect(stand, x, top + 4, 2, 64 - top - 4, C.timber);
		rect(stand, x + 1, top + 4, 1, 64 - top - 4, C.timberLight);
	}
	rect(stand, left + 4, top + 4, 2, 64 - top - 6, C.timberShade);
}

/**
 * The paint pots on the stool, open to show blue for the seas and green and tan for the lands, and a brush resting across them.
 * @param {Canvas} scene
 */
function drawPots(scene) {
	const pots = [
		{ x: 48, paint: SEA },
		{ x: 54, paint: GREEN },
		{ x: 60, paint: TAN },
	];
	const top = STOOL.top - 7;
	// Half-widths of a round-bellied pot, row by row: the far rim, the paint, the near rim, the belly and the foot.
	const profile = [2, 2, 2, 3, 3, 2, 2];
	for (const { x, paint } of pots) {
		profile.forEach((half, j) => {
			for (let i = -half; i <= half; i++) {
				let colour = CLAY[1];
				if (i >= half - 1 && i > 0) {
					colour = CLAY[0];
				} else if (i === -half) {
					colour = CLAY[2];
				}
				if (j === 0) {
					colour = CLAY[2];
				} else if (j === 1 && Math.abs(i) < 2) {
					colour = i < 0 ? paint[1] : paint[0];
				} else if (j === 2) {
					colour = i > 0 ? C.sandLight : CLAY[0];
				}
				set(scene, x + i, top + j, colour);
			}
		});
		// A drip of paint down the side.
		set(scene, x - 1, top + 3, paint[1]);
		set(scene, x - 1, top + 4, paint[2]);
	}
}

/**
 * The brush, resting across the first two pots: wet blue bristles, a brass ferrule and a long handle.
 * @param {Canvas} brush
 */
function drawBrush(brush) {
	const y = STOOL.top - 8;
	rect(brush, 48, y, 10, 1, C.timberLight);
	set(brush, 47, y, C.gold);
	rect(brush, 45, y, 2, 1, C.wood);
	set(brush, 44, y, SEA[1]);
}

/**
 * The shadows the globe and its stand throw away from the window: a round one on the wall and a long one on the floor.
 * @param {Canvas} layer
 */
function drawShadows(layer) {
	for (let y = 0; y < FLOOR - 2; y++) {
		for (let x = 0; x < WINDOW.x; x++) {
			const d = Math.hypot(
				x + 0.5 - (GLOBE.x - 8),
				y + 0.5 - (GLOBE.y + 3)
			);
			if (d < GLOBE.r + 2) {
				set(layer, x, y, WALL_SHADOW);
			}
		}
	}
	for (let y = FLOOR + 1; y < 64; y++) {
		for (let x = 0; x < 40; x++) {
			const e = ((x + 0.5 - 16) / 15) ** 2 + ((y + 0.5 - 58) / 4) ** 2;
			if (e < 1) {
				set(layer, x, y, FLOOR_SHADOW);
			}
		}
	}
}

/**
 * The sun's brightest touches: on the plaster where it faces the window, and on the brass.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[38, 14],
		[39, 15],
		[37, 13],
		[46, 11],
		[47, 12],
	]) {
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.white);
		}
	}
}
