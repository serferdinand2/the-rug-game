// Hive Mind: a glowing honeycomb tower at dusk, its crown linked by threads of light to a swarm of clockwork drones.
import {
	createCanvas,
	get,
	set,
	line,
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

/** The ground's first row, the tower's middle column and top row, and the crown's centre. */
const GROUND = 52;
const CX = 32;
const TOP = 12;
const CROWN = { x: CX, y: TOP - 4 };

/** The drones, each where it hovers and which way it faces. */
const DRONES = [
	{ x: 7, y: 9, mirror: false },
	{ x: 18, y: 21, mirror: false },
	{ x: 4, y: 31, mirror: false },
	{ x: 12, y: 42, mirror: false },
	{ x: 53, y: 7, mirror: true },
	{ x: 44, y: 19, mirror: true },
	{ x: 56, y: 29, mirror: true },
	{ x: 49, y: 41, mirror: true },
];

/** Threads between neighbouring drones, by their index in DRONES. */
const LINKS = [
	[0, 1],
	[1, 2],
	[2, 3],
	[4, 5],
	[5, 6],
	[6, 7],
];

/** The honeycomb's wax walls and its cells: lit with honey, full and dark. */
const WAX = {
	wall: C.lampFrame,
	wallShade: C.timberShade,
	bright: C.lampGlow,
	lit: C.gold,
	full: C.amber,
	dark: mix(C.timberShade, C.duskSky2, 0.4),
};

/**
 * Draws the Hive Mind scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7717);

	drawSky(layer, { time: 'dusk', horizon: GROUND - 1, random });
	glow(layer, { x: CX, y: 34, radius: 28, colour: C.amber, strength: 0.32 });
	drawHills(layer);
	glow(layer, {
		x: CX,
		y: GROUND + 1,
		radius: 12,
		colour: C.amber,
		strength: 0.35,
	});
	drawThreads(layer);

	drawTower(scene);
	drawSkeps(scene);
	for (const drone of DRONES) {
		drawDrone(scene, drone);
	}
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCrown(scene);
	drawPulses(scene);
	return scene;
}

/**
 * Dark rolling ground under the dusk, warmed by the tower's light near its foot.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	const far = mix(C.duskSky2, C.ink, 0.35);
	const near = mix(C.roofShade, C.ink, 0.4);
	for (let x = 0; x < 64; x++) {
		const ridge = Math.round(GROUND - 3 + Math.sin(x * 0.2 + 1) * 2);
		for (let y = ridge; y < 64; y++) {
			let colour = y < GROUND ? far : near;
			if (y === GROUND) {
				colour = mix(near, C.duskSky4, 0.3);
			} else if (y > GROUND + 5 && (x + y) % 2 === 0) {
				colour = mix(near, C.ink, 0.4);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Blends a line of light into a canvas: the pixels a one-pixel line would cover move towards the light's colour.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {Colour} colour
 * @param {number} strength - From 0 to 1
 */
function beam(canvas, x0, y0, x1, y1, colour, strength) {
	const mask = createCanvas(canvas.w, canvas.h);
	line(mask, x0, y0, x1, y1, C.white);
	for (let i = 0; i < mask.p.length; i++) {
		const behind = canvas.p[i];
		if (mask.p[i] && behind) {
			canvas.p[i] = mix(behind, colour, strength);
		}
	}
}

/**
 * The threads of light: one from the crown to every drone, and one between each pair of neighbouring drones.
 * @param {Canvas} layer
 */
function drawThreads(layer) {
	for (const [a, b] of LINKS) {
		const from = DRONES[a];
		const to = DRONES[b];
		beam(
			layer,
			from.x + 2,
			from.y + 2,
			to.x + 2,
			to.y + 2,
			C.arcaneLight,
			0.55
		);
	}
	for (const drone of DRONES) {
		beam(
			layer,
			CROWN.x,
			CROWN.y,
			drone.x + 2,
			drone.y + 2,
			C.lampGlow,
			0.8
		);
	}
}

/**
 * The tower's half-width at a row: a rounded dome at the top, then a long gentle taper to a wide foot.
 * @param {number} y
 * @returns {number}
 */
function halfWidth(y) {
	const dome = 6;
	if (y < TOP + dome) {
		const t = (TOP + dome - y) / dome;
		return 7 * Math.sqrt(Math.max(0, 1 - t * t));
	}
	return 7 + (y - TOP - dome) * 0.14;
}

/**
 * The honeycomb tower: hexagonal cells of glowing honey in walls of wax, lit on the left and dimmer on the right.
 * @param {Canvas} scene
 */
function drawTower(scene) {
	for (let y = TOP; y < GROUND + 1; y++) {
		const half = halfWidth(y);
		for (let x = Math.round(CX - half); x <= Math.round(CX + half); x++) {
			const across = (x - CX) / half;
			const cell = honeycomb(x, y);
			let colour;
			if (cell.wall) {
				colour = across > 0.45 ? WAX.wallShade : WAX.wall;
			} else {
				colour = cell.fill;
				if (across > 0.55) {
					colour =
						colour === WAX.bright
							? WAX.lit
							: colour === WAX.lit
								? WAX.full
								: WAX.dark;
				}
			}
			if (across < -0.88) {
				colour = cell.wall ? C.amber : C.lampGlow;
			}
			set(scene, x, y, colour);
		}
	}
	// Wax ledges ringing the tower, a little wider than it.
	for (const y of [TOP + 14, TOP + 27]) {
		const half = Math.round(halfWidth(y)) + 1;
		for (let x = CX - half; x <= CX + half; x++) {
			const colour =
				x > CX + half * 0.45
					? C.amber
					: x === CX - half
						? C.lampGlow
						: C.gold;
			set(scene, x, y, colour);
			set(
				scene,
				x,
				y + 1,
				x > CX + half * 0.45 ? WAX.wallShade : WAX.wall
			);
		}
	}
	// The arched doorway at the foot, full of light.
	for (let y = GROUND - 6; y <= GROUND; y++) {
		for (let x = CX - 2; x <= CX + 2; x++) {
			const arch = y === GROUND - 6 && Math.abs(x - CX) === 2;
			if (!arch) {
				set(
					scene,
					x,
					y,
					Math.abs(x - CX) === 2
						? WAX.wall
						: y < GROUND - 4
							? C.lampGlow
							: C.white
				);
			}
		}
	}
}

/**
 * Finds which honeycomb cell a pixel falls in, on a lattice of flat-topped hexagons.
 * @param {number} x
 * @param {number} y
 * @returns {{ wall: boolean, fill: Colour }} Whether the pixel is a wax wall, and the colour of its cell.
 */
function honeycomb(x, y) {
	let best = Infinity;
	let next = Infinity;
	let bi = 0;
	let bj = 0;
	for (let i = Math.floor(x / 5) - 1; i <= Math.floor(x / 5) + 1; i++) {
		for (let j = Math.floor(y / 6) - 1; j <= Math.floor(y / 6) + 1; j++) {
			const hx = i * 5 + 2;
			const hy = j * 6 + (i % 2 === 0 ? 0 : 3);
			const d = Math.hypot(x - hx, (y - hy) * 0.95);
			if (d < best) {
				next = best;
				best = d;
				bi = i;
				bj = j;
			} else if (d < next) {
				next = d;
			}
		}
	}
	const hash = Math.abs((bi * 73856093) ^ (bj * 19349663)) % 7;
	const fill =
		hash < 3
			? WAX.lit
			: hash < 5
				? WAX.full
				: hash < 6
					? WAX.bright
					: WAX.dark;
	return {
		wall: next - best < 1.5,
		fill: best < 1 && fill === WAX.lit ? WAX.bright : fill,
	};
}

/**
 * Straw skeps around the tower's foot: banded domes, each with a glowing doorway.
 * @param {Canvas} scene
 */
function drawSkeps(scene) {
	for (const [cx, r] of [
		[6, 4],
		[57, 4],
	]) {
		const height = r + 3;
		for (let y = GROUND - height; y <= GROUND + 1; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				const d = Math.hypot(x - cx, ((y - GROUND - 1) * r) / height);
				if (d > r + 0.4) {
					continue;
				}
				let colour = (GROUND - y) % 2 === 0 ? C.timberLight : C.timber;
				if (x > cx + r / 3) {
					colour = (GROUND - y) % 2 === 0 ? C.timber : C.timberShade;
				}
				set(scene, x, y, colour);
			}
		}
		set(scene, cx, GROUND, C.gold);
		set(scene, cx, GROUND + 1, C.gold);
	}
}

/**
 * One drone: a clockwork bee with a striped brass body, glassy wings and a glowing eye.
 * @param {Canvas} scene
 * @param {{ x: number, y: number, mirror: boolean }} drone
 */
function drawDrone(scene, { x, y, mirror }) {
	paint(
		scene,
		x,
		y,
		['..ww...', '..ww...', '.bkbkh.', 'sbkbkhe', '.bkbkh.'],
		{
			w: C.ghostLight,
			b: C.gold,
			k: C.wood,
			h: C.stoneShade,
			e: C.tealLight,
			s: C.stone,
		},
		{ mirror }
	);
}

/**
 * The crown at the tower's tip: a white-hot node of light where every thread meets.
 * @param {Canvas} scene
 */
function drawCrown(scene) {
	glow(scene, {
		x: CROWN.x,
		y: CROWN.y,
		radius: 6,
		colour: C.lampGlow,
		strength: 0.45,
	});
	for (let y = CROWN.y - 2; y <= CROWN.y + 2; y++) {
		for (let x = CROWN.x - 2; x <= CROWN.x + 2; x++) {
			const d = Math.hypot(x - CROWN.x, y - CROWN.y);
			if (d <= 2.3) {
				set(scene, x, y, d < 1.2 ? C.white : C.lampGlow);
			}
		}
	}
	// The stalk joining the crown to the dome.
	set(scene, CROWN.x, CROWN.y + 3, C.gold);
}

/**
 * Bright pulses travelling along the threads from the crown.
 * @param {Canvas} scene
 */
function drawPulses(scene) {
	for (const [i, t] of [
		[0, 0.5],
		[2, 0.4],
		[5, 0.55],
		[7, 0.35],
	]) {
		const drone = DRONES[i];
		const x = Math.round(CROWN.x + (drone.x + 2 - CROWN.x) * t);
		const y = Math.round(CROWN.y + (drone.y + 2 - CROWN.y) * t);
		const behind = get(scene, x, y);
		if (behind !== C.ink) {
			set(scene, x, y, C.white);
		}
	}
}
