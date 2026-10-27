// Ammonia: a riveted steel pressure reactor at dusk, its gauge and valves lit by the low sun, a sack of fertiliser spilling at its foot before rows of green crops.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A metal's colours, from the edge facing the sun to the edge away from it.
 * @typedef {Object} Tone
 * @property {Colour} glint - The brightest gleam
 * @property {Colour} lit - Facing the sun
 * @property {Colour} base - The body
 * @property {Colour} shade - Turning away
 * @property {Colour} dark - Facing away
 */

/** The far edge of the fields: the last row of sky. */
const HORIZON = 30;

/** The reactor's body: a tall cylinder under a domed head, standing on a concrete plinth. */
const VESSEL = { x0: 31, x1: 52, top: 18, bottom: 51, dome: 8 };

/** The vessel's centre column and half its width. */
const CX = (VESSEL.x0 + VESSEL.x1) / 2;
const HALF = (VESSEL.x1 - VESSEL.x0 + 1) / 2;

/** The pressure gauge on its stem, on the sunny side of the vessel. */
const GAUGE = { x: 23, y: 31, r: 6 };

/** The way the light comes: from the setting sun, low on the left. */
const LIGHT = normalise(-1, -0.35);

/** Riveted steel, warmed on the sunny side by the dusk. */
const STEEL = {
	glint: mix(C.stoneLight, C.lampGlow, 0.6),
	lit: mix(C.stoneLight, C.duskSky6, 0.42),
	base: mix(C.stone, C.duskSky4, 0.22),
	shade: mix(C.stoneShade, C.duskSky2, 0.3),
	dark: mix(C.stoneShade, C.roofShade, 0.75),
};

/** The purple of the evening sky, caught on the vessel's far edge. */
const SKY_BOUNCE = mix(C.stoneShade, C.duskSky3, 0.55);

/** The red hand wheels of the valves. */
const WHEEL = {
	glint: mix(C.brickRedLight, C.lampGlow, 0.4),
	lit: C.brickRedLight,
	base: C.brickRed,
	shade: C.brickRedShade,
	dark: mix(C.brickRedShade, C.ink, 0.4),
};

/** The burlap sack. */
const BURLAP = {
	glint: mix(C.sandLight, C.lampGlow, 0.35),
	lit: mix(C.sandLight, C.duskSky6, 0.2),
	base: C.sand,
	shade: C.sandShade,
	dark: mix(C.sandShade, C.timber, 0.55),
};

/** The fertiliser pellets: white, warmed by the sun on top. */
const PELLET = {
	lit: mix(C.white, C.duskSky6, 0.12),
	base: C.creamLight,
	shade: mix(C.snowShade, C.duskSky3, 0.2),
};

/** The concrete of the plinth. */
const CONCRETE = {
	lit: mix(C.creamLight, C.duskSky6, 0.3),
	base: mix(C.cream, C.stone, 0.35),
	shade: mix(C.stoneShade, C.duskSky2, 0.3),
};

/** The bare soil in front of the field. */
const SOIL = {
	lit: mix(C.floorLight, C.duskSky5, 0.2),
	base: C.floor,
	dark: C.floorShade,
};

/** Every colour lit by hand, which the sun's glow leaves as painted. */
const HAND_LIT = [
	...Object.values(STEEL),
	SKY_BOUNCE,
	...Object.values(WHEEL),
	...Object.values(BURLAP),
	...Object.values(PELLET),
	...Object.values(CONCRETE),
	C.ink,
	C.white,
	C.cream,
	C.creamShade,
	C.wood,
	C.brickRed,
];

/**
 * Draws the Ammonia tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1909);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	const sun = { x: findSun(layer), y: HORIZON };
	drawTreeLine(layer, random, sun.x);
	drawField(layer, random);
	drawSoil(layer, random);
	drawLongShadow(layer);
	drawSmoke(layer, { x: 48, y: 5, tone: 'steam', puffs: 3, drift: 1 });

	drawPipes(scene);
	drawPlinth(scene);
	drawBody(scene);
	drawDome(scene);
	drawSeams(scene);
	drawGauge(scene);
	drawValves(scene);
	drawReliefValve(scene);
	drawSack(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: sun.x,
		y: sun.y,
		radius: 30,
		colour: C.gold,
		strength: 0.35,
		steps: 4,
		skip: HAND_LIT,
	});
	drawPellets(scene, random);
	drawGleams(scene);
	return scene;
}

/**
 * Makes a vector one pixel long.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function normalise(x, y) {
	const length = Math.hypot(x, y);
	return { x: x / length, y: y / length };
}

/**
 * Picks a tone by how much a surface faces the light, from 1 (straight at it) to -1 (straight away).
 * @param {number} facing
 * @param {Tone} tone
 * @returns {Colour}
 */
function toneFor(facing, tone) {
	if (facing > 0.72) {
		return tone.glint;
	}
	if (facing > 0.25) {
		return tone.lit;
	}
	if (facing > -0.3) {
		return tone.base;
	}
	if (facing > -0.7) {
		return tone.shade;
	}
	return tone.dark;
}

/**
 * Finds the column of the sun the sky part set on the horizon.
 * @param {Canvas} layer
 * @returns {number}
 */
function findSun(layer) {
	for (let x = 0; x < 64; x++) {
		if (get(layer, x, HORIZON) === C.lampGlow) {
			return x + 3;
		}
	}
	return 10;
}

/**
 * A line of far trees along the horizon, dark against the sunset, with a gap where the sun sinks.
 * @param {Canvas} layer
 * @param {() => number} random
 * @param {number} sunX
 */
function drawTreeLine(layer, random, sunX) {
	const far = mix(C.pineShade, C.duskSky3, 0.55);
	const near = mix(C.pineShade, C.duskSky2, 0.4);
	for (let x = 0; x < 64; x++) {
		if (Math.abs(x - sunX) < 7) {
			continue;
		}
		const height = 1 + Math.round(1.5 + Math.sin(x * 0.9) + random() * 1.4);
		for (let y = HORIZON - height; y <= HORIZON; y++) {
			set(layer, x, y, y === HORIZON ? near : far);
		}
	}
}

/**
 * The crop field: rows of green plants running away towards the horizon, their leafy edges lit on the sunny side.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawField(layer, random) {
	const vanish = 36;
	for (let y = HORIZON + 1; y < 64; y++) {
		const depth = y - HORIZON;
		const near = depth / (64 - HORIZON);
		for (let x = 0; x < 64; x++) {
			// Which row this pixel is in, with a little jitter so the leaves break up the edges.
			const across =
				((x - vanish) / (depth + 1)) * 4.2 + (random() - 0.5) * 0.22;
			const f = across - Math.floor(across);
			let colour;
			if (f < 0.62) {
				colour = C.grass;
				if (f < 0.18) {
					colour =
						near > 0.3
							? mix(C.grassLight, C.gold, 0.25)
							: C.grassLight;
				} else if (f > 0.46) {
					colour = C.grassShade;
				}
			} else {
				colour =
					f > 0.85
						? C.forestFloorShade
						: mix(C.forestFloorShade, C.floorShade, 0.5);
			}
			// The far rows melt into the evening haze.
			if (depth <= 3) {
				colour = mix(C.grass, C.duskSky5, 0.55 - depth * 0.1);
			} else if (depth <= 7) {
				colour = mix(colour, C.duskSky5, 0.3 - depth * 0.03);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The bare soil where the plinth stands, in front of the field.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSoil(layer, random) {
	for (let y = 56; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const edge = 56 + Math.round(Math.sin(x * 0.5) * 0.8);
			if (y < edge) {
				continue;
			}
			set(
				layer,
				x,
				y,
				y === edge ? SOIL.lit : y > 60 ? SOIL.dark : SOIL.base
			);
		}
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = 58 + Math.floor(random() * 6);
		set(layer, x, y, random() < 0.5 ? SOIL.lit : SOIL.dark);
	}
}

/**
 * The vessel's long evening shadow, cast away from the low sun across the ground on the right.
 * @param {Canvas} layer
 */
function drawLongShadow(layer) {
	for (let y = 50; y < 64; y++) {
		for (let x = VESSEL.x1 + 1; x < 64; x++) {
			const run = x - VESSEL.x1;
			if (y < 52 + run * 0.35 || y > 57 + run * 0.6) {
				continue;
			}
			const here = get(layer, x, y);
			if (here) {
				set(layer, x, y, mix(here, C.night, 0.4));
			}
		}
	}
}

/**
 * Paints a round tube along a path of points, shaded across its width by how each side faces the light.
 * @param {Canvas} canvas
 * @param {[number, number][]} points - The tube's centre line
 * @param {number} radius
 * @param {Tone} tone
 */
function tube(canvas, points, radius, tone) {
	/** @type {[number, number][]} */
	const samples = [];
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 3);
		for (let k = 0; k <= steps; k++) {
			samples.push([
				x0 + ((x1 - x0) * k) / steps,
				y0 + ((y1 - y0) * k) / steps,
			]);
		}
	}
	const xs = samples.map(([x]) => x);
	const ys = samples.map(([, y]) => y);
	const reach = Math.ceil(radius) + 1;
	for (
		let y = Math.floor(Math.min(...ys)) - reach;
		y <= Math.max(...ys) + reach;
		y++
	) {
		for (
			let x = Math.floor(Math.min(...xs)) - reach;
			x <= Math.max(...xs) + reach;
			x++
		) {
			let best = Infinity;
			let dx = 0;
			let dy = 0;
			for (const [sx, sy] of samples) {
				const d = Math.hypot(x - sx, y - sy);
				if (d < best) {
					best = d;
					dx = x - sx;
					dy = y - sy;
				}
			}
			if (best <= radius) {
				const facing = (dx * LIGHT.x + dy * LIGHT.y) / radius;
				set(canvas, x, y, toneFor(facing * 1.3, tone));
			}
		}
	}
}

/**
 * The steel pipework: from the nozzle on the dome, up and over to the left and down into the ground;
 * a heavy main from the dome's shoulder and another from the vessel's side, both leaving to the right for the rest of the plant.
 * @param {Canvas} scene
 */
function drawPipes(scene) {
	tube(
		scene,
		[
			[41, 10],
			[41, 3],
			[15, 3],
			[15, 47],
		],
		1.8,
		STEEL
	);
	tube(
		scene,
		[
			[50, 14],
			[64, 14],
		],
		2.3,
		STEEL
	);
	tube(
		scene,
		[
			[53, 42],
			[64, 42],
		],
		2.3,
		STEEL
	);
	// Bolted flanges at every joint.
	for (const [x, y] of [
		[41, 8],
		[15, 7],
		[15, 33],
		[15, 44],
	]) {
		flange(scene, x, y, true, 3);
	}
	for (const [x, y] of [
		[36, 3],
		[20, 3],
		[54, 14],
		[61, 14],
		[54, 42],
		[62, 42],
	]) {
		flange(scene, x, y, false, y === 3 ? 3 : 4);
	}
}

/**
 * A bolted flange round a pipe: a collar two pixels thick, lit on its sunny side, with a bolt head at each end.
 * @param {Canvas} scene
 * @param {number} x - The flange's first column, or the pipe's centre column for a flange on an upright pipe
 * @param {number} y - The flange's first row, or the pipe's centre row for a flange on a level pipe
 * @param {boolean} upright - Whether the pipe runs up and down, so the collar lies across it
 * @param {number} half - How far the collar reaches either side of the pipe's centre line
 */
function flange(scene, x, y, upright, half) {
	for (let k = -half; k <= half; k++) {
		const u = k / half;
		for (let t = 0; t < 2; t++) {
			const tone = upright
				? toneFor(-u * 1.1 + (t === 0 ? 0.3 : -0.2), STEEL)
				: toneFor(-u * 0.6 + (t === 0 ? 0.45 : -0.15), STEEL);
			if (upright) {
				set(scene, x + k, y + t, tone);
			} else {
				set(scene, x + t, y + k, tone);
			}
		}
	}
	// The bolt heads at the collar's two ends.
	if (upright) {
		set(scene, x - half, y, C.lampGlow);
		set(scene, x + half, y, STEEL.shade);
	} else {
		set(scene, x, y - half, C.lampGlow);
		set(scene, x, y + half, STEEL.shade);
	}
}

/**
 * The concrete plinth the vessel stands on: its top edge catching the sun, its face shaded towards the right.
 * @param {Canvas} scene
 */
function drawPlinth(scene) {
	const x0 = VESSEL.x0 - 4;
	const x1 = VESSEL.x1 + 4;
	for (let y = VESSEL.bottom + 1; y <= 57; y++) {
		for (let x = x0; x <= x1; x++) {
			let colour = CONCRETE.base;
			if (y === VESSEL.bottom + 1) {
				colour = x < x1 - 4 ? CONCRETE.lit : CONCRETE.base;
			} else if (x > x1 - 5 || y === 57) {
				colour = CONCRETE.shade;
			} else if (x < x0 + 2) {
				colour = CONCRETE.lit;
			} else if (y === VESSEL.bottom + 2 && x > CX - 2) {
				// The vessel's own shadow along the top of the face.
				colour = CONCRETE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Cracks and pits in the concrete.
	for (const [x, y] of [
		[31, 55],
		[32, 55],
		[33, 56],
		[44, 54],
		[50, 56],
	]) {
		set(scene, x, y, CONCRETE.shade);
	}
}

/**
 * The vessel's cylinder: lit along its sunny side with a band of gleam, falling into shade on the right.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	for (let y = VESSEL.top; y <= VESSEL.bottom; y++) {
		for (let x = VESSEL.x0; x <= VESSEL.x1; x++) {
			set(scene, x, y, cylinderTone((x + 0.5 - CX - 0.5) / HALF));
		}
	}
}

/**
 * The tone across a cylinder lit from the left: a gleam just in from the edge, then lit, base, shade and dark.
 * @param {number} u - From -1 (left edge) to 1 (right edge)
 * @returns {Colour}
 */
function cylinderTone(u) {
	if (u < -0.82) {
		return STEEL.lit;
	}
	if (u < -0.55) {
		return STEEL.glint;
	}
	if (u < -0.15) {
		return STEEL.lit;
	}
	if (u < 0.35) {
		return STEEL.base;
	}
	if (u < 0.72) {
		return STEEL.shade;
	}
	if (u > 0.93) {
		return SKY_BOUNCE;
	}
	return STEEL.dark;
}

/**
 * The domed head and the heavy bolted flange that holds it to the body.
 * @param {Canvas} scene
 */
function drawDome(scene) {
	const top = VESSEL.top;
	for (let y = top - VESSEL.dome; y < top; y++) {
		const v = (top - y) / VESSEL.dome;
		const half = HALF * Math.sqrt(1 - v * v);
		for (let x = Math.round(CX - half); x <= Math.round(CX + half); x++) {
			const u = (x - CX) / HALF;
			// The sun lights the dome from the left and a little from above.
			const facing = -u * 0.9 + v * 0.45;
			set(scene, x, y, toneFor(facing, STEEL));
		}
	}
	// The heavy flange where the head is bolted to the body, its bolts standing up in a row.
	for (let y = top - 1; y <= top + 2; y++) {
		for (let x = VESSEL.x0 - 3; x <= VESSEL.x1 + 3; x++) {
			const u = (x - CX) / (HALF + 3);
			let colour = cylinderTone(u);
			if (y === top + 2) {
				colour = u < 0 ? STEEL.shade : STEEL.dark;
			} else if (y === top - 1 && u < 0.4) {
				colour = u < -0.5 ? STEEL.glint : STEEL.lit;
			}
			set(scene, x, y, colour);
		}
	}
	for (let x = VESSEL.x0 - 2; x <= VESSEL.x1 + 1; x += 3) {
		const u = (x - CX) / HALF;
		set(scene, x, top - 2, u < 0.2 ? STEEL.lit : STEEL.shade);
		set(scene, x + 1, top - 2, u < 0.2 ? STEEL.base : STEEL.dark);
		set(scene, x, top + 1, u < 0.2 ? C.lampGlow : STEEL.base);
		set(scene, x + 1, top + 1, u < 0.2 ? STEEL.shade : STEEL.dark);
	}
}

/**
 * The hoops that bind the body, each standing a pixel proud of it with a row of rivets, and one seam running down it.
 * @param {Canvas} scene
 */
function drawSeams(scene) {
	for (const y of [28, 38]) {
		for (let x = VESSEL.x0 - 1; x <= VESSEL.x1 + 1; x++) {
			const u = (x - CX) / (HALF + 1);
			set(
				scene,
				x,
				y,
				u < 0.35 ? cylinderTone(u - 0.25) : cylinderTone(u)
			);
			set(scene, x, y + 1, cylinderTone(u));
			set(
				scene,
				x,
				y + 2,
				u < -0.15 ? STEEL.base : u < 0.35 ? STEEL.shade : STEEL.dark
			);
			if ((x - VESSEL.x0) % 3 === 1 && x <= VESSEL.x1) {
				set(scene, x, y + 1, u < 0 ? C.lampGlow : STEEL.lit);
			}
		}
	}
	// One vertical seam on the shaded side, with its own rivets.
	const sx = VESSEL.x1 - 6;
	for (let y = VESSEL.top + 3; y < VESSEL.bottom - 1; y++) {
		if (y >= 28 && y <= 30) {
			continue;
		}
		if (y >= 38 && y <= 40) {
			continue;
		}
		set(scene, sx, y, STEEL.dark);
		if ((y - VESSEL.top) % 3 === 0) {
			set(scene, sx - 1, y, STEEL.base);
		}
	}
	// The foot ring where the body meets the plinth.
	for (let x = VESSEL.x0 - 1; x <= VESSEL.x1 + 1; x++) {
		const u = (x - CX) / (HALF + 1);
		set(scene, x, VESSEL.bottom, cylinderTone(u));
		set(scene, x, VESSEL.bottom - 1, cylinderTone(u - 0.3));
		set(scene, x, VESSEL.bottom - 2, u < 0 ? STEEL.shade : STEEL.dark);
	}
}

/**
 * The pressure gauge on its stem: a steel bezel round a white face with tick marks, a red zone and a red needle near the top of its sweep.
 * @param {Canvas} scene
 */
function drawGauge(scene) {
	const { x: gx, y: gy, r } = GAUGE;
	tube(
		scene,
		[
			[VESSEL.x0, gy + 7],
			[gx, gy + 7],
			[gx, gy + 3],
		],
		1.1,
		STEEL
	);
	const reach = Math.ceil(r);
	for (let y = gy - reach; y <= gy + reach; y++) {
		for (let x = gx - reach; x <= gx + reach; x++) {
			const dx = x - gx;
			const dy = y - gy;
			const d = Math.hypot(dx, dy);
			if (d >= r) {
				continue;
			}
			if (d >= r - 1.5) {
				const facing = (dx * LIGHT.x + dy * LIGHT.y) / d;
				set(
					scene,
					x,
					y,
					facing > 0.3
						? STEEL.base
						: facing > -0.4
							? STEEL.shade
							: STEEL.dark
				);
			} else {
				set(scene, x, y, dx + dy > 2 ? C.cream : C.white);
			}
		}
	}
	// Five tick marks round a three-quarter sweep, open at the bottom and with no numbers; the last is red.
	for (let k = 0; k <= 4; k++) {
		const angle = Math.PI * 0.75 + (k / 4) * Math.PI * 1.5;
		for (const reach of [r - 2.1, r - 2.7]) {
			const x = Math.round(gx + Math.cos(angle) * reach);
			const y = Math.round(gy + Math.sin(angle) * reach);
			set(scene, x, y, k === 4 ? C.brickRed : C.wood);
		}
	}
	// The red needle, swung far round towards the red mark, on a dark hub.
	const needle = Math.PI * 1.8;
	for (let t = 0.5; t <= r - 2; t += 0.4) {
		set(
			scene,
			Math.round(gx + Math.cos(needle) * t),
			Math.round(gy + Math.sin(needle) * t),
			C.brickRed
		);
	}
	set(scene, gx, gy, C.ink);
}

/**
 * A red hand wheel seen face on: a rim, four spokes and a hub.
 * @param {Canvas} scene
 * @param {number} cx
 * @param {number} cy
 */
function handWheel(scene, cx, cy) {
	for (let y = cy - 4; y <= cy + 4; y++) {
		for (let x = cx - 4; x <= cx + 4; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			if (d >= 2.4 && d < 3.7) {
				const facing = (dx * LIGHT.x + dy * LIGHT.y) / d;
				set(scene, x, y, toneFor(facing * 0.8 + 0.2, WHEEL));
			} else if (d < 2.4 && (dx === 0 || dy === 0)) {
				set(scene, x, y, d < 1 ? WHEEL.glint : WHEEL.base);
			} else if (d < 2.4) {
				set(scene, x, y, STEEL.dark);
			}
		}
	}
}

/**
 * The valves: a red hand wheel on the down pipe and one on the pipe leaving to the right.
 * @param {Canvas} scene
 */
function drawValves(scene) {
	rect(scene, 12, 21, 7, 6, STEEL.dark);
	rect(scene, 12, 21, 3, 6, STEEL.base);
	handWheel(scene, 15, 24);
	rect(scene, 56, 38, 5, 9, STEEL.dark);
	rect(scene, 56, 38, 2, 9, STEEL.base);
	handWheel(scene, 58, 42);
}

/**
 * The safety valve on the dome, letting off a wisp of steam.
 * @param {Canvas} scene
 */
function drawReliefValve(scene) {
	rect(scene, 47, 8, 3, 3, STEEL.shade);
	set(scene, 47, 8, STEEL.lit);
	set(scene, 47, 9, STEEL.lit);
	rect(scene, 46, 6, 5, 2, C.brass);
	rect(scene, 46, 6, 2, 1, C.gold);
}

/**
 * The burlap sack, open and heaped with pellets, with a sprout painted on its front instead of any name.
 * @param {Canvas} scene
 */
function drawSack(scene) {
	const cx = 11;
	const top = 43;
	const bottom = 61;
	for (let y = top; y <= bottom; y++) {
		const t = (y - top) / (bottom - top);
		let half = 7 + Math.sin(t * Math.PI * 0.85) * 2.2;
		if (y >= bottom - 1) {
			half -= bottom - y === 0 ? 2 : 1;
		}
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const u = (x - cx) / half;
			let facing = -u * 0.9 - (t < 0.15 ? -0.2 : 0);
			// The weave: a fine checker of neighbouring tones.
			if ((x + y) % 2 === 0) {
				facing -= 0.18;
			}
			set(scene, x, y, toneFor(facing, BURLAP));
		}
	}
	// Two creases down the front.
	for (let y = top + 4; y <= bottom - 2; y++) {
		set(scene, cx + 3 + Math.round(Math.sin(y * 0.4)), y, BURLAP.shade);
	}
	// The rolled rim of the mouth.
	for (let x = cx - 8; x <= cx + 8; x++) {
		const u = (x - cx) / 8;
		set(scene, x, top - 1, toneFor(-u * 0.9 + 0.3, BURLAP));
		set(scene, x, top, toneFor(-u * 0.9 - 0.2, BURLAP));
	}
	// The pellets filling the mouth: a low, lumpy heap of round granules, each lit on its sunny side.
	for (let y = top - 5; y < top - 1; y++) {
		for (let x = cx - 7; x <= cx + 7; x++) {
			const dx = (x - cx) / 7;
			const dy = (top - 1 - y) / 3.6;
			if (dx * dx + dy * dy > 1) {
				continue;
			}
			set(scene, x, y, granule(x, y, dx));
		}
	}
	// Granules lying loose on top, so the heap's edge is lumpy.
	for (const [x, y] of [
		[7, 37],
		[10, 36],
		[13, 37],
		[16, 38],
		[5, 39],
	]) {
		set(scene, x, y, PELLET.lit);
		set(scene, x + 1, y, PELLET.shade);
	}
	// The sprout: a green stem with two leaves over a mound of earth.
	const sx = 9;
	const sy = 55;
	set(scene, sx - 2, sy, C.timber);
	set(scene, sx - 1, sy, C.timber);
	set(scene, sx, sy, C.timber);
	set(scene, sx + 1, sy, C.timber);
	set(scene, sx + 2, sy, C.timber);
	set(scene, sx, sy - 1, C.grassShade);
	set(scene, sx, sy - 2, C.grassShade);
	set(scene, sx, sy - 3, C.grass);
	set(scene, sx - 1, sy - 3, C.grass);
	set(scene, sx - 2, sy - 4, C.grassLight);
	set(scene, sx + 1, sy - 4, C.grass);
	set(scene, sx + 2, sy - 5, C.grassLight);
}

/**
 * One pixel of a heap of round granules on a staggered grid: each granule's lit top, its shaded side, and the gaps between them.
 * @param {number} x
 * @param {number} y
 * @param {number} dx - Across the heap, from -1 (the sunny side) to 1
 * @returns {Colour}
 */
function granule(x, y, dx) {
	const col = (x + (y % 2)) % 2;
	if (col === 0) {
		return dx > 0.6 ? PELLET.base : PELLET.lit;
	}
	return (x + y) % 4 === 1 || dx > 0.3 ? PELLET.shade : PELLET.base;
}

/**
 * The spilled pellets, painted after the outline: granules tumbling over the sack's rim and down its side,
 * then fanning out across the soil, thinning as they roll away. Each is a white pellet with a shaded side.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPellets(scene, random) {
	/** @type {[number, number][]} */
	const spill = [
		[19, 42],
		[20, 44],
		[21, 46],
		[21, 49],
		[22, 52],
		[22, 55],
		[21, 58],
		[19, 60],
		[21, 61],
		[23, 59],
		[18, 62],
		[22, 62],
		[24, 61],
	];
	for (let i = 0; i < 30; i++) {
		const reach = 3 + random() ** 1.4 * 14;
		const angle = -0.35 + random() * 1.2;
		const x = Math.round(21 + Math.cos(angle) * reach);
		const y = Math.round(60 + Math.sin(angle) * reach * 0.35);
		if (y >= 57 && y <= 62 && x <= 38) {
			spill.push([x, y]);
		}
	}
	for (const [x, y] of spill) {
		set(scene, x, y, PELLET.lit);
		set(scene, x + 1, y, PELLET.shade);
	}
}

/**
 * The last gleams of the sun on the dome, the gauge and the pipe bend.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[35, 13],
		[36, 12],
		[19, 28],
		[17, 3],
		[34, 22],
		[34, 23],
	]) {
		set(scene, x, y, C.white);
	}
}
