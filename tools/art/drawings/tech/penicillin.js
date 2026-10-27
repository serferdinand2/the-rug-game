// Penicillin: a glass culture dish close up on a sunlit lab bench, a blue-green mould bloom in a clear ring among the cloudy colonies, test tubes and a dropper behind.
import {
	createCanvas,
	get,
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

/** The back edge of the bench; the wall fills the rows above it. */
const BENCH = 21;

/** The window in the back wall, off to the right, where the sun comes in. */
const WINDOW = { x: 35, y: -1, w: 26, h: 16 };

/** The dish: its centre, its rim's radii, how far its glass wall shows below the rim, and how far the culture sits below the rim. */
const DISH = { x: 32, y: 44, rx: 29, ry: 15, wall: 4, sink: 2 };

/** The mould bloom on the culture: its centre, its radius on the dish's floor, and the reach of the clear ring round it. */
const MOULD = { x: 28, y: 45, r: 13, ring: 1.45 };

/** Plaster wall, bench timber and the dish's shadow. */
const WALL = C.plaster;
const WALL_SHADE = C.plasterShade;
const SHADOW = mix(C.timberShade, C.wood, 0.5);

/** Glass: its gleam, its body and its shaded edge, faintly blue from the sky. */
const GLASS_GLEAM = C.white;
const GLASS = mix(C.cloudShade, C.daySky6, 0.3);
const GLASS_SHADE = mix(C.snowShade, C.stone, 0.35);

/** The cloudy culture: its sunlit tone, its body and the shade under the dish's back wall. */
const AGAR_LIGHT = mix(C.creamLight, C.sandLight, 0.3);
const AGAR = mix(C.cream, C.sandLight, 0.5);
const AGAR_SHADE = mix(C.sand, C.creamShade, 0.5);

/** The clear ring: the culture gone glassy, so the dark bench shows through. */
const CLEAR = mix(AGAR, C.timberShade, 0.5);
const CLEAR_EDGE = mix(AGAR, C.timberShade, 0.25);

/** The golden colonies of germs, and their shaded side. */
const COLONY = mix(C.gold, C.sandLight, 0.25);
const COLONY_SHADE = mix(C.amber, C.sand, 0.3);

/** The mould: a powdery heart, a blue-green velvet, its furrows and the white fuzz at its edge. */
const MOULD_LIGHT = mix(C.ghost, C.teal, 0.25);
const MOULD_BODY = mix(C.teal, C.grass, 0.35);
const MOULD_DEEP = mix(C.tealShade, C.grassShade, 0.4);
const MOULD_FUZZ = mix(C.ghostLight, C.creamLight, 0.5);

/** The sun's warm light. */
const SUN = { x: 52, y: 2 };

/**
 * Draws the Penicillin tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(1928);

	drawWall(layer);
	drawWindow(layer, random);
	drawBenchTop(layer, random);
	drawSunbeams(layer);

	drawTubes(scene);
	drawDropper(scene);
	drawDishWall(scene);
	drawDishTop(scene);
	drawColonies(scene, random);
	drawMould(scene, random);
	outline(scene, C.ink);
	underlay(scene, layer);

	glow(scene, {
		x: SUN.x,
		y: SUN.y,
		radius: 70,
		colour: C.beamLight,
		strength: 0.25,
		steps: 4,
		skip: [C.ink],
	});
	drawGleams(scene);
	return scene;
}

/**
 * Tells how far a point lies inside an ellipse: below 1 inside, 1 on its edge.
 * @param {number} x
 * @param {number} y
 * @param {number} cx
 * @param {number} cy
 * @param {number} rx
 * @param {number} ry
 * @returns {number}
 */
function ellipse(x, y, cx, cy, rx, ry) {
	return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
}

/**
 * The plaster wall behind the bench, darker towards the corners.
 * @param {Canvas} layer
 */
function drawWall(layer) {
	for (let y = 0; y < BENCH; y++) {
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, x < 8 || y < 2 ? WALL_SHADE : WALL);
		}
	}
	// A tiled splashback along the bench.
	for (let y = BENCH - 6; y < BENCH; y++) {
		for (let x = 0; x < 64; x++) {
			const grout =
				y === BENCH - 6 || (x + (y > BENCH - 3 ? 3 : 0)) % 6 === 0;
			set(layer, x, y, grout ? C.creamShade : C.cream);
		}
	}
}

/**
 * The window: a day sky with a cloud, a timber frame and mullions, and its sill.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawWindow(layer, random) {
	const { x: wx, y: wy, w, h } = WINDOW;
	const ramp = [C.daySky3, C.daySky4, C.daySky5, C.daySky6];
	for (let y = wy; y < wy + h; y++) {
		const tone = ramp[Math.min(ramp.length - 1, Math.floor((y - wy) / 4))];
		rect(layer, wx, y, w, 1, tone);
	}
	for (let i = 0; i < 18; i++) {
		const x = wx + 3 + Math.floor(random() * 10);
		const y = wy + 4 + Math.floor(random() * 4);
		set(layer, x, y, i % 2 === 0 ? C.white : C.cloudShade);
	}
	const frame = C.timberLight;
	rect(layer, wx - 1, wy, 1, h + 1, frame);
	rect(layer, wx + w, wy, 1, h + 1, frame);
	rect(layer, wx + Math.floor(w / 2), wy, 1, h, frame);
	rect(layer, wx, wy + 8, w, 1, frame);
	rect(layer, wx - 2, wy + h, w + 4, 1, C.timberLight);
	rect(layer, wx - 2, wy + h + 1, w + 4, 1, C.timber);
}

/**
 * The bench top: broad timber planks running across, with grain, and the dish's shadow cast towards the viewer and left.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawBenchTop(layer, random) {
	for (let y = BENCH; y < 64; y++) {
		const seam = (y - BENCH) % 9 === 8;
		rect(layer, 0, y, 64, 1, seam ? C.timberShade : C.timber);
	}
	rect(layer, 0, BENCH, 64, 1, C.timberLight);
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 62);
		const y = BENCH + 1 + Math.floor(random() * (63 - BENCH));
		if (get(layer, x, y) === C.timberShade) {
			continue;
		}
		const length = 2 + Math.floor(random() * 6);
		rect(
			layer,
			x,
			y,
			length,
			1,
			i % 3 === 0 ? C.timberLight : C.timberShade
		);
	}
	for (let y = BENCH; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			if (ellipse(x, y, DISH.x - 4, DISH.y + 5, DISH.rx, DISH.ry) < 1) {
				set(layer, x, y, SHADOW);
			}
		}
	}
}

/**
 * Two broad shafts of sunlight slanting down from the window across the wall and the bench.
 * @param {Canvas} layer
 */
function drawSunbeams(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const slant = x + y * 0.8;
			const inWindow =
				x >= WINDOW.x &&
				x < WINDOW.x + WINDOW.w &&
				y < WINDOW.y + WINDOW.h;
			if (inWindow) {
				continue;
			}
			if ((slant > 30 && slant < 40) || (slant > 46 && slant < 51)) {
				const behind = get(layer, x, y);
				if (behind) {
					set(layer, x, y, mix(behind, C.beamLight, 0.28));
				}
			}
		}
	}
}

/**
 * A wooden rack of stoppered test tubes against the splashback, each holding a different broth.
 * @param {Canvas} scene
 */
function drawTubes(scene) {
	const broths = [
		mix(C.amber, C.sand, 0.4),
		C.creamLight,
		mix(C.brickRedLight, C.sand, 0.35),
		mix(C.grassLight, C.sandLight, 0.5),
	];
	broths.forEach((broth, i) => {
		const x = 4 + i * 5;
		const top = 3 + (i % 2);
		// The glass, the broth in its lower half, and a cotton plug.
		rect(scene, x, top + 2, 3, 20 - top, GLASS);
		rect(scene, x + 2, top + 2, 1, 20 - top, GLASS_SHADE);
		rect(scene, x, top + 11, 3, 11 - top, broth);
		set(scene, x, top + 11, mix(broth, C.white, 0.5));
		rect(scene, x, top, 3, 2, C.creamLight);
		set(scene, x + 2, top + 1, C.creamShade);
		set(scene, x, top + 3, GLASS_GLEAM);
		set(scene, x, top + 4, GLASS_GLEAM);
	});
	// The rack: a top board the tubes pass through, two legs and a base.
	rect(scene, 2, 13, 21, 2, C.timberLight);
	rect(scene, 2, 15, 21, 1, C.timberShade);
	rect(scene, 2, 16, 2, 6, C.timber);
	rect(scene, 21, 16, 2, 6, C.timber);
	rect(scene, 1, 22, 23, 2, C.timberLight);
	rect(scene, 1, 24, 23, 1, C.timberShade);
	for (let i = 0; i < 4; i++) {
		rect(scene, 4 + i * 5, 13, 3, 1, mix(C.timberShade, C.wood, 0.4));
	}
}

/**
 * A glass dropper lying on the bench behind the dish, its red rubber bulb towards the window.
 * @param {Canvas} scene
 */
function drawDropper(scene) {
	line(scene, 40, 26, 54, 22, GLASS);
	line(scene, 41, 27, 54, 23, GLASS_SHADE);
	line(scene, 36, 27, 40, 26, GLASS_SHADE);
	line(scene, 43, 26, 49, 24, mix(C.sand, C.amber, 0.3));
	for (let y = 19; y <= 24; y++) {
		for (let x = 54; x <= 61; x++) {
			const e = ellipse(x, y, 58, 21.5, 4, 2.8);
			if (e < 1) {
				set(
					scene,
					x,
					y,
					e < 0.35 && y < 22 ? C.brickRedLight : C.brickRed
				);
			}
		}
	}
	rect(scene, 54, 21, 1, 3, C.brickRedShade);
	set(scene, 37, 28, mix(C.sand, C.amber, 0.3));
}

/**
 * The dish's glass wall below its front rim, the culture seen through it.
 * @param {Canvas} scene
 */
function drawDishWall(scene) {
	for (let x = DISH.x - DISH.rx; x <= DISH.x + DISH.rx; x++) {
		const u = (x - DISH.x) / DISH.rx;
		const front = Math.round(
			DISH.y + DISH.ry * Math.sqrt(Math.max(0, 1 - u * u))
		);
		for (let k = 0; k <= DISH.wall; k++) {
			let colour = mix(AGAR_SHADE, GLASS, 0.35);
			if (k === 0) {
				colour = GLASS;
			} else if (k === DISH.wall) {
				colour = GLASS_SHADE;
			} else if (k === 1) {
				colour = mix(AGAR, GLASS, 0.3);
			}
			set(scene, x, front + k, colour);
		}
	}
}

/**
 * The dish from above: the glass rim, the inside of the wall at the back, and the cloudy culture filling it.
 * @param {Canvas} scene
 */
function drawDishTop(scene) {
	const { x: cx, y: cy, rx, ry, sink } = DISH;
	for (let y = cy - ry; y <= cy + ry; y++) {
		for (let x = cx - rx; x <= cx + rx; x++) {
			const outer = ellipse(x, y, cx, cy, rx, ry);
			if (outer > 1) {
				continue;
			}
			const inner = ellipse(x, y, cx, cy, rx - 1.6, ry - 1.1);
			const agar = ellipse(x, y, cx, cy + sink, rx - 2.4, ry - 2.2);
			let colour;
			if (inner > 1) {
				// The rim: brightest on the far side facing the window.
				const far = y < cy;
				colour =
					far && x > cx - 6 ? GLASS_GLEAM : far ? GLASS : GLASS_SHADE;
			} else if (agar > 1) {
				// The inside of the wall above the culture, seen across the dish.
				colour = mix(GLASS_SHADE, C.timber, 0.3);
			} else if (agar > 0.82 && y < cy + sink) {
				colour = AGAR_SHADE;
			} else if (agar > 0.86) {
				colour = AGAR_LIGHT;
			} else {
				colour = x - cx - (y - cy) * 2 > 28 ? AGAR_LIGHT : AGAR;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * How far the mould's edge reaches at an angle: a round bloom with soft lobes.
 * @param {number} angle
 * @returns {number}
 */
function mouldReach(angle) {
	return (
		MOULD.r *
		(1 + 0.09 * Math.sin(angle * 5 + 1) + 0.05 * Math.sin(angle * 9))
	);
}

/**
 * Where a point lies relative to the mould, measured on the dish's floor: its distance from the centre, and its angle.
 * @param {number} x
 * @param {number} y
 * @returns {{ d: number, angle: number }}
 */
function onFloor(x, y) {
	const dx = x - MOULD.x;
	const dy = ((y - MOULD.y) * DISH.rx) / DISH.ry;
	return { d: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) };
}

/**
 * The golden colonies of germs scattered across the culture, and none inside the clear ring.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawColonies(scene, random) {
	const { x: cx, y: cy, rx, ry, sink } = DISH;
	let placed = 0;
	for (let i = 0; i < 400 && placed < 58; i++) {
		const x = cx - rx + 3 + Math.floor(random() * (rx * 2 - 5));
		const y = cy - ry + 3 + Math.floor(random() * (ry * 2 - 4));
		const big = random() < 0.6;
		if (ellipse(x, y, cx, cy + sink, rx - 4.5, ry - 3.5) > 1) {
			continue;
		}
		const { d, angle } = onFloor(x, y);
		const reach = mouldReach(angle);
		if (d < reach * MOULD.ring + 2) {
			continue;
		}
		set(scene, x, y, COLONY);
		if (big) {
			set(scene, x + 1, y, COLONY);
			set(scene, x, y + 1, COLONY_SHADE);
			set(scene, x + 1, y + 1, COLONY_SHADE);
		} else {
			set(scene, x, y + 1, COLONY_SHADE);
		}
		placed++;
	}
}

/**
 * The mould bloom: the clear ring where no germ grows, then the velvety blue-green colony with its furrows, its powdery heart and its white fuzzy edge.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawMould(scene, random) {
	const reachX = Math.ceil(MOULD.r * MOULD.ring * 1.2);
	const reachY = Math.ceil((reachX * DISH.ry) / DISH.rx) + 1;
	for (let y = MOULD.y - reachY; y <= MOULD.y + reachY; y++) {
		for (let x = MOULD.x - reachX; x <= MOULD.x + reachX; x++) {
			const { d, angle } = onFloor(x, y);
			const reach = mouldReach(angle);
			const rho = d / reach;
			if (rho > MOULD.ring) {
				continue;
			}
			// Furrows run out from the heart like spokes, across rings of new growth.
			const furrow = Math.cos(angle * 6 + 0.5) > 0.86;
			let colour;
			if (rho > MOULD.ring - 0.1) {
				colour = CLEAR_EDGE;
			} else if (rho > 1) {
				colour = CLEAR;
			} else if (rho > 0.84) {
				colour = MOULD_FUZZ;
			} else if (rho > 0.72) {
				colour = MOULD_DEEP;
			} else if (rho < 0.18) {
				colour = rho < 0.08 ? C.ghostLight : MOULD_LIGHT;
			} else if (furrow) {
				colour = MOULD_DEEP;
			} else if (rho > 0.36 && rho < 0.5) {
				colour = MOULD_LIGHT;
			} else {
				colour = MOULD_BODY;
			}
			set(scene, x, y, colour);
		}
	}
	// Tufts of fuzz reaching out past the edge.
	for (let i = 0; i < 22; i++) {
		const angle = random() * Math.PI * 2;
		const reach = mouldReach(angle) * (1.02 + random() * 0.12);
		const x = Math.round(MOULD.x + Math.cos(angle) * reach);
		const y = Math.round(
			MOULD.y + (Math.sin(angle) * reach * DISH.ry) / DISH.rx
		);
		set(scene, x, y, MOULD_FUZZ);
	}
}

/**
 * The window caught in the culture's wet surface and the glass rim, and the last sun gleams.
 * @param {Canvas} scene
 */
function drawGleams(scene) {
	for (const [x, y] of [
		[47, 35],
		[48, 35],
		[50, 35],
		[51, 35],
		[47, 36],
		[48, 36],
		[50, 36],
		[51, 36],
		[46, 38],
		[47, 38],
		[49, 38],
		[50, 38],
		[44, 30],
		[45, 30],
		[56, 33],
		[59, 38],
		[9, 54],
		[10, 55],
	]) {
		set(scene, x, y, GLASS_GLEAM);
	}
}
