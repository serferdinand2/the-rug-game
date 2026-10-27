// Wartime Economy: at night, a gun works' great door blazes with furnace light as cannons roll out into the yard, searchlights on its roof sweeping the sky.
import {
	createCanvas,
	get,
	set,
	rect,
	outline,
	mix,
	seededRandom,
	underlay,
} from '../../painter.js';
import { PALETTE as C } from '../../palette.js';
import { drawSky } from '../../parts/sky.js';

/** @typedef {import('../../painter.js').Canvas} Canvas */
/** @typedef {import('../../painter.js').Colour} Colour */

/** The sky's last row, the yard's first row and the works' centre column. */
const HORIZON = 46;
const YARD = 50;
const CX = 32;

/** The door's arch: its centre row and radius. */
const ARCH_Y = 34;
const ARCH_R = 10;

/**
 * The searchlights on the roof: each lamp's centre, where its beam's centre leaves the sky,
 * and half the beam's width there. All sweep up to the right, so no two beams cross.
 */
const LIGHTS = [
	{ x: 18, y: 18, to: [30, -1], spread: 5 },
	{ x: 32, y: 12, to: [45, -1], spread: 3 },
	{ x: 46, y: 18, to: [61, -1], spread: 4 },
];

/** A beam's light in three steps of distance from its lamp: a near-white core in a softer edge. */
const BEAM_STEPS = [
	{ until: 0.4, core: C.lampGlow, edge: mix(C.lampGlow, C.nightSky4, 0.45) },
	{
		until: 0.75,
		core: mix(C.lampGlow, C.nightSky3, 0.25),
		edge: mix(C.lampGlow, C.nightSky3, 0.6),
	},
	{
		until: 1,
		core: mix(C.lampGlow, C.nightSky2, 0.45),
		edge: mix(C.lampGlow, C.nightSky2, 0.72),
	},
];

/**
 * Draws the Wartime Economy scene.
 * @returns {Canvas} A 64×64 canvas.
 */
export function draw() {
	const scene = createCanvas(64, 64);
	const layer = createCanvas(64, 64);
	const random = seededRandom(97);

	drawSky(layer, {
		time: 'night',
		horizon: HORIZON,
		random,
		stars: 26,
		starRows: 24,
	});
	for (const light of LIGHTS) {
		drawBeam(layer, light.x + 2, light.y - 2, light.to, light.spread);
	}
	drawYard(layer);

	// The works stand behind the guns, so they get their own outline.
	const works = createCanvas(64, 64);
	drawWorks(works);
	for (const light of LIGHTS) {
		drawLampHousing(works, light.x, light.y);
	}
	outline(works, C.ink);
	for (const light of LIGHTS) {
		drawLampFace(works, light.x, light.y);
	}
	drawDoorway(works);
	drawSecondGun(works);

	drawGun(scene);
	drawShot(scene);
	outline(scene, C.ink);
	underlay(scene, works);
	underlay(scene, layer);
	drawGlints(scene);
	return scene;
}

/**
 * A searchlight beam sweeping up into the sky from its lamp's face: a near-white core with a
 * softer, dithered edge, widening and dimming in steps as it goes.
 * @param {Canvas} layer
 * @param {number} x0 - The lamp face's column
 * @param {number} y0 - The lamp face's row
 * @param {number[]} to - Where the beam's centre leaves the sky, as [column, row]
 * @param {number} spread - Half the beam's width where it leaves the sky
 */
function drawBeam(layer, x0, y0, [x1, y1], spread) {
	const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2;
	const length = Math.hypot(x1 - x0, y1 - y0);
	const nx = -(y1 - y0) / length;
	const ny = (x1 - x0) / length;
	/** @type {Map<number, number>} The brightest light each pixel has had so far: 2 core, 1 edge. */
	const lit = new Map();
	for (let i = 0; i <= steps; i++) {
		const t = i / steps;
		const step = BEAM_STEPS.find((s) => t <= s.until) ?? BEAM_STEPS[2];
		const half = 0.5 + spread * t;
		for (let k = -half; k <= half; k += 0.5) {
			const x = Math.round(x0 + (x1 - x0) * t + nx * k);
			const y = Math.round(y0 + (y1 - y0) * t + ny * k);
			const key = y * 64 + x;
			const core = Math.abs(k) <= Math.max(0.5, half * 0.4);
			const rank = core ? 2 : 1;
			if (!get(layer, x, y) || (lit.get(key) ?? 0) >= rank) {
				continue;
			}
			if (!core && Math.abs(k) > half * 0.75 && (x + y) % 2 === 0) {
				continue;
			}
			lit.set(key, rank);
			set(layer, x, y, core ? step.core : step.edge);
		}
	}
}

/**
 * The cobbled yard: dark at night, with a fan of warm light thrown out of the door.
 * @param {Canvas} layer
 */
function drawYard(layer) {
	const cobble = mix(C.stoneShade, C.nightSky3, 0.5);
	const joint = mix(C.night, C.nightSky2, 0.5);
	for (let y = HORIZON + 1; y < 64; y++) {
		const course = Math.floor(y / 2);
		for (let x = 0; x < 64; x++) {
			let colour =
				y % 2 === 0 || (x + (course % 2) * 2) % 4 === 0
					? joint
					: cobble;
			const spread = ARCH_R + (y - YARD) * 1.2;
			if (y >= YARD - 1 && Math.abs(x - CX) <= spread) {
				const warmth =
					0.55 - (y - YARD) * 0.025 - Math.abs(x - CX) / (spread * 3);
				colour = mix(colour, C.amber, Math.max(0.12, warmth));
			}
			set(layer, x, y, colour);
		}
	}
}

/**
 * The gun works: a broad, low-gabled hall of dark brick with two lit side windows and a
 * tall chimney.
 * @param {Canvas} works
 */
function drawWorks(works) {
	const brick = mix(C.brickRedShade, C.nightSky2, 0.45);
	const brickLight = mix(C.brickRed, C.nightSky4, 0.45);
	const mortar = mix(C.brickRedShade, C.night, 0.6);
	const left = 4;
	const right = 59;
	// A tall chimney behind the roof's left end, kept dark so the searchlights are the only
	// lights on the skyline.
	rect(works, 7, 12, 4, 16, brick);
	rect(works, 7, 12, 1, 16, brickLight);
	rect(works, 6, 11, 6, 2, mix(C.stoneShade, C.night, 0.3));
	// The walls and the gable.
	for (let x = left; x <= right; x++) {
		const roof = roofRow(x);
		for (let y = roof; y <= YARD; y++) {
			let colour = brick;
			if (x === left) {
				colour = brickLight;
			} else if (
				(y % 3 === 0 || (x + (Math.floor(y / 3) % 2) * 2) % 4 === 0) &&
				y > roof + 1
			) {
				colour = mortar;
			}
			set(works, x, y, colour);
		}
		// The slate eaves along the gable.
		set(works, x, roof - 1, x < CX ? C.roofLight : C.roof);
		set(works, x, roof - 2, C.roofShade);
	}
	// Two tall side windows.
	for (const wx of [9, 52]) {
		rect(works, wx, 32, 3, 10, C.amber);
		rect(works, wx, 32, 3, 2, C.gold);
		set(works, wx + 1, 36, C.lampFrame);
		set(works, wx + 1, 39, C.lampFrame);
	}
}

/**
 * The roof's eaves row at a column: the gable's slope.
 * @param {number} x
 * @returns {number}
 */
function roofRow(x) {
	return Math.round(18 + Math.abs(x - CX) * 0.45);
}

/**
 * A searchlight's housing: a round iron drum on a short post standing on the roof.
 * @param {Canvas} works
 * @param {number} x - The drum's centre column
 * @param {number} y - The drum's centre row
 */
function drawLampHousing(works, x, y) {
	const iron = mix(C.stoneShade, C.night, 0.3);
	rect(works, x, y + 2, 1, roofRow(x) - 2 - (y + 2), iron);
	for (let dy = -2; dy <= 2; dy++) {
		for (let dx = -2; dx <= 2; dx++) {
			if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
				continue;
			}
			set(works, x + dx, y + dy, dx + dy < -1 ? C.stoneMid : iron);
		}
	}
}

/**
 * A searchlight's face: a blazing lens on the drum's upper right, facing along its beam.
 * Drawn after the outline, so the lens runs into the beam with no ink between them.
 * @param {Canvas} works
 * @param {number} x - The drum's centre column
 * @param {number} y - The drum's centre row
 */
function drawLampFace(works, x, y) {
	for (const [dx, dy] of [
		[0, -2],
		[1, -2],
		[1, -1],
		[2, -1],
		[2, 0],
		[1, -3],
		[2, -2],
		[3, -1],
	]) {
		set(
			works,
			x + dx,
			y + dy,
			dx === 2 && dy === -2 ? C.white : C.lampGlow
		);
	}
	set(works, x + 1, y - 1, C.white);
}

/**
 * The great arched doorway, blazing with furnace light, a gantry and its chain inside.
 * Drawn after the works' outline, so the glow fills the opening to its edge.
 * @param {Canvas} works
 */
function drawDoorway(works) {
	for (let y = ARCH_Y - ARCH_R; y <= YARD; y++) {
		for (let x = CX - ARCH_R; x <= CX + ARCH_R; x++) {
			const above =
				y < ARCH_Y && (x - CX) ** 2 + (y - ARCH_Y) ** 2 > ARCH_R ** 2;
			if (above) {
				continue;
			}
			const heat = Math.abs(x - CX) / ARCH_R + (YARD - y) / 40;
			const colour =
				heat < 0.45 ? C.lampGlow : heat < 0.8 ? C.gold : C.amber;
			set(works, x, y, colour);
		}
	}
	// The arch's stone voussoirs.
	for (let y = ARCH_Y - ARCH_R - 1; y <= YARD; y++) {
		for (let x = CX - ARCH_R - 1; x <= CX + ARCH_R + 1; x++) {
			const d = Math.sqrt((x - CX) ** 2 + Math.min(0, y - ARCH_Y) ** 2);
			if (d > ARCH_R && d <= ARCH_R + 1.2) {
				set(works, x, y, (x + y) % 3 === 0 ? C.stoneShade : C.stoneMid);
			}
		}
	}
	// The gantry beam and its hanging chain, dark against the glow.
	const dark = mix(C.timberShade, C.night, 0.4);
	rect(works, CX - ARCH_R, 29, ARCH_R * 2 + 1, 2, dark);
	for (let y = 31; y <= 38; y++) {
		set(works, CX + 4, y, y % 2 ? dark : C.lampFrame);
	}
	rect(works, CX + 3, 39, 3, 1, dark);
}

/**
 * The next gun waiting in the doorway, a dark shape against the furnace light.
 * @param {Canvas} works
 */
function drawSecondGun(works) {
	const dark = mix(C.timberShade, C.night, 0.5);
	// The barrel, pointing out to the left.
	for (let x = 24; x <= 38; x++) {
		const y = 42 - Math.floor((38 - x) / 6);
		rect(works, x, y, 1, x > 33 ? 3 : 2, dark);
	}
	// Its wheel.
	for (let y = 42; y <= 50; y++) {
		for (let x = 30; x <= 40; x++) {
			const d = (x - 35) ** 2 + (y - 46) ** 2;
			if (d <= 17 && (d >= 9 || x === 35 || y === 46)) {
				set(works, x, y, dark);
			}
		}
	}
}

/**
 * The great gun rolling out: a long iron barrel on a timber carriage with big spoked wheels,
 * its trail resting on the cobbles.
 * @param {Canvas} scene
 */
function drawGun(scene) {
	// The trail, sloping from the axle down to the ground behind.
	for (let x = 26; x <= 52; x++) {
		const y = Math.round(49 + (x - 26) * 0.3);
		rect(scene, x, y, 1, 3, C.timber);
		set(scene, x, y, C.timberLight);
		set(scene, x, y + 2, C.timberShade);
	}
	rect(scene, 50, 56, 4, 3, C.timberShade);
	// The barrel: tapered, with a swelled muzzle and a knob on the breech.
	for (let x = 3; x <= 38; x++) {
		const slope = (38 - x) * 0.22;
		const top = Math.round(44 - slope);
		const thick = x > 30 ? 6 : x < 7 ? 5 : 4;
		for (let j = 0; j < thick; j++) {
			let colour = C.stoneMid;
			if (j === 0) {
				colour = C.stoneLight;
			} else if (j === 1) {
				colour = C.stone;
			} else if (j === thick - 1) {
				colour = C.stoneShade;
			}
			set(scene, x, top + j, colour);
		}
	}
	// Reinforcing bands, catching the door's glow.
	for (const x of [8, 22, 31]) {
		const top = Math.round(44 - (38 - x) * 0.22);
		const thick = x > 30 ? 6 : 4;
		rect(scene, x, top, 1, thick, C.brass);
		set(scene, x, top, C.gold);
	}
	rect(scene, 39, 45, 2, 3, C.stoneShade);
	set(scene, 39, 45, C.stone);
	// The wheel: a timber rim with an iron tyre and eight spokes.
	const wx = 27;
	const wy = 52;
	const r = 8;
	for (let y = wy - r; y <= wy + r; y++) {
		for (let x = wx - r; x <= wx + r; x++) {
			const dx = x - wx;
			const dy = y - wy;
			const d = Math.sqrt(dx * dx + dy * dy);
			if (d > r + 0.3) {
				continue;
			}
			if (d > r - 1) {
				set(scene, x, y, dx + dy < 0 ? C.stoneLight : C.stone);
			} else if (d > r - 2.2) {
				set(scene, x, y, dx < 0 ? C.timberLight : C.timber);
			} else if (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy)) {
				set(scene, x, y, d < 2 ? C.brass : C.timberLight);
			}
		}
	}
}

/**
 * A pyramid of round shot by the door.
 * @param {Canvas} scene
 */
function drawShot(scene) {
	for (const [row, count] of [
		[0, 4],
		[1, 3],
		[2, 2],
		[3, 1],
	]) {
		for (let i = 0; i < count; i++) {
			const bx = 47 + row * 2 + i * 4;
			const by = 60 - row * 3;
			rect(scene, bx, by, 3, 3, mix(C.night, C.stoneShade, 0.5));
			set(scene, bx, by, C.stone);
			set(scene, bx + 1, by, C.stoneShade);
		}
	}
}

/**
 * Glints of the furnace light along the barrel's top and the wheel's rim.
 * @param {Canvas} scene
 */
function drawGlints(scene) {
	for (const [x, y] of [
		[34, 42],
		[35, 42],
		[29, 43],
		[13, 40],
	]) {
		if (get(scene, x, y) === C.stoneLight) {
			set(scene, x, y, C.lampGlow);
		}
	}
}
