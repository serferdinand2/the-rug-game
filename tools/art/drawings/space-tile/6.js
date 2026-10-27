// Space tile 6: a comet close up on deep navy, its dark icy nucleus venting bright jets towards a far sun, wrapped in a glowing coma, its tails streaming away.
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

/**
 * How bright each pixel of space is, and how much of that comes from the dust tail and from the jets.
 * @typedef {Object} Light
 * @property {number[]} level - The brightness on the RAMP's scale, row by row
 * @property {number[]} dust - The dust tail's part of it
 * @property {number[]} jet - The jets' part of it
 */

/** The nucleus's middle, at the waist where its two lobes meet. */
const NUCLEUS = { x: 25, y: 40 };

/**
 * One lobe of the nucleus.
 * @typedef {Object} Lobe
 * @property {number} x - Its centre's column
 * @property {number} y - Its centre's row
 * @property {number} rx - Its half-length
 * @property {number} ry - Its half-width
 * @property {number} tilt - The angle of its long axis, in radians
 * @property {number} seed - Sets where its lumps fall
 */

/** The nucleus's two lobes, a bigger and a smaller, joined at a narrow waist. */
const LOBES = /** @type {Lobe[]} */ ([
	{ x: 21, y: 38, rx: 9, ry: 7.5, tilt: 0.45, seed: 0.6 },
	{ x: 30, y: 44, rx: 6.5, ry: 5.5, tilt: 0.95, seed: 2.2 },
]);

/** The far sun, low on the left: the comet's jets point towards it and its tails stream away from it. */
const SUN = { x: 5, y: 58 };

/** Sunlight on the nucleus, from the lower left and a little towards the viewer. */
const LIGHT = normalise([-0.62, 0.5, 0.6]);

/** Which way the tails stream: straight away from the sun. */
const TAIL = normalise([NUCLEUS.x - SUN.x, NUCLEUS.y - SUN.y]);

/** The jets: the angle each leaves the nucleus at, in radians (0 is right, positive is down), and its length. */
const JETS = [
	{ angle: 2.15, length: 12 },
	{ angle: 2.85, length: 12 },
	{ angle: 1.65, length: 11 },
	{ angle: 3.45, length: 9 },
	{ angle: -2.55, length: 7 },
];

/** The glow of space from the deep navy far out to the white heart of the coma, darkest first. */
const RAMP = [
	mix(C.ink, C.nightSea3, 0.3),
	mix(C.night, C.nightSea3, 0.55),
	mix(C.night, C.nightSea3, 0.85),
	mix(C.nightSea3, C.nightSea2, 0.5),
	C.nightSea2,
	mix(C.nightSea2, C.nightSea1, 0.6),
	mix(C.nightSea1, C.nightWaveDeep, 0.3),
	mix(C.nightSea1, C.nightWaveDeep, 0.75),
	mix(C.nightWaveDeep, C.nightWave, 0.4),
	mix(C.nightWaveDeep, C.nightWave, 0.85),
	mix(C.nightWave, C.foam, 0.5),
	C.foam,
	mix(C.foam, C.white, 0.55),
	C.white,
];

/** The dust tail's ramp: the same glow, warmed towards cream, for dust lit by the sun. */
const DUST_RAMP = RAMP.map((colour, i) =>
	mix(colour, C.creamLight, i < 2 ? 0 : 0.04 + i * 0.02)
);

/** The ion tail's straight blue streak, faint to bright. */
const ION = [
	mix(C.nightSea2, C.teal, 0.3),
	mix(C.nightSea1, C.teal, 0.45),
	mix(C.nightWaveDeep, C.tealLight, 0.4),
];

/** Dim stars, the third brightness after white and starDim. */
const STAR_FAINT = mix(C.starDim, C.nightSea3, 0.55);

/** The nucleus: dusty dark ice, from its sunlit face to its night side. */
const N_HI = mix(C.stone, C.foam, 0.25);
const N_LIT = mix(C.stoneShade, C.nightWaveDeep, 0.35);
const N_BASE = mix(C.stoneShade, C.nightSea3, 0.5);
const N_MID = mix(C.roofShade, C.nightSea3, 0.45);
const N_SHADE = mix(C.night, C.nightSea3, 0.35);
const N_DARK = mix(C.ink, C.night, 0.5);

/** Frost on the nucleus: bright in the sun, dim past the terminator. */
const FROST = C.snowShade;
const FROST_HI = C.snow;
const FROST_DIM = mix(C.snowShade, C.nightSea2, 0.5);

/** The coma's light caught on the nucleus's night-side rim. */
const RIM = mix(C.nightSea1, C.stoneShade, 0.4);

/** The jets' white-hot cores. */
const JET_CORE = mix(C.white, C.foam, 0.3);

/** The sun's warm white against the blue. */
const SUN_RAY = mix(C.lampGlow, C.nightWaveDeep, 0.35);

/**
 * Draws space tile 6 (research and 6 VP).
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(6607);

	const light = brightness();
	paintGlow(layer, light);
	drawIonTail(layer, light);
	drawStars(layer, light, random);
	drawSun(layer);

	const nucleus = createCanvas(64, 64);
	drawNucleus(nucleus);
	drawRidges(nucleus);
	drawFrost(nucleus, random);
	drawPits(nucleus);
	outline(nucleus, C.ink);
	underlay(nucleus, layer);

	drawVents(nucleus);
	drawSparkles(nucleus);
	return nucleus;
}

/**
 * Scales a vector to length 1.
 * @param {number[]} v
 * @returns {number[]}
 */
function normalise(v) {
	const length = Math.hypot(...v);
	return v.map((n) => n / length);
}

/**
 * Where a point lies on one lobe of the nucleus, in the lobe's tilted frame, measured so its lumpy edge is 1.
 * @param {Lobe} lobe
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number, d: number, tilt: number }} The point's place along and across,
 * its distance out, and the lobe's tilt.
 */
function onLobe(lobe, x, y) {
	const dx = x + 0.5 - lobe.x;
	const dy = y + 0.5 - lobe.y;
	const c = Math.cos(lobe.tilt);
	const s = Math.sin(lobe.tilt);
	const lx = dx * c + dy * s;
	const ly = -dx * s + dy * c;
	const angle = Math.atan2(ly, lx);
	const scale =
		1 +
		0.09 * Math.sin(angle * 3 + lobe.seed) +
		0.05 * Math.sin(angle * 5 + lobe.seed * 2) +
		0.03 * Math.sin(angle * 8 + lobe.seed * 3);
	const u = lx / (lobe.rx * scale);
	const v = ly / (lobe.ry * scale);
	return { u, v, d: Math.hypot(u, v), tilt: lobe.tilt };
}

/**
 * Where a point lies on the nucleus: on whichever lobe it is nearer the middle of.
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number, d: number, tilt: number, waist: number }} As for onLobe, plus how close the
 * point is to the waist where the lobes meet (0 right on it).
 */
function onNucleus(x, y) {
	const [a, b] = LOBES.map((lobe) => onLobe(lobe, x, y));
	const near = a.d <= b.d ? a : b;
	return { ...near, waist: Math.abs(a.d - b.d) };
}

/**
 * How bright space is at every pixel: deep navy far out, the coma's haze round the nucleus,
 * the broad dust tail curving away, and the jets fanning out towards the sun.
 * @returns {Light}
 */
function brightness() {
	/** @type {Light} */
	const light = { level: [], dust: [], jet: [] };
	const across = [TAIL[1], -TAIL[0]];
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			// Deep navy, a shade lighter round the comet.
			const far = Math.hypot(x - NUCLEUS.x, y - NUCLEUS.y);
			let level = Math.max(0, 1.3 - far / 60);
			// The coma: a bright skin of haze hugging the nucleus inside a round cloud, a little
			// brighter on the sunward side, where the jets feed it.
			const out = Math.max(0, onNucleus(x, y).d - 1) * 9;
			const sunward = Math.hypot(x - NUCLEUS.x + 2, y - NUCLEUS.y - 2);
			level += 6.5 * Math.exp(-out / 5) + 4.8 * Math.exp(-sunward / 14);
			// The dust tail: broad and fading, curving behind the comet's path, combed into streamers.
			const rx = x - NUCLEUS.x;
			const ry = y - NUCLEUS.y;
			const along = rx * TAIL[0] + ry * TAIL[1];
			let dust = 0;
			if (along > 0) {
				const side =
					rx * across[0] + ry * across[1] + along * along * 0.0035;
				const width = 4 + along * 0.36;
				const core = 1 - Math.abs(side) / width;
				const streamer = 0.8 + 0.2 * Math.sin((side / width) * 8);
				if (core > 0) {
					dust =
						8 *
						core ** 0.8 *
						streamer *
						Math.max(0, 1 - along / 72);
				}
			}
			light.level.push(level + dust);
			light.dust.push(dust);
			light.jet.push(0);
		}
	}
	for (const jet of JETS) {
		addJet(light, jet);
	}
	return light;
}

/**
 * Finds the nucleus's edge in one direction from its centre: the first pixel outside it.
 * @param {number} angle
 * @returns {{ x: number, y: number }}
 */
function edgeAt(angle) {
	for (let r = 0; r < 30; r += 0.5) {
		const x = Math.round(NUCLEUS.x + Math.cos(angle) * r);
		const y = Math.round(NUCLEUS.y + Math.sin(angle) * r);
		if (onNucleus(x, y).d > 1) {
			return { x, y };
		}
	}
	return { x: NUCLEUS.x, y: NUCLEUS.y };
}

/**
 * Adds one jet: a narrow stream of gas and dust leaving the surface, widening and fading as it goes.
 * @param {Light} light
 * @param {{ angle: number, length: number }} jet
 */
function addJet(light, { angle, length }) {
	const start = edgeAt(angle);
	const dx = Math.cos(angle);
	const dy = Math.sin(angle);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const rx = x - start.x;
			const ry = y - start.y;
			const along = rx * dx + ry * dy;
			const side = Math.abs(rx * -dy + ry * dx);
			const width = 0.6 + along * 0.24;
			if (along < -0.5 || along > length || side > width) {
				continue;
			}
			const fade = 1 - Math.max(0, along) / length;
			const add = 7.5 * fade ** 0.8 * (1 - (side / width) * 0.7);
			light.level[y * 64 + x] += add;
			light.jet[y * 64 + x] += add;
		}
	}
}

/**
 * Paints space from its brightness, dithering a little where one band gives way to the next:
 * the dust tail in its warmer ramp, the jets' cores white-hot.
 * @param {Canvas} layer
 * @param {Light} light
 */
function paintGlow(layer, light) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const n = y * 64 + x;
			const level = Math.min(RAMP.length - 1, light.level[n]);
			let i = Math.floor(level);
			if (level - i > 0.75 && (x + y) % 2 === 0) {
				i = Math.min(RAMP.length - 1, i + 1);
			}
			const ramp =
				light.dust[n] > light.level[n] * 0.5 ? DUST_RAMP : RAMP;
			let colour = ramp[i];
			if (light.jet[n] > 4.5 && i >= RAMP.length - 2) {
				colour = JET_CORE;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The ion tail: a straight, narrow blue streak pointing dead away from the sun, beside the dust tail.
 * @param {Canvas} layer
 * @param {Light} light
 */
function drawIonTail(layer, light) {
	const turn = -0.24;
	const dx = TAIL[0] * Math.cos(turn) - TAIL[1] * Math.sin(turn);
	const dy = TAIL[0] * Math.sin(turn) + TAIL[1] * Math.cos(turn);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const rx = x - NUCLEUS.x;
			const ry = y - NUCLEUS.y;
			const along = rx * dx + ry * dy;
			const side = Math.abs(rx * -dy + ry * dx);
			const width = 0.6 + along * 0.03;
			if (along < 13 || side > width || light.level[y * 64 + x] > 6) {
				continue;
			}
			const strength =
				(1 - along / 66) *
				(1 - side / width) *
				Math.min(1, (along - 13) / 8);
			if (strength < 0.12) {
				continue;
			}
			const i = strength > 0.55 ? 2 : strength > 0.3 ? 1 : 0;
			set(layer, x, y, ION[i]);
		}
	}
}

/**
 * Stars in three brightnesses, only where the sky is dark enough to show them.
 * @param {Canvas} layer
 * @param {Light} light
 * @param {() => number} random
 */
function drawStars(layer, light, random) {
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const level = random();
		if (light.level[y * 64 + x] > 2.6) {
			continue;
		}
		set(
			layer,
			x,
			y,
			level > 0.8 ? C.white : level > 0.45 ? C.starDim : STAR_FAINT
		);
	}
}

/**
 * The far sun, low in the corner: a small warm-white star with a short flare.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	rect(layer, SUN.x - 1, SUN.y - 1, 3, 3, C.lampGlow);
	set(layer, SUN.x, SUN.y, C.white);
	for (let i = 2; i <= 5; i++) {
		for (const [dx, dy] of [
			[i, 0],
			[-i, 0],
			[0, i],
			[0, -i],
		]) {
			set(layer, SUN.x + dx, SUN.y + dy, i < 4 ? C.lampGlow : SUN_RAY);
		}
	}
}

/**
 * How much sunlight a point of the nucleus catches, from -1 to 1, with ridges breaking up the shading.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function sunlight(x, y) {
	const { u, v, d, tilt } = onNucleus(x, y);
	const nz = Math.sqrt(Math.max(0, 1 - d * d));
	const c = Math.cos(-tilt);
	const s = Math.sin(-tilt);
	const nx = u * c + v * s;
	const ny = -u * s + v * c;
	const bumps =
		0.08 * Math.sin(u * 9 + v * 3) + 0.05 * Math.sin(v * 14 - u * 4);
	return nx * LIGHT[0] + ny * LIGHT[1] + nz * LIGHT[2] + bumps;
}

/**
 * The nucleus: two lumpy lobes of dusty dark ice joined at a waist, lit hard from the sun's side,
 * the night side near black but for a thin rim where the coma's glow catches it.
 * @param {Canvas} nucleus
 */
function drawNucleus(nucleus) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { d, waist } = onNucleus(x, y);
			if (d > 1) {
				continue;
			}
			const light = sunlight(x, y);
			let colour = N_DARK;
			if (light > 0.9) {
				colour = N_HI;
			} else if (light > 0.7) {
				colour = N_LIT;
			} else if (light > 0.48) {
				colour = N_BASE;
			} else if (light > 0.26) {
				colour = N_MID;
			} else if (light > 0.04) {
				colour = N_SHADE;
			} else if (d > 0.9) {
				colour = RIM;
			}
			// The crease of the waist, where the smaller lobe tucks against the bigger.
			if (waist < 0.1 && d < 0.97) {
				colour = light > 0.5 ? N_MID : N_DARK;
			}
			set(nucleus, x, y, colour);
		}
	}
}

/**
 * A terraced cliff running across the ice: a lit lip over a dark drop, following the body's curve.
 * @param {Canvas} nucleus
 */
function drawRidges(nucleus) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (!get(nucleus, x, y)) {
				continue;
			}
			const { u, v } = onNucleus(x, y);
			const terrace = u * 2.2 + v * v * 0.8;
			const light = sunlight(x, y);
			if (Math.abs(terrace - 0.3) < 0.09) {
				set(nucleus, x, y, light > 0.3 ? N_SHADE : N_DARK);
			} else if (Math.abs(terrace - 0.48) < 0.08 && light > 0.35) {
				set(nucleus, x, y, N_HI);
			}
		}
	}
}

/**
 * Patches of bright frost on the sunlit ice, and a few dim ones past the terminator.
 * @param {Canvas} nucleus
 * @param {() => number} random
 */
function drawFrost(nucleus, random) {
	for (let i = 0; i < 22; i++) {
		const x = NUCLEUS.x - 13 + Math.floor(random() * 26);
		const y = NUCLEUS.y - 10 + Math.floor(random() * 20);
		if (!get(nucleus, x, y)) {
			continue;
		}
		const light = sunlight(x, y);
		if (light > 0.55) {
			set(nucleus, x, y, light > 0.8 ? FROST_HI : FROST);
			if (random() > 0.5 && get(nucleus, x + 1, y)) {
				set(nucleus, x + 1, y, FROST);
			}
		} else if (light > 0.2 && random() > 0.5) {
			set(nucleus, x, y, FROST_DIM);
		}
	}
}

/**
 * Dark pits in the ice, where gas has broken through.
 * @param {Canvas} nucleus
 */
function drawPits(nucleus) {
	for (const [cx, cy, r] of [
		[20, 42, 2],
		[27, 45, 1.5],
		[31, 38, 2],
		[22, 36, 1.2],
	]) {
		for (let y = Math.floor(cy - r); y <= cy + r; y++) {
			for (let x = Math.floor(cx - r); x <= cx + r; x++) {
				const d = Math.hypot(x - cx, y - cy);
				if (d > r || !get(nucleus, x, y)) {
					continue;
				}
				// The wall nearest the sun is in shadow, the far wall is lit.
				const side = (x - cx) * LIGHT[0] + (y - cy) * LIGHT[1];
				set(
					nucleus,
					x,
					y,
					side > 0 ? N_DARK : d > r - 0.8 ? N_HI : N_MID
				);
			}
		}
	}
}

/**
 * Where each jet leaves the surface: a white-hot vent on the nucleus's sunlit limb, lighting the ice round it.
 * @param {Canvas} canvas
 */
function drawVents(canvas) {
	for (const { angle } of JETS) {
		const edge = edgeAt(angle);
		glow(canvas, {
			x: edge.x,
			y: edge.y,
			radius: 4,
			colour: C.foam,
			strength: 0.4,
			steps: 2,
			skip: [C.ink, ...RAMP, ...DUST_RAMP],
		});
		const inX = Math.round(edge.x - Math.cos(angle));
		const inY = Math.round(edge.y - Math.sin(angle));
		set(canvas, edge.x, edge.y, C.white);
		set(canvas, inX, inY, FROST_HI);
	}
}

/**
 * A few four-point sparkles among the stars, away from the coma's glare.
 * @param {Canvas} canvas
 */
function drawSparkles(canvas) {
	for (const [x, y] of [
		[8, 9],
		[56, 50],
		[44, 59],
	]) {
		set(canvas, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(canvas, x + dx, y + dy, C.starDim);
		}
	}
}
