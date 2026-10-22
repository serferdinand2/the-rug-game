// Ghost Ship: a pale, glowing three-master with torn ghost-green sails drifting out of a cold fog bank under a veiled moon.
import {
	createCanvas,
	get,
	set,
	clear,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';
import { drawShip } from '../../parts/ship.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, the ship's waterline, its deck row and its leftmost column. */
const HORIZON = 40;
const WATERLINE = 54;
const DECK = WATERLINE - 4;
const SHIP_X = 10;

/** The cold fog: a pale grey-green that the sky and sea show through. */
const FOG = mix(C.ghostShade, C.stoneLight, 0.55);

/** The ship's ghostly colours, replacing the part's timber. */
const HULL = new Map([
	[C.timberLight, C.ghost],
	[C.timber, C.ghostShade],
	[C.timberShade, mix(C.ghostShade, C.nightSky2, 0.5)],
	[C.wood, mix(C.ghostShade, C.nightSky2, 0.45)],
	[C.gold, C.ghostLight],
	[C.cream, C.ghost],
	[C.creamShade, C.ghostShade],
]);

/**
 * Each sail: its mast (0 the mizzen at the stern, 2 the foremast), its top and bottom rows,
 * and its half-width at the yard and at the foot.
 * @type {[number, number, number, number, number][]}
 */
const SAILS = [
	[0, DECK - 8, DECK - 3, 3, 3],
	[0, DECK - 14, DECK - 10, 3, 3],
	[1, DECK - 8, DECK - 3, 3, 3],
	[1, DECK - 14, DECK - 10, 3, 3],
	[1, DECK - 19, DECK - 16, 2, 2],
	[2, DECK - 8, DECK - 3, 3, 3],
	[2, DECK - 14, DECK - 10, 3, 3],
];

/**
 * Draws the Ghost Ship scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(613);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 22,
		starRows: 18,
		moon: { x: 12, y: 8 },
	});
	drawSea(layer, { time: 'night', top: HORIZON + 1, random, waves: 46 });
	chill(layer);
	drawFogBanks(layer, random);
	// The ship's cold light spills onto the fog and water around it.
	glow(layer, {
		x: 31,
		y: 36,
		radius: 27,
		colour: C.ghost,
		strength: 0.28,
		steps: 3,
	});
	drawReflection(layer, random);

	// The part's hull, masts and yards with the sails furled; the torn sails are hung on the yards below.
	drawShip(scene, {
		x: SHIP_X,
		y: WATERLINE,
		flag: C.ghostLight,
		furled: true,
	});
	haunt(scene);
	for (const sail of SAILS) {
		hangSail(scene, sail, random);
	}
	drawJib(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawRigging(scene);
	drawPennant(scene);
	drawLowFog(scene, random);
	drawWisps(scene);
	return scene;
}

/**
 * Turns the night's purples cold: every sky and sea pixel drifts towards a dark sea green.
 * @param {Canvas} layer
 */
function chill(layer) {
	const cold = mix(C.tealShade, C.ink, 0.35);
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour && colour !== C.moon && colour !== C.white) {
			layer.p[i] = mix(colour, cold, i < 64 * HORIZON ? 0.3 : 0.2);
		}
	}
}

/**
 * Long banks of fog: a thin veil across the moon and a thick bank lying on the horizon.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFogBanks(layer, random) {
	for (const [top, bottom, strength] of [
		[8, 10, 0.4],
		[31, 36, 0.3],
		[37, 45, 0.5],
	]) {
		const phase = random() * 6;
		for (let x = 0; x < 64; x++) {
			const wave = Math.round(Math.sin(x * 0.21 + phase) * 1.4);
			for (let y = top + wave; y <= bottom + wave; y++) {
				const behind = get(layer, x, y);
				if (!behind) {
					continue;
				}
				set(layer, x, y, mix(behind, FOG, strength));
			}
		}
	}
}

/**
 * The ship's pale glow broken up on the water under it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawReflection(layer, random) {
	for (let y = WATERLINE + 2; y < 64; y += 2) {
		for (let i = 0; i < 3; i++) {
			const x = SHIP_X + 4 + Math.floor(random() * 30);
			const n = 2 + Math.floor(random() * 3);
			for (let k = 0; k < n; k++) {
				const behind = get(layer, x + k, y);
				if (behind) {
					set(layer, x + k, y, mix(behind, C.ghost, 0.45));
				}
			}
		}
	}
}

/**
 * Repaints the part's ship in ghost colours: a dim green hull with glowing gunports, dark spars and a cold stern lantern.
 * @param {Canvas} scene
 */
function haunt(scene) {
	// The gunports burn with a cold light from inside the hull.
	for (let x = 0; x < 64; x++) {
		if (get(scene, x, WATERLINE - 3) === C.wood) {
			set(scene, x, WATERLINE - 3, C.ghostLight);
		}
	}
	for (let i = 0; i < scene.p.length; i++) {
		const colour = scene.p[i];
		if (colour && HULL.has(colour)) {
			scene.p[i] = /** @type {Colour} */ (HULL.get(colour));
		}
	}
}

/**
 * Hangs one torn square sail from its yard: lit along the yard and on the windward edge,
 * shaded on the lee, its foot ragged with strips hanging loose, and a hole or two torn through.
 * The holes are opened before the outline, so each one gets a dark edge.
 * @param {Canvas} scene
 * @param {[number, number, number, number, number]} sail
 * @param {() => number} random
 */
function hangSail(scene, [mast, top, bottom, topHalf, footHalf], random) {
	const mx = SHIP_X + 8 + mast * 9;
	for (let dx = -footHalf; dx <= footHalf; dx++) {
		// Each column of the foot is torn short, left whole, or hangs on as a loose strip.
		const roll = random();
		const foot =
			bottom + (roll < 0.3 ? -2 : roll < 0.5 ? -1 : roll > 0.8 ? 2 : 0);
		for (let y = top; y <= foot; y++) {
			const half = y === top ? topHalf : footHalf;
			if (Math.abs(dx) > half) {
				continue;
			}
			let colour = C.ghost;
			if (y === top || dx === -footHalf) {
				colour = C.ghostLight;
			} else if (dx >= footHalf - 1 || y > bottom - 1) {
				colour = C.ghostShade;
			}
			set(scene, mx + dx, y, colour);
		}
	}
	// A hole or two through the middle of the cloth.
	const holes = 1 + Math.floor(random() * 2);
	for (let n = 0; n < holes; n++) {
		const hx =
			mx + (random() < 0.5 ? -1 : 1) * (1 + Math.floor(random() * 2));
		const hy =
			top + 2 + Math.floor(random() * Math.max(1, bottom - top - 3));
		clear(scene, hx, hy);
	}
}

/**
 * A torn jib from the foremast's head down towards the bowsprit, ending in a frayed edge.
 * @param {Canvas} scene
 */
function drawJib(scene) {
	const fore = SHIP_X + 8 + 18;
	for (let k = 0; k < 8; k++) {
		const row = DECK - 13 + k;
		const width = 1 + Math.floor(k * 0.8);
		for (let dx = 1; dx <= width; dx++) {
			const frayed = k === 7 && dx % 2 === 0;
			if (!frayed) {
				set(
					scene,
					fore + 5 + dx,
					row,
					dx === width ? C.ghostShade : C.ghost
				);
			}
		}
	}
}

/**
 * Stays from the mastheads to the bow and stern, in a faint pale line with no outline.
 * @param {Canvas} scene
 */
function drawRigging(scene) {
	const rope = mix(C.ghostShade, C.nightSky4, 0.3);
	line(scene, SHIP_X + 17, DECK - 25, SHIP_X + 25, DECK - 21, rope);
	line(scene, SHIP_X + 8, DECK - 19, SHIP_X + 1, DECK - 3, rope);
	line(scene, SHIP_X + 26, DECK - 21, SHIP_X + 39, DECK - 4, rope);
}

/**
 * The pennant streams out long and frayed from the mainmast, with no outline.
 * @param {Canvas} scene
 */
function drawPennant(scene) {
	const top = DECK - 25;
	const mast = SHIP_X + 17;
	for (const [dx, dy] of [
		[5, 0],
		[6, 0],
		[7, 1],
		[8, 1],
		[9, 1],
		[11, 2],
		[12, 2],
	]) {
		set(scene, mast + dx, top + dy, dx > 8 ? C.ghost : C.ghostLight);
	}
}

/**
 * A low bank of fog drifting across the hull and the water, so the ship rises out of it.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLowFog(scene, random) {
	const phase = random() * 6;
	for (let x = 0; x < 64; x++) {
		const top =
			WATERLINE - 1 + Math.round(Math.sin(x * 0.18 + phase) * 1.6);
		for (let y = top; y <= top + 6; y++) {
			const behind = get(scene, x, y);
			if (!behind) {
				continue;
			}
			set(scene, x, y, mix(behind, FOG, 0.4));
		}
	}
}

/**
 * Wisps of mist trailing off the sails behind the ship, with no outline.
 * @param {Canvas} scene
 */
function drawWisps(scene) {
	const wisp = mix(C.ghost, C.nightSky4, 0.4);
	for (const [x, y, n] of [
		[4, 30, 4],
		[1, 33, 3],
		[5, 37, 3],
		[2, 24, 3],
	]) {
		for (let k = 0; k < n; k++) {
			set(scene, x + k, y, wisp);
		}
	}
}
