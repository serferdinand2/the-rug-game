// Painting: a sunset landscape in oils in an ornate gold frame on a deep red damask gallery wall, lit by a brass picture light, a blue velvet rope on brass posts in front.
import {
	createCanvas,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The frame's outer box, and how wide its moulding is; the canvas shows inside it. */
const FRAME = { x0: 5, y0: 10, x1: 58, y1: 46, width: 6 };

/** The painted canvas inside the frame. */
const CANVAS = {
	x0: FRAME.x0 + FRAME.width,
	y0: FRAME.y0 + FRAME.width,
	x1: FRAME.x1 - FRAME.width,
	y1: FRAME.y1 - FRAME.width,
};

/** The landscape inside the canvas: the horizon row, the near shore row and the sun's column, all counted from the canvas's corner. */
const VIEW = { horizon: 15, shore: 21, sun: 25 };

/** The picture light: its hood's box and the arm down to the frame. */
const LAMP = { x0: 18, x1: 45, y: 2, arm: 31 };

/** The skirting board's first row and the floor's first row. */
const SKIRTING = 54;
const FLOOR = 57;

/** The stanchions: each pole's left column, the ball's top row and the base's row. */
const POSTS = [
	{ x: 2, top: 44, base: 61 },
	{ x: 60, top: 44, base: 61 },
];

/** The rope hangs from ball to ball and sags this many rows at its middle. */
const ROPE = { x0: 5, x1: 59, y: 47, sag: 5 };

/** The deep red damask wall: lit under the lamp, plain, and dim towards the corners, each with its woven pattern. */
const WALL_LIT = mix(C.brickRed, C.brickRedShade, 0.45);
const WALL = mix(C.brickRedShade, C.ink, 0.12);
const WALL_DIM = mix(C.brickRedShade, C.ink, 0.38);
const DAMASK_LIT = mix(C.brickRed, C.brickRedShade, 0.75);
const DAMASK = mix(C.brickRedShade, C.ink, 0.28);
const DAMASK_DIM = mix(C.brickRedShade, C.ink, 0.52);
const WALL_SHADOW = mix(C.brickRedShade, C.ink, 0.62);

/** The gold of the frame and the lamp, from deepest to brightest. */
const GOLD = [
	mix(C.lampFrame, C.wood, 0.3),
	C.lampFrame,
	C.amber,
	C.brass,
	C.gold,
	C.lampGlow,
];

/** The skirting board and the polished floor. */
const SKIRT_LIT = C.timber;
const SKIRT = C.timberShade;
const FLOOR_LIT = mix(C.floorLight, C.amber, 0.18);
const FLOOR_BOARD = C.floor;
const FLOOR_SEAM = C.floorShade;
const FLOOR_SHADOW = mix(C.floorShade, C.ink, 0.45);

/** The velvet rope: lit along its top, plain and shaded beneath. */
const VELVET_LIT = mix(C.daySky1, C.arcane, 0.25);
const VELVET = mix(C.nightSea1, C.arcaneShade, 0.35);
const VELVET_SHADE = mix(C.nightSea3, C.ink, 0.3);

/** The landscape's sunset sky in brush strokes, from the top of the canvas down to the horizon. */
const SKY = [
	mix(C.duskSky3, C.duskSky2, 0.3),
	C.duskSky3,
	mix(C.duskSky3, C.duskSky4, 0.5),
	C.duskSky4,
	C.duskSky5,
	mix(C.duskSky5, C.duskSky6, 0.5),
	C.duskSky6,
	mix(C.duskSky6, C.gold, 0.45),
];

/** Long sunlit clouds: their lit tops and their shaded bellies. */
const CLOUD_LIT = mix(C.duskSky6, C.creamLight, 0.55);
const CLOUD = mix(C.duskSky4, C.duskSky6, 0.5);
const CLOUD_SHADE = mix(C.duskSky3, C.duskSky4, 0.4);

/** The far blue mountains, rosy where the sun catches them, and the darker near hills. */
const MOUNTAIN_LIT = mix(C.duskSky5, C.roofLight, 0.45);
const MOUNTAIN = mix(C.roofLight, C.duskSky3, 0.35);
const HILL = mix(C.roof, C.pineShade, 0.4);
const HILL_LIT = mix(C.roof, C.duskSky4, 0.35);

/** The lake: sky reflections in streaks, and the darker water. */
const WATER_GOLD = mix(C.gold, C.duskSky6, 0.3);
const WATER_ROSE = mix(C.duskSky5, C.duskSky4, 0.4);
const WATER = mix(C.duskSky2, C.nightSea2, 0.4);
const WATER_DEEP = mix(C.duskSky1, C.nightSea3, 0.5);

/** The meadow on the near shore, its grass caught by the low sun. */
const MEADOW_LIT = mix(C.grassLight, C.amber, 0.45);
const MEADOW = mix(C.grassShade, C.amber, 0.3);
const MEADOW_SHADE = mix(C.forestFloorShade, C.roof, 0.3);

/** The big tree: its dark crown, the sunset rim along its right, and its trunk. */
const LEAF_RIM = mix(C.amber, C.grassLight, 0.3);
const LEAF = mix(C.pine, C.grassShade, 0.5);
const LEAF_SHADE = mix(C.pineShade, C.roof, 0.35);
const TRUNK = mix(C.timberShade, C.wood, 0.5);

/** The sun itself and its halo. */
const SUN = C.creamLight;
const SUN_HALO = mix(C.lampGlow, C.duskSky6, 0.35);

/**
 * Draws the Painting masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const front = createCanvas(64, 64);
	const random = seededRandom(5117);

	drawWall(layer);
	drawFrameShadow(layer);
	drawSkirting(layer);
	drawFloor(layer, random);

	drawLandscape(scene, random);
	drawFrame(scene);
	drawLamp(scene);
	outline(scene, C.ink);
	// The lamp's pool of light on the upper canvas; the gilt, the wall and the outline keep their own tones.
	glow(scene, {
		x: 32,
		y: 8,
		radius: 22,
		colour: C.lampGlow,
		strength: 0.14,
		steps: 2,
		skip: [C.ink, C.white, ...GOLD],
	});
	underlay(scene, layer);

	// The posts and rope stand in front of the wall, outlined on their own so they part from the frame.
	for (const post of POSTS) {
		drawPost(front, post);
	}
	drawRope(front);
	outline(front, C.ink);
	stamp(scene, front);

	drawLight(scene);
	drawGlints(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * The deep red wall, woven with a small damask lozenge in half-drop rows, brightest in the lamp's pool and dim in the corners.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < SKIRTING; y++) {
		for (let x = 0; x < 64; x++) {
			const reach = Math.hypot((x - 31.5) / 1.5, y - 4);
			const band = reach < 16 ? 0 : reach < 30 ? 1 : 2;
			set(
				layer,
				x,
				y,
				onDamask(x, y)
					? [DAMASK_LIT, DAMASK, DAMASK_DIM][band]
					: [WALL_LIT, WALL, WALL_DIM][band]
			);
		}
	}
}

/**
 * Whether a wall pixel lies on the damask pattern: a lozenge with a dot at its heart, on an 8 by 8 grid that drops half a step every other column.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onDamask(x, y) {
	const column = Math.floor(x / 8);
	const u = (x % 8) - 4;
	const v = ((y + (column % 2) * 4) % 8) - 4;
	const d = Math.abs(u) + Math.abs(v);
	return d === 3 || (u === 0 && v === 0);
}

/**
 * The frame's shadow on the wall, thrown down and to the right of it.
 * @param {Canvas} layer
 */
function drawFrameShadow(layer) {
	const { x0, y0, x1, y1 } = FRAME;
	for (let y = y0 + 2; y <= y1 + 2; y++) {
		for (let x = x0 + 2; x <= x1 + 2; x++) {
			if (y > y1 || x > x1) {
				set(layer, x, y, WALL_SHADOW);
			}
		}
	}
}

/**
 * The skirting board along the foot of the wall: a lit moulded top and a plain dark face.
 * @param {Canvas} layer
 */
function drawSkirting(layer) {
	rect(layer, 0, SKIRTING, 64, 1, SKIRT_LIT);
	rect(layer, 0, SKIRTING + 1, 64, FLOOR - SKIRTING - 1, SKIRT);
}

/**
 * The polished floorboards, lit along their seams by the room, with the posts' shadows on them.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFloor(layer, random) {
	const seams = [FLOOR + 1, FLOOR + 3, FLOOR + 6];
	for (let y = FLOOR; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, seams.includes(y) ? FLOOR_SEAM : FLOOR_BOARD);
		}
	}
	// A soft sheen where the gallery's light falls on the polish, and a few butt joints.
	for (let x = 14; x < 50; x++) {
		if (random() > 0.25) {
			set(layer, x, FLOOR + 2, FLOOR_LIT);
		}
		if (x > 20 && x < 44 && random() > 0.45) {
			set(layer, x, FLOOR + 4, FLOOR_LIT);
		}
	}
	for (let i = 0; i < 5; i++) {
		const x = 4 + Math.floor(random() * 56);
		const top = seams[i % seams.length] + 1;
		set(layer, x, top, FLOOR_SEAM);
		set(layer, x, top + 1, FLOOR_SEAM);
	}
	for (const post of POSTS) {
		rect(layer, post.x + 1, post.base + 1, 6, 2, FLOOR_SHADOW);
	}
}

/**
 * The landscape in oils: a sunset sky over blue mountains, a still lake catching the light, a shore meadow and a great tree,
 * all laid on in short horizontal brush strokes.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawLandscape(scene, random) {
	const { x0, y0 } = CANVAS;
	const { horizon, shore, sun } = VIEW;
	const width = CANVAS.x1 - x0 + 1;
	const height = CANVAS.y1 - y0 + 1;

	// The sky: bands of colour, their edges broken by strokes that carry one band into the next.
	for (let j = 0; j < horizon; j++) {
		strokes(scene, j, 0, width - 1, random, () => {
			const t = (j + random() * 2.6 - 1.3) / horizon;
			const band = Math.floor(t * SKY.length + 0.2);
			return SKY[Math.max(0, Math.min(SKY.length - 1, band))];
		});
	}
	drawCloud(scene, x0 + 3, y0 + 3, 13);
	drawCloud(scene, x0 + 30, y0 + 2, 9);
	drawCloud(scene, x0 + 17, y0 + 6, 6);

	// The sun, low between the peaks, in a ring of haze.
	for (let dy = -4; dy <= 4; dy++) {
		for (let dx = -4; dx <= 4; dx++) {
			const d = Math.hypot(dx, dy);
			if (d < 2.5) {
				set(scene, x0 + sun + dx, y0 + horizon - 5 + dy, SUN);
			} else if (d < 3.9) {
				set(scene, x0 + sun + dx, y0 + horizon - 5 + dy, SUN_HALO);
			}
		}
	}

	// The far mountains: two peaks, rosy on the slopes that face the sun.
	for (let i = 0; i < width; i++) {
		const ridge = Math.round(
			Math.min(
				Math.abs(i - 15) * 0.9 + 5,
				Math.abs(i - 35) * 0.7 + 6,
				horizon
			)
		);
		for (let j = ridge; j < horizon; j++) {
			const sunward =
				(i > 15 && i < sun && j < ridge + 3) ||
				(i < 35 && i > sun && j < ridge + 3);
			set(scene, x0 + i, y0 + j, sunward ? MOUNTAIN_LIT : MOUNTAIN);
		}
	}
	// Snow on both peaks, catching the last light.
	set(scene, x0 + 15, y0 + 5, CLOUD_LIT);
	rect(scene, x0 + 14, y0 + 6, 3, 1, CLOUD_LIT);
	set(scene, x0 + 14, y0 + 6, CLOUD);
	set(scene, x0 + 35, y0 + 6, CLOUD_LIT);
	rect(scene, x0 + 34, y0 + 7, 2, 1, CLOUD);

	// The near hills on the left, dark against the lake.
	for (let i = 0; i < 22; i++) {
		const top = horizon - 4 + Math.round((i / 22) ** 2 * 4);
		for (let j = top; j <= horizon; j++) {
			set(scene, x0 + i, y0 + j, j === top ? HILL_LIT : HILL);
		}
	}

	// The lake: long streaks of the sky's colours on dark water, a broken path of gold under the sun.
	for (let j = horizon; j < shore; j++) {
		const from = j === horizon ? 22 : 0;
		const depth = j - horizon;
		strokes(scene, j, from, width - 1, random, (i) => {
			const r = random();
			if (Math.abs(i - sun) < 3 + depth * 0.5) {
				return depth % 2 === 0 || r > 0.5 ? WATER_GOLD : SUN_HALO;
			}
			if (r > 0.72) {
				return depth < 3 ? WATER_ROSE : WATER_GOLD;
			}
			return r < 0.3 && depth > 2 ? WATER_DEEP : WATER;
		});
	}

	// The near shore: a meadow sloping up to the right, lit along its brow by the low sun.
	for (let j = shore - 2; j < height; j++) {
		strokes(scene, j, 0, width - 1, random, (i) => {
			const brow = shore + 1 - Math.round((i / width) * 3);
			const r = random();
			if (j < brow) {
				return null;
			}
			if (j === brow || (j === brow + 1 && r > 0.5)) {
				return MEADOW_LIT;
			}
			return r < 0.35 || j > height - 3 ? MEADOW_SHADE : MEADOW;
		});
	}

	drawTree(scene, random);
}

/**
 * Lays one row of a picture on in short brush strokes, each two to five pixels long and one colour.
 * @param {Canvas} scene
 * @param {number} j - The row, counted from the canvas's top
 * @param {number} from - The first column, counted from the canvas's left
 * @param {number} to - The last column
 * @param {() => number} random
 * @param {(i: number) => Colour | null} pick - Picks a stroke's colour from its first column; null leaves the stroke unpainted
 */
function strokes(scene, j, from, to, random, pick) {
	let i = from;
	while (i <= to) {
		const length = 2 + Math.floor(random() * 4);
		const colour = pick(i);
		for (let k = 0; k < length && i + k <= to; k++) {
			set(scene, CANVAS.x0 + i + k, CANVAS.y0 + j, colour);
		}
		i += length;
	}
}

/**
 * One long sunset cloud laid on with a few strokes: a lit top, a rosy body and a shaded belly.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {number} y - Top row
 * @param {number} length - Its length in pixels
 */
function drawCloud(scene, x, y, length) {
	rect(scene, x + 2, y, length - 5, 1, CLOUD_LIT);
	rect(scene, x, y + 1, length, 1, CLOUD);
	rect(scene, x + 1, y + 1, Math.floor(length / 2), 1, CLOUD_LIT);
	rect(scene, x + 3, y + 2, length - 4, 1, CLOUD_SHADE);
}

/**
 * The great tree on the near left: a round dark crown in dabs, its sunward edge rimmed with gold, on a leaning trunk.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawTree(scene, random) {
	const { x0, y0, y1 } = CANVAS;
	const cx = x0 + 6;
	const cy = y0 + 9;
	// The trunk and two limbs.
	for (let y = cy + 2; y <= y1 - 2; y++) {
		const lean = Math.round((y1 - y) / 8);
		set(scene, cx - 1 + lean, y, TRUNK);
		set(scene, cx + lean, y, TRUNK);
	}
	// The crown: two overlapping clumps.
	const clumps = [
		{ x: cx, y: cy, r: 7 },
		{ x: cx + 5, y: cy + 3, r: 4.5 },
		{ x: cx - 4, y: cy + 3, r: 4 },
	];
	for (let y = cy - 8; y <= cy + 8; y++) {
		for (let x = cx - 9; x <= cx + 10; x++) {
			const inside = clumps.some(
				(c) => Math.hypot(x - c.x, (y - c.y) * 1.1) < c.r
			);
			if (!inside || x < x0) {
				continue;
			}
			const rim = !clumps.some(
				(c) => Math.hypot(x + 1 - c.x, (y + 0.6 - c.y) * 1.1) < c.r
			);
			const r = random();
			let colour = r < 0.4 ? LEAF_SHADE : LEAF;
			if (rim) {
				colour = LEAF_RIM;
			} else if (y > cy + 3 && r < 0.75) {
				colour = LEAF_SHADE;
			}
			set(scene, x, y, colour);
		}
	}
	// The sunlit side of the trunk.
	set(scene, cx + 1, y1 - 6, LEAF_RIM);
	set(scene, cx + 1, y1 - 5, MEADOW_LIT);
}

/**
 * Picks a gold tone, clamped to the ramp.
 * @param {number} index - 0 for the deepest gold up to 5 for the brightest
 * @returns {Colour}
 */
function goldTone(index) {
	return GOLD[Math.max(0, Math.min(GOLD.length - 1, index))];
}

/**
 * The carved gilt frame: an outer lip, a beaded torus, a dark groove and a bright sight edge, mitred at the corners,
 * lit from the upper left so its outer slopes brighten on the top and left and its inner slopes on the bottom and right.
 * Rosettes stand out at the corners and on the middle of the sides and the foot, and a shell crest at the top.
 * @param {Canvas} scene
 */
function drawFrame(scene) {
	const { x0, y0, x1, y1, width } = FRAME;
	/** The ring's base tone, from the outer lip inwards. */
	const RINGS = [2, 4, 3, 3, 1, 4];
	for (let y = y0; y <= y1; y++) {
		for (let x = x0; x <= x1; x++) {
			const sides = {
				top: y - y0,
				left: x - x0,
				right: x1 - x,
				bottom: y1 - y,
			};
			const ring = Math.min(...Object.values(sides));
			if (ring >= width) {
				continue;
			}
			const side = /** @type {keyof typeof sides} */ (
				Object.keys(sides).find(
					(key) =>
						sides[/** @type {keyof typeof sides} */ (key)] === ring
				)
			);
			const facing = { top: 1, left: 1, right: -1, bottom: -1 }[side];
			// The outer slopes face the light on the top and left; the inner slopes on the bottom and right.
			const turn = ring <= 2 ? facing : ring === 4 ? 0 : -facing;
			let tone = RINGS[ring] + turn;
			// Beads along the torus.
			const along = side === 'top' || side === 'bottom' ? x : y;
			if (ring === 2 && along % 3 === 0) {
				tone -= 2;
			} else if (ring === 2 && along % 3 === 1) {
				tone += 1;
			}
			set(scene, x, y, goldTone(tone));
		}
	}
	// Rosettes on the corners and on the middle of the sides and the bottom.
	for (const [cx, cy] of [
		[x0 + 1, y0 + 1],
		[x1 - 1, y0 + 1],
		[x0 + 1, y1 - 1],
		[x1 - 1, y1 - 1],
		[x0, Math.round((y0 + y1) / 2)],
		[x1, Math.round((y0 + y1) / 2)],
		[Math.round((x0 + x1) / 2), y1],
	]) {
		drawRosette(scene, cx, cy);
	}
	// The shell crest on the top rail, where the lamp's arm is fixed.
	const crest = ['..###..', '.#ooo#.', '#o#o#o#', '#oo#oo#'];
	crest.forEach((row, j) => {
		[...row].forEach((key, i) => {
			const x = LAMP.arm - 3 + i;
			const y = y0 - 3 + j;
			if (key === '#') {
				set(scene, x, y, i < 3 ? C.gold : C.brass);
			} else if (key === 'o') {
				set(scene, x, y, j === 1 ? C.lampGlow : C.amber);
			}
		});
	});
}

/**
 * A carved rosette standing proud of a frame corner: a round boss lit on its upper left, with a dark eye.
 * @param {Canvas} scene
 * @param {number} cx
 * @param {number} cy
 */
function drawRosette(scene, cx, cy) {
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			const d = Math.hypot(dx, dy);
			if (d > 2.4) {
				continue;
			}
			let tone = 3;
			if (dx + dy < -1) {
				tone = 5;
			} else if (dx + dy > 1) {
				tone = 2;
			}
			set(scene, cx + dx, cy + dy, goldTone(tone));
		}
	}
	set(scene, cx, cy, GOLD[1]);
}

/**
 * The brass picture light above the frame: a long half-round hood, its glowing mouth beneath, and the arm down to the crest.
 * @param {Canvas} scene
 */
function drawLamp(scene) {
	const { x0, x1, y, arm } = LAMP;
	// The arm, curving out from the crest to the hood.
	rect(scene, arm, y + 4, 2, FRAME.y0 - 3 - (y + 4), C.brass);
	rect(scene, arm, y + 4, 1, FRAME.y0 - 3 - (y + 4), C.gold);
	// The hood.
	rect(scene, x0 + 1, y, x1 - x0 - 1, 1, C.gold);
	rect(scene, x0, y + 1, x1 - x0 + 1, 1, C.lampGlow);
	rect(scene, x0, y + 2, x1 - x0 + 1, 1, C.brass);
	rect(scene, x0 + 1, y + 3, x1 - x0 - 1, 1, C.amber);
	// End caps, shaded on the right.
	set(scene, x0, y + 1, C.gold);
	set(scene, x1, y + 1, C.brass);
	set(scene, x1, y + 2, C.amber);
	// Fine ribs along the hood.
	for (let x = x0 + 3; x < x1 - 1; x += 4) {
		set(scene, x, y + 2, C.amber);
	}
}

/**
 * A brass stanchion: a ball on a slim turned pole, standing on a round foot.
 * @param {Canvas} front
 * @param {{ x: number, top: number, base: number }} post
 */
function drawPost(front, { x, top, base }) {
	// The ball.
	rect(front, x, top, 3, 3, C.brass);
	set(front, x, top, C.lampGlow);
	set(front, x + 1, top, C.gold);
	set(front, x, top + 1, C.gold);
	set(front, x + 2, top + 2, C.amber);
	// A collar under the ball.
	rect(front, x - 1, top + 3, 5, 1, C.amber);
	set(front, x - 1, top + 3, C.gold);
	// The pole.
	for (let y = top + 4; y < base; y++) {
		set(front, x, y, C.gold);
		set(front, x + 1, y, C.brass);
		set(front, x + 2, y, C.amber);
	}
	// The foot.
	rect(front, x - 2, base, 7, 2, C.brass);
	rect(front, x - 2, base, 3, 1, C.gold);
	rect(front, x - 1, base + 1, 6, 1, C.amber);
}

/**
 * The velvet rope, hanging in a curve from ball to ball, clipped on with brass hooks.
 * @param {Canvas} front
 */
function drawRope(front) {
	const { x0, x1, y, sag } = ROPE;
	const mid = (x0 + x1) / 2;
	const half = (x1 - x0) / 2;
	for (let x = x0; x <= x1; x++) {
		const t = (x - mid) / half;
		const cy = Math.round(y + sag * (1 - t * t));
		set(front, x, cy - 1, VELVET_LIT);
		set(front, x, cy, VELVET);
		set(front, x, cy + 1, VELVET_SHADE);
	}
	// The hooks where it meets the balls.
	set(front, x0, y - 2, C.gold);
	set(front, x0, y - 1, C.brass);
	set(front, x1, y - 2, C.brass);
	set(front, x1, y - 1, C.amber);
}

/**
 * The lamp's mouth: a strip of warm light along the underside of the hood, over the outline.
 * @param {Canvas} scene
 */
function drawLight(scene) {
	const { x0, x1, y } = LAMP;
	for (let x = x0 + 2; x <= x1 - 2; x++) {
		set(scene, x, y + 4, x % 5 === 0 ? C.white : C.lampGlow);
	}
}

/**
 * Gleams on the gilt and the brass, over the outline.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	set(scene, FRAME.x0 + 1, FRAME.y0 + 1, C.white);
	set(scene, FRAME.x0 + 20, FRAME.y0 + 1, C.white);
	set(scene, FRAME.x0 + 1, FRAME.y0 + 18, C.white);
	set(scene, LAMP.x0 + 4, LAMP.y + 1, C.white);
	for (const post of POSTS) {
		set(scene, post.x, post.top, C.white);
	}
}
