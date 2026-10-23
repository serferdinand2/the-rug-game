// Armories inspiration tile: the culture row's six innovations, from a feathered ceremonial mask to a glowing VR headset.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { INSIDE, drawInspirationTile } from '../../parts/inspiration-tile.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */
/** @typedef {readonly [number, number]} Point */

/** The last column (and row) of a space's inside, for mirroring symmetric subjects. */
const LAST = INSIDE - 1;

/**
 * Fills every pixel whose centre lies inside a polygon.
 * @param {Canvas} canvas
 * @param {readonly Point[]} points - The corners, in order
 * @param {Colour} colour
 */
function polygon(canvas, points, colour) {
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const px = x + 0.5;
			const py = y + 0.5;
			let within = false;
			for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
				const [xi, yi] = points[i];
				const [xj, yj] = points[j];
				if (
					yi > py !== yj > py &&
					px < ((xj - xi) * (py - yi)) / (yj - yi) + xi
				) {
					within = !within;
				}
			}
			if (within) {
				set(canvas, x, y, colour);
			}
		}
	}
}

/**
 * Fills every pixel whose centre lies inside an ellipse.
 * @param {Canvas} canvas
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @param {Colour} colour
 */
function ellipse(canvas, cx, cy, rx, ry, colour) {
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const dx = (x + 0.5 - cx) / rx;
			const dy = (y + 0.5 - cy) / ry;
			if (dx * dx + dy * dy <= 1) {
				set(canvas, x, y, colour);
			}
		}
	}
}

/**
 * Lights a flat shape from the top left: the pixels of its base colour along its top and left edges
 * take the light tone, those along its bottom and right edges the shade.
 * @param {Canvas} canvas
 * @param {Colour} base
 * @param {Colour} light
 * @param {Colour} shade
 * @param {number} [depth] - How many pixels deep the shade runs
 */
function bevel(canvas, base, light, shade, depth = 1) {
	const empty = (/** @type {number} */ x, /** @type {number} */ y) =>
		!get(canvas, x, y);
	/** @type {[number, number, Colour][]} */
	const marks = [];
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			if (get(canvas, x, y) !== base) {
				continue;
			}
			if (empty(x - 1, y) || empty(x, y - 1)) {
				marks.push([x, y, light]);
				continue;
			}
			for (let d = 1; d <= depth; d++) {
				if (empty(x + d, y) || empty(x, y + d)) {
					marks.push([x, y, shade]);
					break;
				}
			}
		}
	}
	for (const [x, y, colour] of marks) {
		set(canvas, x, y, colour);
	}
}

/**
 * Draws one part on its own layer, outlines it in ink and lays it over what is there,
 * so overlapping parts keep an ink edge between them.
 * @param {Canvas} canvas
 * @param {(layer: Canvas) => void} draw
 */
function sticker(canvas, draw) {
	const layer = createCanvas(canvas.w, canvas.h);
	draw(layer);
	outline(layer, C.ink);
	for (let i = 0; i < layer.p.length; i++) {
		if (layer.p[i]) {
			canvas.p[i] = layer.p[i];
		}
	}
}

/**
 * Paints a pixel and its mirror image across the space's middle column.
 * @param {Canvas} canvas
 * @param {number} x
 * @param {number} y
 * @param {Colour} colour
 */
function twin(canvas, x, y, colour) {
	set(canvas, x, y, colour);
	set(canvas, LAST - x, y, colour);
}

// Space 1, Ceremony: a festival mask painted teal and gold, crowned with a fan of bright plumes and held up on a stick.

/** The plumes' fan: the point they spring from behind the mask, their length and their half-width. */
const FAN = { x: 15, y: 17, length: 15, width: 1.9 };

/** A plume's colours: its lit edge, body and shaded edge. */
const PLUME = {
	green: [C.grassLight, C.grass, C.grassShade],
	blue: [C.daySky5, C.daySky2, C.nightSea1],
	gold: [C.lampGlow, C.gold, C.amber],
};

/** The plumes from the edge of the fan to its middle: their lean from upright, in degrees, their length, and their colours. */
const PLUMES = [
	{ lean: -66, length: 0.86, colours: PLUME.blue },
	{ lean: 66, length: 0.86, colours: PLUME.blue },
	{ lean: -44, length: 0.94, colours: PLUME.gold },
	{ lean: 44, length: 0.94, colours: PLUME.gold },
	{ lean: -22, length: 1, colours: PLUME.green },
	{ lean: 22, length: 1, colours: PLUME.green },
	{ lean: 0, length: 1, colours: PLUME.blue },
];

/** The mask's left half, mirrored for its right: M is the mask, h an eye hole, all set from its top left corner. */
const MASK = { x: 3, y: 13 };
const MASK_HALF = [
	'.........MMM',
	'.....MMMMMMM',
	'...MMMMMMMMM',
	'.MMMMMMMMMMM',
	'MMMhhhhMMMMM',
	'MMhhhhhhMMMM',
	'MMMhhhhMMMMM',
	'.MMMMMMMMMM.',
	'..MMMMMMMM..',
	'....MMMMM...',
];

/** The mask's teal paint: lit, base and shaded; and its gold trim. */
const MASK_PAINT = {
	light: C.tealLight,
	base: C.teal,
	shade: C.tealShade,
	gold: C.gold,
};

/** The stick the mask is held up on, from behind its right cheek to the hand's end. */
const STICK = { from: [22, 19], to: [25, 27] };

/**
 * Paints one plume: a stem from the fan's root swelling to a rounded tip.
 * @param {Canvas} canvas
 * @param {number} lean - Degrees from upright, positive to the right
 * @param {number} length - Its length, as a share of the fan's
 * @param {readonly Colour[]} colours - Lit edge, body and shaded edge
 */
function plume(canvas, lean, length, colours) {
	const [light, body, shade] = colours;
	const angle = (lean * Math.PI) / 180;
	const dx = Math.sin(angle);
	const dy = -Math.cos(angle);
	const reach = FAN.length * length;
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const px = x + 0.5 - FAN.x;
			const py = y + 0.5 - FAN.y;
			const along = (px * dx + py * dy) / reach;
			const across = px * -dy + py * dx;
			if (along < 0 || along > 1) {
				continue;
			}
			const swell = Math.max(0, (along - 0.3) / 0.7);
			const half =
				0.7 +
				(FAN.width - 0.7) *
					Math.sqrt(Math.max(0, 1 - (1 - 2 * swell) ** 2));
			if (Math.abs(across) > half) {
				continue;
			}
			const quill = Math.abs(across) < 0.5 && along < 0.85;
			set(
				canvas,
				x,
				y,
				quill || across < -0.6 ? light : across > 0.6 ? shade : body
			);
		}
	}
}

/**
 * Space 1, Ceremony.
 * @param {Canvas} canvas
 */
function drawCeremony(canvas) {
	for (const { lean, length, colours } of PLUMES) {
		sticker(canvas, (layer) => plume(layer, lean, length, colours));
	}
	sticker(canvas, (layer) => {
		const [x0, y0] = STICK.from;
		const [x1, y1] = STICK.to;
		line(layer, x0, y0, x1, y1, C.timberLight);
		line(layer, x0 + 1, y0, x1 + 1, y1, C.timber);
	});
	sticker(canvas, (layer) => {
		const mirrored = MASK_HALF.map(
			(row) => row + [...row].reverse().join('')
		);
		paint(layer, MASK.x, MASK.y, mirrored, {
			M: MASK_PAINT.base,
			h: C.ink,
		});
		bevel(layer, MASK_PAINT.base, MASK_PAINT.light, MASK_PAINT.shade);
		// Gold rings round the eye holes, which are carved right through.
		/** @type {[number, number][]} */
		const rings = [];
		for (let y = 0; y < INSIDE; y++) {
			for (let x = 0; x < INSIDE; x++) {
				const touches = [
					[1, 0],
					[-1, 0],
					[0, 1],
					[0, -1],
				].some(([dx, dy]) => get(layer, x + dx, y + dy) === C.ink);
				if (get(layer, x, y) === MASK_PAINT.base && touches) {
					rings.push([x, y]);
				}
			}
		}
		for (const [x, y] of rings) {
			set(layer, x, y, MASK_PAINT.gold);
		}
		// A gold diamond on the brow.
		for (const [x, dy] of [
			[14, 1],
			[13, 2],
			[14, 2],
			[14, 3],
		]) {
			twin(layer, x, MASK.y + dy, MASK_PAINT.gold);
		}
		set(layer, 14, MASK.y + 1, C.lampGlow);
	});
}

// Space 2, Racing: a dark bay racehorse in full gallop, legs flung out fore and aft, a red saddle cloth on its back.

/** The dark bay coat: lit, base and shaded. */
const COAT = {
	light: C.timber,
	base: mix(C.timberShade, C.timber, 0.25),
	shade: C.wood,
};

/** The black of the mane, the tail and the hooves. */
const POINTS = { base: mix(C.wood, C.ink, 0.45) };

/** The body: the barrel, the hindquarters and the chest, each a centre and its half-width and half-height. */
const BARREL = { x: 13.5, y: 14.2, rx: 6.8, ry: 4.1 };
const QUARTERS = { x: 8.3, y: 13.4, rx: 4.4, ry: 4.4 };
const CHEST = { x: 18.6, y: 14.2, rx: 3.6, ry: 4 };

/** The neck reaching forward, the head stretched out along it, and the ear laid back. */
const HORSE_NECK = /** @type {const} */ ([
	[16.5, 12],
	[18.5, 9],
	[20.5, 6.5],
	[23, 6.2],
	[23.5, 9],
	[21.5, 13],
	[19.5, 16.5],
]);
const HORSE_HEAD = /** @type {const} */ ([
	[20.5, 6.5],
	[23, 6],
	[27.6, 10],
	[27.6, 12.4],
	[26.4, 13.2],
	[24.5, 12.6],
	[22, 10.5],
]);
const HORSE_EAR = /** @type {const} */ ([
	[20.4, 7],
	[20.4, 4.2],
	[22.4, 6.4],
]);

/** The black mane blown back off the crest, and the tail streaming out behind. */
const HORSE_MANE = /** @type {const} */ ([
	[21, 6.2],
	[18.5, 8.8],
	[16.5, 11.5],
	[14.5, 11],
	[15.5, 9],
	[14.5, 7.8],
	[17.5, 7.4],
	[18, 5.6],
	[20, 5.6],
]);
const TAIL = /** @type {const} */ ([
	[5.5, 11],
	[3.5, 9.5],
	[2, 7.5],
	[3, 10.5],
	[2, 12.5],
	[4.5, 13.5],
]);

/** The legs in the flying gallop, each from the body through the knee or hock to the hoof: the far legs first. */
const LEGS = /** @type {const} */ ([
	{
		near: false,
		points: [
			[18, 18],
			[20, 21],
			[24, 22],
		],
	},
	{
		near: false,
		points: [
			[9, 18],
			[7, 21],
			[4, 23],
		],
	},
	{
		near: true,
		points: [
			[19, 17],
			[22, 19],
			[26, 20],
		],
	},
	{
		near: true,
		points: [
			[7, 17],
			[5, 19],
			[2, 21],
		],
	},
]);

/** The red saddle cloth over the back. */
const CLOTH = /** @type {const} */ ([
	[10.5, 10.5],
	[16, 10.5],
	[15.5, 15.6],
	[11, 15.6],
]);

/** The streaks of the horse's speed, trailing behind it: each its left end, row and length. */
const SPEED = /** @type {const} */ ([
	[4, 5, 6],
	[8, 25, 7],
	[12, 27, 6],
]);

/**
 * Paints a leg: two pixels thick from the body to the knee or hock, one below it.
 * @param {Canvas} canvas
 * @param {readonly (readonly [number, number])[]} points - The joints, from the body to the hoof
 * @param {Colour} colour
 */
function limb(canvas, points, colour) {
	for (let i = 1; i < points.length; i++) {
		const [x0, y0] = points[i - 1];
		const [x1, y1] = points[i];
		line(canvas, x0, y0, x1, y1, colour);
		if (i === 1) {
			const flat = Math.abs(x1 - x0) > Math.abs(y1 - y0);
			const [dx, dy] = flat ? [0, 1] : [1, 0];
			line(canvas, x0 + dx, y0 + dy, x1 + dx, y1 + dy, colour);
		}
	}
}

/**
 * Space 2, Racing.
 * @param {Canvas} canvas
 */
function drawRacing(canvas) {
	// The streaks of speed trailing behind.
	for (const [x, y, length] of SPEED) {
		rect(canvas, x, y, length, 1, C.creamShade);
		set(canvas, x + length - 1, y, C.creamLight);
	}
	for (const { points } of LEGS.filter((leg) => !leg.near)) {
		sticker(canvas, (layer) => hoofed(layer, points, COAT.shade));
	}
	sticker(canvas, (layer) => polygon(layer, TAIL, POINTS.base));
	sticker(canvas, (layer) => {
		for (const part of [BARREL, QUARTERS, CHEST]) {
			ellipse(layer, part.x, part.y, part.rx, part.ry, COAT.base);
		}
		polygon(layer, HORSE_NECK, COAT.base);
		polygon(layer, HORSE_HEAD, COAT.base);
		polygon(layer, HORSE_EAR, COAT.base);
		bevel(layer, COAT.base, COAT.light, COAT.shade);
		polygon(layer, HORSE_MANE, POINTS.base);
		// The eye, the nostril and the red bridle.
		set(layer, 23, 8, C.lampGlow);
		set(layer, 27, 11, C.ink);
		line(layer, 22, 8, 23, 11, C.brickRed);
		// The saddle cloth, trimmed in gold, and the saddle on it.
		polygon(layer, CLOTH, C.brickRed);
		rect(layer, 11, 15, 5, 1, C.gold);
		rect(layer, 11, 11, 5, 1, C.brickRedLight);
		rect(layer, 12, 10, 3, 1, C.timberLight);
	});
	for (const { points } of LEGS.filter((leg) => leg.near)) {
		sticker(canvas, (layer) => hoofed(layer, points, COAT.light));
	}
}

/**
 * Paints a leg in the coat's colour, ending in a black hoof.
 * @param {Canvas} canvas
 * @param {readonly (readonly [number, number])[]} points - The joints, from the body to the hoof
 * @param {Colour} colour
 */
function hoofed(canvas, points, colour) {
	limb(canvas, points, colour);
	const [x, y] = points[points.length - 1];
	set(canvas, x, y, POINTS.base);
}

// Space 3, Team Sports: a leather basketball dropping through the hoop into its net.

/** The ball's centre and radius. */
const BALL = { x: 15, y: 11.4, r: 7.9 };

/** The ball's orange leather: lit, base and shaded, and its black seams. */
const LEATHER = {
	light: mix(C.gold, C.amber, 0.45),
	base: mix(C.amber, C.brickRed, 0.3),
	shade: mix(C.brickRed, C.timber, 0.45),
	seam: C.wood,
};

/** The hoop: its centre, its half-width and half-depth; and the net's foot, its row and half-width. */
const HOOP = { x: 15, y: 18, rx: 11.5, ry: 2.6 };
const NET_FOOT = { y: 28, half: 6.5 };

/** The hoop's red iron, base and shaded, and the net's white cords, near and far. */
const HOOP_IRON = { base: C.brickRed, shade: C.brickRedShade };
const NET_CORD = { near: C.creamLight, far: C.creamShade };

/**
 * Paints the hoop's ring: its far half behind the ball or its near half in front of it.
 * @param {Canvas} canvas
 * @param {boolean} near
 */
function hoop(canvas, near) {
	for (let y = 0; y < INSIDE; y++) {
		for (let x = 0; x < INSIDE; x++) {
			const dx = (x + 0.5 - HOOP.x) / HOOP.rx;
			const dy = (y + 0.5 - HOOP.y) / HOOP.ry;
			const ix = (x + 0.5 - HOOP.x) / (HOOP.rx - 2);
			const iy = (y + 0.5 - HOOP.y) / (HOOP.ry - 1.2);
			if (dx * dx + dy * dy > 1 || ix * ix + iy * iy < 1) {
				continue;
			}
			if (y + 0.5 > HOOP.y !== near) {
				continue;
			}
			set(
				canvas,
				x,
				y,
				near
					? dy > 0.5
						? HOOP_IRON.shade
						: HOOP_IRON.base
					: HOOP_IRON.shade
			);
		}
	}
}

/**
 * Paints the net hanging from the hoop and narrowing to its foot: cords crossing on the diagonal,
 * strung over the ball as it drops through.
 * @param {Canvas} canvas
 */
function net(canvas) {
	const top = Math.round(HOOP.y);
	for (let y = top; y <= NET_FOOT.y; y++) {
		const t = (y - top) / (NET_FOOT.y - top);
		const half = HOOP.rx - 1 + (NET_FOOT.half - HOOP.rx + 1) * t;
		const from = Math.round(HOOP.x - half);
		const to = Math.round(HOOP.x + half) - 1;
		for (let x = from; x <= to; x++) {
			const side = x === from || x === to;
			const u = Math.round(((x - from) / Math.max(1, to - from)) * 16);
			const cord = (u + y) % 4 === 0 || (u - y + 32) % 4 === 0;
			if (cord || side || y === NET_FOOT.y) {
				set(canvas, x, y, side ? NET_CORD.far : NET_CORD.near);
			}
		}
	}
}

/**
 * Space 3, Team Sports.
 * @param {Canvas} canvas
 */
function drawTeamSports(canvas) {
	sticker(canvas, (layer) => hoop(layer, false));
	sticker(canvas, (layer) => {
		for (let y = 0; y < INSIDE; y++) {
			for (let x = 0; x < INSIDE; x++) {
				const dx = (x + 0.5 - BALL.x) / BALL.r;
				const dy = (y + 0.5 - BALL.y) / BALL.r;
				if (dx * dx + dy * dy > 1) {
					continue;
				}
				const lit = -dx * 0.6 - dy * 0.8;
				let colour =
					lit > 0.4
						? LEATHER.light
						: lit < -0.3
							? LEATHER.shade
							: LEATHER.base;
				const seam =
					Math.abs(dy - 0.12 * dx) < 0.07 ||
					Math.abs(dx + 0.12 * dy) < 0.07 ||
					Math.abs(Math.abs(dx) - (0.62 - 0.3 * dy * dy)) < 0.07;
				if (seam) {
					colour = LEATHER.seam;
				}
				set(layer, x, y, colour);
			}
		}
	});
	net(canvas);
	sticker(canvas, (layer) => hoop(layer, true));
}

// Space 4, Tabletop Games: an ivory chess knight on a chequered board, a red die beside it.

/** The board's top, in perspective: its back and front rows, each row's ends, and the rows where each rank of squares starts. */
const BOARD = {
	back: { y: 18, left: 5.5, right: 24.5 },
	front: { y: 27, left: 2.5, right: 27.5 },
	ranks: [18, 20, 23],
	files: 6,
};

/** The board's light and dark squares, and its front edge. */
const CHEQUER = {
	light: mix(C.sand, C.timberLight, 0.35),
	dark: C.timberShade,
	edge: C.timber,
};

/** The ivory knight, facing right: lit, base, shaded and deep, its eye, and the grooves of its mane. */
const KNIGHT = { x: 3, y: 2 };
const KNIGHT_SPRITE = [
	'......M........',
	'.....LMM.......',
	'....LMMMM......',
	'...LMMMMMMM....',
	'..LMMMkMMMMMM..',
	'..LmMMMMMMMMMS.',
	'.LMMMMMMMMMMMMS',
	'.LmMMMMMMSSSkS.',
	'.LMMMMMMS......',
	'LmMMMMMMS......',
	'LMMMMMMMMS.....',
	'LmMMMMMMMMS....',
	'LMMMMMMMMMS....',
	'.LMMMMMMMSS....',
	'..DDDDDDDD.....',
	'.LMMMMMMMMS....',
	'..DDDDDDDD.....',
	'.LMMMMMMMMMS...',
	'LMMMMMMMMMMMS..',
	'SSSSSSSSSSSSS..',
];
const KNIGHT_COLOURS = {
	L: C.creamLight,
	M: C.cream,
	S: C.creamShade,
	D: mix(C.creamShade, C.stoneShade, 0.5),
	k: C.ink,
	m: C.creamShade,
};

/** The red die beside the knight: its top, front and side faces, showing one, three and two pips. */
const DIE = { x: 18, y: 12 };
const DIE_SPRITE = [
	'...TTTTTTT',
	'..TTTpTTTr',
	'.TTTTTTTrr',
	'FFFFFFFrrr',
	'FpFFFFFrrr',
	'FFFFFFFrqr',
	'FFFpFFFrrr',
	'FFFFFFFrqr',
	'FFFFFpFrr.',
	'FFFFFFFr..',
];
const DIE_COLOURS = {
	T: C.brickRedLight,
	F: C.brickRed,
	r: C.brickRedShade,
	p: C.creamLight,
	q: C.creamShade,
};

/**
 * Paints the board: its chequered top in perspective and its front edge.
 * @param {Canvas} canvas
 */
function board(canvas) {
	const { back, front, ranks, files } = BOARD;
	for (let y = back.y; y <= front.y; y++) {
		const t = (y - back.y) / (front.y - back.y);
		const left = back.left + (front.left - back.left) * t;
		const right = back.right + (front.right - back.right) * t;
		const rank = ranks.filter((start) => y >= start).length;
		for (let x = 0; x < INSIDE; x++) {
			const across = (x + 0.5 - left) / (right - left);
			if (across < 0 || across > 1) {
				continue;
			}
			if (y === front.y) {
				set(canvas, x, y, CHEQUER.edge);
				continue;
			}
			const file = Math.floor(across * files);
			set(canvas, x, y, (file + rank) % 2 ? CHEQUER.dark : CHEQUER.light);
		}
	}
}

/**
 * Space 4, Tabletop Games.
 * @param {Canvas} canvas
 */
function drawTabletopGames(canvas) {
	sticker(canvas, board);
	sticker(canvas, (layer) =>
		paint(layer, DIE.x, DIE.y, DIE_SPRITE, DIE_COLOURS)
	);
	sticker(canvas, (layer) =>
		paint(layer, KNIGHT.x, KNIGHT.y, KNIGHT_SPRITE, KNIGHT_COLOURS)
	);
}

// Space 5, Video Games: a grey gamepad with its cross pad and red and blue buttons, its cable curling away.

/** The gamepad's body, the centres and radius of its two grips, and its grey plastic: lit, base, shaded and deep. */
const PAD = { left: 3, right: 26, top: 12, bottom: 21 };
const GRIPS = /** @type {const} */ ([
	[8, 20.5],
	[21, 20.5],
]);
const GRIP_RADIUS = 5.6;
const PLASTIC = {
	light: mix(C.stoneLight, C.snow, 0.45),
	base: C.stoneLight,
	shade: C.stone,
	deep: C.stoneShade,
};

/** The cross pad's centre, and each button's top left corner and colours: lit, base and shaded. */
const CROSS = { x: 8, y: 16 };
const BUTTONS = [
	{ x: 18, y: 17, colours: [C.brickRedLight, C.brickRed, C.brickRedShade] },
	{ x: 22, y: 14, colours: [C.daySky5, C.daySky1, C.nightSea2] },
];

/** The cable, from the top of the pad, curling up and over to the left, and the plug on its end. */
const CABLE = /** @type {const} */ ([
	[14, 11],
	[14, 8],
	[12, 6],
	[9, 6],
	[7, 8],
	[5, 8],
	[4, 7],
	[4, 5],
]);
const PLUG = { x: 3, y: 2, w: 3, h: 4 };

/**
 * Space 5, Video Games.
 * @param {Canvas} canvas
 */
function drawVideoGames(canvas) {
	sticker(canvas, (layer) => {
		for (let i = 1; i < CABLE.length; i++) {
			const [x0, y0] = CABLE[i - 1];
			const [x1, y1] = CABLE[i];
			line(layer, x0, y0, x1, y1, PLASTIC.shade);
		}
		rect(layer, PLUG.x, PLUG.y, PLUG.w, PLUG.h, PLASTIC.base);
		rect(layer, PLUG.x, PLUG.y, 1, PLUG.h, PLASTIC.light);
		rect(
			layer,
			PLUG.x + PLUG.w - 1,
			PLUG.y + 1,
			1,
			PLUG.h - 1,
			PLASTIC.shade
		);
	});
	sticker(canvas, (layer) => {
		rect(
			layer,
			PAD.left + 2,
			PAD.top,
			PAD.right - PAD.left - 3,
			1,
			PLASTIC.base
		);
		rect(
			layer,
			PAD.left,
			PAD.top + 1,
			PAD.right - PAD.left + 1,
			PAD.bottom - PAD.top,
			PLASTIC.base
		);
		for (const [x, y] of GRIPS) {
			ellipse(layer, x + 0.5, y, GRIP_RADIUS, GRIP_RADIUS, PLASTIC.base);
		}
		bevel(layer, PLASTIC.base, PLASTIC.light, PLASTIC.shade, 2);
		// The cross pad, sunk into the plastic.
		rect(layer, CROSS.x - 1, CROSS.y - 3, 3, 7, C.ink);
		rect(layer, CROSS.x - 3, CROSS.y - 1, 7, 3, C.ink);
		rect(layer, CROSS.x, CROSS.y - 2, 1, 5, C.night);
		rect(layer, CROSS.x - 2, CROSS.y, 5, 1, C.night);
		set(layer, CROSS.x, CROSS.y - 2, PLASTIC.deep);
		set(layer, CROSS.x - 2, CROSS.y, PLASTIC.deep);
		// The start and select keys.
		line(layer, 12, 19, 13, 18, PLASTIC.deep);
		line(layer, 15, 19, 16, 18, PLASTIC.deep);
		// The red and blue buttons, each a round cap in a dark well.
		for (const { x, y, colours } of BUTTONS) {
			const [light, base, shade] = colours;
			rect(layer, x, y - 1, 3, 5, C.ink);
			rect(layer, x - 1, y, 5, 3, C.ink);
			rect(layer, x, y, 3, 3, base);
			set(layer, x, y, light);
			set(layer, x + 2, y + 2, shade);
		}
	});
}

// Space 6, Virtual Reality: a dark VR headset strapped for wearing, its visor glowing teal.

/** The headset's body, its corners' radius, and the arch cut out of its foot for the nose. */
const HEADSET = { left: 4, right: 25, top: 8, bottom: 21, corner: 3 };
const NOSE = { x: 15, y: 22, r: 3.6 };

/** The visor set into the body's face. */
const VISOR = { left: 6, right: 23, top: 10, bottom: 18, corner: 2 };

/** The head strap over the top, and the side straps. */
const TOP_STRAP = { x: 15, y: 9, rx: 9.5, ry: 5.5, width: 2.4 };
const SIDE_STRAP = /** @type {const} */ ([
	[2, 12.5],
	[5, 11],
	[5, 18],
	[2, 16.5],
]);

/** The headset's dark plastic: its lit edge, base and shade. */
const SHELL = {
	edge: C.stone,
	base: mix(C.stoneShade, C.night, 0.45),
	shade: mix(C.stoneShade, C.night, 0.75),
};

/** The straps' woven band: lit, base and shaded. */
const STRAP = {
	light: C.stoneMid,
	base: C.stoneShade,
	shade: mix(C.stoneShade, C.night, 0.5),
};

/** The visor's teal glass: its glint, and its bright top, middle and deep foot. */
const GLASS = {
	glint: C.white,
	bright: C.tealLight,
	base: C.teal,
	deep: C.tealShade,
};

/** The glow the visor throws round the headset. */
const HALO = mix(C.teal, C.arcane, 0.35);

/**
 * Tells whether a point lies inside a rounded rectangle.
 * @param {number} x
 * @param {number} y
 * @param {{ left: number, right: number, top: number, bottom: number, corner: number }} box
 * @returns {boolean}
 */
function inRounded(x, y, { left, right, top, bottom, corner }) {
	const px = x + 0.5;
	const py = y + 0.5;
	if (px < left || px > right + 1 || py < top || py > bottom + 1) {
		return false;
	}
	const cx = Math.min(Math.max(px, left + corner), right + 1 - corner);
	const cy = Math.min(Math.max(py, top + corner), bottom + 1 - corner);
	return Math.hypot(px - cx, py - cy) <= corner;
}

/**
 * Space 6, Virtual Reality.
 * @param {Canvas} canvas
 */
function drawVirtualReality(canvas) {
	sticker(canvas, (layer) => {
		for (let y = 0; y < TOP_STRAP.y; y++) {
			for (let x = 0; x < INSIDE; x++) {
				const dx = (x + 0.5 - TOP_STRAP.x) / TOP_STRAP.rx;
				const dy = (y + 0.5 - TOP_STRAP.y) / TOP_STRAP.ry;
				const d = Math.sqrt(dx * dx + dy * dy) * TOP_STRAP.ry;
				if (d <= TOP_STRAP.ry && d >= TOP_STRAP.ry - TOP_STRAP.width) {
					set(layer, x, y, STRAP.base);
				}
			}
		}
		polygon(layer, SIDE_STRAP, STRAP.base);
		polygon(
			layer,
			SIDE_STRAP.map(([x, y]) => /** @type {Point} */ ([INSIDE - x, y])),
			STRAP.base
		);
		bevel(layer, STRAP.base, STRAP.light, STRAP.shade);
	});
	sticker(canvas, (layer) => {
		for (let y = 0; y < INSIDE; y++) {
			for (let x = 0; x < INSIDE; x++) {
				const nose =
					Math.hypot(x + 0.5 - NOSE.x, y + 0.5 - NOSE.y) < NOSE.r;
				if (inRounded(x, y, HEADSET) && !nose) {
					set(layer, x, y, SHELL.base);
				}
			}
		}
		bevel(layer, SHELL.base, SHELL.edge, SHELL.shade);
		for (let y = 0; y < INSIDE; y++) {
			for (let x = 0; x < INSIDE; x++) {
				if (!inRounded(x, y, VISOR)) {
					continue;
				}
				const t = (y - VISOR.top) / (VISOR.bottom - VISOR.top);
				set(
					layer,
					x,
					y,
					t < 0.25 ? GLASS.bright : t < 0.7 ? GLASS.base : GLASS.deep
				);
			}
		}
		// The glint sliding across the glass.
		line(layer, 7, 13, 9, 11, GLASS.glint);
		line(layer, 8, 13, 10, 11, GLASS.bright);
		line(layer, 11, 13, 13, 11, GLASS.bright);
	});
	// The visor's glow, spilling round the headset.
	/** @type {[number, number][]} */
	const halo = [];
	for (let y = HEADSET.top; y < INSIDE - 1; y++) {
		for (let x = 1; x < INSIDE - 1; x++) {
			if (get(canvas, x, y)) {
				continue;
			}
			const touches = [
				[1, 0],
				[-1, 0],
				[0, 1],
				[0, -1],
			].some(([dx, dy]) => get(canvas, x + dx, y + dy) === C.ink);
			if (touches) {
				halo.push([x, y]);
			}
		}
	}
	for (const [x, y] of halo) {
		set(canvas, x, y, HALO);
	}
}

/**
 * Draws the armories inspiration tile: Ceremony, Racing, Team Sports, Tabletop Games, Video Games and Virtual Reality.
 * @returns {import('../../painter.js').Canvas}
 */
export function draw() {
	return drawInspirationTile([
		drawCeremony,
		drawRacing,
		drawTeamSports,
		drawTabletopGames,
		drawVideoGames,
		drawVirtualReality,
	]);
}
