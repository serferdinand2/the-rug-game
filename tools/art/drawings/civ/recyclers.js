// Recyclers: a young scavenger in goggles and a patched jacket carrying a towering pack of salvage through a scrapyard at dusk, a recycling-arrows sign behind.
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
import { drawSky } from '../../parts/sky.js';
import { drawWheel } from '../../parts/wheel.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */

/** The face's centre column. */
const FACE_X = 35;

/** The sky's last row, behind the scrap heaps. */
const HORIZON = 42;

/** The recycling sign's top-left corner and size. */
const SIGN = { x: 49, y: 7, size: 14 };

/** Skin: lit by the low sun on his left, plain, and shaded on the side away from it. */
const SKIN = {
	glint: mix(C.skin, C.lampGlow, 0.4),
	lit: mix(C.skin, C.duskSky6, 0.3),
	base: C.skin,
	shade: mix(C.skinShade, C.duskSky3, 0.3),
	dark: mix(C.skinShade, C.roof, 0.5),
};

/** Messy auburn hair: sunlit, plain and in shadow. */
const HAIR = {
	lit: mix(C.timberLight, C.duskSky6, 0.45),
	base: C.timberLight,
	shade: C.timber,
	dark: C.timberShade,
};

/** The olive work jacket: sunlit, plain, shaded and in the folds. */
const JACKET = {
	lit: mix(mix(C.grassShade, C.timber, 0.45), C.duskSky6, 0.35),
	base: mix(C.grassShade, C.timber, 0.45),
	shade: mix(mix(C.grassShade, C.timber, 0.45), C.roof, 0.4),
	dark: mix(mix(C.grassShade, C.timber, 0.45), C.night, 0.55),
};

/** Copper pipes in the salvage. */
const COPPER = {
	lit: mix(C.amber, C.brickRedLight, 0.4),
	base: mix(C.brickRed, C.amber, 0.45),
	shade: C.brickRedShade,
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.skinShade, 0.45) };

/**
 * Draws the Recyclers portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(48259);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawHeaps(layer, random);
	drawSign(layer);

	// Two layers, each outlined: the pack of salvage behind, the scavenger in front.
	const pack = createCanvas(64, 64);
	drawPack(pack);
	outline(pack, C.ink);
	drawBody(scene);
	drawHead(scene);
	drawHands(scene);
	outline(scene, C.ink);
	underlay(scene, pack);
	underlay(scene, layer);
	// A bicycle wheel lashed to the top of the load, drawn after the outline so its spokes stay clear.
	drawWheel(scene, {
		x: 8,
		y: 9,
		r: 6,
		spokes: 8,
		tyre: C.ink,
		spoke: C.stoneLight,
		hub: C.stone,
	});
	return scene;
}

/**
 * Heaps of scrap along the horizon: dark mounds bristling with pipes, panels and a car's shell,
 * their tops catching the last light, and the trodden ground in front.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawHeaps(layer, random) {
	const heap = mix(C.roofShade, C.timberShade, 0.35);
	const heapLit = mix(C.roof, C.duskSky4, 0.45);
	const heapDark = mix(C.roofShade, C.night, 0.4);
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			34 + 4 * Math.sin(x * 0.17) + 2 * Math.sin(x * 0.53 + 1)
		);
		for (let y = top; y < 64; y++) {
			let colour = heap;
			if (y === top) {
				colour = heapLit;
			} else if (y > 46 || (y > 42 && (x + y) % 2 === 0)) {
				colour = heapDark;
			}
			set(layer, x, y, colour);
		}
	}
	// Junk poking out of the heaps.
	for (let i = 0; i < 14; i++) {
		const x = Math.floor(random() * 60);
		const y = 34 + Math.floor(random() * 10);
		const kind = Math.floor(random() * 3);
		if (kind === 0) {
			line(layer, x, y, x + 3, y - 4, mix(C.stone, C.duskSky5, 0.35));
		} else if (kind === 1) {
			rect(layer, x, y - 2, 3, 2, mix(C.brickRed, C.duskSky5, 0.3));
		} else {
			set(layer, x, y - 1, mix(C.stone, C.duskSky5, 0.3));
		}
	}
	// Bigger junk on the heaps' tops, catching the last light: a tyre on its edge, a bent car door
	// and an old fridge.
	for (let y = 26; y <= 34; y++) {
		for (let x = 56; x <= 63; x++) {
			const d = Math.hypot(x - 60, y - 30);
			if (d > 3.6 || d < 1.6) {
				continue;
			}
			const lit = x - 60 + (30 - y) > 1;
			set(
				layer,
				x,
				y,
				lit
					? mix(C.stone, C.duskSky6, 0.35)
					: mix(C.stoneShade, C.roof, 0.3)
			);
		}
	}
	for (let y = 27; y <= 34; y++) {
		const x0 = 47 + Math.round((y - 27) * 0.3);
		for (let x = x0; x <= x0 + 6; x++) {
			let colour = mix(C.stone, C.duskSky5, 0.35);
			if (x === x0 + 6 || y === 27) {
				colour = mix(C.stoneLight, C.duskSky6, 0.4);
			} else if (y < 30 && x > x0 && x < x0 + 5) {
				colour = mix(C.roof, C.duskSky3, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
	rect(layer, 0, 29, 4, 8, mix(C.cream, C.duskSky4, 0.45));
	rect(layer, 3, 29, 1, 8, mix(C.creamLight, C.duskSky6, 0.4));
	rect(layer, 0, 33, 4, 1, mix(C.creamShade, C.roof, 0.4));
	// The ground: oily dirt with a puddle reflecting the sky.
	for (let y = 52; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				(x * 3 + y * 7) % 13 === 0
					? heap
					: mix(C.timberShade, C.night, 0.45)
			);
		}
	}
	rect(layer, 50, 57, 10, 2, C.duskSky4);
	rect(layer, 52, 59, 7, 1, C.duskSky3);
}

/**
 * The recycling sign on a post at the right: three white arrows chasing each other round a ring on a
 * green board.
 * @param {Canvas} layer
 */
function drawSign(layer) {
	const { x, y, size } = SIGN;
	rect(layer, x + 6, y + size, 2, 30, mix(C.stoneShade, C.roof, 0.3));
	rect(layer, x + 6, y + size, 1, 30, mix(C.stone, C.duskSky5, 0.3));
	rect(layer, x - 1, y - 1, size + 2, size + 2, C.ink);
	rect(layer, x, y, size, size, C.grass);
	rect(layer, x, y, size, 1, C.grassLight);
	rect(layer, x, y + size - 1, size, 1, C.grassShade);
	const cx = x + (size - 1) / 2;
	const cy = y + (size - 1) / 2;
	for (let py = y + 1; py < y + size - 1; py++) {
		for (let px = x + 1; px < x + size - 1; px++) {
			const r = Math.hypot(px - cx, py - cy);
			// The angle round the ring, clockwise from the top, in degrees.
			const angle =
				((Math.atan2(px - cx, -(py - cy)) * 180) / Math.PI + 360) % 360;
			const along = angle % 120;
			const shaft = along >= 18 && along < 84 && r >= 3.4 && r <= 5.3;
			// Each arrowhead narrows from the full ring's width to its tip.
			const head =
				along >= 84 &&
				along < 112 &&
				Math.abs(r - 4.4) <= 2.6 * (1 - (along - 84) / 28);
			if (shaft || head) {
				set(layer, px, py, C.white);
			}
		}
	}
}

/**
 * The towering pack of salvage on his back, rising above his head: a crate at the base, a brass cog,
 * a radio, a bicycle wheel, a kettle and a lamp on top, copper pipes poking out, all lashed with rope.
 * @param {Canvas} pack
 */
function drawPack(pack) {
	// The crate at the base, behind his shoulder.
	for (let y = 36; y < 56; y++) {
		for (let x = 5; x <= 25; x++) {
			let colour = C.timber;
			if (x === 5 || y === 36) {
				colour = C.timberLight;
			} else if (x === 25 || (y - 36) % 5 === 4) {
				colour = C.timberShade;
			}
			set(pack, x, y, colour);
		}
	}
	// Copper pipes poking out of the load at a slant.
	for (const [x0, y0, x1, y1] of [
		[8, 36, 1, 19],
		[11, 36, 5, 17],
	]) {
		line(pack, x0, y0, x1, y1, COPPER.base);
		line(pack, x0 + 1, y0, x1 + 1, y1, COPPER.lit);
	}
	rect(pack, 0, 18, 3, 2, COPPER.shade);
	rect(pack, 4, 16, 3, 2, COPPER.shade);
	// A big brass cog: eight teeth round a rim, a solid web and a hub.
	const cog = { x: 16, y: 28, r: 8 };
	for (let y = cog.y - cog.r; y <= cog.y + cog.r; y++) {
		for (let x = cog.x - cog.r; x <= cog.x + cog.r; x++) {
			const dx = x - cog.x;
			const dy = y - cog.y;
			const d = Math.hypot(dx, dy);
			const tooth = Math.cos(Math.atan2(dy, dx) * 8) > 0.3;
			if (d > (tooth ? cog.r + 0.4 : cog.r - 1.6)) {
				continue;
			}
			let colour = C.brass;
			if (d < 2) {
				colour = d < 1 ? C.lampFrame : C.gold;
			} else if (d < cog.r - 3 && d > cog.r - 4.2) {
				colour = C.lampFrame;
			} else if (dx - dy < -5) {
				colour = C.lampFrame;
			} else if (dx - dy > 5) {
				colour = C.gold;
			}
			set(pack, x, y, colour);
		}
	}
	// An old radio set, its grille a block of dark bars.
	for (let y = 12; y <= 20; y++) {
		for (let x = 15; x <= 27; x++) {
			let colour = C.brickRedShade;
			if (y === 12) {
				colour = C.brickRed;
			} else if (x >= 17 && x <= 22 && y >= 14 && y <= 18) {
				colour = y % 2 ? C.wood : C.timberShade;
			} else if (x === 25 && y === 16) {
				colour = C.gold;
			}
			set(pack, x, y, colour);
		}
	}
	// A battered kettle on the radio, and a brass lamp on the very top.
	paint(
		pack,
		16,
		4,
		[
			'...ss....',
			'..sSSs...',
			'.sSLLSs.S',
			'sSLLLSSsS',
			'sSLLSSSS.',
			'sSSSSSSs.',
			'.ssssss..',
		],
		{ s: C.stoneShade, S: C.stone, L: C.stoneLight }
	);
	paint(pack, 18, 0, ['.aga.', 'aWWWa', '.aaa.'], {
		a: C.brass,
		g: C.gold,
		W: C.lampGlow,
	});
	// Rope lashings round the load.
	line(pack, 4, 39, 26, 35, C.cream);
	line(pack, 4, 49, 26, 47, C.creamShade);
	line(pack, 14, 22, 27, 19, C.creamShade);
}

/**
 * His shoulders in the patched olive jacket, the pack's leather straps over them and a blue bandana
 * knotted at his throat.
 * @param {Canvas} scene
 */
function drawBody(scene) {
	// The neck.
	rect(scene, FACE_X - 3, 25, 6, 5, SKIN.dark);
	rect(scene, FACE_X + 1, 25, 2, 5, SKIN.shade);
	for (let y = 30; y < 64; y++) {
		const half = Math.min(20, 8 + Math.round((y - 30) * 2.4));
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			const u = (x - FACE_X) / half;
			let colour = JACKET.base;
			if (u > 0.78) {
				colour = JACKET.lit;
			} else if (u < -0.65) {
				colour = JACKET.dark;
			} else if (u < -0.1) {
				colour = JACKET.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The jacket's open front and its zip.
	for (let y = 36; y < 64; y++) {
		set(scene, FACE_X, y, JACKET.dark);
		set(scene, FACE_X + 1, y, y % 2 ? C.stone : C.stoneShade);
	}
	// Patches: a red one on the far chest, a mustard one on the near shoulder, with stitches.
	rect(scene, FACE_X - 13, 44, 6, 5, C.brickRedShade);
	for (let x = FACE_X - 13; x < FACE_X - 7; x += 2) {
		set(scene, x, 44, C.cream);
	}
	rect(scene, FACE_X + 11, 36, 5, 5, mix(C.amber, C.timber, 0.3));
	set(scene, FACE_X + 11, 38, C.cream);
	set(scene, FACE_X + 15, 38, C.cream);
	// The pack's leather straps, down over each shoulder.
	for (let y = 30; y < 64; y++) {
		const near = FACE_X - 9 - Math.round((y - 30) * 0.15);
		const far = FACE_X + 8 + Math.round((y - 30) * 0.15);
		rect(scene, near, y, 3, 1, C.timberShade);
		set(scene, near, y, C.timber);
		rect(scene, far, y, 3, 1, C.timber);
		set(scene, far + 2, y, C.timberLight);
	}
	// Buckles.
	rect(scene, FACE_X - 11, 54, 4, 2, C.brass);
	rect(scene, FACE_X + 10, 54, 4, 2, C.gold);
	// The bandana knotted at the throat.
	for (let y = 26; y <= 31; y++) {
		const half = 6 - Math.max(0, y - 28) * 2;
		for (let x = FACE_X - half; x <= FACE_X + half; x++) {
			set(
				scene,
				x,
				y,
				x > FACE_X + 2
					? mix(C.daySea2, C.duskSky6, 0.25)
					: y === 26
						? C.daySea3
						: mix(C.daySea3, C.night, 0.35)
			);
		}
	}
	set(scene, FACE_X - 2, 29, C.cream);
	set(scene, FACE_X + 2, 27, C.cream);
}

/**
 * His head: a messy mop of auburn hair, goggles pushed up on his forehead, his face turned to the
 * viewer and lit by the low sun on his left, with a crooked grin and a smudge of grease on his cheek.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	// The mop of hair, wider than his face, with tufts sticking up and out.
	for (let y = 3; y <= 20; y++) {
		for (let x = FACE_X - 10; x <= FACE_X + 10; x++) {
			const d = ((x - FACE_X - 0.5) / 9.6) ** 2 + ((y - 13) / 9.6) ** 2;
			if (d > 1) {
				continue;
			}
			let colour = HAIR.base;
			if (x > FACE_X + 2 && d > 0.55) {
				colour = HAIR.lit;
			} else if (x < FACE_X - 5) {
				colour = HAIR.dark;
			} else if ((x * 2 + y) % 5 === 0) {
				colour = HAIR.shade;
			}
			set(scene, x, y, colour);
		}
	}
	paint(
		scene,
		FACE_X - 8,
		1,
		['...h....h.H.', '.hhh..hhhHH.', 'hhhh.hhhhHHH'],
		{
			h: HAIR.base,
			H: HAIR.lit,
		}
	);
	paint(scene, FACE_X - 12, 13, ['hh.', '.hh'], { h: HAIR.dark });
	paint(scene, FACE_X + 10, 12, ['.HH', 'HH.'], { H: HAIR.lit });
	// The face: each row's first and last column, from the centre.
	/** @type {[number, number, number][]} */
	const rows = [
		[12, -5, 6],
		[13, -6, 7],
		[14, -6, 7],
		[15, -6, 7],
		[16, -6, 7],
		[17, -6, 7],
		[18, -6, 7],
		[19, -6, 7],
		[20, -5, 6],
		[21, -5, 6],
		[22, -4, 5],
		[23, -4, 5],
		[24, -3, 4],
		[25, -2, 3],
	];
	for (const [y, from, to] of rows) {
		for (let dx = from; dx <= to; dx++) {
			let colour = SKIN.base;
			if (dx === to && dx >= 5) {
				colour = SKIN.glint;
			} else if (dx >= 3) {
				colour = SKIN.lit;
			} else if (dx === from || (dx === from + 1 && y > 20)) {
				colour = SKIN.dark;
			} else if (dx <= -2) {
				colour = SKIN.shade;
			}
			set(scene, FACE_X + dx, y, colour);
		}
	}
	// A fringe falling over the brow, under the goggles.
	paint(scene, FACE_X - 6, 12, ['hhhHh.hhhHH.HH', 'h.h..h..h...H.'], {
		h: HAIR.shade,
		H: HAIR.base,
	});
	// Ears.
	rect(scene, FACE_X - 7, 16, 1, 3, SKIN.shade);
	rect(scene, FACE_X + 8, 16, 1, 3, SKIN.lit);
	// Welding goggles pushed up on his forehead: a rubber strap round the hair, two smoked lenses in
	// steel rims, the left one cracked, the right one catching the sunset.
	rect(scene, FACE_X - 10, 10, 21, 1, mix(C.night, C.stoneShade, 0.35));
	paint(
		scene,
		FACE_X - 6,
		8,
		['.rrr...rrR.', 'rkckr.rkgkR', 'rcKkrrrkkKR', '.rrr...rrR.'],
		{
			r: C.stoneShade,
			R: C.stone,
			k: mix(C.roofShade, C.night, 0.25),
			K: C.roofShade,
			c: C.stoneLight,
			g: mix(C.duskSky6, C.white, 0.3),
		}
	);
	// Brows, lids and eyes, glancing to his left.
	rect(scene, FACE_X - 4, 15, 3, 1, HAIR.dark);
	rect(scene, FACE_X + 2, 15, 3, 1, HAIR.shade);
	rect(scene, FACE_X - 3, 16, 2, 1, SKIN.dark);
	set(scene, FACE_X - 3, 17, EYE.shade);
	set(scene, FACE_X - 2, 17, C.ink);
	set(scene, FACE_X + 2, 17, EYE.lit);
	set(scene, FACE_X + 3, 17, C.ink);
	// The nose: a shade line down its far side and a lit tip.
	rect(scene, FACE_X, 17, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 19, SKIN.glint);
	set(scene, FACE_X, 20, SKIN.dark);
	// A crooked grin showing teeth.
	set(scene, FACE_X - 2, 21, C.brickRedShade);
	rect(scene, FACE_X - 1, 22, 4, 1, C.brickRedShade);
	rect(scene, FACE_X, 21, 3, 1, C.creamLight);
	set(scene, FACE_X + 3, 21, C.brickRedShade);
	// A smudge of grease on his cheek, and freckles on the lit one.
	rect(scene, FACE_X - 5, 19, 2, 1, mix(C.skinShade, C.wood, 0.55));
	set(scene, FACE_X - 4, 20, mix(C.skinShade, C.wood, 0.4));
	set(scene, FACE_X + 4, 19, SKIN.shade);
	set(scene, FACE_X + 6, 18, SKIN.shade);
}

/**
 * His hands gripping the pack's straps at his chest, knuckles out, in fingerless gloves.
 * @param {Canvas} scene
 */
function drawHands(scene) {
	paint(
		scene,
		FACE_X - 12,
		39,
		['.sbb.', 'sbdbs', 'sbdbd', '.sbs.', 'ggggg', '.ggg.'],
		{
			g: C.wood,
			d: SKIN.dark,
			s: SKIN.shade,
			b: SKIN.base,
		}
	);
	paint(
		scene,
		FACE_X + 7,
		39,
		['.bll.', 'blslW', 'blsll', '.bll.', 'ggggg', '.ggg.'],
		{
			g: C.wood,
			s: SKIN.shade,
			b: SKIN.base,
			l: SKIN.lit,
			W: SKIN.glint,
		}
	);
}
