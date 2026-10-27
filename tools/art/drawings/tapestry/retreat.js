// Retreat: a column of soldiers seen from behind, trudging over a stone bridge into the misty sunset under a tattered flag.
import {
	createCanvas,
	get,
	set,
	line,
	paint,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/**
 * The bridge is laid out in its own units and seen in perspective. A point u along the bridge (away from the viewer),
 * v across it (positive towards the viewer) and h below the eye sits at camera offset X = OX + u·sin + v·cos and
 * depth D = OD + u·cos − v·sin, and is seen at (CENTRE + X·FOCAL/D, HORIZON + h·FOCAL/D).
 */
const HORIZON = 27;
const CENTRE = 32;
const FOCAL = 36;
const ANGLE = (42 * Math.PI) / 180;
const SIN = Math.sin(ANGLE);
const COS = Math.cos(ANGLE);
const ORIGIN = { X: -11, D: 18 };

/** Heights below the eye: the kerb tops, the deck, the arches' springing and the river. */
const KERB = 15;
const DECK = 18;
const SPRING = 27;
const WATER = 34;

/** Half the deck's width, the kerbs' thickness, and how far the bridge runs. */
const HALF = 10;
const KERB_WIDTH = 2;
const START = -20;
const END = 250;

/** The arches along the bridge: their centres and radius. */
const ARCHES = [8, 24, 40, 56, 72, 88, 104, 120, 136, 152, 168, 184];
const ARCH_RADIUS = 6;

/** Stone in shadow against the low sun, and its edges lit by it. */
const FACE = mix(C.roof, C.stoneShade, 0.45);
const FACE_LIGHT = mix(C.stoneShade, C.duskSky3, 0.35);
const FACE_DARK = mix(C.roofShade, C.ink, 0.15);
const RIM = mix(C.stoneLight, C.duskSky6, 0.45);
const VOUSSOIR = mix(C.stoneMid, C.duskSky4, 0.35);
const DECK_STONE = mix(C.stoneMid, C.duskSky3, 0.35);
const DECK_JOINT = mix(C.stoneShade, C.roof, 0.35);

/** The sunset seen through the arches, and the mist rising off the river. */
const THROUGH = mix(C.duskSky5, C.duskSky6, 0.5);
const MIST = mix(C.duskSky5, C.cream, 0.45);

/** Wisps of mist lying on the river: centre, half-length, half-height, and how far the right-hand end curls up. */
const WISPS = [
	[12, 33, 14, 1.6, 3],
	[32, 35, 9, 1.3, 2],
	[55, 47, 9, 1.8, 3],
	[58, 59, 8, 1.6, 2],
];

/**
 * Draws the Retreat scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	// Seed 263 sets the dusk sky's own sun at column 55, where the bridge runs into the sunset: keep it.
	const random = seededRandom(263);

	drawSky(layer, { time: 'dusk', horizon: HORIZON, random });
	drawFarBank(layer);
	drawRiver(layer, random);

	// The bridge stands behind the soldiers, so it gets its own outline.
	const bridge = createCanvas(64, 64);
	drawBridge(bridge);
	outline(bridge, C.ink);

	drawColumn(scene);
	outline(scene, C.ink);
	const soldiers = scene.p.map(Boolean);
	underlay(scene, bridge);
	underlay(scene, layer);
	drawMist(scene, soldiers);
	return scene;
}

/**
 * Low hills on the far bank, dark against the sunset, parting where the river runs away under the sun.
 * @param {Canvas} layer
 */
function drawFarBank(layer) {
	const ridge = mix(C.headlandRidge, C.duskSky4, 0.35);
	const hill = mix(C.headland, C.duskSky3, 0.3);
	for (let x = 0; x < 64; x++) {
		const gap = Math.max(0, 1 - Math.abs(x - 55) / 9);
		const top = Math.round(
			23 +
				Math.sin(x * 0.17 + 1) * 1.6 +
				Math.sin(x * 0.41) * 0.8 +
				gap * 4
		);
		for (let y = top; y <= HORIZON; y++) {
			set(layer, x, y, y === top ? ridge : hill);
		}
	}
}

/**
 * The river: the sunset's colours reflected near the far bank, darkening towards the viewer, with the sun's glitter.
 * @param {Canvas} layer
 * @param {() => number} random
 */
function drawRiver(layer, random) {
	const ramp = [
		C.duskSky5,
		C.duskSky4,
		C.duskSky3,
		mix(C.duskSky3, C.duskSky2, 0.5),
		C.duskSky2,
		mix(C.duskSky2, C.roofShade, 0.5),
		mix(C.duskSky2, C.roofShade, 0.8),
	];
	for (let y = HORIZON + 1; y < 64; y++) {
		const t = Math.min(ramp.length - 1, Math.floor((y - HORIZON - 1) / 5));
		for (let x = 0; x < 64; x++) {
			set(layer, x, y, ramp[t]);
		}
	}
	// The sun's glitter: a broken path of short strokes, widening and thinning towards the viewer.
	for (let y = HORIZON + 2; y < 64; y += 2) {
		const half = 1 + Math.floor((y - HORIZON) / 8);
		const count = y < HORIZON + 12 ? 3 : 2;
		for (let i = 0; i < count; i++) {
			const x = 55 - half + Math.floor(random() * (half * 2));
			const colour = y < HORIZON + 12 ? C.gold : C.duskSky5;
			set(layer, x, y, colour);
			set(layer, x + 1, y, colour);
		}
	}
}

/**
 * Finds the point on a level surface (h below the eye) behind a screen pixel, in the bridge's own units.
 * @param {number} x
 * @param {number} y
 * @param {number} h
 * @returns {{ u: number, v: number } | null} Null above the horizon.
 */
function onLevel(x, y, h) {
	if (y <= HORIZON) {
		return null;
	}
	const D = (FOCAL * h) / (y - HORIZON);
	const X = ((x - CENTRE) * D) / FOCAL;
	const dX = X - ORIGIN.X;
	const dD = D - ORIGIN.D;
	return { u: dX * SIN + dD * COS, v: dX * COS - dD * SIN };
}

/**
 * Finds the point on an upright side of the bridge (v across) behind a screen pixel.
 * @param {number} x
 * @param {number} y
 * @param {number} v
 * @returns {{ u: number, h: number } | null} Null where the side would lie behind the eye.
 */
function onSide(x, y, v) {
	const k = (x - CENTRE) / FOCAL;
	const a = ORIGIN.X + v * COS;
	const b = ORIGIN.D - v * SIN;
	const u = (a - k * b) / (k * COS - SIN);
	const D = b + u * COS;
	if (D <= 1) {
		return null;
	}
	return { u, h: ((y - HORIZON) * D) / FOCAL };
}

/**
 * Tells whether a point on the bridge's near side is open under an arch, or on an arch's ring of voussoirs.
 * @param {number} u
 * @param {number} h
 * @returns {'open' | 'ring' | null}
 */
function arch(u, h) {
	for (const centre of ARCHES) {
		const along = Math.abs(u - centre);
		const rise = h >= SPRING ? 0 : SPRING - h;
		const distance = Math.hypot(along, rise);
		if (distance < ARCH_RADIUS) {
			return 'open';
		}
		if (distance < ARCH_RADIUS + 1.5) {
			return 'ring';
		}
	}
	return null;
}

/**
 * The bridge, worked out pixel by pixel from the far side to the near side, so nearer faces cover farther ones:
 * the far kerb, the cobbled deck, the near kerb's lit top and the near side with its arches.
 * @param {Canvas} bridge
 */
function drawBridge(bridge) {
	const along = (/** @type {number} */ u) => u >= START && u <= END;
	for (let y = HORIZON + 1; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			// The far kerb's inner face.
			const far = onSide(x, y, -HALF);
			if (far && along(far.u) && far.h >= KERB && far.h <= DECK) {
				set(bridge, x, y, far.h < KERB + 1 ? RIM : FACE_LIGHT);
			}
			// The deck: cobbles in staggered courses.
			const deck = onLevel(x, y, DECK);
			if (
				deck &&
				along(deck.u) &&
				deck.v >= -HALF &&
				deck.v <= HALF - KERB_WIDTH
			) {
				const course = Math.floor(deck.u / 4);
				const shifted = deck.v + (course % 2) * 2.5;
				const joint =
					Math.abs(deck.u / 4 - Math.round(deck.u / 4)) < 0.14 ||
					Math.abs(shifted / 5 - Math.round(shifted / 5)) < 0.1;
				set(bridge, x, y, joint ? DECK_JOINT : DECK_STONE);
			}
			// The tops of both kerbs, lit by the sun ahead.
			const top = onLevel(x, y, KERB);
			if (
				top &&
				along(top.u) &&
				((top.v >= HALF - KERB_WIDTH && top.v <= HALF) ||
					(top.v >= -HALF - KERB_WIDTH && top.v <= -HALF))
			) {
				set(bridge, x, y, RIM);
			}
			// The near side, with its arches.
			const side = onSide(x, y, HALF);
			if (side && along(side.u) && side.h >= KERB && side.h <= WATER) {
				const kind = arch(side.u, side.h);
				const course =
					Math.abs(side.h / 4 - Math.round(side.h / 4)) < 0.12;
				let colour = course ? FACE_DARK : FACE;
				if (side.h < KERB + 1.2) {
					colour = RIM;
				} else if (side.h < DECK + 1) {
					colour = FACE_LIGHT;
				} else if (kind === 'ring') {
					colour = VOUSSOIR;
				} else if (kind === 'open') {
					// Under the arch: its dark underside, then the sunset on the far side.
					colour = side.h < SPRING - 3 ? FACE_DARK : THROUGH;
				}
				set(bridge, x, y, colour);
			}
		}
	}
}

/**
 * The column: soldiers seen from behind, the nearest three large in the foreground (a wounded spearman with his pack,
 * the flag-bearer with a shield slung on his back, a shield-bearer), the rest shrinking to specks in the mist.
 * @param {Canvas} scene
 */
function drawColumn(scene) {
	/** @type {Record<string, Colour>} */
	const red = {
		r: mix(C.stoneLight, C.duskSky6, 0.5),
		H: C.stoneMid,
		h: C.stoneShade,
		k: mix(C.stoneShade, C.ink, 0.3),
		n: C.skinShade,
		C: C.brickRedShade,
		c: mix(C.brickRedShade, C.ink, 0.35),
		R: mix(C.creamShade, C.duskSky4, 0.25),
		w: C.timberShade,
		W: C.creamLight,
		P: C.timber,
		p: C.timberShade,
		A: C.brass,
		S: C.timber,
		s: C.timberShade,
		B: C.wood,
		b: C.brass,
		T: mix(C.stoneMid, C.roof, 0.35),
		t: mix(C.stoneShade, C.roof, 0.35),
		L: C.roofShade,
		l: mix(C.roofShade, C.ink, 0.4),
		F: C.wood,
	};
	const blue = {
		...red,
		C: C.roof,
		c: C.roofShade,
		S: C.brickRed,
		b: C.gold,
	};
	const green = {
		...red,
		C: C.pineShade,
		c: mix(C.pineShade, C.ink, 0.35),
	};
	// The nearest: helmet bowed, a bedroll on his pack, a bandaged arm, limping on one leg.
	const nearest = [
		'....rrrr.....',
		'...rHHHHh....',
		'..rHHHHHhh...',
		'..HHHHHHhh...',
		'.kkkkkkkkkk..',
		'....nnnn.....',
		'..rrCCCCrr...',
		'.rCRRRRRRRc..',
		'.CCRwRRRRRcc.',
		'CCCPPPPPPPcc.',
		'CWCPpPPPPpcc.',
		'CWCPPPPPPPcc.',
		'nCCPPPPPPPccn',
		'.CCPPPPPPPcc.',
		'.CCCCCCCCCcc.',
		'.BBBBbBBBBBB.',
		'.TTTTTTTTTtt.',
		'..TTTTTTTtt..',
		'..LLL..LLl...',
		'..LLL..LLl...',
		'..LLL...Ll...',
		'..LLL...FF...',
		'..FFF........',
		'..FFF........',
	];
	const bearer = [
		'...rrr.....',
		'..rHHHh....',
		'..HHHHhh...',
		'.kkkkkkkk..',
		'...nnn.....',
		'.rrCCCCrr..',
		'rCCAAAACCc.',
		'CCASSSSACc.',
		'CASSSSSSAc.',
		'CASSbbSSAc.',
		'CASSbbSSAc.',
		'nCASSSSACcn',
		'.CCASSACcc.',
		'.CCCAACCcc.',
		'.BBBBBBBBB.',
		'.TTTTTTTtt.',
		'..LL..LLl..',
		'..LL..LLl..',
		'..LL...Ll..',
		'..FF...FF..',
	];
	const third = [
		'...rrr...',
		'..rHHHh..',
		'..HHHHh..',
		'.kkkkkkk.',
		'...nnn...',
		'.rCCCCCr.',
		'rCSSSSSCc',
		'CSSSSSSSc',
		'CSSSAASSc',
		'CSSSAASSc',
		'.CSSSSSc.',
		'.CCCCCCc.',
		'..LL.LL..',
		'..LL..L..',
		'..FF..F..',
	];
	const medium = [
		'..rr...',
		'.rHHh..',
		'.HHHh..',
		'..nn...',
		'rCCCCr.',
		'CSSSSc.',
		'CSAASc.',
		'CSSSSc.',
		'.CCCc..',
		'.L..L..',
		'.F..F..',
	];
	const small = [
		'.rr..',
		'rHHh.',
		'.nn..',
		'rCCCr',
		'CSASc',
		'CSSSc',
		'.CCc.',
		'.L.L.',
	];
	const tiny = ['.r.', 'rHh', 'CCc', 'CSc', 'L.L'];
	const speck = ['r.', 'Cc', 'LL'];
	const mote = ['r', 'C'];

	// Farthest first, so nearer soldiers cover them: [u along, v across, sprite, colours, carries a spear].
	/** @type {[number, number, string[], Record<string, Colour>, boolean][]} */
	const file = [
		[175, -2, mote, red, false],
		[145, 1, mote, blue, false],
		[122, -2, speck, green, false],
		[102, 1, speck, red, false],
		[84, -2, tiny, blue, true],
		[68, 1, tiny, red, true],
		[54, -2, small, green, true],
		[41, 1, small, red, true],
		[29, -2, medium, blue, true],
		[17, 1, third, green, true],
	];
	for (const [u, v, rows, colours, armed] of file) {
		const shoulder = soldier(scene, u, v, rows, colours);
		if (armed) {
			spear(scene, shoulder.x, shoulder.y, rows.length);
		}
	}
	const flag = soldier(scene, 8, -3, bearer, blue);
	drawFlag(scene, flag.x, flag.y);
	const near = soldier(scene, 0, 1, nearest, red);
	spear(scene, near.x, near.y, nearest.length);
}

/**
 * Paints a soldier seen from behind, standing on the deck at u along and v across.
 * @param {Canvas} scene
 * @param {number} u
 * @param {number} v
 * @param {string[]} rows - The sprite, top row first
 * @param {Record<string, Colour>} colours
 * @returns {{ x: number, y: number }} The soldier's right shoulder, where a spear or pole rests.
 */
function soldier(scene, u, v, rows, colours) {
	const X = ORIGIN.X + u * SIN + v * COS;
	const D = ORIGIN.D + u * COS - v * SIN;
	const x = Math.round(CENTRE + (X * FOCAL) / D);
	const feet = Math.round(HORIZON + (DECK * FOCAL) / D);
	const box = paint(
		scene,
		x - Math.floor(rows[0].length / 2),
		feet - rows.length + 1,
		rows,
		colours
	);
	return { x: box.x + box.w - 2, y: box.y + Math.floor(rows.length / 3) };
}

/**
 * A spear sloped back over a soldier's shoulder, its head catching the sun.
 * @param {Canvas} scene
 * @param {number} x - The shoulder's column
 * @param {number} y - The shoulder's row
 * @param {number} height - The soldier's height, which sets the spear's length
 */
function spear(scene, x, y, height) {
	const length = Math.round(height * 1.05);
	const tipX = x - Math.round(length * 0.6);
	const tipY = y - Math.round(length * 0.85);
	line(scene, x, y + Math.round(height / 4), tipX, tipY, C.timber);
	set(scene, tipX, tipY, C.stoneLight);
	if (height > 8) {
		set(scene, tipX - 1, tipY - 1, C.stoneLight);
	}
}

/**
 * The tattered flag on its pole, sloped back over the bearer's shoulder, hanging torn into tongues with a hole shot through it.
 * @param {Canvas} scene
 * @param {number} x - The bearer's shoulder column
 * @param {number} y - The bearer's shoulder row
 */
function drawFlag(scene, x, y) {
	const top = { x: x - 8, y: 5 };
	line(scene, x, y + 3, top.x, top.y, C.timberLight);
	set(scene, top.x, top.y - 1, C.gold);
	const tongues = [9, 11, 8, 10, 12, 7, 10, 8, 11, 9, 6, 9, 5, 7];
	tongues.forEach((tongue, index) => {
		const i = index + 1;
		const sag = Math.round(i * 0.3 + Math.sin(i * 0.8) * 0.8);
		for (let j = 0; j < tongue; j++) {
			const hole = (i === 6 || i === 7) && (j === 4 || j === 5);
			if (hole) {
				continue;
			}
			let colour = Math.sin(i * 0.8) < -0.4 ? C.nightSea2 : C.daySea3;
			if (j === 2 && i < 11) {
				colour = C.gold;
			}
			set(scene, top.x + i, top.y + j + sag, colour);
		}
	});
}

/**
 * How many bands of mist the wisps add at a pixel: two in a wisp's core, one at its edge.
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function wisps(x, y) {
	let most = 0;
	for (const [cx, cy, length, height, curl] of WISPS) {
		const t = (x - cx) / length;
		const lift = t > 0 ? t * t * curl : 0;
		const d = t * t + ((y - cy + lift) / height) ** 2;
		if (d < 0.45) {
			most = Math.max(most, 2);
		} else if (d < 1) {
			most = Math.max(most, 1);
		}
	}
	return most;
}

/**
 * The mist rising off the river: thickest at the far end, where the column vanishes into it, and lying in drifts
 * over the water and around the arches. It is laid over everything in a few bands, so distant soldiers and stone fade,
 * while the drifts pass behind the soldiers.
 * @param {Canvas} scene
 * @param {boolean[]} soldiers - Which pixels belong to the soldiers
 */
function drawMist(scene, soldiers) {
	for (let y = 12; y < 64; y++) {
		for (let x = 0; x < 64; x++) {
			const far = Math.max(
				0,
				1 - Math.hypot((x - 60) * 0.5, (y - 30) * 1.3) / 22
			);
			// Long level drifts with wavy edges, curling upwards here and there.
			const wisp = Math.sin(
				y * 0.8 +
					Math.sin(x * 0.16) * 1.8 +
					Math.sin(x * 0.05 + 1) * 1.2
			);
			const band = Math.max(0, 1 - Math.abs(y - 37) / 15);
			const drift =
				y > HORIZON - 3 && !soldiers[y * 64 + x]
					? Math.max(0, wisp) * band * 0.75
					: 0;
			let level = Math.min(4, Math.floor((far + drift) * 5));
			if (!soldiers[y * 64 + x]) {
				level = Math.min(4, level + wisps(x, y));
			}
			const behind = get(scene, x, y);
			if (level > 0 && behind) {
				set(scene, x, y, mix(behind, MIST, level * 0.17));
			}
		}
	}
}
