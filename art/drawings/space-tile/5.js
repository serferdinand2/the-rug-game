// Space tile 5: a gold-veined asteroid split open in hard white sunlight, a small mining drone shining its headlamp into the split and drilling at the gold, other rocks of the belt drifting behind.
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

/** The asteroid before it split: its centre, its half-width and half-height, and the tilt of its long axis. */
const ROCK = { x: 25, y: 40, rx: 21, ry: 17, tilt: -0.28 };

/** The split: the column it runs down at the rock's middle row, and how far it leans per row. */
const SPLIT = { x: 30, lean: 0.3 };

/** The broken-off right piece swings open about the foot of the split by this angle, in radians, and drifts right. */
const HINGE = { x: 36, y: 56, angle: 0.42, drift: 1 };

/** The far sun, top left, whose hard white light falls on everything from there. */
const SUN = { x: 7, y: 7 };

/** The sunlight's direction, towards the viewer and the upper left. */
const LIGHT = normalise([-0.6, -0.55, 0.6]);

/** The drone: the top-left corner of its sprite, where its headlamp shines from, and the drill's tip in the gold. */
const DRONE = { x: 34, y: 6 };
const LAMP = { x: 35, y: 13 };
const DRILL_TIP = { x: 29, y: 30 };

/** Black space, with a faint band of the belt's warm dust across it. */
const SPACE = mix(C.ink, C.night, 0.35);
const DUST_FAINT = mix(C.night, C.timberShade, 0.14);
const DUST = mix(C.night, C.timberShade, 0.28);

/** Dim stars, the third brightness after white and starDim. */
const STAR_FAINT = mix(C.starDim, C.night, 0.55);

/** The asteroid's warm grey rock, from the sunlit top to the dark side. */
const ROCK_HI = mix(C.stoneLight, C.white, 0.55);
const ROCK_LIT = mix(C.stoneLight, C.sandShade, 0.2);
const ROCK_BASE = mix(C.stone, C.timberLight, 0.22);
const ROCK_MID = mix(C.stoneMid, C.timber, 0.3);
const ROCK_SHADE = mix(C.stoneShade, C.timberShade, 0.4);
const ROCK_DARK = mix(C.stoneShade, C.night, 0.62);
const ROCK_BLACK = mix(C.night, C.timberShade, 0.3);
const RIM = mix(ROCK_DARK, C.sandShade, 0.3);

/** The broken faces inside the split: the right piece's turned to the sun, the left piece's in shadow. */
const FACE_LIT = mix(C.timberLight, C.stone, 0.4);
const FACE_LIT_EDGE = mix(C.sandShade, C.stoneLight, 0.4);
const FACE = mix(C.timber, C.stoneMid, 0.4);
const FACE_DARK = mix(C.timberShade, C.night, 0.45);

/** The gold: its glints, the metal, its shade and its dull side away from the light. */
const GOLD_HI = C.lampGlow;
const GOLD = C.gold;
const GOLD_SHADE = C.amber;
const GOLD_DEEP = mix(C.amber, C.timberShade, 0.5);

/** The drone's white hull, its red hazard stripes, its solar wing, and its thruster's glow. */
const HULL_HI = C.white;
const HULL = C.snowShade;
const HULL_SHADE = C.stone;
const HULL_DARK = C.stoneShade;
const MARK = C.brickRed;
const CELL = mix(C.nightSea1, C.night, 0.35);
const CELL_LIT = C.nightWaveDeep;
const VISOR = mix(C.tealShade, C.night, 0.45);

/**
 * Draws space tile 5 (1 coin, 1 worker and 8 VP).
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(5503);

	drawSpace(layer, random);
	drawSun(layer);
	const belt = createCanvas(64, 64);
	drawBelt(belt);
	outline(belt, C.ink);
	underlay(belt, layer);

	const rock = createCanvas(64, 64);
	drawRock(rock);
	drawCraters(rock);
	drawGrit(rock, random);
	drawVeins(rock);
	drawSeam(rock, random);
	drawNuggets(rock);
	outline(rock, C.ink);
	underlay(rock, belt);
	glow(rock, {
		x: 39,
		y: 34,
		radius: 8,
		colour: C.gold,
		strength: 0.22,
		steps: 2,
		skip: [
			C.ink,
			SPACE,
			DUST,
			DUST_FAINT,
			GOLD_HI,
			GOLD,
			C.white,
			C.starDim,
		],
	});

	const drone = createCanvas(64, 64);
	drawDrill(drone);
	drawDrone(drone);
	outline(drone, C.ink);
	underlay(drone, rock);

	drawHeadlamp(drone);
	drawSparks(drone, random);
	return drone;
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
 * Black space with a faint band of belt dust running from the lower left to the upper right,
 * and stars in three brightnesses.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const wobble =
				Math.sin(x * 0.35) * 1.5 + Math.sin(x * 0.9 + 1) * 0.8;
			const band = Math.abs(x * 0.6 + y - 56 + wobble);
			let colour = SPACE;
			if (band < 5) {
				colour = DUST;
			} else if (band < 11) {
				colour = DUST_FAINT;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 52; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const level = random();
		set(
			layer,
			x,
			y,
			level > 0.8 ? C.white : level > 0.45 ? C.starDim : STAR_FAINT
		);
	}
	for (const [x, y] of [
		[59, 30],
		[25, 4],
		[53, 59],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, C.starDim);
		}
	}
}

/**
 * The far sun: a small white-hot disc with a long four-point flare, its light washing the corner.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 13,
		colour: C.lampGlow,
		strength: 0.24,
		steps: 3,
	});
	rect(layer, SUN.x - 1, SUN.y - 2, 3, 5, C.white);
	rect(layer, SUN.x - 2, SUN.y - 1, 5, 3, C.white);
	for (let i = 3; i <= 9; i++) {
		for (const [dx, dy] of [
			[i, 0],
			[-i, 0],
			[0, i],
			[0, -i],
		]) {
			set(layer, SUN.x + dx, SUN.y + dy, i < 6 ? C.lampGlow : C.starDim);
		}
	}
}

/**
 * Paints one small lumpy rock of the belt, lit from the sun's side.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} r
 */
function drawPebble(canvas, cx, cy, r) {
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const angle = Math.atan2(y - cy, x - cx);
			const edge = r * (1 + 0.15 * Math.sin(angle * 3 + cx));
			const d = Math.hypot(x - cx, (y - cy) * 1.15);
			if (d > edge) {
				continue;
			}
			const lit = ((cx - x) * 0.7 + (cy - y) * 0.6) / Math.max(1, r);
			set(
				canvas,
				x,
				y,
				lit > 0.35 ? ROCK_LIT : lit > -0.25 ? ROCK_MID : ROCK_DARK
			);
		}
	}
}

/**
 * Other rocks of the belt drifting behind: three near enough to show their shape, three far specks.
 * @param {Canvas} belt
 */
function drawBelt(belt) {
	drawPebble(belt, 57, 22, 3);
	drawPebble(belt, 8, 58, 3);
	drawPebble(belt, 58, 47, 2);
	for (const [x, y] of [
		[21, 11],
		[14, 20],
		[61, 38],
	]) {
		set(belt, x, y, ROCK_MID);
		set(belt, x - 1, y, ROCK_LIT);
	}
}

/**
 * How far out the asteroid's edge lies at an angle, as a share of its ellipse: a lumpy potato.
 * @param {number} angle
 * @returns {number}
 */
function lump(angle) {
	return (
		1 +
		0.07 * Math.sin(angle * 3 + 1.1) +
		0.05 * Math.sin(angle * 5 + 2.3) +
		0.03 * Math.sin(angle * 9 + 0.4)
	);
}

/**
 * Where a point lies on the unbroken asteroid, in its own tilted frame, measured so its edge is 1.
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number, d: number }} The point's place across and down, and its distance out.
 */
function onRock(x, y) {
	const dx = x + 0.5 - ROCK.x;
	const dy = y + 0.5 - ROCK.y;
	const c = Math.cos(ROCK.tilt);
	const s = Math.sin(ROCK.tilt);
	const lx = dx * c + dy * s;
	const ly = -dx * s + dy * c;
	const scale = lump(Math.atan2(ly, lx));
	const u = lx / (ROCK.rx * scale);
	const v = ly / (ROCK.ry * scale);
	return { u, v, d: Math.hypot(u, v) };
}

/**
 * The split's column on a row of the unbroken asteroid, zigzagging as broken rock does.
 * @param {number} y
 * @returns {number}
 */
function splitAt(y) {
	return SPLIT.x + Math.round((y - ROCK.y) * SPLIT.lean + Math.sin(y * 1.1));
}

/**
 * One point of the unbroken asteroid, as it shows at a pixel after the split.
 * @typedef {Object} RockPoint
 * @property {number} x - Its column on the unbroken asteroid
 * @property {number} y - Its row on the unbroken asteroid
 * @property {boolean} right - Whether it is on the broken-off right piece
 * @property {number} face - How many pixels in from the broken face it lies
 */

/**
 * Finds which point of the unbroken asteroid shows at a pixel, after the right piece has swung open.
 * @param {number} x
 * @param {number} y
 * @returns {RockPoint | null} Null where the pixel shows space.
 */
function source(x, y) {
	// The right piece: turn the pixel back about the hinge to find where it came from.
	const c = Math.cos(HINGE.angle);
	const s = Math.sin(HINGE.angle);
	const rx = x - HINGE.drift - HINGE.x;
	const ry = y - HINGE.y;
	const sx = Math.round(HINGE.x + rx * c + ry * s);
	const sy = Math.round(HINGE.y - rx * s + ry * c);
	if (onRock(sx, sy).d <= 1 && sx >= splitAt(sy)) {
		return { x: sx, y: sy, right: true, face: sx - splitAt(sy) };
	}
	if (onRock(x, y).d <= 1 && x < splitAt(y)) {
		return { x, y, right: false, face: splitAt(y) - 1 - x };
	}
	return null;
}

/**
 * How wide a broken face shows on a row: wider at the top, where the split has opened most.
 * @param {number} y
 * @param {boolean} right - The sunward face of the right piece shows wider than the left piece's
 * @returns {number}
 */
function faceWidth(y, right) {
	return Math.max(1, Math.round((HINGE.y - y) * (right ? 0.17 : 0.11)));
}

/**
 * How much sunlight a point of the asteroid catches, from -1 to 1, with bumps breaking the shading.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function sunlight(x, y) {
	const { u, v, d } = onRock(x, y);
	const nz = Math.sqrt(Math.max(0, 1 - d * d));
	const c = Math.cos(-ROCK.tilt);
	const s = Math.sin(-ROCK.tilt);
	const nx = u * c + v * s;
	const ny = -u * s + v * c;
	const bump =
		0.06 * Math.sin(x * 0.7 + y * 0.35) +
		0.05 * Math.sin(y * 0.9 - x * 0.4);
	return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + bump;
}

/**
 * The colour of sunlit rock for an amount of light: a hard terminator, as in airless space.
 * @param {number} light
 * @returns {Colour}
 */
function rockColour(light) {
	if (light > 0.86) {
		return ROCK_HI;
	}
	if (light > 0.66) {
		return ROCK_LIT;
	}
	if (light > 0.44) {
		return ROCK_BASE;
	}
	if (light > 0.24) {
		return ROCK_MID;
	}
	if (light > 0.08) {
		return ROCK_SHADE;
	}
	if (light > -0.1) {
		return ROCK_DARK;
	}
	return ROCK_BLACK;
}

/**
 * The two pieces of the asteroid: warm grey rock lit hard from the upper left, the right piece swung
 * open on its hinge so both broken faces show, the sunward one bright and the other in shadow.
 * @param {Canvas} rock
 */
function drawRock(rock) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const point = source(x, y);
			if (!point) {
				continue;
			}
			const light = sunlight(point.x, point.y);
			const { d } = onRock(point.x, point.y);
			let colour = rockColour(light);
			// Light thrown back by the belt's dust rims the dark side, so it stands off black space.
			if (light < 0.08 && d > 0.93) {
				colour = RIM;
			} else if (light < -0.1 && d > 0.85) {
				colour = ROCK_DARK;
			}
			if (point.face < faceWidth(point.y, point.right)) {
				if (point.right) {
					colour = point.face === 0 ? FACE_LIT_EDGE : FACE_LIT;
				} else {
					colour = point.face === 0 ? FACE_DARK : FACE;
				}
			}
			set(rock, x, y, colour);
		}
	}
}

/**
 * Tells whether a colour belongs to a broken face, where the outside's craters and veins don't reach.
 * @param {Colour | null | undefined} colour
 * @returns {boolean}
 */
function isFace(colour) {
	return (
		colour === FACE_LIT ||
		colour === FACE_LIT_EDGE ||
		colour === FACE ||
		colour === FACE_DARK
	);
}

/**
 * The sunlight on the rock's skin at a pixel, read from the unbroken asteroid.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function lightAt(x, y) {
	const point = source(x, y) ?? { x, y };
	return sunlight(point.x, point.y);
}

/**
 * Craters on both pieces: the wall nearest the sun falls in shadow, the far wall catches the light.
 * @param {Canvas} rock
 */
function drawCraters(rock) {
	for (const [cx, cy, r] of [
		[12, 34, 4],
		[18, 48, 3],
		[8, 43, 2],
		[20, 27, 2.5],
		[26, 52, 2],
		[14, 25, 1.5],
		[42, 34, 3],
		[45, 46, 2],
	]) {
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const d = Math.hypot(x - cx, y - cy);
				const behind = get(rock, x, y);
				if (d > r || !behind || isFace(behind)) {
					continue;
				}
				const side = (x - cx) * LIGHT[0] + (y - cy) * LIGHT[1];
				const light = lightAt(x, y);
				let colour = rockColour(light - (side > 0 ? 0.45 : -0.2));
				if (d > r - 0.9 && side < 0) {
					colour = rockColour(light + 0.3);
				}
				set(rock, x, y, colour);
			}
		}
	}
}

/**
 * Small pits and grit over the sunlit rock.
 * @param {Canvas} rock
 * @param {() => number} random
 */
function drawGrit(rock, random) {
	for (let i = 0; i < 46; i++) {
		const x = 5 + Math.floor(random() * 46);
		const y = 20 + Math.floor(random() * 37);
		const colour = get(rock, x, y);
		if (colour === ROCK_LIT || colour === ROCK_BASE || colour === ROCK_HI) {
			set(rock, x, y, colour === ROCK_HI ? ROCK_LIT : ROCK_MID);
			if (random() > 0.5) {
				set(rock, x - 1, y - 1, ROCK_HI);
			}
		}
	}
}

/**
 * Thin gold veins running out from the split across the rock's skin, forking as they go:
 * bright in the sun, dull on the dark side.
 * @param {Canvas} rock
 */
function drawVeins(rock) {
	/** @type {[number, number][][]} */
	const veins = [
		[
			[25, 29],
			[22, 27],
			[19, 28],
			[16, 25],
		],
		[
			[19, 28],
			[17, 31],
		],
		[
			[26, 38],
			[22, 37],
			[20, 40],
			[15, 41],
			[12, 39],
		],
		[
			[20, 40],
			[19, 44],
			[16, 46],
		],
		[
			[28, 47],
			[25, 50],
			[22, 50],
		],
		[
			[41, 30],
			[44, 28],
			[47, 30],
		],
		[
			[42, 41],
			[45, 43],
			[49, 42],
		],
	];
	for (const vein of veins) {
		for (let i = 0; i < vein.length - 1; i++) {
			const [x0, y0] = vein[i];
			const [x1, y1] = vein[i + 1];
			const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
			for (let k = 0; k <= steps; k++) {
				const x = Math.round(x0 + ((x1 - x0) * k) / steps);
				const y = Math.round(y0 + ((y1 - y0) * k) / steps);
				const behind = get(rock, x, y);
				if (!behind || isFace(behind)) {
					continue;
				}
				const light = lightAt(x, y);
				let colour = light > 0.2 ? GOLD_SHADE : GOLD_DEEP;
				if (light > 0.5 && (x + y) % 3 === 0) {
					colour = GOLD;
				}
				set(rock, x, y, colour);
			}
		}
	}
}

/**
 * The gold seam laid bare on both broken faces: fat bright lumps on the sunward face,
 * duller gold on the shadowed one.
 * @param {Canvas} rock
 * @param {() => number} random
 */
function drawSeam(rock, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const behind = get(rock, x, y);
			if (!isFace(behind)) {
				continue;
			}
			const seam =
				Math.sin(y * 0.75 + x * 0.4) + Math.sin(y * 0.33 + 1.4);
			const lit = behind === FACE_LIT || behind === FACE_LIT_EDGE;
			if (seam > 0.6) {
				set(rock, x, y, lit ? GOLD : GOLD_SHADE);
			} else if (seam > 0) {
				set(rock, x, y, lit ? GOLD_SHADE : GOLD_DEEP);
			}
			if (lit && seam > 1.2 && random() > 0.5) {
				set(rock, x, y, GOLD_HI);
			}
		}
	}
}

/**
 * A fat nugget bulging from the shadowed face where the drill bites, and two lumps knocked loose,
 * drifting in the split.
 * @param {Canvas} rock
 */
function drawNuggets(rock) {
	const keys = { g: GOLD, w: GOLD_HI, s: GOLD_SHADE, d: GOLD_DEEP };
	paint(
		rock,
		DRILL_TIP.x - 3,
		DRILL_TIP.y - 1,
		['.gww.', 'gwggs', 'ggsss', 'gssd.', '.dd..'],
		keys
	);
	paint(rock, 32, 37, ['wg', 'gs'], keys);
	paint(rock, 29, 43, ['g.', 'ss'], keys);
}

/**
 * The drill arm: two jointed struts from the drone's belly reaching down into the split, ending in a fluted steel bit.
 * @param {Canvas} drone
 */
function drawDrill(drone) {
	const shoulder = { x: 38, y: 17 };
	const elbow = { x: 34, y: 22 };
	for (const [a, b] of [
		[shoulder, elbow],
		[elbow, { x: DRILL_TIP.x + 3, y: DRILL_TIP.y - 4 }],
	]) {
		line(drone, a.x, a.y, b.x, b.y, HULL_SHADE);
		line(drone, a.x + 1, a.y, b.x + 1, b.y, HULL_DARK);
	}
	rect(drone, elbow.x, elbow.y, 2, 2, MARK);
	paint(
		drone,
		DRILL_TIP.x,
		DRILL_TIP.y - 4,
		['..lmd', '.lmds', 'lmds.', 'mds..', 'd....'],
		{ l: HULL_HI, m: HULL, d: HULL_SHADE, s: HULL_DARK }
	);
}

/**
 * The mining drone: a stubby white hull lit from the upper left, a dark sensor strip, red hazard stripes
 * along its belly, a headlamp on its nose, a solar wing out behind and a thruster at the back.
 * @param {Canvas} drone
 */
function drawDrone(drone) {
	paint(
		drone,
		DRONE.x,
		DRONE.y,
		[
			'.......k............',
			'.......k............',
			'....wwwwwwhh........',
			'...whhhhhhhhs..ooooo',
			'..whhhhhhhhhs..ocpco',
			'.whvvvvvhhhhsffopcpo',
			'LLhvvvvvhhhssffocpco',
			'LLhhhhhhhhhss..opcpo',
			'.hrwrwrwrwrsn..ooooo',
			'..hhhhhhhssnnb......',
			'...ssssssssnbb......',
			'....d....d..........',
			'...dd....dd.........',
		],
		{
			k: HULL_DARK,
			w: HULL_HI,
			h: HULL,
			s: HULL_SHADE,
			d: HULL_DARK,
			v: VISOR,
			r: MARK,
			L: C.lampGlow,
			n: HULL_DARK,
			f: HULL_SHADE,
			o: HULL_SHADE,
			c: CELL,
			p: CELL_LIT,
			b: HULL_DARK,
		}
	);
	// A glint on the sensor strip.
	set(drone, DRONE.x + 4, DRONE.y + 5, C.tealLight);
}

/**
 * The headlamp's glare, the gold lit up where its beam lands, and the thruster's faint flame.
 * @param {Canvas} canvas
 */
function drawHeadlamp(canvas) {
	glow(canvas, {
		x: DRILL_TIP.x + 2,
		y: DRILL_TIP.y + 2,
		radius: 8,
		colour: C.lampGlow,
		strength: 0.32,
		steps: 2,
		skip: [
			C.ink,
			SPACE,
			DUST,
			DUST_FAINT,
			GOLD_HI,
			GOLD,
			HULL_HI,
			HULL,
			HULL_SHADE,
			HULL_DARK,
		],
	});
	set(canvas, LAMP.x - 1, LAMP.y, C.white);
	set(canvas, LAMP.x - 2, LAMP.y, C.lampGlow);
	set(canvas, LAMP.x - 3, LAMP.y + 1, C.lampGlow);
	set(canvas, DRONE.x + 15, DRONE.y + 11, C.tealLight);
	set(canvas, DRONE.x + 16, DRONE.y + 12, C.teal);
}

/**
 * Gold chips and sparks flying from where the bit bites the seam.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawSparks(canvas, random) {
	for (let i = 0; i < 8; i++) {
		const angle = -0.2 + random() * 1.6;
		const distance = 3 + random() * 4;
		const x = Math.round(DRILL_TIP.x + Math.cos(angle) * distance);
		const y = Math.round(DRILL_TIP.y + Math.sin(angle) * distance);
		set(canvas, x, y, random() > 0.5 ? GOLD_HI : C.white);
	}
}
