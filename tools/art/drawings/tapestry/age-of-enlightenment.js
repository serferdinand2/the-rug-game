// Age of Enlightenment: a thinker on a hilltop at dawn, the sun breaking through the clouds over a city of spires.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, the city's foot, and the rising sun (seed 1789 sets the dusk sky's own sun under it). */
const HORIZON = 44;
const CITY = 47;
const SUN = { x: 41, y: 40, r: 7 };

/** The hilltop the thinker stands on: its crest row and columns. */
const CREST = { y: 46, left: 5, right: 18 };

/** The city's far haze colours: lit walls, walls in shadow, and the rim of light along their tops. */
const BODY = mix(C.roof, C.duskSky3, 0.3);
const SHADE = mix(C.roofShade, C.duskSky2, 0.3);
const RIM = mix(C.duskSky5, C.gold, 0.35);

/**
 * The thinker, facing the sunrise: a tricorn hat, a powdered wig, a blue coat over a gold waistcoat,
 * a book under one arm and the other hand raised towards the light.
 * k hat, w wig, S skin, s skin shade, C coat, c coat shade, r coat lit by the sun, W cravat, V waistcoat,
 * P pages, b binding, L stockings, B shoes.
 */
const THINKER = [
	'.....kkk......',
	'...kkkkkkk..SS',
	'....wwSSS...SS',
	'...wwwSSs..rC.',
	'....w.SS..rC..',
	'.....cCWWrC...',
	'....cCCWVr....',
	'...bcCCVVCr...',
	'..bPPcCVVCr...',
	'..bPPcCVVCr...',
	'...bcCCVVCr...',
	'....cCCCCCr...',
	'...ccCC.CCCr..',
	'...cCC...CCr..',
	'...ccC...CCr..',
	'....LL...LL...',
	'....LL...LL...',
	'...BBB...BBB..',
];

/**
 * Draws the Age of Enlightenment scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1789);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawRays(layer);
	drawClouds(layer);
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 21,
		colour: C.lampGlow,
		strength: 0.55,
	});
	drawSun(layer);
	drawValley(layer, random);
	drawCity(layer);

	drawHill(scene, random);
	paint(scene, 8, CREST.y - THINKER.length, THINKER, {
		k: C.night,
		w: C.stoneLight,
		S: C.skin,
		s: C.skinShade,
		C: C.nightSea1,
		c: C.nightSea3,
		r: C.daySea1,
		W: C.creamLight,
		V: C.gold,
		P: C.creamLight,
		b: C.brickRed,
		L: C.cream,
		B: C.wood,
	});
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCrestLight(scene);
	return scene;
}

/**
 * Rays of light fanning out of the rising sun across the whole sky, fading with distance.
 * @param {Canvas} layer
 */
function drawRays(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		for (let x = 0; x < 64; x++) {
			const angle = Math.atan2(SUN.y - y, x - SUN.x);
			const band = Math.floor(angle / (Math.PI / 12));
			const distance = Math.hypot(x - SUN.x, y - SUN.y);
			if (band % 2 !== 0 || distance < SUN.r) {
				continue;
			}
			const colour = get(layer, x, y);
			if (colour && colour !== C.starDim) {
				set(
					layer,
					x,
					y,
					mix(colour, C.gold, distance < 24 ? 0.36 : 0.2)
				);
			}
		}
	}
}

/**
 * Long banks of dawn cloud, dark violet on top and lit gold underneath where the sun breaks through.
 * @param {Canvas} layer
 */
function drawClouds(layer) {
	for (const [cx, cy, rx, ry] of [
		[10, 8, 14, 3],
		[55, 12, 12, 3],
		[24, 23, 15, 3],
		[61, 28, 9, 2],
		[2, 34, 8, 2],
	]) {
		for (let y = cy - ry - 1; y <= cy + ry; y++) {
			for (let x = cx - rx; x <= cx + rx; x++) {
				const bump = Math.sin(x * 0.7 + cy) * 1.1;
				const d = ((x - cx) / rx) ** 2 + ((y - cy + bump) / ry) ** 2;
				if (d > 1) {
					continue;
				}
				const near = Math.hypot(x - SUN.x, y - SUN.y) < 26;
				let colour = C.duskSky3;
				if (y >= cy + ry - 1) {
					colour = near ? C.gold : C.duskSky6;
				} else if (y >= cy + ry - 2) {
					colour = near ? C.duskSky6 : C.duskSky5;
				} else if (y < cy - ry * 0.3) {
					colour = C.duskSky2;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * The sun's disc rising behind the rooftops: white-hot in the middle with a gold rim.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - SUN.r; y <= HORIZON; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d <= SUN.r + 0.3) {
				set(
					layer,
					x,
					y,
					d > SUN.r - 1.3 ? C.gold : d > 3.5 ? C.lampGlow : C.white
				);
			}
		}
	}
}

/**
 * The valley below the city: a river mirroring the sunrise, then fields and hedgerows in the morning haze.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawValley(layer, random) {
	const ridge = mix(C.duskSky4, C.roof, 0.35);
	const water = mix(C.duskSky5, C.duskSky4, 0.5);
	const far = mix(C.grassShade, C.duskSky3, 0.5);
	const near = mix(C.grassShade, C.roof, 0.4);
	for (let x = 0; x < 64; x++) {
		const top = HORIZON - 1 + Math.round(Math.sin(x * 0.25) * 1.2);
		for (let y = top; y < 64; y++) {
			let colour = near;
			if (y < CITY) {
				colour = ridge;
			} else if (y <= CITY + 2) {
				colour = water;
			} else if (y < CITY + 7) {
				colour = far;
			}
			set(layer, x, y, colour);
		}
	}
	// The sun's reflection on the river.
	for (let y = CITY; y <= CITY + 2; y++) {
		const half = 5 - (y - CITY) * 2;
		for (let x = SUN.x - half; x <= SUN.x + half; x++) {
			set(layer, x, y, y === CITY ? C.lampGlow : C.gold);
		}
	}
	rect(layer, 22, CITY + 1, 4, 1, C.duskSky6);
	rect(layer, 52, CITY + 1, 5, 1, C.duskSky6);
	// Hedgerows between the fields.
	for (let i = 0; i < 16; i++) {
		const x = 18 + Math.floor(random() * 46);
		const y = CITY + 4 + Math.floor(random() * 13);
		rect(layer, x, y, 2 + Math.floor(random() * 4), 1, C.roofShade);
	}
}

/**
 * The city across the river: rows of gabled houses, slender church spires and a domed hall,
 * hazy violet against the sunrise, with lit windows and a rim of light along their tops.
 * @param {Canvas} canvas
 */
function drawCity(canvas) {
	// Houses with gables, low across the whole city so the sun shows above them.
	for (let x = 16; x < 64; x += 4) {
		const top = CITY - 3 - ((x * 7) % 3);
		for (let i = 0; i < 4; i++) {
			const peak = i === 1 || i === 2 ? 1 : 0;
			for (let y = top - peak; y < CITY; y++) {
				set(canvas, x + i, y, i === 3 ? SHADE : BODY);
			}
			set(canvas, x + i, top - peak, RIM);
		}
	}
	spire(canvas, 20, 30, 3);
	spire(canvas, 27, 23, 3);
	spire(canvas, 33, 32, 3);
	spire(canvas, 51, 23, 3);
	dome(canvas, 59, 32);
	// Lit windows.
	for (const [x, y] of [
		[17, 45],
		[25, 44],
		[33, 45],
		[37, 44],
		[49, 45],
		[56, 44],
		[58, 45],
		[21, 37],
		[28, 31],
		[34, 40],
		[52, 31],
		[59, 41],
	]) {
		set(canvas, x, y, C.gold);
	}
}

/**
 * A church tower topped by a tall thin spire, a ball and a cross.
 * @param {Canvas} canvas
 * @param {number} x - The tower's leftmost column
 * @param {number} top - The cross's top row
 * @param {number} w - The tower's width, odd
 */
function spire(canvas, x, top, w) {
	const cx = x + (w - 1) / 2;
	const spireTop = top + 3;
	const towerTop = spireTop + 8;
	rect(canvas, x - 1, towerTop, w + 2, CITY - towerTop, BODY);
	rect(canvas, x + w, towerTop, 1, CITY - towerTop, SHADE);
	rect(canvas, x - 1, towerTop, w + 2, 1, RIM);
	for (let y = spireTop; y < towerTop; y++) {
		set(canvas, cx, y, BODY);
		if (y >= spireTop + 4) {
			set(canvas, cx - 1, y, BODY);
			set(canvas, cx + 1, y, SHADE);
		}
	}
	set(canvas, cx, spireTop, RIM);
	// The cross above the ball.
	set(canvas, cx, top, BODY);
	set(canvas, cx - 1, top + 1, BODY);
	set(canvas, cx, top + 1, BODY);
	set(canvas, cx + 1, top + 1, BODY);
	set(canvas, cx, top + 2, BODY);
	// The belfry's lit opening.
	set(canvas, cx, towerTop + 2, C.gold);
	set(canvas, cx, towerTop + 3, C.gold);
}

/**
 * A domed hall with a lantern on top, standing in front of the sun.
 * @param {Canvas} canvas
 * @param {number} cx - The dome's centre column
 * @param {number} top - The lantern's top row
 */
function dome(canvas, cx, top) {
	const base = top + 8;
	rect(canvas, cx - 5, base, 11, CITY - base, BODY);
	rect(canvas, cx + 4, base, 2, CITY - base, SHADE);
	for (let y = top + 3; y < base; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			if (Math.hypot((x - cx) / 4.5, (y - base) / 5.2) <= 1) {
				set(canvas, x, y, x > cx + 1 ? SHADE : BODY);
			}
		}
	}
	rect(canvas, cx - 1, top + 2, 3, 1, RIM);
	rect(canvas, cx, top, 1, 2, BODY);
	for (let x = cx - 4; x <= cx - 1; x++) {
		const y = top + 3 + Math.round(Math.abs(x - cx) * 0.5);
		set(canvas, x, y + (x === cx - 4 ? 1 : 0), RIM);
	}
	rect(canvas, cx - 5, base, 11, 1, RIM);
}

/**
 * The hill in the foreground, its crest on the left where the thinker stands, sloping away into the valley.
 * Grass in the shadow of dawn, with tufts and a few pale flowers.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawHill(scene, random) {
	const lit = mix(C.grass, C.duskSky5, 0.35);
	const grass = mix(C.grassShade, C.roof, 0.35);
	const deep = mix(C.forestFloorShade, C.roofShade, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = hillTop(x);
		for (let y = top; y < 64; y++) {
			const depth = y - top;
			let colour = depth === 0 ? lit : depth > 9 ? deep : grass;
			if (depth > 7 && depth <= 9 && (x + y) % 2 === 0) {
				colour = deep;
			}
			set(scene, x, y, colour);
		}
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = hillTop(x) + 2 + Math.floor(random() * 14);
		set(scene, x, y, random() > 0.75 ? C.cream : lit);
	}
}

/**
 * The hill's top row at a column: a level crest on the left, falling away to the right.
 * @param {number} x
 * @returns {number}
 */
function hillTop(x) {
	if (x < CREST.left) {
		return CREST.y + Math.round((CREST.left - x) * 0.4);
	}
	if (x <= CREST.right) {
		return CREST.y;
	}
	return CREST.y + Math.round((x - CREST.right) ** 1.25 * 0.16);
}

/**
 * The sunrise catching the hill's crest, drawn after the outline.
 * @param {Canvas} scene
 */
function drawCrestLight(scene) {
	for (let x = CREST.left; x <= CREST.right + 8; x++) {
		const y = hillTop(x);
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, mix(C.grassLight, C.gold, 0.45));
		}
	}
}
