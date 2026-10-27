// Space tile 12 (Military): a broadside above a cratered grey moon, a white lancer and a dark gunship trading red and green beams, an explosion blooming on the gunship's deck.
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
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The moon: its centre far below the frame and its radius, so its limb arcs across the lower half. */
const MOON = { x: 32, y: 108, r: 74 };

/** The white lancer, heading right: its stern and prow columns, its deck and keel rows aft, and the chine row between its upper and lower plates. */
const LANCER = { stern: 15, prow: 56, top: 12, bottom: 21, chine: 16 };

/** The columns of the lancer's two keel turrets. */
const TURRETS = [LANCER.stern + 7, LANCER.stern + 21];

/** The dark gunship, heading left: its ram and stern columns, and its deck and keel rows amidships. */
const GUNSHIP = { ram: 15, stern: 52, top: 39, bottom: 49 };

/** Where the lancer's red beam bursts on the gunship's deck. */
const BLAST = { x: 34, y: 37 };

/**
 * The beams: each runs from a turret's muzzle towards its target and stops at the first hull it meets.
 * @type {{ from: [number, number], to: [number, number], colour: 'red' | 'green' }[]}
 */
const BEAMS = [
	{ from: [28, 25], to: [BLAST.x, BLAST.y], colour: 'red' },
	{ from: [42, 24], to: [54, 38], colour: 'red' },
	{ from: [43, 32], to: [50, 14], colour: 'green' },
];

/** Space, from the top of the frame down to the moon's limb: indigo deepening to near black overhead. */
const SPACE = [
	mix(C.ink, C.nightSky1, 0.4),
	C.nightSky1,
	C.nightSky2,
	C.nightSky3,
	mix(C.nightSky3, C.nightSky4, 0.6),
];

/** Faint stars, the dimmest of three brightnesses. */
const STAR_FAINT = mix(C.starDim, C.nightSky3, 0.55);

/** The moon's grey: its bright limb, the lit plains, the dusty mid tone, and the crater shadows. */
const MOON_TONE = {
	limb: mix(C.stoneLight, C.white, 0.55),
	light: C.stoneLight,
	plain: mix(C.stoneLight, C.stone, 0.5),
	mid: C.stone,
	dust: C.stoneMid,
	shadow: C.stoneShade,
	pit: mix(C.stoneShade, C.night, 0.35),
	mare: mix(C.stoneMid, C.nightSea3, 0.2),
	mareEdge: mix(C.stone, C.stoneMid, 0.5),
};

/** The lancer's white hull, lit from the upper left, and its red band. */
const WHITE = {
	edge: C.white,
	light: C.snow,
	main: C.snowShade,
	mid: C.stoneLight,
	shade: C.stone,
	deep: C.stoneShade,
};
const BAND = C.brickRed;
const BAND_LIT = C.brickRedLight;

/** The gunship's dark slate hull, tinted teal, and its green running lights. */
const SLATE = {
	edge: mix(C.stone, C.ghostShade, 0.35),
	light: mix(C.stoneShade, C.tealShade, 0.35),
	main: mix(C.stoneShade, C.night, 0.3),
	shade: mix(C.stoneShade, C.night, 0.6),
	deep: mix(C.night, C.ink, 0.4),
};
const RUNNING = C.ghost;

/** The moon's grey light caught on the gunship's underside. */
const MOONLIT = mix(SLATE.main, C.stoneLight, 0.45);

/** The blast's firelight on the gunship's lit plating. */
const FIRELIT = mix(SLATE.light, C.amber, 0.55);

/** Beam colours: a pale core inside a saturated edge. */
const BEAM_COLOURS = {
	red: { core: mix(C.brickRedLight, C.white, 0.55), edge: C.brickRed },
	green: { core: C.ghostLight, edge: mix(C.ghost, C.grassLight, 0.5) },
};

/** The lancer's drive flame, white-hot to gold. */
const FLAME = { core: C.lampGlow, mid: C.gold, tail: C.amber };

/**
 * Draws space tile 12.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(1212);

	drawSpace(layer, random);
	drawMoon(layer, random);
	// Glare from the sun beyond the frame's upper left, which lights both ships and the moon.
	glow(layer, {
		x: -6,
		y: -6,
		radius: 34,
		colour: mix(C.starDim, C.white, 0.5),
		strength: 0.18,
		steps: 4,
		skip: [C.white, C.starDim],
	});

	const ships = createCanvas(64, 64);
	drawLancer(ships);
	drawGunship(ships);
	outline(ships, C.ink);
	const open = ships.p.map((colour) => colour === null);
	underlay(ships, layer);

	drawDrives(ships, open);
	for (const { from, to, colour } of BEAMS) {
		drawBeam(ships, open, from, to, BEAM_COLOURS[colour]);
	}
	drawBlast(ships, random);
	return ships;
}

/**
 * Tells whether a pixel lies on the moon.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onMoon(x, y) {
	return Math.hypot(x + 0.5 - MOON.x, y + 0.5 - MOON.y) <= MOON.r;
}

/**
 * Deep space: an indigo gradient down to the moon, stars in three brightnesses and a few four-point sparkles.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	const bottom = 44;
	for (let y = 0; y < 64; y++) {
		const t = (Math.min(y, bottom) / bottom) * (SPACE.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SPACE.length && t - i > 0.6 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SPACE[i + 1] : SPACE[i]);
		}
	}
	for (let i = 0; i < 60; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 44);
		const brightness = random();
		if (!onMoon(x, y)) {
			set(
				layer,
				x,
				y,
				brightness > 0.85
					? C.white
					: brightness > 0.5
						? C.starDim
						: STAR_FAINT
			);
		}
	}
	for (const [x, y] of [
		[56, 6],
		[14, 30],
		[60, 25],
		[30, 4],
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
 * The moon's lit face below its limb: grey plains brightest at the limb and towards the sun on the left,
 * dusted with grit and pocked with craters flattened by the low view.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMoon(layer, random) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const d = Math.hypot(x + 0.5 - MOON.x, y + 0.5 - MOON.y);
			if (d > MOON.r) {
				continue;
			}
			// Depth below the limb, nudged so the side towards the sun stays lighter for longer.
			const depth = MOON.r - d + (x - 20) * 0.12;
			const dither = (x + y) % 2 === 0;
			let colour = MOON_TONE.mid;
			if (MOON.r - d < 1) {
				colour = MOON_TONE.limb;
			} else if (depth < 3 || (depth < 4 && dither)) {
				colour = MOON_TONE.light;
			} else if (depth < 11 || (depth < 13 && dither)) {
				colour = MOON_TONE.plain;
			}
			set(layer, x, y, colour);
		}
	}
	// Maria: broad dark plains of old lava, ragged at the edges.
	for (let y = 36; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const lava =
				Math.sin(x * 0.21 + y * 0.35) +
				Math.sin(x * 0.09 - y * 0.41 + 2.1) +
				0.5 * Math.sin(x * 0.53 + 1.7);
			if (onMoon(x, y - 3) && lava > 1.1) {
				set(
					layer,
					x,
					y,
					lava > 1.6 ? MOON_TONE.mare : MOON_TONE.mareEdge
				);
			}
		}
	}
	// Grit: darker and lighter flecks across the plains.
	for (let i = 0; i < 150; i++) {
		const x = Math.floor(random() * 64);
		const y = 34 + Math.floor(random() * 30);
		if (onMoon(x, y - 2)) {
			set(layer, x, y, random() < 0.6 ? MOON_TONE.dust : MOON_TONE.light);
		}
	}
	// Craters, widest near the viewer and squashed thin towards the limb.
	for (const [cx, cy, rx, ry] of [
		[10, 49, 5, 2],
		[26, 57, 7, 3],
		[49, 56, 6, 3],
		[57, 47, 3, 1],
		[4, 59, 3, 2],
		[39, 62, 5, 2],
		[16, 42, 2, 1],
		[60, 61, 4, 2],
		[18, 62, 3, 1],
	]) {
		drawCrater(layer, cx, cy, rx, ry);
	}
}

/**
 * One crater lit from the upper left: a dark pit under its near rim, a shadowed wall, a dusty floor,
 * and a faint lit lip along its far edge.
 * @param {Canvas} layer
 * @param {number} cx - Centre column
 * @param {number} cy - Centre row
 * @param {number} rx - Half-width
 * @param {number} ry - Half-height
 */
function drawCrater(layer, cx, cy, rx, ry) {
	for (let y = cy - ry - 1; y <= cy + ry + 1; y++) {
		for (let x = cx - rx - 1; x <= cx + rx + 1; x++) {
			const e =
				((x - cx) / (rx + 0.4)) ** 2 + ((y - cy) / (ry + 0.4)) ** 2;
			if (e <= 1) {
				const slope = (x - cx) / rx + (2 * (y - cy)) / Math.max(1, ry);
				set(
					layer,
					x,
					y,
					slope < -0.9
						? MOON_TONE.pit
						: slope < 0.6
							? MOON_TONE.shadow
							: MOON_TONE.dust
				);
			} else if (e <= 1.7 && y > cy) {
				set(layer, x, y, MOON_TONE.light);
			}
		}
	}
}

/**
 * The lancer's deck row in one column: flat over the drive block, then sloping down to the prow's point.
 * @param {number} x
 * @returns {number}
 */
function lancerTop(x) {
	const start = LANCER.stern + 3;
	if (x <= start) {
		return LANCER.top;
	}
	return LANCER.top + Math.round(((x - start) * 5) / (LANCER.prow - start));
}

/**
 * The lancer's keel row in one column, rising under the forward hull to meet the deck at the prow.
 * @param {number} x
 * @returns {number}
 */
function lancerBottom(x) {
	const start = LANCER.stern + 16;
	if (x <= start) {
		return LANCER.bottom;
	}
	return (
		LANCER.bottom - Math.round(((x - start) * 4) / (LANCER.prow - start))
	);
}

/**
 * The white lancer: a long wedge hull, its lit upper plates and shaded lower plates split by a red chine stripe,
 * a stepped command tower aft, a drive block with three bells, a stern fin and two beam turrets under its keel.
 * @param {Canvas} ships
 */
function drawLancer(ships) {
	for (let x = LANCER.stern; x <= LANCER.prow; x++) {
		const top = lancerTop(x);
		const bottom = lancerBottom(x);
		for (let y = top; y <= bottom; y++) {
			let colour;
			if (y === top) {
				colour = WHITE.edge;
			} else if (y < LANCER.chine) {
				colour = y === top + 1 ? WHITE.light : WHITE.main;
			} else if (y === LANCER.chine) {
				colour = x > LANCER.stern + 2 ? BAND : WHITE.mid;
			} else if (y === bottom) {
				colour = WHITE.deep;
			} else {
				colour = y === LANCER.chine + 1 ? WHITE.mid : WHITE.shade;
			}
			// Plate seams, staggered between the upper and lower hull.
			const upper = y > top + 1 && y < LANCER.chine;
			const lower = y > LANCER.chine + 1 && y < bottom;
			if (upper && (x - LANCER.stern) % 8 === 5) {
				colour = WHITE.mid;
			} else if (lower && (x - LANCER.stern) % 8 === 1) {
				colour = WHITE.deep;
			}
			set(ships, x, y, colour);
		}
	}
	// The red prow tip.
	for (let x = LANCER.prow - 3; x <= LANCER.prow; x++) {
		for (let y = lancerTop(x); y <= lancerBottom(x); y++) {
			set(ships, x, y, y === lancerTop(x) ? BAND_LIT : BAND);
		}
	}
	// The drive block's darker plating at the stern.
	for (let y = LANCER.top; y <= LANCER.bottom; y++) {
		set(ships, LANCER.stern, y, y < LANCER.chine ? WHITE.mid : WHITE.shade);
	}
	// Lit ports along the upper hull.
	for (let x = LANCER.stern + 17; x <= LANCER.stern + 29; x += 3) {
		set(ships, x, LANCER.top + 2, C.lampGlow);
	}
	// The command tower aft, stepped back from a sloping face, with its teal bridge glass.
	for (const [y, start, end] of [
		[LANCER.top - 1, 2, 17],
		[LANCER.top - 2, 3, 15],
		[LANCER.top - 3, 4, 13],
		[LANCER.top - 4, 5, 11],
		[LANCER.top - 5, 6, 9],
	]) {
		const from = LANCER.stern + start;
		const to = LANCER.stern + end;
		for (let x = from; x <= to; x++) {
			let colour = WHITE.main;
			if (y === LANCER.top - 5) {
				colour = WHITE.edge;
			} else if (x >= to - 1) {
				colour = WHITE.mid;
			} else if (x <= from + 1) {
				colour = WHITE.light;
			}
			set(ships, x, y, colour);
		}
	}
	rect(ships, LANCER.stern + 8, LANCER.top - 3, 4, 1, C.tealLight);
	set(ships, LANCER.stern + 12, LANCER.top - 3, C.teal);
	for (let x = LANCER.stern + 5; x <= LANCER.stern + 13; x += 2) {
		set(ships, x, LANCER.top - 1, C.lampGlow);
	}
	// A stern fin swept down and back under the drive block.
	for (const [y, width] of [
		[LANCER.bottom + 1, 7],
		[LANCER.bottom + 2, 5],
		[LANCER.bottom + 3, 3],
	]) {
		rect(ships, LANCER.stern, y, width, 1, WHITE.shade);
		set(ships, LANCER.stern, y, WHITE.mid);
	}
	// Three drive bells.
	for (const y of [LANCER.top + 1, LANCER.top + 4, LANCER.top + 7]) {
		rect(ships, LANCER.stern - 2, y, 2, 2, WHITE.deep);
		set(ships, LANCER.stern - 1, y, WHITE.shade);
	}
	// Beam turrets under the keel, their emitters angled down at the gunship.
	for (const x of TURRETS) {
		const y = lancerBottom(x) + 1;
		rect(ships, x, y, 5, 1, WHITE.mid);
		rect(ships, x + 1, y + 1, 3, 1, WHITE.shade);
		set(ships, x + 1, y, WHITE.light);
		set(ships, x + 4, y + 1, WHITE.deep);
		set(ships, x + 5, y + 2, WHITE.deep);
		set(ships, x + 6, y + 3, BAND);
	}
}

/**
 * The gunship's deck row in one column: a blunt prow behind its ram, the long hull, and the tall drive block.
 * @param {number} x
 * @returns {number}
 */
function gunshipTop(x) {
	if (x < 21) {
		return GUNSHIP.top + 5;
	}
	if (x < 27) {
		return GUNSHIP.top + Math.round(((27 - x) * 4) / 6);
	}
	if (x >= GUNSHIP.stern - 4) {
		return GUNSHIP.top - 2;
	}
	return GUNSHIP.top;
}

/**
 * The gunship's keel row in one column.
 * @param {number} x
 * @returns {number}
 */
function gunshipBottom(x) {
	if (x < 21) {
		return GUNSHIP.top + 7;
	}
	if (x < 23) {
		return GUNSHIP.bottom - 1;
	}
	if (x >= GUNSHIP.stern - 4) {
		return GUNSHIP.bottom + 1;
	}
	return GUNSHIP.bottom;
}

/**
 * The dark gunship: a heavy slab of slate hull with a ram at its prow, a raised deck carrying its turret,
 * a stepped superstructure aft, a belly pod, a fin, armour plates and a line of green running lights.
 * @param {Canvas} ships
 */
function drawGunship(ships) {
	const deck = GUNSHIP.top;
	for (let x = GUNSHIP.ram; x <= GUNSHIP.stern; x++) {
		const top = gunshipTop(x);
		const bottom = gunshipBottom(x);
		for (let y = top; y <= bottom; y++) {
			let colour = SLATE.main;
			if (y === top) {
				colour = SLATE.edge;
			} else if (y <= top + 2) {
				colour = SLATE.light;
			} else if (y >= bottom - 1) {
				colour = SLATE.deep;
			} else if (y >= bottom - 3) {
				colour = SLATE.shade;
			}
			// Armour plates: a seam every six columns.
			if (x > 22 && (x - 22) % 6 === 0 && y > top && y < bottom - 1) {
				colour = y <= top + 2 ? SLATE.main : SLATE.shade;
			}
			set(ships, x, y, colour);
		}
	}
	// The ram's lit edge.
	rect(ships, GUNSHIP.ram, deck + 5, 6, 1, SLATE.edge);
	// The raised deck.
	for (let x = 31; x <= GUNSHIP.stern - 6; x++) {
		set(ships, x, deck - 2, SLATE.edge);
		set(ships, x, deck - 1, SLATE.light);
	}
	// The belly pod.
	for (let x = 30; x <= GUNSHIP.stern - 6; x++) {
		set(ships, x, deck + 11, SLATE.shade);
		if (x > 31 && x < GUNSHIP.stern - 7) {
			set(ships, x, deck + 12, SLATE.deep);
		}
	}
	// The stern superstructure, stepped up from the deck to the bridge, its green-lit glass looking forward.
	for (const [y, from, to] of [
		[deck - 3, 44, GUNSHIP.stern + 1],
		[deck - 4, 45, GUNSHIP.stern + 1],
		[deck - 5, 46, GUNSHIP.stern],
		[deck - 6, 47, GUNSHIP.stern - 1],
	]) {
		for (let x = from; x <= to; x++) {
			let colour = x <= from + 1 ? SLATE.light : SLATE.main;
			if (y === deck - 6 || (x === from && y < deck - 3)) {
				colour = SLATE.edge;
			}
			set(ships, x, y, colour);
		}
	}
	rect(ships, 46, deck - 4, 3, 1, C.ghostLight);
	set(ships, 49, deck - 4, C.ghost);
	set(ships, 50, deck - 5, RUNNING);
	// The turret on the raised deck, its emitter raised at the lancer.
	rect(ships, 37, deck - 3, 5, 1, SLATE.light);
	rect(ships, 38, deck - 4, 3, 1, SLATE.edge);
	set(ships, 40, deck - 5, SLATE.light);
	set(ships, 41, deck - 6, SLATE.edge);
	set(ships, 42, deck - 7, RUNNING);
	// A swept fin under the drive block.
	for (let i = 0; i < 4; i++) {
		rect(
			ships,
			GUNSHIP.stern - 4 + i,
			deck + 12 + i,
			5 - i,
			1,
			SLATE.shade
		);
	}
	// Running lights along the hull and lit ports below them.
	for (let x = 24; x <= GUNSHIP.stern - 6; x += 3) {
		set(ships, x, deck + 5, RUNNING);
	}
	for (let x = 33; x <= GUNSHIP.stern - 7; x += 4) {
		set(ships, x, deck + 2, C.ghostLight);
	}
	// The drive block's two bells.
	for (const y of [deck, deck + 5]) {
		rect(ships, GUNSHIP.stern + 1, y, 2, 3, SLATE.shade);
		set(ships, GUNSHIP.stern + 1, y, SLATE.light);
	}
	// Grey moonlight on the lowest plate of every column.
	for (let x = GUNSHIP.ram; x <= GUNSHIP.stern + 2; x++) {
		for (let y = 63; y > deck - 8; y--) {
			if (get(ships, x, y)) {
				set(ships, x, y, MOONLIT);
				break;
			}
		}
	}
}

/**
 * The drive flames: the lancer's gold, streaming out to the left, and the gunship's green, streaming right.
 * They are painted only on open space, never over a hull.
 * @param {Canvas} canvas
 * @param {boolean[]} open - Which pixels the ships and their outline left empty
 */
function drawDrives(canvas, open) {
	/** @type {[number, number, Colour][]} */
	const flames = [];
	for (const y of [LANCER.top + 1, LANCER.top + 4, LANCER.top + 7]) {
		for (const row of [y, y + 1]) {
			flames.push([LANCER.stern - 3, row, FLAME.core]);
			flames.push([
				LANCER.stern - 4,
				row,
				row === y ? FLAME.core : FLAME.mid,
			]);
			flames.push([LANCER.stern - 5, row, FLAME.mid]);
		}
		flames.push([LANCER.stern - 6, y, FLAME.tail]);
		flames.push([LANCER.stern - 6, y + 1, FLAME.tail]);
	}
	for (const y of [GUNSHIP.top + 1, GUNSHIP.top + 6]) {
		flames.push([GUNSHIP.stern + 3, y, C.ghostLight]);
		flames.push([GUNSHIP.stern + 4, y, C.ghost]);
		flames.push([GUNSHIP.stern + 5, y, C.ghostShade]);
		flames.push([GUNSHIP.stern + 3, y - 1, C.ghost]);
		flames.push([GUNSHIP.stern + 3, y + 1, C.ghost]);
	}
	for (const [x, y, colour] of flames) {
		if (open[y * 64 + x]) {
			set(canvas, x, y, colour);
		}
	}
}

/**
 * One beam from a muzzle towards its target: a saturated edge round a pale core, drawn over open space only,
 * so it ends where it meets a hull, with a small flare at the point of impact.
 * @param {Canvas} canvas
 * @param {boolean[]} open - Which pixels the ships and their outline left empty
 * @param {[number, number]} from - The muzzle
 * @param {[number, number]} to - The target
 * @param {{ core: Colour, edge: Colour }} colours
 */
function drawBeam(canvas, open, [x0, y0], [x1, y1], { core, edge }) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const steps = Math.ceil(length * 2);
	/** @type {[number, number] | null} */
	let impact = null;
	for (let i = 0; i <= steps; i++) {
		const x = Math.round(x0 + ((x1 - x0) * i) / steps);
		const y = Math.round(y0 + ((y1 - y0) * i) / steps);
		if (i > 2 && !open[y * 64 + x]) {
			impact = [x, y];
			break;
		}
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			const nx = x + dx;
			const ny = y + dy;
			if (
				open[ny * 64 + nx] &&
				get(canvas, nx, ny) !== core &&
				nx >= 0 &&
				nx < 64
			) {
				set(canvas, nx, ny, edge);
			}
		}
	}
	for (let i = 0; i <= steps; i++) {
		const x = Math.round(x0 + ((x1 - x0) * i) / steps);
		const y = Math.round(y0 + ((y1 - y0) * i) / steps);
		if (impact && x === impact[0] && y === impact[1]) {
			break;
		}
		if (open[y * 64 + x]) {
			set(canvas, x, y, core);
		}
	}
	if (impact) {
		const [x, y] = impact;
		set(canvas, x, y, core);
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			set(canvas, x + dx, y + dy, edge);
		}
	}
}

/**
 * The explosion blooming where the red beam strikes the gunship's deck: firelight on the lit plating round it,
 * a white-hot heart in rings of gold, amber and red with a ragged edge, a thin halo in space,
 * and burning sparks and torn plates flung out.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawBlast(canvas, random) {
	const bands = [C.white, C.lampGlow, C.gold, C.amber, C.brickRedLight];
	/** Each ray's reach, so the edge is ragged. */
	const reach = Array.from({ length: 16 }, () => 4 + random() * 2.2);
	// The blast lights only the gunship's raised edges round it; the dark plating and space stay dark.
	for (let y = BLAST.y - 9; y <= BLAST.y + 9; y++) {
		for (let x = BLAST.x - 12; x <= BLAST.x + 12; x++) {
			const colour = get(canvas, x, y);
			const near = Math.hypot(x - BLAST.x, y - BLAST.y) < 12;
			if (near && (colour === SLATE.edge || colour === SLATE.light)) {
				set(canvas, x, y, colour === SLATE.edge ? C.gold : FIRELIT);
			}
		}
	}
	for (let y = BLAST.y - 7; y <= BLAST.y + 7; y++) {
		for (let x = BLAST.x - 7; x <= BLAST.x + 7; x++) {
			const d = Math.hypot(x - BLAST.x, (y - BLAST.y) * 1.15);
			const ray = Math.round(
				((Math.atan2(y - BLAST.y, x - BLAST.x) + Math.PI) /
					(2 * Math.PI)) *
					16
			);
			const limit = reach[ray % 16];
			if (d > limit) {
				continue;
			}
			const band = Math.min(
				bands.length - 1,
				Math.floor((d / limit) * bands.length)
			);
			set(canvas, x, y, bands[band]);
		}
	}
	// A thin halo in space round the bloom.
	for (let y = BLAST.y - 9; y <= BLAST.y + 9; y++) {
		for (let x = BLAST.x - 9; x <= BLAST.x + 9; x++) {
			const d = Math.hypot(x - BLAST.x, (y - BLAST.y) * 1.15);
			const behind = get(canvas, x, y);
			if (d > 5.5 && d < 8 && behind && SPACE.includes(behind)) {
				set(canvas, x, y, mix(behind, C.amber, d < 6.8 ? 0.35 : 0.18));
			}
		}
	}
	// Burning sparks and torn plates flung out and up from the blast.
	/** @type {[number, number, Colour][]} */
	const sparks = [
		[-7, -5, C.gold],
		[6, -7, C.lampGlow],
		[-9, -2, C.amber],
		[2, -9, C.gold],
		[-3, -9, C.brickRedLight],
	];
	for (const [dx, dy, colour] of sparks) {
		set(canvas, BLAST.x + dx, BLAST.y + dy, colour);
	}
	for (const [dx, dy] of [
		[-13, -7],
		[-17, -1],
	]) {
		const x = BLAST.x + dx;
		const y = BLAST.y + dy;
		rect(canvas, x - 1, y - 1, 4, 3, C.ink);
		rect(canvas, x, y, 2, 1, SLATE.edge);
		set(canvas, x, y + 1, SLATE.main);
		set(canvas, x + 1, y - 1, C.ink);
	}
}
