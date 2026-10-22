// Jet Fuel: a jet engine close up under its wing in a clear day sky, its fan in the cowl and a blue-orange flame roaring out behind in shimmering heat.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The intake at the front of the cowl, an ellipse facing the viewer's left: its centre and radii. */
const INTAKE = { x: 16, y: 31, rx: 12, ry: 17 };

/** Where the cowl's top and bottom lines end, at the start of the nozzle. */
const BODY = { end: 37, top: 19, bottom: 43 };

/** The exhaust nozzle: its last column and its top and bottom rows there. */
const NOZZLE = { end: 41, top: 23, bottom: 39 };

/** The exhaust cone in the nozzle: its tip and its top and bottom rows at the nozzle. */
const PLUG = { tip: 46, top: 26, bottom: 36 };

/** The flame's middle row. */
const FLAME_Y = 31;

/** The sky from the top down. */
const SKY = [C.daySky1, C.daySky2, C.daySky3, C.daySky4, C.daySky5, C.daySky6];

/** The cowl: a white skin lit from the upper left, its shade and a seam. */
const SKIN_LIGHT = C.snow;
const SKIN = C.snowShade;
const SKIN_SHADE = mix(C.snowShade, C.stone, 0.55);

/** The dark duct inside the intake, and the fan blades. */
const DUCT = mix(C.stoneShade, C.ink, 0.55);
const DUCT_WALL = mix(C.stoneShade, C.ink, 0.2);

/** The wing's underside and the pylon. */
const WING = mix(C.snowShade, C.stone, 0.3);
const WING_SHADE = mix(C.stone, C.stoneShade, 0.4);

/**
 * Draws the Jet Fuel tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4471);

	drawSky(layer);
	drawShimmer(layer, random);
	drawFlame(layer);

	drawWing(scene);
	drawBody(scene);
	drawNozzle(scene);
	drawIntake(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawGleams(scene);
	return scene;
}

/**
 * The clear day sky in six bands, deep blue at the top and pale at the bottom.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y < 64; y++) {
		const band = Math.min(
			SKY.length - 1,
			Math.floor((y / 64) * SKY.length)
		);
		rect(layer, 0, y, 64, 1, SKY[band]);
	}
}

/**
 * The sky colour behind a row.
 * @param {number} y
 * @returns {Colour}
 */
function skyAt(y) {
	return SKY[Math.min(SKY.length - 1, Math.floor((y / 64) * SKY.length))];
}

/**
 * Heat shimmer: short wavy pale lines rippling in the hot air above, below and beyond the flame.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawShimmer(layer, random) {
	const waves = [
		{ x: 47, y: 20, length: 14 },
		{ x: 53, y: 16, length: 11 },
		{ x: 46, y: 43, length: 14 },
		{ x: 52, y: 47, length: 12 },
		{ x: 58, y: 24, length: 6 },
		{ x: 58, y: 39, length: 6 },
	];
	for (const wave of waves) {
		const phase = random() * 6;
		for (let k = 0; k < wave.length; k++) {
			const x = wave.x + k;
			const y = wave.y + Math.round(Math.sin(k * 0.9 + phase) * 1.2);
			const fade = k < 2 || k > wave.length - 3 ? 0.18 : 0.35;
			set(layer, x, y, mix(skyAt(y), C.white, fade));
		}
	}
}

/**
 * The flame: an orange plume round a pale blue core with bright shock diamonds, blue-white at the nozzle.
 * @param {Canvas} layer
 */
function drawFlame(layer) {
	for (let x = NOZZLE.end - 2; x < 64; x++) {
		const t = (x - NOZZLE.end) / (63 - NOZZLE.end);
		const outer = 7.5 - t * 2 + Math.sin(x * 0.8) * 0.7;
		const core = 4.2 - t * 2;
		for (let y = FLAME_Y - 9; y <= FLAME_Y + 9; y++) {
			const dy = Math.abs(y - FLAME_Y);
			if (dy > outer) {
				continue;
			}
			/** @type {Colour} */
			let colour;
			if (dy <= core) {
				colour = t < 0.4 ? C.tealLight : t < 0.65 ? C.dayWave : C.gold;
			} else if (dy > outer - 1.5) {
				colour = t < 0.3 ? C.nightWave : C.duskSky6;
			} else {
				colour = t < 0.3 ? C.foam : C.amber;
			}
			set(layer, x, y, colour);
		}
	}
	// A warm haze of hot air round the flame's tail.
	glow(layer, {
		x: 58,
		y: FLAME_Y,
		radius: 14,
		colour: C.gold,
		strength: 0.3,
		steps: 2,
		skip: [
			C.tealLight,
			C.dayWave,
			C.gold,
			C.nightWave,
			C.duskSky6,
			C.foam,
			C.amber,
		],
	});
	// The shock diamonds: bright beads strung along the core.
	for (const [x, r] of [
		[46, 2],
		[52, 2],
		[58, 1],
	]) {
		for (let dy = -r; dy <= r; dy++) {
			const w = r - Math.abs(dy);
			rect(layer, x - w, FLAME_Y + dy, w * 2 + 1, 1, C.white);
		}
	}
}

/**
 * The underside of the wing across the top, and the swept pylon that hangs the engine from it.
 * @param {Canvas} scene
 */
function drawWing(scene) {
	/**
	 * The wing's lower edge at a column.
	 * @param {number} x
	 * @returns {number}
	 */
	const edge = (x) => Math.round(3 + (x - 8) * 0.06);
	for (let x = 8; x < 64; x++) {
		for (let y = 0; y <= edge(x); y++) {
			set(scene, x, y, y === edge(x) ? WING_SHADE : WING);
		}
	}
	// The rounded leading edge, catching the light.
	rect(scene, 6, 0, 2, 2, C.snowShade);
	set(scene, 8, 2, C.snowShade);
	rect(scene, 9, 0, 1, 3, SKIN_LIGHT);
	// The pylon, swept back and down to the top of the cowl.
	for (let y = 3; y <= 20; y++) {
		const left = Math.round(19 + (y - 3) * 0.5);
		const right = Math.round(32 + (y - 3) * 0.28);
		for (let x = left; x <= right; x++) {
			if (y > edge(x) && y <= cowlTop(x)) {
				set(scene, x, y, x > right - 2 ? WING_SHADE : WING);
			}
		}
	}
}

/**
 * The cowl's top row at a column, along its straight taper from the intake to the nozzle.
 * @param {number} x
 * @returns {number}
 */
function cowlTop(x) {
	const t = (x - INTAKE.x) / (BODY.end - INTAKE.x);
	return Math.round(
		INTAKE.y - INTAKE.ry + (BODY.top - (INTAKE.y - INTAKE.ry)) * t
	);
}

/**
 * The cowl's bottom row at a column.
 * @param {number} x
 * @returns {number}
 */
function cowlBottom(x) {
	const t = (x - INTAKE.x) / (BODY.end - INTAKE.x);
	return Math.round(
		INTAKE.y + INTAKE.ry + (BODY.bottom - (INTAKE.y + INTAKE.ry)) * t
	);
}

/**
 * The cowl, a white barrel lit along its top and shaded underneath, with two panel seams.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	for (let x = INTAKE.x; x <= BODY.end; x++) {
		const top = cowlTop(x);
		const bottom = cowlBottom(x);
		for (let y = top; y <= bottom; y++) {
			const v = (y - top) / (bottom - top);
			let colour = SKIN;
			if (v < 0.22) {
				colour = SKIN_LIGHT;
			} else if (v > 0.68) {
				colour = SKIN_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	for (const x of [27, 33]) {
		for (let y = cowlTop(x) + 1; y < cowlBottom(x); y++) {
			const v = (y - cowlTop(x)) / (cowlBottom(x) - cowlTop(x));
			set(scene, x, y, v > 0.68 ? C.stone : SKIN_SHADE);
		}
	}
}

/**
 * The nozzle, a darker steel ring narrowing behind the cowl, and the exhaust cone poking out of it.
 * @param {Canvas} scene
 */
function drawNozzle(scene) {
	for (let x = BODY.end + 1; x <= NOZZLE.end; x++) {
		const t = (x - BODY.end) / (NOZZLE.end - BODY.end);
		const top = Math.round(BODY.top + 2 + (NOZZLE.top - BODY.top - 2) * t);
		const bottom = Math.round(
			BODY.bottom - 2 + (NOZZLE.bottom - BODY.bottom + 2) * t
		);
		for (let y = top; y <= bottom; y++) {
			const v = (y - top) / (bottom - top);
			let colour = C.stone;
			if (v < 0.22) {
				colour = C.stoneLight;
			} else if (v > 0.65) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let x = NOZZLE.end + 1; x <= PLUG.tip; x++) {
		const t = (x - NOZZLE.end) / (PLUG.tip - NOZZLE.end);
		const half = ((PLUG.bottom - PLUG.top) / 2) * (1 - t);
		for (
			let y = Math.round(FLAME_Y - half);
			y <= Math.round(FLAME_Y + half);
			y++
		) {
			set(scene, x, y, y < FLAME_Y ? C.stoneMid : DUCT_WALL);
		}
	}
}

/**
 * The intake: a polished lip, the dark duct, the fan of twisted blades, and the spinner at its hub.
 * @param {Canvas} scene
 */
function drawIntake(scene) {
	const { x: cx, y: cy, rx, ry } = INTAKE;
	const fan = { x: cx + 1, y: cy, rx: rx - 4, ry: ry - 4 };
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const u = (x - cx) / rx;
			const v = (y - cy) / ry;
			const e = u * u + v * v;
			if (e > 1) {
				continue;
			}
			const iu = (x - cx) / (rx - 2.5);
			const iv = (y - cy) / (ry - 2.5);
			if (iu * iu + iv * iv > 1) {
				// The lip: bright where it turns to the light, steel where it turns away.
				const facing = -u - v;
				let colour = C.stoneLight;
				if (facing > 0.5) {
					colour = SKIN_LIGHT;
				} else if (facing < -0.6) {
					colour = C.stone;
				}
				set(scene, x, y, colour);
				continue;
			}
			const fu = (x - fan.x) / fan.rx;
			const fv = (y - fan.y) / fan.ry;
			const r = Math.hypot(fu, fv);
			if (r > 1) {
				// The inside of the duct, seen beyond the fan on the far side.
				set(scene, x, y, x > cx ? DUCT_WALL : DUCT);
				continue;
			}
			const angle = Math.atan2(fv, fu);
			const turn =
				((((angle / (Math.PI * 2)) * 14 + r * 1.1) % 1) + 1) % 1;
			let colour = DUCT;
			if (turn < 0.5) {
				colour = fu + fv < -0.2 ? C.stoneLight : C.stone;
			} else if (turn < 0.62) {
				colour = C.stoneShade;
			}
			set(scene, x, y, colour);
		}
	}
	// The spinner, a polished cone at the hub.
	for (let y = fan.y - 4; y <= fan.y + 4; y++) {
		for (let x = fan.x - 3; x <= fan.x + 3; x++) {
			const u = (x - fan.x) / 3.4;
			const v = (y - fan.y) / 4.4;
			if (u * u + v * v > 1) {
				continue;
			}
			let colour = SKIN;
			if (u + v < -0.4) {
				colour = SKIN_LIGHT;
			} else if (u + v > 0.5) {
				colour = C.stone;
			}
			set(scene, x, y, colour);
		}
	}
	set(scene, fan.x - 1, fan.y - 2, C.white);
}

/**
 * Sunlit gleams on the lip and the cowl, painted over the outline.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[9, 20],
		[8, 22],
		[22, 16],
		[23, 16],
		[24, 16],
	]) {
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.white);
		}
	}
}
