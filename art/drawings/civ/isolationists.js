// Isolationists: a stern bearded sentinel in a kettle hat, with a spear, standing in the battlements of a great wall at dusk, its gate tower shut behind him and empty mountains beyond.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The setting sun, half behind the far ridge at the right. */
const SUN = { x: 59, y: 30 };

/** The parapet's first row, and the tops of the two merlons either side of him. */
const PARAPET = 53;
const MERLON = 46;

/** The spear's shaft column. */
const SPEAR = 54;

/** The far peaks: each summit's column and row. */
const PEAKS = [
	[5, 17],
	[19, 25],
	[45, 23],
	[61, 19],
];

/** The face's centre column. */
const FACE_X = 31;

/** Skin: lit orange by the low sun on his left, plain, and shaded violet away from it. */
const SKIN = {
	glint: mix(C.skinTan, C.duskSky6, 0.55),
	lit: mix(C.skinTan, C.duskSky6, 0.3),
	base: C.skinTan,
	shade: mix(C.skinTanShade, C.duskSky4, 0.15),
	dark: mix(C.skinTanShade, C.night, 0.4),
};

/** The dark beard, lit orange along the sun's side. */
const BEARD = {
	lit: mix(C.timber, C.duskSky6, 0.35),
	base: C.wood,
	dark: mix(C.wood, C.night, 0.45),
};

/** Steel for the hat, the armour and the spearhead. */
const STEEL = {
	glint: mix(C.snow, C.duskSky6, 0.35),
	lit: mix(C.stoneLight, C.duskSky6, 0.3),
	base: mix(C.stone, C.duskSky3, 0.2),
	shade: mix(C.stoneShade, C.duskSky2, 0.35),
	dark: mix(C.stoneShade, C.night, 0.5),
};

/** The grey wolf-fur mantle over his shoulders. */
const FUR = {
	lit: mix(C.snowShade, C.duskSky6, 0.35),
	base: mix(C.stoneLight, C.stone, 0.5),
	shade: mix(C.stoneShade, C.duskSky2, 0.3),
	dark: mix(C.stoneShade, C.night, 0.35),
};

/** The slate-blue cloak under it. */
const CLOAK = {
	lit: mix(C.nightSea1, C.duskSky5, 0.35),
	base: mix(C.nightSea3, C.roof, 0.3),
	shade: mix(C.nightSea3, C.night, 0.45),
};

/** Leather gloves. */
const GLOVE = {
	lit: mix(C.timberLight, C.duskSky6, 0.3),
	base: C.timberShade,
	dark: mix(C.timberShade, C.night, 0.4),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinTanShade, 0.3) };

/**
 * Draws the Isolationists portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8233);

	drawSky(layer, { time: 'dusk', horizon: 40, random });
	drawRanges(layer);
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 22,
		colour: C.gold,
		strength: 0.45,
		steps: 5,
	});
	drawSun(layer);

	// The far wall and its shut gate tower are outlined on their own, so they stand clear of the hills.
	const wall = createCanvas(64, 64);
	drawFarWall(wall);
	drawGateTower(wall);
	outline(wall, C.ink);
	underlay(wall, layer);

	// The sentinel is outlined on his own, so the merlons and the spear stand clear of him.
	const figure = createCanvas(64, 64);
	drawBody(figure);
	drawHead(figure);
	drawHelmet(figure);
	outline(figure, C.ink);

	drawParapet(scene);
	drawSpear(scene);
	drawHand(scene);
	outline(scene, C.ink);
	underlay(scene, figure);
	underlay(scene, wall);
	return scene;
}

/**
 * Two ranges of bare mountains under the dusk sky: the far one pale violet with snow catching the
 * sun, the near one dark, rolling along under the wall.
 * @param {Canvas} layer
 */
function drawRanges(layer) {
	/**
	 * The far range's skyline at a column: the lowest of the peaks' slopes.
	 * @param {number} x
	 * @returns {number}
	 */
	const skyline = (x) =>
		Math.min(34, ...PEAKS.map(([px, py]) => py + Math.abs(x - px) * 1.1));
	for (let x = 0; x < 64; x++) {
		const far = Math.round(skyline(x));
		const near = Math.round(42 - 3 * Math.sin(x * 0.13 + 2.2));
		// Slopes rising towards the sun to the right catch its light.
		const sunward = skyline(x + 1) < skyline(x) - 0.5;
		for (let y = far; y < 64; y++) {
			let colour = mix(C.duskSky3, C.roof, 0.45);
			if (y >= near) {
				colour =
					y === near
						? mix(C.roofLight, C.duskSky5, 0.3)
						: mix(
								C.roof,
								C.roofShade,
								Math.min(1, (y - near) / 16)
							);
			} else if (y - far < 4 && far < 30) {
				colour = sunward
					? mix(C.snow, C.duskSky6, 0.4)
					: mix(C.snowShade, C.duskSky3, 0.45);
			} else if (!sunward) {
				colour = mix(C.duskSky2, C.roof, 0.5);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The setting sun, its top showing over the far ridge.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - 4; y <= SUN.y + 4; y++) {
		for (let x = SUN.x - 4; x <= SUN.x + 4; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			const sky = get(layer, x, y);
			// Only the part above the ridge shows: the ridge is violet, the sky warm.
			if (d > 4.2 || !sky || y > SUN.y + 1) {
				continue;
			}
			set(layer, x, y, d < 2.6 ? C.lampGlow : C.gold);
		}
	}
}

/**
 * The great wall running away along the near ridge: from the gate tower off to the left, and out
 * from behind him to the right, crenellated and thinning as it recedes.
 * @param {Canvas} wall
 */
function drawFarWall(wall) {
	const face = mix(C.stone, C.duskSky3, 0.5);
	const top = mix(C.stoneLight, C.duskSky5, 0.4);
	const shade = mix(C.stoneShade, C.roof, 0.45);
	for (let x = 0; x < 64; x++) {
		if (x > 12 && x < 44) {
			continue;
		}
		// It climbs away from the tower to both sides.
		const base =
			x <= 12
				? 45 - Math.round((12 - x) * 0.3)
				: 45 - Math.round((x - 44) * 0.3);
		const h = 4;
		for (let y = base - h; y <= base; y++) {
			set(wall, x, y, y === base - h ? top : y === base ? shade : face);
		}
		if (x % 3 === 0) {
			set(wall, x, base - h - 1, top);
		}
	}
}

/**
 * The gate tower down the wall at the left, violet with distance, its arched wooden gates shut and
 * barred.
 * @param {Canvas} wall
 */
function drawGateTower(wall) {
	const face = mix(C.stone, C.duskSky2, 0.5);
	const lit = mix(C.stoneLight, C.duskSky6, 0.35);
	const shade = mix(C.stoneShade, C.roof, 0.5);
	for (let y = 26; y <= 45; y++) {
		for (let x = 1; x <= 12; x++) {
			let colour = face;
			if (x >= 11) {
				colour = lit;
			} else if (x <= 2) {
				colour = shade;
			}
			set(wall, x, y, colour);
		}
	}
	// Battlements on its top.
	for (let x = 1; x <= 12; x++) {
		set(wall, x, 26, lit);
		if (x % 3 !== 0) {
			set(wall, x, 25, lit);
		}
	}
	// A dark window.
	rect(wall, 6, 28, 2, 2, mix(C.ink, C.roof, 0.2));
	// The shut gate: two timber leaves under an arch, an iron band and a bar across them.
	paint(
		wall,
		3,
		33,
		[
			'.aaaaaa.',
			'aTTTtTTa',
			'aTTTtTTa',
			'aiiiiiia',
			'aTTTtTTa',
			'abbbbbba',
			'aTTTtTTa',
			'aiiiiiia',
			'aTTTtTTa',
			'aTTTtTTa',
			'aTTTtTTa',
			'aTTTtTTa',
		],
		{
			a: lit,
			T: mix(C.timber, C.duskSky4, 0.25),
			t: mix(C.timberShade, C.night, 0.3),
			i: mix(C.stoneShade, C.night, 0.4),
			b: mix(C.gold, C.duskSky6, 0.3),
		}
	);
}

/**
 * His shoulders and body: a grey fur mantle over a slate-blue cloak, a brass brooch, and lamellar armour on his
 * chest, lit orange along the sun's side.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	for (let y = 26; y < 64; y++) {
		const half = Math.min(19, 9 + Math.round((y - 26) * 2.6));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = CLOAK.base;
			if (u > 0.82) {
				colour = CLOAK.lit;
			} else if (u < -0.4) {
				colour = CLOAK.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Lamellar armour down the chest between the cloak's edges: rows of small steel plates laced
	// with red cord.
	for (let y = 32; y < 64; y++) {
		const half = Math.min(10, 6 + Math.floor((y - 32) / 3));
		const row = (y - 32) % 4;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const lit = x > FACE_X + 2;
			let colour;
			if (row === 0) {
				colour =
					x % 2 ? C.brickRedShade : mix(C.brickRed, C.duskSky5, 0.3);
			} else if (x % 3 === 0) {
				colour = STEEL.dark;
			} else if (row === 1) {
				colour = lit ? STEEL.glint : STEEL.lit;
			} else {
				colour = lit
					? STEEL.lit
					: x < FACE_X - 4
						? STEEL.shade
						: STEEL.base;
			}
			set(scene, x, y, colour);
		}
	}
	// The fur mantle round his shoulders, shaggy at its lower edge.
	for (let y = 24; y <= 34; y++) {
		const half = Math.min(20, 11 + Math.round((y - 24) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			const fringe = y >= 31 && (x * 7 + y * 3) % 5 < y - 30;
			if (fringe) {
				continue;
			}
			let colour = FUR.base;
			if (u > 0.55) {
				colour = FUR.lit;
			} else if (u < -0.35) {
				colour = FUR.shade;
			}
			if ((x * 3 + y * 5) % 7 === 0) {
				colour = u > 0.55 ? FUR.base : FUR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	// A brass brooch pinning the mantle.
	paint(scene, FACE_X + 5, 31, ['.g.', 'gWg', '.g.'], {
		g: C.brass,
		W: C.gold,
	});
}

/**
 * His head: a broad, stern face under the hat's brim, dark hair over his ears, and a thick dark
 * beard, lit orange by the sun on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// Dark hair under the hat's brim, down to his ears.
	for (let y = 10; y <= 18; y++) {
		for (let x = FACE_X - 8; x <= FACE_X + 9; x++) {
			set(scene, x, y, x > FACE_X + 6 ? BEARD.lit : BEARD.dark);
		}
	}
	// Ears: the near one lit by the sun, the far one in shadow.
	rect(scene, FACE_X - 7, 14, 1, 3, SKIN.shade);
	rect(scene, FACE_X + 8, 14, 1, 3, SKIN.lit);
	set(scene, FACE_X + 9, 15, SKIN.glint);
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[11, -5, 6],
		[12, -6, 7],
		[13, -6, 7],
		[14, -6, 7],
		[15, -6, 7],
		[16, -6, 7],
		[17, -6, 7],
		[18, -6, 7],
		[19, -5, 6],
		[20, -5, 6],
		[21, -5, 6],
		[22, -4, 5],
		[23, -4, 5],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (y === 11) {
				// The brim's shadow across the brow.
				colour = SKIN.dark;
			} else if (dx === to) {
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
	// The beard: from the sideburns round the jaw to a full spade under the chin.
	/** @type {[number, number, number][]} */
	const beard = [
		[17, -6, 7],
		[18, -6, 7],
		[19, -6, 7],
		[20, -6, 7],
		[21, -6, 7],
		[22, -5, 6],
		[23, -5, 6],
		[24, -5, 6],
		[25, -4, 5],
		[26, -3, 4],
		[27, -2, 3],
	];
	for (const [y, from, to] of beard) {
		for (let dx = from; dx <= to; dx++) {
			// The cheeks stay bare above the jaw.
			if (y < 21 && dx > from + 1 && dx < to - 1) {
				continue;
			}
			let colour = BEARD.base;
			if (dx >= to - 1 && y < 25) {
				colour = BEARD.lit;
			} else if (dx <= from + 1 || y >= 26) {
				colour = BEARD.dark;
			} else if ((dx * 3 + y) % 5 === 0) {
				colour = BEARD.dark;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// The moustache over a hard, straight mouth.
	rect(scene, FACE_X - 3, 20, 7, 1, BEARD.base);
	set(scene, FACE_X + 3, 20, BEARD.lit);
	set(scene, FACE_X - 3, 21, BEARD.base);
	set(scene, FACE_X + 3, 21, BEARD.base);
	rect(scene, FACE_X - 2, 21, 5, 1, mix(C.brickRedShade, C.wood, 0.5));
	// Heavy brows drawn down in a frown, and narrowed eyes.
	paint(scene, FACE_X - 5, 13, ['ww.....ww..', '.wwww.www..'], {
		w: C.wood,
	});
	set(scene, FACE_X + 4, 13, BEARD.lit);
	set(scene, FACE_X + 5, 13, BEARD.lit);
	set(scene, FACE_X - 3, 15, EYE.shade);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, C.ink);
	set(scene, FACE_X + 3, 15, EYE.lit);
	set(scene, FACE_X - 3, 16, SKIN.dark);
	set(scene, FACE_X + 3, 16, SKIN.base);
	// A scar across the lit cheek.
	set(scene, FACE_X + 5, 16, SKIN.shade);
	set(scene, FACE_X + 4, 17, SKIN.shade);
	// The nose: long and straight, a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 15, 1, 4, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X - 1, 19, SKIN.dark);
	set(scene, FACE_X, 19, SKIN.dark);
}

/**
 * A steel kettle hat: a round crown with a ridge, and a broad brim that throws his brow into shadow.
 * @param {Canvas} scene
 */
function drawHelmet(scene) {
	for (let y = 1; y <= 9; y++) {
		const half = Math.round(7.5 * Math.sqrt(1 - ((9.5 - y) / 9) ** 2));
		for (let x = FACE_X - half; x <= FACE_X + half + 1; x++) {
			const u = (x - FACE_X) / (half + 0.5);
			let colour = STEEL.base;
			if (u > 0.6) {
				colour = STEEL.lit;
			} else if (u > 0.25) {
				colour = y < 6 ? STEEL.glint : STEEL.lit;
			} else if (u < -0.45) {
				colour = STEEL.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// A ridge over the crown and a small finial.
	for (let y = 1; y <= 8; y++) {
		set(scene, FACE_X, y, STEEL.shade);
	}
	set(scene, FACE_X, 0, STEEL.lit);
	// The brim, wide and turned down a little at its ends, its rolled edge lit on the sun's side.
	for (let x = FACE_X - 13; x <= FACE_X + 14; x++) {
		const dx = Math.abs(x - FACE_X - 0.5);
		const y = 9 + (dx > 10 ? 1 : 0);
		set(scene, x, y, x > FACE_X + 2 ? STEEL.glint : STEEL.lit);
		set(scene, x, y + 1, x > FACE_X + 2 ? STEEL.base : STEEL.dark);
	}
	// A brass band round the crown's foot.
	for (let x = FACE_X - 7; x <= FACE_X + 8; x++) {
		set(scene, x, 8, x > FACE_X + 3 ? C.gold : C.brass);
	}
}

/**
 * The parapet in front of him: a stone wall walk with a merlon either side, lit on the sun's side.
 * @param {Canvas} scene
 */
function drawParapet(scene) {
	const lit = mix(C.stoneLight, C.duskSky6, 0.3);
	const face = mix(C.stone, C.duskSky3, 0.25);
	const mortar = mix(C.stoneShade, C.roof, 0.35);
	const shade = mix(C.stoneShade, C.night, 0.3);
	/**
	 * Paints one block-coursed stone face.
	 * @param {number} x0
	 * @param {number} x1
	 * @param {number} y0
	 */
	const stones = (x0, x1, y0) => {
		for (let y = y0; y < 64; y++) {
			for (let x = x0; x <= x1; x++) {
				const course = Math.floor((y - y0) / 4);
				let colour = face;
				if (y === y0) {
					colour = lit;
				} else if (
					(y - y0) % 4 === 0 ||
					(x + (course % 2) * 4) % 8 === 0
				) {
					colour = mortar;
				} else if (x === x0) {
					colour = shade;
				} else if (x === x1) {
					colour = lit;
				}
				set(scene, x, y, colour);
			}
		}
	};
	stones(0, 63, PARAPET);
	stones(0, 13, MERLON);
	stones(57, 63, MERLON);
}

/**
 * His spear, held upright at the right: an ash shaft, a red tassel and a leaf-shaped steel head
 * catching the last of the sun.
 * @param {Canvas} scene
 */
function drawSpear(scene) {
	for (let y = 10; y < 64; y++) {
		set(scene, SPEAR, y, C.timberLight);
		set(scene, SPEAR + 1, y, C.timber);
	}
	paint(
		scene,
		SPEAR - 2,
		0,
		[
			'..WS..',
			'..WS..',
			'.WLSs.',
			'.WLSs.',
			'WLLSss',
			'.WLSs.',
			'..LS..',
			'..bb..',
			'.rRRr.',
			'rRRRRr',
			'rr..rr',
		],
		{
			W: STEEL.glint,
			L: STEEL.lit,
			S: STEEL.base,
			s: STEEL.shade,
			b: C.brass,
			r: C.brickRedShade,
			R: C.brickRed,
		}
	);
}

/**
 * His gloved left hand closed round the spear's shaft.
 * @param {Canvas} scene
 */
function drawHand(scene) {
	paint(
		scene,
		SPEAR - 3,
		36,
		['.dbbl.', 'dbbbbl', 'dbbbbl', 'dbbbbl', '.dbbl.'],
		{ d: GLOVE.dark, b: GLOVE.base, l: GLOVE.lit }
	);
}
