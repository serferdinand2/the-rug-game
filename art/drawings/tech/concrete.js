// Concrete: a trowel smoothing wet concrete in timber formwork, steel rods rising from it, a turning mixer drum pouring more.
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
import { drawSky } from '../../parts/sky.js';
import { drawTerrain } from '../../parts/terrain.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The slab: its back row, its front row, and its right edge at the back and at the front (the formwork runs off the left). */
const SLAB = { top: 29, bottom: 42, backRight: 47, frontRight: 53 };

/** The front board of the formwork, below the slab. */
const BOARD = { top: 43, bottom: 55 };

/** The mixer drum: its centre, the direction of its mouth, its length either side of the centre and its widest radius. */
const DRUM = { x: 53, y: 12, ux: -0.8, uy: 0.6, back: -8, front: 9, r: 8 };

/** Wet concrete: the trowelled face with its sheen, and the rough pour with its gravel. */
const WET_SHEEN = mix(C.stoneLight, C.white, 0.45);
const SMOOTH = C.stoneLight;
const SMOOTH_SHADE = mix(C.stoneLight, C.stone, 0.55);
const ROUGH = C.stone;
const ROUGH_DARK = C.stoneMid;

/** The mixer's orange paint, from the sunlit side to the shade. */
const ORANGE_LIGHT = mix(C.gold, C.amber, 0.35);
const ORANGE = mix(C.amber, C.brickRed, 0.3);
const ORANGE_SHADE = mix(C.brickRedShade, C.amber, 0.35);
const ORANGE_DARK = mix(C.brickRedShade, C.wood, 0.35);

/** The dark inside of the drum's mouth. */
const MOUTH = mix(C.stoneShade, C.ink, 0.55);

/** Rusty reinforcing steel. */
const REBAR_LIGHT = mix(C.timberLight, C.brickRed, 0.3);
const REBAR = mix(C.timber, C.brickRedShade, 0.3);
const REBAR_DARK = mix(C.timberShade, C.wood, 0.3);

/** Sky caught in the trowel's steel. */
const STEEL_SKY = mix(C.stoneLight, C.daySky5, 0.5);

/** The worker's blue shirt sleeve and the sunlit top of the arm. */
const SKIN_LIGHT = mix(C.skinTan, C.skin, 0.6);
const SLEEVE_LIGHT = mix(C.daySky2, C.stone, 0.35);
const SLEEVE = mix(C.daySky1, C.stoneShade, 0.5);
const SLEEVE_SHADE = mix(C.daySky1, C.ink, 0.5);

/** The packed earth of the building site. */
const EARTH = mix(C.sandShade, C.timber, 0.35);
const EARTH_DARK = mix(C.sandShade, C.timberShade, 0.6);

/**
 * Draws the Concrete tech card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(2318);

	drawSky(layer, { time: 'day', horizon: 23, random });
	drawTerrain(layer, { kind: 'grassland', top: 24, random });
	drawEarth(layer, random);

	drawMixer(scene);
	drawFormwork(scene, random);
	drawSlab(scene, random);
	drawPour(scene);

	const tool = createCanvas(64, 64);
	drawTrowel(tool);
	drawArm(tool);
	outline(tool, C.ink);
	stamp(scene, tool);

	outline(scene, C.ink);
	underlay(scene, layer);
	drawRebar(scene);
	drawDetails(scene);
	return scene;
}

/**
 * Copies every painted pixel of one canvas over another.
 * @param {Canvas} target
 * @param {Canvas} source
 */
function stamp(target, source) {
	for (let i = 0; i < source.p.length; i++) {
		if (source.p[i]) {
			target.p[i] = source.p[i];
		}
	}
}

/**
 * The building site's packed earth in front of the formwork, with gravel and a spilled splash of concrete.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawEarth(layer, random) {
	for (let y = 52; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			set(
				layer,
				x,
				y,
				y > 59 || (y > 56 && (x + y) % 2 === 0) ? EARTH_DARK : EARTH
			);
		}
	}
	for (let i = 0; i < 40; i++) {
		const x = Math.floor(random() * 64);
		const y = 56 + Math.floor(random() * 8);
		set(layer, x, y, random() > 0.5 ? C.sandShade : C.stoneShade);
	}
	for (const [x, y, w] of [
		[27, 58, 5],
		[28, 59, 3],
		[50, 61, 3],
	]) {
		rect(layer, x, y, w, 1, C.stone);
	}
}

/**
 * The slab's right edge on a row, slanting out towards the viewer.
 * @param {number} y
 * @returns {number}
 */
function rightEdge(y) {
	const t = (y - SLAB.top) / (SLAB.bottom - SLAB.top);
	return Math.round(SLAB.backRight + (SLAB.frontRight - SLAB.backRight) * t);
}

/**
 * The timber formwork: the back board's top edge, the slanted end board, and the planked front board on its stakes.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawFormwork(scene, random) {
	// The back board, seen over the slab.
	rect(scene, 0, SLAB.top - 3, SLAB.backRight + 2, 1, C.timberLight);
	rect(scene, 0, SLAB.top - 2, SLAB.backRight + 2, 2, C.timber);
	// The end board on the right, slanting towards the viewer.
	for (let y = SLAB.top - 3; y <= BOARD.bottom; y++) {
		const edge = y <= SLAB.bottom ? rightEdge(y) : SLAB.frontRight;
		set(scene, edge + 1, y, C.timberLight);
		set(scene, edge + 2, y, C.timber);
		set(scene, edge + 3, y, C.timberShade);
	}
	// The front board: a lit top edge, then two planks with a seam, grain and nails.
	rect(scene, 0, BOARD.top, SLAB.frontRight + 4, 1, C.timberLight);
	rect(scene, 0, BOARD.top + 1, SLAB.frontRight + 4, 1, C.timber);
	for (let y = BOARD.top + 2; y <= BOARD.bottom; y++) {
		for (let x = 0; x <= SLAB.frontRight + 3; x++) {
			let colour = C.timber;
			if (y === BOARD.top + 7) {
				colour = C.timberShade;
			} else if (y === BOARD.top + 2 || y === BOARD.top + 8) {
				colour = mix(C.timber, C.timberLight, 0.5);
			} else if (y === BOARD.bottom) {
				colour = C.timberShade;
			} else if ((x * 7 + y * 13) % 23 === 0) {
				colour = C.timberShade;
			}
			set(scene, x, y, colour);
		}
	}
	for (let i = 0; i < 6; i++) {
		const x = 3 + Math.floor(random() * 50);
		line(
			scene,
			x,
			BOARD.top + 3 + (i % 2) * 6,
			x + 4,
			BOARD.top + 3 + (i % 2) * 6,
			C.timberShade
		);
	}
	// The stakes driven into the earth, nailed to the board.
	for (const sx of [10, 38]) {
		for (let y = BOARD.top - 1; y <= BOARD.bottom + 4; y++) {
			const point = y > BOARD.bottom + 2 ? 1 : 0;
			set(scene, sx + point, y, C.timberLight);
			if (!point) {
				set(scene, sx + 1, y, C.timber);
			}
			set(scene, sx + 2 - point, y, C.timberShade);
		}
		set(scene, sx + 1, BOARD.top + 4, C.stoneLight);
		set(scene, sx + 1, BOARD.top + 10, C.stoneLight);
	}
}

/**
 * The wet concrete: trowelled smooth and gleaming on the left, rough with gravel on the right, heaped under the pour.
 * @param {Canvas} scene
 * @param {() => number} random
 */
function drawSlab(scene, random) {
	for (let y = SLAB.top; y <= SLAB.bottom; y++) {
		const smoothEdge = 27 + Math.round(Math.sin(y * 0.9) * 2);
		for (let x = 0; x <= rightEdge(y); x++) {
			let colour;
			if (x < smoothEdge) {
				colour = SMOOTH;
				const sweep = Math.hypot(x - 2, y - 52) % 7;
				if (sweep < 0.7) {
					colour = SMOOTH_SHADE;
				} else if (Math.abs(x * 0.5 - y + 14) < 1.1) {
					colour = WET_SHEEN;
				}
			} else {
				colour = (x + y) % 2 === 0 ? ROUGH : ROUGH_DARK;
				if (x === smoothEdge) {
					colour = ROUGH_DARK;
				}
			}
			// The back board shades the far edge.
			if (y <= SLAB.top + 1) {
				colour =
					y === SLAB.top
						? ROUGH_DARK
						: x < smoothEdge
							? SMOOTH_SHADE
							: ROUGH_DARK;
			}
			set(scene, x, y, colour);
		}
	}
	// Gravel in the rough concrete.
	for (let i = 0; i < 46; i++) {
		const y =
			SLAB.top + 2 + Math.floor(random() * (SLAB.bottom - SLAB.top - 2));
		const x = 29 + Math.floor(random() * (rightEdge(y) - 29));
		set(scene, x, y, random() > 0.45 ? C.stoneShade : C.creamShade);
	}
	// The heap where the pour lands: lit on the left, shaded on the right.
	const heap = { x: 42, y: 35, rx: 7, ry: 3.6 };
	for (let y = heap.y - 4; y <= heap.y + 4; y++) {
		for (let x = heap.x - 7; x <= heap.x + 7; x++) {
			const e =
				((x - heap.x) / heap.rx) ** 2 + ((y - heap.y) / heap.ry) ** 2;
			if (e >= 1) {
				continue;
			}
			const side = x - heap.x + (y - heap.y) * 1.4;
			let colour = C.stone;
			if (side < -3) {
				colour = C.stoneLight;
			} else if (side > 3) {
				colour = C.stoneMid;
			}
			set(scene, x, y, colour);
		}
	}
	for (const [x, y] of [
		[38, 33],
		[39, 33],
		[40, 34],
		[44, 32],
	]) {
		set(scene, x, y, WET_SHEEN);
	}
	// Concrete slopped over the front board.
	for (const [x, length] of [
		[21, 3],
		[22, 4],
		[23, 2],
		[46, 3],
		[47, 2],
	]) {
		for (let k = 0; k < length; k++) {
			set(
				scene,
				x,
				BOARD.top + k,
				k === length - 1 ? C.stone : C.stoneLight
			);
		}
	}
}

/**
 * The steel rods rising from the slab, painted after the outline so they stay thin: lit on the left, ribbed, bound by tie wire.
 * @param {Canvas} scene
 */
function drawRebar(scene) {
	for (const [x, top] of [
		[25, 11],
		[30, 14],
		[35, 18],
	]) {
		for (let y = top; y <= SLAB.top + 1; y++) {
			set(scene, x, y, REBAR_LIGHT);
			set(scene, x + 1, y, y % 3 === 0 ? REBAR_DARK : REBAR);
		}
		set(scene, x, top, REBAR);
		set(scene, x + 1, top, REBAR_DARK);
	}
	// Tie wire binding the rods.
	line(scene, 24, 21, 37, 20, C.stoneShade);
	line(scene, 24, 25, 37, 24, C.stoneShade);
}

/**
 * The drum's radius at a point along its axis: a narrow back cone, a broad belly and a front cone to the mouth.
 * @param {number} a - Distance along the axis from the centre, towards the mouth
 * @returns {number}
 */
function drumRadius(a) {
	if (a < -3) {
		return 4.5 + ((a - DRUM.back) / (-3 - DRUM.back)) * (DRUM.r - 4.5);
	}
	if (a <= 2) {
		return DRUM.r;
	}
	return DRUM.r - ((a - 2) / (DRUM.front - 2)) * 2.4;
}

/**
 * The mixer: an orange double-cone drum tipped down towards the formwork, girdled by its drive gear, on a steel yoke.
 * @param {Canvas} scene
 */
function drawMixer(scene) {
	const { x: cx, y: cy, ux, uy } = DRUM;
	// The yoke under the drum and the axle stub at its back.
	for (const [x0, y0, x1, y1] of [
		[53, 18, 56, 26],
		[54, 18, 57, 26],
		[59, 14, 62, 26],
		[60, 14, 63, 26],
	]) {
		line(scene, x0, y0, x1, y1, C.stoneShade);
	}
	rect(scene, 56, 2, 3, 3, C.stoneMid);
	set(scene, 56, 2, C.stone);
	const mouthR = drumRadius(DRUM.front);
	for (let y = 0; y < 30; y++) {
		for (let x = 36; x < 64; x++) {
			const dx = x - cx;
			const dy = y - cy;
			const a = dx * ux + dy * uy;
			const b = dx * uy - dy * ux;
			// The mouth: an open ellipse at the front, dark inside with concrete churning in it.
			const m =
				((a - DRUM.front) / (mouthR * 0.7)) ** 2 + (b / mouthR) ** 2;
			if (m < 1) {
				let colour = m > 0.5 ? ORANGE_LIGHT : MOUTH;
				if (m <= 0.5 && b > 1) {
					colour = b > 2.5 ? C.stoneMid : C.stone;
				}
				if (m > 0.5 && b > 2) {
					colour = ORANGE_SHADE;
				}
				set(scene, x, y, colour);
				continue;
			}
			if (a < DRUM.back || a > DRUM.front) {
				continue;
			}
			const r = drumRadius(a);
			const gear = a > -1.8 && a < 0.2;
			const reach = gear ? r + 1.4 : r;
			if (Math.abs(b) >= reach) {
				continue;
			}
			if (gear) {
				const tooth =
					Math.abs(b) >= r - 0.3 ? Math.round(b) % 2 === 0 : true;
				if (tooth) {
					let colour = C.stoneShade;
					if (b < -3) {
						colour = C.stoneLight;
					} else if (b < 2) {
						colour = C.stone;
					}
					set(scene, x, y, colour);
				}
				continue;
			}
			const t = b / r;
			let colour = ORANGE;
			if (t < -0.5) {
				colour = ORANGE_LIGHT;
			} else if (t > 0.65) {
				colour = ORANGE_DARK;
			} else if (t > 0.2) {
				colour = ORANGE_SHADE;
			}
			if (t > -0.42 && t < -0.25 && Math.abs(a + 0.8) > 2) {
				colour = mix(C.lampGlow, C.gold, 0.4);
			}
			// The seams where the cones meet the belly.
			if (Math.abs(a + 3) < 0.55 || Math.abs(a - 2.4) < 0.55) {
				colour = t < -0.5 ? ORANGE : ORANGE_DARK;
			}
			set(scene, x, y, colour);
		}
	}
}

/**
 * The pour: a grey stream spilling from the drum's mouth down onto the heap, with drops breaking away.
 * @param {Canvas} scene
 */
function drawPour(scene) {
	for (let y = 21; y <= 33; y++) {
		const t = (y - 21) / 12;
		const x = Math.round(46 - t * 3 + Math.sin(y * 0.8) * 0.6);
		const width = y > 30 ? 4 : 3;
		for (let k = 0; k < width; k++) {
			set(
				scene,
				x + k,
				y,
				k === 0 ? C.stoneLight : k === width - 1 ? C.stoneMid : C.stone
			);
		}
	}
	set(scene, 40, 27, C.stone);
	set(scene, 47, 29, C.stone);
	set(scene, 47, 30, C.stoneMid);
}

/**
 * The trowel: a pointed steel blade lying flat on the wet face and angled into the rough pour, its cranked tang and its wooden handle.
 * @param {Canvas} tool
 */
function drawTrowel(tool) {
	const heel = { x: 17, y: 34 };
	const tip = { x: 35, y: 38 };
	const length = Math.hypot(tip.x - heel.x, tip.y - heel.y);
	const ux = (tip.x - heel.x) / length;
	const uy = (tip.y - heel.y) / length;
	for (let y = 28; y <= 42; y++) {
		for (let x = 14; x <= 37; x++) {
			const s = (x - heel.x) * ux + (y - heel.y) * uy;
			const w = (x - heel.x) * -uy + (y - heel.y) * ux;
			const half = 4.2 * (1 - s / length) + 0.4;
			if (s < -0.5 || s > length || Math.abs(w) > half) {
				continue;
			}
			// Round off the heel's corners.
			if (s < 0.6 && Math.abs(w) > half - 1.2) {
				continue;
			}
			let colour = C.stoneLight;
			if (w < -half + 1) {
				colour = C.white;
			} else if (w > half - 1) {
				colour = C.stoneMid;
			} else if (w > half - 2.2) {
				colour = C.stone;
			} else if (Math.abs(s - w * 1.4 - 6) < 1.2) {
				colour = C.white;
			} else if (w < 0) {
				colour = STEEL_SKY;
			}
			set(tool, x, y, colour);
		}
	}
	// Wet concrete clinging to the blade's lower edge.
	for (const [x, y] of [
		[27, 39],
		[28, 39],
		[31, 39],
	]) {
		set(tool, x, y, C.stoneMid);
	}
	// The tang cranked up from the heel to the handle.
	line(tool, 17, 31, 17, 26, C.stoneShade);
	line(tool, 18, 31, 18, 26, C.stone);
	// The wooden handle, lit along its top, held in the fist.
	rect(tool, 4, 23, 15, 1, C.timberLight);
	rect(tool, 4, 24, 15, 1, C.timber);
	rect(tool, 4, 25, 15, 1, C.timberShade);
	set(tool, 18, 23, C.timber);
	set(tool, 18, 25, C.wood);
}

/**
 * The worker's arm reaching down from the top left in a rolled blue sleeve, the hand gripping the trowel handle.
 * @param {Canvas} tool
 */
function drawArm(tool) {
	const elbow = { x: -1, y: 9 };
	const wrist = { x: 7, y: 20 };
	const length = Math.hypot(wrist.x - elbow.x, wrist.y - elbow.y);
	const ux = (wrist.x - elbow.x) / length;
	const uy = (wrist.y - elbow.y) / length;
	for (let y = 4; y <= 24; y++) {
		for (let x = 0; x <= 12; x++) {
			const s = (x - elbow.x) * ux + (y - elbow.y) * uy;
			const w = (x - elbow.x) * -uy + (y - elbow.y) * ux;
			if (s < 0 || s > length || Math.abs(w) > 2.8) {
				continue;
			}
			// The rolled sleeve at the elbow, then the bare forearm, lit along its upper side.
			if (s < 4.5) {
				let colour = SLEEVE;
				if (s > 3.5) {
					colour = SLEEVE_LIGHT;
				} else if (w > 1.5) {
					colour = SLEEVE_SHADE;
				}
				set(tool, x, y, colour);
				continue;
			}
			let colour = C.skinTan;
			if (w > 1.6) {
				colour = SKIN_LIGHT;
			} else if (w < -1.6) {
				colour = C.skinTanShade;
			}
			set(tool, x, y, colour);
		}
	}
	// The fist round the handle: knuckles along the top, four curled fingers in front.
	const fist = [
		'..hhhhh..',
		'.hhsssssd',
		'hsssssssd',
		'sksksksdd',
		'ssssssssd',
		'sksksksdd',
		'.dddddd..',
	];
	/** @type {Record<string, Colour>} */
	const colours = {
		h: SKIN_LIGHT,
		s: C.skinTan,
		k: C.skinTanShade,
		d: C.skinTanShade,
	};
	fist.forEach((row, j) => {
		[...row].forEach((key, i) => {
			if (key in colours) {
				set(tool, 6 + i, 20 + j, colours[key]);
			}
		});
	});
}

/**
 * Last touches over the outline: glints of wet light and the turning lines round the drum.
 * @param {Canvas} scene
 */
function drawDetails(scene) {
	for (const [x, y] of [
		[6, 33],
		[7, 33],
		[17, 32],
		[45, 13],
	]) {
		if (get(scene, x, y) !== C.ink) {
			set(scene, x, y, C.white);
		}
	}
	// Turning lines arcing over the drum's back.
	for (const [x, y] of [
		[44, 3],
		[45, 2],
		[46, 1],
		[48, 0],
		[41, 7],
		[42, 6],
	]) {
		set(scene, x, y, C.white);
	}
}
