// Fresco: a Roman garden painted into a villa's plaster wall, lemon trees, a cane trellis and birds on a blue-green ground in a Pompeian red border, its right side still bare wet plaster showing the red underdrawing, and pigment bowls and a brush on the painter's plank.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
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

/** How many rows the black frieze along the top fills; the red border fills the wall below it, round the garden panel. */
const FRIEZE = 3;

/** The garden panel inside the red border. */
const PANEL = { x0: 5, y0: 9, x1: 58, y1: 47 };

/** The two lemon trees: the centre of each crown and its radius, and where each trunk meets the ground. */
const TREES = [
	{ x: 16, y: 20, r: 9, foot: 42 },
	{ x: 41, y: 18, r: 8, foot: 42 },
];

/** The cane trellis: its top rail's row, its bottom rail's row, and its posts. */
const TRELLIS = { top: 33, bottom: 45, posts: [7, 20, 33, 46, 58] };

/** The painter's plank: the first row of its top face, the first row of its front edge, and the shadow beneath. */
const PLANK = { top: 53, edge: 59, under: 62 };

/** The bare plaster the day's painting stops short of: its top row, the column its edge wavers about, and the row below which that edge sweeps out to the left, by so many columns a row. */
const BARE = { top: 12, left: 46, bend: 36, slope: 0.75 };

/** The black frieze and its ochre line. */
const FRIEZE_BLACK = mix(C.ink, C.night, 0.6);
const FRIEZE_LINE = mix(C.amber, C.sandShade, 0.4);

/** Pompeian red, laid on in two strokes, and its cream fillet line. */
const RED = mix(C.brickRed, C.amber, 0.22);
const RED_STROKE = mix(C.brickRed, C.brickRedShade, 0.35);
const FILLET = mix(C.cream, C.sand, 0.35);

/** The blue-green ground of the garden, palest at the top. */
const GROUND = [
	mix(C.teal, C.daySky6, 0.62),
	mix(C.teal, C.daySky5, 0.42),
	mix(C.teal, C.daySky4, 0.25),
	mix(C.teal, C.tealShade, 0.3),
];

/** The lemon trees' leaves, from the shaded depths to the leaves catching the light, their fruit and their trunks. */
const LEAF_DARK = mix(C.pineShade, C.tealShade, 0.35);
const LEAF = mix(C.pine, C.grassShade, 0.4);
const LEAF_LIT = mix(C.grass, C.grassLight, 0.35);
const LEMON = C.gold;
const LEMON_SHADE = C.amber;
const LEMON_LIT = C.lampGlow;
const TRUNK = C.timber;
const TRUNK_SHADE = C.timberShade;

/** The cane trellis: lit and shaded canes. */
const CANE = mix(C.cream, C.sandLight, 0.4);
const CANE_SHADE = mix(C.sandShade, C.creamShade, 0.4);

/** Low flowering shrubs behind the trellis. */
const SHRUB = mix(LEAF_DARK, C.pine, 0.4);
const BLOSSOM = C.creamLight;

/** The swallow: its dark blue back and pale belly. */
const SWALLOW = mix(C.nightSea2, C.roof, 0.35);
const SWALLOW_BELLY = C.cream;

/** The dove on the rail. */
const DOVE = {
	white: C.white,
	shade: C.stoneLight,
	dark: C.stoneMid,
	beak: C.amber,
	eye: C.ink,
};

/** Bare wet plaster, its damp patches, the dry ridge where the day's patch was trowelled on, and the red sinopia underdrawing. */
const WET = mix(C.plasterLight, C.stoneLight, 0.45);
const WET_DAMP = mix(C.plaster, C.stoneLight, 0.4);
const RIDGE = mix(C.creamLight, C.plasterLight, 0.5);
const SINOPIA = mix(C.brickRedShade, C.brickRed, 0.35);

/** The plank's lit top, its grain, its front edge and the shadow under it. */
const BOARD_LIT = mix(C.sandLight, C.sand, 0.3);
const BOARD = mix(C.sand, C.timberLight, 0.35);
const BOARD_GRAIN = mix(C.sandShade, C.timberLight, 0.45);
const BOARD_EDGE = C.timber;
const BOARD_DARK = C.timberShade;
const UNDER = mix(C.wood, C.ink, 0.3);
const BOARD_SHADOW = mix(C.timberLight, C.sandShade, 0.4);

/** The brush's cord binding and its bare bristles. */
const CORD = mix(C.cream, C.sand, 0.5);
const CORD_SHADE = C.sandShade;
const BRISTLE = mix(C.sandShade, C.timberLight, 0.3);

/** The terracotta bowls: lit, plain and shaded. */
const CLAY_LIT = mix(C.brickRedLight, C.sand, 0.35);
const CLAY = mix(C.brickRed, C.timberLight, 0.55);
const CLAY_SHADE = mix(C.brickRedShade, C.timber, 0.5);

/**
 * Each pigment, lit and plain: red earth for the border, green earth for the ground, yellow ochre for the lemons.
 * @type {Record<'red' | 'green' | 'yellow', [Colour, Colour]>}
 */
const PIGMENTS = {
	red: [mix(RED, C.brickRedLight, 0.5), RED],
	green: [GROUND[1], GROUND[3]],
	yellow: [C.gold, mix(C.gold, C.amber, 0.55)],
};

/** The pigment bowls on the plank: each one's left column and its pigment. */
const BOWLS = [
	{ x: 27, pigment: PIGMENTS.red },
	{ x: 39, pigment: PIGMENTS.green },
	{ x: 51, pigment: PIGMENTS.yellow },
];

/**
 * Draws the Fresco masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(7703);

	drawFrieze(layer);
	drawBorder(layer, random);
	drawGround(layer, random);
	drawShrubs(layer, random);
	for (const tree of TREES) {
		drawTree(layer, tree, random);
	}
	drawTrellis(layer);
	drawDove(layer, 23, TRELLIS.top - 5);
	drawSwallow(layer, 26, 11);
	drawBarePlaster(layer);
	drawPlank(layer, random);

	for (const bowl of BOWLS) {
		drawBowl(scene, bowl.x, bowl.pigment);
	}
	drawBrush(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	// Daylight from a window off to the left, raking across the wall and the plank.
	glow(scene, {
		x: -10,
		y: 22,
		radius: 46,
		colour: C.creamLight,
		strength: 0.2,
		steps: 2,
		skip: [C.ink],
	});
	drawGlints(scene);
	return scene;
}

/**
 * The black frieze along the top of the wall, with an ochre line along its foot.
 * @param {Canvas} layer
 */
function drawFrieze(layer) {
	rect(layer, 0, 0, 64, FRIEZE, FRIEZE_BLACK);
	rect(layer, 0, FRIEZE - 1, 64, 1, FRIEZE_LINE);
}

/**
 * The Pompeian red border round the panel, in loose strokes, with a cream fillet on each side of it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBorder(layer, random) {
	for (let y = FRIEZE; y < PLANK.top; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, random() < 0.16 ? RED_STROKE : RED);
		}
	}
	// The fillets: one along the frieze, one round the panel.
	rect(layer, 0, FRIEZE, 64, 1, FILLET);
	rect(layer, PANEL.x0 - 1, PANEL.y0 - 1, PANEL.x1 - PANEL.x0 + 3, 1, FILLET);
	rect(layer, PANEL.x0 - 1, PANEL.y1 + 1, PANEL.x1 - PANEL.x0 + 3, 1, FILLET);
	rect(layer, PANEL.x0 - 1, PANEL.y0 - 1, 1, PANEL.y1 - PANEL.y0 + 3, FILLET);
	rect(layer, PANEL.x1 + 1, PANEL.y0 - 1, 1, PANEL.y1 - PANEL.y0 + 3, FILLET);
}

/**
 * The blue-green ground of the garden: bands from pale to deep, their edges laid on in short strokes.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	const { x0, y0, x1, y1 } = PANEL;
	for (let y = y0; y <= y1; y++) {
		let x = x0;
		while (x <= x1) {
			const length = 2 + Math.floor(random() * 4);
			const t = (y - y0 + random() * 5 - 2.5) / (y1 - y0 + 1);
			const band = Math.max(
				0,
				Math.min(GROUND.length - 1, Math.floor(t * GROUND.length))
			);
			rect(layer, x, y, Math.min(length, x1 - x + 1), 1, GROUND[band]);
			x += length;
		}
	}
}

/**
 * Low flowering shrubs along the foot of the panel, behind the trellis.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawShrubs(layer, random) {
	for (let x = PANEL.x0; x <= PANEL.x1; x++) {
		const top =
			36 +
			Math.round(Math.sin(x * 0.55) * 1.6 + Math.sin(x * 0.21) * 1.4);
		for (let y = top; y <= PANEL.y1; y++) {
			const r = random();
			set(layer, x, y, y === top || r < 0.25 ? LEAF : SHRUB);
		}
		if (random() < 0.3) {
			set(layer, x, top + 1 + Math.floor(random() * 4), BLOSSOM);
		}
	}
}

/**
 * A lemon tree painted on the wall: a thin trunk and a round crown of leaf dabs, lit from the upper left, hung with lemons.
 * @param {Canvas} layer
 * @param {{ x: number, y: number, r: number, foot: number }} tree
 * @param {() => number} random
 */
function drawTree(layer, { x: cx, y: cy, r, foot }, random) {
	// The trunk and a fork into the crown.
	for (let y = cy + 2; y <= foot; y++) {
		set(layer, cx, y, TRUNK);
		set(layer, cx + 1, y, TRUNK_SHADE);
	}
	line(layer, cx, cy + 5, cx - 3, cy + 2, TRUNK);
	line(layer, cx + 1, cy + 4, cx + 4, cy + 1, TRUNK_SHADE);
	// The crown: a lumpy round of leaves.
	for (let y = cy - r - 1; y <= cy + r; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const lump = Math.sin(Math.atan2(dy, dx) * 5) * 0.9;
			const d = Math.hypot(dx, dy * 1.12);
			if (d > r + lump) {
				continue;
			}
			// Facing the light on the upper left.
			const facing = (-dx - dy) / r + (random() - 0.5) * 0.9;
			let colour = LEAF;
			if (facing > 0.7) {
				colour = LEAF_LIT;
			} else if (facing < -0.45 || d > r + lump - 1.2) {
				colour = LEAF_DARK;
			}
			// Leaves as short strokes: leave some ground showing through near the edge.
			if (d > r - 1.5 && random() < 0.18) {
				continue;
			}
			set(layer, x, y, colour);
		}
	}
	// The lemons, hanging all through the crown.
	for (let i = 0; i < 9; i++) {
		const angle = random() * Math.PI * 2;
		const reach = Math.sqrt(random()) * (r - 2.5);
		const lx = Math.round(cx + Math.cos(angle) * reach);
		const ly = Math.round(cy + Math.sin(angle) * reach);
		set(layer, lx, ly, LEMON);
		set(layer, lx + 1, ly, LEMON);
		set(layer, lx, ly + 1, LEMON);
		set(layer, lx + 1, ly + 1, LEMON_SHADE);
		if (i % 3 === 0) {
			set(layer, lx, ly, LEMON_LIT);
		}
	}
}

/**
 * The cane trellis across the front of the garden: rails, posts and canes crossing on the diagonal.
 * @param {Canvas} layer
 */
function drawTrellis(layer) {
	const { top, bottom, posts } = TRELLIS;
	for (let y = top + 2; y < bottom; y++) {
		for (let x = PANEL.x0; x <= PANEL.x1; x++) {
			if ((x + y) % 6 === 0) {
				set(layer, x, y, CANE);
			} else if ((x - y + 60) % 6 === 0) {
				set(layer, x, y, CANE_SHADE);
			}
		}
	}
	for (const x of posts) {
		rect(layer, x, top - 1, 1, bottom - top + 2, CANE);
		rect(layer, x + 1, top - 1, 1, bottom - top + 2, CANE_SHADE);
		set(layer, x, top - 2, CANE);
	}
	rect(layer, PANEL.x0, top, PANEL.x1 - PANEL.x0 + 1, 1, CANE);
	rect(layer, PANEL.x0, top + 1, PANEL.x1 - PANEL.x0 + 1, 1, CANE_SHADE);
	rect(layer, PANEL.x0, bottom, PANEL.x1 - PANEL.x0 + 1, 1, CANE);
}

/**
 * A white dove perched on the trellis rail, facing left.
 * @param {Canvas} layer
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawDove(layer, x, y) {
	paint(
		layer,
		x,
		y,
		[
			'.ww......',
			'bwew.....',
			'.wwwwwws.',
			'..swwwsdd',
			'...ssss..',
			'....b.b..',
		],
		{
			w: DOVE.white,
			s: DOVE.shade,
			d: DOVE.dark,
			b: DOVE.beak,
			e: DOVE.eye,
		}
	);
}

/**
 * A swallow darting between the trees, its wings swept up and its forked tail behind.
 * @param {Canvas} layer
 * @param {number} x - Left column
 * @param {number} y - Top row
 */
function drawSwallow(layer, x, y) {
	paint(
		layer,
		x,
		y,
		['.....dd.', '....dd..', '.dddddd.', 'dwwwdd.d', '.....ddd'],
		{ d: SWALLOW, w: SWALLOW_BELLY }
	);
}

/**
 * Whether a point of the wall is still bare: the right of the panel below its top, the day's edge wavering down
 * through the right-hand tree and then sweeping out to the lower left above the plank.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function isBare(x, y) {
	const { top, left, bend, slope } = BARE;
	if (y >= PLANK.top || y < top + Math.round(Math.sin(x * 0.7) * 1.2)) {
		return false;
	}
	const edge = left + Math.sin(y * 0.45) * 2 - Math.max(0, y - bend) * slope;
	return x >= Math.round(edge);
}

/**
 * The right of the wall, not painted yet: wet grey plaster with damp patches, a pale ridge along the edge of the painted patch,
 * and the red sinopia underdrawing that carries the tree, the trellis and the border on into it.
 * @param {Canvas} layer
 */
function drawBarePlaster(layer) {
	for (let y = 0; y < PLANK.top; y++) {
		for (let x = 0; x < 64; x++) {
			if (!isBare(x, y)) {
				continue;
			}
			const ridge = !isBare(x - 1, y) || !isBare(x, y - 1);
			const damp =
				Math.sin(x * 0.4 + y * 0.3) + Math.sin(x * 0.17 - y * 0.5) >
				1.1;
			set(layer, x, y, ridge ? RIDGE : damp ? WET_DAMP : WET);
		}
	}
	/**
	 * Draws one pixel of sinopia, but only on bare plaster.
	 * @param {number} x
	 * @param {number} y
	 */
	const sketch = (x, y) => {
		const colour = get(layer, x, y);
		if (colour === WET || colour === WET_DAMP) {
			set(layer, x, y, SINOPIA);
		}
	};
	// The rest of the right-hand tree: the round of its crown, its trunk and a few lemons, outlined only.
	const tree = TREES[1];
	for (let y = tree.y - tree.r - 2; y <= tree.foot; y++) {
		for (let x = tree.x - tree.r - 2; x <= tree.x + tree.r + 2; x++) {
			const d = Math.hypot(x - tree.x, (y - tree.y) * 1.12);
			if (Math.abs(d - tree.r) < 0.55) {
				sketch(x, y);
			}
		}
		if (y > tree.y + tree.r - 1) {
			sketch(tree.x, y);
			sketch(tree.x + 2, y);
		}
	}
	for (const [lx, ly] of [
		[tree.x + 5, tree.y - 2],
		[tree.x + 3, tree.y + 3],
	]) {
		sketch(lx, ly);
		sketch(lx + 1, ly - 1);
		sketch(lx + 2, ly);
		sketch(lx + 1, ly + 1);
	}
	// Ruled lines for the border's inner edge and the trellis rails, and the canes hatched between them in one direction only.
	for (let y = PANEL.y0; y < PLANK.top; y++) {
		sketch(PANEL.x1 + 1, y);
	}
	for (let x = 0; x < 64; x++) {
		sketch(x, PANEL.y1 + 1);
		sketch(x, TRELLIS.top);
		sketch(x, TRELLIS.bottom);
	}
	for (let y = TRELLIS.top + 2; y < TRELLIS.bottom; y++) {
		for (let x = 0; x <= PANEL.x1; x++) {
			if ((x + y) % 6 === 0) {
				sketch(x, y);
			}
		}
	}
}

/**
 * The painter's plank across the foot of the wall: a lit top with its grain, a front edge, and deep shadow below.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawPlank(layer, random) {
	const { top, edge, under } = PLANK;
	rect(layer, 0, top, 64, edge - top, BOARD);
	rect(layer, 0, top, 64, 1, BOARD_LIT);
	for (let i = 0; i < 7; i++) {
		const x = Math.floor(random() * 56);
		const y = top + 1 + Math.floor(random() * (edge - top - 1));
		rect(layer, x, y, 5 + Math.floor(random() * 8), 1, BOARD_GRAIN);
	}
	rect(layer, 0, edge, 64, under - edge, BOARD_EDGE);
	rect(layer, 0, under - 1, 64, 1, BOARD_DARK);
	rect(layer, 0, under, 64, 64 - under, UNDER);
	// The bowls' shadows on the plank, thrown to the right, away from the window.
	for (const bowl of BOWLS) {
		rect(layer, bowl.x + 4, top + 2, 6, 3, BOARD_SHADOW);
	}
}

/**
 * A terracotta bowl of pigment on the plank: a round body lit on the left, its rim, and the powdered colour heaped inside.
 * @param {Canvas} scene
 * @param {number} x - Left column
 * @param {[Colour, Colour]} pigment - Lit and plain
 */
function drawBowl(scene, x, [lit, plain]) {
	const y = PLANK.top - 4;
	paint(
		scene,
		x,
		y,
		[
			'...hhh...',
			'.rhhppbr.',
			'rbppppppr',
			'lcccccccs',
			'lcccccccs',
			'.lcccccs.',
			'..lccss..',
		],
		{
			h: lit,
			p: plain,
			b: CLAY_SHADE,
			r: CLAY_SHADE,
			l: CLAY_LIT,
			c: CLAY,
			s: CLAY_SHADE,
		}
	);
}

/**
 * The broad brush lying on the plank, its bristles still wet with green earth.
 * @param {Canvas} scene
 */
function drawBrush(scene) {
	const tail = { x: 3, y: 58 };
	const neck = { x: 15, y: 56 };
	line(scene, tail.x, tail.y - 1, neck.x, neck.y - 1, C.timber);
	line(scene, tail.x, tail.y, neck.x, neck.y, C.timberShade);
	set(scene, tail.x, tail.y - 1, C.timberLight);
	// The cord binding, then the bristles, wet with green earth.
	rect(scene, neck.x + 1, neck.y - 2, 3, 3, CORD);
	set(scene, neck.x + 2, neck.y - 2, CORD_SHADE);
	set(scene, neck.x + 2, neck.y, CORD_SHADE);
	rect(scene, neck.x + 4, neck.y - 2, 5, 3, BRISTLE);
	rect(scene, neck.x + 4, neck.y - 2, 5, 1, PIGMENTS.green[0]);
	rect(scene, neck.x + 6, neck.y - 1, 4, 2, PIGMENTS.green[1]);
	set(scene, neck.x + 10, neck.y, PIGMENTS.green[1]);
}

/**
 * Small finishing touches over the outline: a wet gleam on the bristles and on each bowl's rim.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const bowl of BOWLS) {
		set(scene, bowl.x + 1, PLANK.top - 1, mix(CLAY_LIT, C.white, 0.5));
	}
	set(scene, 21, 54, C.ghostLight);
}
