// Space tile 11: planetfall seen from high above, a wedge of five drop pods plunging on trails of orange entry fire towards a bank of cloud over an ochre desert world, its hazy rim curving against space.
import {
	createCanvas,
	set,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { glow } from '../../effects.js';
import { PALETTE as C } from '../../palette.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * A drop pod: where its heat shield is, and its size, from 1 (a wing) to 2 (the leader).
 * @typedef {{ x: number, y: number, size: number }} Pod
 */

/**
 * A heap of cloud on the ground's plan: its centre across (u) and away (v), its reach across and away,
 * and how many round puffs it is built of.
 * @typedef {{ u: number, v: number, ru: number, rv: number, puffs: number }} Heap
 */

/**
 * One round puff of a heap, on the ground's plan.
 * @typedef {{ u: number, v: number, r: number }} Puff
 */

/** The planet's rim: a circle far below the frame, so it curves gently across the top. */
const WORLD = { x: 30, y: 128, r: 117 };

/** How far away the foot of the frame is, on the ground's plan, so that the plan reads 0 there and rises towards the rim. */
const NEAR = 75 * Math.log(1 + 52 / 25);

/** The pods' heading, down the frame and to the right, and the line across it. */
const HEADING = unit(0.25, 0.97);
const ACROSS = { x: -HEADING.y, y: HEADING.x };

/** The leader, where the wedge points. */
const LEADER = { x: 33, y: 46 };

/** The pods: the leader, then two rows of wings, each row further back and wider apart, as [back, side, size]. */
const PODS = /** @type {Pod[]} */ (
	[
		[0, 0, 2],
		[9, -9, 1],
		[9, 9, 1],
		[18, -17, 1],
		[18, 17, 1],
	].map(([back, side, size]) => ({
		x: Math.round(LEADER.x - back * HEADING.x + side * ACROSS.x),
		y: Math.round(LEADER.y - back * HEADING.y + side * ACROSS.y),
		size,
	}))
);

/** How long each trail's fire is, and the fading embers and smoke beyond it. */
const FLAME = 16;
const EMBERS = 10;

/** The clouds: a great bank ahead of the pods with a smaller heap beside it, two heaps over the plateau and the dunes, and two far off towards the rim. */
const HEAPS = /** @type {Heap[]} */ ([
	{ u: 44, v: 5, ru: 14, rv: 7, puffs: 18 },
	{ u: 62, v: 14, ru: 6, rv: 4, puffs: 5 },
	{ u: 8, v: 22, ru: 5, rv: 4, puffs: 5 },
	{ u: 27, v: 52, ru: 4, rv: 3, puffs: 4 },
	{ u: 9, v: 70, ru: 5, rv: 2, puffs: 4 },
	{ u: 52, v: 72, ru: 5, rv: 2, puffs: 4 },
]);

/** Space above the rim, from the top down. */
const SPACE = [mix(C.ink, C.night, 0.5), C.nightSky1, C.nightSky2];

/** The thin air on the rim, from the bright line on the ground up into space. */
const RIM = [
	mix(C.sandLight, C.creamLight, 0.6),
	mix(C.duskSky6, C.sandLight, 0.3),
	mix(C.duskSky4, C.duskSky3, 0.5),
	mix(C.duskSky2, C.nightSky2, 0.4),
];

/** The ochre desert: pale dune crests, sand, ochre troughs, the rust plateau, its shaded cliffs and the canyon floor. */
const GROUND = {
	crest: mix(C.sandLight, C.sand, 0.35),
	sand: mix(C.sand, C.amber, 0.3),
	trough: mix(C.sandShade, C.amber, 0.4),
	rust: mix(C.timberLight, C.amber, 0.35),
	rustDark: mix(C.timberLight, C.brickRedShade, 0.3),
	cliff: mix(C.timber, C.brickRedShade, 0.35),
	canyon: mix(C.timberShade, C.brickRedShade, 0.4),
};

/** The haze the ground fades into towards the rim. */
const HAZE = mix(C.sandLight, C.duskSky6, 0.25);

/** The clouds: lit tops, their bodies and shaded sides, and their shadows on the sand. */
const CLOUD = {
	lit: C.white,
	main: C.creamLight,
	side: C.cream,
	shade: mix(C.creamShade, C.sandShade, 0.25),
	shadow: mix(C.sandShade, C.timber, 0.5),
};

/** The entry fire, from the white-hot shock at a pod's shield back to the embers. */
const FIRE = {
	core: C.white,
	hot: C.lampGlow,
	flame: mix(C.gold, C.amber, 0.4),
	burn: mix(C.amber, C.brickRedLight, 0.3),
	ember: mix(C.amber, C.brickRed, 0.6),
	char: mix(C.brickRedShade, C.timber, 0.4),
	smoke: mix(C.stoneShade, C.timberLight, 0.35),
};

/** The pods' dark hulls, lit from the sun at the upper left, their dark backs, and the cherry-red rim of the shield. */
const HULL = {
	lit: C.stoneLight,
	main: C.stoneMid,
	shade: C.stoneShade,
	dark: mix(C.stoneShade, C.ink, 0.5),
	shield: C.brickRedLight,
};

/** The capsules, nearly upright as they fall, as rows of keys: a wing's and the bigger leader's, shield at the foot. */
const CAPSULES = {
	1: ['.dd.', 'lmms', 'lmms', 'rrrr'],
	2: ['..dd..', '.lmms.', '.lmms.', 'llmmss', 'lmmmss', 'rrrrrr'],
};

/** Colours the fire's glow leaves alone. */
const UNLIT = [...Object.values(FIRE), ...Object.values(HULL), C.ink];

/**
 * Draws space tile 11.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const layer = createCanvas(64, 64);
	const random = seededRandom(11711);
	drawSpace(layer, random);
	drawGround(layer);
	drawClouds(layer, random);
	for (const pod of PODS) {
		drawTrail(layer, pod);
	}
	for (const pod of PODS) {
		glow(layer, {
			x: pod.x,
			y: pod.y,
			radius: 6 + pod.size * 2,
			colour: C.amber,
			strength: 0.5,
			steps: 2,
			skip: UNLIT,
		});
	}
	for (const pod of PODS) {
		drawShock(layer, pod);
	}

	// Only the hulls are outlined: dark capsules riding the head of their fire.
	const hulls = createCanvas(64, 64);
	for (const pod of PODS) {
		drawHull(hulls, pod);
	}
	outline(hulls, C.ink);
	underlay(hulls, layer);
	return hulls;
}

/**
 * Scales a pair to unit length.
 * @param {number} x
 * @param {number} y
 * @returns {{ x: number, y: number }}
 */
function unit(x, y) {
	const n = Math.hypot(x, y);
	return { x: x / n, y: y / n };
}

/**
 * The rim's row at a column.
 * @param {number} x
 * @returns {number}
 */
function rimAt(x) {
	return WORLD.y - Math.sqrt(WORLD.r ** 2 - (x + 0.5 - WORLD.x) ** 2);
}

/**
 * Where a pixel lies on the ground's plan: its column across, and how far away it is, from 0 at the foot
 * of the frame rising to about 84 at the rim, squeezed ever tighter towards the rim.
 * @param {number} x
 * @param {number} y
 * @returns {{ u: number, v: number, below: number }}
 */
function groundAt(x, y) {
	const below = y + 0.5 - rimAt(x);
	return {
		u: x,
		v: NEAR - 75 * Math.log(1 + Math.max(0, below) / 25),
		below,
	};
}

/**
 * Space above the rim, with a few stars, and the thin glowing air along the rim.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawSpace(layer, random) {
	for (let y = 0; y < 24; y++) {
		for (let x = 0; x < 64; x++) {
			const above = rimAt(x) - y - 0.5;
			if (above < 0) {
				continue;
			}
			const band = Math.floor(above);
			const colour =
				band < RIM.length
					? RIM[band]
					: SPACE[Math.min(2, Math.floor(y / 4))];
			set(layer, x, y, colour);
		}
	}
	for (let i = 0; i < 18; i++) {
		const x = Math.floor(random() * 64);
		const y = Math.floor(random() * 9);
		const bright = random();
		if (rimAt(x) - y > 5) {
			set(layer, x, y, bright > 0.6 ? C.white : C.starDim);
		}
	}
}

/**
 * The desert below, fading into haze at the rim.
 * @param {Canvas} layer
 */
function drawGround(layer) {
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { u, v, below } = groundAt(x, y);
			if (below < 0) {
				continue;
			}
			let colour = terrain(u, v);
			if (below < 2) {
				colour = HAZE;
			} else if (below < 5) {
				colour = mix(colour, HAZE, 0.6);
			} else if (below < 10) {
				colour = mix(colour, HAZE, 0.3);
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * How far a point of the plan lies inside the rust plateau on the left: above 0 is on top of it.
 * @param {number} u
 * @param {number} v
 * @returns {number}
 */
function plateau(u, v) {
	return (
		22 +
		5 * Math.sin(v * 0.17 + 0.5) +
		3 * Math.sin(v * 0.43) -
		u -
		Math.max(0, v - 62) * 0.6
	);
}

/**
 * The bare desert at a point of the plan: a rust plateau cut by a canyon, a sea of long dunes, and an old crater far off.
 * @param {number} u - Across
 * @param {number} v - Away from the viewer
 * @returns {Colour}
 */
function terrain(u, v) {
	const crater = Math.hypot(u - 55, (v - 46) * 1.2);
	if (crater < 6) {
		if (crater > 4.6) {
			return v > 46 ? GROUND.cliff : GROUND.crest;
		}
		return GROUND.trough;
	}
	const top = plateau(u, v);
	const canyon = Math.abs(v - 36 - 3 * Math.sin(u * 0.3) - u * 0.25);
	if (top > 0 && canyon < 1.3) {
		return canyon < 0.6 ? GROUND.canyon : GROUND.cliff;
	}
	if (top > 0) {
		// The plateau's cliff faces the lower right, away from the sun.
		if (top < 1.6) {
			return GROUND.cliff;
		}
		// Eroded ridges run across the plateau's top.
		const ridge = Math.sin(v * 0.55 + u * 0.2 + 2 * Math.sin(u * 0.15));
		return ridge > 0.8 ? GROUND.rustDark : GROUND.rust;
	}
	// The dunes run in long ridges, curving gently.
	const ridge = Math.sin(
		u * 0.32 + v * 0.62 + 1.8 * Math.sin(u * 0.09 + v * 0.05)
	);
	if (ridge > 0.72) {
		return GROUND.crest;
	}
	if (ridge < -0.55) {
		return GROUND.trough;
	}
	return GROUND.sand;
}

/**
 * Builds each heap of cloud from round puffs scattered inside its reach, the biggest towards its middle.
 * @param {() => number} random
 * @returns {Puff[]}
 */
function puffs(random) {
	/** @type {Puff[]} */
	const all = [];
	for (const heap of HEAPS) {
		for (let i = 0; i < heap.puffs; i++) {
			const angle = random() * Math.PI * 2;
			const reach = Math.sqrt(random());
			all.push({
				u: heap.u + Math.cos(angle) * reach * heap.ru,
				v: heap.v + Math.sin(angle) * reach * heap.rv,
				r:
					(1 - reach * 0.5) *
						Math.min(heap.ru, heap.rv * 1.6) *
						0.55 +
					1.2,
			});
		}
	}
	// Nearer puffs (lower v) are painted last, over the ones behind them.
	return all.sort((a, b) => b.v - a.v);
}

/**
 * The clouds over the desert: heaps of round puffs lit from the upper left, each heap casting its shadow down and to the right.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawClouds(layer, random) {
	const all = puffs(random);
	/** @type {(Puff | null)[]} */
	const top = new Array(64 * 64).fill(null);
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { u, v, below } = groundAt(x, y);
			if (below < 1) {
				continue;
			}
			const over = (/** @type {Puff} */ puff, du = 0, dv = 0) =>
				Math.hypot(u - puff.u + du, v - puff.v + dv) < puff.r;
			const puff = all.findLast((p) => over(p)) ?? null;
			top[y * 64 + x] = puff;
			if (!puff && below > 4 && all.some((p) => over(p, -3, 2.5))) {
				set(layer, x, y, CLOUD.shadow);
			}
		}
	}
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const puff = top[y * 64 + x];
			if (!puff) {
				continue;
			}
			const { u, v, below } = groundAt(x, y);
			// Where on its puff this point lies: towards the sun (upper left) is lit, away from it shaded.
			const lean = (u - puff.u - (v - puff.v)) / (puff.r * 1.4);
			const edge = Math.hypot(u - puff.u, v - puff.v) / puff.r;
			let colour = CLOUD.main;
			if (lean < -0.35) {
				colour = CLOUD.lit;
			} else if (lean > 0.45 && edge > 0.6) {
				colour = CLOUD.shade;
			} else if (lean > 0.15) {
				colour = CLOUD.side;
			}
			set(layer, x, y, below < 7 ? mix(colour, HAZE, 0.35) : colour);
		}
	}
}

/**
 * Measures a pixel against a pod: how far back along its trail it lies, and how far to the side.
 * @param {Pod} pod
 * @param {number} x
 * @param {number} y
 * @returns {{ back: number, side: number }}
 */
function track(pod, x, y) {
	const dx = x - pod.x;
	const dy = y - pod.y;
	return {
		back: -(dx * HEADING.x + dy * HEADING.y),
		side: dx * ACROSS.x + dy * ACROSS.y,
	};
}

/**
 * A pod's trail, back up the sky behind it: a thin white-hot core in gold flame, burning down to amber, embers and a broken char-red streak.
 * @param {Canvas} layer
 * @param {Pod} pod
 */
function drawTrail(layer, pod) {
	const length = FLAME + pod.size * 5;
	for (let y = 0; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const { back, side } = track(pod, x, y);
			const t = back / length;
			if (back < 0 || t > 1 + EMBERS / length) {
				continue;
			}
			const s = Math.abs(side);
			if (t > 1) {
				// Embers, then smoke, ever more of it gaps towards the end.
				const e = (t - 1) * (length / EMBERS);
				const solid = e < 0.55 || (x + y) % 2 === 1;
				if (s < 0.9 - e * 0.4 && solid) {
					set(layer, x, y, e < 0.25 ? FIRE.char : FIRE.smoke);
				}
				continue;
			}
			const width = (1.4 + pod.size * 0.9) * (1 - t) ** 1.3 + 0.5;
			if (s > width + 0.7) {
				continue;
			}
			let colour;
			if (s > width) {
				colour = t < 0.4 ? FIRE.burn : FIRE.char;
			} else if (s < width * 0.45) {
				colour = t < 0.35 ? FIRE.core : t < 0.6 ? FIRE.hot : FIRE.flame;
			} else {
				colour =
					t < 0.4 ? FIRE.flame : t < 0.75 ? FIRE.burn : FIRE.ember;
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The shock of air ahead of a pod's heat shield: a white-hot teardrop round its front, ringed in gold and amber.
 * @param {Canvas} layer
 * @param {Pod} pod
 */
function drawShock(layer, pod) {
	const r = 2.2 + pod.size * 0.9;
	for (let y = pod.y - 7; y <= pod.y + 7; y++) {
		for (let x = pod.x - 7; x <= pod.x + 7; x++) {
			const { back, side } = track(pod, x, y);
			// Round ahead of the shield, drawn out behind it into the trail.
			const d = Math.hypot(back > 0 ? back * 0.5 : back, side);
			if (d > r + 1.2) {
				continue;
			}
			set(
				layer,
				x,
				y,
				d < r - 1 ? FIRE.core : d < r ? FIRE.hot : FIRE.flame
			);
		}
	}
}

/**
 * A pod's hull: a squat capsule seen from the side as it falls, its narrow back dark, lit on the side
 * towards the sun, its red-hot shield at its foot just inside the fireball.
 * @param {Canvas} hulls
 * @param {Pod} pod
 */
function drawHull(hulls, pod) {
	const rows = CAPSULES[/** @type {1 | 2} */ (pod.size)];
	const w = rows[0].length;
	paint(hulls, pod.x - Math.floor(w / 2), pod.y - rows.length, rows, {
		d: HULL.dark,
		l: HULL.lit,
		m: HULL.main,
		s: HULL.shade,
		r: HULL.shield,
	});
}
