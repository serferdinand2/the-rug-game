// Remote Viewing: a great glowing eye floating in the dark at night, a faraway valley with a winding river seen in its iris.
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

/** The eye: its centre, half its width, and how far its upper and lower lids arch from the middle. */
const EYE = { x: 31.5, y: 32, w: 30.5, up: 17, down: 14 };

/** The iris: its centre, its outer edge, and the edge of the window onto the valley. */
const IRIS = { x: 31.5, y: 31.5, r: 14, view: 11.5 };

/** The valley's horizon row inside the iris. */
const HORIZON = 29;

/** The pale blue-white light the eye gives off. */
const LIGHT = C.daySky6;

/** The white of the eye, its shade under the lids, and the lid's rim. */
const WHITE = mix(C.snow, C.daySky6, 0.3);
const WHITE_SHADE = mix(C.snowShade, C.daySky5, 0.35);
const LID = C.daySky5;

/** The iris ring: its pale streaks, its blue and its dark edge. */
const IRIS_LIGHT = C.foam;
const IRIS_BLUE = C.nightWave;
const IRIS_DEEP = C.nightWaveDeep;
const IRIS_EDGE = C.nightSea2;

/** The valley: far peaks, the near slopes lit and shaded, and the river. */
const PEAK = mix(C.stoneLight, C.daySky5, 0.45);
const PEAK_SHADE = mix(C.stone, C.daySky3, 0.4);
const FAR_HILLS = mix(C.forestFloor, C.daySky4, 0.4);
const FAR_WOODS = mix(C.pineShade, C.daySky4, 0.35);

/** The pines on the near slopes: the top of each, two pixels tall. */
const PINES = [
	[24, 33],
	[27, 36],
	[38, 34],
	[41, 37],
	[36, 39],
];

/**
 * Draws the Remote Viewing tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(3307);

	drawNight(layer, random);
	glow(layer, {
		x: 32,
		y: 32,
		radius: 44,
		colour: C.daySky4,
		strength: 0.45,
		steps: 4,
		skip: [C.starDim],
	});
	drawRays(layer);

	drawWhite(scene);
	drawIris(scene);
	drawValley(scene);
	drawCrease(scene);
	outline(scene, C.ink);
	underlay(scene, layer);

	drawCatchlight(scene);
	return scene;
}

/**
 * The night: three dark bands and a scatter of stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawNight(layer, random) {
	// The bands lighten towards the eye's row and darken again below it.
	rect(layer, 0, 0, 64, 12, C.nightSky1);
	rect(layer, 0, 12, 64, 10, C.nightSky2);
	rect(layer, 0, 22, 64, 20, C.nightSky3);
	rect(layer, 0, 42, 64, 10, C.nightSky2);
	rect(layer, 0, 52, 64, 12, C.nightSky1);
	for (let i = 0; i < 26; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * 64),
			C.starDim
		);
	}
}

/**
 * Pale rays fanning out from the eye into the dark, long and short in turn.
 * @param {Canvas} layer
 */
function drawRays(layer) {
	const count = 16;
	for (let k = 0; k < count; k++) {
		const angle = (k / count) * Math.PI * 2 + 0.2;
		const reach = k % 2 ? 31 : 40;
		const colour =
			k % 2
				? mix(LIGHT, C.nightSky2, 0.55)
				: mix(LIGHT, C.nightSky2, 0.3);
		line(
			layer,
			Math.round(EYE.x + Math.cos(angle) * 18),
			Math.round(EYE.y + Math.sin(angle) * 14),
			Math.round(EYE.x + Math.cos(angle) * reach),
			Math.round(EYE.y + Math.sin(angle) * reach),
			colour
		);
	}
}

/**
 * The eye's outline at a column: the rows of its upper and lower lids, or null outside it.
 * @param {number} x
 * @returns {{ top: number, bottom: number } | null}
 */
function lids(x) {
	const t = (x - EYE.x) / EYE.w;
	if (Math.abs(t) >= 1) {
		return null;
	}
	const open = 1 - t * t;
	return {
		top: EYE.y - EYE.up * Math.pow(open, 1.1),
		bottom: EYE.y + EYE.down * Math.pow(open, 1.25),
	};
}

/**
 * The white of the eye: shaded under the upper lid and towards the corners, with a pale lid rim all round.
 * @param {Canvas} scene
 */
function drawWhite(scene) {
	for (let x = 0; x < 64; x++) {
		const edge = lids(x + 0.5);
		if (!edge) {
			continue;
		}
		for (let y = 0; y < 64; y++) {
			const cy = y + 0.5;
			if (cy <= edge.top || cy >= edge.bottom) {
				continue;
			}
			let colour = WHITE;
			if (cy < edge.top + 3 || Math.abs(x + 0.5 - EYE.x) > EYE.w - 9) {
				colour = WHITE_SHADE;
			}
			if (cy < edge.top + 1.2 || cy > edge.bottom - 1.2) {
				colour = LID;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The iris ring: a blue band streaked with pale fibres, dark at its edge, cut off by the upper lid.
 * @param {Canvas} scene
 */
function drawIris(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x + 0.5 - IRIS.x - 0.5;
			const dy = y + 0.5 - IRIS.y - 0.5;
			const r = Math.hypot(dx, dy);
			if (r >= IRIS.r || r < IRIS.view) {
				continue;
			}
			const edge = lids(x + 0.5);
			if (
				!edge ||
				y + 0.5 <= edge.top + 1.2 ||
				y + 0.5 >= edge.bottom - 1.2
			) {
				continue;
			}
			const fibre = Math.sin(Math.atan2(dy, dx) * 11);
			let colour =
				fibre > 0.4 ? IRIS_LIGHT : fibre < -0.5 ? IRIS_DEEP : IRIS_BLUE;
			if (r > IRIS.r - 1) {
				colour = IRIS_EDGE;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The valley seen through the iris: a pale sky, far snowy peaks, green slopes falling in from both sides and a river winding towards the eye.
 * @param {Canvas} scene
 */
function drawValley(scene) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const dx = x + 0.5 - IRIS.x - 0.5;
			const dy = y + 0.5 - IRIS.y - 0.5;
			if (Math.hypot(dx, dy) >= IRIS.view) {
				continue;
			}
			const edge = lids(x + 0.5);
			if (!edge || y + 0.5 <= edge.top + 1.2) {
				continue;
			}
			set(scene, x, y, valleyColour(x, y));
		}
	}
}

/**
 * The colour of the valley at a pixel.
 * @param {number} x
 * @param {number} y
 * @returns {Colour}
 */
function valleyColour(x, y) {
	const ridge = Math.abs(Math.sin((x - 18) * 0.42));
	const peak = HORIZON - 5 + Math.round(ridge * 3 + Math.abs(x - 32) * 0.1);
	// The near slopes: a V that opens towards the viewer.
	const slope = HORIZON + 1 - Math.abs(x - 32) * 0.5;
	const below = y - HORIZON;
	const river = 32 + Math.sin(below * 0.42) * 3.2 * (below / 14);
	const width = 0.4 + below * 0.22;
	if (y > slope && y >= HORIZON - 1) {
		if (below > 0 && Math.abs(x + 0.5 - river) < width) {
			return Math.abs(x + 0.5 - river) < width * 0.4 ? C.foam : C.daySea1;
		}
		if (below < 3) {
			// The far woods along the valley floor, a row of treetops.
			return below === 0 && x % 3 !== 1 ? FAR_WOODS : FAR_HILLS;
		}
		// A few pines dotted on the near slopes.
		const pine = PINES.find(
			([px, py]) => x === px && (y === py || y === py + 1)
		);
		if (pine) {
			return y === pine[1] ? C.pine : C.pineShade;
		}
		if (y < slope + 1.5) {
			return x < 32 ? C.grassLight : C.grass;
		}
		return x < 32 ? C.grass : C.grassShade;
	}
	if (y >= peak) {
		if (y <= peak + 1 && ridge < 0.5) {
			return x % 9 < 4 ? C.snow : C.snowShade;
		}
		return x % 9 < 4 ? PEAK : PEAK_SHADE;
	}
	return y < HORIZON - 10
		? C.daySky4
		: y < HORIZON - 6
			? C.daySky5
			: C.daySky6;
}

/**
 * The fold of the upper lid: a pale arc a little above the eye.
 * @param {Canvas} scene
 */
function drawCrease(scene) {
	for (let x = 0; x < 64; x++) {
		const t = (x + 0.5 - EYE.x) / (EYE.w - 5);
		if (Math.abs(t) >= 0.8) {
			continue;
		}
		const y = Math.round(EYE.y - (EYE.up + 6) * Math.pow(1 - t * t, 1.1));
		set(scene, x, y, LID);
	}
}

/**
 * The catchlight: a bright glint on the iris's upper left edge.
 * @param {Canvas} scene
 */
function drawCatchlight(scene) {
	rect(scene, 22, 22, 2, 2, C.white);
	set(scene, 24, 21, C.white);
	set(scene, 21, 24, LIGHT);
}
