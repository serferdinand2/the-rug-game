// Technocracy: a city of glass towers around a white computer spire whose glowing core beams light into the night.
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
import { drawSky } from '../../parts/sky.js';
import { drawSkyline } from '../../parts/skyline.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The spire's centre (between columns CX - 1 and CX), the plaza's first row and the core's centre row. */
const CX = 32;
const GROUND = 50;
const CORE_Y = 24;

/** The city's teal light, blended from the palette. */
const TEAL = {
	pale: mix(C.foam, C.pineLight, 0.25),
	glow: mix(C.white, C.foam, 0.45),
	mid: mix(C.nightSeaLine, C.pineLight, 0.5),
	deep: mix(C.nightSea2, C.pineShade, 0.45),
};

/** The glass of the towers, lit on the left. */
const GLASS = {
	light: mix(C.foam, C.pineLight, 0.15),
	main: mix(C.nightSea1, TEAL.mid, 0.45),
	shade: mix(C.nightSea3, C.nightSky3, 0.35),
	floor: mix(C.nightSea2, C.nightSky2, 0.5),
};

/**
 * Draws the Technocracy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(503);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND - 1,
		random,
		stars: 30,
		starRows: 26,
	});
	drawSkyline(layer, { base: GROUND - 1, time: 'night', random, height: 15 });
	tintSkyline(layer);
	drawAura(layer);
	drawBeam(layer);
	drawPlaza(layer);

	drawTower(scene, { left: 1, right: 11, top: 33, roof: 'slant-right' });
	drawTower(scene, { left: 52, right: 62, top: 36, roof: 'slant-left' });
	drawTower(scene, { left: 12, right: 21, top: 27, roof: 'needle' });
	drawTower(scene, { left: 43, right: 51, top: 29, roof: 'round' });
	drawSpire(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCore(scene);
	drawHalo(scene);
	return scene;
}

/**
 * Turns the far skyline's warm windows into the city's cool teal and white.
 * @param {Canvas} layer
 */
function tintSkyline(layer) {
	for (let y = 0; y < GROUND; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour === C.gold) {
				set(layer, x, y, TEAL.mid);
			} else if (colour === C.lampGlow) {
				set(layer, x, y, TEAL.pale);
			}
		}
	}
}

/**
 * A soft teal glow in the sky around the spire's core.
 * @param {Canvas} layer
 */
function drawAura(layer) {
	for (let y = 0; y < GROUND; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot((x - CX + 0.5) * 0.8, y - CORE_Y);
			// Three bands of glow, brightest nearest the core.
			const band = d < 8 ? 3 : d < 13 ? 2 : d < 19 ? 1 : 0;
			if (band) {
				const behind = /** @type {Colour} */ (get(layer, x, y));
				set(layer, x, y, mix(behind, TEAL.mid, band * 0.12));
			}
		}
	}
}

/**
 * The beam of light rising from the spire's tip to the top of the sky, widening as it goes.
 * @param {Canvas} layer
 */
function drawBeam(layer) {
	const tip = CORE_Y - 13;
	for (let y = 0; y < tip; y++) {
		const half = 1 + Math.floor((tip - y) / 4);
		for (let x = CX - half - 2; x <= CX + half + 1; x++) {
			const off = x < CX ? CX - 1 - x : x - CX;
			const behind = /** @type {Colour} */ (get(layer, x, y));
			let colour;
			if (off === 0) {
				colour = C.white;
			} else if (off < half) {
				colour = TEAL.glow;
			} else if (off === half) {
				colour = mix(behind, TEAL.pale, 0.55);
			} else {
				colour = mix(behind, TEAL.pale, 0.25);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The dark plaza the city stands on, ruled with glowing teal lines that run to the spire.
 * @param {Canvas} layer
 */
function drawPlaza(layer) {
	const vanish = GROUND - 8;
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, y === GROUND ? TEAL.deep : GLASS.floor);
		}
	}
	for (const y of [GROUND + 2, GROUND + 5, GROUND + 9, GROUND + 13]) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, y > GROUND + 6 ? TEAL.mid : TEAL.deep);
		}
	}
	for (let xb = -40; xb <= 104; xb += 12) {
		for (let y = GROUND; y < 64; y++) {
			const t = (y - vanish) / (63 - vanish);
			const x = Math.round(CX - 0.5 + (xb - CX + 0.5) * t);
			set(layer, x, y, y > GROUND + 6 ? TEAL.mid : TEAL.deep);
		}
	}
	// The spire's light on the polished floor.
	for (let y = GROUND + 1; y < 64; y++) {
		for (let x = CX - 3; x <= CX + 2; x++) {
			const behind = /** @type {Colour} */ (get(layer, x, y));
			const edge = x === CX - 3 || x === CX + 2;
			set(layer, x, y, mix(behind, TEAL.pale, edge ? 0.25 : 0.5));
		}
	}
}

/**
 * One glass tower: a teal-blue facade with floor lines, mullions and lit windows, and a shaped roof.
 * @param {Canvas} scene
 * @param {{ left: number, right: number, top: number, roof: 'slant-left' | 'slant-right' | 'needle' | 'round' }} tower
 */
function drawTower(scene, { left, right, top, roof }) {
	const width = right - left + 1;
	for (let x = left; x <= right; x++) {
		const i = x - left;
		let rowTop = top;
		if (roof === 'slant-right') {
			rowTop = top + Math.floor(i * 0.6);
		} else if (roof === 'slant-left') {
			rowTop = top + Math.floor((width - 1 - i) * 0.6);
		} else if (roof === 'round') {
			const off = Math.abs(i - (width - 1) / 2);
			rowTop = top + Math.round(off * off * 0.18);
		}
		for (let y = rowTop; y < GROUND; y++) {
			let colour = GLASS.main;
			if (i === 0 || y === rowTop) {
				colour = GLASS.light;
			} else if (i >= width - 2) {
				colour = GLASS.shade;
			} else if ((y - top) % 3 === 0) {
				colour = GLASS.shade;
			} else if (i % 3 === 0) {
				colour = mix(GLASS.main, GLASS.shade, 0.5);
			} else if ((y - top) % 3 === 1 && i % 3 === 1) {
				colour = (x * 5 + y) % 7 === 0 ? C.white : TEAL.pale;
			}
			set(scene, x, y, colour);
		}
	}
	if (roof === 'needle') {
		const nx = left + Math.floor(width / 2);
		for (let y = top - 7; y < top; y++) {
			set(scene, nx, y, GLASS.light);
		}
		set(scene, nx, top - 8, C.white);
	}
}

/**
 * The spire: a white tapering shaft on a stepped base, swelling into the computer core near its top,
 * and a slender needle above it.
 * @param {Canvas} scene
 */
function drawSpire(scene) {
	// The stepped base.
	for (const [y, half] of [
		[GROUND - 1, 11],
		[GROUND - 2, 11],
		[GROUND - 3, 9],
		[GROUND - 4, 9],
	]) {
		spireRow(scene, y, half, y === GROUND - 4 || y === GROUND - 2);
	}
	// The shaft, tapering upwards.
	const from = CORE_Y + 5;
	const to = GROUND - 5;
	for (let y = from; y <= to; y++) {
		const half = Math.round(3 + ((y - from) * 4) / (to - from));
		spireRow(scene, y, half, (y - CORE_Y) % 6 === 0);
	}
	// The collars around the core, and the slim shaft above it.
	spireRow(scene, CORE_Y + 4, 5, true);
	spireRow(scene, CORE_Y - 4, 5, true);
	for (let y = CORE_Y - 9; y < CORE_Y - 4; y++) {
		spireRow(scene, y, y < CORE_Y - 6 ? 1 : 2, false);
	}
	// The core's housing, filled with light after the outline pass.
	for (let y = CORE_Y - 3; y <= CORE_Y + 3; y++) {
		const half = Math.abs(y - CORE_Y) === 3 ? 4 : 5;
		rect(scene, CX - half, y, half * 2, 1, TEAL.pale);
	}
	// The needle.
	rect(scene, CX - 1, CORE_Y - 13, 2, 4, C.white);
	// A glowing seam carrying light up the shaft to the core.
	for (let y = CORE_Y + 5; y <= GROUND - 3; y++) {
		set(scene, CX, y, TEAL.pale);
	}
}

/**
 * One row of the spire: white lit on the left, pale glass in the middle, teal shade on the right.
 * @param {Canvas} scene
 * @param {number} y
 * @param {number} half - Half the row's width
 * @param {boolean} band - A glowing teal band across the row
 */
function spireRow(scene, y, half, band) {
	const x0 = CX - half;
	const x1 = CX + half - 1;
	for (let x = x0; x <= x1; x++) {
		let colour = C.foam;
		if (x === x0) {
			colour = C.white;
		} else if (x >= x1 - Math.max(0, Math.floor(half / 2) - 1) && x > x0) {
			colour = mix(C.foam, C.nightWaveDeep, 0.55);
		} else if (band) {
			colour = TEAL.pale;
		} else if (x <= x0 + 1) {
			colour = TEAL.glow;
		}
		if (band && x > x0) {
			colour = x >= x1 - 1 ? TEAL.mid : TEAL.pale;
		}
		set(scene, x, y, colour);
	}
}

/**
 * The computer core: a white-hot centre fading to teal.
 * @param {Canvas} scene
 */
function drawCore(scene) {
	for (let y = CORE_Y - 2; y <= CORE_Y + 2; y++) {
		const half = Math.abs(y - CORE_Y) === 2 ? 3 : 4;
		for (let x = CX - half; x < CX + half; x++) {
			const d = Math.hypot(x - CX + 0.5, (y - CORE_Y) * 1.3);
			set(scene, x, y, d < 1.8 ? C.white : d < 3 ? TEAL.glow : TEAL.mid);
		}
	}
}

/**
 * A ring of light circling the core, its back half hidden behind the spire.
 * @param {Canvas} scene
 */
function drawHalo(scene) {
	const rx = 10;
	const ry = 2;
	for (let step = 0; step < 160; step++) {
		const a = (step / 160) * Math.PI * 2;
		const x = Math.round(CX - 0.5 + Math.cos(a) * rx);
		const y = Math.round(CORE_Y + Math.sin(a) * ry);
		const front = Math.sin(a) > 0;
		const onSpire = Math.abs(x - CX + 0.5) < 6;
		if (!front && onSpire) {
			continue;
		}
		set(scene, x, y, front ? TEAL.glow : TEAL.pale);
	}
}
