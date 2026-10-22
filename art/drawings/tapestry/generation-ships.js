// Generation Ships: a long white ark with a turning ring of lit windows, drifting past the curve of a cloud-swirled blue planet.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The spine's middle row, and the ring's centre column and its outer and inner half-sizes. */
const SPINE = 26;
const RING = { x: 29, rx: 8, ry: 16, ix: 5, iy: 13 };

/** The planet: its centre (below the frame) and radius, and the distant sun. */
const PLANET = { x: 6, y: 114, r: 66 };
const SUN = { x: 56, y: 7 };

/** The cold black of space the night sky is tinted towards. */
const VOID = mix(C.nightSea3, C.ink, 0.6);

/** The hull's white panels, lit from the sun at the upper right. */
const HULL = {
	light: C.white,
	main: C.snowShade,
	mid: C.stoneLight,
	shade: C.stone,
	deep: C.stoneShade,
};

/**
 * Draws the Generation Ships scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const hull = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6271);

	drawSky(layer, {
		time: 'night',
		horizon: 63,
		random,
		stars: 70,
		starRows: 64,
	});
	chill(layer);
	drawPlanet(layer, random);
	drawSun(layer);

	// The far half of the ring and the hull sit behind the near half of the ring, so each gets its own outline.
	drawRingHalf(hull, false);
	drawEngines(hull);
	drawSpine(hull);
	drawPods(hull);
	drawHabitat(hull);
	drawBow(hull);
	outline(hull, C.ink);
	drawRingHalf(scene, true);
	drawSpokes(scene);
	drawShuttle(scene);
	outline(scene, C.ink);
	underlay(scene, hull);
	drawExhaust(scene);
	underlay(scene, layer);
	drawLights(scene);
	return scene;
}

/**
 * Cools the night sky to the blue-black of deep space, keeping the stars.
 * @param {Canvas} layer
 */
function chill(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = /** @type {Colour} */ (layer.p[i]);
		if (colour !== C.white && colour !== C.starDim) {
			layer.p[i] = mix(colour, VOID, 0.6);
		}
	}
}

/**
 * The planet's curve across the lower left: white clouds over a blue ocean, a thin teal rim of atmosphere,
 * and the night side in the bottom corner, away from the sun.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPlanet(layer, random) {
	const { x: cx, y: cy, r } = PLANET;
	for (let y = 30; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x - cx, y - cy);
			const behind = /** @type {Colour} */ (get(layer, x, y));
			if (d > r + 3) {
				continue;
			}
			if (d > r) {
				set(layer, x, y, mix(behind, C.teal, d > r + 1.5 ? 0.2 : 0.45));
				continue;
			}
			const depth = r - d;
			const cloud =
				Math.sin(x * 0.31 + y * 0.17) +
				Math.sin(y * 0.43 - x * 0.19 + 1.3) +
				0.6 * Math.sin(x * 0.11 - y * 0.29);
			let colour = depth < 4 ? C.daySea1 : C.daySea2;
			if (cloud > 1.2) {
				colour = C.snow;
			} else if (cloud > 0.7) {
				colour = C.snowShade;
			} else if (depth < 2) {
				colour = C.daySky4;
			}
			// The terminator: the bottom corner turns away from the sun.
			const night = (y - 50) * 1.4 - x;
			if (night > 4) {
				colour = mix(colour, C.nightSky1, 0.75);
			} else if (night > 0) {
				colour = mix(colour, C.nightSky2, 0.45);
			}
			if (depth <= 0.7) {
				colour = C.tealLight;
			}
			set(layer, x, y, colour);
		}
	}
	// A few cities glittering on the night side.
	for (let i = 0; i < 7; i++) {
		const x = Math.floor(random() * 14);
		const y = 56 + Math.floor(random() * 8);
		if ((y - 50) * 1.4 - x > 5) {
			set(layer, x, y, C.gold);
		}
	}
}

/**
 * The distant sun: a small white disc with a cold glow.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 11,
		colour: C.foam,
		strength: 0.4,
	});
	rect(layer, SUN.x - 1, SUN.y - 2, 3, 5, C.white);
	rect(layer, SUN.x - 2, SUN.y - 1, 5, 3, C.white);
	for (let i = 3; i <= 6; i++) {
		for (const [dx, dy] of [
			[i, 0],
			[-i, 0],
			[0, i],
			[0, -i],
		]) {
			const behind = /** @type {Colour} */ (
				get(layer, SUN.x + dx, SUN.y + dy)
			);
			set(
				layer,
				SUN.x + dx,
				SUN.y + dy,
				mix(behind, C.white, i < 5 ? 0.7 : 0.35)
			);
		}
	}
}

/**
 * One half of the ring: the far half (left of the hub) or the near half (right of it), a band of hull with a row of lit windows.
 * @param {Canvas} canvas
 * @param {boolean} near - Whether to draw the near half
 */
function drawRingHalf(canvas, near) {
	const { x: cx, rx, ry, ix, iy } = RING;
	for (let y = SPINE - ry; y <= SPINE + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			if (near !== x >= cx) {
				continue;
			}
			const outer =
				((x - cx) / (rx + 0.4)) ** 2 + ((y - SPINE) / (ry + 0.4)) ** 2;
			const inner =
				((x - cx) / (ix + 0.4)) ** 2 + ((y - SPINE) / (iy + 0.4)) ** 2;
			if (outer > 1 || inner <= 1) {
				continue;
			}
			// How far across the band this pixel lies, from the inner edge (0) to the outer (1).
			const across = Math.sqrt(inner) - 1;
			const t = across / (across + 1 - Math.sqrt(outer));
			const lit = y < SPINE - 2 || x > cx + 3;
			let colour = lit ? HULL.main : HULL.shade;
			if (t > 0.72) {
				colour = lit ? HULL.light : HULL.mid;
			} else if (t < 0.3) {
				colour = HULL.deep;
			} else if ((y + x) % 3 !== 0) {
				colour = near ? C.gold : C.amber;
			}
			if (!near && t >= 0.3 && t <= 0.72) {
				colour = (y + x) % 3 !== 0 ? C.amber : HULL.deep;
			}
			set(canvas, x, y, colour);
		}
	}
}

/**
 * The spokes from the hub up and down to the ring, and the hub itself.
 * @param {Canvas} scene
 */
function drawSpokes(scene) {
	const { x: cx, iy } = RING;
	for (let y = SPINE - iy; y <= SPINE + iy; y++) {
		const top = y < SPINE;
		set(scene, cx + 1, y, top ? HULL.light : HULL.mid);
		set(scene, cx + 2, y, top ? HULL.main : HULL.shade);
	}
	for (let y = SPINE - 3; y <= SPINE + 3; y++) {
		rect(scene, cx, y, 4, 1, y < SPINE ? HULL.main : HULL.shade);
		set(scene, cx, y, y < SPINE ? HULL.light : HULL.mid);
		set(scene, cx + 3, y, HULL.deep);
	}
}

/**
 * A tiny shuttle flying alongside, to show how big the ark is.
 * @param {Canvas} scene
 */
function drawShuttle(scene) {
	paint(scene, 46, 38, ['.ww..', 'swwwt', '.ss..'], {
		w: HULL.light,
		s: HULL.shade,
		t: C.tealLight,
	});
}

/**
 * The engine section at the stern: a heavy block with three engine bells.
 * @param {Canvas} hull
 */
function drawEngines(hull) {
	for (const y of [SPINE - 7, SPINE - 1, SPINE + 5]) {
		rect(hull, 3, y, 1, 3, HULL.deep);
		rect(hull, 4, y - 1, 2, 5, HULL.shade);
		set(hull, 4, y - 1, HULL.mid);
	}
	box(hull, 6, SPINE - 9, 11, 19);
	// Radiator fins above and below.
	for (let x = 8; x <= 14; x += 3) {
		rect(hull, x, SPINE - 13, 2, 4, x === 8 ? HULL.mid : HULL.main);
		rect(hull, x, SPINE + 10, 2, 3, HULL.shade);
	}
}

/**
 * Paints a block of hull panels lit from the top, with seams.
 * @param {Canvas} hull
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 */
function box(hull, x, y, w, h) {
	for (let j = 0; j < h; j++) {
		for (let i = 0; i < w; i++) {
			const t = j / (h - 1);
			let colour = HULL.main;
			if (j === 0) {
				colour = HULL.light;
			} else if (t > 0.75) {
				colour = HULL.shade;
			} else if (t > 0.5) {
				colour = HULL.mid;
			}
			if (i % 5 === 4 && j > 0) {
				colour = t > 0.5 ? HULL.deep : HULL.shade;
			}
			set(hull, x + i, y + j, colour);
		}
	}
}

/**
 * The long truss spine that runs from the engines to the bow.
 * @param {Canvas} hull
 */
function drawSpine(hull) {
	for (let x = 16; x <= 56; x++) {
		set(hull, x, SPINE - 2, HULL.mid);
		set(hull, x, SPINE + 2, HULL.deep);
		for (let y = SPINE - 1; y <= SPINE + 1; y++) {
			set(hull, x, y, x % 3 === 0 ? HULL.shade : C.night);
		}
	}
}

/**
 * Cargo pods strung along the spine between the engines and the ring.
 * @param {Canvas} hull
 */
function drawPods(hull) {
	for (const x of [18, 34]) {
		box(hull, x, SPINE - 6, 4, 4);
		box(hull, x, SPINE + 3, 4, 4);
	}
	box(hull, 23, SPINE - 5, 3, 3);
	box(hull, 23, SPINE + 3, 3, 3);
}

/**
 * The habitat: a long cylinder where the crew live, lit by rows of small windows.
 * @param {Canvas} hull
 */
function drawHabitat(hull) {
	const left = 39;
	const right = 53;
	for (let y = SPINE - 6; y <= SPINE + 6; y++) {
		const off = y - SPINE;
		for (let x = left; x <= right; x++) {
			let colour = HULL.main;
			if (off <= -5) {
				colour = HULL.light;
			} else if (off >= 4) {
				colour = HULL.deep;
			} else if (off >= 1) {
				colour = HULL.shade;
			} else if (off <= -3) {
				colour = HULL.main;
			} else {
				colour = HULL.mid;
			}
			if ((x - left) % 5 === 0) {
				colour = off >= 1 ? HULL.deep : HULL.shade;
			}
			set(hull, x, y, colour);
		}
	}
	// The domed ends of the cylinder.
	for (const [x, half] of [
		[left - 1, 5],
		[left - 2, 3],
		[right + 1, 5],
		[right + 2, 3],
	]) {
		for (let y = SPINE - half; y <= SPINE + half; y++) {
			set(hull, x, y, y < SPINE ? HULL.mid : HULL.deep);
		}
	}
}

/**
 * The bow: a tapered command section with a teal-lit bridge.
 * @param {Canvas} hull
 */
function drawBow(hull) {
	for (let x = 56; x <= 63; x++) {
		const half = Math.max(1, Math.round(4 - (x - 56) * 0.5));
		for (let y = SPINE - half; y <= SPINE + half; y++) {
			let colour = y < SPINE ? HULL.main : HULL.shade;
			if (y === SPINE - half) {
				colour = HULL.light;
			} else if (y === SPINE + half) {
				colour = HULL.deep;
			}
			set(hull, x, y, colour);
		}
	}
	rect(hull, 57, SPINE - 2, 3, 1, C.tealLight);
	set(hull, 60, SPINE - 1, C.teal);
}

/**
 * The cold blue-white exhaust streaming from the engine bells off the left edge.
 * @param {Canvas} scene
 */
function drawExhaust(scene) {
	for (const y of [SPINE - 6, SPINE, SPINE + 6]) {
		for (let x = 0; x <= 2; x++) {
			set(scene, x, y, x === 2 ? C.white : C.tealLight);
			set(scene, x, y - 1, C.teal);
			set(scene, x, y + 1, C.teal);
		}
	}
	glow(scene, {
		x: 1,
		y: SPINE,
		radius: 9,
		colour: C.tealLight,
		strength: 0.35,
		skip: [C.white, C.tealLight],
	});
}

/**
 * Small lights along the hull, painted after the outline pass.
 * @param {Canvas} scene
 */
function drawLights(scene) {
	for (let x = 41; x <= 52; x += 2) {
		set(scene, x, SPINE - 3, C.lampGlow);
		set(scene, x + 1, SPINE + 1, C.gold);
	}
	set(scene, 63, SPINE, C.tealLight);
	set(scene, 11, SPINE - 14, C.brickRedLight);
}
