// Star Chamber: a secret council in robes round a candlelit table, under a deep-blue ceiling painted with gold stars.
import {
	createCanvas,
	get,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The room's vanishing point, and the back wall's box. */
const VP = { x: 32, y: 30 };
const BACK = { left: 9, right: 54, top: 17, bottom: 40 };

/** The round table's centre and radii, seen from slightly above, and the candelabrum's middle flame. */
const TABLE = { x: 32, y: 48, rx: 21, ry: 7 };
const FLAME = { x: 32, y: 39 };

/** The painted ceiling's colours. */
const CEILING = mix(C.nightSea2, C.nightSky2, 0.35);
const CEILING_DEEP = mix(C.nightSea3, C.nightSky1, 0.4);
const RIB = mix(C.amber, C.timberShade, 0.35);

/**
 * The three councillors facing us from behind the table, cut off by its far edge: a hooded one,
 * the white-bearded elder who presides, wearing a cap and a gold chain, and a grey-haired one.
 * h hood, k cap, S skin, s skin shade, e eye, w white hair and beard, g gold chain, W collar, R robe, r robe shade.
 */
const HOODED = [
	'...hhh...',
	'..hhhhh..',
	'.hhSSShh.',
	'.hSeSeSh.',
	'.hSSsSSh.',
	'.hhsSshh.',
	'rRhhhhhRr',
	'rRRRRRRRr',
	'rRRRRRRRr',
	'rRRRRRRRr',
	'rRRRRRRRr',
];
const ELDER = [
	'..kkkkk..',
	'.kkkkkkk.',
	'.wSSSSSw.',
	'.wSeSeSw.',
	'.wSSsSSw.',
	'..wwwww..',
	'.rRwwwRr.',
	'rRgRwRgRr',
	'rRRgRgRRr',
	'rRRRgRRRr',
	'rRRRRRRRr',
];
const GREY = [
	'...SSS...',
	'..SSSSS..',
	'.wSSSSSw.',
	'.wSeSeSw.',
	'..SSsSS..',
	'...sSs...',
	'.rRWWWRr.',
	'rRRRWRRRr',
	'rRRRRRRRr',
	'rRRRRRRRr',
	'rRRRRRRRr',
];

/**
 * A councillor at the table's end, in profile, leaning in towards the middle.
 * h hood, H hood lit by the candles, S skin, s skin shade, R robe, r robe shade, L robe lit by the candles, l hand.
 */
const PROFILE = [
	'...hhhh..',
	'..hhhhHH.',
	'..hhhSSS.',
	'..hhhSSs.',
	'..hhhSS..',
	'.rRRRLL..',
	'rRRRRRLL.',
	'rRRRRRRLl',
	'rRRRRRRLl',
	'rRRRRRRL.',
	'rRRRRRRL.',
	'rRRRRRRL.',
	'rRRRRRRRL',
	'rRRRRRRRL',
	'rRRRRRRRL',
	'rRRRRRRRL',
	'rRRRRRRRRL',
	'rRRRRRRRRL',
];

/**
 * A councillor in the foreground, seen from behind, a hood up and the candlelight on the shoulders.
 * h hood, H hood lit by the candles, R robe, r robe shade, L robe lit by the candles.
 */
const BACK_VIEW = [
	'....HHHH....',
	'...HhhhhH...',
	'...hhhhhhh..',
	'...hhhhhhh..',
	'...hhhhhhh..',
	'.LLLhhhhhLL.',
	'LLRRRhhhRRRL',
	'LRRRRRRRRRRr',
	'RRRRRRRRRRRr',
	'RRRRRRRRRRRr',
	'RRRRRRRRRRRr',
	'RRRRRRRRRRRr',
	'RRRRRRRRRRRr',
	'RRRRRRRRRRRr',
];

/**
 * Draws the Star Chamber scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1487);

	drawFloor(layer);
	drawSideWalls(layer);
	drawBackWall(layer, random);
	drawCeiling(layer);

	// The council sits behind and round the table; the two in front are drawn after it.
	const council = createCanvas(64, 64);
	const faces = {
		k: C.night,
		S: C.skin,
		s: C.skinShade,
		e: C.wood,
		w: C.creamLight,
		W: C.creamLight,
		g: C.gold,
	};
	paint(council, 18, BACK.bottom - 10, HOODED, {
		...faces,
		h: C.brickRedShade,
		R: C.brickRed,
		r: C.brickRedShade,
	});
	paint(council, 28, BACK.bottom - 11, ELDER, {
		...faces,
		R: mix(C.night, C.roofShade, 0.5),
		r: C.night,
	});
	paint(council, 38, BACK.bottom - 10, GREY, {
		...faces,
		w: C.stoneLight,
		R: C.roofLight,
		r: C.roof,
	});
	paint(council, 6, 34, PROFILE, profileColours(C.nightSea1, C.nightSea3));
	paint(
		council,
		49,
		34,
		PROFILE,
		profileColours(C.brickRed, C.brickRedShade),
		{
			mirror: true,
		}
	);
	drawTable(council);
	drawCandelabrum(council);
	outline(council, C.ink);
	underlay(council, layer);

	paint(scene, 9, 50, BACK_VIEW, {
		h: C.pineShade,
		H: mix(C.pine, C.amber, 0.45),
		R: C.pineShade,
		r: mix(C.pineShade, C.ink, 0.5),
		L: mix(C.pine, C.amber, 0.45),
	});
	paint(
		scene,
		42,
		51,
		BACK_VIEW,
		{
			h: C.roof,
			H: mix(C.roofLight, C.amber, 0.45),
			R: C.roof,
			r: C.roofShade,
			L: mix(C.roofLight, C.amber, 0.45),
		},
		{ mirror: true }
	);
	outline(scene, C.ink);
	underlay(scene, council);
	glow(scene, {
		x: FLAME.x,
		y: FLAME.y + 2,
		radius: 22,
		colour: C.amber,
		strength: 0.4,
		steps: 4,
		skip: [C.ink],
	});
	drawFlames(scene);
	return scene;
}

/**
 * The colours of a councillor in profile, in a given robe.
 * @param {Colour} robe
 * @param {Colour} shade
 * @returns {Record<string, Colour>}
 */
function profileColours(robe, shade) {
	return {
		h: shade,
		H: mix(robe, C.amber, 0.4),
		S: C.skin,
		s: C.skinShade,
		R: robe,
		r: shade,
		L: mix(robe, C.amber, 0.4),
		l: C.skin,
	};
}

/**
 * The lines of the room meet at the vanishing point: the row a line from the point through a back corner
 * reaches at a column.
 * @param {number} x - The column
 * @param {number} cornerX - The back corner's column
 * @param {number} cornerY - The back corner's row
 * @returns {number}
 */
function edgeAt(x, cornerX, cornerY) {
	const t = (x - VP.x) / (cornerX - VP.x);
	return Math.round(VP.y + (cornerY - VP.y) * t);
}

/**
 * A floor of dark and pale flagstones in a chequer, its rows widening towards the viewer.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	const dark = mix(C.stoneShade, C.night, 0.5);
	const pale = mix(C.stoneMid, C.night, 0.35);
	for (let y = BACK.bottom; y < 64; y++) {
		const depth = (y - VP.y) / (BACK.bottom - VP.y);
		const row = Math.floor(Math.log2(depth) * 3);
		for (let x = 0; x < 64; x++) {
			const across = Math.floor(((x - VP.x) / depth + 64) / 6);
			set(layer, x, y, (row + across) % 2 ? dark : pale);
		}
	}
}

/**
 * The side walls in perspective: dark oak panels with a gold rail.
 * @param {Canvas} layer
 */
function drawSideWalls(layer) {
	for (const [from, to, corner] of [
		[0, BACK.left - 1, BACK.left],
		[BACK.right + 1, 63, BACK.right],
	]) {
		for (let x = from; x <= to; x++) {
			const top = edgeAt(x, corner, BACK.top);
			const bottom = edgeAt(x, corner, BACK.bottom);
			const rail = Math.round(top + (bottom - top) * 0.45);
			for (let y = Math.max(0, top); y <= bottom; y++) {
				let colour = y < rail ? C.timberShade : C.wood;
				if (y === rail) {
					colour = RIB;
				}
				set(layer, x, y, colour);
			}
		}
	}
}

/**
 * The back wall: deep red hangings between oak pilasters, with a gold star device in the middle
 * and two lit sconces.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBackWall(layer, random) {
	for (let y = BACK.top; y <= BACK.bottom; y++) {
		for (let x = BACK.left; x <= BACK.right; x++) {
			let colour =
				(x + y * 2) % 6 === 0
					? C.brickRedShade
					: mix(C.brickRedShade, C.night, 0.3);
			if ((x - BACK.left) % 9 === 0) {
				colour = C.timberShade;
			}
			if (y === BACK.top || y === BACK.top + 1) {
				colour = y === BACK.top ? RIB : C.timberShade;
			}
			set(layer, x, y, colour);
		}
	}
	// Two sconces with their candles.
	for (const x of [BACK.left + 4, BACK.right - 4]) {
		rect(layer, x - 1, 24, 3, 1, C.brass);
		set(layer, x, 23, C.creamLight);
		set(layer, x, 22, C.gold);
		glow(layer, { x, y: 22, radius: 5, colour: C.amber, strength: 0.4 });
	}
	for (let i = 0; i < 8; i++) {
		const x =
			BACK.left + 1 + Math.floor(random() * (BACK.right - BACK.left - 2));
		const y = BACK.top + 3 + Math.floor(random() * 12);
		if (get(layer, x, y) !== C.timberShade) {
			set(layer, x, y, C.brickRed);
		}
	}
}

/**
 * The ceiling, seen rising from the back wall towards the viewer: deep-blue coffers between gilded ribs
 * that run to the vanishing point, a gold star painted in each.
 * @param {Canvas} layer
 */
function drawCeiling(layer) {
	// The transverse ribs, closer together towards the back.
	const ribs = [BACK.top, 13, 8, 1];
	for (let y = 0; y < BACK.top; y++) {
		const leftEdge =
			BACK.left -
			Math.round(
				((BACK.top - y) * (VP.x - BACK.left)) / (VP.y - BACK.top)
			);
		const rightEdge =
			BACK.right +
			Math.round(
				((BACK.top - y) * (BACK.right - VP.x)) / (VP.y - BACK.top)
			);
		for (let x = 0; x < 64; x++) {
			if (x < leftEdge || x > rightEdge) {
				continue;
			}
			// Where this column sits along the back wall's top edge, seen from the vanishing point.
			const along = VP.x + ((x - VP.x) * (VP.y - BACK.top)) / (VP.y - y);
			const lane = (along - BACK.left) / ((BACK.right - BACK.left) / 5);
			let colour = (x + y) % 2 === 0 && y < 4 ? CEILING_DEEP : CEILING;
			if (Math.abs(lane - Math.round(lane)) < 0.06) {
				colour = RIB;
			}
			if (ribs.includes(y)) {
				colour = RIB;
			}
			set(layer, x, y, colour);
		}
	}
	// A star in the middle of each coffer, bigger nearer the viewer.
	for (const [top, bottom] of [
		[1, 8],
		[8, 13],
		[13, BACK.top],
	]) {
		const y = Math.round((top + bottom) / 2);
		for (let lane = 0; lane < 5; lane++) {
			const along =
				BACK.left + ((lane + 0.5) * (BACK.right - BACK.left)) / 5;
			const x = Math.round(
				VP.x + ((along - VP.x) * (VP.y - y)) / (VP.y - BACK.top)
			);
			star(layer, x, y, bottom - top >= 7 ? 2 : 1);
		}
	}
}

/**
 * A small painted gold star: a plus with a bright centre, with diagonal points when it is large.
 * @param {Canvas} layer
 * @param {number} x
 * @param {number} y
 * @param {number} size - 1 or 2
 */
function star(layer, x, y, size) {
	set(layer, x, y, C.lampGlow);
	for (let i = 1; i <= size; i++) {
		for (const [dx, dy] of [
			[i, 0],
			[-i, 0],
			[0, i],
			[0, -i],
		]) {
			set(layer, x + dx, y + dy, C.gold);
		}
	}
	if (size > 1) {
		for (const [dx, dy] of [
			[1, 1],
			[-1, 1],
			[1, -1],
			[-1, -1],
		]) {
			set(layer, x + dx, y + dy, C.amber);
		}
	}
}

/**
 * The round table, seen from slightly above: a green cloth with a gold rim, papers and a seal on it,
 * and the dark wood of its near edge.
 * @param {Canvas} canvas
 */
function drawTable(canvas) {
	const baize = mix(C.pine, C.forestFloorShade, 0.5);
	const baizeLit = mix(C.pineLight, C.pine, 0.4);
	for (let y = TABLE.y - TABLE.ry - 1; y <= TABLE.y + TABLE.ry + 3; y++) {
		for (let x = TABLE.x - TABLE.rx - 1; x <= TABLE.x + TABLE.rx + 1; x++) {
			const d = Math.hypot(
				(x - TABLE.x) / TABLE.rx,
				(y - TABLE.y) / TABLE.ry
			);
			const below = Math.hypot(
				(x - TABLE.x) / TABLE.rx,
				(y - 3 - TABLE.y) / TABLE.ry
			);
			if (d <= 1) {
				let colour = d > 0.9 ? C.brass : d < 0.55 ? baizeLit : baize;
				if (d > 0.9 && y > TABLE.y) {
					colour = C.amber;
				}
				set(canvas, x, y, colour);
			} else if (below <= 1 && y > TABLE.y) {
				set(canvas, x, y, x > TABLE.x + 8 ? C.wood : C.timberShade);
			}
		}
	}
	// Papers before each councillor, and a sealed document in front of the candelabrum.
	for (const [x, y, w] of [
		[17, 46, 4],
		[24, 43, 3],
		[37, 43, 3],
		[43, 46, 4],
	]) {
		rect(canvas, x, y, w, 2, C.creamLight);
		rect(canvas, x, y + 1, w, 1, C.cream);
	}
	rect(canvas, 29, 51, 7, 3, C.creamLight);
	rect(canvas, 29, 53, 7, 1, C.cream);
	set(canvas, 32, 52, C.brickRed);
	set(canvas, 33, 52, C.brickRedShade);
}

/**
 * A gilt candelabrum with three candles in the middle of the table.
 * @param {Canvas} canvas
 */
function drawCandelabrum(canvas) {
	const { x, y } = FLAME;
	rect(canvas, x - 2, y + 9, 5, 1, C.amber);
	rect(canvas, x, y + 4, 1, 5, C.gold);
	rect(canvas, x - 4, y + 4, 9, 1, C.gold);
	for (const dx of [-4, 0, 4]) {
		rect(canvas, x + dx, y + 1, 1, 3, C.creamLight);
	}
}

/**
 * The three flames, drawn after the glow so they stay the brightest things in the room.
 * @param {Canvas} scene
 */
function drawFlames(scene) {
	for (const dx of [-4, 0, 4]) {
		set(scene, FLAME.x + dx, FLAME.y, C.white);
		set(scene, FLAME.x + dx, FLAME.y - 1, C.gold);
	}
}
