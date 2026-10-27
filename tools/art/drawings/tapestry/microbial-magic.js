// Microbial Magic: a brass microscope in a dark laboratory at night, glowing microbes swirling up out of the dish beneath it.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The bench top's first row, and the dish's centre and half-width. */
const BENCH = 54;
const DISH = { x: 34, y: 37, rx: 13 };

/** The objective's tip, above the dish; the tube leans back from it to the eyepiece. */
const OBJECTIVE = { x: 39, y: 35 };

/** The dark the room falls into. */
const DARK = C.nightSky1;

/** The microbes' glow: lime and magenta, each lit, mid and shaded. */
const LIME = [
	mix(C.lampGlow, C.white, 0.5),
	mix(C.lampGlow, C.grassLight, 0.5),
	mix(C.grassLight, C.grass, 0.4),
];
const MAGENTA = [
	mix(C.arcaneLight, C.white, 0.45),
	mix(C.arcaneLight, C.brickRedLight, 0.4),
	mix(C.arcane, C.brickRed, 0.35),
];

/** Brass in the dark, from glint to shadow. */
const BRASS = {
	glint: C.gold,
	light: C.brass,
	mid: mix(C.brass, C.lampFrame, 0.5),
	shade: C.lampFrame,
	deep: mix(C.timberShade, DARK, 0.3),
};
const BRASS_COLOURS = Object.values(BRASS);

/** Iron for the foot. */
const IRON = mix(C.roofShade, C.ink, 0.2);

/**
 * Draws the Microbial Magic scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9307);

	drawInterior(layer, { floor: BENCH, random, wall: 'panel' });
	darken(layer);
	drawFlasks(layer);

	drawMicroscope(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: DISH.x - 4,
		y: DISH.y - 2,
		radius: 24,
		colour: LIME[2],
		strength: 0.35,
		steps: 5,
		skip: [C.ink, ...BRASS_COLOURS, IRON],
	});
	glow(scene, {
		x: 18,
		y: 14,
		radius: 14,
		colour: MAGENTA[2],
		strength: 0.22,
		steps: 4,
		skip: [C.ink, ...BRASS_COLOURS],
	});
	underlight(scene);
	drawDish(scene);
	drawStrand(scene, 0, LIME);
	drawStrand(scene, Math.PI, MAGENTA);
	drawCells(scene);
	drawSparks(scene, random);
	return scene;
}

/**
 * Sinks the room into the night.
 * @param {Canvas} layer
 */
function darken(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, DARK, 0.84);
		}
	}
}

/**
 * Dim flasks and jars on a shelf at the back, barely caught by the glow.
 * @param {Canvas} layer
 */
function drawFlasks(layer) {
	const shelf = mix(C.timber, DARK, 0.6);
	rect(layer, 2, 12, 22, 1, shelf);
	rect(layer, 2, 13, 22, 1, mix(C.timberShade, DARK, 0.7));
	const glass = mix(C.stoneShade, DARK, 0.5);
	const dull = mix(C.ghostShade, DARK, 0.6);
	paint(layer, 3, 6, ['.g.', '.g.', 'gdg', 'ddd', 'ddd', 'ddd'], {
		g: glass,
		d: dull,
	});
	paint(layer, 8, 8, ['gg', 'dd', 'dd', 'dd'], { g: glass, d: dull });
	paint(
		layer,
		12,
		5,
		['..g..', '..g..', '.gdg.', 'gdddg', 'ddddd', 'ddddd', '.ddd.'],
		{
			g: glass,
			d: mix(C.arcaneShade, DARK, 0.55),
		}
	);
	paint(layer, 19, 7, ['ggg', 'ddd', 'ddd', 'ddd', 'ddd'], {
		g: glass,
		d: dull,
	});
}

/**
 * The column of the tube's centre at a row: it leans back from the objective towards the eyepiece.
 * @param {number} y
 * @returns {number}
 */
function tubeCentre(y) {
	return OBJECTIVE.x + (OBJECTIVE.y - y) * 0.28;
}

/**
 * One row of a brass part: lit on its left edge, shaded on its right.
 * @param {Canvas} scene
 * @param {number} from - The first column
 * @param {number} to - The last column
 * @param {number} y
 */
function brassRow(scene, from, to, y) {
	for (let x = from; x <= to; x++) {
		let colour = BRASS.light;
		if (x === from) {
			colour = BRASS.mid;
		} else if (x === from + 1 && to - from > 4) {
			colour = BRASS.glint;
		} else if (x === to) {
			colour = BRASS.deep;
		} else if (x >= to - Math.floor((to - from) / 3)) {
			colour = BRASS.shade;
		} else if (x >= to - 1 - Math.floor((to - from) / 2)) {
			colour = BRASS.mid;
		}
		set(scene, x, y, colour);
	}
}

/**
 * The brass microscope, side on: a heavy horseshoe foot, a curved arm at the back, the stage and a tall leaning tube.
 * @param {Canvas} scene
 */
function drawMicroscope(scene) {
	// The horseshoe foot, iron with a brass rim.
	for (let y = 48; y <= BENCH - 1; y++) {
		const inset = Math.max(0, 49 - y) * 2;
		for (let x = 25 + inset; x <= 58 - inset; x++) {
			let colour = IRON;
			if (y === 48) {
				colour = BRASS.light;
			} else if (y === 49) {
				colour = BRASS.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The pillar up from the foot.
	for (let y = 40; y <= 47; y++) {
		brassRow(scene, 47, 52, y);
	}
	// The curved arm, from the pillar out and round to the back of the tube.
	for (let y = 11; y <= 41; y++) {
		const t = (y - 11) / 30;
		const x = Math.round(48 + 7 * Math.sin(Math.PI * (0.12 + t * 0.88)));
		brassRow(scene, x, x + 4 + Math.round(t * 2), y);
	}
	// The rack that joins the arm to the tube.
	for (let y = 12; y <= 20; y++) {
		brassRow(scene, Math.round(tubeCentre(y)) + 3, 52, y);
	}
	// The coarse focus knob on the arm.
	paint(scene, 53, 22, ['.MLL.', 'MLGLS', 'MLLMS', 'MMMSS', '.MSS.'], {
		G: BRASS.glint,
		L: BRASS.light,
		M: BRASS.mid,
		S: BRASS.shade,
	});
	// The stage, reaching out from the arm under the objective.
	rect(scene, 20, 41, 32, 1, BRASS.glint);
	rect(scene, 20, 42, 32, 1, BRASS.shade);
	rect(scene, 20, 43, 1, 1, BRASS.shade);
	// The tube, with its rings, the nosepiece, the objective and the eyepiece's dark cup.
	for (let y = 1; y <= OBJECTIVE.y - 1; y++) {
		const centre = tubeCentre(y);
		let half = 4;
		if (y <= 8) {
			half = 3;
		} else if (y >= OBJECTIVE.y - 4) {
			half = 2;
		} else if (y >= OBJECTIVE.y - 6) {
			half = 5;
		}
		const from = Math.round(centre - half);
		const to = Math.round(centre + half - 1);
		if (y <= 2) {
			rect(
				scene,
				from - 1,
				y,
				to - from + 3,
				1,
				y === 1 ? C.roofShade : C.roof
			);
		} else if (y === 9 || y === 19 || y === OBJECTIVE.y - 7) {
			rect(scene, from - 1, y, to - from + 2, 1, BRASS.glint);
			set(scene, to + 1, y, BRASS.shade);
		} else {
			brassRow(scene, from, to, y);
		}
	}
}

/**
 * Lights the brass from below where it faces the dish and the swirl: a lime sheen on the edges that look that way.
 * @param {Canvas} scene
 */
function underlight(scene) {
	const source = scene.p.slice();
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = source[y * 64 + x];
			if (!colour || !BRASS_COLOURS.includes(colour)) {
				continue;
			}
			const left = source[y * 64 + x - 1];
			const below = source[(y + 1) * 64 + x];
			const facing = left === C.ink || (below === C.ink && y > 30);
			if (facing && Math.hypot(x - DISH.x, y - DISH.y) < 30) {
				set(scene, x, y, mix(colour, LIME[1], 0.55));
			}
		}
	}
}

/**
 * The glass dish on the stage, brimming with glowing culture.
 * @param {Canvas} scene
 */
function drawDish(scene) {
	const { x: cx, y: cy, rx } = DISH;
	const ry = 3;
	for (let y = cy - ry - 1; y <= cy + ry; y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const d =
				((x - cx) / (rx + 0.5)) ** 2 + ((y - cy) / (ry + 0.6)) ** 2;
			if (d > 1) {
				continue;
			}
			const inner =
				((x - cx) / (rx - 1.2)) ** 2 + ((y - cy) / (ry - 1)) ** 2;
			if (inner > 1) {
				set(scene, x, y, y > cy ? C.foam : C.white);
				continue;
			}
			const swirl = Math.sin(
				Math.atan2((y - cy) * 4, x - cx) * 2 +
					Math.hypot(x - cx, (y - cy) * 4) * 0.5
			);
			let colour = LIME[1];
			if (swirl > 0.55) {
				colour = LIME[0];
			} else if (swirl < -0.6) {
				colour = MAGENTA[1];
			}
			set(scene, x, y, colour);
		}
	}
	for (let x = cx - rx + 1; x <= cx + rx - 1; x++) {
		set(scene, x, cy + ry + 1, mix(C.foam, C.nightSea2, 0.4));
	}
	// The objective's tip glows where it nearly touches the culture.
	rect(
		scene,
		OBJECTIVE.x - 2,
		OBJECTIVE.y - 1,
		4,
		1,
		mix(BRASS.light, LIME[0], 0.6)
	);
}

/**
 * Where a strand of the swirl is at a point along it: it climbs from the dish up and to the left, widening like a funnel.
 * @param {number} t - 0 at the dish, 1 at the top
 * @param {number} phase - Where the strand starts its turn; two strands half a turn apart wind round each other
 * @returns {{ x: number, y: number }}
 */
function strandAt(t, phase) {
	const angle = t * Math.PI * 3.2 + phase;
	const x = Math.round(30 - t * 13 + Math.sin(angle) * (2 + t * 10));
	const y = Math.round(DISH.y - 4 - t * 30);
	return { x, y };
}

/**
 * One strand of light winding up from the dish, fading a little as it climbs.
 * @param {Canvas} scene
 * @param {number} phase
 * @param {Colour[]} colours - Lit, mid and shaded
 */
function drawStrand(scene, phase, colours) {
	for (let i = 0; i <= 240; i++) {
		const t = i / 240;
		const { x, y } = strandAt(t, phase);
		const behind = get(scene, x, y);
		if (!behind || BRASS_COLOURS.includes(behind) || behind === C.ink) {
			continue;
		}
		set(scene, x, y, mix(behind, colours[1], 0.85 - t * 0.35));
	}
}

/** Microbe shapes: L lit, M mid, S shaded, n the nucleus. */
const CELLS = [
	['.LLM.', 'LLMMS', 'LMnMS', 'MMMSS', '.MSS.'],
	['.LLMM.', 'LMMnMS', 'LMMMMS', '.MSSS.'],
	['.LM.', 'LMnS', '.SS.'],
	['.L.', 'LMS', '.S.'],
];

/**
 * Microbes riding the two strands, larger as they rise, as if the magic were magnifying them, each with a halo.
 * @param {Canvas} scene
 */
function drawCells(scene) {
	const stops = [
		[0.1, 0],
		[0.22, Math.PI],
		[0.34, 0],
		[0.47, Math.PI],
		[0.6, 0],
		[0.72, Math.PI],
		[0.86, 0],
		[0.97, Math.PI],
	];
	const all = [...LIME, ...MAGENTA, C.ink, C.white];
	stops.forEach(([t, phase], i) => {
		const { x, y } = strandAt(t, phase);
		const colours = phase ? MAGENTA : LIME;
		const shape = CELLS[t > 0.5 ? i % 2 : 2 + (i % 2)];
		glow(scene, {
			x,
			y,
			radius: 3 + t * 4,
			colour: colours[1],
			strength: 0.4,
			steps: 2,
			skip: all,
		});
		paint(
			scene,
			x - Math.floor(shape[0].length / 2),
			y - Math.floor(shape.length / 2),
			shape,
			{
				L: colours[0],
				M: colours[1],
				S: colours[2],
				n: mix(colours[2], C.ink, 0.5),
			}
		);
	});
}

/**
 * Motes of light thrown off the swirl.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (let i = 0; i < 16; i++) {
		const { x, y } = strandAt(random(), random() > 0.5 ? 0 : Math.PI);
		const sx = x + Math.floor(random() * 9) - 4;
		const sy = y + Math.floor(random() * 5) - 2;
		const behind = get(scene, sx, sy);
		if (behind && !BRASS_COLOURS.includes(behind)) {
			set(scene, sx, sy, random() > 0.5 ? C.white : LIME[0]);
		}
	}
}
