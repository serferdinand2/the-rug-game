// The Chosen: a young figure in white and gold with a radiant halo, hands raised in blessing above a bank of cloud by day, golden rays breaking through parting storm clouds and small worshippers kneeling on the hill below.
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
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 31;

/** The halo behind the head: its centre and radius; the rays fan out from the same point. */
const HALO = { x: 31, y: 13, r: 11 };

/** The top of the cloud bank the figure rises from, and the top of the hill below it. */
const BANK = 49;
const HILL = 56;

/** The storm clouds parting at the top: each puff's centre and radius, on the left; the right mirrors them. */
const PUFFS = [
	[3, 1, 7],
	[11, -1, 6],
	[0, 11, 5],
	[15, 4, 4],
	[7, 8, 5],
	[3, 17, 4],
	[12, 12, 3],
];

/** Skin: lit on the right by the sun behind, plain, and shaded on the left. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.5),
	lit: mix(C.skin, C.lampGlow, 0.25),
	base: C.skin,
	shade: C.skinShade,
	dark: mix(C.skinShade, C.roof, 0.25),
};

/** Short dark brown curls. */
const HAIR = {
	lit: C.timberLight,
	base: C.timber,
	shade: C.timberShade,
	dark: C.wood,
};

/** The white robe: sunlit, plain, shaded and in the folds. */
const ROBE = {
	lit: C.white,
	base: C.creamLight,
	shade: mix(C.cloudShade, C.creamShade, 0.45),
	dark: mix(C.creamShade, C.roofLight, 0.3),
};

/** The figure is lit by hand, so the glow leaves it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(ROBE),
	C.ink,
	C.gold,
	C.amber,
	C.lampGlow,
];

/**
 * Draws The Chosen portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8015);

	drawRays(layer);
	drawStormClouds(layer);
	drawHalo(layer);
	drawBank(layer);
	drawTerrain(layer, { kind: 'grassland', top: HILL, random });

	drawRobe(scene);
	drawArms(scene);
	drawHead(scene);
	outline(scene, C.ink);
	underlay(scene, layer);
	drawCloudFront(scene);

	const front = createCanvas(64, 64);
	drawWorshippers(front, random);
	outline(front, C.ink);
	underlay(front, scene);

	glow(front, {
		x: HALO.x,
		y: HALO.y,
		radius: 24,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 4,
		skip: FIGURE,
	});
	return front;
}

/**
 * Tells whether a point lies inside a polygon.
 * @param {number} x
 * @param {number} y
 * @param {[number, number][]} points - The corners, in order
 * @returns {boolean}
 */
function inPolygon(x, y, points) {
	let inside = false;
	for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
		const [xi, yi] = points[i];
		const [xj, yj] = points[j];
		if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

/**
 * A glory of golden light filling the sky round the head: broad pale rays fanning out between bands of gold,
 * deepening to amber towards the edges.
 * @param {Canvas} layer
 */
function drawRays(layer) {
	/** Each band's ray and the gold between the rays, from the head outwards. */
	const bands = [
		[mix(C.white, C.lampGlow, 0.5), C.lampGlow],
		[C.lampGlow, C.gold],
		[C.beamLight, mix(C.gold, C.amber, 0.4)],
		[C.gold, C.amber],
	];
	for (let y = 0; y < HILL; y++) {
		for (let x = 0; x < 64; x++) {
			const angle = Math.atan2(y - HALO.y, x - HALO.x);
			const turn = (((angle + Math.PI) / (Math.PI * 2)) * 12 + 0.2) % 1;
			const d = Math.hypot(x - HALO.x, y - HALO.y) + ((x + y) % 2) * 1.5;
			const [ray, between] = bands[Math.min(3, Math.floor(d / 12))];
			set(layer, x, y, turn < 0.42 ? ray : between);
		}
	}
}

/**
 * Heavy grey clouds over both top corners, parting above the figure: puff over puff, each dark underneath
 * and lit gold along the edge where the light breaks through.
 * @param {Canvas} layer
 */
function drawStormClouds(layer) {
	for (const [left, y0, r] of PUFFS) {
		for (const x0 of [left, 63 - left]) {
			const lx = HALO.x - x0;
			const ly = HALO.y + 6 - y0;
			const ll = Math.hypot(lx, ly);
			for (let y = y0 - r; y <= y0 + r; y++) {
				for (let x = x0 - r; x <= x0 + r; x++) {
					const d = Math.hypot(x - x0, y - y0) / r;
					if (d > 1.05 || y < 0) {
						continue;
					}
					const nx = (x - x0) / r;
					const ny = (y - y0) / r;
					const facing = (nx * lx + ny * ly) / ll;
					let colour = mix(C.stoneLight, C.stone, 0.35);
					if (d > 0.75 && facing > 0.45) {
						colour = C.lampGlow;
					} else if (facing > 0.35) {
						colour = C.white;
					} else if (ny > 0.45) {
						colour = C.stone;
					} else if (ny < -0.2 || facing > 0) {
						colour = C.stoneLight;
					}
					set(layer, x, y, colour);
				}
			}
		}
	}
}

/**
 * The halo: a white disc behind the head, ringed in gold and amber and edged in deep amber.
 * @param {Canvas} layer
 */
function drawHalo(layer) {
	for (let y = HALO.y - HALO.r; y <= HALO.y + HALO.r; y++) {
		for (let x = HALO.x - HALO.r; x <= HALO.x + HALO.r + 1; x++) {
			const d = Math.hypot(x - HALO.x - 0.5, y - HALO.y);
			if (d > HALO.r + 0.3) {
				continue;
			}
			let colour = C.white;
			if (d > HALO.r - 1) {
				colour = mix(C.amber, C.brickRed, 0.4);
			} else if (d > HALO.r - 2.2) {
				colour = C.amber;
			} else if (d > HALO.r - 3.5) {
				colour = C.gold;
			} else if (d > HALO.r - 5) {
				colour = C.lampGlow;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The bank of white cloud the figure rises from, lit gold along its top.
 * @param {Canvas} layer
 */
function drawBank(layer) {
	for (let x = 0; x < 64; x++) {
		const top = BANK - Math.round(Math.abs(Math.sin(x * 0.32)) * 3);
		for (let y = top; y < HILL + 2; y++) {
			let colour = C.white;
			if (y === top) {
				colour = C.lampGlow;
			} else if (y > HILL - 2 || (x + y) % 7 === 0) {
				colour = C.cloudShade;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Small worshippers kneeling on the hill, seen from behind: some bowed low, some with their arms raised.
 * @param {Canvas} canvas
 * @param {() => number} random
 */
function drawWorshippers(canvas, random) {
	const clothes = [
		C.brickRed,
		C.daySea2,
		C.pine,
		C.roofLight,
		C.timberLight,
		C.amber,
	];
	const hair = [C.wood, C.timberShade, C.ink, C.timber];
	/** @type {Record<string, string[]>} */
	const poses = {
		raised: ['a...a', 'a.h.a', '.ahha', '..cc.', '.cccc', '.cccc', 'ccccc'],
		bowed: ['.....', '.....', '..hh.', '.hccc', '.cccc', 'ccccc', 'ccccc'],
		kneel: ['.....', '..hh.', '..hh.', '.cccc', '.cccc', '.cccc', 'ccccc'],
	};
	const order = ['raised', 'bowed', 'kneel', 'raised', 'bowed', 'kneel'];
	for (let i = 0; i < 6; i++) {
		const x = 1 + i * 11 + Math.floor(random() * 3);
		const y = 57 + (i % 2);
		paint(canvas, x, y, poses[order[i]], {
			a: C.skinTan,
			h: hair[Math.floor(random() * hair.length)],
			c: clothes[Math.floor(random() * clothes.length)],
		});
	}
}

/**
 * The white robe: falling from the shoulders into the clouds, a gold collar, and a gold stole hanging down the front.
 * @param {Canvas} scene
 */
function drawRobe(scene) {
	for (let y = 24; y < BANK + 4; y++) {
		const half =
			Math.min(11, 5 + Math.round((y - 24) * 2.4)) +
			Math.round(Math.max(0, y - 36) * 0.2);
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = ROBE.base;
			if (u > 0.55) {
				colour = ROBE.lit;
			} else if (u < -0.7) {
				colour = ROBE.dark;
			} else if (u < -0.15) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds falling to the clouds.
	for (const [x0, lean] of [
		[FACE_X - 7, -0.15],
		[FACE_X + 1, 0],
		[FACE_X + 8, 0.15],
	]) {
		for (let y = 38; y < BANK + 4; y++) {
			set(
				scene,
				x0 + Math.round((y - 38) * lean),
				y,
				x0 > FACE_X ? ROBE.shade : ROBE.dark
			);
		}
	}
	// The neck.
	for (let y = 21; y <= 25; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 3; x++) {
			set(
				scene,
				x,
				y,
				x <= FACE_X - 1 || y === 22 ? SKIN.shade : SKIN.base
			);
		}
	}
	// The gold stole: round the neck and down the front in two bands.
	for (const bx of [FACE_X - 4, FACE_X + 4]) {
		for (let y = 26; y < BANK + 4; y++) {
			set(scene, bx, y, bx > FACE_X ? C.lampGlow : C.gold);
			set(scene, bx + 1, y, bx > FACE_X ? C.gold : C.amber);
		}
	}
	for (let x = FACE_X - 4; x <= FACE_X + 5; x++) {
		const dip = Math.round(2 - Math.abs(x - FACE_X - 0.5) * 0.45);
		set(scene, x, 25 + Math.max(0, dip), x > FACE_X ? C.gold : C.amber);
	}
	// A small gold sun worked on the stole's ends, at the chest.
	paint(scene, FACE_X - 5, 33, ['.g.', 'gWg', '.g.'], {
		g: C.amber,
		W: C.lampGlow,
	});
	paint(scene, FACE_X + 4, 33, ['.g.', 'gWg', '.g.'], {
		g: C.amber,
		W: C.white,
	});
}

/**
 * Both arms raised in blessing: the upper arms out from the shoulders, the forearms upright in close white sleeves
 * that hang a little below the elbow, and the hands open, palms out to the viewer.
 * @param {Canvas} scene
 */
function drawArms(scene) {
	const cx = FACE_X + 0.5;
	for (const side of [-1, 1]) {
		/** @type {[number, number][]} */
		const sleeve = [
			[10, 25],
			[14, 27.5],
			[14.5, 21],
			[19.5, 21],
			[20, 30],
			[18, 35],
			[11.5, 33],
		].map(([dx, y]) => [cx + side * dx, y]);
		for (let y = 20; y <= 36; y++) {
			for (let x = 0; x < 64; x++) {
				if (!inPolygon(x + 0.5, y + 0.5, sleeve)) {
					continue;
				}
				const out = Math.abs(x + 0.5 - cx);
				let colour = side > 0 ? ROBE.base : ROBE.shade;
				if (out > 18.5) {
					colour = side > 0 ? ROBE.lit : ROBE.dark;
				} else if (y > 30 || (out < 15.5 && y > 27)) {
					colour = side > 0 ? ROBE.shade : ROBE.dark;
				}
				set(scene, x, y, colour);
			}
		}
		// The gold hem round the sleeve's mouth at the wrist.
		for (let dx = 15; dx <= 19; dx++) {
			set(
				scene,
				Math.round(cx + side * dx - 0.5),
				21,
				side > 0 ? C.gold : C.amber
			);
		}
	}
	// The hands, open and raised palm out: three fingers spread, the middle one longest, and the thumb turned in.
	const hand = [
		'...g..',
		'.l.g.l',
		'.l.g.l',
		'sllggl',
		'slgggl',
		'.lggl.',
		'..gl..',
	];
	paint(scene, FACE_X + 15, 14, hand, {
		s: SKIN.base,
		l: SKIN.lit,
		g: SKIN.glint,
	});
	paint(
		scene,
		FACE_X - 20,
		14,
		hand,
		{ s: SKIN.dark, l: SKIN.shade, g: SKIN.base },
		{ mirror: true }
	);
}

/**
 * The head: short dark curls and a young, calm face turned to the viewer,
 * lit on its right by the light behind and shaded on its left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The hair: a rounded crop of curls, lit along the right.
	for (let y = 2; y <= 16; y++) {
		for (let x = FACE_X - 7; x <= FACE_X + 8; x++) {
			const d = ((x - FACE_X - 0.5) / 7.5) ** 2 + ((y - 10) / 8) ** 2;
			if (d > 1) {
				continue;
			}
			const curl = (x * 2 + y * 3) % 5 === 0;
			let colour = curl ? HAIR.shade : HAIR.base;
			if (x > FACE_X + 3) {
				colour = curl ? HAIR.base : HAIR.lit;
			} else if (x < FACE_X - 3) {
				colour = curl ? HAIR.dark : HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[8, -3, 4],
		[9, -4, 5],
		[10, -5, 6],
		[11, -5, 6],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -4, 5],
		[18, -4, 5],
		[19, -3, 4],
		[20, -3, 4],
		[21, -2, 3],
		[22, -1, 2],
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
	// Curls falling over the brow.
	paint(scene, FACE_X - 4, 8, ['ssbbblbl', 's.b.b.l.'], {
		s: HAIR.shade,
		b: HAIR.base,
		l: HAIR.lit,
	});
	// Ears.
	rect(scene, FACE_X - 6, 13, 1, 3, SKIN.shade);
	rect(scene, FACE_X + 7, 13, 1, 3, SKIN.lit);
	// Fine brows and clear eyes looking out.
	rect(scene, FACE_X - 3, 11, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 2, 11, 3, 1, HAIR.shade);
	set(scene, FACE_X - 3, 13, mix(C.cream, C.skinShade, 0.35));
	set(scene, FACE_X - 2, 13, C.ink);
	set(scene, FACE_X + 2, 13, C.ink);
	set(scene, FACE_X + 3, 13, C.white);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 14, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 16, SKIN.glint);
	set(scene, FACE_X, 17, SKIN.dark);
	// A gentle smile and a rosy lower lip.
	set(scene, FACE_X - 1, 18, C.brickRedShade);
	rect(scene, FACE_X, 19, 2, 1, C.brickRedShade);
	set(scene, FACE_X + 2, 18, C.brickRedShade);
	set(scene, FACE_X + 1, 20, mix(C.brickRedLight, C.skin, 0.5));
}

/**
 * Wisps of the cloud bank drifting in front of the robe's hem, so the figure rises out of it.
 * @param {Canvas} scene
 */
function drawCloudFront(scene) {
	for (let x = FACE_X - 15; x <= FACE_X + 16; x++) {
		const top = BANK + 1 + Math.round(Math.abs(Math.sin(x * 0.45)) * 2);
		for (let y = top; y < HILL; y++) {
			let colour = (x + y) % 6 === 0 ? C.cloudShade : C.white;
			if (y === top) {
				colour = C.lampGlow;
			}
			set(scene, x, y, colour);
		}
	}
}
