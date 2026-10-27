// Stained Glass: a tall pointed window seen from inside a dim stone church, the sun behind it lighting a radiant ruby flower on sapphire glass, and its colours pooling on the flagstones.
import {
	createCanvas,
	set,
	get,
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

/**
 * One pane's place in the window: which piece of glass it is and what colour that glass is.
 * @typedef {{ id: string, glass: keyof typeof GLASS }} Pane
 */

/** The glass: its left and right columns, the row its arch springs from, the radius of each arch and its sill row. */
const WINDOW = { x0: 17, x1: 46, spring: 26, radius: 25, bottom: 49 };

/** The stone frame and the splayed reveal round the glass, in pixels. */
const FRAME = 2;
const REVEAL = 3;

/** The radiant flower: its centre, the gold heart, the petals' reach, and the outer edge of the gold ring round it. */
const FLOWER = { x: 32, y: 20, heart: 2.6, petals: 8, reach: 9.4, ring: 12.6 };

/** The sun's hot spot behind the glass, upper right: these pixels always take their glass's brightest tone. */
const HOT_SPOT = [
	[38, 12],
	[39, 12],
	[38, 13],
	[40, 16],
];

/** The point the floor's joints run back to, and how far apart they are at the floor's front edge. */
const VANISH = { x: 32, y: 26, step: 14 };

/** The floor's first row, and where the light falls on it: the pool's columns at its far edge, how far it leans left and how much wider it grows on each row nearer. */
const FLOOR = 54;
const POOL = { left: 22, right: 44, lean: 1.4, spread: 0.5 };

/** The jewel colours of the glass, each lit, plain and deep. */
const GLASS = {
	ruby: [C.brickRedLight, C.brickRed, mix(C.brickRedShade, C.brickRed, 0.3)],
	sapphire: [
		mix(C.daySky2, C.daySky4, 0.4),
		mix(C.daySky1, C.nightSea1, 0.45),
		mix(C.nightSea2, C.nightSea1, 0.3),
	],
	emerald: [
		mix(C.grassLight, C.tealLight, 0.25),
		mix(C.grass, C.teal, 0.35),
		mix(C.grassShade, C.tealShade, 0.45),
	],
	gold: [C.lampGlow, C.gold, C.amber],
	violet: [C.arcaneLight, C.arcane, mix(C.arcaneShade, C.arcane, 0.3)],
};

/** The lead cames between the panes. */
const LEAD = mix(C.ink, C.night, 0.5);

/** The dim stone wall: its lighter, plain and darker blocks, and the joints between them. */
const WALL_LIGHT = mix(C.stoneShade, C.roof, 0.3);
const WALL = mix(C.stoneShade, C.roofShade, 0.4);
const WALL_DARK = mix(C.roofShade, C.night, 0.45);
const MORTAR = mix(C.roofShade, C.ink, 0.45);

/** The window's stone frame and its reveal, lit warm where the sun comes through. */
const FRAME_LIT = mix(C.stoneLight, C.lampGlow, 0.25);
const FRAME_STONE = C.stone;
const FRAME_SHADE = C.stoneShade;
const REVEAL_STONE = [
	mix(C.stoneMid, C.lampGlow, 0.15),
	C.stoneMid,
	mix(C.stoneShade, C.roof, 0.25),
];

/** The flagstones, their joints, and the sill. */
const FLAG = mix(C.stoneShade, C.roof, 0.3);
const FLAG_JOINT = mix(C.roofShade, C.ink, 0.25);
const SILL_LIT = mix(C.stoneLight, C.lampGlow, 0.35);

/**
 * Draws the Stained Glass masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(9137);

	drawWall(layer, random);
	drawFloor(layer);

	const panes = paneMap();
	drawGlass(scene, panes, random);
	drawFrame(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// The sunlight spilling round the window onto the stone; the glass and its lead keep their own colours.
	glow(scene, {
		x: 32,
		y: 26,
		radius: 34,
		colour: C.lampGlow,
		strength: 0.32,
		steps: 3,
		skip: [LEAD, C.ink, ...Object.values(GLASS).flat()],
	});
	drawPool(scene, panes);
	return scene;
}

/**
 * Whether a point lies on the glass: between the jambs, below the pointed arch and above the sill.
 * @param {number} x
 * @param {number} y
 * @param {number} [grow] - Pixels to grow the shape by, for the frame and the reveal round it
 * @returns {boolean}
 */
function onGlass(x, y, grow = 0) {
	const { x0, x1, spring, radius, bottom } = WINDOW;
	const px = x + 0.5;
	const py = y + 0.5;
	if (px < x0 - grow || px > x1 + 1 + grow || py > bottom + 1 + grow) {
		return false;
	}
	if (py >= spring) {
		return true;
	}
	// The two arcs of the pointed arch, each centred on the far side's springing line.
	const r = radius + grow;
	const right = Math.hypot(px - (x1 + 1 - radius), py - spring) <= r;
	const left = Math.hypot(px - (x0 + radius), py - spring) <= r;
	return right && left;
}

/**
 * How deep a point of glass lies inside the window, in pixels from its edge, up to 4.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function depth(x, y) {
	for (let k = 1; k <= 4; k++) {
		const near = [
			[k, 0],
			[-k, 0],
			[0, k],
			[0, -k],
		].some(([dx, dy]) => !onGlass(x + dx, y + dy));
		if (near) {
			return k;
		}
	}
	return 5;
}

/**
 * Decides which pane every point of the window belongs to: a border of ruby and gold panes in turn, a quarry of sapphire diamonds,
 * the radiant flower in its gold ring, and the stem and leaves beneath it.
 * @returns {(Pane | null)[]} One entry per pixel, row by row; null off the glass.
 */
function paneMap() {
	/** @type {(Pane | null)[]} */
	const panes = new Array(64 * 64).fill(null);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (onGlass(x, y)) {
				panes[y * 64 + x] = paneAt(x, y);
			}
		}
	}
	return panes;
}

/**
 * The pane at one point of the glass.
 * @param {number} x
 * @param {number} y
 * @returns {Pane}
 */
function paneAt(x, y) {
	// The border: two pixels wide, ruby and gold panes in turn, running up the sides, over the arch and along the foot.
	if (depth(x, y) <= 2) {
		const side = y >= WINDOW.spring && y < WINDOW.bottom - 1;
		const along = side ? y : Math.round(x / 1.3);
		const k = Math.floor(along / 4);
		return { id: `border${k}`, glass: k % 2 === 0 ? 'gold' : 'ruby' };
	}
	const dx = x + 0.5 - FLOWER.x;
	const dy = y + 0.5 - FLOWER.y;
	const r = Math.hypot(dx, dy);
	const angle = Math.atan2(dy, dx) + Math.PI;
	const sector = (angle / (Math.PI * 2)) * FLOWER.petals;
	const petal = Math.floor(sector + 0.5) % FLOWER.petals;
	const offset = Math.abs(sector + 0.5 - Math.floor(sector + 0.5) - 0.5);
	if (r < FLOWER.heart) {
		return { id: 'heart', glass: 'gold' };
	}
	if (r < FLOWER.reach - offset * offset * 14) {
		return { id: `petal${petal}`, glass: 'ruby' };
	}
	if (r < FLOWER.ring - 3) {
		// Sapphire between the petals, one pane in each gap.
		return {
			id: `gap${Math.floor(sector) % FLOWER.petals}`,
			glass: 'sapphire',
		};
	}
	if (r < FLOWER.ring) {
		return { id: `ring${Math.floor(sector / 2)}`, glass: 'gold' };
	}
	// The stem and its two pairs of leaves, below the flower.
	const stemX = Math.abs(x + 0.5 - FLOWER.x);
	if (y > FLOWER.y && stemX < 1.2 && y < WINDOW.bottom - 2) {
		return { id: 'stem', glass: 'emerald' };
	}
	for (const leaf of [
		{ y: 37, side: -1 },
		{ y: 37, side: 1 },
		{ y: 43, side: -1 },
		{ y: 43, side: 1 },
	]) {
		const lx = x + 0.5 - (FLOWER.x + leaf.side * 4.5);
		const ly = y + 0.5 - (leaf.y - 1.5);
		const u = lx * 0.8 - ly * 0.6 * leaf.side;
		const v = lx * 0.6 * leaf.side + ly * 0.8;
		if ((u / 4) ** 2 + (v / 1.8) ** 2 < 1) {
			return { id: `leaf${leaf.y}${leaf.side}`, glass: 'emerald' };
		}
	}
	// The quarries: sapphire diamonds, with a violet one here and there.
	const a = Math.floor((x + y + 4) / 8);
	const b = Math.floor((x - y + 64) / 8);
	return {
		id: `quarry${a}_${b}`,
		glass: (a * 5 + b * 3) % 7 === 0 ? 'violet' : 'sapphire',
	};
}

/**
 * The glass itself, lit from behind: each pane is its colour, brighter towards the sun at the upper right, with lead between
 * every two panes, the sun's hot spot showing through and a gleam on the flower's heart.
 * @param {Canvas} scene
 * @param {(Pane | null)[]} panes
 * @param {() => number} random
 */
function drawGlass(scene, panes, random) {
	/** @type {Map<string, number>} */
	const shine = new Map();
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const pane = panes[y * 64 + x];
			if (!pane) {
				continue;
			}
			const right = x < 63 ? panes[y * 64 + x + 1] : null;
			const below = y < 63 ? panes[(y + 1) * 64 + x] : null;
			if (
				(right && right.id !== pane.id) ||
				(below && below.id !== pane.id)
			) {
				set(scene, x, y, LEAD);
				continue;
			}
			if (!shine.has(pane.id)) {
				shine.set(pane.id, random());
			}
			// Brighter towards the upper right, where the sun stands behind the window.
			const sun = (x - WINDOW.x0) / 28 - (y - 4) / 46;
			const level =
				/** @type {number} */ (shine.get(pane.id)) + sun * 0.6;
			let tone = 1;
			if (level > 0.62) {
				tone = 0;
			} else if (level < 0.05) {
				tone = 2;
			}
			// The ring stays a deep gold, so it parts from the sunlit stone round the arch.
			if (pane.id.startsWith('ring')) {
				tone = Math.max(tone, 1);
			}
			set(scene, x, y, GLASS[pane.glass][tone]);
		}
	}
	for (const [x, y] of HOT_SPOT) {
		const pane = panes[y * 64 + x];
		if (pane && get(scene, x, y) !== LEAD) {
			set(scene, x, y, GLASS[pane.glass][0]);
		}
	}
	set(scene, FLOWER.x - 1, FLOWER.y - 1, C.white);
}

/**
 * The stone frame round the glass, lit on its inner edge, and the reveal splaying out into the wall.
 * @param {Canvas} scene
 */
function drawFrame(scene) {
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			if (onGlass(x, y)) {
				continue;
			}
			if (onGlass(x, y, 1)) {
				set(scene, x, y, FRAME_LIT);
			} else if (onGlass(x, y, FRAME)) {
				set(scene, x, y, x > 32 ? FRAME_SHADE : FRAME_STONE);
			}
		}
	}
	// The deep sill below the glass, lit along its top.
	const { x0, x1, bottom } = WINDOW;
	rect(
		scene,
		x0 - FRAME - 1,
		bottom + 2,
		x1 - x0 + 2 * FRAME + 3,
		1,
		SILL_LIT
	);
	rect(
		scene,
		x0 - FRAME - 1,
		bottom + 3,
		x1 - x0 + 2 * FRAME + 3,
		1,
		FRAME_STONE
	);
}

/**
 * The church wall: dim stone blocks in courses, each a little lighter or darker than the next, darkest towards the corners,
 * with the splayed reveal round the window.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	/** @type {Map<string, Colour>} */
	const blocks = new Map();
	for (let y = 0; y < FLOOR; y++) {
		const course = Math.floor(y / 5);
		for (let x = 0; x < 64; x++) {
			const shifted = x + (course % 2) * 5;
			const joint = y % 5 === 4 || shifted % 10 === 0;
			const key = `${course}_${Math.floor(shifted / 10)}`;
			if (!blocks.has(key)) {
				const r = random();
				blocks.set(
					key,
					r < 0.25 ? WALL_LIGHT : r > 0.8 ? WALL_DARK : WALL
				);
			}
			const far = Math.hypot(x - 32, (y - 26) * 0.8) > 36;
			let colour = far
				? WALL_DARK
				: /** @type {Colour} */ (blocks.get(key));
			if (joint) {
				colour = MORTAR;
			} else if (!far && y % 5 === 0) {
				// Each block's top edge catches a little of the light.
				colour = colour === WALL_DARK ? WALL : WALL_LIGHT;
			}
			set(layer, x, y, colour);
		}
	}
	// The reveal: smooth stone, lit nearest the glass.
	for (let y = 0; y < FLOOR; y++) {
		for (let x = 0; x < 64; x++) {
			if (onGlass(x, y, FRAME)) {
				continue;
			}
			for (let k = 1; k <= REVEAL; k++) {
				if (onGlass(x, y, FRAME + k)) {
					set(layer, x, y, REVEAL_STONE[k - 1]);
					break;
				}
			}
		}
	}
}

/**
 * The flagstone floor: wide slabs whose joints run back towards the window.
 * @param {Canvas} layer
 */
function drawFloor(layer) {
	const courses = [FLOOR, FLOOR + 3, FLOOR + 7];
	for (let y = FLOOR; y < 64; y++) {
		// The joints running back meet at a point behind the window.
		const spread = (y - VANISH.y) / (63 - VANISH.y);
		for (let x = 0; x < 64; x++) {
			const run = (x - VANISH.x) / (VANISH.step * spread);
			const joint =
				courses.includes(y) ||
				Math.abs(run - Math.round(run)) * VANISH.step * spread < 0.5;
			set(layer, x, y, joint ? FLAG_JOINT : FLAG);
		}
	}
}

/**
 * The window's colours thrown on the floor: the glass seen again, upside down and leaning left, laid softly on the flagstones.
 * @param {Canvas} scene
 * @param {(Pane | null)[]} panes
 */
function drawPool(scene, panes) {
	const { left, right, lean, spread } = POOL;
	const { x0, x1, bottom } = WINDOW;
	const top = 4;
	for (let y = FLOOR + 1; y < 64; y++) {
		const near = y - FLOOR - 1;
		const from = left - near * lean;
		const to = right - near * (lean - spread);
		for (let x = Math.floor(from); x <= Math.ceil(to); x++) {
			// The row of glass that lands here: the window's foot near the wall, its point nearest us.
			const wy = Math.round(
				bottom - (near / (64 - FLOOR - 1)) * (bottom - top)
			);
			// Sampled in blocks, so the light lies in soft patches rather than a sharp copy of the panes.
			const wx =
				x0 +
				1 +
				Math.floor((((x - from) / (to - from)) * (x1 - x0)) / 4) * 4;
			const pane = wx >= 0 && wx < 64 ? panes[wy * 64 + wx] : null;
			if (!pane) {
				continue;
			}
			const behind = get(scene, x, y);
			if (!behind) {
				continue;
			}
			set(
				scene,
				x,
				y,
				mix(mix(behind, C.lampGlow, 0.2), GLASS[pane.glass][0], 0.55)
			);
		}
	}
}
