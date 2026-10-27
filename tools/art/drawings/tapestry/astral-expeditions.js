// Astral Expeditions: a small wooden ship under glowing golden sails climbing a river of stardust towards a great ringed planet.
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
import { drawSky } from '../../parts/sky.js';
import { drawShip } from '../../parts/ship.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The ship is drawn level on its own canvas, with the middle of its waterline at ORIGIN, then moved so that point
 * lands on PIVOT in the scene, its bow raised by SLOPE rows per column.
 */
const ORIGIN = { x: 32, y: 40 };
const PIVOT = { x: 27, y: 46 };
const SLOPE = -0.42;

/** The ringed planet the ship sails towards: its centre and radius, and its ring's half-width, half-height and tilt. */
const PLANET = { x: 49, y: 15, r: 12, rx: 21, ry: 4, tilt: 4 };

/**
 * The ring's bands, from the outer edge in: each one's scale and colour.
 * @type {[number, Colour][]}
 */
const RING_BANDS = [
	[1, C.creamShade],
	[0.9, C.cream],
	[0.8, C.creamLight],
	[0.72, C.sandShade],
];

/** The planet's banded colours. */
const BANDS = [C.sandLight, C.arcaneLight, C.duskSky5, C.sand];

/** The sails' cream recoloured to glowing gold. */
const SAILS = new Map([
	[C.creamLight, C.gold],
	[C.cream, C.amber],
]);

/**
 * Draws the Astral Expeditions scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4413);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 80,
		starRows: 64,
		sparkles: [
			[5, 5],
			[22, 4],
			[60, 40],
			[4, 33],
		],
	});
	deepen(layer);
	drawNebula(layer);
	drawMoon(layer);
	drawPlanet(layer);
	drawStream(layer, random);

	tilt(scene, shipCanvas());
	outline(scene, C.ink);
	underlay(scene, layer);
	drawRing(scene, true);
	const lantern = place(ORIGIN.x - 15, ORIGIN.y - 7);
	glow(scene, {
		x: lantern.x,
		y: lantern.y,
		radius: 3,
		colour: C.lampGlow,
		strength: 0.4,
		skip: [C.gold, C.ink],
	});
	drawSpray(scene);
	return scene;
}

/**
 * The ship drawn level on a canvas of its own, its cream sails turned to gold.
 * @returns {Canvas}
 */
function shipCanvas() {
	const ship = createCanvas(64, 64);
	drawShip(ship, {
		x: ORIGIN.x - 15,
		y: ORIGIN.y,
		masts: 2,
		sails: C.creamLight,
		flag: C.arcaneLight,
	});
	for (let i = 0; i < ship.p.length; i++) {
		const sail = SAILS.get(/** @type {Colour} */ (ship.p[i]));
		if (sail) {
			ship.p[i] = sail;
		}
	}
	return ship;
}

/**
 * Copies the level ship into the scene with its bow raised: each column of the ship moves up in proportion to how far
 * forward it lies, so the hull climbs the stream while the masts stay upright and unbroken.
 * @param {Canvas} scene
 * @param {Canvas} ship
 */
function tilt(scene, ship) {
	for (let sx = 0; sx < 64; sx++) {
		const { x, y: lift } = place(sx, ORIGIN.y);
		for (let sy = 0; sy < 64; sy++) {
			const colour = get(ship, sx, sy);
			if (colour) {
				set(scene, x, sy + lift - ORIGIN.y, colour);
			}
		}
	}
}

/**
 * Where a point of the level ship lands in the scene once its bow is raised.
 * @param {number} sx - The column on the ship's own canvas
 * @param {number} sy - The row on the ship's own canvas
 * @returns {{ x: number, y: number }}
 */
function place(sx, sy) {
	return {
		x: PIVOT.x + sx - ORIGIN.x,
		y: PIVOT.y + sy - ORIGIN.y + Math.round((sx - ORIGIN.x) * SLOPE),
	};
}

/**
 * Darkens the bottom of the night sky so space is deep all the way down, keeping the stars.
 * @param {Canvas} layer
 */
function deepen(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = /** @type {Colour} */ (get(layer, x, y));
			if (colour === C.white || colour === C.starDim) {
				continue;
			}
			// Three steps, so the sky keeps few colours.
			const t = Math.round((Math.abs(y - 26) / 40) * 2) / 2;
			set(layer, x, y, mix(colour, C.nightSky2, 0.35 + t * 0.4));
		}
	}
}

/**
 * A violet nebula drifting across the lower right beneath the stream, its heart pink and bright.
 * @param {Canvas} layer
 */
function drawNebula(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			// Distance from a curving line across the sky, roughened by ripples.
			const centre = 66 - (x - 16) * 0.72 + Math.sin(x * 0.2) * 3;
			const ripple =
				Math.sin(x * 0.5 + y * 0.3) * 1.6 + Math.sin(y * 0.7 - x * 0.2);
			const d =
				Math.abs(y - centre + ripple) / (7 + Math.sin(x * 0.13) * 2.5);
			if (d >= 1) {
				continue;
			}
			const behind = /** @type {Colour} */ (get(layer, x, y));
			let colour = mix(behind, C.arcaneShade, 0.45);
			if (d < 0.3) {
				colour = mix(behind, C.duskSky4, 0.5);
			} else if (d < 0.6) {
				colour = mix(behind, C.arcane, 0.4);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * A small blue moon in the lower right, lit from the upper left.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const cx = 54;
	const cy = 52;
	for (let y = cy - 5; y <= cy + 5; y++) {
		for (let x = cx - 5; x <= cx + 5; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > 5.2) {
				continue;
			}
			const lit = Math.hypot(x - cx + 2, y - cy + 2) < 3.6;
			set(
				layer,
				x,
				y,
				lit ? C.foam : d > 4 ? C.nightSea2 : C.nightWaveDeep
			);
		}
	}
}

/**
 * The ringed planet: a big banded globe, shaded on its upper right, with the far half of its ring behind it.
 * @param {Canvas} layer
 */
function drawPlanet(layer) {
	drawRing(layer, false);
	const { x: cx, y: cy, r } = PLANET;
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r + 0.3) {
				continue;
			}
			// Bands run along the ring's tilt, with a wobble like storms in the clouds.
			const along =
				y -
				cy +
				((x - cx) * PLANET.tilt) / PLANET.rx +
				Math.sin(x * 0.6);
			const band = Math.floor((along + r) / 3.2);
			let colour =
				BANDS[((band % BANDS.length) + BANDS.length) % BANDS.length];
			const shade = Math.hypot(x - cx + 5, y - cy - 5);
			if (shade > r + 4) {
				colour = mix(colour, C.roofShade, 0.6);
			} else if (shade > r + 1) {
				colour = mix(colour, C.roof, 0.35);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * One half of the planet's ring: the far half behind the globe, or the near half in front of it.
 * @param {Canvas} canvas
 * @param {boolean} front - Whether to draw the near half
 */
function drawRing(canvas, front) {
	const { x: cx, y: cy, rx, ry, tilt: lean } = PLANET;
	for (let step = 0; step < 320; step++) {
		const a = (step / 320) * Math.PI * 2;
		const near = Math.sin(a) > 0;
		if (near !== front) {
			continue;
		}
		for (const [scale, colour] of RING_BANDS) {
			const px = Math.round(cx + Math.cos(a) * rx * scale);
			const py = Math.round(
				cy + Math.sin(a) * ry * scale - Math.cos(a) * lean * scale
			);
			set(canvas, px, py, colour);
		}
	}
}

/**
 * The middle row of the stardust river at a column: rising from the lower left, bending up towards the planet.
 * @param {number} x
 * @returns {number}
 */
function streamRow(x) {
	return PIVOT.y + 2 + (x - PIVOT.x) * SLOPE - (x - PIVOT.x) ** 2 * 0.004;
}

/**
 * The river of stardust the ship sails up: a glowing teal current, wide in the foreground and thin in the distance.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStream(layer, random) {
	for (let x = 0; x < 64; x++) {
		const centre = streamRow(x);
		const half = 4.2 - x * 0.05;
		for (let y = 0; y < 64; y++) {
			const d = Math.abs(y - centre);
			if (d > half + 2) {
				continue;
			}
			const behind = /** @type {Colour} */ (get(layer, x, y));
			let colour;
			if (d <= 0.6) {
				colour = C.tealLight;
			} else if (d < half * 0.5) {
				colour = mix(behind, C.teal, 0.75);
			} else if (d < half) {
				colour = mix(behind, C.tealShade, 0.7);
			} else {
				colour = mix(behind, C.tealShade, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
	// Specks of stardust glinting in the current.
	for (let i = 0; i < 44; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.round(streamRow(x) + (random() - 0.5) * (8 - x * 0.08));
		set(layer, x, y, random() > 0.5 ? C.white : C.ghostLight);
	}
}

/**
 * Stardust thrown up at the bow and trailing from the stern, painted after the outline pass.
 * @param {Canvas} scene
 */
function drawSpray(scene) {
	const bow = place(ORIGIN.x + 13, ORIGIN.y);
	const stern = place(ORIGIN.x - 15, ORIGIN.y);
	for (const [dx, dy] of [
		[1, 0],
		[2, -1],
		[3, 1],
		[1, 2],
		[4, -2],
	]) {
		set(scene, bow.x + dx, bow.y + dy, dx % 2 ? C.white : C.tealLight);
	}
	for (const [dx, dy] of [
		[-2, 1],
		[-4, 3],
		[-5, 1],
		[-7, 4],
		[-9, 3],
	]) {
		set(scene, stern.x + dx, stern.y + dy, C.tealLight);
	}
}
