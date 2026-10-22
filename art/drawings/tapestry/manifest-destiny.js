// Manifest Destiny: a train of covered wagons rolling west across the prairie towards mountains at sunset.
import {
	createCanvas,
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
import { drawSky } from '../../parts/sky.js';
import { drawWheel } from '../../parts/wheel.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon, and the setting sun's centre (seed 7405 puts the dusk sky's own sun beside it). */
const HORIZON = 38;
const SUN_X = 45;
const SUN_Y = 28;

/** The far mountains' peaks: column and height above the horizon. */
const PEAKS = [
	[6, 5],
	[22, 9],
	[36, 12],
	[54, 17],
	[66, 11],
];

/** The prairie at sunset: lit grass, grass, shaded grass, and the dusty trail. */
const GRASS_LIGHT = mix(C.gold, C.duskSky6, 0.35);
const GRASS = mix(mix(C.amber, C.timber, 0.35), C.grassShade, 0.25);
const GRASS_SHADE = mix(C.timber, C.duskSky3, 0.45);
const DUST = mix(C.sand, C.duskSky5, 0.25);
const DUST_SHADE = mix(C.sandShade, C.duskSky4, 0.35);

/** The wagon cover's canvas, warmed by the low sun on its right. */
const CANVAS_LIT = mix(C.creamLight, C.gold, 0.3);
const CANVAS = mix(C.cream, C.duskSky6, 0.12);
const CANVAS_SHADE = mix(C.creamShade, C.duskSky4, 0.3);

/** The lead wagon: its bed's first and last columns, the bed's top row and the ground under its wheels. */
const BED_LEFT = 2;
const BED_RIGHT = 31;
const BED_TOP = 47;
const COVER = 14;
const GROUND = 63;

/**
 * Draws the Manifest Destiny scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7405);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawSun(layer);
	drawMountains(layer);
	drawPrairie(layer, random);

	const train = createCanvas(64, 64);
	drawSmallWagon(train, 38, 46, 2);
	drawSmallWagon(train, 52, 42, 1);
	outline(train, C.ink);

	drawCover(scene);
	drawBed(scene);
	drawOxen(scene);
	drawFigure(scene, { x: 36, y: 62, facing: 'right', clothes: C.brickRed });
	outline(scene, C.ink);
	underlay(scene, train);
	underlay(scene, layer);
	drawWheels(scene);
	return scene;
}

/**
 * The low sun, large and gold, sinking towards a saddle in the mountains, with a warm glow around it.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN_Y - 6; y <= SUN_Y + 6; y++) {
		for (let x = SUN_X - 6; x <= SUN_X + 6; x++) {
			const d = Math.hypot(x - SUN_X, y - SUN_Y);
			if (d <= 5.6) {
				set(layer, x, y, d <= 3.6 ? C.lampGlow : C.gold);
			}
		}
	}
	glow(layer, {
		x: SUN_X,
		y: SUN_Y,
		radius: 15,
		colour: C.duskSky6,
		strength: 0.45,
		steps: 3,
		skip: [C.lampGlow, C.gold],
	});
}

/**
 * The height of the far range above the horizon at a column.
 * @param {number} x
 * @returns {number}
 */
function ridge(x) {
	return Math.max(0, ...PEAKS.map(([px, h]) => h - Math.abs(x - px) * 0.9));
}

/**
 * The far mountains: blue-violet peaks with snow flushed pink, their sunward slopes lit, and a
 * lower, darker range of foothills in front.
 * @param {Canvas} layer
 */
function drawMountains(layer) {
	const rock = mix(C.duskSky3, C.roofLight, 0.35);
	const rockLit = mix(C.duskSky4, C.duskSky5, 0.4);
	const snow = mix(C.snow, C.duskSky6, 0.35);
	const snowShade = mix(C.snowShade, C.duskSky4, 0.45);
	for (let x = 0; x < 64; x++) {
		const h = ridge(x);
		const top = Math.round(HORIZON - h);
		// Which way the slope faces: rising to the right faces away from the sun.
		const lit = ridge(x + 1) < h;
		for (let y = top; y <= HORIZON; y++) {
			let colour = lit ? rockLit : rock;
			if (y - top < 3 && h > 8) {
				colour = lit ? snow : snowShade;
			}
			set(layer, x, y, colour);
		}
	}
	const hills = mix(C.roof, C.duskSky2, 0.4);
	const hillsTop = mix(C.roofLight, C.duskSky3, 0.5);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			HORIZON -
				2.5 +
				Math.sin(x * 0.17 + 0.6) * 1.8 +
				Math.sin(x * 0.41) * 0.7
		);
		for (let y = top; y <= HORIZON + 1; y++) {
			set(layer, x, y, y === top ? hillsTop : hills);
		}
	}
}

/**
 * The prairie: golden grass catching the last light, darker towards the viewer, with the
 * wagons' dusty trail curving away to the far wagons and the mountains.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPrairie(layer, random) {
	for (let y = HORIZON + 2; y < 64; y++) {
		const t = (y - HORIZON) / (64 - HORIZON);
		for (let x = 0; x < 64; x++) {
			let colour = GRASS;
			if (y === HORIZON + 2) {
				colour = GRASS_LIGHT;
			} else if (t > 0.75 || (t > 0.5 && (x + y) % 2 === 0)) {
				colour = GRASS_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	// The trail: wide and near at the bottom left, narrowing as it bends away to the right.
	for (let y = HORIZON + 3; y < 64; y++) {
		const t = (y - HORIZON) / (64 - HORIZON);
		const centre = 60 - Math.pow(t, 0.8) * 46;
		const half = 1 + t * 9;
		for (
			let x = Math.round(centre - half);
			x <= Math.round(centre + half);
			x++
		) {
			const rut =
				Math.abs(Math.abs(x - centre) - half * 0.55) < 0.6 && t > 0.3;
			set(layer, x, y, rut ? DUST_SHADE : DUST);
		}
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 4 + Math.floor(random() * (60 - HORIZON));
		set(layer, x, y, random() > 0.5 ? GRASS_LIGHT : GRASS_SHADE);
		set(layer, x, y - 1, GRASS);
	}
}

/**
 * The lead wagon's cover: canvas stretched over hoops, rising at both ends and sagging a little
 * between, its open front puckered round a dark mouth, lit by the sun on its right.
 * @param {Canvas} scene
 */
function drawCover(scene) {
	const left = BED_LEFT + 1;
	const right = BED_RIGHT - 1;
	for (let x = left; x <= right; x++) {
		const t = (x - left) / (right - left);
		const top = Math.round(
			BED_TOP -
				COVER +
				Math.sin(Math.PI * t) * 1.5 -
				(t < 0.06 || t > 0.94 ? 1 : 0)
		);
		for (let y = top; y < BED_TOP; y++) {
			let colour = CANVAS;
			if (y === top || x >= right - 2) {
				colour = CANVAS_LIT;
			} else if (x <= left + 1 || y === BED_TOP - 1) {
				colour = CANVAS_SHADE;
			} else if ((x - left) % 5 === 2) {
				colour = CANVAS_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The puckered opening at the front, looking into the dark wagon.
	for (let y = BED_TOP - 10; y < BED_TOP - 1; y++) {
		const inset = Math.abs(y - (BED_TOP - 6)) > 3 ? 1 : 0;
		rect(scene, right - 4 + inset, y, 3 - inset, 1, C.roofShade);
	}
}

/**
 * The lead wagon's bed: a blue-painted box with a dark rail, the tongue reaching forward to the yoke.
 * @param {Canvas} scene
 */
function drawBed(scene) {
	for (let y = BED_TOP; y <= BED_TOP + 4; y++) {
		for (let x = BED_LEFT; x <= BED_RIGHT; x++) {
			let colour = C.daySea2;
			if (y === BED_TOP) {
				colour = C.timberLight;
			} else if (y === BED_TOP + 4 || x === BED_LEFT) {
				colour = C.daySea3;
			} else if ((x - BED_LEFT) % 6 === 0) {
				colour = C.daySea3;
			}
			set(scene, x, y, colour);
		}
	}
	// The running gear under the box, and the tongue.
	rect(
		scene,
		BED_LEFT + 3,
		BED_TOP + 5,
		BED_RIGHT - BED_LEFT - 5,
		1,
		C.timberShade
	);
	line(scene, BED_RIGHT, BED_TOP + 5, BED_RIGHT + 13, BED_TOP + 6, C.timber);
}

/**
 * The team: two yoked oxen plodding towards the mountains, the far one darker and a step ahead.
 * @param {Canvas} scene
 */
function drawOxen(scene) {
	const ox = [
		'..........cc.',
		'.bbbbbbbbbhhc',
		'bBBBBBBBBBhhh',
		'BBBBBBBBBBBhn',
		'BBBBBBBBBBB..',
		'.BBBBBBBBB...',
		'.l.l...l.l...',
		'.l.l...l.l...',
		'.k.k...k.k...',
	];
	paint(scene, 46, 50, ox, {
		b: C.timberShade,
		B: C.wood,
		h: C.wood,
		c: C.creamShade,
		n: C.ink,
		l: C.wood,
		k: C.ink,
	});
	paint(scene, 43, 52, ox, {
		b: C.timberLight,
		B: C.timber,
		h: C.timberShade,
		c: C.cream,
		n: C.wood,
		l: C.timberShade,
		k: C.wood,
	});
	// The yoke across their necks.
	rect(scene, 52, 52, 1, 4, C.timberLight);
}

/**
 * A wagon further along the trail, smaller with distance: a white cover, a blue bed and two dark wheels.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - The ground under its wheels
 * @param {1 | 2} size - 2 for the middle wagon, 1 for the far one
 */
function drawSmallWagon(canvas, x, y, size) {
	const w = size === 2 ? 10 : 5;
	const h = size === 2 ? 5 : 2;
	const bed = y - (size === 2 ? 4 : 2);
	for (let i = 0; i < w; i++) {
		const top = bed - h + (i === 0 || i === w - 1 ? 1 : 0);
		for (let j = top; j < bed; j++) {
			set(
				canvas,
				x + i,
				j,
				i >= w - 2 ? CANVAS_LIT : j === bed - 1 ? CANVAS_SHADE : CANVAS
			);
		}
	}
	rect(canvas, x, bed, w, size, C.daySea2);
	for (const wx of [x + 1, x + w - 2]) {
		rect(canvas, wx, bed + size, size, size, C.wood);
	}
	// Its team, a dark smudge ahead on the trail.
	rect(
		canvas,
		x + w + 1,
		bed - 1 + (size === 2 ? 1 : 0),
		size * 3,
		size + 1,
		C.wood
	);
}

/**
 * The lead wagon's wheels, red-painted with dark tyres, the back pair taller: drawn after the
 * outline so the spokes stay open.
 * @param {Canvas} scene
 */
function drawWheels(scene) {
	drawWheel(scene, {
		x: BED_LEFT + 8,
		y: GROUND - 8,
		r: 8,
		spoke: C.brickRed,
	});
	drawWheel(scene, {
		x: BED_RIGHT - 6,
		y: GROUND - 7,
		r: 7,
		spoke: C.brickRed,
	});
}
