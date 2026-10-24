// Space tile Military 5 VP: three arrowhead starfighters in a V, diving out of the blazing heart of a red nebula towards the viewer, engines blazing.
import {
	createCanvas,
	get,
	set,
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
 * One fighter: its nose, how long it is from the barbs to the nose, half its span at the barbs,
 * how deep the notch between the barbs cuts, and half the width of its fuselage.
 * @typedef {{ x: number, y: number, length: number, span: number, notch: number, body: number }} Fighter
 */

/** The nebula's blazing heart, which the fighters have dived out of. */
const HEART = { x: 32, y: 5 };

/**
 * The lead fighter, nearest and largest, then its two wingmen further back: smaller copies of it, all nose down.
 * The wingmen sit on half columns so their fuselages are three pixels wide.
 */
const FIGHTERS = /** @type {Fighter[]} */ ([
	{ x: 32, y: 55, length: 22, span: 13, notch: 6, body: 2 },
	{ x: 14.5, y: 39, length: 12, span: 7, notch: 3.3, body: 1 },
	{ x: 49.5, y: 39, length: 12, span: 7, notch: 3.3, body: 1 },
]);

/** The engine flames: a 3 pixel cone above each engine, tip first, for the lead and for a wingman. */
const CONES = {
	lead: ['.o.', '.o.', '.g.', 'ggg', 'gyg', 'ywy', 'ywy'],
	wing: ['.o.', '.g.', 'gyg', 'ywy', 'ywy'],
};

/** The lead's wing cannons: how far out from the centre line they sit, and how far towards the nose they reach. */
const CANNON = { out: 7.5, tip: 14 };

/** The nebula's clouds, from the darkest dust to the white-hot heart. */
const CLOUD = [
	mix(C.ink, C.brickRedShade, 0.3),
	mix(C.night, C.brickRedShade, 0.6),
	C.brickRedShade,
	mix(C.brickRedShade, C.brickRed, 0.55),
	C.brickRed,
	C.brickRedLight,
	mix(C.brickRedLight, C.duskSky6, 0.6),
	mix(C.lampGlow, C.duskSky6, 0.35),
];

/** Violet dust drifting through the red, for depth. */
const DUST = mix(C.brickRedShade, C.arcaneShade, 0.55);
const DUST_DEEP = mix(C.night, C.arcaneShade, 0.45);

/** The fighters' pale grey hull, from the sunlit fuselage ridge to the darkest seams; the port side is lit, the starboard in shade. */
const HULL = {
	edge: C.white,
	light: C.snowShade,
	main: C.stoneLight,
	shade: C.stone,
	deep: C.stoneShade,
};

/** The nebula's red light caught on the trailing edges. */
const RIM = mix(C.brickRedLight, C.stoneLight, 0.3);

/** The squadron's plain deep blue chevron across the wings. */
const CHEVRON = C.daySky1;
const CHEVRON_SHADE = mix(C.daySky1, C.nightSea3, 0.6);

/** The canopy glass. */
const GLASS = { glint: C.tealLight, main: C.teal, shade: C.tealShade };

/** The engines' flame, from white-hot at the nozzle through yellow to orange at the tip. */
const FLAME = { w: C.white, y: C.lampGlow, g: C.gold, o: C.amber };

/**
 * Draws the Military 5 VP space tile.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(5505);

	drawNebula(layer, random);
	drawStars(layer, random);

	const squadron = createCanvas(64, 64);
	for (const fighter of FIGHTERS) {
		drawFighter(squadron, fighter);
	}
	outline(squadron, C.ink);
	const open = squadron.p.map((colour) => colour === null);
	underlay(squadron, layer);

	for (const fighter of FIGHTERS) {
		drawFlames(squadron, open, fighter);
	}
	drawHeart(squadron);
	return squadron;
}

/**
 * Smooth value noise on a grid of random values, eased between them.
 * @param {() => number} random
 * @param {number} cells - Grid cells across the frame
 * @returns {(x: number, y: number) => number} Noise from 0 to 1 for a pixel.
 */
function makeNoise(random, cells) {
	const size = cells + 1;
	const grid = Array.from({ length: size * size }, () => random());
	return (x, y) => {
		const gx = (x / 64) * cells;
		const gy = (y / 64) * cells;
		const i = Math.min(cells - 1, Math.floor(gx));
		const j = Math.min(cells - 1, Math.floor(gy));
		const ease = (/** @type {number} */ t) => t * t * (3 - 2 * t);
		const fx = ease(gx - i);
		const fy = ease(gy - j);
		const at = (/** @type {number} */ a, /** @type {number} */ b) =>
			grid[b * size + a];
		const top = at(i, j) + (at(i + 1, j) - at(i, j)) * fx;
		const bottom = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * fx;
		return top + (bottom - top) * fy;
	};
}

/**
 * The red nebula: billowing clouds that brighten towards the heart at the top, cut by darker violet dust lanes.
 * Band edges are dithered so the clouds stay soft.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawNebula(layer, random) {
	const broad = makeNoise(random, 4);
	const fine = makeNoise(random, 10);
	const lanes = makeNoise(random, 6);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const reach = Math.hypot(x - HEART.x, (y - HEART.y) * 1.25) / 60;
			const density =
				0.5 * broad(x, y) +
				0.3 * fine(x, y) +
				0.85 * Math.exp(-reach * 3.2) -
				0.18;
			const t = Math.max(0, Math.min(0.999, density)) * CLOUD.length;
			let band = Math.floor(t);
			if (t - band > 0.75 && (x + y) % 2 === 0) {
				band = Math.min(CLOUD.length - 1, band + 1);
			}
			let colour = CLOUD[band];
			// Dust lanes darken the outer clouds but never the heart.
			const lane = lanes(x, y);
			if (band <= 4 && lane > 0.68) {
				colour = lane > 0.78 ? DUST_DEEP : DUST;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Stars shining through the thinner clouds, in three brightnesses, with a few four-point sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStars(layer, random) {
	const dark = [CLOUD[0], CLOUD[1], CLOUD[2], DUST, DUST_DEEP];
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const brightness = random();
		const behind = get(layer, x, y);
		if (behind && dark.includes(behind)) {
			set(
				layer,
				x,
				y,
				brightness > 0.8
					? C.white
					: brightness > 0.45
						? mix(C.starDim, C.brickRedLight, 0.25)
						: mix(behind, C.starDim, 0.45)
			);
		}
	}
	for (const [x, y] of [
		[8, 52],
		[57, 50],
		[5, 13],
		[58, 14],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, mix(C.starDim, C.brickRedLight, 0.25));
		}
	}
}

/**
 * One arrowhead fighter diving nose down: swept wings with a notch between their barbs, a raised fuselage
 * with a teal canopy, a blue chevron, seams, red light on the trailing edges, and on the lead, two wing cannons.
 * @param {Canvas} canvas
 * @param {Fighter} fighter
 */
function drawFighter(canvas, fighter) {
	const { x, y, length, span, notch, body } = fighter;
	for (let py = 0; py < 64; py++) {
		for (let px = 0; px < 64; px++) {
			// v runs from the barbs (0) down to the nose (length); u runs across, port side negative.
			const v = length + py + 0.5 - y;
			const u = px + 0.5 - x;
			const wing =
				v >= 0 &&
				Math.abs(u) <= span * (1 - v / length) + 0.3 &&
				v >= notch * (1 - Math.abs(u) / span);
			const fuselage =
				Math.abs(u) <= body + 0.2 && v >= -1.5 && v <= length;
			// The lead carries a cannon along each wing, reaching past the leading edge.
			const cannon =
				span > 8 &&
				Math.abs(Math.abs(u) - CANNON.out) < 0.5 &&
				v >= 3 &&
				v <= CANNON.tip;
			if (cannon) {
				set(
					canvas,
					px,
					py,
					v > CANNON.tip - 1
						? HULL.edge
						: u < 0
							? HULL.main
							: HULL.deep
				);
				continue;
			}
			if (!wing && !fuselage) {
				continue;
			}
			set(canvas, px, py, hullColour(fighter, u, v, fuselage));
		}
	}
}

/**
 * The colour of one point of a fighter's hull.
 * @param {Fighter} fighter
 * @param {number} u - Across the fighter, port side negative
 * @param {number} v - Along the fighter, from the barbs to the nose
 * @param {boolean} fuselage - Whether the point is on the fuselage
 * @returns {Colour}
 */
function hullColour({ length, span, notch, body }, u, v, fuselage) {
	const port = u < 0;
	if (fuselage) {
		const canopy = v > length * 0.42 && v < length * 0.72;
		if (canopy) {
			if (v > length * 0.64) {
				return GLASS.glint;
			}
			return port ? GLASS.main : GLASS.shade;
		}
		if (v < 0.5) {
			return HULL.deep;
		}
		if (v > length - 2) {
			return port ? HULL.light : HULL.main;
		}
		return port ? HULL.edge : HULL.main;
	}
	// The trailing edges between the barbs catch the nebula's red light.
	const trailing = v - notch * (1 - Math.abs(u) / span);
	if (trailing < 1.2) {
		return RIM;
	}
	// The chevron across both wings.
	if (trailing > length * 0.16 && trailing < length * 0.26) {
		return port ? CHEVRON : CHEVRON_SHADE;
	}
	// A seam halfway out along each wing.
	const reach = span * (1 - v / length);
	const out = (Math.abs(u) - body) / Math.max(1, reach - body);
	if (Math.abs(out - 0.5) < 0.09 && span > 8) {
		return port ? HULL.main : HULL.deep;
	}
	return port ? HULL.light : HULL.shade;
}

/**
 * A fighter's engines: a 3 pixel cone of flame above each one, white at the nozzle, yellow, then orange
 * at the tip, with a soft glow round them. Painted only on open space, never over a hull.
 * @param {Canvas} canvas
 * @param {boolean[]} open - Which pixels the fighters and their outline left empty
 * @param {Fighter} fighter
 */
function drawFlames(canvas, open, fighter) {
	const { x, y, length, body } = fighter;
	const lead = body >= 2;
	const cone = lead ? CONES.lead : CONES.wing;
	// The row just above the outline over the fuselage's tail.
	const base = Math.floor(y - length - 1.5) - 2;
	const top = base - cone.length + 1;
	// The lead's twin engines sit either side of its tail; a wingman's single engine is centred on its own.
	const engines = lead
		? [Math.round(x) - 4, Math.round(x) + 1]
		: [Math.floor(x) - 1];
	glow(canvas, {
		x: Math.floor(x),
		y: base - 1,
		radius: lead ? 8 : 5,
		colour: C.gold,
		strength: 0.3,
		steps: 3,
		skip: [C.ink],
	});
	for (const left of engines) {
		cone.forEach((row, j) => {
			[...row].forEach((key, i) => {
				const px = left + i;
				const py = top + j;
				if (key !== '.' && open[py * 64 + px]) {
					set(
						canvas,
						px,
						py,
						FLAME[/** @type {keyof typeof FLAME} */ (key)]
					);
				}
			});
		});
	}
}

/**
 * The nebula's white-hot heart, where the fighters' dives began.
 * @param {Canvas} canvas
 */
function drawHeart(canvas) {
	glow(canvas, {
		x: HEART.x,
		y: HEART.y,
		radius: 9,
		colour: C.lampGlow,
		strength: 0.55,
		steps: 3,
		skip: [C.ink, C.white],
	});
	set(canvas, HEART.x, HEART.y, C.white);
	set(canvas, HEART.x - 1, HEART.y, C.lampGlow);
	set(canvas, HEART.x + 1, HEART.y, C.lampGlow);
	set(canvas, HEART.x, HEART.y - 1, C.lampGlow);
	set(canvas, HEART.x, HEART.y + 1, C.lampGlow);
}
