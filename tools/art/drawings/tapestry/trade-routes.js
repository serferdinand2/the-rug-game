// Trade Routes: a wooden fingerpost at a sunny crossroads, its arms pointing to the sea, the mountains and a far town, with a mule cart and a pack mule setting off.
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
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';
import { drawWheel } from '../../parts/wheel.js';
import { drawFigure } from '../../parts/figures.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The horizon row, the crossroads' centre, and the signpost's column and foot. */
const HORIZON = 34;
const JX = 38;
const JY = 49;
const POST = 24;
const FOOT = 59;

/**
 * Draws the Trade Routes scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(739);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawDistance(layer);
	drawTerrain(layer, { kind: 'grassland', top: HORIZON + 1, random });
	drawRoads(layer);
	drawFarCart(layer);

	// The travellers on the side roads stand behind the signpost, so they get their own outline.
	const traffic = createCanvas(64, 64);
	drawMuleCart(traffic);
	drawPackMule(traffic);
	outline(traffic, C.ink);
	drawWheel(traffic, { x: 18, y: 45, r: 4, spokes: 6 });

	drawSignpost(scene);
	outline(scene, C.ink);
	underlay(scene, traffic);
	underlay(scene, layer);
	drawIcons(scene);
	return scene;
}

/**
 * Where the roads lead, along the horizon: the sea with a sail on the left, a walled town on a hill ahead, and mountains on the right.
 * @param {Canvas} layer
 */
function drawDistance(layer) {
	// The sea.
	for (let x = 0; x < 20; x++) {
		set(layer, x, HORIZON - 1, C.daySeaLine);
		set(layer, x, HORIZON, C.daySea1);
	}
	rect(layer, 6, HORIZON - 3, 1, 2, C.white);
	set(layer, 7, HORIZON - 2, C.cloudShade);
	// The mountains.
	const far = mix(C.stoneLight, C.daySky5, 0.4);
	const farShade = mix(C.stone, C.daySky4, 0.4);
	for (let x = 44; x < 64; x++) {
		const height = Math.max(
			0,
			9 - Math.abs(x - 54) * 0.9,
			6 - Math.abs(x - 62) * 0.9
		);
		const top = Math.round(HORIZON - height);
		for (let y = top; y <= HORIZON; y++) {
			const left = x < 54 || (x > 58 && x < 62);
			const colour =
				y - top < 2 && height > 5 ? C.snow : left ? far : farShade;
			set(layer, x, y, colour);
		}
	}
	// The town on its hill, at the end of the far road.
	const hill = mix(C.grassShade, C.daySky4, 0.4);
	for (let x = 33; x <= 45; x++) {
		const top = Math.round(HORIZON - 2.5 + Math.abs(x - 39) * 0.35);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, hill);
		}
	}
	const wall = mix(C.cream, C.daySky4, 0.3);
	const wallShade = mix(C.creamShade, C.daySky4, 0.3);
	rect(layer, 35, HORIZON - 5, 9, 3, wall);
	rect(layer, 42, HORIZON - 5, 2, 3, wallShade);
	rect(layer, 38, HORIZON - 8, 3, 3, wall);
	set(layer, 40, HORIZON - 8, wallShade);
	set(layer, 39, HORIZON - 9, C.brickRed);
	for (const x of [35, 37, 41, 43]) {
		set(layer, x, HORIZON - 6, wall);
	}
}

/**
 * The near road's half-width at one row, widening towards the viewer.
 * @param {number} y
 * @returns {number}
 */
function nearHalf(y) {
	return 3 + (y - JY) * 0.65;
}

/**
 * The crossroads: a road ahead to the far town, roads off to the left and right, and the road towards the viewer.
 * @param {Canvas} layer
 */
function drawRoads(layer) {
	/** @type {[number, number][]} */
	const spots = [];
	// The far road, narrowing and bending as it climbs to the town.
	for (let y = HORIZON + 1; y <= JY; y++) {
		const t = (y - HORIZON) / (JY - HORIZON);
		const centre = 39 + (JX - 39) * t + Math.sin(t * 3.4) * 2.5;
		const half = 0.5 + t * 2.5;
		for (
			let x = Math.round(centre - half);
			x <= Math.round(centre + half);
			x++
		) {
			spots.push([x, y]);
		}
	}
	// The left and right roads, rising gently as they run away to each side.
	for (let x = 0; x < 64; x++) {
		const away = Math.abs(x - JX);
		const centre = JY - away * (x < JX ? 0.2 : 0.15);
		const half = 3 - away * 0.05;
		for (
			let y = Math.round(centre - half);
			y <= Math.round(centre + half);
			y++
		) {
			spots.push([x, y]);
		}
	}
	// The near road, down to the bottom of the picture.
	for (let y = JY; y < 64; y++) {
		const half = nearHalf(y);
		for (let x = Math.round(JX - half); x <= Math.round(JX + half); x++) {
			spots.push([x, y]);
		}
	}
	for (const [x, y] of spots) {
		const rut = (x * 7 + y * 3) % 11 === 0;
		set(
			layer,
			x,
			y,
			rut ? C.sandShade : (x + y * 2) % 9 === 0 ? C.sandLight : C.sand
		);
	}
	// Wheel ruts down the near road.
	for (let y = JY + 2; y < 64; y++) {
		const half = nearHalf(y);
		set(layer, Math.round(JX - half * 0.5), y, C.sandShade);
		set(layer, Math.round(JX + half * 0.5), y, C.sandShade);
	}
}

/**
 * A tiny cart far up the road ahead, heading for the town.
 * @param {Canvas} layer
 */
function drawFarCart(layer) {
	rect(layer, 39, 38, 3, 2, C.timber);
	set(layer, 39, 37, C.cream);
	set(layer, 40, 37, C.cream);
	set(layer, 39, 40, C.wood);
	set(layer, 41, 40, C.wood);
	set(layer, 42, 37, C.stone);
	set(layer, 42, 38, C.stoneShade);
}

/**
 * A mule pulling a two-wheeled cart of sacks and a barrel off down the left road, the carter riding on the front.
 * @param {Canvas} canvas
 */
function drawMuleCart(canvas) {
	paint(
		canvas,
		0,
		38,
		[
			'.e.e..........',
			'.ee...........',
			'MMMM..........',
			'MkMMMMMMMMM...',
			'mm.MMMMMMMMMt.',
			'...MMMMMMMMM.t',
			'...mmmmmmmmm..',
			'...L.L...L.L..',
			'...L.L...L.L..',
			'...H.H...H.H..',
		],
		{
			e: C.stoneShade,
			M: C.stone,
			m: C.stoneShade,
			k: C.ink,
			t: C.stoneShade,
			L: C.stoneShade,
			H: C.wood,
		}
	);
	// The shafts from the cart to the mule's harness.
	line(canvas, 8, 41, 13, 42, C.timberShade);
	// The carter on the front of the cart, then the load: sacks and a barrel.
	paint(
		canvas,
		13,
		34,
		['.hhh.', 'hhhhh', '.SSs.', '.CCC.', 'CCCCS', '.CCC.'],
		{
			h: C.sand,
			S: C.skin,
			s: C.skinShade,
			C: C.pine,
		}
	);
	paint(
		canvas,
		16,
		35,
		['.ss.bbb', 'sssbBBb', 'sssbBBb', 'sssbbbb', 'sssbBBb'],
		{
			s: C.cream,
			b: C.timber,
			B: C.timberLight,
		}
	);
	// The cart's bed: plank sides over the axle.
	for (let y = 40; y <= 43; y++) {
		for (let x = 13; x <= 22; x++) {
			const colour =
				y === 40
					? C.timberLight
					: y === 43
						? C.timberShade
						: (x + y) % 6 === 0
							? C.timber
							: C.timberLight;
			set(canvas, x, y, colour);
		}
	}
	rect(canvas, 13, 42, 10, 1, C.timber);
}

/**
 * A pack mule with laden panniers led off down the right road towards the mountains.
 * @param {Canvas} canvas
 */
function drawPackMule(canvas) {
	paint(
		canvas,
		46,
		38,
		[
			'...RRRR.....e.e',
			'..PRRRRP.....ee',
			'..PPPPPPMMMMMMM',
			't.PPPPPPMMMMMkM',
			'.tPPPPPPMMM..mm',
			'..MMMMMMMMM....',
			'..mmmmmmmm.....',
			'..L.L...L.L....',
			'..L.L...L.L....',
			'..H.H...H.H....',
		],
		{
			R: C.brickRed,
			P: C.amber,
			e: C.timberShade,
			M: C.timberLight,
			m: C.timber,
			k: C.ink,
			t: C.timber,
			L: C.timber,
			H: C.wood,
		}
	);
	drawFigure(canvas, { x: 40, y: 48, facing: 'right', clothes: C.brickRed });
}

/** The signpost's arms: their row, their reach and which way they point. */
const ARMS = [
	{ y: 11, from: POST + 3, to: POST + 27, dir: 1 },
	{ y: 20, from: POST - 22, to: POST - 1, dir: -1 },
	{ y: 29, from: POST + 3, to: POST + 24, dir: 1 },
];

/**
 * The fingerpost: a stout timber post with a capped top, a stone footing and three painted arms with pointed tips.
 * @param {Canvas} scene
 */
function drawSignpost(scene) {
	for (let y = 6; y <= FOOT; y++) {
		set(scene, POST, y, C.timberLight);
		set(scene, POST + 1, y, C.timber);
		set(scene, POST + 2, y, C.timberShade);
	}
	// The cap.
	rect(scene, POST - 1, 5, 5, 1, C.timberShade);
	rect(scene, POST, 4, 3, 1, C.timber);
	set(scene, POST + 1, 3, C.timber);
	// Stones round the foot.
	paint(
		scene,
		POST - 4,
		FOOT - 2,
		['.ab....ab.', 'abbb..abbb', 'bbbcabbbcc'],
		{ a: C.stoneLight, b: C.stone, c: C.stoneShade }
	);
	for (const arm of ARMS) {
		drawArm(scene, arm);
	}
}

/**
 * One arm of the fingerpost: a cream board with a pointed tip and a shaded lower edge.
 * @param {Canvas} scene
 * @param {{ y: number, from: number, to: number, dir: number }} arm
 */
function drawArm(scene, { y, from, to, dir }) {
	const h = 7;
	for (let x = from; x <= to; x++) {
		// How far from the pointed end, which narrows to a tip.
		const fromTip = dir > 0 ? to - x : x - from;
		const inset = Math.max(0, 3 - fromTip);
		for (let j = inset; j < h - inset; j++) {
			const colour =
				j === h - 1 - inset
					? C.creamShade
					: j === inset
						? C.creamLight
						: C.cream;
			set(scene, x, y + j, colour);
		}
	}
}

/**
 * The little pictures on the arms, painted after the outline: a far town for the road ahead, a fish for the sea, a peak for the mountains.
 * @param {Canvas} scene
 */
function drawIcons(scene) {
	// The town: two red-roofed towers and a gate.
	paint(
		scene,
		POST + 11,
		12,
		['.r...r.', 'rrr.rrr', 'sSs.sSs', 'sSsssSs', 'sSsdsSs'],
		{
			r: C.brickRed,
			s: C.stoneLight,
			S: C.stone,
			d: C.wood,
		}
	);
	// The fish, swimming the way its arm points.
	paint(
		scene,
		POST - 15,
		21,
		['..bbb...b', '.bbbbb.bb', 'bkbbbbbbb', '.BBBBB.bb', '..BBB...b'],
		{
			b: C.daySea2,
			B: C.daySea1,
			k: C.ink,
		}
	);
	// The snowy peak.
	paint(
		scene,
		POST + 10,
		30,
		['....s....', '...sSs...', '..gggGG..', '.ggggGGG.', 'gggggGGGG'],
		{
			s: C.snow,
			S: C.snowShade,
			g: C.stone,
			G: C.stoneShade,
		}
	);
}
