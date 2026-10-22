// Celestials: a winged celestial in white and gold, high above the clouds by day, reaching down in blessing over a small floating island with a tiny farm.
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
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A wing's line: where it joins the back, its wrist and its tip, and how long its flight feathers grow.
 * @typedef {Object} WingLine
 * @property {{ x: number, y: number }} root
 * @property {{ x: number, y: number }} wrist
 * @property {{ x: number, y: number }} tip
 * @property {number} reach - The longest flight feather, at the tip
 * @property {boolean} lit - Whether the wing faces the sun
 */

/** The face's centre column. */
const FACE_X = 25;

/** The sun, high on the right. */
const SUN = { x: 57, y: 9 };

/** The floating island's top: its centre and half its width and depth. */
const ISLAND = { x: 46, y: 51, half: 15, depth: 4 };

/** The far wing, spread wide to the left, and the near wing, raised steeply behind his head. */
const FAR_WING = {
	root: { x: 17, y: 28 },
	wrist: { x: 7, y: 9 },
	tip: { x: 1, y: 2 },
	reach: 29,
	lit: false,
};
const NEAR_WING = {
	root: { x: 31, y: 26 },
	wrist: { x: 37, y: 8 },
	tip: { x: 42, y: 1 },
	reach: 20,
	lit: true,
};

/** Deep skin in the full sun on his left, plain, and in the soft shade of the right. */
const SKIN = {
	glint: mix(C.skinTan, C.lampGlow, 0.3),
	lit: mix(C.skinDeep, C.skinTan, 0.5),
	base: C.skinDeep,
	shade: C.skinDeepShade,
	dark: mix(C.skinDeepShade, C.daySky1, 0.2),
};

/** Silver-white curls. */
const HAIR = {
	lit: C.white,
	base: mix(C.stoneLight, C.white, 0.45),
	shade: C.stoneLight,
	dark: C.stone,
};

/** The white robe, shaded with the blue of the sky. */
const ROBE = {
	lit: C.white,
	base: C.creamLight,
	shade: mix(C.cloudShade, C.creamShade, 0.25),
	dark: mix(C.cloudShade, C.daySky3, 0.45),
};

/** Feathers in the sun, and in the shade. */
const FEATHER = {
	lit: C.white,
	base: C.creamLight,
	shade: C.cloudShade,
	dark: mix(C.cloudShade, C.daySky3, 0.5),
	edge: mix(C.gold, C.creamLight, 0.35),
};

/** Eye whites, lit and shaded, and the gold of his eyes. */
const EYE = { lit: C.white, shade: C.cloudShade, iris: C.amber };

/** The figure is lit by hand, so the sun's glow leaves it as painted. */
const FIGURE = [
	...Object.values(SKIN),
	...Object.values(HAIR),
	...Object.values(ROBE),
	...Object.values(FEATHER),
	...Object.values(EYE),
	C.ink,
];

/**
 * Draws the Celestials portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8413);

	drawSky(layer, { time: 'day', horizon: 63, random });
	drawSun(layer);
	drawCloudSea(layer, random);
	drawDistantIsland(layer);

	// The wings behind, the figure before them, the reaching arm before the figure, and the island in front of all.
	const wings = createCanvas(64, 64);
	drawWing(wings, FAR_WING);
	drawWing(wings, NEAR_WING);
	outline(wings, C.ink);
	const figure = createCanvas(64, 64);
	drawRobe(figure);
	drawHead(figure);
	outline(figure, C.ink);
	const arm = createCanvas(64, 64);
	drawArm(arm);
	outline(arm, C.ink);
	underlay(arm, figure);

	drawIsland(scene);
	drawFarm(scene);
	drawWisp(scene);
	outline(scene, C.ink);
	underlay(scene, arm);
	underlay(scene, wings);
	underlay(scene, layer);

	glow(scene, {
		x: SUN.x,
		y: SUN.y,
		radius: 22,
		colour: C.lampGlow,
		strength: 0.4,
		steps: 4,
		skip: [...FIGURE, C.white, C.lampGlow],
	});
	drawBlessing(scene, random);
	return scene;
}

/**
 * The sun: a white disc ringed in pale gold.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - 5; y <= SUN.y + 5; y++) {
		for (let x = SUN.x - 5; x <= SUN.x + 5; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d <= 4.6) {
				set(layer, x, y, d < 3.2 ? C.white : C.lampGlow);
			}
		}
	}
}

/**
 * A sea of cloud below, rolling in banks across the bottom of the sky.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCloudSea(layer, random) {
	for (let y = 42; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const bank =
				46 +
				Math.round(Math.sin(x * 0.35 + 1) * 2 + Math.sin(x * 0.13) * 2);
			if (y < bank) {
				continue;
			}
			let colour = C.white;
			if ((y - bank) % 6 === 4) {
				colour = C.cloudShade;
			} else if (y > 56) {
				colour = mix(C.cloudShade, C.daySky6, 0.4);
			}
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 10; i++) {
		const x = Math.floor(random() * 64);
		const y = 50 + Math.floor(random() * 12);
		rect(layer, x, y, 3, 1, C.cloudShade);
	}
}

/**
 * A second floating island far off at the right, small and pale in the haze.
 * @param {Canvas} layer
 */
function drawDistantIsland(layer) {
	const grass = mix(C.grass, C.daySky5, 0.5);
	const earth = mix(C.timber, C.daySky5, 0.55);
	paint(
		layer,
		52,
		25,
		[
			'..t.....',
			'.ttt....',
			'gggggggg',
			'.eeeeee.',
			'..eeee..',
			'...ee...',
		],
		{ g: grass, e: earth, t: mix(C.pine, C.daySky5, 0.5) }
	);
}

/**
 * A great wing: a gold-edged leading edge from the root by the wrist to the tip, a band of small
 * scalloped feathers below it, and long flight feathers hanging from it, longest at the tip.
 * @param {Canvas} canvas
 * @param {WingLine} wing
 */
function drawWing(canvas, { root, wrist, tip, reach, lit }) {
	const side = Math.sign(tip.x - root.x);
	const body = lit ? FEATHER.lit : FEATHER.base;
	const quill = lit ? FEATHER.shade : FEATHER.dark;
	const rim = lit ? FEATHER.base : FEATHER.shade;
	/**
	 * A point on the leading edge, from the root (0) by the wrist (0.6) to the tip (1).
	 * @param {number} t
	 * @returns {[number, number]}
	 */
	const edge = (t) => {
		if (t < 0.6) {
			const u = t / 0.6;
			return [
				root.x + (wrist.x - root.x) * u,
				root.y + (wrist.y - root.y) * u ** 0.8,
			];
		}
		const u = (t - 0.6) / 0.4;
		return [
			wrist.x + (tip.x - wrist.x) * u,
			wrist.y + (tip.y - wrist.y) * u,
		];
	};
	// The flight feathers, from the tip in to the root, so each lies over the one outside it.
	const count = 11;
	for (let i = count - 1; i >= 0; i--) {
		const t = (i + 0.5) / count;
		const [sx, sy] = edge(t);
		const lean = 0.1 + 0.55 * t;
		const length = reach * (0.35 + 0.65 * t);
		const dx = (side * lean) / Math.hypot(lean, 1);
		const dy = 1 / Math.hypot(lean, 1);
		for (let s = 0; s <= length; s += 0.5) {
			const half =
				s > length - 2.5 ? Math.max(0.5, (length - s) * 0.9) : 2.2;
			for (let w = -half; w <= half; w += 0.5) {
				// Across the feather, from its inner edge to its outer edge.
				const x = Math.round(sx + dx * s - dy * w * side);
				const y = Math.round(sy + dy * s + dx * w * side);
				let colour = body;
				if (w < -half + 0.6) {
					colour = quill;
				} else if (s > length - 3) {
					colour = rim;
				}
				set(canvas, x, y, colour);
			}
		}
	}
	// The small feathers along the top, in scalloped rows.
	for (let t = 0; t <= 1; t += 0.01) {
		const [ex, ey] = edge(t);
		const deep = 6 - 2 * t;
		for (let s = 0; s <= deep; s += 0.5) {
			const scallop = (s + Math.abs(Math.sin(t * 40)) * 1.5) % 3;
			set(
				canvas,
				Math.round(ex),
				Math.round(ey + s),
				scallop < 0.8 ? quill : body
			);
		}
	}
	// The leading edge, gilded.
	for (let t = 0; t <= 1; t += 0.01) {
		const [ex, ey] = edge(t);
		set(canvas, Math.round(ex), Math.round(ey), FEATHER.edge);
		set(
			canvas,
			Math.round(ex),
			Math.round(ey) - 1,
			lit ? C.lampGlow : FEATHER.edge
		);
	}
}

/**
 * The white robe, turned three-quarters to the right: a gold collar, a gold sash across the chest,
 * and folds falling away into the clouds.
 * @param {Canvas} scene
 */
function drawRobe(scene) {
	// The neck, lit on the sun's side.
	for (let y = 22; y <= 27; y++) {
		for (let x = FACE_X - 2; x <= FACE_X + 2; x++) {
			let colour = SKIN.shade;
			if (x >= FACE_X + 1) {
				colour = SKIN.lit;
			} else if (y === 23) {
				colour = SKIN.dark;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 27; y < 64; y++) {
		const left = Math.max(
			10 - Math.floor((y - 34) / 6),
			FACE_X - 5 - Math.round((y - 27) * 2.4)
		);
		const right = Math.min(
			40 + Math.floor((y - 34) / 4),
			FACE_X + 6 + Math.round((y - 27) * 2.2)
		);
		for (let x = left; x <= right; x++) {
			const u = (x - left) / Math.max(1, right - left);
			let colour = ROBE.base;
			if (u > 0.72) {
				colour = ROBE.lit;
			} else if (u < 0.15) {
				colour = ROBE.dark;
			} else if (u < 0.4) {
				colour = ROBE.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// Folds falling from the chest.
	for (let y = 38; y < 64; y++) {
		set(scene, 18 - Math.round((y - 38) * 0.2), y, ROBE.dark);
		set(scene, 27 + Math.round((y - 38) * 0.15), y, ROBE.shade);
	}
	// The gold collar round the neck.
	for (let x = FACE_X - 6; x <= FACE_X + 7; x++) {
		const y = 27 + Math.round(Math.abs(x - FACE_X - 0.5) / 3);
		set(scene, x, y, x > FACE_X ? C.lampGlow : C.gold);
		set(scene, x, y + 1, x > FACE_X ? C.gold : C.amber);
	}
	// The sash across his chest, from the far shoulder down to the near hip.
	for (let y = 30; y < 54; y++) {
		const x = 14 + Math.round((y - 30) * 0.85);
		set(scene, x, y, C.amber);
		set(scene, x + 1, y, C.gold);
		set(scene, x + 2, y, C.lampGlow);
	}
}

/**
 * His near arm reaching down over the island, the wide sleeve fallen back, the hand open in blessing.
 * @param {Canvas} scene
 */
function drawArm(scene) {
	// The sleeve, from the shoulder out to the elbow, widening.
	for (let i = 0; i <= 9; i++) {
		const cx = 33 + Math.round(i * 0.7);
		const cy = 29 + i;
		const half = 3 + Math.round(i * 0.25);
		for (let x = cx - half; x <= cx + half; x++) {
			const u = (x - cx) / half;
			let colour = ROBE.base;
			if (u > 0.4) {
				colour = ROBE.lit;
			} else if (u < -0.5) {
				colour = ROBE.shade;
			}
			set(scene, x, cy, colour);
		}
	}
	rect(scene, 35, 37, 8, 1, C.gold);
	// The forearm, from the sleeve out over the island, with a gold band at the wrist.
	for (let i = 0; i <= 6; i++) {
		const x = 41 + i;
		const y = 35 + Math.round(i * 0.3);
		set(scene, x, y - 1, SKIN.glint);
		set(scene, x, y, SKIN.lit);
		set(scene, x, y + 1, SKIN.base);
		set(scene, x, y + 2, SKIN.shade);
	}
	rect(scene, 45, 34, 1, 4, C.gold);
	// The open hand, palm down, fingers spread over the farm.
	paint(
		scene,
		47,
		34,
		['ll....', 'lllg..', 'bbllgg', 'sbbll.', '.s.b.l', '.s..b.'],
		{ g: SKIN.glint, l: SKIN.lit, b: SKIN.base, s: SKIN.shade }
	);
}

/**
 * His head: silver-white curls under a gold circlet with a star, the face turned three-quarters to the right,
 * looking down at the island, lit by the sun on his left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The curls, round the head and down to the nape on the far side.
	for (let y = 2; y <= 24; y++) {
		for (let x = FACE_X - 11; x <= FACE_X + 9; x++) {
			const d = ((x - FACE_X + 1) / 9.2) ** 2 + ((y - 12) / 10) ** 2;
			if (d > 1 || (y > 19 && x > FACE_X - 6)) {
				continue;
			}
			const curl = Math.sin(x * 1.7) + Math.sin(y * 1.9 + x * 0.5);
			let colour = HAIR.base;
			if (x > FACE_X + 2 && curl > 0.2) {
				colour = HAIR.lit;
			} else if (x < FACE_X - 5) {
				colour = curl > 0.3 ? HAIR.shade : HAIR.dark;
			} else if (curl > 1.1) {
				colour = HAIR.lit;
			} else if (curl < -1) {
				colour = HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[9, -3, 4],
		[10, -4, 5],
		[11, -5, 6],
		[12, -5, 6],
		[13, -5, 6],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 7],
		[17, -5, 7],
		[18, -4, 6],
		[19, -4, 5],
		[20, -4, 5],
		[21, -3, 4],
		[22, -2, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
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
	// The ear on the far side, half in the curls.
	rect(scene, FACE_X - 6, 14, 1, 3, SKIN.shade);
	set(scene, FACE_X - 6, 15, SKIN.dark);
	// The circlet across his brow, a star at its front.
	for (let x = FACE_X - 7; x <= FACE_X + 6; x++) {
		set(
			scene,
			x,
			8 + (x < FACE_X - 4 ? 1 : 0),
			x > FACE_X ? C.lampGlow : x < FACE_X - 3 ? C.amber : C.gold
		);
	}
	paint(scene, FACE_X + 1, 5, ['.W.', 'WWW', '.W.'], { W: C.white });
	// Brows, lowered lids and gold eyes looking down to his left, at the island.
	rect(scene, FACE_X - 3, 12, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 2, 12, 3, 1, HAIR.shade);
	rect(scene, FACE_X - 3, 13, 3, 1, SKIN.shade);
	rect(scene, FACE_X + 2, 13, 3, 1, SKIN.base);
	set(scene, FACE_X - 3, 14, EYE.shade);
	set(scene, FACE_X - 2, 14, EYE.iris);
	set(scene, FACE_X - 1, 14, C.ink);
	set(scene, FACE_X + 2, 14, EYE.lit);
	set(scene, FACE_X + 3, 14, EYE.iris);
	set(scene, FACE_X + 4, 14, C.ink);
	// The nose, pointing to his left: a shade line down its near side and a lit tip.
	rect(scene, FACE_X + 4, 15, 1, 2, SKIN.base);
	rect(scene, FACE_X + 3, 15, 1, 3, SKIN.shade);
	set(scene, FACE_X + 5, 17, SKIN.glint);
	set(scene, FACE_X + 4, 18, SKIN.shade);
	// The lit cheek, and a gentle smile.
	set(scene, FACE_X + 5, 15, SKIN.glint);
	set(scene, FACE_X - 3, 17, SKIN.dark);
	const lips = mix(C.brickRedShade, C.skinDeepShade, 0.4);
	set(scene, FACE_X + 1, 20, lips);
	rect(scene, FACE_X + 2, 20, 2, 1, lips);
	set(scene, FACE_X + 4, 19, lips);
	set(scene, FACE_X + 2, 21, mix(C.brickRed, C.skinDeep, 0.5));
}

/**
 * The floating island: a grassy top over a band of earth, and below it a cone of grey rock tapering
 * to a jagged point, a wisp of cloud drifting under it.
 * @param {Canvas} scene
 */
function drawIsland(scene) {
	const { x: cx, y: cy, half, depth } = ISLAND;
	const tip = 63;
	// The rock beneath, its sides broken into jagged steps, narrowing to a point.
	for (let y = cy; y <= tip; y++) {
		const t = (y - cy) / (tip - cy);
		const jag = Math.round(Math.sin(y * 1.7) * 2);
		const w = half * (1 - t) ** 1.25;
		const left = Math.round(cx - w) + Math.max(0, jag);
		const right = Math.round(cx + w) - Math.max(0, -jag);
		for (let x = left; x <= right; x++) {
			const u = (x - cx) / Math.max(1, w);
			let colour = C.stone;
			if (y < cy + 2) {
				colour = y === cy ? C.timber : C.timberShade;
			} else if (u > 0.45) {
				colour = C.stoneLight;
			} else if (u < -0.35) {
				colour = C.stoneShade;
			} else if ((x * 5 + y * 3) % 11 === 0) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	// The grassy top.
	for (let y = cy - depth; y <= cy + 1; y++) {
		for (let x = cx - half; x <= cx + half; x++) {
			const d =
				((x - cx) / half) ** 2 + ((y - cy + 0.5) / (depth + 0.5)) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = C.grass;
			if (y >= cy) {
				colour = C.grassShade;
			} else if (x > cx + 4 && y < cy - 1) {
				colour = C.grassLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Wisps of cloud drifting under the island, either side of its point.
 * @param {Canvas} scene
 */
function drawWisp(scene) {
	paint(
		scene,
		30,
		60,
		['....www......', '.wwwWWWww..ww', 'wWWWWWWWWwwWW', 'sssssssssssss'],
		{ w: C.white, W: C.white, s: C.cloudShade }
	);
	paint(scene, 50, 59, ['..www...', '.wWWWww.', 'wWWWWWWw', 'ssssssss'], {
		w: C.white,
		W: C.white,
		s: C.cloudShade,
	});
}

/**
 * The tiny farm on the island: a field of golden wheat in rows, a red barn, and a round green tree.
 * @param {Canvas} scene
 */
function drawFarm(scene) {
	// Rows of wheat.
	for (let y = 49; y <= 52; y++) {
		for (let x = 34; x <= 43; x++) {
			if (y === 49 && (x < 36 || x > 41)) {
				continue;
			}
			set(scene, x, y, (x + y) % 3 === 0 ? C.amber : C.gold);
		}
	}
	// The barn, with a white door cross.
	paint(
		scene,
		46,
		44,
		[
			'...rr...',
			'..rRRr..',
			'.rRRRRr.',
			'rrrrrrrr',
			'.bBbbwb.',
			'.bBbwbb.',
			'.bBbbwb.',
		],
		{
			r: C.roofShade,
			R: C.roofLight,
			b: C.brickRed,
			B: C.brickRedLight,
			w: C.creamLight,
		}
	);
	// The tree.
	paint(scene, 55, 44, ['.ll.', 'gllg', 'pggg', '.pp.', '..t.'], {
		l: C.pineLight,
		g: C.pine,
		p: C.pineShade,
		t: C.timberShade,
	});
}

/**
 * Motes of light falling from his hand onto the farm, and a few drifting round him.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBlessing(scene, random) {
	for (const [x, y] of [
		[48, 41],
		[51, 43],
		[49, 45],
		[53, 40],
	]) {
		set(scene, x, y, C.lampGlow);
	}
	for (let i = 0; i < 8; i++) {
		const x = 2 + Math.floor(random() * 60);
		const y = 2 + Math.floor(random() * 40);
		if (x > 8 && x < 50) {
			continue;
		}
		set(scene, x, y, random() > 0.5 ? C.white : C.lampGlow);
	}
}
