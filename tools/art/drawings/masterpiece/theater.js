// Theater: a lone actor in a black doublet and white ruff holding up a skull in a single spotlight on bare boards at night, a painted moon backdrop behind.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The first row of the stage boards; the painted backdrop hangs above it. */
const STAGE = 46;

/** The spotlight, high above the stage and a little to the right, and the pool it throws round the actor's feet. */
const SPOT = { x: 40, y: -34 };
const POOL = { x: 32, y: 58, rx: 21, ry: 4.5 };

/** The painted moon on the backdrop: its centre and radius. */
const MOON = { x: 14, y: 14, r: 8 };

/** The point the boards run towards, far behind the backdrop. */
const VANISH = { x: 32, y: 8 };

/** The actor's centre column and the row his feet stand on. */
const ACTOR_X = 29;
const FEET = 59;

/** The skull's top-left pixel, held up at the height of his eyes. */
const SKULL = { x: 42, y: 6 };

/** The painted night sky of the backdrop, from the top down, a darker crease where the cloth hangs in folds, and its weighted hem. */
const SKY = [C.nightSky2, C.nightSky3, C.nightSky4];
const CREASE = mix(C.nightSky3, C.ink, 0.35);
const HEM = mix(C.nightSky5, C.night, 0.4);

/** The painted moon, its halo, its craters and the painted clouds drifting across it. */
const HALO = mix(C.nightSky5, C.moonRim, 0.22);
const CRATER = mix(C.moonRim, C.creamShade, 0.6);
const CLOUD = mix(C.roofLight, C.nightSky5, 0.35);
const CLOUD_LIT = mix(C.railLight, C.moonRim, 0.3);

/** The stage boards: dark away from the light, warm in the spotlight's pool, the seams between them and the actor's shadow. */
const BOARD = mix(C.floorShade, C.night, 0.45);
const BOARD_NEAR = mix(C.floorShade, C.night, 0.2);
const BOARD_POOL = C.floorLight;
const BOARD_CORE = mix(C.floorLight, C.lampGlow, 0.3);
const SEAM = mix(C.floorShade, C.ink, 0.6);
const SEAM_POOL = C.floorShade;
const SHADOW = mix(C.floorShade, C.ink, 0.45);

/** A speck of dust caught in the beam. */
const MOTE = mix(C.nightSky5, C.lampGlow, 0.55);

/** The black doublet, sleeves and hose: a warm glint where the spotlight catches it, lit, plain and in shadow. */
const BLACK = {
	glint: mix(C.roofLight, C.lampGlow, 0.35),
	lit: mix(C.roof, C.amber, 0.15),
	base: mix(C.roofShade, C.night, 0.25),
	shade: mix(C.night, C.ink, 0.3),
};

/** The silver silk showing through the slashes of his sleeves and his paned hose. */
const SILK = { lit: C.stoneLight, base: C.stoneMid };

/** His skin, lit warm from above on the right, plain and in shadow. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.45),
	lit: mix(C.skinTan, C.gold, 0.22),
	base: C.skinTan,
	shade: C.skinTanShade,
	dark: mix(C.skinTanShade, C.wood, 0.45),
};

/** His short dark brown hair and beard, with a warm sheen on top. */
const HAIR = {
	lit: mix(C.timberShade, C.amber, 0.3),
	base: C.wood,
	dark: mix(C.wood, C.ink, 0.4),
};

/** The old yellowed bone of the skull. */
const BONE = {
	glint: C.creamLight,
	lit: C.cream,
	base: mix(C.cream, C.creamShade, 0.5),
	shade: C.creamShade,
	dark: mix(C.creamShade, C.timberShade, 0.45),
};

/**
 * Draws the Theater masterpiece.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(4106);

	drawBackdrop(layer, random);
	drawMoon(layer);
	drawClouds(layer);
	drawPaintedStars(layer);
	drawHem(layer);
	drawBoards(layer);
	drawShadow(layer);
	drawBeam(layer);
	drawMotes(layer, random);

	const actor = createCanvas(64, 64);
	drawLegs(actor);
	drawHose(actor);
	drawDoublet(actor);
	drawNearArm(actor);
	drawRuff(actor);
	drawHead(actor);
	drawFarArm(actor);
	drawSkull(actor);
	outline(actor, C.ink);
	underlay(actor, layer);

	drawGlints(actor);
	return actor;
}

/**
 * How far a pixel lies inside the spotlight's cone: 2 in its bright core, 1 at its edge, 0 outside.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function inBeam(x, y) {
	const t = (y - SPOT.y) / (POOL.y - SPOT.y);
	const centre = SPOT.x + (POOL.x - SPOT.x) * t;
	const half = POOL.rx * t;
	const off = Math.abs(x - centre);
	if (off < half * 0.55) {
		return 2;
	}
	return off < half ? 1 : 0;
}

/**
 * The painted backdrop: a night sky laid on in broad horizontal strokes, the cloth hanging in shallow folds.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBackdrop(layer, random) {
	for (let y = 0; y < STAGE; y++) {
		const t = (y / (STAGE - 1)) * (SKY.length - 1);
		const band = Math.floor(t);
		for (let x = 0; x < 64; x++) {
			const dither =
				band + 1 < SKY.length && t - band > 0.55 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? SKY[band + 1] : SKY[band]);
		}
	}
	// Brush strokes: short dashes of the neighbouring band's paint.
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * (STAGE - 2));
		const length = 3 + Math.floor(random() * 5);
		const band = Math.min(
			SKY.length - 1,
			Math.floor((y / (STAGE - 1)) * (SKY.length - 1)) + 1
		);
		const paintColour = random() > 0.5 ? SKY[band] : SKY[band - 1];
		rect(layer, x, y, length, 1, paintColour);
	}
	// The folds, each a soft crease down the hanging cloth.
	for (let x = 7; x < 64; x += 11) {
		for (let y = 0; y < STAGE - 2; y++) {
			const sway = Math.round(Math.sin(y * 0.15 + x) * 0.6);
			set(layer, x + sway, y, CREASE);
		}
	}
}

/**
 * The painted full moon, flat and pale with a few craters, in a soft halo of paint.
 * @param {Canvas} layer
 */
function drawMoon(layer) {
	const { x: cx, y: cy, r } = MOON;
	for (let y = cy - r - 3; y <= cy + r + 3; y++) {
		for (let x = cx - r - 3; x <= cx + r + 3; x++) {
			const d = Math.hypot(x - cx, y - cy);
			if (d <= r - 1.2) {
				set(layer, x, y, C.moon);
			} else if (d <= r) {
				set(layer, x, y, C.moonRim);
			} else if (d <= r + 2.6 && (x + y) % 2 === 0) {
				set(layer, x, y, HALO);
			}
		}
	}
	// The craters, painted as soft dabs, and the brush's lighter sweep on the lit side.
	for (const [dx, dy, w] of [
		[-3, -2, 3],
		[1, 2, 2],
		[-1, 4, 2],
		[3, -4, 2],
	]) {
		rect(layer, cx + dx, cy + dy, w, 1, CRATER);
		rect(layer, cx + dx, cy + dy + 1, w - 1, 1, C.moonRim);
	}
	for (let dy = -5; dy <= -2; dy++) {
		set(layer, cx - 5 - Math.round(dy * 0.4), cy + dy, C.creamLight);
	}
}

/**
 * Three long painted clouds: one drifting across the moon's lower half and two on the far side of the cloth.
 * @param {Canvas} layer
 */
function drawClouds(layer) {
	/** @type {[number, number, number][]} */
	const clouds = [
		[3, 19, 22],
		[38, 6, 18],
		[44, 30, 15],
	];
	for (const [x0, y0, length] of clouds) {
		for (let i = 0; i < length; i++) {
			const x = x0 + i;
			const swell = Math.round(Math.sin((i / length) * Math.PI) * 2);
			for (let y = y0 - swell; y <= y0; y++) {
				set(layer, x, y, y === y0 - swell ? CLOUD_LIT : CLOUD);
			}
			// The cloud's curled lower edge, painted in a wave.
			if (i % 5 === 2) {
				set(layer, x, y0 + 1, CLOUD);
			}
		}
	}
}

/**
 * A few gold painted stars, each a little cross, the way scene painters dab them on.
 * @param {Canvas} layer
 */
function drawPaintedStars(layer) {
	for (const [x, y] of [
		[56, 5],
		[55, 21],
		[31, 24],
		[8, 33],
	]) {
		set(layer, x, y, C.gold);
		set(layer, x - 1, y, C.amber);
		set(layer, x + 1, y, C.amber);
		set(layer, x, y - 1, C.amber);
		set(layer, x, y + 1, C.amber);
	}
}

/**
 * The backdrop's weighted hem, where the cloth meets the boards.
 * @param {Canvas} layer
 */
function drawHem(layer) {
	rect(layer, 0, STAGE - 2, 64, 1, HEM);
	rect(layer, 0, STAGE - 1, 64, 1, CREASE);
}

/**
 * The bare boards, running away from the viewer towards the backdrop, warm in the spotlight's pool and dark beyond it.
 * @param {Canvas} layer
 */
function drawBoards(layer) {
	for (let y = STAGE; y < 64; y++) {
		const depth = (y - VANISH.y) / (STAGE - VANISH.y);
		for (let x = 0; x < 64; x++) {
			// Where this pixel's board started at the backdrop's foot: every 5 columns a seam.
			const back = VANISH.x + (x - VANISH.x) / depth;
			const seam =
				Math.abs(back - Math.round(back / 5) * 5) < 0.5 / depth;
			const pool = Math.hypot(
				(x - POOL.x) / POOL.rx,
				(y - POOL.y) / POOL.ry
			);
			let colour = y > 55 ? BOARD_NEAR : BOARD;
			if (pool < 0.55) {
				colour = seam ? SEAM_POOL : BOARD_CORE;
			} else if (pool < 1) {
				colour = seam ? SEAM_POOL : BOARD_POOL;
			} else if (seam) {
				colour = SEAM;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The actor's short shadow, thrown down and to the left by the light above him.
 * @param {Canvas} layer
 */
function drawShadow(layer) {
	for (let y = 58; y < 64; y++) {
		for (let x = 10; x < 34; x++) {
			if (Math.hypot((x - 22) / 11, (y - 61) / 2.4) < 1) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * The spotlight's cone as a haze over the backdrop: the paint brightens a step at its edge and two in its core.
 * @param {Canvas} layer
 */
function drawBeam(layer) {
	for (let y = 0; y < STAGE; y++) {
		for (let x = 0; x < 64; x++) {
			const beam = inBeam(x, y);
			const colour = get(layer, x, y);
			if (beam && colour && colour !== C.moon && colour !== C.moonRim) {
				set(layer, x, y, mix(colour, C.lampGlow, beam * 0.17));
			}
		}
	}
}

/**
 * Specks of dust drifting in the beam above the actor.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMotes(layer, random) {
	for (let i = 0; i < 300; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 30);
		if (inBeam(x, y) === 2 && random() < 0.12) {
			set(layer, x, y, MOTE);
		}
	}
}

/**
 * The black tights and shoes: the back leg straight, the front leg a half step out to the right.
 * @param {Canvas} actor
 */
function drawLegs(actor) {
	for (let y = 41; y < FEET - 1; y++) {
		// The back leg, in the shadow of the front one.
		const back = ACTOR_X - 4 - (y > 51 ? 1 : 0);
		set(actor, back, y, BLACK.shade);
		rect(actor, back + 1, y, 2, 1, BLACK.base);
		set(actor, back + 3, y, BLACK.lit);
		// The front leg, angled out a little, its shin catching the light.
		const front = ACTOR_X + 1 + Math.round((y - 41) * 0.15);
		set(actor, front, y, BLACK.base);
		set(actor, front + 1, y, BLACK.lit);
		set(actor, front + 2, y, y > 46 && y < 54 ? BLACK.glint : BLACK.lit);
		set(actor, front + 3, y, BLACK.base);
	}
	// Silver garters tied below the knees, the bows on the outer sides.
	rect(actor, ACTOR_X - 4, 47, 4, 1, SILK.base);
	set(actor, ACTOR_X - 5, 47, SILK.base);
	set(actor, ACTOR_X - 5, 48, SILK.base);
	rect(actor, ACTOR_X + 2, 47, 4, 1, SILK.lit);
	set(actor, ACTOR_X + 6, 47, SILK.lit);
	set(actor, ACTOR_X + 6, 48, SILK.base);
	// The shoes, pointing the way he faces, each with a silver rosette.
	paint(actor, ACTOR_X - 6, FEET - 2, ['.ssbb.', 'ssbbbl'], {
		s: BLACK.shade,
		b: BLACK.base,
		l: BLACK.lit,
	});
	paint(actor, ACTOR_X + 3, FEET - 2, ['.bll...', 'bblllgl'], {
		b: BLACK.base,
		l: BLACK.lit,
		g: BLACK.glint,
	});
	set(actor, ACTOR_X - 3, FEET - 2, SILK.base);
	set(actor, ACTOR_X + 5, FEET - 2, SILK.lit);
}

/**
 * The short paned trunk hose: a round puff over the hips, black bands over silver silk.
 * @param {Canvas} actor
 */
function drawHose(actor) {
	for (let y = 34; y <= 42; y++) {
		const half = Math.round(Math.sin(((y - 33) / 10) * Math.PI) * 3) + 5;
		const from = ACTOR_X - half;
		const to = ACTOR_X + 1 + half;
		for (let x = from; x <= to; x++) {
			const rel = (x - from) / (to - from);
			const pane = (x - ACTOR_X + 30) % 3 === 0;
			let colour = BLACK.base;
			if (pane) {
				colour = rel > 0.5 ? SILK.lit : SILK.base;
			} else if (x === to) {
				colour = y < 39 ? BLACK.glint : BLACK.lit;
			} else if (rel > 0.7) {
				colour = BLACK.lit;
			} else if (rel < 0.2) {
				colour = BLACK.shade;
			}
			set(actor, x, y, colour);
		}
	}
}

/**
 * The black doublet: padded shoulder wings, a row of brass buttons and a point at the waist, lit along its right side.
 * @param {Canvas} actor
 */
function drawDoublet(actor) {
	for (let y = 21; y <= 37; y++) {
		let half = 8;
		if (y === 21) {
			half = 7;
		} else if (y > 24) {
			half = 8 - Math.round((y - 24) * 0.25);
		}
		// The point at the waist narrows to the middle over the hose.
		if (y > 34) {
			half = Math.min(half, 3 - Math.round((y - 35) * 1.5));
		}
		const from = ACTOR_X - half;
		const to = ACTOR_X + 1 + half;
		for (let x = from; x <= to; x++) {
			let colour = BLACK.base;
			if (x === to && y < 32) {
				colour = BLACK.glint;
			} else if (x >= to - 2 || y === 21) {
				colour = BLACK.lit;
			} else if (x <= from + 1) {
				colour = BLACK.shade;
			} else if (x >= ACTOR_X + 3 && x <= ACTOR_X + 4 && y < 30) {
				colour = BLACK.lit;
			}
			set(actor, x, y, colour);
		}
	}
	// The buttons down the front opening, a little right of centre as he turns.
	for (let y = 22; y <= 35; y++) {
		set(actor, ACTOR_X + 1, y, BLACK.shade);
		if (y % 2 === 0) {
			set(actor, ACTOR_X + 2, y, y < 28 ? C.gold : C.brass);
		}
	}
	// A thin silver belt at the waist.
	for (let x = ACTOR_X - 6; x <= ACTOR_X + 7; x++) {
		set(actor, x, 33, x > ACTOR_X + 2 ? SILK.lit : SILK.base);
	}
}

/**
 * His near arm hanging at his side in a slashed sleeve, the hand loose by his hip.
 * @param {Canvas} actor
 */
function drawNearArm(actor) {
	for (let y = 22; y <= 37; y++) {
		const x = ACTOR_X - 11 + Math.round((y - 22) * 0.07);
		set(actor, x, y, BLACK.shade);
		set(actor, x + 1, y, (y - 22) % 4 === 2 ? SILK.base : BLACK.base);
		set(actor, x + 2, y, BLACK.base);
		// The padded shoulder wing over the top of the sleeve.
		if (y < 25) {
			set(actor, x + 1, y, BLACK.lit);
		}
	}
	rect(actor, ACTOR_X - 11, 38, 4, 1, C.cream);
	set(actor, ACTOR_X - 11, 38, C.creamShade);
	paint(actor, ACTOR_X - 11, 39, ['dsSs', '.sSs', '.ss.'], {
		d: SKIN.dark,
		s: SKIN.shade,
		S: SKIN.base,
	});
}

/**
 * The white millstone ruff round his neck: round pleats lit on the right, scalloped along both edges.
 * @param {Canvas} actor
 */
function drawRuff(actor) {
	const reach = [4, 6, 7, 7, 6];
	reach.forEach((half, j) => {
		const y = 17 + j;
		for (let x = ACTOR_X + 1 - half; x <= ACTOR_X + 2 + half; x++) {
			const edge = x === ACTOR_X + 1 - half || x === ACTOR_X + 2 + half;
			if (edge && (j === 0 || j === reach.length - 1) && x % 2) {
				continue;
			}
			let colour = x % 2 ? C.cream : C.creamShade;
			if (x > ACTOR_X + 2) {
				colour = x % 2 ? C.white : C.creamLight;
			}
			if (j === reach.length - 1 && x % 2 === 0) {
				colour = C.creamShade;
			}
			set(actor, x, y, colour);
		}
	});
}

/**
 * His head, turned to the right towards the skull: short dark hair, a trimmed beard, lit along the brow and nose.
 * @param {Canvas} actor
 */
function drawHead(actor) {
	paint(
		actor,
		ACTOR_X - 4,
		4,
		[
			'...kHHHh...',
			'..kHHhhhh..',
			'.kHHHHHhhh.',
			'.kHHHHHHHhh',
			'kHHHHHSLLLh',
			'kHHHsSSSLLL',
			'kHHsSbbSSbb',
			'kHesSWESLEG',
			'.HesSSSSLLGG',
			'.kdsSSSSSLs.',
			'..dsSbbbbLS',
			'..dbSbmmbbb',
			'...dbbbbbb.',
			'....dbbbb..',
		],
		{
			H: HAIR.base,
			h: HAIR.lit,
			k: HAIR.dark,
			b: HAIR.base,
			m: SKIN.dark,
			e: SKIN.dark,
			L: SKIN.lit,
			S: SKIN.base,
			s: SKIN.shade,
			d: SKIN.dark,
			G: SKIN.glint,
			E: C.ink,
			W: C.creamLight,
		}
	);
}

/**
 * His far arm reaching out to the right, the elbow bent and the forearm raised, the hand cupped under the skull.
 * @param {Canvas} actor
 */
function drawFarArm(actor) {
	// The upper arm, out from the shoulder and a little down to the elbow.
	for (let i = 0; i <= 6; i++) {
		const x = ACTOR_X + 9 + i;
		const y = 22 + Math.round(i * 0.4);
		set(actor, x, y, BLACK.glint);
		set(actor, x, y + 1, i % 3 === 1 ? SILK.lit : BLACK.lit);
		set(actor, x, y + 2, BLACK.base);
		set(actor, x, y + 3, BLACK.shade);
	}
	// The forearm, raised from the elbow to the wrist.
	for (let y = 18; y <= 26; y++) {
		const x = ACTOR_X + 15 + Math.round((26 - y) * 0.15);
		set(actor, x, y, BLACK.base);
		set(actor, x + 1, y, BLACK.lit);
		set(actor, x + 2, y, BLACK.glint);
	}
	// The white cuff at the wrist.
	rect(actor, ACTOR_X + 15, 17, 4, 1, C.creamLight);
	set(actor, ACTOR_X + 15, 17, C.cream);
	// The palm under the skull, the fingers curled up round its jaw.
	paint(actor, ACTOR_X + 13, 15, ['S......S', 'sSLLLLLG'], {
		s: SKIN.shade,
		S: SKIN.base,
		L: SKIN.lit,
		G: SKIN.glint,
	});
}

/**
 * The skull held up on his palm, its empty sockets turned back towards him, lit from above on the right.
 * @param {Canvas} actor
 */
function drawSkull(actor) {
	paint(
		actor,
		SKULL.x,
		SKULL.y,
		[
			'..bLLLl.',
			'.bLLLLGl',
			'bLLLLLGL',
			'bbLLLLLL',
			'EEbEELLl',
			'EEbEEbLl',
			'dbbnbbbl',
			'.dTdTdb.',
			'.dTTTd..',
		],
		{
			G: BONE.glint,
			L: BONE.lit,
			l: BONE.base,
			b: BONE.shade,
			d: BONE.dark,
			n: BONE.dark,
			T: BONE.lit,
			E: C.ink,
		}
	);
}

/**
 * The last touches over the outline: the spotlight's gleam on the skull's crown, the actor's brow and his top button.
 * @param {Canvas} actor
 */
function drawGlints(actor) {
	set(actor, SKULL.x + 5, SKULL.y + 1, C.white);
	set(actor, ACTOR_X + 5, 9, SKIN.glint);
	set(actor, ACTOR_X + 2, 22, C.lampGlow);
}
