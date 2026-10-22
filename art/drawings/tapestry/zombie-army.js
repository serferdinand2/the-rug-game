// Zombie Army: a shambling horde of zombies, arms outstretched, marching out of a graveyard of headstones and crosses under a huge green moon.
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
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, and the green moon's centre and radius. */
const HORIZON = 36;
const MOON = { x: 15, y: 13, r: 10 };

/** The green moon's face, its seas and the light it throws. */
const MOON_FACE = mix(C.moon, C.ghost, 0.55);
const MOON_SEA = mix(C.moonRim, C.ghostShade, 0.5);
const MOONLIGHT = mix(C.ghost, C.grassLight, 0.4);

/** Headstone granite: moonlit edge, face and shade. */
const STONE_LIT = mix(C.stoneLight, C.ghost, 0.25);
const STONE = mix(C.stoneMid, C.nightSky4, 0.3);
const STONE_SHADE = mix(C.stoneShade, C.nightSky2, 0.45);

/** Rotting skin, and the colours of the zombies' rags, one set per zombie. */
const SKIN = mix(C.grassLight, C.stone, 0.45);
const SKIN_SHADE = mix(C.grassShade, C.stoneShade, 0.5);
const RAGS = [
	[mix(C.roofLight, C.stone, 0.3), C.roof],
	[mix(C.timber, C.stone, 0.25), C.timberShade],
	[mix(C.brickRed, C.stoneShade, 0.45), C.brickRedShade],
	[mix(C.nightWaveDeep, C.stone, 0.35), mix(C.nightSea2, C.stoneShade, 0.3)],
	[mix(C.creamShade, C.stone, 0.3), C.stoneShade],
	[mix(C.pine, C.stone, 0.4), C.pineShade],
];

/** Three ways to shamble, facing right: h hair, g skin, G skin shade, e eye socket, m mouth, c rags, C rag shade, p legs, f feet. */
const ZOMBIES = [
	[
		'...hhhh.....',
		'..hhgggg....',
		'..hgggeg....',
		'...gggGg....',
		'....gGmg....',
		'....cc......',
		'...cccgggggg',
		'...ccCGGGGGg',
		'...cccc....g',
		'...cCcc.....',
		'...ccCc.....',
		'...c.cc.....',
		'...pppp.....',
		'...pp.pp....',
		'..pp...pp...',
		'..pp....p...',
		'.ff.....ff..',
	],
	[
		'....hhh.....',
		'...hgggh....',
		'...ggegg....',
		'...gGggg....',
		'....gmg.....',
		'...ccc......',
		'..cccCgggg..',
		'..cccCGGGgg.',
		'..gccc....g.',
		'..gCcc......',
		'..g.cC......',
		'..G.cc.c....',
		'...ppp......',
		'...p.pp.....',
		'..pp..p.....',
		'..p...pp....',
		'.ff...ff....',
	],
	[
		'............',
		'....hhh.....',
		'...hggggh...',
		'...gggeg....',
		'....gGmg....',
		'...ccc......',
		'..ccccggggg.',
		'..cCcCGGGGgg',
		'..cccc....g.',
		'..cCcc......',
		'...c.c......',
		'...pppp.....',
		'...pp.pp....',
		'..pp...pp...',
		'..p.....p...',
		'.ff.....ff..',
		'............',
	],
];

/** The horde's leader, nearest the viewer and larger: the same keys, plus r for a wound. */
const LEADER = [
	'....hhhhh.......',
	'...hhhhhhh......',
	'..hhhgggggg.....',
	'...hggggggg.....',
	'...hgggeegg.....',
	'....gggeeGg.....',
	'....gggggGG.....',
	'.....gGmmmG.....',
	'......gmmG......',
	'......gGG.......',
	'....ccccCc......',
	'...cccccCgggggg.',
	'...ccccrCGGGGGgg',
	'...cccrrC....g.g',
	'...ccccCC.....g.',
	'...ccccCC.......',
	'...cCccCc.......',
	'...c.cC.c.......',
	'...pppppp.......',
	'...ppp.ppp......',
	'..ppp...pp......',
	'..pp.....pp.....',
	'..pp.....pp.....',
	'.ppp......pp....',
	'.fff......fff...',
];

/**
 * Draws the Zombie Army scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1031);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 24,
		starRows: 26,
	});
	sicken(layer);
	drawMoon(layer);
	drawCrypt(layer);
	drawGround(layer, random);

	// The graveyard stands behind the horde, so it gets its own outline.
	const graves = createCanvas(64, 64);
	drawFence(graves);
	for (const [
		x,
		y,
		kind,
	] of /** @type {[number, number, 'round' | 'cross'][]} */ ([
		[2, 44, 'round'],
		[11, 41, 'cross'],
		[21, 43, 'round'],
		[30, 40, 'cross'],
		[40, 42, 'round'],
		[50, 40, 'cross'],
		[58, 43, 'round'],
	])) {
		headstone(graves, x, y, kind);
	}
	outline(graves, C.ink);

	// The horde: a back rank among the headstones, a middle rank, and the leader striding out in front.
	for (const [x, y, shape, rags] of [
		[1, 49, 2, 1],
		[16, 48, 1, 2],
		[50, 49, 0, 5],
		[10, 57, 0, 0],
		[24, 56, 2, 3],
	]) {
		drawZombie(scene, x, y, ZOMBIES[shape], rags);
	}
	drawZombie(scene, 36, 63, LEADER, 4);
	drawOpenGrave(scene);
	// A headstone knocked askew in the near corner.
	paint(
		scene,
		55,
		55,
		[
			'...ll.',
			'..lsss',
			'.lsssd',
			'.lsssd',
			'lsssd.',
			'lsssd.',
			'lssd..',
			'ddd...',
			'dd....',
		],
		{ l: STONE_LIT, s: STONE, d: STONE_SHADE }
	);
	outline(scene, C.ink);
	underlay(scene, graves);
	underlay(scene, layer);
	drawEyes(scene);
	drawMist(scene);
	return scene;
}

/**
 * Tints the night a sickly green in three bands, strongest low in the sky.
 * @param {Canvas} layer
 */
function sicken(layer) {
	for (let y = 0; y <= HORIZON; y++) {
		const t = [0.15, 0.25, 0.35][
			Math.min(2, Math.floor((y / HORIZON) * 3))
		];
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour && colour !== C.white) {
				set(layer, x, y, mix(colour, C.ghostShade, t));
			}
		}
	}
}

/**
 * The huge green moon, with darker seas on its face and a green halo.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	glow(layer, {
		x: cx,
		y: cy,
		radius: r + 10,
		colour: C.ghost,
		strength: 0.3,
		steps: 3,
	});
	for (let y = cy - r; y <= cy + r; y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d > r) {
				continue;
			}
			const sea =
				Math.hypot(x - cx - 3, y - cy + 3) < 2.8 ||
				Math.hypot(x - cx + 4, y - cy - 2) < 2.4 ||
				Math.hypot(x - cx - 1, y - cy - 6) < 1.6;
			set(layer, x, y, d > r - 1 || sea ? MOON_SEA : MOON_FACE);
		}
	}
}

/**
 * A crypt on the skyline to the right, with a cross on its gable, and a far line of low hills.
 * @param {Canvas} layer
 */
function drawCrypt(layer) {
	const hill = mix(C.headland, C.pineShade, 0.3);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(HORIZON - 2 + Math.sin(x * 0.15) * 1.5);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, hill);
		}
	}
	const dark = mix(C.roofShade, C.ink, 0.3);
	const rim = mix(C.roof, C.ghostShade, 0.4);
	rect(layer, 45, 26, 13, 10, dark);
	for (let j = 0; j < 6; j++) {
		for (let x = 45 + j; x <= 57 - j; x++) {
			set(layer, x, 25 - j, x === 45 + j ? rim : dark);
		}
	}
	rect(layer, 45, 26, 1, 10, rim);
	rect(layer, 50, 29, 3, 7, C.ink);
	// The cross on the gable.
	rect(layer, 51, 15, 1, 6, dark);
	rect(layer, 49, 17, 5, 1, dark);
	set(layer, 51, 15, rim);
	set(layer, 49, 17, rim);
}

/**
 * Dark graveyard earth, its grass picked out in green moonlight near the top.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const grass = mix(C.forestFloorShade, C.nightSky3, 0.4);
	const earth = mix(C.floorShade, C.nightSky2, 0.4);
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y < 50 ? grass : earth;
			if (y === HORIZON + 1) {
				colour = mix(grass, MOONLIGHT, 0.4);
			} else if (y >= 48 && y < 52 && (x + y) % 2 === 0) {
				colour = earth;
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 20; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 2 + Math.floor(random() * 26);
		set(layer, x, y, mix(grass, MOONLIGHT, 0.35));
	}
}

/**
 * A wrought-iron fence along the back of the graveyard, a few railings bent or missing.
 * @param {Canvas} canvas
 */
function drawFence(canvas) {
	const iron = mix(C.roofShade, C.ink, 0.2);
	for (let x = 0; x < 64; x += 3) {
		if (x === 24 || x === 27) {
			continue;
		}
		const lean = x === 39 ? 1 : 0;
		line(canvas, x, 41, x + lean, 34, iron);
		set(canvas, x + lean, 33, STONE_LIT);
	}
	line(canvas, 0, 36, 22, 36, iron);
	line(canvas, 29, 36, 63, 36, iron);
}

/**
 * One headstone: a round-topped slab or a stone cross, lit on the left by the moon.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - Bottom row
 * @param {'round' | 'cross'} kind
 */
function headstone(canvas, x, y, kind) {
	const rows =
		kind === 'round'
			? ['.lss.', 'lsssd', 'lsssd', 'lsssd', 'lsssd', 'lsssd', 'ddddd']
			: ['..l..', '..sd.', 'lsssd', '..sd.', '..sd.', '..sd.', '.ddd.'];
	paint(canvas, x, y - rows.length + 1, rows, {
		l: STONE_LIT,
		s: STONE,
		d: STONE_SHADE,
	});
}

/**
 * One zombie standing on its bottom row.
 * @param {Canvas} canvas
 * @param {number} x - Left column
 * @param {number} y - The feet's row
 * @param {readonly string[]} rows - Its sprite
 * @param {number} rags - Which set of rags
 */
function drawZombie(canvas, x, y, rows, rags) {
	const [cloth, clothShade] = RAGS[rags];
	paint(canvas, x, y - rows.length + 1, rows, {
		h: C.wood,
		g: SKIN,
		G: SKIN_SHADE,
		e: C.ink,
		m: C.floorShade,
		c: cloth,
		C: clothShade,
		p: mix(C.stoneShade, C.roofShade, 0.4),
		f: C.wood,
		r: C.brickRedShade,
	});
}

/**
 * A freshly broken grave in the front corner, a rotting hand clawing up out of the earth.
 * @param {Canvas} scene
 */
function drawOpenGrave(scene) {
	const dirt = mix(C.timberShade, C.nightSky3, 0.3);
	const dirtLit = mix(C.timber, MOONLIGHT, 0.25);
	for (let j = 0; j < 4; j++) {
		for (let i = j; i < 14 - j; i++) {
			set(scene, -3 + i, 63 - j, j === 3 || i === j ? dirtLit : dirt);
		}
	}
	paint(
		scene,
		1,
		52,
		[
			'.g.....',
			'.g.g...',
			'.g.g.g.',
			'.ggggg.',
			'gggggG.',
			'.gggG..',
			'..gG...',
			'..gG...',
		],
		{ g: SKIN, G: SKIN_SHADE }
	);
}

/**
 * The zombies' eyes catch the moon: a pale green glint in each socket.
 * @param {Canvas} scene
 */
function drawEyes(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (
				get(scene, x, y) === C.ink &&
				get(scene, x - 1, y) === SKIN &&
				get(scene, x + 1, y) === SKIN &&
				get(scene, x, y - 1) === SKIN
			) {
				set(scene, x, y, C.ghostLight);
			}
		}
	}
}

/**
 * Green grave mist curling round the zombies' feet.
 * @param {Canvas} scene
 */
function drawMist(scene) {
	for (const [top, strength] of [
		[47, 0.3],
		[58, 0.3],
	]) {
		for (let x = 0; x < 64; x++) {
			const y0 = top + Math.round(Math.sin(x * 0.3 + top) * 1.3);
			for (let y = y0; y <= y0 + 2; y++) {
				const behind = get(scene, x, y);
				if (behind) {
					set(scene, x, y, mix(behind, C.ghost, strength));
				}
			}
		}
	}
}
