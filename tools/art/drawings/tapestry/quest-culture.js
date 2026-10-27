// Quest Culture: a knight, a wizard and an archer, seen from behind, setting off down a winding road towards a far castle.
import {
	createCanvas,
	set,
	rect,
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon, the near fields' top row, and where the road meets the castle gate. */
const HORIZON = 30;
const FIELDS = 33;
const GATE = { x: 50, y: 25 };

/** Distant colours, softened towards the sky. */
const FAR_STONE = mix(C.stoneLight, C.daySky5, 0.3);
const FAR_STONE_SHADE = mix(C.stone, C.daySky4, 0.3);
const FAR_ROOF = mix(C.brickRed, C.daySky5, 0.25);
const FAR_HILL = mix(C.grass, C.daySky5, 0.35);
const FAR_HILL_LIGHT = mix(C.grassLight, C.daySky6, 0.3);

/** Steel for the knight's armour. */
const STEEL_LIGHT = mix(C.stoneLight, C.white, 0.45);
const STEEL = C.stoneLight;
const STEEL_SHADE = C.stoneMid;

/**
 * The knight from behind: a plumed helm, steel shoulders and greaves, and a long red cape with folds.
 * r plume, R plume shade, h steel lit, H steel, s steel shade, m the helm's ridge, y gold trim, c cape, C cape fold.
 */
const KNIGHT = [
	'.....rr.......',
	'....rRRr......',
	'.....rRRr.....',
	'....hhmhhh....',
	'...hHHmHHHs...',
	'...hHHmHHHs...',
	'...hHHmHHHs...',
	'...yyyyyyyy...',
	'..hhhcccchs...',
	'.hHHccccccHs..',
	'.hHcccccccHs..',
	'.hHccCccccHs..',
	'.hHccCcccCHs..',
	'.hHcccCccCHs..',
	'.sHcccCcccCs..',
	'.sccccCcccCc..',
	'..cccccCccCc..',
	'..ccccCcccCcc.',
	'.cccccCccccCc.',
	'.ccccccCcccCc.',
	'.ccccccCcccccc',
	'...hH...hH....',
	'...hH...hH....',
	'...hH...hH....',
	'..hHH..hHH....',
	'..sss..sss....',
];

/**
 * The wizard from behind, head turned so the beard shows: a tall bent hat, a wide brim and a long robe.
 * p hat lit, P hat, q hat shade, y hat band, b brim, H hair, S skin, W beard, r robe lit, R robe, Q robe shade.
 */
const WIZARD = [
	'.........pp....',
	'........pP.....',
	'.......pPP.....',
	'.......pPq.....',
	'......pPPq.....',
	'......pPPq.....',
	'.....pPPPPq....',
	'.....pPPPPq....',
	'....yyyyyyyy...',
	'..bbbbbbbbbbbb.',
	'....HHHHHHSs...',
	'....HHHHHHWW...',
	'....HHHHHWWWW..',
	'...rrRRRRRWWW..',
	'..rRRRRRRRRWW..',
	'..rRRRRRRRRRQ..',
	'..rRRRRRRRRRQS.',
	'..rRRRRRRRRRQ..',
	'..rRRRRRRRRRQ..',
	'..rRRRRRRRRRQ..',
	'..rRRRRRRRRRQ..',
	'.rRRRRRRRRRRRQ.',
	'.rRRRRRRRRRRRQ.',
	'.rRRRRRRRRRRRQ.',
	'.rRRRRRRRRRRRQQ',
	'rRRRRRRRRRRRRQQ',
	'rRRRRRRRRRRRRQQ',
	'..ww.....ww....',
];

/**
 * The archer from behind: a green hood and cloak, a quiver of arrows across the back, brown legs and boots.
 * g hood lit, G hood, s hood shade, k cloak, K cloak shade, q quiver, Q quiver shade, L legs, B boots.
 */
const ARCHER = [
	'....gggg.....',
	'...gGGGGg....',
	'..gGGGGGGs...',
	'..gGGGGGGs...',
	'..gGGGGGGs...',
	'...gGGGGs....',
	'..gGGGGGGGs..',
	'.gkkkkkkqqKs.',
	'.gkkkkkqqkKs.',
	'.gkkkkqqkkKs.',
	'.gkkkqqkkkKs.',
	'.gkkqqkkkkKs.',
	'.gkqqkkkkkKs.',
	'.gkkkkkkkkKs.',
	'..kkkkkkkkK..',
	'..kkkkkkkkK..',
	'...LL...LL...',
	'...LL...LL...',
	'...LL...LL...',
	'..BBB..BBB...',
];

/**
 * Draws the Quest Culture scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8128);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawFarHills(layer);
	drawCastleHill(layer);
	drawTerrain(layer, { kind: 'grassland', top: FIELDS, random });
	drawRoad(layer);

	// The castle is far behind the party, so it gets its own, softer outline.
	const castle = createCanvas(64, 64);
	drawCastle(castle);
	outline(castle, mix(C.ink, C.daySky3, 0.35));
	underlay(castle, layer);

	drawArcher(scene, 4, 41);
	drawKnight(scene, 23, 37);
	drawWizard(scene, 41, 32);
	outline(scene, C.ink);
	underlay(scene, castle);
	drawStaffGem(scene);
	return scene;
}

/**
 * Pale far hills along the horizon.
 * @param {Canvas} layer
 */
function drawFarHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(HORIZON - 3 - Math.sin(x * 0.12 + 0.4) * 2.5);
		for (let y = top; y < FIELDS; y++) {
			set(layer, x, y, y === top ? FAR_HILL_LIGHT : FAR_HILL);
		}
	}
}

/**
 * The road: it starts wide at the viewer's feet and winds back and forth, narrowing, across the fields to the castle gate.
 * @param {Canvas} layer
 */
function drawRoad(layer) {
	/** The road's centre at each bend, from the gate down to the viewer. */
	const bends = [
		[GATE.y, GATE.x],
		[29, 44],
		[35, 16],
		[42, 22],
		[63, 30],
	];
	let previous = GATE.x;
	for (let y = GATE.y + 1; y < 64; y++) {
		const i = bends.findIndex(([by]) => by >= y);
		const [y0, x0] = bends[i - 1];
		const [y1, x1] = bends[i];
		const centre = x0 + ((x1 - x0) * (y - y0)) / (y1 - y0);
		const half = 0.6 + ((y - GATE.y) / (63 - GATE.y)) ** 1.6 * 13;
		const from = Math.round(Math.min(centre, previous) - half);
		const to = Math.round(Math.max(centre, previous) + half);
		for (let x = from; x <= to; x++) {
			const edge = x === from || x === to;
			set(layer, x, y, edge ? C.sand : C.sandLight);
		}
		previous = centre;
	}
}

/**
 * The green hill the castle stands on, rising on the right of the horizon.
 * @param {Canvas} layer
 */
function drawCastleHill(layer) {
	for (let x = 30; x < 64; x++) {
		const top = Math.round(23 + ((x - 51) / 13) ** 2 * 5);
		for (let y = top; y < FIELDS; y++) {
			set(layer, x, y, y === top ? FAR_HILL_LIGHT : FAR_HILL);
		}
	}
}

/**
 * The castle in the distance: a keep between two round towers with red cone roofs, a gate and a pennant.
 * @param {Canvas} castle
 */
function drawCastle(castle) {
	// The curtain wall with a gate.
	for (let x = 44; x <= 57; x++) {
		for (let y = 20; y <= 24; y++) {
			set(castle, x, y, x >= 56 ? FAR_STONE_SHADE : FAR_STONE);
		}
		if (x % 2 === 0) {
			set(castle, x, 19, FAR_STONE);
		}
	}
	rect(castle, GATE.x - 1, 22, 3, 3, C.wood);
	// The keep.
	for (let x = 47; x <= 53; x++) {
		for (let y = 13; y <= 19; y++) {
			set(castle, x, y, x >= 52 ? FAR_STONE_SHADE : FAR_STONE);
		}
		if (x % 2 === 1) {
			set(castle, x, 12, FAR_STONE);
		}
	}
	set(castle, 50, 15, C.wood);
	set(castle, 50, 16, C.wood);
	// Two towers with cone roofs.
	for (const tx of [42, 56]) {
		for (let x = tx; x <= tx + 2; x++) {
			for (let y = 16; y <= 24; y++) {
				set(castle, x, y, x === tx + 2 ? FAR_STONE_SHADE : FAR_STONE);
			}
		}
		set(castle, tx + 1, 12, FAR_ROOF);
		rect(castle, tx + 1, 13, 1, 1, FAR_ROOF);
		rect(castle, tx, 14, 3, 1, FAR_ROOF);
		rect(castle, tx - 1, 15, 5, 1, FAR_ROOF);
	}
	// The pennant on the keep.
	line(castle, 50, 8, 50, 11, C.wood);
	rect(castle, 51, 8, 3, 1, C.gold);
	set(castle, 51, 9, C.gold);
}

/**
 * The knight, with a sword hanging at the hip.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawKnight(scene, x, y) {
	// The sword: a gold cross-guard at the hip and the scabbard angled back.
	line(scene, x + 13, y + 15, x + 16, y + 23, C.wood);
	rect(scene, x + 12, y + 14, 3, 1, C.gold);
	set(scene, x + 13, y + 13, C.amber);
	paint(scene, x, y, KNIGHT, {
		r: C.brickRedLight,
		R: C.brickRed,
		m: STEEL_SHADE,
		y: C.gold,
		h: STEEL_LIGHT,
		H: STEEL,
		s: STEEL_SHADE,
		c: C.brickRed,
		C: C.brickRedShade,
	});
}

/**
 * The wizard, leaning on a tall staff.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawWizard(scene, x, y) {
	// The staff, taller than the wizard, held at the right hand.
	for (let row = y + 4; row <= y + 28; row++) {
		set(scene, x + 15, row, C.timber);
	}
	paint(scene, x, y, WIZARD, {
		p: C.railLight,
		P: C.roofLight,
		q: C.roof,
		y: C.gold,
		b: C.roof,
		H: C.cloudShade,
		S: C.skin,
		s: C.skinShade,
		W: C.white,
		r: C.daySea1,
		R: C.daySea2,
		Q: C.daySea3,
		w: C.wood,
	});
}

/**
 * The archer, with a bow held at the left side and arrows showing over the shoulder.
 * @param {Canvas} scene
 * @param {number} x - The sprite's left column
 * @param {number} y - The sprite's top row
 */
function drawArcher(scene, x, y) {
	// Arrow shafts and fletching above the quiver's mouth.
	for (const [dx, h] of [
		[9, 4],
		[10, 3],
		[11, 4],
	]) {
		for (let i = 1; i <= h; i++) {
			set(scene, x + dx, y + 7 - i, C.timberLight);
		}
		set(scene, x + dx, y + 7 - h, C.white);
		set(scene, x + dx, y + 6 - h, C.brickRed);
	}
	// The bow: a curved stave with its string, held upright.
	for (let i = 0; i <= 16; i++) {
		const bend = Math.round(Math.sin((i / 16) * Math.PI) * 2);
		set(scene, x - bend, y + 3 + i, C.timberLight);
	}
	line(scene, x + 1, y + 3, x + 1, y + 19, C.creamLight);
	paint(scene, x, y, ARCHER, {
		g: C.forestFloorLight,
		G: C.forestFloor,
		s: C.forestFloorShade,
		k: C.pine,
		K: C.pineShade,
		q: C.timber,
		Q: C.timberShade,
		L: C.timberShade,
		B: C.wood,
	});
}

/**
 * The glowing crystal on top of the wizard's staff, drawn after the outline with a faint glow.
 * @param {Canvas} scene
 */
function drawStaffGem(scene) {
	glow(scene, {
		x: 56,
		y: 34,
		radius: 5,
		colour: C.tealLight,
		strength: 0.4,
	});
	paint(scene, 55, 32, ['.k.', 'kTk', 'Ttk', 'kTk', '.k.'], {
		k: C.ink,
		T: C.tealLight,
		t: C.teal,
	});
}
