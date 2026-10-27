// Telescope: a brass telescope on a wooden tripod on a moonlit hilltop, aimed at a large full moon in a starry sky.
import {
	createCanvas,
	set,
	line,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The full moon: its centre and radius. */
const MOON = { x: 49, y: 15, r: 11 };

/** The telescope's tube, from the eyepiece end to the objective end, aimed at the moon. */
const TUBE = { x0: 4, y0: 46, x1: 38, y1: 23 };

/** The tube's direction, its length, and the normal pointing up and away from the ground. */
const LENGTH = Math.hypot(TUBE.x1 - TUBE.x0, TUBE.y1 - TUBE.y0);
const AXIS = {
	x: (TUBE.x1 - TUBE.x0) / LENGTH,
	y: (TUBE.y1 - TUBE.y0) / LENGTH,
};
const UP = { x: AXIS.y, y: -AXIS.x };

/** Where the mount clamps the tube, as a distance along it, and the tripod head below. */
const CLAMP = LENGTH * 0.52;
const HEAD = {
	x: Math.round(TUBE.x0 + AXIS.x * CLAMP),
	y: Math.round(TUBE.y0 + AXIS.y * CLAMP) + 6,
};

/** The sky's ramp from the top down to the far hills. */
const SKY = [C.nightSky2, C.nightSky3, C.nightSky4, C.nightSky5, C.nightSky6];

/** The moon's halo, in two soft rings. */
const HALO_NEAR = mix(C.nightSky5, C.moonRim, 0.3);
const HALO_FAR = mix(C.nightSky4, C.moonRim, 0.14);

/** The moon's seas and craters. */
const MARE = mix(C.moonRim, C.stoneLight, 0.45);

/** The far hills and the moonlit hilltop. */
const FAR_HILL = mix(C.headlandRidge, C.nightSky5, 0.35);
const GRASS = mix(C.grassShade, C.nightSky4, 0.55);
const GRASS_LIGHT = mix(C.grassLight, C.nightSky6, 0.45);
const GRASS_DARK = mix(C.forestFloorShade, C.nightSky2, 0.45);

/** The lantern standing on the grass by the tripod: its left column and its base row. */
const LANTERN = { x: 50, y: 56 };

/** The eyepiece's dark glass. */
const EYEPIECE = mix(C.wood, C.ink, 0.3);

/**
 * Draws the Telescope tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1608);

	drawNightSky(layer, random);
	drawMoon(layer);
	drawFarHills(layer);
	drawHilltop(layer, random);

	drawTripod(scene);
	drawTube(scene);
	drawMount(scene);
	drawLantern(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: LANTERN.x + 2,
		y: LANTERN.y - 3,
		radius: 10,
		colour: C.amber,
		strength: 0.35,
		steps: 2,
		skip: [C.ink, C.lampGlow, C.gold, ...SKY, C.starDim, C.white, FAR_HILL],
	});

	drawGleams(scene);
	return scene;
}

/**
 * The night sky: a gradient that lightens towards the hills, scattered stars and a few bright ones.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawNightSky(layer, random) {
	const bottom = 56;
	for (let y = 0; y <= bottom; y++) {
		const t = (y / bottom) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
	for (let i = 0; i < 34; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 44);
		if (Math.hypot(x - MOON.x, y - MOON.y) < MOON.r + 6) {
			continue;
		}
		set(layer, x, y, random() > 0.55 ? C.white : C.starDim);
	}
	for (const [x, y] of [
		[8, 6],
		[27, 4],
		[22, 17],
	]) {
		set(layer, x, y, C.white);
		set(layer, x + 1, y, C.starDim);
		set(layer, x - 1, y, C.starDim);
		set(layer, x, y + 1, C.starDim);
		set(layer, x, y - 1, C.starDim);
	}
}

/**
 * The full moon: a soft two-ring halo, the disc shaded on its lower left, and its grey seas.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: mx, y: my, r } = MOON;
	for (let y = my - r - 6; y <= my + r + 6; y++) {
		for (let x = mx - r - 6; x <= mx + r + 6; x++) {
			const d = Math.hypot(x - mx, y - my);
			if (d < r) {
				const rim = d > r - 2 && x - mx + (y - my) * 0.6 < -2;
				set(layer, x, y, rim ? C.moonRim : C.moon);
			} else if (d < r + 2.5) {
				set(layer, x, y, HALO_NEAR);
			} else if (d < r + 5.5 && (x + y) % 2 === 0) {
				set(layer, x, y, HALO_FAR);
			} else if (d < r + 4.5) {
				set(layer, x, y, HALO_FAR);
			}
		}
	}
	// The seas, as on the real full moon: one joined grey sweep across the upper half, a small round sea
	// near the right edge, and the bright southern highlands with a rayed crater.
	for (const [dx, dy, rx, ry] of [
		[-6, -1, 2.6, 3.6],
		[-3, -4, 3, 2.2],
		[0, -2, 2.6, 2],
		[3, -4, 2, 1.8],
		[4, -1, 2.2, 2],
		[8, -2, 1.2, 1.6],
	]) {
		const cx = MOON.x + dx;
		const cy = MOON.y + dy;
		for (let y = cy - 5; y <= cy + 5; y++) {
			for (let x = cx - 4; x <= cx + 4; x++) {
				if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) {
					set(layer, x, y, MARE);
				}
			}
		}
	}
	const tycho = { x: MOON.x - 1, y: MOON.y + 6 };
	set(layer, tycho.x, tycho.y, C.white);
	for (const [dx, dy] of [
		[0, -2],
		[-2, 1],
		[2, 1],
		[-3, -2],
	]) {
		set(layer, tycho.x + dx, tycho.y + dy, C.moonRim);
	}
}

/**
 * Low hills far off, a pale silhouette under the moon.
 * @param {Canvas} layer
 */
function drawFarHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			50 + 2.2 * Math.sin(x / 6 + 1) + Math.sin(x / 2.6)
		);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, FAR_HILL);
		}
	}
}

/**
 * The row where the hilltop's crest meets the sky at a given column.
 * @param {number} x
 * @returns {number}
 */
function crest(x) {
	return Math.round(50 + ((x - 24) / 36) ** 2 * 11);
}

/**
 * The hilltop: dark grass with a moonlit crest and a few lit tufts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHilltop(layer, random) {
	for (let x = 0; x < 64; x++) {
		const top = crest(x);
		for (let y = top; y < 64; y++) {
			let colour = GRASS;
			if (y - top < 2) {
				colour = GRASS_LIGHT;
			} else if (y > 60 || y - top > 9) {
				colour = GRASS_DARK;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = crest(x) + 3 + Math.floor(random() * 6);
		set(layer, x, y, GRASS_LIGHT);
		set(layer, x, y - 1, GRASS_LIGHT);
	}
	// The tripod's shadow, cast down and to the left by the moon.
	for (const [x0, y0, x1, y1] of [
		[11, 57, 3, 60],
		[22, 58, 13, 62],
		[34, 58, 26, 63],
	]) {
		line(layer, x0, y0, x1, y1, GRASS_DARK);
	}
}

/**
 * The tripod: three wooden legs from the head down to the hilltop, the back one in shadow.
 * @param {Canvas} scene
 */
function drawTripod(scene) {
	/**
	 * One leg, two pixels wide, lit on its right side.
	 * @param {number} fx - Foot column
	 * @param {number} fy - Foot row
	 * @param {Colour} body
	 * @param {Colour} lit
	 */
	const leg = (fx, fy, body, lit) => {
		line(scene, HEAD.x - 1, HEAD.y + 1, fx, fy, body);
		line(scene, HEAD.x, HEAD.y + 1, fx + 1, fy, lit);
	};
	leg(HEAD.x + 3, crest(HEAD.x + 3) + 2, C.timberShade, C.timberShade);
	leg(HEAD.x - 13, crest(HEAD.x - 13) + 5, C.timber, C.timberLight);
	leg(HEAD.x + 13, crest(HEAD.x + 13) + 5, C.timber, C.timberLight);
}

/**
 * The tube's radius at a distance along it: a slim eyepiece, the drawtube, the main tube and the wider dew shield.
 * @param {number} a - Distance from the eyepiece end
 * @returns {number}
 */
function radius(a) {
	if (a < 3) {
		return 1.6;
	}
	if (a < 8) {
		return 2.5;
	}
	if (a < LENGTH - 8) {
		return 3.4 + ((a - 8) / (LENGTH - 16)) * 0.7;
	}
	return 4.9;
}

/**
 * The brass tube, lit along its top by the moon, with dark rings at its joints and the clamp.
 * @param {Canvas} scene
 */
function drawTube(scene) {
	for (let y = 10; y < 56; y++) {
		for (let x = 0; x < 48; x++) {
			const dx = x - TUBE.x0;
			const dy = y - TUBE.y0;
			const a = dx * AXIS.x + dy * AXIS.y;
			const s = dx * UP.x + dy * UP.y;
			if (a < 0 || a > LENGTH) {
				continue;
			}
			const r = radius(a);
			if (Math.abs(s) >= r) {
				continue;
			}
			const side = s / r;
			if (a < 3) {
				set(scene, x, y, side > 0.3 ? C.lampFrame : EYEPIECE);
				continue;
			}
			const ring =
				(a >= 7 && a < 8.5) ||
				(a >= CLAMP - 1.5 && a < CLAMP + 1.5) ||
				(a >= LENGTH - 9 && a < LENGTH - 7.5) ||
				a > LENGTH - 1;
			let colour = C.brass;
			if (side > 0.4) {
				colour = ring ? C.brass : C.gold;
			} else if (side < -0.35) {
				colour = C.lampFrame;
			} else if (ring) {
				colour = C.lampFrame;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The mount: a brass post from the clamp down to the tripod's wooden head.
 * @param {Canvas} scene
 */
function drawMount(scene) {
	rect(scene, HEAD.x - 1, HEAD.y - 4, 2, 4, C.lampFrame);
	set(scene, HEAD.x, HEAD.y - 4, C.brass);
	set(scene, HEAD.x, HEAD.y - 3, C.brass);
	rect(scene, HEAD.x - 3, HEAD.y, 7, 2, C.timber);
	rect(scene, HEAD.x - 3, HEAD.y, 7, 1, C.timberLight);
	// The altitude knob on the clamp's side.
	set(scene, HEAD.x + 2, HEAD.y - 3, C.gold);
	set(scene, HEAD.x + 3, HEAD.y - 3, C.brass);
}

/**
 * A small brass lantern on the grass, its flame lit behind the glass.
 * @param {Canvas} scene
 */
function drawLantern(scene) {
	const { x, y } = LANTERN;
	// The ring handle and the cap.
	set(scene, x + 1, y - 9, C.brass);
	set(scene, x + 3, y - 9, C.brass);
	set(scene, x + 2, y - 10, C.brass);
	rect(scene, x, y - 8, 5, 1, C.brass);
	// The glass, lit by the flame, between two dark posts.
	rect(scene, x, y - 7, 5, 6, C.lampGlow);
	rect(scene, x, y - 7, 1, 6, C.lampFrame);
	rect(scene, x + 4, y - 7, 1, 6, C.lampFrame);
	rect(scene, x + 2, y - 5, 1, 3, C.gold);
	set(scene, x + 2, y - 2, C.amber);
	// The base.
	rect(scene, x - 1, y - 1, 7, 2, C.lampFrame);
	rect(scene, x - 1, y - 1, 7, 1, C.brass);
}

/**
 * Moonlight catching the top of the tube and the rim of the dew shield, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const a of [12, 13, 20, 21, LENGTH - 5, LENGTH - 4]) {
		const r = radius(a) - 1;
		const x = Math.round(TUBE.x0 + AXIS.x * a + UP.x * r);
		const y = Math.round(TUBE.y0 + AXIS.y * a + UP.y * r);
		set(scene, x, y, C.lampGlow);
	}
}
