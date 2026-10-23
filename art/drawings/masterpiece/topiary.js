// Topiary: a box hedge clipped into a big peacock with its tail fanned, in a walled formal garden by day, a gardener on a stepladder snipping its rim with long shears, clippings on the lawn and a clipped cone and ball behind.
import {
	createCanvas,
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The rows of the setting: the last sky row, the wall's coping, the wall's face, the gravel bed and the lawn. */
const ROWS = { sky: 24, coping: 25, wall: 28, gravel: 45, lawn: 48 };

/** The peacock's fanned tail: its centre, its half width and height, and how many feathers it fans into. */
const TAIL = { x: 35, y: 47, rx: 25, ry: 32, feathers: 11 };

/** The peacock's body, an egg leaning forward to the left. */
const BODY = { x: 28, y: 42, rx: 9, ry: 10 };

/** The neck's foot on the breast, and the head at its top. */
const NECK = { x: 25, y: 36 };
const HEAD = { x: 20, y: 14, rx: 3.5, ry: 3 };

/** The clipped block the peacock stands on: its columns and rows. */
const PLINTH = { left: 14, right: 44, top: 49, bottom: 58 };

/** The clipped cone and ball behind, on the left, standing in the bed at the wall's foot. */
const CONE = { x: 4, top: 20, bottom: 44, half: 5 };
const BALL = { x: 8, y: 43, r: 4.6 };

/** The stepladder seen from the front: its rails' columns at the foot and at the top step, that step's row, and its rungs' rows. */
const LADDER = { foot: [51, 62], top: [53, 60], step: 48, rungs: [52, 56, 60] };

/** The gardener's top-left corner (the hat's crown). */
const GARDENER = { x: 52, y: 27 };

/** The shears: their pivot, the two hands on the handles and the two blade tips straddling the tail's rim. */
const SHEARS = {
	pivot: [45, 26],
	hands: [
		[50, 33],
		[49, 36],
	],
	tips: [
		[43, 16],
		[39, 22],
	],
};

/** The sun stands high on the left: the direction its light comes from, as a unit vector (x right, y down, z out). */
const SUN = normalise([-0.55, -0.6, 0.58]);

/** Clipped box from deep shade to sunlit leaf tips. */
const HEDGE = [
	mix(C.pineShade, C.ink, 0.35),
	C.pineShade,
	C.pine,
	C.pineLight,
	mix(C.pineLight, C.grassLight, 0.55),
	mix(C.grassLight, C.lampGlow, 0.25),
];

/** The cone and ball further back, a little cooler and darker in the wall's shelter. */
const BACK_HEDGE = HEDGE.slice(0, 5).map((tone) =>
	mix(tone, C.tealShade, 0.25)
);

/** The sky, from the top down to a warm haze over the wall. */
const SKY = [
	C.daySky2,
	C.daySky3,
	C.daySky4,
	C.daySky5,
	C.daySky6,
	mix(C.daySky6, C.sandLight, 0.45),
];

/** The sandstone garden wall: its coping, its blocks' lit tops and faces, and the mortar. */
const COPING_LIGHT = mix(C.stoneLight, C.creamLight, 0.5);
const COPING = mix(C.stoneLight, C.sand, 0.35);
const COPING_SHADOW = mix(C.sandShade, C.stoneShade, 0.5);
const BLOCK_LIGHT = mix(C.sandLight, C.cream, 0.4);
const BLOCK = mix(C.sand, C.cream, 0.35);
const BLOCK_ALT = mix(C.sand, C.sandShade, 0.35);
const MORTAR = mix(C.sandShade, C.stone, 0.3);

/** The gravel bed at the wall's foot. */
const GRAVEL = mix(C.cream, C.stoneLight, 0.4);
const GRAVEL_DARK = mix(C.creamShade, C.stone, 0.3);

/** The lawn, and the shadows the plinth and the ladder throw across it to the right. */
const LAWN_LIGHT = mix(C.grassLight, C.sandLight, 0.25);
const LAWN = mix(C.grassLight, C.grass, 0.45);
const LAWN_DARK = C.grass;
const LAWN_SHADOW = mix(C.grassShade, C.forestFloorShade, 0.6);

/** The fresh clippings: young pale leaves, yellower than the clipped face. */
const CLIPPING_LIGHT = mix(C.grassLight, C.lampGlow, 0.45);
const CLIPPING = mix(C.grassLight, C.gold, 0.3);
const CLIPPING_DARK = C.forestFloorLight;

/** The heap of clippings at the ladder's foot: its middle column and its height. */
const HEAP = { x: 48, height: 4 };

/** The gardener's straw hat, its band, his shirt and his denim overalls. */
const STRAW = { lit: C.sandLight, base: C.sand, shade: C.sandShade };
const DENIM = {
	lit: mix(C.daySky2, C.daySky4, 0.5),
	base: mix(C.daySky1, C.roof, 0.3),
	shade: mix(C.roof, C.roofShade, 0.4),
};

/**
 * Draws the Topiary masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const random = seededRandom(1689);

	const layer = createCanvas(64, 64);
	drawSky(layer);
	drawWisp(layer, 2, 5, 14);
	drawWisp(layer, 40, 9, 18);
	drawWisp(layer, 30, 3, 9);
	drawWall(layer, random);
	drawGround(layer, random);

	// The cone and ball behind, the tail, then the bird in front of its own tail, each outlined on its own.
	const back = createCanvas(64, 64);
	drawCone(back, random);
	outline(back, C.ink);
	const ball = createCanvas(64, 64);
	drawBall(ball, random);
	outline(ball, C.ink);
	underlay(ball, back);
	underlay(ball, layer);

	const tail = createCanvas(64, 64);
	drawTail(tail, random);
	outline(tail, C.ink);
	underlay(tail, ball);

	const bird = createCanvas(64, 64);
	drawPlinth(bird, random);
	drawBody(bird, random);
	outline(bird, C.ink);
	underlay(bird, tail);

	const ladder = createCanvas(64, 64);
	drawLadder(ladder);
	outline(ladder, C.ink);
	underlay(ladder, bird);

	const scene = createCanvas(64, 64);
	drawShears(scene);
	drawGardener(scene);
	outline(scene, C.ink);
	underlay(scene, ladder);

	drawClippings(scene, random);
	return scene;
}

/**
 * Scales a vector to unit length.
 * @param {[number, number, number]} v
 * @returns {[number, number, number]}
 */
function normalise([x, y, z]) {
	const length = Math.hypot(x, y, z);
	return [x / length, y / length, z / length];
}

/**
 * Picks a tone of clipped box for how much a leafy surface faces the sun, jittered leaf by leaf.
 * @param {number} facing - From -1 (turned away) to 1 (facing the sun)
 * @param {() => number} random
 * @param {{ tones?: readonly Colour[], jitter?: number }} [options] - The ramp to pick from, and how much the leaves vary
 * @returns {Colour}
 */
function hedgeTone(facing, random, { tones = HEDGE, jitter = 0.45 } = {}) {
	const t = facing + (random() - 0.5) * jitter;
	const index = Math.round(((t + 0.6) / 1.6) * (tones.length - 1));
	return tones[Math.max(0, Math.min(tones.length - 1, index))];
}

/**
 * How much a point on a rounded body faces the sun, from its place across the body.
 * @param {number} nx - Across the body, -1 to 1
 * @param {number} ny - Down the body, -1 to 1
 * @param {number} [depth=1] - How round the body is towards us: below 1 is flatter
 * @returns {number}
 */
function facingAt(nx, ny, depth = 1) {
	const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)) / depth;
	const [x, y, z] = normalise([nx, ny, nz]);
	return x * SUN[0] + y * SUN[1] + z * SUN[2];
}

/**
 * The day sky, dithered between its bands, warming to a haze over the wall.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	for (let y = 0; y <= ROWS.sky; y++) {
		const t = (y / ROWS.sky) * (SKY.length - 1);
		const i = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < SKY.length && t - i > 0.55 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[i + 1] : SKY[i]);
		}
	}
}

/**
 * A thin wisp of high cloud: a bright streak with a fainter tail on each side and a soft underside.
 * @param {Canvas} layer
 * @param {number} x - The wisp's left column
 * @param {number} y - Its row
 * @param {number} length - Its length in pixels
 */
function drawWisp(layer, x, y, length) {
	rect(layer, x + 2, y, length - 4, 1, C.white);
	rect(layer, x, y, 2, 1, C.cloudShade);
	rect(layer, x + length - 2, y, 2, 1, C.cloudShade);
	rect(layer, x + 4, y + 1, length - 6, 1, C.cloudShade);
	rect(layer, x + 5, y - 1, Math.floor(length / 3), 1, C.cloudShade);
}

/**
 * The sandstone garden wall across the back: a coping with its shadow under it, then courses of blocks.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWall(layer, random) {
	rect(layer, 0, ROWS.coping, 64, 1, COPING_LIGHT);
	rect(layer, 0, ROWS.coping + 1, 64, 1, COPING);
	rect(layer, 0, ROWS.coping + 2, 64, 1, COPING_SHADOW);
	for (let top = ROWS.wall; top < ROWS.gravel; top += 4) {
		const offset = ((top - ROWS.wall) / 4) % 2 ? 5 : 0;
		for (let start = -offset; start < 64; start += 10) {
			const tone = random() > 0.6 ? BLOCK_ALT : BLOCK;
			for (let y = top; y < Math.min(top + 3, ROWS.gravel); y++) {
				for (let x = start; x < start + 9; x++) {
					set(layer, x, y, y === top ? BLOCK_LIGHT : tone);
				}
			}
			rect(layer, start + 9, top, 1, 3, MORTAR);
		}
		rect(layer, 0, top + 3, 64, 1, MORTAR);
	}
}

/**
 * The gravel bed at the wall's foot and the lawn in front, with tufts of grass and the shadows thrown to the right.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	for (let y = ROWS.gravel; y < ROWS.lawn; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, random() > 0.7 ? GRAVEL_DARK : GRAVEL);
		}
	}
	for (let y = ROWS.lawn; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = LAWN;
			if (y === ROWS.lawn) {
				colour = LAWN_LIGHT;
			} else if (y > 59 && (x + y) % 2 === 0) {
				colour = LAWN_DARK;
			}
			set(layer, x, y, colour);
		}
	}
	// Tufts: a lit blade over a shaded root.
	for (let i = 0; i < 30; i++) {
		const x = Math.floor(random() * 64);
		const y = ROWS.lawn + 2 + Math.floor(random() * (62 - ROWS.lawn));
		set(layer, x, y, LAWN_LIGHT);
		set(layer, x, y + 1, LAWN_DARK);
	}
	// The plinth's shadow, thrown to the right of it, and the ladder's.
	for (let y = 54; y < 62; y++) {
		for (let x = PLINTH.right + 1; x <= PLINTH.right + 9 - (61 - y); x++) {
			set(layer, x, y, LAWN_SHADOW);
		}
	}
	for (let x = 58; x < 64; x++) {
		set(layer, x, 63, LAWN_SHADOW);
		set(layer, x + 1, 62, LAWN_SHADOW);
	}
}

/**
 * The clipped cone behind on the left, standing in the gravel bed.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawCone(canvas, random) {
	const { x: cx, top, bottom, half } = CONE;
	for (let y = top; y <= bottom; y++) {
		const reach = ((y - top) / (bottom - top)) * half + 0.6;
		for (let x = Math.round(cx - reach); x <= Math.round(cx + reach); x++) {
			const nx = (x - cx) / Math.max(reach, 1);
			set(
				canvas,
				x,
				y,
				hedgeTone(facingAt(nx * 0.9, -0.3), random, {
					tones: BACK_HEDGE,
				})
			);
		}
	}
}

/**
 * The clipped ball in front of the cone.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawBall(canvas, random) {
	const { x: cx, y: cy, r } = BALL;
	for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++) {
		for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
			const nx = (x - cx) / r;
			const ny = (y - cy) / r;
			if (nx * nx + ny * ny < 1) {
				set(
					canvas,
					x,
					y,
					hedgeTone(facingAt(nx, ny), random, { tones: BACK_HEDGE })
				);
			}
		}
	}
}

/**
 * The fanned tail behind the bird: an upright half oval of clipped feathers, each with a groove along it,
 * a rounded tip on the rim and a round eye clipped near its end.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawTail(canvas, random) {
	const { x: cx, y: cy, rx, ry, feathers } = TAIL;
	const step = Math.PI / feathers;
	for (let y = cy - ry - 2; y <= cy; y++) {
		for (let x = cx - rx - 2; x <= cx + rx + 2; x++) {
			const u = (x - cx) / rx;
			const v = (y - cy) / ry;
			const angle = Math.atan2(v, u);
			const feather = Math.floor((angle + Math.PI) / step);
			if (feather < 0 || feather >= feathers) {
				continue;
			}
			// Where the point falls across its feather, from 0 at one groove to 1 at the next.
			const across = (angle + Math.PI) / step - feather;
			const lobe = Math.sin(across * Math.PI);
			const d = Math.hypot(u, v);
			const rim = 0.9 + Math.sqrt(lobe) * 0.1;
			if (d > rim) {
				continue;
			}
			// Each feather is a rounded pleat, lit on its sunward side, over the fan's own light.
			let facing = facingAt(u * 0.6, v * 0.6, 2) + (0.5 - across) * 0.7;
			const groove = Math.min(across, 1 - across) * step * d * ry;
			if (groove < 0.7 && d > 0.2) {
				facing = -0.6;
			} else if (d > rim - 0.06) {
				// The tip of each feather catches the light along its edge.
				facing += 0.3;
			}
			// The round eye clipped near each feather's end: a raised ring round a hollow.
			const middle = -Math.PI + (feather + 0.5) * step;
			const eye = Math.hypot(
				x - (cx + Math.cos(middle) * rx * 0.74),
				y - (cy + Math.sin(middle) * ry * 0.74)
			);
			if (eye < 1.3) {
				facing = -0.6;
			} else if (eye < 2.6) {
				facing = 0.85;
			}
			set(canvas, x, y, hedgeTone(facing, random, { jitter: 0.2 }));
		}
	}
}

/**
 * The clipped block the bird stands on: a box with rounded top corners, its front lit and its right end in shade.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawPlinth(canvas, random) {
	const { left, right, top, bottom } = PLINTH;
	for (let y = top; y <= bottom; y++) {
		for (let x = left; x <= right; x++) {
			const corner = y === top && (x === left || x === right);
			if (corner) {
				continue;
			}
			let facing = 0.15;
			if (y <= top + 1) {
				facing = 0.7;
			} else if (x >= right - 3) {
				facing = -0.4;
			} else if (x <= left + 1) {
				facing = 0.45;
			} else if (y >= bottom - 1) {
				facing = -0.15;
			}
			set(canvas, x, y, hedgeTone(facing, random));
		}
	}
}

/**
 * The peacock's body, neck and head, with its little beak and a crest of three tufts on stalks.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawBody(canvas, random) {
	// The body: an egg, fuller at the breast.
	for (let y = BODY.y - BODY.ry; y < PLINTH.top; y++) {
		for (let x = BODY.x - BODY.rx - 1; x <= BODY.x + BODY.rx; x++) {
			const nx = (x - BODY.x) / BODY.rx;
			const ny = (y - BODY.y) / BODY.ry;
			const bulge = nx < 0 ? 1 - ny * 0.15 : 1;
			if ((nx / bulge) ** 2 + ny * ny < 1) {
				set(
					canvas,
					x,
					y,
					hedgeTone(facingAt(nx * 0.95, ny * 0.95), random)
				);
			}
		}
	}
	// The neck: a thick stalk curving up and forward from the breast to the head, thinning as it rises.
	for (let i = 0; i <= 20; i++) {
		const t = i / 20;
		const x = NECK.x + (HEAD.x - NECK.x) * t + Math.sin(t * Math.PI) * -1.5;
		const y = NECK.y + (HEAD.y + 2 - NECK.y) * t;
		const half = 2.6 - t * 0.9;
		for (let dx = -Math.ceil(half); dx <= Math.ceil(half); dx++) {
			if (Math.abs(dx) <= half) {
				const px = Math.round(x + dx);
				set(
					canvas,
					px,
					Math.round(y),
					hedgeTone(facingAt(dx / (half + 0.5), 0), random)
				);
			}
		}
	}
	// The head.
	for (
		let y = Math.floor(HEAD.y - HEAD.ry);
		y <= Math.ceil(HEAD.y + HEAD.ry);
		y++
	) {
		for (
			let x = Math.floor(HEAD.x - HEAD.rx);
			x <= Math.ceil(HEAD.x + HEAD.rx);
			x++
		) {
			const nx = (x - HEAD.x) / HEAD.rx;
			const ny = (y - HEAD.y) / HEAD.ry;
			if (nx * nx + ny * ny < 1.05) {
				set(canvas, x, y, hedgeTone(facingAt(nx, ny), random));
			}
		}
	}
	// The beak, pointing left.
	set(canvas, HEAD.x - 4, HEAD.y, HEDGE[3]);
	set(canvas, HEAD.x - 5, HEAD.y + 1, HEDGE[2]);
	set(canvas, HEAD.x - 4, HEAD.y + 1, HEDGE[2]);
	// The crest: three thin stalks fanning up from the crown, each ending in a little clipped tuft.
	for (const [tx, ty] of [
		[-3, -7],
		[0, -8],
		[3, -7],
	]) {
		line(
			canvas,
			HEAD.x,
			HEAD.y - 3,
			HEAD.x + tx,
			HEAD.y + ty + 1,
			HEDGE[2]
		);
		rect(canvas, HEAD.x + tx - 1, HEAD.y + ty - 1, 2, 2, HEDGE[4]);
		set(canvas, HEAD.x + tx, HEAD.y + ty, HEDGE[3]);
	}
}

/**
 * The wooden stepladder, seen from the front: two rails leaning in towards the top step, with thin rungs between.
 * @param {Canvas} canvas
 */
function drawLadder(canvas) {
	const [footLeft, footRight] = LADDER.foot;
	const [topLeft, topRight] = LADDER.top;
	/**
	 * The column of a rail at a row.
	 * @param {number} foot - The rail's column at the foot
	 * @param {number} top - Its column at the top step
	 * @param {number} y
	 * @returns {number}
	 */
	const railAt = (foot, top, y) =>
		Math.round(
			top + ((foot - top) * (y - LADDER.step)) / (63 - LADDER.step)
		);
	for (const y of LADDER.rungs) {
		const from = railAt(footLeft, topLeft, y) + 2;
		const to = railAt(footRight, topRight, y) - 1;
		rect(canvas, from, y, to - from + 1, 1, C.timberLight);
	}
	for (let y = LADDER.step; y < 64; y++) {
		const left = railAt(footLeft, topLeft, y);
		const right = railAt(footRight, topRight, y);
		set(canvas, left, y, C.timberLight);
		set(canvas, left + 1, y, C.timber);
		set(canvas, right, y, C.timber);
		set(canvas, right + 1, y, C.timberShade);
	}
	// The top step, wider than the rails, lit along its front edge.
	rect(
		canvas,
		topLeft - 1,
		LADDER.step,
		topRight - topLeft + 4,
		1,
		C.timberLight
	);
	rect(
		canvas,
		topLeft - 1,
		LADDER.step + 1,
		topRight - topLeft + 4,
		1,
		C.timber
	);
}

/**
 * The long-handled shears: wooden handles from his hands to the pivot, and two steel blades opened across the rim.
 * @param {Canvas} canvas
 */
function drawShears(canvas) {
	const [px, py] = SHEARS.pivot;
	for (const [hx, hy] of SHEARS.hands) {
		line(canvas, px, py, hx, hy, C.sandLight);
	}
	// Each blade is two pixels deep: a bright cutting edge over the steel.
	for (const [tx, ty] of SHEARS.tips) {
		line(canvas, px, py + 1, tx, ty + 1, C.stone);
		line(canvas, px, py, tx, ty, C.white);
	}
	set(canvas, px, py, C.brass);
	set(canvas, px, py + 1, C.lampFrame);
}

/**
 * The gardener on the ladder, turned to the bird: straw hat, white shirt, denim overalls and boots,
 * both arms raised to the shears.
 * @param {Canvas} canvas
 */
function drawGardener(canvas) {
	paint(
		canvas,
		GARDENER.x,
		GARDENER.y,
		[
			'......hH...',
			'.....hHHd..',
			'.....bbbb..',
			'..hhhHHHHdd',
			'....ssssw..',
			'...SeSSsw..',
			'..SSSSSs...',
			'...SSSs....',
			'....ss.....',
			'...cCCCk...',
			'..cCCCCCk..',
			'..cOOOOqk..',
			'..cxOOxqk..',
			'...oOOOq...',
			'...oOOOq...',
			'...oOOOq...',
			'...oOOOq...',
			'...oO.Oq...',
			'...oO.Oq...',
			'...oO.Oq...',
			'..BBB.BBB..',
		],
		{
			h: STRAW.lit,
			H: STRAW.base,
			d: STRAW.shade,
			b: C.brickRed,
			S: C.skinDeep,
			s: C.skinDeepShade,
			e: C.ink,
			w: C.wood,
			c: C.creamLight,
			C: C.cream,
			k: C.creamShade,
			o: DENIM.lit,
			O: DENIM.base,
			q: DENIM.shade,
			x: C.brass,
			B: C.wood,
		}
	);
	// The arms, raised forward to the handles in long shirt sleeves, the hands bare round the grips.
	const shoulder = [GARDENER.x + 3, GARDENER.y + 10];
	SHEARS.hands.forEach(([hx, hy], i) => {
		const [sx, sy] = [shoulder[0] + i, shoulder[1] + i];
		line(canvas, sx, sy, hx + 2, hy, C.creamLight);
		line(canvas, sx, sy + 1, hx + 2, hy + 1, C.creamShade);
		rect(canvas, hx, hy, 2, 2, C.skinDeep);
		set(canvas, hx + 1, hy + 1, C.skinDeepShade);
	});
}

/**
 * The fresh clippings: a little heap on the lawn under the shears, and a few sprigs still falling.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawClippings(scene, random) {
	// The heap at the ladder's foot, a low mound of loose leaves, lit on its top.
	for (let x = HEAP.x - 5; x <= HEAP.x + 5; x++) {
		const height = Math.round(HEAP.height - Math.abs(x - HEAP.x) * 0.7);
		for (let y = 64 - height; y < 64; y++) {
			const pick = random();
			let colour = pick > 0.45 ? CLIPPING : CLIPPING_DARK;
			if (y === 64 - height && pick > 0.3) {
				colour = CLIPPING_LIGHT;
			}
			set(scene, x, y, colour);
		}
	}
	// Sprigs scattered on the lawn and on the plinth's top, and a few still falling from the shears.
	for (const [x, y] of [
		[12, 60],
		[8, 57],
		[42, 61],
		[56, 61],
		[30, 49],
		[37, 50],
		[42, 49],
		[44, 34],
		[45, 41],
		[47, 52],
	]) {
		set(scene, x, y, CLIPPING);
	}
}
