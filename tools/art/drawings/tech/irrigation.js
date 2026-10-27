// Irrigation: a great wooden water wheel lifting clay pots from a river and tipping them into a raised channel that runs off into shining green fields.
import {
	createCanvas,
	get,
	set,
	rect,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { glow } from '../../effects.js';
import { drawSky } from '../../parts/sky.js';
import { drawSea } from '../../parts/sea.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The wheel's hub, the outside of its rim and the radius its pots hang at. */
const WHEEL = { x: 24, y: 31, r: 20, pots: 22 };

/** The horizon, the river bank and the river's surface. */
const HORIZON = 20;
const BANK = 45;
const RIVER = 49;

/** The raised channel: where it leaves the wheel and where it meets the fields far off. */
const CHANNEL = { x0: 34, y0: 13, x1: 63, y1: 26, deep0: 6, deep1: 3 };

/** Fired clay for the pots: lit, mid and shaded. */
const CLAY_LIGHT = mix(C.brickRedLight, C.sand, 0.45);
const CLAY = mix(C.brickRed, C.sandShade, 0.45);
const CLAY_SHADE = mix(C.brickRedShade, C.timber, 0.4);

/** The far hills, hazy in the heat, and the river bank's mud. */
const HILL = mix(C.grassShade, C.daySky5, 0.45);
const HILL_FAR = mix(C.grass, C.daySky6, 0.6);
const MUD = mix(C.sandShade, C.timber, 0.35);

/**
 * Draws the Irrigation tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const back = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3907);

	drawSky(layer, { time: 'day', horizon: HORIZON, random });
	drawHills(layer);
	drawFields(layer, random);
	drawBank(layer, random);
	drawSea(layer, { time: 'day', top: RIVER, random, waves: 34 });

	// The channel and its trestles stand behind the wheel, outlined on their own.
	drawChannel(back);
	outline(back, C.ink);
	underlay(back, layer);

	drawWheel(scene);
	drawPots(scene);
	outline(scene, C.ink);
	const wheelMask = scene.p.map(Boolean);
	underlay(scene, back);

	drawPour(scene);
	sink(scene, wheelMask);
	drawSplash(scene, random);
	glow(scene, {
		x: 63,
		y: 0,
		radius: 40,
		colour: C.lampGlow,
		strength: 0.2,
		steps: 3,
		skip: [C.ink],
	});
	return scene;
}

/**
 * Two bands of low hills along the horizon, the nearer one darker.
 * @param {Canvas} layer
 */
function drawHills(layer) {
	for (let x = 0; x < 64; x++) {
		const far = Math.round(HORIZON - 4 - Math.sin(x / 7 + 1) * 2);
		const near = Math.round(HORIZON - 1 - Math.sin(x / 5 + 3) * 1.5);
		for (let y = far; y <= HORIZON; y++) {
			set(layer, x, y, y >= near ? HILL : HILL_FAR);
		}
	}
}

/**
 * The fields from the horizon to the bank: rows of green crops, wider as they come closer,
 * with water shining in the furrows between them.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawFields(layer, random) {
	const furrows = [22, 24, 27, 31, 36, 42];
	for (let y = HORIZON + 1; y < BANK; y++) {
		for (let x = 0; x < 64; x++) {
			let colour = y % 2 === 0 ? C.grass : C.grassLight;
			if (furrows.includes(y)) {
				colour = C.daySea1;
			} else if (furrows.includes(y + 1)) {
				colour = C.grassShade;
			}
			set(layer, x, y, colour);
		}
	}
	// Leaves catching the sun, and the sky glinting on the water.
	for (let i = 0; i < 90; i++) {
		const x = Math.floor(random() * 64);
		const y = HORIZON + 1 + Math.floor(random() * (BANK - HORIZON - 1));
		const colour = get(layer, x, y);
		if (colour === C.daySea1) {
			set(layer, x, y, C.dayWave);
		} else if (colour === C.grass) {
			set(layer, x, y, C.grassLight);
		} else if (colour === C.grassLight) {
			set(layer, x, y, C.forestFloorLight);
		}
	}
}

/**
 * The river bank: a strip of mud with tufts of grass along its top.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBank(layer, random) {
	for (let y = BANK; y < RIVER; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				y === BANK ? C.grassShade : y === RIVER - 1 ? C.timber : MUD
			);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		set(layer, x, BANK - 1, C.grassShade);
		set(layer, x, BANK + 1, C.grassShade);
	}
}

/**
 * The raised channel: an open timber trough on trestles, running from beside the wheel's top
 * off into the fields, shallower and thinner as it goes, with water in it.
 * @param {Canvas} back
 */
function drawChannel(back) {
	const { x0, y0, x1, y1, deep0, deep1 } = CHANNEL;
	/**
	 * The channel's top row and depth at a column.
	 * @param {number} x
	 * @returns {{ top: number, deep: number }}
	 */
	const at = (x) => {
		const t = (x - x0) / (x1 - x0);
		return {
			top: Math.round(y0 + (y1 - y0) * t),
			deep: Math.round(deep0 + (deep1 - deep0) * t),
		};
	};
	// The trestles: each pair of legs reaches the ground lower down the nearer it is.
	for (const [x, foot] of [
		[45, 44],
		[54, 36],
		[61, 31],
	]) {
		const { top, deep } = at(x);
		rect(back, x, top + deep, 1, foot - top - deep, C.timberLight);
		rect(back, x + 1, top + deep, 1, foot - top - deep, C.timberShade);
	}
	for (let x = x0; x <= x1; x++) {
		const { top, deep } = at(x);
		/** @type {Colour[]} */
		const rows =
			deep >= 6
				? [
						C.timber,
						C.dayWave,
						C.daySea1,
						C.timberLight,
						C.timber,
						C.timberShade,
					]
				: deep === 5
					? [C.timber, C.dayWave, C.daySea1, C.timberLight, C.timber]
					: deep === 4
						? [C.timber, C.dayWave, C.timberLight, C.timber]
						: [C.dayWave, C.timberLight, C.timber];
		rows.forEach((colour, i) => set(back, x, top + i, colour));
		// Planks butted end to end along the side.
		if (x % 7 === 0) {
			set(back, x, top + rows.length - 1, C.timberShade);
		}
	}
}

/**
 * The wheel: a thick timber rim lit from the upper right, eight broad spokes and an iron-bound hub.
 * @param {Canvas} scene
 */
function drawWheel(scene) {
	const { x: cx, y: cy, r } = WHEEL;
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
		const ex = cx + Math.round(Math.cos(angle) * (r - 2));
		const ey = cy + Math.round(Math.sin(angle) * (r - 2));
		// Each spoke is two timbers wide: one face towards the sun, one away.
		const steep = Math.abs(Math.sin(angle)) > Math.abs(Math.cos(angle));
		const [ox, oy] = steep ? [1, 0] : [0, 1];
		line(scene, cx, cy, ex, ey, C.timberLight);
		line(scene, cx + ox, cy + oy, ex + ox, ey + oy, C.timber);
	}
	for (let y = cy - r - 1; y <= cy + r + 1; y++) {
		for (let x = cx - r - 1; x <= cx + r + 1; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const d = Math.hypot(dx, dy);
			const facing = (dx - dy) / ((d || 1) * Math.SQRT2);
			if (d <= r + 0.3 && d > r - 3) {
				// The rim: its outer face lit towards the sun, its inner face in shade.
				let colour = C.timber;
				if (d > r - 1 && facing > 0.2) {
					colour = C.timberLight;
				} else if (d <= r - 2 || facing < -0.6) {
					colour = C.timberShade;
				}
				set(scene, x, y, colour);
			} else if (d < 4.2) {
				let colour = d < 1.5 ? C.wood : C.timber;
				if (d >= 3.2) {
					colour = facing > 0 ? C.stoneLight : C.stoneShade;
				} else if (d >= 1.5 && facing > 0.3) {
					colour = C.timberLight;
				}
				set(scene, x, y, colour);
			}
		}
	}
	// The pegs that join the rim's sections.
	for (let i = 0; i < 8; i++) {
		const angle = (i / 8) * Math.PI * 2 + Math.PI / 8;
		set(
			scene,
			cx + Math.round(Math.cos(angle) * (r - 1.5)),
			cy + Math.round(Math.sin(angle) * (r - 1.5)),
			C.wood
		);
	}
}

/** One clay pot, upright and full, mouth up: rim, water, body lit on the right. */
const POT_FULL = ['.rrr.', 'rwwwr', 'cccLc', 'ccLLc', '.scc.', '..s..'];

/** One clay pot upside down and empty, coming back round to the river. */
const POT_EMPTY = ['..s..', '.sccc', 'ccLLc', 'cccLc', 'rkkkr', '.rrr.'];

/** One clay pot on its side at the top, mouth to the right, tipping out its water. */
const POT_TIPPING = ['.ccr.', 'cLLcw', 'ccLcw', 'sccr.'];

/**
 * The clay pots lashed round the rim: full and upright rising on the left, tipping at the top, empty and upside down falling on the right.
 * @param {Canvas} scene
 */
function drawPots(scene) {
	const { x: cx, y: cy, pots } = WHEEL;
	const colours = {
		r: CLAY_SHADE,
		c: CLAY,
		L: CLAY_LIGHT,
		s: CLAY_SHADE,
		w: C.daySea1,
		k: C.wood,
	};
	for (let i = 0; i < 12; i++) {
		// Twelve o'clock is -90°; the wheel turns clockwise, so the pots rise on the left.
		const degrees = -90 + i * 30;
		const angle = (degrees * Math.PI) / 180;
		const px = Math.round(cx + Math.cos(angle) * pots);
		const py = Math.round(cy + Math.sin(angle) * pots);
		if (degrees === -60) {
			paint(scene, px - 2, py - 2, POT_TIPPING, colours);
		} else if (degrees > -90 && degrees < 90) {
			paint(scene, px - 2, py - 3, POT_EMPTY, colours);
		} else {
			paint(scene, px - 2, py - 3, POT_FULL, colours);
		}
		// The lashing that ties it to the rim.
		const lx = Math.round(cx + Math.cos(angle) * (pots - 2.5));
		const ly = Math.round(cy + Math.sin(angle) * (pots - 2.5));
		set(scene, lx, ly, C.sandShade);
	}
}

/**
 * Water spilling from the tipping pot into the mouth of the channel, painted over the outline so it stays bright.
 * @param {Canvas} scene
 */
function drawPour(scene) {
	const angle = (-60 * Math.PI) / 180;
	const sx = Math.round(WHEEL.x + Math.cos(angle) * WHEEL.pots) + 2;
	const sy = Math.round(WHEEL.y + Math.sin(angle) * WHEEL.pots);
	// A falling arc two pixels wide, from the pot's mouth down into the channel.
	for (const [dx, dy] of [
		[0, -1],
		[1, -1],
		[2, 0],
		[2, 1],
		[3, 2],
		[3, 3],
		[4, 4],
	]) {
		set(scene, sx + dx, sy + dy, C.foam);
		set(scene, sx + dx + 1, sy + dy, C.daySea1);
	}
	set(scene, sx + 1, sy - 1, C.white);
	set(scene, sx + 2, sy + 1, C.white);
	set(scene, sx + 4, sy + 4, C.white);
	set(scene, sx + 6, sy + 5, C.foam);
	set(scene, sx + 3, sy + 5, C.foam);
}

/**
 * Sinks the wheel's lowest arc into the river: below the surface its pixels take on the water's blue.
 * @param {Canvas} scene
 * @param {boolean[]} wheelMask - Which pixels belong to the wheel and its pots
 */
function sink(scene, wheelMask) {
	for (let y = RIVER + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const colour = get(scene, x, y);
			if (wheelMask[y * 64 + x] && colour) {
				set(scene, x, y, mix(colour, C.daySea2, 0.55));
			}
		}
	}
}

/**
 * Foam where the rim cuts the river's surface, and drips falling from the rising pots.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSplash(scene, random) {
	const { x: cx, y: cy, pots } = WHEEL;
	const half = Math.sqrt(pots * pots - (RIVER - cy) ** 2);
	for (const side of [-1, 1]) {
		const x = Math.round(cx + side * half);
		for (let k = -3; k <= 3; k++) {
			set(scene, x + k, RIVER, Math.abs(k) < 2 ? C.white : C.foam);
		}
		set(scene, x - side, RIVER - 1, C.foam);
		set(scene, x, RIVER - 2, C.white);
	}
	// Drips from the full pots on the rising side.
	for (let i = 0; i < 6; i++) {
		const x = 1 + Math.floor(random() * 4);
		const y = 26 + Math.floor(random() * 20);
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.dayWave);
		}
	}
}
