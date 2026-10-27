// Militants: a scarred warrior in a dented helmet and mail at night, a bloodied sword raised and a battered shield, a red war banner and burning outposts behind.
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
import { drawBanner } from '../../parts/banner.js';
import { drawSmoke } from '../../parts/smoke.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The last sky row. */
const HORIZON = 40;

/** The face's centre column, and the row of the helmet's brim. */
const FACE_X = 30;
const BRIM = 11;

/** The burning outposts' flames: the near one at the right lights the warrior, the far one burns at the left. */
const FIRE = { x: 60, y: 26 };
const FAR_FIRE = { x: 7, y: 30 };

/** The shield's centre and radius. */
const SHIELD = { x: 12, y: 52, r: 13 };

/** The sword: the middle of its crossguard and the tip of its blade. */
const GUARD = { x: 46, y: 40 };
const TIP = { x: 56, y: 4 };

/** Skin: warm on the fire's side, plain, and cool in the shadow away from it. */
const SKIN = {
	glint: mix(C.skin, C.gold, 0.45),
	lit: mix(C.skin, C.amber, 0.3),
	base: C.skin,
	shade: mix(C.skinShade, C.roof, 0.2),
	dark: mix(C.skinShade, C.night, 0.45),
};

/** The old scar down through his eye, his mouth and his stubble. */
const SCAR = mix(C.brickRed, C.skinShade, 0.35);
const LIP = mix(C.brickRedShade, C.night, 0.35);
const STUBBLE = {
	lit: mix(C.skinShade, C.wood, 0.35),
	shade: mix(C.skinShade, C.night, 0.55),
};

/** Steel for the helmet, the blade and the shield's rim: fire-lit, plain, shaded and dark. */
const STEEL = {
	glint: mix(C.lampGlow, C.amber, 0.2),
	lit: mix(C.stoneLight, C.amber, 0.35),
	base: C.stone,
	shade: C.stoneShade,
	dark: mix(C.stoneShade, C.night, 0.5),
};

/** Mail, in two alternating rings, lit and shaded. */
const MAIL = {
	lit: mix(C.stone, C.amber, 0.35),
	litRing: mix(C.stoneMid, C.amber, 0.2),
	base: C.stoneMid,
	ring: C.stoneShade,
	shade: mix(C.stoneShade, C.night, 0.35),
	shadeRing: mix(C.stoneShade, C.night, 0.6),
};

/** The dark red surcoat over his mail. */
const SURCOAT = {
	lit: mix(C.brickRed, C.amber, 0.3),
	base: C.brickRedShade,
	shade: mix(C.brickRedShade, C.night, 0.35),
	dark: mix(C.brickRedShade, C.night, 0.6),
};

/** The fur mantle on his shoulders. */
const FUR = {
	lit: mix(C.timberLight, C.amber, 0.35),
	base: C.timber,
	shade: C.timberShade,
	dark: mix(C.wood, C.night, 0.3),
};

/** The flame colours, which the glows leave alone. */
const FLAME = [C.lampGlow, C.gold, C.amber, C.brickRedLight, C.white];

/** The face and the steel are lit by hand, so the glows leave them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(STEEL),
	...Object.values(MAIL),
	...Object.values(FUR),
	...Object.values(STUBBLE),
	SCAR,
	LIP,
	C.ink,
	C.brass,
	C.brickRed,
	C.brickRedShade,
];

/**
 * Draws the Militants portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8012);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 22,
		starRows: 16,
	});
	drawFireSky(layer);
	drawGround(layer, random);
	drawOutposts(layer);
	drawFireSmoke(layer);

	const banner = createCanvas(64, 64);
	drawBanner(banner, {
		kind: 'flag',
		x: 3,
		y: HORIZON + 4,
		height: 42,
		cloth: C.brickRed,
		device: C.night,
	});
	outline(banner, C.ink);

	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	underlay(figure, banner);

	drawShield(scene);
	drawArrow(scene);
	drawSword(scene);
	drawFist(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, layer);

	glow(scene, {
		x: FIRE.x,
		y: FIRE.y,
		radius: 26,
		colour: C.amber,
		strength: 0.4,
		steps: 4,
		skip: [...FLAME, ...FIGURE],
	});
	glow(scene, {
		x: FAR_FIRE.x,
		y: FAR_FIRE.y,
		radius: 14,
		colour: C.amber,
		strength: 0.3,
		steps: 3,
		skip: [...FLAME, ...FIGURE],
	});
	drawBlood(scene);
	drawEmbers(scene, random);
	return scene;
}

/**
 * Reddens the lower sky with the glow of the fires below it.
 * @param {Canvas} layer
 */
function drawFireSky(layer) {
	for (let y = 14; y <= HORIZON; y++) {
		const t = (y - 14) / (HORIZON - 14);
		for (let x = 0; x < 64; x++) {
			const colour = get(layer, x, y);
			if (colour) {
				set(layer, x, y, mix(colour, C.brickRedShade, 0.65 * t));
			}
		}
	}
}

/**
 * Scorched ground below the horizon, with a few embers in it.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawGround(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.night, 0.55);
			if (y === HORIZON + 1) {
				colour = mix(C.timber, C.brickRedShade, 0.5);
			} else if ((x + y) % 2 === 0 && y > HORIZON + 6) {
				colour = mix(C.wood, C.night, 0.5);
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 2 + Math.floor(random() * 20);
		set(layer, x, y, C.amber);
	}
}

/**
 * Two wooden outposts on the horizon, both burning: a palisade tower on the right and a hut on the left.
 * @param {Canvas} layer
 */
function drawOutposts(layer) {
	const wood = mix(C.wood, C.night, 0.2);
	const plank = mix(C.timberShade, C.night, 0.25);
	const charred = mix(C.wood, C.night, 0.55);
	// The tower: a box on legs behind a pointed palisade.
	for (let y = 26; y <= HORIZON; y++) {
		for (let x = 50; x <= 63; x++) {
			if (y < 33 && (x < 51 || x > 62)) {
				continue;
			}
			set(layer, x, y, (x - 50) % 3 === 0 ? plank : wood);
		}
	}
	rect(layer, 50, 32, 14, 1, charred);
	rect(layer, 54, 34, 3, 3, mix(C.amber, C.brickRedShade, 0.4));
	for (let x = 44; x <= 63; x += 2) {
		const top = HORIZON - 5 - ((x * 3) % 3);
		rect(layer, x, top, 1, HORIZON - top + 1, plank);
		set(layer, x, top - 1, charred);
	}
	// The hut on the left, its roof on fire.
	for (let y = 31; y <= HORIZON; y++) {
		const half = y < 35 ? y - 30 + 2 : 7;
		for (let x = 7 - half; x <= 7 + half; x++) {
			set(layer, x, y, y < 35 ? charred : wood);
		}
	}
	rect(layer, 6, 37, 2, 4, mix(C.amber, C.brickRedShade, 0.4));
	// The flames over both.
	paint(
		layer,
		FIRE.x - 7,
		FIRE.y - 13,
		[
			'.......g.......',
			'......gg..g....',
			'...g..gag.g....',
			'...gg.gaggg..g.',
			'..gag.gaagg.gg.',
			'..gaggaaWagggg.',
			'.ggaaaaWWaagag.',
			'.gaaWWWwwWaaag.',
			'gaaWWwwwwwWaarg',
			'gaaWwwwwwwwWarr',
			'raaWwwwwwwwWarr',
			'raWWwwwwwwWWaar',
			'rraWWWwwWWWaarr',
			'.rraaWWWWaaarr.',
		],
		{
			g: C.brickRedLight,
			a: C.amber,
			W: C.gold,
			w: C.lampGlow,
			r: C.brickRedLight,
		}
	);
	paint(
		layer,
		FAR_FIRE.x - 5,
		FAR_FIRE.y - 7,
		[
			'....g.....',
			'.g..gg.g..',
			'.gg.gagg..',
			'gaggaWagg.',
			'gaWWaWWag.',
			'gaWwwwWaag',
			'gaWwwwwWag',
			'.aaWWWWaa.',
		],
		{ g: C.brickRedLight, a: C.amber, W: C.gold, w: C.lampGlow }
	);
}

/**
 * Dark smoke rolling up from both fires and leaning left on the wind.
 * @param {Canvas} layer
 */
function drawFireSmoke(layer) {
	const smoke = createCanvas(64, 64);
	drawSmoke(smoke, {
		x: FIRE.x - 1,
		y: FIRE.y - 12,
		tone: 'smoke',
		puffs: 4,
		drift: -1,
	});
	drawSmoke(smoke, {
		x: FAR_FIRE.x,
		y: FAR_FIRE.y - 7,
		tone: 'smoke',
		puffs: 3,
		drift: 1,
	});
	for (let i = 0; i < smoke.p.length; i++) {
		const colour = smoke.p[i];
		const behind = layer.p[i];
		if (colour && behind) {
			layer.p[i] = mix(
				behind,
				colour === C.stoneLight ? C.stoneShade : C.roofShade,
				0.55
			);
		}
	}
}

/**
 * His body: a fur mantle over his shoulders, mail sleeves, and a dark red surcoat over the mail
 * with a baldric across it, lit by the fire on his left and in shadow on his right.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The mail, seen at the shoulders and the sides.
	for (let y = 27; y < 64; y++) {
		const half = Math.min(23, 9 + Math.round((y - 27) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			set(scene, x, y, mail(x, y, u > 0.7 ? 1 : u < -0.35 ? -1 : 0));
		}
	}
	// The surcoat over the mail: dark red, lit on the fire's side, with folds falling from the chest.
	for (let y = 33; y < 64; y++) {
		const half = Math.min(14, 9 + Math.floor((y - 33) / 3));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SURCOAT.base;
			if (u >= 0.85) {
				colour = SURCOAT.lit;
			} else if (u < -0.6) {
				colour = SURCOAT.dark;
			} else if (u < -0.1 || (y > 44 && (x - FACE_X + 30) % 7 === 0)) {
				colour = SURCOAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The leather baldric from his left shoulder down across his chest, with a brass buckle.
	for (let y = 30; y < 64; y++) {
		const x = FACE_X + 13 - Math.round((y - 30) * 0.75);
		set(scene, x, y, C.timberLight);
		set(scene, x + 1, y, C.timber);
		set(scene, x + 2, y, C.timberShade);
	}
	paint(scene, FACE_X + 2, 41, ['bbb', 'b.b', 'bbb'], { b: C.brass });
	// The fur mantle over both shoulders, ragged along its lower edge.
	for (let y = 25; y <= 38; y++) {
		const half = Math.min(25, 8 + Math.round((y - 25) * 3.2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const ragged = y >= 34 + ((x * 7) % 5);
			if (ragged || (Math.abs(x - FACE_X - 0.5) < 6.5 && y > 26)) {
				continue;
			}
			const u = (x - FACE_X) / half;
			const tuft = (x * 5 + y * 3) % 7 === 0;
			let colour = tuft ? FUR.shade : FUR.base;
			if (u > 0.5) {
				colour = tuft ? FUR.base : FUR.lit;
			} else if (u < -0.3) {
				colour = tuft ? FUR.dark : FUR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A brass brooch pinning the mantle at his throat.
	paint(scene, FACE_X - 8, 29, ['.b.', 'bgb', '.b.'], {
		b: C.brass,
		g: C.gold,
	});
}

/**
 * One pixel of mail: rows of rings, lit on the fire's side and dark on the other.
 * @param {number} x
 * @param {number} y
 * @param {-1 | 0 | 1} side - 1 lit, 0 plain, -1 in shadow
 * @returns {Colour}
 */
function mail(x, y, side) {
	const ring = y % 2 === 0 && (x + y / 2) % 2 === 0;
	if (side > 0) {
		return ring ? MAIL.litRing : MAIL.lit;
	}
	if (side < 0) {
		return ring ? MAIL.shadeRing : MAIL.shade;
	}
	return ring ? MAIL.ring : MAIL.base;
}

/**
 * His head: a mail coif round his face, a dented steel helmet with a nose guard,
 * and his face lit by the fire on his left, an old scar down through his lit eye, a scowl and stubble.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The coif: mail framing the face and covering his neck, down to the mantle.
	for (let y = BRIM; y <= 28; y++) {
		const half = y < 22 ? 8 : 8 - Math.round((y - 21) * 0.3);
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			let side = /** @type {-1 | 0 | 1} */ (0);
			if (x > FACE_X + half - 2) {
				side = 1;
			} else if (x < FACE_X - half + 3) {
				side = -1;
			}
			set(scene, x, y, mail(x, y, side));
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
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
		[23, -3, 4],
		[24, -2, 3],
		[25, -1, 2],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 4) {
				colour = SKIN.glint;
			} else if (dx >= 2) {
				colour = SKIN.lit;
			} else if (dx === from) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Stubble along the jaw and round the mouth.
	for (const [y, from, to] of rows) {
		if (y < 21) {
			continue;
		}
		for (let dx = from; dx <= to; dx++) {
			if ((dx + y) % 2 === 0 || y >= 24) {
				set(
					scene,
					FACE_X + dx,
					y,
					dx >= 1 ? STUBBLE.lit : STUBBLE.shade
				);
			}
		}
	}
	// The helmet: a steel dome, lit along the fire's side, with a ridge and a riveted brim.
	for (let y = 2; y <= BRIM; y++) {
		const half = Math.round(
			Math.sqrt(Math.max(0, 1 - ((y - BRIM) / 9.5) ** 2)) * 8.5
		);
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const u = (x - FACE_X - 0.5) / (half + 0.5);
			let colour = STEEL.base;
			if (x === FACE_X + half + 1 && u > 0.5) {
				colour = STEEL.glint;
			} else if (u > 0.3) {
				colour = STEEL.lit;
			} else if (u < -0.6) {
				colour = STEEL.dark;
			} else if (u < -0.1) {
				colour = STEEL.shade;
			}
			set(scene, x, y, colour);
		}
	}
	rect(scene, FACE_X, 2, 1, BRIM - 2, STEEL.lit);
	rect(scene, FACE_X - 8, BRIM, 18, 1, STEEL.shade);
	rect(scene, FACE_X + 3, BRIM, 7, 1, STEEL.lit);
	for (let x = FACE_X - 6; x <= FACE_X + 8; x += 3) {
		set(scene, x, BRIM, C.brass);
	}
	// A dent knocked into the dome on the lit side, its far wall catching the fire.
	paint(scene, FACE_X + 3, 4, ['.dd', 'ddL', '.L.'], {
		d: STEEL.dark,
		L: STEEL.glint,
	});
	// The nose guard down from the brim to the bridge of his nose.
	rect(scene, FACE_X, BRIM + 1, 1, 4, STEEL.base);
	// Brows drawn down to the guard in a scowl; the scar breaks the lit one.
	for (const [x, y] of [
		[FACE_X - 4, 13],
		[FACE_X - 3, 13],
		[FACE_X - 2, 14],
		[FACE_X - 1, 14],
		[FACE_X + 1, 14],
		[FACE_X + 2, 14],
		[FACE_X + 3, 13],
		[FACE_X + 5, 13],
	]) {
		set(scene, x, y, C.wood);
	}
	// Eyes looking straight out.
	set(scene, FACE_X - 3, 15, mix(C.cream, C.skinShade, 0.5));
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, C.ink);
	set(scene, FACE_X + 3, 15, C.creamLight);
	// The scar: from his brow down past his lit eye and across the cheek.
	for (const [x, y] of [
		[FACE_X + 4, 12],
		[FACE_X + 4, 13],
		[FACE_X + 4, 14],
		[FACE_X + 4, 16],
		[FACE_X + 4, 17],
		[FACE_X + 3, 18],
		[FACE_X + 3, 19],
	]) {
		set(scene, x, y, SCAR);
	}
	// The nose, its shaded side and its lit tip.
	rect(scene, FACE_X - 1, 16, 1, 2, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 18, SKIN.shade);
	set(scene, FACE_X, 19, SKIN.dark);
	// A hard mouth, turned down at the corners.
	set(scene, FACE_X - 1, 22, LIP);
	rect(scene, FACE_X, 21, 3, 1, LIP);
	set(scene, FACE_X + 3, 22, LIP);
}

/**
 * The round shield on his right arm: boards painted in red and bone quarters, an iron rim and boss,
 * the rim bent in by a blow and the boards split behind it.
 * @param {Canvas} scene
 */
function drawShield(scene) {
	const { x: cx, y: cy, r } = SHIELD;
	for (let y = cy - r; y <= Math.min(63, cy + r); y++) {
		for (let x = cx - r; x <= cx + r; x++) {
			const d = Math.hypot(x - cx, y - cy);
			// The dent: a bite out of the rim at the upper right.
			const dent = Math.hypot(x - cx - 9, y - cy + 10) < 3.2;
			if (d > r + 0.4 || dent) {
				continue;
			}
			let colour;
			if (d > r - 1.6) {
				colour = x - cx > y - cy ? STEEL.base : STEEL.shade;
			} else {
				const red = x < cx === y < cy;
				const shaded = d > r - 3.5 && x - cx < y - cy;
				if (red) {
					colour = shaded ? C.brickRedShade : C.brickRed;
				} else {
					colour = shaded
						? mix(C.creamShade, C.night, 0.3)
						: C.creamShade;
				}
				if ((x - cx + 40) % 5 === 0 && !shaded) {
					colour = red
						? mix(C.brickRed, C.brickRedShade, 0.5)
						: mix(C.creamShade, C.timber, 0.3);
				}
			}
			set(scene, x, y, colour);
		}
	}
	// The bent rim round the dent, and a split running in from it.
	for (const [x, y] of [
		[cx + 6, cy - 12],
		[cx + 6, cy - 11],
		[cx + 7, cy - 10],
		[cx + 8, cy - 7],
		[cx + 9, cy - 7],
		[cx + 10, cy - 7],
	]) {
		set(scene, x, y, STEEL.lit);
	}
	line(scene, cx + 6, cy - 8, cx + 2, cy - 4, mix(C.wood, C.night, 0.4));
	line(scene, cx + 3, cy - 5, cx + 1, cy - 5, mix(C.wood, C.night, 0.4));
	// The boss.
	paint(
		scene,
		cx - 3,
		cy - 3,
		['.sss.', 'sbbLs', 'sbLWs', 'sbbbs', '.sss.'],
		{ s: STEEL.shade, b: STEEL.base, L: STEEL.lit, W: STEEL.glint }
	);
}

/**
 * A broken arrow stuck in the shield's face, its fletching still on.
 * @param {Canvas} scene
 */
function drawArrow(scene) {
	line(scene, 5, 47, 0, 42, C.timberLight);
	paint(scene, 0, 40, ['c.', 'cc', '.c'], { c: C.cream });
	set(scene, 6, 48, C.wood);
}

/**
 * The sword raised to his left: a long steel blade on a diagonal from the crossguard to the tip,
 * lit along its edge by the fire, with a brass crossguard and pommel.
 * @param {Canvas} scene
 */
function drawSword(scene) {
	for (const [x, y, t] of bladeColumns()) {
		const tapered = t > 0.88;
		set(scene, x - 1, y, tapered ? STEEL.base : STEEL.shade);
		set(scene, x, y, STEEL.base);
		if (!tapered) {
			set(scene, x + 1, y, STEEL.lit);
		}
	}
	// The crossguard, square to the blade, and the grip running back from it to the pommel.
	line(scene, GUARD.x - 4, GUARD.y - 1, GUARD.x + 4, GUARD.y + 2, C.gold);
	line(scene, GUARD.x - 4, GUARD.y, GUARD.x + 4, GUARD.y + 3, C.lampFrame);
	line(scene, GUARD.x - 1, GUARD.y + 2, GUARD.x - 3, GUARD.y + 7, C.wood);
	paint(scene, GUARD.x - 5, GUARD.y + 7, ['.g.', 'gbg', '.g.'], {
		g: C.brass,
		b: C.gold,
	});
}

/**
 * The blade's centre pixel on each row from the crossguard up to the tip.
 * @returns {[number, number, number][]} Column, row and how far along the blade (0 at the guard, 1 at the tip).
 */
function bladeColumns() {
	/** @type {[number, number, number][]} */
	const columns = [];
	for (let y = GUARD.y - 1; y >= TIP.y; y--) {
		const t = (GUARD.y - y) / (GUARD.y - TIP.y);
		columns.push([Math.round(GUARD.x + (TIP.x - GUARD.x) * t), y, t]);
	}
	return columns;
}

/**
 * His bare fist round the grip, and his forearm in a mail sleeve and a leather bracer, reaching down out of the picture.
 * @param {Canvas} scene
 */
function drawFist(scene) {
	for (let y = GUARD.y + 5; y < 64; y++) {
		const centre = GUARD.x + Math.round((y - GUARD.y - 5) * 0.6);
		const bracer = y < GUARD.y + 12;
		for (let x = centre - 3; x <= centre + 4; x++) {
			const side = x >= centre + 3 ? 1 : x <= centre - 2 ? -1 : 0;
			let colour = mail(x, y, side);
			if (bracer) {
				colour = [
					C.timberShade,
					C.timber,
					mix(C.timberLight, C.amber, 0.3),
				][side + 1];
				if (y === GUARD.y + 8) {
					colour = C.wood;
				}
			}
			set(scene, x, y, colour);
		}
	}
	// The fist round the grip below the guard: knuckles lit by the fire, the thumb over the fingers.
	paint(
		scene,
		GUARD.x - 4,
		GUARD.y + 2,
		['.lLL.', 'lLWLs', 'bllbs', 'sbbs.'],
		{
			s: SKIN.shade,
			b: SKIN.base,
			l: SKIN.lit,
			L: SKIN.glint,
			W: C.lampGlow,
		}
	);
}

/**
 * Blood along the middle of the blade, running down towards the guard, painted after the glows so it stays dark red;
 * the tip stays bright steel against the fire.
 * @param {Canvas} scene
 */
function drawBlood(scene) {
	for (const [x, y, t] of bladeColumns()) {
		if (t < 0.12 || t > 0.66 || (t < 0.3 && y % 3 !== 0)) {
			continue;
		}
		set(scene, x, y, C.brickRed);
		if (t > 0.38) {
			set(scene, x - 1, y, C.brickRedShade);
			set(scene, x + 1, y, y % 4 === 0 ? C.brickRedLight : C.brickRed);
		}
	}
}

/**
 * Sparks drifting up from the fires.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawEmbers(scene, random) {
	for (let i = 0; i < 9; i++) {
		const x = 40 + Math.floor(random() * 24);
		const y = 2 + Math.floor(random() * 12);
		set(scene, x, y, random() > 0.5 ? C.gold : C.amber);
	}
	for (let i = 0; i < 4; i++) {
		const x = Math.floor(random() * 16);
		const y = 14 + Math.floor(random() * 10);
		if (get(scene, x, y) !== C.brickRed) {
			set(scene, x, y, C.amber);
		}
	}
}
