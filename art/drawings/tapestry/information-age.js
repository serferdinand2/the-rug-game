// Information Age: a dark computer room at night, a desk of glowing green screens between blinking server racks, cables across the floor.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The floor's first row, the desk top's row and the room's centre column. */
const FLOOR = 46;
const DESK = 37;
const CX = 32;

/** The screens' phosphor green, blended from the palette. */
const SCREEN = {
	bright: mix(C.grassLight, C.white, 0.45),
	main: mix(C.grassLight, C.foam, 0.2),
	mid: C.grass,
	dim: mix(C.grassShade, C.forestFloorShade, 0.5),
	back: mix(C.forestFloorShade, C.ink, 0.55),
};

/** The amber screen's glow. */
const AMBER = {
	bright: mix(C.gold, C.lampGlow, 0.4),
	main: C.amber,
	back: mix(C.timberShade, C.ink, 0.6),
};

/** The dark metal of the racks and the monitors. */
const METAL = {
	light: mix(C.stoneShade, C.stone, 0.4),
	main: mix(C.stoneShade, C.night, 0.45),
	shade: mix(C.night, C.ink, 0.4),
};

/**
 * Draws the Information Age scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(811);

	drawInterior(layer, {
		floor: FLOOR,
		random,
		wall: 'panel',
		window: { x: 25, y: 2, w: 14, h: 10, time: 'night' },
	});
	dim(layer);

	drawRack(scene, 0, random);
	drawRack(scene, 53, random);
	drawDesk(scene);
	drawTower(scene);
	drawMonitor(scene, { left: 22, right: 41, top: 15, bottom: 31 });
	drawSideMonitor(scene, 12, 'left', AMBER.back);
	drawSideMonitor(scene, 43, 'right', SCREEN.back);
	drawCables(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawGlobe(scene);
	drawBars(scene);
	drawCode(scene);
	drawKeyboard(scene);
	drawLeds(scene, random);

	const screens = [
		...Object.values(SCREEN),
		...Object.values(AMBER),
		METAL.main,
	];
	glow(scene, {
		x: CX,
		y: 24,
		radius: 22,
		colour: C.grass,
		strength: 0.5,
		steps: 3,
		skip: screens,
	});
	glow(scene, {
		x: 16,
		y: 27,
		radius: 14,
		colour: C.amber,
		strength: 0.4,
		steps: 3,
		skip: screens,
	});
	return scene;
}

/**
 * Darkens the room to night, in bands that deepen away from the screens, leaving the window's sky as it is.
 * @param {Canvas} layer
 */
function dim(layer) {
	const dark = mix(C.nightSky2, C.wood, 0.4);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const inWindow = x >= 26 && x <= 37 && y >= 3 && y <= 10;
			const colour = /** @type {Colour} */ (get(layer, x, y));
			// Four bands of darkness, so the room keeps few colours.
			const band = Math.min(
				3,
				Math.floor(Math.hypot(x - CX, (y - 26) * 1.3) / 9)
			);
			if (!inWindow) {
				set(layer, x, y, mix(colour, dark, 0.5 + band * 0.1));
			}
		}
	}
}

/**
 * A tall server rack: a dark cabinet with a lit edge, filled with stacked units and their vents.
 * @param {Canvas} scene
 * @param {number} left - The rack's leftmost column
 * @param {() => number} random
 */
function drawRack(scene, left, random) {
	const w = 11;
	const top = 4;
	const bottom = 55;
	const lit = left > CX ? left : left + w - 1;
	rect(scene, left, top, w, bottom - top + 1, METAL.main);
	for (let y = top; y <= bottom; y++) {
		set(scene, lit, y, METAL.light);
	}
	rect(scene, left, top, w, 2, METAL.light);
	// The units: two-row faces with a vent line, packed from the top down.
	for (let y = top + 3; y < bottom - 3; y += 3) {
		const inner = left > CX ? left + 2 : left + 1;
		const width = w - 3;
		rect(scene, inner, y, width, 2, mix(METAL.main, METAL.light, 0.35));
		for (let x = inner + 4; x < inner + width - 1; x += 2) {
			set(scene, x, y + 1, METAL.shade);
		}
		if (random() > 0.75) {
			rect(scene, inner, y, width, 2, METAL.shade);
		}
	}
	rect(scene, left, bottom - 2, w, 3, METAL.shade);
}

/**
 * The blinking lights on the racks' units, painted after the outline so they stay crisp.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLeds(scene, random) {
	for (const left of [0, 53]) {
		const inner = left > CX ? left + 2 : left + 1;
		for (let y = 7; y < 52; y += 3) {
			if (get(scene, inner, y) === METAL.shade) {
				continue;
			}
			for (let i = 0; i < 3; i++) {
				const roll = random();
				let colour = SCREEN.dim;
				if (roll < 0.45) {
					colour = SCREEN.bright;
				} else if (roll < 0.62) {
					colour = C.amber;
				} else if (roll < 0.68) {
					colour = C.brickRedLight;
				}
				set(scene, inner + i, y, colour);
			}
		}
	}
}

/**
 * The desk: a long wooden top with a lit edge, a front panel and metal legs.
 * @param {Canvas} scene
 */
function drawDesk(scene) {
	rect(scene, 13, DESK, 38, 1, C.timberLight);
	rect(scene, 13, DESK + 1, 38, 2, C.timber);
	rect(scene, 13, DESK + 3, 38, 1, C.timberShade);
	for (const x of [14, 48]) {
		rect(scene, x, DESK + 4, 2, 13, METAL.light);
		set(scene, x + 1, DESK + 4, METAL.main);
	}
	rect(scene, 16, DESK + 4, 32, 1, C.timberShade);
}

/**
 * A computer tower standing under the desk.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	rect(scene, 38, 43, 7, 11, METAL.main);
	rect(scene, 38, 43, 1, 11, METAL.light);
	rect(scene, 40, 45, 4, 1, METAL.shade);
	rect(scene, 40, 47, 4, 1, METAL.shade);
	set(scene, 41, 51, SCREEN.bright);
}

/**
 * The big centre monitor: a dark bezel around the screen, on a stand.
 * @param {Canvas} scene
 * @param {{ left: number, right: number, top: number, bottom: number }} box
 */
function drawMonitor(scene, { left, right, top, bottom }) {
	rect(scene, left, top, right - left + 1, bottom - top + 1, METAL.main);
	rect(scene, left, top, right - left + 1, 1, METAL.light);
	rect(
		scene,
		left + 2,
		top + 2,
		right - left - 3,
		bottom - top - 3,
		SCREEN.back
	);
	rect(scene, CX - 2, bottom + 1, 4, 4, METAL.main);
	rect(scene, CX - 2, bottom + 1, 1, 4, METAL.light);
	rect(scene, CX - 6, DESK - 1, 12, 1, METAL.light);
}

/**
 * A smaller monitor turned towards the centre, its outer edge shorter so it reads as angled.
 * @param {Canvas} scene
 * @param {number} left - The monitor's leftmost column
 * @param {'left' | 'right'} side - Which side of the desk it stands on
 * @param {Colour} back - The dark screen's colour
 */
function drawSideMonitor(scene, left, side, back) {
	const w = 9;
	for (let i = 0; i < w; i++) {
		const outer = side === 'left' ? w - 1 - i : i;
		const top = 19 + Math.round(outer * 0.3);
		const bottom = 32 - Math.round(outer * 0.3);
		for (let y = top; y <= bottom; y++) {
			const edge = y === top || y === bottom || i === 0 || i === w - 1;
			set(scene, left + i, y, edge ? METAL.main : back);
		}
	}
	const stand = side === 'left' ? left + 5 : left + 2;
	rect(scene, stand, 33, 2, 3, METAL.main);
	rect(scene, stand - 2, DESK - 1, 6, 1, METAL.light);
}

/**
 * Cables spilling from the racks and the tower across the floor, each a lit top over a shaded underside.
 * @param {Canvas} scene
 */
function drawCables(scene) {
	/** @type {[Colour, Colour, (t: number) => [number, number]][]} */
	const cables = [
		[
			C.brickRedLight,
			C.brickRed,
			(t) => [10 + t * 16 + Math.sin(t * 3) * 4, 53 + t * 11],
		],
		[
			C.daySky4,
			C.daySea2,
			(t) => [11 - t * 6 + Math.sin(t * 4) * 3, 56 + t * 8],
		],
		[
			METAL.light,
			METAL.shade,
			(t) => [39 - t * 9 - Math.sin(t * 3) * 5, 54 + t * 10],
		],
		[
			C.gold,
			C.amber,
			(t) => [53 - t * 12 - Math.sin(t * 3.5) * 4, 54 + t * 10],
		],
		[
			C.grassLight,
			C.grassShade,
			(t) => [55 + t * 6 + Math.sin(t * 3) * 2, 56 + t * 8],
		],
	];
	for (const [light, shade, path] of cables) {
		for (let s = 0; s <= 120; s++) {
			const [x, y] = path(s / 120);
			const px = Math.round(x);
			const py = Math.round(y);
			set(scene, px, py, light);
			set(scene, px, py + 1, shade);
		}
	}
}

/**
 * The centre screen: a wireframe globe ringed by a network of nodes.
 * @param {Canvas} scene
 */
function drawGlobe(scene) {
	const gx = CX - 0.5;
	const gy = 23;
	const r = 5.5;
	for (let y = 17; y <= 29; y++) {
		for (let x = 24; x <= 39; x++) {
			const dx = x - gx;
			const dy = y - gy;
			const d = Math.hypot(dx, dy);
			if (d > r + 0.5) {
				continue;
			}
			const rim = d > r - 0.6;
			const parallel =
				Math.abs(dy) < 0.5 || Math.abs(Math.abs(dy) - 3) < 0.5;
			const half = Math.sqrt(Math.max(0, r * r - dy * dy));
			const meridian =
				Math.abs(dx) < 0.5 ||
				Math.abs(Math.abs(dx) - half * 0.55) < 0.5;
			if (rim) {
				set(scene, x, y, SCREEN.bright);
			} else if (parallel || meridian) {
				set(scene, x, y, SCREEN.mid);
			} else {
				set(scene, x, y, SCREEN.dim);
			}
		}
	}
	// Nodes around the globe, linked to it.
	for (const [x, y] of [
		[25, 18],
		[38, 19],
		[25, 28],
		[38, 28],
	]) {
		set(scene, x, y, SCREEN.bright);
	}
	line(scene, 26, 19, 27, 20, SCREEN.mid);
	line(scene, 37, 20, 36, 21, SCREEN.mid);
	line(scene, 26, 27, 27, 26, SCREEN.mid);
	line(scene, 37, 27, 36, 26, SCREEN.mid);
}

/**
 * The left screen: an amber bar chart, its bars rising to the right.
 * @param {Canvas} scene
 */
function drawBars(scene) {
	[3, 5, 4, 7].forEach((h, i) => {
		for (let y = 30 - h; y <= 30; y++) {
			set(scene, 13 + i * 2, y, y === 30 - h ? AMBER.bright : AMBER.main);
		}
	});
}

/**
 * The right screen: indented lines of code, as short dashes.
 * @param {Canvas} scene
 */
function drawCode(scene) {
	const lines = [
		[0, 5],
		[1, 3],
		[1, 4],
		[2, 2],
		[1, 4],
		[0, 3],
	];
	lines.forEach(([indent, length], j) => {
		for (let i = 0; i < length; i++) {
			set(
				scene,
				45 + indent + i,
				22 + j * 2,
				i === 0 ? SCREEN.bright : SCREEN.mid
			);
		}
	});
}

/**
 * A keyboard and a mouse on the desk.
 * @param {Canvas} scene
 */
function drawKeyboard(scene) {
	for (let x = 25; x <= 38; x++) {
		set(scene, x, DESK, x % 2 ? C.stoneLight : C.stone);
		set(scene, x, DESK + 1, METAL.light);
	}
	set(scene, 42, DESK, C.stoneLight);
	set(scene, 43, DESK, C.stone);
}
