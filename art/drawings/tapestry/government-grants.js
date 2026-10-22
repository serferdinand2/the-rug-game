// Government Grants: a top-hatted official handing a sack of coins to a painter on the steps of a columned ministry.
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
import { drawClassical } from '../../parts/classical.js';
import { drawBanner } from '../../parts/banner.js';
import { drawStreet } from '../../parts/street.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The ministry's bottom step, and the square's first row. */
const STEPS = 47;
const SQUARE = 48;

/** The row both figures stand on. */
const FEET = 61;

/** Honey sandstone for the ministry, in place of the classical part's cream marble. */
const SANDSTONE = new Map([
	[C.creamLight, mix(C.creamLight, C.sandLight, 0.6)],
	[C.cream, mix(C.cream, C.sand, 0.55)],
	[C.creamShade, mix(C.creamShade, C.sandShade, 0.6)],
]);

/**
 * The official, facing right, holding the sack out by its neck. K top hat, k hat band, H grey hair,
 * S skin, s skin shade, e eye, M moustache, W collar, R red tie, B coat, b coat shade, G gold watch chain,
 * P trousers, F shoes.
 */
const OFFICIAL = [
	'....KKKK.....',
	'....KKKK.....',
	'....KKKK.....',
	'....kkkk.....',
	'..KKKKKKKK...',
	'....HSSSS....',
	'....HSSeS....',
	'....HSSSSS...',
	'....HSMMS....',
	'.....sSSs....',
	'.....WWWW....',
	'...BBWRWBB...',
	'..BBBBRBBBB..',
	'..BBBBBBBBB..',
	'..bBBBBBBBBB.',
	'..bBBBBGBBBBB',
	'..bBBBGBBB.SS',
	'..bBBBBBBB...',
	'..bBBBBBBb...',
	'..bBBBBBBb...',
	'..bBB..BBb...',
	'...PP..PP....',
	'...PP..PP....',
	'...PP..PP....',
	'...PP..PP....',
	'...PP..PP....',
	'..FFF..FFF...',
];

/**
 * The painter, facing left, reaching out to take the sack. R beret, r beret shade, h hair,
 * S skin, s skin shade, e eye, Y scarf, y scarf shade, C smock, c smock shade, p paint splashes,
 * T trousers, F shoes.
 */
const PAINTER = [
	'.....R......',
	'...RRRRRr...',
	'..RRRRRRRr..',
	'...hSSSShh..',
	'...SeSSShh..',
	'..SSSSSShh..',
	'...SSSSShh..',
	'....sSSs.h..',
	'....YYYYY...',
	'..CCYyYCCC..',
	'..CCCyCqCCC.',
	'..CCCyCCCCCc',
	'.CCCCCCCCCCc',
	'CCCCCCCCCpCc',
	'CCpCCCCCCCcc',
	'SSCCCCCCCCc.',
	'..CCCCpCCCc.',
	'..CCCCCCCCc.',
	'..cCCCCCCcc.',
	'...TT..TT...',
	'...TT..TT...',
	'...TT..TT...',
	'...TT..TT...',
	'...TT..TT...',
	'..FFF..FFF..',
];

/**
 * Draws the Government Grants scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(4409);

	drawSky(layer, { time: 'day', horizon: SQUARE - 1, random });
	drawStreet(layer, { top: SQUARE });

	// The ministry stands behind the people, so it gets its own outline.
	const ministry = createCanvas(64, 64);
	drawMinistry(ministry);
	outline(ministry, C.ink);
	drawCrest(ministry);

	paint(scene, 11, FEET - OFFICIAL.length + 1, OFFICIAL, {
		K: C.night,
		k: C.brickRed,
		H: C.stoneLight,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		M: C.stoneLight,
		W: C.white,
		R: C.brickRed,
		B: mix(C.roof, C.nightSea3, 0.5),
		b: C.roofShade,
		G: C.gold,
		P: C.stoneShade,
		F: C.wood,
	});
	paint(scene, 33, FEET - PAINTER.length + 1, PAINTER, {
		R: C.brickRed,
		r: C.brickRedShade,
		h: C.timber,
		S: C.skin,
		s: C.skinShade,
		e: C.ink,
		Y: C.gold,
		y: C.amber,
		C: C.creamLight,
		c: C.creamShade,
		p: C.daySea2,
		q: C.brickRedLight,
		T: C.timberShade,
		F: C.wood,
	});
	drawSack(scene);
	drawPalette(scene);
	outline(scene, C.ink);
	underlay(scene, ministry);
	underlay(scene, layer);
	drawCoinSign(scene);
	drawSpill(scene);
	drawSplashes(scene);
	return scene;
}

/**
 * The ministry: a broad sandstone front of seven columns under a pediment, with tall doors and a flag on a pole either side.
 * @param {Canvas} canvas
 */
function drawMinistry(canvas) {
	drawClassical(canvas, {
		x: 5,
		y: STEPS,
		width: 54,
		columns: 7,
		height: 19,
	});
	for (let i = 0; i < canvas.p.length; i++) {
		const colour = canvas.p[i];
		if (colour && SANDSTONE.has(colour)) {
			canvas.p[i] = /** @type {Colour} */ (SANDSTONE.get(colour));
		}
	}
	// Tall dark doors between the middle columns.
	for (let y = 32; y <= STEPS - 3; y++) {
		for (let x = 28; x <= 35; x++) {
			if (get(canvas, x, y) === C.roofShade) {
				set(canvas, x, y, y === 32 ? C.timberLight : C.timberShade);
			}
		}
	}
	drawBanner(canvas, {
		kind: 'flag',
		x: 1,
		y: STEPS,
		cloth: C.daySea1,
		height: 40,
		device: C.gold,
	});
	drawBanner(canvas, {
		kind: 'flag',
		x: 50,
		y: STEPS,
		cloth: C.daySea1,
		height: 40,
		device: C.gold,
		facing: 'left',
	});
}

/**
 * A crest in the pediment: a blue shield edged in gold, bearing the flags' gold diamond, drawn after the outline so it stays fine.
 * @param {Canvas} canvas
 */
function drawCrest(canvas) {
	paint(
		canvas,
		29,
		13,
		[
			'GGGGGGG',
			'GBBBBBG',
			'GBBGBBG',
			'GBGAGBG',
			'GBBGBBG',
			'GBBBBBG',
			'.GBBBG.',
			'..GGG..',
		],
		{ G: C.gold, A: C.amber, B: C.daySea1 }
	);
}

/**
 * The sack of coins, hanging from the official's hand by its tied neck: plain sacking, bulging at the bottom.
 * @param {Canvas} scene
 */
function drawSack(scene) {
	const rows = [
		'...tt...',
		'....t...',
		'..nNNn..',
		'...NN...',
		'..NNNNn.',
		'.NNNNNNn',
		'NNNNNNNn',
		'NNNNNNNn',
		'NNNNNNNn',
		'NNNNNNNn',
		'.NNNNNn.',
		'..nnnn..',
	];
	paint(scene, 23, 47, rows, {
		t: C.sand,
		n: C.sandShade,
		N: C.sand,
	});
}

/**
 * The coin sign printed on the sack: a gold coin with a raised rim.
 * @param {Canvas} scene
 */
function drawCoinSign(scene) {
	paint(scene, 25, 53, ['.GG.', 'GAAG', 'GAAG', '.GG.'], {
		G: C.gold,
		A: C.amber,
	});
}

/**
 * A few coins slipping from the sack's neck and glinting on the paving below.
 * @param {Canvas} scene
 */
function drawSpill(scene) {
	for (const [x, y] of [
		[30, 50],
		[33, 57],
		[27, 60],
		[36, 61],
	]) {
		set(scene, x, y, C.gold);
		set(scene, x + 1, y, C.amber);
	}
	set(scene, 31, 53, C.lampGlow);
}

/**
 * The painter's palette held at the side: a kidney of timber with blobs of colour.
 * @param {Canvas} scene
 */
function drawPalette(scene) {
	paint(scene, 43, 47, ['.PPPPP', 'PPPPPP', 'PP.PPP', 'PPPPP.'], {
		P: C.timberLight,
	});
}

/**
 * Blobs of paint on the palette, drawn after the outline so they stay bright.
 * @param {Canvas} scene
 */
function drawSplashes(scene) {
	set(scene, 45, 47, C.brickRedLight);
	set(scene, 47, 47, C.gold);
	set(scene, 48, 48, C.daySea2);
	set(scene, 44, 50, C.grassLight);
}
