// Traders: a bearded merchant in a white turban at his striped stall at dusk, dropping a coin onto brass scales, spices and silks round him and a ship in the harbour behind.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row, and the counter's top row. */
const HORIZON = 33;
const COUNTER = 51;

/** The setting sun's column: the seed puts the sky part's sun here, behind the ship. */
const SUN_X = 9;

/** The face's centre column, and how far the head sits below the top of the picture. */
const FACE_X = 37;
const HEAD_Y = 5;

/** The scales: the post's column and top, the beam's ends, and each pan's centre. */
const POST = { x: 21, top: COUNTER - 20 };
const BEAM = {
	left: { x: 12, y: COUNTER - 18 },
	right: { x: 31, y: COUNTER - 16 },
};
const PAN_LEFT = { x: 12, y: COUNTER - 9 };
const PAN_RIGHT = { x: 31, y: COUNTER - 7 };

/** His hand over the right pan: its top-left pixel. */
const HAND = { x: 26, y: COUNTER - 16 };

/** Skin: warm on the sunset's side, plain, and cool on the side away from it. */
const SKIN = {
	glint: mix(C.skinDeep, C.duskSky6, 0.6),
	lit: mix(C.skinDeep, C.duskSky6, 0.35),
	base: C.skinDeep,
	shade: mix(C.skinDeepShade, C.skinDeep, 0.45),
	dark: mix(C.skinDeepShade, C.roof, 0.2),
};

/** His black beard and brows, catching the sunset along one side. */
const BEARD = { lit: mix(C.wood, C.duskSky5, 0.35), base: C.wood, dark: C.ink };

/** The white turban: sunset-lit, plain, shaded and in its folds. */
const TURBAN = {
	lit: mix(C.creamLight, C.duskSky6, 0.25),
	base: C.cream,
	shade: mix(C.creamShade, C.roofLight, 0.3),
	dark: mix(C.creamShade, C.roof, 0.5),
};

/** The green kaftan. */
const KAFTAN = {
	lit: mix(C.pineLight, C.duskSky6, 0.3),
	base: C.pine,
	shade: C.pineShade,
	dark: mix(C.pineShade, C.night, 0.4),
};

/** The ship and the far shore, dark against the sunset, and the sunset catching their edges. */
const SILHOUETTE = mix(C.roofShade, C.duskSky2, 0.3);
const RIM = mix(C.duskSky6, C.gold, 0.3);

/** The figure is lit by hand, so the glow leaves it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(BEARD),
	...Object.values(TURBAN),
	...Object.values(KAFTAN),
	C.ink,
];

/**
 * Draws the Traders portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8216);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawHarbour(layer, random);
	drawShip(layer, 2, HORIZON + 1);

	const stall = createCanvas(64, 64);
	drawSilks(stall);
	drawPoles(stall);
	outline(stall, C.ink);
	underlay(stall, layer);

	const merchant = createCanvas(64, 64);
	drawKaftan(merchant);
	drawHead(merchant);
	outline(merchant, C.ink);
	underlay(merchant, stall);

	drawAwning(scene);
	drawCounter(scene);
	drawSpices(scene);
	drawScales(scene);
	drawHand(scene);
	outline(scene, C.ink);
	drawChains(scene);
	underlay(scene, merchant);

	glow(scene, {
		x: SUN_X,
		y: HORIZON - 2,
		radius: 24,
		colour: C.duskSky6,
		strength: 0.35,
		steps: 4,
		skip: [...FIGURE, C.lampGlow, C.gold, SILHOUETTE, RIM],
	});
	drawCoin(scene);
	return scene;
}

/**
 * The harbour at dusk: a far shore, violet water with the setting sun's road of light on it, and the stone quay.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHarbour(layer, random) {
	// The far shore, low along the horizon on the right.
	for (let x = 20; x < 64; x++) {
		const top =
			HORIZON -
			1 -
			Math.round(Math.max(0, Math.sin((x - 20) * 0.12)) * 3);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, mix(C.roof, C.duskSky4, 0.35));
		}
	}
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.duskSky3, C.nightSea2, 0.55);
			if (y === HORIZON + 1) {
				colour = C.duskSky5;
			} else if (y < HORIZON + 4) {
				colour = mix(C.duskSky4, C.nightSea1, 0.45);
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 26; i++) {
		const y = HORIZON + 2 + Math.floor(random() * 9);
		const spread = 2 + (y - HORIZON);
		const x = SUN_X - spread + Math.floor(random() * spread * 2);
		rect(
			layer,
			x,
			y,
			2 + Math.floor(random() * 3),
			1,
			y < HORIZON + 5 ? C.gold : C.duskSky6
		);
	}
	// The quay's edge in front of the water.
	rect(layer, 0, HORIZON + 11, 64, 1, mix(C.stone, C.duskSky5, 0.3));
	for (let y = HORIZON + 12; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const joint = (x + (y % 2) * 3) % 6 === 0;
			set(
				layer,
				x,
				y,
				joint
					? mix(C.stoneShade, C.roof, 0.5)
					: mix(C.stoneMid, C.roof, 0.4)
			);
		}
	}
}

/**
 * A two-masted merchant ship at anchor, dark against the setting sun: a high stern, a bowsprit,
 * furled sails on its yards, stays to the bow and stern, and a pennant.
 * @param {Canvas} layer
 * @param {number} x - The stern's column
 * @param {number} water - The waterline
 */
function drawShip(layer, x, water) {
	// The hull, narrowing to the keel, with the stern castle raised.
	for (let r = 0; r < 4; r++) {
		rect(
			layer,
			x + r,
			water - 4 + r,
			16 - r * 2 + (r === 0 ? 1 : 0),
			1,
			SILHOUETTE
		);
	}
	rect(layer, x, water - 6, 5, 2, SILHOUETTE);
	rect(layer, x, water - 6, 5, 1, RIM);
	rect(layer, x + 5, water - 4, 12, 1, RIM);
	line(layer, x + 16, water - 4, x + 20, water - 7, SILHOUETTE);
	// The masts, their yards with the sails furled along them, and the stays.
	for (const [mx, height] of [
		[x + 7, 17],
		[x + 12, 14],
	]) {
		rect(layer, mx, water - 4 - height, 1, height, SILHOUETTE);
		for (const [up, half] of [
			[height - 3, 3],
			[height - 8, 4],
		]) {
			const y = water - 4 - up;
			rect(layer, mx - half, y, half * 2 + 1, 1, SILHOUETTE);
			rect(layer, mx - half + 1, y + 1, half * 2 - 1, 1, RIM);
		}
	}
	line(layer, x + 7, water - 21, x + 1, water - 7, SILHOUETTE);
	line(layer, x + 12, water - 18, x + 20, water - 7, SILHOUETTE);
	line(layer, x + 7, water - 21, x + 12, water - 18, SILHOUETTE);
	paint(layer, x + 8, water - 22, ['rr', 'r.'], { r: C.brickRed });
	// Its reflection, broken by the waves.
	for (let i = x + 1; i <= x + 15; i += 2) {
		set(layer, i, water + 1, mix(SILHOUETTE, C.duskSky4, 0.4));
	}
}

/**
 * Bolts of silk hanging from a rod at the right of the stall: teal, violet and gold, with soft folds.
 * @param {Canvas} canvas
 */
function drawSilks(canvas) {
	rect(canvas, 50, 6, 14, 1, C.brass);
	/** @type {[number, number, Colour, Colour, Colour][]} */
	const bolts = [
		[51, 30, C.tealLight, C.teal, C.tealShade],
		[55, 26, C.arcaneLight, C.arcane, C.arcaneShade],
		[59, 32, C.gold, C.amber, mix(C.amber, C.timber, 0.5)],
	];
	for (const [x0, bottom, lit, base, shade] of bolts) {
		for (let y = 7; y <= bottom; y++) {
			const sway = Math.round(Math.sin(y * 0.3 + x0) * 0.6);
			for (let i = 0; i < 4; i++) {
				const colour = i === 0 ? lit : i === 3 ? shade : base;
				set(
					canvas,
					x0 + i + sway,
					y,
					y === bottom && i % 2 ? null : colour
				);
			}
		}
	}
}

/**
 * The stall's two posts, one at each edge.
 * @param {Canvas} canvas
 */
function drawPoles(canvas) {
	for (const x of [0, 62]) {
		for (let y = 4; y < COUNTER; y++) {
			set(canvas, x, y, C.timber);
			set(canvas, x + 1, y, C.timberShade);
		}
	}
}

/**
 * His kaftan: green, edged in gold down the front and open over a cream shirt, a red sash at the waist.
 * @param {Canvas} scene
 */
function drawKaftan(scene) {
	const top = HEAD_Y + 25;
	for (let y = top; y < COUNTER; y++) {
		const half = Math.min(18, 7 + Math.round((y - top) * 2.8));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = KAFTAN.base;
			if (u < -0.7) {
				colour = KAFTAN.lit;
			} else if (u > 0.75) {
				colour = KAFTAN.dark;
			} else if (u > 0.2) {
				colour = KAFTAN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The shirt in the opening, narrowing down the chest, and the gold edging.
	for (let y = top + 1; y < COUNTER; y++) {
		const half = Math.max(0, 3 - Math.floor((y - top - 1) / 5));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			set(scene, x, y, x <= FACE_X ? C.creamLight : C.creamShade);
		}
		set(scene, FACE_X - half - 1, y, C.gold);
		set(scene, FACE_X + half + 2, y, C.amber);
	}
	// A seam down the far sleeve.
	for (let y = top + 6; y < COUNTER; y++) {
		set(
			scene,
			FACE_X + 11 + Math.round((y - top - 6) * 0.2),
			y,
			KAFTAN.dark
		);
	}
	// The red sash.
	for (let x = FACE_X - 12; x <= FACE_X + 13; x++) {
		rect(
			scene,
			x,
			COUNTER - 4,
			1,
			3,
			x < FACE_X ? C.brickRed : C.brickRedShade
		);
	}
	// The neck.
	for (let y = HEAD_Y + 22; y <= top + 1; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 3; x++) {
			set(scene, x, y, x <= FACE_X - 1 ? SKIN.lit : SKIN.shade);
		}
	}
}

/**
 * His head: a broad white turban with a ruby and a plume, a trimmed black beard, and his face
 * lit by the sunset on his right and cool on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	const top = HEAD_Y;
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -5, 6],
		[11, -5, 6],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -5, 6],
		[19, -4, 5],
		[20, -4, 5],
		[21, -4, 5],
		[22, -3, 4],
		[23, -2, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -4) {
				colour = SKIN.glint;
			} else if (dx <= -1) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, top + y, colour);
		}
	}
	// The beard: along the jaw and round the chin, trimmed to a point.
	/** @type {[number, number, number][]} */
	const beard = [
		[18, -5, -5],
		[19, -4, -3],
		[20, -4, -2],
		[21, -4, 5],
		[22, -3, 4],
		[23, -3, 4],
		[24, -2, 3],
		[25, -1, 2],
		[26, 0, 1],
	];
	for (const [y, from, to] of beard) {
		for (let dx = from; dx <= to; dx++) {
			const colour =
				dx <= -2 ? BEARD.lit : dx >= 3 ? BEARD.dark : BEARD.base;
			set(scene, FACE_X + dx, top + y, colour);
		}
	}
	for (const [y, dx] of [
		[18, 6],
		[19, 5],
		[20, 5],
	]) {
		set(scene, FACE_X + dx, top + y, BEARD.dark);
	}
	// The moustache over the mouth, and the lips below it.
	paint(scene, FACE_X - 3, top + 20, ['.bbbbb.', 'b.....b'], {
		b: BEARD.base,
	});
	rect(
		scene,
		FACE_X - 1,
		top + 21,
		3,
		1,
		mix(C.brickRedShade, C.skinDeep, 0.3)
	);
	// Ears, and a gold earring on the lit side.
	rect(scene, FACE_X - 6, top + 14, 1, 3, SKIN.lit);
	set(scene, FACE_X - 6, top + 17, C.gold);
	rect(scene, FACE_X + 7, top + 14, 1, 3, SKIN.shade);
	// Thick brows, and shrewd eyes turned to his right, to the scales.
	rect(scene, FACE_X - 4, top + 13, 3, 1, BEARD.base);
	rect(scene, FACE_X + 2, top + 13, 3, 1, BEARD.dark);
	rect(scene, FACE_X - 3, top + 14, 2, 1, SKIN.glint);
	set(scene, FACE_X - 3, top + 15, C.ink);
	set(scene, FACE_X - 2, top + 15, C.creamLight);
	set(scene, FACE_X + 2, top + 15, C.ink);
	set(scene, FACE_X + 3, top + 15, mix(C.cream, C.skinDeepShade, 0.35));
	// The nose: a strong shade line down its far side and a lit tip.
	rect(scene, FACE_X + 1, top + 15, 1, 4, SKIN.shade);
	set(scene, FACE_X, top + 18, SKIN.glint);
	set(scene, FACE_X + 1, top + 19, SKIN.dark);
	// The turban: a round wrap, its folds running across it on a slant, lit on the sunset's side,
	// and a band wound level round the brow.
	const profile = [3, 6, 8, 9, 10, 10, 10, 10, 10, 10, 9, 9];
	profile.forEach((half, y) => {
		for (let x = FACE_X - half + 1; x <= FACE_X + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			const fold =
				y < 9
					? (x - FACE_X + Math.round(y * 1.4) + 40) % 4 === 0
					: y === 9;
			let colour = TURBAN.base;
			if (fold) {
				colour =
					u < -0.45
						? TURBAN.base
						: u > 0.5
							? TURBAN.dark
							: TURBAN.shade;
			} else if (u < -0.45) {
				colour = TURBAN.lit;
			} else if (u > 0.5) {
				colour = TURBAN.shade;
			}
			set(scene, x, top + y, colour);
		}
	});
	// The ruby in a gold setting, and a white plume rising from it.
	paint(scene, FACE_X - 1, top + 7, ['.g.', 'gRg', 'grg', '.g.'], {
		g: C.gold,
		R: C.brickRedLight,
		r: C.brickRed,
	});
	paint(
		scene,
		FACE_X,
		top - 1,
		['..w', '.wc', '.w.', 'wc.', 'w..', 'c..', 'w..'],
		{
			w: C.white,
			c: C.cloudShade,
		}
	);
}

/**
 * The edge of the striped awning over the stall, scalloped, with a gold fringe.
 * @param {Canvas} scene
 */
function drawAwning(scene) {
	for (let x = 0; x < 64; x++) {
		const red = Math.floor(x / 5) % 2 === 0;
		const scallop = 2 + (Math.abs((x % 5) - 2) < 2 ? 1 : 0);
		for (let y = 0; y <= scallop; y++) {
			let colour = red ? C.brickRed : C.cream;
			if (y === scallop) {
				colour = red ? C.brickRedShade : C.creamShade;
			}
			set(scene, x, y, colour);
		}
		if (x % 2 === 0) {
			set(scene, x, scallop + 1, C.gold);
		}
	}
}

/**
 * The counter across the bottom, a rug thrown over its front.
 * @param {Canvas} scene
 */
function drawCounter(scene) {
	rect(scene, 0, COUNTER, 64, 1, C.timberLight);
	rect(scene, 0, COUNTER + 1, 64, 2, C.timber);
	const field = mix(C.brickRedShade, C.night, 0.3);
	const indigo = mix(C.daySea3, C.night, 0.35);
	const middle = Math.round((COUNTER + 5 + 60) / 2);
	for (let y = COUNTER + 3; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = Math.abs(((x + 4) % 8) - 4);
			const dy = Math.abs(y - middle);
			let colour = field;
			if (y === COUNTER + 3 || y === 62) {
				colour = C.amber;
			} else if (y === COUNTER + 4 || y === 61 || y === 63) {
				colour = indigo;
			} else if (dx + dy === 2) {
				colour = C.amber;
			} else if (dx + dy === 0) {
				colour = C.gold;
			} else if (dx + dy < 2) {
				colour = indigo;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Brass bowls on the counter at his left, heaped with spices: red pepper, saffron and green herbs.
 * @param {Canvas} scene
 */
function drawSpices(scene) {
	/** @type {[number, Colour, Colour, Colour][]} */
	const heaps = [
		[41, C.brickRedLight, C.brickRed, C.brickRedShade],
		[49, C.gold, C.amber, mix(C.amber, C.timber, 0.4)],
		[56, C.grassLight, C.grass, C.grassShade],
	];
	for (const [x0, lit, base, shade] of heaps) {
		for (let y = COUNTER - 6; y < COUNTER - 2; y++) {
			const half = y - (COUNTER - 6);
			for (let x = x0 + 3 - half; x <= x0 + 4 + half; x++) {
				set(scene, x, y, x < x0 + 3 ? lit : x > x0 + 5 ? shade : base);
			}
		}
		rect(scene, x0, COUNTER - 2, 8, 1, C.gold);
		rect(scene, x0 + 1, COUNTER - 1, 6, 1, C.brass);
	}
}

/**
 * The brass scales on the counter: a post with a finial, a beam tipped down to the right,
 * a weight in the left pan and a heap of gold coins in the right one.
 * @param {Canvas} scene
 */
function drawScales(scene) {
	// The foot and the post.
	rect(scene, POST.x - 3, COUNTER - 1, 7, 1, C.brass);
	rect(scene, POST.x - 2, COUNTER - 2, 5, 1, C.gold);
	rect(scene, POST.x, POST.top + 2, 1, COUNTER - POST.top - 4, C.gold);
	rect(
		scene,
		POST.x + 1,
		POST.top + 2,
		1,
		COUNTER - POST.top - 4,
		C.lampFrame
	);
	paint(scene, POST.x - 1, POST.top - 1, ['.g.', 'gwg', '.g.'], {
		g: C.gold,
		w: C.lampGlow,
	});
	// The beam.
	line(scene, BEAM.left.x, BEAM.left.y, BEAM.right.x, BEAM.right.y, C.gold);
	line(
		scene,
		BEAM.left.x,
		BEAM.left.y + 1,
		BEAM.right.x,
		BEAM.right.y + 1,
		C.lampFrame
	);
	// The pans, shallow brass dishes.
	for (const pan of [PAN_LEFT, PAN_RIGHT]) {
		rect(scene, pan.x - 4, pan.y, 9, 1, C.gold);
		rect(scene, pan.x - 3, pan.y + 1, 7, 1, C.brass);
		rect(scene, pan.x - 2, pan.y + 2, 5, 1, C.lampFrame);
	}
	// A brass weight on the left, and the heap of coins on the right.
	paint(
		scene,
		PAN_LEFT.x - 2,
		PAN_LEFT.y - 4,
		['.bb..', 'bggb.', 'bggbl', 'bbbbl'],
		{
			b: C.brass,
			g: C.gold,
			l: C.lampFrame,
		}
	);
	paint(
		scene,
		PAN_RIGHT.x - 3,
		PAN_RIGHT.y - 3,
		['..gw...', '.gagwg.', 'gagagag'],
		{
			g: C.gold,
			a: C.amber,
			w: C.lampGlow,
		}
	);
}

/**
 * His right hand held out over the scales, letting a coin fall, its green sleeve reaching across from his side.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	// The right forearm, in its green sleeve, reaching across from his side to the hand over the pan.
	for (let y = HAND.y + 2; y <= HAND.y + 8; y++) {
		const down = y - HAND.y - 2;
		const x0 = HAND.x + 5 - Math.round(down * 0.3) + down;
		for (let x = x0; x <= x0 + 5; x++) {
			let colour = KAFTAN.base;
			if (down === 0) {
				colour = KAFTAN.lit;
			} else if (down === 6 || x === x0 + 5) {
				colour = KAFTAN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, HAND.x + 4, HAND.y + 1, 2, 4, C.gold);
	paint(scene, HAND.x, HAND.y, ['.LLl', 'LLll', 'Llls', '.ls.'], {
		L: SKIN.glint,
		l: SKIN.lit,
		s: SKIN.base,
	});
}

/**
 * The fine chains from the beam's ends to each pan's rim, painted after the outline so they stay thin.
 * @param {Canvas} scene
 */
function drawChains(scene) {
	for (const [end, pan] of [
		[BEAM.left, PAN_LEFT],
		[BEAM.right, PAN_RIGHT],
	]) {
		line(scene, end.x, end.y + 1, pan.x - 4, pan.y - 1, C.brass);
		line(scene, end.x, end.y + 1, pan.x + 4, pan.y - 1, C.brass);
	}
}

/**
 * The coin falling from his fingers into the right pan, catching the light.
 * @param {Canvas} scene
 */
function drawCoin(scene) {
	paint(scene, HAND.x + 4, HAND.y + 5, ['.g.', 'gwa', '.a.'], {
		g: C.gold,
		w: C.lampGlow,
		a: C.amber,
	});
}
