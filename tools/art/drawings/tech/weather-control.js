// Weather Control: a copper coil machine on a wheeled cart firing a crackling beam up into a storm cloud, rain on one side of it and sun on the other.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ground's first row. */
const GROUND = 56;

/** The coil: its left column, width, top row and last row. */
const COIL = { left: 25, w: 14, top: 31, bottom: 45 };

/** The ring on top of the coil: its centre and radii. */
const TORUS = { x: 32, y: 27, rx: 13, ry: 4 };

/** The ball the beam leaves from. */
const BALL = { x: 32, y: 20 };

/** The cart's cabinet: its left column, width, top row and height. */
const CART = { left: 15, w: 34, top: 46, h: 9 };

/** The two wheels' centres and their radius. */
const WHEELS = [
	{ x: 21, y: 57 },
	{ x: 43, y: 57 },
];
const WHEEL_R = 4.5;

/** Where the beam strikes the cloud. */
const STRIKE = { x: 32, y: 7 };

/** The sun, in the clear sky on the right. */
const SUN = { x: 55, y: 18, r: 5 };

/** The storm sky on the left, from the top down, and the clear day sky on the right. */
const STORM = [
	mix(C.stoneShade, C.stoneMid, 0.5),
	C.stoneMid,
	mix(C.stoneMid, C.stone, 0.5),
	C.stone,
];
const CLEAR = [C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** The storm cloud: its body, its dark underside and the edges the sun catches. */
const CLOUD = mix(C.stoneShade, C.roofShade, 0.45);
const CLOUD_SHADE = mix(C.roofShade, C.ink, 0.3);
const CLOUD_LIGHT = mix(C.stoneMid, C.stone, 0.5);

/** Rain streaks, a little lighter than the storm sky behind them. */
const RAIN = mix(C.stoneLight, C.foam, 0.5);

/** The ground: wet and dark under the storm, bright grass in the sun. */
const GRASS_WET = mix(C.grassShade, C.stoneShade, 0.45);
const GRASS_WET_SHADE = mix(GRASS_WET, C.ink, 0.3);

/** Copper windings: lit, base, shade, and the dark gaps between the turns. */
const COPPER_LIGHT = mix(C.amber, C.gold, 0.35);
const COPPER = mix(C.amber, C.brickRed, 0.45);
const COPPER_SHADE = mix(C.brickRedShade, C.timber, 0.4);
const COPPER_DARK = mix(C.brickRedShade, C.ink, 0.45);

/** The cart's dark iron cabinet: lit, base and shade. */
const IRON_LIGHT = C.stone;
const IRON = mix(C.stoneShade, C.roofShade, 0.3);
const IRON_SHADE = mix(C.roofShade, C.ink, 0.3);

/** The beam: a white core in a pale electric blue. */
const BEAM = C.tealLight;

/**
 * Draws the Weather Control tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(6583);

	drawSky(layer);
	drawSun(layer);
	drawRain(layer, random);
	drawCloud(layer);
	drawGround(layer);
	// The strike lights up the cloud from inside.
	glow(layer, {
		x: STRIKE.x,
		y: STRIKE.y,
		radius: 11,
		colour: C.tealLight,
		strength: 0.45,
		steps: 2,
	});

	drawCart(scene);
	drawWheels(scene);
	drawCoil(scene);
	drawTorus(scene);
	drawBall(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawBeam(scene, random);
	drawCrackles(scene);
	glow(scene, {
		x: BALL.x,
		y: BALL.y,
		radius: 6,
		colour: C.tealLight,
		strength: 0.3,
		steps: 1,
		skip: [C.white, BEAM, C.ink],
	});
	return scene;
}

/**
 * The column where the rain curtain gives way to clear sky in a given row: a slanting line, blown further left lower down.
 * @param {number} y
 * @returns {number}
 */
function divide(y) {
	return Math.round(45 - y * 0.36);
}

/**
 * The sky: clear blue in four bands, with the grey curtain of rain hanging on the left of the divide, its edge broken.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y < GROUND; y++) {
		const band = Math.min(3, Math.floor((y / GROUND) * 4));
		for (let x = 0; x < 64; x++) {
			const edge = x - divide(y);
			const storm = edge < -1 || (edge < 1 && (x + y) % 2 === 0);
			set(layer, x, y, storm ? STORM[band] : CLEAR[band]);
		}
	}
}

/**
 * The sun: a gold disc with a pale heart, in a soft ring of light.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 12,
		colour: C.lampGlow,
		strength: 0.4,
		steps: 2,
	});
	for (let y = SUN.y - SUN.r; y <= SUN.y + SUN.r; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d < SUN.r) {
				set(layer, x, y, d < SUN.r - 2 ? C.lampGlow : C.gold);
			}
		}
	}
}

/**
 * Rain slanting down out of the storm, only inside the curtain.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRain(layer, random) {
	for (let i = 0; i < 36; i++) {
		const x = Math.floor(random() * 50);
		const y = 10 + Math.floor(random() * (GROUND - 12));
		for (let k = 0; k < 3; k++) {
			const px = x - k;
			const py = y + k * 2;
			if (px < divide(py) - 2 && py < GROUND - 1) {
				set(layer, px, py, RAIN);
				set(layer, px, py + 1, RAIN);
			}
		}
	}
}

/** The storm cloud's lumps: centre column, centre row and radius, biggest and lowest on the left over the rain. */
const LUMPS = [
	[-1, 6, 13],
	[12, 7, 9],
	[22, 4, 9],
	[32, 2, 9],
	[41, 3, 8],
	[50, 0, 7],
];

/**
 * Whether a pixel lies inside the storm cloud.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inCloud(x, y) {
	return LUMPS.some(([cx, cy, r]) => Math.hypot(x - cx, (y - cy) * 1.15) < r);
}

/**
 * The storm cloud: dark slate, darkest along its underside, the round tops of its lumps and its right edges caught by the sun.
 * @param {Canvas} layer
 */
function drawCloud(layer) {
	for (let y = 0; y < 24; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inCloud(x, y)) {
				continue;
			}
			let colour = CLOUD;
			if (!inCloud(x, y + 2)) {
				colour = CLOUD_SHADE;
			} else if (!inCloud(x + 2, y - 1) || !inCloud(x + 1, y - 2)) {
				colour = x > 16 ? CLOUD_LIGHT : CLOUD;
			}
			set(layer, x, y, colour);
		}
	}
	// The seams between the lumps, where one bulges in front of the next.
	for (const [cx, cy, r] of LUMPS.slice(1, 5)) {
		for (let a = 0.6; a < 2.2; a += 0.05) {
			const x = Math.round(cx - Math.cos(a) * r);
			const y = Math.round(cy + Math.sin(a) * (r / 1.15));
			if (inCloud(x, y + 2) && get(layer, x, y) === CLOUD) {
				set(layer, x, y, CLOUD_SHADE);
			}
		}
	}
}

/**
 * The ground: dark wet grass on the storm side, bright grass on the sunny side, each with a lit top row.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const sunny = x >= divide(y) + (y - GROUND) * 2;
			let colour;
			if (y === GROUND) {
				colour = sunny ? C.grassLight : GRASS_WET;
			} else {
				colour = sunny ? C.grass : GRASS_WET_SHADE;
			}
			set(layer, x, y, colour);
		}
	}
	// A puddle on the wet side, showing the grey sky.
	rect(layer, 2, 60, 9, 1, STORM[3]);
	rect(layer, 4, 61, 6, 1, STORM[2]);
	// The cart's shadow, cast away from the sun.
	rect(layer, 10, GROUND, 8, 1, GRASS_WET_SHADE);
}

/**
 * The cart's cabinet: dark iron lit from the right, a brass band along its top, rivets and one round gauge.
 * @param {Canvas} scene
 */
function drawCart(scene) {
	const { left, w, top, h } = CART;
	rect(scene, left, top, w, h, IRON);
	rect(scene, left, top, 4, h, IRON_SHADE);
	rect(scene, left + w - 2, top, 2, h, IRON_LIGHT);
	rect(scene, left, top, w, 2, C.brass);
	rect(scene, left + w - 8, top, 8, 1, C.gold);
	rect(scene, left, top + h - 1, w, 1, IRON_SHADE);
	for (let x = left + 3; x < left + w - 2; x += 5) {
		set(scene, x, top + h - 3, IRON_LIGHT);
	}
	// The gauge: a brass ring, a cream face with a needle and no numbers.
	const gx = left + w - 8;
	const gy = top + 5;
	for (let y = gy - 3; y <= gy + 3; y++) {
		for (let x = gx - 3; x <= gx + 3; x++) {
			const d = Math.hypot(x - gx, y - gy);
			if (d < 2.2) {
				set(scene, x, y, C.creamLight);
			} else if (d < 3.4) {
				set(scene, x, y, x + y > gx + gy ? C.brass : C.gold);
			}
		}
	}
	line(scene, gx, gy, gx + 1, gy - 2, C.brickRed);
	set(scene, gx, gy, C.ink);
}

/**
 * The two cart wheels: iron rims, wooden spokes and a brass hub.
 * @param {Canvas} scene
 */
function drawWheels(scene) {
	for (const wheel of WHEELS) {
		for (let y = wheel.y - 5; y <= wheel.y + 5; y++) {
			for (let x = wheel.x - 5; x <= wheel.x + 5; x++) {
				const d = Math.hypot(x - wheel.x, y - wheel.y);
				if (d >= WHEEL_R) {
					continue;
				}
				if (d >= WHEEL_R - 1.2) {
					set(
						scene,
						x,
						y,
						x - wheel.x + (y - wheel.y) < 0 ? IRON : IRON_LIGHT
					);
				} else {
					set(scene, x, y, IRON_SHADE);
				}
			}
		}
		line(scene, wheel.x - 3, wheel.y, wheel.x + 3, wheel.y, C.timberLight);
		line(scene, wheel.x, wheel.y - 3, wheel.x, wheel.y + 3, C.timberLight);
		set(scene, wheel.x, wheel.y, C.gold);
	}
}

/**
 * The coil: copper wire wound in tight turns round a tall drum, lit from the sunny right, with brass collars at each end.
 * @param {Canvas} scene
 */
function drawCoil(scene) {
	const { left, w, top, bottom } = COIL;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x < left + w; x++) {
			const u = (x - left) / (w - 1);
			const gap = (y - top) % 2 === 1;
			let colour;
			if (u > 0.72) {
				colour = gap ? COPPER : COPPER_LIGHT;
			} else if (u > 0.25) {
				colour = gap ? COPPER_SHADE : COPPER;
			} else {
				colour = gap ? COPPER_DARK : COPPER_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	for (const y of [top - 1, bottom + 1]) {
		rect(scene, left - 1, y, w + 2, 1, C.brass);
		rect(scene, left + w - 4, y, 5, 1, C.gold);
		set(scene, left - 1, y, C.lampFrame);
	}
}

/**
 * The polished steel ring on top of the coil: a flattened doughnut seen from the side, lit on its upper right.
 * @param {Canvas} scene
 */
function drawTorus(scene) {
	const { x: cx, y: cy, rx, ry } = TORUS;
	for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const nx = (x - cx) / rx;
			const ny = (y - cy) / ry;
			if (nx * nx + ny * ny >= 1) {
				continue;
			}
			const light = 0.5 * nx - 0.85 * ny;
			let colour = C.stone;
			if (light > 0.55) {
				colour = C.snow;
			} else if (light > -0.2) {
				colour = C.stoneLight;
			}
			set(scene, x, y, colour);
		}
	}
	// The rod up to the ball.
	rect(scene, cx, BALL.y + 2, 1, cy - ry - BALL.y - 1, C.brass);
}

/**
 * The brass ball the beam leaves from.
 * @param {Canvas} scene
 */
function drawBall(scene) {
	for (let y = BALL.y - 2; y <= BALL.y + 2; y++) {
		for (let x = BALL.x - 2; x <= BALL.x + 2; x++) {
			const d = Math.hypot(x - BALL.x, y - BALL.y);
			if (d < 2.4) {
				set(
					scene,
					x,
					y,
					x - BALL.x - (y - BALL.y) > 1 ? C.gold : C.brass
				);
			}
		}
	}
	set(scene, BALL.x + 1, BALL.y - 1, C.lampGlow);
}

/**
 * The beam: a straight white core wrapped in a jagged electric-blue bolt, from the ball up into the cloud, which it lights where it strikes.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBeam(scene, random) {
	const from = BALL.y - 3;
	for (let y = STRIKE.y; y <= from; y++) {
		set(scene, BALL.x - 1, y, BEAM);
		set(scene, BALL.x + 1, y, BEAM);
	}
	let px = BALL.x;
	let py = from;
	for (let y = from - 2; y >= STRIKE.y; y -= 2) {
		const nx = BALL.x + Math.round((random() - 0.5) * 6);
		line(scene, px, py, nx, y, BEAM);
		px = nx;
		py = y;
	}
	for (let y = STRIKE.y; y <= from; y++) {
		set(scene, BALL.x, y, C.white);
	}
	// Forks of lightning spreading through the cloud from the strike.
	for (const [x0, y0, x1, y1, x2, y2] of [
		[32, 8, 26, 5, 20, 7],
		[32, 8, 37, 4, 43, 5],
		[32, 8, 29, 2, 31, 0],
	]) {
		line(scene, x0, y0, x1, y1, C.white);
		line(scene, x1, y1, x2, y2, BEAM);
	}
}

/**
 * Little sparks jumping off the steel ring into the air.
 * @param {Canvas} scene
 */
function drawCrackles(scene) {
	for (const [x0, y0, x1, y1, x2, y2] of [
		[19, 26, 16, 24, 14, 26],
		[45, 26, 48, 23, 51, 24],
	]) {
		line(scene, x0, y0, x1, y1, BEAM);
		line(scene, x1, y1, x2, y2, C.white);
	}
}
