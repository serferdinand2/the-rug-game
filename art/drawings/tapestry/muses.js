// Muses: three robed muses on a golden hillside at dusk, one with a lyre, one with a scroll and one holding up a mask.
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
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, and the hill's crest. */
const HORIZON = 49;
const CREST = 53;

/**
 * A muse standing face on in a long white robe, a coloured mantle draped from her left shoulder to her right hip.
 * H hair, g gold fillet, S skin, s skin shade, e eye, R robe, r robe shade, M mantle, m mantle shade, k sandal.
 */
const MUSE = [
	'......HH......',
	'.....HHHH.....',
	'....HHHHHH....',
	'...HggggggH...',
	'...HSSSSSSH...',
	'...HSeSSeSH...',
	'...HSSSSSSH...',
	'....SSssSS....',
	'.....SSSS.....',
	'......SS......',
	'...MMRRRRRR...',
	'..MMMMRRRRRR..',
	'..MMMMMRRRRr..',
	'..MMMMMMRRRr..',
	'..SMMMMMMRRS..',
	'..SmMMMMMMRS..',
	'..SRmMMMMMMS..',
	'...RRmMMMMMr..',
	'...RRRmMMMMr..',
	'...RRRRmMMMr..',
	'...RRRRRmMMr..',
	'...RRRRRRmMr..',
	'..RRRRRRRRmrr.',
	'..RRRRRRRRRrr.',
	'..RRRRRRRRRrr.',
	'..RRRRRRRRRrr.',
	'..RRRRRRRRRrr.',
	'.RRRRRRRRRRrr.',
	'.RRRRRRRRRRRrr',
	'.RRRRRRRRRRRrr',
	'.RRRRRRRRRRRrr',
	'.RRRRRRRRRRRrr',
	'...kk....kk...',
];

/**
 * The three muses: where each stands, her hair, the band in it, her mantle, and whether her hair falls loose.
 * @type {{ x: number, hair: Colour, band: Colour, mantle: Colour, shade: Colour, loose: boolean }[]}
 */
const MUSES = [
	{
		x: 4,
		hair: C.wood,
		band: C.grassLight,
		mantle: C.arcane,
		shade: C.arcaneShade,
		loose: false,
	},
	{
		x: 25,
		hair: C.amber,
		band: C.gold,
		mantle: C.teal,
		shade: C.tealShade,
		loose: false,
	},
	{
		x: 46,
		hair: C.timber,
		band: C.brickRedLight,
		mantle: C.brickRed,
		shade: C.brickRedShade,
		loose: true,
	},
];

/**
 * Draws the Muses scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9644);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawFarHills(layer);
	drawHillside(layer, random);

	for (const muse of MUSES) {
		const top = feet(muse.x + 7) - MUSE.length + 1;
		paint(scene, muse.x, top, MUSE, {
			H: muse.hair,
			g: muse.band,
			S: C.skin,
			s: C.skinShade,
			e: C.ink,
			R: C.creamLight,
			r: C.creamShade,
			M: muse.mantle,
			m: muse.shade,
			k: C.timberShade,
		});
		if (muse.loose) {
			// Loose hair falling over her shoulders.
			for (let row = 6; row <= 12; row++) {
				set(scene, muse.x + 2, top + row, muse.hair);
				set(scene, muse.x + 11, top + row, muse.hair);
			}
		}
	}
	outline(scene, C.ink);

	// The attributes are held in front of the robes, so they get their own outline on top of the muses.
	const held = createCanvas(64, 64);
	drawLyre(held, MUSES[0].x, feet(MUSES[0].x + 7));
	drawScroll(held, MUSES[1].x, feet(MUSES[1].x + 7));
	drawMask(held, MUSES[2].x, feet(MUSES[2].x + 7));
	outline(held, C.ink);
	underlay(held, scene);
	underlay(held, layer);
	return held;
}

/**
 * The row a muse standing at a column has her feet on: the hillside rises to its crest in the middle.
 * @param {number} x
 * @returns {number}
 */
function feet(x) {
	return Math.round(CREST + ((x - 32) / 32) ** 2 * 8);
}

/**
 * Far hills in the dusk haze behind the hillside.
 * @param {Canvas} layer
 */
function drawFarHills(layer) {
	const haze = mix(C.duskSky4, C.roof, 0.45);
	const ridge = mix(C.duskSky5, C.roof, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			43 - Math.sin(x * 0.12 + 1.5) * 2.5 - Math.sin(x * 0.31) * 1.2
		);
		for (let y = top; y < 64; y++) {
			set(layer, x, y, y === top ? ridge : haze);
		}
	}
}

/**
 * The golden hillside: grass shaped into a rounded hill and turned to gold by the low sun, brightest along the crest.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHillside(layer, random) {
	const grass = createCanvas(64, 64);
	drawTerrain(grass, { kind: 'grassland', top: CREST - 1, random });
	for (let x = 0; x < 64; x++) {
		const top = feet(x) - 1;
		for (let y = top; y < 64; y++) {
			const colour = get(grass, x, y - top + CREST - 1) ?? C.grass;
			const sun = mix(C.gold, C.amber, Math.min(1, (y - top) / 12));
			set(layer, x, y, y === top ? C.lampGlow : mix(colour, sun, 0.62));
		}
	}
}

/**
 * A golden lyre held at the first muse's side: two horned arms, a crossbar, strings and a shell sound box.
 * @param {Canvas} scene
 * @param {number} x - The muse's left column
 * @param {number} base - The muse's feet row
 */
function drawLyre(scene, x, base) {
	paint(
		scene,
		x + 1,
		base - 23,
		[
			'g.......g',
			'gg.....gg',
			'.ggggggg.',
			'.gdcdcdg.',
			'.gdcdcdg.',
			'.gdcdcdg.',
			'.gdcdcdg.',
			'.STTTTTT.',
			'..TtTtT..',
			'...TTT...',
		],
		{
			g: C.gold,
			c: C.creamLight,
			d: C.timberShade,
			T: C.timberLight,
			t: C.timber,
			S: C.skin,
		}
	);
}

/**
 * An open scroll held across the second muse's chest in both hands, rolled up at both ends on gold-knobbed rods.
 * @param {Canvas} scene
 * @param {number} x - The muse's left column
 * @param {number} base - The muse's feet row
 */
function drawScroll(scene, x, base) {
	paint(
		scene,
		x,
		base - 22,
		[
			'.g..........g.',
			'.TtWWWWWWWWTt.',
			'STtWWWWWWWWTtS',
			'STtWWWWWWWWTtS',
			'.TtWWWWWWWWTt.',
			'.TtwwwwwwwwTt.',
			'.g..........g.',
		],
		{
			g: C.gold,
			T: C.cream,
			t: C.creamShade,
			W: C.white,
			w: C.creamLight,
			S: C.skin,
		}
	);
}

/**
 * A white comedy mask on a gold stick, raised beside the third muse's face in her lifted hand.
 * @param {Canvas} scene
 * @param {number} x - The muse's left column
 * @param {number} base - The muse's feet row
 */
function drawMask(scene, x, base) {
	paint(
		scene,
		x + 10,
		base - 32,
		[
			'.WWWWWW.',
			'WWWWWWWW',
			'WkkWWkkW',
			'WWWWWWWW',
			'WkWWWWkW',
			'WWkkkkWW',
			'.WWkkWW.',
			'..WWWW..',
			'....g...',
			'....g...',
			'...SS...',
			'..SS....',
			'.SS.....',
		],
		{ W: C.white, k: C.ink, g: C.gold, S: C.skin }
	);
}
