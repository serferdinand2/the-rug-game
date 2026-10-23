// Markets inspiration tile: barter, currency, banking, credit cards, e-commerce and biometrics, from a fish traded for a jug to a glowing fingerprint.
import { line, mix, outline, paint, rect, set } from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawInspirationTile } from '../../parts/inspiration-tile.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The river fish: a dark blue back, silver flanks, a pale belly. */
const FISH = {
	back: C.daySky1,
	lit: C.daySky3,
	flank: C.daySky5,
	belly: C.cloudShade,
	shade: mix(C.daySky1, C.ink, 0.35),
	fin: C.daySea2,
};

/** The fired clay jug and its painted band. */
const CLAY = {
	lit: mix(C.brickRedLight, C.sand, 0.45),
	base: mix(C.brickRed, C.timberLight, 0.5),
	shade: mix(C.brickRedShade, C.timber, 0.4),
	mouth: C.brickRedShade,
	band: C.cream,
};

/** The two traders' skin and sleeves: `s` skin, `S` its shade, `n` the thumbnail, `c` the cuff, `e` the sleeve, `E` its shade. */
const TRADERS = {
	left: {
		s: C.skin,
		S: C.skinShade,
		n: C.cream,
		c: C.grass,
		e: C.grassShade,
		E: C.forestFloorShade,
	},
	right: {
		s: C.skinTan,
		S: C.skinTanShade,
		n: C.skin,
		c: C.brickRed,
		e: C.brickRedShade,
		E: CLAY.shade,
	},
};

/** A trader's hand holding its load up from below: four fingers wrapped up over its front, the thumb's nail at the near side. */
const GRIP = [
	'.sSsSsS.',
	'nsSsSsSS',
	'nsSsSsSS',
	'ssssssSS',
	'sSSSSSSS',
	'.SSSSSS.',
];

/** A trader's forearm below the hand, as long as there is room for: the cuff, then the sleeve, rounded off at the elbow. */
const SLEEVE = [
	'cccccccc',
	'cccccccc',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'.eeeeeE.',
	'..eeeE..',
];

/** The fish, facing right: `t` tail, `n` fins, `h` lit back, `B` back, `g` gill, `k` eye, `f` flank, `w` belly, `F` shade. */
const FISH_SPRITE = [
	'.......nnn....',
	't.....nnnn....',
	'tt...hhhhhhh..',
	'ttt.hhBBBBBBh.',
	'ttttBBBBBBBgkB',
	'ttttfffffffgff',
	'tttt.ffffffgf.',
	'ttt..wwwwwwww.',
	'tt....wwwwwww.',
	't......FFFFF..',
];

/** The clay jug, its handle on the right: `l` lit, `j` clay, `J` shade, `d` the dark mouth, `b` the painted band. */
const JUG_SPRITE = [
	'..llllll...',
	'.lddddddJ..',
	'..ljjjjJjj.',
	'...ljjJ...j',
	'..ljjjjJ..j',
	'.ljjjjjjJ.j',
	'ljljjjjjjJj',
	'llljjjjjjJj',
	'lbbbbbbbbJ.',
	'ljjjjjjjjJ.',
	'ljjjjjjjjJ.',
	'.jjjjjjjjJ.',
	'.JjjjjjjJJ.',
	'..JJjjjJJ..',
	'..JJJJJJJ..',
];

/**
 * Where the fish and the jug sit, side by side, and each trader's hand under its load: the fish held round
 * its middle, the jug round its belly, a little lower. The forearms run down to `ELBOW`, inside the frame.
 */
const BARTER = {
	fish: { x: 2, y: 4 },
	fishHand: { x: 5, y: 10 },
	jug: { x: 17, y: 2 },
	jugHand: { x: 18, y: 14 },
};
const ELBOW = 27;

/** The gold of the coins, from their gleam to the dark of the owl's stamp. */
const COIN = {
	gleam: C.lampGlow,
	lit: C.gold,
	base: mix(C.gold, C.amber, 0.35),
	shade: C.amber,
	deep: mix(C.amber, C.lampFrame, 0.5),
	stamp: mix(C.amber, C.lampFrame, 0.3),
	dark: C.lampFrame,
};

/** The coin stack behind: its centre column, the top face's row, its half-width and half-depth, and each coin's rim. */
const STACK = { x: 9, top: 7, rx: 5.5, ry: 2.2, coins: 6, rim: 3 };

/** How far each coin of the stack, top coin first, sits off true. */
const STACK_SHIFT = [0, 1, 0, -1, 0, 1];

/** The front coin, standing face on. */
const FRONT_COIN = { x: 17.5, y: 17.5, r: 9.6 };

/** The owl stamped on the front coin, ear tufts up and eyes wide: `o` the stamp, `g` its eyes' gleam, `k` the pupils, beak, wings and feet. */
const OWL = [
	'.o.......o.',
	'.oo.....oo.',
	'.ooooooooo.',
	'ooggoooggoo',
	'ogkkgogkkgo',
	'ogkkgkgkkgo',
	'ooggokooggo',
	'.ooooooooo.',
	'okoooooooko',
	'okoooooooko',
	'.okoooooko.',
	'..ooooooo..',
	'...k...k...',
];

/** The vault's iron and its brass wheel. */
const IRON = {
	lit: C.stoneLight,
	base: C.stone,
	shade: C.stoneShade,
	dark: mix(C.stoneShade, C.ink, 0.45),
	bolt: C.snowShade,
};
const WHEEL = { lit: C.gold, base: C.brass, shade: C.lampFrame };

/** The vault door: its centre and radius; and its two square hinges on the left, their column, size and top rows. */
const DOOR = { x: 15.5, y: 14.5, r: 12.6 };
const HINGE = { x: 2, size: 4, rows: [7, 19] };

/** The plastic card: blue, a red stripe, a gold chip and a pale embossed line. */
const CARD = {
	lit: C.daySky4,
	base: C.daySky2,
	shade: C.daySea3,
	edge: mix(C.daySea3, C.ink, 0.3),
	stripe: C.brickRed,
	stripeLit: C.brickRedLight,
	chipGleam: C.lampGlow,
	chip: C.gold,
	chipShade: C.amber,
	emboss: C.daySky6,
};

/**
 * The card's top left corner, its size along its own edges, and its tilt: one row down for every two columns.
 * The stripe and the embossed line are measured along the card's own edges too.
 */
const CARD_SHAPE = {
	x: 7.8,
	y: 3.2,
	w: 23,
	h: 15,
	angle: Math.atan2(1, 2),
	stripe: { top: 2, bottom: 4 },
	emboss: { top: 9.6, bottom: 11, left: 8.5, right: 19.5 },
};

/** The gold chip, set square on the card where its left end lies: `w` its gleam, `g` gold, `a` the contacts' lines. */
const CHIP = { x: 6, y: 11 };
const CHIP_SPRITE = ['wggag', 'gggag', 'aaaaa', 'gggag'];

/** The corrugated cardboard parcel and its tape. */
const BOX = {
	top: C.sandLight,
	front: C.sand,
	side: C.sandShade,
	tape: C.creamLight,
	tapeShade: C.creamShade,
	label: C.white,
	labelLine: C.stoneMid,
};

/** The parcel in 3/4 view: `t` top, `T` tape on top, `f` front, `a` tape down the front, `s` side, `L`/`l` the label. */
const PARCEL = [
	'....ttttttTTttttt',
	'...ttttttTTttttts',
	'..ttttttTTtttttss',
	'.ttttttTTtttttsss',
	'ffffffaafffffssss',
	'ffffffaafffffssss',
	'ffffffaafffffssss',
	'ffffffaafffffssss',
	'fLLLLfaafffffssss',
	'fLllLfaafffffssss',
	'fLLLLfaafffffsss.',
	'fffffffffffffss..',
	'fffffffffffffs...',
];

/** The phone: a dark glass slab and its lit screen. */
const PHONE = {
	body: mix(C.night, C.stoneShade, 0.35),
	rim: C.stoneShade,
	screen: C.tealLight,
	screenShade: mix(C.tealLight, C.teal, 0.45),
	icon: C.tealShade,
};

/** The phone standing behind the parcel: its outer edge, and its screen inside the dark glass. */
const PHONE_SHAPE = { x: 13, y: 2, w: 15, h: 26 };
const SCREEN = { x: 15, y: 5, w: 11, h: 19 };

/** Where the cart sits on the screen, and where the parcel stands in front. */
const CART_AT = { x: 16, y: 8 };
const PARCEL_AT = { x: 2, y: 15 };

/** The shopping cart on the phone's screen. */
const CART = [
	'cc.......',
	'.ccccccc.',
	'.c.c.c.c.',
	'.ccccccc.',
	'..c......',
	'..cccccc.',
	'..c....c.',
];

/** The scanner pad: pale steel, dark glass and the teal glow of the print. */
const SCANNER = {
	lit: C.snowShade,
	base: C.stoneLight,
	shade: C.stone,
	dark: C.stoneShade,
	glass: mix(C.tealShade, C.night, 0.6),
	glow: mix(C.tealShade, C.night, 0.3),
	ridge: C.tealLight,
	ridgeDim: C.teal,
	led: C.ghost,
};

/**
 * The scanner pad lying flat, seen from the front: its top face narrows by a column every few rows towards
 * the far edge, and its front edge shows below. The glass is inset by `rim` all round.
 */
const PAD = {
	top: 7,
	bottom: 24,
	left: 2,
	right: 27,
	step: 4,
	front: 3,
	rim: 2,
};

/** The fingerprint on the glass: the fingertip's oval, and the row its ridges arch over before running straight down. */
const PRINT = { x: 14.5, y: 16, rx: 6.8, ry: 6.4, core: 16.5 };

/** The light rising off the print above the pad's far edge: each ray's column and length. */
const RAYS = [
	{ x: 9, length: 2 },
	{ x: 12, length: 3 },
	{ x: 17, length: 3 },
	{ x: 20, length: 2 },
];

/**
 * Calls `colour` for every pixel of a canvas and paints what it returns.
 * @param {Canvas} canvas
 * @param {(x: number, y: number) => Colour | null} colour
 */
function each(canvas, colour) {
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			set(canvas, x, y, colour(x, y));
		}
	}
}

/**
 * Space 1, Barter: a fish and a clay jug held out to each other, one trader gripping the fish's tail, the other the jug's handle.
 * @param {Canvas} canvas
 */
function drawBarter(canvas) {
	const { fish, fishHand, jug, jugHand } = BARTER;
	paint(canvas, fish.x, fish.y, FISH_SPRITE, {
		t: FISH.fin,
		n: FISH.fin,
		h: FISH.lit,
		B: FISH.back,
		g: FISH.shade,
		k: C.ink,
		f: FISH.flank,
		w: FISH.belly,
		F: FISH.shade,
	});
	paint(canvas, jug.x, jug.y, JUG_SPRITE, {
		l: CLAY.lit,
		j: CLAY.base,
		J: CLAY.shade,
		d: CLAY.mouth,
		b: CLAY.band,
	});
	drawArm(canvas, fishHand, TRADERS.left, false);
	drawArm(canvas, jugHand, TRADERS.right, true);
	outline(canvas, C.ink);
}

/**
 * A trader's hand and the forearm under it, down to the elbow.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number }} hand - The hand's top left pixel
 * @param {Readonly<Record<string, Colour>>} colours - The trader's skin and sleeve
 * @param {boolean} mirror - True for the right-hand trader, whose thumb is on the right
 */
function drawArm(canvas, hand, colours, mirror) {
	const cuff = hand.y + GRIP.length;
	const sleeve = SLEEVE.slice(2).slice(-(ELBOW + 1 - cuff - 2));
	paint(canvas, hand.x, hand.y, GRIP, colours, { mirror });
	paint(canvas, hand.x, cuff, [...SLEEVE.slice(0, 2), ...sleeve], colours, {
		mirror,
	});
}

/**
 * Space 2, Currency: a stack of gold coins, the front coin standing on its edge and stamped with an owl.
 * @param {Canvas} canvas
 */
function drawCurrency(canvas) {
	for (let i = STACK.coins - 1; i >= 0; i--) {
		drawStackedCoin(canvas, i);
	}
	each(canvas, (x, y) => {
		const dx = x + 0.5 - FRONT_COIN.x;
		const dy = y + 0.5 - FRONT_COIN.y;
		const d = Math.hypot(dx, dy);
		if (d > FRONT_COIN.r) {
			return null;
		}
		if (d > FRONT_COIN.r - 1.2) {
			if (dx + dy > 9) {
				return COIN.deep;
			}
			return dx + dy < 0 ? COIN.lit : COIN.shade;
		}
		if (d > FRONT_COIN.r - 2.2) {
			return dx + dy < -4 ? COIN.shade : COIN.dark;
		}
		return dx + dy < -7 ? COIN.lit : COIN.base;
	});
	paint(
		canvas,
		Math.floor(FRONT_COIN.x) - 5,
		Math.floor(FRONT_COIN.y) - 6,
		OWL,
		{
			o: COIN.stamp,
			g: COIN.gleam,
			k: COIN.dark,
		}
	);
	outline(canvas, C.ink);
}

/**
 * One coin of the stack, counted from the top: its rim, and on the top coin its face.
 * @param {Canvas} canvas
 * @param {number} index - 0 is the top coin
 */
function drawStackedCoin(canvas, index) {
	const centre = STACK.top + index * STACK.rim;
	const x0 = STACK.x + STACK_SHIFT[index] + 0.5;
	each(canvas, (x, y) => {
		const dx = (x + 0.5 - x0) / (STACK.rx + 0.5);
		if (Math.abs(dx) > 1) {
			return null;
		}
		const face = (y + 0.5 - centre) / STACK.ry;
		if (index === 0 && dx * dx + face * face <= 1) {
			if (dx * dx + face * face > 0.5) {
				return face < 0 ? COIN.lit : COIN.shade;
			}
			return dx < -0.15 && face < 0.4 ? COIN.gleam : COIN.base;
		}
		const below = y + 0.5 - (centre + STACK.ry * Math.sqrt(1 - dx * dx));
		if (below < 0 || below >= STACK.rim) {
			return null;
		}
		if (below >= STACK.rim - 1) {
			return COIN.dark;
		}
		if (dx < -0.35) {
			return COIN.lit;
		}
		return dx > 0.6 ? COIN.deep : COIN.shade;
	});
}

/**
 * Space 3, Banking: a round iron vault door on two hinges, a spoked brass wheel in the middle and bolts round the rim.
 * @param {Canvas} canvas
 */
function drawBanking(canvas) {
	const { x, size } = HINGE;
	for (const top of HINGE.rows) {
		rect(canvas, x, top, size, size, IRON.shade);
		rect(canvas, x, top, size, 1, IRON.lit);
		rect(canvas, x, top + 1, 1, size - 1, IRON.base);
	}
	each(canvas, (x, y) => {
		const dx = x + 0.5 - DOOR.x;
		const dy = y + 0.5 - DOOR.y;
		const d = Math.hypot(dx, dy);
		if (d > DOOR.r) {
			return null;
		}
		const lit = dx + dy < 0;
		if (d > DOOR.r - 1) {
			return lit ? IRON.lit : IRON.shade;
		}
		if (d > DOOR.r - 3.6) {
			return lit ? IRON.base : IRON.shade;
		}
		if (d > DOOR.r - 4.6) {
			return IRON.dark;
		}
		if (d > DOOR.r - 5.6) {
			return lit ? IRON.lit : IRON.base;
		}
		return dx + dy < -9 ? IRON.lit : IRON.base;
	});
	for (let i = 0; i < 8; i++) {
		const angle = (i * Math.PI) / 4;
		const r = DOOR.r - 2.3;
		const x = Math.round(DOOR.x - 0.5 + Math.cos(angle) * r);
		const y = Math.round(DOOR.y - 0.5 + Math.sin(angle) * r);
		set(canvas, x, y, IRON.bolt);
		set(canvas, x + 1, y, IRON.shade);
		set(canvas, x, y + 1, IRON.shade);
		set(canvas, x + 1, y + 1, IRON.dark);
	}
	drawWheel(canvas);
	outline(canvas, C.ink);
}

/**
 * The vault door's wheel: a brass ring on six spokes, each spoke ending in a knob past the ring.
 * @param {Canvas} canvas
 */
function drawWheel(canvas) {
	const hub = { x: Math.floor(DOOR.x), y: Math.floor(DOOR.y) };
	each(canvas, (x, y) => {
		const dx = x - hub.x;
		const dy = y - hub.y;
		const d = Math.hypot(dx, dy);
		if (d > 3.6 && d < 4.8) {
			return dx + dy < 0 ? WHEEL.lit : WHEEL.base;
		}
		return null;
	});
	for (let i = 0; i < 6; i++) {
		const angle = (i * Math.PI) / 3 + Math.PI / 6;
		const x = Math.round(hub.x + Math.cos(angle) * 6.5);
		const y = Math.round(hub.y + Math.sin(angle) * 6.5);
		line(canvas, hub.x, hub.y, x, y, WHEEL.shade);
		set(canvas, x, y, WHEEL.lit);
	}
	rect(canvas, hub.x - 1, hub.y - 1, 3, 3, WHEEL.base);
	set(canvas, hub.x - 1, hub.y - 1, WHEEL.lit);
	set(canvas, hub.x, hub.y, WHEEL.lit);
}

/**
 * Space 4, Credit Cards: a blue plastic card tilted down to the right, a red stripe, a gold chip and a plain embossed line.
 * @param {Canvas} canvas
 */
function drawCreditCards(canvas) {
	const { x: left, y: top, w, h, angle } = CARD_SHAPE;
	const cos = Math.cos(angle);
	const sin = Math.sin(angle);
	each(canvas, (x, y) => {
		const px = x + 0.5 - left;
		const py = y + 0.5 - top;
		const u = px * cos + py * sin;
		const v = -px * sin + py * cos;
		if (u < 0 || v < 0 || u >= w || v >= h) {
			return null;
		}
		if (Math.min(u, w - u) < 1 && Math.min(v, h - v) < 1) {
			return null;
		}
		return cardColour(u, v);
	});
	paint(canvas, CHIP.x, CHIP.y, CHIP_SPRITE, {
		w: CARD.chipGleam,
		g: CARD.chip,
		a: CARD.chipShade,
	});
	outline(canvas, C.ink);
}

/**
 * The colour at a point of the card, measured along its long edge (u) and its short edge (v).
 * @param {number} u
 * @param {number} v
 * @returns {Colour}
 */
function cardColour(u, v) {
	const { w, h, stripe, emboss } = CARD_SHAPE;
	if (v >= h - 1) {
		return CARD.edge;
	}
	if (v < 1 || u < 1) {
		return CARD.lit;
	}
	if (u >= w - 1) {
		return CARD.shade;
	}
	if (v >= stripe.top && v < stripe.bottom) {
		return v < stripe.top + 1 ? CARD.stripeLit : CARD.stripe;
	}
	if (
		v >= emboss.top &&
		v < emboss.bottom &&
		u >= emboss.left &&
		u < emboss.right
	) {
		return CARD.emboss;
	}
	return CARD.base;
}

/**
 * Space 5, E-Commerce: a taped cardboard parcel in front of a phone whose screen shows a shopping cart.
 * @param {Canvas} canvas
 */
function drawECommerce(canvas) {
	const { x, y, w, h } = PHONE_SHAPE;
	rect(canvas, x, y, w, h, PHONE.rim);
	rect(canvas, x + 1, y + 1, w - 2, h - 2, PHONE.body);
	rect(canvas, x + 5, y + 1, w - 10, 1, PHONE.rim);
	rect(canvas, SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, PHONE.screen);
	rect(canvas, SCREEN.x, SCREEN.y, 1, SCREEN.h, PHONE.screenShade);
	paint(canvas, CART_AT.x, CART_AT.y, CART, { c: PHONE.icon });
	paint(canvas, PARCEL_AT.x, PARCEL_AT.y, PARCEL, {
		t: BOX.top,
		T: BOX.tape,
		f: BOX.front,
		s: BOX.side,
		a: BOX.tapeShade,
		L: BOX.label,
		l: BOX.labelLine,
	});
	outline(canvas, C.ink);
}

/**
 * The pad's left edge on a row of its top face: it steps in towards the far edge.
 * @param {number} y
 * @returns {number}
 */
function padLeft(y) {
	return PAD.left + Math.floor((PAD.bottom - y) / PAD.step);
}

/**
 * The pad's right edge on a row of its top face, the mirror of its left.
 * @param {number} y
 * @returns {number}
 */
function padRight(y) {
	return PAD.left + PAD.right - padLeft(y);
}

/**
 * Tells whether a pixel lies on the pad's glass.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function onGlass(x, y) {
	return (
		y >= PAD.top + PAD.rim &&
		y <= PAD.bottom - PAD.rim &&
		x >= padLeft(y) + PAD.rim &&
		x <= padRight(y) - PAD.rim
	);
}

/**
 * Space 6, Biometrics: a fingerprint glowing teal on the glass of a steel scanner pad, its light rising off it.
 * @param {Canvas} canvas
 */
function drawBiometrics(canvas) {
	each(canvas, (x, y) => {
		if (y > PAD.bottom && y <= PAD.bottom + PAD.front) {
			if (x < PAD.left || x > PAD.right) {
				return null;
			}
			return y === PAD.bottom + 1 ? SCANNER.shade : SCANNER.dark;
		}
		if (
			y < PAD.top ||
			y > PAD.bottom ||
			x < padLeft(y) ||
			x > padRight(y)
		) {
			return null;
		}
		if (onGlass(x, y)) {
			return SCANNER.glass;
		}
		if (y === PAD.top || x === padLeft(y)) {
			return SCANNER.lit;
		}
		if (x === padRight(y)) {
			return SCANNER.shade;
		}
		return SCANNER.base;
	});
	set(canvas, PAD.right - 3, PAD.bottom + 2, SCANNER.led);
	set(canvas, PAD.right - 5, PAD.bottom + 2, SCANNER.led);
	outline(canvas, C.ink);
	drawPrint(canvas);
	drawRays(canvas);
}

/**
 * The fingerprint on the scanner's glass: ridges arching over the core and running straight down, the glass glowing round them.
 * @param {Canvas} canvas
 */
function drawPrint(canvas) {
	/** @type {[number, number][]} */
	const ridges = [];
	for (let y = 0; y < canvas.h; y++) {
		for (let x = 0; x < canvas.w; x++) {
			const ox = (x + 0.5 - PRINT.x) / PRINT.rx;
			const oy = (y + 0.5 - PRINT.y) / PRINT.ry;
			if (!onGlass(x, y) || ox * ox + oy * oy > 1) {
				continue;
			}
			const dx = x - Math.floor(PRINT.x);
			const dy = y + 0.5 - PRINT.core;
			const d = dy < 0 ? Math.hypot(dx, dy) : Math.abs(dx);
			if (Math.round(d) % 2 === 0) {
				ridges.push([x, y]);
			}
		}
	}
	for (const [x, y] of ridges) {
		for (const [dx, dy] of [
			[1, 0],
			[-1, 0],
			[0, 1],
			[0, -1],
		]) {
			if (onGlass(x + dx, y + dy)) {
				set(canvas, x + dx, y + dy, SCANNER.glow);
			}
		}
	}
	for (const [x, y] of ridges) {
		set(canvas, x, y, y < PRINT.core ? SCANNER.ridge : SCANNER.ridgeDim);
	}
}

/**
 * Teal light rising off the print above the pad's far edge, brightest where it leaves the pad.
 * @param {Canvas} canvas
 */
function drawRays(canvas) {
	for (const ray of RAYS) {
		for (let i = 1; i <= ray.length; i++) {
			set(
				canvas,
				ray.x,
				PAD.top - 1 - i,
				i === 1 ? SCANNER.ridge : SCANNER.ridgeDim
			);
		}
	}
}

/**
 * Draws the Markets inspiration tile: the market row's six innovations, from barter to biometrics.
 * @returns {Canvas}
 */
export function draw() {
	return drawInspirationTile([
		drawBarter,
		drawCurrency,
		drawBanking,
		drawCreditCards,
		drawECommerce,
		drawBiometrics,
	]);
}
