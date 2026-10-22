// Advisors: a grey-bearded counsellor in dark robes by candlelight at night, holding a fan of cards close, an empty throne in the shadows behind.
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
import { glow } from '../../effects.js';
import { drawInterior } from '../../parts/interior.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column. */
const FACE_X = 25;

/** The candle flame in its wall sconce, on his right. */
const FLAME = { x: 6, y: 21 };

/** The point the fanned cards spread from, where his hands hold them. */
const FAN = { x: 38, y: 51 };

/** Skin: warm on the candle's side, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.45),
	lit: mix(C.skin, C.amber, 0.2),
	base: C.skinShade,
	shade: mix(C.skinShade, C.roof, 0.35),
	dark: mix(C.skinShade, C.night, 0.55),
};

/** Grey hair and beard: lit by the candle, plain grey, and grey in shadow. */
const BEARD = {
	lit: mix(C.creamLight, C.gold, 0.15),
	base: C.stoneLight,
	shade: C.stone,
	dark: C.stoneShade,
};

/** The dark blue-violet robe: lit by the candle, plain, in shadow, and deepest in the folds. */
const ROBE = {
	lit: mix(C.roofLight, C.amber, 0.3),
	base: C.roof,
	shade: C.roofShade,
	dark: mix(C.roofShade, C.night, 0.5),
};

/** The sable fur collar: lit by the candle, plain, shaded and dark. */
const FUR = {
	lit: mix(C.timberLight, C.amber, 0.25),
	base: C.timber,
	shade: C.timberShade,
	dark: C.wood,
};

/** The mouth's line, under the moustache. */
const LIPS = mix(C.brickRedShade, C.night, 0.3);

/** The black velvet cap. */
const CAP = { lit: mix(C.roof, C.amber, 0.2), base: C.ink };

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.cream, shade: mix(C.cream, C.skinShade, 0.5) };

/** The cards' backs: a cream border round a deep red field with a gold pip. */
const CARD = {
	edge: C.creamLight,
	edgeShade: C.creamShade,
	field: C.brickRedShade,
	fieldLit: C.brickRed,
	pip: C.gold,
};

/** Colours the candle's glow leaves alone: the face, beard, hands, gold and the cards. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(BEARD),
	...Object.values(EYE),
	...Object.values(CARD),
	LIPS,
	C.ink,
	C.brass,
	C.lampGlow,
];

/**
 * Draws the Advisors portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48211);

	drawInterior(layer, { floor: 56, random, wall: 'panel' });
	darkenRoom(layer);
	drawThrone(layer);
	drawSconce(layer);

	// Two layers, each outlined, so his sleeves and the cards stand clear of the robe.
	const figure = createCanvas(64, 64);
	drawRobe(figure);
	drawHead(figure);
	outline(figure, C.ink);
	drawSleeves(scene);
	drawCards(scene);
	drawHands(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, layer);

	glow(scene, {
		x: FLAME.x,
		y: FLAME.y,
		radius: 30,
		colour: C.amber,
		strength: 0.4,
		steps: 5,
		skip: FIGURE,
	});
	drawFlame(scene);
	return scene;
}

/**
 * Dims the panelled room to night.
 * @param {Canvas} layer
 */
function darkenRoom(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.night, 0.78);
		}
	}
}

/**
 * The empty throne in the shadows on his left: a tall arched back of dull red velvet in a dim gold
 * frame, a crown carved on its crest, the arm and the seat's edge, all on a low dais.
 * @param {Canvas} layer
 */
function drawThrone(layer) {
	const frame = mix(C.brass, C.night, 0.55);
	const frameLit = mix(C.gold, C.night, 0.45);
	const velvet = mix(C.brickRedShade, C.night, 0.45);
	const velvetLit = mix(C.brickRed, C.night, 0.5);
	const left = 44;
	const right = 62;
	const cx = (left + right) / 2;
	for (let y = 7; y < 56; y++) {
		for (let x = left; x <= right; x++) {
			// An arched top: the corners above the arch stay wall.
			const arch =
				((x - cx) / ((right - left) / 2 + 0.5)) ** 2 +
				((y - 16) / 9) ** 2;
			if (y < 16 && arch > 1) {
				continue;
			}
			const rim =
				x <= left + 1 || x >= right - 1 || (y < 16 && arch > 0.62);
			let colour = velvet;
			if (rim) {
				colour = x < cx ? frameLit : frame;
			} else if (x === left + 2 || y === 17) {
				colour = velvetLit;
			}
			set(layer, x, y, colour);
		}
	}
	// Buttoned tufts down the velvet.
	for (let y = 21; y < 44; y += 6) {
		for (let x = left + 5; x < right - 2; x += 5) {
			set(layer, x, y, frame);
		}
	}
	// The crown on the crest.
	paint(layer, cx - 3, 2, ['g.g.g', 'ggggg', 'fffff'], {
		g: frameLit,
		f: frame,
	});
	// The arm and the seat's front edge.
	rect(layer, 40, 44, 6, 2, frameLit);
	rect(layer, 41, 46, 2, 10, frame);
	rect(layer, 43, 47, 20, 2, velvetLit);
	rect(layer, 43, 49, 20, 7, velvet);
	// The dais: two shallow steps.
	rect(layer, 34, 56, 30, 1, mix(C.stoneLight, C.night, 0.6));
	rect(layer, 34, 57, 30, 3, mix(C.stone, C.night, 0.65));
	rect(layer, 30, 60, 34, 1, mix(C.stoneLight, C.night, 0.62));
	rect(layer, 30, 61, 34, 3, mix(C.stoneShade, C.night, 0.6));
}

/**
 * A brass wall sconce on his right holding a tall candle, its flame painted last.
 * @param {Canvas} layer
 */
function drawSconce(layer) {
	rect(layer, FLAME.x - 1, FLAME.y + 2, 3, 8, C.creamLight);
	rect(layer, FLAME.x + 1, FLAME.y + 2, 1, 8, C.cream);
	rect(layer, FLAME.x - 3, FLAME.y + 10, 7, 1, C.gold);
	rect(layer, FLAME.x - 2, FLAME.y + 11, 5, 1, C.brass);
	rect(layer, FLAME.x, FLAME.y + 12, 1, 4, C.lampFrame);
	rect(layer, FLAME.x - 1, FLAME.y + 16, 3, 2, C.brass);
}

/**
 * The robe over his shoulders and chest: dark blue-violet, a sable collar and a gold chain of office,
 * lit warm on the candle's side.
 * @param {Canvas} scene
 */
function drawRobe(scene) {
	for (let y = 29; y < 64; y++) {
		const half = Math.min(24, 9 + Math.round((y - 29) * 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = ROBE.base;
			if (u < -0.84) {
				colour = ROBE.lit;
			} else if (u > 0.55) {
				colour = ROBE.dark;
			} else if (u > 0.1) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A fold falling from each shoulder.
	for (let y = 38; y < 64; y++) {
		set(scene, FACE_X - 12 + Math.round((y - 38) * 0.2), y, ROBE.shade);
		set(scene, FACE_X + 12 + Math.round((y - 38) * 0.25), y, ROBE.dark);
	}
	// The sable collar lying across the shoulders.
	for (let y = 27; y <= 36; y++) {
		for (let x = FACE_X - 17; x <= FACE_X + 17; x++) {
			const dx = x - FACE_X;
			if ((dx / 17) ** 2 + ((y - 37) / 9) ** 2 > 1 || Math.abs(dx) < 5) {
				continue;
			}
			let colour = FUR.base;
			if (dx < -11) {
				colour = FUR.lit;
			} else if (dx > 6) {
				colour = (x + y) % 3 === 0 ? FUR.dark : FUR.shade;
			} else if ((x + y * 2) % 5 === 0) {
				colour = FUR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The chain of office: gold links swinging across his chest below the collar.
	for (let i = 0; i <= 14; i++) {
		const t = i / 14;
		const x = Math.round(FACE_X - 14 + 28 * t);
		const y = Math.round(37 + 5 * Math.sin(Math.PI * t));
		set(scene, x, y, i % 2 ? C.brass : C.gold);
	}
}

/**
 * His head: a black velvet cap, grey hair, bushy brows and a long grey beard, his face turned to the
 * viewer and lit warm by the candle on his right, his eyes slid sideways.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// Grey hair at the sides, under the cap.
	for (let y = 8; y <= 20; y++) {
		rect(scene, FACE_X - 8, y, 2, 1, y < 15 ? BEARD.lit : BEARD.base);
		rect(scene, FACE_X + 7, y, 2, 1, y < 12 ? BEARD.shade : BEARD.dark);
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[7, -4, 4],
		[8, -5, 5],
		[9, -6, 6],
		[10, -6, 6],
		[11, -6, 6],
		[12, -6, 6],
		[13, -6, 6],
		[14, -6, 6],
		[15, -6, 6],
		[16, -6, 6],
		[17, -6, 6],
		[18, -6, 6],
		[19, -5, 5],
		[20, -5, 5],
		[21, -4, 4],
		[22, -3, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from && dx <= -5) {
				colour = SKIN.glint;
			} else if (dx <= -2) {
				colour = SKIN.lit;
			} else if (dx === to) {
				colour = SKIN.dark;
			} else if (dx >= 3) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The cap, close over the crown, catching the candle on its near edge.
	for (let y = 0; y <= 8; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 8; x++) {
			const d = ((x - FACE_X) / 7.6) ** 2 + ((y - 8.5) / 7.8) ** 2;
			if (d > 1) {
				continue;
			}
			const rim =
				((x - 1 - FACE_X) / 7.6) ** 2 + ((y - 8.5) / 7.8) ** 2 > 1;
			set(scene, x, y, rim && x < FACE_X ? CAP.lit : CAP.base);
		}
	}
	// Ears: the near one lit, the far one in shadow.
	rect(scene, FACE_X - 7, 13, 1, 4, SKIN.lit);
	rect(scene, FACE_X + 7, 13, 1, 4, SKIN.shade);
	// Furrows on the brow.
	rect(scene, FACE_X - 4, 9, 3, 1, SKIN.base);
	rect(scene, FACE_X + 1, 10, 3, 1, SKIN.dark);
	// Bushy grey brows, the near one lit, raised at the outer ends.
	rect(scene, FACE_X - 4, 12, 3, 1, BEARD.lit);
	set(scene, FACE_X - 5, 11, BEARD.lit);
	rect(scene, FACE_X + 1, 12, 3, 1, BEARD.shade);
	set(scene, FACE_X + 4, 11, BEARD.shade);
	// Eyes slid to his left, towards the throne: whites inside, pupils out.
	set(scene, FACE_X - 3, 14, EYE.lit);
	set(scene, FACE_X - 2, 14, C.ink);
	set(scene, FACE_X + 2, 14, EYE.shade);
	set(scene, FACE_X + 3, 14, C.ink);
	// Heavy lids over the eyes and bags under them.
	rect(scene, FACE_X - 3, 13, 2, 1, SKIN.base);
	rect(scene, FACE_X + 2, 13, 2, 1, SKIN.dark);
	rect(scene, FACE_X - 3, 15, 2, 1, SKIN.base);
	rect(scene, FACE_X + 2, 15, 2, 1, SKIN.dark);
	// The long nose: lit down its near side, shaded down the far, a lit tip.
	rect(scene, FACE_X - 1, 14, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 1, 14, 1, 4, SKIN.dark);
	set(scene, FACE_X - 1, 17, SKIN.glint);
	set(scene, FACE_X, 18, SKIN.dark);
	set(scene, FACE_X + 1, 18, SKIN.dark);
	// The beard, from the jaw down in a long point onto his chest.
	for (let y = 19; y <= 43; y++) {
		const half =
			y < 25
				? y < 20
					? 5
					: 6
				: Math.max(1, Math.round(6 - (y - 25) * 0.29));
		for (let dx = -half; dx <= half; dx++) {
			let colour = BEARD.base;
			if (dx <= -half + 1) {
				colour = BEARD.lit;
			} else if (dx >= half - 1 && dx > 0) {
				colour = BEARD.dark;
			} else if (dx > 1) {
				colour = BEARD.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// Strands down the beard.
	for (let y = 25; y <= 40; y++) {
		if (y % 3 !== 0) {
			set(scene, FACE_X + (y % 2 ? 1 : -2), y, BEARD.shade);
		}
	}
	// The moustache drooping round the mouth, and the mouth's dark line under it.
	paint(scene, FACE_X - 4, 19, ['.LLLBSSs.', 'LL.....ss', 'L.......s'], {
		L: BEARD.lit,
		B: BEARD.base,
		S: BEARD.shade,
		s: BEARD.dark,
	});
	rect(scene, FACE_X - 2, 20, 5, 1, BEARD.base);
	rect(scene, FACE_X - 1, 21, 3, 1, LIPS);
}

/**
 * His sleeves: the near forearm coming across his body to the fan, the far one rising to it in shadow,
 * each wide sleeve ending in a gold cuff.
 * @param {Canvas} scene
 */
function drawSleeves(scene) {
	// The near forearm, from the elbow at the bottom left up to the wrist.
	for (let x = 2; x <= 29; x++) {
		const t = (x - 2) / 27;
		const mid = Math.round(61 - 10 * t);
		const half = Math.round(5 - 2 * t);
		for (let y = mid - half; y <= mid + half; y++) {
			let colour = ROBE.base;
			if (y === mid - half) {
				colour = ROBE.lit;
			} else if (y >= mid + half - 1) {
				colour = ROBE.dark;
			} else if (y > mid) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Its gold cuff.
	for (let y = 49; y <= 55; y++) {
		set(scene, 26, y, C.gold);
		set(scene, 27, y, y < 52 ? C.gold : C.brass);
	}
	// The far forearm, from the bottom right up to the wrist under the fan.
	for (let y = 49; y < 64; y++) {
		const t = (y - 49) / 14;
		const mid = Math.round(44 + 9 * t);
		const half = Math.round(3 + 2 * t);
		for (let x = mid - half; x <= mid + half; x++) {
			set(scene, x, y, x < mid - half + 2 ? ROBE.shade : ROBE.dark);
		}
	}
	rect(scene, 41, 49, 7, 1, C.brass);
	rect(scene, 41, 50, 7, 1, C.lampFrame);
}

/**
 * Five cards fanned from his hands, their red backs to the viewer.
 * @param {Canvas} scene
 */
function drawCards(scene) {
	const length = 13;
	const half = 3;
	for (const degrees of [-42, -21, 0, 21, 42]) {
		const a = (degrees * Math.PI) / 180;
		// Each card's axis runs up from the fan's pivot.
		const ux = Math.sin(a);
		const uy = -Math.cos(a);
		for (let y = FAN.y - length - 2; y <= FAN.y + 2; y++) {
			for (let x = FAN.x - length; x <= FAN.x + length; x++) {
				const px = x - FAN.x;
				const py = y - FAN.y;
				const along = px * ux + py * uy;
				const across = px * -uy + py * ux;
				if (along < 1 || along > length || Math.abs(across) > half) {
					continue;
				}
				const edge = along > length - 1 || Math.abs(across) > half - 1;
				let colour = degrees < 0 ? CARD.fieldLit : CARD.field;
				if (edge) {
					colour = across < 0 ? CARD.edge : CARD.edgeShade;
				} else if (Math.abs(along - 8) < 1 && Math.abs(across) < 1) {
					colour = CARD.pip;
				}
				set(scene, x, y, colour);
			}
		}
	}
}

/**
 * His two hands at the foot of the fan: the near one gripping it from below, the far one's
 * fingers curled over its edge.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	paint(
		scene,
		FAN.x - 9,
		FAN.y - 4,
		[
			'...LLs....',
			'..LLLSs...',
			'.WLLLSSs..',
			'WWLLSSSSs.',
			'.LLLSSSSs.',
			'..LSSSss..',
			'...sss....',
		],
		{ W: SKIN.glint, L: SKIN.lit, S: SKIN.base, s: SKIN.shade }
	);
	paint(
		scene,
		FAN.x + 3,
		FAN.y - 5,
		['.Ss..', 'SSss.', 'Sssd.', '.ssdd', '..dd.'],
		{
			S: SKIN.base,
			s: SKIN.shade,
			d: SKIN.dark,
		}
	);
}

/**
 * The candle flame, painted after the glow so it keeps its colours.
 * @param {Canvas} scene
 */
function drawFlame(scene) {
	paint(
		scene,
		FLAME.x - 1,
		FLAME.y - 3,
		['.w.', '.g.', 'gwg', 'gWg', '.a.'],
		{
			w: C.lampGlow,
			W: C.white,
			g: C.gold,
			a: C.amber,
		}
	);
}
