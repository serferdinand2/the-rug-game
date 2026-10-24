// Space tile 9: a Dyson lattice, a blazing orange star partly wrapped in a hexagonal shell of dark solar panels on pale steel struts, its light spilling through the empty frames, three more panels flying in.
import {
	createCanvas,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The star's centre and radius, and the radius of the lattice shell built round it. */
const STAR = { x: 31, y: 32, r: 15 };

/** The hottest point of the star's face, on its open side. */
const CORE = { x: 35, y: 30 };
const SHELL = 16.5;

/** How far the shell is turned, so no cell sits square in the middle, and how many cells span one radian of it. */
const TURN = 0.17;
const CELLS = 2.3;

/** The cool blue-violet of deep space, from far out to near the star. */
const SPACE = [
	mix(C.ink, C.nightSky1, 0.4),
	C.nightSky1,
	C.nightSky2,
	mix(C.nightSky2, C.nightSky3, 0.6),
];

/** How far the star's corona reaches beyond its limb. */
const CORONA_REACH = 17;

/** The orange of the star's light, and the corona's bands from faint and far to bright at the limb. */
const ORANGE = mix(C.amber, C.brickRedLight, 0.35);
const CORONA = [0.1, 0.2, 0.31, 0.43, 0.56, 0.7, 0.85].map((t) =>
	mix(SPACE[3], ORANGE, t)
);

/** The hot ring of light hugging the star's limb. */
const LIMB = mix(ORANGE, C.gold, 0.45);

/** Faint violet wisps of nebula drifting through the far dark. */
const NEBULA = [
	mix(SPACE[0], C.roofShade, 0.5),
	mix(SPACE[1], C.roof, 0.4),
	mix(SPACE[1], C.roofLight, 0.4),
];

/** The star's face, from its white-hot core through yellow to its hot orange limb. */
const STAR_RAMP = [
	C.white,
	C.lampGlow,
	mix(C.lampGlow, C.gold, 0.5),
	C.gold,
	mix(C.gold, C.amber, 0.5),
	C.amber,
	ORANGE,
	mix(C.amber, C.brickRed, 0.45),
];

/** The prominence on the open limb: bright at its crest, deeper at its feet. */
const FLARE = mix(C.gold, C.lampGlow, 0.3);
const FLARE_DEEP = mix(ORANGE, C.brickRedLight, 0.3);

/** The solar panels' dark blue backs, each with a diagonal sheen of starlight across its upper corner. */
const PANEL = mix(C.nightSea3, C.roofShade, 0.35);
const PANEL_LIT = mix(C.nightSea2, C.nightSea1, 0.3);
const PANEL_SHEEN = mix(C.nightSea1, C.nightWaveDeep, 0.55);
const PANEL_DARK = mix(C.nightSea3, C.ink, 0.45);
const PANEL_DEEP = mix(C.nightSea3, C.ink, 0.25);

/** The shell's pale steel struts: near white where the star blazes behind them, warmed by its light, then dimmer as the shell turns away. */
const STRUT_HOT = mix(C.snow, C.lampGlow, 0.6);
const STRUT = mix(C.stoneLight, C.lampGlow, 0.45);
const STRUT_DIM = mix(C.stone, C.amber, 0.35);
const STRUT_DARK = mix(C.stoneShade, C.amber, 0.2);

/** The struts between two panels, which the panels shade from the star. */
const STRUT_SHADED = mix(C.stoneShade, C.stoneMid, 0.4);
const STRUT_SHADED_DARK = mix(C.stoneShade, C.roofShade, 0.5);

/** The motion streaks behind the panels flying in, fading away from them. */
const STREAK = mix(STRUT, SPACE[3], 0.35);
const STREAK_FAINT = mix(STRUT_DIM, SPACE[2], 0.55);

/** The starlight spilling out through the empty frames: the middle of each, and how far it reaches. */
const SPILLS = [
	{ x: 28, y: 18 },
	{ x: 24, y: 36 },
	{ x: 31, y: 45 },
];
const SPILL_REACH = 5;

/** A flat-topped hexagonal panel, lit on its upper left, with a diagonal sheen: seven pixels wide. */
const PANEL_FLAT = [
	'.aaaab.',
	'.alspb.',
	'alsppdb',
	'asppddb',
	'.apddb.',
	'.abbbb.',
];

/** The same panel turned on its point, seven pixels tall. */
const PANEL_POINT = [
	'..ab..',
	'.alsb.',
	'alspdb',
	'asppdb',
	'appddb',
	'.addb.',
	'..bb..',
];

/**
 * The panels flying in: each one's sprite, its top-left corner, and the way back along its motion streaks
 * from the two corners it trails.
 */
const INCOMING = [
	{
		rows: PANEL_FLAT,
		x: 44,
		y: 11,
		back: [1, -1],
		from: [
			[5, 0],
			[6, 2],
		],
	},
	{
		rows: PANEL_POINT,
		x: 52,
		y: 32,
		back: [1, 0],
		from: [
			[5, 2],
			[5, 4],
		],
	},
	{
		rows: PANEL_FLAT,
		x: 33,
		y: 5,
		back: [0, -1],
		from: [
			[1, 0],
			[5, 0],
		],
	},
];

/**
 * One cell of the shell under a pixel.
 * @typedef {Object} Cell
 * @property {number} i - The cell's column in the shell's grid
 * @property {number} j - The cell's row
 * @property {boolean} edge - Whether the pixel lies on the cell's edge, where a strut runs
 * @property {number} du - How far the pixel is right of the cell's centre, in cells
 * @property {number} dv - How far the pixel is below the cell's centre, in cells
 * @property {{ i: number, j: number }} other - The neighbouring cell across the nearest edge
 * @property {number} depth - How squarely the shell faces the viewer there, 0 at the limb to 1 in the middle
 */

/**
 * Draws space tile 9.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(90917);

	drawSpace(layer, random);
	drawCorona(layer);
	drawStar(layer, random);
	drawFlares(layer);

	const shell = createCanvas(64, 64);
	drawShell(shell);
	drawIncoming(shell);
	outline(shell, C.ink);
	// The starlight spilling through the empty frames lights the panels and struts round them.
	for (const spill of SPILLS) {
		glow(shell, {
			...spill,
			radius: SPILL_REACH,
			colour: C.lampGlow,
			strength: 0.3,
			steps: 2,
			skip: [C.ink],
		});
	}
	underlay(shell, layer);

	drawStreaks(shell);
	return shell;
}

/**
 * Deep space: blue-violet bands round the star, stars in three brightnesses and five four-point sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x - STAR.x, y - STAR.y) / 11;
			const t = Math.max(0, 3.6 - d);
			const i = Math.min(SPACE.length - 1, Math.floor(t));
			const dither =
				i + 1 < SPACE.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, SPACE[dither ? i + 1 : i]);
			const wisp =
				Math.sin(x * 0.16 - y * 0.21 + 0.7) +
				0.6 * Math.sin(x * 0.37 + y * 0.29);
			if (i < 2 && wisp > 1.05) {
				set(layer, x, y, NEBULA[wisp > 1.5 ? 2 : wisp > 1.3 ? 1 : 0]);
			}
		}
	}
	const dim = mix(C.starDim, C.nightSky2, 0.5);
	const warm = mix(C.gold, C.starDim, 0.5);
	for (let i = 0; i < 60; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 64);
		const roll = random();
		let colour = roll > 0.8 ? C.white : roll > 0.4 ? C.starDim : dim;
		if (roll > 0.36 && roll < 0.4) {
			colour = warm;
		}
		set(layer, x, y, colour);
	}
	for (const [x, y] of [
		[8, 9],
		[57, 5],
		[5, 50],
		[58, 57],
		[24, 4],
	]) {
		set(layer, x, y, C.white);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(layer, x + dx, y + dy, C.starDim);
		}
	}
}

/**
 * The star's corona: orange light fading out from its limb in dithered bands, swallowing the faint stars.
 * @param {Canvas} layer
 */
function drawCorona(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x + 0.5 - STAR.x, y + 0.5 - STAR.y) - STAR.r;
			if (d > CORONA_REACH) {
				continue;
			}
			const t =
				(1 - Math.max(0, d) / CORONA_REACH) ** 1.7 * CORONA.length;
			const band = Math.floor(t);
			const up = t - band > 0.55 && (x + y) % 2 === 0;
			const i = Math.min(CORONA.length - 1, band + (up ? 1 : 0)) - 1;
			if (d < 1.2) {
				set(layer, x, y, LIMB);
			} else if (i >= 0) {
				set(layer, x, y, CORONA[i]);
			} else if (up) {
				set(layer, x, y, CORONA[0]);
			}
		}
	}
}

/**
 * The star: a bright disc, white-hot at its core on the open side, yellow, then hot orange towards its limb,
 * mottled with the granules of its boiling surface.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawStar(layer, random) {
	for (let y = STAR.y - STAR.r; y <= STAR.y + STAR.r; y++) {
		for (let x = STAR.x - STAR.r; x <= STAR.x + STAR.r; x++) {
			const d = Math.hypot(x + 0.5 - STAR.x, y + 0.5 - STAR.y) / STAR.r;
			if (d > 1) {
				continue;
			}
			const granule =
				Math.sin(x * 1.7 + y * 0.6) * Math.sin(y * 1.5 - x * 0.4);
			const core =
				Math.hypot(x + 0.5 - CORE.x, y + 0.5 - CORE.y) / STAR.r;
			const t =
				(0.5 * core ** 1.5 + 0.5 * d ** 2.5) * 7.6 +
				granule * 0.6 +
				(d > 0.9 ? 0.6 : 0);
			const i = Math.max(
				0,
				Math.min(STAR_RAMP.length - 1, Math.round(t))
			);
			set(layer, x, y, STAR_RAMP[i]);
		}
	}
	// Darker sunspots on the open side.
	for (let n = 0; n < 3; n++) {
		const x = STAR.x + 4 + Math.floor(random() * 6);
		const y = STAR.y - 9 + Math.floor(random() * 6);
		set(layer, x, y, STAR_RAMP[5]);
		set(layer, x + 1, y, STAR_RAMP[6]);
	}
}

/**
 * One prominence: a loop of fire arching off the star's open limb, two pixels thick, the corona showing under its arch.
 * @param {Canvas} layer
 */
function drawFlares(layer) {
	for (const { a, span, h } of [{ a: -0.5, span: 0.24, h: 6 }]) {
		for (let s = -1; s <= 1; s += 0.04) {
			const angle = a + s * span;
			const lift = Math.sqrt(1 - s * s) * h;
			for (const extra of [0, 0.9]) {
				const r = STAR.r + lift - extra;
				const x = Math.round(STAR.x + Math.cos(angle) * r);
				const y = Math.round(STAR.y + Math.sin(angle) * r);
				set(layer, x, y, lift > h * 0.5 && !extra ? FLARE : FLARE_DEEP);
			}
		}
	}
}

/**
 * Finds the cell of the shell under a pixel. The shell is a sphere tiled with hexagons; near the limb
 * the cells crowd together, so their edges are drawn thicker there to stay visible.
 * @param {number} x
 * @param {number} y
 * @returns {Cell | null} The cell, or null off the shell.
 */
function cellAt(x, y) {
	const nx = (x + 0.5 - STAR.x) / SHELL;
	const ny = (y + 0.5 - STAR.y) / SHELL;
	const flat = nx * nx + ny * ny;
	if (flat > 1) {
		return null;
	}
	const depth = Math.sqrt(1 - flat);
	const u = (Math.asin(nx) + TURN) * CELLS;
	const v = (Math.asin(ny) + TURN * 0.6) * CELLS;
	// The hexagons are the cells of a triangular lattice of centres: rows a little under a cell apart, every other one shifted half a cell.
	const rowStep = Math.sqrt(3) / 2;
	const row = Math.round(v / rowStep);
	/** @type {{ i: number, j: number, du: number, dv: number, d: number }[]} */
	const near = [];
	for (let j = row - 1; j <= row + 1; j++) {
		const shift = j % 2 === 0 ? 0 : 0.5;
		const col = Math.round(u - shift);
		for (let i = col - 1; i <= col + 1; i++) {
			const du = u - i - shift;
			const dv = v - j * rowStep;
			near.push({ i, j, du, dv, d: Math.hypot(du, dv) });
		}
	}
	near.sort((a, b) => a.d - b.d);
	const [first, second] = near;
	const width = 0.15 / Math.sqrt(Math.max(depth, 0.5));
	return {
		i: first.i,
		j: first.j,
		edge: second.d - first.d < width,
		du: first.du,
		dv: first.dv,
		other: { i: second.i, j: second.j },
		depth,
	};
}

/**
 * The cells of the shell built so far, by column and row: the shell is closed on the left and lower left and open
 * on the right, the star's core uncovered.
 */
const PANELS = new Set([
	'-1,-3',
	'-1,-2',
	'-3,-1',
	'-2,-1',
	'-1,-1',
	'-2,0',
	'-1,0',
	'-3,1',
	'-2,1',
	'-2,2',
	'-1,2',
	'0,2',
	'-2,3',
	'-1,3',
	'0,4',
]);

/** Bare frames at the shell's building edge, still waiting for their panels, where the starlight shines through. */
const FRAMES = new Set(['0,-2', '-1,1', '0,3']);

/**
 * How far a cell has been built: 2 for a panel in place, 1 for a bare frame waiting for one, 0 for nothing yet.
 * @param {number} i
 * @param {number} j
 * @returns {number}
 */
function built(i, j) {
	const key = `${i},${j}`;
	if (PANELS.has(key)) {
		return 2;
	}
	return FRAMES.has(key) ? 1 : 0;
}

/**
 * The lattice shell: dark panels, each with a diagonal sheen, set in steel struts; bare frames at its building edge.
 * @param {Canvas} shell
 */
function drawShell(shell) {
	const reach = Math.ceil(SHELL);
	for (let y = STAR.y - reach; y <= STAR.y + reach; y++) {
		for (let x = STAR.x - reach; x <= STAR.x + reach; x++) {
			const cell = cellAt(x, y);
			if (!cell) {
				continue;
			}
			const own = built(cell.i, cell.j);
			if (cell.edge) {
				const other = built(cell.other.i, cell.other.j);
				if (own === 2 && other === 2) {
					set(
						shell,
						x,
						y,
						cell.depth < 0.45 ? STRUT_SHADED_DARK : STRUT_SHADED
					);
				} else if (Math.max(own, other) > 0) {
					set(shell, x, y, strutColour(cell, x, y));
				}
				continue;
			}
			if (own === 2) {
				set(shell, x, y, panelColour(cell));
			}
		}
	}
}

/**
 * A strut's colour: near white where the star blazes behind it, warm steel, then dimmer as the shell turns away round the limb.
 * @param {Cell} cell
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function strutColour(cell, x, y) {
	const d = Math.hypot(x + 0.5 - STAR.x, y + 0.5 - STAR.y) / STAR.r;
	if (d > 1) {
		return cell.depth < 0.3 ? STRUT_DARK : STRUT_DIM;
	}
	if (d < 0.55) {
		return STRUT_HOT;
	}
	return d < 0.85 ? STRUT : STRUT_DIM;
}

/**
 * A panel's colour: dark blue, darker towards the limb, with a diagonal sheen across its upper left corner.
 * @param {Cell} cell
 * @returns {Colour}
 */
function panelColour(cell) {
	const diagonal = cell.du + cell.dv;
	if (cell.depth < 0.42) {
		return diagonal < -0.3 ? PANEL_DEEP : PANEL_DARK;
	}
	if (diagonal < -0.5) {
		return PANEL_LIT;
	}
	if (diagonal < -0.3) {
		return PANEL_SHEEN;
	}
	return diagonal > 0.35 ? PANEL_DEEP : PANEL;
}

/**
 * Three hexagonal panels flying in to the shell's open side, framed in steel like the shell's own.
 * @param {Canvas} shell
 */
function drawIncoming(shell) {
	const keys = {
		a: STRUT,
		b: STRUT_DIM,
		l: PANEL_LIT,
		s: PANEL_SHEEN,
		p: PANEL,
		d: PANEL_DEEP,
	};
	for (const { rows, x, y } of INCOMING) {
		paint(shell, x, y, rows, keys);
	}
}

/**
 * Short motion streaks trailing from the incoming panels, back the way each came, fading as they go.
 * @param {Canvas} canvas
 */
function drawStreaks(canvas) {
	for (const { x, y, back, from } of INCOMING) {
		for (const [fx, fy] of from) {
			for (let step = 2; step <= 4; step++) {
				set(
					canvas,
					x + fx + back[0] * step,
					y + fy + back[1] * step,
					step < 4 ? STREAK : STREAK_FAINT
				);
			}
		}
	}
}
