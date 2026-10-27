// Technomancy: a wizard on a hilltop at night raising a staff made of a circuit board, glowing glyphs of circuitry swirling round him.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	line,
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

/** The hilltop's row, the wizard's centre column, and the staff's left column and the orb's centre. */
const GROUND = 56;
const CX = 30;
const STAFF_X = 44;
const ORB = { x: 46, y: 7 };

/** The robe and hat: deep blue, lit on the left. */
const ROBE = {
	light: C.nightWave,
	mid: C.nightSea1,
	shade: C.nightSea3,
};

/** The circuit board's green, its gold traces and its black chips. */
const BOARD = mix(C.pine, C.tealShade, 0.45);
const BOARD_SHADE = mix(C.pineShade, C.tealShade, 0.3);
const TRACE = C.gold;
const CHIP = mix(C.roofShade, C.ink, 0.3);

/** Everything that glows teal. */
const LIT = [C.tealLight, C.teal, C.white, C.skin, C.skinShade];

/**
 * Draws the Technomancy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9511);

	drawSky(layer, {
		time: 'night',
		horizon: GROUND + 7,
		random,
		stars: 30,
		starRows: 40,
	});
	drawHill(layer);
	drawCircle(layer);

	drawStaff(scene);
	drawWizard(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: ORB.x,
		y: ORB.y,
		radius: 20,
		colour: C.teal,
		strength: 0.45,
		steps: 4,
		skip: [C.ink, ...LIT],
	});
	glow(scene, {
		x: 12,
		y: 22,
		radius: 13,
		colour: C.teal,
		strength: 0.4,
		steps: 3,
		skip: [C.ink, ...LIT],
	});
	drawOrb(scene);
	drawEyes(scene);
	drawGlyphs(scene);
	return scene;
}

/**
 * A dark, rounded hilltop under the wizard.
 * @param {Canvas} layer
 */
function drawHill(layer) {
	const grass = mix(C.forestFloorShade, C.nightSky3, 0.45);
	const lit = mix(C.forestFloor, C.nightSky5, 0.4);
	const deep = mix(C.forestFloorShade, C.ink, 0.45);
	for (let x = 0; x < 64; x++) {
		const top = GROUND + Math.round(((x - CX) / 34) ** 2 * 6) - 3;
		for (let y = top; y < 64; y++) {
			let colour = y > 59 ? deep : grass;
			if (y === 59 && x % 2 === 0) {
				colour = deep;
			}
			set(layer, x, y, y === top ? lit : colour);
		}
	}
}

/**
 * A ring of circuitry traced on the ground round the wizard's feet, its traces running out to glowing pads.
 * @param {Canvas} layer
 */
function drawCircle(layer) {
	const cy = 59;
	for (let a = 0; a < 360; a += 2) {
		const rad = (a * Math.PI) / 180;
		const x = Math.round(CX + 2 + Math.cos(rad) * 22);
		const y = Math.round(cy + Math.sin(rad) * 3.5);
		set(layer, x, y, C.teal);
	}
	// Traces leaving the ring at right angles, each ending in a pad.
	for (const [x0, y0, x1, y1] of [
		[8, 59, 3, 59],
		[54, 59, 60, 59],
		[13, 62, 9, 63],
		[49, 62, 54, 63],
		[18, 56, 15, 54],
		[46, 56, 50, 54],
	]) {
		line(layer, x0, y0, x1, y1, C.tealShade);
		set(layer, x1, y1, C.tealLight);
	}
}

/**
 * The staff: a long circuit board, green with gold traces and black chips, capped by a gold claw.
 * @param {Canvas} scene
 */
function drawStaff(scene) {
	const top = 12;
	const bottom = GROUND + 2;
	for (let y = top; y <= bottom; y++) {
		for (let x = STAFF_X; x <= STAFF_X + 4; x++) {
			set(scene, x, y, x === STAFF_X + 4 ? BOARD_SHADE : BOARD);
		}
	}
	// Gold traces running up the board with 45° jogs, and pads where they end.
	for (let y = top + 1; y <= bottom; y++) {
		const jog = Math.floor(y / 7) % 2;
		set(scene, STAFF_X + 1 + jog, y, TRACE);
		if (y % 7 === 0) {
			set(scene, STAFF_X + 2 - jog, y, TRACE);
		}
		if (y % 9 === 4) {
			set(scene, STAFF_X + 3, y, TRACE);
		}
	}
	// Black chips with silver legs.
	for (const y of [18, 37, 49]) {
		rect(scene, STAFF_X + 1, y, 3, 4, CHIP);
		for (let j = 0; j < 4; j += 2) {
			set(scene, STAFF_X, y + j, C.stoneLight);
			set(scene, STAFF_X + 4, y + j, C.stoneLight);
		}
	}
	// The gold claw that holds the orb.
	paint(
		scene,
		STAFF_X - 2,
		top - 4,
		['G.......G', 'GG.....GA', '.GG...GA.', '..GGGGA..'],
		{
			G: C.gold,
			A: C.amber,
		}
	);
}

/**
 * The wizard, facing us: a tall pointed hat with a teal band, a long white beard, a deep blue robe
 * trimmed with circuitry, one hand raised to cast and the other gripping the staff.
 * @param {Canvas} scene
 */
function drawWizard(scene) {
	// The robe, flaring from the shoulders to the hem.
	for (let y = 27; y <= GROUND + 1; y++) {
		const half = Math.round(7 + (y - 27) * 0.33);
		for (let x = CX - half; x <= CX + half; x++) {
			let colour = ROBE.mid;
			if (x <= CX - half + 1) {
				colour = ROBE.light;
			} else if (x >= CX + half - 2) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Circuit trim: a trace down the front with nodes, and a band of traces round the hem.
	for (let y = 38; y <= GROUND; y++) {
		set(scene, CX, y, C.tealShade);
	}
	for (const y of [42, 48, 54]) {
		set(scene, CX - 1, y, C.teal);
		set(scene, CX + 1, y, C.teal);
	}
	for (let x = CX - 16; x <= CX + 16; x++) {
		const y = GROUND - 1;
		const half = Math.round(7 + (y - 27) * 0.33);
		if (Math.abs(x - CX) <= half) {
			set(scene, x, y, (x + 1) % 4 === 0 ? C.teal : C.tealShade);
		}
	}
	// A gold sash at the waist.
	for (let x = CX - 9; x <= CX + 9; x++) {
		set(scene, x, 37, x >= CX + 7 ? C.amber : C.gold);
	}
	set(scene, CX + 3, 38, C.gold);
	set(scene, CX + 3, 39, C.amber);
	set(scene, CX + 4, 40, C.amber);
	// The raised arm on the left: a wide sleeve and an open hand.
	for (let i = 0; i <= 10; i++) {
		const x = CX - 6 - i;
		const y = 30 - Math.round(i * 0.7);
		for (let j = -2; j <= 2; j++) {
			set(
				scene,
				x,
				y + j,
				j === -2 ? ROBE.light : j === 2 ? ROBE.shade : ROBE.mid
			);
		}
	}
	paint(scene, 10, 19, ['.s.s.', 'sSsSs', 'SSSSs', '.SSs.'], {
		S: C.skin,
		s: C.skinShade,
	});
	// The other arm, down to the staff.
	for (let i = 0; i <= 8; i++) {
		const x = CX + 6 + i;
		const y = 30 + Math.round(i * 0.25);
		for (let j = -2; j <= 2; j++) {
			set(scene, x, y + j, j === -2 ? ROBE.mid : ROBE.shade);
		}
	}
	paint(scene, STAFF_X, 29, ['SSSS.', 'SSSSs', 'sSSs.'], {
		S: C.skin,
		s: C.skinShade,
	});
	// The face and the long beard.
	paint(
		scene,
		CX - 4,
		20,
		[
			'.SSSSSSS.',
			'SSSSSSSSs',
			'SSSSsSSSs',
			'wwSSsSSww',
			'wwwwwwwwW',
			'wwwwwwwwW',
			'.wwwwwwW.',
			'.wwwwwwW.',
			'..wwwwW..',
			'..wwwwW..',
			'...wwW...',
			'...wwW...',
			'....W....',
		],
		{ S: C.skin, s: C.skinShade, w: C.white, W: C.cloudShade }
	);
	// The hat: a wide brim and a tall cone whose tip bends back.
	for (let x = CX - 10; x <= CX + 10; x++) {
		set(scene, x, 19, x <= CX - 9 ? ROBE.light : ROBE.mid);
		set(scene, x, 20, ROBE.shade);
	}
	for (let y = 2; y <= 18; y++) {
		const t = (18 - y) / 16;
		const half = Math.round(6 * (1 - t) + 0.4);
		const centre = CX + Math.round(-4 * t ** 2.5);
		for (let x = centre - half; x <= centre + half; x++) {
			let colour = ROBE.mid;
			if (x === centre - half) {
				colour = ROBE.light;
			} else if (x >= centre + half - 1 && half > 1) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A teal band round the hat, and a trace climbing it to a node.
	for (let x = CX - 6; x <= CX + 6; x++) {
		set(scene, x, 17, C.teal);
	}
	line(scene, CX + 1, 16, CX + 1, 12, C.tealShade);
	line(scene, CX + 1, 12, CX - 1, 10, C.tealShade);
	set(scene, CX - 1, 9, C.tealLight);
}

/**
 * The orb on the staff's head, glowing teal, with a pale core.
 * @param {Canvas} scene
 */
function drawOrb(scene) {
	paint(
		scene,
		ORB.x - 3,
		ORB.y - 3,
		[
			'.kkkkk.',
			'kLLWLTk',
			'kLWWLTk',
			'kLLLTTk',
			'kTLTTSk',
			'kTTTSSk',
			'.kkkkk.',
		],
		{ k: C.ink, L: C.tealLight, W: C.white, T: C.teal, S: C.tealShade }
	);
}

/**
 * Eyes glowing teal under the hat's brim.
 * @param {Canvas} scene
 */
function drawEyes(scene) {
	set(scene, CX - 2, 22, C.tealLight);
	set(scene, CX + 2, 22, C.tealLight);
}

/**
 * Glyphs of circuitry swirling round the wizard: traces with 45° bends ending in nodes, open rings, little chips,
 * bracket-like corners and runes of lines and nodes. None of them is a letter or a digit.
 * @param {Canvas} scene
 */
function drawGlyphs(scene) {
	/** @type {Record<string, Colour>} */
	const keys = { o: C.tealLight, t: C.teal, w: C.white };
	const glyphs = [
		// A trace with a jog, ending in nodes at both ends.
		{ x: 3, y: 9, rows: ['o.....', '.t....', '..ttto'] },
		// An open ring with a lit centre.
		{ x: 16, y: 10, rows: ['.ttt.', 't...t', 't.w.t', 't...t', '.ttt.'] },
		// A chip with four legs.
		{ x: 6, y: 30, rows: ['t.t.t', '.ooo.', 't.o.t', '.ooo.', 't.t.t'] },
		// A bent trace between two nodes.
		{ x: 54, y: 16, rows: ['..tto', '.t...', 'o....'] },
		// A rune: two nodes joined across a diamond.
		{ x: 54, y: 27, rows: ['..o..', '.t.t.', 'o...o', '.t.t.', '..o..'] },
		// A trace with a long run between two nodes.
		{ x: 21, y: 3, rows: ['o.....', '.tttt.', '.....o'] },
		// A trace that steps down and right.
		{ x: 56, y: 38, rows: ['o..', '.t.', '.t.', '..o'] },
		// Small nodes, like sparks.
		{ x: 37, y: 2, rows: ['w'] },
		{ x: 2, y: 20, rows: ['.t.', 't.t', '.t.'] },
		{ x: 58, y: 6, rows: ['.t.', 't.t', '.t.'] },
		// A trace stepping away from the orb.
		{ x: 52, y: 2, rows: ['o....', '.t...', '..ttt', '.....', '.....'] },
		{ x: 36, y: 12, rows: ['..o', '.t.', 't..', 't..', 'o..'] },
		{ x: 14, y: 40, rows: ['o'] },
		{ x: 52, y: 46, rows: ['o'] },
	];
	for (const { x, y, rows } of glyphs) {
		paint(scene, x, y, rows, keys);
	}
	// Faint streams of light linking the raised hand to the glyphs above it.
	for (const [x0, y0, x1, y1] of [
		[12, 19, 8, 12],
		[13, 19, 18, 15],
	]) {
		const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
		for (let s = 0; s <= steps; s++) {
			const x = Math.round(x0 + ((x1 - x0) * s) / steps);
			const y = Math.round(y0 + ((y1 - y0) * s) / steps);
			const behind = get(scene, x, y);
			if (behind && behind !== C.ink) {
				set(scene, x, y, mix(behind, C.tealLight, 0.5));
			}
		}
	}
}
