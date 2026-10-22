// Merfolk: a crowned merman holding a gold trident across his body under the sea, a coral city behind him, light rays falling from the surface and bubbles rising.
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
import { drawClassical } from '../../parts/classical.js';
import { drawBuilding } from '../../parts/buildings.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The face's centre column. */
const FACE_X = 34;

/** The trident: the butt of its shaft at the bottom left, and the middle of its crossbar at the top right. */
const BUTT = { x: 4, y: 63 };
const CROSS = { x: 52, y: 15 };

/** The row where his skin gives way to the scales of his tail. */
const WAIST = 51;

/** The water from the surface down, lightest at the top. */
const WATER = [
	mix(C.dayWaveDeep, C.daySea1, 0.3),
	C.daySea1,
	C.daySea2,
	C.daySea3,
	C.nightSea1,
	C.nightSea2,
];

/** Sea-tinted skin, lit from the surface on his left, plain, and shaded. */
const SKIN = {
	glint: mix(C.skinTan, C.tealLight, 0.45),
	lit: mix(C.skinTan, C.ghost, 0.25),
	base: mix(C.skinTan, C.teal, 0.18),
	shade: mix(C.skinTanShade, C.tealShade, 0.35),
	dark: mix(C.skinTanShade, C.nightSea3, 0.5),
};

/** Long dark sea-green hair and beard, lit along the top. */
const HAIR = {
	lit: mix(C.tealShade, C.pine, 0.5),
	base: mix(C.pineShade, C.nightSea3, 0.4),
	dark: mix(C.pineShade, C.night, 0.55),
};

/** The scales of his tail: lit, plain, shaded and the dark rim of each scale. */
const SCALE = {
	glint: C.tealLight,
	lit: C.teal,
	base: mix(C.teal, C.tealShade, 0.5),
	rim: C.tealShade,
	dark: mix(C.tealShade, C.nightSea3, 0.5),
};

/** Eye whites on the lit and the shaded side. */
const EYE = { lit: C.creamLight, shade: mix(C.cream, C.tealShade, 0.4) };

/**
 * Draws the Merfolk portrait.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(8942);

	drawWater(layer);
	drawRays(layer);
	drawCity(layer, random);
	drawSeabed(layer, random);

	const figure = createCanvas(64, 64);
	drawHair(figure);
	drawTorso(figure);
	drawTail(figure);
	drawHead(figure);
	drawCrown(figure);
	outline(figure, C.ink);
	const front = createCanvas(64, 64);
	drawTridentArm(front);
	drawGripArm(front);
	drawTrident(front);
	drawFists(front);
	drawCoral(front);
	outline(front, C.ink);
	underlay(front, figure);
	underlay(scene, front);
	underlay(scene, layer);

	drawCaustics(scene);
	drawBubbles(scene, random);
	return scene;
}

/**
 * The water's colour at a row, dithered where one band gives way to the next.
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function waterAt(x, y) {
	const t = (y / 63) * (WATER.length - 1);
	const i = Math.floor(t);
	const dither = i + 1 < WATER.length && t - i > 0.6 && (x + y) % 2 === 0;
	return dither ? WATER[i + 1] : WATER[i];
}

/**
 * The sea from the rippling surface down into the deep.
 * @param {Canvas} layer
 */
function drawWater(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, waterAt(x, y));
		}
	}
	// The underside of the surface, rippling.
	for (let x = 0; x < 64; x++) {
		const y = Math.round(1 + Math.sin(x * 0.45) * 1);
		set(layer, x, y, C.dayWave);
		if (x % 5 !== 0) {
			set(layer, x, y + 1, mix(C.dayWave, C.daySea1, 0.5));
		}
	}
}

/**
 * Shafts of sunlight slanting down from the surface on the right, fading with depth.
 * @param {Canvas} layer
 */
function drawRays(layer) {
	for (let y = 0; y < 60; y++) {
		for (let x = 0; x < 64; x++) {
			const u = (x - y * 0.45 + 200) % 17;
			if (u >= 4) {
				continue;
			}
			const fade = 1 - y / 60;
			const colour = get(layer, x, y);
			if (colour) {
				set(layer, x, y, mix(colour, C.dayWave, 0.1 + 0.25 * fade));
			}
		}
	}
}

/**
 * The coral city on the seabed: towers, domes and branching coral spires round a pillared hall, its windows
 * glowing, hazy blue with distance.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCity(layer, random) {
	const city = createCanvas(64, 64);
	drawBuilding(city, { kind: 'tower', x: 0, y: 48, width: 8 });
	drawBuilding(city, { kind: 'tower', x: 53, y: 48, width: 9 });
	drawClassical(city, { x: 36, y: 49, width: 18, columns: 3, height: 9 });
	// Domes on the towers.
	for (const [cx, top, r] of [
		[3, 34, 4],
		[57, 34, 5],
	]) {
		for (let y = top - r; y <= top; y++) {
			for (let x = cx - r; x <= cx + r; x++) {
				if ((x - cx) ** 2 + (y - top) ** 2 <= r * r + 1) {
					set(city, x, y, x <= cx ? C.brickRedLight : C.brickRed);
				}
			}
		}
		rect(city, cx, top - r - 3, 1, 3, C.gold);
	}
	// Tall coral spires, each with a few branches.
	for (const [x, base, height] of [
		[16, 48, 28],
		[48, 46, 32],
		[62, 40, 30],
	]) {
		for (let y = base - height; y <= base; y++) {
			const half = Math.round(((y - base + height) / height) * 2.5);
			for (let dx = -half; dx <= half; dx++) {
				set(city, x + dx, y, dx <= 0 ? C.amber : C.lampFrame);
			}
		}
		line(city, x - 1, base - 12, x - 4, base - 17, C.amber);
		line(city, x + 1, base - 8, x + 4, base - 13, C.lampFrame);
		set(city, x, base - height - 1, C.gold);
	}
	outline(city, C.roofShade);
	// Tint it coral, haze it with the water, and light its windows.
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(city, x, y);
			if (!colour) {
				continue;
			}
			const coral = mix(colour, C.brickRedLight, 0.45);
			set(layer, x, y, mix(coral, waterAt(x, y), 0.42));
		}
	}
	for (let i = 0; i < 12; i++) {
		const x = Math.floor(random() * 64);
		const y = 26 + Math.floor(random() * 20);
		if (get(city, x, y) && get(city, x, y) !== C.roofShade) {
			set(layer, x, y, mix(C.ghostLight, C.daySea2, 0.2));
		}
	}
}

/**
 * Pale sand on the seabed, with swaying weed.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSeabed(layer, random) {
	for (let y = 49; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const sand =
				y === 49
					? C.sandLight
					: (x + y) % 5 === 0
						? C.sandShade
						: C.sand;
			set(layer, x, y, mix(sand, waterAt(x, y), 0.5 + (y - 49) * 0.02));
		}
	}
	for (let i = 0; i < 6; i++) {
		const x0 = Math.floor(random() * 64);
		const height = 6 + Math.floor(random() * 8);
		for (let j = 0; j < height; j++) {
			const x = x0 + Math.round(Math.sin(j * 0.6 + i) * 1.2);
			set(layer, x, 56 - j, mix(C.grassShade, C.daySea3, 0.4));
		}
	}
}

/**
 * Long sea-green hair floating out from his head on both sides with the swell.
 * @param {Canvas} scene
 */
function drawHair(scene) {
	for (const side of [-1, 1]) {
		for (let k = 0; k < 5; k++) {
			const length = 7 + ((k * 3) % 5);
			for (let j = 0; j <= length; j++) {
				const x =
					FACE_X + (side < 0 ? -7 : 8) + side * Math.round(j * 0.8);
				const y =
					7 +
					k * 4 +
					Math.round(j * (side < 0 ? 0.3 : -0.25)) +
					Math.round(Math.sin(j * 0.7 + k) * 1.1);
				let colour = HAIR.base;
				if (k % 2 === 0) {
					colour = side > 0 ? HAIR.lit : HAIR.dark;
				}
				set(scene, x, y, colour);
				set(scene, x, y + 1, HAIR.base);
				set(scene, x - side, y, HAIR.base);
			}
		}
	}
}

/**
 * His bare chest: broad shoulders, the chest and stomach muscles in shade lines, lit from the surface on his left.
 * @param {Canvas} scene
 */
function drawTorso(scene) {
	// The neck.
	for (let y = 23; y <= 27; y++) {
		for (let x = FACE_X - 3; x <= FACE_X + 4; x++) {
			let colour = SKIN.base;
			if (x >= FACE_X + 3) {
				colour = SKIN.lit;
			} else if (x <= FACE_X - 2 || y === 25) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let y = 27; y < WAIST; y++) {
		const half =
			y < 33
				? 7 + Math.round((y - 27) * 1.8)
				: Math.max(12, 18 - Math.round((y - 33) * 0.35));
		for (let x = FACE_X - half; x <= FACE_X + 1 + half; x++) {
			const u = (x - FACE_X - 0.5) / half;
			let colour = SKIN.base;
			if (u > 0.78) {
				colour = SKIN.lit;
			} else if (u < -0.7) {
				colour = SKIN.shade;
			}
			set(scene, x, y, colour);
		}
	}
	// The collarbones.
	line(scene, FACE_X - 8, 29, FACE_X - 2, 30, SKIN.shade);
	line(scene, FACE_X + 3, 30, FACE_X + 9, 29, SKIN.glint);
	// The chest: a shade line under each side, its top lit on the near side, and the breastbone between.
	for (let x = FACE_X - 10; x <= FACE_X + 11; x++) {
		if (x === FACE_X || x === FACE_X + 1) {
			continue;
		}
		const outer = Math.abs(x - FACE_X - 0.5) > 7;
		set(scene, x, outer ? 37 : 38, SKIN.shade);
		if (x > FACE_X + 2 && x < FACE_X + 10) {
			set(scene, x, 33, SKIN.lit);
		}
	}
	rect(scene, FACE_X, 31, 2, 7, SKIN.shade);
	// The shadow the hanging arm casts down his side.
	for (let y = 30; y < WAIST; y++) {
		const arm = FACE_X - 16 - Math.round((y - 28) * 0.15) + 4;
		set(scene, arm, y, SKIN.dark);
		set(scene, arm + 1, y, SKIN.dark);
		set(scene, arm + 2, y, SKIN.shade);
	}
	// The stomach.
	rect(scene, FACE_X, 40, 2, 10, SKIN.shade);
	for (const y of [42, 46]) {
		rect(scene, FACE_X - 4, y, 3, 1, SKIN.shade);
		rect(scene, FACE_X + 3, y, 3, 1, SKIN.shade);
	}
}

/**
 * His tail from the waist down: overlapping teal scales narrowing and curving away under a frill of fins,
 * the tail fin flaring at the bottom.
 * @param {Canvas} scene
 */
function drawTail(scene) {
	for (let y = WAIST; y < 64; y++) {
		const k = y - WAIST;
		const cx = FACE_X + 0.5 + Math.round(k * k * 0.04);
		if (y > 60) {
			// The tail fin, pale and ribbed, spreading from the narrow of the tail.
			const half = 5 + (y - 60) * 3;
			for (
				let x = Math.round(cx - half);
				x <= Math.round(cx + half);
				x++
			) {
				const u = (x - cx) / half;
				let colour = u > 0 ? C.ghost : C.ghostShade;
				if (Math.abs(u) > 0.85) {
					colour = C.ghostLight;
				} else if (Math.round(x - cx) % 3 === 0) {
					colour = mix(C.ghostShade, C.tealShade, 0.4);
				}
				set(scene, x, y, colour);
			}
			continue;
		}
		const half = 12 - Math.round(k * 0.75);
		for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
			const row = Math.floor(k / 3);
			const i = (((x + (row % 2) * 2) % 4) + 4) % 4;
			const j = k % 3;
			const u = (x - cx) / half;
			let colour = u > 0.2 ? SCALE.lit : SCALE.base;
			if (
				(j === 1 && (i === 0 || i === 3)) ||
				(j === 2 && (i === 1 || i === 2))
			) {
				colour = SCALE.rim;
			} else if (j === 0 && (i === 1 || i === 2) && u > -0.3) {
				colour = SCALE.glint;
			}
			if (u < -0.7) {
				colour = colour === SCALE.rim ? SCALE.dark : SCALE.rim;
			}
			set(scene, x, y, colour);
		}
	}
	// The frill of fins round the waist.
	for (let x = FACE_X - 13; x <= FACE_X + 14; x++) {
		const drop = (x + 1) % 3 === 0 ? 2 : 1;
		for (let y = WAIST - 1; y <= WAIST + drop; y++) {
			let colour = x > FACE_X ? C.ghost : C.ghostShade;
			if (y === WAIST - 1) {
				colour = C.ghostLight;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * His head: the face turned to the viewer, lit on his left, with a short beard along the jaw.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	for (let y = 3; y <= 22; y++) {
		for (let x = FACE_X - 9; x <= FACE_X + 10; x++) {
			const head = ((x - FACE_X - 0.5) / 8) ** 2 + ((y - 13) / 9.5) ** 2;
			if (head > 1) {
				continue;
			}
			const rim =
				((x + 1 - FACE_X - 0.5) / 8) ** 2 + ((y - 1 - 13) / 9.5) ** 2 >
				1;
			let colour = HAIR.base;
			if (rim && x > FACE_X - 2) {
				colour = HAIR.lit;
			} else if (x <= FACE_X - 6) {
				colour = HAIR.dark;
			}
			set(scene, x, y, colour);
		}
	}
	/** @type {[number, number, number][]} */
	const rows = [
		[10, -2, 3],
		[11, -3, 4],
		[12, -4, 5],
		[13, -4, 5],
		[14, -5, 6],
		[15, -5, 6],
		[16, -5, 6],
		[17, -5, 6],
		[18, -4, 5],
		[19, -4, 5],
		[20, -4, 5],
		[21, -3, 4],
		[22, -3, 4],
		[23, -2, 3],
		[24, -1, 2],
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
	// Ears like small fins: the far one in shade, the near one lit.
	paint(scene, FACE_X - 7, 14, ['.d', 'ds', 'ds', '.s'], {
		d: SKIN.dark,
		s: SKIN.shade,
	});
	paint(scene, FACE_X + 7, 14, ['g.', 'lg', 'lg', 'l.'], {
		g: SKIN.glint,
		l: SKIN.lit,
	});
	// Heavy brows, and the eyes looking out at the viewer.
	rect(scene, FACE_X - 3, 13, 3, 1, HAIR.base);
	rect(scene, FACE_X + 2, 13, 3, 1, HAIR.base);
	set(scene, FACE_X - 3, 15, EYE.shade);
	set(scene, FACE_X - 2, 15, C.ink);
	set(scene, FACE_X + 2, 15, C.ink);
	set(scene, FACE_X + 3, 15, EYE.lit);
	set(scene, FACE_X - 2, 14, SKIN.dark);
	set(scene, FACE_X + 2, 14, SKIN.shade);
	// The nose: a shade line down its dark side and a lit tip.
	rect(scene, FACE_X, 16, 1, 3, SKIN.shade);
	set(scene, FACE_X + 1, 18, SKIN.glint);
	set(scene, FACE_X, 19, SKIN.dark);
	// The short beard along the jaw and round the chin, a moustache over the mouth.
	for (const [y, from, to] of rows) {
		if (y < 19) {
			continue;
		}
		for (const dx of [from, to]) {
			set(scene, FACE_X + dx, y, dx > 0 ? HAIR.lit : HAIR.dark);
		}
		if (y >= 22) {
			for (let dx = from; dx <= to; dx++) {
				set(scene, FACE_X + dx, y, dx >= 2 ? HAIR.lit : HAIR.base);
			}
		}
	}
	rect(scene, FACE_X - 2, 20, 5, 1, HAIR.base);
	set(scene, FACE_X + 3, 20, HAIR.lit);
	rect(scene, FACE_X - 1, 21, 4, 1, C.brickRedShade);
	set(scene, FACE_X + 1, 22, mix(C.brickRed, SKIN.base, 0.4));
}

/**
 * A crown of red coral branches on his head.
 * @param {Canvas} scene
 */
function drawCrown(scene) {
	paint(
		scene,
		FACE_X - 6,
		0,
		[
			'.L.....L.....L.',
			'.Lr...LLr...Lr.',
			'LLr.L.LLr.L.LRr',
			'.LLrLRLLRrLRLRr',
			'LLLLLLLRRRRRRRr',
			'gGgGgGgGaGaGaGa',
		],
		{
			L: C.brickRedLight,
			R: C.brickRed,
			r: C.brickRedShade,
			g: C.amber,
			G: C.gold,
			a: C.lampFrame,
		}
	);
}

/**
 * The gold trident, held slanting across his body: a long shaft from his hip up past his shoulder,
 * and three barbed prongs at the top right.
 * @param {Canvas} scene
 */
function drawTrident(scene) {
	const { x: bx, y: by } = BUTT;
	for (let t = 0; t <= by - CROSS.y; t++) {
		set(scene, bx + t, by - t, C.gold);
		set(scene, bx + t + 1, by - t, C.amber);
	}
	// The crossbar, square to the shaft.
	for (let i = -3; i <= 3; i++) {
		set(scene, CROSS.x + i, CROSS.y + i, C.gold);
		set(scene, CROSS.x + i + 1, CROSS.y + i, C.amber);
	}
	// The prongs, the middle one longest, each with a barb at its tip.
	for (const [i, length] of [
		[-3, 7],
		[0, 9],
		[3, 7],
	]) {
		const x0 = CROSS.x + i;
		const y0 = CROSS.y + i;
		for (let t = 1; t <= length; t++) {
			set(scene, x0 + t, y0 - t, t >= length - 1 ? C.lampGlow : C.gold);
			set(scene, x0 + t + 1, y0 - t, C.amber);
		}
		set(scene, x0 + length - 2, y0 - length + 3, C.gold);
		set(scene, x0 + length + 1, y0 - length + 3, C.amber);
	}
}

/**
 * His right arm hanging at his side, a gold band round it, the fist round the trident's shaft at his hip.
 * @param {Canvas} scene
 */
function drawTridentArm(scene) {
	for (let y = 28; y <= 47; y++) {
		const centre = FACE_X - 16 - Math.round((y - 28) * 0.15);
		for (let x = centre - 3; x <= centre + 3; x++) {
			let colour = SKIN.base;
			if (x <= centre - 2) {
				colour = SKIN.shade;
			} else if (x >= centre + 2) {
				colour = SKIN.lit;
			}
			if (y === 33 || y === 34) {
				colour = y === 33 ? C.gold : C.amber;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * Bright coral growing in the near corners: a red branching coral by the trident and an amber sea fan.
 * @param {Canvas} scene
 */
function drawCoral(scene) {
	paint(
		scene,
		12,
		52,
		[
			'L...L....L',
			'L..LR..L.R',
			'LR.LR.LR.R',
			'.LRLR.LRRr',
			'..LLRRLRr.',
			'...LLRRr..',
			'....LRr...',
			'....LRr...',
			'...LLRrr..',
			'..LLRRRrr.',
			'.LLRRRRRrr',
			'LLRRRRRRRr',
		],
		{ L: C.brickRedLight, R: C.brickRed, r: C.brickRedShade }
	);
	paint(
		scene,
		52,
		51,
		[
			'...a.a.a...',
			'..aGaGaGa..',
			'.aGaGaGaGa.',
			'aGaGaGaGaGa',
			'.aGaGaGaGa.',
			'..aGaGaGa..',
			'...aGaGa...',
			'....aGa....',
			'.....G.....',
			'.....G.....',
			'....sss....',
			'...sssss...',
			'..sssssss..',
		],
		{ a: C.amber, G: C.gold, s: C.stoneShade }
	);
}

/**
 * Ripples of light dancing over his bare shoulders, painted after the outline.
 * @param {Canvas} scene
 */
function drawCaustics(scene) {
	for (const [x, y] of [
		[38, 28],
		[39, 28],
		[41, 29],
		[44, 30],
		[45, 30],
		[48, 31],
		[24, 30],
		[25, 30],
		[28, 29],
	]) {
		const colour = get(scene, x, y);
		if (colour && Object.values(SKIN).includes(colour)) {
			set(scene, x, y, mix(colour, C.tealLight, 0.45));
		}
	}
}

/**
 * Bubbles rising from his mouth and drifting up past the trident.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawBubbles(scene, random) {
	/** @type {[number, number, number][]} Each bubble's centre and size. */
	const bubbles = [
		[45, 20, 1],
		[47, 16, 2],
		[46, 11, 1],
		[49, 7, 2],
		[52, 3, 1],
		[18, 20, 1],
		[16, 14, 2],
		[20, 8, 1],
	];
	for (let i = 0; i < 4; i++) {
		bubbles.push([
			2 + Math.floor(random() * 60),
			6 + Math.floor(random() * 40),
			1,
		]);
	}
	for (const [cx, cy, size] of bubbles) {
		if (size === 1) {
			paint(scene, cx, cy, ['wf', 'ff'], { w: C.white, f: C.foam });
		} else {
			paint(scene, cx - 1, cy - 1, ['.ff.', 'fw.f', 'f..f', '.ff.'], {
				w: C.white,
				f: C.foam,
			});
		}
	}
}

/**
 * Paints a limb between two points as a round-ended band, shaded across its width.
 * @param {Canvas} scene
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - Half its width
 * @param {string[]} tones - Colours from one edge to the other
 */
function limb(scene, x0, y0, x1, y1, r, tones) {
	const length = Math.hypot(x1 - x0, y1 - y0);
	const nx = -(y1 - y0) / length;
	const ny = (x1 - x0) / length;
	for (let y = Math.min(y0, y1) - r; y <= Math.max(y0, y1) + r; y++) {
		for (let x = Math.min(x0, x1) - r; x <= Math.max(x0, x1) + r; x++) {
			const t = Math.max(
				0,
				Math.min(
					1,
					((x - x0) * (x1 - x0) + (y - y0) * (y1 - y0)) / length ** 2
				)
			);
			const px = x0 + (x1 - x0) * t;
			const py = y0 + (y1 - y0) * t;
			if (Math.hypot(x - px, y - py) > r + 0.3) {
				continue;
			}
			const across = ((x - px) * nx + (y - py) * ny) / (r + 0.3);
			const k = Math.min(
				tones.length - 1,
				Math.floor(((across + 1) / 2) * tones.length)
			);
			set(scene, x, y, tones[k]);
		}
	}
}

/**
 * His left arm bent across his chest, the fist round the trident's shaft below his collarbone.
 * @param {Canvas} scene
 */
function drawGripArm(scene) {
	limb(scene, FACE_X + 17, 31, FACE_X + 20, 42, 3, [
		SKIN.base,
		SKIN.lit,
		SKIN.lit,
		SKIN.glint,
	]);
	limb(scene, FACE_X + 19, 42, FACE_X + 6, 35, 3, [
		SKIN.shade,
		SKIN.base,
		SKIN.lit,
		SKIN.glint,
	]);
}

/**
 * His fists round the shaft, painted over it: the left high on his chest, the right low at his hip.
 * @param {Canvas} scene
 */
function drawFists(scene) {
	const fist = ['.lll.', 'lllll', 'bllll', 'bbllg', '.bbg.'];
	paint(scene, FACE_X - 3, 29, fist, {
		b: SKIN.base,
		l: SKIN.lit,
		g: SKIN.glint,
	});
	paint(
		scene,
		FACE_X - 21,
		44,
		['.sbb.', 'sbbbl', 'sbbbl', 'sbbll', '.sbl.'],
		{
			s: SKIN.shade,
			b: SKIN.base,
			l: SKIN.lit,
		}
	);
}
