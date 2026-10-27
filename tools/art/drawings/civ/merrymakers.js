// Merrymakers: a ruddy, laughing reveller in a feathered hat raising an overflowing tankard under strings of lanterns at a dusk festival, a ribboned maypole behind him.
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
import { drawCrowd } from '../../parts/crowd.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The green where the festival is held, and the maypole's column and top. */
const GREEN = 46;
const MAYPOLE = { x: 56, top: 7 };

/** The raised tankard's body: its left column and top row. */
const TANKARD = { x: 2, y: 9 };

/** The festival table's top row. */
const TABLE = 56;

/** The paper lanterns: each one's centre and colour. */
const LANTERNS = [
	{ x: 19, y: 6, colour: C.gold },
	{ x: 51, y: 10, colour: C.brickRedLight },
	{ x: 61, y: 5, colour: C.amber },
];

/** The face's centre column. */
const FACE_X = 37;

/** Ruddy skin: lit warm by the lanterns on his right, plain, shaded, and flushed at the cheeks and nose. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.45),
	lit: mix(C.skin, C.amber, 0.2),
	base: C.skin,
	shade: mix(C.skinShade, C.duskSky3, 0.2),
	dark: mix(C.skinShade, C.night, 0.35),
	flush: mix(C.skin, C.brickRedLight, 0.5),
};

/** His auburn beard, lit by the lanterns. */
const BEARD = {
	lit: mix(C.timberLight, C.amber, 0.45),
	base: mix(C.timberLight, C.brickRedShade, 0.35),
	dark: mix(C.timber, C.brickRedShade, 0.4),
};

/** The green felt hat. */
const HAT = {
	lit: mix(C.forestFloorLight, C.amber, 0.2),
	base: C.forestFloor,
	shade: mix(C.forestFloorShade, C.night, 0.25),
};

/** The linen shirt. */
const SHIRT = {
	lit: mix(C.creamLight, C.lampGlow, 0.3),
	base: C.cream,
	shade: mix(C.creamShade, C.duskSky3, 0.4),
};

/** The ochre waistcoat over it. */
const VEST = {
	lit: mix(C.amber, C.gold, 0.3),
	base: mix(C.amber, C.timber, 0.45),
	shade: mix(C.timber, C.duskSky2, 0.35),
};

/** The pewter tankard. */
const PEWTER = {
	glint: C.white,
	lit: mix(C.stoneLight, C.lampGlow, 0.3),
	base: C.stone,
	shade: mix(C.stoneShade, C.duskSky2, 0.3),
};

/** Ale and its foam. */
const ALE = {
	foam: C.creamLight,
	froth: C.cream,
	ale: C.amber,
	dark: C.lampFrame,
};

/** Eye whites. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinShade, 0.45) };

/** The figure and the tankard are lit by hand, so the lanterns' glows leave them as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(BEARD),
	...Object.values(HAT),
	...Object.values(SHIRT),
	...Object.values(VEST),
	...Object.values(PEWTER),
	...Object.values(ALE),
	...Object.values(EYE),
	C.ink,
	C.brass,
	C.gold,
	C.brickRed,
	C.brickRedShade,
];

/**
 * Draws the Merrymakers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8255);

	drawSky(layer, { time: 'dusk', horizon: GREEN, random });
	darkenSky(layer);
	drawHills(layer);

	// The maypole, its ribbons, the dancers and the tents are outlined on their own.
	const fair = createCanvas(64, 64);
	drawTents(fair);
	drawMaypole(fair);
	drawCrowd(fair, { x: 47, y: GREEN + 5, count: 5, random });
	outline(fair, C.ink);
	underlay(fair, layer);
	drawStrings(fair);

	// He is outlined on his own, so his raised arm and the tankard stand clear of him.
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	drawHat(figure);
	outline(figure, C.ink);
	const arm = createCanvas(64, 64);
	drawArm(arm);
	drawTankard(arm);
	outline(arm, C.ink);
	underlay(arm, figure);

	drawTable(scene);
	outline(scene, C.ink);
	underlay(scene, arm);
	underlay(scene, fair);

	for (const { x, y, colour } of LANTERNS) {
		glow(scene, {
			x,
			y,
			radius: 14,
			colour: mix(colour, C.lampGlow, 0.5),
			strength: 0.35,
			steps: 3,
			skip: FIGURE,
		});
	}
	drawLanterns(scene);
	drawSplash(scene, random);
	return scene;
}

/**
 * Deepens the sky towards nightfall, so the lanterns stand out.
 * @param {Canvas} layer
 */
function darkenSky(layer) {
	for (let i = 0; i < layer.p.length; i++) {
		const colour = layer.p[i];
		if (colour) {
			layer.p[i] = mix(colour, C.duskSky1, 0.3);
		}
	}
}

/**
 * Low hills along the horizon and the darkening green in front of them.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const top = Math.round(GREEN - 3 - 2 * Math.sin(x * 0.17 + 0.5));
		for (let y = top; y < 64; y++) {
			let colour = mix(C.roof, C.pineShade, 0.4);
			if (y >= GREEN) {
				colour =
					y === GREEN
						? mix(C.grassShade, C.duskSky4, 0.3)
						: mix(C.forestFloorShade, C.roofShade, 0.4);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Two striped festival tents on the green, at the far left and behind the dancers.
 * @param {Canvas} fair
 */
function drawTents(fair) {
	for (const [cx, h] of [
		[3, 12],
		[60, 10],
	]) {
		for (let y = GREEN + 2 - h; y <= GREEN + 2; y++) {
			const half = Math.round(((y - (GREEN + 2 - h)) / h) * 7);
			for (let x = cx - half; x <= cx + half; x++) {
				const stripe = Math.floor((x - cx + 20) / 2) % 2 === 0;
				let colour = stripe
					? mix(C.brickRed, C.duskSky3, 0.3)
					: mix(C.cream, C.duskSky4, 0.35);
				if (x > cx + half - 2) {
					colour = mix(colour, C.night, 0.3);
				}
				set(fair, x, y, colour);
			}
		}
		set(fair, cx, GREEN + 1 - h, C.gold);
	}
}

/**
 * The maypole: a striped pole crowned with a garland, its coloured ribbons streaming down to the
 * dancers.
 * @param {Canvas} fair
 */
function drawMaypole(fair) {
	const { x, top } = MAYPOLE;
	for (let y = top; y <= GREEN + 2; y++) {
		const stripe = (y + 20) % 5 < 2;
		set(fair, x, y, stripe ? C.brickRed : C.creamLight);
		set(fair, x + 1, y, stripe ? C.brickRedShade : C.creamShade);
	}
	// The ribbons, from the crown out to the dancers' hands.
	/** @type {[number, Colour][]} */
	const ribbons = [
		[47, C.gold],
		[50, C.teal],
		[53, C.brickRedLight],
		[60, C.arcaneLight],
		[63, C.gold],
	];
	for (const [ex, colour] of ribbons) {
		line(fair, x, top + 2, ex, GREEN - 1, colour);
	}
	// The garland crown: green leaves dotted with flowers.
	paint(fair, x - 3, top - 2, ['.gfgg.', 'gGgGfg', 'fg..gG', '.gGgf.'], {
		g: C.pine,
		G: C.pineLight,
		f: C.brickRedLight,
	});
}

/**
 * The strings the lanterns hang from, sagging from the maypole's top out to the edges.
 * @param {Canvas} fair
 */
function drawStrings(fair) {
	const cord = mix(C.wood, C.duskSky2, 0.3);
	for (let x = 0; x < 64; x++) {
		const t =
			x < MAYPOLE.x ? x / MAYPOLE.x : (x - MAYPOLE.x) / (64 - MAYPOLE.x);
		const sag = x < MAYPOLE.x ? 8 : 3;
		const from = x < MAYPOLE.x ? 1 : MAYPOLE.top - 1;
		const to = x < MAYPOLE.x ? MAYPOLE.top - 1 : 3;
		const y = Math.round(from + (to - from) * t + sag * 4 * t * (1 - t));
		set(fair, x, y, cord);
	}
}

/**
 * His body: a stout chest in an ochre waistcoat buttoned in brass over a linen shirt, open at the
 * neck, lit warm on the lanterns' side.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The thick neck under the beard.
	for (let y = 27; y <= 29; y++) {
		for (let x = FACE_X - 3; x <= FACE_X + 3; x++) {
			set(scene, x, y, x < FACE_X ? SKIN.base : SKIN.shade);
		}
	}
	for (let y = 29; y < 64; y++) {
		const half = Math.min(19, 9 + Math.round((y - 29) * 2.2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = SHIRT.base;
			if (u < -0.7) {
				colour = SHIRT.lit;
			} else if (u > 0.5) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds down the far sleeve.
	for (let y = 36; y < 64; y++) {
		set(
			scene,
			FACE_X + 15 + Math.round((y - 36) * 0.1),
			y,
			mix(SHIRT.shade, C.night, 0.25)
		);
		if (y > 42) {
			set(
				scene,
				FACE_X + 19 + Math.round((y - 42) * 0.05),
				y,
				mix(SHIRT.shade, C.night, 0.15)
			);
		}
	}
	// The waistcoat: a V at the neck, then buttoned down over his belly, which pushes it out.
	for (let y = 31; y < 64; y++) {
		const belly =
			y > 44 ? Math.round(2 * Math.sin(((y - 44) / 19) * Math.PI)) : 0;
		const half = Math.min(13, 8 + Math.round((y - 31) * 0.6)) + belly;
		const neck = Math.max(0, 4 - Math.floor((y - 31) / 2));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			if (Math.abs(x - FACE_X) < neck) {
				continue;
			}
			const u = (x - FACE_X) / half;
			let colour = VEST.base;
			if (u < -0.55) {
				colour = VEST.lit;
			} else if (u > 0.45) {
				colour = VEST.shade;
			}
			set(scene, x, y, colour);
		}
		// The lapels' edges.
		if (neck > 0) {
			set(scene, FACE_X - neck, y, VEST.lit);
			set(scene, FACE_X + neck, y, VEST.shade);
		}
	}
	// The buttons and the front's seam.
	for (let y = 39; y < 64; y++) {
		set(scene, FACE_X + 1, y, VEST.shade);
	}
	for (const y of [40, 45, 50]) {
		set(scene, FACE_X, y, C.gold);
		set(scene, FACE_X + 1, y, C.brass);
	}
	// Two pocket flaps, and a watch chain looping from one.
	rect(scene, FACE_X - 9, 46, 5, 1, mix(VEST.base, C.timberShade, 0.5));
	rect(scene, FACE_X + 4, 46, 5, 1, mix(VEST.shade, C.night, 0.3));
	line(scene, FACE_X - 5, 47, FACE_X - 2, 49, C.gold);
	line(scene, FACE_X - 2, 49, FACE_X, 47, C.gold);
	// Creases where the waistcoat pulls across his belly.
	for (const [x, y] of [
		[FACE_X - 4, 52],
		[FACE_X - 3, 53],
		[FACE_X + 4, 52],
		[FACE_X + 5, 51],
		[FACE_X + 6, 55],
		[FACE_X + 7, 54],
	]) {
		set(
			scene,
			x,
			y,
			x < FACE_X ? VEST.base : mix(VEST.shade, C.night, 0.3)
		);
	}
}

/**
 * His head: a round, flushed face split by a laugh, a full auburn beard, and eyes creased with mirth,
 * lit warm by the lanterns on his right.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -5, 5],
		[10, -6, 6],
		[11, -6, 6],
		[12, -7, 6],
		[13, -7, 6],
		[14, -7, 6],
		[15, -7, 6],
		[16, -7, 6],
		[17, -7, 6],
		[18, -6, 5],
		[19, -6, 5],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === from) {
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
	// Ears: the near one lit, the far one shaded.
	rect(scene, FACE_X - 8, 14, 1, 3, SKIN.lit);
	rect(scene, FACE_X + 7, 14, 1, 3, SKIN.shade);
	// The beard, from the sideburns round a broad jaw, full under the laughing mouth.
	/** @type {[number, number, number][]} */
	const beard = [
		[15, -7, -6],
		[16, -7, -5],
		[17, -7, -4],
		[18, -7, 6],
		[19, -7, 6],
		[20, -7, 6],
		[21, -7, 6],
		[22, -7, 6],
		[23, -6, 5],
		[24, -6, 5],
		[25, -5, 4],
		[26, -4, 3],
		[27, -2, 1],
	];
	for (const [y, from, to] of beard) {
		for (let dx = from; dx <= to; dx++) {
			let colour = BEARD.base;
			if (dx <= from + 1) {
				colour = BEARD.lit;
			} else if (dx >= to - 1 || y >= 26) {
				colour = BEARD.dark;
			} else if ((dx * 2 + y) % 5 === 0) {
				colour = BEARD.lit;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	for (const y of [15, 16, 17]) {
		set(scene, FACE_X + 6, y, BEARD.dark);
		set(scene, FACE_X + 5, y, y > 15 ? BEARD.dark : SKIN.shade);
	}
	// The cheeks, flushed.
	rect(scene, FACE_X - 5, 16, 2, 2, SKIN.flush);
	rect(scene, FACE_X + 2, 16, 2, 1, mix(SKIN.flush, SKIN.shade, 0.5));
	// The laughing mouth, open on a row of teeth, under a curled moustache.
	paint(
		scene,
		FACE_X - 5,
		18,
		['mmmm.mmmm..', 'm.kwwwwk.m.', '...kkrkk...', '....kkk....'],
		{ m: BEARD.base, k: C.ink, w: C.creamLight, r: C.brickRedShade }
	);
	set(scene, FACE_X - 5, 18, BEARD.lit);
	set(scene, FACE_X - 4, 18, BEARD.lit);
	// Arched brows, and eyes creased with laughter.
	paint(scene, FACE_X - 5, 11, ['.bbb..bbb.', 'b........b'], {
		b: BEARD.dark,
	});
	set(scene, FACE_X - 4, 13, EYE.lit);
	set(scene, FACE_X - 3, 13, C.ink);
	set(scene, FACE_X + 1, 13, C.ink);
	set(scene, FACE_X + 2, 13, EYE.shade);
	set(scene, FACE_X - 4, 14, SKIN.dark);
	set(scene, FACE_X - 3, 14, SKIN.base);
	set(scene, FACE_X + 2, 14, SKIN.dark);
	set(scene, FACE_X - 6, 13, SKIN.base);
	set(scene, FACE_X + 4, 13, SKIN.dark);
	// A round red nose.
	paint(scene, FACE_X - 1, 14, ['.s.', 'sfs', 'Ffs'], {
		s: SKIN.shade,
		f: SKIN.flush,
		F: mix(SKIN.flush, C.white, 0.4),
	});
}

/**
 * A green felt hat tipped back on his head, its band red, a feather standing up at the back.
 * @param {Canvas} scene
 */
function drawHat(scene) {
	// The feather.
	for (let i = 0; i < 9; i++) {
		set(
			scene,
			FACE_X + 6 + Math.round(i * 0.45),
			7 - i,
			i % 3 ? C.creamLight : C.cream
		);
		set(scene, FACE_X + 7 + Math.round(i * 0.45), 7 - i, C.creamShade);
	}
	set(scene, FACE_X + 10, 0, C.brickRedLight);
	// The crown, narrowing to a pinched top.
	for (let y = 1; y <= 7; y++) {
		const half = 4 + Math.round((y - 1) * 0.6);
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = HAT.base;
			if (u < -0.5) {
				colour = HAT.lit;
			} else if (u > 0.4) {
				colour = HAT.shade;
			}
			if (y === 1 && Math.abs(x - FACE_X) < 2) {
				colour = HAT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The band.
	for (let x = FACE_X - 8; x <= FACE_X + 8; x++) {
		set(scene, x, 6, x < FACE_X ? C.brickRed : C.brickRedShade);
	}
	set(scene, FACE_X - 5, 6, C.gold);
	// The brim, wide and curled up at the sides.
	for (let x = FACE_X - 11; x <= FACE_X + 11; x++) {
		const dx = Math.abs(x - FACE_X);
		const y = 8 - (dx > 8 ? dx - 8 : 0);
		set(scene, x, y, x < FACE_X ? HAT.lit : HAT.shade);
		if (dx <= 9) {
			set(scene, x, y + 1, HAT.shade);
		}
	}
}

/**
 * His right arm raised high: the shirt sleeve from the shoulder out to the elbow, the bare, hairy
 * forearm rising from the rolled cuff to the fist round the tankard's handle.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	// The sleeve, out and up from the shoulder to the elbow.
	for (let y = 26; y <= 37; y++) {
		const x0 = 11 + Math.round((y - 26) * 0.55);
		const x1 = Math.min(FACE_X - 13, 19 + Math.round((y - 26) * 0.7));
		for (let x = x0; x <= x1; x++) {
			let colour = SHIRT.base;
			if (x <= x0 + 1) {
				colour = SHIRT.lit;
			} else if (x >= x1 - 1) {
				colour = SHIRT.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The rolled cuff.
	rect(scene, 11, 25, 9, 2, SHIRT.lit);
	rect(scene, 11, 26, 9, 1, SHIRT.shade);
	// The forearm, rising from the cuff to the fist.
	for (let y = 17; y <= 24; y++) {
		for (let x = 12; x <= 17; x++) {
			let colour = [
				SKIN.glint,
				SKIN.lit,
				SKIN.lit,
				SKIN.base,
				SKIN.base,
				SKIN.shade,
			][x - 12];
			// A few dark hairs on the forearm.
			if ((x * 3 + y * 5) % 11 === 0 && x > 12 && x < 17) {
				colour = BEARD.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// The fist, closed round the handle.
	paint(
		scene,
		TANKARD.x + 9,
		TANKARD.y + 1,
		['.LLSs..', 'WLLSSs.', 'WLLLSSs', 'WLLSSss', '.WLLSs.', '..LSSs.'],
		{
			W: SKIN.glint,
			L: SKIN.lit,
			S: SKIN.base,
			s: SKIN.shade,
		}
	);
}

/**
 * The tankard held up: a pewter body banded in brass, its lid thrown open, ale foaming over the brim.
 * @param {Canvas} scene
 */
function drawTankard(scene) {
	const { x, y } = TANKARD;
	for (let j = 0; j < 12; j++) {
		for (let i = 0; i < 9; i++) {
			let colour = PEWTER.base;
			if (i <= 1) {
				colour = PEWTER.lit;
			} else if (i >= 7) {
				colour = PEWTER.shade;
			}
			if (j === 2 || j === 9) {
				colour = i <= 1 ? C.gold : C.brass;
			}
			set(scene, x + i, y + j, colour);
		}
	}
	set(scene, x + 1, y + 4, PEWTER.glint);
	set(scene, x + 1, y + 5, PEWTER.glint);
	// The handle, behind his fist.
	rect(scene, x + 9, y + 1, 2, 1, PEWTER.base);
	rect(scene, x + 9, y + 8, 2, 1, PEWTER.shade);
	// The open lid, tipped back on its hinge.
	paint(scene, x + 6, y - 6, ['.pp', 'ppP', 'pPP', 'pP.', 'Pb.'], {
		p: PEWTER.lit,
		P: PEWTER.base,
		b: C.brass,
	});
	// The foam heaped over the brim and running down the side.
	paint(
		scene,
		x - 1,
		y - 4,
		[
			'...fF.....',
			'.fFFFFf...',
			'fFFFFFFFf.',
			'FFFFfFFFFf',
			'.F...Ff...',
			'.F.........',
			'.f........',
		],
		{ f: ALE.froth, F: ALE.foam }
	);
}

/**
 * The festival table along the bottom: a plank top with a round loaf, a wedge of cheese and a jug.
 * @param {Canvas} scene
 */
function drawTable(scene) {
	for (let y = TABLE; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = mix(C.timberShade, C.night, 0.3);
			if (y === TABLE) {
				colour = x < 32 ? C.timberLight : C.timber;
			} else if (y < TABLE + 3) {
				colour = (x * 5 + y) % 17 === 0 ? C.timberShade : C.timber;
			} else if (y === TABLE + 3) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	// A round loaf scored across the top.
	paint(
		scene,
		3,
		TABLE - 5,
		['..llll...', '.lLLlLl..', 'lLLLLlLll', 'lllllllll', '.ddddddd.'],
		{
			L: C.sandLight,
			l: C.sandShade,
			d: C.timber,
		}
	);
	// A wedge of cheese.
	paint(scene, 14, TABLE - 4, ['.....g', '...ggG', '.ggGGG', 'gGGoGG'], {
		g: C.gold,
		G: C.amber,
		o: C.lampFrame,
	});
	// A jug.
	paint(
		scene,
		56,
		TABLE - 7,
		['.ccc..', '.cCc..', 'cCCCcc', 'cCCCc.c', 'cCCCcc', '.ccc..'],
		{
			c: C.brickRedShade,
			C: C.brickRed,
		}
	);
}

/**
 * The paper lanterns, painted after the glows: round, ribbed, each with a bright heart.
 * @param {Canvas} scene
 */
function drawLanterns(scene) {
	for (const { x, y, colour } of LANTERNS) {
		paint(
			scene,
			x - 2,
			y - 3,
			['..k..', '.ccc.', 'cCWCc', 'cCWCc', '.ccc.', '..k..'],
			{
				k: C.ink,
				c: colour,
				C: mix(colour, C.lampGlow, 0.5),
				W: C.lampGlow,
			}
		);
	}
}

/**
 * Drops of ale flying from the tankard as he swings it up.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSplash(scene, random) {
	for (const [x, y] of [
		[2, 10],
		[0, 13],
		[12, 9],
		[14, 7],
	]) {
		set(scene, x, y, ALE.foam);
	}
	for (let i = 0; i < 3; i++) {
		const x = 1 + Math.floor(random() * 4);
		const y = 15 + Math.floor(random() * 8);
		if (get(scene, x, y) !== ALE.foam) {
			set(scene, x, y, mix(C.amber, C.gold, 0.5));
		}
	}
}
