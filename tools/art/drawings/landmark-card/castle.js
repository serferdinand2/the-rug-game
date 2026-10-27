// Castle: the gatehouse at dusk, its drawbridge coming down over the dark moat on taut chains, torches flaring on either side of the arch, the raised portcullis's teeth above a deep passage to the cool dusk courtyard.
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

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The parapet: merlons rise from MERLON_TOP, the parapet face runs down to the corbels, and the wall face starts at WALL_TOP. */
const MERLON_TOP = 5;
const CRENEL = 9;
const CORBELS = 12;
const WALL_TOP = 15;

/** The gate arch: its centre column, half its width, the row where it springs, how pointed it is, and the threshold row. */
const ARCH = { x: 32, half: 10, spring: 32, point: 4, threshold: 46 };

/** How thick the ring of wedge stones round the arch is. */
const RING = 3;

/** Where the passage's lines meet, and how small its far end is beside the near one. */
const VANISH = { x: 32, y: 33 };
const FAR = 0.36;

/** The water starts just under the wall's foot; the near bank's pier rises from it at the bottom. */
const WATER = 47;
const PIER = 61;

/** The drawbridge: its hinge along the threshold, and its free end, wider because it is nearer. */
const BRIDGE = {
	hinge: { y: 46, left: 22, right: 42 },
	end: { y: 55, left: 12, right: 52 },
	planks: 7,
};

/** Where each chain is made fast on the bridge, and the slot in the wall it runs up into. */
const CHAINS = [
	{ from: [14, 54], to: [20, 17] },
	{ from: [50, 54], to: [44, 17] },
];

/** The torches: where each flame burns, on an iron bracket either side of the arch. */
const TORCHES = [
	{ x: 9, y: 24 },
	{ x: 55, y: 24 },
];

/** The grey stone of the landmark, cooled by the dusk: lit edge, face, joints and shadow. */
const STONE_LIGHT = mix(C.stoneMid, C.duskSky4, 0.28);
const STONE = mix(C.stoneShade, C.duskSky2, 0.3);
const STONE_MID = mix(C.stoneShade, C.night, 0.45);
const STONE_SHADE = mix(C.night, C.stoneShade, 0.3);

/** The damp, mossy band the moat leaves at the wall's foot. */
const DAMP = mix(C.stoneShade, C.forestFloorShade, 0.45);

/** The passage under the gatehouse: its black vault, its dark walls and floor, and the joints between their stones. */
const VAULT = mix(C.ink, C.night, 0.5);
const VAULT_JOINT = C.ink;
const PASSAGE = mix(C.night, C.stoneShade, 0.28);
const PASSAGE_FLOOR = mix(C.night, C.stoneShade, 0.7);
const PASSAGE_EDGE = mix(C.night, C.stoneMid, 0.55);

/** The courtyard beyond the far arch: cool dusk sky, the grey wall across the yard with one lit window, and its cobbles. */
const COURT_SKY = C.railLight;
const COURT_SKY_LOW = mix(C.railLight, C.duskSky5, 0.3);
const COURT_WALL = mix(C.stoneShade, C.roofLight, 0.3);
const COURT_WALL_SHADE = mix(C.stoneShade, C.roof, 0.45);
const COURT_GROUND = mix(C.stoneMid, C.roofLight, 0.25);

/** Iron for the portcullis, the bridge's straps and the chains, lit warm by the torches. */
const IRON_LIGHT = mix(C.stoneMid, C.amber, 0.3);
const IRON = mix(C.stoneShade, C.night, 0.35);

/** The moat: dark water, with the dusk sky caught on its ripples and the bridge's shadow on it. */
const WATER_DARK = mix(C.nightSea3, C.night, 0.45);
const WATER_MID = mix(C.nightSea3, C.duskSky2, 0.35);
const RIPPLE = mix(C.duskSky4, C.nightSea2, 0.35);
const SHADOW = mix(C.ink, C.nightSea3, 0.3);

/** The flames, from their red edge to their white heart. */
const FLAME = {
	r: C.brickRedLight,
	a: C.amber,
	g: C.gold,
	l: C.lampGlow,
	w: C.white,
};

/**
 * Draws the Castle landmark card.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const wall = createCanvas(64, 64);
	const front = createCanvas(64, 64);
	const random = seededRandom(1189);

	drawSky(layer, random);
	drawPassage(layer);
	drawPortcullis(layer);
	drawMoat(layer, random);

	drawWall(wall, random);
	drawArchRing(wall);
	outline(wall, C.ink);
	underlay(wall, layer);

	drawBridge(front, random);
	drawChains(front);
	drawBrackets(front);
	outline(front, C.ink);
	underlay(front, wall);

	for (const torch of TORCHES) {
		glow(front, {
			x: torch.x,
			y: torch.y,
			radius: 14,
			colour: C.gold,
			strength: 0.4,
			steps: 3,
			skip: [C.ink],
		});
	}
	for (const torch of TORCHES) {
		drawFlame(front, torch);
		drawReflection(front, torch);
	}
	drawGlints(front);
	return front;
}

/**
 * Tells whether a point lies in the gate's opening: a pointed arch on straight jambs, down to the threshold.
 * @param {number} x
 * @param {number} y
 * @returns {boolean}
 */
function inOpening(x, y) {
	const dx = Math.abs(x - ARCH.x);
	if (y > ARCH.threshold || dx > ARCH.half) {
		return false;
	}
	if (y >= ARCH.spring) {
		return true;
	}
	return (
		Math.hypot(dx + ARCH.point, y - ARCH.spring) <= ARCH.half + ARCH.point
	);
}

/**
 * The dusk sky above the battlements, violet overhead and warmer lower down, with the first stars.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSky(layer, random) {
	const ramp = [C.duskSky2, C.duskSky3, C.duskSky4, C.duskSky5, C.duskSky6];
	for (let y = 0; y < WALL_TOP; y++) {
		const t = (y / CRENEL) * (ramp.length - 1);
		const i = Math.min(ramp.length - 1, Math.floor(t));
		for (let x = 0; x < 64; x++) {
			const dither =
				i + 1 < ramp.length && t - i > 0.5 && (x + y) % 2 === 0;
			set(layer, x, y, dither ? ramp[i + 1] : ramp[i]);
		}
	}
	for (let i = 0; i < 5; i++) {
		set(
			layer,
			Math.floor(random() * 64),
			Math.floor(random() * 3),
			C.starDim
		);
	}
}

/**
 * The passage through the gatehouse, seen down its length: a black vault, dark walls and a flagged floor
 * whose joints all run back to the far arch, where the cool courtyard shows. Each pixel is placed by how
 * deep in the passage it lies and which surface it is on.
 * @param {Canvas} layer
 */
function drawPassage(layer) {
	for (let y = 0; y <= ARCH.threshold; y++) {
		for (let x = 0; x < 64; x++) {
			if (!inOpening(x, y)) {
				continue;
			}
			const here = passagePoint(x, y);
			if (here.surface === 'court') {
				set(layer, x, y, courtyard(here.qx, here.qy));
				continue;
			}
			const right = passagePoint(x + 1, y);
			const below = passagePoint(x, y + 1);
			// The rings where one length of vault meets the next.
			const ring =
				Math.floor(here.depth * 8) !== Math.floor(right.depth * 8) ||
				Math.floor(here.depth * 8) !== Math.floor(below.depth * 8);
			// The corners where wall meets vault and floor, catching a little light as they run back.
			const corner =
				here.surface === 'wall' &&
				(below.surface !== 'wall' ||
					passagePoint(x, y - 1).surface !== 'wall');
			let colour = VAULT;
			if (here.surface === 'floor') {
				const joint = ring || Math.round(here.qx) % 4 === 0;
				colour = joint ? VAULT : PASSAGE_FLOOR;
			} else if (here.surface === 'wall') {
				const course = ring || Math.round(here.qy) % 4 === 0;
				colour = corner ? PASSAGE_EDGE : course ? VAULT : PASSAGE;
			} else if (ring) {
				colour = VAULT_JOINT;
			}
			// The courtyard's cool light reaches back a little way from the far arch.
			if (here.depth < FAR + 0.12) {
				colour = mix(
					colour,
					COURT_SKY,
					here.depth < FAR + 0.06 ? 0.38 : 0.2
				);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * Where a pixel in the opening lies in the passage: how deep (1 at the near arch, FAR at the far one),
 * the point on the near arch its surface runs back from, and which surface it is on.
 * @param {number} x
 * @param {number} y
 * @returns {{ depth: number, qx: number, qy: number, surface: 'court' | 'floor' | 'wall' | 'vault' }}
 */
function passagePoint(x, y) {
	let depth = 1;
	if (inOpening(x, y)) {
		for (let s = FAR; s <= 1.0001; s += 0.01) {
			const qx = Math.round(VANISH.x + (x - VANISH.x) / s);
			const qy = Math.round(VANISH.y + (y - VANISH.y) / s);
			if (inOpening(qx, qy)) {
				depth = s;
				break;
			}
		}
	}
	const qx = VANISH.x + (x - VANISH.x) / depth;
	const qy = VANISH.y + (y - VANISH.y) / depth;
	/** @type {'court' | 'floor' | 'wall' | 'vault'} */
	let surface = 'vault';
	if (depth <= FAR) {
		surface = 'court';
	} else if (qy >= ARCH.threshold - 0.5) {
		surface = 'floor';
	} else if (qy >= ARCH.spring) {
		surface = 'wall';
	}
	return { depth, qx, qy, surface };
}

/**
 * The courtyard through the far arch: cool dusk sky over the grey wall across the yard, one window lit
 * in it, and the cobbles in front.
 * @param {number} qx - The point's place in the near opening
 * @param {number} qy
 * @returns {Colour}
 */
function courtyard(qx, qy) {
	if (qy < ARCH.spring - 4) {
		return COURT_SKY;
	}
	if (qy < ARCH.spring + 1) {
		return COURT_SKY_LOW;
	}
	if (qy < ARCH.threshold - 4) {
		const window =
			qx > ARCH.x + 1 &&
			qx < ARCH.x + 7 &&
			qy > ARCH.spring + 3 &&
			qy < ARCH.spring + 9;
		if (window) {
			return C.gold;
		}
		return qx < ARCH.x - 5 ? COURT_WALL_SHADE : COURT_WALL;
	}
	return COURT_GROUND;
}

/**
 * The portcullis, hauled up in its groove just inside the arch: a lattice of iron bars, lit warm on one
 * side, whose pointed teeth hang dark against the courtyard's sky.
 * @param {Canvas} layer
 */
function drawPortcullis(layer) {
	const rail = 27;
	for (let x = ARCH.x - ARCH.half; x <= ARCH.x + ARCH.half; x++) {
		// A bar every four columns, one of them on the arch's middle.
		const bar = (x - ARCH.x + 41) % 4;
		for (let y = 0; y <= rail + 3; y++) {
			if (!inOpening(x, y)) {
				continue;
			}
			if (y === rail - 5 || y === rail) {
				set(layer, x, y, IRON_LIGHT);
			} else if (y === rail - 4 || y === rail + 1) {
				set(layer, x, y, IRON);
			}
			const tooth = y - rail;
			const solid = tooth <= 2 || bar === 1;
			if ((bar === 1 || bar === 2) && solid) {
				set(layer, x, y, bar === 1 && tooth < 2 ? IRON_LIGHT : IRON);
			}
		}
	}
}

/**
 * The moat: dark water under the wall, with the dusk sky caught on its ripples.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawMoat(layer, random) {
	for (let y = WATER; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const near = y < WATER + 3;
			set(
				layer,
				x,
				y,
				near || (x * 3 + y) % 7 === 0 ? WATER_MID : WATER_DARK
			);
		}
	}
	// The wall's foot, where the water laps it.
	for (let x = 0; x < 64; x++) {
		set(layer, x, WATER, x % 5 === 0 ? RIPPLE : WATER_MID);
	}
	for (let i = 0; i < 26; i++) {
		const y = WATER + 2 + Math.floor(random() * (63 - WATER));
		const x = Math.floor(random() * 62);
		const length = 2 + Math.floor(random() * 4);
		rect(layer, x, y, length, 1, random() < 0.5 ? RIPPLE : WATER_MID);
	}
	// The near bank's stone pier, still waiting for the free end to come down onto it.
	for (let y = PIER; y < 64; y++) {
		for (let x = BRIDGE.end.left - 2; x <= BRIDGE.end.right + 2; x++) {
			let colour = STONE;
			if (y === PIER) {
				colour = STONE_LIGHT;
			} else if (
				(x + (y > PIER + 2 ? 4 : 0)) % 8 === 0 ||
				y === PIER + 2
			) {
				colour = STONE_MID;
			}
			set(layer, x, y, colour);
		}
	}
	// The free end's shadow on the water under it.
	for (let y = BRIDGE.end.y + 3; y < BRIDGE.end.y + 6; y++) {
		const inset = y - BRIDGE.end.y - 2;
		rect(
			layer,
			BRIDGE.end.left + inset,
			y,
			BRIDGE.end.right - BRIDGE.end.left - inset * 2,
			1,
			SHADOW
		);
	}
}

/**
 * The gatehouse face: coursed stone with staggered joints, a damp band at its foot, a corbelled parapet
 * along the top with merlons against the sky, and the opening left empty for the passage.
 * @param {Canvas} wall
 * @param {() => number} random
 */
function drawWall(wall, random) {
	for (let y = CRENEL; y < WATER; y++) {
		const course = Math.floor((y - WALL_TOP) / 4);
		const offset = (course % 2) * 4;
		for (let x = 0; x < 64; x++) {
			if (inOpening(x, y)) {
				continue;
			}
			let colour = STONE;
			if ((y - WALL_TOP) % 4 === 3 || (x + offset) % 8 === 0) {
				colour = STONE_MID;
			} else if ((y - WALL_TOP) % 4 === 0) {
				colour = STONE_LIGHT;
			}
			if (y >= WATER - 4 && (y >= WATER - 2 || (x + y) % 2 === 0)) {
				colour = colour === STONE_MID ? STONE_SHADE : DAMP;
			}
			set(wall, x, y, colour);
		}
	}
	// A few blocks darker or paler than their neighbours.
	for (let i = 0; i < 16; i++) {
		const course = Math.floor(random() * 7);
		const block = Math.floor(random() * 8);
		const top = WALL_TOP + course * 4 + 1;
		const left = block * 8 + (course % 2) * 4 + 1;
		const tone = random() < 0.5 ? STONE_MID : STONE_LIGHT;
		for (let y = top; y < top + 2; y++) {
			for (let x = left; x < left + 6; x++) {
				if (!inOpening(x, y) && x < 64) {
					set(wall, x, y, tone);
				}
			}
		}
	}
	drawParapet(wall);
	drawSlots(wall);
}

/**
 * The parapet: merlons with crenels between them, a band along its foot, and corbels under it with dark
 * gaps where defenders could drop stones.
 * @param {Canvas} wall
 */
function drawParapet(wall) {
	for (let x = 0; x < 64; x++) {
		// A crenel is centred over the arch, so the battlements match on either side.
		const step = (x + 6) % 8;
		const merlon = step < 5;
		for (let y = merlon ? MERLON_TOP : CRENEL; y < CORBELS; y++) {
			let colour = STONE;
			if (y === MERLON_TOP || (y === CRENEL && !merlon) || step === 0) {
				colour = STONE_LIGHT;
			} else if (step === 4) {
				colour = STONE_MID;
			}
			set(wall, x, y, colour);
		}
		set(wall, x, CORBELS - 1, STONE_LIGHT);
		const gap = x % 4 === 2 || x % 4 === 3;
		set(wall, x, CORBELS, gap ? VAULT : STONE_MID);
		set(wall, x, CORBELS + 1, gap ? VAULT : STONE_SHADE);
		set(wall, x, CORBELS + 2, STONE_SHADE);
	}
}

/**
 * The slots high in the wall the chains run up into.
 * @param {Canvas} wall
 */
function drawSlots(wall) {
	for (const { to } of CHAINS) {
		rect(wall, to[0] - 1, to[1] - 1, 3, 3, VAULT);
		set(wall, to[0], to[1] + 2, STONE_SHADE);
	}
}

/**
 * The ring of wedge stones round the arch, and the dressed stones of its jambs, a shade paler than the wall.
 * @param {Canvas} wall
 */
function drawArchRing(wall) {
	for (let y = WALL_TOP; y <= ARCH.threshold; y++) {
		for (
			let x = ARCH.x - ARCH.half - RING;
			x <= ARCH.x + ARCH.half + RING;
			x++
		) {
			if (inOpening(x, y)) {
				continue;
			}
			const dx = Math.abs(x - ARCH.x);
			let inRing = false;
			let joint = false;
			let lit = false;
			if (y < ARCH.spring) {
				const r = Math.hypot(dx + ARCH.point, y - ARCH.spring);
				inRing = r <= ARCH.half + ARCH.point + RING;
				// Joints radiate from the arch's centres every few degrees.
				const angle = Math.atan2(ARCH.spring - y, dx + ARCH.point);
				joint =
					Math.round(angle * 9) % 2 === 0 &&
					Math.abs(angle * 9 - Math.round(angle * 9)) < 0.18;
				lit = r <= ARCH.half + ARCH.point + 1;
			} else {
				inRing = dx <= ARCH.half + RING;
				joint = (y - ARCH.spring) % 4 === 3;
				lit = dx === ARCH.half + 1;
			}
			if (inRing) {
				set(wall, x, y, joint ? STONE_MID : lit ? STONE_LIGHT : STONE);
			}
		}
	}
}

/**
 * The drawbridge, nearly down: heavy planks running out from the threshold, bound with iron straps,
 * and the thickness of its free end still hanging over the water.
 * @param {Canvas} front
 * @param {() => number} random
 */
function drawBridge(front, random) {
	const { hinge, end, planks } = BRIDGE;
	for (let y = hinge.y; y <= end.y; y++) {
		const t = (y - hinge.y) / (end.y - hinge.y);
		const left = Math.round(hinge.left + (end.left - hinge.left) * t);
		const right = Math.round(hinge.right + (end.right - hinge.right) * t);
		const strap = y === hinge.y + 3 || y === end.y - 2;
		for (let x = left; x <= right; x++) {
			const along = ((x - left) / (right - left + 1)) * planks;
			const seam =
				along - Math.floor(along) < planks / (right - left + 1);
			let colour =
				Math.floor(along) % 2
					? C.timber
					: mix(C.timber, C.timberLight, 0.5);
			if (seam && x > left) {
				colour = C.timberShade;
			} else if (strap) {
				colour = IRON;
			} else if (random() < 0.08) {
				colour = C.timberShade;
			}
			set(front, x, y, colour);
		}
	}
	// The free end's thickness: an iron edge and the dark end grain under it.
	for (let x = end.left; x <= end.right; x++) {
		set(front, x, end.y + 1, IRON);
		set(front, x, end.y + 2, x % 6 === 0 ? C.wood : C.timberShade);
	}
}

/**
 * The two chains, taut from the bridge's free end up into their slots, their links catching the light.
 * @param {Canvas} front
 */
function drawChains(front) {
	for (const { from, to } of CHAINS) {
		const steps = Math.max(
			Math.abs(to[0] - from[0]),
			Math.abs(to[1] - from[1])
		);
		for (let i = 0; i <= steps; i++) {
			const x = Math.round(from[0] + ((to[0] - from[0]) * i) / steps);
			const y = Math.round(from[1] + ((to[1] - from[1]) * i) / steps);
			// Every other link is seen face on, a pixel wider, between links seen edge on.
			if (i % 3 === 0) {
				set(front, x, y, IRON_LIGHT);
				set(front, x + 1, y, IRON);
			} else {
				set(front, x, y, i % 3 === 1 ? IRON : IRON_LIGHT);
			}
		}
		// The iron eye on the bridge the chain is shackled to.
		rect(front, from[0] - 1, from[1], 3, 2, IRON);
	}
}

/**
 * The torches' iron brackets: a plate on the wall, an arm and a cup the torch stands in.
 * @param {Canvas} front
 */
function drawBrackets(front) {
	for (const { x, y } of TORCHES) {
		rect(front, x - 1, y + 9, 3, 4, IRON);
		rect(front, x, y + 6, 1, 3, IRON_LIGHT);
		rect(front, x - 2, y + 4, 5, 2, IRON);
		rect(front, x - 1, y + 4, 3, 1, IRON_LIGHT);
		// The torch's wooden haft in the cup.
		rect(front, x, y + 2, 1, 2, C.timber);
	}
}

/**
 * One torch's flame, flaring up from its cup and leaning a little in the evening air.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number }} torch
 */
function drawFlame(canvas, { x, y }) {
	paint(
		canvas,
		x - 3,
		y - 5,
		[
			'...r...',
			'..ra...',
			'..rar..',
			'.raga..',
			'.ragar.',
			'ragla.r',
			'raglgar',
			'.agwga.',
			'.aglga.',
			'..aaa..',
		],
		FLAME,
		{ mirror: x > 32 }
	);
}

/**
 * A torch's broken reflection in the moat: dashes of gold under it, shorter and dimmer further out.
 * @param {Canvas} canvas
 * @param {{ x: number, y: number }} torch
 */
function drawReflection(canvas, { x }) {
	for (let y = WATER + 1, i = 0; y < PIER; y += 2, i++) {
		const half = i < 2 ? 2 : i < 5 ? 1 : 0;
		const shift = i % 2 ? 1 : -1;
		const colour =
			i < 3 ? C.gold : i < 6 ? C.amber : mix(C.amber, WATER_DARK, 0.5);
		rect(canvas, x - half + shift, y, half * 2 + 1, 1, colour);
	}
}

/**
 * The brightest glints: the eyes the chains are shackled to, caught by the torches.
 * @param {Canvas} canvas
 */
function drawGlints(canvas) {
	for (const { from } of CHAINS) {
		set(canvas, from[0], from[1], C.lampGlow);
	}
}
