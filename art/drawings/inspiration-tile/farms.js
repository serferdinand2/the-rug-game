// The farms inspiration tile: hunting, farming, breeding, preservation, fertilization and food printing, from the spear to the printer.
import { line, mix, outline, paint, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import {
	GROUND,
	INSIDE,
	drawInspirationTile,
} from '../../parts/inspiration-tile.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The deer's hide, lit, mid and shaded. */
const HIDE_LIGHT = mix(C.timberLight, C.sandLight, 0.55);
const HIDE = mix(C.timberLight, C.sand, 0.2);
const HIDE_SHADE = C.timber;

/**
 * A deer leaping to the right, its body rising to the chest, its legs stretched fore and aft.
 * Keys: l/h/s hide lit, mid and shaded; w white tail; a/A antler; k eye, nose and hooves.
 */
const HUNTING = [
	'..............................',
	'..............................',
	'..................a.a...a.a...',
	'...................aa...aa....',
	'....................a...a.....',
	'..................ll.A.A......',
	'...................l.lls......',
	'....................lhkhl.....',
	'...................lhhhhhl....',
	'...................lhhhhhhk...',
	'..................lhhhsssss...',
	'....ww.....lllllllhhhs........',
	'....www..llhhhhhhhhhhs........',
	'....ww.llhhhhhhhhhhhs.........',
	'......lhhhhhhhhhhhhhs.........',
	'.....lhhhhhhhhhhhhhhs.........',
	'.....lhhhhhhhhhhhhhhhl........',
	'.....lhhhhhhhhhhhhhhhhll......',
	'......lhhhhhhhhsssshhhshll....',
	'......lhhhhssss....lhs.lssk...',
	'.....lhshhs.........lhl.......',
	'....lhs.lhs..........lsl......',
	'....ls.lhs.............k......',
	'...lhs.ls.....................',
	'...ks.lhs.....................',
	'......ks......................',
	'..............................',
	'..............................',
	'..............................',
	'..............................',
];

/** @type {Readonly<Record<string, Colour>>} */
const HUNTING_COLOURS = {
	l: HIDE_LIGHT,
	h: HIDE,
	s: HIDE_SHADE,
	w: C.creamLight,
	a: C.cream,
	A: C.creamShade,
	k: C.ink,
};

/** The spear's shaft, from its butt at the bottom right to the binding under the deer. */
const SPEAR = { x0: 27, y0: 26, x1: 19, y1: 22 };

/**
 * The spear's flint point, bound to the shaft and flying up to the left, under the deer's belly.
 * Keys: b binding; F/f/x flint lit, mid and shaded.
 */
const SPEAR_POINT = ['FF.....', 'FFfF...', '.ffffFb', '..xxffb', '....xx.'];

/** @type {Readonly<Record<string, Colour>>} */
const SPEAR_POINT_COLOURS = {
	b: C.sand,
	F: C.stoneLight,
	f: C.stone,
	x: C.stoneShade,
};

/**
 * Space 1, hunting: a deer leaping over a flying spear.
 * @param {Canvas} canvas
 */
function drawHunting(canvas) {
	line(canvas, SPEAR.x0, SPEAR.y0, SPEAR.x1, SPEAR.y1, C.timberLight);
	line(canvas, SPEAR.x0, SPEAR.y0 + 1, SPEAR.x1, SPEAR.y1 + 1, C.timber);
	paint(canvas, SPEAR.x1 - 7, SPEAR.y1 - 2, SPEAR_POINT, SPEAR_POINT_COLOURS);
	paint(canvas, 0, 0, HUNTING, HUNTING_COLOURS);
	outline(canvas, C.ink);
}

/** The wheat's kernels, from lit to shaded. */
const KERNEL_LIGHT = C.sandLight;
const KERNEL = C.gold;
const KERNEL_SHADE = C.amber;
const KERNEL_DARK = mix(C.amber, C.timber, 0.45);

/**
 * A sheaf of wheat tied at the waist with a twisted straw band: five ears of kernels set left and right
 * of their stems, the outer ones lower, so ink zigzags between them.
 * Keys: y/g/a/o kernels lit to dark; S/s/z stalks lit, mid and shaded; b/B band; c cut ends.
 */
const SHEAF = [
	'.........yg.........',
	'.....yg.ygao.yg.....',
	'....ygao.ga.ygao....',
	'.....ga.ygao.ga.....',
	'.yg.ygao.ga.ygao.yg.',
	'ygao.ga.ygao.ga.ygao',
	'.ga.ygao.ga.ygao.ga.',
	'ygao.ga..Ss..ga.ygao',
	'.ga.SszSszSszSsz.ga.',
	'ygao.SszSszSszS.ygao',
	'.ga.SszSszSszSsz.ga.',
	'...SszSszSszSszSs...',
	'....SszSszSszSsz....',
	'.....SszSszSszS.....',
	'......bBbBbBbB......',
	'......BbBbBbBb......',
	'......SszSszSs......',
	'.....SszSszSszS.....',
	'.....SszSszSszS.....',
	'....SszSszSszSsz....',
	'....SszSszSszSsz....',
	'...SszSszSszSszSs...',
	'...SszSszSszSszSs...',
	'..SszSszSszSszSszS..',
	'..cczcczcczcczcczc..',
];

/** @type {Readonly<Record<string, Colour>>} */
const SHEAF_COLOURS = {
	y: KERNEL_LIGHT,
	g: KERNEL,
	a: KERNEL_SHADE,
	o: KERNEL_DARK,
	S: C.sandLight,
	s: C.sand,
	z: C.sandShade,
	b: C.amber,
	B: KERNEL_DARK,
	c: C.sandShade,
};

/** Where the sheaf sits in its space, by its top left pixel. */
const SHEAF_AT = { x: 4, y: 3 };

/** The whiskers on each ear's tip, drawn over the outline: each from the tip outwards, in sheaf pixels. */
const AWNS = [
	[9, -1, 8, -2],
	[10, -1, 11, -2],
	[5, 0, 4, -1],
	[6, 0, 7, -1],
	[13, 0, 12, -1],
	[14, 0, 15, -1],
	[1, 3, 0, 2],
	[2, 3, 3, 2],
	[17, 3, 16, 2],
	[18, 3, 19, 2],
];

/**
 * The hoe's stone blade, lashed to the top of its handle and hanging down to the left.
 * Keys: F/f/x stone lit, mid and shaded; b lashing.
 */
const HOE_BLADE = ['...bb', '..Fbb', '.Ffx.', 'Ffx..', 'ffx..', 'fx...'];

/** @type {Readonly<Record<string, Colour>>} */
const HOE_BLADE_COLOURS = {
	F: C.stoneLight,
	f: C.stone,
	x: C.stoneShade,
	b: C.sand,
};

/** The hoe's handle, from the blade at the top left to its end at the bottom right, behind the sheaf. */
const HOE = { x0: 6, y0: 4, x1: 25, y1: 27 };

/**
 * Space 2, farming: a sheaf of wheat tied with straw, a wooden hoe leaning behind it.
 * @param {Canvas} canvas
 */
function drawFarming(canvas) {
	line(canvas, HOE.x0, HOE.y0, HOE.x1, HOE.y1, C.timberLight);
	line(canvas, HOE.x0 + 1, HOE.y0, HOE.x1 + 1, HOE.y1, C.timber);
	paint(canvas, HOE.x0 - 4, HOE.y0 - 1, HOE_BLADE, HOE_BLADE_COLOURS);
	paint(canvas, SHEAF_AT.x, SHEAF_AT.y, SHEAF, SHEAF_COLOURS);
	outline(canvas, C.ink);
	for (const [x0, y0, x1, y1] of AWNS) {
		line(
			canvas,
			SHEAF_AT.x + x0,
			SHEAF_AT.y + y0,
			SHEAF_AT.x + x1,
			SHEAF_AT.y + y1,
			KERNEL_LIGHT
		);
	}
}

/** The ewe's wool and black face, and the lamb's whiter wool and pale face. */
const WOOL_LIGHT = C.creamLight;
const WOOL = C.cream;
const WOOL_SHADE = C.creamShade;
const FACE = mix(C.wood, C.stoneShade, 0.35);
const FACE_LIGHT = mix(C.stoneShade, C.stone, 0.3);
const LAMB_FACE = mix(C.cream, C.skin, 0.3);
const LAMB_FACE_SHADE = mix(C.creamShade, C.skinShade, 0.3);

/**
 * A black-faced ewe facing right, her head lowered to her lamb, which looks up at her.
 * Keys: W/w/c wool lit, mid, shaded; d/D face; e eye; L/l/m lamb wool; f/F lamb face; k ink.
 */
const BREEDING = [
	'..............................',
	'..............................',
	'......ww..ww..ww..............',
	'....wwWWwwWWwwWWw.............',
	'...wWWWWWWWWWWWWWw............',
	'...wWWwwWWWWwwWWWw............',
	'..wWWWWWWWWWWWWWWw.dd.........',
	'..wWWWWWwwWWWWWWWwddd.........',
	'..wWWwwWWWWWWwwWwdDDdd........',
	'..wWWWWWWWWWWWWWwDDddddd......',
	'..wwWWWWwwWWWWWwwdDedddd......',
	'..cwwWWWWWWWWwwwcddddddd......',
	'..cwwwwwwwwwwwwwc.ddddddd.....',
	'...ccwwwccwwccwcc..ddddd......',
	'....cc.ccc..cc.cc...ddd.......',
	'....dd.dd...dd.dd.............',
	'....dd.dd...dd.dd.............',
	'....dd.dd...dd.dd..fff........',
	'....dd.dd...dd.dd.fffffFF.l...',
	'....dd.dd...dd.dd.fkffLlLlLl..',
	'....kk.kk...kk.kk.ffffLLLLLL..',
	'...................fFmLLLLLl..',
	'....................mLLLLLLm..',
	'....................mmLLLLmm..',
	'.....................mmllllm..',
	'......................ff.ff...',
	'......................ff.ff...',
	'......................kk.kk...',
	'..............................',
	'..............................',
];

/** @type {Readonly<Record<string, Colour>>} */
const BREEDING_COLOURS = {
	W: WOOL_LIGHT,
	w: WOOL,
	c: WOOL_SHADE,
	d: FACE,
	D: FACE_LIGHT,
	e: C.amber,
	L: C.white,
	l: WOOL_LIGHT,
	m: WOOL,
	f: LAMB_FACE,
	F: LAMB_FACE_SHADE,
	k: C.ink,
};

/**
 * Space 3, breeding: a ewe and her lamb.
 * @param {Canvas} canvas
 */
function drawBreeding(canvas) {
	paint(canvas, 0, 0, BREEDING, BREEDING_COLOURS);
	outline(canvas, C.ink);
}

/** The jar's glass, the syrup and fruit inside it, and its cloth cap and twine. */
const GLASS_LIGHT = mix(C.daySky6, C.white, 0.5);
const GLASS = mix(C.daySky5, C.daySky6, 0.5);
const GLASS_SHADE = mix(C.daySky3, C.daySky4, 0.5);
const SYRUP = mix(C.brickRedShade, C.ink, 0.35);
const CLOTH_LIGHT = C.creamLight;
const CLOTH = C.cream;
const CLOTH_SHADE = C.creamShade;

/**
 * The jar: its cloth cap tied with twine, the bow on the right, and the glass full of syrup.
 * Keys: C/c/x cloth lit, mid, shaded; t/T twine; g/G/n glass; y syrup.
 */
const JAR = [
	'..............................',
	'..............................',
	'..........CCCCCC..............',
	'.......CCCCCCCCCcc............',
	'.....CCCCCCCCCCCcccc..........',
	'....CCCCCCCCCCCCccccc.........',
	'...tttttttttttttttttttTt......',
	'...CcCcCcCcCcCcCcCcCcxtT......',
	'...x.x.x.x.x.x.x.x.x.x.T......',
	'.....gggggggggggggggn.........',
	'....gGyyyyyyyyyyyyyynn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...gGyyyyyyyyyyyyyyyyn........',
	'...ngyyyyyyyyyyyyyyynn........',
	'....nnnnnnnnnnnnnnnnn.........',
	'..............................',
	'..............................',
	'..............................',
	'..............................',
];

/** @type {Readonly<Record<string, Colour>>} */
const JAR_COLOURS = {
	C: CLOTH_LIGHT,
	c: CLOTH,
	x: CLOTH_SHADE,
	t: C.timberLight,
	T: C.timber,
	g: GLASS_LIGHT,
	G: GLASS,
	n: GLASS_SHADE,
	y: SYRUP,
};

/** One round fruit, lit from the top left. Keys: R/r/d lit, mid and shaded. */
const FRUIT = ['.rr.', 'rRrr', 'rrrd', '.dd.'];

/** @type {Readonly<Record<string, Colour>>} */
const FRUIT_COLOURS = {
	R: C.brickRedLight,
	r: C.brickRed,
	d: C.brickRedShade,
};

/** Where each fruit sits in the jar, by its top left pixel: three staggered rows. */
const FRUITS = [
	[5, 11],
	[9, 10],
	[13, 11],
	[17, 10],
	[7, 15],
	[11, 15],
	[15, 15],
	[5, 19],
	[9, 19],
	[13, 20],
	[17, 19],
];

/** The glass's highlight: a white streak down the left of the jar. */
const GLINT = { x: 6, top: 11, bottom: 17 };

/**
 * Space 4, preservation: a glass jar of red fruit under a cloth cap tied with twine.
 * @param {Canvas} canvas
 */
function drawPreservation(canvas) {
	paint(canvas, 0, 0, JAR, JAR_COLOURS);
	for (const [x, y] of FRUITS) {
		paint(canvas, x, y, FRUIT, FRUIT_COLOURS);
	}
	outline(canvas, C.ink);
	for (let y = GLINT.top; y <= GLINT.bottom; y++) {
		set(canvas, GLINT.x, y, C.white);
	}
}

/** The burlap sack and its weave, the dark soil with its lit crest, the seedling, and the pale granules. */
const BURLAP_LIGHT = mix(C.sand, C.stoneLight, 0.3);
const BURLAP = mix(C.sandShade, C.stoneMid, 0.3);
const BURLAP_SHADE = mix(C.timberLight, C.stoneShade, 0.3);
const WEAVE_LIGHT = mix(BURLAP_LIGHT, BURLAP_SHADE, 0.45);
const WEAVE = mix(BURLAP, BURLAP_SHADE, 0.6);
const WEAVE_SHADE = mix(BURLAP_SHADE, C.wood, 0.45);
const SOIL_LIGHT = C.floorLight;
const SOIL = C.floor;
const SOIL_SHADE = C.floorShade;
const GRANULE = C.ghostLight;
const GRANULE_SHADE = C.ghost;

/**
 * A burlap sack lying on a mound of soil, its neck tied with twine and its open mouth turned to a big seedling.
 * Keys: B/b/s burlap lit, mid, shaded; X/x/w weave lit, mid, shaded; t twine; R/r rim; m mouth; p granule; L/S/z soil;
 * G/g/n leaves lit, mid, shaded; v midrib; e/E stem.
 */
const FERTILIZATION = [
	'..............................',
	'..............................',
	'..............................',
	'.......................GGGG...',
	'.............GGGG.....Gggggv..',
	'.............GvgggGG..Gggvgn..',
	'.............GgvvgggG.Ggvggn..',
	'..............GggvgggGgvggn...',
	'...............Gnggvvgvnn.....',
	'.................GnnveE.......',
	'.....................eE.......',
	'..B..................eE.......',
	'..BBXBB..............eE.......',
	'..BbxbbXB....RR......eE.......',
	'..XxxxxxwX..RRRR.....eE.......',
	'..BbxbbxssXtRmmR.....eE.......',
	'..BbxbbxsswtRmpR.....eE.......',
	'..XxxxxxwwwtRmmr.....eE.......',
	'..Bbxbbxsswtrpmr.....eE.......',
	'..Bbxbbxsswtrmpr.....eE.......',
	'..Xxxxxxwwwtrmmr.....eE.......',
	'..Bbxbbxss..rrrr.....eE.......',
	'..Bswssws....rr......eE.......',
	'..B.LLLLLLLLLLLLLLLLLeELLLL...',
	'...LSSSSSSzSSSSSSSSSSeEzSSSS..',
	'..LSSSzSSSSSSSSSSSzSSSSSSSSS..',
	'..SSSSSSSSSSSzSSSSSSSSSSSSzS..',
	'..zzzzzzzzzzzzzzzzzzzzzzzzzz..',
	'..............................',
	'..............................',
];

/** @type {Readonly<Record<string, Colour>>} */
const FERTILIZATION_COLOURS = {
	B: BURLAP_LIGHT,
	b: BURLAP,
	s: BURLAP_SHADE,
	X: WEAVE_LIGHT,
	x: WEAVE,
	w: WEAVE_SHADE,
	t: C.timber,
	R: BURLAP_LIGHT,
	r: BURLAP_SHADE,
	m: C.wood,
	p: GRANULE,
	L: SOIL_LIGHT,
	S: SOIL,
	z: SOIL_SHADE,
	G: C.grassLight,
	g: C.grass,
	n: C.grassShade,
	v: C.forestFloor,
	e: C.grass,
	E: C.grassShade,
};

/** The granules arcing from the sack's mouth down to the seedling's foot, drawn over the outline. */
const GRANULES = [
	[16, 14],
	[17, 13],
	[18, 13],
	[19, 14],
	[19, 16],
	[19, 18],
	[19, 20],
	[18, 22],
	[19, 22],
];

/**
 * Space 5, fertilization: a seedling in soil, granules pouring from a sack's mouth onto it.
 * @param {Canvas} canvas
 */
function drawFertilization(canvas) {
	paint(canvas, 0, 0, FERTILIZATION, FERTILIZATION_COLOURS);
	outline(canvas, C.ink);
	GRANULES.forEach(([x, y], index) => {
		set(canvas, x, y, index % 3 === 2 ? GRANULE_SHADE : GRANULE);
	});
}

/** The printer's metal, and the cake's sponge, cream filling and icing, on a white plate. */
const METAL_LIGHT = C.snowShade;
const METAL = C.stoneLight;
const METAL_SHADE = C.stone;
const METAL_DARK = C.stoneShade;
const SPONGE = mix(C.timberLight, C.sand, 0.35);
const SPONGE_SHADE = C.timberLight;
const FILLING = C.creamLight;
const ICING = mix(C.brickRedLight, C.white, 0.45);
const ICING_SHADE = mix(C.brickRedLight, C.cream, 0.2);
const PLATE = C.white;
const PLATE_SHADE = C.snowShade;

/**
 * A printer head on its rail, its teal-lit nozzle laying the icing on a layered cake on a plate.
 * Keys: R/r rail; M/m/s/S/x metal; T/t teal; P/p icing; F filling; O/o sponge; W/w plate.
 */
const FOOD_PRINTING = [
	'..............................',
	'..............................',
	'..RRRRRRRRRRRRRRRRRRRR........',
	'..rrrrrrrrrrrrrrrrrrrr........',
	'......MMMMMMMMMMs.............',
	'......MmmmmmmmmmsS............',
	'......MmmmmmmmmmsS............',
	'......TTTTTTTTTTts............',
	'......mmmmmmmmmmsx............',
	'.........Mmmms................',
	'..........Mms.................',
	'..........mx..................',
	'..........Tt..................',
	'..........P...................',
	'..........P...................',
	'....PPPPPPPP..................',
	'....pppppppp..................',
	'....OOOOOOOOOOOOOOOOOOOO......',
	'....OooOooOooOooOooOoooO......',
	'....FFFFFFFFFFFFFFFFFFFF......',
	'....OOOOOOOOOOOOOOOOOOOO......',
	'....OooOooOooOooOooOoooO......',
	'....FFFFFFFFFFFFFFFFFFFF......',
	'....OOOOOOOOOOOOOOOOOOOO......',
	'....ooooooooooooooooooooo.....',
	'..WWWWWWWWWWWWWWWWWWWWWWWWW...',
	'..wwwwwwwwwwwwwwwwwwwwwwww....',
	'..............................',
	'..............................',
	'..............................',
];

/** @type {Readonly<Record<string, Colour>>} */
const FOOD_PRINTING_COLOURS = {
	R: METAL_LIGHT,
	r: METAL_SHADE,
	M: METAL_LIGHT,
	m: METAL,
	s: METAL_SHADE,
	S: METAL_DARK,
	x: METAL_DARK,
	T: C.tealLight,
	t: C.teal,
	P: ICING,
	p: ICING_SHADE,
	F: FILLING,
	O: SPONGE,
	o: SPONGE_SHADE,
	W: PLATE,
	w: PLATE_SHADE,
};

/** The nozzle's tip, and the pixels either side of it where its teal light spills onto the violet. */
const NOZZLE = { x: 10, y: 12 };
const NOZZLE_GLOW = [
	[-1, 0],
	[2, 0],
	[-1, 1],
	[2, 1],
];

/**
 * Blends a light colour into the improved spaces' ground at one row, for glow drawn on the empty ground.
 * @param {number} y
 * @param {Colour} colour
 * @param {number} t - How far towards the light
 * @returns {Colour}
 */
function onGround(y, colour, t) {
	const bands = GROUND.improved;
	const band = Math.floor((y * bands.length) / INSIDE);
	return mix(bands[band], colour, t);
}

/**
 * Space 6, food printing: a teal-lit printer nozzle laying down a layered cake.
 * @param {Canvas} canvas
 */
function drawFoodPrinting(canvas) {
	paint(canvas, 0, 0, FOOD_PRINTING, FOOD_PRINTING_COLOURS);
	outline(canvas, C.ink);
	for (const [dx, dy] of NOZZLE_GLOW) {
		set(
			canvas,
			NOZZLE.x + dx,
			NOZZLE.y + dy,
			onGround(NOZZLE.y + dy, C.tealLight, 0.45)
		);
	}
}

/**
 * Draws the farms inspiration tile.
 * @returns {Canvas} A 192×32 canvas.
 */
export function draw() {
	return drawInspirationTile([
		drawHunting,
		drawFarming,
		drawBreeding,
		drawPreservation,
		drawFertilization,
		drawFoodPrinting,
	]);
}
