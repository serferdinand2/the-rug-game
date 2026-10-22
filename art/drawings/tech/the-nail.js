// The Nail: a claw hammer striking an iron nail into a thick plank under a clear day sky, a few nails lying beside it.
import {
	createCanvas,
	set,
	rect,
	line,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sun, high on the left. */
const SUN = { x: 9, y: 8, r: 4 };

/** The plank: its top face recedes from `front` back to `top`, and its front face runs down to `bottom`. */
const PLANK = { top: 40, front: 54, bottom: 60 };

/** The nail being driven: its centre column, the row its head sits on and the row it enters the wood. */
const NAIL = { x: 25, head: 30, entry: 47 };

/** The iron of the nails: warmer and darker than the hammer's steel. */
const IRON_LIGHT = mix(C.stone, C.timberLight, 0.3);
const IRON = mix(C.stoneShade, C.timber, 0.3);
const IRON_SHADE = mix(C.stoneShade, C.ink, 0.45);

/** The edge of the plank where the top face turns down, catching the sun. */
const PLANK_EDGE = mix(C.timberLight, C.sandLight, 0.5);

/** The far hills, hazy blue-green. */
const FAR_HILL = mix(C.grassShade, C.daySky4, 0.55);

/** The ground's shadow under the plank. */
const GROUND_SHADOW = mix(C.grassShade, C.ink, 0.35);

/**
 * Draws The Nail tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1858);

	drawSky(layer);
	drawCloud(layer, 48, 26);
	drawHills(layer);
	glow(layer, {
		x: SUN.x,
		y: SUN.y,
		radius: 22,
		colour: C.lampGlow,
		strength: 0.4,
		steps: 4,
	});
	drawSun(layer);

	drawPlank(scene, random);
	const tools = createCanvas(64, 64);
	drawLyingNails(tools);
	drawNail(tools);
	drawHammer(tools);
	outline(tools, C.ink);
	stamp(scene, tools);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawImpact(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} canvas - Changed in place
 * @param {Canvas} part - The same size
 */
function stamp(canvas, part) {
	for (let i = 0; i < part.p.length; i++) {
		if (part.p[i]) {
			canvas.p[i] = part.p[i];
		}
	}
}

/**
 * A plain day sky in six flat bands, darkest at the top.
 * @param {Canvas} layer
 */
function drawSky(layer) {
	const ramp = [
		C.daySky1,
		C.daySky2,
		C.daySky3,
		C.daySky4,
		C.daySky5,
		C.daySky6,
	];
	for (let y = 0; y < 64; y++) {
		const band = Math.min(ramp.length - 1, Math.floor(y / 6));
		rect(layer, 0, y, 64, 1, ramp[band]);
	}
}

/**
 * One soft flat cloud with a shaded underside.
 * @param {Canvas} layer
 * @param {number} cx - Centre column
 * @param {number} cy - Bottom row
 */
function drawCloud(layer, cx, cy) {
	for (const [dx, dy, r] of [
		[-6, 0, 2.5],
		[-1, -2, 3.5],
		[5, -1, 3],
		[9, 0, 2],
	]) {
		for (let y = cy + dy - 4; y <= cy; y++) {
			for (let x = cx + dx - 4; x <= cx + dx + 4; x++) {
				if (Math.hypot(x - cx - dx, y - cy - dy) <= r) {
					set(layer, x, y, y >= cy - 1 ? C.cloudShade : C.white);
				}
			}
		}
	}
}

/**
 * Hazy far hills, low green hills along the horizon and the meadow below them.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const far = Math.round(31 + Math.sin(x / 6 + 2) * 1.5);
		rect(layer, x, far, 1, 6, FAR_HILL);
	}
	for (let x = 0; x < 64; x++) {
		const top = Math.round(
			34 + Math.sin(x / 9 + 1) * 1.6 + Math.sin(x / 4) * 0.5
		);
		set(layer, x, top, C.grassLight);
		for (let y = top + 1; y < 64; y++) {
			set(layer, x, y, y > 37 ? C.grassShade : C.grass);
		}
	}
	rect(layer, 0, PLANK.bottom + 2, 64, 2, GROUND_SHADOW);
}

/**
 * The sun: a pale disc with a bright core, painted after the glow.
 * @param {Canvas} layer
 */
function drawSun(layer) {
	for (let y = SUN.y - SUN.r; y <= SUN.y + SUN.r; y++) {
		for (let x = SUN.x - SUN.r; x <= SUN.x + SUN.r; x++) {
			const d = Math.hypot(x - SUN.x, y - SUN.y);
			if (d < SUN.r - 1.2) {
				set(layer, x, y, C.white);
			} else if (d < SUN.r) {
				set(layer, x, y, C.lampGlow);
			}
		}
	}
}

/**
 * The plank across the frame: its sunlit top face with a few grain lines and a knot, and its shaded front face.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawPlank(scene, random) {
	rect(scene, 0, PLANK.top, 64, PLANK.front - PLANK.top, C.timberLight);
	rect(scene, 0, PLANK.front, 64, 1, PLANK_EDGE);
	rect(scene, 0, PLANK.front + 1, 64, PLANK.bottom - PLANK.front, C.timber);
	rect(scene, 0, PLANK.bottom, 64, 1, C.timberShade);
	// Grain: a few long wavy lines on the top face, broken here and there.
	for (const [row, phase] of [
		[42, 0],
		[46, 2],
		[50, 4],
		[52, 1],
	]) {
		for (let x = 0; x < 64; x++) {
			if (random() < 0.12) {
				continue;
			}
			const y = Math.round(row + Math.sin(x / 7 + phase) * 0.8);
			set(scene, x, y, C.timber);
		}
	}
	// Grain on the front face.
	for (let x = 0; x < 64; x++) {
		if ((x + 5) % 19 < 13) {
			set(
				scene,
				x,
				Math.round(57 + Math.sin(x / 6) * 0.7),
				C.timberShade
			);
		}
	}
	// A knot on the top face, right of the nail.
	for (let y = 43; y <= 48; y++) {
		for (let x = 45; x <= 55; x++) {
			const e = ((x - 50) / 4) ** 2 + ((y - 45.5) / 2) ** 2;
			if (e < 0.15) {
				set(scene, x, y, C.timberShade);
			} else if (e < 1) {
				set(scene, x, y, C.timber);
			}
		}
	}
	// The nail's shadow, cast forward and to the right of where it enters.
	line(scene, NAIL.x + 1, NAIL.entry, NAIL.x + 6, NAIL.entry + 3, C.timber);
	line(scene, NAIL.x + 2, NAIL.entry, NAIL.x + 7, NAIL.entry + 3, C.timber);
}

/**
 * The nail being driven: a broad flat head and a square shank going into the wood, lit from the left.
 * @param {Canvas} tools
 */
function drawNail(tools) {
	const { x, head, entry } = NAIL;
	rect(tools, x - 5, head, 11, 1, IRON_LIGHT);
	rect(tools, x - 5, head + 1, 11, 1, IRON);
	set(tools, x + 5, head + 1, IRON_SHADE);
	for (let y = head + 2; y < entry; y++) {
		set(tools, x - 1, y, IRON_LIGHT);
		set(tools, x, y, IRON);
		set(tools, x + 1, y, IRON_SHADE);
	}
}

/**
 * A few spare nails lying on the plank, each with its own outline so it stands off the wood.
 * @param {Canvas} tools
 */
function drawLyingNails(tools) {
	/**
	 * One nail lying flat: a head and a two-pixel shank running left or right.
	 * @param {number} hx - The head's column
	 * @param {number} hy - The shank's upper row at the head
	 * @param {number} length
	 * @param {1 | -1} dir - Which way the point lies
	 * @param {number} drop - How many rows the shank falls over its length
	 */
	const nail = (hx, hy, length, dir, drop) => {
		for (let k = 1; k <= length; k++) {
			const x = hx + dir * k;
			const y = hy + Math.round((drop * k) / length);
			set(tools, x, y, IRON_LIGHT);
			if (k < length) {
				set(tools, x, y + 1, IRON_SHADE);
			}
		}
		rect(tools, hx, hy - 1, 1, 4, IRON);
		set(tools, hx, hy - 1, IRON_LIGHT);
	};
	nail(3, 49, 10, 1, -1);
	nail(11, 43, 8, 1, 1);
	nail(57, 50, 10, -1, 1);
}

/**
 * The claw hammer at the moment of the blow: its steel head upright over the nail and its hickory handle running out to the right.
 * @param {Canvas} tools
 */
function drawHammer(tools) {
	// The handle, entering the eye of the head and running off the frame.
	for (let x = 30; x < 64; x++) {
		const rise = x > 44 ? Math.round((x - 44) / 10) : 0;
		const flare = x > 56 ? 1 : 0;
		const top = 10 - rise - flare;
		const bottom = 14 - rise;
		for (let y = top; y <= bottom; y++) {
			let colour = C.sand;
			if (y === top) {
				colour = C.sandLight;
			} else if (y === bottom) {
				colour = C.sandShade;
			}
			set(tools, x, y, colour);
		}
	}
	// The head's body: the eye, the neck and the round poll, shaded by column from the sunlit left.
	/** @type {[number, number, number][]} Row, first and last column. */
	const rows = [];
	for (let y = 9; y <= 14; y++) {
		rows.push([y, 20, 30]);
	}
	for (let y = 15; y <= 19; y++) {
		rows.push([y, 21, 29]);
	}
	rows.push([20, 21, 29]);
	for (let y = 21; y <= 27; y++) {
		rows.push([y, 19, 31]);
	}
	rows.push([28, 21, 29]);
	for (const [y, left, right] of rows) {
		for (let x = left; x <= right; x++) {
			let colour = C.stoneMid;
			if (x <= left + 1) {
				colour = C.stoneLight;
			} else if (x >= right - 2) {
				colour = C.stoneShade;
			}
			set(tools, x, y, colour);
		}
	}
	// A bright band where the poll's round face catches the sun, and the shaded face that strikes.
	for (let y = 21; y <= 27; y++) {
		set(tools, 22, y, C.white);
	}
	rect(tools, 21, 28, 9, 1, C.stoneShade);
	// The claw: a tapering horn curving over towards the handle.
	const pivot = { x: 31, y: 11 };
	for (let y = 0; y <= 12; y++) {
		for (let x = 20; x <= 40; x++) {
			const d = Math.hypot(x - pivot.x, y - pivot.y);
			let angle = (Math.atan2(y - pivot.y, x - pivot.x) * 180) / Math.PI;
			if (angle < 0) {
				angle += 360;
			}
			if (angle < 180 || angle > 322) {
				continue;
			}
			const taper = Math.max(0, angle - 260) / 62;
			const outer = 10 - taper * 3.5;
			const inner = 5 + taper * 1.5;
			if (d > outer || d < inner) {
				continue;
			}
			let colour = C.stoneMid;
			if (d > outer - 1.5 && angle < 290) {
				colour = C.stoneLight;
			} else if (d < inner + 1.2) {
				colour = C.stoneShade;
			}
			set(tools, x, y, colour);
		}
	}
	// The wedge in the eye, where the handle shows through the head.
	rect(tools, 25, 11, 2, 2, C.sandShade);
}

/**
 * Sparks where the steel meets the nail's head, painted over the outline.
 * @param {Canvas} scene
 */
function drawImpact(scene) {
	/** @type {[number, number, Colour][]} */
	const sparks = [
		[18, 30, C.white],
		[17, 30, C.white],
		[15, 30, C.gold],
		[17, 28, C.gold],
		[16, 27, C.white],
		[17, 32, C.gold],
		[32, 30, C.white],
		[33, 30, C.white],
		[35, 30, C.gold],
		[33, 28, C.gold],
		[34, 27, C.white],
		[33, 32, C.gold],
	];
	for (const [x, y, colour] of sparks) {
		set(scene, x, y, colour);
	}
}
