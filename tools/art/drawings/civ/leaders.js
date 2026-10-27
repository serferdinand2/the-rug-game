// Leaders: a ruler in a gold laurel wreath and a purple cloak raising her hand to a cheering crowd, sceptre in her other hand, between eagle standards on a sunny terrace.
import {
	createCanvas,
	set,
	rect,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The terrace parapet's top row. */
const RAIL = 53;

/** Where the crowd's front row stands, behind the parapet. */
const CROWD_FEET = 51;

/** The two standards' poles. */
const STANDARDS = [4, 59];

/** The sceptre's column, and the face's centre column. */
const SCEPTRE = 15;
const FACE_X = 31;

/** Skin: lit by the sun at her right, plain, and shaded on the far side. */
const SKIN = {
	glint: mix(C.skin, C.white, 0.35),
	lit: mix(C.skin, C.lampGlow, 0.25),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.roof, 0.3),
};

/** Dark hair, lit along the sun's side. */
const HAIR = {
	lit: mix(C.timber, C.timberLight, 0.4),
	base: C.timberShade,
	dark: C.wood,
};

/** The purple cloak: lit, plain and in its folds. */
const CLOAK = {
	lit: mix(C.arcane, C.brickRed, 0.35),
	base: mix(C.arcaneShade, C.brickRedShade, 0.35),
	shade: mix(C.arcaneShade, C.night, 0.4),
};

/** The white tunic under it. */
const TUNIC = { lit: C.white, base: C.cream, shade: C.creamShade };

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.white, shade: mix(C.cream, C.skinShade, 0.4) };

/**
 * Draws the Leaders portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8253);

	drawSky(layer, { time: 'day', horizon: 44, random });
	drawCity(layer);

	// The crowd and the standards are outlined on their own, so they stand clear of the city.
	const forum = createCanvas(64, 64);
	drawCheering(forum, random);
	for (const x of STANDARDS) {
		drawStandard(forum, x);
	}
	outline(forum, C.ink);
	underlay(forum, layer);

	// She is outlined on her own, so her raised arm and the sceptre stand clear of her.
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const arms = createCanvas(64, 64);
	drawRaisedArm(arms);
	drawSceptre(arms);
	outline(arms, C.ink);
	underlay(arms, figure);

	drawParapet(scene);
	outline(scene, C.ink);
	underlay(scene, arms);
	underlay(scene, forum);
	return scene;
}

/**
 * The city on the horizon, pale with distance: white walls and red roofs.
 * @param {Canvas} layer
 */
function drawCity(layer) {
	const wall = mix(C.cream, C.daySky5, 0.35);
	const shade = mix(C.creamShade, C.daySky4, 0.4);
	const roof = mix(C.brickRedLight, C.daySky5, 0.45);
	for (let x = 0; x < 64; x++) {
		const h = 3 + Math.round(2 + 2 * Math.sin(x * 0.7) + Math.sin(x * 1.9));
		const top = 41 - h;
		for (let y = top; y < 64; y++) {
			let colour = x % 6 === 5 ? shade : wall;
			if (y === top) {
				colour = roof;
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, 42, 64, 22, mix(C.creamShade, C.daySky4, 0.3));
}

/**
 * A cheering crowd in the square below, at both sides of her, many with their arms raised.
 * @param {Canvas} forum
 * @param {() => number} random
 */
function drawCheering(forum, random) {
	for (const [x, count] of [
		[-1, 4],
		[45, 5],
	]) {
		drawCrowd(forum, { x, y: CROWD_FEET, count, random });
		// Raised arms: a line of skin up from one shoulder of most of them.
		for (let i = 0; i < count; i++) {
			const px = x + i * 4;
			const top = (i % 2 ? CROWD_FEET - 2 : CROWD_FEET) - 9;
			if (random() < 0.75) {
				const side = random() < 0.5 ? 0 : 4;
				rect(forum, px + side, top - 2, 1, 4, C.skin);
				set(forum, px + side, top + 2, C.skinShade);
			}
		}
	}
}

/**
 * An eagle standard: a gilded eagle with its wings raised on a pole, a red banner with a gold
 * fringe hanging from a crossbar under it.
 * @param {Canvas} forum
 * @param {number} x - The pole's column
 */
function drawStandard(forum, x) {
	for (let y = 8; y < RAIL; y++) {
		set(forum, x, y, C.timber);
	}
	paint(
		forum,
		x - 4,
		0,
		[
			'g.......g',
			'Gg.....gG',
			'.Gg.k.gG.',
			'..GgggG..',
			'...gGg...',
			'....a....',
			'..aaaaa..',
		],
		{ g: C.gold, G: C.amber, k: C.lampGlow, a: C.brass }
	);
	// The banner on its crossbar.
	rect(forum, x - 5, 8, 11, 1, C.brass);
	for (let y = 9; y <= 19; y++) {
		for (let dx = -4; dx <= 4; dx++) {
			let colour = dx > 1 ? C.brickRedShade : C.brickRed;
			if (dx === -4 || dx === 4) {
				colour = C.gold;
			}
			set(forum, x + dx, y, colour);
		}
	}
	// A gold disc on the cloth.
	paint(forum, x - 2, 12, ['.gg.', 'gWgg', 'gggg', '.gg.'], {
		g: C.gold,
		W: C.lampGlow,
	});
	for (let dx = -4; dx <= 4; dx++) {
		set(forum, x + dx, 20, dx % 2 ? C.amber : C.gold);
	}
}

/**
 * Her shoulders and body: a white tunic, and the purple cloak thrown over her left shoulder and
 * pinned at her right with a gold brooch.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck, lit on the sun's side.
	for (let y = 25; y <= 27; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 1; x++) {
			let colour = SKIN.base;
			if (y === 25 && x > FACE_X - 2) {
				colour = SKIN.shade;
			} else if (x === FACE_X + 1) {
				colour = SKIN.shade;
			} else if (x === FACE_X - 2) {
				colour = SKIN.lit;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 28; y < RAIL; y++) {
		const half = Math.min(19, 7 + Math.round((y - 28) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = TUNIC.base;
			if (u < -0.7) {
				colour = TUNIC.lit;
			} else if (u > 0.4) {
				colour = TUNIC.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A gold border round the tunic's neck.
	for (let x = FACE_X - 3; x <= FACE_X + 2; x++) {
		set(scene, x, 28, x < FACE_X ? C.gold : C.amber);
	}
	// The cloak: over her left shoulder and falling across her body to the right hip.
	for (let y = 28; y < RAIL; y++) {
		const half = Math.min(19, 7 + Math.round((y - 28) * 2.4));
		const edge = FACE_X + 3 - Math.round((y - 28) * 0.75);
		for (let x = Math.max(edge, FACE_X - half); x <= FACE_X + half; x++) {
			let colour = CLOAK.base;
			if (x <= edge + 1) {
				colour = CLOAK.lit;
			} else if ((x - edge) % 6 === 0 || x >= FACE_X + half - 1) {
				colour = CLOAK.shade;
			}
			set(scene, x, y, colour);
		}
		// A gold hem along its edge.
		set(scene, Math.max(edge, FACE_X - half) - 1, y, C.gold);
	}
	// The cloak's end over her right shoulder, pinned with a round gold brooch.
	for (let y = 29; y <= 34; y++) {
		for (let x = FACE_X - 14 + (y - 29); x <= FACE_X - 8; x++) {
			set(scene, x, y, y === 29 ? CLOAK.lit : CLOAK.base);
		}
	}
	paint(scene, FACE_X - 10, 30, ['.aa.', 'aGga', 'agga', '.aa.'], {
		a: C.amber,
		g: C.gold,
		G: C.lampGlow,
	});
}

/**
 * Her head: dark hair parted and swept back under a gold laurel wreath, and her face turned to the
 * viewer, lit by the sun on her right, gold drops in her ears.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 3; y <= 24; y++) {
		for (let x = FACE_X - 10; x <= FACE_X + 10; x++) {
			const dx = x - FACE_X + 0.5;
			const head = (dx / 8.5) ** 2 + ((y - 13) / 9.5) ** 2;
			// The hair swept back to a knot low at the nape, which shows at both sides.
			const knot = y >= 18 && y <= 23 && Math.abs(dx) <= 9.5;
			if (head > 1 && !knot) {
				continue;
			}
			let colour = HAIR.base;
			if (dx < -5 && y < 18) {
				colour = HAIR.lit;
			} else if (dx > 4) {
				colour = HAIR.dark;
			}
			// Waves combed back from the parting.
			if ((Math.round(Math.abs(dx)) + y) % 4 === 0 && y < 16) {
				colour = dx < 0 ? HAIR.lit : HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The parting.
	for (let y = 5; y <= 9; y++) {
		set(scene, FACE_X, y, HAIR.dark);
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -3, 2],
		[11, -4, 3],
		[12, -5, 4],
		[13, -5, 4],
		[14, -6, 5],
		[15, -6, 5],
		[16, -6, 5],
		[17, -6, 5],
		[18, -5, 4],
		[19, -5, 4],
		[20, -5, 4],
		[21, -4, 3],
		[22, -4, 3],
		[23, -3, 2],
		[24, -2, 1],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -3) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Hair framing the brow.
	for (const [dx, y] of [
		[-3, 10],
		[-4, 11],
		[2, 10],
		[3, 11],
	]) {
		set(scene, FACE_X + dx, y, dx < 0 ? HAIR.lit : HAIR.dark);
	}
	// The gold laurel wreath: leaves along a band round her head, pointing back from the brow.
	for (let dx = -8; dx <= 8; dx++) {
		const y = 8 + Math.round((Math.abs(dx) / 8) ** 2 * 2);
		set(scene, FACE_X + dx, y, dx < 0 ? C.gold : C.amber);
	}
	for (const dx of [-8, -6, -4, -2, 2, 4, 6, 8]) {
		const y = 8 + Math.round((Math.abs(dx) / 8) ** 2 * 2);
		const out = dx < 0 ? -1 : 1;
		set(scene, FACE_X + dx + out, y - 1, dx < 0 ? C.lampGlow : C.gold);
		set(scene, FACE_X + dx - out, y + 1, dx < 0 ? C.gold : C.brass);
	}
	// Gold drops in her ears.
	set(scene, FACE_X - 7, 18, C.gold);
	set(scene, FACE_X - 7, 19, C.amber);
	set(scene, FACE_X + 6, 18, C.amber);
	// Brows, and eyes looking out at the crowd.
	rect(scene, FACE_X - 4, 13, 3, 1, C.wood);
	rect(scene, FACE_X + 1, 13, 3, 1, C.wood);
	set(scene, FACE_X - 4, 15, EYE.lit);
	set(scene, FACE_X - 3, 15, C.ink);
	set(scene, FACE_X + 1, 15, C.ink);
	set(scene, FACE_X + 2, 15, EYE.shade);
	set(scene, FACE_X - 2, 14, C.wood);
	set(scene, FACE_X + 3, 14, C.wood);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X - 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// Red lips, closed in a calm smile.
	set(scene, FACE_X - 2, 21, C.brickRedShade);
	rect(scene, FACE_X - 1, 21, 2, 1, C.brickRed);
	set(scene, FACE_X + 1, 21, C.brickRedShade);
	set(scene, FACE_X - 1, 22, C.brickRedLight);
	// The lit cheek.
	set(scene, FACE_X - 4, 17, SKIN.glint);
}

/**
 * Her left arm raised to the crowd, the palm open, a gold bracelet at the wrist.
 * @param {Canvas} scene
 */
function drawRaisedArm(scene) {
	// The upper arm out from the shoulder in the tunic's short sleeve, then the bare forearm rising.
	for (let y = 29; y <= 34; y++) {
		for (let x = 42; x <= 50; x++) {
			if (x - 42 > (34 - y) * 2 + 3) {
				continue;
			}
			set(scene, x, y, y === 29 ? TUNIC.lit : TUNIC.base);
		}
	}
	for (let y = 20; y <= 31; y++) {
		const x0 = 47 + Math.round((31 - y) * 0.1);
		for (let x = x0; x <= x0 + 3; x++) {
			set(
				scene,
				x,
				y,
				[SKIN.lit, SKIN.base, SKIN.shade, SKIN.dark][x - x0]
			);
		}
	}
	rect(scene, 48, 21, 4, 1, C.gold);
	rect(scene, 48, 22, 4, 1, C.amber);
	// The open hand.
	paint(
		scene,
		45,
		10,
		[
			'..L.S.s.',
			'..L.S.s.',
			'..LLSSSs',
			'L.LLSSSs',
			'LLLLSSSs',
			'.LLLSSs.',
			'..LLSSs.',
			'...LSs..',
			'...LSs..',
			'...LSs..',
		],
		{ L: SKIN.lit, S: SKIN.base, s: SKIN.shade }
	);
}

/**
 * The ivory sceptre in her right hand, banded and crowned with a gold orb.
 * @param {Canvas} scene
 */
function drawSceptre(scene) {
	for (let y = 26; y < RAIL; y++) {
		set(scene, SCEPTRE, y, C.creamLight);
		set(scene, SCEPTRE + 1, y, C.creamShade);
		if (y % 7 === 0) {
			set(scene, SCEPTRE, y, C.gold);
			set(scene, SCEPTRE + 1, y, C.amber);
		}
	}
	paint(
		scene,
		SCEPTRE - 2,
		20,
		['.gg..', 'gWgg.', 'gggaa', '.gaa.', '..a..', '.aaa.'],
		{
			g: C.gold,
			W: C.white,
			a: C.amber,
		}
	);
	// Her hand closed round it.
	paint(scene, SCEPTRE - 3, 41, ['.LLS..', 'LLLSSs', 'LLSSSs', '.LSSs.'], {
		L: SKIN.lit,
		S: SKIN.base,
		s: SKIN.shade,
	});
}

/**
 * The marble parapet of her terrace across the bottom: a lit coping, and a face carved with sunk
 * panels and a gold band.
 * @param {Canvas} scene
 */
function drawParapet(scene) {
	for (let y = RAIL; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = C.cream;
			if (y === RAIL) {
				colour = C.white;
			} else if (y === RAIL + 1) {
				colour = C.creamShade;
			} else if (y === RAIL + 2) {
				colour = x % 2 ? C.gold : C.amber;
			} else if (y >= RAIL + 4 && y <= 61 && x % 12 !== 0) {
				// Sunk panels, shaded along their top and left edges.
				const top = y === RAIL + 4;
				const left = x % 12 === 1;
				colour = top || left ? C.creamShade : C.creamLight;
				if (x % 12 === 11) {
					colour = C.white;
				}
			}
			set(scene, x, y, colour);
		}
	}
}
