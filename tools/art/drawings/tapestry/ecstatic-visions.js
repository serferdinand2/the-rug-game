// Ecstatic Visions: a figure in a saffron robe on a lone crag, arms raised to a night sky filled with ribbons of violet and teal light.
import {
	createCanvas,
	get,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, and the summit the figure stands on. */
const HORIZON = 50;
const SUMMIT = { x: 30, y: 42 };

/**
 * The ribbons of light: each one's lower edge, its height above that edge, and its colours from the edge up.
 * @type {{ base: number, amp: number, k: number, phase: number, height: number, colours: Colour[] }[]}
 */
const RIBBONS = [
	{
		base: 13,
		amp: 5,
		k: 0.09,
		phase: 0.4,
		height: 10,
		colours: [C.arcaneLight, C.arcane, C.arcaneShade],
	},
	{
		base: 29,
		amp: 6,
		k: 0.11,
		phase: 2.6,
		height: 13,
		colours: [C.tealLight, C.teal, C.tealShade],
	},
	{
		base: 40,
		amp: 3,
		k: 0.14,
		phase: 4.4,
		height: 7,
		colours: [C.ghostLight, C.ghost, C.ghostShade],
	},
];

/**
 * Draws the Ecstatic Visions scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9419);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 60,
		starRows: 46,
	});
	for (const ribbon of RIBBONS) {
		drawRibbon(layer, ribbon);
	}
	drawRanges(layer);

	drawCrag(scene, random);
	drawFigure(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	glow(scene, {
		x: SUMMIT.x,
		y: SUMMIT.y - 22,
		radius: 10,
		colour: C.ghostLight,
		strength: 0.35,
		skip: [C.ink, C.gold, C.amber],
	});
	drawSparks(scene, random);
	return scene;
}

/**
 * One curtain of light: a bright wavy lower edge with streaks rising from it, fading into the sky above.
 * @param {Canvas} layer
 * @param {(typeof RIBBONS)[number]} ribbon
 */
function drawRibbon(layer, { base, amp, k, phase, height, colours }) {
	for (let x = 0; x < 64; x++) {
		const edge = Math.round(base + Math.sin(x * k + phase) * amp);
		// Streaks: some columns reach higher than others, as in a real aurora.
		const reach = Math.round(
			height * (0.6 + 0.4 * Math.abs(Math.sin(x * 0.7 + phase * 3)))
		);
		for (let y = edge - reach; y <= edge; y++) {
			const behind = get(layer, x, y);
			if (!behind || y > HORIZON) {
				continue;
			}
			const t = (edge - y) / Math.max(1, reach);
			const colour =
				t < 0.15 ? colours[0] : t < 0.5 ? colours[1] : colours[2];
			const strength = t < 0.15 ? 0.85 : t < 0.5 ? 0.6 : 0.35;
			set(layer, x, y, mix(behind, colour, strength));
		}
	}
}

/**
 * Two dark ranges on the horizon, their ridges catching the green-blue light.
 * @param {Canvas} layer
 */
function drawRanges(layer) {
	const far = mix(C.headland, C.tealShade, 0.25);
	const near = mix(C.night, C.headland, 0.5);
	for (let x = 0; x < 64; x++) {
		const farTop = Math.round(46 - Math.abs(Math.sin(x * 0.13 + 1)) * 5);
		const nearTop = Math.round(52 - Math.abs(Math.sin(x * 0.21 + 0.3)) * 4);
		for (let y = farTop; y < 64; y++) {
			let colour = y === farTop ? mix(C.tealShade, C.ghost, 0.3) : far;
			if (y >= nearTop) {
				colour =
					y === nearTop ? mix(C.tealShade, C.headland, 0.4) : near;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The crag: a steep spur of dark rock rising from the valley, its left faces lit by the light above.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawCrag(scene, random) {
	const rock = mix(C.stoneShade, C.night, 0.4);
	const rockDark = mix(C.stoneShade, C.night, 0.68);
	const lit = mix(C.stoneMid, C.teal, 0.3);
	const ledge = mix(C.stoneLight, C.ghost, 0.35);
	// Each side steps outwards in uneven jumps, so the spur looks broken rather than smooth.
	let left = SUMMIT.x - 5;
	let right = SUMMIT.x + 5;
	for (let y = SUMMIT.y; y < 64; y++) {
		if (y > SUMMIT.y && random() < 0.5) {
			left -= 1 + Math.floor(random() * 1.4);
		}
		if (y > SUMMIT.y && random() < 0.4) {
			right += 1 + Math.floor(random() * 1.4);
		}
		for (let x = left; x <= right; x++) {
			const u = (x - left) / Math.max(1, right - left);
			let colour = u > 0.55 ? rockDark : rock;
			if (u < 0.12 || y === SUMMIT.y) {
				colour = y === SUMMIT.y ? ledge : lit;
			}
			set(scene, x, y, colour);
		}
	}
	// Lit facets running down the face.
	for (const [x0, y0, length] of [
		[SUMMIT.x - 3, SUMMIT.y + 4, 6],
		[SUMMIT.x + 4, SUMMIT.y + 10, 5],
		[SUMMIT.x - 7, SUMMIT.y + 13, 6],
	]) {
		for (let i = 0; i < length; i++) {
			const x = x0 - i;
			const y = y0 + i;
			if (get(scene, x, y)) {
				set(scene, x, y, lit);
				set(scene, x + 1, y, rockDark);
			}
		}
	}
}

/**
 * The figure seen from behind, arms flung up, a saffron robe flaring and dark hair streaming in the wind.
 * @param {Canvas} scene
 */
function drawFigure(scene) {
	const rows = [
		'.S.............S.',
		'SS.............SS',
		'.R.............R.',
		'.RR...........RR.',
		'..R...........R..',
		'..RR...HHH...RR..',
		'...R..HHHHH..R...',
		'...RR.HHHHH.RR...',
		'....R.HHHHHHR....',
		'....RRRHHHHRRHH..',
		'.....RRRHHRRR.HH.',
		'......LRRRRRr..H.',
		'......LRRRRRr....',
		'......LRRRRRr....',
		'......bbbbbbb....',
		'......LRRRRRrr...',
		'.....LRRRRRRrr...',
		'.....LRRRRRRRrr..',
		'....LRRRRRRRRrr..',
		'....LRRRRRRRRRrr.',
		'...LRRRRRRRRRRrrr',
		'...LRRRRRRRRRRrr.',
		'..LRRRRRRRRRRRr..',
		'..LRRRRRRRRRRr...',
		'.....kk...kk.....',
	];
	paint(scene, SUMMIT.x - 8, SUMMIT.y - rows.length, rows, {
		S: C.skin,
		L: C.gold,
		R: C.amber,
		r: mix(C.amber, C.brickRedShade, 0.45),
		b: C.brickRed,
		H: C.timberShade,
		k: C.wood,
	});
}

/**
 * Sparks of light rising from the raised hands into the sky, painted last.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSparks(scene, random) {
	for (const hand of [SUMMIT.x - 7, SUMMIT.x + 7]) {
		for (let i = 0; i < 5; i++) {
			const x =
				hand +
				Math.floor(random() * 5) -
				2 +
				(hand < SUMMIT.x ? -i : i);
			const y = SUMMIT.y - 28 - i * 2 - Math.floor(random() * 2);
			set(scene, x, y, i % 2 ? C.ghostLight : C.white);
		}
	}
}
