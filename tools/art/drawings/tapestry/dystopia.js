// Dystopia: a grey walled city of the future under smog, searchlights raking the sky beside a giant screen with a watching eye.
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
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The wall's top row, the ground's first row, and the screen's box. */
const WALL_TOP = 39;
const GROUND = 58;
const SCREEN = { left: 20, right: 43, top: 11, bottom: 28 };

/** Murky colours, blended from the palette. */
const SMOG = {
	high: mix(C.nightSky2, C.stoneShade, 0.3),
	low: mix(C.stoneShade, C.timberShade, 0.4),
	cloud: mix(C.stoneMid, C.sandShade, 0.2),
	cloudShade: mix(C.stoneShade, C.timber, 0.25),
};

/** Grey concrete, darker for the buildings further back. */
const CONCRETE = {
	light: C.stoneLight,
	main: C.stone,
	mid: C.stoneMid,
	shade: C.stoneShade,
	far: mix(C.stoneShade, C.nightSky3, 0.35),
	farLight: mix(C.stoneMid, C.nightSky4, 0.25),
	farShade: mix(C.stoneShade, C.night, 0.45),
	window: mix(C.gold, C.grassLight, 0.35),
};

/**
 * Draws the Dystopia scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const city = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(617);

	drawSky(layer, { time: 'night', horizon: GROUND, random, stars: 8 });
	drawSmog(layer, random);
	drawScreenGlow(layer);

	// The city behind the wall gets its own outline.
	drawBlocks(city, random);
	drawScreenTower(city);
	outline(city, C.ink);
	underlay(city, layer);
	drawEye(city);

	drawWall(scene);
	drawWatchtower(scene, 0);
	drawWatchtower(scene, 55);
	drawGate(scene);
	drawGround(scene, random);
	// A lone figure before the gate, dwarfed by the wall.
	drawFigure(scene, {
		x: 42,
		y: GROUND + 1,
		facing: 'left',
		clothes: C.stoneMid,
	});
	outline(scene, C.ink);
	underlay(scene, city);
	drawBeam(scene, 4, 0.75);
	drawBeam(scene, 59, -0.3);
	drawLamps(scene);
	return scene;
}

/**
 * Smog over the whole sky, thickest and murkiest near the ground, with drifting brown banks.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSmog(layer, random) {
	for (let y = 0; y < GROUND; y++) {
		const t = y / GROUND;
		const tint = t < 0.5 ? SMOG.high : SMOG.low;
		for (let x = 0; x < 64; x++) {
			const behind = /** @type {Colour} */ (get(layer, x, y));
			const amount = 0.35 + Math.floor(t * 4) * 0.12;
			set(layer, x, y, mix(behind, tint, amount));
		}
	}
	for (const [cx, cy, rx, ry] of [
		[10, 6, 16, 3],
		[50, 9, 18, 3],
		[28, 33, 22, 3],
		[60, 36, 10, 2],
		[4, 30, 10, 2],
	]) {
		const phase = random() * 6;
		for (let y = cy - ry; y <= cy + ry; y++) {
			for (let x = cx - rx; x <= cx + rx; x++) {
				const wave = Math.sin(x * 0.5 + phase) * 0.8;
				const d = ((x - cx) / rx) ** 2 + ((y - cy + wave) / ry) ** 2;
				if (d <= 1) {
					set(layer, x, y, y - cy > 0 ? SMOG.cloudShade : SMOG.cloud);
				}
			}
		}
	}
}

/**
 * The screen's red light on the smog around it, in three bands.
 * @param {Canvas} layer
 */
function drawScreenGlow(layer) {
	const cx = (SCREEN.left + SCREEN.right) / 2;
	const cy = (SCREEN.top + SCREEN.bottom) / 2;
	for (let y = 0; y < GROUND; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot((x - cx) * 0.7, y - cy);
			const band = d < 13 ? 3 : d < 17 ? 2 : d < 22 ? 1 : 0;
			if (band) {
				const behind = /** @type {Colour} */ (get(layer, x, y));
				set(layer, x, y, mix(behind, C.brickRedShade, band * 0.14));
			}
		}
	}
}

/**
 * The blank concrete blocks of the city behind the wall, with a few sickly lit windows.
 * @param {Canvas} city
 * @param {() => number} random
 */
function drawBlocks(city, random) {
	for (const [left, right, top] of [
		[6, 14, 29],
		[12, 21, 22],
		[20, 27, 32],
		[36, 44, 31],
		[42, 50, 20],
		[49, 57, 27],
	]) {
		for (let y = top; y < WALL_TOP + 2; y++) {
			for (let x = left; x <= right; x++) {
				let colour = CONCRETE.far;
				if (x === left || y === top) {
					colour = CONCRETE.farLight;
				} else if (x >= right - 1) {
					colour = CONCRETE.farShade;
				} else if ((y - top) % 3 === 2 && (x - left) % 2 === 0) {
					colour =
						random() < 0.18 ? CONCRETE.window : CONCRETE.farShade;
				}
				set(city, x, y, colour);
			}
		}
	}
}

/**
 * The tower that carries the screen: a thick pylon with a dark frame holding the screen, and masts on top.
 * @param {Canvas} city
 */
function drawScreenTower(city) {
	const { left, right, top, bottom } = SCREEN;
	// The pylon under the screen.
	for (let y = bottom + 1; y < WALL_TOP + 2; y++) {
		for (let x = 26; x <= 37; x++) {
			const colour =
				x === 26
					? CONCRETE.farLight
					: x >= 36
						? CONCRETE.farShade
						: (y + x) % 7 === 0
							? CONCRETE.farShade
							: CONCRETE.far;
			set(city, x, y, colour);
		}
	}
	// The frame.
	for (let y = top - 1; y <= bottom + 1; y++) {
		for (let x = left - 1; x <= right + 1; x++) {
			const edge =
				x === left - 1 ||
				x === right + 1 ||
				y === top - 1 ||
				y === bottom + 1;
			set(city, x, y, edge ? C.stoneShade : C.night);
		}
	}
	// Two masts on top.
	for (const x of [24, 39]) {
		rect(city, x, top - 6, 1, 5, C.stoneShade);
	}
}

/**
 * The watching eye on the screen: red scanlines, an almond eye with a red iris and a black pupil.
 * Drawn after the outline, inside the frame.
 * @param {Canvas} city
 */
function drawEye(city) {
	const { left, right, top, bottom } = SCREEN;
	const cx = (left + right) / 2;
	const cy = (top + bottom) / 2;
	const glow = mix(C.brickRedShade, C.night, 0.35);
	const scan = mix(C.brickRedShade, C.night, 0.6);
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			set(city, x, y, y % 2 ? glow : scan);
		}
	}
	const halfW = 10;
	const halfH = 5.5;
	const sclera = mix(C.creamLight, C.brickRedLight, 0.25);
	const scleraShade = mix(C.creamShade, C.brickRed, 0.35);
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const dx = (x - cx) / halfW;
			const dy = y - cy;
			const limit = halfH * (1 - dx * dx);
			if (Math.abs(dx) > 1 || Math.abs(dy) > limit) {
				continue;
			}
			const rim = Math.abs(dy) > limit - 1;
			const r = Math.hypot(x - cx, (y - cy) * 1.1);
			let colour = rim ? C.brickRedLight : sclera;
			if (!rim && dy > limit - 2.2) {
				colour = scleraShade;
			}
			if (r <= 4.3) {
				colour = r <= 3.2 ? C.brickRed : C.brickRedShade;
			}
			if (r <= 1.8) {
				colour = C.ink;
			}
			set(city, x, y, colour);
		}
	}
	// The glint in the eye.
	set(city, Math.floor(cx) - 2, Math.floor(cy) - 2, C.white);
	set(city, Math.floor(cx) - 1, Math.floor(cy) - 2, C.brickRedLight);
}

/**
 * The great wall across the scene: tall concrete panels with seams, stains and wire along the top.
 * @param {Canvas} scene
 */
function drawWall(scene) {
	for (let y = WALL_TOP; y < GROUND; y++) {
		for (let x = 0; x < 64; x++) {
			const panel = (x + 2) % 10;
			let colour = CONCRETE.main;
			if (y === WALL_TOP) {
				colour = CONCRETE.light;
			} else if (y === WALL_TOP + 1 || y === GROUND - 1) {
				colour = CONCRETE.shade;
			} else if (panel === 0) {
				colour = CONCRETE.shade;
			} else if (panel === 1) {
				colour = CONCRETE.light;
			} else if (y - WALL_TOP > 10 || (panel >= 6 && (x + y) % 3 === 0)) {
				colour = CONCRETE.mid;
			}
			set(scene, x, y, colour);
		}
	}
	// Stains running down from the top.
	for (const [x, length] of [
		[5, 6],
		[17, 9],
		[22, 4],
		[44, 7],
		[50, 5],
	]) {
		for (let y = WALL_TOP + 2; y < WALL_TOP + 2 + length; y++) {
			set(scene, x, y, CONCRETE.shade);
		}
	}
	// Wire posts along the top.
	for (let x = 2; x < 64; x += 5) {
		set(scene, x, WALL_TOP - 1, CONCRETE.shade);
		set(scene, x, WALL_TOP - 2, CONCRETE.shade);
		set(scene, x, WALL_TOP - 3, CONCRETE.mid);
	}
}

/**
 * A watchtower on the wall: a concrete shaft with a wider cabin, red slits and a searchlight on top.
 * @param {Canvas} scene
 * @param {number} left - The cabin's leftmost column
 */
function drawWatchtower(scene, left) {
	// The shaft.
	for (let y = 26; y < GROUND; y++) {
		for (let x = left + 1; x <= left + 7; x++) {
			const colour =
				x === left + 1
					? CONCRETE.light
					: x >= left + 6
						? CONCRETE.shade
						: (y - 26) % 4 === 3
							? CONCRETE.mid
							: CONCRETE.main;
			set(scene, x, y, colour);
		}
	}
	// The cabin, with its slit windows.
	for (let y = 20; y <= 25; y++) {
		for (let x = left; x <= left + 8; x++) {
			let colour = CONCRETE.main;
			if (y === 20) {
				colour = CONCRETE.light;
			} else if (y === 25 || x >= left + 7) {
				colour = CONCRETE.shade;
			} else if (y === 22 && x >= left + 2 && x <= left + 6) {
				colour = x % 2 ? C.brickRedLight : C.brickRed;
			}
			set(scene, x, y, colour);
		}
	}
	// The searchlight's housing.
	rect(scene, left + 2, 17, 5, 3, C.stoneShade);
}

/**
 * The shut steel gate in the middle of the wall: dark iron leaves with ribs, crossbars and a heavy frame.
 * @param {Canvas} scene
 */
function drawGate(scene) {
	const left = 24;
	const right = 39;
	const top = 44;
	const iron = mix(C.stoneShade, C.night, 0.35);
	const ironLight = C.stoneShade;
	const ironDark = mix(C.stoneShade, C.night, 0.6);
	for (let y = top; y < GROUND; y++) {
		for (let x = left; x <= right; x++) {
			let colour = iron;
			if (x === left || y === top) {
				colour = C.stoneMid;
			} else if (x === right) {
				colour = ironDark;
			} else if (x === 31) {
				colour = ironDark;
			} else if (y === 48 || y === 53) {
				colour = ironLight;
			} else if ((x - left) % 3 === 1) {
				colour = ironLight;
			} else if ((x - left) % 3 === 0) {
				colour = ironDark;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The bare, wet ground in front of the wall, with puddles catching the red light.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawGround(scene, random) {
	const dark = mix(C.stoneShade, C.night, 0.55);
	const darker = mix(C.stoneShade, C.night, 0.75);
	for (let y = GROUND; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(scene, x, y, (x + y) % 2 && y > GROUND + 2 ? darker : dark);
		}
	}
	for (const [x, y, w] of [
		[20, 60, 6],
		[38, 61, 8],
		[6, 62, 5],
	]) {
		rect(scene, x, y, w, 1, mix(C.brickRedShade, C.stoneShade, 0.3));
		set(scene, x + 1 + Math.floor(random() * (w - 2)), y, C.brickRed);
	}
}

/**
 * A searchlight's hard beam, raking up across the smog from a watchtower, brightening whatever it crosses.
 * The screen's frame and eye are left untouched.
 * @param {Canvas} scene
 * @param {number} x0 - The lamp's column
 * @param {number} lean - Columns the beam moves sideways per row it rises: positive to the right
 */
function drawBeam(scene, x0, lean) {
	const y0 = 17;
	for (let y = y0 - 1; y >= 0; y--) {
		const k = y0 - y;
		const centre = x0 + lean * k;
		const half = 1 + k * 0.14;
		for (
			let x = Math.floor(centre - half - 1);
			x <= Math.ceil(centre + half + 1);
			x++
		) {
			const off = Math.abs(x - centre);
			const onScreen =
				x >= SCREEN.left - 2 &&
				x <= SCREEN.right + 2 &&
				y >= SCREEN.top - 2 &&
				y <= SCREEN.bottom + 2;
			const behind = get(scene, x, y);
			if (!behind || onScreen || off > half + 0.5) {
				continue;
			}
			const core = off <= half - 0.6;
			set(scene, x, y, mix(behind, C.beamLight, core ? 0.72 : 0.38));
		}
	}
}

/**
 * The lit searchlight lenses, and the red warning lamp over the gate.
 * @param {Canvas} scene
 */
function drawLamps(scene) {
	for (const x of [2, 57]) {
		rect(scene, x + 1, 17, 3, 2, C.beamLight);
		set(scene, x + 2, 17, C.white);
	}
	set(scene, 31, 42, C.brickRedLight);
	set(scene, 32, 42, C.brickRed);
}
