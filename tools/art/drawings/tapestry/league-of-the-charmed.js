// League of the Charmed: four adventurers sitting round a campfire in a forest clearing at night, each holding up a charm that glows its own colour.
import {
	createCanvas,
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The forest's ground line, the clearing's first row, and the fire's centre. */
const TREES = 31;
const CLEARING = 37;
const FIRE = { x: 32, y: 50 };

/**
 * One adventurer and the charm they hold up.
 * @typedef {Object} Adventurer
 * @property {number} cx - The body's centre column
 * @property {number} base - The row they sit on
 * @property {readonly string[]} head - The head's sprite, 7 wide
 * @property {Record<string, Colour>} colours - The head's colours
 * @property {Colour} clothes - The tunic or robe
 * @property {-1 | 0 | 1} facing - Turned left, towards the viewer, or right
 * @property {[number, number]} hand - Where the raised hand is
 * @property {Colour[]} charm - The charm's lit, mid and shaded colours
 */

/** The wizard's pointed hat and white beard, facing the viewer. */
const WIZARD = [
	'..b....',
	'..bb...',
	'..bbb..',
	'.bbbbb.',
	'bbBbbbb',
	'.SSSSS.',
	'.SeSeS.',
	'.WWWWW.',
	'..WWW..',
	'...W...',
];

/** The knight's helmet with a red plume and a dark visor slit, facing the viewer. */
const KNIGHT = [
	'..rr...',
	'.rr....',
	'.ggggg.',
	'gGggggg',
	'gGggggg',
	'gkkkkkg',
	'gGggggg',
	'.ggggg.',
	'..SSS..',
];

/** The ranger's green hood, in profile facing right. */
const RANGER = [
	'..hhh..',
	'.hhhhh.',
	'hhhhhS.',
	'hhhSSeS',
	'hhhSSSS',
	'hhhhSs.',
	'.hhhh..',
];

/** The dwarf's iron cap and great red beard, in profile facing right. */
const DWARF = [
	'..ggg..',
	'.ggggg.',
	'gggggg.',
	'gSSSeS.',
	'BBSSSSs',
	'BBBBBBB',
	'.BBBBB.',
	'..BBB..',
];

/** The party, far side first. */
/** @type {Adventurer[]} */
const PARTY = [
	{
		cx: 23,
		base: 44,
		head: WIZARD,
		colours: { b: C.roofLight, B: C.gold, S: C.skin, e: C.wood, W: C.snow },
		clothes: C.roof,
		facing: 0,
		hand: [16, 25],
		charm: [C.arcaneLight, C.arcane, C.arcaneShade],
	},
	{
		cx: 41,
		base: 44,
		head: KNIGHT,
		colours: {
			r: C.brickRed,
			g: C.stone,
			G: C.stoneLight,
			k: C.ink,
			S: C.skin,
		},
		clothes: C.daySea2,
		facing: 0,
		hand: [48, 25],
		charm: [C.brickRedLight, C.brickRed, C.brickRedShade],
	},
	{
		cx: 8,
		base: 57,
		head: RANGER,
		colours: { h: C.pine, S: C.skin, s: C.skinShade, e: C.wood },
		clothes: C.pineShade,
		facing: 1,
		hand: [12, 37],
		charm: [mix(C.grassLight, C.white, 0.45), C.grassLight, C.grassShade],
	},
	{
		cx: 56,
		base: 57,
		head: DWARF,
		colours: {
			g: C.stoneShade,
			S: C.skin,
			s: C.skinShade,
			e: C.wood,
			B: C.amber,
		},
		clothes: C.brickRedShade,
		facing: -1,
		hand: [52, 37],
		charm: [C.tealLight, C.teal, C.tealShade],
	},
];

/**
 * Draws the League of the Charmed scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(647);

	drawSky(layer, {
		time: 'night',
		horizon: TREES,
		random,
		stars: 30,
		starRows: 20,
		moon: { x: 50, y: 7 },
	});
	const forest = drawForest(layer, random);
	drawClearing(layer, random);

	drawLogs(scene);
	for (const adventurer of PARTY) {
		drawAdventurer(scene, adventurer);
	}
	drawFirewood(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	glow(scene, {
		x: FIRE.x,
		y: FIRE.y - 3,
		radius: 26,
		colour: C.amber,
		strength: 0.5,
		steps: 4,
		skip: [C.ink, ...forest],
	});
	drawFlames(scene);
	for (const adventurer of PARTY) {
		drawCharm(scene, adventurer);
	}
	return scene;
}

/**
 * The forest round the clearing: two rows of pines taken from the terrain part and sunk into the night,
 * the far row bluer and the near row nearly black, over dark undergrowth.
 * @param {Canvas} layer
 * @param {() => number} random
 * @returns {Colour[]} The colours the trees are painted in, which the firelight leaves dark.
 */
function drawForest(layer, random) {
	const trees = [C.pineLight, C.pine, C.pineShade, C.wood];
	/** @type {Set<Colour>} */
	const used = new Set();
	/** @type {[number, Colour, number][]} */
	const rows = [
		[TREES - 6, C.nightSky3, 0.66],
		[TREES + 1, C.ink, 0.6],
	];
	for (const [top, into, amount] of rows) {
		const forest = createCanvas(64, 64);
		drawTerrain(forest, { kind: 'forest', top, random });
		for (let y = 0; y < CLEARING; y++) {
			for (let x = 0; x < 64; x++) {
				const colour = forest.p[y * 64 + x];
				if (colour && trees.includes(colour)) {
					const dark = mix(colour, into, amount);
					set(layer, x, y, dark);
					used.add(dark);
				}
			}
		}
	}
	const undergrowth = mix(C.forestFloorShade, C.ink, 0.6);
	rect(layer, 0, TREES + 1, 64, CLEARING - TREES - 1, undergrowth);
	used.add(undergrowth);
	return [...used];
}

/**
 * The clearing's grass, dark at the edges, with a few tufts.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawClearing(layer, random) {
	const grass = mix(C.forestFloor, C.nightSky2, 0.55);
	const shade = mix(C.forestFloorShade, C.nightSky1, 0.55);
	const tuft = mix(C.forestFloorLight, C.nightSky2, 0.45);
	for (let y = CLEARING; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const edge = y > 58 || (y > 54 && (x + y) % 2 === 0);
			set(layer, x, y, edge ? shade : grass);
		}
	}
	for (let i = 0; i < 26; i++) {
		const x = Math.floor(random() * 64);
		const y = CLEARING + 1 + Math.floor(random() * 25);
		set(layer, x, y, tuft);
		set(layer, x + 1, y - 1, tuft);
	}
}

/**
 * The fallen log the two far adventurers sit on, and the stumps of the near two.
 * @param {Canvas} scene
 */
function drawLogs(scene) {
	for (let x = 13; x <= 51; x++) {
		set(scene, x, 44, C.timberLight);
		set(scene, x, 45, C.timber);
		set(scene, x, 46, x % 5 === 0 ? C.timber : C.timberShade);
	}
	for (const x of [4, 53]) {
		paint(
			scene,
			x,
			57,
			[
				'.lllll.',
				'lltttll',
				'.lllll.',
				'wwwwwss',
				'wwwwwss',
				'wwwwwss',
				'wwwwwss',
			],
			{ l: C.timberLight, t: C.timber, w: C.timber, s: C.timberShade }
		);
	}
}

/**
 * An adventurer sitting by the fire, one arm on the knee and the other raised high with a charm.
 * @param {Canvas} scene
 * @param {Adventurer} adventurer
 */
function drawAdventurer(
	scene,
	{ cx, base, head, colours, clothes, facing, hand }
) {
	const shade = mix(clothes, C.ink, 0.35);
	const top = base - 9;
	// The torso and belt.
	for (let y = top; y < base - 1; y++) {
		for (let i = cx - 3; i <= cx + 3; i++) {
			const far = facing > 0 ? i === cx - 3 : i === cx + 3;
			set(scene, i, y, y === base - 4 ? C.wood : far ? shade : clothes);
		}
	}
	// The legs: bent towards the viewer, or stretched out towards the fire.
	if (facing === 0) {
		rect(scene, cx - 3, base - 1, 3, 3, C.roofShade);
		rect(scene, cx + 1, base - 1, 3, 3, C.roofShade);
		rect(scene, cx - 3, base + 2, 3, 1, C.wood);
		rect(scene, cx + 1, base + 2, 3, 1, C.wood);
	} else {
		for (let i = 0; i < 6; i++) {
			set(scene, cx + facing * (2 + i), base - 1, C.roofShade);
			set(scene, cx + facing * (2 + i), base, C.roofShade);
		}
		rect(
			scene,
			cx + facing * 8 - (facing > 0 ? 0 : 1),
			base - 3,
			2,
			4,
			C.wood
		);
	}
	// The raised arm: from the shoulder to the fist, two pixels thick.
	const shoulder = hand[0] < cx ? cx - 3 : cx + 3;
	line(scene, shoulder, top + 1, hand[0], hand[1] + 1, clothes);
	line(
		scene,
		shoulder + (hand[0] < cx ? 1 : -1),
		top + 1,
		hand[0] + (hand[0] < cx ? 1 : -1),
		hand[1] + 1,
		shade
	);
	set(scene, hand[0], hand[1], C.skin);
	set(scene, hand[0] + (hand[0] < cx ? 1 : -1), hand[1], C.skin);
	// The other hand rests on the knee.
	set(scene, hand[0] < cx ? cx + 4 : cx - 4, base - 2, C.skin);
	paint(scene, cx - 3, top - head.length, head, colours, {
		mirror: facing < 0,
	});
}

/**
 * The fire's ring of stones and its crossed logs.
 * @param {Canvas} scene
 */
function drawFirewood(scene) {
	for (let i = 0; i < 14; i++) {
		const a = (i / 14) * Math.PI * 2;
		const x = Math.round(FIRE.x + Math.cos(a) * 8);
		const y = Math.round(FIRE.y + 2 + Math.sin(a) * 3);
		set(scene, x, y, y > FIRE.y + 2 ? C.stoneLight : C.stone);
		set(scene, x + 1, y, C.stoneShade);
	}
	line(scene, FIRE.x - 6, FIRE.y + 3, FIRE.x + 5, FIRE.y - 1, C.timberLight);
	line(scene, FIRE.x - 6, FIRE.y + 4, FIRE.x + 5, FIRE.y, C.timberShade);
	line(scene, FIRE.x + 6, FIRE.y + 3, FIRE.x - 5, FIRE.y - 1, C.timber);
	line(scene, FIRE.x + 6, FIRE.y + 4, FIRE.x - 5, FIRE.y, C.timberShade);
}

/**
 * The flames, tall and forked, and a few sparks rising.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	const rows = [
		'.....r......',
		'....rr...r..',
		'...rar..rr..',
		'...rar.rar..',
		'..raar.raar.',
		'..raggaraar.',
		'.raagggaagar',
		'.ragglgggar.',
		'.raglllggar.',
		'raggllllgaar',
		'.ragllllgar.',
		'..rggllgar..',
	];
	paint(scene, FIRE.x - 6, FIRE.y - 11, rows, {
		r: C.brickRedLight,
		a: C.amber,
		g: C.gold,
		l: C.lampGlow,
	});
	for (const [x, y] of [
		[30, 34],
		[35, 32],
		[33, 29],
		[28, 31],
	]) {
		set(scene, x, y, C.gold);
	}
}

/**
 * A charm held up above the fist: a gem with a bright heart on a short brass mount, a glint above it,
 * and its own coloured glow.
 * @param {Canvas} scene
 * @param {Adventurer} adventurer
 */
function drawCharm(scene, { hand, charm }) {
	const [lit, mid, shade] = charm;
	const x = hand[0];
	const y = hand[1] - 4;
	glow(scene, {
		x,
		y,
		radius: 10,
		colour: mid,
		strength: 0.55,
		steps: 2,
		skip: [C.ink, C.skin],
	});
	paint(
		scene,
		x - 3,
		y - 3,
		[
			'...k...',
			'..kmk..',
			'.kmllk.',
			'kmlllsk',
			'.kmlsk.',
			'..ksk..',
			'...k...',
		],
		{ k: C.ink, m: mid, l: lit, s: shade }
	);
	set(scene, x, y + 4, C.brass);
	for (const [dx, dy] of [
		[0, -5],
		[-5, 0],
		[5, 0],
	]) {
		set(scene, x + dx, y + dy, C.white);
	}
}
