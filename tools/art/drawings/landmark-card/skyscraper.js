// Skyscraper: an ironworker in a yellow hard hat balanced on a high red steel girder, reaching up with a tin cone to catch a red-hot rivet, the city's streets tiny far below running off into the blue morning haze, and a steel column rising beside him.
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
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A figure's or a beam's tones, from the side facing the sun to the side turned away.
 * @typedef {{ lit: Colour, base: Colour, shade: Colour }} Tones
 */

/** The horizon, where the city far below fades into the haze. */
const HORIZON = 25;

/** The point on the horizon the avenues run up to, and how fast they spread apart as they come down towards us. */
const VANISH = { x: 15, y: HORIZON };
const SPREAD = 0.38;

/** The rows of the cross streets, closer together towards the horizon. */
const CROSS_STREETS = [28, 30, 33, 36, 40, 45, 51, 58];

/** The girder he stands on: the top of its upper flange, and the bottom of its lower flange. */
const GIRDER = { top: 47, bottom: 54, end: 48 };

/** The column rising beside him, by its flange face's columns. */
const COLUMN = { left: 49, right: 58 };

/** The sun stands high to the upper left: tones turn lit on the side facing it. */
const SUN = { x: -0.6, y: -0.8 };

/** The rivet in flight, and the cone held up to catch it: its tip in his glove, the centre of its mouth, and the mouth's half-width and depth. */
const RIVET = { x: 7, y: 4 };
const CONE = {
	tip: { x: 18, y: 16 },
	mouth: { x: 12, y: 10 },
	half: 4.2,
	lip: 1.8,
};

/** The blue haze the far city sinks into: how much of it lies over each band of rows, from the horizon down. */
const HAZE = mix(C.daySky5, C.daySky6, 0.4);
const HAZE_BANDS = [
	{ until: 29, t: 0.75 },
	{ until: 34, t: 0.55 },
	{ until: 41, t: 0.32 },
	{ until: 64, t: 0.1 },
];

/** The city before the haze: sunlit rooftops, the shaded faces of the buildings, and the dark streets between them. */
const ROOFS = [
	C.stoneLight,
	mix(C.plaster, C.stoneLight, 0.5),
	mix(C.brickRedLight, C.stone, 0.55),
];
const FACE = C.stoneMid;
const PARK = C.grass;
const STREET = mix(C.stoneShade, C.night, 0.35);

/** The steel's red-lead primer, lit to shaded. */
const OXIDE_GLINT = mix(C.brickRedLight, C.sand, 0.4);
const OXIDE_LIGHT = mix(C.brickRedLight, C.brickRed, 0.45);
const OXIDE = mix(C.brickRed, C.timber, 0.45);
const OXIDE_SHADE = mix(C.brickRedShade, C.timber, 0.35);
const OXIDE_DARK = mix(C.brickRedShade, C.wood, 0.6);

/** The ironworker: skin, a white vest, denim, leather and a yellow hard hat. */
const SKIN = {
	lit: mix(C.skinTan, C.sand, 0.3),
	base: C.skinTan,
	shade: C.skinTanShade,
};
const VEST = { lit: C.white, base: C.creamLight, shade: C.creamShade };
const DENIM = {
	lit: mix(C.daySky2, C.night, 0.25),
	base: mix(C.daySky1, C.night, 0.5),
	shade: mix(C.daySky1, C.ink, 0.72),
};
const GLOVE = { lit: C.sand, base: C.sandShade, shade: C.timberLight };
const BOOT = { lit: C.timber, base: C.timberShade, shade: C.wood };
const HAT = { lit: C.lampGlow, base: C.gold, shade: C.amber };
const HAIR = C.wood;

/** The tin cone: bright tin, its dark inside and its rolled rim. */
const TIN = { lit: C.stone, base: C.stoneMid, shade: C.stoneShade };
const TIN_RIM = C.stoneLight;
const TIN_INSIDE = mix(C.night, C.ink, 0.3);

/** The red-hot rivet and the sparks of its trail, from hottest to coolest. */
const HOT = [C.white, C.lampGlow, C.gold, C.amber, C.brickRedLight];

/**
 * Draws the Skyscraper landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1945);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawCity(layer, random);
	drawWisps(layer);

	drawColumn(scene);
	drawGirder(scene);
	drawWorker(scene);
	drawCone(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawRivet(scene);
	return scene;
}

/**
 * The city far below: dark avenues running up to the vanishing point, each block a sunlit rooftop with its
 * buildings' shaded faces showing, a park, a few cars, and the blue haze growing thicker towards the horizon.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawCity(layer, random) {
	for (let y = HORIZON + 1; y < 64; y++) {
		const near = y - HORIZON;
		const unit = near * SPREAD;
		const row = CROSS_STREETS.filter((street) => street <= y).length;
		const crossing = CROSS_STREETS.includes(y);
		const haze = HAZE_BANDS.find(({ until }) => y < until)?.t ?? 0;
		for (let x = 0; x < 64; x++) {
			const across = (x - VANISH.x) / unit;
			const column = Math.floor(across);
			const into = (across - column) * unit;
			let colour = ROOFS[wrap(column * 2 + row, ROOFS.length)];
			if (wrap(column * 5 + row * 3, 13) === 4) {
				colour = PARK;
			}
			// The avenues stay unbroken dark lines, so they lead the eye down the drop; the cross streets
			// show only as the shaded fronts of the blocks, and near blocks show the face turned to the avenue.
			const width = Math.max(1, unit * 0.14);
			const side = across < 0 ? into >= unit - 1 : into < width + 1;
			if (unit >= 1.6 && into < width) {
				colour = STREET;
			} else if ((crossing || (unit >= 5 && side)) && colour !== PARK) {
				colour = FACE;
			}
			set(layer, x, y, mix(colour, HAZE, haze));
		}
	}
	// Tiny rooftop huts and water tanks on the near blocks, each with its shadow.
	const roofs = new Set(ROOFS.map((roof) => mix(roof, HAZE, 0.1)));
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 63);
		const y = 42 + Math.floor(random() * 21);
		if (
			roofs.has(get(layer, x, y) ?? '') &&
			roofs.has(get(layer, x + 1, y + 1) ?? '')
		) {
			set(layer, x, y, mix(C.white, HAZE, 0.1));
			set(layer, x + 1, y, mix(FACE, HAZE, 0.1));
			set(layer, x + 1, y + 1, mix(STREET, HAZE, 0.1));
		}
	}
	// Cars on the near streets: bright specks in the dark canyons.
	const street = mix(STREET, HAZE, 0.1);
	for (let i = 0; i < 70; i++) {
		const x = Math.floor(random() * 64);
		const y = 42 + Math.floor(random() * 22);
		if (get(layer, x, y) === street) {
			set(layer, x, y, [C.brickRedLight, C.gold, C.white][i % 3]);
		}
	}
	// The haze lies thickest along the horizon.
	rect(layer, 0, HORIZON, 64, 1, HAZE);
}

/**
 * Wraps a whole number into 0 to n - 1, for negative numbers too.
 * @param {number} i
 * @param {number} n
 * @returns {number}
 */
function wrap(i, n) {
	return ((i % n) + n) % n;
}

/**
 * Wisps of cloud drifting between him and the city, far below his feet.
 * @param {Canvas} layer
 */
function drawWisps(layer) {
	for (const { x, y, w } of [
		{ x: -4, y: 33, w: 22 },
		{ x: 52, y: 37, w: 16 },
		{ x: 6, y: 58, w: 14 },
	]) {
		for (let i = 0; i < w; i++) {
			const thick = i > 2 && i < w - 3;
			set(layer, x + i, y, C.white);
			if (thick) {
				set(layer, x + i + 1, y + 1, C.cloudShade);
			}
			if (i > w / 3 && i < (w * 2) / 3) {
				set(layer, x + i, y - 1, C.cloudShade);
			}
		}
	}
}

/**
 * Picks a tone for a point by how much it faces the sun.
 * @param {Tones} tones
 * @param {number} facing - From -1 (turned away) to 1 (facing the sun)
 * @returns {Colour}
 */
function tone(tones, facing) {
	if (facing > 0.35) {
		return tones.lit;
	}
	if (facing < -0.35) {
		return tones.shade;
	}
	return tones.base;
}

/**
 * Paints a rounded limb between two points, shaded across its width by the sun.
 * @param {Canvas} canvas
 * @param {number} x0
 * @param {number} y0
 * @param {number} x1
 * @param {number} y1
 * @param {number} r - Half its thickness
 * @param {Tones} tones
 */
function limb(canvas, x0, y0, x1, y1, r, tones) {
	const dx = x1 - x0;
	const dy = y1 - y0;
	const length = dx * dx + dy * dy || 1;
	for (
		let y = Math.floor(Math.min(y0, y1) - r);
		y <= Math.ceil(Math.max(y0, y1) + r);
		y++
	) {
		for (
			let x = Math.floor(Math.min(x0, x1) - r);
			x <= Math.ceil(Math.max(x0, x1) + r);
			x++
		) {
			const t = Math.max(
				0,
				Math.min(1, ((x - x0) * dx + (y - y0) * dy) / length)
			);
			const ox = x - (x0 + dx * t);
			const oy = y - (y0 + dy * t);
			const d = Math.hypot(ox, oy);
			if (d > r + 0.25) {
				continue;
			}
			set(
				canvas,
				x,
				y,
				tone(tones, ((ox * SUN.x + oy * SUN.y) / r) * 1.1)
			);
		}
	}
}

/**
 * The column rising beside him: the face of a riveted steel flange, with a splice plate and the girder's seat.
 * @param {Canvas} scene
 */
function drawColumn(scene) {
	const { left, right } = COLUMN;
	for (let y = 0; y < 64; y++) {
		for (let x = left; x <= right; x++) {
			let colour = OXIDE;
			if (x === left) {
				colour = OXIDE_GLINT;
			} else if (x === left + 1) {
				colour = OXIDE_LIGHT;
			} else if (x >= right - 1) {
				colour = OXIDE_SHADE;
			}
			set(scene, x, y, colour);
		}
		// The web, seen past the flange's shaded edge.
		set(scene, right + 1, y, OXIDE_DARK);
		set(scene, right + 2, y, OXIDE_SHADE);
	}
	// The splice plate, standing proud of the flange, with two rows of rivets.
	rect(scene, left - 1, 13, right - left + 3, 9, OXIDE);
	rect(scene, left - 1, 13, right - left + 3, 1, OXIDE_GLINT);
	rect(scene, left - 1, 14, 1, 7, OXIDE_LIGHT);
	rect(scene, left - 1, 21, right - left + 3, 1, OXIDE_DARK);
	for (const y of [15, 19]) {
		for (let x = left + 1; x <= right - 1; x += 3) {
			rivet(scene, x, y);
		}
	}
	// Rivets down both edges of the flange.
	for (let y = 2; y < 64; y += 4) {
		if (y > 11 && y < 23) {
			continue;
		}
		rivet(scene, left + 2, y);
		rivet(scene, right - 2, y);
	}
}

/**
 * One rivet head: a lit dome over its shadow.
 * @param {Canvas} scene
 * @param {number} x
 * @param {number} y
 */
function rivet(scene, x, y) {
	set(scene, x, y, OXIDE_GLINT);
	set(scene, x + 1, y, OXIDE_LIGHT);
	set(scene, x, y + 1, OXIDE_DARK);
	set(scene, x + 1, y + 1, OXIDE_DARK);
}

/**
 * The girder he stands on: an I-beam seen from the side, its top flange lit by the sun,
 * the web in the flange's shadow, rows of rivets and the angle that seats it on the column.
 * @param {Canvas} scene
 */
function drawGirder(scene) {
	const { top, bottom, end } = GIRDER;
	for (let x = 0; x < end; x++) {
		set(scene, x, top, OXIDE_GLINT);
		set(scene, x, top + 1, OXIDE_LIGHT);
		set(scene, x, top + 2, OXIDE_DARK);
		for (let y = top + 3; y < bottom - 2; y++) {
			set(scene, x, y, OXIDE_SHADE);
		}
		set(scene, x, bottom - 2, OXIDE_DARK);
		set(scene, x, bottom - 1, OXIDE);
		set(scene, x, bottom, OXIDE_SHADE);
	}
	for (let x = 2; x < end - 2; x += 4) {
		rivet(scene, x, top + 3);
	}
	// The seat angle that carries the girder's end on the column.
	rect(scene, end - 4, top + 2, 4, bottom - top - 1, OXIDE);
	rect(scene, end - 4, top + 2, 1, bottom - top - 1, OXIDE_LIGHT);
	rivet(scene, end - 3, top + 3);
}

/**
 * The ironworker: boots set on the flange, one hand gripping the column, the other raising the cone,
 * his face turned up to the rivet coming in.
 * @param {Canvas} scene
 */
function drawWorker(scene) {
	// The legs, the back one braced out towards the column.
	limb(scene, 33, 33, 36, 44, 2.2, DENIM);
	limb(scene, 29, 33, 28, 44, 2.3, DENIM);
	// The boots on the flange, toes pointing along the girder.
	paint(scene, 24, 43, ['..oooO', '.ooooo', 'Oooooo', 'ssssss'], {
		O: BOOT.lit,
		o: BOOT.base,
		s: BOOT.shade,
	});
	paint(scene, 34, 43, ['Ooo...', 'oooo..', 'oooooo', 'ssssss'], {
		O: BOOT.lit,
		o: BOOT.base,
		s: BOOT.shade,
	});
	// The torso in its vest.
	for (let y = 20; y <= 32; y++) {
		const left = y < 22 ? 26 + (21 - y) : 26 + Math.floor((y - 22) / 6);
		const right = y < 22 ? 36 - (21 - y) : 36 - Math.floor((y - 22) / 8);
		for (let x = left; x <= right; x++) {
			const across = (x - left) / Math.max(1, right - left);
			set(scene, x, y, tone(VEST, 0.9 - across * 2.1));
		}
	}
	// Creases where the vest pulls across his chest towards the raised arm.
	set(scene, 29, 24, VEST.shade);
	set(scene, 30, 25, VEST.shade);
	set(scene, 31, 27, VEST.base);
	// The belt, its buckle and the spud wrench hanging at his hip.
	rect(scene, 27, 31, 10, 2, BOOT.lit);
	rect(scene, 27, 32, 10, 1, BOOT.base);
	set(scene, 29, 31, C.brass);
	set(scene, 29, 32, C.amber);
	rect(scene, 37, 31, 1, 8, C.stoneMid);
	set(scene, 37, 31, C.stoneLight);
	rect(scene, 36, 30, 3, 1, C.stone);
	// The arm reaching to the column: a sleeve, a bare forearm and a glove on the steel.
	limb(scene, 36, 22, 40, 24, 1.6, VEST);
	limb(scene, 41, 24, 45, 25, 1.4, SKIN);
	paint(scene, 46, 23, ['gg..', 'ggg.', 'Ggg.'], {
		g: GLOVE.base,
		G: GLOVE.shade,
	});
	// The arm raised to catch: the sleeve, the forearm turned up and the glove round the cone.
	limb(scene, 26, 22, 22, 22, 1.6, VEST);
	limb(scene, 21, 22, 19, 17, 1.4, SKIN);
	drawHead(scene);
}

/**
 * His head: a yellow hard hat with a jutting brim, and a face turned up to the left.
 * @param {Canvas} scene
 */
function drawHead(scene) {
	paint(
		scene,
		23,
		9,
		[
			'.....LLhhh...',
			'....LLhhhhha.',
			'...LhhhhhhhaA',
			'...hhLhhhhhaA',
			'hhhhhhhhhhaaA',
			'..ffkkkkkkkHH',
			'..SSessskkkHH',
			'.SSSsssskksHH',
			'..ksssssssskH',
			'...sssssssk..',
			'.....kssskk..',
		],
		{
			L: HAT.lit,
			h: HAT.base,
			a: HAT.shade,
			A: C.lampFrame,
			f: C.lampFrame,
			S: SKIN.lit,
			s: SKIN.base,
			k: SKIN.shade,
			e: C.wood,
			H: HAIR,
		}
	);
	// His mouth, set firm.
	set(scene, 25, 17, SKIN.shade);
}

/**
 * The tin cone: a long funnel held by its tip in his glove, its wide mouth turned up to the rivet, open towards us.
 * @param {Canvas} scene
 */
function drawCone(scene) {
	const { tip, mouth, half, lip } = CONE;
	const ax = mouth.x - tip.x;
	const ay = mouth.y - tip.y;
	const length = Math.hypot(ax, ay);
	const ux = ax / length;
	const uy = ay / length;
	for (let y = mouth.y - 7; y <= tip.y + 2; y++) {
		for (let x = mouth.x - 7; x <= tip.x + 2; x++) {
			const along = (x - tip.x) * ux + (y - tip.y) * uy;
			const across = (x - tip.x) * -uy + (y - tip.y) * ux;
			// The mouth: an ellipse across the cone's end, its rolled rim round the dark inside.
			const rim = Math.hypot((along - length) / lip, across / half);
			if (rim <= 1.05) {
				set(scene, x, y, rim > 0.78 ? TIN_RIM : TIN_INSIDE);
				continue;
			}
			if (along < 0 || along > length) {
				continue;
			}
			const width = 0.8 + (half - 0.8) * (along / length);
			if (Math.abs(across) <= width) {
				set(scene, x, y, tone(TIN, (-across / width) * 1.1));
			}
		}
	}
	// The glove wrapped round the cone's tip.
	paint(scene, tip.x - 1, tip.y - 1, ['.gg', 'ggg', 'Ggg', '.G.'], {
		g: GLOVE.base,
		G: GLOVE.shade,
	});
	set(scene, tip.x - 1, tip.y, GLOVE.lit);
}

/**
 * The red-hot rivet, the glow round it and the sparks of the arc it flew in on from the heater's forge, off to the left.
 * @param {Canvas} scene
 */
function drawRivet(scene) {
	glow(scene, {
		x: RIVET.x,
		y: RIVET.y,
		radius: 7,
		colour: C.amber,
		strength: 0.5,
		steps: 2,
		skip: [C.ink, ...HOT],
	});
	// The trail: a short hot streak behind it, then sparks cooling as they fall back along the arc.
	for (let x = 0; x < RIVET.x - 1; x++) {
		const behind = RIVET.x - 1 - x;
		const y = Math.round(RIVET.y - 1 - behind * 0.35);
		if (behind < 3 || x % 2 === 1) {
			set(scene, x, y, HOT[Math.min(4, behind + 1)]);
		}
	}
	paint(scene, RIVET.x - 1, RIVET.y - 1, ['.ga.', 'gwla', 'alga', '.aa.'], {
		w: HOT[0],
		l: HOT[1],
		g: HOT[2],
		a: HOT[3],
	});
}
